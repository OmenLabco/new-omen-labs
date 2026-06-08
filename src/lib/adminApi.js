// Admin API helpers. The password is kept in sessionStorage (cleared when the tab closes)
// and sent as a Bearer token on each admin request.
const PW_KEY = 'omenlabs_admin_pw';

export const adminAuth = {
  get: () => sessionStorage.getItem(PW_KEY) || '',
  set: (pw) => sessionStorage.setItem(PW_KEY, pw),
  clear: () => sessionStorage.removeItem(PW_KEY),
};

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminAuth.get()}`,
  };
}

export async function adminLogin(password) {
  const resp = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
  });
  if (resp.ok) {
    adminAuth.set(password);
    return true;
  }
  return false;
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
