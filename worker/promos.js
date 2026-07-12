// Flat promo codes (percent-off, no commission) — D1-backed and managed from
// admin. Rides the same checkout "code" input + discount path as affiliate codes.
import { verifyAdminSession } from './security.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const bearer = (req) => (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
const norm = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24);

// Legacy built-in (still honored unless overridden in D1).
export const PROMOS = {
  WELCOME10: { code: 'WELCOME10', pct: 10, firstOrderOnly: true, label: '10% off your first order' },
};

let ready = false;
async function ensureTable(env) {
  if (ready || !env.DB) return;
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS promos (code TEXT PRIMARY KEY, pct REAL, first_order_only INTEGER DEFAULT 0, active INTEGER DEFAULT 1, expires_at INTEGER, max_uses INTEGER, uses INTEGER DEFAULT 0, label TEXT, created_at INTEGER)').run();
  ready = true;
}

// Resolve a code to a promo (D1 first, then the built-in fallback). null if unknown.
export async function getPromo(env, code) {
  const c = norm(code);
  if (!c) return null;
  if (env.DB) {
    await ensureTable(env);
    const r = await env.DB.prepare('SELECT * FROM promos WHERE code = ?').bind(c).first();
    if (r) return { code: r.code, pct: Number(r.pct) || 0, firstOrderOnly: !!r.first_order_only, active: !!r.active, expiresAt: r.expires_at, maxUses: r.max_uses, uses: Number(r.uses) || 0, label: r.label };
  }
  const p = PROMOS[c];
  return p ? { ...p, active: true, uses: 0, maxUses: null, expiresAt: null } : null;
}

// Usable right now? (first-order-only is checked separately, needs email context)
export function promoUsable(p, now = Date.now()) {
  if (!p || p.active === false) return false;
  if (p.expiresAt && now > p.expiresAt) return false;
  if (p.maxUses != null && p.uses >= p.maxUses) return false;
  return true;
}

// Count a use when an order applies a promo (best effort).
export async function incrementPromoUse(env, code) {
  if (!env.DB) return;
  try { await ensureTable(env); await env.DB.prepare('UPDATE promos SET uses = uses + 1 WHERE code = ?').bind(norm(code)).run(); } catch {}
}

// ---- Admin CRUD ----
export async function listPromos(request, env) {
  if (!(await verifyAdminSession(env, bearer(request)))) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ promos: [] });
  await ensureTable(env);
  const { results } = await env.DB.prepare('SELECT * FROM promos ORDER BY created_at DESC').all();
  return json({ promos: results || [] });
}

export async function upsertPromo(request, env) {
  if (!(await verifyAdminSession(env, bearer(request)))) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ error: 'Service unavailable.' }, 500);
  await ensureTable(env);
  let b; try { b = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const code = norm(b.code);
  const pct = Math.max(1, Math.min(90, Math.round(Number(b.pct) || 0)));
  if (code.length < 3) return json({ error: 'Code must be at least 3 characters (letters/numbers).' }, 400);
  if (!Number(b.pct)) return json({ error: 'Enter a discount percent (1–90).' }, 400);
  const first = b.firstOrderOnly ? 1 : 0;
  const active = b.active === false ? 0 : 1;
  const expiresAt = b.expiresAt ? Number(b.expiresAt) : null;
  const maxUses = b.maxUses != null && b.maxUses !== '' ? Math.max(1, Math.floor(Number(b.maxUses))) : null;
  const label = String(b.label || `${pct}% off`).slice(0, 60);
  const existing = await env.DB.prepare('SELECT code FROM promos WHERE code = ?').bind(code).first();
  if (existing) {
    await env.DB.prepare('UPDATE promos SET pct=?, first_order_only=?, active=?, expires_at=?, max_uses=?, label=? WHERE code=?')
      .bind(pct, first, active, expiresAt, maxUses, label, code).run();
  } else {
    await env.DB.prepare('INSERT INTO promos (code, pct, first_order_only, active, expires_at, max_uses, uses, label, created_at) VALUES (?,?,?,?,?,?,0,?,?)')
      .bind(code, pct, first, active, expiresAt, maxUses, label, Date.now()).run();
  }
  return json({ ok: true, code });
}

export async function deletePromo(request, env) {
  if (!(await verifyAdminSession(env, bearer(request)))) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ error: 'Service unavailable.' }, 500);
  await ensureTable(env);
  let b; try { b = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  await env.DB.prepare('DELETE FROM promos WHERE code = ?').bind(norm(b.code)).run();
  return json({ ok: true });
}
