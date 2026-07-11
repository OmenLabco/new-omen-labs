// Email capture → returns the first-order promo code.
export async function subscribe(email, source = 'popup') {
  const resp = await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, source }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || 'Signup failed.');
  return data; // { ok, code, discountPct }
}
