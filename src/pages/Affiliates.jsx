import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Check, Copy, DollarSign, Package, TrendingUp, LogOut,
  UserPlus, Share2, Wallet, Tag, BarChart3, Zap, Megaphone, Users, Lock, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { affiliateAuth, affiliateStats, affiliateRequestPayout } from '@/lib/affiliateApi';
import { customerAuth, customerMe, customerSignup, customerLogin, customerEnrollAffiliate } from '@/lib/customerApi';

const RESEARCH_FIELDS = ['Pharmacology', 'Molecular Biology', 'Medicinal Chemistry', 'Biochemistry', 'Cell Biology', 'Biotechnology', 'Endocrinology', 'Academic / University Research', 'Institutional / Laboratory Research', 'Other Research Use'];

// Placeholder hints per payout method
const HANDLE_HINT = {
  cashapp: '$YourCashtag',
  paypal: 'PayPal email',
  zelle: 'Zelle email or phone',
  crypto: 'USDT wallet address (Solana)',
};

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Open a clean, print-friendly receipt in a new window and trigger print
// (the browser's "Save as PDF" produces the downloadable file). No dependencies.
function openReceipt({ receiptNo, amount, methodLabel, handle, paidDate, code, name }) {
  const when = paidDate ? new Date(paidDate).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' }) : '';
  const row = (k, v, mono) => `<tr><td class="k">${esc(k)}</td><td class="v"${mono ? ' style="font-family:ui-monospace,Menlo,monospace"' : ''}>${esc(v)}</td></tr>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${esc(receiptNo)}</title>
<style>
  *{box-sizing:border-box} body{margin:0;background:#f4f5f8;color:#0a0a0b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .wrap{max-width:520px;margin:40px auto;background:#fff;border:1px solid #e4e6ee;border-radius:16px;overflow:hidden}
  .hd{padding:28px 32px;border-bottom:1px solid #eceef4;display:flex;justify-content:space-between;align-items:center}
  .brand{font-weight:800;letter-spacing:3px;font-size:14px}
  .brand span{-webkit-text-stroke:1px #0a0a0b;color:transparent}
  .paid{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#0f9d58;background:#e7f6ee;border:1px solid #bfe6cf;padding:5px 12px;border-radius:999px}
  .body{padding:28px 32px}
  .ttl{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8b90a0;margin:0 0 6px}
  .amt{font-size:40px;font-weight:800;margin:0 0 22px;letter-spacing:-1px}
  table{width:100%;border-collapse:collapse}
  td{padding:12px 0;border-bottom:1px solid #eff1f6;font-size:14px;vertical-align:top}
  td.k{color:#8b90a0} td.v{text-align:right;font-weight:600}
  tr:last-child td{border-bottom:0}
  .ft{padding:20px 32px 28px;color:#9aa0ae;font-size:12px;line-height:1.6;border-top:1px solid #eceef4}
  @media print{body{background:#fff}.wrap{border:0;margin:0;max-width:none}.noprint{display:none}}
  .noprint{text-align:center;margin:18px 0 40px}
  .btn{font:inherit;font-weight:600;padding:10px 22px;border-radius:10px;border:0;background:#2b6bff;color:#fff;cursor:pointer}
</style></head><body>
  <div class="wrap">
    <div class="hd"><div class="brand">OMEN <span>LABS</span></div><div class="paid">Paid</div></div>
    <div class="body">
      <p class="ttl">Affiliate Payout Receipt</p>
      <p class="amt">$${Number(amount).toFixed(2)}</p>
      <table>
        ${row('Method', methodLabel)}
        ${row('Sent to', handle, true)}
        ${row('Date & time', when)}
        ${row('Receipt #', receiptNo, true)}
        ${row('Affiliate code', code, true)}
        ${name ? row('Affiliate', name) : ''}
      </table>
    </div>
    <div class="ft">This confirms an affiliate commission payout from Omen Labs · omenlabs.co. Keep for your records. Questions? support@omenlabs.co</div>
  </div>
  <div class="noprint"><button class="btn" onclick="window.print()">Print / Save as PDF</button></div>
  <script>window.onload=function(){setTimeout(function(){window.focus();window.print();},250);};<\/script>
</body></html>`;
  const w = window.open('', '_blank');
  if (!w) { alert('Please allow pop-ups to download your receipt.'); return; }
  w.document.write(html);
  w.document.close();
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>
      <input {...props} className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-70" />
    </div>
  );
}

