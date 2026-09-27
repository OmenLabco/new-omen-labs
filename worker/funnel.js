// Checkout funnel tracking — records each session that REACHES the checkout page
// (signed in or not), marks it "converted" when an order is placed, and reports
// reached / purchased / abandoned counts to the admin. The owner is excluded
// (the client skips reporting when signed into admin; plus an optional email
// allowlist via env.OWNER_EMAILS).
import { verifyAdminSession } from './security.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const bearer = (req) => (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');

let schemaReady = false;
async function ensureTable(env) {
  if (schemaReady || !env.DB) return;
  await env.DB.prepare(
    'CREATE TABLE IF NOT EXISTS checkout_hits (sid TEXT PRIMARY KEY, email TEXT, cart_count INTEGER, cart_value REAL, converted INTEGER DEFAULT 0, first_seen INTEGER, last_seen INTEGER)'
  ).run();
  schemaReady = true;
}

const ownerEmails = (env) => String(env.OWNER_EMAILS || '')
  .toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);

// POST /api/checkout-reached  { sid, email?, cartCount?, cartValue? }  (public)
export async function recordCheckoutReached(request, env) {
  if (!env.DB) return json({ ok: true });
  let b; try { b = await request.json(); } catch { return json({ ok: true }); }
  const sid = String(b.sid || '').slice(0, 40);
  if (!sid) return json({ ok: true });
  const email = b.email ? String(b.email).trim().toLowerCase().slice(0, 120) : null;
  // Never record the owner's own visits.
  if (email && ownerEmails(env).includes(email)) return json({ ok: true, skipped: 'owner' });
  await ensureTable(env);
  const now = Date.now();
  const cartCount = Math.max(0, Math.floor(Number(b.cartCount) || 0));
  const cartValue = Math.max(0, Number(b.cartValue) || 0);
  try {
    await env.DB.prepare(
      `INSERT INTO checkout_hits (sid, email, cart_count, cart_value, converted, first_seen, last_seen)
       VALUES (?,?,?,?,0,?,?)
       ON CONFLICT(sid) DO UPDATE SET
         email = COALESCE(excluded.email, checkout_hits.email),
         cart_count = excluded.cart_count,
         cart_value = excluded.cart_value,
         last_seen = excluded.last_seen`
    ).bind(sid, email, cartCount, cartValue, now, now).run();
    // Occasional prune — keep 90 days of funnel history.
    if ((now % 25) === 0) await env.DB.prepare('DELETE FROM checkout_hits WHERE last_seen < ?').bind(now - 90 * 86400000).run();
  } catch {}
  return json({ ok: true });
}

// Called from the order flow when an order is placed — marks that session converted.
export async function markCheckoutConverted(env, sid) {
  if (!env.DB || !sid) return;
  try {
    await ensureTable(env);
    await env.DB.prepare('UPDATE checkout_hits SET converted = 1 WHERE sid = ?').bind(String(sid).slice(0, 40)).run();
  } catch {}
}

// GET /api/admin/returning  (admin) — repeat-customer rate from the orders table.
// A "customer" is a distinct email that has placed at least one real (paid, not
// cancelled) order; "returning" = that email has 2+ such orders. Guests count too
// (grouped by the email on the order). The owner's own emails are excluded.
export async function returningStats(request, env) {
  if (!(await verifyAdminSession(env, bearer(request)))) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({});
  let rows = [];
  try {
    const res = await env.DB.prepare(
      `SELECT LOWER(customer_email) AS em,
              COUNT(*) AS n,
              MIN(created_date) AS first_date,
              MAX(created_date) AS last_date
       FROM orders
       WHERE customer_email IS NOT NULL AND customer_email <> ''
         AND status NOT IN ('cancelled', 'awaiting_payment')
       GROUP BY em`
    ).all();
    rows = res.results || [];
  } catch { rows = []; }

  const owners = new Set(ownerEmails(env));
  rows = rows.filter((r) => r.em && !owners.has(r.em));

  const totalCustomers = rows.length;
  const returning = rows.filter((r) => Number(r.n) >= 2).length;
  const totalOrders = rows.reduce((s, r) => s + Number(r.n || 0), 0);
  const repeatOrders = totalOrders - totalCustomers; // orders beyond each customer's first
  const now = Date.now();
  const cutoff30 = now - 30 * 86400000;
  const active30 = rows.filter((r) => {
    const t = Date.parse(r.last_date);
    return Number.isFinite(t) && t >= cutoff30;
  }).length;

  return json({
    totalCustomers,
    returning,
    newCustomers: totalCustomers - returning,
    returningRate: totalCustomers ? +((returning / totalCustomers) * 100).toFixed(1) : 0,
    totalOrders,
    repeatOrders,
    repeatOrderRate: totalOrders ? +((repeatOrders / totalOrders) * 100).toFixed(1) : 0,
    avgOrdersPerCustomer: totalCustomers ? +(totalOrders / totalCustomers).toFixed(2) : 0,
    active30,
  });
}

// GET /api/admin/funnel  (admin) — reached / converted / abandoned per window.
export async function funnelStats(request, env) {
  if (!(await verifyAdminSession(env, bearer(request)))) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({});
  await ensureTable(env);
  const now = Date.now();
  const WINDOWS = [
    { key: '24h', ms: 86400000 },
    { key: '7d', ms: 7 * 86400000 },
    { key: '30d', ms: 30 * 86400000 },
    { key: 'all', ms: null },
  ];
  const out = {};
  for (const w of WINDOWS) {
    const where = w.ms ? 'WHERE first_seen >= ?' : '';
    const binds = w.ms ? [now - w.ms] : [];
    let row;
    try {
      row = await env.DB.prepare(
        `SELECT COUNT(*) AS reached,
                COALESCE(SUM(converted), 0) AS converted,
                COALESCE(SUM(CASE WHEN converted = 0 THEN 1 ELSE 0 END), 0) AS abandoned,
                COALESCE(SUM(CASE WHEN converted = 0 THEN cart_value ELSE 0 END), 0) AS lost_value
         FROM checkout_hits ${where}`
      ).bind(...binds).first();
    } catch { row = null; }
    const reached = Number(row?.reached) || 0;
    const converted = Number(row?.converted) || 0;
    out[w.key] = {
      reached,
      converted,
      abandoned: Number(row?.abandoned) || 0,
      lostValue: +(Number(row?.lost_value) || 0).toFixed(2),
      conversionRate: reached ? +((converted / reached) * 100).toFixed(1) : 0,
    };
  }
  return json(out);
}
