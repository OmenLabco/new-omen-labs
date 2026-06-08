import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Check, Copy, DollarSign, Package, TrendingUp, LogOut,
  UserPlus, Share2, Wallet, Tag, BarChart3, Zap, Megaphone, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { affiliateAuth, affiliateSignup, affiliateLogin, affiliateStats } from '@/lib/affiliateApi';

function Field({ label, ...props }) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

function AuthForms({ onAuthed }) {
  const [mode, setMode] = useState('signup');
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') await affiliateSignup(form);
      else await affiliateLogin(form);
      onAuthed();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="flex rounded-xl border border-border p-1 mb-6">
        {['signup', 'login'].map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(''); }}
            className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          >
            {m === 'signup' ? 'Sign Up' : 'Log In'}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4 p-6 rounded-2xl border border-border bg-card">
        {mode === 'signup' && <Field label="Full Name" required value={form.name || ''} onChange={set('name')} />}
        <Field label="Email" type="email" required value={form.email || ''} onChange={set('email')} />
        {mode === 'signup' && <Field label="Choose Your Code" required value={form.code || ''} onChange={set('code')} placeholder="e.g. JACOB" />}
        <Field label="Password" type="password" required value={form.password || ''} onChange={set('password')} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full h-11">
          {busy ? 'Please wait…' : mode === 'signup' ? 'Create Affiliate Account' : 'Log In'}
        </Button>
      </form>
    </div>
  );
}

const STEPS = [
  { icon: UserPlus, title: 'Sign up free', desc: 'Create your account in seconds and choose your own custom discount code.' },
  { icon: Share2, title: 'Share your code', desc: 'Promote your code and share link with your audience, friends, or community.' },
  { icon: Wallet, title: 'Get paid', desc: 'Earn commission on every order placed with your code — tracked in real time.' },
];

const PERKS = [
  { icon: TrendingUp, title: 'Up to 17% commission', desc: 'Tiered rewards that grow as you sell more.' },
  { icon: Tag, title: '20% off for your audience', desc: 'New customers save 20% on their first order (10% after).' },
  { icon: BarChart3, title: 'Real-time dashboard', desc: 'Track clicks, orders, and earnings live.' },
  { icon: Zap, title: 'Custom code', desc: 'Pick your own memorable, on-brand code.' },
  { icon: DollarSign, title: 'No cost to join', desc: 'Free to sign up — start earning right away.' },
  { icon: Megaphone, title: 'Marketing-ready', desc: 'Share links auto-apply your code at checkout.' },
];

const TIERS = [
  { name: 'Silver', rate: '5%', req: 'Start here', highlight: false },
  { name: 'Gold', rate: '10%', req: '10+ sales', highlight: true },
  { name: 'Platinum', rate: '17%', req: '30+ sales', highlight: false },
];

const FAQS = [
  { q: 'How much does it cost to join?', a: 'Nothing — the affiliate program is completely free to join.' },
  { q: 'How do I earn commission?', a: 'Every time someone orders using your code, you earn a percentage of that order. Your rate increases as you reach higher tiers.' },
  { q: 'What do my customers get?', a: 'New customers get 20% off their first order, and 10% off afterward — a great incentive to use your code.' },
  { q: 'How do tiers work?', a: 'You start at Silver (5%). After 10 sales you reach Gold (10%), and after 30 sales you reach Platinum (17%).' },
  { q: 'How do I track my earnings?', a: 'Your dashboard shows your code, total orders, sales, commission earned, and your current tier in real time.' },
  { q: 'How do I get paid?', a: 'Reach out to support@omenlabs.co to arrange payouts of your earned commission.' },
];

