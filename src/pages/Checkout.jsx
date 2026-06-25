import { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cart } from '@/lib/cart';
import { validateAffiliateCode } from '@/lib/affiliateApi';
import { customerAuth, customerMe } from '@/lib/customerApi';

const CRYPTO_DISCOUNT_RATE = 0.10;
const SHIPPING_OPTIONS = [
  { id: 'ground', title: '3–5 Day Ground', desc: 'Standard shipping', price: 9.99 },
  { id: 'first', title: '2-Day First Class', desc: 'Faster delivery', price: 14.99 },
];

const SHIPPING_FIELDS = [
  { name: 'name', label: 'Full Name', required: true, half: true },
  { name: 'email', label: 'Email', required: true, half: true, type: 'email' },
  { name: 'company', label: 'Research Use / Institution Type', required: true, options: [
    'University / Academic Research',
    'Research Laboratory',
    'Biotech / Pharmaceutical Company',
    'Medical / Clinical Research',
    'Analytical / Testing Lab',
    'Independent Researcher',
    'Other Research Use',
  ] },
  { name: 'phone', label: 'Phone (optional)', half: true },
  { name: 'country', label: 'Country', half: true },
  { name: 'address', label: 'Address', required: true },
  { name: 'address2', label: 'Apt / Suite (optional)' },
  { name: 'city', label: 'City', required: true, third: true },
  { name: 'state', label: 'State', third: true },
  { name: 'zip', label: 'ZIP', required: true, third: true },
];

const BILLING_FIELDS = [
  { name: 'name', label: 'Full Name', required: true, half: true },
  { name: 'country', label: 'Country', half: true },
  { name: 'address', label: 'Address', required: true },
  { name: 'address2', label: 'Apt / Suite (optional)' },
  { name: 'city', label: 'City', required: true, third: true },
  { name: 'state', label: 'State', third: true },
  { name: 'zip', label: 'ZIP', required: true, third: true },
];

const colClass = (f) => (f.third ? 'sm:col-span-2' : f.half ? 'sm:col-span-3' : 'sm:col-span-6');
const inputClass =
  'w-full h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
const labelClass = 'block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5';
// Zelle recipient shown to customers (keep in sync with worker/order.js ZELLE_HANDLE)
const ZELLE_HANDLE = '“omenlabs” — Zelle to (509) 842-7930';

