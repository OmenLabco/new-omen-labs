import { motion } from 'framer-motion';
import { FlaskConical, Shield, Eye, Zap } from 'lucide-react';
import OmenLogo from '../components/OmenLogo';

const values = [
  {
    icon: FlaskConical,
    title: 'Rigorous Testing',
    text: 'Every compound undergoes multi-stage HPLC verification. We test purity, identity, and sterility before any product reaches our catalog.',
  },
  {
    icon: Shield,
    title: 'Full Transparency',
    text: 'We provide complete Certificates of Analysis for every batch. No hidden processes, no ambiguity — just verified data.',
  },
  {
    icon: Eye,
    title: 'Research-First',
    text: 'Built by researchers, for researchers. Our team includes biochemists with decades of combined experience in peptide synthesis.',
  },
  {
    icon: Zap,
    title: 'Rapid Fulfillment',
    text: 'Orders ship within 24 hours via temperature-controlled logistics. Cold chain integrity is monitored from facility to doorstep.',
  },
];

const stats = [
  { value: '99.8%', label: 'Avg Purity' },
  { value: '10K+', label: 'Orders Shipped' },
  { value: '24hr', label: 'Ship Time' },
  { value: '100%', label: 'COA Rate' },
];

export default function About() {
  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 hex-grid opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 pt-28">
        {/* Hero header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-8 bg-primary" />
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">About Us</span>
            </div>
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold tracking-[-0.04em] leading-tight">
              The Science of
              <br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, hsl(222,100%,70%) 0%, hsl(200,100%,65%) 100%)' }}>
                Precision
              </span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <p className="text-muted-foreground leading-relaxed text-lg">
              Omen Labs was founded on a simple principle: researchers deserve access to
              the highest purity peptide compounds, backed by verifiable data and transparent processes.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Our lab partners operate under strict GMP-aligned protocols, ensuring every batch is synthesized
              to pharmaceutical standards, then independently verified before reaching you.
            </p>
          </motion.div>
        </div>

        {/* Values grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-7 hover:border-white/[0.15] transition-all duration-300 flex gap-5"
            >
              <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <v.icon className="text-primary" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h3 className="font-semibold text-base text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-white/[0.08] overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, hsl(222,60%,12%) 0%, hsl(240,20%,8%) 100%)' }}
        >
          <div className="absolute inset-0 hex-grid opacity-20 pointer-events-none" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 80% at 90% 50%, rgba(60,100,255,0.12) 0%, transparent 70%)' }}
          />

          <div className="relative z-10 p-10 md:p-14">
            <div className="flex items-center gap-3 mb-10">
              <OmenLogo size={24} className="text-primary/60" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-white/30">
                By the Numbers
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center md:text-left">
                  <p className="text-3xl md:text-4xl font-bold tracking-tight text-white">{stat.value}</p>
                  <p className="font-mono text-[10px] mt-2 uppercase tracking-widest text-white/30">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Research notice */}
        <div className="mt-10 p-4 border border-destructive/20 rounded-xl bg-destructive/[0.04] text-center">
          <p className="font-mono text-[11px] text-destructive uppercase tracking-wider">
            All products are sold strictly for research use only — not for human consumption
          </p>
        </div>
      </div>
    </div>
  );
}