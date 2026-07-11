import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, FileCheck, Search, ExternalLink, FlaskConical, BadgeCheck } from 'lucide-react';
import { PRODUCTS } from '@/data/products';

const JANOSHIK_VERIFY = 'https://www.janoshik.com/verify';

// Products that have at least one COA, with the distinct COA files (deduped)
// and which doses each covers.
const TESTED = PRODUCTS
  .filter((p) => p.variants.some((v) => v.coa))
  .map((p) => {
    const byFile = new Map();
    for (const v of p.variants) {
      if (!v.coa) continue;
      if (!byFile.has(v.coa)) byFile.set(v.coa, []);
      byFile.get(v.coa).push(v.dose);
    }
    return { name: p.name, slug: p.slug, purity: p.purity, coas: [...byFile.entries()].map(([file, doses]) => ({ file, doses })) };
  });

export default function Verify() {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? TESTED.filter((t) => t.name.toLowerCase().includes(s)) : TESTED;
  }, [q]);

  return (
    <div className="min-h-screen py-20 pt-24 sm:pt-28 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-600">Third-Party Verified</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-[-0.03em] mb-4">Lab Results & COA Verification</h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Every compound is independently HPLC-tested by <span className="text-foreground font-medium">Janoshik Analytical</span> — one of the industry's most trusted third-party labs. Pull any product's Certificate of Analysis below, then verify it yourself directly on Janoshik.
          </p>
        </motion.div>

        {/* Trust points */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
          {[
            { icon: FlaskConical, title: 'Independent HPLC testing', desc: 'Analyzed by Janoshik — not us.' },
            { icon: BadgeCheck, title: '≥ 99% purity', desc: 'Verified on every batch we stock.' },
            { icon: FileCheck, title: 'Publicly verifiable', desc: 'Each COA carries a unique key you can check.' },
          ].map((t) => (
            <div key={t.title} className="p-5 rounded-2xl border border-border bg-card">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3"><t.icon className="h-4 w-4" /></div>
              <p className="font-semibold text-sm">{t.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a compound…"
            className="w-full h-12 pl-11 pr-4 rounded-full border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        {/* Tested products */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-14">
          {list.map((t) => (
            <div key={t.slug} className="p-5 rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between gap-3 mb-3">
                <Link to={`/product/${t.slug}`} className="font-bold hover:text-primary transition-colors">{t.name}</Link>
                {t.purity != null && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                    <BadgeCheck className="h-3 w-3" /> {t.purity}% HPLC
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {t.coas.map((coa) => (
                  <a key={coa.file} href={coa.file} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/40 transition-colors group">
                    <span className="inline-flex items-center gap-2 text-sm">
                      <FileCheck className="h-4 w-4 text-primary" />
                      COA — {coa.doses.join(' · ')}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                  </a>
                ))}
              </div>
            </div>
          ))}
          {list.length === 0 && <p className="text-sm text-muted-foreground text-center py-10 col-span-full">No compound matches “{q}”.</p>}
        </div>

        {/* Verify independently */}
        <div className="rounded-3xl border border-primary/20 p-7 sm:p-9 text-center" style={{ background: 'radial-gradient(120% 120% at 50% 0%, rgba(43,107,255,0.06), transparent 70%)' }}>
          <ShieldCheck className="h-9 w-9 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold tracking-tight mb-2">Don't take our word for it</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed mb-6">
            Every certificate above lists a <span className="text-foreground font-medium">unique verification key</span> and can be checked directly on Janoshik's site — so you know the report is genuine and unaltered. Open a COA, then enter its key at Janoshik.
          </p>
          <a href={JANOSHIK_VERIFY} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
            Verify on Janoshik <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <p className="mt-10 font-mono text-[10px] text-muted-foreground text-center uppercase tracking-wider">
          For Research Use Only — Not for Human Consumption
        </p>
      </div>
    </div>
  );
}
