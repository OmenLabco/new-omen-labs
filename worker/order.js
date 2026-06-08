// Order handler — saves the order to D1 (if configured) and sends branded emails via Resend.
//
// Environment:
//   DB               - D1 database binding (optional; orders saved if present)
//   RESEND_API_KEY   - Resend API key (optional; emails sent if present)
//   ORDER_TO_EMAIL   - owner notification inbox (default: support@omenlabs.co)
//   ORDER_FROM_EMAIL - verified sender (default: Omen Labs <orders@omenlabs.co>)

import { renderImageEmail, renderOwnerNotification, sendEmail } from './email.js';
import { signOrder } from './token.js';
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
const CRYPTO_DISCOUNT_RATE = 0.10; // 10% off when paying with crypto
const SHIPPING_OPTIONS = {
  ground: { label: '3–5 Day Ground', price: 9.99 },
  first: { label: '2-Day First Class', price: 14.99 },
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Order number uses only Roman-numeral letters after "OMEN-"
function orderNumber() {
  const chars = 'XIVLCDM';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `OMEN-${code}`;
}

export async function handleOrder(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const { customer = {}, items = [], payment_method = 'manual', billing = null, shipping_method = 'ground', affiliate_code = null, customer_token = null, points_to_redeem = 0 } = body;

  if (!customer.name || !customer.email || !customer.address || !customer.city || !customer.zip) {
    return json({ error: 'Missing required shipping fields.' }, 400);
  }
  if (!Array.isArray(items) || items.length === 0) {
    return json({ error: 'Cart is empty.' }, 400);
  }

  // Authoritative server-side pricing
  const subtotal = items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
  const isCrypto = payment_method === 'crypto';
  const cryptoDiscount = isCrypto ? +(subtotal * CRYPTO_DISCOUNT_RATE).toFixed(2) : 0;

  // Validate affiliate code against the database
  const affiliate = affiliate_code ? await getAffiliateByCode(env, affiliate_code) : null;
  const affCode = affiliate ? affiliate.code : null;
  // New customers get 20% off; returning customers get 10%
  const newCustomer = affiliate ? await isNewCustomer(env, customer.email) : false;
  const custDiscountRate = newCustomer ? NEW_CUSTOMER_DISCOUNT : RETURNING_CUSTOMER_DISCOUNT;
  const affiliateDiscount = affiliate ? +(subtotal * custDiscountRate).toFixed(2) : 0;
  // Tiered commission based on the affiliate's existing sales
  const tier = affiliate ? commissionTier(await affiliateSalesCount(env, affiliate.code)) : null;
  const commission = affiliate ? +(subtotal * tier.rate).toFixed(2) : 0;

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
    const maxValue = +(subtotal - cryptoDiscount - affiliateDiscount).toFixed(2);
    pointsValue = Math.min(+(pointsRedeemed * POINTS_REDEEM_VALUE).toFixed(2), Math.max(0, maxValue));
  }

  const discount = +(cryptoDiscount + affiliateDiscount + pointsValue).toFixed(2);
  const shipOpt = SHIPPING_OPTIONS[shipping_method] || SHIPPING_OPTIONS.ground;
  const freeShip = acctTier && acctTier.freeShipping;
  const shipping_cost = freeShip ? 0 : shipOpt.price;
  const shippingLabel = freeShip ? `${shipOpt.label} (Free — ${acctTier.name})` : shipOpt.label;
  const total = +(subtotal - discount + shipping_cost).toFixed(2);
  const paymentLabel = isCrypto ? 'Crypto (10% discount applied)' : 'Manual — invoice to follow';

  // Points earned (on subtotal, multiplied by tier)
  const pointsEarned = account ? Math.floor(subtotal * POINTS_PER_DOLLAR * acctTier.multiplier) : 0;

  const order_number = orderNumber();
  const created_date = new Date().toISOString();
  const billingJson = billing ? JSON.stringify(billing) : null;

  // 1) Save to D1 (source of truth for the admin page)
  if (env.DB) {
    try {
      await env.DB.prepare(
        `INSERT INTO orders
         (order_number, customer_name, customer_email, customer_phone, address, address2, city, state, zip, country, notes, items, subtotal, shipping_cost, shipping_method, discount, crypto_discount, affiliate_discount, affiliate_code, commission, points_earned, points_redeemed, points_value, total, payment_method, billing, status, created_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      )
        .bind(
          order_number,
          customer.name,
          customer.email,
          customer.phone || '',
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
          affiliateDiscount,
          affCode,
          commission,
          pointsEarned,
          pointsRedeemed,
          pointsValue,
          total,
          paymentLabel,
          billingJson,
          'processing',
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
    affiliate_discount: affiliateDiscount,
    affiliate_code: affCode,
    commission,
    points_earned: pointsEarned,
    points_redeemed: pointsRedeemed,
    points_value: pointsValue,
    total,
    payment_method: paymentLabel,
    billing,
  };

  // 2) Emails via Resend (best effort — order is already saved)
  if (env.RESEND_API_KEY) {
    const ownerInbox = env.ORDER_TO_EMAIL || 'support@omenlabs.co';
    const token = await signOrder(order_number, env.ADMIN_PASSWORD);
    const imageUrl = `${SITE}/api/receipt-image?o=${encodeURIComponent(order_number)}&t=${token}&type=confirmation`;
    await sendEmail(env, {
      to: customer.email,
      subject: `Order Confirmed — ${order_number}`,
      html: renderImageEmail({ imageUrl, order }),
    });
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

  return json({ ok: true, order_number, points_earned: pointsEarned, points_redeemed: pointsRedeemed });
}
