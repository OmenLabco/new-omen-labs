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
<html>
<body style="margin:0;background:${BG};padding:32px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${CARD};border-radius:16px;border:1px solid ${BORDER}">
      <tr><td style="padding:40px 40px 0">
        <div style="color:${BLUE};font-family:${MONO};font-size:12px;letter-spacing:5px;text-transform:uppercase">OMEN&nbsp;LABS</div>
        ${inner}
      </td></tr>
      <tr><td style="padding:28px 40px 36px">
        <div style="border-top:1px solid ${BORDER};padding-top:22px">
          <p style="color:${MUTED};font-size:13px;line-height:1.6;margin:0">Questions? Reply to this email or contact us at <a href="mailto:support@omenlabs.co" style="color:${BLUE};text-decoration:none">support@omenlabs.co</a></p>
          <p style="color:#566076;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;margin:16px 0 0">For Research Use Only — Not for Human Consumption</p>
        </div>
      </td></tr>
    </table>
    <p style="color:#3f475c;font-size:11px;margin-top:16px">© ${new Date().getFullYear()} Omen Labs · omenlabs.co</p>
  </td></tr></table>
</body>
</html>`;
}

const heading = (t) => `<h1 style="color:${WHITE};font-size:30px;font-weight:700;margin:14px 0 0;letter-spacing:-0.5px">${esc(t)}</h1>`;
const divider = () => `<div style="border-top:1px solid ${BORDER};margin:28px 0"></div>`;
const para = (t) => `<p style="color:${MUTED};font-size:16px;line-height:1.65;margin:0 0 14px">${t}</p>`;
const label = (t) => `<div style="color:${BLUE};font-family:${MONO};font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px">${esc(t)}</div>`;

function orderNumberBlock(order) {
  return `<div style="margin:26px 0">
    ${label('Order Number')}
    <div style="color:${WHITE};font-family:${MONO};font-size:22px;font-weight:700">#${esc(order.order_number)}</div>
  </div>`;
}

function itemsTable(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:16px 20px;border-bottom:1px solid ${ROW_BORDER};font-size:15px;color:#e5e8ef">${esc(i.product_name || i.name)}</td>
        <td style="padding:16px 20px;border-bottom:1px solid ${ROW_BORDER};font-size:15px;color:#c2c8d4;text-align:center">${esc(i.quantity)}</td>
        <td style="padding:16px 20px;border-bottom:1px solid ${ROW_BORDER};font-size:15px;color:#e5e8ef;text-align:right">$${(Number(i.price) * Number(i.quantity)).toFixed(2)}</td>
      </tr>`
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;background:${PANEL};border:1px solid ${BORDER};border-radius:12px;border-collapse:separate;overflow:hidden">
      <tr>
        <td style="padding:14px 20px;font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${BLUE}">Product</td>
        <td style="padding:14px 20px;font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${BLUE};text-align:center">Qty</td>
        <td style="padding:14px 20px;font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${BLUE};text-align:right">Amount</td>
      </tr>
      ${rows}
      <tr>
        <td style="padding:18px 20px;font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${BLUE}">Total</td>
        <td></td>
        <td style="padding:18px 20px;font-size:18px;font-weight:700;color:${WHITE};text-align:right">$${Number(order.total).toFixed(2)}</td>
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
    ? `<div style="margin:26px 0">${label('Tracking Number')}<div style="color:${WHITE};font-family:${MONO};font-size:16px">${esc(order.tracking_number)}</div></div>`
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
    ${para(`<span style="color:#e5e8ef;font-weight:600">${esc(c.customer_name)}</span><br/>
      ${esc(c.customer_email)}${c.customer_phone ? ' · ' + esc(c.customer_phone) : ''}<br/>
      ${esc(c.address)}${c.address2 ? ', ' + esc(c.address2) : ''}<br/>
      ${esc(c.city)}, ${esc(c.state || '')} ${esc(c.zip)}<br/>
      ${esc(c.country || 'United States')}`)}
    ${c.notes ? para(`<span style="color:${BLUE}">Notes:</span> ${esc(c.notes)}`) : ''}
    ${c.billing ? label('Billing Address') + para(`${esc(c.billing.name || '')}<br/>${esc(c.billing.address || '')}${c.billing.address2 ? ', ' + esc(c.billing.address2) : ''}<br/>${esc(c.billing.city || '')}, ${esc(c.billing.state || '')} ${esc(c.billing.zip || '')}<br/>${esc(c.billing.country || 'United States')}`) : para(`<span style="color:${BLUE}">Billing:</span> Same as shipping`)}
    ${order.payment_method ? para(`<span style="color:${BLUE}">Payment:</span> ${esc(order.payment_method)}`) : ''}
    ${order.shipping_method ? para(`<span style="color:${BLUE}">Shipping:</span> ${esc(order.shipping_method)} — $${Number(order.shipping_cost || 0).toFixed(2)}`) : ''}
    ${orderNumberBlock(order)}
    ${itemsTable(order)}
  `);
}

// Image-based email — the receipt is a PNG (immune to Gmail dark-mode inversion).
// Includes a hidden preheader + a real text summary so it isn't "image-only"
// (image-only emails get spam-filtered).
export function renderImageEmail({ imageUrl, order, heading = 'Order Confirmed' }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsText = items
    .map((i) => `${esc(i.product_name || i.name)} × ${esc(i.quantity)} — $${(Number(i.price) * Number(i.quantity)).toFixed(2)}`)
    .join('<br/>');
  // Hidden preheader carries the text content for spam filters / previews,
  // but nothing visible is HTML — so there is no background to invert. The whole
  // visible email is the PNG, which stays navy in every mode.
  const preheader = `${esc(heading)} — Order #${esc(order.order_number)}. ${itemsText.replace(/<br\/>/g, ', ')}. Total $${Number(order.total).toFixed(2)}. Questions? support@omenlabs.co`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
