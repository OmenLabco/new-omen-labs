// Order handler — saves the order to D1 (if configured) and sends branded emails via Resend.
//
// Environment:
//   DB               - D1 database binding (optional; orders saved if present)
//   RESEND_API_KEY   - Resend API key (optional; emails sent if present)
//   ORDER_TO_EMAIL   - owner notification inbox (default: support@omenlabs.co)
//   ORDER_FROM_EMAIL - verified sender (default: Omen Labs <orders@omenlabs.co>)

import { renderImageEmail, renderOwnerNotification, sendEmail } from './email.js';
import { signOrder, verifyOrder } from './token.js';
import { priceFor } from './prices.js';
import { getStockMap, decrementStockForOrder } from './stock.js';
import { getPromo, promoUsable, incrementPromoUse } from './promos.js';
import { computeBundleDiscount } from '../src/data/bundles.js';
import { AWAITING_COA_SKUS } from '../src/data/products.js';
import { markCheckoutConverted } from './funnel.js';

// GET /api/order/status?o=ORDER&t=TOKEN — public status poll for the awaiting page.
// Token-gated (HMAC) so order numbers can't be enumerated. Returns only status.
export async function orderStatus(request, env) {
  const url = new URL(request.url);
  const o = url.searchParams.get('o');
  const t = url.searchParams.get('t');
  if (!o || !(await verifyOrder(o, t, env.ADMIN_PASSWORD))) return json({ error: 'Not found' }, 404);
  if (!env.DB) return json({ error: 'Unavailable' }, 503);
  const row = await env.DB.prepare('SELECT status FROM orders WHERE order_number = ?').bind(o).first();
  if (!row) return json({ error: 'Not found' }, 404);
  return json({ status: row.status });
}
import {
  getAffiliateByCode,
  commissionTier,
  affiliateSalesCount,
  isNewCustomer,
  NEW_CUSTOMER_DISCOUNT,
  RETURNING_CUSTOMER_DISCOUNT,
} from './affiliate.js';
import {
  customerFromToken,
  membershipStatus,
  POINTS_PER_DOLLAR,
  POINTS_REDEEM_VALUE,
  REDEEM_STEP,
} from './customer.js';

