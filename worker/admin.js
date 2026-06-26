// Admin endpoints — password-protected order management.
//
// Environment:
//   DB             - D1 database binding
//   ADMIN_PASSWORD - secret password for admin access

import { renderImageEmail, sendEmail } from './email.js';
import { signOrder } from './token.js';
import { safeEqual, issueAdminSession, verifyAdminSession, zelleSecret } from './security.js';
import { cryptoWatchDebug } from './cryptoWatch.js';

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

function bearer(request) {
  return (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
}

// Login check: the raw admin password (sent only to /api/admin/login).
async function passwordOk(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const token = bearer(request);
  if (token.length === 0) return false;
  return safeEqual(token, env.ADMIN_PASSWORD);
}

// Data-endpoint check: a valid, unexpired signed session token (NOT the password).
async function authorized(request, env) {
  return verifyAdminSession(env, bearer(request));
}

// GET /api/admin/orders — list all orders (newest first)
export async function listOrders(request, env) {
  if (!(await authorized(request, env))) return json({ error: 'Unauthorized' }, 401);
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
  if (!(await authorized(request, env))) return json({ error: 'Unauthorized' }, 401);
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
  if (!(await authorized(request, env))) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ customers: [] });

  const { results } = await env.DB.prepare(
    `SELECT c.email, c.name, c.points, c.lifetime_spend, c.membership, c.created_date,
            COUNT(o.id) AS order_count
     FROM customers c
     LEFT JOIN orders o ON LOWER(o.customer_email) = LOWER(c.email)
     GROUP BY c.email, c.name, c.points, c.lifetime_spend, c.membership, c.created_date
     ORDER BY c.lifetime_spend DESC`
  ).all();

  const customers = (results || []).map((c) => ({ ...c, isVip: c.membership === 'vip' }));
  return json({ customers });
}

// POST /api/admin/customers/membership — activate/deactivate VIP for a customer
export async function setMembership(request, env) {
  if (!(await authorized(request, env))) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ error: 'Database not configured.' }, 500);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const { email, vip } = body;
  if (!email) return json({ error: 'Missing email.' }, 400);
  await env.DB.prepare('UPDATE customers SET membership = ?, membership_expires = ? WHERE LOWER(email) = ?')
    .bind(vip ? 'vip' : null, null, email.toLowerCase())
    .run();
  return json({ ok: true });
}

// POST /api/admin/customers/delete — permanently remove a customer account
export async function deleteCustomer(request, env) {
  if (!(await authorized(request, env))) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ error: 'Database not configured.' }, 500);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const { email } = body;
  if (!email) return json({ error: 'Missing email.' }, 400);
  await env.DB.prepare('DELETE FROM customers WHERE LOWER(email) = ?')
    .bind(email.toLowerCase())
    .run();
  return json({ ok: true });
}

// POST /api/admin/orders/delete — permanently remove an order (test/abandoned)
export async function deleteOrder(request, env) {
  if (!(await authorized(request, env))) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ error: 'Database not configured.' }, 500);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const { id } = body;
  if (!id) return json({ error: 'Missing order id.' }, 400);
  await env.DB.prepare('DELETE FROM orders WHERE id = ?').bind(id).run();
  return json({ ok: true });
}

// POST /api/admin/orders/update — update status / tracking for one order
export async function updateOrder(request, env) {
  if (!(await authorized(request, env))) return json({ error: 'Unauthorized' }, 401);
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

  let updated = await env.DB.prepare(`SELECT * FROM orders WHERE id = ?`).bind(id).first();

  // Once an order moves out of "awaiting payment", flip the payment label from
  // "awaiting payment" to "payment confirmed" so the receipt reads correctly.
  if (updated && status && status !== 'awaiting_payment' && /awaiting payment/i.test(updated.payment_method || '')) {
    const fixedLabel = updated.payment_method.replace(/awaiting payment/i, 'payment confirmed');
    await env.DB.prepare('UPDATE orders SET payment_method = ? WHERE id = ?').bind(fixedLabel, id).run();
    updated = { ...updated, payment_method: fixedLabel };
  }

  // Notify the customer if the status changed (or notify was explicitly requested)
  const statusChanged = status && (!prev || prev.status !== status);
  if (statusChanged || notify) {
    await sendStatusEmail(env, updated, updated.status);
  }

  return json({ ok: true, order: { ...updated, items: safeParse(updated.items) } });
}

// GET /api/admin/crypto-check — admin-only: run the crypto watcher now + diagnostics
export async function cryptoCheck(request, env) {
  if (!(await authorized(request, env))) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ error: 'Database not configured.' }, 500);
  return json(await cryptoWatchDebug(env));
}

// GET /api/admin/zelle-setup — admin-only: returns the Zelle webhook secret + URL
export async function zelleSetup(request, env) {
  if (!(await authorized(request, env))) return json({ error: 'Unauthorized' }, 401);
  return json({ secret: await zelleSecret(env), url: 'https://omenlabs.co/api/zelle/notify' });
}

// POST /api/admin/login — verify password, then issue a signed session token.
// The browser stores the TOKEN (expiring), never the password.
export async function adminLogin(request, env) {
  if (!(await passwordOk(request, env))) return json({ error: 'Unauthorized' }, 401);
  let remember = false;
  try { remember = !!(await request.json()).remember; } catch {}
  const ttl = remember ? 7 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000; // 7d or 12h
  const token = await issueAdminSession(env, ttl);
  return json({ ok: true, token });
}

function safeParse(s) {
  try {
    return JSON.parse(s || '[]');
  } catch {
    return [];
  }
}
