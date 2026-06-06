import { useState } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cart } from '@/lib/cart';

const FIELDS = [
  { name: 'name', label: 'Full Name', required: true, half: true },
  { name: 'email', label: 'Email', required: true, half: true, type: 'email' },
  { name: 'phone', label: 'Phone (optional)', half: true },
  { name: 'country', label: 'Country', half: true, default: 'United States' },
  { name: 'address', label: 'Address', required: true },
  { name: 'address2', label: 'Apt / Suite (optional)' },
  { name: 'city', label: 'City', required: true, third: true },
  { name: 'state', label: 'State', third: true },
  { name: 'zip', label: 'ZIP', required: true, third: true },
];

export default function Checkout() {
  const { cartItems, loadCart } = useOutletContext();
  const navigate = useNavigate();
  const items = cartItems || [];
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const [form, setForm] = useState({ country: 'United States' });
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const resp = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: { ...form, notes }, items, total }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong submitting your order.');
      }
      cart.clear();
      loadCart();
      navigate('/order-confirmed');
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
                <span className="text-sm font-semibold shrink-0">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-5 pt-5 flex justify-between items-center">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Total</span>
            <span className="text-2xl font-bold">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Shipping / order form */}
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-border bg-card">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-5">Shipping Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
            {FIELDS.map((f) => (
              <div
                key={f.name}
                className={f.third ? 'sm:col-span-2' : f.half ? 'sm:col-span-3' : 'sm:col-span-6'}
              >
                <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  {f.label}
                </label>
                <input
                  name={f.name}
                  type={f.type || 'text'}
                  required={f.required}
                  value={form[f.name] || ''}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}
            <div className="sm:col-span-6">
              <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                Order Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          )}

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
