const COOKIE_NAME = 'alex_plan_session';
const encoder = new TextEncoder();

async function digest(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function secretMaterial() {
  const token = process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!token || !baseId) throw new Error('Private access is not configured');
  return `${token}:${baseId}:alex-health-plan`;
}

export async function expectedAccessCode() {
  const configured = process.env.ALEX_ACCESS_CODE?.trim();
  if (configured) return configured;
  const hex = await digest(`code:${secretMaterial()}`);
  const number = Number.parseInt(hex.slice(0, 12), 16) % 1_000_000;
  return String(number).padStart(6, '0');
}

async function expectedSession() {
  return digest(`session:${secretMaterial()}`);
}

function cookieValue(request: Request) {
  const cookies = request.headers.get('cookie') ?? '';
  const match = cookies.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.slice(COOKIE_NAME.length + 1)) : '';
}

function sameValue(first: string, second: string) {
  if (first.length !== second.length) return false;
  let difference = 0;
  for (let index = 0; index < first.length; index += 1) difference |= first.charCodeAt(index) ^ second.charCodeAt(index);
  return difference === 0;
}

export async function isAuthorized(request: Request) {
  if (!process.env.AIRTABLE_PAT || !process.env.AIRTABLE_BASE_ID) return true;
  try {
    return sameValue(cookieValue(request), await expectedSession());
  } catch {
    return false;
  }
}

export async function sessionCookie() {
  const value = await expectedSession();
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000${secure}`;
}
