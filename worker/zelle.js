// Zelle + Cash App payment reconciliation.
// Two entry points feed the same core reconciler:
//   1) POST /api/zelle/notify — a phone Shortcut forwards the bank "you received
//      $X" SMS (shared secret required).
//   2) email() handler — a Cloudflare Email Worker receives Cash App receipt
//      emails (DKIM-verified) and reconciles them hands-off.
// We parse the OMEN order number + amount from the text, match an awaiting
// order, and mark it confirmed.
import { renderImageEmail, sendEmail } from './email.js';
import { signOrder } from './token.js';
import { safeEqual, zelleSecret } from './security.js';
import { pushToShipStation } from './shipstation.js';
import { decrementStockForOrder } from './stock.js';

const SITE = 'https://omenlabs.co';
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

function safeParse(s) { try { return JSON.parse(s || '[]'); } catch { return []; } }

// Email the owner when a payment can't be auto-matched so it never slips by.
async function alertOwner(env, kind, info = {}) {
  if (!env.RESEND_API_KEY) return;
  const to = env.ORDER_TO_EMAIL || 'support@omenlabs.co';
  const amt = info.paidAmount != null ? `$${Number(info.paidAmount).toFixed(2)}` : 'an unknown amount';
  const map = {
    no_order_number: {
      subject: `⚠️ Payment received with no order number — ${amt}`,
      body: `A payment of <b>${amt}</b> came in, but the note had <b>no OMEN order number</b>, so it couldn't be matched automatically. Check it against your awaiting-payment orders and mark the right one paid.`,
    },
    order_not_found: {
      subject: `⚠️ Payment for ${info.orderNumber} — no matching order`,
      body: `A payment (${amt}) referenced <b>${info.orderNumber}</b>, but no order with that number exists. Likely a typo or a very old order.`,
    },
    amount_mismatch: {
      subject: `⚠️ Underpaid — ${info.orderNumber}`,
      body: `<b>${info.orderNumber}</b> expected <b>$${Number(info.expectedTotal).toFixed(2)}</b> but only <b>${amt}</b> was received. It was <b>not</b> auto-confirmed.`,
    },
  };
  const m = map[kind]; if (!m) return;
  try {
    await sendEmail(env, {
      to,
      subject: m.subject,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;background:#0a0e1a;color:#e8e8ea;padding:28px 22px"><div style="max-width:520px;margin:0 auto;background:#0c1222;border:1px solid #1b2438;border-radius:14px;padding:26px 28px"><p style="color:#5b8bf7;font-size:12px;letter-spacing:4px;text-transform:uppercase;margin:0 0 12px">Omen Labs · Admin</p><h2 style="color:#fff;margin:0 0 12px;font-size:20px">Payment needs a look</h2><p style="color:#a9abb3;line-height:1.6;margin:0">${m.body}</p></div></div>`,
    });
  } catch {}
}

// Core reconciler — shared by the SMS endpoint and the Cash App email worker.
// opts.methodPrefix ('Cash App' | 'Zelle') scopes the amount-only fallback so a
// payment can only auto-confirm an order of the SAME method.
export async function reconcilePayment(env, text, opts = {}) {
  if (!env.DB) return { ok: false, reason: 'no_db' };

  const orderMatch = text.match(/OMEN-?\s*([XIVLCDM]{6})/i);
  const amountMatch = text.match(/\$?\s*([0-9][0-9,]*\.\d{2})/);
  const paidAmount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : null;
  // Require the order number from the payment note — it's the only safe key.
  // Matching on amount alone can confirm the WRONG order (a coincidental total,
  // or an older/unrelated receipt still in the inbox), so we never do that.
  if (!orderMatch) {
    // Alert only when it looks like money actually came IN (avoids flagging
    // receipts for payments the owner SENT, e.g. affiliate payouts).
    if (paidAmount != null && /receiv|paid you|got \$|from /i.test(text)) await alertOwner(env, 'no_order_number', { paidAmount });
    return { ok: false, reason: 'no_order_number', paidAmount };
  }
  const orderNumber = `OMEN-${orderMatch[1].toUpperCase()}`;
  const order = await env.DB.prepare('SELECT * FROM orders WHERE order_number = ?').bind(orderNumber).first();
  if (!order) {
    await alertOwner(env, 'order_not_found', { orderNumber, paidAmount });
    return { ok: false, reason: 'order_not_found', orderNumber };
  }
  if (order.status !== 'awaiting_payment') {
    return { ok: true, alreadyHandled: true, orderNumber: order.order_number, status: order.status };
  }

  // Verify amount covers the order total (allow a tiny rounding tolerance)
  const expectedTotal = Number(order.total || 0);
  if (paidAmount != null && paidAmount + 0.01 < expectedTotal) {
    await alertOwner(env, 'amount_mismatch', { orderNumber: order.order_number, paidAmount, expectedTotal });
    return { ok: false, reason: 'amount_mismatch', orderNumber: order.order_number, paidAmount, expectedTotal };
  }

  // Keep the label accurate to how they paid.
  const method = (order.payment_method || '').startsWith('Cash App') ? 'Cash App' : 'Zelle';
  const confirmedLabel = `${method} — payment confirmed`;

  await env.DB.prepare("UPDATE orders SET status = 'confirmed', payment_method = ? WHERE order_number = ?")
    .bind(confirmedLabel, order.order_number).run();

  // Hand the paid order to ShipStation (no-op if not configured)
  await pushToShipStation(env, { ...order, status: 'confirmed', payment_method: confirmedLabel });

  // Subtract the ordered vials from inventory (once).
  await decrementStockForOrder(env, order);

  // Send the customer their confirmation (best effort)
  if (env.RESEND_API_KEY && order.customer_email) {
    try {
      const token = await signOrder(order.order_number, env.ADMIN_PASSWORD);
      const imageUrl = `${SITE}/api/receipt-image?o=${encodeURIComponent(order.order_number)}&t=${token}&type=confirmation`;
      const orderObj = { ...order, status: 'confirmed', payment_method: confirmedLabel, items: safeParse(order.items), billing: order.billing ? safeParse(order.billing) : null };
      await sendEmail(env, {
        to: order.customer_email,
        subject: `Payment Received — Order Confirmed ${order.order_number}`,
        html: renderImageEmail({ imageUrl, order: orderObj }),
      });
    } catch {}
  }

  return { ok: true, marked_paid: true, orderNumber: order.order_number, paidAmount, expectedTotal, method };
}

export async function handleZelleNotify(request, env) {
  if (!env.DB) return json({ error: 'Service unavailable.' }, 500);

  // Auth: shared secret in header (or ?key= for Shortcut convenience)
  const url = new URL(request.url);
  const provided = request.headers.get('X-Zelle-Secret') || url.searchParams.get('key') || '';
  const expected = await zelleSecret(env);
  if (!(await safeEqual(provided, expected))) return json({ error: 'Unauthorized' }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const text = String(body.text || body.message || '');
  if (!text) return json({ error: 'No message text.' }, 400);

  // Optional explicit method hint ('Cash App' | 'Zelle') from the forwarder;
  // otherwise reconcilePayment auto-detects it from the text.
  const opts = body.source ? { methodPrefix: String(body.source) } : {};
  const result = await reconcilePayment(env, text, opts);
  const status = result.ok ? 200 : (result.reason === 'order_not_found' || result.reason === 'no_match') ? 200 : 200;
  return json(result, status);
}
