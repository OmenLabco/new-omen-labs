import { handleOrder } from './order.js';
import { listOrders, updateOrder, adminLogin, listAffiliates, listCustomers, setMembership } from './admin.js';
import { receiptImage } from './receiptImage.js';
import { verifyOrder } from './token.js';
import { signupAffiliate, loginAffiliate, affiliateStats, validateCode } from './affiliate.js';
import { signupCustomer, loginCustomer, customerMe, enrollAffiliate } from './customer.js';

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

    if (pathname === '/api/order') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return handleOrder(request, env);
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

    // Affiliate program
    if (pathname === '/api/affiliate/signup') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return signupAffiliate(request, env);
    }
    if (pathname === '/api/affiliate/login') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return loginAffiliate(request, env);
    }
    if (pathname === '/api/affiliate/stats') {
      if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return affiliateStats(request, env);
    }
    if (pathname === '/api/affiliate/validate') {
      if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return validateCode(request, env);
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
    if (pathname === '/api/admin/customers/membership') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return setMembership(request, env);
    }
    if (pathname === '/api/admin/orders') {
      if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return listOrders(request, env);
    }
    if (pathname === '/api/admin/orders/update') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return updateOrder(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
