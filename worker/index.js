import { handleOrder } from './order.js';
import { listOrders, updateOrder, adminLogin } from './admin.js';

// Worker entry: handle API routes, otherwise serve the static SPA assets.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // Public order submission
    if (pathname === '/api/order') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return handleOrder(request, env);
    }

    // Admin
    if (pathname === '/api/admin/login') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return adminLogin(request, env);
    }
    if (pathname === '/api/admin/orders') {
      if (method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
      return listOrders(request, env);
    }
    if (pathname === '/api/admin/orders/update') {
      if (method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return updateOrder(request, env);
    }

    // Everything else → static assets (SPA fallback configured in wrangler.jsonc)
    return env.ASSETS.fetch(request);
  },
};