const SITE = 'https://omenlabs.co';
// Zelle recipient shown in the payment-instructions email (must be the email/phone
// enrolled with your Zelle). Keep in sync with the value shown at checkout.
const ZELLE_HANDLE = '“omenlabs” — Zelle to (509) 842-7930';
const CASHAPP_HANDLE = '$omenlabs'; // Cash App $cashtag shown to customers
const CRYPTO_DISCOUNT_RATE = 0.10; // 10% off when paying with crypto
const SHIPPING_OPTIONS = {
  ground: { label: '3–5 Day Ground', price: 9.99 },
  first: { label: '2-Day First Class', price: 14.99 },
  pickup: { label: 'Local Pickup — Spokane, WA', price: 0 },
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Manual crypto receive addresses (mirror of src/data/cryptoWallets.js)
const CRYPTO_WALLETS = [
  { coin: 'USDC', network: 'Solana', address: '3Ki9NTBDiDhobUEW7UwMJ8Dnad4zjvK1smGwLpVDF2Kp' },
  { coin: 'USDT', network: 'Tron (TRC-20)', address: 'TNVyMC9hkAUamS2jZTjxZagwbtN2voFtVz' },
  { coin: 'BTC', network: 'Bitcoin', address: 'bc1qfv4s0yl33apzafnagkhn4fuh7t5qyqkr7tdwcf' },
  { coin: 'USDC', network: 'Polygon', address: '0x0EdB90f6d02db9B1D8CE7175523F042D6fa9ddA9' },
  { coin: 'USDT', network: 'Solana', address: '3Ki9NTBDiDhobUEW7UwMJ8Dnad4zjvK1smGwLpVDF2Kp' },
];

// Branded dark email telling the customer how to complete their crypto payment.
function renderCryptoInstructions(order) {
  const rows = CRYPTO_WALLETS.map((w) => `
    <div style="background:#15151a;border:1px solid #2a2b2f;border-radius:10px;padding:12px 14px;margin-bottom:8px;">
      <p style="margin:0 0 4px;font-size:13px;color:#fff;font-weight:bold;">${w.coin} <span style="color:#7c83ff;font-weight:normal;">· ${w.network}</span></p>
      <p style="margin:0;font-size:12px;color:#a9abb3;word-break:break-all;font-family:monospace;">${w.address}</p>
    </div>`).join('');
  return `<!doctype html><html><body style="margin:0;background:#0a0a0b;font-family:Arial,Helvetica,sans-serif;color:#e8e8ea;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="font-size:13px;letter-spacing:.22em;text-transform:uppercase;color:#7c83ff;margin:0 0 18px;">Omen Labs</p>
    <h1 style="font-size:22px;margin:0 0 8px;color:#fff;">Complete your crypto payment</h1>
    <p style="font-size:14px;line-height:1.6;color:#a9abb3;margin:0 0 18px;">Your order <b style="color:#fff;">${order.order_number}</b> is reserved. Send <b style="color:#fff;">$${Number(order.total).toFixed(2)}</b> (USD equivalent) to ONE of the addresses below:</p>
    ${rows}
    <p style="font-size:13px;line-height:1.6;color:#a9abb3;margin:18px 0 8px;">⚠️ Send only the matching coin on the matching network — wrong-network transfers are lost. After you send, reply to this email with your transaction ID so we can confirm and ship your order.</p>
    <p style="font-size:11px;color:#6b6d77;margin:22px 0 0;">Research Use Only — Not for Human Consumption · support@omenlabs.co</p>
  </div></body></html>`;
}

// Order number uses only Roman-numeral letters after "OMEN-"
function renderZelleInstructions(order, handle) {
  return `<!doctype html><html><body style="margin:0;background:#0a0a0b;font-family:Arial,Helvetica,sans-serif;color:#e8e8ea;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="font-size:13px;letter-spacing:.22em;text-transform:uppercase;color:#7c83ff;margin:0 0 18px;">Omen Labs</p>
    <h1 style="font-size:22px;margin:0 0 8px;color:#fff;">Complete your Zelle payment</h1>
    <p style="font-size:14px;line-height:1.6;color:#a9abb3;margin:0 0 22px;">Your order <b style="color:#fff;">${order.order_number}</b> is reserved. To finish, send your payment via Zelle:</p>
    <div style="background:#15151a;border:1px solid #2a2b2f;border-radius:12px;padding:20px;margin-bottom:22px;">
      <p style="margin:0 0 10px;font-size:13px;color:#a9abb3;">Send <b style="color:#fff;font-size:18px;">$${Number(order.total).toFixed(2)}</b> to:</p>
      <p style="margin:0 0 14px;font-size:16px;color:#7c83ff;font-weight:bold;">${handle}</p>
      <p style="margin:0;font-size:13px;color:#a9abb3;">In the Zelle <b style="color:#fff;">memo / note</b>, enter your order number:</p>
      <p style="margin:6px 0 0;font-size:18px;color:#fff;font-weight:bold;letter-spacing:.05em;">${order.order_number}</p>
    </div>
    <p style="font-size:13px;line-height:1.6;color:#a9abb3;margin:0 0 8px;">Once we receive your payment, your order is confirmed automatically and you'll get a confirmation email. Including the order number in the memo is required so we can match your payment.</p>
    <p style="font-size:11px;color:#6b6d77;margin:22px 0 0;">Research Use Only — Not for Human Consumption · support@omenlabs.co</p>
  </div></body></html>`;
}

// Cash App instructions — customer sends the total to our $cashtag with the
// order number in the "For" note so the payment auto-reconciles.
function renderCashappInstructions(order, handle) {
  return `<!doctype html><html><body style="margin:0;background:#0a0a0b;font-family:Arial,Helvetica,sans-serif;color:#e8e8ea;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="font-size:13px;letter-spacing:.22em;text-transform:uppercase;color:#7c83ff;margin:0 0 18px;">Omen Labs</p>
    <h1 style="font-size:22px;margin:0 0 8px;color:#fff;">Complete your Cash App payment</h1>
    <p style="font-size:14px;line-height:1.6;color:#a9abb3;margin:0 0 22px;">Your order <b style="color:#fff;">${order.order_number}</b> is reserved. To finish, send your payment on Cash App:</p>
    <div style="background:#15151a;border:1px solid #2a2b2f;border-radius:12px;padding:20px;margin-bottom:22px;">
      <p style="margin:0 0 10px;font-size:13px;color:#a9abb3;">Send <b style="color:#fff;font-size:18px;">$${Number(order.total).toFixed(2)}</b> to:</p>
      <p style="margin:0 0 14px;font-size:20px;color:#00d54b;font-weight:bold;">${handle}</p>
      <p style="margin:0;font-size:13px;color:#a9abb3;">In the Cash App <b style="color:#fff;">"For" note</b>, enter your order number:</p>
      <p style="margin:6px 0 0;font-size:18px;color:#fff;font-weight:bold;letter-spacing:.05em;">${order.order_number}</p>
    </div>
    <p style="font-size:13px;line-height:1.6;color:#a9abb3;margin:0 0 8px;">Once we receive your payment, your order is confirmed automatically and you'll get a confirmation email. Including the order number in the note is required so we can match your payment.</p>
    <p style="font-size:11px;color:#6b6d77;margin:22px 0 0;">Research Use Only — Not for Human Consumption · support@omenlabs.co</p>
  </div></body></html>`;
}

// Order number uses only Roman-numeral letters after "OMEN-"
// Uses crypto-grade randomness so order numbers aren't predictable.
export function orderNumber() {
  const chars = 'XIVLCDM';
  const buf = new Uint8Array(6);
  crypto.getRandomValues(buf);
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[buf[i] % chars.length];
  return `OMEN-${code}`;
}

export async function handleOrder(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  return processOrder(body, env);
}

// Core order pipeline. opts.paid=true marks it confirmed + paid (used by an
// already-captured PayPal payment) and decrements stock immediately.
export async function processOrder(body, env, opts = {}) {
  const { customer = {}, items: rawItems = [], payment_method = 'manual', billing = null, shipping_method = 'ground', affiliate_code = null, customer_token = null, points_to_redeem = 0, sid = null } = body;

  if (!customer.name || !customer.email || !customer.address || !customer.city || !customer.zip) {
    return json({ error: 'Missing required shipping fields.' }, 400);
  }
  // Compliance: a named company / organization is required on every order.
  if (!String(customer.company_name || '').trim()) {
    return json({ error: 'Company / organization name is required.' }, 400);
  }
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return json({ error: 'Cart is empty.' }, 400);
  }
  if (rawItems.length > 50) {
    return json({ error: 'Too many line items.' }, 400);
  }

  // ---- Authoritative server-side pricing ----
  // NEVER trust client-sent prices. Look up each item's price from our own
  // catalog by product_id, clamp quantity, apply the multi-vial discount, and
  // rebuild the line items so totals, emails, and records all use real prices.
  const QTY_DISCOUNTS = [
    { minQty: 10, pct: 15 },
    { minQty: 5, pct: 10 },
    { minQty: 3, pct: 5 },
  ];
  const qtyPct = (q) => (QTY_DISCOUNTS.find((t) => q >= t.minQty)?.pct || 0);

  const pricedItems = [];
  for (const i of rawItems) {
    const entry = priceFor(i && i.product_id);
    if (!entry) return json({ error: `Unavailable item: ${i?.product_name || i?.product_id || 'unknown'}` }, 400);
    if (entry.comingSoon || entry.soldOut) return json({ error: `Item not available for purchase: ${i?.product_name || i?.product_id}` }, 400);
    if (AWAITING_COA_SKUS.has(i && i.product_id)) return json({ error: `Currently unavailable (awaiting COA): ${i?.product_name || i?.product_id}` }, 400);
    let q = Math.floor(Number(i.quantity));
    if (!Number.isFinite(q) || q < 1) return json({ error: 'Invalid quantity.' }, 400);
    if (q > 100) q = 100;
    const unit = +(entry.price * (1 - qtyPct(q) / 100)).toFixed(2);
    pricedItems.push({
      product_id: i.product_id,
      product_name: i.product_name || i.product_id,
      quantity: q,
      price: unit,
    });
  }
  // Block ordering items we track that have hit zero stock.
  if (env.DB) {
    const stock = await getStockMap(env);
    for (const it of pricedItems) {
      if (it.product_id in stock && stock[it.product_id] <= 0) {
        return json({ error: `Sold out: ${it.product_name}. Please remove it to continue.` }, 409);
      }
    }
  }

  // From here on, use the server-priced line items only.
  const items = pricedItems;
  const subtotal = +(items.reduce((s, i) => s + i.price * i.quantity, 0)).toFixed(2);

  // ---- Curated bundle discount (authoritative) ----
  // Applies when a full bundle set is in the cart. Priced from our own table.
  // Every downstream discount (crypto, code, points) is computed on the
  // POST-BUNDLE amount so they layer on the already-discounted stack.
  const bundleResult = computeBundleDiscount(items, (sku) => priceFor(sku)?.price ?? null);
  const bundleDiscount = bundleResult.discount;
  const hasBundle = bundleDiscount > 0;
  const postBundle = +(subtotal - bundleDiscount).toFixed(2);

  const isCrypto = payment_method === 'crypto';
  const cryptoDiscount = isCrypto ? +(postBundle * CRYPTO_DISCOUNT_RATE).toFixed(2) : 0;

  // Validate affiliate code against the database
  const affiliate = affiliate_code ? await getAffiliateByCode(env, affiliate_code) : null;
  const affCode = affiliate ? affiliate.code : null;
  // New customers get 20% off; returning customers get 10%
  const newCustomer = affiliate ? await isNewCustomer(env, customer.email) : false;
  const custDiscountRate = newCustomer ? NEW_CUSTOMER_DISCOUNT : RETURNING_CUSTOMER_DISCOUNT;
  // A bundle is EXCLUSIVE with the affiliate customer-discount: when a bundle is
  // present we suppress the affiliate % (the code still tracks + earns commission).
  const affiliateDiscount = (affiliate && !hasBundle) ? +(postBundle * custDiscountRate).toFixed(2) : 0;
  // Tiered commission — computed on the POST-BUNDLE amount.
  const tier = affiliate ? commissionTier(await affiliateSalesCount(env, affiliate.code)) : null;
  const commission = affiliate ? +(postBundle * tier.rate).toFixed(2) : 0;

  // Flat promo code (e.g. WELCOME10) — only when the code isn't an affiliate.
  // Promo codes STACK with a bundle (applied to the post-bundle amount).
  let promoCode = null;
  let promoDiscount = 0;
  if (!affiliate && affiliate_code) {
    const promo = await getPromo(env, affiliate_code);
    if (promo && promoUsable(promo) && (!promo.firstOrderOnly || await isNewCustomer(env, customer.email))) {
      promoCode = promo.code;
      promoDiscount = +(postBundle * (promo.pct / 100)).toFixed(2);
    }
  }
  // The single code-based discount recorded on the order (affiliate OR promo).
  const codeDiscount = affiliate ? affiliateDiscount : promoDiscount;
  const codeUsed = affCode || promoCode;

  // Logged-in customer: membership perks + points
  const account = customer_token ? await customerFromToken(env, customer_token) : null;
  const acctTier = account ? membershipStatus(account) : null;

  // Points redemption (logged-in only): increments of REDEEM_STEP, capped by balance and subtotal
  let pointsRedeemed = 0;
  let pointsValue = 0;
  if (account && points_to_redeem > 0) {
    const maxByBalance = Math.floor((account.points || 0) / REDEEM_STEP) * REDEEM_STEP;
    const requested = Math.floor(Number(points_to_redeem) / REDEEM_STEP) * REDEEM_STEP;
    pointsRedeemed = Math.max(0, Math.min(requested, maxByBalance));
    const maxValue = +(postBundle - cryptoDiscount - codeDiscount).toFixed(2);
    pointsValue = Math.min(+(pointsRedeemed * POINTS_REDEEM_VALUE).toFixed(2), Math.max(0, maxValue));
  }

  const discount = +(bundleDiscount + cryptoDiscount + codeDiscount + pointsValue).toFixed(2);
  const shipOpt = SHIPPING_OPTIONS[shipping_method] || SHIPPING_OPTIONS.ground;
  // Free shipping for VIP members, or any order at/above the threshold.
  const FREE_SHIP_THRESHOLD = 150; // KEEP IN SYNC with src/lib/shipping.js
  const freeShipMember = !!(acctTier && acctTier.freeShipping);
  const freeShipThreshold = subtotal >= FREE_SHIP_THRESHOLD;
  const freeShip = freeShipMember || freeShipThreshold;
  const shipping_cost = freeShip ? 0 : shipOpt.price;
  const shippingLabel = freeShipMember ? `${shipOpt.label} (Free — ${acctTier.name})` : freeShipThreshold ? `${shipOpt.label} (Free shipping)` : shipOpt.label;
  let total = +(subtotal - discount + shipping_cost).toFixed(2);
  const isZelle = payment_method === 'zelle';
  const isCashapp = payment_method === 'cashapp';
  // Crypto: nudge the total by a few cents so it's UNIQUE among open awaiting
  // crypto orders — lets the on-chain watcher map a payment to exactly one order.
  if (isCrypto && env.DB) {
    try {
      for (let i = 0; i < 100; i++) {
        const clash = await env.DB.prepare(
          "SELECT 1 FROM orders WHERE status = 'awaiting_payment' AND payment_method LIKE 'Crypto%' AND ABS(total - ?) < 0.005"
        ).bind(total).first();
        if (!clash) break;
        total = +(total + 0.01).toFixed(2);
      }
    } catch {}
  }
  const paymentLabel = opts.paid ? (opts.paymentLabel || 'Paid') : (isZelle ? 'Zelle — awaiting payment' : isCashapp ? 'Cash App — awaiting payment' : isCrypto ? 'Crypto — awaiting payment' : 'Manual — invoice to follow');
  // New orders start awaiting payment (Zelle/Cash App/crypto auto-reconcile;
  // manual/invoice marked paid by admin). opts.paid = already captured (PayPal).
  const orderStatus = opts.paid ? 'confirmed' : 'awaiting_payment';

  // Points earned (on subtotal, multiplied by tier)
  const pointsEarned = account ? Math.floor(subtotal * POINTS_PER_DOLLAR * acctTier.multiplier) : 0;

  const order_number = orderNumber();
  const created_date = new Date().toISOString();
  const billingJson = billing ? JSON.stringify(billing) : null;

  // 1) Save to D1 (source of truth for the admin page)
  if (env.DB) {
    try {
      // Ensure the company column exists (lazy migration for existing DBs)
      try { await env.DB.prepare('ALTER TABLE orders ADD COLUMN company TEXT').run(); } catch {}
      // Bundle discount column (lazy migration).
      try { await env.DB.prepare('ALTER TABLE orders ADD COLUMN bundle_discount REAL DEFAULT 0').run(); } catch {}
      // Company / organization name column (lazy migration) — compliance.
      try { await env.DB.prepare('ALTER TABLE orders ADD COLUMN company_name TEXT').run(); } catch {}
      await env.DB.prepare(
        `INSERT INTO orders
         (order_number, customer_name, customer_email, customer_phone, company, company_name, address, address2, city, state, zip, country, notes, items, subtotal, shipping_cost, shipping_method, discount, crypto_discount, affiliate_discount, bundle_discount, affiliate_code, commission, points_earned, points_redeemed, points_value, total, payment_method, billing, status, created_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      )
        .bind(
          order_number,
          customer.name,
          customer.email,
          customer.phone || '',
          customer.company || '',
          customer.company_name || '',
          customer.address,
          customer.address2 || '',
          customer.city,
          customer.state || '',
          customer.zip,
          customer.country || 'United States',
          customer.notes || '',
          JSON.stringify(items),
          subtotal,
          shipping_cost,
          shippingLabel,
          discount,
          cryptoDiscount,
          codeDiscount,
          bundleDiscount,
          codeUsed,
          commission,
          pointsEarned,
          pointsRedeemed,
          pointsValue,
          total,
          paymentLabel,
          billingJson,
          orderStatus,
          created_date
        )
        .run();

      // Update the customer's points balance + lifetime spend
      if (account) {
        const newPoints = (account.points || 0) - pointsRedeemed + pointsEarned;
        const newSpend = +((account.lifetime_spend || 0) + total).toFixed(2);
        await env.DB.prepare('UPDATE customers SET points = ?, lifetime_spend = ? WHERE id = ?')
          .bind(newPoints, newSpend, account.id)
          .run();
      }
      // Count a promo-code redemption (for usage limits / reporting)
      if (promoCode) await incrementPromoUse(env, promoCode);
    } catch (e) {
      return json({ error: 'Failed to save order.', detail: String(e) }, 500);
    }
  }

  // Build an order object for the email templates
  const order = {
    order_number,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone || '',
    address: customer.address,
    address2: customer.address2 || '',
    city: customer.city,
    state: customer.state || '',
    zip: customer.zip,
    country: customer.country || 'United States',
    notes: customer.notes || '',
    items,
    subtotal,
    shipping_cost,
    shipping_method: shippingLabel,
    discount,
    crypto_discount: cryptoDiscount,
    affiliate_discount: codeDiscount,
    affiliate_code: codeUsed,
    commission,
    points_earned: pointsEarned,
    points_redeemed: pointsRedeemed,
    points_value: pointsValue,
    total,
    payment_method: paymentLabel,
    billing,
  };

  // Mark this session's checkout as converted (funnel tracking).
  if (sid) await markCheckoutConverted(env, sid);

  // Already-paid (PayPal capture): subtract stock now, just like a confirmed order.
  if (opts.paid) { try { await decrementStockForOrder(env, { order_number, items, stock_decremented: 0 }); } catch {} }

  // 2) Emails via Resend (best effort — order is already saved)
  if (env.RESEND_API_KEY) {
    const ownerInbox = env.ORDER_TO_EMAIL || 'support@omenlabs.co';
    const token = await signOrder(order_number, env.ADMIN_PASSWORD);
    const imageUrl = `${SITE}/api/receipt-image?o=${encodeURIComponent(order_number)}&t=${token}&type=confirmation`;
    if (isZelle) {
      await sendEmail(env, {
        to: customer.email,
        subject: `Complete your Zelle payment — ${order_number}`,
        html: renderZelleInstructions(order, ZELLE_HANDLE),
      });
    } else if (isCashapp) {
      await sendEmail(env, {
        to: customer.email,
        subject: `Complete your Cash App payment — ${order_number}`,
        html: renderCashappInstructions(order, CASHAPP_HANDLE),
      });
    } else if (isCrypto) {
      await sendEmail(env, {
        to: customer.email,
        subject: `Complete your crypto payment — ${order_number}`,
        html: renderCryptoInstructions(order),
      });
    } else {
      await sendEmail(env, {
        to: customer.email,
        subject: `Order Confirmed — ${order_number}`,
        html: renderImageEmail({ imageUrl, order }),
      });
    }
    await sendEmail(env, {
      to: ownerInbox,
      subject: `New Order ${order_number} — ${customer.name} — $${total.toFixed(2)}`,
      html: renderOwnerNotification(order),
      replyTo: customer.email,
    });
  }

  if (!env.DB && !env.RESEND_API_KEY) {
    return json({ error: 'Order service not configured.' }, 500);
  }

  const status_token = await signOrder(order_number, env.ADMIN_PASSWORD);
  return json({ ok: true, order_number, points_earned: pointsEarned, points_redeemed: pointsRedeemed, status_token });
}
