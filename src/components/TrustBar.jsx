import { FlaskConical, FileCheck, Snowflake, Lock } from 'lucide-react';

const ITEMS = [
  { icon: FileCheck, label: 'Third-Party COA', sub: 'every batch' },
  { icon: FlaskConical, label: '≥98% Purity', sub: 'HPLC verified' },
  { icon: Snowflake, label: 'Cold-Chain Ship', sub: '24hr dispatch' },
  { icon: Lock, label: 'Secure Checkout', sub: 'encrypted' },
];

export default function TrustBar() {
  return (
    <section className="border-y border-primary/10 band-blue">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        {ITEMS.map((it) => (
          <div key={it.label} className="flex items-center gap-3 justify-center md:justify-start">
            <div className="h-9 w-9 rounded-lg bg-white border border-primary/15 shadow-sm flex items-center justify-center shrink-0">
              <it.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-foreground leading-tight">{it.label}</p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">{it.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
