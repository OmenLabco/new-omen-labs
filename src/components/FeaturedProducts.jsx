import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Flame, TrendingUp, FlaskConical } from 'lucide-react';
import ProductVialImage from './ProductVialImage';
import { getFeaturedProducts, getCategories } from '@/data/products';

const categoryStyles = {
  Recovery:    { chip: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30', glow: 'from-emerald-500/25', ring: 'hover:border-emerald-400/40' },
  Aesthetics:  { chip: 'text-pink-600 bg-pink-500/10 border-pink-500/30',          glow: 'from-pink-500/25',    ring: 'hover:border-pink-400/40' },
  Performance: { chip: 'text-amber-600 bg-amber-500/10 border-amber-500/30',       glow: 'from-amber-500/25',   ring: 'hover:border-amber-400/40' },
  Longevity:   { chip: 'text-primary bg-primary/10 border-primary/25',             glow: 'from-blue-500/25',    ring: 'hover:border-primary/40' },
};
const fallbackStyle = { chip: 'text-muted-foreground bg-white/5 border-black/10', glow: 'from-white/10', ring: 'hover:border-black/20' };

const RANKS = [
  { label: '#1', cls: 'bg-amber-400 text-black shadow-amber-400/40' },
  { label: '#2', cls: 'bg-zinc-300 text-black shadow-white/20' },
  { label: '#3', cls: 'bg-amber-700 text-white shadow-amber-700/40' },
];

const products = getFeaturedProducts();
const top3 = products.slice(0, 3);
const rest = products.slice(3, 9);

export default function FeaturedProducts() {
  if (products.length === 0) return null;

  return (
    <section className="py-24 md:py-36 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 md:mb-14 gap-5"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px w-8 bg-primary" />
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">
                Most Researched
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl xl:text-5xl font-bold tracking-[-0.03em] text-foreground">
              Top Compounds
            </h2>
            <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Ranked by researcher demand this month
            </p>
          </div>
          <Link
            to="/catalog"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border hover:border-black/20 px-5 py-2.5 rounded-xl hover:bg-black/[0.04]"
          >
            View All Compounds
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        {/* Top 3 — leaderboard cards (swipeable on mobile) */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-3 sm:overflow-visible scrollbar-none">
          {top3.map((product, i) => {
            const cs = categoryStyles[product.category] || fallbackStyle;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="min-w-[78%] xs:min-w-[70%] sm:min-w-0 snap-center"
              >
                <Link
                  to={`/product/${product.slug}`}
                  className={`group relative block rounded-3xl border border-border bg-card overflow-hidden transition-all duration-300 active:scale-[0.98] ${cs.ring}`}
                >
                  {/* Full-bleed render */}
                  <div className="relative aspect-square overflow-hidden">
                    <ProductVialImage
                      image={product.image}
                      name={product.name}
                      className="absolute inset-0 h-full w-full"
                      style={{ objectFit: 'cover' }}
                    />
                    {/* Category glow */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${cs.glow} via-transparent to-transparent opacity-40 pointer-events-none`} />
                    {/* Bottom fade for text */}
                    <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#05070d] via-[#05070d]/70 to-transparent pointer-events-none" />

                    {/* Rank badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className={`h-8 min-w-8 px-2 inline-flex items-center justify-center rounded-full font-mono text-xs font-bold shadow-lg ${RANKS[i].cls}`}>
                        {RANKS[i].label}
                      </span>
                      {i === 0 && (
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border border-amber-400/30 bg-black/50 text-amber-400 backdrop-blur-sm">
                          <Flame className="h-3 w-3" /> Best Seller
                        </span>
                      )}
                    </div>
                    {/* Name + price overlaid on the fade, categories bottom-right */}
                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                      <div className="flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                          <span className="mt-1 block text-base sm:text-lg font-bold text-white">
                            {product.has_multiple && <span className="text-[11px] font-normal text-white/60">from </span>}
                            ${product.price?.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {getCategories(product).map((cat) => {
                            const ccs = categoryStyles[cat] || fallbackStyle;
                            return (
                              <span key={cat} className={`font-mono text-[8px] sm:text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border backdrop-blur-md bg-white/85 ${ccs.chip}`}>
                                {cat}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}

          {/* Swipe-end card → catalog (mobile carousel only) */}
          <div className="sm:hidden min-w-[78%] snap-center">
            <Link
              to="/catalog"
              className="group relative flex flex-col items-center justify-center aspect-square rounded-3xl border border-primary/25 bg-gradient-to-b from-primary/[0.07] to-transparent overflow-hidden active:scale-[0.98] transition-transform"
            >
              <div className="absolute inset-0 hex-grid opacity-30 pointer-events-none" />
              <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center mb-5">
                <FlaskConical className="h-6 w-6 text-primary" />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary mb-2">22+ Compounds</p>
              <p className="text-xl font-bold tracking-tight text-center px-8">Explore the full catalog</p>
              <div className="mt-5 inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/25">
                Browse All <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          </div>
        </div>

        {/* The rest — compact swipe strip */}
        {rest.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="mt-8 md:mt-10"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4">
              Trending in the lab
            </p>
            <div className="flex gap-3 overflow-x-auto snap-x pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
              {rest.map((product) => {
                const cs = categoryStyles[product.category] || fallbackStyle;
                return (
                  <Link
                    key={product.id}
                    to={`/product/${product.slug}`}
                    className={`group shrink-0 w-36 sm:w-40 snap-start rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 active:scale-[0.97] ${cs.ring}`}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <ProductVialImage
                        image={product.image}
                        name={product.name}
                        className="absolute inset-0 h-full w-full"
                        style={{ objectFit: 'cover' }}
                      />
                      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#05070d]/90 to-transparent pointer-events-none" />
                    </div>
                    <div className="p-3 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold leading-tight truncate group-hover:text-primary transition-colors">{product.name}</p>
                        <p className="mt-0.5 text-[13px] font-bold">
                          {product.has_multiple && <span className="text-[10px] font-normal text-muted-foreground">from </span>}
                          ${product.price?.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        {getCategories(product).map((cat) => {
                          const ccs = categoryStyles[cat] || fallbackStyle;
                          return (
                            <span key={cat} className={`font-mono text-[7px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${ccs.chip}`}>
                              {cat}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

          </motion.div>
        )}
      </div>
    </section>
  );
}
