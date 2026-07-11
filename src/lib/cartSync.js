import { customerAuth } from './customerApi';

// Mirror a logged-in shopper's cart to the server (for abandoned-cart recovery).
// No-op for guests — we can only email people we can identify.
export function syncCart(items) {
  if (!customerAuth.isLoggedIn()) return;
  try {
    fetch('/api/cart/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerAuth.token()}` },
      body: JSON.stringify({ items: items || [] }),
      keepalive: true,
    });
  } catch {}
}
