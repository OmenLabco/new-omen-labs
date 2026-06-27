// Tracking watcher — runs on the cron. For shipped orders (with a tracking
// number), polls the carrier and advances status: shipped → out_for_delivery →
// delivered.
//
// Preferred source: Shippo (free, easy signup) via SHIPPO_API_KEY.
// Fallback: USPS Web Tools via USPS_USERID (if you ever get one).
import { sendEmail } from './email.js';

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
        // Email the customer when it's delivered
        if (next === 'delivered' && env.RESEND_API_KEY) {
          try {
            const row = await env.DB.prepare('SELECT customer_email FROM orders WHERE order_number = ?').bind(o.order_number).first();
            if (row?.customer_email) {
              await sendEmail(env, {
                to: row.customer_email,
                subject: `Delivered 🎉 — Order ${o.order_number}`,
                html: `<div style="font-family:Arial,sans-serif;background:#0a0a0b;color:#e8e8ea;padding:28px;border-radius:12px;max-width:520px;margin:auto;">
                  <p style="letter-spacing:.2em;text-transform:uppercase;color:#7c83ff;font-size:12px;margin:0 0 12px;">Omen Labs</p>
                  <h2 style="color:#fff;margin:0 0 8px;">Your order was delivered 🎉</h2>
                  <p style="color:#a9abb3;font-size:14px;">Order <b style="color:#fff;">${o.order_number}</b> has been delivered. Thanks for choosing Omen Labs.</p>
                  <p style="color:#a9abb3;font-size:13px;">If anything arrived damaged or incorrect, reply within 7 days and we'll make it right.</p>
                  <p style="color:#6b6d77;font-size:11px;margin-top:20px;">Research Use Only — Not for Human Consumption · support@omenlabs.co</p>
                </div>`,
              });
            }
          } catch {}
        }
      }
    } catch {}
  }
}
