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

  const { id, status, tracking_number } = body;
  if (!id) return json({ error: 'Missing order id.' }, 400);

  await env.DB.prepare(
    `UPDATE orders SET status = COALESCE(?, status), tracking_number = COALESCE(?, tracking_number) WHERE id = ?`
  )
    .bind(status ?? null, tracking_number ?? null, id)
    .run();

  const updated = await env.DB.prepare(`SELECT * FROM orders WHERE id = ?`).bind(id).first();
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
