#!/usr/bin/env node
// Bulk COA re-add — "one motion" to bring hidden peptides back once their COAs land.
//
// Usage:
//   1. Drop each COA file into public/coa/, named by the product slug, e.g.
//        semax.jpg   selank.png   nad.pdf   cjc-ipamorelin.jpg
//      (A dose suffix is fine too: semax-5mg.jpg → matches slug "semax".)
//   2. Run:  npm run coas
//
// It wires each COA into COA_BY_SLUG in src/data/products.js AND removes the
// matched slug from HIDDEN_SLUGS, so the product returns to the storefront with
// its COA attached. Review the diff, then build + deploy.
//
// Dry run (report only, no writes):  npm run coas -- --dry

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PRODUCTS_FILE = path.join(ROOT, 'src/data/products.js');
const COA_DIR = path.join(ROOT, 'public/coa');
const DRY = process.argv.includes('--dry');

const src0 = fs.readFileSync(PRODUCTS_FILE, 'utf8');

// Known slugs (from the product data) and current hidden / COA-map state.
const allSlugs = [...src0.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
const hiddenBlock = src0.match(/const HIDDEN_SLUGS = new Set\(\[([\s\S]*?)\]\);/);
const coaBlock = src0.match(/const COA_BY_SLUG = \{([\s\S]*?)\};/);
if (!hiddenBlock || !coaBlock) {
  console.error('Could not find HIDDEN_SLUGS / COA_BY_SLUG blocks in products.js — aborting.');
  process.exit(1);
}
const hidden = new Set([...hiddenBlock[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]));
const coaMap = {};
for (const m of coaBlock[1].matchAll(/"([^"]+)":\s*"([^"]+)"/g)) coaMap[m[1]] = m[2];

// Match COA files → slugs. Prefer an exact "<slug>.<ext>"; else "<slug>-<dose>.<ext>".
const files = fs.existsSync(COA_DIR)
  ? fs.readdirSync(COA_DIR).filter((f) => /\.(jpe?g|png|webp|pdf)$/i.test(f))
  : [];
const matched = new Map();   // slug -> "/coa/<file>"
const unmatched = [];
for (const f of files) {
  const base = f.replace(/\.[^.]+$/, '').toLowerCase();
  let slug = allSlugs.find((s) => s === base);
  if (!slug) slug = allSlugs.find((s) => base === s || base.startsWith(s + '-'));
  if (slug) { if (!matched.has(slug)) matched.set(slug, `/coa/${f}`); }
  else unmatched.push(f);
}

// Products already live WITH a COA don't need wiring — skip them. (Hidden ones
// aren't in the exported catalog, so they're never in this set → always actionable.)
const catalog = await import(pathToFileURL(PRODUCTS_FILE).href);
const liveHasCoa = new Set(catalog.PRODUCTS.filter((p) => (p.variants || []).some((v) => v.coa)).map((p) => p.slug));

const actionable = [...matched.entries()].filter(([slug]) => !liveHasCoa.has(slug));
const skippedLive = [...matched.keys()].filter((slug) => liveHasCoa.has(slug));
const toWire = actionable.filter(([slug, p]) => coaMap[slug] !== p);
const toUnhide = actionable.map(([slug]) => slug).filter((slug) => hidden.has(slug));

console.log(`\nScanned public/coa/ — ${files.length} COA file(s), ${matched.size} matched to a product.`);
if (skippedLive.length) console.log(`  · Already live with a COA (skipped): ${skippedLive.join(', ')}`);
if (unmatched.length) console.log(`  ⚠ Unmatched (rename to "<slug>.<ext>" to wire): ${unmatched.join(', ')}`);
if (!toWire.length && !toUnhide.length) { console.log('\nNothing to change — every matched COA is already wired.\n'); process.exit(0); }

for (const [slug, p] of toWire) console.log(`  + COA   ${slug}  →  ${p}`);
for (const slug of toUnhide) console.log(`  ↑ UNHIDE ${slug}`);

if (DRY) { console.log('\n(dry run — no files written)\n'); process.exit(0); }

// Apply: merge COA map (actionable only), drop un-hidden slugs, regenerate blocks.
for (const [slug, p] of actionable) coaMap[slug] = p;
for (const slug of toUnhide) hidden.delete(slug);

const coaEntries = Object.entries(coaMap);
const newCoaBlock = coaEntries.length
  ? `const COA_BY_SLUG = {\n${coaEntries.map(([s, p]) => `  "${s}": "${p}",`).join('\n')}\n};`
  : `const COA_BY_SLUG = {\n  // "semax": "/coa/semax.jpg",\n};`;

const hiddenArr = [...hidden];
const newHiddenBlock = hiddenArr.length
  ? `const HIDDEN_SLUGS = new Set([\n${hiddenArr.map((s) => `  "${s}",`).join('\n')}\n]);`
  : `const HIDDEN_SLUGS = new Set([]);`;

let out = src0.replace(coaBlock[0], newCoaBlock).replace(hiddenBlock[0], newHiddenBlock);
fs.writeFileSync(PRODUCTS_FILE, out);
console.log(`\n✓ Updated src/data/products.js — ${toWire.length} COA(s) wired, ${toUnhide.length} product(s) un-hidden.`);
console.log('  Next: npm run build, then commit + deploy.\n');
