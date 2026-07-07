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

const SITE = 'https://omenlabs.co';
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

function safeParse(s) { try { return JSON.parse(s || '[]'); } catch { return []; } }

// Core reconciler — shared by the SMS endpoint and the Cash App email worker.
// opts.methodPrefix ('Cash App' | 'Zelle') scopes the amount-only fallback so a
// payment can only auto-confirm an order of the SAME method.
export async function reconcilePayment(env, text, opts = {}) {
  if (!env.DB) return { ok: false, reason: 'no_db' };

  const orderMatch = text.match(/OMEN-?\s*([XIVLCDM]{6})/i);
  const amountMatch = text.match(/\$?\s*([0-9][0-9,]*\.\d{2})/);
  const paidAmount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : null;
  const prefix = opts.methodPrefix || (/cash\s*app/i.test(text) ? 'Cash App' : 'Zelle');

  let order = null;
  if (orderMatch) {
    const orderNumber = `OMEN-${orderMatch[1].toUpperCase()}`;
    order = await env.DB.prepare('SELECT * FROM orders WHERE order_number = ?').bind(orderNumber).first();
    if (!order) return { ok: false, reason: 'order_not_found', orderNumber };
  }

  // When we can't fully authenticate the source (e.g. a forwarded email that lost
  // its DKIM), require the order number — never auto-confirm on amount alone.
  if (!order && opts.requireOrderNumber) return { ok: false, reason: 'order_number_required' };

  // Fallback: no order number in the text (e.g. Cash App email without the note)
  // → match a SINGLE awaiting order of this method by its unique amount.
  if (!order && paidAmount != null) {
    const { results } = await env.DB.prepare(
      "SELECT * FROM orders WHERE status = 'awaiting_payment' AND payment_method LIKE ? AND ABS(total - ?) < 0.02"
    ).bind(prefix + '%', paidAmount).all();
    const rows = results || [];
    if (rows.length === 1) order = rows[0];
    else if (rows.length > 1) return { ok: false, reason: 'ambiguous_amount', paidAmount };
  }

  if (!order) return { ok: false, reason: 'no_match', paidAmount };
  if (order.status !== 'awaiting_payment') {
    return { ok: true, alreadyHandled: true, orderNumber: order.order_number, status: order.status };
  }

  // Verify amount covers the order total (allow a tiny rounding tolerance)
  const expectedTotal = Number(order.total || 0);
  if (paidAmount != null && paidAmount + 0.01 < expectedTotal) {
    return { ok: false, reason: 'amount_mismatch', orderNumber: order.order_number, paidAmount, expectedTotal };
  }

  // Keep the label accurate to how they paid.
  const method = (order.payment_method || '').startsWith('Cash App') ? 'Cash App' : 'Zelle';
  const confirmedLabel = `${method} — payment confirmed`;

  await env.DB.prepare("UPDATE orders SET status = 'confirmed', payment_method = ? WHERE order_number = ?")
    .bind(confirmedLabel, order.order_number).run();

  // Hand the paid order to ShipStation (no-op if not configured)
  await pushToShipStation(env, { ...order, status: 'confirmed', payment_method: confirmedLabel });

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

  const result = await reconcilePayment(env, text);
  const status = result.ok ? 200 : (result.reason === 'order_not_found' || result.reason === 'no_match') ? 200 : 200;
  return json(result, status);
}
