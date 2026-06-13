// Affiliate API helpers. Credentials kept in sessionStorage; sent as Basic-style bearer.
const KEY = 'omenlabs_affiliate_auth';

export const affiliateAuth = {
  get: () => sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || '',
  set: (email, password) => sessionStorage.setItem(KEY, btoa(`${email}:${password}`)),
  setRaw: (token) => sessionStorage.setItem(KEY, token), // mirror a customer token (same email:password format)
  clear: () => { sessionStorage.removeItem(KEY); localStorage.removeItem(KEY); },
};

export async function affiliateSignup({ name, email, code, password }) {
  const resp = await fetch('/api/affiliate/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, code, password }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || 'Signup failed.');
  affiliateAuth.set(email, password);
  return data;
}

export async function affiliateLogin({ email, password }) {
  const resp = await fetch('/api/affiliate/login', {
    method: 'POST',
    headers: { Authorization: `Bearer ${btoa(`${email}:${password}`)}` },
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || 'Login failed.');
  affiliateAuth.set(email, password);
  return data;
}

export async function affiliateStats() {
  const resp = await fetch('/api/affiliate/stats', {
    headers: { Authorization: `Bearer ${affiliateAuth.get()}` },
  });
  if (resp.status === 401) {
    affiliateAuth.clear();
    throw new Error('unauthorized');
  }
  if (!resp.ok) throw new Error('Failed to load stats.');
  return resp.json();
}

export async function validateAffiliateCode(code, email = '') {
  const q = `code=${encodeURIComponent(code)}${email ? `&email=${encodeURIComponent(email)}` : ''}`;
  const resp = await fetch(`/api/affiliate/validate?${q}`);
  if (!resp.ok) return { valid: false };
  return resp.json();
}
