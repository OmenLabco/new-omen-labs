import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Crown, Truck, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PERKS = [
  { icon: Truck, title: 'Free shipping', desc: 'Free shipping on every order, every time.' },
  { icon: Star, title: '2× points', desc: 'Earn double rewards points on all purchases.' },
  { icon: Sparkles, title: 'Early access', desc: 'First access to new compounds and restocks.' },
];

export default function Membership() {
  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="flex items-center gap-2 mb-3 justify-center">
            <div className="h-px w-6 bg-primary" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Membership</span>
            <div className="h-px w-6 bg-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Omen VIP</h1>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            A premium membership for serious researchers — free shipping, double points, and early access to everything we drop.
          </p>
        </motion.div>

        {/* Plan card */}
        <div className="rounded-3xl border border-primary/30 bg-primary/[0.04] p-8 md:p-10 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Omen VIP</h2>
          </div>
          <div className="flex items-end gap-1 mb-8">
            <span className="text-5xl font-bold tracking-tight">$14.99</span>
            <span className="text-muted-foreground mb-1.5">/ month</span>
          </div>

          <div className="space-y-4 mb-9">
            {PERKS.map((p) => (
              <div key={p.title} className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <p.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Button disabled className="w-full h-12 opacity-60 cursor-not-allowed">Not available yet</Button>
          <p className="text-center text-xs text-muted-foreground mt-3">Membership opens soon — check back shortly.</p>
        </div>

        {/* Points note */}
        <div className="mt-8 p-5 rounded-2xl border border-border bg-card flex items-start gap-3">
          <Star className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Not a member yet? You still earn <strong className="text-foreground">1 point per $1</strong> on every order with a
            free account. <Link to="/account" className="text-primary">Create one →</Link>
          </p>
        </div>

        <p className="mt-12 font-mono text-[10px] text-muted-foreground text-center uppercase tracking-wider">
          For Research Use Only — Not for Human Consumption
        </p>
      </div>
    </div>
  );
}
