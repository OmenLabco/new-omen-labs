// Email capture → subscribers list. Signup hands back the WELCOME10 code.
import { verifyAdminSession } from './security.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const bearer = (req) => (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let schemaReady = false;
async function ensureTable(env) {
  if (schemaReady || !env.DB) return;
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS subscribers (email TEXT PRIMARY KEY, source TEXT, created_at INTEGER)').run();
  schemaReady = true;
}

// POST /api/subscribe  { email, source? }
export async function handleSubscribe(request, env) {
  if (!env.DB) return json({ ok: true, code: 'WELCOME10' });
  let b; try { b = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const email = String(b.email || '').trim().toLowerCase().slice(0, 160);
  if (!EMAIL_RE.test(email)) return json({ error: 'Enter a valid email.' }, 400);
  try {
    await ensureTable(env);
    await env.DB.prepare(
      'INSERT INTO subscribers (email, source, created_at) VALUES (?,?,?) ON CONFLICT(email) DO NOTHING'
    ).bind(email, String(b.source || 'popup').slice(0, 40), Date.now()).run();
  } catch {}
  return json({ ok: true, code: 'WELCOME10', discountPct: 10 });
}

// GET /api/admin/subscribers  (admin)
export async function listSubscribers(request, env) {
  if (!(await verifyAdminSession(env, bearer(request)))) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ subscribers: [] });
  await ensureTable(env);
  const { results } = await env.DB.prepare('SELECT email, source, created_at FROM subscribers ORDER BY created_at DESC').all();
  return json({ subscribers: results || [] });
}