function Landing({ onAuthed }) {
  const scrollToJoin = () => document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' });
  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-3 justify-center">
          <div className="h-px w-6 bg-primary" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Affiliate Program</span>
          <div className="h-px w-6 bg-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">Earn up to 17% on every sale</h1>
        <p className="text-base text-muted-foreground leading-relaxed mb-8">
          Partner with Omen Labs. Share your custom code, give your audience 20% off their first order, and earn growing
          commission on every purchase.
        </p>
        <Button onClick={scrollToJoin} className="h-12 px-8 text-sm font-medium tracking-wide">Become an Affiliate</Button>
      </div>

      {/* Stats band */}
      <div className="grid grid-cols-3 gap-4 mt-16 mb-20">
        {[
          { v: '17%', l: 'Top commission' },
          { v: '20%', l: 'Off for new customers' },
          { v: '$0', l: 'Cost to join' },
        ].map((s) => (
          <div key={s.l} className="text-center p-5 rounded-2xl border border-border bg-card">
            <p className="text-3xl md:text-4xl font-bold text-primary">{s.v}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.l}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="mb-20">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-10">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.title} className="p-6 rounded-2xl border border-border bg-card relative">
              <span className="absolute top-5 right-5 font-mono text-3xl font-bold text-white/[0.06]">{i + 1}</span>
              <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1.5">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Perks */}
      <div className="mb-20">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-10">Why partner with us</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERKS.map((p) => (
            <div key={p.title} className="p-5 rounded-2xl border border-border bg-card">
              <p.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-medium mb-1">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tiers */}
      <div className="mb-20">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-3">Commission tiers</h2>
        <p className="text-sm text-muted-foreground text-center mb-10">The more you sell, the more you earn.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TIERS.map((t) => (
            <div key={t.name} className={`p-6 rounded-2xl border text-center ${t.highlight ? 'border-primary/40 bg-primary/[0.04]' : 'border-border bg-card'}`}>
              <p className="font-mono text-[11px] uppercase tracking-widest text-primary mb-2">{t.name}</p>
              <p className="text-4xl font-bold mb-2">{t.rate}</p>
              <p className="text-xs text-muted-foreground">{t.req}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Who it's for */}
      <div className="mb-20 p-8 rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-3 mb-5">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Who it's for</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <p>Content creators &amp; influencers in the research and performance space.</p>
          <p>Researchers and community leaders with an engaged audience.</p>
          <p>Anyone who wants to earn by sharing products they believe in.</p>
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-20 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-10">Frequently asked questions</h2>
        <div className="space-y-5">
          {FAQS.map((f) => (
            <div key={f.q} className="border-b border-border pb-5">
              <h3 className="font-medium mb-2">{f.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Join form */}
      <div id="join" className="scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-2">Join the program</h2>
        <p className="text-sm text-muted-foreground text-center mb-8">Create your account or log in to your dashboard.</p>
        <AuthForms onAuthed={onAuthed} />
      </div>
    </div>
  );
}

function Dashboard({ onLogout }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    affiliateStats()
      .then(setData)
      .catch((e) => (e.message === 'unauthorized' ? onLogout() : setError(e.message)));
  }, []);

  if (error) return <p className="text-center text-destructive">{error}</p>;
  if (!data) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" /></div>;

  const { affiliate, stats, recent, tier, nextTier } = data;
  const link = `https://omenlabs.co/?ref=${affiliate.code}`;
  const copy = () => { navigator.clipboard.writeText(affiliate.code); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Affiliate Dashboard</span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Welcome, {affiliate.name}</h1>
        </div>
        <Button variant="outline" onClick={onLogout} className="gap-2 h-9"><LogOut className="h-4 w-4" /> Sign out</Button>
      </div>

      <div className="p-6 rounded-2xl border border-primary/20 bg-primary/[0.03] mb-6">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Your Code</p>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold font-mono">{affiliate.code}</span>
          <button onClick={copy} className="p-2 rounded-lg border border-border hover:bg-accent transition-colors">
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Share link: <span className="text-foreground">{link}</span></p>
      </div>

      {tier && (
        <div className="p-5 rounded-2xl border border-border bg-card mb-6 flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Commission Tier</p>
            <p className="text-xl font-bold">{tier.name} — {tier.rate}%</p>
          </div>
          {nextTier && (
            <p className="text-xs text-muted-foreground text-right max-w-[45%]">
              {nextTier.salesNeeded} more sale{nextTier.salesNeeded === 1 ? '' : 's'} to reach <span className="text-foreground font-medium">{nextTier.name}</span>
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Package, label: 'Orders', value: stats.orders },
          { icon: TrendingUp, label: 'Total Sales', value: `$${stats.totalSales.toFixed(2)}` },
          { icon: DollarSign, label: 'Commission Earned', value: `$${stats.totalCommission.toFixed(2)}` },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-2xl border border-border bg-card">
            <s.icon className="h-5 w-5 text-primary mb-3" />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Recent Orders</h2>
      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No orders yet — share your code to start earning.</p>
      ) : (
        <div className="space-y-2">
          {recent.map((o) => (
            <div key={o.order_number} className="flex items-center justify-between p-4 rounded-xl border border-border">
              <div>
                <p className="font-mono text-sm font-semibold">{o.order_number}</p>
                <p className="text-xs text-muted-foreground">{o.created_date ? new Date(o.created_date).toLocaleDateString() : ''} · {o.status}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-emerald-500">+${Number(o.commission || 0).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">order ${Number(o.total || 0).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Affiliates() {
  const [authed, setAuthed] = useState(!!affiliateAuth.get());
  return (
    <div className="min-h-screen py-20 px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {authed ? (
          <Dashboard onLogout={() => { affiliateAuth.clear(); setAuthed(false); }} />
        ) : (
          <Landing onAuthed={() => setAuthed(true)} />
        )}
      </motion.div>
    </div>
  );
}
