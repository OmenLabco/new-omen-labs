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
// Payment providers are the only third parties: PayPal, and Square's Web
// Payments SDK (card iframes, PCI tokenization, 3-D Secure via Cardinal) plus
// Google Pay. Without these the on-site card form silently fails to load.
const SQUARE_JS = 'https://*.squarecdn.com https://js.squareup.com https://js.squareupsandbox.com';
const SQUARE_CONNECT = 'https://pci-connect.squareup.com https://pci-connect.squareupsandbox.com https://o160250.ingest.sentry.io';
const SQUARE_FRAMES = 'https://*.squarecdn.com https://api.squareup.com https://api.squareupsandbox.com https://geoissuer.cardinalcommerce.com https://geostag.cardinalcommerce.com https://geo.cardinalcommerce.com https://1eafstag.cardinalcommerce.com https://centinelapi.cardinalcommerce.com';
const GPAY = 'https://pay.google.com';
const CSP = [
  "default-src 'self'",
  `script-src 'self' https://*.paypal.com https://*.paypalobjects.com ${SQUARE_JS} ${GPAY}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.squarecdn.com https://d1g145x70srn7h.cloudfront.net",
  "font-src 'self' https://fonts.gstatic.com data: https://*.squarecdn.com https://d1g145x70srn7h.cloudfront.net",
  `img-src 'self' data: blob: https://*.paypal.com https://*.paypalobjects.com https://*.squarecdn.com ${GPAY} https://www.gstatic.com`,
  `connect-src 'self' https://*.paypal.com https://*.paypalobjects.com ${SQUARE_CONNECT} ${GPAY}`,
  `frame-src https://*.paypal.com https://*.paypalobjects.com ${SQUARE_FRAMES} ${GPAY}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

export const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // payment=(self …) — Apple Pay / Google Pay need the Payment Request API; an
  // empty allowlist switches it off for our own checkout.
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(self "https://pay.google.com" "https://web.squarecdn.com"), usb=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  // allow-popups: payment pop-ups we open (Google Pay fallback, PayPal) must be
  // able to report back to this page; same-origin severed that link.
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
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
  // No fallback key: a missing secret must fail closed, never sign with a
  // value that is sitting in the source code.
  if (!secret) throw new Error('Server secret is not configured.');
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
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

// ---- Generic signed sessions (customer / affiliate) ----
// Token = "<kind>.<base64 json>.<hmac>". The kind is part of the signed message,
// so an admin token can't be replayed as a customer token or vice versa.
const b64json = (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const unb64json = (s) => JSON.parse(decodeURIComponent(escape(atob(s))));

export async function signSession(env, kind, data, ttlMs) {
  const body = b64json({ ...data, k: kind, exp: Date.now() + ttlMs });
  return `${kind}.${body}.${await hmacHex(env.ADMIN_PASSWORD, `${kind}.${body}`)}`;
}

export async function readSession(env, kind, token) {
  if (!env.ADMIN_PASSWORD || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== kind) return null;
  const expected = await hmacHex(env.ADMIN_PASSWORD, `${kind}.${parts[1]}`);
  if (!(await safeEqual(parts[2], expected))) return null;
  let p;
  try { p = unb64json(parts[1]); } catch { return null; }
  if (!p || p.k !== kind || typeof p.exp !== 'number' || p.exp <= Date.now()) return null;
  return p;
}

// Secret for the Zelle SMS-forward webhook. Derived from ADMIN_PASSWORD so it's
// a distinct value (safe to paste into the phone Shortcut) without a new env var.
export async function zelleSecret(env) {
  return hmacHex(env.ADMIN_PASSWORD, 'zelle-webhook-v1');
}

export function clientIp(request) {
  // Only Cloudflare's own header: X-Forwarded-For is client-controlled, and
  // honoring it would let anyone dodge rate limits with a random value per request.
  return request.headers.get('CF-Connecting-IP') || 'unknown';
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
    // One row per IP per endpoint would otherwise accumulate forever; sweep
    // long-expired rows on a small fraction of calls.
    if (Math.random() < 0.02) {
      await env.DB.prepare('DELETE FROM rate_limits WHERE reset_at < ?').bind(now - 24 * 60 * 60 * 1000).run();
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
