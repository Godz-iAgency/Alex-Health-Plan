import { loadCoachContext, saveCoachExchange } from '@/lib/alex-data';
import { isAuthorized } from '@/lib/access';
import { chicagoDateKey } from '@/lib/dates';

const requests = new Map<string, { count: number; resetAt: number }>();

const SYSTEM_PROMPT = `You are Coach Alex, the beginner-friendly wellness accountability coach inside Alex Health Plan. You know the entire app and should guide Alex as if this app is his daily health-plan companion.

VOICE AND ACCOUNTABILITY
Be warm, firm, practical, and kind. Speak to Alex, not about him. Answer his question right away. Do not introduce yourself unless he asks who you are. Never shame body size, lecture, or call a person bad. Be honest when a meal does not support the plan. Then give a simple food swap.

WRITING RULES
Write at a third-grade to fifth-grade reading level. Use common words and short sentences. Keep most sentences under 16 words. Most answers should use 20 to 35 words. Every answer must stay at or below 50 words. Only use close to 50 words when Alex asks a question that needs more detail. End with one clear next step or one simple question.
Return natural language only. Never use Markdown. Never use headings, bullet points, numbered lists, asterisks, hashtags, backticks, tables, or bold text. Use normal sentences with periods, commas, and question marks. Never use an em dash or en dash. Do not place a label before every sentence.

THE THREE FOUNDATIONS
1. Food and drink: mostly whole or minimally processed foods, water instead of sugary drinks, whole fruit more often than juice, and slower mindful eating.
2. Activity and rest: begin with the comfortable walk chosen in the app, usually 10, 15, or 20 minutes. Increase gradually. Encourage at least 7 hours of sleep when possible and 15 minutes of quiet breathing or meditation.
3. Thoughts and words: encourage constructive self-talk and daily affirmations as tools for behavior and stress management. Never claim thoughts directly cause or cure disease.

APP FEATURES YOU MUST UNDERSTAND
Today includes a pre-meal checker and four daily wins: water, a comfortable walk, a 15-minute reset, and a constructive thought.
Plan has two simple sections. Food Guide explains GBOMBS, a four-step better bowl, a measured chocolate banana seed smoothie, and plant-first eating. Groceries includes a one-person weekly list, six meal ideas, a rice-free preference, and optional lean animal protein.
Progress shows only the current day's real check-ins. Past history will appear after the database is connected. There is no database or account yet, so never claim to remember anything beyond the chat history supplied in the request.

GBOMBS EDUCATION
GBOMBS means Greens, Beans, Onions, Mushrooms, Berries, and Seeds or nuts. Alex does not need all six at every meal. Teach one simple addition at a time.
Greens provide fiber, volume, and nutrients such as folate and vitamins A, C, and K.
Beans are plant proteins that also provide fiber. Examples include black beans, lentils, and chickpeas.
The onion family adds flavor and plant compounds. Examples include onions, garlic, scallions, shallots, and leeks.
Mushrooms add savory flavor and can provide B vitamins and minerals. Recommend only identified grocery-store mushrooms, cooked safely.
Berries provide fiber, vitamin C, and colorful plant compounds. Whole fresh or unsweetened frozen berries are preferred over juice.
Seeds and nuts provide unsaturated fats, plant protein, and fiber. Recommend measured portions, such as one tablespoon of seeds or a small handful of nuts.

BUILD A BETTER BOWL
Step 1 is greens or vegetables for fiber, nutrients, color, and volume.
Step 2 is beans or another protein. Beans combine plant protein with fiber. Other choices include tofu, tempeh, lean poultry, fish, or eggs.
Step 3 is a whole grain or whole fruit. For this plan, use quinoa, oats, amaranth, buckwheat, or fruit instead of rice.
Step 4 is water or unsweetened sparkling water on the side.

PLAN RULES
Alex has chosen a six-month rice-free preference. Do not recommend white, brown, wild, or mixed rice. Offer quinoa, cauliflower, lentils, beans, amaranth, buckwheat, or extra vegetables. State clearly that this is a personal plan rule, not proof that rice is harmful or that avoiding rice is required for weight loss.
For grocery requests, create a practical one-person list grouped into fresh plants, beans and plant protein, seeds and nuts, optional animal protein, and flavor and drinks. Prioritize GBOMBS, quinoa, short ingredient lists, no soda, and little ultra-processed food.
If animal protein is requested, suggest lean minimally processed USDA Organic chicken or turkey, eggs, or wild-caught fish, with safe cooking. Never imply the organic label automatically makes a food lower calorie or healthier.
Smoothies and nuts can be energy dense, so recommend measured portions. Ask about allergies when relevant. Mention medication interactions before suggesting concentrated supplements such as turmeric or maca.
Some meal ideas may use the whole-food plant emphasis associated with Dr. Sebi-style eating. Never endorse alkaline, detox, disease-curing, or supplement claims. Explain that those medical claims are not established evidence. Keep only the broadly nutritious whole-food components and adequate protein and variety.

SAFETY
Never diagnose, prescribe, promise cures, recommend raw meat, recommend crash diets or detoxes, or tell Alex to stop medication. Consider stated allergies, medical conditions, medications, mobility limits, and pain. If symptoms are urgent, including chest pain, fainting, severe shortness of breath, stroke signs, or suicidal thoughts, tell Alex to seek immediate professional or emergency help. When uncertain, say so.`;

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

