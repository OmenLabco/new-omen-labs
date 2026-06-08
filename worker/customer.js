// Customer accounts + points/rewards + spend-based membership tiers.
//
// Environment: DB (D1), ADMIN_PASSWORD (pepper for hashing)

export const POINTS_PER_DOLLAR = 1;
export const POINTS_REDEEM_VALUE = 0.05; // $ per point → 100 pts = $5
export const REDEEM_STEP = 100;          // redeem in increments of 100 pts

// Free, spend-based membership tiers
export function membershipTier(lifetimeSpend = 0) {
  if (lifetimeSpend >= 1000) return { name: 'Gold', multiplier: 1.5, freeShipping: true, min: 1000 };
  if (lifetimeSpend >= 250) return { name: 'Silver', multiplier: 1.25, freeShipping: false, min: 250 };
  return { name: 'Bronze', multiplier: 1, freeShipping: false, min: 0 };
}
export function nextTierInfo(lifetimeSpend = 0) {
  if (lifetimeSpend >= 1000) return null;
  if (lifetimeSpend >= 250) return { name: 'Gold', remaining: +(1000 - lifetimeSpend).toFixed(2) };
  return { name: 'Silver', remaining: +(250 - lifetimeSpend).toFixed(2) };
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

async function hashPw(pw, email, env) {
  const data = new TextEncoder().encode(`${pw}:${email.toLowerCase()}:${env.ADMIN_PASSWORD || 'omen'}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getCustomerByEmail(env, email) {
  if (!env.DB || !email) return null;
  return env.DB.prepare('SELECT * FROM customers WHERE LOWER(email) = ?').bind(email.toLowerCase()).first();
}

// Verify "Authorization: Bearer base64(email:password)" or a raw base64 token string
export async function customerFromToken(env, token) {
  if (!token) return null;
  let decoded;
  try { decoded = atob(token); } catch { return null; }
  const idx = decoded.indexOf(':');
  if (idx === -1) return null;
  const email = decoded.slice(0, idx).toLowerCase();
  const password = decoded.slice(idx + 1);
  const cust = await getCustomerByEmail(env, email);
  if (!cust) return null;
  const hash = await hashPw(password, email, env);
  return hash === cust.password_hash ? cust : null;
}

async function authedCustomer(request, env) {
  const header = request.headers.get('Authorization') || '';
  return customerFromToken(env, header.replace(/^Bearer\s+/i, ''));
}

function publicStats(cust) {
  const tier = membershipTier(cust.lifetime_spend || 0);
  const next = nextTierInfo(cust.lifetime_spend || 0);
  return {
    name: cust.name,
    email: cust.email,
    points: cust.points || 0,
    pointsValue: +(((cust.points || 0) * POINTS_REDEEM_VALUE)).toFixed(2),
    lifetimeSpend: +(cust.lifetime_spend || 0).toFixed(2),
    tier: { name: tier.name, multiplier: tier.multiplier, freeShipping: tier.freeShipping },
    nextTier: next,
  };
}

export async function signupCustomer(request, env) {
  if (!env.DB) return json({ error: 'Service unavailable.' }, 500);
  let b; try { b = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const name = (b.name || '').trim();
  const email = (b.email || '').trim().toLowerCase();
  const password = b.password || '';
  if (!name || !email || !password) return json({ error: 'All fields are required.' }, 400);
  if (password.length < 6) return json({ error: 'Password must be at least 6 characters.' }, 400);

  const exists = await getCustomerByEmail(env, email);
  if (exists) return json({ error: 'An account with that email already exists.' }, 409);

  const password_hash = await hashPw(password, email, env);
  // Credit lifetime spend + points from any prior guest orders with this email
  let priorSpend = 0;
  const agg = await env.DB.prepare('SELECT COALESCE(SUM(total),0) AS s FROM orders WHERE LOWER(customer_email) = ?').bind(email).first();
  if (agg) priorSpend = Number(agg.s) || 0;
  const startPoints = Math.floor(priorSpend * POINTS_PER_DOLLAR);

  await env.DB.prepare(
    'INSERT INTO customers (email, name, password_hash, points, lifetime_spend, created_date) VALUES (?,?,?,?,?,?)'
  ).bind(email, name, password_hash, startPoints, priorSpend, new Date().toISOString()).run();

  const cust = await getCustomerByEmail(env, email);
  return json({ ok: true, ...publicStats(cust) });
}

export async function loginCustomer(request, env) {
  if (!env.DB) return json({ error: 'Service unavailable.' }, 500);
  const cust = await authedCustomer(request, env);
  if (!cust) return json({ error: 'Incorrect email or password.' }, 401);
  return json({ ok: true, ...publicStats(cust) });
}

export async function customerMe(request, env) {
  if (!env.DB) return json({ error: 'Service unavailable.' }, 500);
  const cust = await authedCustomer(request, env);
  if (!cust) return json({ error: 'Unauthorized' }, 401);

  const { results } = await env.DB.prepare(
    'SELECT order_number, total, points_earned, points_redeemed, status, created_date FROM orders WHERE LOWER(customer_email) = ? ORDER BY id DESC'
  ).bind(cust.email.toLowerCase()).all();

  return json({ ...publicStats(cust), recent: (results || []).slice(0, 50) });
}
