// Affiliate API helpers. Holds the same server-issued session token as the
// customer login (never a password).
const KEY = 'omenlabs_affiliate_auth';

export const affiliateAuth = {
  get: () => sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || '',
  setRaw: (token) => { if (token) sessionStorage.setItem(KEY, token); },
  clear: () => { sessionStorage.removeItem(KEY); localStorage.removeItem(KEY); },
};

export async function affiliateRequestPayout({ method, handle, amount }) {
  const resp = await fetch('/api/affiliate/payout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${affiliateAuth.get()}` },
    body: JSON.stringify({ method, handle, amount }),
  });
  const data = await resp.json().catch(() => ({}));
  if (resp.status === 401) { affiliateAuth.clear(); throw new Error('unauthorized'); }
  if (!resp.ok) throw new Error(data.error || 'Payout request failed.');
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
