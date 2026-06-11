import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import OmenLogo from './OmenLogo';
import HeroVials from './HeroVials';

const ticker = [
  'BPC-157', 'TB-500', 'CJC-1295', 'Ipamorelin', 'Semaglutide', 'GHK-Cu',
  'Melanotan II', 'PT-141', 'NAD+', 'Epithalon', 'Selank', 'Semax',
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-background">
      {/* Grid background */}
      <div className="absolute inset-0 hex-grid opacity-100 pointer-events-none" />

      {/* Blue radial gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 60% 40%, rgba(60, 100, 255, 0.09) 0%, transparent 70%)',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full py-24 pt-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/[0.07] mb-8"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                  Research-Grade Peptides
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-6xl md:text-7xl xl:text-[5.5rem] font-bold tracking-[-0.04em] leading-[0.92] text-foreground"
              >
                OMEN
                <br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, hsl(222,100%,70%) 0%, hsl(200,100%,65%) 100%)' }}>
                  LABS
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-8 text-base md:text-lg text-muted-foreground leading-relaxed max-w-md"
              >
                Pharmaceutical-grade peptide compounds for advanced research.
                Every batch independently verified through HPLC analysis.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-10 flex flex-col sm:flex-row gap-3"
              >
                <Link
                  to="/catalog"
                  className="group inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-primary text-white text-sm font-medium tracking-wide hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20"
                >
                  Explore Catalog
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center h-12 px-7 rounded-xl border border-black/10 text-sm font-medium tracking-wide text-muted-foreground hover:text-foreground hover:border-black/20 hover:bg-black/[0.04] transition-all duration-200"
                >
                  Our Process
                </Link>
              </motion.div>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-14 flex gap-10 md:gap-14"
              >
                {[
                  { value: '≥98%', label: 'Purity Standard' },
                  { value: '100%', label: 'HPLC Tested' },
                  { value: '12+', label: 'Compounds' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{s.value}</p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-1.5 uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right – interactive floating vials */}
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="relative flex flex-col mt-4 lg:mt-0"
            >
              <HeroVials />

              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                className="absolute right-0 lg:-right-6 top-[12%] bg-card/90 border border-black/[0.08] rounded-xl px-4 py-3 backdrop-blur-xl shadow-lg shadow-primary/5 pointer-events-none"
              >
                <div className="flex items-center gap-3">
                  <OmenLogo size={20} className="text-primary" />
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">COA Verified</p>
                    <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">Independent Lab</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Compound ticker */}
      <div className="relative z-10 border-t border-black/[0.05] py-4 overflow-hidden">
        <div className="ticker-track">
          {[...ticker, ...ticker].map((name, i) => (
            <div key={i} className="flex items-center gap-6 px-6">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
                {name}
              </span>
              <span className="text-primary/30 text-xs">◆</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 hidden lg:flex flex-col items-center gap-2"
      >
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Scroll</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground animate-bounce" />
      </motion.div>
    </section>
  );
}