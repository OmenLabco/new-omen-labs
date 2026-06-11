// Product catalog. Prices sourced from Omen_Labs_Pricing.xlsx (June 2026).
// Each product has `variants` (dose + price). `price`/`dosage` mirror the first
// variant for backward compatibility. `coming_soon: true` = listed, not purchasable.
// NOTE: TB-500 render label says 2mg (sold as 5/10mg) and IGF1-LR3 render says
// 10mg (sold as 1mg) — replace images when corrected renders exist (see NOTES.md).

const GENERIC_STORAGE = "Store at -20°C. Reconstituted: 2-8°C, use within 30 days.";

export const PRODUCTS = [
  {
    id: "69f9871d9cc1fe91aec19c8f",
    name: "GLP-3 RT",
    slug: "glp-rt",
    category: "Performance",
    categories: ["Performance", "Longevity"],
    short_description: "GLP-3 receptor targeting peptide for metabolic research.",
    description:
      "GLP RT (Glucagon-Like Peptide Receptor Targeted) is a research-grade peptide compound designed for in-vitro study of metabolic pathways and receptor binding affinity. This compound has shown significant promise in preclinical research for understanding glucose homeostasis and appetite regulation mechanisms.",
    molecular_weight: "3,298.7 Da",
    sequence: "His-Ala-Glu-Gly-Thr-Phe-Thr-Ser-Asp-Val-Ser-Ser-Tyr-Leu-Glu-Gly",
    purity: 99.5,
    variants: [
      { dose: "10mg", price: 80 },
      { dose: "20mg", price: 100 },
      { dose: "30mg", price: 130 },
    ],
    storage: GENERIC_STORAGE,
    image: "/products/glp-rt.jpeg",
    paired_products: ["BPC-157", "Tirzepatide"],
    in_stock: true,
    featured: true,
  },
  {
    id: "tirzepatide",
    name: "Tirzepatide",
    slug: "tirzepatide",
    category: "Performance",
    short_description: "Dual GIP/GLP-1 receptor agonist for metabolic pathway research.",
    description:
      "Tirzepatide is a dual glucose-dependent insulinotropic polypeptide (GIP) and GLP-1 receptor agonist studied extensively in metabolic research. Research applications include glucose regulation, appetite signaling, and incretin pathway studies.",
    molecular_weight: "4,813.5 Da",
    sequence: "",
    purity: 99.3,
    variants: [
      { dose: "10mg", price: 60 },
      { dose: "20mg", price: 100 },
      { dose: "30mg", price: 125 },
    ],
    storage: GENERIC_STORAGE,
    image: "/products/tirzepatide.png",
    paired_products: ["GLP-3 RT", "Bacteriostatic Water"],
    in_stock: true,
    featured: true,
  },
  {
    id: "69f9871d9cc1fe91aec19c93",
    name: "BPC-157",
    slug: "bpc-157",
    category: "Recovery",
    short_description: "Body Protection Compound for tissue repair and regeneration research.",
    description:
      "BPC-157 (Body Protection Compound-157) is a pentadecapeptide derived from human gastric juice, extensively studied for its cytoprotective and regenerative properties. Research applications include wound healing, tendon repair, and gastrointestinal protection pathways. Over 100 peer-reviewed studies support its research applications.",
    molecular_weight: "1,419.5 Da",
    sequence: "Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val",
    purity: 99.8,
    variants: [
      { dose: "5mg", price: 40 },
      { dose: "10mg", price: 50 },
    ],
    storage: GENERIC_STORAGE,
    image: "/products/bpc-157.jpg",
    paired_products: ["GLP-3 RT", "GHK-Cu"],
    in_stock: true,
    featured: true,
  },
  {
    id: "69f9871d9cc1fe91aec19c94",
    name: "GHK-Cu",
    slug: "ghk-cu",
    category: "Longevity",
    categories: ["Longevity", "Aesthetics"],
    short_description: "Copper peptide complex for anti-aging and wound healing research.",
    description:
      "GHK-Cu (Glycyl-L-Histidyl-L-Lysine Copper Complex) is a naturally occurring copper peptide with extensive research documentation in skin remodeling, wound contraction, and anti-inflammatory pathways. Studies indicate GHK-Cu stimulates collagen and glycosaminoglycan synthesis in dermal fibroblasts.",
    molecular_weight: "403.9 Da",
    sequence: "Gly-His-Lys-Cu",
    purity: 99.6,
    variants: [
      { dose: "50mg", price: 35 },
      { dose: "100mg", price: 50 },
    ],
    storage: "Store at -20°C. Protect from moisture. Reconstituted: 2-8°C.",
    image: "/products/ghk-cu.jpg",
    paired_products: ["MT2", "GLOW"],
    in_stock: true,
    featured: true,
  },
  {
    id: "semax",
    name: "Semax",
    slug: "semax",
    category: "Longevity",
    categories: ["Longevity", "Performance"],
    short_description: "Nootropic heptapeptide for cognitive and neuroprotection research.",
    description:
      "Semax is a synthetic heptapeptide derived from ACTH(4-10), studied for its nootropic and neuroprotective properties. Research focuses on BDNF expression, attention and memory pathways, and recovery models in neuroscience research.",
    molecular_weight: "813.9 Da",
    sequence: "Met-Glu-His-Phe-Pro-Gly-Pro",
    purity: 99.1,
    variants: [
      { dose: "5mg", price: 30 },
      { dose: "10mg", price: 40 },
    ],
    storage: GENERIC_STORAGE,
    image: "/products/semax.jpg",
    paired_products: ["Selank", "NAD+"],
    in_stock: true,
    featured: true,
  },
  {
    id: "selank",
    name: "Selank",
    slug: "selank",
    category: "Longevity",
    short_description: "Anxiolytic heptapeptide for stress and cognition research.",
    description:
      "Selank is a synthetic analog of the immunomodulatory peptide tuftsin, studied for anxiolytic and nootropic properties. Research applications include stress response modulation, GABAergic signaling, and cognitive performance models.",
    molecular_weight: "751.9 Da",
    sequence: "Thr-Lys-Pro-Arg-Pro-Gly-Pro",
    purity: 99.0,
    variants: [
      { dose: "5mg", price: 40 },
      { dose: "10mg", price: 70 },
    ],
    storage: GENERIC_STORAGE,
    image: null,
    paired_products: ["Semax", "NAD+"],
    in_stock: true,
    featured: false,
  },
  {
    id: "69f9871d9cc1fe91aec19c92",
    name: "KLOW",
    slug: "klow",
    category: "Performance",
    categories: ["Recovery", "Aesthetics"],
    short_description: "Cognitive enhancement peptide for neuroscience research.",
    description:
      "KLOW is a research peptide compound developed for studying nootropic pathways and cognitive function. It targets BDNF (Brain-Derived Neurotrophic Factor) signaling cascades and has shown potential in neuroscience research focusing on synaptic plasticity and neuroprotection.",
    molecular_weight: "1,847.9 Da",
    sequence: "",
    purity: 99.2,
    variants: [{ dose: "80mg", price: 99 }],
    storage: "Store at -20°C. Reconstituted: 2-8°C, use within 28 days.",
    image: "/products/klow.jpg",
    paired_products: ["GLP-3 RT", "BPC-157"],
    in_stock: true,
    featured: true,
  },
  {
    id: "69f9871d9cc1fe91aec19c91",
    name: "GLOW",
    slug: "glow",
    category: "Aesthetics",
    categories: ["Aesthetics", "Recovery"],
    short_description: "Proprietary peptide blend targeting skin rejuvenation pathways.",
    description:
      "GLOW is Omen Labs' proprietary formulation designed for research into dermal regeneration and collagen synthesis pathways. This compound targets fibroblast growth factor receptors and has demonstrated promising results in in-vitro skin cell proliferation studies.",
    molecular_weight: "2,156.4 Da",
    sequence: "",
    purity: 98.7,
    variants: [{ dose: "70mg", price: 89 }],
    storage: "Store at -20°C. Reconstituted: 2-8°C, use within 21 days.",
    image: null,
    paired_products: ["GHK-Cu", "MT2"],
    in_stock: true,
    featured: true,
  },
  {
    id: "nad",
    name: "NAD+",
    slug: "nad",
    category: "Longevity",
    short_description: "Nicotinamide adenine dinucleotide for cellular energy and aging research.",
    description:
      "NAD+ (nicotinamide adenine dinucleotide) is a critical coenzyme central to cellular energy metabolism and DNA repair. Research applications include mitochondrial function, sirtuin activation, and cellular senescence studies in longevity research.",
    molecular_weight: "663.4 Da",
    sequence: "",
    purity: 99.6,
    variants: [
      { dose: "250mg", price: 40 },
      { dose: "500mg", price: 70 },
    ],
    storage: "Store at -20°C. Protect from light and moisture.",
    image: "/products/nad.jpg",
    paired_products: ["MOTS-c", "Semax"],
    in_stock: true,
    featured: true,
  },
  {
    id: "mots-c",
    name: "MOTS-c",
    slug: "mots-c",
    category: "Longevity",
    categories: ["Longevity", "Performance"],
    short_description: "Mitochondrial-derived peptide for metabolic homeostasis research.",
    description:
      "MOTS-c is a mitochondrial-derived peptide encoded within the 12S rRNA region of mitochondrial DNA. Research focuses on metabolic homeostasis, AMPK signaling, insulin sensitivity, and exercise-mimetic pathways.",
    molecular_weight: "2,174.6 Da",
    sequence: "Met-Arg-Trp-Gln-Glu-Met-Gly-Tyr-Ile-Phe-Tyr-Pro-Arg-Lys-Leu-Arg",
    purity: 99.0,
    variants: [
      { dose: "10mg", price: 54.99 },
      { dose: "40mg", price: 120 },
    ],
    storage: GENERIC_STORAGE,
    image: "/products/mots-c.png",
    paired_products: ["NAD+", "GLP-3 RT"],
    in_stock: true,
    featured: false,
  },
  {
    id: "tb-500",
    name: "TB-500",
    slug: "tb-500",
    category: "Recovery",
    short_description: "Thymosin Beta-4 fragment for tissue repair and flexibility research.",
    description:
      "TB-500 is a synthetic fragment of Thymosin Beta-4, a naturally occurring peptide present in nearly all human and animal cells. Research applications include actin regulation, cell migration, wound repair, and inflammation modulation studies.",
    molecular_weight: "4,963.4 Da",
    sequence: "",
    purity: 99.0,
    variants: [
      { dose: "5mg", price: 65 },
      { dose: "10mg", price: 110 },
    ],
    storage: GENERIC_STORAGE,
    image: "/products/tb-500.jpg",
    paired_products: ["BPC-157", "GHK-Cu"],
    in_stock: true,
    featured: false,
  },
  {
    id: "69f9871d9cc1fe91aec19c90",
    name: "MT2",
    slug: "mt2",
    category: "Aesthetics",
    short_description: "Melanotan II peptide for pigmentation and receptor binding research.",
    description:
      "Melanotan II (MT2) is a synthetic analog of α-melanocyte-stimulating hormone (α-MSH) widely used in research examining melanocortin receptor activation. Studies focus on its interaction with MC1R and MC4R pathways, with applications in dermatological and behavioral neuroscience research.",
    molecular_weight: "1,024.2 Da",
    sequence: "Ac-Nle-Asp-His-D-Phe-Arg-Trp-Lys-NH2",
    purity: 99.8,
    variants: [{ dose: "10mg", price: 40 }],
    storage: "Store at -20°C. Protect from light. Reconstituted: 2-8°C.",
    image: "/products/mt2.png",
    paired_products: ["GHK-Cu", "GLOW"],
    in_stock: true,
    featured: true,
  },
  {
    id: "ipamorelin",
    name: "Ipamorelin",
    slug: "ipamorelin",
    category: "Performance",
    categories: ["Performance", "Longevity"],
    short_description: "Selective growth hormone secretagogue for endocrine research.",
    description:
      "Ipamorelin is a pentapeptide growth hormone secretagogue with high selectivity for the ghrelin receptor (GHS-R). Research applications include pulsatile GH release studies, endocrine signaling, and body composition models.",
    molecular_weight: "711.9 Da",
    sequence: "Aib-His-D-2-Nal-D-Phe-Lys-NH2",
    purity: 99.3,
    variants: [{ dose: "10mg", price: 50 }],
    storage: GENERIC_STORAGE,
    image: null,
    paired_products: ["CJC + Ipamorelin", "Bacteriostatic Water"],
    in_stock: true,
    featured: false,
  },
  {
    id: "cjc-ipamorelin",
    name: "CJC + Ipamorelin",
    slug: "cjc-ipamorelin",
    category: "Performance",
    short_description: "CJC-1295 and Ipamorelin blend for synergistic GH axis research.",
    description:
      "A combined preparation of CJC-1295 (a GHRH analog) and Ipamorelin (a ghrelin receptor agonist), studied for synergistic effects on the growth hormone axis. Research focuses on amplified pulsatile GH release and downstream IGF-1 signaling.",
    molecular_weight: "",
    sequence: "",
    purity: 99.0,
    variants: [
      { dose: "5mg/5mg", price: 80 },
      { dose: "10mg/10mg", price: 120 },
    ],
    storage: GENERIC_STORAGE,
    image: null,
    paired_products: ["Ipamorelin", "Bacteriostatic Water"],
    in_stock: true,
    featured: false,
  },
  {
    id: "kpv",
    name: "KPV",
    slug: "kpv",
    category: "Recovery",
    short_description: "Anti-inflammatory tripeptide for immune pathway research.",
    description:
      "KPV is the C-terminal tripeptide fragment of α-MSH studied for potent anti-inflammatory properties. Research applications include inflammatory bowel models, mast cell modulation, and epithelial barrier studies.",
    molecular_weight: "342.4 Da",
    sequence: "Lys-Pro-Val",
    purity: 99.2,
    variants: [{ dose: "10mg", price: 50 }],
    storage: GENERIC_STORAGE,
    image: "/products/kpv.png",
    paired_products: ["BPC-157", "TB-500"],
    in_stock: true,
    featured: false,
  },
  {
    id: "igf1-lr3",
    name: "IGF-1 LR3",
    slug: "igf1-lr3",
    category: "Performance",
    categories: ["Performance", "Recovery"],
    short_description: "Long-arginine IGF-1 analog for growth factor signaling research.",
    description:
      "IGF-1 LR3 is a long-acting analog of insulin-like growth factor 1 with an arginine substitution and 13-residue N-terminal extension, reducing binding-protein affinity. Research applications include cellular growth, proliferation, and anabolic signaling studies.",
    molecular_weight: "9,117.5 Da",
    sequence: "",
    purity: 99.2,
    variants: [{ dose: "1mg", price: 95 }],
    storage: "Store at -20°C. Avoid repeated freeze-thaw cycles.",
    image: "/products/igf1-lr3.png",
    paired_products: ["CJC + Ipamorelin", "Bacteriostatic Water"],
    in_stock: true,
    featured: false,
  },
  {
    id: "69fc30ecf179623737bd64e9",
    name: "Bacteriostatic Water",
    slug: "bacteriostatic-water",
    category: "Recovery",
    short_description: "Sterile bacteriostatic water for peptide reconstitution.",
    description:
      "Pharmaceutical-grade bacteriostatic water (0.9% benzyl alcohol) for safe multi-dose reconstitution of lyophilized peptide compounds. Essential for any peptide research protocol.",
    molecular_weight: "",
    sequence: "",
    purity: 99.9,
    variants: [{ dose: "10mL", price: 10.99 }],
    storage: "Store at room temperature. Once opened, use within 28 days.",
    image: null,
    paired_products: ["BPC-157", "MT2", "GLP-3 RT"],
    in_stock: true,
    featured: false,
  },

  // ── Coming soon (pricing TBD) ────────────────────────────────────────────
  {
    id: "adamax",
    name: "Adamax",
    slug: "adamax",
    category: "Longevity",
    short_description: "Next-generation Semax analog for advanced nootropic research.",
    description:
      "Adamax is a synthetic Semax analog engineered for enhanced potency in neurotrophic research. Studies focus on BDNF and NGF expression, neuroplasticity, and cognitive performance models.",
    molecular_weight: "",
    sequence: "",
    purity: 99.2,
    variants: [{ dose: "10mg", price: null }],
    storage: GENERIC_STORAGE,
    image: "/products/adamax.png",
    paired_products: ["Semax", "Selank"],
    in_stock: false,
    coming_soon: true,
    featured: false,
  },
  {
    id: "69fc30ecf179623737bd64e8",
    name: "MT1",
    slug: "mt1",
    category: "Aesthetics",
    short_description: "Melanotan I peptide for melanogenesis and pigmentation research.",
    description:
      "Melanotan I (MT1) is a synthetic analog of alpha-MSH used in research examining melanocortin receptor pathways. It has been studied for its role in melanogenesis, UV protection mechanisms, and photoprotective properties in dermatological research.",
    molecular_weight: "1,646.9 Da",
    sequence: "Ac-Ser-Tyr-Ser-Met-Glu-His-Phe-Arg-Trp-Gly-Lys-Pro-Val-NH2",
    purity: 99.3,
    variants: [{ dose: "10mg", price: null }],
    storage: "Store at -20°C. Protect from light. Reconstituted: 2-8°C.",
    image: "/products/mt1.png",
    paired_products: ["MT2", "GHK-Cu"],
    in_stock: false,
    coming_soon: true,
    featured: false,
  },
  {
    id: "69fc30ecf179623737bd64ea",
    name: "WOLVERINE",
    slug: "wolverine",
    category: "Recovery",
    categories: ["Recovery", "Performance"],
    short_description: "Proprietary recovery peptide blend for accelerated tissue repair research.",
    description:
      "WOLVERINE is Omen Labs' high-potency proprietary peptide blend targeting rapid tissue regeneration and recovery pathways. Formulated for research into accelerated healing mechanisms, inflammation reduction, and musculoskeletal repair.",
    molecular_weight: "",
    sequence: "",
    purity: 99.4,
    variants: [{ dose: "10mg", price: null }],
    storage: GENERIC_STORAGE,
    image: null,
    paired_products: ["BPC-157", "GHK-Cu"],
    in_stock: false,
    coming_soon: true,
    featured: false,
  },
  {
    id: "tesamorelin",
    name: "Tesamorelin",
    slug: "tesamorelin",
    category: "Performance",
    short_description: "Stabilized GHRH analog for growth hormone axis research.",
    description:
      "Tesamorelin is a stabilized analog of growth hormone-releasing hormone (GHRH) studied for its effects on endogenous GH secretion and visceral adiposity pathways in metabolic research.",
    molecular_weight: "5,135.9 Da",
    sequence: "",
    purity: 99.1,
    variants: [{ dose: "10mg", price: null }],
    storage: GENERIC_STORAGE,
    image: null,
    paired_products: ["CJC + Ipamorelin", "Ipamorelin"],
    in_stock: false,
    coming_soon: true,
    featured: false,
  },
  {
    id: "semax-selank",
    name: "Semax + Selank",
    slug: "semax-selank",
    category: "Longevity",
    categories: ["Longevity", "Recovery"],
    short_description: "Combined nootropic and anxiolytic peptide stack for CNS research.",
    description:
      "A combined preparation of Semax and Selank for research into synergistic nootropic and anxiolytic pathways — BDNF expression, GABAergic modulation, and stress-cognition interaction models.",
    molecular_weight: "",
    sequence: "",
    purity: 99.0,
    variants: [{ dose: "5mg/5mg", price: null }],
    storage: GENERIC_STORAGE,
    image: null,
    paired_products: ["Semax", "Selank"],
    in_stock: false,
    coming_soon: true,
    featured: false,
  },
];

