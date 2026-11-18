// Square hosted checkout — TEMPORARY main card checkout for the full catalog.
// Flow: create an order in our DB as `awaiting_payment` (silently, no email) so
// the amount is computed by the one authoritative pricing path (processOrder),
// then create a Square-hosted payment link for exactly that total and redirect
// the buyer to Square. When Square redirects back (payment done), we verify the
// Square order is COMPLETED, flip our order to paid, decrement stock, and email.
//
// Inert until these Cloudflare secrets are set:
//   SQUARE_ACCESS_TOKEN   (access token for the Square account/application)
//   SQUARE_LOCATION_ID    (the location that receives the payments)
//   SQUARE_ENV            = "production" | "sandbox"  (default sandbox)
//
// NOTE: Square prohibits research peptides; using this for peptide SKUs risks a
// funds hold / account freeze / MATCH listing. Scope is the owner's decision.
import { processOrder } from './order.js';
import { signOrder, verifyOrder } from './token.js';
import { renderImageEmail, renderOwnerNotification, sendEmail } from './email.js';
import { decrementStockForOrder } from './stock.js';

const SITE = 'https://omenlabs.co';
const SQUARE_VERSION = '2025-01-23';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const redirect = (url) => new Response(null, { status: 302, headers: { Location: url } });

const enabled = (env) => !!(env.SQUARE_ACCESS_TOKEN && env.SQUARE_LOCATION_ID);
const apiBase = (env) => (env.SQUARE_ENV === 'production' ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com');
const headers = (env) => ({
  Authorization: `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
  'Square-Version': SQUARE_VERSION,
});

function safeParse(s) { try { return JSON.parse(s); } catch { return []; } }

// Pre-fill Square's contact form from what the customer already typed on our
// checkout. Phone is only sent when it normalizes to E.164 — Square rejects the
// whole link on a malformed number, so a bad phone must be dropped, not passed.
function prefill(c = {}) {
  const out = {};
  if (c.email) out.buyer_email = String(c.email).trim();
  const digits = String(c.phone || '').replace(/\D/g, '');
  if (digits.length === 10) out.buyer_phone_number = `+1${digits}`;
  else if (digits.length === 11 && digits.startsWith('1')) out.buyer_phone_number = `+${digits}`;
  if (c.address && c.city && c.zip) {
    const [first, ...rest] = String(c.name || '').trim().split(/\s+/);
    out.buyer_address = {
      address_line_1: c.address,
      ...(c.address2 ? { address_line_2: c.address2 } : {}),
      locality: c.city,
      ...(c.state ? { administrative_district_level_1: c.state } : {}),
      postal_code: c.zip,
      country: 'US',
      ...(first ? { first_name: first } : {}),
      ...(rest.length ? { last_name: rest.join(' ') } : {}),
    };
  }
  return out;
}

// GET /api/square/config — frontend asks whether to offer Square.
export async function squareConfig(request, env) {
  return json({ enabled: enabled(env), env: env.SQUARE_ENV === 'production' ? 'production' : 'sandbox' });
}

// POST /api/square/create — same body as /api/order. Creates a pending order +
// a Square payment link; returns { url, order_number } for the client to redirect.
export async function squareCreate(request, env) {
  if (!enabled(env)) return json({ error: 'Square checkout is not enabled.' }, 503);
  if (!env.DB) return json({ error: 'Order service not configured.' }, 500);
  let b; try { b = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }

  // 1) Create the order (authoritative pricing) as awaiting_payment, no emails yet.
  const resp = await processOrder({ ...b, payment_method: 'square' }, env, { silent: true });
  let data = {}; try { data = await resp.json(); } catch {}
  if (!resp.ok || !data.order_number) {
    return json({ error: data.error || 'Could not start checkout.' }, resp.status || 400);
  }
  const { order_number, total } = data;
  const cents = Math.round(Number(total) * 100);
  if (!(cents > 0)) return json({ error: 'Invalid order total.' }, 400);

  // 2) Create the Square-hosted payment link for exactly that total.
  const sig = await signOrder(order_number, env.ADMIN_PASSWORD);
  const redirect_url = `${SITE}/api/square/return?o=${encodeURIComponent(order_number)}&t=${sig}`;
  const createLink = async (prefillData, key) => {
    try {
      const r = await fetch(`${apiBase(env)}/v2/online-checkout/payment-links`, {
        method: 'POST',
        headers: headers(env),
        body: JSON.stringify({
          idempotency_key: key,
          quick_pay: {
            name: `Omen Labs — Order ${order_number}`,
            price_money: { amount: cents, currency: 'USD' },
            location_id: env.SQUARE_LOCATION_ID,
          },
          checkout_options: {
            redirect_url,
            ask_for_shipping_address: false,
            // Discounts are applied on our checkout; a Square-side coupon would break
            // the amount check in squareReturn.
            enable_coupon: false,
            enable_loyalty: false,
            // Wallets appear only where the device supports them (Apple Pay = Safari/Apple devices).
            accepted_payment_methods: { apple_pay: true, google_pay: true, cash_app_pay: true, afterpay_clearpay: false },
          },
          ...(prefillData ? { pre_populated_data: prefillData } : {}),
        }),
      });
      return await r.json();
    } catch (e) {
      return { _error: String(e) };
    }
  };
  let link = await createLink(prefill(b?.customer), order_number);
  // Pre-fill is a convenience: if Square rejects one of those fields (e.g. an
  // email it considers invalid), retry bare rather than losing the sale.
  const prefillRejected = (link?.errors || []).some((e) => String(e.field || '').startsWith('pre_populated_data'));
  if (!link?.payment_link?.url && prefillRejected) {
    link = await createLink(null, `${order_number}-np`);
  }
  const url = link?.payment_link?.url;
  const squareOrderId = link?.payment_link?.order_id;
  if (!url) {
    // Couldn't start Square — cancel the pending order so it doesn't linger.
    try { await env.DB.prepare("UPDATE orders SET status='cancelled' WHERE order_number=?").bind(order_number).run(); } catch {}
    const detail = link?.errors || link?._error || null;
    return json({ error: 'Could not start Square checkout.', detail }, 502);
  }
  // Remember the Square order id so the return step can verify payment.
  try { await env.DB.prepare('ALTER TABLE orders ADD COLUMN square_order_id TEXT').run(); } catch {}
  try { await env.DB.prepare('UPDATE orders SET square_order_id=? WHERE order_number=?').bind(squareOrderId || null, order_number).run(); } catch {}

  return json({ ok: true, order_number, total, url });
}

// GET /api/square/return?o=<order>&t=<sig> — Square redirects here after payment.
export async function squareReturn(request, env) {
  const url = new URL(request.url);
  const o = url.searchParams.get('o');
  const t = url.searchParams.get('t');
  if (!o || !(await verifyOrder(o, t, env.ADMIN_PASSWORD))) return redirect(`${SITE}/checkout`);
  if (!env.DB) return redirect(`${SITE}/checkout`);

  const order = await env.DB.prepare('SELECT * FROM orders WHERE order_number=?').bind(o).first();
  if (!order) return redirect(`${SITE}/checkout`);
  // Already settled (e.g. refreshed return URL) — just show the confirmation.
  if (order.status && order.status !== 'awaiting_payment' && order.status !== 'cancelled') {
    return redirect(`${SITE}/order-confirmed?order=${encodeURIComponent(o)}&paid=1`);
  }

  // Verify the Square order was actually paid, and that its amount matches ours.
  // A payment-link order can sit in state OPEN with the payment attached (a tender
  // and nothing left due) rather than flipping to COMPLETED — so confirm by the
  // tender + amount-due, not just the state.
  let paid = false;
  if (order.square_order_id && enabled(env)) {
    try {
      const r = await fetch(`${apiBase(env)}/v2/orders/${encodeURIComponent(order.square_order_id)}`, { headers: headers(env) });
      const d = await r.json();
      const sq = d?.order;
      const cents = Math.round(Number(order.total) * 100);
      const amountOk = sq && Number(sq.total_money?.amount) === cents;
      const hasTender = Array.isArray(sq?.tenders) && sq.tenders.length > 0;
      const dueZero = sq?.net_amount_due_money == null || Number(sq.net_amount_due_money.amount) === 0;
      if (amountOk && (sq.state === 'COMPLETED' || (hasTender && dueZero))) paid = true;
    } catch {}
  }

  if (!paid) {
    // Not completed — leave the order awaiting and send them to the status page.
    return redirect(`${SITE}/order-confirmed?order=${encodeURIComponent(o)}&pending=1`);
  }

  // Mark paid, decrement stock, and send the confirmation + owner emails.
  const items = safeParse(order.items);
  try {
    await env.DB.prepare("UPDATE orders SET status='confirmed', payment_method='Square — paid' WHERE order_number=?").bind(o).run();
  } catch {}
  try { await decrementStockForOrder(env, { order_number: o, items, stock_decremented: order.stock_decremented || 0 }); } catch {}

  if (env.RESEND_API_KEY) {
    const orderObj = { ...order, items, billing: order.billing ? safeParse(order.billing) : null, payment_method: 'Square — paid' };
    const sig = await signOrder(o, env.ADMIN_PASSWORD);
    const imageUrl = `${SITE}/api/receipt-image?o=${encodeURIComponent(o)}&t=${sig}&type=confirmation`;
    try {
      await sendEmail(env, { to: order.customer_email, subject: `Order Confirmed — ${o}`, html: renderImageEmail({ imageUrl, order: orderObj }) });
      await sendEmail(env, {
        to: env.ORDER_TO_EMAIL || 'support@omenlabs.co',
        subject: `New Order ${o} — ${order.customer_name} — $${Number(order.total).toFixed(2)} (Square)`,
        html: renderOwnerNotification(orderObj),
        replyTo: order.customer_email,
      });
    } catch {}
  }

  return redirect(`${SITE}/order-confirmed?order=${encodeURIComponent(o)}&paid=1`);
}
