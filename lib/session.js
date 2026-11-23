// Web Crypto works in both Next middleware and Node.
export const ADMIN_COOKIE = 'lotus_admin_session';
export const SESSION_MAX_AGE = 60 * 60 * 12;

export function adminCredentials() {
  const local = process.env.NODE_ENV !== 'production';
  return {
    password: process.env.ADMIN_PASSWORD || (local ? 'LotusInn@2026!' : ''),
    secret: process.env.ADMIN_SESSION_SECRET || (local ? 'lotus-local-development-secret' : ''),
  };
}

async function signingKey(role = 'admin') {
  const { password, secret } = adminCredentials();
  if (!password || !secret) return null;
  if (!['admin', 'staff'].includes(role)) return null;
  const rolePassword = role === 'staff' ? process.env.STAFF_PASSWORD : password;
  if (!rolePassword || (role === 'staff' && rolePassword === password)) return null;
  return crypto.subtle.importKey('raw', new TextEncoder().encode(`${rolePassword}:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function createSessionToken(now = Date.now(), role = 'admin') {
  const key = await signingKey(role);
  if (!key) throw new Error('Login credentials are not configured.');
  const payload = `${Math.floor(now / 1000) + SESSION_MAX_AGE}.${crypto.randomUUID()}.${role}`;
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('')}`;
}

export async function getSession(token, now = Date.now()) {
  if (typeof token !== 'string') return null;
  // Existing administrator sessions remain valid until their normal expiry.
  const match = /^(\d+)\.([a-f0-9-]{36})\.(?:(admin|staff)\.)?([a-f0-9]{64})$/.exec(token);
  if (!match || Number(match[1]) <= Math.floor(now / 1000)) return null;
  const role = match[3] || 'admin';
  const key = await signingKey(role);
  if (!key) return null;
  const payload = `${match[1]}.${match[2]}${match[3] ? `.${role}` : ''}`;
  const signature = Uint8Array.from(match[4].match(/.{2}/g), hex => parseInt(hex, 16));
  const valid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(payload));
  return valid ? { role, expiresAt: Number(match[1]) * 1000 } : null;
}

export async function isValidSession(token, now = Date.now()) {
  return Boolean(await getSession(token, now));
}