</head>
<body style="margin:0;padding:0;background:#0a0c14;font-family:-apple-system,Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#0a0c14">${preheader}</div>
  <a href="https://omenlabs.co" style="text-decoration:none;border:0">
    <img src="${imageUrl}" width="600" alt="${esc(heading)} — Order #${esc(order.order_number)}. Total $${Number(order.total).toFixed(2)}. Questions? support@omenlabs.co" style="display:block;width:100%;max-width:600px;margin:0 auto;border:0" />
  </a>
</body>
</html>`;
}

// Affiliate payout receipt — sent when the owner marks a payout as paid.
export function renderPayoutReceipt({ name, code, amount, methodLabel, handle, receiptNo, paidDate }) {
  let when;
  try { when = new Date(paidDate).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/New_York' }) + ' ET'; }
  catch { when = new Date(paidDate).toUTCString(); }
  const row = (k, v, opts = {}) => `<tr>
    <td style="padding:14px 20px;border-bottom:1px solid ${ROW_BORDER};font-size:13px;color:${MUTED}">${esc(k)}</td>
    <td style="padding:14px 20px;border-bottom:1px solid ${ROW_BORDER};font-size:${opts.big ? '20px' : '14px'};font-weight:${opts.big ? '700' : '400'};color:${opts.big ? '#4ade80' : '#e5e8ef'};text-align:right${opts.mono ? `;font-family:${MONO}` : ''}">${v}</td>
  </tr>`;
  return layout(`
    ${heading('Payout Sent')}
    ${divider()}
    ${para(`Hi ${esc(name || 'there')},`)}
    ${para('Your affiliate commission payout has been sent. Keep this receipt for your records.')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 6px;background:${PANEL};border:1px solid ${BORDER};border-radius:12px;border-collapse:separate;overflow:hidden">
      ${row('Amount paid', `$${Number(amount).toFixed(2)}`, { big: true })}
      ${row('Method', esc(methodLabel))}
      ${row('Sent to', esc(handle), { mono: true })}
      ${row('Date & time', esc(when))}
      ${row('Receipt #', esc(receiptNo), { mono: true })}
      ${row('Affiliate code', esc(code), { mono: true })}
    </table>
    ${para('If anything looks off, just reply to this email and we\'ll sort it out.')}
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
