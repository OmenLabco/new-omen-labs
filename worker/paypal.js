// PayPal checkout — RESTRICTED to non-peptide lab supplies (bac water, syringes).
// PayPal prohibits research peptides; every item is re-checked server-side against
// PAYPAL_OK_SKUS, so a peptide can never be paid through PayPal here. Inert until
// PAYPAL_CLIENT_ID + PAYPAL_SECRET are set as Cloudflare secrets.
//
//   PAYPAL_ENV     = "live" | "sandbox" (default sandbox)
//   PAYPAL_CLIENT_ID / PAYPAL_SECRET   (from developer.paypal.com REST app)
import { priceFor } from './prices.js';
import { PAYPAL_OK_SKUS } from '../src/data/products.js';
import { processOrder } from './order.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const enabled = (env) => !!(env.PAYPAL_CLIENT_ID && env.PAYPAL_SECRET);
const apiBase = (env) => (env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');

const SHIP = { ground: 9.99, first: 14.99, pickup: 0 };

async function token(env) {
  const auth = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_SECRET}`);
  const r = await fetch(`${apiBase(env)}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const d = await r.json();
  return d.access_token;
}

// Server-side price + eligibility. Returns { ok, items, subtotal, shipping, total } or { error }.
function priceEligibleCart(rawItems, shipping_method) {
  if (!Array.isArray(rawItems) || !rawItems.length) return { error: 'Cart is empty.' };
  const items = [];
  for (const i of rawItems) {
    const sku = i && i.product_id;
    if (!sku || !PAYPAL_OK_SKUS.has(sku)) return { error: 'PayPal is only available for lab supplies.' };
    const entry = priceFor(sku);
    if (!entry || entry.comingSoon || entry.soldOut) return { error: `Unavailable item: ${sku}` };
    const q = Math.max(1, Math.min(100, Math.floor(Number(i.quantity) || 1)));
    items.push({ product_id: sku, product_name: i.product_name || sku, quantity: q, price: entry.price });
  }
  const subtotal = +items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2);
  const shipping = subtotal >= 150 ? 0 : (SHIP[shipping_method] ?? SHIP.ground);
  const total = +(subtotal + shipping).toFixed(2);
  return { ok: true, items, subtotal, shipping, total };
}

// GET /api/paypal/config — tells the frontend whether to offer PayPal + the client id.
export async function paypalConfig(request, env) {
  return json({ enabled: enabled(env), clientId: enabled(env) ? env.PAYPAL_CLIENT_ID : null, env: env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox' });
}

// POST /api/paypal/create — { items, shipping_method } → { id }
export async function paypalCreate(request, env) {
  if (!enabled(env)) return json({ error: 'PayPal is not enabled.' }, 503);
  let b; try { b = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const priced = priceEligibleCart(b.items, b.shipping_method);
  if (priced.error) return json({ error: priced.error }, 400);
  const t = await token(env);
  const r = await fetch(`${apiBase(env)}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: 'USD', value: priced.total.toFixed(2) }, description: 'Omen Labs — lab supplies' }],
    }),
  });
  const d = await r.json();
  if (!d.id) return json({ error: 'Could not start PayPal checkout.' }, 502);
  return json({ id: d.id });
}

// POST /api/paypal/capture — { orderID, customer, items, shipping_method, notes }
export async function paypalCapture(request, env) {
  if (!enabled(env)) return json({ error: 'PayPal is not enabled.' }, 503);
  let b; try { b = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  if (!b.orderID) return json({ error: 'Missing PayPal order id.' }, 400);
  const priced = priceEligibleCart(b.items, b.shipping_method);
  if (priced.error) return json({ error: priced.error }, 400); // re-checks eligibility server-side

  const t = await token(env);
  const r = await fetch(`${apiBase(env)}/v2/checkout/orders/${encodeURIComponent(b.orderID)}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
  });
  const d = await r.json();
  const cap = d?.purchase_units?.[0]?.payments?.captures?.[0];
  if (d.status !== 'COMPLETED' || !cap || cap.status !== 'COMPLETED') {
    return json({ error: 'PayPal payment was not completed.' }, 402);
  }
  // Anti-tamper: the amount PayPal actually captured must match our server total.
  const paid = Number(cap.amount?.value || 0);
  if (Math.abs(paid - priced.total) > 0.01) {
    return json({ error: 'Captured amount did not match the order total.' }, 409);
  }

  // Record the order through the shared pipeline, already paid → confirmed + stock out.
  const resp = await processOrder(
    { customer: b.customer || {}, items: b.items, payment_method: 'paypal', shipping_method: b.shipping_method || 'ground', billing: b.billing || null, sid: b.sid || null },
    env,
    { paid: true, paymentLabel: 'PayPal — paid' }
  );
  let data = {}; try { data = await resp.json(); } catch {}
  return json({ ok: true, order_number: data.order_number || null });
}
