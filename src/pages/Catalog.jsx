import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { PRODUCTS, getProductsByCategory, sortByPopularity } from '@/data/products';
import OmenLogo from '../components/OmenLogo';
import CategoryFilter from '../components/CategoryFilter';
import ProductVialImage from '../components/ProductVialImage';

const categoryColors = {
  Recovery: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Aesthetics: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  Performance: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 pt-28">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-14"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-primary" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">
              Research Compounds
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold tracking-[-0.04em]">
            Molecular Catalog
          </h1>
          <p className="mt-4 text-muted-foreground max-w-lg leading-relaxed">
            Browse our complete selection of HPLC-verified peptide compounds for research applications.
          </p>
        </motion.div>

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  to={`/product/${product.slug}`}
                  className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-white/[0.15] hover:bg-card/80 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative bg-secondary/30 flex items-center justify-center py-6 group-hover:py-4 transition-all duration-700">
                    <ProductVialImage
                      image={product.image}
                      name={product.name}
                      className="h-52 w-auto group-hover:scale-105 transition-transform duration-700"
                    />
                    {product.coming_soon && (
                      <div className="absolute bottom-3 left-3">
                        <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500">
                          Coming Soon
                        </span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className={`font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border ${categoryColors[product.category] || 'text-muted-foreground bg-white/5 border-white/10'}`}>
                        {product.category}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                        <ArrowUpRight className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold tracking-tight group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <span className="text-base font-bold shrink-0">
                        {product.coming_soon ? (
                          <span className="text-sm text-muted-foreground font-medium">TBA</span>
                        ) : (
                          <>{product.has_multiple && <span className="text-xs font-normal text-muted-foreground">from </span>}${product.price?.toFixed(2)}</>
                        )}
                      </span>
                    </div>
                    {product.short_description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {product.short_description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
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