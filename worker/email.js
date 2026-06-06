// Shared branded HTML email templates for Omen Labs (recreates the Base44 order email design).

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

// Customer-facing status messages
export const STATUS_MESSAGE = {
  processing: "Your order has been received and is being processed. You'll receive a shipping notification once your compounds are dispatched.",
  confirmed: 'Your order has been confirmed and is being prepared for shipment.',
  shipped: 'Good news — your order is on its way!',
  out_for_delivery: 'Your order is out for delivery and should arrive today.',
  delivered: 'Your order has been delivered. Thank you for choosing Omen Labs.',
};

function layout(inner) {
  return `<!doctype html>
<html>
<body style="margin:0;background:#f4f4f5;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e6e9">
      <tr><td style="background:#0a0c14;padding:26px 32px;text-align:center">
        <span style="color:#ffffff;font-size:13px;letter-spacing:6px;font-weight:600">OMEN&nbsp;LABS</span>
      </td></tr>
      <tr><td style="padding:32px">${inner}</td></tr>
      <tr><td style="padding:18px 32px;border-top:1px solid #eeeeee;text-align:center">
        <span style="color:#9a9aa2;font-size:10px;letter-spacing:1.5px;text-transform:uppercase">For Research Use Only — Not for Human Consumption</span>
      </td></tr>
    </table>
    <p style="color:#b0b0b6;font-size:11px;margin-top:16px">© ${new Date().getFullYear()} Omen Labs · omenlabs.co</p>
  </td></tr></table>
</body>
</html>`;
}

function orderNumberBlock(order) {
  return `<div style="background:#f4f4f5;border-radius:10px;padding:16px;text-align:center;margin:24px 0">
    <div style="font-size:11px;letter-spacing:1.5px;color:#8a8a90;text-transform:uppercase">Order Number</div>
    <div style="font-size:20px;font-weight:700;font-family:'SF Mono',Menlo,monospace;margin-top:6px;color:#0a0c14">${esc(order.order_number)}</div>
  </div>`;
}

function itemsTable(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#222">${esc(i.product_name || i.name)} <span style="color:#999">× ${esc(i.quantity)}</span></td>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#222;text-align:right">$${(Number(i.price) * Number(i.quantity)).toFixed(2)}</td>
      </tr>`
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px">
      ${rows}
      <tr>
        <td style="padding:14px 0 0;font-size:15px;font-weight:700;color:#0a0c14">Total</td>
        <td style="padding:14px 0 0;font-size:15px;font-weight:700;color:#0a0c14;text-align:right">$${Number(order.total).toFixed(2)}</td>
      </tr>
    </table>`;
}

const h1 = (t) => `<h1 style="font-size:24px;font-weight:700;color:#0a0c14;margin:0 0 8px">${esc(t)}</h1>`;
const para = (t) => `<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 4px">${t}</p>`;

// Customer order confirmation — recreates the Base44 "Order Confirmed" email
export function renderOrderConfirmation(order) {
  return layout(`
    ${h1('Order Confirmed')}
    ${para(`Hi ${esc(order.customer_name || 'there')},`)}
    ${para("Your order has been received and is being processed. You'll receive a shipping notification once your compounds are dispatched.")}
    ${orderNumberBlock(order)}
    ${itemsTable(order)}
  `);
}

// Customer status update email
export function renderStatusUpdate(order, status) {
  const label = (status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const msg = STATUS_MESSAGE[status] || `Your order status is now: ${esc(label)}.`;
  const tracking = order.tracking_number
    ? `<div style="background:#f4f4f5;border-radius:10px;padding:14px 16px;margin:20px 0">
        <span style="font-size:11px;letter-spacing:1px;color:#8a8a90;text-transform:uppercase">Tracking Number</span><br/>
        <span style="font-size:15px;font-family:'SF Mono',Menlo,monospace;color:#0a0c14">${esc(order.tracking_number)}</span>
      </div>`
    : '';
  return layout(`
    ${h1(label)}
    ${para(`Hi ${esc(order.customer_name || 'there')},`)}
    ${para(esc(msg))}
    ${tracking}
    ${orderNumberBlock(order)}
    ${itemsTable(order)}
  `);
}

// Internal owner notification (sent to support@) with full shipping details
export function renderOwnerNotification(order) {
  const c = order;
  return layout(`
    ${h1('New Order Received')}
    ${orderNumberBlock(order)}
    <p style="font-size:13px;letter-spacing:1px;color:#8a8a90;text-transform:uppercase;margin:0 0 6px">Customer</p>
    ${para(`<strong>${esc(c.customer_name)}</strong>`)}
    ${para(`${esc(c.customer_email)}${c.customer_phone ? ' · ' + esc(c.customer_phone) : ''}`)}
    ${para(`${esc(c.address)}${c.address2 ? ', ' + esc(c.address2) : ''}`)}
    ${para(`${esc(c.city)}, ${esc(c.state || '')} ${esc(c.zip)}`)}
    ${para(esc(c.country || 'United States'))}
    ${c.notes ? para(`<strong>Notes:</strong> ${esc(c.notes)}`) : ''}
    ${itemsTable(order)}
  `);
}

// Helper to send via Resend
export async function sendEmail(env, { to, subject, html, replyTo }) {
  if (!env.RESEND_API_KEY) return;
  const from = env.ORDER_FROM_EMAIL || 'Omen Labs <orders@omenlabs.co>';
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
  } catch {
    // best effort
  }
}
