import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import ProductVialImage from './ProductVialImage';
import { getFeaturedProducts } from '@/data/products';

const categoryColors = {
  Recovery: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Aesthetics: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  Performance: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Longevity: 'text-primary bg-primary/10 border-primary/20',
};

const products = getFeaturedProducts();

export default function FeaturedProducts() {
  if (products.length === 0) return null;

  return (
    <section className="py-28 md:py-36 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-start md:items-end justify-between mb-14 gap-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-8 bg-primary" />
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">
                Featured Compounds
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl xl:text-5xl font-bold tracking-[-0.03em] text-foreground">
              Molecular Catalog
            </h2>
          </div>
          <Link
            to="/catalog"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border hover:border-white/20 px-5 py-2.5 rounded-xl hover:bg-white/[0.04]"
          >
            View All Compounds
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
              >
                <Link
                  to={`/product/${product.slug}`}
                  className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-white/[0.15] hover:bg-card/80 transition-all duration-300"
                >
                  {/* Vial image */}
                  <div className="relative flex items-center justify-center py-6 bg-[#060810] group-hover:py-4 transition-all duration-700">
                    <ProductVialImage
                      name={product.name}
                      dose={product.dosage?.replace(' lyophilized', '').replace(' vial', '')}
                      purity={product.purity}
                      category={product.category}
                      className="h-52 w-auto group-hover:scale-105 transition-transform duration-700"
                    />
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
                      <h3 className="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <span className="text-base font-bold text-foreground shrink-0">${product.price?.toFixed(2)}</span>
                    </div>
                    {product.short_description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {product.short_description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Purity ≥{product.purity}%
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
      </div>
    </section>
  );
}