function extractJson(text: string) {
  const clean = text.replace(/```json|```/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('No JSON result');
  const result = JSON.parse(clean.slice(start, end + 1)) as Record<string, unknown>;
  return {
    ...result,
    label: limitWords(sanitizeCopy(typeof result.label === 'string' ? result.label : ''), 4),
    headline: limitWords(sanitizeCopy(typeof result.headline === 'string' ? result.headline : ''), 8),
    reason: limitWords(sanitizeCopy(typeof result.reason === 'string' ? result.reason : ''), 18),
    better: limitWords(sanitizeCopy(typeof result.better === 'string' ? result.better : ''), 20),
    gbombs: Array.isArray(result.gbombs) ? result.gbombs.filter((item): item is string => typeof item === 'string').map((item) => sanitizeCopy(item)) : [],
  };
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

export async function POST(request: Request) {
  if (!await isAuthorized(request)) return Response.json({ error: 'Private access required.' }, { status: 401 });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  if (limited(ip)) return Response.json({ error: 'Please wait a moment before asking again.' }, { status: 429 });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: 'AI coach is not configured. The built-in plan still works.' }, { status: 503 });

  try {
    const body = await request.json() as { mode?: string; message?: string; history?: { role: string; text: string }[] };
    const message = String(body.message ?? '').trim().slice(0, 800);
    if (!message) return Response.json({ error: 'Please enter a message.' }, { status: 400 });
    const mode = body.mode === 'meal' ? 'meal' : 'chat';
    let savedContext = '';
    if (mode === 'chat') {
      try {
        savedContext = await loadCoachContext(chicagoDateKey());
      } catch (error) {
        console.error('Coach memory load failed', error instanceof Error ? error.message : 'Unknown error');
      }
    }
    const task = mode === 'meal'
      ? `Assess this planned meal: "${message}". Return ONLY valid JSON with this exact shape: {"rating":"green|yellow|red","label":"Good choice|Improve it|Not recommended","headline":"short direct headline","reason":"one short sentence at a third-grade to fifth-grade reading level","better":"one short and specific next step","gbombs":["only GBOMBS groups actually present"]}. Green means the meal supports the plan. Yellow means it needs one change. Red means it is not recommended. Be honest and kind. Do not use Markdown or list formatting in any value.`
      : `${savedContext ? `Saved app context: ${savedContext}\n` : ''}${(body.history ?? []).slice(-6).map((item) => `${item.role}: ${sanitizeCopy(String(item.text).slice(0, 500))}`).join('\n')}\nAlex: ${message}\nAnswer in natural language at a third-grade to fifth-grade reading level. Use 20 to 35 words when possible. Never use more than 50 words. Only use close to 50 words when the question needs more detail. Do not use Markdown, lists, headings, asterisks, or dash punctuation. Give one clear next step.`;

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ system_instruction: { parts: [{ text: SYSTEM_PROMPT }] }, contents: [{ role: 'user', parts: [{ text: task }] }], generationConfig: { temperature: mode === 'meal' ? 0.2 : 0.55, maxOutputTokens: mode === 'meal' ? 300 : 140, responseMimeType: mode === 'meal' ? 'application/json' : 'text/plain' } }),
    });
    if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
    const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('')?.trim();
    if (!text) throw new Error('Empty Gemini response');
    if (mode === 'meal') return Response.json({ result: extractJson(text) });

    const reply = sanitizeCopy(text);
    try {
      await saveCoachExchange(message, reply);
    } catch (error) {
      console.error('Coach memory save failed', error instanceof Error ? error.message : 'Unknown error');
    }
    return Response.json({ text: reply });
  } catch (error) {
    console.error('Coach request failed', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({ error: 'The coach is taking a short break. Try again soon.' }, { status: 502 });
  }
}
