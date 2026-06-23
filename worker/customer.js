// Customer accounts + points/rewards + spend-based membership tiers.
//
// Environment: DB (D1), ADMIN_PASSWORD (pepper for hashing)

import { safeEqual } from './security.js';

export const POINTS_PER_DOLLAR = 1;
export const POINTS_REDEEM_VALUE = 0.05; // $ per point → 100 pts = $5
export const REDEEM_STEP = 100;          // redeem in increments of 100 pts

// Paid membership (Omen VIP). Perks apply only to active paid members.
export const VIP_MULTIPLIER = 2; // 2× points for members

export function membershipStatus(customer) {
  const active = !!customer && customer.membership === 'vip' &&
    (!customer.membership_expires || new Date(customer.membership_expires).getTime() > Date.now());
  return {
    active,
    name: active ? 'Omen VIP' : 'Member',
    multiplier: active ? VIP_MULTIPLIER : 1,
    freeShipping: active,
  };
}

import { getAffiliateByEmail, commissionTier, normalizeCode } from './affiliate.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

// Affiliate enrollment + stats for a given email (links customer ↔ affiliate)
async function affiliateInfoForEmail(env, email) {
  const aff = await getAffiliateByEmail(env, email);
  if (!aff) return { enrolled: false };
  const { results } = await env.DB.prepare(
    'SELECT order_number, total, commission, status, created_date FROM orders WHERE affiliate_code = ? ORDER BY id DESC'
  ).bind(aff.code).all();
  const orders = results || [];
  const totalSales = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const totalCommission = orders.reduce((s, o) => s + Number(o.commission || 0), 0);
  const tier = commissionTier(orders.length);
  const next = tier.name === 'Silver' ? { name: 'Gold', at: 10 } : tier.name === 'Gold' ? { name: 'Platinum', at: 30 } : null;
  return {
    enrolled: true,
    code: aff.code,
    stats: { orders: orders.length, totalSales, totalCommission },
    tier: { name: tier.name, rate: Math.round(tier.rate * 100) },
    nextTier: next ? { name: next.name, salesNeeded: Math.max(0, next.at - orders.length) } : null,
    recent: orders.slice(0, 50),
  };
}

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
  return (await safeEqual(hash, cust.password_hash || '')) ? cust : null;
}

async function authedCustomer(request, env) {
  const header = request.headers.get('Authorization') || '';
  return customerFromToken(env, header.replace(/^Bearer\s+/i, ''));
}

function publicStats(cust) {
  const m = membershipStatus(cust);
  return {
    name: cust.name,
    email: cust.email,
    points: cust.points || 0,
    pointsValue: +(((cust.points || 0) * POINTS_REDEEM_VALUE)).toFixed(2),
    lifetimeSpend: +(cust.lifetime_spend || 0).toFixed(2),
    membership: { active: m.active, name: m.name, multiplier: m.multiplier, freeShipping: m.freeShipping },
  };
}

export async function signupCustomer(request, env) {
  if (!env.DB) return json({ error: 'Service unavailable.' }, 500);
  let b; try { b = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const name = (b.name || '').trim();
  const email = (b.email || '').trim().toLowerCase();
  const password = b.password || '';
  const research_field = (b.research_field || '').trim();
  if (!name || !email || !password) return json({ error: 'All fields are required.' }, 400);
  if (!research_field) return json({ error: 'Please select your research field.' }, 400);
  if (password.length < 6) return json({ error: 'Password must be at least 6 characters.' }, 400);

  const exists = await getCustomerByEmail(env, email);
  if (exists) return json({ error: 'An account with that email already exists.' }, 409);

  // Ensure the research_field column exists (lazy migration for existing DBs)
  try { await env.DB.prepare('ALTER TABLE customers ADD COLUMN research_field TEXT').run(); } catch {}

  const password_hash = await hashPw(password, email, env);
  // Credit lifetime spend + points from any prior guest orders with this email
  let priorSpend = 0;
  const agg = await env.DB.prepare('SELECT COALESCE(SUM(total),0) AS s FROM orders WHERE LOWER(customer_email) = ?').bind(email).first();
  if (agg) priorSpend = Number(agg.s) || 0;
  const startPoints = Math.floor(priorSpend * POINTS_PER_DOLLAR);

  await env.DB.prepare(
    'INSERT INTO customers (email, name, password_hash, points, lifetime_spend, created_date, research_field) VALUES (?,?,?,?,?,?,?)'
  ).bind(email, name, password_hash, startPoints, priorSpend, new Date().toISOString(), research_field).run();

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

  const affiliate = await affiliateInfoForEmail(env, cust.email);
  return json({ ...publicStats(cust), recent: (results || []).slice(0, 50), affiliate });
}

// POST /api/customer/affiliate-enroll — enroll the logged-in customer as an affiliate
// using their existing credentials (same email + password hash), so one login does both.
export async function enrollAffiliate(request, env) {
  if (!env.DB) return json({ error: 'Service unavailable.' }, 500);
  const cust = await authedCustomer(request, env);
  if (!cust) return json({ error: 'Unauthorized' }, 401);
  let b; try { b = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const code = normalizeCode(b.code || '');
  if (code.length < 3) return json({ error: 'Code must be at least 3 characters (letters/numbers).' }, 400);

  const existingForEmail = await getAffiliateByEmail(env, cust.email);
  if (existingForEmail) return json({ error: 'You already have an affiliate account.', code: existingForEmail.code }, 409);
  const taken = await env.DB.prepare('SELECT 1 FROM affiliates WHERE code = ?').bind(code).first();
  if (taken) return json({ error: 'That code is already taken — pick another.' }, 409);

  // copy the customer's password_hash so /affiliates login works with the same password
  await env.DB.prepare(
    'INSERT INTO affiliates (code, name, email, password_hash, created_date) VALUES (?,?,?,?,?)'
  ).bind(code, cust.name, cust.email.toLowerCase(), cust.password_hash, new Date().toISOString()).run();

  return json({ ok: true, code });
}
