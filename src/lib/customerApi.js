// Customer account API helpers. Credentials kept in localStorage so the login
// persists across visits (so points/account stay available).
const KEY = 'omenlabs_customer_auth';

export const customerAuth = {
  token: () => localStorage.getItem(KEY) || sessionStorage.getItem(KEY) || '',
  set: (email, password, remember = true) => {
    const v = btoa(`${email}:${password}`);
    (remember ? localStorage : sessionStorage).setItem(KEY, v);
    (remember ? sessionStorage : localStorage).removeItem(KEY);
  },
  clear: () => { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); },
  isLoggedIn: () => !!(localStorage.getItem(KEY) || sessionStorage.getItem(KEY)),
};

export async function customerSignup({ name, email, password, remember = true }) {
  const resp = await fetch('/api/customer/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || 'Signup failed.');
  customerAuth.set(email, password, remember);
  return data;
}

export async function customerLogin({ email, password, remember = true }) {
  const resp = await fetch('/api/customer/login', {
    method: 'POST',
    headers: { Authorization: `Bearer ${btoa(`${email}:${password}`)}` },
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || 'Login failed.');
  customerAuth.set(email, password, remember);
  return data;
}

export async function customerMe() {
  const resp = await fetch('/api/customer/me', {
    headers: { Authorization: `Bearer ${customerAuth.token()}` },
  });
  if (resp.status === 401) {
    customerAuth.clear();
    throw new Error('unauthorized');
  }
  if (!resp.ok) throw new Error('Failed to load account.');
  return resp.json();
}
