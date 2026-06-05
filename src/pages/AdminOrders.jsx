import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronDown, ChevronUp, Search } from 'lucide-react';
// TODO: connect to your order database when payment processor is set up
import { Button } from '@/components/ui/button';
import OrderEditForm from '@/components/admin/OrderEditForm';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchOrders = async () => {
    // TODO: fetch orders from your payment processor / database
    const results = [];
    setOrders(results);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter(o =>
    !search ||
    o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_email?.toLowerCase().includes(search.toLowerCase())
  );

  const STATUS_COLORS = {
    processing: 'text-yellow-400 bg-yellow-400/10',
    confirmed: 'text-blue-400 bg-blue-400/10',
    shipped: 'text-purple-400 bg-purple-400/10',
    out_for_delivery: 'text-orange-400 bg-orange-400/10',
    delivered: 'text-green-400 bg-green-400/10',
  };

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Admin</span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">{orders.length} total orders</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order number, name, or email..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No orders found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(order => {
              const isOpen = expandedId === order.id;
              return (
                <div key={order.id} className="rounded-2xl border border-border overflow-hidden">
                  {/* Row */}
                  <button
                    onClick={() => setExpandedId(isOpen ? null : order.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-accent/40 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold text-sm">{order.order_number}</span>
                        <span className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || 'text-muted-foreground bg-muted'}`}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground truncate">{order.customer_name || '—'}</span>
                        <span className="text-xs text-muted-foreground truncate">{order.customer_email || '—'}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-mono text-sm font-semibold">${order.total?.toFixed(2) || '—'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.created_date).toLocaleDateString()}</p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                  </button>

                  {/* Expanded Edit Form */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-border"
                      >
                        <OrderEditForm
                          order={order}
                          onSaved={(updated) => {
                            setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
                            setExpandedId(null);
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}