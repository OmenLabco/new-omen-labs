import { useState, useEffect, useRef } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Loader2, Check, Bitcoin, Receipt, Truck, Zap, Store, ShieldCheck, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cart } from '@/lib/cart';
import { validateAffiliateCode } from '@/lib/affiliateApi';
import { customerAuth, customerMe } from '@/lib/customerApi';

const STATE_ABBR = { alabama:'AL',alaska:'AK',arizona:'AZ',arkansas:'AR',california:'CA',colorado:'CO',connecticut:'CT',delaware:'DE','district of columbia':'DC',florida:'FL',georgia:'GA',hawaii:'HI',idaho:'ID',illinois:'IL',indiana:'IN',iowa:'IA',kansas:'KS',kentucky:'KY',louisiana:'LA',maine:'ME',maryland:'MD',massachusetts:'MA',michigan:'MI',minnesota:'MN',mississippi:'MS',missouri:'MO',montana:'MT',nebraska:'NE',nevada:'NV','new hampshire':'NH','new jersey':'NJ','new mexico':'NM','new york':'NY','north carolina':'NC','north dakota':'ND',ohio:'OH',oklahoma:'OK',oregon:'OR',pennsylvania:'PA','rhode island':'RI','south carolina':'SC','south dakota':'SD',tennessee:'TN',texas:'TX',utah:'UT',vermont:'VT',virginia:'VA',washington:'WA','west virginia':'WV',wisconsin:'WI',wyoming:'WY' };
const stateAbbr = (s) => STATE_ABBR[(s || '').toLowerCase()] || s || '';

const CRYPTO_DISCOUNT_RATE = 0.10;
const SHIPPING_OPTIONS = [
  { id: 'ground', title: '3–5 Day Ground', desc: 'Standard shipping', price: 9.99 },
  { id: 'first', title: '2-Day First Class', desc: 'Faster delivery', price: 14.99 },
  { id: 'pickup', title: 'Local Pickup (Spokane, WA)', desc: 'Free — pick up locally', price: 0 },
];

// Brand look for each payment method (colored tile + selected-state accent).
const PAY_META = {
  zelle:   { glyph: 'Z', tile: 'bg-gradient-to-br from-fuchsia-500 to-violet-700', sel: 'border-violet-400 bg-violet-500/[0.06] ring-1 ring-violet-400/40' },
  cashapp: { glyph: '$', tile: 'bg-[#00D54B]',                                      sel: 'border-emerald-400 bg-emerald-500/[0.06] ring-1 ring-emerald-400/40' },
  crypto:  { Icon: Bitcoin, tile: 'bg-gradient-to-br from-amber-400 to-orange-600', sel: 'border-amber-400 bg-amber-500/[0.06] ring-1 ring-amber-400/40' },
  manual:  { Icon: Receipt, tile: 'bg-gradient-to-br from-slate-400 to-slate-600',  sel: 'border-primary bg-primary/[0.05] ring-1 ring-primary/40' },
};
const SHIP_META = { ground: Truck, first: Zap, pickup: Store };

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
// Cash App $cashtag shown to customers (keep in sync with worker/order.js CASHAPP_HANDLE)
const CASHAPP_HANDLE = '$omenlabs';
const ZELLE_PHONE = '(509) 842-7930'; // copyable Zelle recipient

