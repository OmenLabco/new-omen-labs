// Admin endpoints — password-protected order management.
//
// Environment:
//   DB             - D1 database binding
//   ADMIN_PASSWORD - secret password for admin access

import { renderImageEmail, sendEmail, renderPayoutReceipt } from './email.js';
import { signOrder } from './token.js';
import { safeEqual, issueAdminSession, verifyAdminSession, zelleSecret } from './security.js';
import { cryptoWatchDebug } from './cryptoWatch.js';
import { COST_SHEET, COST_BY_PRODUCT_ID, COST_BY_NAME } from './costs.js';
import { ensureAffiliateSchema, PAYOUT_METHODS } from './affiliate.js';
import { decrementStockForOrder } from './stock.js';
import { priceFor } from './prices.js';
import { orderNumber } from './order.js';

const SHIP_PRICE = { ground: 9.99, first: 14.99, pickup: 0 };
const SHIP_LABEL = { ground: '3–5 Day Ground', first: '2-Day First Class', pickup: 'Local Pickup — Spokane, WA' };

// POST /api/admin/orders/create — log a manual (DM/phone) sale.
export async function createOrder(request, env) {
  if (!(await authorized(request, env))) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ error: 'Database not configured.' }, 500);
  let b; try { b = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const c = b.customer || {};
  const name = String(c.name || '').trim();
  if (!name) return json({ error: 'Customer name is required.' }, 400);

  const rawItems = Array.isArray(b.items) ? b.items : [];
  const items = [];
  for (const it of rawItems) {
    const entry = priceFor(it && it.product_id);
    if (!entry) return json({ error: `Unknown item: ${it && it.product_id}` }, 400);
    const qty = Math.max(1, Math.min(99, Math.floor(Number(it.quantity) || 1)));
    items.push({ product_id: it.product_id, product_name: String(it.product_name || it.product_id).slice(0, 80), quantity: qty, price: entry.price });
  }
  if (!items.length) return json({ error: 'Add at least one item.' }, 400);

  const subtotal = +items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2);
  const ship = SHIP_PRICE[b.shipping_method] != null ? b.shipping_method : 'pickup';
  const shipping_cost = SHIP_PRICE[ship];
  const total = +(subtotal + shipping_cost).toFixed(2);
  const paid = !!b.paid;
  const status = paid ? 'confirmed' : 'awaiting_payment';
  const payment_method = `${String(b.payment_method || 'Manual').slice(0, 24)} — ${paid ? 'payment confirmed' : 'awaiting payment'}`;
  const order_number = orderNumber();
  const created_date = new Date().toISOString();

  try { await env.DB.prepare('ALTER TABLE orders ADD COLUMN company TEXT').run(); } catch {}
  try {
    await env.DB.prepare(
      `INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, company, address, address2, city, state, zip, country, notes, items, subtotal, shipping_cost, shipping_method, discount, crypto_discount, affiliate_discount, affiliate_code, commission, points_earned, points_redeemed, points_value, total, payment_method, billing, status, created_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      order_number, name, String(c.email || '').toLowerCase(), c.phone || '', c.company || '',
      c.address || '', c.address2 || '', c.city || '', c.state || '', c.zip || '', c.country || 'United States',
      String(b.notes || '').slice(0, 500) + (b.notes ? ' · ' : '') + 'Manual order',
      JSON.stringify(items), subtotal, shipping_cost, SHIP_LABEL[ship], 0, 0, 0, null, 0, 0, 0, 0, total, payment_method, null, status, created_date
    ).run();
  } catch (e) {
    return json({ error: 'Failed to save order.', detail: String(e) }, 500);
  }

  if (paid) {
    const row = await env.DB.prepare('SELECT * FROM orders WHERE order_number = ?').bind(order_number).first();
    if (row) await decrementStockForOrder(env, row);
  }
  return json({ ok: true, order_number, total, status });
}

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

// Login check: returns the role for the supplied password, or null.
async function loginRole(request, env) {
  const token = bearer(request);
  if (!token) return null;
  if (env.ADMIN_PASSWORD && (await safeEqual(token, env.ADMIN_PASSWORD))) return 'admin';
  if (env.STAFF_PASSWORD && (await safeEqual(token, env.STAFF_PASSWORD))) return 'staff';
  return null;
}

// Data-endpoint check: returns the role ('admin'|'staff') from a valid session
// token, or null. Use truthiness for "any logged-in staff", or check === 'admin'.
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
  await ensureAffiliateSchema(env);

  const { results } = await env.DB.prepare(
    `SELECT a.code, a.name, a.email, a.created_date, a.marketing_opt_in, a.payout_method, a.payout_handle,
            COUNT(o.id) AS order_count,
            COALESCE(SUM(COALESCE(o.subtotal, o.total)), 0) AS total_sales,
            COALESCE(SUM(o.commission), 0) AS total_commission
     FROM affiliates a
     LEFT JOIN orders o ON o.affiliate_code = a.code
     GROUP BY a.code, a.name, a.email, a.created_date, a.marketing_opt_in, a.payout_method, a.payout_handle
     ORDER BY total_commission DESC`
  ).all();

  // Fold in payout totals (paid / pending) per affiliate code.
  const { results: pr } = await env.DB.prepare(
    "SELECT code, status, COALESCE(SUM(amount),0) AS amt FROM payouts GROUP BY code, status"
  ).all();
  const paidBy = {}, pendBy = {};
  for (const row of pr || []) {
    if (row.status === 'paid') paidBy[row.code] = Number(row.amt || 0);
    if (row.status === 'requested') pendBy[row.code] = Number(row.amt || 0);
  }
  const affiliates = (results || []).map((a) => {
    const paid = paidBy[a.code] || 0;
    const pending = pendBy[a.code] || 0;
    return {
      ...a,
      marketing_opt_in: !!a.marketing_opt_in,
      paid_out: +paid.toFixed(2),
      pending_payout: +pending.toFixed(2),
      owed: +Math.max(0, Number(a.total_commission || 0) - paid - pending).toFixed(2),
    };
  });

  return json({ affiliates });
}

// GET /api/admin/payouts — payout requests (pending first)
export async function listPayouts(request, env) {
  if (!(await authorized(request, env))) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ payouts: [] });
  await ensureAffiliateSchema(env);
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.code, p.email, p.amount, p.method, p.handle, p.status, p.created_date, p.paid_date, p.receipt_no, a.name
     FROM payouts p LEFT JOIN affiliates a ON a.code = p.code
     ORDER BY (p.status = 'requested') DESC, p.id DESC`
  ).all();
  return json({ payouts: results || [] });
}

