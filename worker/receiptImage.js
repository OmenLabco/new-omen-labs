import { ImageResponse } from 'workers-og';

// Fetch + cache Inter fonts (woff is supported by satori; woff2 is not).
let fontCache = null;
async function getFonts() {
  if (fontCache) return fontCache;
  const base = 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files';
  const [reg, bold] = await Promise.all([
    fetch(`${base}/inter-latin-400-normal.woff`).then((r) => r.arrayBuffer()),
    fetch(`${base}/inter-latin-700-normal.woff`).then((r) => r.arrayBuffer()),
  ]);
  fontCache = [
    { name: 'Inter', data: reg, weight: 400, style: 'normal' },
    { name: 'Inter', data: bold, weight: 700, style: 'normal' },
  ];
  return fontCache;
}

const esc = (s = '') => String(s).replace(/[<>]/g, '');

const NAVY = '#0a0e1a';
const PANEL = '#0e1426';
const BORDER = '#1b2438';
const BLUE = '#5b8bf7';
const WHITE = '#ffffff';
const MUTED = '#9aa3b8';
const TEXT = '#e5e8ef';

// Omen Labs hexagon (benzene) logo as an inline SVG data URI
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none"><polygon points="88.1,72 50,94 11.9,72 11.9,28 50,6 88.1,28" stroke="${WHITE}" stroke-width="4" fill="none" stroke-linejoin="round"/><line x1="77.44" y1="65.84" x2="50" y2="81.68" stroke="${WHITE}" stroke-width="3.5" stroke-linecap="round"/><line x1="22.56" y1="65.84" x2="22.56" y2="34.16" stroke="${WHITE}" stroke-width="3.5" stroke-linecap="round"/><line x1="50" y1="18.32" x2="77.44" y2="34.16" stroke="${WHITE}" stroke-width="3.5" stroke-linecap="round"/><circle cx="50" cy="50" r="4" fill="${WHITE}"/></svg>`;
const LOGO_URI = `data:image/svg+xml;base64,${btoa(LOGO_SVG)}`;

function addressColumn(label, a) {
  const line2 = [a.city, a.state].filter(Boolean).join(', ') + ' ' + (a.zip || '');
  const lines = [a.name, [a.address, a.address2].filter(Boolean).join(', '), line2.trim(), a.country || 'United States']
    .filter(Boolean)
    .map((l) => `<div style="display:flex;color:${TEXT};font-size:16px;line-height:1.45">${esc(l)}</div>`)
    .join('');
  return `<div style="display:flex;flex-direction:column;width:50%">
    <div style="display:flex;color:${BLUE};font-size:13px;letter-spacing:2px;margin-bottom:10px">${esc(label)}</div>
    ${lines}
  </div>`;
}

function totalRow(label, value, opts = {}) {
  const c = opts.color || MUTED;
  const vc = opts.valueColor || TEXT;
  const size = opts.size || 18;
  const weight = opts.bold ? 700 : 400;
  return `<div style="display:flex;width:100%;justify-content:space-between;padding:6px 0">
    <div style="display:flex;color:${c};font-size:${size}px;font-weight:${weight}">${esc(label)}</div>
    <div style="display:flex;color:${vc};font-size:${size}px;font-weight:${weight}">${value}</div>
  </div>`;
}

