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
  // constant-time compare to prevent token-guessing via timing
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
