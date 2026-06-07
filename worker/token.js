// Small HMAC token so receipt-image URLs can't be enumerated.
async function hmac(orderNumber, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret || 'omenlabs'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(orderNumber));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}

export async function signOrder(orderNumber, secret) {
  return hmac(orderNumber, secret);
}

export async function verifyOrder(orderNumber, token, secret) {
  if (!token) return false;
  const expected = await hmac(orderNumber, secret);
  return token === expected;
}
