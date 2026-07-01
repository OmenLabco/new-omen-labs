// AUTO-DERIVED server-side price table — source of truth for /api/order.
export const PRICES = {
  'test-item_1ct': { price: 1.19 },
  '69f9871d9cc1fe91aec19c8f_10mg': { price: 80 },
  '69f9871d9cc1fe91aec19c8f_20mg': { price: 100 },
  '69f9871d9cc1fe91aec19c8f_30mg': { price: 130 },
  'tirzepatide_10mg': { price: 60 },
  'tirzepatide_20mg': { price: 100 },
  'tirzepatide_30mg': { price: 125 },
  '69f9871d9cc1fe91aec19c93_5mg': { price: 40 },
  '69f9871d9cc1fe91aec19c93_10mg': { price: 50 },
  '69f9871d9cc1fe91aec19c94_50mg': { price: 35 },
  '69f9871d9cc1fe91aec19c94_100mg': { price: 50 },
  'semax_5mg': { price: 30 },
  'semax_10mg': { price: 40 },
  'selank_5mg': { price: 40 },
  'selank_10mg': { price: 70 },
  '69f9871d9cc1fe91aec19c92_80mg': { price: 99 },
  '69f9871d9cc1fe91aec19c91_70mg': { price: 89 },
  'nad_250mg': { price: 40 },
  'nad_500mg': { price: 70 },
  'mots-c_10mg': { price: 54.99 },
  'mots-c_40mg': { price: 120 },
  'tb-500_5mg': { price: 65 },
  'tb-500_10mg': { price: 110 },
  '69f9871d9cc1fe91aec19c90_10mg': { price: 40 },
  'ipamorelin_10mg': { price: 50 },
  'cjc-ipamorelin_5mg/5mg': { price: 80 },
  'kpv_10mg': { price: 50 },
  'igf1-lr3_1mg': { price: 95 },
  '69fc30ecf179623737bd64e9_10mL': { price: 10.99 },
  'adamax_10mg': { price: null },
  '69fc30ecf179623737bd64e8_10mg': { price: null },
  '69fc30ecf179623737bd64ea_10mg': { price: null },
  'tesamorelin_10mg': { price: null },
  'semax-selank_5mg/5mg': { price: null },
};

export function priceFor(productId){
  const e = PRICES[productId];
  return e && typeof e.price === 'number' ? e : null;
}
