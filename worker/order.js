// Order handler — saves the order to D1 (if configured) and emails it via Resend (if configured).
//
// Environment:
//   DB               - D1 database binding (optional; orders saved if present)
//   RESEND_API_KEY   - Resend API key (optional; email sent if present)
//   ORDER_TO_EMAIL   - where orders are sent (default: support@omenlabs.co)
//   ORDER_FROM_EMAIL - verified sender (default: Omen Labs Orders <orders@omenlabs.co>)

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

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

  // 2) Email via Resend if configured (best effort — order is already saved)
  if (env.RESEND_API_KEY) {
    const to = env.ORDER_TO_EMAIL || 'support@omenlabs.co';
    const from = env.ORDER_FROM_EMAIL || 'Omen Labs Orders <orders@omenlabs.co>';

    const rows = items
      .map(
        (i) => `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${esc(i.product_name)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${esc(i.quantity)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${Number(i.price).toFixed(2)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${(Number(i.price) * Number(i.quantity)).toFixed(2)}</td>
        </tr>`
      )
      .join('');

    const html = `
      <div style="font-family:system-ui,Arial,sans-serif;max-width:640px;margin:0 auto;color:#111">
        <h2>New Order — ${esc(order_number)}</h2>
        <h3>Customer</h3>
        <p>
          <strong>${esc(customer.name)}</strong><br/>
          ${esc(customer.email)}${customer.phone ? ' · ' + esc(customer.phone) : ''}<br/>
          ${esc(customer.address)}${customer.address2 ? ', ' + esc(customer.address2) : ''}<br/>
          ${esc(customer.city)}, ${esc(customer.state || '')} ${esc(customer.zip)}<br/>
          ${esc(customer.country || 'United States')}
        </p>
        ${customer.notes ? `<p><strong>Notes:</strong> ${esc(customer.notes)}</p>` : ''}
        <h3>Order</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead><tr>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #333">Item</th>
            <th style="padding:8px;text-align:center;border-bottom:2px solid #333">Qty</th>
            <th style="padding:8px;text-align:right;border-bottom:2px solid #333">Unit</th>
            <th style="padding:8px;text-align:right;border-bottom:2px solid #333">Subtotal</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="text-align:right;font-size:18px;margin-top:16px"><strong>Total: $${Number(total).toFixed(2)}</strong></p>
        <p style="color:#888;font-size:12px;margin-top:24px">${created_date} · For Research Use Only</p>
      </div>`;

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: customer.email,
          subject: `New Order ${order_number} — ${customer.name} — $${Number(total).toFixed(2)}`,
          html,
        }),
      });
    } catch {
      // ignore email failure; order is saved
    }
  }

  // If neither storage nor email is configured, the order has nowhere to go.
  if (!env.DB && !env.RESEND_API_KEY) {
    return json({ error: 'Order service not configured.' }, 500);
  }

  return json({ ok: true, order_number });
}
