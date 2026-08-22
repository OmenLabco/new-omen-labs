import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, Clock, Copy, Loader2, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OmenLogo from '../components/OmenLogo';
import { CRYPTO_WALLETS } from '@/data/cryptoWallets';

function readLastOrder() {
  try { return JSON.parse(sessionStorage.getItem('omenlabs_last_order') || 'null'); } catch { return null; }
}

export default function OrderConfirmed() {
  const loc = useLocation();
  const state = loc.state || readLastOrder() || {};
  const isZelle = state?.zelle;
  const isCashapp = state?.cashapp;
  const isCrypto = state?.crypto;
  const orderNumber = state?.orderNumber || '';
  const statusToken = state?.statusToken || '';
  const total = typeof state?.total === 'number' ? state.total : null;
  const handle = state?.handle || '“omenlabs” — Zelle to (509) 842-7930';
  const cashappHandle = state?.cashappHandle || '$omenlabs';
  const awaitingFlow = isCrypto || isZelle || isCashapp;

  const [copied, setCopied] = useState('');
  const copy = (key, text) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  // Live status polling — auto-flips the page to "Payment received" when the
  // watcher/Zelle confirms the order, even if the customer leaves it open.
  const [liveStatus, setLiveStatus] = useState(null);
  const [checking, setChecking] = useState(false);
  const canPoll = awaitingFlow && orderNumber && statusToken;

  const checkNow = async () => {
    if (!canPoll) return;
    setChecking(true);
    try {
      const r = await fetch(`/api/order/status?o=${encodeURIComponent(orderNumber)}&t=${encodeURIComponent(statusToken)}`);
      if (r.ok) { const d = await r.json(); if (d.status) setLiveStatus(d.status); }
    } catch {}
    setChecking(false);
  };

  useEffect(() => {
    if (!canPoll) return;
    let tries = 0;
    checkNow();
    const id = setInterval(() => {
      tries += 1;
      if (tries > 320) { clearInterval(id); return; } // ~64 min cap
      checkNow();
    }, 12000);
    const onVis = () => { if (document.visibilityState === 'visible') checkNow(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canPoll, orderNumber, statusToken]);

  const paid = liveStatus && liveStatus !== 'awaiting_payment';

  const noteWord = isZelle ? 'memo' : isCrypto ? 'transaction' : 'note';
  const supportHref = `mailto:support@omenlabs.co?subject=${encodeURIComponent(`Payment help — ${orderNumber || 'my order'}`)}`;
  const paymentHelp = (
    <div className="mt-6 p-4 rounded-xl border border-border bg-card text-left">
      <div className="flex items-center gap-2 mb-3">
        <LifeBuoy className="h-4 w-4 text-primary" />
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Questions about your payment?</p>
      </div>
      <ul className="space-y-2.5 text-sm text-muted-foreground">
        <li><span className="font-medium text-foreground">Sent it but still says awaiting?</span> Give it 1–5 minutes{isCrypto ? ' (10–60 for Bitcoin)' : ''} — this page updates on its own once we receive it.</li>
        <li><span className="font-medium text-foreground">Forgot your order number{orderNumber ? ` (${orderNumber})` : ''} in the {noteWord}, or sent the wrong amount?</span> Don't resend — email us and we'll match it up for you.</li>
      </ul>
      <a href={supportHref} className="mt-3.5 inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
        <LifeBuoy className="h-4 w-4" /> Contact support
      </a>
      <p className="mt-2 text-[11px] text-muted-foreground">support@omenlabs.co — please include your order number.</p>
    </div>
  );

  const Wrap = ({ children }) => (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-8"><OmenLogo size={36} className="text-primary" /></div>
        {children}
        <p className="mt-8 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
          For Research Use Only — Not for Human Consumption
        </p>
      </div>
    </div>
  );

  const topWatcher = (
    <div className="mb-7 rounded-2xl border border-primary/25 bg-primary/[0.05] px-4 py-3.5">
      <div className="flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 text-primary animate-spin" />
        <span className="text-sm font-medium text-foreground">Watching for your payment</span>
        <button onClick={checkNow} disabled={checking} className="ml-1 text-[12px] font-semibold text-primary hover:underline disabled:opacity-50">
          {checking ? 'Checking…' : 'Check now'}
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
        You can <span className="font-medium text-foreground">close this page</span> or keep it open — it updates on its own.
        Allow <span className="font-medium text-foreground">1–5 minutes</span>
        {isCrypto ? <> (<span className="font-medium text-foreground">10–60 min</span> for Bitcoin)</> : null}.
      </p>
    </div>
  );

  // ---- Payment received (auto-flips here once confirmed) ----
  if (paid) {
    return (
      <Wrap>
        <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto mb-6">
          <Check className="h-10 w-10 text-emerald-500" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="h-px w-6 bg-emerald-500" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-600">Payment Received</span>
          <div className="h-px w-6 bg-emerald-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Payment received — order confirmed</h1>
        <p className="text-muted-foreground leading-relaxed mb-2">
          We've received your payment for <span className="font-semibold text-foreground">{orderNumber}</span>. A confirmation email is on its way, and your order is now being prepared.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
          <Button asChild variant="outline"><Link to="/account">View My Orders</Link></Button>
          <Button asChild><Link to="/catalog">Continue Shopping</Link></Button>
        </div>
      </Wrap>
    );
  }

  // ---- Crypto awaiting ----
  if (isCrypto) {
    return (
      <Wrap>
        {topWatcher}
        <div className="h-20 w-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
          <Clock className="h-10 w-10 text-amber-500" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="h-px w-6 bg-amber-500" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-amber-600">Awaiting Payment</span>
          <div className="h-px w-6 bg-amber-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Send your crypto payment</h1>
        <div className="inline-flex items-baseline gap-2 mb-1">
          <span className="text-sm text-muted-foreground">Amount</span>
          <span className="text-3xl font-bold text-amber-600">{total != null ? `$${total.toFixed(2)}` : '—'}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Order <span className="font-semibold text-foreground">{orderNumber}</span> — send the exact amount to <span className="font-semibold text-foreground">one</span> address below.</p>

        <div className="space-y-2.5 mb-5 text-left">
          {CRYPTO_WALLETS.map((w) => {
            const key = `${w.coin}-${w.network}`;
            return (
              <div key={key} className="rounded-xl border border-amber-500/25 bg-amber-500/[0.03] p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold">{w.coin} <span className="text-muted-foreground font-normal">· {w.network}</span></span>
                  {w.note && <span className="text-[10px] text-muted-foreground">{w.note}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-[11px] break-all text-muted-foreground select-all flex-1 min-w-0">{w.address}</p>
                  <button onClick={() => copy(key, w.address)} className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium hover:bg-accent transition-colors">
                    {copied === key ? <><Check className="h-3 w-3 text-emerald-500" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] text-left">
          <p className="text-xs text-muted-foreground leading-relaxed">
            ⚠️ Send only the matching coin on the matching network — wrong-network transfers can't be recovered.
          </p>
        </div>

        {paymentHelp}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
          <Button asChild variant="outline"><Link to="/account">View My Orders</Link></Button>
          <Button asChild><Link to="/catalog">Continue Shopping</Link></Button>
        </div>
      </Wrap>
    );
  }

  // ---- Zelle awaiting ----
  if (isZelle) {
    return (
      <Wrap>
        {topWatcher}
        <div className="h-20 w-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
          <Clock className="h-10 w-10 text-amber-500" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="h-px w-6 bg-amber-500" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-amber-600">Awaiting Payment</span>
          <div className="h-px w-6 bg-amber-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Almost done — send your Zelle payment</h1>
        <p className="text-muted-foreground leading-relaxed mb-6">Your order is reserved but <span className="font-semibold text-foreground">not yet paid</span>. Complete these steps to confirm it.</p>

        <div className="p-5 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/[0.09] to-violet-500/[0.01] mb-5 text-left shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-violet-500/15">
            <span className="text-sm text-muted-foreground">Amount to send</span>
            <span className="text-2xl font-bold text-violet-600">{total != null ? `$${total.toFixed(2)}` : '—'}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Send via Zelle to:</p>
          <p className="text-lg font-bold text-violet-700 dark:text-violet-400 mb-3">{handle}</p>
          <p className="text-sm text-muted-foreground mb-1.5">In the Zelle <span className="font-semibold text-foreground">memo / note</span>, enter your order number:</p>
          <p className="inline-block font-mono text-lg font-bold tracking-wide px-3 py-1 rounded-lg bg-violet-500/10 text-violet-700 dark:text-violet-300">{orderNumber || '—'}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card text-left">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">How it works</p>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-5">
            <li>Send the amount above via Zelle to <span className="font-semibold text-foreground">{handle}</span>.</li>
            <li><span className="font-semibold text-foreground">Put your order number ({orderNumber || 'OMEN-XXXXXX'}) in the memo</span> — required to match your payment.</li>
            <li>Once received, your order confirms <span className="font-semibold text-foreground">automatically</span>.</li>
          </ol>
        </div>

        {paymentHelp}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
          <Button asChild variant="outline"><Link to="/account">View My Orders</Link></Button>
          <Button asChild><Link to="/catalog">Continue Shopping</Link></Button>
        </div>
      </Wrap>
    );
  }

  // ---- Cash App awaiting ----
  if (isCashapp) {
    return (
      <Wrap>
        {topWatcher}
        <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
          <Clock className="h-10 w-10 text-emerald-500" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="h-px w-6 bg-emerald-500" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-600">Awaiting Payment</span>
          <div className="h-px w-6 bg-emerald-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Almost done — send your Cash App payment</h1>
        <p className="text-muted-foreground leading-relaxed mb-6">Your order is reserved but <span className="font-semibold text-foreground">not yet paid</span>. Complete these steps to confirm it.</p>

        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.09] to-emerald-500/[0.01] mb-5 text-left shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-500/15">
            <span className="text-sm text-muted-foreground">Amount to send</span>
            <span className="text-2xl font-bold text-emerald-600">{total != null ? `$${total.toFixed(2)}` : '—'}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Send on Cash App to:</p>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{cashappHandle}</p>
            <button onClick={() => copy('cashtag', cashappHandle)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-2 py-1 text-[11px] font-medium hover:bg-emerald-500/10 transition-colors">
              {copied === 'cashtag' ? <><Check className="h-3 w-3 text-emerald-500" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-1.5">In the Cash App <span className="font-semibold text-foreground">"For" note</span>, enter your order number:</p>
          <p className="inline-block font-mono text-lg font-bold tracking-wide px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">{orderNumber || '—'}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card text-left">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">How it works</p>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-5">
            <li>Send the amount above to <span className="font-semibold text-foreground">{cashappHandle}</span> on Cash App.</li>
            <li><span className="font-semibold text-foreground">Put your order number ({orderNumber || 'OMEN-XXXXXX'}) in the "For" note</span> — required to match your payment.</li>
            <li>Once received, your order confirms <span className="font-semibold text-foreground">automatically</span>.</li>
          </ol>
        </div>

        {paymentHelp}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
          <Button asChild variant="outline"><Link to="/account">View My Orders</Link></Button>
          <Button asChild><Link to="/catalog">Continue Shopping</Link></Button>
        </div>
      </Wrap>
    );
  }

  // ---- Generic (manual / card) order received ----
  return (
    <Wrap>
      <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
        <Check className="h-10 w-10 text-primary" />
      </div>
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="h-px w-6 bg-primary" />
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Order Received</span>
        <div className="h-px w-6 bg-primary" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-3">Order Received</h1>
      <p className="text-muted-foreground leading-relaxed mb-8">
        Your order has been received. We'll email you shortly to confirm payment and shipping details.
      </p>
      <div className="p-4 rounded-xl border border-border bg-card mb-8 text-left">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">What's Next</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />Order confirmation sent to your email</li>
          <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />Compounds prepared and quality verified</li>
          <li className="flex items-start gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />Shipped with tracking number provided</li>
        </ul>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild variant="outline"><Link to="/order-status">Track Order</Link></Button>
        <Button asChild><Link to="/catalog">Continue Shopping</Link></Button>
      </div>
    </Wrap>
  );
}
