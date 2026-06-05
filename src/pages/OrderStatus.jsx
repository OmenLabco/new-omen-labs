import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, CheckCircle, Truck, MapPin, Clock } from 'lucide-react';
// TODO: connect to your order database when payment processor is set up
import { Button } from '@/components/ui/button';

const STEPS = [
  { key: 'processing', label: 'Processing', icon: Clock, description: 'Order received and being prepared' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, description: 'Order confirmed and packed' },
  { key: 'shipped', label: 'Shipped', icon: Package, description: 'Package dispatched from facility' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, description: 'With courier for delivery' },
  { key: 'delivered', label: 'Delivered', icon: MapPin, description: 'Package delivered successfully' },
];

const STATUS_INDEX = {
  processing: 0,
  confirmed: 1,
  shipped: 2,
  out_for_delivery: 3,
  delivered: 4,
};

export default function OrderStatus() {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true);
    setNotFound(false);
    setOrder(null);

    const cleaned = orderNumber.trim().toUpperCase().replace(/^#/, '');
    // Placeholder: replace with your order API call
    const results = [];
    if (results.length > 0) {
      setOrder(results[0]);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  const currentStep = order ? STATUS_INDEX[order.status] ?? 0 : 0;

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Omen Labs
          </span>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">Order Status</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Enter your order number to track your shipment
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSearch}
          className="flex gap-3 mb-10"
        >
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. OMEN-A1B2C3D4"
            className="flex-1 h-11 px-4 rounded-xl border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button type="submit" disabled={loading} className="h-11 px-6">
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </motion.form>

        {/* Not Found */}
        {notFound && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10 text-muted-foreground"
          >
            <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No order found for <span className="font-mono font-semibold text-foreground">{orderNumber.toUpperCase()}</span></p>
            <p className="text-xs mt-1">Please double-check your order number and try again.</p>
          </motion.div>
        )}

        {/* Order Found */}
        {order && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Order Info */}
            <div className="p-5 rounded-2xl border border-border mb-6">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Order</span>
                <span className="font-mono text-xs text-muted-foreground">{new Date(order.created_date).toLocaleDateString()}</span>
              </div>
              <p className="font-mono font-semibold text-lg">{order.order_number}</p>
              {order.customer_name && <p className="text-sm text-muted-foreground mt-0.5">{order.customer_name}</p>}
              {order.tracking_number && (
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">Tracking</span>
                  <span className="font-mono text-xs font-medium">{order.carrier && `${order.carrier} · `}{order.tracking_number}</span>
                </div>
              )}
              {order.estimated_delivery && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">Est. Delivery</span>
                  <span className="text-xs font-medium">{order.estimated_delivery}</span>
                </div>
              )}
            </div>

            {/* Progress Steps */}
            <div className="p-6 rounded-2xl border border-border">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-6">Shipping Progress</h3>
              <div className="space-y-0">
                {STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex gap-4">
                      {/* Line + Icon */}
                      <div className="flex flex-col items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          done ? 'bg-foreground' : 'bg-muted border border-border'
                        }`}>
                          <Icon className={`h-3.5 w-3.5 ${done ? 'text-background' : 'text-muted-foreground'}`} />
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={`w-px flex-1 my-1 ${i < currentStep ? 'bg-foreground' : 'bg-border'}`} style={{ minHeight: '24px' }} />
                        )}
                      </div>
                      {/* Text */}
                      <div className="pb-6">
                        <p className={`text-sm font-medium ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.label}
                          {active && <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-primary">Current</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Items */}
            {order.items?.length > 0 && (
              <div className="mt-4 p-5 rounded-2xl border border-border">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Items</h3>
                <div className="space-y-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>{item.name} <span className="text-muted-foreground">× {item.quantity}</span></span>
                      {item.price && <span className="font-mono">${(item.price * item.quantity).toFixed(2)}</span>}
                    </div>
                  ))}
                  {order.total && (
                    <div className="flex items-center justify-between pt-3 border-t border-border text-sm font-semibold">
                      <span>Total</span>
                      <span className="font-mono">${order.total.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {order.notes && (
              <p className="mt-4 text-xs text-muted-foreground text-center">{order.notes}</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}