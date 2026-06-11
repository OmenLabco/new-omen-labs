import { motion } from 'framer-motion';
import { ShieldCheck, FlaskConical, Truck, Award } from 'lucide-react';

const pillars = [
  {
    icon: ShieldCheck,
    title: 'Uncompromising Purity',
    description: 'Every compound is held to a minimum ≥98% purity standard, with most batches exceeding 99.5%. No exceptions.',
  },
  {
    icon: FlaskConical,
    title: 'Independent Verified',
    description: 'Every batch undergoes third-party HPLC analysis. Certificates of Analysis are available for every product.',
  },
  {
    icon: Truck,
    title: 'Cold Chain Shipping',
    description: 'Orders ship with cold packs and insulated packaging to maintain compound integrity from facility to door.',
  },
  {
    icon: Award,
    title: 'Research-First',
    description: 'Formulated exclusively for research applications. We follow strict synthesis and QC protocols on every run.',
  },
];

export default function WhyOmenLabs() {
  return (
    <section className="py-28 md:py-36 relative band-blue overflow-hidden">
      {/* Accent gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 20% 50%, rgba(60, 100, 255, 0.05) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-8 bg-primary" />
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">
                Why Choose Us
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl xl:text-5xl font-bold tracking-[-0.03em] leading-tight">
              Built for
              <br />
              Researchers
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed max-w-md">
              We built Omen Labs around one principle: researchers deserve compounds they can trust completely. Our entire operation is designed around that promise.
            </p>

            {/* Testimonial-style quote */}
            <div className="mt-10 pl-5 border-l-2 border-primary/30">
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                "Every order comes with a full Certificate of Analysis. We believe in total transparency — if we can't verify it, we don't sell it."
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-primary">
                — Omen Labs Quality Team
              </p>
            </div>
          </motion.div>

          {/* Right grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pillars.map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="card-lift glass-card rounded-2xl border border-primary/10 p-5"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <Icon className="h-4.5 w-4.5 text-primary" style={{ width: 18, height: 18 }} />
                  </div>
                  <h3 className="font-semibold text-sm tracking-tight text-foreground mb-2">{pillar.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{pillar.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}