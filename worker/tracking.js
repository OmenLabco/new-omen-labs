// Tracking watcher — runs on the cron. For shipped orders (with a tracking
// number), polls the carrier and advances status: shipped → out_for_delivery →
// delivered.
//
// Preferred source: Shippo (free, easy signup) via SHIPPO_API_KEY.
// Fallback: USPS Web Tools via USPS_USERID (if you ever get one).
const STAGES = ['shipped', 'out_for_delivery', 'delivered'];

async function shippoStatus(env, tracking) {
  // GET /tracks/{carrier}/{tracking_number}
  const r = await fetch(`https://api.goshippo.com/tracks/usps/${encodeURIComponent(tracking)}`, {
    headers: { Authorization: `ShippoToken ${env.SHIPPO_API_KEY}` },
  });
  if (!r.ok) return null;
  const d = await r.json();
  const status = (d?.tracking_status?.status || '').toUpperCase();
  const sub = (d?.tracking_status?.substatus?.code || '').toLowerCase();
  if (status === 'DELIVERED') return 'delivered';
  if (sub.includes('out_for_delivery') || sub.includes('out for delivery')) return 'out_for_delivery';
  return null; // still in transit → leave as shipped
}

async function uspsStatus(env, tracking) {
  const xml = `<TrackRequest USERID="${env.USPS_USERID}"><TrackID ID="${tracking}"/></TrackRequest>`;
  const r = await fetch(`https://secure.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=${encodeURIComponent(xml)}`);
  const text = (await r.text()).toLowerCase();
  const m = text.match(/<tracksummary>([\s\S]*?)<\/tracksummary>/i);
  const summary = m ? m[1] : text;
  if (summary.includes('delivered')) return 'delivered';
  if (summary.includes('out for delivery')) return 'out_for_delivery';
  return null;
}

export async function runTrackingWatch(env) {
  if (!env.DB) return;
  const useShippo = !!env.SHIPPO_API_KEY;
  const useUsps = !env.SHIPPO_API_KEY && !!env.USPS_USERID;
  if (!useShippo && !useUsps) return;

  let rows = [];
  try {
    const { results } = await env.DB.prepare(
      "SELECT order_number, tracking_number, status FROM orders WHERE tracking_number IS NOT NULL AND tracking_number != '' AND status IN ('shipped','out_for_delivery')"
    ).all();
    rows = results || [];
  } catch { return; }

  for (const o of rows) {
    try {
      const next = useShippo ? await shippoStatus(env, o.tracking_number) : await uspsStatus(env, o.tracking_number);
      if (next && STAGES.indexOf(next) > STAGES.indexOf(o.status)) {
        await env.DB.prepare('UPDATE orders SET status = ? WHERE order_number = ?').bind(next, o.order_number).run();
      }
    } catch {}
  }
}
