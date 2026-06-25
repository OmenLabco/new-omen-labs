// Zelle payment reconciliation.
// A phone Shortcut forwards the Bank of America "you received $X" SMS to
// POST /api/zelle/notify with the shared secret header. We parse the order
// number from the memo + the amount, match an awaiting order, and mark it paid.
import { renderImageEmail, sendEmail } from './email.js';
import { signOrder } from './token.js';
import { safeEqual, zelleSecret } from './security.js';

const SITE = 'https://omenlabs.co';
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

function safeParse(s) { try { return JSON.parse(s || '[]'); } catch { return []; } }

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

  // Parse order number (OMEN- followed by 6 roman-numeral letters) and amount
  const orderMatch = text.match(/OMEN-?\s*([XIVLCDM]{6})/i);
  const amountMatch = text.match(/\$?\s*([0-9][0-9,]*\.\d{2})/);
  if (!orderMatch) return json({ ok: false, reason: 'no_order_number', note: 'No OMEN order number found in message.' });

  const orderNumber = `OMEN-${orderMatch[1].toUpperCase()}`;
  const paidAmount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : null;

  const order = await env.DB.prepare('SELECT * FROM orders WHERE order_number = ?').bind(orderNumber).first();
  if (!order) return json({ ok: false, reason: 'order_not_found', orderNumber });
  if (order.status !== 'awaiting_payment') {
    return json({ ok: true, alreadyHandled: true, orderNumber, status: order.status });
  }

  // Verify amount covers the order total (allow a tiny rounding tolerance)
  const expectedTotal = Number(order.total || 0);
  if (paidAmount != null && paidAmount + 0.01 < expectedTotal) {
    return json({ ok: false, reason: 'amount_mismatch', orderNumber, paidAmount, expectedTotal });
  }

  // Mark paid → processing
  await env.DB.prepare("UPDATE orders SET status = 'processing' WHERE order_number = ?").bind(orderNumber).run();

  // Send the customer their confirmation (best effort)
  if (env.RESEND_API_KEY && order.customer_email) {
    try {
      const token = await signOrder(orderNumber, env.ADMIN_PASSWORD);
      const imageUrl = `${SITE}/api/receipt-image?o=${encodeURIComponent(orderNumber)}&t=${token}&type=confirmation`;
      const orderObj = { ...order, items: safeParse(order.items), billing: order.billing ? safeParse(order.billing) : null };
      await sendEmail(env, {
        to: order.customer_email,
        subject: `Payment Received — Order Confirmed ${orderNumber}`,
        html: renderImageEmail({ imageUrl, order: orderObj }),
      });
    } catch {}
  }

  return json({ ok: true, marked_paid: true, orderNumber, paidAmount, expectedTotal });
}
