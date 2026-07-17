# Temporarily removed — peptides without a COA on file

**Date pulled:** 2026-07-13
**Reason:** Compliance — showing only products that currently have a Certificate of Analysis. These will be re-added once their COAs are on file (expected in a few days).

## How this works
The products are **hidden, not deleted** — all their data is intact in `src/data/products.js`.
They're pulled from the storefront by their slug in the `HIDDEN_SLUGS` set in that file.

## Restoring — the one-motion way (recommended)
When the COAs land:
1. Name each COA file by the product **slug** (from the table below) and drop it in `public/coa/` —
   e.g. `semax.jpg`, `nad.pdf`, `cjc-ipamorelin.jpg`. (A dose suffix is fine: `semax-5mg.jpg` → `semax`.)
2. Run **`npm run coas`** (or `npm run coas -- --dry` to preview first).
   It wires each COA onto the product **and** removes that slug from `HIDDEN_SLUGS` automatically.
3. `npm run build`, then commit + deploy.

The product's page, catalog card, bundles, and cross-sells all come back automatically — and any
bundle that was waiting on it reappears too.

**Manual alternative:** delete a slug from `HIDDEN_SLUGS` in `src/data/products.js` by hand (and wire
its COA on the variant), then rebuild + deploy.

## Hidden products (13)

| Product | Slug | In a bundle? |
|---|---|---|
| Semax | `semax` | Semax + Selank |
| Selank | `selank` | Semax + Selank |
| GLOW | `glow` | GHK-Cu + GLOW |
| NAD+ | `nad` | NAD+ + MOTS-c |
| MT2 | `mt2` | — |
| Ipamorelin | `ipamorelin` | — |
| CJC-1295 (No DAC) + Ipamorelin | `cjc-ipamorelin` | CJC-1295 + Ipamorelin & IGF-1 LR3 |
| KPV | `kpv` | BPC-157 + TB-500 + KPV |
| Adamax | `adamax` | — |
| MT1 | `mt1` | — |
| WOLVERINE | `wolverine` | — |
| Semax + Selank | `semax-selank` | — |
| Bacteriostatic Water | `bacteriostatic-water` | — |

## Bundles affected
Bundles that included a hidden compound are automatically hidden from the site while
their compound is down (they reappear when the compound is restored):
- **BPC-157 + TB-500 + KPV** (KPV down)
- **Semax + Selank** (both down)
- **GHK-Cu + GLOW** (GLOW down)
- **NAD+ + MOTS-c** (NAD+ down)
- **CJC-1295 + Ipamorelin & IGF-1 LR3** (CJC down)

Bundles still live: **BPC-157 + TB-500**, **GLP-3 RT + Tirzepatide**.

## Still live (have COAs)
GLP-3 RT · Tirzepatide · BPC-157 · GHK-Cu · KLOW · MOTS-c · TB-500 · IGF-1 LR3 · Tesamorelin
