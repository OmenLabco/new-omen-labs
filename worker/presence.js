// Live presence tracking (Shopify-style "Live View").
// Visitors' browsers ping /api/presence every ~15s. We upsert one row per
// session into a D1 table; admin reads aggregated counts of sessions active in
// the last 60s. Auto-prunes stale rows.
import { safeEqual, issueAdminSession, verifyAdminSession } from './security.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

// Cache the "schema is migrated" check per isolate so we don't run ALTER on
// every heartbeat. A fresh isolate runs the migration once.
let schemaReady = false;
async function ensureTable(env) {
  if (schemaReady) return;
  await env.DB.prepare(
    'CREATE TABLE IF NOT EXISTS presence (sid TEXT PRIMARY KEY, page TEXT, path TEXT, state TEXT, cart_count INTEGER, updated_at INTEGER, lat REAL, lon REAL, country TEXT, city TEXT, region TEXT, product TEXT, cart TEXT)'
  ).run();
  // Add newer columns to tables created before they existed. ALTER throws
  // "duplicate column" once they exist — safe to ignore.
  for (const col of ['lat REAL', 'lon REAL', 'country TEXT', 'city TEXT', 'region TEXT', 'product TEXT', 'cart TEXT', 'network TEXT', 'asn INTEGER', 'bot INTEGER']) {
    try { await env.DB.prepare(`ALTER TABLE presence ADD COLUMN ${col}`).run(); } catch {}
  }
  schemaReady = true;
}

// Datacenter / hosting / commercial-VPN networks (by ASN org name) and bot user
// agents. Real shoppers browse from consumer ISPs; traffic from these is almost
// always a crawler, scraper, uptime monitor, or someone behind a VPN — none of
// which are real "visitors", so we flag and filter them out of the Live View.
const DC_RE = /(amazon|aws|google|azure|microsoft|digital ?ocean|ovh|hetzner|linode|akamai|vultr|choopa|m247|datacamp|data ?camp|leaseweb|contabo|cherry ?servers|hostinger|constant company|nforce|worldstream|scaleway|oracle|equinix|cogent|hostwinds|ip volume|psychz|quadranet|colocrossing|frantech|buyvm|clouvider|nordvpn|mullvad|surfshark|express ?vpn|cyberghost|proton|tefincom|private internet|pia |zscaler|fastly|cloudflare|alibaba|tencent|g-?core|stark|censys|shodan|palo alto|bytedance|datacenter|hosting|colo|server|vpn|proxy)/i;
const UA_RE = /(bot|crawl|spider|slurp|headless|python|curl|wget|http[-_]?client|monitor|uptime|scan|censys|shodan|semrush|ahrefs|bingpreview|facebookexternal|preview|lighthouse|gtmetrix|pingdom)/i;

function detectBot(request, network) {
  const ua = request.headers.get('User-Agent') || '';
  if (UA_RE.test(ua)) return 1;
  if (network && DC_RE.test(network)) return 1;
  return 0;
}

// Read the visitor's approximate location from Cloudflare's edge geo (request.cf).
// lat/lon are strings on request.cf — parse defensively; any field may be absent
// (local dev, Tor/VPN, privacy-masked IPs).
function readGeo(request) {
  const cf = request.cf || {};
  const lat = cf.latitude != null ? Number.parseFloat(cf.latitude) : null;
  const lon = cf.longitude != null ? Number.parseFloat(cf.longitude) : null;
  return {
    lat: Number.isFinite(lat) ? lat : null,
    lon: Number.isFinite(lon) ? lon : null,
    country: (cf.country || '').slice(0, 2) || null,
    city: (cf.city || '').slice(0, 60) || null,
    region: (cf.region || '').slice(0, 60) || null,
    network: (cf.asOrganization || '').slice(0, 80) || null,
    asn: cf.asn != null ? Number(cf.asn) || null : null,
  };
}

