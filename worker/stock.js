// Inventory / stock tracking.
// Stock is keyed by SKU = `${productId}_${dose}` — the SAME key order line items
// carry in `product_id`, so decrementing on a paid order is a direct lookup.
import { verifyAdminSession } from './security.js';

export const LOW_STOCK = 9; // under this many vials → "Low stock"

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const bearer = (req) => (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');

let schemaReady = false;
async function ensureTable(env) {
  if (schemaReady || !env.DB) return;
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS stock (sku TEXT PRIMARY KEY, count INTEGER DEFAULT 0, updated_at INTEGER)').run();
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
  return json({ stock: await getStockMap(env), lowStock: LOW_STOCK });
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
    await env.DB.prepare(
      'INSERT INTO stock (sku, count, updated_at) VALUES (?,?,?) ON CONFLICT(sku) DO UPDATE SET count=excluded.count, updated_at=excluded.updated_at'
    ).bind(sku, count, now).run();
  }
  return json({ ok: true, stock: await getStockMap(env) });
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
