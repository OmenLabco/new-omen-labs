// Cloudflare Pages Function — POST /api/order
// Receives a checkout order and emails it to support@omenlabs.co via Resend.
//
// Required environment variables (set in Cloudflare Pages → Settings → Environment variables):
//   RESEND_API_KEY  - your Resend API key (secret)
//   ORDER_TO_EMAIL  - where orders are sent (default: support@omenlabs.co)
//   ORDER_FROM_EMAIL- verified sender on your domain (default: orders@omenlabs.co)

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const { customer = {}, items = [], total = 0 } = body;

  // Basic validation
  if (!customer.name || !customer.email || !customer.address || !customer.city || !customer.zip) {
    return json({ error: 'Missing required shipping fields.' }, 400);
  }
  if (!Array.isArray(items) || items.length === 0) {
    return json({ error: 'Cart is empty.' }, 400);
  }
  if (!env.RESEND_API_KEY) {
    return json({ error: 'Order service not configured.' }, 500);
  }

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
      <h2>New Order — Omen Labs</h2>
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
        <thead>
          <tr>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #333">Item</th>
            <th style="padding:8px;text-align:center;border-bottom:2px solid #333">Qty</th>
            <th style="padding:8px;text-align:right;border-bottom:2px solid #333">Unit</th>
            <th style="padding:8px;text-align:right;border-bottom:2px solid #333">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="text-align:right;font-size:18px;margin-top:16px">
        <strong>Total: $${Number(total).toFixed(2)}</strong>
      </p>
      <p style="color:#888;font-size:12px;margin-top:24px">
        Submitted ${new Date().toUTCString()} · For Research Use Only
      </p>
    </div>`;

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: customer.email,
      subject: `New Order — ${customer.name} — $${Number(total).toFixed(2)}`,
      html,
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    return json({ error: 'Failed to send order.', detail }, 502);
  }

  return json({ ok: true });
}
