import { motion } from 'framer-motion';
import { Star, BadgeCheck } from 'lucide-react';

// NOTE: placeholder researcher feedback — swap with real customer reviews as they come in.
const REVIEWS = [
  {
    initials: 'J.M.',
    role: 'Independent Researcher',
    text: 'COA matched the HPLC numbers exactly. Vials arrived cold-packed and the reconstitution was clean. This is how it should be done.',
  },
  {
    initials: 'D.K.',
    role: 'Lab Coordinator',
    text: 'Ordering was painless and the batch documentation is the most thorough I’ve seen from any peptide supplier at this price point.',
  },
  {
    initials: 'S.R.',
    role: 'Research Associate',
    text: 'Shipped next day with tracking, labels are professional, and support actually answers. Omen is now our default source.',
  },
];

export default function Testimonials() {
  return (
    <section className="ink-sec py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 hex-grid opacity-40 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12"
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-8 bg-primary" />
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Researcher Feedback</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em]">Trusted at the bench</h2>
          </div>
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
            ))}
            <span className="text-sm text-muted-foreground ml-1">Early researcher reviews</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {REVIEWS.map((r, i) => (
            <motion.div
              key={r.initials}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="card-lift glass-card rounded-2xl border border-primary/10 p-6 flex flex-col gap-4"
            >
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed flex-1">“{r.text}”</p>
              <div className="flex items-center gap-3 pt-2 border-t border-primary/10">
                <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center font-mono text-[11px] font-semibold text-primary">
                  {r.initials}
                </div>
                <div>
                  <p className="text-[13px] font-semibold flex items-center gap-1.5">
                    Verified Buyer <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{r.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