export async function receiptImage(order, { title = 'Order Confirmed', message, tracking } = {}) {
  const fonts = await getFonts();
  const items = Array.isArray(order.items) ? order.items : [];
  const msg =
    message ||
    "Your order has been received and is being processed. You'll receive a shipping notification once your compounds are dispatched.";

  const subtotal = Number(order.subtotal ?? items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0));
  const shipping = Number(order.shipping_cost ?? 0);
  const discount = Number(order.discount ?? 0);
  const total = Number(order.total ?? subtotal + shipping - discount);

  const shippingAddr = {
    name: order.customer_name,
    address: order.address,
    address2: order.address2,
    city: order.city,
    state: order.state,
    zip: order.zip,
    country: order.country,
  };
  const billingAddr = order.billing || shippingAddr;

  const itemRows = items
    .map(
      (i) => `<div style="display:flex;width:100%;padding:16px 24px;border-bottom:1px solid ${BORDER}">
        <div style="display:flex;width:55%;color:${TEXT};font-size:22px">${esc(i.product_name || i.name)}</div>
        <div style="display:flex;width:15%;justify-content:center;color:${MUTED};font-size:22px">${esc(i.quantity)}</div>
        <div style="display:flex;width:30%;justify-content:flex-end;color:${TEXT};font-size:22px">$${(Number(i.price) * Number(i.quantity)).toFixed(2)}</div>
      </div>`
    )
    .join('');

  const trackingBlock = tracking
    ? `<div style="display:flex;flex-direction:column;margin-top:24px">
        <div style="display:flex;color:${BLUE};font-size:15px;letter-spacing:2px">TRACKING NUMBER</div>
        <div style="display:flex;color:${WHITE};font-size:22px;font-weight:700;margin-top:6px">${esc(tracking)}</div>
      </div>`
    : '';

  const msgLines = Math.max(1, Math.ceil(msg.length / 44));
  const height =
    520 +
    msgLines * 34 +
    170 + // addresses
    60 + // payment
    items.length * 62 +
    (2 + (discount > 0 ? 1 : 0) + 1) * 40 + // totals rows
    (tracking ? 100 : 0) +
    150; // questions + footer + buffer

  const markup = `
  <div style="display:flex;flex-direction:column;width:600px;background:${NAVY};padding:44px;font-family:Inter">
    <div style="display:flex;align-items:center;margin-bottom:6px">
      <img src="${LOGO_URI}" width="34" height="34" style="margin-right:14px" />
      <div style="display:flex;color:${BLUE};font-size:16px;font-weight:700;letter-spacing:6px">OMEN LABS</div>
    </div>
    <div style="display:flex;color:${WHITE};font-size:42px;font-weight:700;margin-top:10px">${esc(title)}</div>
    <div style="display:flex;width:100%;height:1px;background:${BORDER};margin:26px 0"></div>
    <div style="display:flex;color:${MUTED};font-size:22px">Hi ${esc(order.customer_name || 'there')},</div>
    <div style="display:flex;color:${MUTED};font-size:22px;line-height:1.5;margin-top:14px">${esc(msg)}</div>
    ${trackingBlock}
    <div style="display:flex;color:${BLUE};font-size:15px;letter-spacing:2px;margin-top:28px">ORDER NUMBER</div>
    <div style="display:flex;color:${WHITE};font-size:30px;font-weight:700;margin-top:8px">#${esc(order.order_number)}</div>

    <div style="display:flex;width:100%;margin-top:28px">
      ${addressColumn('SHIPPING ADDRESS', shippingAddr)}
      ${addressColumn('BILLING ADDRESS', billingAddr)}
    </div>

    <div style="display:flex;flex-direction:column;margin-top:26px">
      <div style="display:flex;color:${BLUE};font-size:15px;letter-spacing:2px">PAYMENT METHOD</div>
      <div style="display:flex;color:${TEXT};font-size:18px;margin-top:8px">${esc(order.payment_method || 'Manual — invoice to follow')}</div>
    </div>

    <div style="display:flex;flex-direction:column;width:100%;background:${PANEL};border:1px solid ${BORDER};border-radius:14px;margin-top:26px">
      <div style="display:flex;width:100%;padding:16px 24px">
        <div style="display:flex;width:55%;color:${BLUE};font-size:15px;letter-spacing:1px">PRODUCT</div>
        <div style="display:flex;width:15%;justify-content:center;color:${BLUE};font-size:15px;letter-spacing:1px">QTY</div>
        <div style="display:flex;width:30%;justify-content:flex-end;color:${BLUE};font-size:15px;letter-spacing:1px">AMOUNT</div>
      </div>
      ${itemRows}
      <div style="display:flex;flex-direction:column;padding:16px 24px">
        ${totalRow('Subtotal', `$${subtotal.toFixed(2)}`)}
        ${totalRow(order.shipping_method ? `Shipping (${order.shipping_method})` : 'Shipping', `$${shipping.toFixed(2)}`)}
        ${discount > 0 ? totalRow('Crypto discount (10%)', `-$${discount.toFixed(2)}`, { color: BLUE, valueColor: BLUE }) : ''}
        ${totalRow('Total', `$${total.toFixed(2)}`, { color: WHITE, valueColor: WHITE, bold: true, size: 24 })}
      </div>
    </div>

    <div style="display:flex;color:${MUTED};font-size:17px;line-height:1.5;margin-top:30px">Questions? Reply to this email or contact us at support@omenlabs.co</div>
    <div style="display:flex;width:100%;height:1px;background:${BORDER};margin:26px 0 0"></div>
    <div style="display:flex;color:#3a3f55;font-size:12px;letter-spacing:1px;margin-top:20px">FOR RESEARCH USE ONLY — NOT FOR HUMAN CONSUMPTION · OMENLABS.CO</div>
  </div>`;

  return new ImageResponse(markup, { width: 600, height, fonts, format: 'png' });
}
