// Inventory / stock tracking.
// Stock is keyed by SKU = `${productId}_${dose}` — the SAME key order line items
// carry in `product_id`, so decrementing on a paid order is a direct lookup.
import { verifyAdminSession } from './security.js';
import { sendEmail, renderRestockBack } from './email.js';

export const LOW_STOCK = 9; // under this many vials → "Low stock"
const SITE = 'https://omenlabs.co';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const bearer = (req) => (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');

let schemaReady = false;
async function ensureTable(env) {
  if (schemaReady || !env.DB) return;
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS stock (sku TEXT PRIMARY KEY, count INTEGER DEFAULT 0, updated_at INTEGER)').run();
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS restock_notify (id INTEGER PRIMARY KEY AUTOINCREMENT, sku TEXT, email TEXT, product_name TEXT, slug TEXT, created_at INTEGER, notified INTEGER DEFAULT 0, UNIQUE(sku, email))').run();
  // Mark orders whose quantities have already been removed from stock (idempotency).
  try { await env.DB.prepare('ALTER TABLE orders ADD COLUMN stock_decremented INTEGER DEFAULT 0').run(); } catch {}
  schemaReady = true;
}

export async function getStockMap(env) {
  if (!env.DB) return {};
  await ensureTable(env);
  const { results } = await env.DB.prepare('SELECT sku, count FROM stock').all();
  const map = {};
  for (const r of results || []) map[r.sku] = Number(r.count) || 0;
  return map;
}

// GET /api/admin/stock — full stock map for the admin page
export async function listStock(request, env) {
  if (!(await verifyAdminSession(env, bearer(request)))) return json({ error: 'Unauthorized' }, 401);
  await ensureTable(env);
  const waiting = {};
  const { results } = await env.DB.prepare("SELECT sku, COUNT(*) AS n FROM restock_notify WHERE notified = 0 GROUP BY sku").all();
  for (const r of results || []) waiting[r.sku] = Number(r.n) || 0;
  return json({ stock: await getStockMap(env), lowStock: LOW_STOCK, waiting });
}

// POST /api/admin/stock — { updates: [{ sku, count }] } (or a single { sku, count })
export async function updateStock(request, env) {
  if (!(await verifyAdminSession(env, bearer(request)))) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ error: 'Service unavailable.' }, 500);
  await ensureTable(env);
  let b; try { b = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const updates = Array.isArray(b.updates) ? b.updates : (b.sku != null ? [{ sku: b.sku, count: b.count }] : []);
  const now = Date.now();
  for (const u of updates) {
    const sku = String(u.sku || '').slice(0, 80);
    if (!sku) continue;
    const count = Math.max(0, Math.floor(Number(u.count) || 0));
    const prev = await env.DB.prepare('SELECT count FROM stock WHERE sku = ?').bind(sku).first();
    const prevCount = prev ? Number(prev.count) || 0 : 0;
    await env.DB.prepare(
      'INSERT INTO stock (sku, count, updated_at) VALUES (?,?,?) ON CONFLICT(sku) DO UPDATE SET count=excluded.count, updated_at=excluded.updated_at'
    ).bind(sku, count, now).run();
    // Went from out-of-stock to in-stock → notify anyone waiting.
    if (prevCount <= 0 && count > 0) await notifyRestock(env, sku);
  }
  return json({ ok: true, stock: await getStockMap(env) });
}

// Email everyone waiting on a SKU that it's back, then mark them notified.
async function notifyRestock(env, sku) {
  if (!env.RESEND_API_KEY) return;
  const { results } = await env.DB.prepare('SELECT email, product_name, slug FROM restock_notify WHERE sku = ? AND notified = 0').bind(sku).all();
  for (const w of results || []) {
    try {
      await sendEmail(env, {
        to: w.email,
        subject: `Back in stock — ${w.product_name || 'your item'}`,
        html: renderRestockBack({ productName: w.product_name, url: w.slug ? `${SITE}/product/${w.slug}` : `${SITE}/catalog` }),
      });
    } catch {}
  }
  await env.DB.prepare('UPDATE restock_notify SET notified = 1 WHERE sku = ? AND notified = 0').bind(sku).run();
}

// POST /api/restock-notify — { sku, email, product_name, slug } (public)
export async function restockNotifySignup(request, env) {
  if (!env.DB) return json({ ok: true });
  let b; try { b = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const sku = String(b.sku || '').slice(0, 80);
  const email = String(b.email || '').trim().toLowerCase().slice(0, 120);
  if (!sku || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Enter a valid email.' }, 400);
  await ensureTable(env);
  await env.DB.prepare(
    'INSERT INTO restock_notify (sku, email, product_name, slug, created_at, notified) VALUES (?,?,?,?,?,0) ON CONFLICT(sku, email) DO UPDATE SET notified=0, product_name=excluded.product_name, slug=excluded.slug'
  ).bind(sku, email, String(b.product_name || '').slice(0, 80), String(b.slug || '').slice(0, 80), Date.now()).run();
  return json({ ok: true });
}

// GET /api/stock — public counts (for low-stock / sold-out badges)
export async function publicStock(request, env) {
  return json({ stock: await getStockMap(env) });
}

// Subtract a paid order's quantities from stock — exactly once per order.
export async function decrementStockForOrder(env, order) {
  if (!env.DB || !order || order.stock_decremented) return;
  await ensureTable(env);
  let items = [];
  try { items = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : (order.items || []); } catch {}
  const now = Date.now();
  for (const it of items) {
    const sku = it && it.product_id;
    const qty = Math.max(0, Math.floor(Number(it && it.quantity) || 0));
    if (!sku || !qty) continue;
    // WHERE sku=? affects nothing for untracked SKUs, so only tracked items move.
    await env.DB.prepare('UPDATE stock SET count = MAX(0, count - ?), updated_at = ? WHERE sku = ?').bind(qty, now, sku).run();
  }
  if (order.id != null) await env.DB.prepare('UPDATE orders SET stock_decremented = 1 WHERE id = ?').bind(order.id).run();
  else if (order.order_number) await env.DB.prepare('UPDATE orders SET stock_decremented = 1 WHERE order_number = ?').bind(order.order_number).run();
}

// Reverse of decrement — add a refunded/cancelled order's quantities back to
// stock, exactly once (only if they were actually taken out).
export async function restockOrder(env, order) {
  if (!env.DB || !order || !order.stock_decremented) return;
  await ensureTable(env);
  let items = [];
  try { items = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : (order.items || []); } catch {}
  const now = Date.now();
  for (const it of items) {
    const sku = it && it.product_id;
    const qty = Math.max(0, Math.floor(Number(it && it.quantity) || 0));
    if (!sku || !qty) continue;
    await env.DB.prepare('UPDATE stock SET count = count + ?, updated_at = ? WHERE sku = ?').bind(qty, now, sku).run();
  }
  if (order.id != null) await env.DB.prepare('UPDATE orders SET stock_decremented = 0 WHERE id = ?').bind(order.id).run();
  else if (order.order_number) await env.DB.prepare('UPDATE orders SET stock_decremented = 0 WHERE order_number = ?').bind(order.order_number).run();
}
