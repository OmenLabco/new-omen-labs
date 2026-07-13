// Shared security helpers: constant-time comparison, response hardening
// headers, and a D1-backed rate limiter for sensitive endpoints.

// Constant-time equality. Hashes both inputs first so neither the length nor
// the contents leak through timing. Use for any secret/credential comparison.
export async function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

// Balanced Content-Security-Policy: scripts/connections only from our own
// origin, Google Fonts allowed, inline styles allowed (Tailwind/framer-motion
// need them), site cannot be framed (clickjacking), no plugins, forms stay local.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-DNS-Prefetch-Control': 'off',
};

// Clone a response and layer on the security headers.
export function withSecurity(resp) {
  const headers = new Headers(resp.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
  headers.delete('X-Powered-By');
  headers.delete('Server');
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers });
}

// ---- Admin session tokens ----
// Stateless, signed, expiring tokens so the browser never stores the raw admin
// password. Signed with HMAC-SHA256 keyed by ADMIN_PASSWORD (server-only secret).
async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret || 'omen'),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function issueAdminSession(env, ttlMs, role = 'admin') {
  const payload = JSON.stringify({ exp: Date.now() + ttlMs, role });
  const b = btoa(payload);
  const sig = await hmacHex(env.ADMIN_PASSWORD, b);
  return `${b}.${sig}`;
}

// Returns the role string ('admin' | 'staff') if the token is valid & unexpired,
// otherwise null.
export async function verifyAdminSession(env, token) {
  if (!env.ADMIN_PASSWORD || typeof token !== 'string' || !token.includes('.')) return null;
  const [b, sig] = token.split('.');
  const expected = await hmacHex(env.ADMIN_PASSWORD, b);
  if (!(await safeEqual(sig, expected))) return null;
  let payload;
  try { payload = JSON.parse(atob(b)); } catch { return null; }
  if (!payload || typeof payload.exp !== 'number' || payload.exp <= Date.now()) return null;
  return payload.role || 'admin';
}

// Secret for the Zelle SMS-forward webhook. Derived from ADMIN_PASSWORD so it's
// a distinct value (safe to paste into the phone Shortcut) without a new env var.
export async function zelleSecret(env) {
  return hmacHex(env.ADMIN_PASSWORD, 'zelle-webhook-v1');
}

export function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
}

// D1-backed fixed-window rate limiter. Returns { allowed, retryAfter }.
// Fails OPEN (allows) if the DB is unavailable so a DB hiccup can't lock
// everyone out — the auth checks themselves still protect the endpoints.
let rateSchemaReady = false;
export async function rateLimit(env, key, max, windowMs) {
  if (!env.DB) return { allowed: true, retryAfter: 0 };
  const now = Date.now();
  try {
    // Create the table once per isolate, not on every request (saves a D1 op per call).
    if (!rateSchemaReady) {
      await env.DB.prepare(
        'CREATE TABLE IF NOT EXISTS rate_limits (k TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL)'
      ).run();
      rateSchemaReady = true;
    }
    const row = await env.DB.prepare('SELECT count, reset_at FROM rate_limits WHERE k = ?').bind(key).first();
    if (!row || Number(row.reset_at) < now) {
      const reset = now + windowMs;
      await env.DB.prepare(
        'INSERT INTO rate_limits (k, count, reset_at) VALUES (?,?,?) ON CONFLICT(k) DO UPDATE SET count = 1, reset_at = ?'
      ).bind(key, 1, reset, reset).run();
      return { allowed: true, retryAfter: 0 };
    }
    if (Number(row.count) >= max) {
      return { allowed: false, retryAfter: Math.ceil((Number(row.reset_at) - now) / 1000) };
    }
    await env.DB.prepare('UPDATE rate_limits SET count = count + 1 WHERE k = ?').bind(key).run();
    return { allowed: true, retryAfter: 0 };
  } catch {
    return { allowed: true, retryAfter: 0 };
  }
}

export function tooMany(retryAfter) {
  return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfter || 60) },
  });
}
