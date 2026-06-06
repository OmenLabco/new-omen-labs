// Admin endpoints — password-protected order management.
//
// Environment:
//   DB             - D1 database binding
//   ADMIN_PASSWORD - secret password for admin access

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

// Friendly customer-facing message per status
const STATUS_MESSAGE = {
  processing: "We've received your order and it's being prepared.",
  confirmed: 'Your order has been confirmed and is being prepared for shipment.',
  shipped: 'Good news — your order is on its way!',
  out_for_delivery: 'Your order is out for delivery and should arrive today.',
  delivered: 'Your order has been delivered. Thank you!',
};

async function sendStatusEmail(env, order, status) {
  if (!env.RESEND_API_KEY || !order.customer_email) return;
  const from = env.ORDER_FROM_EMAIL || 'Omen Labs <orders@omenlabs.co>';
  const label = (status || '').replace(/_/g, ' ');
  const message = STATUS_MESSAGE[status] || `Your order status is now: ${label}.`;

  const tracking = order.tracking_number
    ? `<p style="margin:16px 0"><strong>Tracking number:</strong> ${esc(order.tracking_number)}</p>`
    : '';

  const html = `
    <div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h2 style="margin-bottom:4px">Order ${esc(order.order_number)}</h2>
      <p style="color:#555;margin-top:0;text-transform:capitalize">Status: <strong>${esc(label)}</strong></p>
      <p style="font-size:15px;line-height:1.6">Hi ${esc(order.customer_name || 'there')}, ${esc(message)}</p>
      ${tracking}
      <p style="font-size:15px;line-height:1.6">Order total: <strong>$${Number(order.total).toFixed(2)}</strong></p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="color:#888;font-size:12px">Omen Labs · For Research Use Only — Not for Human Consumption</p>
    </div>`;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [order.customer_email],
        subject: `Order ${order.order_number} — ${label}`,
        html,
      }),
    });
  } catch {
    // best effort
  }
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
