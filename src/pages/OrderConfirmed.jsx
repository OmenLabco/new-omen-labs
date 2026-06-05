import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OmenLogo from '../components/OmenLogo';

export default function OrderConfirmed() {
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