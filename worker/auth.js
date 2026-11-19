// Customer / affiliate credentials and sessions.
//
// Passwords: PBKDF2-SHA256, 100k iterations (the Workers runtime cap), random
// 16-byte salt per user, stored as "pbkdf2$<iter>$<salt>$<hash>". The old scheme
// — one SHA-256 over password:email:ADMIN_PASSWORD — is still *verified* so
// nobody is locked out, and is rewritten to PBKDF2 the first time its owner
// signs in. Old hashes also explain why the admin password must not be rotated
// casually: until a customer signs in once, their hash depends on it.
//
// Sessions: the browser used to keep base64(email:password) and send it on
// every request, which is the password itself. Now login returns a signed,
// expiring token instead. It carries a fingerprint of the stored hash, so a
// password change (or the PBKDF2 upgrade) invalidates outstanding tokens.
import { safeEqual, signSession, readSession } from './security.js';

const PBKDF2_ITER = 100000;
const SESSION_KIND = 'cs1';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const enc = new TextEncoder();
const b64 = (u8) => btoa(String.fromCharCode(...u8));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${PBKDF2_ITER}$${b64(salt)}$${b64(await pbkdf2(password, salt, PBKDF2_ITER))}`;
}

// The pre-PBKDF2 scheme. Also used for short-lived 6-digit email codes, where a
// slow hash buys nothing (attempts are capped). Requires the server secret —
// there is no fallback value, so a missing secret fails closed.
export async function pepperedHash(value, email, env) {
  if (!env.ADMIN_PASSWORD) throw new Error('Server secret is not configured.');
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(`${value}:${String(email).toLowerCase()}:${env.ADMIN_PASSWORD}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// { ok, upgrade } — upgrade is true when the stored hash is the legacy scheme
// and should be replaced now that we hold the correct password.
export async function checkPassword(password, email, stored, env) {
  if (!password || !stored) return { ok: false };
  try {
    if (stored.startsWith('pbkdf2$')) {
      const [, iter, salt, hash] = stored.split('$');
      const got = b64(await pbkdf2(password, unb64(salt), Number(iter)));
      return { ok: await safeEqual(got, hash) };
    }
    return { ok: await safeEqual(await pepperedHash(password, email, env), stored), upgrade: true };
  } catch {
    return { ok: false };
  }
}

// Sign-in credentials arrive once, at login, as base64(email:password).
export function decodeCredentials(token) {
  if (!token || token.startsWith(`${SESSION_KIND}.`)) return null;
  let decoded;
  try { decoded = atob(token); } catch { return null; }
  const i = decoded.indexOf(':');
  if (i < 1) return null;
  return { email: decoded.slice(0, i).trim().toLowerCase(), password: decoded.slice(i + 1) };
}

const fingerprint = (hash) => String(hash || '').slice(-16);

export function issueUserSession(env, email, storedHash) {
  return signSession(env, SESSION_KIND, { e: String(email).toLowerCase(), h: fingerprint(storedHash) }, SESSION_TTL_MS);
}

// { email, h } for a valid unexpired token, else null.
export async function readUserSession(env, token) {
  const p = await readSession(env, SESSION_KIND, token);
  return p && p.e ? { email: p.e, h: p.h } : null;
}

export const sessionMatches = (session, storedHash) => !!session && !!storedHash && session.h === fingerprint(storedHash);
