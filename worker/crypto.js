// NOWPayments crypto checkout.
// - createNowInvoice(): called from the order flow to create a hosted invoice;
//   funds settle to the wallet configured in your NOWPayments dashboard.
// - handleCryptoIPN(): NOWPayments webhook. Verifies the HMAC-SHA512 signature,
//   then marks the matching order confirmed + emails the receipt.
import { renderImageEmail, sendEmail } from './email.js';
import { signOrder } from './token.js';

const SITE = 'https://omenlabs.co';
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
function safeParse(s) { try { return JSON.parse(s || '[]'); } catch { return []; } }

// Create a hosted NOWPayments invoice. Returns the invoice_url or null.
export async function createNowInvoice(env, { amount, orderNumber, description }) {
  if (!env.NOWPAYMENTS_API_KEY) return null;
  const resp = await fetch('https://api.nowpayments.io/v1/invoice', {
    method: 'POST',
    headers: { 'x-api-key': env.NOWPAYMENTS_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      price_amount: Number(amount.toFixed ? amount.toFixed(2) : amount),
      price_currency: 'usd',
      order_id: orderNumber,
      order_description: description || `Omen Labs ${orderNumber}`,
      ipn_callback_url: `${SITE}/api/crypto/ipn`,
      success_url: `${SITE}/order-confirmed?crypto=1`,
      cancel_url: `${SITE}/checkout`,
    }),
  });
  if (!resp.ok) return null;
  const data = await resp.json().catch(() => ({}));
  return data.invoice_url || null;
}

// Deterministic JSON: keys sorted recursively (matches NOWPayments' signing).
function sortedStringify(obj) {
  if (Array.isArray(obj)) return '[' + obj.map(sortedStringify).join(',') + ']';
  if (obj && typeof obj === 'object') {
    return '{' + Object.keys(obj).sort().map((k) => JSON.stringify(k) + ':' + sortedStringify(obj[k])).join(',') + '}';
  }
  return JSON.stringify(obj);
}

async function hmacSha512Hex(secret, msg) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function handleCryptoIPN(request, env) {
  if (!env.DB || !env.NOWPAYMENTS_IPN_SECRET) return json({ error: 'Not configured.' }, 503);

  const raw = await request.text();
  const provided = request.headers.get('x-nowpayments-sig') || '';
  let payload;
  try { payload = JSON.parse(raw); } catch { return json({ error: 'Invalid JSON.' }, 400); }

  const expected = await hmacSha512Hex(env.NOWPAYMENTS_IPN_SECRET, sortedStringify(payload));
  // constant-time compare
  if (provided.length !== expected.length) return json({ error: 'Bad signature.' }, 401);
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return json({ error: 'Bad signature.' }, 401);

  const orderNumber = payload.order_id;
  const status = String(payload.payment_status || '');
  if (!orderNumber) return json({ ok: false, reason: 'no_order_id' });

  // Only act on a fully-settled payment
  if (status !== 'finished' && status !== 'confirmed') {
    return json({ ok: true, ignored: true, status });
  }

  const order = await env.DB.prepare('SELECT * FROM orders WHERE order_number = ?').bind(orderNumber).first();
  if (!order) return json({ ok: false, reason: 'order_not_found', orderNumber });
  if (order.status !== 'awaiting_payment') return json({ ok: true, alreadyHandled: true, status: order.status });

  await env.DB.prepare("UPDATE orders SET status = 'confirmed', payment_method = 'Crypto — payment confirmed' WHERE order_number = ?")
    .bind(orderNumber).run();

  if (env.RESEND_API_KEY && order.customer_email) {
    try {
      const token = await signOrder(orderNumber, env.ADMIN_PASSWORD);
      const imageUrl = `${SITE}/api/receipt-image?o=${encodeURIComponent(orderNumber)}&t=${token}&type=confirmation`;
      const orderObj = { ...order, status: 'confirmed', payment_method: 'Crypto — payment confirmed', items: safeParse(order.items), billing: order.billing ? safeParse(order.billing) : null };
      await sendEmail(env, {
        to: order.customer_email,
        subject: `Payment Received — Order Confirmed ${orderNumber}`,
        html: renderImageEmail({ imageUrl, order: orderObj }),
      });
    } catch {}
  }

  return json({ ok: true, marked_paid: true, orderNumber });
}
