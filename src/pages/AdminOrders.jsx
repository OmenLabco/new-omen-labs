import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronDown, ChevronUp, Search, Lock, LogOut, Trash2, Eye, EyeOff, Check, Copy, Download, DollarSign, Clock, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OrderEditForm from '@/components/admin/OrderEditForm';
import SalesDashboard from '@/components/admin/SalesDashboard';
import ProfitView from '@/components/admin/ProfitView';
import LiveView from '@/components/admin/LiveView';
import StockView from '@/components/admin/StockView';
import PromosView from '@/components/admin/PromosView';
import NewOrderForm from '@/components/admin/NewOrderForm';
import { adminAuth, adminLogin, fetchOrders, fetchAffiliates, fetchCustomers, setCustomerMembership, deleteCustomer, fetchZelleSetup, runCryptoCheck, deleteOrder, fetchPayouts, markPayout, fetchSubscribers, fetchStock, fetchFunnel } from '@/lib/adminApi';
import { CRYPTO_WALLETS } from '@/data/cryptoWallets';

// Build a CSV and trigger a client-side download.
function downloadCsv(filename, header, rows) {
  const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = [header.join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// At-a-glance Overview cards.
function OverviewWidgets({ orders }) {
  const [stock, setStock] = useState(null);
  const [payouts, setPayouts] = useState([]);
  useEffect(() => {
    fetchStock().then((d) => setStock(d.stock || {})).catch(() => setStock({}));
    fetchPayouts().then(setPayouts).catch(() => {});
  }, []);

  const today = new Date().toDateString();
  const paidToday = orders.filter((o) => o.status !== 'awaiting_payment' && o.created_date && new Date(o.created_date).toDateString() === today);
  const revenueToday = paidToday.reduce((s, o) => s + Number(o.total || 0), 0);
  const awaiting = orders.filter((o) => o.status === 'awaiting_payment').length;
  const lowStock = stock ? Object.values(stock).filter((c) => Number(c) < 9).length : 0;
  const pending = payouts.filter((p) => p.status === 'requested');
  const pendingAmt = pending.reduce((s, p) => s + Number(p.amount || 0), 0);

  const cards = [
    { label: "Today's Revenue", value: `$${revenueToday.toFixed(2)}`, sub: `${paidToday.length} paid order${paidToday.length === 1 ? '' : 's'}`, Icon: DollarSign, tint: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Awaiting Payment', value: awaiting, sub: 'unpaid orders', Icon: Clock, tint: 'text-amber-500 bg-amber-500/10' },
    { label: 'Low / Out of Stock', value: lowStock, sub: 'SKUs under 9', Icon: Package, tint: 'text-rose-500 bg-rose-500/10' },
    { label: 'Payout Requests', value: pending.length, sub: pending.length ? `$${pendingAmt.toFixed(2)} owed` : 'none pending', Icon: Wallet, tint: 'text-primary bg-primary/10' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-border bg-card p-4">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${c.tint}`}><c.Icon className="h-4 w-4" /></div>
          <p className="text-2xl font-bold tabular-nums leading-none">{c.value}</p>
          <p className="text-[11px] text-muted-foreground mt-1.5">{c.label}</p>
          <p className="text-[11px] text-muted-foreground/70">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}

// Checkout funnel — how many sessions reached checkout vs purchased (owner excluded).
const FUNNEL_WINDOWS = [{ key: '24h', label: '24h' }, { key: '7d', label: '7 days' }, { key: '30d', label: '30 days' }, { key: 'all', label: 'All time' }];
function FunnelCard() {
  const [data, setData] = useState(null);
  const [win, setWin] = useState('7d');
  const [err, setErr] = useState('');
  useEffect(() => { fetchFunnel().then(setData).catch((e) => setErr(e.message)); }, []);
  const d = data?.[win] || { reached: 0, converted: 0, abandoned: 0, conversionRate: 0, lostValue: 0 };
  return (
    <div className="rounded-2xl border border-border bg-card p-5 mb-6">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold">Checkout funnel</p>
          <p className="text-[11px] text-muted-foreground">Reached checkout vs. purchased · you're excluded</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          {FUNNEL_WINDOWS.map((w) => (
            <button key={w.key} onClick={() => setWin(w.key)}
              className={`px-2.5 h-7 rounded-md text-[11px] font-medium transition-colors ${win === w.key ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
              {w.label}
            </button>
          ))}
        </div>
      </div>
      {err ? <p className="text-xs text-destructive">{err}</p> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border p-3.5">
              <p className="text-2xl font-bold tabular-nums leading-none">{d.reached}</p>
              <p className="text-[11px] text-muted-foreground mt-1.5">Reached checkout</p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3.5">
              <p className="text-2xl font-bold tabular-nums leading-none text-emerald-600">{d.converted}</p>
              <p className="text-[11px] text-muted-foreground mt-1.5">Purchased</p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3.5">
              <p className="text-2xl font-bold tabular-nums leading-none text-amber-600">{d.abandoned}</p>
              <p className="text-[11px] text-muted-foreground mt-1.5">Left without buying</p>
            </div>
            <div className="rounded-xl border border-border p-3.5">
              <p className="text-2xl font-bold tabular-nums leading-none">{d.conversionRate}%</p>
              <p className="text-[11px] text-muted-foreground mt-1.5">Conversion rate</p>
            </div>
          </div>
          {d.lostValue > 0 && (
            <p className="text-[11px] text-muted-foreground mt-3">
              ~<span className="font-semibold text-foreground">${d.lostValue.toFixed(2)}</span> in carts reached checkout but didn't complete.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function CryptoCheckButton() {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const run = async () => {
    setBusy(true); setErr(''); setRes(null);
    try { setRes(await runCryptoCheck()); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="mb-3 rounded-lg border border-primary/20 bg-primary/[0.04] p-3">
      <button onClick={run} disabled={busy} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">
        {busy ? 'Checking chain…' : 'Run payment check now'}
      </button>
      {err && <p className="text-xs text-destructive mt-2">{err}</p>}
      {res && (
        <div className="mt-2 text-[11px] space-y-1">
          <p className="text-muted-foreground">Solana key: <b className={res.heliusSet ? 'text-emerald-600' : 'text-destructive'}>{res.heliusSet ? 'set' : 'missing'}</b> · Polygon key: <b className={res.polygonscanSet ? 'text-emerald-600' : 'text-muted-foreground'}>{res.polygonscanSet ? 'set' : 'off'}</b></p>
          {res.fetchError && <p className="text-destructive">Fetch error: {res.fetchError}</p>}
          <p className="text-muted-foreground">Incoming payments seen on-chain: <b>{res.incoming?.length || 0}</b></p>
          {(res.incoming || []).slice(0, 8).map((p, i) => (
            <p key={i} className="font-mono text-muted-foreground">· {p.coin} {p.network} ${p.usd ?? '?'} {p.confirmed ? '' : '(unconfirmed)'} · seen:{p.seen} · → {p.matches}</p>
          ))}
          <p className="text-muted-foreground mt-1">Awaiting crypto orders: <b>{res.awaiting?.length || 0}</b></p>
          {(res.awaiting || []).map((o, i) => (
            <p key={i} className="font-mono text-muted-foreground">· {o.order_number} — ${Number(o.total).toFixed(2)}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function CryptoWallets() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-6 rounded-2xl border border-border bg-card overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-accent/40">
        <span className="text-sm font-semibold">Crypto wallet addresses (your reference)</span>
        <span className="text-xs text-muted-foreground">{open ? 'hide' : 'show'}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-2">
          <CryptoCheckButton />
          <p className="text-xs text-muted-foreground mb-2">These are the addresses shown to customers at crypto checkout. Funds land in your Exodus wallet — auto-confirmed by the watcher, or confirm manually.</p>
          {CRYPTO_WALLETS.map((w) => (
            <div key={`${w.coin}-${w.network}`} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">{w.coin} <span className="font-normal text-muted-foreground">· {w.network}</span></span>
                {w.note && <span className="text-[10px] text-muted-foreground">{w.note}</span>}
              </div>
              <p className="font-mono text-[11px] break-all text-muted-foreground select-all">{w.address}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ZelleSetup() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const load = () => {
    if (data) { setOpen((o) => !o); return; }
    fetchZelleSetup().then((d) => { setData(d); setOpen(true); }).catch((e) => setErr(e.message));
  };
  return (
    <div className="mb-6 rounded-2xl border border-border bg-card overflow-hidden">
      <button onClick={load} className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-accent/40">
        <span className="text-sm font-semibold">Zelle automation setup</span>
        <span className="text-xs text-muted-foreground">{open ? 'hide' : 'show secret & steps'}</span>
      </button>
      {err && <p className="px-5 pb-3 text-sm text-destructive">{err}</p>}
      {open && data && (
        <div className="px-5 pb-5 space-y-3 text-sm">
          <p className="text-muted-foreground">Paste these into your iPhone Shortcut (Automation → “Message from Bank of America” → Get Contents of URL):</p>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">POST URL</p>
            <code className="block break-all rounded-lg bg-secondary p-2 text-xs">{data.url}</code>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Header — X-Zelle-Secret</p>
            <code className="block break-all rounded-lg bg-secondary p-2 text-xs">{data.secret}</code>
          </div>
          <p className="text-xs text-muted-foreground">Request body (JSON): <code className="bg-secondary px-1 rounded">{'{ "text": "<the full BoA message text>" }'}</code>. Keep this secret private — anyone with it can mark orders paid.</p>
        </div>
      )}
    </div>
  );
}

const STATUS_COLORS = {
  awaiting_payment: 'text-orange-400 bg-orange-400/10',
  processing: 'text-yellow-400 bg-yellow-400/10',
  confirmed: 'text-blue-400 bg-blue-400/10',
  shipped: 'text-purple-400 bg-purple-400/10',
  out_for_delivery: 'text-orange-400 bg-orange-400/10',
  delivered: 'text-green-400 bg-green-400/10',
  refunded: 'text-rose-400 bg-rose-400/10',
  cancelled: 'text-muted-foreground bg-muted',
};

function LoginScreen({ onSuccess }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(true);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const ok = await adminLogin(pw, remember);
    setBusy(false);
    if (ok) onSuccess();
    else setError('Incorrect password.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border bg-card p-8">
        <div className="flex justify-center mb-5">
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Lock className="h-5 w-5 text-primary" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-center mb-1">Admin Access</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Enter your admin password to continue.</p>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-primary" />
          <span className="text-sm text-muted-foreground">Remember me on this device</span>
        </label>
        <Button type="submit" disabled={busy} className="w-full h-11 mt-5">
          {busy ? 'Checking…' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
}

const Mask = ({ on, children }) => (
  <span className={on ? 'blur-[6px] select-none pointer-events-none' : ''}>{children}</span>
);

// Compact "2h ago" relative time (full timestamp shown on hover via title).
const relTime = (d) => {
  if (!d) return '—';
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return '—';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24); if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
};
// Short payment label ("Crypto" from "Crypto — awaiting payment").
const shortPay = (pm) => { const b = String(pm || '').split('—')[0].trim(); return b || null; };
// Item count + names summary for an order row.
const orderSummary = (items) => {
  const arr = Array.isArray(items) ? items : [];
  const count = arr.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  const names = arr.map((i) => i.product_name || i.name).filter(Boolean).join(', ');
  return { count, names };
};

const PAYOUT_LABELS = { cashapp: 'CashApp', paypal: 'PayPal', zelle: 'Zelle', crypto: 'Crypto · USDT/SOL' };

function AffiliatesView({ onLogout, privacy }) {
  const [affiliates, setAffiliates] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(0);
  const [copied, setCopied] = useState(false);

  const load = () => Promise.all([fetchAffiliates(), fetchPayouts()])
    .then(([a, p]) => { setAffiliates(a); setPayouts(p); })
    .catch((e) => (e.message === 'unauthorized' ? onLogout() : setError(e.message)))
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" /></div>;
  if (error) return <p className="text-destructive text-sm">{error}</p>;
  if (affiliates.length === 0) return <div className="text-center py-16 text-muted-foreground text-sm">No affiliates yet.</div>;

  const tierOf = (n) => (n >= 30 ? 'Platinum' : n >= 10 ? 'Gold' : 'Silver');
  const pending = payouts.filter((p) => p.status === 'requested');
  const paidReceipts = payouts.filter((p) => p.status === 'paid');
  const totalPaid = paidReceipts.reduce((s, p) => s + Number(p.amount || 0), 0);
  const marketingList = affiliates.filter((a) => a.marketing_opt_in);

  const markPaid = async (id) => {
    setBusy(id);
    try { await markPayout(id, 'paid'); await load(); }
    catch (e) { setError(e.message); } finally { setBusy(0); }
  };
  const copyMarketing = () => {
    navigator.clipboard.writeText(marketingList.map((a) => a.email).join(', '));
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Pending payout requests */}
      {pending.length > 0 && (
        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-500 mb-3">Payout requests · {pending.length}</h3>
          <div className="space-y-2">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-sm">{p.code}</span>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">{PAYOUT_LABELS[p.method] || p.method}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    Send to <span className="text-foreground font-medium">{p.handle}</span>{p.name ? ` · ${p.name}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-sm font-semibold text-emerald-500">${Number(p.amount || 0).toFixed(2)}</span>
                  <Button onClick={() => markPaid(p.id)} disabled={busy === p.id} className="h-8 px-3 text-xs gap-1.5">
                    {busy === p.id ? '…' : <><Check className="h-3.5 w-3.5" /> Mark paid</>}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Marketing opt-in list */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Email promotions list</p>
          <p className="text-xs text-muted-foreground mt-0.5">{marketingList.length} affiliate{marketingList.length === 1 ? '' : 's'} opted into promotions, events &amp; updates.</p>
        </div>
        <Button variant="outline" onClick={copyMarketing} disabled={marketingList.length === 0} className="h-8 px-3 text-xs gap-1.5 shrink-0">
          {copied ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy emails</>}
        </Button>
      </div>

      {/* Affiliates */}
      <div className="space-y-2">
        {affiliates.map((a) => (
          <div key={a.code} className="flex items-center justify-between p-4 rounded-2xl border border-border">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-sm">{a.code}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">{tierOf(a.order_count)}</span>
                {a.marketing_opt_in && <span title="Opted into email promotions" className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-500">Promos</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.name} · <Mask on={privacy}>{a.email}</Mask></p>
              {a.owed > 0 && <p className="text-[11px] text-amber-500 mt-0.5">${a.owed.toFixed(2)} owed{a.pending_payout > 0 ? ` · $${a.pending_payout.toFixed(2)} requested` : ''}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono text-sm font-semibold text-emerald-500">${Number(a.total_commission || 0).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{a.order_count} sales · ${Number(a.total_sales || 0).toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Payout receipts log */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Payout receipts · {paidReceipts.length}</h3>
          {paidReceipts.length > 0 && <span className="text-xs text-muted-foreground">${totalPaid.toFixed(2)} paid out</span>}
        </div>
        {paidReceipts.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center border border-border rounded-2xl">No payouts sent yet.</p>
        ) : (
          <div className="space-y-2">
            {paidReceipts.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold">{p.receipt_no || `#${p.id}`}</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{p.code}</span>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{PAYOUT_LABELS[p.method] || p.method}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {p.name ? `${p.name} · ` : ''}{p.paid_date ? new Date(p.paid_date).toLocaleString() : ''} · to <Mask on={privacy}>{p.handle}</Mask>
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold text-emerald-500 shrink-0">${Number(p.amount || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CustomersView({ onLogout, privacy }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    fetchCustomers()
      .then(setCustomers)
      .catch((e) => (e.message === 'unauthorized' ? onLogout() : setError(e.message)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" /></div>;
  if (error) return <p className="text-destructive text-sm">{error}</p>;
  if (customers.length === 0) return <div className="text-center py-16 text-muted-foreground text-sm">No customer accounts yet.</div>;

  const toggleVip = async (email, makeVip) => {
    setBusy(email);
    try {
      await setCustomerMembership(email, makeVip);
      setCustomers((prev) => prev.map((c) => (c.email === email ? { ...c, isVip: makeVip } : c)));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  const removeCustomer = async (email, name) => {
    if (!window.confirm(`Permanently delete ${name || email}? This cannot be undone.`)) return;
    setBusy(email);
    try {
      await deleteCustomer(email);
      setCustomers((prev) => prev.filter((c) => c.email !== email));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{customers.length} customer{customers.length === 1 ? '' : 's'}</span>
        <Button variant="outline" onClick={() => downloadCsv(
          `omen-customers-${new Date().toISOString().slice(0, 10)}.csv`,
          ['Name', 'Email', 'Points', 'Lifetime Spend', 'Orders', 'VIP', 'Joined'],
          customers.map((c) => [c.name, c.email, c.points, c.lifetime_spend, c.order_count, c.isVip ? 'yes' : 'no', c.created_date ? new Date(c.created_date).toLocaleDateString() : ''])
        )} className="h-8 px-3 gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>
      {customers.map((c) => (
        <div key={c.email} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate">{c.name}</span>
              {c.isVip && <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500">VIP</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate"><Mask on={privacy}>{c.email}</Mask></p>
            <p className="text-xs text-muted-foreground mt-0.5">{c.points} pts · {c.order_count} orders · ${Number(c.lifetime_spend || 0).toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant={c.isVip ? 'outline' : 'default'}
              onClick={() => toggleVip(c.email, !c.isVip)}
              disabled={busy === c.email}
              className="h-8 px-3 text-xs"
            >
              {busy === c.email ? '…' : c.isVip ? 'Remove VIP' : 'Make VIP'}
            </Button>
            <button
              onClick={() => removeCustomer(c.email, c.name)}
              disabled={busy === c.email}
              aria-label="Delete customer"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SubscribersCard() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => { fetchSubscribers().then(setSubs).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  const copyAll = () => { navigator.clipboard?.writeText(subs.map((s) => s.email).join(', ')); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const exportCsv = () => {
    const rows = [['email', 'source', 'date'], ...subs.map((s) => [s.email, s.source || '', s.created_at ? new Date(s.created_at).toISOString() : ''])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'omen-subscribers.csv'; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="mt-6 p-6 rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="font-semibold">Email subscribers</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{loading ? 'Loading…' : `${subs.length} sign-up${subs.length === 1 ? '' : 's'} · first-order discount list`}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={copyAll} disabled={!subs.length} className="h-8 px-3 text-xs gap-1.5">{copied ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy emails</>}</Button>
          <Button variant="outline" onClick={exportCsv} disabled={!subs.length} className="h-8 px-3 text-xs gap-1.5"><Download className="h-3.5 w-3.5" /> CSV</Button>
        </div>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : (!subs.length && !loading) ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No sign-ups yet — the popup starts collecting once it's live.</p>
      ) : (
        <div className="max-h-56 overflow-auto scrollbar-none divide-y divide-border/50">
          {subs.slice(0, 60).map((s) => (
            <div key={s.email} className="flex items-center justify-between py-2 text-sm">
              <span className="truncate">{s.email}</span>
              <span className="text-[11px] text-muted-foreground shrink-0 ml-3">{s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminOrders() {
  // Make the admin route installable as its own home-screen app (iOS/iPadOS/Android):
  // while on /admin we swap the manifest + apple-touch icon + title so "Add to Home
  // Screen" creates an "Omen Admin" app that opens straight to the backend, full-screen.
  useEffect(() => {
    const undo = [];
    const meta = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      const created = !el;
      if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
      const prev = el.getAttribute('content');
      el.setAttribute('content', content);
      undo.push(() => { created ? el.remove() : el.setAttribute('content', prev); });
    };
    const attr = (sel, a, val) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const prev = el.getAttribute(a);
      el.setAttribute(a, val);
      undo.push(() => el.setAttribute(a, prev));
    };
    meta('apple-mobile-web-app-capable', 'yes');
    meta('mobile-web-app-capable', 'yes');
    meta('apple-mobile-web-app-status-bar-style', 'black-translucent');
    meta('apple-mobile-web-app-title', 'Omen Admin');
    meta('theme-color', '#0a0e1a');
    attr('link[rel="manifest"]', 'href', '/admin.webmanifest');
    attr('link[rel="apple-touch-icon"]', 'href', '/admin-180.png?v=2');
    const prevTitle = document.title;
    document.title = 'Omen Admin';
    undo.push(() => { document.title = prevTitle; });
    return () => undo.reverse().forEach((fn) => fn());
  }, []);

  const [authed, setAuthed] = useState(!!adminAuth.get());
  const [tab, setTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [privacy, setPrivacy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setOrders(await fetchOrders());
    } catch (e) {
      if (e.message === 'unauthorized') {
        setAuthed(false);
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) load();
  }, [authed]);

  // Silent background refresh — updates the list without the loading spinner.
  const refresh = async () => {
    try {
      setOrders(await fetchOrders());
    } catch (e) {
      if (e.message === 'unauthorized') setAuthed(false);
      // otherwise ignore — a transient poll failure shouldn't flash an error
    }
  };

  // Track when the admin is mid-action so polling never disturbs an edit.
  const busyRef = useRef(false);
  busyRef.current = expandedId != null || showNew;

  // Auto-refresh every 8s so new orders appear on their own. Skips the tick while
  // an order is expanded / being edited, the New-order form is open, or the tab
  // is in the background — so it never interrupts what you're doing.
  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => {
      if (busyRef.current || document.hidden) return;
      refresh();
    }, 8000);
    // Also refresh the moment you return to the tab.
    const onVisible = () => { if (!document.hidden && !busyRef.current) refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [authed]);

  const removeOrder = async (id, num) => {
    if (!window.confirm(`Delete order ${num}? This permanently removes it and cannot be undone.`)) return;
    try {
      await deleteOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (e) { setError(e.message); }
  };

  const logout = () => {
    adminAuth.clear();
    setAuthed(false);
    setOrders([]);
  };

  if (!authed) return <LoginScreen onSuccess={() => setAuthed(true)} />;

  const statusCount = (s) => orders.filter((o) => o.status === s).length;
  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Admin</span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{tab === 'live' ? 'Live View' : tab === 'overview' ? 'Overview' : tab === 'orders' ? 'Orders' : tab === 'profit' ? 'Profit' : tab === 'stock' ? 'Inventory' : tab === 'promos' ? 'Promo Codes' : tab === 'affiliates' ? 'Affiliates' : 'Customers'}</h1>
            <p className="mt-1 text-sm text-muted-foreground flex items-center gap-2">
              {tab === 'live' ? 'Who’s on your site right now' : tab === 'orders' ? `${orders.length} total orders` : tab === 'profit' ? 'Peptide revenue, cost & profit' : tab === 'stock' ? 'Vials on hand per product' : tab === 'promos' ? 'Create & manage discount codes' : tab === 'affiliates' ? 'Affiliate partners' : tab === 'customers' ? 'Reward members' : 'Store performance'}
              {tab === 'orders' && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/80">
                  ·
                  {expandedId != null || showNew ? (
                    <span className="text-amber-600">paused while editing</span>
                  ) : (
                    <><span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span> auto-updating</>
                  )}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={privacy ? 'default' : 'outline'}
              onClick={() => setPrivacy((p) => !p)}
              className="gap-2 h-9"
              title="Blur profits, prices & emails for screen-sharing"
            >
              {privacy ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {privacy ? 'Privacy on' : 'Privacy'}
            </Button>
            <Button variant="outline" onClick={logout} className="gap-2 h-9">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 rounded-xl border border-border p-1 w-fit max-w-full overflow-x-auto scrollbar-none">
          {(adminAuth.role() === 'admin' ? ['live', 'overview', 'orders', 'profit', 'stock', 'promos', 'affiliates', 'customers'] : ['live', 'overview', 'orders', 'stock', 'affiliates', 'customers']).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-4 h-9 rounded-lg text-sm font-medium capitalize transition-colors inline-flex items-center gap-1.5 ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              {t === 'live' && <span className={`h-1.5 w-1.5 rounded-full ${tab === t ? 'bg-white' : 'bg-emerald-500'} animate-pulse`} />}
              {t}
            </button>
          ))}
        </div>

        {tab === 'live' ? (
          <LiveView onLogout={logout} />
        ) : tab === 'overview' ? (
          <>
            {/* At-a-glance widgets */}
            {!loading && <OverviewWidgets orders={orders} />}
            {/* Checkout funnel — reached vs purchased */}
            {!loading && <FunnelCard />}
            {/* Sales dashboard */}
            {!loading && orders.length > 0 && <SalesDashboard orders={orders} />}
            {/* Payment automation reference */}
            <SubscribersCard />
            <ZelleSetup />
            <CryptoWallets />
          </>
        ) : tab === 'profit' ? (
          loading ? (
            <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" /></div>
          ) : (
            <ProfitView orders={orders} privacy={privacy} />
          )
        ) : tab === 'stock' ? (
          <StockView onLogout={logout} />
        ) : tab === 'promos' ? (
          <PromosView onLogout={logout} />
        ) : tab === 'affiliates' ? (
          <AffiliatesView onLogout={logout} privacy={privacy} />
        ) : tab === 'customers' ? (
          <CustomersView onLogout={logout} privacy={privacy} />
        ) : (
        <>
        {/* Status filter tabs with counts */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none mb-4 -mx-1 px-1">
          {[
            { key: 'all', label: 'All Orders', count: orders.length },
            { key: 'awaiting_payment', label: 'Awaiting Payment', count: statusCount('awaiting_payment') },
            { key: 'confirmed', label: 'Confirmed', count: statusCount('confirmed') },
            { key: 'shipped', label: 'Shipped', count: statusCount('shipped') },
            { key: 'out_for_delivery', label: 'Out for Delivery', count: statusCount('out_for_delivery') },
            { key: 'delivered', label: 'Delivered', count: statusCount('delivered') },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`shrink-0 inline-flex items-center gap-2 px-3.5 h-9 rounded-full text-sm font-medium transition-colors ${statusFilter === s.key ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
              {s.label}
              <span className={`text-[11px] font-semibold rounded-full px-1.5 py-0.5 ${statusFilter === s.key ? 'bg-background/20' : 'bg-background'}`}>{s.count}</span>
            </button>
          ))}
        </div>

        {/* Search + export */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order number, name, or email..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button variant="outline" onClick={() => downloadCsv(
            `omen-orders-${new Date().toISOString().slice(0, 10)}.csv`,
            ['Order', 'Date', 'Status', 'Customer', 'Email', 'Company Name', 'Institution Type', 'Subtotal', 'Total', 'Payment', 'Tracking', 'Items'],
            orders.map((o) => [o.order_number, o.created_date ? new Date(o.created_date).toLocaleString() : '', o.status, o.customer_name, o.customer_email, o.company_name, o.company, o.subtotal, o.total, o.payment_method, o.tracking_number, (Array.isArray(o.items) ? o.items : []).map((i) => `${i.product_name} x${i.quantity}`).join('; ')])
          )} disabled={!orders.length} className="h-11 px-4 gap-2 shrink-0">
            <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button onClick={() => setShowNew((v) => !v)} className="h-11 px-4 gap-2 shrink-0">
            <Package className="h-4 w-4" /> <span className="hidden sm:inline">New order</span>
          </Button>
        </div>

        {showNew && <NewOrderForm onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); load(); }} />}

        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No orders found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((order) => {
              const isOpen = expandedId === order.id;
              const sum = orderSummary(order.items);
              const pay = shortPay(order.payment_method);
              const awaiting = order.status === 'awaiting_payment';
              return (
                <div key={order.id} className={`rounded-2xl border overflow-hidden transition-colors ${isOpen ? 'border-primary/40' : awaiting ? 'border-amber-500/40 bg-amber-500/[0.025]' : 'border-border'}`}>
                  <div className="flex items-stretch">
                  <button
                    onClick={() => setExpandedId(isOpen ? null : order.id)}
                    className="flex-1 min-w-0 flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-accent/40 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-semibold text-sm shrink-0">{order.order_number}</span>
                        <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[order.status] || 'text-muted-foreground bg-muted'}`}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground min-w-0">
                        <span className="font-medium text-foreground/75 truncate shrink-0 max-w-[45%]"><Mask on={privacy}>{order.customer_name || '—'}</Mask></span>
                        {sum.count > 0 && (
                          <>
                            <span className="shrink-0 text-muted-foreground/50">·</span>
                            <span className="truncate">{sum.count} item{sum.count === 1 ? '' : 's'}{sum.names ? ` · ${sum.names}` : ''}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums">${order.total?.toFixed(2) || '—'}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 whitespace-nowrap" title={order.created_date ? new Date(order.created_date).toLocaleString() : ''}>
                        {pay ? `${pay} · ` : ''}{relTime(order.created_date)}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>
                  <button
                    onClick={() => removeOrder(order.id, order.order_number)}
                    aria-label="Delete order"
                    title="Delete order"
                    className="px-3.5 flex items-center justify-center text-muted-foreground/60 hover:text-destructive hover:bg-destructive/5 border-l border-border transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-border"
                      >
                        <OrderEditForm
                          order={order}
                          onSaved={(updated) => {
                            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
                            setExpandedId(null);
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
