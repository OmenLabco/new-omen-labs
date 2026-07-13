# Temporarily removed — peptides without a COA on file

**Date pulled:** 2026-07-13
**Reason:** Compliance — showing only products that currently have a Certificate of Analysis. These will be re-added once their COAs are on file (expected in a few days).

## How this works
The products are **hidden, not deleted** — all their data is intact in `src/data/products.js`.
They're pulled from the storefront by their slug in the `HIDDEN_SLUGS` set in that file.

**To restore a product:** delete its slug from `HIDDEN_SLUGS` in `src/data/products.js`, rebuild, and deploy. Nothing else needs to change — its product page, catalog card, bundles, and cross-sells all come back automatically. Ideally add the COA first (drop the file in `public/coa/` and wire it on the variant) so it comes back COA-backed.

## Hidden peptides (12)

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

## Bundles affected
Bundles that included a hidden compound are automatically hidden from the site while
their compound is down (they reappear when the compound is restored):
- **BPC-157 + TB-500 + KPV** (KPV down)
- **Semax + Selank** (both down)
- **GHK-Cu + GLOW** (GLOW down)
- **NAD+ + MOTS-c** (NAD+ down)
- **CJC-1295 + Ipamorelin & IGF-1 LR3** (CJC down)

Bundles still live: **BPC-157 + TB-500**, **GLP-3 RT + Tirzepatide**.

## Kept live (judgment call)
- **Bacteriostatic Water** (`bacteriostatic-water`) has no COA but is a lab *supply* (sterile
  water), not a peptide, so it was left live. Add it to `HIDDEN_SLUGS` if you want it down too.

## Still live (have COAs)
GLP-3 RT · Tirzepatide · BPC-157 · GHK-Cu · KLOW · MOTS-c · TB-500 · IGF-1 LR3 · Tesamorelin · Bacteriostatic Water
