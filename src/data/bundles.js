// Curated research bundles — SHARED between the SPA (display) and the Worker
// (authoritative pricing). Import-free plain data + pure helpers, like products.js.
//
// COMPLIANCE: bundles are named and described strictly by their CONTENTS (the
// compounds inside). No efficacy, outcome, or "use-for" claims. Category labels
// ("Regenerative Research", etc.) mirror the catalog's own taxonomy.
//
// Each bundle references product SKUs only (product_id = `${id}_${dose}`); prices
// resolve from the catalog / server price table so there's ONE source of truth.
// Discount scales with set size (close to the multi-vial bulk tiers), capped ~10%.

export const BUNDLES = [
  {
    id: 'regen-duo',
    name: 'BPC-157 + TB-500',
    category: 'Regenerative Research',
    blurb: 'Two staple regenerative-research peptides in one set.',
    skus: ['69f9871d9cc1fe91aec19c93_5mg', 'tb-500_5mg'],
  },
  {
    id: 'regen-trio',
    name: 'BPC-157 + TB-500 + KPV',
    category: 'Regenerative Research',
    blurb: 'The regenerative pair plus KPV — three compounds together.',
    skus: ['69f9871d9cc1fe91aec19c93_5mg', 'tb-500_5mg', 'kpv_10mg'],
  },
  {
    id: 'nootropic-duo',
    name: 'Semax + Selank',
    category: 'Neuro Research',
    blurb: 'The two most-paired neuro-research peptides, together.',
    skus: ['semax_5mg', 'selank_5mg'],
  },
  {
    id: 'metabolic-duo',
    name: 'GLP-3 RT + Tirzepatide',
    category: 'Metabolic Research',
    blurb: 'Two metabolic-pathway research compounds in one set.',
    skus: ['69f9871d9cc1fe91aec19c8f_10mg', 'tirzepatide_10mg'],
  },
  {
    id: 'dermal-duo',
    name: 'GHK-Cu + GLOW',
    category: 'Dermal Research',
    blurb: 'GHK-Cu paired with the GLOW blend.',
    skus: ['69f9871d9cc1fe91aec19c94_50mg', '69f9871d9cc1fe91aec19c91_70mg'],
  },
  {
    id: 'longevity-duo',
    name: 'NAD+ + MOTS-c',
    category: 'Metabolic Research',
    blurb: 'NAD+ and MOTS-c, two commonly-studied longevity compounds.',
    skus: ['nad_250mg', 'mots-c_10mg'],
  },
  {
    id: 'gh-duo',
    name: 'CJC-1295 + Ipamorelin & IGF-1 LR3',
    category: 'Regenerative Research',
    blurb: 'The CJC-1295/Ipamorelin blend paired with IGF-1 LR3.',
    skus: ['cjc-ipamorelin_5mg/5mg', 'igf1-lr3_1mg'],
  },
];

// Set-size → discount %. Mirrors the bulk tiers (3→5%, 5→10%), capped at 10%.
export function bundlePct(bundle) {
  const n = bundle.skus.length;
  return n >= 4 ? 10 : n === 3 ? 8 : 5;
}

// Which bundles are fully present in a cart (every SKU, qty ≥ 1)?
export function matchedBundles(items) {
  const have = new Map();
  for (const it of items || []) {
    const sku = it && it.product_id;
    const q = Math.max(0, Math.floor(Number(it && it.quantity) || 0));
    if (sku && q) have.set(sku, (have.get(sku) || 0) + q);
  }
  return BUNDLES.filter((b) => b.skus.every((s) => (have.get(s) || 0) >= 1));
}

// Authoritative bundle-discount calc. `priceOf(sku)` returns the item's BASE unit
// price (number) — pass the server price table on the Worker, the catalog on the
// client. Overlapping bundles never double-count a SKU: best % wins, greedy.
export function computeBundleDiscount(items, priceOf) {
  const candidates = matchedBundles(items)
    .map((b) => {
      const base = b.skus.reduce((s, sku) => s + (Number(priceOf(sku)) || 0), 0);
      const pct = bundlePct(b);
      return { bundle: b, pct, base, amount: +((base * pct) / 100).toFixed(2) };
    })
    .sort((a, z) => z.pct - a.pct || z.base - a.base);

  const consumed = new Set();
  const applied = [];
  let discount = 0;
  for (const c of candidates) {
    if (c.bundle.skus.some((s) => consumed.has(s))) continue; // no double-dip
    c.bundle.skus.forEach((s) => consumed.add(s));
    applied.push({ id: c.bundle.id, name: c.bundle.name, pct: c.pct, amount: c.amount });
    discount += c.amount;
  }
  return { discount: +discount.toFixed(2), applied };
}
