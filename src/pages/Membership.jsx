import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Crown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TIERS = [
  {
    name: 'Bronze',
    spend: 'Free — start here',
    perks: ['1× points (1 pt per $1)', 'Redeem points for discounts', 'Order tracking & history'],
  },
  {
    name: 'Silver',
    spend: '$250 lifetime spend',
    perks: ['1.25× points on every order', 'Everything in Bronze', 'Priority support'],
  },
  {
    name: 'Gold',
    spend: '$1,000 lifetime spend',
    perks: ['1.5× points on every order', 'Free shipping on all orders', 'Everything in Silver'],
    highlight: true,
  },
];

export default function Membership() {
  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <div className="flex items-center gap-2 mb-3 justify-center">
            <div className="h-px w-6 bg-primary" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Membership</span>
            <div className="h-px w-6 bg-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Rewards that grow with you</h1>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Every order earns points and moves you up the tiers — automatically. The more you research, the more you save.
          </p>
          <Button asChild className="mt-8 h-12 px-8"><Link to="/account">Join free — create your account</Link></Button>
        </motion.div>

        {/* Free tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {TIERS.map((t) => (
            <div key={t.name} className={`rounded-2xl border p-7 ${t.highlight ? 'border-primary/40 bg-primary/[0.04]' : 'border-border bg-card'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Star className={`h-4 w-4 ${t.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                <h3 className="text-xl font-bold">{t.name}</h3>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-5">{t.spend}</p>
              <ul className="space-y-3">
                {t.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Paid VIP — coming soon */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-8 relative overflow-hidden">
          <span className="absolute top-5 right-5 font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500">Coming Soon</span>
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-6 w-6 text-amber-500" />
            <h2 className="text-2xl font-bold">Omen VIP</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl mb-6 leading-relaxed">
            A paid membership for serious researchers — unlock member pricing, free expedited shipping, and double points
            on every order. Launching once our secure checkout is live.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {['Member pricing on all compounds', 'Free 2-day shipping', '2× points on every order'].map((p) => (
              <div key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" /> {p}
              </div>
            ))}
          </div>
          <Button disabled variant="outline" className="opacity-60 cursor-not-allowed">Available soon</Button>
        </div>

        <p className="mt-12 font-mono text-[10px] text-muted-foreground text-center uppercase tracking-wider">
          For Research Use Only — Not for Human Consumption
        </p>
      </div>
    </div>
  );
}
