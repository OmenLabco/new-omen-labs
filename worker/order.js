// Order handler — saves the order to D1 (if configured) and sends branded emails via Resend.
//
// Environment:
//   DB               - D1 database binding (optional; orders saved if present)
//   RESEND_API_KEY   - Resend API key (optional; emails sent if present)
//   ORDER_TO_EMAIL   - owner notification inbox (default: support@omenlabs.co)
//   ORDER_FROM_EMAIL - verified sender (default: Omen Labs <orders@omenlabs.co>)

import { renderImageEmail, renderOwnerNotification, sendEmail } from './email.js';
import { signOrder } from './token.js';

const SITE = 'https://omenlabs.co';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function orderNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `OMEN-${code}`;
}

export async function handleOrder(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const { customer = {}, items = [], total = 0 } = body;

  if (!customer.name || !customer.email || !customer.address || !customer.city || !customer.zip) {
    return json({ error: 'Missing required shipping fields.' }, 400);
  }
  if (!Array.isArray(items) || items.length === 0) {
    return json({ error: 'Cart is empty.' }, 400);
  }

  const order_number = orderNumber();
  const created_date = new Date().toISOString();

  // 1) Save to D1 if available (source of truth for the admin page)
  if (env.DB) {
    try {
      await env.DB.prepare(
        `INSERT INTO orders
         (order_number, customer_name, customer_email, customer_phone, address, address2, city, state, zip, country, notes, items, total, status, created_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      )
        .bind(
          order_number,
          customer.name,
          customer.email,
          customer.phone || '',
          customer.address,
          customer.address2 || '',
          customer.city,
          customer.state || '',
          customer.zip,
          customer.country || 'United States',
          customer.notes || '',
          JSON.stringify(items),
          Number(total),
          'processing',
          created_date
        )
        .run();
    } catch (e) {
      return json({ error: 'Failed to save order.', detail: String(e) }, 500);
    }
  }

  // Build an order object for the email templates
  const order = {
    order_number,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone || '',
    address: customer.address,
    address2: customer.address2 || '',
    city: customer.city,
    state: customer.state || '',
    zip: customer.zip,
    country: customer.country || 'United States',
    notes: customer.notes || '',
    items,
    total: Number(total),
  };

  // 2) Emails via Resend (best effort — order is already saved)
  if (env.RESEND_API_KEY) {
    const ownerInbox = env.ORDER_TO_EMAIL || 'support@omenlabs.co';
    const token = await signOrder(order_number, env.ADMIN_PASSWORD);
    const imageUrl = `${SITE}/api/receipt-image?o=${encodeURIComponent(order_number)}&t=${token}&type=confirmation`;
    // Customer confirmation (image receipt — navy in all email clients)
    await sendEmail(env, {
      to: customer.email,
      subject: `Order Confirmed — ${order_number}`,
      html: renderImageEmail({ imageUrl, order }),
    });
    // Owner notification with full shipping details
    await sendEmail(env, {
      to: ownerInbox,
      subject: `New Order ${order_number} — ${customer.name} — $${Number(total).toFixed(2)}`,
      html: renderOwnerNotification(order),
      replyTo: customer.email,
    });
  }

  if (!env.DB && !env.RESEND_API_KEY) {
    return json({ error: 'Order service not configured.' }, 500);
  }

  return json({ ok: true, order_number });
}
