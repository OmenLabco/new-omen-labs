import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Plus, Package } from 'lucide-react';
import { BUNDLES, bundlePct } from '@/data/bundles';
import { PRODUCTS } from '@/data/products';
import { cart } from '@/lib/cart';
import { stockStatus } from '@/lib/stockApi';
import ProductVialImage from './ProductVialImage';

// SKU → display info, resolved once from the catalog.
const SKU_INFO = {};
for (const p of PRODUCTS) for (const v of (p.variants || [])) {
  SKU_INFO[`${p.id}_${v.dose}`] = {
    name: p.name, dose: v.dose, price: v.price ?? p.price,
    image: v.image || p.image, id: p.id, awaiting_coa: !!p.awaiting_coa,
  };
}

function priceInfo(bundle) {
  const parts = bundle.skus.map((s) => SKU_INFO[s]).filter(Boolean);
  const list = parts.reduce((s, x) => s + (Number(x.price) || 0), 0);
  const pct = bundlePct(bundle);
  const save = +((list * pct) / 100).toFixed(2);
  return { parts, list: +list.toFixed(2), pct, save, price: +(list - save).toFixed(2) };
}

export default function BundlesSection({
  stock = {},
  productId = null,               // when set, only bundles that include this product
  heading = 'Research Bundles',
  subtitle = 'Frequently-paired compounds, bundled — save 5–10% vs. buying separately.',
}) {
  const { loadCart } = useOutletContext() || {};
  const [added, setAdded] = useState({});

  const addBundle = (bundle, parts) => {
    for (const s of bundle.skus) {
      const info = SKU_INFO[s];
      if (!info) continue;
      cart.add({ product_id: s, product_name: `${info.name} ${info.dose}`, quantity: 1, price: info.price });
    }
    loadCart?.();
    setAdded((a) => ({ ...a, [bundle.id]: true }));
    setTimeout(() => setAdded((a) => ({ ...a, [bundle.id]: false })), 1800);
  };

  const source = productId
    ? BUNDLES.filter((b) => b.skus.some((s) => SKU_INFO[s]?.id === productId))
    : BUNDLES;

  const cards = source.map((b) => {
    const info = priceInfo(b);
    const soldOut = b.skus.some((s) => stockStatus(stock[s])?.key === 'out' || SKU_INFO[s]?.awaiting_coa);
    return { bundle: b, info, soldOut };
  }).filter((c) => c.info.parts.length === c.bundle.skus.length); // only fully-resolvable bundles

  if (!cards.length) return null;

  return (
    <div className="mb-9 sm:mb-12">
      <div className="flex items-center gap-2 mb-1">
        <Package className="h-4 w-4 text-primary" />
        <h2 className="text-lg sm:text-xl font-bold tracking-tight">{heading}</h2>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground mb-4">{subtitle}</p>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible snap-x">
        {cards.map(({ bundle, info, soldOut }, i) => {
          const isAdded = added[bundle.id];
          return (
            <motion.div
              key={bundle.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
              className="snap-start shrink-0 w-[78%] sm:w-auto rounded-2xl border border-border bg-card p-4 flex flex-col"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{bundle.category}</span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">SAVE {info.pct}%</span>
              </div>

              {/* compound thumbnails */}
              <div className="flex items-center gap-2 mb-3">
                {info.parts.map((part, idx) => (
                  <div key={idx} className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-secondary">
                    <ProductVialImage image={part.image} name={part.name} style={{ objectFit: 'cover' }} />
                  </div>
                ))}
              </div>

              <p className="text-sm font-bold leading-tight">{bundle.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 mb-3 line-clamp-2">{bundle.blurb}</p>

              <div className="mt-auto flex items-end justify-between gap-2">
                <div>
                  <span className="text-[11px] text-muted-foreground line-through mr-1.5">${info.list.toFixed(2)}</span>
                  <span className="text-lg font-extrabold">${info.price.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => !soldOut && addBundle(bundle, info.parts)}
                  disabled={soldOut}
                  className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold transition-colors ${
                    soldOut ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                    : isAdded ? 'bg-emerald-500 text-white'
                    : 'bg-foreground text-background hover:bg-primary'
                  }`}
                >
                  {soldOut ? 'Unavailable' : isAdded ? <><Check className="h-3.5 w-3.5" /> Added</> : <><Plus className="h-3.5 w-3.5" /> Add Bundle</>}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