export default function Checkout() {
  const { cartItems, loadCart } = useOutletContext();
  const navigate = useNavigate();
  const items = cartItems || [];

  const [form, setForm] = useState({ country: 'United States' });
  const [billing, setBilling] = useState({ country: 'United States' });
  const [billingSame, setBillingSame] = useState(true);
  const [payment, setPayment] = useState('manual');
  const [shipMethod, setShipMethod] = useState('ground');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [affInput, setAffInput] = useState('');
  const [affiliate, setAffiliate] = useState(null); // { code, discountPct }
  const [affMsg, setAffMsg] = useState('');
  const [affChecking, setAffChecking] = useState(false);

  const [account, setAccount] = useState(null);
  const [redeem, setRedeem] = useState(false);

  // Load logged-in customer (points balance, tier) and prefill name/email
  useEffect(() => {
    if (customerAuth.isLoggedIn()) {
      customerMe()
        .then((me) => {
          setAccount(me);
          setForm((f) => ({ ...f, name: f.name || me.name, email: me.email }));
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyCode = async (raw) => {
    const code = (raw ?? affInput).trim();
    if (!code) return;
    setAffChecking(true);
    setAffMsg('');
    try {
      const res = await validateAffiliateCode(code, form.email);
      if (res.valid) {
        setAffiliate(res);
        setAffMsg(`Code ${res.code} applied — ${res.discountPct}% off${res.newCustomer ? ' (new customer)' : ''}!`);
      } else {
        setAffiliate(null);
        setAffMsg('That code is not valid.');
      }
    } catch {
      setAffMsg('Could not check code. Try again.');
    } finally {
      setAffChecking(false);
    }
  };

  // Auto-apply ?ref=CODE from affiliate share links
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) { setAffInput(ref); applyCode(ref); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-check the rate when the email changes (new vs returning customer affects %)
  useEffect(() => {
    if (affiliate && form.email) applyCode(affiliate.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.email]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const cryptoDiscount = payment === 'crypto' ? subtotal * CRYPTO_DISCOUNT_RATE : 0;
  const affiliateDiscount = affiliate ? subtotal * ((affiliate.discountPct || 10) / 100) : 0;

  // Points redemption (logged-in only): 100 pts = $5
  const redeemablePoints = account ? Math.floor((account.points || 0) / 100) * 100 : 0;
  const preDiscount = Math.max(0, subtotal - cryptoDiscount - affiliateDiscount);
  const pointsValue = redeem && account ? Math.min(redeemablePoints * 0.05, preDiscount) : 0;
  const pointsToRedeem = pointsValue > 0 ? redeemablePoints : 0;

  const freeShipping = !!account?.membership?.freeShipping;
  const baseShipping = (SHIPPING_OPTIONS.find((o) => o.id === shipMethod) || SHIPPING_OPTIONS[0]).price;
  const shipping = freeShipping ? 0 : baseShipping;
  const total = subtotal - cryptoDiscount - affiliateDiscount - pointsValue + shipping;

  // Points the customer will earn on this order
  const pointsWillEarn = Math.floor(subtotal * (account?.membership?.multiplier || 1));

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Package className="h-12 w-12 text-muted-foreground/20" />
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button asChild variant="outline">
          <Link to="/catalog">Browse Catalog</Link>
        </Button>
      </div>
    );
  }

  // Account required to purchase (research-customer verification gate)
  if (!customerAuth.isLoggedIn()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center">
        <Package className="h-12 w-12 text-primary/30" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Account required</h1>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            To purchase, you must create a research account and confirm your research field.
            Sign in or create your account to continue to checkout.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild><Link to="/account">Sign In / Create Account</Link></Button>
          <Button asChild variant="outline"><Link to="/catalog">Back to Catalog</Link></Button>
        </div>
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mt-2 max-w-md">
          For laboratory, academic, or institutional research only — not for human or animal consumption.
        </p>
      </div>
    );
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleBilling = (e) => setBilling({ ...billing, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const resp = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { ...form, notes },
          items,
          payment_method: payment,
          shipping_method: shipMethod,
          affiliate_code: affiliate ? affiliate.code : null,
          customer_token: customerAuth.token() || null,
          points_to_redeem: pointsToRedeem,
          billing: billingSame ? null : billing,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error || 'Something went wrong submitting your order.');
      }
      cart.clear();
      loadCart();
      navigate('/order-confirmed', {
        state: {
          zelle: payment === 'zelle',
          orderNumber: data.order_number || '',
          total: Number(total.toFixed(2)),
          handle: ZELLE_HANDLE,
        },
      });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Catalog
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-6 bg-primary" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Checkout</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-10">Review Your Order</h1>

        {/* Order summary */}
        <div className="p-6 rounded-2xl border border-border bg-card mb-6">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-5">Order Summary</h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{item.product_name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
                    {item.quantity} × ${item.price.toFixed(2)}
                  </p>
                </div>
                <span className="text-sm font-semibold shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-5 pt-5 space-y-2 font-mono text-[12px]">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping{freeShipping ? ' (Free — ' + account.membership.name + ')' : ''}</span><span>${shipping.toFixed(2)}</span>
            </div>
            {pointsValue > 0 && (
              <div className="flex justify-between text-emerald-500">
                <span>Points redeemed</span><span>-${pointsValue.toFixed(2)}</span>
              </div>
            )}
            {affiliateDiscount > 0 && (
              <div className="flex justify-between text-emerald-500">
                <span>Affiliate discount ({affiliate?.discountPct || 10}%)</span><span>-${affiliateDiscount.toFixed(2)}</span>
              </div>
            )}
            {cryptoDiscount > 0 && (
              <div className="flex justify-between text-emerald-500">
                <span>Crypto discount (10%)</span><span>-${cryptoDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="uppercase tracking-widest text-muted-foreground">Total</span>
              <span className="text-2xl font-bold">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Rewards */}
        {account ? (
          <div className="p-6 rounded-2xl border border-primary/20 bg-primary/[0.04] mb-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Omen Rewards</h2>
              <span className="text-xs text-muted-foreground">{account.membership?.name} · {account.points} pts</span>
            </div>
            <p className="text-sm text-muted-foreground">You'll earn <strong className="text-foreground">{pointsWillEarn} points</strong> on this order.</p>
            {redeemablePoints >= 100 && (
              <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
                <input type="checkbox" checked={redeem} onChange={(e) => setRedeem(e.target.checked)} className="h-4 w-4 accent-primary" />
                <span className="text-sm">Redeem {redeemablePoints} points for <strong className="text-emerald-500">${(redeemablePoints * 0.05).toFixed(2)} off</strong></span>
              </label>
            )}
          </div>
        ) : (
          <div className="p-5 rounded-2xl border border-border bg-card mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Earn {Math.floor(subtotal)} points</strong> on this order — create an account to start earning rewards.
            </p>
            <Button asChild variant="outline" className="h-9 shrink-0"><Link to="/account">Sign in</Link></Button>
          </div>
        )}

        {/* Affiliate / referral code */}
        <div className="p-6 rounded-2xl border border-border bg-card mb-6">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-5">Referral Code</h2>
          <div className="flex gap-2">
            <input
              value={affInput}
              onChange={(e) => setAffInput(e.target.value)}
              placeholder="Enter a code for 10% off"
              className="flex-1 h-11 px-3 rounded-lg border border-border bg-background text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button type="button" variant="outline" onClick={() => applyCode()} disabled={affChecking} className="h-11 px-5">
              {affChecking ? '…' : 'Apply'}
            </Button>
          </div>
          {affMsg && <p className={`text-sm mt-2 ${affiliate ? 'text-emerald-500' : 'text-destructive'}`}>{affMsg}</p>}
        </div>

        {/* Shipping method */}
        <div className="p-6 rounded-2xl border border-border bg-card mb-6">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-5">Shipping Method</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SHIPPING_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.id}
                onClick={() => setShipMethod(opt.id)}
                className={`text-left p-4 rounded-xl border transition-colors ${
                  shipMethod === opt.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{opt.title}</span>
                  <span className="text-sm font-semibold">${opt.price.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Payment method */}
        <div className="p-6 rounded-2xl border border-border bg-card mb-6">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-5">Payment Method</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'zelle', title: 'Zelle', desc: 'Pay by Zelle — auto-confirmed' },
              { id: 'manual', title: 'Manual / Invoice', desc: 'Invoice to follow after order' },
              { id: 'crypto', title: 'Crypto — 10% off', desc: 'Pay with crypto and save 10%' },
            ].map((opt) => (
              <button
                type="button"
                key={opt.id}
                onClick={() => setPayment(opt.id)}
                className={`text-left p-4 rounded-xl border transition-colors ${
                  payment === opt.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{opt.title}</span>
                  {payment === opt.id && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>

          {payment === 'zelle' && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.04] p-4 text-sm leading-relaxed">
              <p className="font-semibold mb-1">How to pay with Zelle</p>
              <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>Place your order — you'll get an email with the exact amount and your order number.</li>
                <li>In your bank's Zelle, send the total to <span className="font-semibold text-foreground">{ZELLE_HANDLE}</span>.</li>
                <li><span className="font-semibold text-foreground">Put your order number in the Zelle memo/note</span> — this is required so we can match and confirm your payment automatically.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Shipping + billing + submit */}
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-border bg-card">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-5">Shipping Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
            {SHIPPING_FIELDS.map((f) => {
              const lockEmail = f.name === 'email' && !!account?.email;
              return (
              <div key={f.name} className={colClass(f)}>
                <label className={labelClass}>{f.label}{lockEmail && ' (account)'}</label>
                {f.options ? (
                  <select name={f.name} required={f.required} value={form[f.name] || ''} onChange={handleChange} className={inputClass}>
                    <option value="" disabled>Select…</option>
                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : lockEmail ? (
                  <input name={f.name} type="email" readOnly value={account.email} className={`${inputClass} opacity-70 cursor-not-allowed`} title="Orders are tied to your account email" />
                ) : (
                  <input name={f.name} type={f.type || 'text'} required={f.required} value={form[f.name] || ''} onChange={handleChange} className={inputClass} />
                )}
              </div>
            );})}
            <div className="sm:col-span-6">
              <label className={labelClass}>Order Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          {/* Billing */}
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mt-8 mb-4">Billing Address</h2>
          <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
            <input type="checkbox" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} className="h-4 w-4 accent-primary" />
            <span className="text-sm text-muted-foreground">Billing address same as shipping</span>
          </label>
          {!billingSame && (
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
              {BILLING_FIELDS.map((f) => (
                <div key={f.name} className={colClass(f)}>
                  <label className={labelClass}>{f.label}</label>
                  <input name={f.name} type="text" required={f.required} value={billing[f.name] || ''} onChange={handleBilling} className={inputClass} />
                </div>
              ))}
            </div>
          )}

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full h-12 mt-6 text-sm font-medium tracking-wide">
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Order…</>
            ) : (
              `Place Order — $${total.toFixed(2)}`
            )}
          </Button>

          <p className="mt-4 text-[12px] text-muted-foreground text-center">
            We'll email you to confirm payment and shipping. No card is charged on this page.
          </p>
          <p className="mt-2 font-mono text-[10px] text-destructive text-center uppercase tracking-wider">
            All sales are final — no returns or exchanges
          </p>
        </form>

        <p className="mt-6 font-mono text-[10px] text-muted-foreground text-center uppercase tracking-wider">
          For Research Use Only
        </p>
      </div>
    </div>
  );
}
