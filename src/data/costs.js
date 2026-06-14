// My wholesale cost per vial (what *I* pay), keyed by "<Product Name>|<dose>".
// Used by the admin Profit tab to compute profit = peptide revenue − my cost.
// `null` = cost not set yet (blank/coming-soon). Edit these numbers as costs change.
import { PRODUCTS } from './products';

const COST_BY_KEY = {
  'GLP-3 RT|10mg': 10,
  'GLP-3 RT|20mg': 15,
  'GLP-3 RT|30mg': 18,
  'Tirzepatide|10mg': 6,
  'Tirzepatide|20mg': 10,
  'Tirzepatide|30mg': 12.5,
  'Semax|5mg': 3,
  'Semax|10mg': 6,
  'Selank|5mg': 4,
  'Selank|10mg': 4,
  'BPC-157|5mg': 4,
  'BPC-157|10mg': 6.5,
  'KLOW|80mg': 27,
  'GLOW|70mg': 18,
  'GHK-Cu|50mg': 3,
  'GHK-Cu|100mg': 5.5,
  'NAD+|250mg': 3.5,
  'NAD+|500mg': 6.5,
  'MOTS-c|10mg': 5,
  'MOTS-c|40mg': 17.5,
  'TB-500|5mg': 6.5,
  'TB-500|10mg': 11.5,
  'MT2|10mg': 4,
  'Ipamorelin|10mg': 6.5,
  'CJC + Ipamorelin|5mg/5mg': null, // empty for now
  'CJC + Ipamorelin|10mg/10mg': 12,
  'KPV|10mg': 6,
  'IGF-1 LR3|1mg': 18.7,
  'Bacteriostatic Water|10mL': 1,
  'MT1|10mg': null, // blank for now
  'Adamax|10mg': null, // blank for now
  'WOLVERINE|10mg': null, // empty for now
  'Tesamorelin|10mg': null, // blank for now
};

// Build the cost sheet rows + a lookup keyed by the order item's product_id
// (which the cart writes as `${product.id}_${dose}`) and by product_name.
const byProductId = {};
const byName = {};
const SHEET = [];

for (const p of PRODUCTS) {
  for (const v of p.variants || []) {
    const key = `${p.name}|${v.dose}`;
    const cost = key in COST_BY_KEY ? COST_BY_KEY[key] : null;
    const productId = `${p.id}_${v.dose}`;
    const productName = `${p.name} ${v.dose}`;
    byProductId[productId] = cost;
    byName[productName] = cost;
    SHEET.push({ name: p.name, dose: v.dose, sellPrice: v.price ?? null, cost, productId, productName });
  }
}

export const COST_SHEET = SHEET;

// Resolve my cost for a single order line item. Tries product_id, then name.
export function costForItem(item) {
  if (!item) return null;
  if (item.product_id != null && item.product_id in byProductId) return byProductId[item.product_id];
  const nm = item.product_name || item.name;
  if (nm != null && nm in byName) return byName[nm];
  return null;
}
