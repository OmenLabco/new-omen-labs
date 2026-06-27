// ShipStation integration.
//  • pushToShipStation(env, order)  — sends a paid order into ShipStation so you
//    can buy/print the label. No-ops unless SHIPSTATION_API_KEY/SECRET are set.
//  • handleShipstationWebhook       — ShipStation calls this when a label is
//    created (SHIP_NOTIFY); we mark the order shipped + save tracking + email.
import { sendEmail } from './email.js';
import { safeEqual, zelleSecret } from './security.js';

const SS = 'https://ssapi.shipstation.com';
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

function ssAuth(env) {
  return 'Basic ' + btoa(`${env.SHIPSTATION_API_KEY}:${env.SHIPSTATION_API_SECRET}`);
}
function ssEnabled(env) {
  return !!(env.SHIPSTATION_API_KEY && env.SHIPSTATION_API_SECRET);
}

export async function pushToShipStation(env, order) {
  if (!ssEnabled(env) || !order) return;
  try {
    const items = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : (order.items || []);
    const body = {
      orderNumber: order.order_number,
      orderDate: order.created_date || new Date().toISOString(),
      orderStatus: 'awaiting_shipment',
      customerEmail: order.customer_email || undefined,
      billTo: { name: order.customer_name || 'Customer' },
      shipTo: {
        name: order.customer_name || 'Customer',
        street1: order.address || '',
        street2: order.address2 || null,
        city: order.city || '',
        state: order.state || '',
        postalCode: order.zip || '',
        country: order.country === 'United States' || !order.country ? 'US' : order.country,
        phone: order.customer_phone || null,
      },
      items: (items || []).map((i) => ({
        sku: i.product_id || '',
        name: i.product_name || i.name || 'Item',
        quantity: Number(i.quantity) || 1,
        unitPrice: Number(i.price) || 0,
      })),
      amountPaid: Number(order.total) || 0,
    };
    await fetch(`${SS}/orders/createorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: ssAuth(env) },
      body: JSON.stringify(body),
    });
  } catch {}
}

// ShipStation webhook (configure URL with ?key=<shipstation secret> in their UI).
export async function handleShipstationWebhook(request, env) {
  if (!env.DB) return json({ ok: true });
  const url = new URL(request.url);
  const provided = url.searchParams.get('key') || '';
  const expected = await zelleSecret(env); // reuse the same derived secret scheme
  if (!(await safeEqual(provided, expected))) return json({ error: 'Unauthorized' }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ ok: true }); }
  if (!body.resource_url) return json({ ok: true });

  try {
    const r = await fetch(body.resource_url, { headers: { Authorization: ssAuth(env) } });
    const d = await r.json();
    const shipments = d.shipments || [];
    for (const s of shipments) {
      if (!s.orderNumber || !s.trackingNumber) continue;
      const prev = await env.DB.prepare('SELECT status FROM orders WHERE order_number = ?').bind(s.orderNumber).first();
      await env.DB.prepare("UPDATE orders SET status = 'shipped', tracking_number = ? WHERE order_number = ?")
        .bind(s.trackingNumber, s.orderNumber).run();
      // notify customer once
      if (env.RESEND_API_KEY && prev && prev.status !== 'shipped') {
        const row = await env.DB.prepare('SELECT customer_email, customer_name FROM orders WHERE order_number = ?').bind(s.orderNumber).first();
        if (row?.customer_email) {
          await sendEmail(env, {
            to: row.customer_email,
            subject: `Your Omen Labs order has shipped — ${s.orderNumber}`,
            html: `<div style="font-family:Arial,sans-serif;background:#0a0a0b;color:#e8e8ea;padding:28px;border-radius:12px;max-width:520px;margin:auto;">
              <p style="letter-spacing:.2em;text-transform:uppercase;color:#7c83ff;font-size:12px;margin:0 0 12px;">Omen Labs</p>
              <h2 style="color:#fff;margin:0 0 8px;">Your order is on its way 📦</h2>
              <p style="color:#a9abb3;font-size:14px;">Order <b style="color:#fff;">${s.orderNumber}</b> has shipped.</p>
              <p style="color:#a9abb3;font-size:14px;">Tracking: <b style="color:#fff;">${s.trackingNumber}</b>${s.carrierCode ? ` (${s.carrierCode.toUpperCase()})` : ''}</p>
              <p style="color:#6b6d77;font-size:11px;margin-top:20px;">Research Use Only — Not for Human Consumption</p>
            </div>`,
          });
        }
      }
    }
  } catch {}
  return json({ ok: true });
}
