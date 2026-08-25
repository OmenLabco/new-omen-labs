import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Award, TrendingUp, LogOut, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { customerAuth, customerSignup, customerLogin, customerMe, customerVerify, customerResendCode } from '@/lib/customerApi';

function Field({ label, ...props }) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>
      <input {...props} className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
    </div>
  );
}

function AuthForms({ onAuthed }) {
  const [mode, setMode] = useState('signup');
  const [form, setForm] = useState({});
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [verifyStep, setVerifyStep] = useState(null); // { email, password }
  const [code, setCode] = useState('');
  const [resent, setResent] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const payload = { ...form, remember };
      if (mode === 'signup') {
        const res = await customerSignup(payload);
        if (res.verify) setVerifyStep({ email: form.email, password: form.password });
        else onAuthed();
      } else {
        const res = await customerLogin(payload);
        if (res.unverified) setVerifyStep({ email: res.email, password: form.password });
        else onAuthed();
      }
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const submitVerify = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await customerVerify({ email: verifyStep.email, code: code.trim(), password: verifyStep.password, remember });
      onAuthed();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const resend = async () => {
    setError('');
    await customerResendCode(verifyStep.email);
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  };

  if (verifyStep) {
    return (
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-2 justify-center">
          <div className="h-px w-6 bg-primary" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Verify Email</span>
          <div className="h-px w-6 bg-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-center mb-3">Enter your code</h1>
        <p className="text-sm text-muted-foreground text-center mb-8 leading-relaxed">
          We emailed a 6-digit security code to <strong className="text-foreground">{verifyStep.email}</strong>. Enter it below to finish signing in.
        </p>
        <form onSubmit={submitVerify} className="space-y-4 p-6 rounded-2xl border border-border bg-card">
          <input
            inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full h-14 px-3 rounded-lg border border-border bg-background text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy || code.length < 6} className="w-full h-11">
            {busy ? 'Verifying…' : 'Verify & Sign In'}
          </Button>
          <div className="flex items-center justify-between text-xs">
            <button type="button" onClick={resend} className="text-primary hover:underline">
              {resent ? 'Code re-sent ✓' : 'Resend code'}
            </button>
            <button type="button" onClick={() => { setVerifyStep(null); setCode(''); setError(''); }} className="text-muted-foreground hover:text-foreground">
              ← Back
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">The code expires in 15 minutes. Check your spam folder if you don't see it.</p>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-2 justify-center">
        <div className="h-px w-6 bg-primary" />
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Omen Rewards</span>
        <div className="h-px w-6 bg-primary" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-center mb-3">Your Account</h1>
      <p className="text-sm text-muted-foreground text-center mb-8 leading-relaxed">
        Create an account to earn <strong className="text-foreground">1 point per $1</strong>, unlock membership tiers, and
        redeem points for discounts.
      </p>

      <div className="flex rounded-xl border border-border p-1 mb-6">
        {['signup', 'login'].map((m) => (
          <button key={m} onClick={() => { setMode(m); setError(''); }}
            className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
            {m === 'signup' ? 'Sign Up' : 'Log In'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4 p-6 rounded-2xl border border-border bg-card">
        {mode === 'signup' && <Field label="Full Name" required value={form.name || ''} onChange={set('name')} />}
        {mode === 'signup' && (
          <label className="block">
            <span className="text-sm font-medium text-foreground">Research Field <span className="text-destructive">*</span></span>
            <select
              required
              value={form.research_field || ''}
              onChange={set('research_field')}
              className="mt-1 w-full h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="" disabled>Select your research field…</option>
              {['Pharmacology', 'Molecular Biology', 'Medicinal Chemistry', 'Biochemistry', 'Cell Biology', 'Biotechnology', 'Endocrinology', 'Academic / University Research', 'Institutional / Laboratory Research', 'Other Research Use'].map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
        )}
        <Field label="Email" type="email" required value={form.email || ''} onChange={set('email')} />
        <Field label="Password" type="password" required value={form.password || ''} onChange={set('password')} />
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-primary" />
          <span className="text-sm text-muted-foreground">Remember me</span>
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full h-11">
          {busy ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Log In'}
        </Button>
      </form>
    </div>
  );
}

function Dashboard({ onLogout }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    customerMe().then(setData).catch((e) => (e.message === 'unauthorized' ? onLogout() : setError(e.message)));
  }, []);

  if (error) return <p className="text-center text-destructive">{error}</p>;
  if (!data) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" /></div>;

  const { name, points, pointsValue, lifetimeSpend, membership, recent } = data;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Omen Rewards</span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Hi, {name}</h1>
        </div>
        <Button variant="outline" onClick={onLogout} className="gap-2 h-9"><LogOut className="h-4 w-4" /> Sign out</Button>
      </div>

      {/* Points hero */}
      <div className="p-6 rounded-2xl border border-primary/20 bg-primary/[0.04] mb-6 flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Points Balance</p>
          <p className="text-4xl font-bold">{points} <span className="text-lg text-muted-foreground font-normal">pts</span></p>
          <p className="text-sm text-emerald-500 mt-1">= ${pointsValue.toFixed(2)} in rewards</p>
        </div>
        <Star className="h-10 w-10 text-primary" />
      </div>

      {/* Tier + spend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="p-5 rounded-2xl border border-border bg-card">
          <Award className="h-5 w-5 text-primary mb-3" />
          <p className="text-2xl font-bold">{membership?.active ? 'Omen VIP' : 'Free account'}</p>
          {membership?.active ? (
            <p className="text-xs text-muted-foreground mt-1">2× points · free shipping</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-3">Upgrade for 2× points + free shipping — <Link to="/membership" className="text-primary">see Omen VIP →</Link></p>
          )}
        </div>
        <div className="p-5 rounded-2xl border border-border bg-card">
          <TrendingUp className="h-5 w-5 text-primary mb-3" />
          <p className="text-2xl font-bold">${lifetimeSpend.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Lifetime spend</p>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card mb-8 flex items-center gap-3">
        <Gift className="h-5 w-5 text-primary shrink-0" />
        <p className="text-sm text-muted-foreground">Redeem points at checkout — <strong className="text-foreground">100 points = $5 off</strong>. Your points apply automatically as an option when you're logged in.</p>
      </div>

      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Order History</h2>
      {(!recent || recent.length === 0) ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No orders yet. <Link to="/catalog" className="text-primary">Start shopping →</Link></p>
      ) : (
        <div className="space-y-2">
          {recent.map((o) => (
            <div key={o.order_number} className="flex items-center justify-between p-4 rounded-xl border border-border">
              <div>
                <p className="font-mono text-sm font-semibold">{o.order_number}</p>
                <p className="text-xs text-muted-foreground">{o.created_date ? new Date(o.created_date).toLocaleDateString() : ''} · {o.status}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">${Number(o.total || 0).toFixed(2)}</p>
                <p className="text-xs text-emerald-500">+{o.points_earned || 0} pts</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Account() {
  const [authed, setAuthed] = useState(customerAuth.isLoggedIn());
  return (
    <div className="min-h-screen py-20 px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {authed
          ? <Dashboard onLogout={() => { customerAuth.clear(); setAuthed(false); }} />
          : <AuthForms onAuthed={() => setAuthed(true)} />}
      </motion.div>
    </div>
  );
}
