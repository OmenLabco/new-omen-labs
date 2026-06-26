import { Link, useLocation } from 'react-router-dom';
import { Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OmenLogo from '../components/OmenLogo';
import { CRYPTO_WALLETS } from '@/data/cryptoWallets';

export default function OrderConfirmed() {
  const { state } = useLocation();
  const isZelle = state?.zelle;
  const isCrypto = state?.crypto;
  const orderNumber = state?.orderNumber || '';
  const total = typeof state?.total === 'number' ? state.total : null;
  const handle = state?.handle || '“omenlabs” — Zelle to (509) 842-7930';

  if (isCrypto) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-8"><OmenLogo size={36} className="text-primary" /></div>
          <div className="h-20 w-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <Clock className="h-10 w-10 text-amber-500" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-6 bg-amber-500" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-amber-600">Awaiting Payment</span>
            <div className="h-px w-6 bg-amber-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Send your crypto payment</h1>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Send <span className="font-semibold text-foreground">{total != null ? `$${total.toFixed(2)}` : ''}</span> (USD equivalent) to <span className="font-semibold text-foreground">one</span> of the addresses below. Order <span className="font-semibold text-foreground">{orderNumber}</span>.
          </p>

          <div className="space-y-2.5 mb-6 text-left">
            {CRYPTO_WALLETS.map((w) => (
              <div key={`${w.coin}-${w.network}`} className="rounded-xl border border-border bg-card p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold">{w.coin} <span className="text-muted-foreground font-normal">· {w.network}</span></span>
                  {w.note && <span className="text-[10px] text-muted-foreground">{w.note}</span>}
                </div>
                <p className="font-mono text-[11px] break-all text-muted-foreground select-all">{w.address}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] mb-8 text-left">
            <p className="text-xs text-muted-foreground leading-relaxed">
              ⚠️ Send only the matching coin on the matching network — wrong-network transfers are lost. After sending, reply to your confirmation email with the transaction ID so we can confirm and ship. We also emailed these addresses to you.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline"><Link to="/account">View My Orders</Link></Button>
            <Button asChild><Link to="/catalog">Continue Shopping</Link></Button>
          </div>
          <p className="mt-8 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">For Research Use Only — Not for Human Consumption</p>
        </div>
      </div>
    );
  }

  if (isZelle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-8"><OmenLogo size={36} className="text-primary" /></div>

          <div className="h-20 w-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <Clock className="h-10 w-10 text-amber-500" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-6 bg-amber-500" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-amber-600">Awaiting Payment</span>
            <div className="h-px w-6 bg-amber-500" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2">Almost done — send your Zelle payment</h1>
          <p className="text-muted-foreground leading-relaxed mb-7">
            Your order is reserved but <span className="font-semibold text-foreground">not yet paid</span>. Complete these steps to confirm it.
          </p>

          {/* Payment box */}
          <div className="p-5 rounded-2xl border border-primary/25 bg-primary/[0.04] mb-6 text-left">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Amount to send</span>
              <span className="text-2xl font-bold">{total != null ? `$${total.toFixed(2)}` : '—'}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Send via Zelle to:</p>
            <p className="text-base font-bold text-foreground mb-3">{handle}</p>
            <p className="text-sm text-muted-foreground mb-1">In the Zelle <span className="font-semibold text-foreground">memo / note</span>, enter your order number:</p>
            <p className="text-xl font-bold tracking-wide">{orderNumber || '—'}</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card mb-8 text-left">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">How it works</p>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-5">
              <li>Open your bank's app and send the amount above via Zelle to <span className="font-semibold text-foreground">{handle}</span>.</li>
              <li><span className="font-semibold text-foreground">Put your order number ({orderNumber || 'OMEN-XXXXXX'}) in the memo</span> — this is required to match your payment.</li>
              <li>Once received, your order is <span className="font-semibold text-foreground">confirmed automatically</span> and you'll get a confirmation email.</li>
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">We also emailed these instructions to you. Orders without a matching memo may be delayed.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline"><Link to="/account">View My Orders</Link></Button>
            <Button asChild><Link to="/catalog">Continue Shopping</Link></Button>
          </div>

          <p className="mt-8 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
            For Research Use Only — Not for Human Consumption
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-8">
          <OmenLogo size={36} className="text-primary" />
        </div>

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
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              Order confirmation sent to your email
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              Compounds prepared and quality verified
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              Shipped with tracking number provided
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link to="/order-status">Track Order</Link>
          </Button>
          <Button asChild>
            <Link to="/catalog">Continue Shopping</Link>
          </Button>
        </div>

        <p className="mt-8 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
          For Research Use Only — Not for Human Consumption
        </p>
      </div>
    </div>
  );
}
