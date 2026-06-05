import { Link, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Package, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Checkout() {
  const { cartItems } = useOutletContext();
  const items = cartItems || [];
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

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

        {/* Payment coming soon notice */}
        <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] flex items-start gap-4">
          <Wrench className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-500 mb-1">Payment Integration Coming Soon</p>
            <p className="text-sm text-muted-foreground">
              We're setting up our new secure payment processor. To place an order now, please contact us directly.
            </p>
          </div>
        </div>

        <p className="mt-6 font-mono text-[10px] text-muted-foreground text-center uppercase tracking-wider">
          For Research Use Only
        </p>
      </div>
    </div>
  );
}