import { clearSessionCookie, expectedAccessCode, isAuthorized, privateAccessConfigured, sessionCookie } from '@/lib/access';

const attempts = new Map<string, { count: number; resetAt: number }>();

function blocked(ip: string) {
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 10;
}

export async function GET(request: Request) {
  return Response.json({ authorized: await isAuthorized(request), privateAccess: privateAccessConfigured() });
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  if (blocked(ip)) return Response.json({ error: 'Please wait before trying again.' }, { status: 429 });

  try {
    const body = await request.json() as { code?: unknown };
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (!code || code !== await expectedAccessCode()) {
      return Response.json({ error: 'That code is not correct.' }, { status: 401 });
    }
    attempts.delete(ip);
    return Response.json({ authorized: true }, { headers: { 'Set-Cookie': await sessionCookie() } });
  } catch {
    return Response.json({ error: 'Private access is not configured.' }, { status: 503 });
  }
}

export async function DELETE() {
  return Response.json({ authorized: false }, { headers: { 'Set-Cookie': clearSessionCookie() } });
}
