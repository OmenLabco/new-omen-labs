import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { PRODUCTS, getProductsByCategory, sortByPopularity, getCategories } from '@/data/products';
import OmenLogo from '../components/OmenLogo';
import CategoryFilter from '../components/CategoryFilter';
import ProductVialImage from '../components/ProductVialImage';

const categoryColors = {
  Recovery: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/25',
  Aesthetics: 'text-pink-600 bg-pink-500/10 border-pink-500/25',
  Performance: 'text-amber-600 bg-amber-500/10 border-amber-500/25',
  Longevity: 'text-primary bg-primary/10 border-primary/20',
};

export default function Catalog() {
  const [category, setCategory] = useState(null);

  const products = useMemo(
    () => sortByPopularity(getProductsByCategory(category)),
    [category]
  );

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="absolute inset-0 hex-grid opacity-50 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 pt-24 sm:pt-28">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-14"
        >
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="h-px w-8 bg-primary" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">
              Research Compounds
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold tracking-[-0.04em]">
            Molecular Catalog
          </h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground max-w-lg leading-relaxed">
            Browse our complete selection of HPLC-verified peptide compounds for research applications.
          </p>
        </motion.div>

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-6 sm:mb-10"
        >
          <CategoryFilter selected={category} onSelect={setCategory} />
        </motion.div>

        {/* Products grid */}
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <OmenLogo size={48} className="text-muted-foreground/20" />
            <p className="text-muted-foreground">No compounds found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.35) }}
              >
                <Link
                  to={`/product/${product.slug}`}
                  className="card-lift group flex h-full flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/25 active:scale-[0.98]"
                >
                  {/* Image */}
                  <div className="relative flex items-center justify-center py-3 sm:py-6 group-hover:py-4 transition-all duration-700" style={{background:'radial-gradient(circle at 50% 42%, #ffffff, #e9ecf2)'}}>
                    <ProductVialImage
                      image={product.image}
                      name={product.name}
                      className="h-32 sm:h-44 md:h-52 w-auto group-hover:scale-105 transition-transform duration-700"
                    />
                    {product.coming_soon && (
                      <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
                        <span className="font-mono text-[8px] sm:text-[10px] uppercase tracking-widest px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500">
                          Coming Soon
                        </span>
                      </div>
                    )}

                    <div className="absolute top-3 right-3 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                        <ArrowUpRight className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-3 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold tracking-tight leading-snug group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <span className="text-sm sm:text-base font-bold">
                          {product.coming_soon ? (
                            <span className="text-xs sm:text-sm text-muted-foreground font-medium">Price TBA</span>
                          ) : (
                            <>{product.has_multiple && <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">from </span>}${product.price?.toFixed(2)}</>
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                        {getCategories(product).map((cat) => (
                          <span
                            key={cat}
                            className={`font-mono text-[8px] sm:text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${categoryColors[cat] || 'text-muted-foreground bg-white/5 border-black/10'}`}
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                    {product.short_description && (
                      <p className="hidden sm:block text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {product.short_description}
                      </p>
                    )}
                    <div className="hidden sm:flex items-center gap-2 pt-2 mt-auto border-t border-border">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Purity ≥{product.purity}%
                      </span>
                      {product.molecular_weight && (
                        <>
                          <span className="text-border">·</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{product.molecular_weight}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
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