// POST /api/admin/payouts/update — mark a payout request paid (or revert).
// On "paid" we stamp a receipt number + timestamp and email the affiliate a receipt.
export async function updatePayout(request, env) {
  if (!(await authorized(request, env))) return json({ error: 'Unauthorized' }, 401);
  if (!env.DB) return json({ error: 'Service unavailable.' }, 500);
  await ensureAffiliateSchema(env);
  let b; try { b = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const id = Number(b.id);
  const status = b.status === 'paid' ? 'paid' : b.status === 'requested' ? 'requested' : null;
  if (!id || !status) return json({ error: 'Invalid request.' }, 400);

  const payout = await env.DB.prepare('SELECT * FROM payouts WHERE id = ?').bind(id).first();
  if (!payout) return json({ error: 'Payout not found.' }, 404);

  if (status === 'requested') {
    await env.DB.prepare('UPDATE payouts SET status = ?, paid_date = NULL WHERE id = ?').bind(status, id).run();
    return json({ ok: true, id, status });
  }

  // status === 'paid': stamp receipt (reuse existing one if reverting/re-marking)
  const paid_date = new Date().toISOString();
  const receipt_no = payout.receipt_no || `OMEN-PO-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  await env.DB.prepare('UPDATE payouts SET status = ?, paid_date = ?, receipt_no = ? WHERE id = ?').bind('paid', paid_date, receipt_no, id).run();

  // Email the affiliate their receipt (best-effort).
  if (env.RESEND_API_KEY && payout.email) {
    const aff = await env.DB.prepare('SELECT name FROM affiliates WHERE code = ?').bind(payout.code).first();
    try {
      await sendEmail(env, {
        to: payout.email,
        subject: `Payout sent — $${Number(payout.amount).toFixed(2)} · ${receipt_no}`,
        html: renderPayoutReceipt({
          name: aff?.name,
          code: payout.code,
          amount: payout.amount,
          methodLabel: PAYOUT_METHODS[payout.method] || payout.method,
          handle: payout.handle,
          receiptNo: receipt_no,
          paidDate: paid_date,
        }),
      });
    } catch {}
  }

  return json({ ok: true, id, status: 'paid', receipt_no, paid_date });
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

  // Once an order reaches a paid/fulfilled status, subtract its vials from stock (once).
  if (status && ['confirmed', 'shipped', 'out_for_delivery', 'delivered'].includes(status)) {
    await decrementStockForOrder(env, updated);
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
  const role = await loginRole(request, env);
  if (!role) return json({ error: 'Unauthorized' }, 401);
  let remember = false;
  try { remember = !!(await request.json()).remember; } catch {}
  const ttl = remember ? 7 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000; // 7d or 12h
  const token = await issueAdminSession(env, ttl, role);
  return json({ ok: true, token, role });
}

// GET /api/admin/profit-costs — OWNER ONLY. Returns cost data for the Profit tab.
// Staff sessions get 403, so cost/profit is never exposed to them.
export async function profitCosts(request, env) {
  const role = await authorized(request, env);
  if (!role) return json({ error: 'Unauthorized' }, 401);
  if (role !== 'admin') return json({ error: 'Forbidden' }, 403);
  return json({ sheet: COST_SHEET, byProductId: COST_BY_PRODUCT_ID, byName: COST_BY_NAME });
}

function safeParse(s) {
  try {
    return JSON.parse(s || '[]');
  } catch {
    return [];
  }
}
