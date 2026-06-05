import { Link } from 'react-router-dom';
import { ArrowUpRight, FileCheck } from 'lucide-react';
import OmenLogo from './OmenLogo';
import { motion } from 'framer-motion';
import PurityBadge from './PurityBadge';

export default function ProductCard({ product, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link
        to={`/product/${product.slug}`}
        className="group block border-b micro-rule border-border py-8 first:border-t"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Image */}
          <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden bg-secondary flex-shrink-0 relative">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-mono text-xs text-muted-foreground">IMG</span>
              </div>
            )}
            {/* Logo watermark */}
            <div className="absolute bottom-2 right-2 opacity-25 flex items-center gap-1.5">
              <OmenLogo size={14} className="text-white" />
              <span className="font-semibold text-white text-[8px] tracking-[0.18em] uppercase">OMEN LABS</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold tracking-tight group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <p className="font-mono text-[11px] text-muted-foreground mt-1 tracking-wide">
                  {product.category?.toUpperCase()} PROTOCOL
                </p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
            </div>

            <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
              {product.short_description}
            </p>

            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <PurityBadge purity={product.purity} />
              {product.molecular_weight && (
                <span className="font-mono text-[10px] text-muted-foreground">
                  MW: {product.molecular_weight}
                </span>
              )}
              <div className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                <FileCheck className="h-3 w-3" />
                <span className="font-mono text-[10px]">COA</span>
              </div>
              <span className="ml-auto text-lg font-semibold">
                ${product.price?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}