// Backward-compatible fields: price = lowest variant price, dosage = first dose
for (const p of PRODUCTS) {
  const priced = p.variants.filter((v) => v.price != null);
  p.price = priced.length ? Math.min(...priced.map((v) => v.price)) : null;
  p.dosage = p.variants[0] ? `${p.variants[0].dose} lyophilized` : "";
  p.has_multiple = p.variants.length > 1;
}

const POPULARITY_ORDER = [
  "glp-rt", "tirzepatide", "bpc-157", "ghk-cu", "semax", "nad", "mt2", "klow", "glow",
  "tb-500", "mots-c", "selank", "ipamorelin", "cjc-ipamorelin", "kpv", "igf1-lr3",
];

export function getProductBySlug(slug) {
  return PRODUCTS.find((p) => p.slug === slug) || null;
}

export function getCategories(product) {
  return product.categories || (product.category ? [product.category] : []);
}

export function getProductsByCategory(category) {
  return category ? PRODUCTS.filter((p) => getCategories(p).includes(category)) : PRODUCTS;
}

export function sortByPopularity(products) {
  return [...products].sort((a, b) => {
    if (!!a.coming_soon !== !!b.coming_soon) return a.coming_soon ? 1 : -1;
    const ai = POPULARITY_ORDER.indexOf(a.slug);
    const bi = POPULARITY_ORDER.indexOf(b.slug);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

export function getFeaturedProducts() {
  return sortByPopularity(PRODUCTS.filter((p) => p.featured && p.slug !== "bacteriostatic-water"));
}
