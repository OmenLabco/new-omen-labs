// Flat promo codes (not affiliates → no commission). Rides the same checkout
// "code" input + discount path as affiliate codes.
export const PROMOS = {
  WELCOME10: { code: 'WELCOME10', pct: 10, firstOrderOnly: true, label: '10% off your first order' },
};

export function resolvePromo(code) {
  const norm = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return PROMOS[norm] || null;
}
