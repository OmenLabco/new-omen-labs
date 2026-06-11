import { motion } from 'framer-motion';
import { ClipboardList, FlaskConical, Snowflake, PackageCheck } from 'lucide-react';

const STEPS = [
  { icon: ClipboardList, title: 'Place Your Order', desc: 'Pick your compounds — multi-vial discounts apply automatically.' },
  { icon: FlaskConical, title: 'Batch Verified', desc: 'Your order is pulled from an HPLC-tested batch with its COA on file.' },
  { icon: Snowflake, title: 'Cold-Chain Packed', desc: 'Insulated, temperature-controlled packaging protects integrity.' },
  { icon: PackageCheck, title: 'Tracked Delivery', desc: 'Shipped within 24hrs with live tracking to your door.' },
];

export default function ProcessStrip() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="flex items-center gap-2 mb-4 justify-center">
            <div className="h-px w-8 bg-primary" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">From Lab To Door</span>
            <div className="h-px w-8 bg-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em]">How it works</h2>
        </motion.div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* connecting line (desktop) */}
          <svg className="hidden lg:block absolute top-[44px] left-[12%] w-[76%] h-2 pointer-events-none" aria-hidden="true">
            <line x1="0" y1="4" x2="100%" y2="4" stroke="rgba(90,130,255,0.35)" strokeWidth="2" className="flow-line" />
          </svg>

          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="card-lift relative rounded-2xl border border-border bg-card p-6 text-center"
            >
              <div className="relative mx-auto mb-5 h-[60px] w-[60px] rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center">
                <s.icon className="h-6 w-6 text-primary" />
                <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center shadow-lg shadow-primary/30">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-semibold text-[15px] tracking-tight mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