// POST /api/presence  { sid, path, page, state, cartCount }
function relAgo(ms) {
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

// GET /api/social-proof — recent purchases + live viewer count (public, no PII).
export async function socialProof(request, env) {
  if (!env.DB) return json({ recent: [], online: 0 });
  const now = Date.now();
  let online = 0;
  try {
    await ensureTable(env);
    const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM presence WHERE updated_at >= ? AND (bot IS NULL OR bot = 0)').bind(now - 60000).first();
    online = r ? Number(r.n) : 0;
  } catch {}
  const recent = [];
  try {
    const { results } = await env.DB.prepare("SELECT items, created_date FROM orders WHERE status != 'awaiting_payment' ORDER BY id DESC LIMIT 8").all();
    for (const o of results || []) {
      let items = []; try { items = JSON.parse(o.items || '[]'); } catch {}
      const first = items[0];
      const name = first && first.product_name;
      const pid = (first && first.product_id) || '';
      // Skip the internal test product so it never shows as social proof.
      if (!name || /^test-item/i.test(pid) || /test item/i.test(name)) continue;
      const t = o.created_date ? new Date(o.created_date).getTime() : now;
      recent.push({ product: name, ago: relAgo(Math.max(0, now - t)) });
    }
  } catch {}
  return json({ recent, online });
}

export async function recordPresence(request, env) {
  if (!env.DB) return json({ ok: true });
  let b;
  try { b = await request.json(); } catch { return json({ ok: true }); }
  const sid = String(b.sid || '').slice(0, 40);
  if (!sid) return json({ ok: true });
  const now = Date.now();
  const geo = readGeo(request);
  try {
    await ensureTable(env);
    const product = b.product ? String(b.product).slice(0, 80) : null;
    // Compact cart summary [{n:name,q:qty}] as JSON (already capped client-side).
    let cartJson = null;
    if (Array.isArray(b.cartItems) && b.cartItems.length) {
      cartJson = JSON.stringify(b.cartItems.slice(0, 20).map((i) => ({ n: String(i.n || 'Item').slice(0, 60), q: Number(i.q) || 0 }))).slice(0, 2000);
    }
    const bot = detectBot(request, geo.network);
    await env.DB.prepare(
      `INSERT INTO presence (sid, page, path, state, cart_count, updated_at, lat, lon, country, city, region, product, cart, network, asn, bot) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(sid) DO UPDATE SET page=excluded.page, path=excluded.path, state=excluded.state, cart_count=excluded.cart_count, updated_at=excluded.updated_at, lat=excluded.lat, lon=excluded.lon, country=excluded.country, city=excluded.city, region=excluded.region, product=excluded.product, cart=excluded.cart, network=excluded.network, asn=excluded.asn, bot=excluded.bot`
    ).bind(sid, String(b.page || '').slice(0, 60), String(b.path || '').slice(0, 120), String(b.state || 'browsing').slice(0, 20), Number(b.cartCount) || 0, now, geo.lat, geo.lon, geo.country, geo.city, geo.region, product, cartJson, geo.network, geo.asn, bot).run();
    // prune rows older than 5 min occasionally
    if ((now % 10) === 0) await env.DB.prepare('DELETE FROM presence WHERE updated_at < ?').bind(now - 300000).run();
  } catch {}
  return json({ ok: true });
}

function bearer(request) { return (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, ''); }

// GET /api/admin/live  (admin/staff auth)
export async function liveStats(request, env) {
  if (!(await verifyAdminSession(env, bearer(request)))) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ online: 0, carts: 0, checkingOut: 0, itemsInCarts: 0, pages: [], sessions: [], products: [], cartContents: [], locations: [], countries: [] });
  await ensureTable(env);
  const now = Date.now();
  const cutoff = now - 60000; // active in last 60s
  const { results } = await env.DB.prepare(
    'SELECT sid, page, path, state, cart_count, updated_at, lat, lon, country, city, region, product, cart, network, asn, bot FROM presence WHERE updated_at >= ? ORDER BY updated_at DESC'
  ).bind(cutoff).all();
  const all = results || [];
  // Real shoppers only — datacenter / VPN / crawler traffic is filtered out.
  const rows = all.filter((r) => !r.bot);
  const bots = all.length - rows.length;

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
    product: r.product || null,
    state: r.state || 'browsing',
    cartCount: Number(r.cart_count) || 0,
    city: r.city || null,
    country: r.country || null,
    network: r.network || null,
    ago: Math.max(0, Math.round((now - r.updated_at) / 1000)),
  }));

  // Which products are being viewed right now (one entry per product, live count).
  const prodMap = new Map();
  for (const r of rows) {
    if (!r.product) continue;
    prodMap.set(r.product, (prodMap.get(r.product) || 0) + 1);
  }
  const products = [...prodMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 12);

  // What's actually in carts right now: sum quantities per product across all
  // active carts, and count how many distinct carts contain each product.
  const cartMap = new Map();
  for (const r of rows) {
    if (!r.cart) continue;
    let items;
    try { items = JSON.parse(r.cart); } catch { continue; }
    if (!Array.isArray(items)) continue;
    for (const it of items) {
      const name = String(it.n || 'Item').slice(0, 60);
      const qty = Number(it.q) || 0;
      if (qty <= 0) continue;
      const cur = cartMap.get(name);
      if (cur) { cur.qty += qty; cur.carts += 1; }
      else cartMap.set(name, { name, qty, carts: 1 });
    }
  }
  const cartContents = [...cartMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 20);

  // Geo: cluster active sessions by city so the globe plots one marker per place
  // (with a live count), and roll up a country breakdown for the list.
  const locMap = new Map();
  const countryMap = new Map();
  for (const r of rows) {
    if (r.country) countryMap.set(r.country, (countryMap.get(r.country) || 0) + 1);
    if (!Number.isFinite(r.lat) || !Number.isFinite(r.lon)) continue;
    const key = `${r.city || ''}|${r.country || ''}|${r.lat.toFixed(1)},${r.lon.toFixed(1)}`;
    const cur = locMap.get(key);
    if (cur) cur.count += 1;
    else locMap.set(key, { lat: r.lat, lon: r.lon, city: r.city || null, region: r.region || null, country: r.country || null, network: r.network || null, count: 1 });
  }
  const locations = [...locMap.values()].sort((a, b) => b.count - a.count).slice(0, 30);
  const countries = [...countryMap.entries()].map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count).slice(0, 12);

  return json({ online, bots, carts, checkingOut, viewingProduct, itemsInCarts, pages, sessions, products, cartContents, locations, countries });
}
