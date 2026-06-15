import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ChevronDown } from 'lucide-react';
import { PRODUCTS, getProductsByCategory, sortByPopularity, getCategories } from '@/data/products';
import OmenLogo from '../components/OmenLogo';
import CategoryFilter from '../components/CategoryFilter';
import ProductVialImage from '../components/ProductVialImage';

// Soft pastel image backdrops, picked by the product's primary category —
// mirrors the per-product tinted cards on the reference store.
const CARD_BG = {
  Recovery: 'linear-gradient(160deg,#f3f8f5 0%,#eaf2ee 100%)',
  Aesthetics: 'linear-gradient(160deg,#faf2f6 0%,#f4e9f0 100%)',
  Performance: 'linear-gradient(160deg,#f8f5ee 0%,#f1ebdf 100%)',
  Longevity: 'linear-gradient(160deg,#f4f6fa 0%,#edf0f6 100%)',
};
const FALLBACK_BG = 'linear-gradient(160deg,#f6f7fa 0%,#eef0f4 100%)';

const SORTS = [
  { key: 'popular', label: 'Most Popular' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'name', label: 'Name: A to Z' },
];

export default function Catalog() {
  const [category, setCategory] = useState(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('popular');

  const products = useMemo(() => {
    let list = sortByPopularity(getProductsByCategory(category));
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.short_description?.toLowerCase().includes(q) ||
          getCategories(p).some((c) => c.toLowerCase().includes(q))
      );
    }
    const priceOf = (p) => (p.price == null ? Infinity : p.price);
    if (sort === 'price-asc') list = [...list].sort((a, b) => priceOf(a) - priceOf(b));
    else if (sort === 'price-desc') list = [...list].sort((a, b) => priceOf(b) - priceOf(a));
    else if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [category, query, sort]);

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 hex-grid opacity-50 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 pt-24 sm:pt-28">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.04em]">All Products</h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground">
            Premium research peptides — HPLC-verified, ≥98% purity.
          </p>
        </motion.div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full h-14 pl-14 pr-5 rounded-full border border-border bg-secondary/50 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition"
          />
        </div>

        {/* Sort */}
        <div className="mb-5 relative inline-block">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none h-12 pl-5 pr-11 rounded-full border border-border bg-card text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Category pills */}
        <div className="mb-7 sm:mb-9">
          <CategoryFilter selected={category} onSelect={setCategory} />
        </div>

        {/* Products grid */}
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <OmenLogo size={48} className="text-muted-foreground/20" />
            <p className="text-muted-foreground">No compounds found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
            {products.map((product, i) => {
              const primaryCat = getCategories(product)[0];
              const bg = CARD_BG[primaryCat] || FALLBACK_BG;
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                >
                  <Link
                    to={`/product/${product.slug}`}
                    className="card-lift group flex h-full flex-col rounded-3xl bg-secondary/40 overflow-hidden active:scale-[0.98]"
                  >
                    {/* Tinted image */}
                    <div className="relative aspect-[4/5] flex items-end justify-center overflow-hidden rounded-3xl" style={{ background: bg }}>
                      <ProductVialImage
                        image={product.image}
                        name={product.name}
                        className="h-[88%] w-auto object-contain group-hover:scale-[1.04] transition-transform duration-700"
                      />
                      {product.coming_soon && (
                        <div className="absolute top-3 left-3">
                          <span className="font-mono text-[8px] sm:text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/80 backdrop-blur text-amber-600 border border-amber-500/30">
                            Coming Soon
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 sm:p-4 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[15px] sm:text-lg font-bold tracking-tight leading-tight group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <div className="text-right shrink-0">
                          {product.coming_soon ? (
                            <span className="text-xs text-muted-foreground font-medium">TBA</span>
                          ) : (
                            <>
                              {product.has_multiple && <span className="block text-[9px] sm:text-[10px] font-medium text-muted-foreground leading-none">From</span>}
                              <span className="text-base sm:text-xl font-extrabold leading-tight">${product.price?.toFixed(2)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {product.short_description && (
                        <p className="mt-1 text-[11px] sm:text-[13px] text-muted-foreground line-clamp-1 sm:line-clamp-2">
                          {product.short_description}
                        </p>
                      )}
                      {/* View button */}
                      <div className="mt-3 sm:mt-4">
                        <span className="block w-full text-center rounded-full bg-foreground text-background font-bold text-[13px] sm:text-sm py-2.5 sm:py-3 group-hover:bg-primary transition-colors">
                          View
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Research notice */}
        <div className="mt-16 p-4 border border-destructive/20 rounded-xl bg-destructive/[0.04] text-center">
          <p className="font-mono text-[11px] text-destructive uppercase tracking-wider">
            All products are sold strictly for research use only — not for human consumption
          </p>
        </div>
      </div>
    </div>
  );
}
