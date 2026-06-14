import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronDown, ChevronUp, Search, Lock, LogOut, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OrderEditForm from '@/components/admin/OrderEditForm';
import SalesDashboard from '@/components/admin/SalesDashboard';
import { adminAuth, adminLogin, fetchOrders, fetchAffiliates, fetchCustomers, setCustomerMembership, deleteCustomer } from '@/lib/adminApi';

const STATUS_COLORS = {
  processing: 'text-yellow-400 bg-yellow-400/10',
  confirmed: 'text-blue-400 bg-blue-400/10',
  shipped: 'text-purple-400 bg-purple-400/10',
  out_for_delivery: 'text-orange-400 bg-orange-400/10',
  delivered: 'text-green-400 bg-green-400/10',
};

function LoginScreen({ onSuccess }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(true);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const ok = await adminLogin(pw, remember);
    setBusy(false);
    if (ok) onSuccess();
    else setError('Incorrect password.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border bg-card p-8">
        <div className="flex justify-center mb-5">
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Lock className="h-5 w-5 text-primary" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-center mb-1">Admin Access</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Enter your admin password to continue.</p>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-primary" />
          <span className="text-sm text-muted-foreground">Remember me on this device</span>
        </label>
        <Button type="submit" disabled={busy} className="w-full h-11 mt-5">
          {busy ? 'Checking…' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
}

function AffiliatesView({ onLogout }) {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAffiliates()
      .then(setAffiliates)
      .catch((e) => (e.message === 'unauthorized' ? onLogout() : setError(e.message)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" /></div>;
  if (error) return <p className="text-destructive text-sm">{error}</p>;
  if (affiliates.length === 0) return <div className="text-center py-16 text-muted-foreground text-sm">No affiliates yet.</div>;

  const tierOf = (n) => (n >= 30 ? 'Platinum' : n >= 10 ? 'Gold' : 'Silver');

  return (
    <div className="space-y-2">
      {affiliates.map((a) => (
        <div key={a.code} className="flex items-center justify-between p-4 rounded-2xl border border-border">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-sm">{a.code}</span>
              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">{tierOf(a.order_count)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.name} · {a.email}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono text-sm font-semibold text-emerald-500">${Number(a.total_commission || 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{a.order_count} sales · ${Number(a.total_sales || 0).toFixed(2)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomersView({ onLogout }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    fetchCustomers()
      .then(setCustomers)
      .catch((e) => (e.message === 'unauthorized' ? onLogout() : setError(e.message)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" /></div>;
  if (error) return <p className="text-destructive text-sm">{error}</p>;
  if (customers.length === 0) return <div className="text-center py-16 text-muted-foreground text-sm">No customer accounts yet.</div>;

  const toggleVip = async (email, makeVip) => {
    setBusy(email);
    try {
      await setCustomerMembership(email, makeVip);
      setCustomers((prev) => prev.map((c) => (c.email === email ? { ...c, isVip: makeVip } : c)));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  const removeCustomer = async (email, name) => {
    if (!window.confirm(`Permanently delete ${name || email}? This cannot be undone.`)) return;
    setBusy(email);
    try {
      await deleteCustomer(email);
      setCustomers((prev) => prev.filter((c) => c.email !== email));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-2">
      {customers.map((c) => (
        <div key={c.email} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate">{c.name}</span>
              {c.isVip && <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500">VIP</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{c.points} pts · {c.order_count} orders · ${Number(c.lifetime_spend || 0).toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant={c.isVip ? 'outline' : 'default'}
              onClick={() => toggleVip(c.email, !c.isVip)}
              disabled={busy === c.email}
              className="h-8 px-3 text-xs"
            >
              {busy === c.email ? '…' : c.isVip ? 'Remove VIP' : 'Make VIP'}
            </Button>
            <button
              onClick={() => removeCustomer(c.email, c.name)}
              disabled={busy === c.email}
              aria-label="Delete customer"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminOrders() {
  const [authed, setAuthed] = useState(!!adminAuth.get());
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setOrders(await fetchOrders());
    } catch (e) {
      if (e.message === 'unauthorized') {
        setAuthed(false);
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) load();
  }, [authed]);

  const logout = () => {
    adminAuth.clear();
    setAuthed(false);
    setOrders([]);
  };

  if (!authed) return <LoginScreen onSuccess={() => setAuthed(true)} />;

  const filtered = orders.filter(
    (o) =>
      !search ||
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Admin</span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{tab === 'orders' ? 'Orders' : tab === 'affiliates' ? 'Affiliates' : 'Customers'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{tab === 'orders' ? `${orders.length} total orders` : tab === 'affiliates' ? 'Affiliate partners' : 'Reward members'}</p>
          </div>
          <Button variant="outline" onClick={logout} className="gap-2 h-9">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 rounded-xl border border-border p-1 w-fit">
          {['orders', 'affiliates', 'customers'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 h-9 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'affiliates' ? (
          <AffiliatesView onLogout={logout} />
        ) : tab === 'customers' ? (
          <CustomersView onLogout={logout} />
        ) : (
        <>
        {/* Sales dashboard */}
        {!loading && orders.length > 0 && <SalesDashboard orders={orders} />}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number, name, or email..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

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
            {filtered.map((order) => {
              const isOpen = expandedId === order.id;
              return (
                <div key={order.id} className="rounded-2xl border border-border overflow-hidden">
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
                      <p className="text-xs text-muted-foreground">{order.created_date ? new Date(order.created_date).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}</p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                  </button>

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
                            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
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
        </>
        )}
      </div>
    </div>
  );
}
