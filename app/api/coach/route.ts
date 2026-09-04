const requests = new Map<string, { count: number; resetAt: number }>();

const SYSTEM_PROMPT = `You are Coach Alex, a beginner-friendly wellness accountability coach for one adult named Alex.
Be warm, concise, firm, and practical. Use plain language and short paragraphs. Never shame body size or call a person bad.
Core plan: mostly whole or minimally processed foods; water instead of sugary drinks; explain GBOMBS as Greens, Beans, Onions, Mushrooms, Berries, and Seeds/nuts; walking that begins comfortably and increases gradually; 7+ hours of sleep; 15 minutes of breathing or meditation; constructive self-talk.
Never diagnose, prescribe, promise cures, recommend raw meat, crash diets, detoxes, or stopping medication. Do not claim thoughts directly cause or cure disease. If symptoms are urgent (chest pain, fainting, severe shortness of breath, stroke signs, suicidal thoughts), tell Alex to seek immediate professional or emergency help.
Favor whole fruit over frequent juice. Note that smoothies and nuts can be calorie-dense and should be measured. Consider stated allergies, conditions, medications, and mobility limits. When uncertain, say so.`;

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
  return JSON.parse(clean.slice(start, end + 1));
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  if (limited(ip)) return Response.json({ error: 'Please wait a moment before asking again.' }, { status: 429 });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: 'AI coach is not configured. The built-in plan still works.' }, { status: 503 });

  try {
    const body = await request.json() as { mode?: string; message?: string; history?: { role: string; text: string }[] };
    const message = String(body.message ?? '').trim().slice(0, 800);
    if (!message) return Response.json({ error: 'Please enter a message.' }, { status: 400 });
    const mode = body.mode === 'meal' ? 'meal' : 'chat';
    const task = mode === 'meal'
      ? `Assess this planned meal: "${message}". Return ONLY valid JSON with this exact shape: {"rating":"green|yellow|red","label":"Good choice|Improve it|Not recommended","headline":"short direct headline","reason":"one plain-language sentence","better":"one specific practical recommendation","gbombs":["only GBOMBS groups actually present"]}. Green means clearly supports the plan; yellow needs a practical improvement; red is not recommended. Be honest, not harsh.`
      : `${(body.history ?? []).slice(-6).map((item) => `${item.role}: ${String(item.text).slice(0, 500)}`).join('\n')}\nAlex: ${message}\nRespond in no more than 120 words. Give one clear next action.`;

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ system_instruction: { parts: [{ text: SYSTEM_PROMPT }] }, contents: [{ role: 'user', parts: [{ text: task }] }], generationConfig: { temperature: mode === 'meal' ? 0.2 : 0.55, maxOutputTokens: 500, responseMimeType: mode === 'meal' ? 'application/json' : 'text/plain' } }),
    });
    if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
    const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('')?.trim();
    if (!text) throw new Error('Empty Gemini response');
    return mode === 'meal' ? Response.json({ result: extractJson(text) }) : Response.json({ text });
  } catch (error) {
    console.error('Coach request failed', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({ error: 'The coach is taking a short break. Try again soon.' }, { status: 502 });
  }
}
