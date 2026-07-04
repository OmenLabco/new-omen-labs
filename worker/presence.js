// Live presence tracking (Shopify-style "Live View").
// Visitors' browsers ping /api/presence every ~15s. We upsert one row per
// session into a D1 table; admin reads aggregated counts of sessions active in
// the last 60s. Auto-prunes stale rows.
import { safeEqual, issueAdminSession, verifyAdminSession } from './security.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

async function ensureTable(env) {
  await env.DB.prepare(
    'CREATE TABLE IF NOT EXISTS presence (sid TEXT PRIMARY KEY, page TEXT, path TEXT, state TEXT, cart_count INTEGER, updated_at INTEGER)'
  ).run();
}

// POST /api/presence  { sid, path, page, state, cartCount }
export async function recordPresence(request, env) {
  if (!env.DB) return json({ ok: true });
  let b;
  try { b = await request.json(); } catch { return json({ ok: true }); }
  const sid = String(b.sid || '').slice(0, 40);
  if (!sid) return json({ ok: true });
  const now = Date.now();
  try {
    await ensureTable(env);
    await env.DB.prepare(
      `INSERT INTO presence (sid, page, path, state, cart_count, updated_at) VALUES (?,?,?,?,?,?)
       ON CONFLICT(sid) DO UPDATE SET page=excluded.page, path=excluded.path, state=excluded.state, cart_count=excluded.cart_count, updated_at=excluded.updated_at`
    ).bind(sid, String(b.page || '').slice(0, 60), String(b.path || '').slice(0, 120), String(b.state || 'browsing').slice(0, 20), Number(b.cartCount) || 0, now).run();
    // prune rows older than 5 min occasionally
    if ((now % 10) === 0) await env.DB.prepare('DELETE FROM presence WHERE updated_at < ?').bind(now - 300000).run();
  } catch {}
  return json({ ok: true });
}

function bearer(request) { return (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, ''); }

// GET /api/admin/live  (admin/staff auth)
export async function liveStats(request, env) {
  if (!(await verifyAdminSession(env, bearer(request)))) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ online: 0, carts: 0, checkingOut: 0, itemsInCarts: 0, pages: [], sessions: [] });
  await ensureTable(env);
  const now = Date.now();
  const cutoff = now - 60000; // active in last 60s
  const { results } = await env.DB.prepare(
    'SELECT sid, page, path, state, cart_count, updated_at FROM presence WHERE updated_at >= ? ORDER BY updated_at DESC'
  ).bind(cutoff).all();
  const rows = results || [];

  const online = rows.length;
  const carts = rows.filter((r) => (r.cart_count || 0) > 0).length;
  const checkingOut = rows.filter((r) => r.state === 'checkout').length;
  const viewingProduct = rows.filter((r) => r.state === 'product').length;
  const itemsInCarts = rows.reduce((s, r) => s + (Number(r.cart_count) || 0), 0);

  // top pages
  const pageMap = new Map();
  for (const r of rows) {
    const key = r.page || 'Browsing';
    pageMap.set(key, (pageMap.get(key) || 0) + 1);
  }
  const pages = [...pageMap.entries()].map(([page, count]) => ({ page, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  const sessions = rows.slice(0, 25).map((r) => ({
    page: r.page || 'Browsing',
    state: r.state || 'browsing',
    cartCount: Number(r.cart_count) || 0,
    ago: Math.max(0, Math.round((now - r.updated_at) / 1000)),
  }));

  return json({ online, carts, checkingOut, viewingProduct, itemsInCarts, pages, sessions });
}
