// Public stock levels for low-stock / sold-out badges. Fetched once and cached.
export const LOW_STOCK = 9;

let cache = null;
let pending = null;

export function getStock() {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = fetch('/api/stock')
      .then((r) => (r.ok ? r.json() : { stock: {} }))
      .then((d) => { cache = d.stock || {}; return cache; })
      .catch(() => ({}));
  }
  return pending;
}

// count === undefined → untracked (no badge). 0 → sold out. 1..8 → low.
export function stockStatus(count) {
  if (count == null) return null;
  if (count <= 0) return { key: 'out', label: 'Sold out', left: 0 };
  if (count < LOW_STOCK) return { key: 'low', label: count <= 3 ? 'Almost sold out' : 'Low stock', left: count };
  return { key: 'in', label: 'In stock', left: count };
}

// Product-level status for catalog cards: worst-case across its tracked variants.
export function productStatus(product, stock) {
  const counts = (product.variants || [])
    .map((v) => stock[`${product.id}_${v.dose}`])
    .filter((c) => c != null);
  if (!counts.length) return null;                    // untracked
  if (counts.every((c) => c <= 0)) return { key: 'out', label: 'Sold out' };
  const inStock = counts.filter((c) => c > 0);
  const min = Math.min(...inStock);
  if (min < LOW_STOCK) return { key: 'low', label: min <= 3 ? 'Almost sold out' : 'Low stock', left: min };
  return { key: 'in', label: 'In stock' };
}
