// Admin API helpers. After login the browser stores a short-lived signed
// SESSION TOKEN (never the password) and sends it as a Bearer token.
const TOKEN_KEY = 'omenlabs_admin_token';

export const adminAuth = {
  get: () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || '',
  set: (token, remember) => {
    const store = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    store.setItem(TOKEN_KEY, token);
    other.removeItem(TOKEN_KEY);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    // also clear the legacy password key from older sessions
    localStorage.removeItem('omenlabs_admin_pw');
    sessionStorage.removeItem('omenlabs_admin_pw');
  },
  // Decode the role embedded in the signed session token (display gating only;
  // the real enforcement is server-side).
  role: () => {
    const t = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || '';
    try { return JSON.parse(atob(t.split('.')[0])).role || 'admin'; } catch { return null; }
  },
};

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminAuth.get()}`,
  };
}

export async function adminLogin(password, remember = true) {
  const resp = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
    body: JSON.stringify({ remember }),
  });
  if (!resp.ok) return { ok: false };
  const data = await resp.json().catch(() => ({}));
  if (data.twofa) return { ok: true, twofa: true, challenge: data.challenge, remember };
  if (data.token) { adminAuth.set(data.token, remember); return { ok: true, token: data.token }; }
  return { ok: false };
}

export async function adminVerify2fa(challenge, code, remember = true) {
  const resp = await fetch('/api/admin/verify-2fa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge, code }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.token) throw new Error(data.error || 'Verification failed.');
  adminAuth.set(data.token, remember);
  return data;
}

export async function adminResend2fa(challenge) {
  try {
    await fetch('/api/admin/resend-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge }),
    });
  } catch { /* best effort */ }
}

export async function deleteOrder(id) {
  const resp = await fetch('/api/admin/orders/delete', {
    method: 'POST', headers: headers(), body: JSON.stringify({ id }),
  });
  if (!resp.ok) throw new Error('Failed to delete order.');
  return resp.json();
}

export async function runCryptoCheck() {
  const resp = await fetch('/api/admin/crypto-check', { headers: headers() });
  if (resp.status === 401) { adminAuth.clear(); throw new Error('unauthorized'); }
  if (!resp.ok) throw new Error('Crypto check failed.');
  return resp.json();
}

export async function fetchProfitCosts() {
  const resp = await fetch('/api/admin/profit-costs', { headers: headers() });
  if (resp.status === 401) { adminAuth.clear(); throw new Error('unauthorized'); }
  if (resp.status === 403) throw new Error('forbidden');
  if (!resp.ok) throw new Error('Failed to load cost data.');
  return resp.json();
}

export async function fetchLive() {
  const resp = await fetch('/api/admin/live', { headers: headers() });
  if (resp.status === 401) { adminAuth.clear(); throw new Error('unauthorized'); }
  if (!resp.ok) throw new Error('Failed to load live view.');
  return resp.json();
}

export async function fetchZelleSetup() {
  const resp = await fetch('/api/admin/zelle-setup', { headers: headers() });
  if (resp.status === 401) { adminAuth.clear(); throw new Error('unauthorized'); }
  if (!resp.ok) throw new Error('Failed to load Zelle setup.');
  return resp.json();
}

export async function fetchOrders() {
  const resp = await fetch('/api/admin/orders', { headers: headers() });
  if (resp.status === 401) {
    adminAuth.clear();
    throw new Error('unauthorized');
  }
  if (!resp.ok) throw new Error('Failed to load orders.');
  const data = await resp.json();
  return data.orders || [];
}

export async function fetchAffiliates() {
  const resp = await fetch('/api/admin/affiliates', { headers: headers() });
  if (resp.status === 401) {
    adminAuth.clear();
    throw new Error('unauthorized');
  }
  if (!resp.ok) throw new Error('Failed to load affiliates.');
  const data = await resp.json();
  return data.affiliates || [];
}

export async function fetchPayouts() {
  const resp = await fetch('/api/admin/payouts', { headers: headers() });
  if (resp.status === 401) { adminAuth.clear(); throw new Error('unauthorized'); }
  if (!resp.ok) throw new Error('Failed to load payouts.');
  const data = await resp.json();
  return data.payouts || [];
}

export async function markPayout(id, status) {
  const resp = await fetch('/api/admin/payouts/update', {
    method: 'POST', headers: headers(), body: JSON.stringify({ id, status }),
  });
  if (!resp.ok) throw new Error('Failed to update payout.');
  return resp.json();
}

export async function fetchSubscribers() {
  const resp = await fetch('/api/admin/subscribers', { headers: headers() });
  if (resp.status === 401) { adminAuth.clear(); throw new Error('unauthorized'); }
  if (!resp.ok) throw new Error('Failed to load subscribers.');
  const data = await resp.json();
  return data.subscribers || [];
}

export async function fetchFunnel() {
  const resp = await fetch('/api/admin/funnel', { headers: headers() });
  if (resp.status === 401) { adminAuth.clear(); throw new Error('unauthorized'); }
  if (!resp.ok) throw new Error('Failed to load funnel.');
  return resp.json();
}

export async function fetchStock() {
  const resp = await fetch('/api/admin/stock', { headers: headers() });
  if (resp.status === 401) { adminAuth.clear(); throw new Error('unauthorized'); }
  if (!resp.ok) throw new Error('Failed to load stock.');
  return resp.json(); // { stock: { sku: count }, lowStock }
}

export async function saveStock(updates) {
  const resp = await fetch('/api/admin/stock', {
    method: 'POST', headers: headers(), body: JSON.stringify({ updates }),
  });
  if (resp.status === 401) { adminAuth.clear(); throw new Error('unauthorized'); }
  if (!resp.ok) throw new Error('Failed to save stock.');
  return resp.json();
}

export async function createOrder(payload) {
  const resp = await fetch('/api/admin/orders/create', {
    method: 'POST', headers: headers(), body: JSON.stringify(payload),
  });
  const data = await resp.json().catch(() => ({}));
  if (resp.status === 401) { adminAuth.clear(); throw new Error('unauthorized'); }
  if (!resp.ok) throw new Error(data.error || 'Failed to create order.');
  return data;
}

export async function fetchPromos() {
  const resp = await fetch('/api/admin/promos', { headers: headers() });
  if (resp.status === 401) { adminAuth.clear(); throw new Error('unauthorized'); }
  if (!resp.ok) throw new Error('Failed to load promo codes.');
  const data = await resp.json();
  return data.promos || [];
}

export async function savePromo(promo) {
  const resp = await fetch('/api/admin/promos', {
    method: 'POST', headers: headers(), body: JSON.stringify(promo),
  });
  const data = await resp.json().catch(() => ({}));
  if (resp.status === 401) { adminAuth.clear(); throw new Error('unauthorized'); }
  if (!resp.ok) throw new Error(data.error || 'Failed to save code.');
  return data;
}

export async function deletePromo(code) {
  const resp = await fetch('/api/admin/promos/delete', {
    method: 'POST', headers: headers(), body: JSON.stringify({ code }),
  });
  if (resp.status === 401) { adminAuth.clear(); throw new Error('unauthorized'); }
  if (!resp.ok) throw new Error('Failed to delete code.');
  return resp.json();
}

export async function fetchCustomers() {
  const resp = await fetch('/api/admin/customers', { headers: headers() });
  if (resp.status === 401) {
    adminAuth.clear();
    throw new Error('unauthorized');
  }
  if (!resp.ok) throw new Error('Failed to load customers.');
  const data = await resp.json();
  return data.customers || [];
}

export async function setCustomerMembership(email, vip) {
  const resp = await fetch('/api/admin/customers/membership', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email, vip }),
  });
  if (!resp.ok) throw new Error('Failed to update membership.');
  return resp.json();
}

export async function deleteCustomer(email) {
  const resp = await fetch('/api/admin/customers/delete', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email }),
  });
  if (!resp.ok) throw new Error('Failed to delete customer.');
  return resp.json();
}

export async function saveOrder({ id, status, tracking_number }) {
  const resp = await fetch('/api/admin/orders/update', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ id, status, tracking_number }),
  });
  if (!resp.ok) throw new Error('Failed to save order.');
  const data = await resp.json();
  return data.order;
}
