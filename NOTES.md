# Omen Labs — TODO / Asset Notes

## Renders to FIX (wrong dose on label)
- [ ] **TB-500** — current render says **2mg**; re-render label as **5mg** (sold as 5mg $65 / 10mg $110). Replace `public/products/tb-500.jpg`.
- [ ] **IGF-1 LR3** — current render says **10mg**; re-render label as **1mg** (sold as 1mg $95). Replace `public/products/igf1-lr3.png`.

## Renders NEEDED (product is live/priced but has no render — currently shows blurred placeholder)
- [ ] **GLOW** (70mg, $89) → save as `public/products/glow.(png|jpg)`
- [ ] **Ipamorelin** (10mg, $50) → `public/products/ipamorelin.*`
- [ ] **CJC + Ipamorelin** (5mg/5mg $80, 10mg/10mg $120) → `public/products/cjc-ipamorelin.*`
- [ ] **Selank** (5mg $40, 10mg $70) → `public/products/selank.*`
- [ ] **Bacteriostatic Water** (10mL, $10.99) → `public/products/bacteriostatic-water.*`

## Renders NEEDED (coming-soon products — also need PRICES)
- [ ] **Wolverine** (10mg, price TBD) → `public/products/wolverine.*`
- [ ] **Tesamorelin** (10mg, price TBD) → `public/products/tesamorelin.*`
- [ ] **Semax + Selank** (5mg/5mg, price TBD) → `public/products/semax-selank.*`
- (Adamax and MT1 already have renders; just need prices.)

## Prices still TBD (update src/data/products.js variants when set)
- [ ] Adamax (10mg)
- [ ] MT1 (10mg)
- [ ] Wolverine (10mg)
- [ ] Tesamorelin (10mg)
- [ ] Semax + Selank (5mg/5mg)

## How to add a render
Drop the image in `public/products/` with the slug name above, then set
`image: "/products/<file>"` for that product in `src/data/products.js`.
