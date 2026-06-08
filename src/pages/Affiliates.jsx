import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, DollarSign, Package, TrendingUp, LogOut } from 'lucide-react';
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
      if (mode === 'signup') {
        await affiliateSignup(form);
      } else {
        await affiliateLogin(form);
      }
      onAuthed();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-2 justify-center">
        <div className="h-px w-6 bg-primary" />
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Affiliate Program</span>
        <div className="h-px w-6 bg-primary" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-center mb-3">Earn up to 17% per sale</h1>
      <p className="text-sm text-muted-foreground text-center mb-5 leading-relaxed">
        Create your own discount code and share it. New customers get <strong className="text-foreground">20% off</strong> their
        first order (10% after), and you earn commission on every sale.
      </p>
      <div className="grid grid-cols-3 gap-2 mb-8 text-center">
        {[
          { t: 'Silver', r: '5%', s: 'Start here' },
          { t: 'Gold', r: '10%', s: '10+ sales' },
          { t: 'Platinum', r: '17%', s: '30+ sales' },
        ].map((x) => (
          <div key={x.t} className="p-3 rounded-xl border border-border">
            <p className="text-xs font-mono uppercase tracking-wider text-primary">{x.t}</p>
            <p className="text-lg font-bold mt-1">{x.r}</p>
            <p className="text-[10px] text-muted-foreground">{x.s}</p>
          </div>
        ))}
      </div>

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
        {mode === 'signup' && (
          <Field label="Choose Your Code" required value={form.code || ''} onChange={set('code')} placeholder="e.g. JACOB10" />
        )}
        <Field label="Password" type="password" required value={form.password || ''} onChange={set('password')} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full h-11">
          {busy ? 'Please wait…' : mode === 'signup' ? 'Create Affiliate Account' : 'Log In'}
        </Button>
      </form>
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
      .catch((e) => {
        if (e.message === 'unauthorized') onLogout();
        else setError(e.message);
      });
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

      {/* Code card */}
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

      {/* Tier card */}
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

      {/* Stats */}
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

      {/* Recent orders */}
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
          <AuthForms onAuthed={() => setAuthed(true)} />
        )}
      </motion.div>
    </div>
  );
}