export default function Checkout() {
  const { cartItems, loadCart } = useOutletContext();
  const navigate = useNavigate();
  const items = cartItems || [];

  const [form, setForm] = useState({ country: 'United States' });
  const [billing, setBilling] = useState({ country: 'United States' });
  const [billingSame, setBillingSame] = useState(true);
  const [payment, setPayment] = useState('cashapp');
  const [copiedPay, setCopiedPay] = useState('');
  const copyPay = (key, text) => { navigator.clipboard?.writeText(text); setCopiedPay(key); setTimeout(() => setCopiedPay(''), 1500); };
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
      const confirmState = {
        zelle: payment === 'zelle',
        cashapp: payment === 'cashapp',
        crypto: payment === 'crypto',
        orderNumber: data.order_number || '',
        statusToken: data.status_token || '',
        total: Number(total.toFixed(2)),
        handle: ZELLE_HANDLE,
        cashappHandle: CASHAPP_HANDLE,
      };
      // Persist so the payment-instructions page survives a refresh / revisit.
      try { sessionStorage.setItem('omenlabs_last_order', JSON.stringify(confirmState)); } catch {}
      navigate('/order-confirmed', { state: confirmState });
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
              <span>{shipMethod === 'pickup' ? 'Local Pickup' : 'Shipping'}{freeShipping ? ' (Free — ' + account.membership.name + ')' : ''}</span><span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
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
          <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Shipping Method</h2>
            {freeShipping && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 rounded-full px-2.5 py-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Free shipping with {account?.membership?.name || 'membership'}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SHIPPING_OPTIONS.map((opt) => {
              const Icon = SHIP_META[opt.id] || Truck;
              const selected = shipMethod === opt.id;
              const free = opt.price === 0 || freeShipping;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setShipMethod(opt.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${selected ? 'border-primary bg-primary/[0.06] ring-1 ring-primary/30' : 'border-border hover:bg-accent/40'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${selected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold truncate">{opt.title}</span>
                        <span className={`text-sm font-bold shrink-0 ${free ? 'text-emerald-600' : ''}`}>
                          {free
                            ? (freeShipping && opt.price > 0
                                ? <><span className="text-muted-foreground/60 font-normal line-through mr-1.5">${opt.price.toFixed(2)}</span>Free</>
                                : 'Free')
                            : `$${opt.price.toFixed(2)}`}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment method */}
        <div className="p-6 rounded-2xl border border-border bg-card mb-6">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-5">Payment Method</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'cashapp', title: 'Cash App', desc: 'Pay to $omenlabs', badge: 'Auto-confirm' },
              { id: 'zelle', title: 'Zelle', desc: 'Pay from your bank', badge: 'Auto-confirm' },
              { id: 'crypto', title: 'Crypto', desc: 'USDC · USDT · BTC', badge: '10% off', badgeTone: 'save' },
              { id: 'manual', title: 'Manual / Invoice', desc: 'Invoice to follow' },
            ].map((opt) => {
              const m = PAY_META[opt.id];
              const selected = payment === opt.id;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setPayment(opt.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${selected ? m.sel : 'border-border hover:bg-accent/40'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-10 w-10 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm ${m.tile}`}>
                      {m.Icon ? <m.Icon className="h-5 w-5" /> : <span className="text-lg font-black leading-none">{m.glyph}</span>}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold">{opt.title}</span>
                        {opt.badge && (
                          <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${opt.badgeTone === 'save' ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600'}`}>
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                    </div>
                    {selected && <Check className="h-4 w-4 text-foreground shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          {payment === 'cashapp' && (
            <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Send Cash App to</p>
                  <p className="text-lg font-bold truncate">{CASHAPP_HANDLE}</p>
                </div>
                <button type="button" onClick={() => copyPay('cashapp', CASHAPP_HANDLE)}
                  className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-background text-xs font-medium hover:bg-accent transition-colors">
                  {copiedPay === 'cashapp' ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                </button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Place your order, then send the total to <span className="font-semibold text-foreground">{CASHAPP_HANDLE}</span> and <span className="font-semibold text-foreground">put your order number in the “For” note</span>. That's it.
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600"><Zap className="h-3.5 w-3.5" /> Confirms automatically — usually within minutes</p>
            </div>
          )}

          {payment === 'zelle' && (
            <div className="mt-4 rounded-xl border border-violet-500/25 bg-violet-500/[0.05] p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Send Zelle to</p>
                  <p className="text-lg font-bold truncate">{ZELLE_PHONE}</p>
                  <p className="text-[11px] text-muted-foreground">recipient name: “omenlabs”</p>
                </div>
                <button type="button" onClick={() => copyPay('zelle', ZELLE_PHONE)}
                  className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-background text-xs font-medium hover:bg-accent transition-colors">
                  {copiedPay === 'zelle' ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                </button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Place your order, then Zelle the total to the number above and <span className="font-semibold text-foreground">put your order number in the memo/note</span>. That's it.
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-violet-600"><Zap className="h-3.5 w-3.5" /> Confirms automatically — usually within minutes</p>
            </div>
          )}

          {payment === 'crypto' && (
            <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.05] p-4 text-sm leading-relaxed">
              <p className="font-semibold mb-1">Pay with crypto — save 10%</p>
              <p className="text-muted-foreground">
                After you place the order we'll show wallet addresses for <span className="font-semibold text-foreground">USDC, USDT, and BTC</span>. Send the exact amount and it <span className="font-semibold text-foreground">auto-confirms on-chain</span> — no account or card needed.
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-600"><Zap className="h-3.5 w-3.5" /> 10% discount already applied to your total</p>
            </div>
          )}

          {payment === 'manual' && (
            <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground leading-relaxed">
              Place your order and we'll email you an invoice with payment options. Your order is reserved until it's paid.
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

          <div className="mt-4 flex items-center justify-center gap-2 text-[12px] text-emerald-600">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-medium">Secure checkout · encrypted &amp; discreet</span>
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground text-center">
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