// Enroll panel for a logged-in customer — email is locked to the website account.
function EnrollPanel({ email, onEnrolled }) {
  const [code, setCode] = useState('');
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await customerEnrollAffiliate(code, marketing); onEnrolled(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-2 justify-center">
        <div className="h-px w-6 bg-primary" /><span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Affiliate Program</span><div className="h-px w-6 bg-primary" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-center mb-3">Activate your affiliate code</h1>
      <p className="text-sm text-muted-foreground text-center mb-8 leading-relaxed">
        You're signed in — just pick your code to start earning. New customers you refer get 20% off, you earn up to 17%.
      </p>
      <form onSubmit={submit} className="space-y-4 p-6 rounded-2xl border border-border bg-card">
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Account Email</label>
          <div className="relative">
            <input value={email} disabled readOnly
              className="w-full h-11 px-3 pr-9 rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground" />
            <Lock className="h-3.5 w-3.5 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Locked to your website account — one login for both.</p>
        </div>
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Choose Your Code</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} required placeholder="e.g. JACOB10"
            className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="h-4 w-4 mt-0.5 accent-primary" />
          <span className="text-sm text-muted-foreground leading-snug">Sign me up for email promotions, events, product drops &amp; affiliate updates.</span>
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full h-11">{busy ? 'Activating…' : 'Activate Affiliate Code'}</Button>
      </form>
    </div>
  );
}

