import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Gift, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OmenLogo from './OmenLogo';
import { FREE_SHIP_THRESHOLD } from '@/lib/shipping';

export default function CartDock({ isOpen, onClose, items = [], onUpdateQuantity, onRemove }) {
  const navigate = useNavigate();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
          />

          {/* Dock panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[80] bg-card border-t border-border rounded-t-2xl max-h-[75vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <OmenLogo size={20} className="text-primary" />
                <span className="font-semibold text-sm">Your Cart</span>
                <span className="font-mono text-[11px] text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                  {items.length} {items.length === 1 ? 'compound' : 'compounds'}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center gap-4">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground/20" />
                  <div>
                    <p className="text-sm text-muted-foreground">Your cart is empty</p>
                    <p className="font-mono text-[11px] text-muted-foreground/60 mt-1">Add compounds to begin</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3.5 px-4 rounded-xl border border-border bg-background/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product_name}</p>
                        <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
                          ${item.price.toFixed(2)} / unit
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                          className="p-1.5 hover:bg-accent rounded-lg transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-mono text-sm w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 hover:bg-accent rounded-lg transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onRemove(item.id)}
                          className="p-1.5 ml-1 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-border">
                {/* Free-shipping progress */}
                {total >= FREE_SHIP_THRESHOLD ? (
                  <div className="mb-4 flex items-center gap-1.5 text-[12px] font-medium text-emerald-600">
                    <Truck className="h-4 w-4" /> You've unlocked FREE shipping! 🎉
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="text-muted-foreground inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Add <span className="font-semibold text-foreground">${(FREE_SHIP_THRESHOLD - total).toFixed(2)}</span> for FREE shipping</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.min(100, (total / FREE_SHIP_THRESHOLD) * 100)}%` }} />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    Total
                  </span>
                  <span className="text-xl font-bold">${total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5 mb-4 text-[11px] text-emerald-600">
                  <Gift className="h-3.5 w-3.5" />
                  <span>Earn <span className="font-semibold">{Math.floor(total)} points</span> with this order</span>
                </div>
                <button
                  onClick={() => { onClose(); navigate('/checkout'); }}
                  className="w-full h-12 rounded-xl bg-primary text-white text-sm font-semibold tracking-wide hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  Proceed to Checkout
                </button>
                <p className="mt-3 font-mono text-[10px] text-muted-foreground text-center uppercase tracking-wider">
                  For Research Use Only
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}