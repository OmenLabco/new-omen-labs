// Site traffic analytics — an append-only pageview log (distinct from the
// live `presence` table, which only keeps each session's CURRENT state).
// Every public page view logs one row: timestamp, session, path, traffic
// source (parsed from referrer / utm_source), country, and a bot flag.
// The admin Traffic tab aggregates this into daily / weekly / monthly totals
// and a "where from" breakdown. The owner is excluded client-side (Layout
// skips logging when signed into admin), and bots are filtered out of stats.
import { verifyAdminSession } from './security.js';
import { readGeo, detectBot } from './presence.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const bearer = (req) => (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');

let schemaReady = false;
async function ensureTable(env) {
  if (schemaReady || !env.DB) return;
  await env.DB.prepare(
    'CREATE TABLE IF NOT EXISTS page_hits (id INTEGER PRIMARY KEY AUTOINCREMENT, sid TEXT, ts INTEGER, path TEXT, source TEXT, referrer TEXT, country TEXT, bot INTEGER DEFAULT 0)'
  ).run();
  try { await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_page_hits_ts ON page_hits(ts)').run(); } catch {}
  schemaReady = true;
}

// Map a referrer URL (or an explicit utm_source) to a tidy traffic-source label.
export function parseSource(referrer, utm) {
  const u = String(utm || '').trim().toLowerCase();
  if (u) {
    const map = { ig: 'Instagram', instagram: 'Instagram', fb: 'Facebook', facebook: 'Facebook', tiktok: 'TikTok', tt: 'TikTok', reddit: 'Reddit', twitter: 'X (Twitter)', x: 'X (Twitter)', google: 'Google', bing: 'Bing', youtube: 'YouTube', yt: 'YouTube', email: 'Email', newsletter: 'Email' };
    return map[u] || (u.charAt(0).toUpperCase() + u.slice(1)).slice(0, 40);
  }
  const ref = String(referrer || '').trim();
  if (!ref) return 'Direct';
  let host = '';
  try { host = new URL(ref).hostname.toLowerCase().replace(/^www\./, ''); } catch { return 'Direct'; }
  if (!host) return 'Direct';
  if (host.endsWith('omenlabs.co')) return 'Direct'; // internal navigation
  const rules = [
    [/(^|\.)google\./, 'Google'],
    [/(^|\.)bing\./, 'Bing'],
    [/duckduckgo\./, 'DuckDuckGo'],
    [/(^|\.)instagram\.com$|l\.instagram\.com$/, 'Instagram'],
    [/(^|\.)facebook\.com$|(^|\.)fb\.(com|me)$|l\.facebook\.com$/, 'Facebook'],
    [/(^|\.)tiktok\.com$/, 'TikTok'],
    [/(^|\.)reddit\.com$|out\.reddit\.com$/, 'Reddit'],
    [/(^|\.)x\.com$|(^|\.)twitter\.com$|t\.co$/, 'X (Twitter)'],
    [/(^|\.)youtube\.com$|youtu\.be$/, 'YouTube'],
    [/(^|\.)t\.me$|telegram\./, 'Telegram'],
    [/(^|\.)pinterest\./, 'Pinterest'],
    [/(^|\.)yahoo\./, 'Yahoo'],
  ];
  for (const [re, label] of rules) if (re.test(host)) return label;
  return host.slice(0, 40); // unknown referrer — show the domain
}

// POST /api/pageview  { sid, path, ref, utm }  (public)
export async function recordPageview(request, env) {
  if (!env.DB) return json({ ok: true });
  let b; try { b = await request.json(); } catch { return json({ ok: true }); }
  const sid = String(b.sid || '').slice(0, 40);
  const path = String(b.path || '').slice(0, 120);
  if (!sid || !path) return json({ ok: true });
  if (path.startsWith('/admin')) return json({ ok: true, skipped: 'admin' });
  await ensureTable(env);
  const geo = readGeo(request);
  const bot = detectBot(request, geo.network);
  const source = parseSource(b.ref, b.utm);
  const referrer = String(b.ref || '').slice(0, 300);
  const now = Date.now();
  try {
    await env.DB.prepare(
      'INSERT INTO page_hits (sid, ts, path, source, referrer, country, bot) VALUES (?,?,?,?,?,?,?)'
    ).bind(sid, now, path, source, referrer, geo.country, bot).run();
    // Occasional prune — keep ~180 days of history.
    if ((now % 50) === 0) await env.DB.prepare('DELETE FROM page_hits WHERE ts < ?').bind(now - 180 * 86400000).run();
  } catch {}
  return json({ ok: true });
}

// GET /api/admin/traffic  (admin) — totals, daily series, and top sources.
export async function trafficStats(request, env) {
  if (!(await verifyAdminSession(env, bearer(request)))) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({});
  await ensureTable(env);
  const now = Date.now();
  const DAY = 86400000;

  const windowTotals = async (sinceMs) => {
    const where = sinceMs ? 'WHERE bot = 0 AND ts >= ?' : 'WHERE bot = 0';
    const binds = sinceMs ? [sinceMs] : [];
    let row;
    try {
      row = await env.DB.prepare(
        `SELECT COUNT(*) AS views, COUNT(DISTINCT sid) AS visitors FROM page_hits ${where}`
      ).bind(...binds).first();
    } catch { row = null; }
    return { views: Number(row?.views) || 0, visitors: Number(row?.visitors) || 0 };
  };

  // Local "today" is approximated in UTC; good enough for an at-a-glance count.
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const [today, d7, d30, all] = await Promise.all([
    windowTotals(startOfToday.getTime()),
    windowTotals(now - 7 * DAY),
    windowTotals(now - 30 * DAY),
    windowTotals(null),
  ]);

  // Daily series — last 30 days, grouped by UTC date.
  let daily = [];
  try {
    const res = await env.DB.prepare(
      `SELECT strftime('%Y-%m-%d', ts/1000, 'unixepoch') AS date,
              COUNT(*) AS views, COUNT(DISTINCT sid) AS visitors
       FROM page_hits
       WHERE bot = 0 AND ts >= ?
       GROUP BY date ORDER BY date ASC`
    ).bind(now - 30 * DAY).all();
    daily = (res.results || []).map((r) => ({ date: r.date, views: Number(r.views) || 0, visitors: Number(r.visitors) || 0 }));
  } catch { daily = []; }

  // Top sources over the last 30 days (by distinct visitors).
  let sources = [];
  try {
    const res = await env.DB.prepare(
      `SELECT COALESCE(source, 'Direct') AS source,
              COUNT(DISTINCT sid) AS visitors, COUNT(*) AS views
       FROM page_hits
       WHERE bot = 0 AND ts >= ?
       GROUP BY source ORDER BY visitors DESC LIMIT 15`
    ).bind(now - 30 * DAY).all();
    sources = (res.results || []).map((r) => ({ source: r.source, visitors: Number(r.visitors) || 0, views: Number(r.views) || 0 }));
  } catch { sources = []; }

  // Top pages over the last 30 days.
  let pages = [];
  try {
    const res = await env.DB.prepare(
      `SELECT path, COUNT(*) AS views, COUNT(DISTINCT sid) AS visitors
       FROM page_hits
       WHERE bot = 0 AND ts >= ?
       GROUP BY path ORDER BY views DESC LIMIT 10`
    ).bind(now - 30 * DAY).all();
    pages = (res.results || []).map((r) => ({ path: r.path, views: Number(r.views) || 0, visitors: Number(r.visitors) || 0 }));
  } catch { pages = []; }

  return json({ totals: { today, d7, d30, all }, daily, sources, pages });
}
