// Abandoned-cart recovery for logged-in shoppers (we have their email).
// The app syncs a logged-in customer's cart here; a cron emails anyone who left
// items behind and didn't convert.
import { customerFromToken } from './customer.js';
import { renderAbandonedCart, sendEmail } from './email.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const bearer = (req) => (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');

let schemaReady = false;
async function ensureTable(env) {
  if (schemaReady || !env.DB) return;
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS carts (email TEXT PRIMARY KEY, items TEXT, subtotal REAL, updated_at INTEGER, reminded_at INTEGER)').run();
  schemaReady = true;
}

// POST /api/cart/sync  (customer-authed) — mirror the current cart, or clear it.
export async function syncCart(request, env) {
  if (!env.DB) return json({ ok: true });
  const cust = await customerFromToken(env, bearer(request));
  if (!cust) return json({ error: 'Unauthorized' }, 401);
  let b; try { b = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  await ensureTable(env);
  const email = cust.email.toLowerCase();
  const items = Array.isArray(b.items) ? b.items.slice(0, 50).map((i) => ({
    product_id: String(i.product_id || '').slice(0, 80),
    product_name: String(i.product_name || '').slice(0, 80),
    quantity: Math.max(0, Math.floor(Number(i.quantity) || 0)),
    price: Number(i.price) || 0,
  })).filter((i) => i.quantity > 0) : [];

  if (!items.length) {
    await env.DB.prepare('DELETE FROM carts WHERE email = ?').bind(email).run();
    return json({ ok: true, cleared: true });
  }
  const subtotal = +items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2);
  // New activity → reset reminded_at so a fresh abandon can be reminded again.
  await env.DB.prepare(
    'INSERT INTO carts (email, items, subtotal, updated_at, reminded_at) VALUES (?,?,?,?,NULL) ON CONFLICT(email) DO UPDATE SET items=excluded.items, subtotal=excluded.subtotal, updated_at=excluded.updated_at, reminded_at=NULL'
  ).bind(email, JSON.stringify(items), subtotal, Date.now()).run();
  return json({ ok: true });
}

// Cron: email carts abandoned 1–24h ago that never converted.
export async function runAbandonedCartWatch(env) {
  if (!env.DB || !env.RESEND_API_KEY) return;
  await ensureTable(env);
  const now = Date.now();
  const olderThan = now - 60 * 60 * 1000;       // sat for ≥ 1 hour
  const notOlderThan = now - 24 * 60 * 60 * 1000; // but ≤ 24 hours
  const { results } = await env.DB.prepare(
    'SELECT email, items, subtotal, updated_at FROM carts WHERE reminded_at IS NULL AND updated_at <= ? AND updated_at >= ?'
  ).bind(olderThan, notOlderThan).all();

  for (const c of results || []) {
    let items = []; try { items = JSON.parse(c.items || '[]'); } catch {}
    if (!items.length) continue;
    // Converted since? (any order created after the cart was last touched)
    const iso = new Date(c.updated_at).toISOString();
    const converted = await env.DB.prepare('SELECT 1 FROM orders WHERE LOWER(customer_email) = ? AND created_date > ? LIMIT 1').bind(c.email, iso).first();
    if (!converted) {
      const cust = await env.DB.prepare('SELECT name FROM customers WHERE LOWER(email) = ?').bind(c.email).first();
      try {
        await sendEmail(env, {
          to: c.email,
          subject: 'You left something behind — Omen Labs',
          html: renderAbandonedCart({ name: cust?.name, items, subtotal: c.subtotal }),
        });
      } catch {}
    }
    await env.DB.prepare('UPDATE carts SET reminded_at = ? WHERE email = ?').bind(now, c.email).run();
  }
}
