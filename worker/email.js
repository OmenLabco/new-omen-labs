// Shared branded HTML email templates for Omen Labs — dark theme matching the storefront.

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

// Customer-facing status messages
export const STATUS_MESSAGE = {
  processing: "Your order has been received and is being processed. You'll receive a shipping notification once your compounds are dispatched.",
  confirmed: 'Your order has been confirmed and is being prepared for shipment.',
  shipped: 'Good news — your order is on its way! Use the tracking number below to follow its progress.',
  out_for_delivery: 'Your order is out for delivery and should arrive today.',
  delivered: 'Your order has been delivered. Thank you for choosing Omen Labs.',
};

// Palette
const BG = '#0a0e1a';
const CARD = '#0c1222';
const PANEL = '#0e1426';
const BORDER = '#1b2438';
const ROW_BORDER = '#161d30';
const BLUE = '#5b8bf7';
const WHITE = '#ffffff';
const MUTED = '#9aa3b8';
const MONO = "'SF Mono',ui-monospace,Menlo,Consolas,monospace";

function layout(inner) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<style>:root{color-scheme:dark;supported-color-schemes:dark}</style>
</head>
<body style="margin:0;background:${BG} !important;padding:32px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${CARD} !important;border-radius:16px;border:1px solid ${BORDER}">
      <tr><td style="padding:40px 40px 0">
        <div style="color:${BLUE} !important;font-family:${MONO};font-size:12px;letter-spacing:5px;text-transform:uppercase">OMEN&nbsp;LABS</div>
        ${inner}
      </td></tr>
      <tr><td style="padding:28px 40px 36px">
        <div style="border-top:1px solid ${BORDER};padding-top:22px">
          <p style="color:${MUTED} !important;font-size:13px;line-height:1.6;margin:0">Questions? Reply to this email or contact us at <a href="mailto:support@omenlabs.co" style="color:${BLUE} !important;text-decoration:none">support@omenlabs.co</a></p>
          <p style="color:#566076 !important;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;margin:16px 0 0">For Research Use Only — Not for Human Consumption</p>
        </div>
      </td></tr>
    </table>
    <p style="color:#3f475c !important;font-size:11px;margin-top:16px">© ${new Date().getFullYear()} Omen Labs · omenlabs.co</p>
  </td></tr></table>
</body>
</html>`;
}

const heading = (t) => `<h1 style="color:${WHITE} !important;font-size:30px;font-weight:700;margin:14px 0 0;letter-spacing:-0.5px">${esc(t)}</h1>`;
const divider = () => `<div style="border-top:1px solid ${BORDER};margin:28px 0"></div>`;
const para = (t) => `<p style="color:${MUTED} !important;font-size:16px;line-height:1.65;margin:0 0 14px">${t}</p>`;
const label = (t) => `<div style="color:${BLUE} !important;font-family:${MONO};font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px">${esc(t)}</div>`;

function orderNumberBlock(order) {
  return `<div style="margin:26px 0">
    ${label('Order Number')}
    <div style="color:${WHITE} !important;font-family:${MONO};font-size:22px;font-weight:700">#${esc(order.order_number)}</div>
  </div>`;
}

function itemsTable(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:16px 20px;border-bottom:1px solid ${ROW_BORDER};font-size:15px;color:#e5e8ef !important">${esc(i.product_name || i.name)}</td>
        <td style="padding:16px 20px;border-bottom:1px solid ${ROW_BORDER};font-size:15px;color:#c2c8d4 !important;text-align:center">${esc(i.quantity)}</td>
        <td style="padding:16px 20px;border-bottom:1px solid ${ROW_BORDER};font-size:15px;color:#e5e8ef !important;text-align:right">$${(Number(i.price) * Number(i.quantity)).toFixed(2)}</td>
      </tr>`
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;background:${PANEL} !important;border:1px solid ${BORDER};border-radius:12px;border-collapse:separate;overflow:hidden">
      <tr>
        <td style="padding:14px 20px;font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${BLUE}">Product</td>
        <td style="padding:14px 20px;font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${BLUE} !important;text-align:center">Qty</td>
        <td style="padding:14px 20px;font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${BLUE} !important;text-align:right">Amount</td>
      </tr>
      ${rows}
      <tr>
        <td style="padding:18px 20px;font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${BLUE}">Total</td>
        <td></td>
        <td style="padding:18px 20px;font-size:18px;font-weight:700;color:${WHITE} !important;text-align:right">$${Number(order.total).toFixed(2)}</td>
      </tr>
    </table>`;
}

// Customer order confirmation — recreates the Base44 "Order Confirmed" email
export function renderOrderConfirmation(order) {
  return layout(`
    ${heading('Order Confirmed')}
    ${divider()}
    ${para(`Hi ${esc(order.customer_name || 'there')},`)}
    ${para("Your order has been received and is being processed. You'll receive a shipping notification once your compounds are dispatched.")}
    ${orderNumberBlock(order)}
    ${itemsTable(order)}
  `);
}

// Customer status update email
export function renderStatusUpdate(order, status) {
  const lbl = (status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const msg = STATUS_MESSAGE[status] || `Your order status is now: ${lbl}.`;
  const tracking = order.tracking_number
    ? `<div style="margin:26px 0">${label('Tracking Number')}<div style="color:${WHITE} !important;font-family:${MONO};font-size:16px">${esc(order.tracking_number)}</div></div>`
    : '';
  return layout(`
    ${heading(lbl)}
    ${divider()}
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
    ${heading('New Order Received')}
    ${divider()}
    ${label('Customer')}
    ${para(`<span style="color:#e5e8ef !important;font-weight:600">${esc(c.customer_name)}</span><br/>
      ${esc(c.customer_email)}${c.customer_phone ? ' · ' + esc(c.customer_phone) : ''}<br/>
      ${esc(c.address)}${c.address2 ? ', ' + esc(c.address2) : ''}<br/>
      ${esc(c.city)}, ${esc(c.state || '')} ${esc(c.zip)}<br/>
      ${esc(c.country || 'United States')}`)}
    ${c.notes ? para(`<span style="color:${BLUE}">Notes:</span> ${esc(c.notes)}`) : ''}
    ${orderNumberBlock(order)}
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
