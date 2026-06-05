import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import OmenLogo from './OmenLogo';

export default function CtaBanner() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden border border-white/[0.08]"
          style={{ background: 'linear-gradient(135deg, hsl(222,60%,12%) 0%, hsl(240,20%,8%) 100%)' }}
        >
          {/* Hex grid overlay */}
          <div className="absolute inset-0 hex-grid opacity-30 pointer-events-none" />

          {/* Large watermark logo */}
          <div className="absolute right-0 top-0 bottom-0 flex items-center pr-12 opacity-[0.04] pointer-events-none">
            <OmenLogo size={320} className="text-white" />
          </div>

          {/* Blue glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 50% 80% at 80% 50%, rgba(60, 100, 255, 0.15) 0%, transparent 70%)' }}
          />

          <div className="relative z-10 p-10 md:p-16 lg:p-20">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-px w-8 bg-primary/60" />
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary/60">
                  Begin Your Research
                </span>
              </div>

              <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] leading-[1.1] text-white">
                Precision compounds
                <br />
                for advanced protocols
              </h2>

              <p className="mt-6 text-base text-white/40 leading-relaxed max-w-lg">
                Access our full catalog of HPLC-verified peptides. Every order includes Certificate of Analysis and cold chain shipping.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/catalog"
                  className="group inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-white text-black text-sm font-semibold tracking-wide hover:bg-white/90 transition-all duration-200"
                >
                  Explore Catalog
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/order-status"
                  className="inline-flex items-center justify-center h-12 px-7 rounded-xl border border-white/15 text-sm font-medium tracking-wide text-white/60 hover:text-white hover:border-white/25 hover:bg-white/[0.05] transition-all duration-200"
                >
                  Track Your Order
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}