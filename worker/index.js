import { handleOrder, orderStatus } from './order.js';
import { listOrders, updateOrder, adminLogin, listAffiliates, listCustomers, setMembership, deleteCustomer, zelleSetup, cryptoCheck, deleteOrder, profitCosts, listPayouts, updatePayout } from './admin.js';
import { receiptImage } from './receiptImage.js';
import { verifyOrder } from './token.js';
import { loginAffiliate, affiliateStats, validateCode, requestPayout } from './affiliate.js';
import { signupCustomer, loginCustomer, customerMe, enrollAffiliate } from './customer.js';
import { withSecurity, rateLimit, tooMany, clientIp } from './security.js';
import { handleZelleNotify } from './zelle.js';
import { listStock, updateStock, publicStock } from './stock.js';
import { handleSubscribe, listSubscribers } from './subscribe.js';
import { syncCart, runAbandonedCartWatch } from './cart.js';
import { runCryptoWatch } from './cryptoWatch.js';
import { handleShipstationWebhook, runShipstationSync } from './shipstation.js';
import { runTrackingWatch } from './tracking.js';
import { recordPresence, liveStats } from './presence.js';
import { createPaymentSession, paymentCallback, paymentStatus } from './payment.js';
import { handleIncomingEmail } from './emailIn.js';

// Per-endpoint rate limits (max attempts / window). Keyed by client IP.
const LIMITS = {
  '/api/admin/login': { max: 8, windowMs: 10 * 60 * 1000 },
  '/api/customer/login': { max: 10, windowMs: 10 * 60 * 1000 },
  '/api/affiliate/login': { max: 10, windowMs: 10 * 60 * 1000 },
  '/api/customer/signup': { max: 10, windowMs: 60 * 60 * 1000 },
  '/api/affiliate/payout': { max: 12, windowMs: 60 * 60 * 1000 },
  '/api/subscribe': { max: 20, windowMs: 60 * 60 * 1000 },
  '/api/order': { max: 40, windowMs: 10 * 60 * 1000 },
  '/api/pay/session': { max: 40, windowMs: 10 * 60 * 1000 },
};
const MAX_BODY_BYTES = 100 * 1024; // 100 KB cap on any request body

const STATUS_MESSAGE = {
  processing: "Your order has been received and is being processed. You'll receive a shipping notification once your compounds are dispatched.",
  confirmed: 'Your order has been confirmed and is being prepared for shipment.',
  shipped: 'Good news — your order is on its way! Use the tracking number below to follow its progress.',
  out_for_delivery: 'Your order is out for delivery and should arrive today.',
  delivered: 'Your order has been delivered. Thank you for choosing Omen Labs.',
};

function safeParse(s) {
  try { return JSON.parse(s || '[]'); } catch { return []; }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // Reject oversized request bodies before doing any work.
    if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && pathname.startsWith('/api/')) {
      const len = Number(request.headers.get('Content-Length') || 0);
      if (len > MAX_BODY_BYTES) {
        return withSecurity(new Response(JSON.stringify({ error: 'Request too large.' }), { status: 413, headers: { 'Content-Type': 'application/json' } }));
      }
    }

    // Rate-limit sensitive endpoints by client IP.
    const limit = LIMITS[pathname];
    if (limit && method === 'POST') {
      const { allowed, retryAfter } = await rateLimit(env, `${pathname}:${clientIp(request)}`, limit.max, limit.windowMs);
      if (!allowed) return withSecurity(tooMany(retryAfter));
    }

    return withSecurity(await route(request, env, url, pathname, method));
  },

  // Cron trigger: auto-confirm crypto payments + advance shipped orders via USPS tracking.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(Promise.all([runCryptoWatch(env), runShipstationSync(env), runTrackingWatch(env), runAbandonedCartWatch(env)]));
  },

  // Email Routing: Cash App receipt emails → auto-confirm the matching order.
  async email(message, env, ctx) {
    ctx.waitUntil(handleIncomingEmail(message, env));
  },
};

