// Affiliate program — signup, login, stats, and code validation.
//
// Environment:
//   DB             - D1 database binding
//   ADMIN_PASSWORD - also used as a pepper for affiliate password hashing

export const AFFILIATE_CUSTOMER_DISCOUNT = 0.10; // 10% off for the customer
export const AFFILIATE_COMMISSION_RATE = 0.15;   // 15% of subtotal to the affiliate

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

async function hashPw(pw, email, env) {
  const data = new TextEncoder().encode(`${pw}:${email.toLowerCase()}:${env.ADMIN_PASSWORD || 'omen'}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const normCode = (c = '') => String(c).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);

export async function getAffiliateByCode(env, code) {
  if (!env.DB || !code) return null;
  return env.DB.prepare('SELECT * FROM affiliates WHERE code = ?').bind(normCode(code)).first();
}

// POST /api/affiliate/signup
export async function signupAffiliate(request, env) {
  if (!env.DB) return json({ error: 'Service unavailable.' }, 500);
  let b;
  try { b = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const name = (b.name || '').trim();
  const email = (b.email || '').trim().toLowerCase();
  const code = normCode(b.code);
  const password = b.password || '';

  if (!name || !email || !code || !password) return json({ error: 'All fields are required.' }, 400);
  if (code.length < 3) return json({ error: 'Code must be at least 3 characters (letters/numbers).' }, 400);
  if (password.length < 6) return json({ error: 'Password must be at least 6 characters.' }, 400);

  const existsCode = await env.DB.prepare('SELECT 1 FROM affiliates WHERE code = ?').bind(code).first();
  if (existsCode) return json({ error: 'That code is already taken — pick another.' }, 409);
  const existsEmail = await env.DB.prepare('SELECT 1 FROM affiliates WHERE email = ?').bind(email).first();
  if (existsEmail) return json({ error: 'An account with that email already exists.' }, 409);

  const password_hash = await hashPw(password, email, env);
  await env.DB.prepare(
    'INSERT INTO affiliates (code, name, email, password_hash, created_date) VALUES (?,?,?,?,?)'
  ).bind(code, name, email, password_hash, new Date().toISOString()).run();

  return json({ ok: true, code, name });
}

// Decode "Authorization: Bearer base64(email:password)" and verify
async function authedAffiliate(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  let decoded;
  try { decoded = atob(token); } catch { return null; }
  const idx = decoded.indexOf(':');
  if (idx === -1) return null;
  const email = decoded.slice(0, idx).toLowerCase();
  const password = decoded.slice(idx + 1);
  const aff = await env.DB.prepare('SELECT * FROM affiliates WHERE email = ?').bind(email).first();
  if (!aff) return null;
  const hash = await hashPw(password, email, env);
  return hash === aff.password_hash ? aff : null;
}

// POST /api/affiliate/login
export async function loginAffiliate(request, env) {
  if (!env.DB) return json({ error: 'Service unavailable.' }, 500);
  const aff = await authedAffiliate(request, env);
  if (!aff) return json({ error: 'Incorrect email or password.' }, 401);
  return json({ ok: true, name: aff.name, code: aff.code });
}

// GET /api/affiliate/stats  (auth required)
export async function affiliateStats(request, env) {
  if (!env.DB) return json({ error: 'Service unavailable.' }, 500);
  const aff = await authedAffiliate(request, env);
  if (!aff) return json({ error: 'Unauthorized' }, 401);

  const { results } = await env.DB.prepare(
    'SELECT order_number, total, commission, status, created_date FROM orders WHERE affiliate_code = ? ORDER BY id DESC'
  ).bind(aff.code).all();

  const orders = results || [];
  const totalSales = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const totalCommission = orders.reduce((s, o) => s + Number(o.commission || 0), 0);

  return json({
    affiliate: { name: aff.name, code: aff.code, email: aff.email },
    stats: { orders: orders.length, totalSales, totalCommission },
    recent: orders.slice(0, 50),
  });
}

// GET /api/affiliate/validate?code=XXX  (public — used by checkout)
export async function validateCode(request, env) {
  const url = new URL(request.url);
  const code = normCode(url.searchParams.get('code') || '');
  const aff = await getAffiliateByCode(env, code);
  if (!aff) return json({ valid: false });
  return json({ valid: true, code: aff.code, discountPct: Math.round(AFFILIATE_CUSTOMER_DISCOUNT * 100) });
}
