// Customer account API helpers. The browser keeps only a signed, expiring
// session token issued by the server — never the password. (Older builds stored
// base64(email:password); /api/customer/me swaps those for a session token.)
import { affiliateAuth } from './affiliateApi';
const KEY = 'omenlabs_customer_auth';

export const customerAuth = {
  token: () => localStorage.getItem(KEY) || sessionStorage.getItem(KEY) || '',
  set: (token, remember = true) => {
    if (!token) return;
    (remember ? localStorage : sessionStorage).setItem(KEY, token);
    (remember ? sessionStorage : localStorage).removeItem(KEY);
    // the same session works for the affiliate dashboard
    affiliateAuth.setRaw(token);
  },
  // Replace the stored token in whichever storage currently holds it.
  replace: (token) => {
    if (!token) return;
    const store = localStorage.getItem(KEY) ? localStorage : sessionStorage;
    store.setItem(KEY, token);
    affiliateAuth.setRaw(token);
  },
  clear: () => { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); affiliateAuth.clear(); },
  isLoggedIn: () => !!(localStorage.getItem(KEY) || sessionStorage.getItem(KEY)),
};

export async function customerSignup({ name, email, password, research_field }) {
  const resp = await fetch('/api/customer/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, research_field }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || 'Signup failed.');
  // New accounts must verify their email first — no session token is set here.
  return data; // { verify: true, email }
}

export async function customerLogin({ email, password, remember = true }) {
  const resp = await fetch('/api/customer/login', {
    method: 'POST',
    // The password goes to the server only here, at sign-in, over HTTPS.
    headers: { Authorization: `Bearer ${btoa(`${email}:${password}`)}` },
  });
  const data = await resp.json().catch(() => ({}));
  // Unverified account → caller should show the code-entry step (not an error).
  if (resp.status === 403 && data.unverified) return { unverified: true, email: data.email || email };
  if (!resp.ok) throw new Error(data.error || 'Login failed.');
  customerAuth.set(data.token, remember);
  return data;
}

// Confirm the emailed 6-digit code, then log the account in.
export async function customerVerify({ email, code, password, remember = true }) {
  const resp = await fetch('/api/customer/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || 'Verification failed.');
  customerAuth.set(data.token, remember);
  return data;
}

export async function customerResendCode(email) {
  try {
    await fetch('/api/customer/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  } catch { /* best effort */ }
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
  const data = await resp.json();
  if (data.token) customerAuth.replace(data.token); // migrate a legacy credential
  return data;
}

export async function customerEnrollAffiliate(code, marketing = false) {
  const resp = await fetch('/api/customer/affiliate-enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerAuth.token()}` },
    body: JSON.stringify({ code, marketing }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || 'Enrollment failed.');
  return data;
}
