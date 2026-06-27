import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, Clock, Copy, Loader2 } from 'lucide-react';
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
  const isCrypto = state?.crypto;
  const orderNumber = state?.orderNumber || '';
  const statusToken = state?.statusToken || '';
  const total = typeof state?.total === 'number' ? state.total : null;
  const handle = state?.handle || '“omenlabs” — Zelle to (509) 842-7930';
  const awaitingFlow = isCrypto || isZelle;

  const [copied, setCopied] = useState('');
  const copy = (key, text) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  // Live status polling — auto-flips the page to "Payment received" when the
  // watcher/Zelle confirms the order, even if the customer leaves it open.
  const [liveStatus, setLiveStatus] = useState(null);
  useEffect(() => {
    if (!awaitingFlow || !orderNumber || !statusToken) return;
    let stopped = false, tries = 0;
    const poll = async () => {
      try {
        const r = await fetch(`/api/order/status?o=${encodeURIComponent(orderNumber)}&t=${encodeURIComponent(statusToken)}`);
        if (r.ok) {
          const d = await r.json();
          if (d.status) {
            setLiveStatus(d.status);
            if (d.status !== 'awaiting_payment') stopped = true;
          }
        }
      } catch {}
    };
    poll();
    const id = setInterval(() => {
      tries += 1;
      if (stopped || tries > 320) { clearInterval(id); return; } // ~64 min cap
      poll();
    }, 12000);
    return () => clearInterval(id);
  }, [awaitingFlow, orderNumber, statusToken]);

  const paid = liveStatus && liveStatus !== 'awaiting_payment';

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

  const liveBadge = (
    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5">
      <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
      <span className="text-xs text-muted-foreground">Watching for your payment… this page updates automatically</span>
    </div>
  );

  const timingNote = (
    <p className="mt-3 text-xs text-muted-foreground">
      You can <span className="font-medium text-foreground">close this page</span> or keep it open — your order updates on its own.
      Allow <span className="font-medium text-foreground">1–5 minutes</span> to confirm
      {isCrypto ? <> (<span className="font-medium text-foreground">10–60 minutes</span> for Bitcoin)</> : null}.
    </p>
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
          <span className="text-3xl font-bold">{total != null ? `$${total.toFixed(2)}` : '—'}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Order <span className="font-semibold text-foreground">{orderNumber}</span> — send the exact amount to <span className="font-semibold text-foreground">one</span> address below.</p>

        <div className="space-y-2.5 mb-5 text-left">
          {CRYPTO_WALLETS.map((w) => {
            const key = `${w.coin}-${w.network}`;
            return (
              <div key={key} className="rounded-xl border border-border bg-card p-3.5">
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

        {liveBadge}
        {timingNote}

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

        <div className="p-5 rounded-2xl border border-primary/25 bg-primary/[0.04] mb-5 text-left">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
            <span className="text-sm text-muted-foreground">Amount to send</span>
            <span className="text-2xl font-bold">{total != null ? `$${total.toFixed(2)}` : '—'}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Send via Zelle to:</p>
          <p className="text-base font-bold text-foreground mb-3">{handle}</p>
          <p className="text-sm text-muted-foreground mb-1">In the Zelle <span className="font-semibold text-foreground">memo / note</span>, enter your order number:</p>
          <p className="text-xl font-bold tracking-wide">{orderNumber || '—'}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card text-left">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">How it works</p>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-5">
            <li>Send the amount above via Zelle to <span className="font-semibold text-foreground">{handle}</span>.</li>
            <li><span className="font-semibold text-foreground">Put your order number ({orderNumber || 'OMEN-XXXXXX'}) in the memo</span> — required to match your payment.</li>
            <li>Once received, your order confirms <span className="font-semibold text-foreground">automatically</span>.</li>
          </ol>
        </div>

        {liveBadge}
        {timingNote}

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
