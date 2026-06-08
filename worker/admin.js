// Admin endpoints — password-protected order management.
//
// Environment:
//   DB             - D1 database binding
//   ADMIN_PASSWORD - secret password for admin access

import { renderImageEmail, sendEmail } from './email.js';
import { signOrder } from './token.js';

const SITE = 'https://omenlabs.co';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

async function sendStatusEmail(env, order, status) {
  if (!env.RESEND_API_KEY || !order.customer_email) return;
  const label = (status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const token = await signOrder(order.order_number, env.ADMIN_PASSWORD);
  const imageUrl = `${SITE}/api/receipt-image?o=${encodeURIComponent(order.order_number)}&t=${token}&type=status&status=${encodeURIComponent(status)}`;
  await sendEmail(env, {
    to: order.customer_email,
    subject: `Order ${order.order_number} — ${label}`,
    html: renderImageEmail({ imageUrl, order: { ...order, items: safeParse(order.items) } }),
  });
}

// Constant-time-ish password check via Authorization: Bearer <password>
function authorized(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const header = request.headers.get('Authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '');
  return token.length > 0 && token === env.ADMIN_PASSWORD;
}

// GET /api/admin/orders — list all orders (newest first)
export async function listOrders(request, env) {
  if (!authorized(request, env)) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ orders: [] });

  const { results } = await env.DB.prepare(
    `SELECT * FROM orders ORDER BY id DESC`
  ).all();

  const orders = (results || []).map((o) => ({
    ...o,
    items: safeParse(o.items),
  }));
  return json({ orders });
}

// GET /api/admin/affiliates — list affiliates with their sales + commission totals
export async function listAffiliates(request, env) {
  if (!authorized(request, env)) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ affiliates: [] });

  const { results } = await env.DB.prepare(
    `SELECT a.code, a.name, a.email, a.created_date,
            COUNT(o.id) AS order_count,
            COALESCE(SUM(o.total), 0) AS total_sales,
            COALESCE(SUM(o.commission), 0) AS total_commission
     FROM affiliates a
     LEFT JOIN orders o ON o.affiliate_code = a.code
     GROUP BY a.code, a.name, a.email, a.created_date
     ORDER BY total_commission DESC`
  ).all();

  return json({ affiliates: results || [] });
}

// GET /api/admin/customers — list customers with points, spend, tier, order count
export async function listCustomers(request, env) {
  if (!authorized(request, env)) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ customers: [] });

  const { results } = await env.DB.prepare(
    `SELECT c.email, c.name, c.points, c.lifetime_spend, c.created_date,
            COUNT(o.id) AS order_count
     FROM customers c
     LEFT JOIN orders o ON LOWER(o.customer_email) = LOWER(c.email)
     GROUP BY c.email, c.name, c.points, c.lifetime_spend, c.created_date
     ORDER BY c.lifetime_spend DESC`
  ).all();

  const tierOf = (s) => (s >= 1000 ? 'Gold' : s >= 250 ? 'Silver' : 'Bronze');
  const customers = (results || []).map((c) => ({ ...c, tier: tierOf(Number(c.lifetime_spend || 0)) }));
  return json({ customers });
}

// POST /api/admin/orders/update — update status / tracking for one order
export async function updateOrder(request, env) {
  if (!authorized(request, env)) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ error: 'Database not configured.' }, 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const { id, status, tracking_number, notify } = body;
  if (!id) return json({ error: 'Missing order id.' }, 400);

  // Get the previous status so we only email the customer when it actually changes
  const prev = await env.DB.prepare(`SELECT status FROM orders WHERE id = ?`).bind(id).first();

  await env.DB.prepare(
    `UPDATE orders SET status = COALESCE(?, status), tracking_number = COALESCE(?, tracking_number) WHERE id = ?`
  )
    .bind(status ?? null, tracking_number ?? null, id)
    .run();

  const updated = await env.DB.prepare(`SELECT * FROM orders WHERE id = ?`).bind(id).first();

  // Notify the customer if the status changed (or notify was explicitly requested)
  const statusChanged = status && (!prev || prev.status !== status);
  if (statusChanged || notify) {
    await sendStatusEmail(env, updated, updated.status);
  }

  return json({ ok: true, order: { ...updated, items: safeParse(updated.items) } });
}

// POST /api/admin/login — verify password only (for the login screen)
export async function adminLogin(request, env) {
  return authorized(request, env) ? json({ ok: true }) : json({ error: 'Unauthorized' }, 401);
}

function safeParse(s) {
  try {
    return JSON.parse(s || '[]');
  } catch {
    return [];
  }
}
