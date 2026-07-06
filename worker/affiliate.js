// Affiliate program — signup, login, stats, and code validation.
//
// Environment:
//   DB             - D1 database binding
//   ADMIN_PASSWORD - also used as a pepper for affiliate password hashing

import { safeEqual } from './security.js';

export const NEW_CUSTOMER_DISCOUNT = 0.20;       // 20% off for first-time customers
export const RETURNING_CUSTOMER_DISCOUNT = 0.10; // 10% off for returning customers

// Commission tiers based on the affiliate's number of attributed sales
export function commissionTier(salesCount = 0) {
  if (salesCount >= 30) return { name: 'Platinum', rate: 0.17, min: 30 };
  if (salesCount >= 10) return { name: 'Gold', rate: 0.10, min: 10 };
  return { name: 'Silver', rate: 0.05, min: 0 };
}

export async function affiliateSalesCount(env, code) {
  if (!env.DB) return 0;
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM orders WHERE affiliate_code = ?').bind(code).first();
  return row ? Number(row.n) : 0;
}

export async function isNewCustomer(env, email) {
  if (!env.DB || !email) return true;
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM orders WHERE LOWER(customer_email) = ?').bind(email.toLowerCase()).first();
  return !row || Number(row.n) === 0;
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

async function hashPw(pw, email, env) {
  const data = new TextEncoder().encode(`${pw}:${email.toLowerCase()}:${env.ADMIN_PASSWORD || 'omen'}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const normCode = (c = '') => String(c).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);

// Supported affiliate payout methods (owner sends the money manually).
export const PAYOUT_METHODS = {
  cashapp: 'CashApp',
  paypal: 'PayPal',
  zelle: 'Zelle',
  crypto: 'Crypto (USDT · Solana)',
};

// Lazy schema: add the newer affiliate columns + the payouts table. Cached per
// isolate so we don't run ALTER on every request.
let affSchemaReady = false;
export async function ensureAffiliateSchema(env) {
  if (affSchemaReady || !env.DB) return;
  for (const col of ['marketing_opt_in INTEGER DEFAULT 0', 'payout_method TEXT', 'payout_handle TEXT']) {
    try { await env.DB.prepare(`ALTER TABLE affiliates ADD COLUMN ${col}`).run(); } catch {}
  }
  await env.DB.prepare(
    'CREATE TABLE IF NOT EXISTS payouts (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, email TEXT, amount REAL, method TEXT, handle TEXT, status TEXT, created_date TEXT, paid_date TEXT)'
  ).run();
  affSchemaReady = true;
}

// Commission owed vs already paid/requested, for one affiliate code.
async function payoutSummary(env, code, totalCommission) {
  await ensureAffiliateSchema(env);
  const { results } = await env.DB.prepare(
    'SELECT id, amount, method, handle, status, created_date, paid_date FROM payouts WHERE code = ? ORDER BY id DESC'
  ).bind(code).all();
  const payouts = results || [];
  const paid = payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0);
  const pending = payouts.filter((p) => p.status === 'requested').reduce((s, p) => s + Number(p.amount || 0), 0);
  const available = Math.max(0, +(totalCommission - paid - pending).toFixed(2));
  return { available, paid: +paid.toFixed(2), pending: +pending.toFixed(2), payouts };
}

export async function getAffiliateByCode(env, code) {
  if (!env.DB || !code) return null;
  return env.DB.prepare('SELECT * FROM affiliates WHERE code = ?').bind(normCode(code)).first();
}

export async function getAffiliateByEmail(env, email) {
  if (!env.DB || !email) return null;
  return env.DB.prepare('SELECT * FROM affiliates WHERE LOWER(email) = ?').bind(email.toLowerCase()).first();
}

export const normalizeCode = normCode;

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
  const aff = await env.DB.prepare('SELECT * FROM affiliates WHERE LOWER(email) = ?').bind(email).first();
  if (!aff) return null;
  const hash = await hashPw(password, email, env);
  if (await safeEqual(hash, aff.password_hash || '')) return aff;
  // Unified login: the website (customer) account with the same email also works,
  // so affiliates never need a separate password. Same hashing scheme + pepper.
  const cust = await env.DB.prepare('SELECT password_hash FROM customers WHERE LOWER(email) = ?').bind(email).first();
  if (cust && (await safeEqual(hash, cust.password_hash || ''))) return aff;
  return null;
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

  const tier = commissionTier(orders.length);
  const nextTier = tier.name === 'Silver' ? { name: 'Gold', at: 10 } : tier.name === 'Gold' ? { name: 'Platinum', at: 30 } : null;

  const ps = await payoutSummary(env, aff.code, totalCommission);

  return json({
    affiliate: { name: aff.name, code: aff.code, email: aff.email },
    stats: { orders: orders.length, totalSales, totalCommission },
    tier: { name: tier.name, rate: Math.round(tier.rate * 100) },
    nextTier: nextTier ? { name: nextTier.name, salesNeeded: Math.max(0, nextTier.at - orders.length) } : null,
    recent: orders.slice(0, 50),
    payout: {
      available: ps.available,
      paid: ps.paid,
      pending: ps.pending,
      method: aff.payout_method || null,
      handle: aff.payout_handle || null,
      methods: PAYOUT_METHODS,
      history: ps.payouts.slice(0, 20),
    },
    marketingOptIn: !!aff.marketing_opt_in,
  });
}

// POST /api/affiliate/payout — affiliate requests a payout of available commission.
// The owner pays manually and marks it paid in admin; we only track the request.
export async function requestPayout(request, env) {
  if (!env.DB) return json({ error: 'Service unavailable.' }, 500);
  const aff = await authedAffiliate(request, env);
  if (!aff) return json({ error: 'Unauthorized' }, 401);
  let b; try { b = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }

  const method = String(b.method || '').toLowerCase();
  const handle = String(b.handle || '').trim().slice(0, 120);
  if (!PAYOUT_METHODS[method]) return json({ error: 'Choose a valid payout method.' }, 400);
  if (!handle) return json({ error: 'Enter your payout details (handle, email, or address).' }, 400);

  const totalCommission = await env.DB.prepare('SELECT COALESCE(SUM(commission),0) AS c FROM orders WHERE affiliate_code = ?').bind(aff.code).first();
  const ps = await payoutSummary(env, aff.code, Number(totalCommission?.c || 0));
  if (ps.available <= 0) return json({ error: 'No commission available to pay out yet.' }, 400);

  let amount = b.amount != null ? Number(b.amount) : ps.available;
  if (!Number.isFinite(amount) || amount <= 0) return json({ error: 'Enter a valid amount.' }, 400);
  amount = +amount.toFixed(2);
  // Never allow requesting more than what's actually available to withdraw.
  if (amount > ps.available + 0.001) return json({ error: `You can withdraw at most $${ps.available.toFixed(2)}.` }, 400);

  const now = new Date().toISOString();
  await env.DB.prepare(
    'INSERT INTO payouts (code, email, amount, method, handle, status, created_date) VALUES (?,?,?,?,?,?,?)'
  ).bind(aff.code, aff.email.toLowerCase(), amount, method, handle, 'requested', now).run();
  // Remember these details as the affiliate's default for next time.
  await env.DB.prepare('UPDATE affiliates SET payout_method = ?, payout_handle = ? WHERE code = ?').bind(method, handle, aff.code).run();

  return json({ ok: true, amount, method, handle });
}

// GET /api/affiliate/validate?code=XXX&email=YYY  (public — used by checkout)
export async function validateCode(request, env) {
  const url = new URL(request.url);
  const code = normCode(url.searchParams.get('code') || '');
  const email = (url.searchParams.get('email') || '').trim();
  const aff = await getAffiliateByCode(env, code);
  if (!aff) return json({ valid: false });
  // If we know the customer's email, return the exact rate; otherwise assume new (20%).
  const isNew = email ? await isNewCustomer(env, email) : true;
  const rate = isNew ? NEW_CUSTOMER_DISCOUNT : RETURNING_CUSTOMER_DISCOUNT;
  return json({ valid: true, code: aff.code, newCustomer: isNew, discountPct: Math.round(rate * 100) });
}
