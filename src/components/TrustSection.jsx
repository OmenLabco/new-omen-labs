import { motion } from 'framer-motion';
import { Shield, FlaskConical, Truck, Lock } from 'lucide-react';
import OmenLogo from './OmenLogo';

const features = [
  {
    icon: FlaskConical,
    title: 'HPLC Verified',
    description: 'Every batch undergoes high-performance liquid chromatography testing to guarantee ≥98% purity.',
    stat: '100%',
    statLabel: 'Test Rate',
  },
  {
    icon: Shield,
    title: 'COA Included',
    description: 'Full Certificate of Analysis with every order. Complete transparency in every compound.',
    stat: '12+',
    statLabel: 'Compounds',
  },
  {
    icon: Truck,
    title: 'Cold Chain',
    description: 'Temperature-controlled logistics ensure compound integrity from lab to your door.',
    stat: '24hr',
    statLabel: 'Ship Time',
  },
  {
    icon: Lock,
    title: 'Secure',
    description: 'Bank-grade encryption protects every transaction. Your data stays in our vault.',
    stat: '≥99%',
    statLabel: 'Avg Purity',
  },
];

export default function TrustSection() {
  return (
    <section className="py-28 md:py-36 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 63px, rgba(90,130,255,0.5) 63px, rgba(90,130,255,0.5) 64px)',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mb-16"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-primary" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">
              Our Standard
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl xl:text-5xl font-bold tracking-[-0.03em]">
            Research Without
            <br />
            Compromise
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative p-6 rounded-2xl border border-border bg-card hover:border-white/[0.15] hover:bg-card/80 transition-all duration-300 flex flex-col gap-5"
            >
              {/* Icon */}
              <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>

              {/* Stat */}
              <div>
                <p className="text-3xl font-bold tracking-tight text-foreground">{feature.stat}</p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mt-1">{feature.statLabel}</p>
              </div>

              <div className="h-px bg-border w-full" />

              {/* Text */}
              <div>
                <h3 className="font-semibold text-sm tracking-tight text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom wide stat bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-4 rounded-2xl border border-border bg-card p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <OmenLogo size={36} className="text-primary" />
            <div>
              <p className="font-semibold text-foreground">Omen Labs Quality Promise</p>
              <p className="text-sm text-muted-foreground mt-0.5">Every single compound is verified before it reaches you.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-primary/30 bg-primary/[0.06]">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-primary">Live Inventory Active</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}