// Website-account auth (same login as the rest of the site). Signup or log in.
function CustomerAuthForms({ onAuthed }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({});
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const payload = { ...form, remember };
      mode === 'signup' ? await customerSignup(payload) : await customerLogin(payload);
      onAuthed();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <p className="text-sm text-muted-foreground text-center mb-6">Sign in with your Omen Labs account — the same login you use to shop. No separate affiliate password.</p>
      <div className="flex rounded-xl border border-border p-1 mb-6">
        {['login', 'signup'].map((m) => (
          <button key={m} onClick={() => { setMode(m); setError(''); }}
            className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
            {m === 'signup' ? 'Create Account' : 'Log In'}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4 p-6 rounded-2xl border border-border bg-card">
        {mode === 'signup' && <Field label="Full Name" required value={form.name || ''} onChange={set('name')} />}
        {mode === 'signup' && (
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Research Field</label>
            <select required value={form.research_field || ''} onChange={set('research_field')}
              className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="" disabled>Select your research field…</option>
              {RESEARCH_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        )}
        <Field label="Email" type="email" required value={form.email || ''} onChange={set('email')} />
        <Field label="Password" type="password" required value={form.password || ''} onChange={set('password')} />
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-primary" />
          <span className="text-sm text-muted-foreground">Remember me</span>
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full h-11">
          {busy ? 'Please wait…' : mode === 'signup' ? 'Create Account & Continue' : 'Log In'}
        </Button>
      </form>
    </div>
  );
}

const STEPS = [
  { icon: UserPlus, title: 'Sign up free', desc: 'Use your Omen Labs account and choose your own custom discount code.' },
  { icon: Share2, title: 'Share your code', desc: 'Promote your code and share link with your audience, friends, or community.' },
  { icon: Wallet, title: 'Get paid', desc: 'Request a payout to CashApp, PayPal, Zelle, or crypto right from your dashboard.' },
];

const PERKS = [
  { icon: TrendingUp, title: 'Up to 17% commission', desc: 'Tiered rewards that grow as you sell more.' },
  { icon: Tag, title: '20% off for your audience', desc: 'New customers save 20% on their first order (10% after).' },
  { icon: BarChart3, title: 'Real-time dashboard', desc: 'Track clicks, orders, and earnings live.' },
  { icon: Zap, title: 'Custom code', desc: 'Pick your own memorable, on-brand code.' },
  { icon: DollarSign, title: 'Flexible payouts', desc: 'Cash out via CashApp, PayPal, Zelle, or USDT (Solana).' },
  { icon: Megaphone, title: 'Marketing-ready', desc: 'Share links auto-apply your code at checkout.' },
];

const TIERS = [
  { name: 'Silver', rate: '5%', req: 'Start here', highlight: false },
  { name: 'Gold', rate: '10%', req: '10+ sales', highlight: true },
  { name: 'Platinum', rate: '17%', req: '30+ sales', highlight: false },
];

const FAQS = [
  { q: 'How much does it cost to join?', a: 'Nothing — the affiliate program is completely free to join.' },
  { q: 'Do I need a separate affiliate account?', a: 'No. Your affiliate program uses the same login as your Omen Labs website account — one email, one password for both.' },
  { q: 'How do I earn commission?', a: 'Every time someone orders using your code, you earn a percentage of that order. Your rate increases as you reach higher tiers.' },
  { q: 'What do my customers get?', a: 'New customers get 20% off their first order, and 10% off afterward — a great incentive to use your code.' },
  { q: 'How do tiers work?', a: 'You start at Silver (5%). After 10 sales you reach Gold (10%), and after 30 sales you reach Platinum (17%).' },
  { q: 'How do I get paid?', a: 'From your dashboard, hit “Request payout” and choose CashApp, PayPal, Zelle, or crypto (USDT on Solana). We send your commission to the details you provide.' },
];

function Landing({ onAuthed }) {
  const scrollToJoin = () => document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' });
  return (
    <div className="max-w-5xl mx-auto">
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

      <div className="grid grid-cols-3 gap-4 mt-16 mb-20">
        {[{ v: '17%', l: 'Top commission' }, { v: '20%', l: 'Off for new customers' }, { v: '$0', l: 'Cost to join' }].map((s) => (
          <div key={s.l} className="text-center p-5 rounded-2xl border border-border bg-card">
            <p className="text-3xl md:text-4xl font-bold text-primary">{s.v}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.l}</p>
          </div>
        ))}
      </div>

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

      <div className="mb-20 p-8 rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-3 mb-5">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Who it's for</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <p>Educators &amp; content creators in the research space.</p>
          <p>Researchers and community leaders with an engaged following.</p>
          <p>Anyone who wants to earn by referring fellow researchers.</p>
        </div>
      </div>

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

      <div id="join" className="scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-2">Join the program</h2>
        <CustomerAuthForms onAuthed={onAuthed} />
      </div>
    </div>
  );
}

// Payout card — request a payout of available commission.
function PayoutBox({ payout, affiliate, onDone }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState(payout.method || 'cashapp');
  const [handle, setHandle] = useState(payout.handle || '');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const methods = payout.methods || {};

  const over = amount !== '' && Number(amount) > payout.available;

  const submit = async (e) => {
    e.preventDefault(); setError(''); setOk('');
    if (amount !== '' && (!(Number(amount) > 0))) { setError('Enter a valid amount.'); return; }
    if (over) { setError(`You can withdraw at most $${payout.available.toFixed(2)}.`); return; }
    setBusy(true);
    try {
      const res = await affiliateRequestPayout({ method, handle, amount: amount ? Number(amount) : undefined });
      setOk(`Payout requested: $${Number(res.amount).toFixed(2)} via ${methods[res.method] || res.method}. We'll send it shortly.`);
      setOpen(false); setAmount('');
      onDone();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="p-6 rounded-2xl border border-border bg-card mb-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Available to Withdraw</p>
          <p className="text-3xl font-bold text-emerald-500">${payout.available.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            ${payout.paid.toFixed(2)} paid{payout.pending > 0 ? ` · $${payout.pending.toFixed(2)} pending` : ''}
          </p>
        </div>
        <Button onClick={() => { setOpen((o) => !o); setError(''); setOk(''); }} disabled={payout.available <= 0} className="h-10 gap-2">
          <Wallet className="h-4 w-4" /> {open ? 'Cancel' : 'Request payout'}
        </Button>
      </div>

      {ok && <p className="text-sm text-emerald-500 mt-4">{ok}</p>}

      {open && (
        <form onSubmit={submit} className="mt-5 pt-5 border-t border-border space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Payout Method</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(methods).map(([k, label]) => (
                <button type="button" key={k} onClick={() => setMethod(k)}
                  className={`h-11 rounded-lg border text-xs font-medium px-2 transition-colors ${method === k ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Field label={method === 'crypto' ? 'USDT Wallet (Solana)' : 'Send To'} required value={handle}
            onChange={(e) => setHandle(e.target.value)} placeholder={HANDLE_HINT[method]} />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Amount (optional)</label>
              <button type="button" onClick={() => setAmount(String(payout.available.toFixed(2)))} className="font-mono text-[10px] uppercase tracking-wider text-primary hover:underline">Max ${payout.available.toFixed(2)}</button>
            </div>
            <input type="number" step="0.01" min="0" max={payout.available} value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder={`Full balance · $${payout.available.toFixed(2)}`}
              className={`w-full h-11 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 ${over ? 'border-destructive focus:ring-destructive/30' : 'border-border focus:ring-primary/30'}`} />
            {over && <p className="text-xs text-destructive mt-1.5">Max you can withdraw is ${payout.available.toFixed(2)}.</p>}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy || over} className="w-full h-11">{busy ? 'Requesting…' : `Request $${amount ? Number(amount || 0).toFixed(2) : payout.available.toFixed(2)} payout`}</Button>
        </form>
      )}

      {payout.history?.length > 0 && (
        <div className="mt-5 pt-5 border-t border-border">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Payout receipts</p>
          <div className="space-y-2">
            {payout.history.map((h) => (
              <div key={h.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-border">
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">${Number(h.amount).toFixed(2)}</span>
                    <span className="text-muted-foreground"> · {methods[h.method] || h.method}</span>
                  </p>
                  {h.status === 'paid' ? (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {h.paid_date ? new Date(h.paid_date).toLocaleString() : ''}
                      {h.receipt_no ? <> · <span className="font-mono">{h.receipt_no}</span></> : null}
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground mt-0.5">Requested {h.created_date ? new Date(h.created_date).toLocaleDateString() : ''}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {h.status === 'paid' && h.receipt_no && (
                    <button
                      onClick={() => openReceipt({ receiptNo: h.receipt_no, amount: h.amount, methodLabel: methods[h.method] || h.method, handle: h.handle, paidDate: h.paid_date, code: affiliate.code, name: affiliate.name })}
                      title="Download / print receipt"
                      className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                      <Download className="h-3.5 w-3.5" /> Receipt
                    </button>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${h.status === 'paid' ? 'text-emerald-500 bg-emerald-500/10' : 'text-amber-500 bg-amber-500/10'}`}>
                    {h.status === 'paid' ? 'Paid' : 'Requested'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ onLogout }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const load = () => affiliateStats().then(setData).catch((e) => (e.message === 'unauthorized' ? onLogout() : setError(e.message)));
  useEffect(() => { load(); }, []);

  if (error) return <p className="text-center text-destructive">{error}</p>;
  if (!data) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" /></div>;

  const { affiliate, stats, recent, tier, nextTier, payout } = data;
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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

      {payout && <PayoutBox payout={payout} affiliate={affiliate} onDone={load} />}

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
  // null = loading, false = not logged in, object = customer "me"
  const [cust, setCust] = useState(customerAuth.isLoggedIn() ? null : false);

  const reload = () => customerMe()
    .then((me) => {
      // mirror the customer session into affiliate auth so the dashboard/payout calls work
      affiliateAuth.setRaw(customerAuth.token());
      setCust(me);
    })
    .catch(() => setCust(false));

  useEffect(() => {
    if (!customerAuth.isLoggedIn()) { setCust(false); return; }
    reload();
  }, []);

  const content = () => {
    if (cust === null) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" /></div>;
    if (cust && typeof cust === 'object') {
      if (cust.affiliate?.enrolled) {
        return <Dashboard onLogout={() => { customerAuth.clear(); setCust(false); }} />;
      }
      return <EnrollPanel email={cust.email} onEnrolled={reload} />;
    }
    return <Landing onAuthed={reload} />;
  };

  return (
    <div className="min-h-screen py-20 px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {content()}
      </motion.div>
    </div>
  );
}
