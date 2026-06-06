import { handleOrder } from './order.js';

// Worker entry: handle API routes, otherwise serve the static SPA assets.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/order') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
      }
      return handleOrder(request, env);
    }

    // Everything else → static assets (with SPA fallback configured in wrangler.jsonc)
    return env.ASSETS.fetch(request);
  },
};