async function route(request, env, url, pathname, method) {
    if (pathname === '/api/order') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return handleOrder(request, env);
    }
    if (pathname === '/api/order/status') {
      if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return orderStatus(request, env);
    }
    if (pathname === '/api/presence') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return recordPresence(request, env);
    }
    if (pathname === '/api/admin/live') {
      if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return liveStats(request, env);
    }

    // Card payments (hosted/tokenized) — inert until configured
    if (pathname === '/api/pay/status') {
      if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return paymentStatus(request, env);
    }
    if (pathname === '/api/pay/session') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return createPaymentSession(request, env);
    }
    if (pathname === '/api/pay/callback') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return paymentCallback(request, env);
    }

    // Receipt image (referenced from emails; public but token-gated)
    if (pathname === '/api/receipt-image') {
      const o = url.searchParams.get('o');
      const t = url.searchParams.get('t');
      const type = url.searchParams.get('type') || 'confirmation';
      const statusParam = url.searchParams.get('status') || 'shipped';
      if (!o || !(await verifyOrder(o, t, env.ADMIN_PASSWORD))) {
        return new Response('Not found', { status: 404 });
      }
      if (!env.DB) return new Response('Not configured', { status: 500 });
      const dbOrder = await env.DB.prepare('SELECT * FROM orders WHERE order_number = ?').bind(o).first();
      if (!dbOrder) return new Response('Not found', { status: 404 });
      const order = { ...dbOrder, items: safeParse(dbOrder.items), billing: dbOrder.billing ? safeParse(dbOrder.billing) : null };

      let opts = { title: 'Order Confirmed' };
      if (type === 'status') {
        const label = statusParam.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        opts = { title: label, message: STATUS_MESSAGE[statusParam], tracking: order.tracking_number };
      }
      const resp = await receiptImage(order, opts);
      const headers = new Headers(resp.headers);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      return new Response(resp.body, { status: resp.status, headers });
    }

    // Customer accounts + rewards
    if (pathname === '/api/customer/signup') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return signupCustomer(request, env);
    }
    if (pathname === '/api/customer/login') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return loginCustomer(request, env);
    }
    if (pathname === '/api/customer/me') {
      if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return customerMe(request, env);
    }
    if (pathname === '/api/customer/affiliate-enroll') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return enrollAffiliate(request, env);
    }

    // Affiliate program (unified login — join/enroll happens via the customer account)
    if (pathname === '/api/affiliate/login') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return loginAffiliate(request, env);
    }
    if (pathname === '/api/affiliate/stats') {
      if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return affiliateStats(request, env);
    }
    if (pathname === '/api/affiliate/payout') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return requestPayout(request, env);
    }
    if (pathname === '/api/affiliate/validate') {
      if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return validateCode(request, env);
    }

    if (pathname === '/api/shipstation/webhook') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return handleShipstationWebhook(request, env);
    }
    if (pathname === '/api/zelle/notify') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return handleZelleNotify(request, env);
    }
    if (pathname === '/api/admin/login') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return adminLogin(request, env);
    }
    if (pathname === '/api/admin/affiliates') {
      if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return listAffiliates(request, env);
    }
    if (pathname === '/api/admin/customers') {
      if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return listCustomers(request, env);
    }
    if (pathname === '/api/stock') {
      if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return publicStock(request, env);
    }
    if (pathname === '/api/subscribe') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return handleSubscribe(request, env);
    }
    if (pathname === '/api/cart/sync') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return syncCart(request, env);
    }
    if (pathname === '/api/admin/subscribers') {
      if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return listSubscribers(request, env);
    }
    if (pathname === '/api/admin/stock') {
      if (method === 'GET') return listStock(request, env);
      if (method === 'POST') return updateStock(request, env);
      return new Response('Method Not Allowed', { status: 405 });
    }
    if (pathname === '/api/admin/payouts') {
      if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return listPayouts(request, env);
    }
    if (pathname === '/api/admin/payouts/update') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return updatePayout(request, env);
    }
    if (pathname === '/api/admin/customers/membership') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return setMembership(request, env);
    }
    if (pathname === '/api/admin/customers/delete') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return deleteCustomer(request, env);
    }
    if (pathname === '/api/admin/crypto-check') {
      if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return cryptoCheck(request, env);
    }
    if (pathname === '/api/admin/zelle-setup') {
      if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return zelleSetup(request, env);
    }
    if (pathname === '/api/admin/profit-costs') {
      if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return profitCosts(request, env);
    }
    if (pathname === '/api/admin/orders') {
      if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return listOrders(request, env);
    }
    if (pathname === '/api/admin/orders/update') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return updateOrder(request, env);
    }
    if (pathname === '/api/admin/orders/delete') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return deleteOrder(request, env);
    }

    // Static assets / SPA shell. Force browsers to revalidate the HTML shell so
    // a new deploy is picked up immediately (hashed JS/CSS stay cacheable).
    const assetResp = await env.ASSETS.fetch(request);
    const ct = assetResp.headers.get('Content-Type') || '';
    if (ct.includes('text/html')) {
      const h = new Headers(assetResp.headers);
      h.set('Cache-Control', 'no-cache, must-revalidate');
      return new Response(assetResp.body, { status: assetResp.status, statusText: assetResp.statusText, headers: h });
    }
    return assetResp;
}
