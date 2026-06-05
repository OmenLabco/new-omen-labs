// Multi-vial discount tiers
export const DISCOUNT_TIERS = [
  { minQty: 10, pct: 15, label: '10+ vials' },
  { minQty: 5, pct: 10, label: '5+ vials' },
  { minQty: 3, pct: 5, label: '3+ vials' },
];

export function getDiscountPct(quantity) {
  const tier = DISCOUNT_TIERS.find(t => quantity >= t.minQty);
  return tier ? tier.pct : 0;
}

export function getDiscountedPrice(unitPrice, quantity) {
  const pct = getDiscountPct(quantity);
  return pct > 0 ? +(unitPrice * (1 - pct / 100)).toFixed(2) : unitPrice;
}