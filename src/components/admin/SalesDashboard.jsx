import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, ShoppingCart, Boxes, TrendingUp, Trophy, ChevronDown } from 'lucide-react';

const RANGES = [
  { key: '24h', label: '24 hours', days: 1 },
  { key: '7d', label: '7 days', days: 7 },
  { key: '31d', label: '31 days', days: 31 },
  { key: 'all', label: 'All time', days: null },
];

const money = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const compact = (n) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

// Statuses that count as a real sale (exclude cancelled/refunded if you add them later)
const isSale = (o) => o.status !== 'cancelled' && o.status !== 'refunded';

export default function SalesDashboard({ orders }) {
  const [range, setRange] = useState('7d');
  const [unitsOpen, setUnitsOpen] = useState(false);

  const stats = useMemo(() => {
    const now = Date.now();
    const cfg = RANGES.find((r) => r.key === range);
    const cutoff = cfg.days == null ? 0 : now - cfg.days * 86400000;

    const inRange = orders.filter((o) => {
      if (!isSale(o)) return false;
      const t = o.created_date ? new Date(o.created_date).getTime() : 0;
      return t >= cutoff;
    });

    let revenue = 0, units = 0;
    const productMap = new Map();
    for (const o of inRange) {
      revenue += Number(o.total || 0);
      const items = Array.isArray(o.items) ? o.items : [];
      for (const it of items) {
        const q = Number(it.quantity || 0);
        units += q;
        const name = it.name || it.product_name || 'Unknown';
        const cur = productMap.get(name) || { units: 0, revenue: 0 };
        cur.units += q;
        cur.revenue += Number(it.price || 0) * q;
        productMap.set(name, cur);
      }
    }
    const orderCount = inRange.length;
    const aov = orderCount ? revenue / orderCount : 0;

    const allProducts = [...productMap.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.units - a.units);
    const topProducts = allProducts.slice(0, 6);

    // Build a per-bucket time series for the chart
    const buckets = [];
    if (cfg.key === '24h') {
      for (let h = 23; h >= 0; h--) {
        const start = now - (h + 1) * 3600000;
        const end = now - h * 3600000;
        buckets.push({ label: new Date(end).toLocaleTimeString([], { hour: 'numeric' }), start, end, revenue: 0 });
      }
    } else {
      const days = cfg.days || 30;
      for (let d = days - 1; d >= 0; d--) {
        const dayStart = new Date(now - d * 86400000); dayStart.setHours(0, 0, 0, 0);
        const start = dayStart.getTime();
        const end = start + 86400000;
        buckets.push({ label: dayStart.toLocaleDateString([], { month: 'short', day: 'numeric' }), start, end, revenue: 0 });
      }
    }
    for (const o of inRange) {
      const t = o.created_date ? new Date(o.created_date).getTime() : 0;
      const b = buckets.find((bk) => t >= bk.start && t < bk.end);
      if (b) b.revenue += Number(o.total || 0);
    }
    const maxBar = Math.max(1, ...buckets.map((b) => b.revenue));

    // Lifetime totals (always all-time, regardless of range)
    const allSales = orders.filter(isSale);
    const lifetimeRevenue = allSales.reduce((s, o) => s + Number(o.total || 0), 0);
    const lifetimeUnits = allSales.reduce((s, o) => s + (Array.isArray(o.items) ? o.items.reduce((a, i) => a + Number(i.quantity || 0), 0) : 0), 0);

    return { revenue, orderCount, units, aov, topProducts, allProducts, buckets, maxBar, lifetimeRevenue, lifetimeUnits, lifetimeOrders: allSales.length };
  }, [orders, range]);

  const cfg = RANGES.find((r) => r.key === range);

  const KPIS = [
    { icon: DollarSign, label: `Revenue · ${cfg.label}`, value: money(stats.revenue), tint: 'text-emerald-500 bg-emerald-500/10' },
    { icon: ShoppingCart, label: `Orders · ${cfg.label}`, value: stats.orderCount.toLocaleString(), tint: 'text-primary bg-primary/10' },
    { icon: Boxes, label: `Units sold · ${cfg.label}`, value: stats.units.toLocaleString(), tint: 'text-violet-500 bg-violet-500/10', clickable: true },
    { icon: TrendingUp, label: 'Avg order value', value: money(stats.aov), tint: 'text-amber-500 bg-amber-500/10' },
  ];

  return (
    <div className="mb-8">
      {/* Range toggle */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground">Overview</h2>
        <div className="flex gap-1 rounded-xl border border-border p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 h-8 rounded-lg text-xs font-medium transition-colors ${range === r.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {KPIS.map((k, i) => {
          const interactive = k.clickable;
          const active = interactive && unitsOpen;
          return (
            <motion.button
              key={k.label}
              type="button"
              onClick={interactive ? () => setUnitsOpen((o) => !o) : undefined}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`text-left rounded-2xl border bg-card p-4 transition-colors ${interactive ? 'cursor-pointer hover:border-violet-400/50' : 'cursor-default'} ${active ? 'border-violet-400/60 ring-1 ring-violet-400/30' : 'border-border'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${k.tint}`}>
                  <k.icon className="h-4 w-4" />
                </div>
                {interactive && <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${active ? 'rotate-180' : ''}`} />}
              </div>
              <p className="text-2xl font-bold tracking-tight tabular-nums">{k.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{k.label}{interactive && <span className="text-violet-500"> · view breakdown</span>}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Units-per-peptide breakdown */}
      <AnimatePresence initial={false}>
        {unitsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-violet-400/40 bg-card p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-violet-500" />
                  <p className="text-sm font-semibold">Units per peptide · {cfg.label}</p>
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">{stats.units.toLocaleString()} units total</p>
              </div>
              {stats.allProducts.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No units sold in this period.</p>
              ) : (
                <div className="space-y-1.5">
                  {stats.allProducts.map((p, i) => {
                    const pct = stats.units ? (p.units / stats.units) * 100 : 0;
                    return (
                      <div key={p.name} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
                        <span className="font-mono text-[11px] text-muted-foreground w-5 shrink-0">{i + 1}</span>
                        <span className="text-sm font-medium flex-1 min-w-0 truncate">{p.name}</span>
                        <div className="hidden sm:block w-28 h-1.5 rounded-full bg-secondary overflow-hidden shrink-0">
                          <div className="h-full rounded-full bg-violet-500/70" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right shrink-0 tabular-nums">{pct.toFixed(0)}%</span>
                        <span className="text-sm font-bold w-20 text-right shrink-0 tabular-nums">{p.units.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">units</span></span>
                        <span className="hidden md:inline text-xs text-muted-foreground w-24 text-right shrink-0 tabular-nums">{compact(p.revenue)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-5 gap-3">
        {/* Sales chart */}
        <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold">Sales · {cfg.label}</p>
            <p className="text-xs text-muted-foreground">{money(stats.revenue)} total</p>
          </div>
          <div className="flex items-end gap-[3px] h-40">
            {stats.buckets.map((b, i) => (
              <div key={i} className="flex-1 group relative flex flex-col justify-end h-full">
                <div
                  className="w-full rounded-t bg-primary/80 group-hover:bg-primary transition-all min-h-[2px]"
                  style={{ height: `${(b.revenue / stats.maxBar) * 100}%` }}
                />
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-foreground text-background text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {b.label}: {compact(b.revenue)}
                </div>
              </div>
            ))}
          </div>
          {/* sparse x labels */}
          <div className="flex justify-between mt-2 text-[9px] font-mono text-muted-foreground">
            <span>{stats.buckets[0]?.label}</span>
            <span>{stats.buckets[Math.floor(stats.buckets.length / 2)]?.label}</span>
            <span>{stats.buckets[stats.buckets.length - 1]?.label}</span>
          </div>
        </div>

        {/* Top products */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-semibold">Top products · {cfg.label}</p>
          </div>
          {stats.topProducts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No sales in this period.</p>
          ) : (
            <div className="space-y-2.5">
              {stats.topProducts.map((p, i) => {
                const max = stats.topProducts[0].units || 1;
                return (
                  <div key={p.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium truncate pr-2">{i + 1}. {p.name}</span>
                      <span className="text-muted-foreground shrink-0 tabular-nums">{p.units}× · {compact(p.revenue)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${(p.units / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lifetime strip */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        {[
          { label: 'Lifetime revenue', value: money(stats.lifetimeRevenue) },
          { label: 'Lifetime orders', value: stats.lifetimeOrders.toLocaleString() },
          { label: 'Lifetime units sold', value: stats.lifetimeUnits.toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-secondary/40 p-4 text-center">
            <p className="text-lg font-bold tabular-nums">{s.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
