import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Wallet, Percent } from 'lucide-react';
import { COST_SHEET, costForItem } from '@/data/costs';

const RANGES = [
  { key: '24h', label: '24 hours', days: 1 },
  { key: '7d', label: '7 days', days: 7 },
  { key: '31d', label: '31 days', days: 31 },
  { key: 'all', label: 'All time', days: null },
];

const money = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const isSale = (o) => o.status !== 'cancelled' && o.status !== 'refunded';

// Wraps sensitive values so they can be blurred when "Privacy" is on.
const Mask = ({ on, children }) => (
  <span className={on ? 'blur-[6px] select-none pointer-events-none' : ''}>{children}</span>
);

export default function ProfitView({ orders, privacy = false }) {
  const [range, setRange] = useState('7d');

  const data = useMemo(() => {
    const now = Date.now();
    const cfg = RANGES.find((r) => r.key === range);
    const cutoff = cfg.days == null ? 0 : now - cfg.days * 86400000;

    const inRange = orders.filter((o) => {
      if (!isSale(o)) return false;
      const t = o.created_date ? new Date(o.created_date).getTime() : 0;
      return t >= cutoff;
    });

    const map = new Map(); // name -> { units, revenue, cost, costed, uncosted }
    let revenue = 0, cost = 0, costedUnits = 0, uncostedUnits = 0;

    for (const o of inRange) {
      const items = Array.isArray(o.items) ? o.items : [];
      for (const it of items) {
        const q = Number(it.quantity || 0);
        const lineRev = Number(it.price || 0) * q; // peptide price only — no shipping
        const unitCost = costForItem(it); // null if not set
        const name = it.product_name || it.name || 'Unknown';

        revenue += lineRev;
        const cur = map.get(name) || { units: 0, revenue: 0, cost: 0, hasCost: unitCost != null };
        cur.units += q;
        cur.revenue += lineRev;
        if (unitCost != null) {
          cur.cost += unitCost * q;
          cost += unitCost * q;
          costedUnits += q;
          cur.hasCost = true;
        } else {
          uncostedUnits += q;
        }
        map.set(name, cur);
      }
    }

    const profit = revenue - cost;
    const margin = revenue ? (profit / revenue) * 100 : 0;

    const rows = [...map.entries()]
      .map(([name, v]) => ({ name, ...v, profit: v.revenue - v.cost }))
      .sort((a, b) => b.profit - a.profit);

    return { revenue, cost, profit, margin, rows, uncostedUnits, costedUnits, orderCount: inRange.length };
  }, [orders, range]);

  const cfg = RANGES.find((r) => r.key === range);

  const KPIS = [
    { icon: DollarSign, label: `Peptide revenue · ${cfg.label}`, value: money(data.revenue), tint: 'text-emerald-500 bg-emerald-500/10', note: 'excludes shipping' },
    { icon: Wallet, label: `My cost · ${cfg.label}`, value: money(data.cost), tint: 'text-rose-500 bg-rose-500/10', note: 'cost per vial sold', sensitive: true },
    { icon: TrendingUp, label: `Profit · ${cfg.label}`, value: money(data.profit), tint: 'text-primary bg-primary/10', note: 'revenue − cost', sensitive: true },
    { icon: Percent, label: 'Margin', value: `${data.margin.toFixed(1)}%`, tint: 'text-amber-500 bg-amber-500/10', note: 'profit / revenue', sensitive: true },
  ];

  return (
    <div>
      {/* Range toggle */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground">Profit · peptides only</h2>
        <div className="flex gap-1 rounded-xl border border-border p-1">
          {RANGES.map((r) => (
            <button key={r.key} onClick={() => setRange(r.key)}
              className={`px-3 h-8 rounded-lg text-xs font-medium transition-colors ${range === r.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {KPIS.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-4">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${k.tint}`}>
              <k.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold tracking-tight tabular-nums"><Mask on={privacy && k.sensitive}>{k.value}</Mask></p>
            <p className="text-[11px] text-muted-foreground mt-1">{k.label}</p>
            <p className="text-[10px] text-muted-foreground/70">{k.note}</p>
          </motion.div>
        ))}
      </div>

      {data.uncostedUnits > 0 && (
        <p className="text-[11px] text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-5">
          {data.uncostedUnits} unit{data.uncostedUnits === 1 ? '' : 's'} sold have no cost set — excluded from cost/profit. Add their cost in <span className="font-mono">src/data/costs.js</span>.
        </p>
      )}

      {/* Per-peptide profit breakdown */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <p className="text-sm font-semibold mb-4">Profit by peptide · {cfg.label}</p>
        {data.rows.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No sales in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="text-left font-medium pb-2">Peptide</th>
                  <th className="text-right font-medium pb-2">Units</th>
                  <th className="text-right font-medium pb-2">Revenue</th>
                  <th className="text-right font-medium pb-2">My cost</th>
                  <th className="text-right font-medium pb-2">Profit</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.name} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 font-medium pr-3">{r.name}{!r.hasCost && <span className="ml-2 text-[10px] text-amber-600">no cost set</span>}</td>
                    <td className="py-2.5 text-right tabular-nums">{r.units.toLocaleString()}</td>
                    <td className="py-2.5 text-right tabular-nums">{money(r.revenue)}</td>
                    <td className="py-2.5 text-right tabular-nums text-rose-500"><Mask on={privacy}>{r.hasCost ? money(r.cost) : '—'}</Mask></td>
                    <td className="py-2.5 text-right tabular-nums font-semibold text-emerald-600"><Mask on={privacy}>{r.hasCost ? money(r.profit) : '—'}</Mask></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-bold">
                  <td className="pt-3">Total</td>
                  <td className="pt-3 text-right tabular-nums">{data.rows.reduce((s, r) => s + r.units, 0).toLocaleString()}</td>
                  <td className="pt-3 text-right tabular-nums">{money(data.revenue)}</td>
                  <td className="pt-3 text-right tabular-nums text-rose-500"><Mask on={privacy}>{money(data.cost)}</Mask></td>
                  <td className="pt-3 text-right tabular-nums text-emerald-600"><Mask on={privacy}>{money(data.profit)}</Mask></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Cost sheet (spreadsheet) */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold">Cost sheet — my cost per vial</p>
          <p className="text-[11px] text-muted-foreground">Edit in src/data/costs.js</p>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">Sell price vs. my wholesale cost, and the margin on each vial.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="text-left font-medium pb-2">Peptide</th>
                <th className="text-left font-medium pb-2">Dose</th>
                <th className="text-right font-medium pb-2">Sell price</th>
                <th className="text-right font-medium pb-2">My cost</th>
                <th className="text-right font-medium pb-2">Profit / vial</th>
              </tr>
            </thead>
            <tbody>
              {COST_SHEET.map((row) => {
                const perVial = row.sellPrice != null && row.cost != null ? row.sellPrice - row.cost : null;
                return (
                  <tr key={row.productId} className="border-b border-border/50 last:border-0">
                    <td className="py-2 font-medium pr-3">{row.name}</td>
                    <td className="py-2 text-muted-foreground">{row.dose}</td>
                    <td className="py-2 text-right tabular-nums"><Mask on={privacy}>{row.sellPrice != null ? money(row.sellPrice) : '—'}</Mask></td>
                    <td className="py-2 text-right tabular-nums text-rose-500"><Mask on={privacy}>{row.cost != null ? money(row.cost) : <span className="text-muted-foreground/60">not set</span>}</Mask></td>
                    <td className="py-2 text-right tabular-nums font-semibold text-emerald-600"><Mask on={privacy}>{perVial != null ? money(perVial) : '—'}</Mask></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
