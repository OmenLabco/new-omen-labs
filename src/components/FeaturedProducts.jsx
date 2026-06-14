import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Flame, TrendingUp, FlaskConical, Crown } from 'lucide-react';
import ProductVialImage from './ProductVialImage';
import { getFeaturedProducts, getCategories } from '@/data/products';

const categoryStyles = {
  Recovery:    { chip: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30', glow: 'from-emerald-500/25', ring: 'hover:border-emerald-400/40' },
  Aesthetics:  { chip: 'text-pink-600 bg-pink-500/10 border-pink-500/30',          glow: 'from-pink-500/25',    ring: 'hover:border-pink-400/40' },
  Performance: { chip: 'text-amber-600 bg-amber-500/10 border-amber-500/30',       glow: 'from-amber-500/25',   ring: 'hover:border-amber-400/40' },
  Longevity:   { chip: 'text-primary bg-primary/10 border-primary/25',             glow: 'from-blue-500/25',    ring: 'hover:border-primary/40' },
};
const fallbackStyle = { chip: 'text-muted-foreground bg-white/5 border-black/10', glow: 'from-white/10', ring: 'hover:border-black/20' };

const MEDAL = {
  1: {
    badgeStyle: { background: 'linear-gradient(135deg,#fff0b0 0%,#f5b400 45%,#b8860b 100%)', color: '#3a2a00', boxShadow: '0 4px 14px rgba(245,180,0,.5)' },
    base: 'bg-amber-400/15 text-amber-600 border-amber-400/35', baseH: 'h-16',
    ring: 'border-amber-400/50 shadow-[0_30px_60px_-24px_rgba(245,180,40,.6)]',
  },
  2: {
    badgeStyle: { background: 'linear-gradient(135deg,#ffffff 0%,#d7dbe2 45%,#9aa1ac 100%)', color: '#2a2d33', boxShadow: '0 4px 14px rgba(160,170,190,.55)' },
    base: 'bg-zinc-400/15 text-zinc-500 border-zinc-400/40', baseH: 'h-11',
    ring: 'border-zinc-300/55 shadow-[0_26px_54px_-28px_rgba(165,176,195,.7)]',
  },
  3: {
    badgeStyle: { background: 'linear-gradient(135deg,#f4c89a 0%,#c8803c 48%,#7c4a22 100%)', color: '#fff', boxShadow: '0 4px 14px rgba(165,105,55,.5)' },
    base: 'bg-amber-700/12 text-amber-700 border-amber-700/35', baseH: 'h-8',
    ring: 'border-amber-700/45 shadow-[0_26px_54px_-28px_rgba(170,110,60,.6)]',
  },
};

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

        {/* ===== Top 3 — PODIUM (desktop) ===== */}
        <div className="hidden md:grid grid-cols-3 gap-5 items-end">
          {[{ p: top3[1], r: 2 }, { p: top3[0], r: 1 }, { p: top3[2], r: 3 }].filter((x) => x.p).map(({ p, r }) => {
            const m = MEDAL[r];
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 34 }}
                whileInView={{ opacity: 1, y: r === 1 ? -24 : 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: r * 0.08 }}
              >
                <Link to={`/product/${p.slug}`} className={`card-lift group relative block rounded-3xl border bg-card overflow-hidden ${m.ring}`}>
                  <div className="relative aspect-square overflow-hidden">
                    <ProductVialImage image={p.image} name={p.name} className="absolute inset-0 h-full w-full" style={{ objectFit: 'cover' }} />
                    <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#05070d] via-[#05070d]/70 to-transparent pointer-events-none" />
                    {/* Medal */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span style={m.badgeStyle} className="h-9 w-9 inline-flex items-center justify-center rounded-full font-black text-sm">{r}</span>
                      {r === 1 && (
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border border-amber-400/40 bg-black/55 text-amber-400 backdrop-blur-sm">
                          <Crown className="h-3 w-3" /> #1 Best Seller
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <h3 className={`font-bold tracking-tight text-white group-hover:text-primary transition-colors ${r === 1 ? 'text-2xl' : 'text-xl'}`}>{p.name}</h3>
                      <span className="mt-1 block text-lg font-bold text-white">
                        {p.has_multiple && <span className="text-[11px] font-normal text-white/60">from </span>}${p.price?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Link>
                {/* Podium base */}
                <div className={`mt-3 rounded-xl border flex items-center justify-center font-black ${m.base} ${m.baseH}`}>
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-70 mr-2">Rank</span>
                  <span className="text-2xl leading-none">{r}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ===== Top 3 — ranked list (mobile) ===== */}
        <div className="md:hidden flex flex-col gap-2.5">
          {top3.map((p, i) => {
            const r = i + 1;
            const m = MEDAL[r];
            return (
              <motion.div key={p.id} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Link to={`/product/${p.slug}`} className={`card-lift group flex items-center gap-3 rounded-2xl border bg-card p-2.5 active:scale-[0.99] ${m.ring}`}>
                  <span style={m.badgeStyle} className="shrink-0 h-9 w-9 inline-flex items-center justify-center rounded-full font-black text-sm">{r}</span>
                  <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-secondary">
                    <ProductVialImage image={p.image} name={p.name} className="absolute inset-0 h-full w-full" style={{ objectFit: 'cover' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[15px] truncate group-hover:text-primary transition-colors">{p.name}</p>
                      {r === 1 && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                    </div>
                    <p className="text-[13px] font-bold mt-0.5">
                      {p.has_multiple && <span className="text-[10px] font-normal text-muted-foreground">from </span>}${p.price?.toFixed(2)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mr-1 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>
              </motion.div>
            );
          })}
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
            <div className="flex gap-3 overflow-x-auto snap-x pt-3 pb-4 -mx-4 px-4 sm:mx-0 sm:px-2 sm:-mx-2 scrollbar-none">
              {rest.map((product) => {
                const cs = categoryStyles[product.category] || fallbackStyle;
                return (
                  <Link
                    key={product.id}
                    to={`/product/${product.slug}`}
                    className={`card-lift group shrink-0 w-36 sm:w-40 snap-start rounded-2xl border border-border bg-card overflow-hidden active:scale-[0.97] ${cs.ring}`}
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
