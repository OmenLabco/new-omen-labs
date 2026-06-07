// Shared branded HTML email templates for Omen Labs.
// Light base + explicit dark-mode overrides (prefers-color-scheme) so dark mode
// renders our navy/blue palette instead of the client's auto-inversion.

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

// Light palette (default / inline)
const BG = '#f3f4f6';
const CARD = '#ffffff';
const PANEL = '#f7f8fa';
const BORDER = '#e6e8ec';
const ROW_BORDER = '#eef0f3';
const BLUE = '#2f5fe0';
const INK = '#0a0e1a';
const TEXT = '#1f2430';
const MUTED = '#5b6472';
const MONO = "'SF Mono',ui-monospace,Menlo,Consolas,monospace";

// Dark overrides applied via @media (prefers-color-scheme: dark)
const DARK_CSS = `
  @media (prefers-color-scheme: dark) {
    .ol-bg { background:#0a0e1a !important; }
    .ol-card { background:#0c1222 !important; border-color:#1b2438 !important; }
    .ol-panel { background:#0e1426 !important; border-color:#1b2438 !important; }
    .ol-ink { color:#ffffff !important; }
    .ol-text { color:#e5e8ef !important; }
    .ol-muted { color:#9aa3b8 !important; }
    .ol-blue { color:#5b8bf7 !important; }
    .ol-hr { border-color:#1b2438 !important; }
    .ol-rowb { border-color:#161d30 !important; }
    .ol-dim { color:#566076 !important; }
  }
  [data-ogsc] .ol-bg { background:#0a0e1a !important; }
  [data-ogsc] .ol-card { background:#0c1222 !important; border-color:#1b2438 !important; }
  [data-ogsc] .ol-panel { background:#0e1426 !important; border-color:#1b2438 !important; }
  [data-ogsc] .ol-ink { color:#ffffff !important; }
  [data-ogsc] .ol-text { color:#e5e8ef !important; }
  [data-ogsc] .ol-muted { color:#9aa3b8 !important; }
  [data-ogsc] .ol-blue { color:#5b8bf7 !important; }
`;

function layout(inner) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>${DARK_CSS}</style>
</head>
<body class="ol-bg" style="margin:0;background:${BG};padding:32px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="ol-card" style="max-width:600px;background:${CARD};border-radius:16px;border:1px solid ${BORDER}">
      <tr><td style="padding:40px 40px 0">
        <div class="ol-blue" style="color:${BLUE};font-family:${MONO};font-size:12px;letter-spacing:5px;text-transform:uppercase">OMEN&nbsp;LABS</div>
        ${inner}
      </td></tr>
      <tr><td style="padding:28px 40px 36px">
        <div class="ol-hr" style="border-top:1px solid ${BORDER};padding-top:22px">
          <p class="ol-muted" style="color:${MUTED};font-size:13px;line-height:1.6;margin:0">Questions? Reply to this email or contact us at <a href="mailto:support@omenlabs.co" class="ol-blue" style="color:${BLUE};text-decoration:none">support@omenlabs.co</a></p>
          <p class="ol-dim" style="color:#9aa0ac;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;margin:16px 0 0">For Research Use Only — Not for Human Consumption</p>
        </div>
      </td></tr>
    </table>
    <p class="ol-dim" style="color:#9aa0ac;font-size:11px;margin-top:16px">© ${new Date().getFullYear()} Omen Labs · omenlabs.co</p>
  </td></tr></table>
</body>
</html>`;
}

const heading = (t) => `<h1 class="ol-ink" style="color:${INK};font-size:30px;font-weight:700;margin:14px 0 0;letter-spacing:-0.5px">${esc(t)}</h1>`;
const divider = () => `<div class="ol-hr" style="border-top:1px solid ${BORDER};margin:28px 0"></div>`;
const para = (t) => `<p class="ol-muted" style="color:${MUTED};font-size:16px;line-height:1.65;margin:0 0 14px">${t}</p>`;
const label = (t) => `<div class="ol-blue" style="color:${BLUE};font-family:${MONO};font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px">${esc(t)}</div>`;

function orderNumberBlock(order) {
  return `<div style="margin:26px 0">
    ${label('Order Number')}
    <div class="ol-ink" style="color:${INK};font-family:${MONO};font-size:22px;font-weight:700">#${esc(order.order_number)}</div>
  </div>`;
}

function itemsTable(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const rows = items
    .map(
      (i) => `<tr>
        <td class="ol-text ol-rowb" style="padding:16px 20px;border-bottom:1px solid ${ROW_BORDER};font-size:15px;color:${TEXT}">${esc(i.product_name || i.name)}</td>
        <td class="ol-muted ol-rowb" style="padding:16px 20px;border-bottom:1px solid ${ROW_BORDER};font-size:15px;color:${MUTED};text-align:center">${esc(i.quantity)}</td>
        <td class="ol-text ol-rowb" style="padding:16px 20px;border-bottom:1px solid ${ROW_BORDER};font-size:15px;color:${TEXT};text-align:right">$${(Number(i.price) * Number(i.quantity)).toFixed(2)}</td>
      </tr>`
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="ol-panel" style="margin-top:8px;background:${PANEL};border:1px solid ${BORDER};border-radius:12px;border-collapse:separate;overflow:hidden">
      <tr>
        <td class="ol-blue" style="padding:14px 20px;font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${BLUE}">Product</td>
        <td class="ol-blue" style="padding:14px 20px;font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${BLUE};text-align:center">Qty</td>
        <td class="ol-blue" style="padding:14px 20px;font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${BLUE};text-align:right">Amount</td>
      </tr>
      ${rows}
      <tr>
        <td class="ol-blue" style="padding:18px 20px;font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${BLUE}">Total</td>
        <td></td>
        <td class="ol-ink" style="padding:18px 20px;font-size:18px;font-weight:700;color:${INK};text-align:right">$${Number(order.total).toFixed(2)}</td>
      </tr>
    </table>`;
}

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

export function renderStatusUpdate(order, status) {
  const lbl = (status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const msg = STATUS_MESSAGE[status] || `Your order status is now: ${lbl}.`;
  const tracking = order.tracking_number
    ? `<div style="margin:26px 0">${label('Tracking Number')}<div class="ol-ink" style="color:${INK};font-family:${MONO};font-size:16px">${esc(order.tracking_number)}</div></div>`
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

export function renderOwnerNotification(order) {
  const c = order;
  return layout(`
    ${heading('New Order Received')}
    ${divider()}
    ${label('Customer')}
    ${para(`<span class="ol-text" style="color:${TEXT};font-weight:600">${esc(c.customer_name)}</span><br/>
      ${esc(c.customer_email)}${c.customer_phone ? ' · ' + esc(c.customer_phone) : ''}<br/>
      ${esc(c.address)}${c.address2 ? ', ' + esc(c.address2) : ''}<br/>
      ${esc(c.city)}, ${esc(c.state || '')} ${esc(c.zip)}<br/>
      ${esc(c.country || 'United States')}`)}
    ${c.notes ? para(`<span class="ol-blue" style="color:${BLUE}">Notes:</span> ${esc(c.notes)}`) : ''}
    ${orderNumberBlock(order)}
    ${itemsTable(order)}
  `);
}

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
