import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import OmenLogo from '../components/OmenLogo';

const faqs = [
  {
    q: 'What purity level do your peptides meet?',
    a: 'All compounds in our catalog meet a minimum purity threshold of ≥98%, verified through independent HPLC analysis. Most of our compounds exceed 99% purity.',
  },
  {
    q: 'Do you provide Certificates of Analysis?',
    a: 'Yes. Every batch produced includes a full Certificate of Analysis (COA) documenting HPLC purity, mass spectrometry identity confirmation, and endotoxin testing results.',
  },
  {
    q: 'How are orders shipped?',
    a: 'All orders are shipped via temperature-controlled cold chain logistics within 24 hours of processing. We use insulated packaging with cold packs to maintain compound integrity.',
  },
  {
    q: 'Are these products intended for human use?',
    a: 'No. All Omen Labs products are sold strictly for in-vitro research and laboratory use only. They are not intended for human or veterinary consumption.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept major credit cards, cryptocurrency, and bank transfers. All transactions are processed through bank-grade encrypted payment systems.',
  },
  {
    q: 'What is your return policy?',
    a: 'Because our products are research materials requiring cold-chain integrity, all sales are final. The exception: if your order arrives damaged, defective, incorrect, or is lost in transit, contact us within 7 days for a replacement or refund. See our Refund Policy for details.',
  },
  {
    q: 'How should peptides be stored?',
    a: 'Lyophilized peptides should be stored at -20°C for long-term storage. Once reconstituted, store at 2-8°C and use within the recommended timeframe noted on each product page.',
  },
];

export default function FAQ() {
  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 hex-grid opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-20 pt-28">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-14"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-primary" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Support</span>
          </div>
          <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold tracking-[-0.04em]">
            Frequently
            <br />Asked Questions
          </h1>
          <p className="mt-6 text-muted-foreground leading-relaxed max-w-lg">
            Find answers to common questions about our compounds, shipping, and laboratory handling.
          </p>
        </motion.div>

        {/* FAQ accordion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-0">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-b border-border"
              >
                <AccordionTrigger className="text-left text-sm font-medium py-5 hover:no-underline hover:text-primary transition-colors">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Contact card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 p-8 rounded-2xl border border-border bg-card flex flex-col sm:flex-row items-center gap-6"
        >
          <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <OmenLogo size={28} className="text-primary" />
          </div>
          <div className="text-center sm:text-left">
            <p className="font-semibold text-sm text-foreground">Still have questions?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Reach our research support team at{' '}
              <span className="text-primary font-medium">support@omenlabs.co</span>
            </p>
            <p className="font-mono text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
              Mon–Fri, 9AM–5PM EST
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}