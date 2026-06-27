// USPS tracking watcher — runs on the cron. For orders that are shipped (with a
// tracking number), polls USPS and advances status: shipped → out_for_delivery →
// delivered. No-op unless USPS_USERID is set (free USPS Web Tools credential).
const STAGES = ['shipped', 'out_for_delivery', 'delivered'];

export async function runTrackingWatch(env) {
  if (!env.DB || !env.USPS_USERID) return;
  let rows = [];
  try {
    const { results } = await env.DB.prepare(
      "SELECT order_number, tracking_number, status FROM orders WHERE tracking_number IS NOT NULL AND tracking_number != '' AND status IN ('shipped','out_for_delivery')"
    ).all();
    rows = results || [];
  } catch { return; }

  for (const o of rows) {
    try {
      const xml = `<TrackRequest USERID="${env.USPS_USERID}"><TrackID ID="${o.tracking_number}"/></TrackRequest>`;
      const url = `https://secure.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=${encodeURIComponent(xml)}`;
      const r = await fetch(url);
      const text = (await r.text()).toLowerCase();
      const m = text.match(/<tracksummary>([\s\S]*?)<\/tracksummary>/i);
      const summary = m ? m[1] : text;
      let next = null;
      if (summary.includes('delivered')) next = 'delivered';
      else if (summary.includes('out for delivery')) next = 'out_for_delivery';
      if (next && STAGES.indexOf(next) > STAGES.indexOf(o.status)) {
        await env.DB.prepare('UPDATE orders SET status = ? WHERE order_number = ?').bind(next, o.order_number).run();
      }
    } catch {}
  }
}
