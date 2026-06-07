// Branded HTML email templates for Omen Labs — exact recreation of the Base44 design.

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

export const STATUS_MESSAGE = {
  processing: "Your order has been received and is being processed. You'll receive a shipping notification once your compounds are dispatched.",
  confirmed: 'Your order has been confirmed and is being prepared for shipment.',
  shipped: 'Good news — your order is on its way! Use the tracking number below to follow its progress.',
  out_for_delivery: 'Your order is out for delivery and should arrive today.',
  delivered: 'Your order has been delivered. Thank you for choosing Omen Labs.',
};

// Base44 palette
const C = {
  bg: '#0a0c14',
  card: '#0d1020',
  border: '#1e2030',
  panel: '#111525',
  blue: '#5a82ff',
  white: '#ffffff',
  muted: '#8892b0',
  text: '#c8cce0',
  foot: '#3a3f55',
};
const MONO = "'Courier New',monospace";

function itemsTable(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid ${C.border};color:${C.text};">${esc(i.product_name || i.name)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid ${C.border};color:${C.text};text-align:center;">${esc(i.quantity)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid ${C.border};color:${C.text};text-align:right;">$${(Number(i.price) * Number(i.quantity)).toFixed(2)}</td>
      </tr>`
    )
    .join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.border};border-radius:8px;overflow:hidden;margin-bottom:16px;">
    <thead>
      <tr style="background:${C.panel};">
        <th style="padding:10px 12px;text-align:left;font-family:${MONO};font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${C.blue};font-weight:400;">Product</th>
        <th style="padding:10px 12px;text-align:center;font-family:${MONO};font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${C.blue};font-weight:400;">Qty</th>
        <th style="padding:10px 12px;text-align:right;font-family:${MONO};font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:${C.blue};font-weight:400;">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr style="background:${C.panel};">
        <td colspan="2" style="padding:12px;font-family:${MONO};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${C.blue};">Total</td>
        <td style="padding:12px;text-align:right;font-size:18px;font-weight:700;color:${C.white};">$${Number(order.total).toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>`;
}

function layout(title, bodyInner) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:${C.card};border:1px solid ${C.border};border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:32px 40px;border-bottom:1px solid ${C.border};">
            <p style="margin:0;font-family:${MONO};font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:${C.blue};">OMEN LABS</p>
            <h1 style="margin:12px 0 0;font-size:24px;font-weight:700;color:${C.white};letter-spacing:-0.02em;">${esc(title)}</h1>
          </td>
        </tr>
        <tr><td style="padding:32px 40px;">${bodyInner}</td></tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid ${C.border};">
            <p style="margin:0;font-family:${MONO};font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:${C.foot};text-align:center;">For Research Use Only — Not for Human Consumption · omenlabs.co</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const greeting = (order) =>
  `<p style="margin:0 0 8px;color:${C.muted};font-size:14px;">Hi ${esc(order.customer_name || 'Researcher')},</p>`;
const msgP = (t) => `<p style="margin:0 0 24px;color:${C.muted};font-size:14px;line-height:1.6;">${t}</p>`;
const orderNumberBlock = (order) =>
  `<p style="margin:0 0 6px;font-family:${MONO};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${C.blue};">Order Number</p>
   <p style="margin:0 0 28px;font-family:${MONO};font-size:16px;font-weight:700;color:${C.white};">#${esc(order.order_number)}</p>`;
const questions = `<p style="margin:24px 0 0;color:${C.muted};font-size:13px;line-height:1.6;">Questions? Reply to this email or contact us at <a href="mailto:support@omenlabs.co" style="color:${C.blue};text-decoration:none;">support@omenlabs.co</a></p>`;

export function renderOrderConfirmation(order) {
  return layout(
    'Order Confirmed',
    greeting(order) +
      msgP("Your order has been received and is being processed. You'll receive a shipping notification once your compounds are dispatched.") +
      orderNumberBlock(order) +
      itemsTable(order) +
      questions
  );
}

export function renderStatusUpdate(order, status) {
  const label = (status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const msg = STATUS_MESSAGE[status] || `Your order status is now: ${label}.`;
  const tracking = order.tracking_number
    ? `<p style="margin:0 0 6px;font-family:${MONO};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${C.blue};">Tracking Number</p>
       <p style="margin:0 0 28px;font-family:${MONO};font-size:14px;color:${C.white};">${esc(order.tracking_number)}</p>`
    : '';
  return layout(label, greeting(order) + msgP(msg) + tracking + orderNumberBlock(order) + itemsTable(order) + questions);
}

export function renderOwnerNotification(order) {
  const c = order;
  const customer = `<p style="margin:0 0 6px;font-family:${MONO};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${C.blue};">Customer</p>
    <p style="margin:0 0 24px;color:${C.text};font-size:14px;line-height:1.6;">
      ${esc(c.customer_name)}<br/>
      ${esc(c.customer_email)}${c.customer_phone ? ' · ' + esc(c.customer_phone) : ''}<br/>
      ${esc(c.address)}${c.address2 ? ', ' + esc(c.address2) : ''}<br/>
      ${esc(c.city)}, ${esc(c.state || '')} ${esc(c.zip)}<br/>
      ${esc(c.country || 'United States')}
    </p>`;
  return layout(
    'New Order Received',
    customer +
      orderNumberBlock(order) +
      itemsTable(order) +
      (c.notes ? msgP(`<strong style="color:${C.text}">Notes:</strong> ${esc(c.notes)}`) : '')
  );
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
