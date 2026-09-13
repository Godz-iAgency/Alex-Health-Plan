import { loadCoachContext, saveAppEvent, saveCoachExchange, saveSafetyEvent } from '@/lib/alex-data';
import { isAuthorized } from '@/lib/access';
import { COACH_SYSTEM_PROMPT } from '@/lib/coach-prompt';
import { chicagoDateKey } from '@/lib/dates';

const requests = new Map<string, { count: number; resetAt: number }>();

function limited(ip: string) {
  const now = Date.now();
  const current = requests.get(ip);
  if (!current || current.resetAt < now) {
    requests.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 20;
}

function limitWords(text: string, maximum = 50) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maximum) return text.trim();
  const shortened = words.slice(0, maximum).join(' ').replace(/[,;:]$/, '');
  return /[.!?]$/.test(shortened) ? shortened : `${shortened}.`;
}

function sanitizeCopy(text: string, maximum = 50) {
  const clean = text
    .replace(/```(?:\w+)?/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-+*]\s+/gm, '')
    .replace(/(?:^|\s)\d+[.)]\s+/g, ' ')
    .replace(/\*\*|__/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s*[\u2013\u2014]\s*/g, '. ')
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/([.!?])(?=[A-Za-z])/g, '$1 ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return limitWords(clean, maximum);
}

function parseObject(text: string) {
  const clean = text.replace(/```json|```/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('No JSON result');
  return JSON.parse(clean.slice(start, end + 1)) as Record<string, unknown>;
}

function tryObject(text: string) {
  try {
    return parseObject(text);
  } catch {
    return null;
  }
}

function mealResult(text: string) {
  const result = tryObject(text) ?? {
    rating: 'yellow',
    label: 'Improve it',
    headline: 'Make this meal stronger',
    reason: sanitizeCopy(text, 18) || 'This meal may need more plants, fiber, or protein.',
    better: 'Add a colorful plant food and choose water.',
    gbombs: [],
  };
  const rating = ['green', 'yellow', 'red'].includes(String(result.rating)) ? String(result.rating) : 'yellow';
  return {
    rating,
    label: limitWords(sanitizeCopy(typeof result.label === 'string' ? result.label : ''), 4),
    headline: limitWords(sanitizeCopy(typeof result.headline === 'string' ? result.headline : ''), 8),
    reason: limitWords(sanitizeCopy(typeof result.reason === 'string' ? result.reason : ''), 18),
    better: limitWords(sanitizeCopy(typeof result.better === 'string' ? result.better : ''), 20),
    gbombs: Array.isArray(result.gbombs) ? result.gbombs.filter((item): item is string => typeof item === 'string').map((item) => sanitizeCopy(item, 4)) : [],
  };
}

async function logEvent(event: string, value: number, details = '') {
  try {
    await saveAppEvent('AI', event, value, details);
  } catch {
    // Monitoring must never block coaching.
  }
}

function urgentReply(message: string) {
  const urgent = /(chest pain|cannot breathe|can't breathe|fainted|fainting|stroke|suicid|blood in (my |the )?stool|severe allergic)/i.test(message);
  if (!urgent) return '';
  return 'Alex, this may be urgent. Call 911 or your local emergency service now. Do not wait for the app. If someone is nearby, ask them to stay with you.';
}

export async function POST(request: Request) {
  if (!await isAuthorized(request)) return Response.json({ error: 'Private access required.' }, { status: 401 });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  if (limited(ip)) return Response.json({ error: 'Please wait a moment before asking again.' }, { status: 429 });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: 'The coach is not connected right now. Your saved plan still works.' }, { status: 503 });

  const startedAt = Date.now();
  try {
    const body = await request.json() as { mode?: string; message?: string; history?: { role: string; text: string }[]; context?: string };
    const message = String(body.message ?? '').trim().slice(0, 800);
    if (!message) return Response.json({ error: 'Please enter a message.' }, { status: 400 });
    const mode = body.mode === 'meal' ? 'meal' : 'chat';

    const urgent = urgentReply(message);
    if (urgent) {
      await Promise.allSettled([
        saveSafetyEvent('urgent', 'urgent symptoms', message, urgent),
        saveCoachExchange(message, urgent),
        logEvent('safety_escalation', Date.now() - startedAt, 'urgent'),
      ]);
      return Response.json({ text: urgent, safetyLevel: 'urgent' });
    }

    let savedContext = '';
    try {
      savedContext = await loadCoachContext(chicagoDateKey());
    } catch {
      // The coach can still answer when saved context is unavailable.
    }

    const screenContext = sanitizeCopy(String(body.context ?? ''), 80);
    const conversation = (body.history ?? []).slice(-6).map((item) => `${item.role}: ${sanitizeCopy(String(item.text).slice(0, 500))}`).join('\n');
    const task = mode === 'meal'
      ? `Saved context: ${savedContext || 'No saved context is available.'}\nAssess this planned meal: "${message}". Return only valid JSON with this shape: {"rating":"green|yellow|red","label":"Supports the plan|Improve it|Choose another option","headline":"short direct headline","reason":"one short sentence","better":"one short and specific next step","gbombs":["only groups truly present"]}. Consider allergies, protein, plants, fiber, drink, portion, and saved preferences. Use simple words. Do not use Markdown or dash punctuation in any value.`
      : `Saved context: ${savedContext || 'No saved context is available.'}\nCurrent app context: ${screenContext || 'General coaching.'}\nRecent conversation:\n${conversation}\nAlex: ${message}\nReturn only valid JSON with this shape: {"reply":"natural answer under 50 words","safetyLevel":"none|caution","topic":"food|movement|rest|mindset|progress|general"}. Give one clear next step. Use third-grade to fifth-grade language. Do not use Markdown or dash punctuation.`;

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const responseSchema = mode === 'meal'
      ? {
          type: 'object',
          properties: {
            rating: { type: 'string', enum: ['green', 'yellow', 'red'] },
            label: { type: 'string' },
            headline: { type: 'string' },
            reason: { type: 'string' },
            better: { type: 'string' },
            gbombs: { type: 'array', items: { type: 'string' } },
          },
          required: ['rating', 'label', 'headline', 'reason', 'better', 'gbombs'],
        }
      : {
          type: 'object',
          properties: {
            reply: { type: 'string' },
            safetyLevel: { type: 'string', enum: ['none', 'caution'] },
            topic: { type: 'string', enum: ['food', 'movement', 'rest', 'mindset', 'progress', 'general'] },
          },
          required: ['reply', 'safetyLevel', 'topic'],
        };
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: COACH_SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: task }] }],
        generationConfig: {
          temperature: mode === 'meal' ? 0.15 : 0.35,
          maxOutputTokens: mode === 'meal' ? 420 : 320,
          responseMimeType: 'application/json',
          responseSchema,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });
    if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
    const data = await response.json() as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
    const output = data.candidates?.[0]?.content?.parts?.filter((part) => !part.thought).map((part) => part.text ?? '').join('')?.trim();
    if (!output) throw new Error('Empty Gemini response');

    if (mode === 'meal') {
      const result = mealResult(output);
      await logEvent('meal_response', Date.now() - startedAt, result.rating);
      return Response.json({ result });
    }

    const parsed = tryObject(output);
    const reply = sanitizeCopy(parsed && typeof parsed.reply === 'string' ? parsed.reply : output || 'Make your next choice simple. What would you like help with?');
    const safetyLevel = parsed?.safetyLevel === 'caution' ? 'caution' : 'none';
    const safetyTopic = typeof parsed?.topic === 'string' ? parsed.topic : 'general';
    await Promise.allSettled([
      saveCoachExchange(message, reply),
      logEvent('coach_response', Date.now() - startedAt, safetyLevel),
      ...(safetyLevel === 'caution' ? [saveSafetyEvent('caution', safetyTopic, message, reply)] : []),
    ]);
    return Response.json({ text: reply, safetyLevel });
  } catch (error) {
    console.error('Coach request failed', error instanceof Error ? error.message : 'Unknown error');
    await logEvent('coach_error', Date.now() - startedAt);
    return Response.json({ error: 'The coach is taking a short break. Try again soon.' }, { status: 502 });
  }
}
