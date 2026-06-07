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

// Satori renders plain text (it does NOT decode HTML entities), so we only strip
// the characters that would break the markup, leaving quotes/apostrophes as-is.
const esc = (s = '') => String(s).replace(/[<>]/g, '');

const NAVY = '#0a0e1a';
const PANEL = '#0e1426';
const BORDER = '#1b2438';
const BLUE = '#5b8bf7';
const WHITE = '#ffffff';
const MUTED = '#9aa3b8';
const TEXT = '#e5e8ef';

function row(left, mid, right, opts = {}) {
  const c = opts.color || TEXT;
  const weight = opts.bold ? 700 : 400;
  const border = opts.border ? `border-bottom:1px solid ${BORDER};` : '';
  const size = opts.size || 22;
  return `<div style="display:flex;width:100%;padding:18px 24px;${border}">
    <div style="display:flex;width:55%;color:${c};font-size:${size}px;font-weight:${weight}">${left}</div>
    <div style="display:flex;width:15%;justify-content:center;color:${opts.midColor || c};font-size:${size}px;font-weight:${weight}">${mid}</div>
    <div style="display:flex;width:30%;justify-content:flex-end;color:${c};font-size:${size}px;font-weight:${weight}">${right}</div>
  </div>`;
}

export async function receiptImage(order, { title = 'Order Confirmed', message, tracking } = {}) {
  const fonts = await getFonts();
  const items = Array.isArray(order.items) ? order.items : [];
  const msg =
    message ||
    "Your order has been received and is being processed. You'll receive a shipping notification once your compounds are dispatched.";

  const itemRows = items
    .map((i) =>
      row(esc(i.product_name || i.name), String(i.quantity), `$${(Number(i.price) * Number(i.quantity)).toFixed(2)}`, {
        border: true,
        size: 22,
        midColor: MUTED,
      })
    )
    .join('');

  const trackingBlock = tracking
    ? `<div style="display:flex;flex-direction:column;margin-top:8px">
        <div style="display:flex;color:${BLUE};font-size:15px;letter-spacing:2px">TRACKING NUMBER</div>
        <div style="display:flex;color:${WHITE};font-size:22px;font-weight:700;margin-top:6px">${esc(tracking)}</div>
      </div>`
    : '';

  // Height estimate (generous so the Total row is never clipped)
  const msgLines = Math.max(1, Math.ceil(msg.length / 44));
  const height =
    340 + // header + divider + order-number chrome + padding
    44 + // greeting line
    msgLines * 34 + // message
    items.length * 62 + // item rows
    50 + // table header
    70 + // total row
    (tracking ? 110 : 0) +
    130; // questions + footer + bottom buffer

  const markup = `
  <div style="display:flex;flex-direction:column;width:600px;background:${NAVY};padding:44px;font-family:Inter">
    <div style="display:flex;color:${BLUE};font-size:16px;font-weight:700;letter-spacing:6px">OMEN LABS</div>
    <div style="display:flex;color:${WHITE};font-size:42px;font-weight:700;margin-top:14px">${esc(title)}</div>
    <div style="display:flex;width:100%;height:1px;background:${BORDER};margin:28px 0"></div>
    <div style="display:flex;color:${MUTED};font-size:22px">Hi ${esc(order.customer_name || 'there')},</div>
    <div style="display:flex;color:${MUTED};font-size:22px;line-height:1.5;margin-top:14px">${esc(msg)}</div>
    ${trackingBlock}
    <div style="display:flex;color:${BLUE};font-size:15px;letter-spacing:2px;margin-top:30px">ORDER NUMBER</div>
    <div style="display:flex;color:${WHITE};font-size:30px;font-weight:700;margin-top:8px">#${esc(order.order_number)}</div>
    <div style="display:flex;flex-direction:column;width:100%;background:${PANEL};border:1px solid ${BORDER};border-radius:14px;margin-top:26px">
      <div style="display:flex;width:100%;padding:16px 24px">
        <div style="display:flex;width:55%;color:${BLUE};font-size:15px;letter-spacing:1px">PRODUCT</div>
        <div style="display:flex;width:15%;justify-content:center;color:${BLUE};font-size:15px;letter-spacing:1px">QTY</div>
        <div style="display:flex;width:30%;justify-content:flex-end;color:${BLUE};font-size:15px;letter-spacing:1px">AMOUNT</div>
      </div>
      ${itemRows}
      <div style="display:flex;width:100%;padding:18px 24px">
        <div style="display:flex;width:55%;color:${BLUE};font-size:15px;letter-spacing:1px">TOTAL</div>
        <div style="display:flex;width:15%"></div>
        <div style="display:flex;width:30%;justify-content:flex-end;color:${WHITE};font-size:26px;font-weight:700">$${Number(order.total).toFixed(2)}</div>
      </div>
    </div>
    <div style="display:flex;color:${MUTED};font-size:17px;line-height:1.5;margin-top:30px">Questions? Reply to this email or contact us at support@omenlabs.co</div>
    <div style="display:flex;width:100%;height:1px;background:${BORDER};margin:26px 0 0"></div>
    <div style="display:flex;color:#3a3f55;font-size:12px;letter-spacing:1px;margin-top:20px">FOR RESEARCH USE ONLY — NOT FOR HUMAN CONSUMPTION · OMENLABS.CO</div>
  </div>`;

  return new ImageResponse(markup, {
    width: 600,
    height,
    fonts,
    format: 'png',
  });
}
