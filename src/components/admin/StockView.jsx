import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, Boxes, AlertTriangle, Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PRODUCTS } from '@/data/products';
import { fetchStock, saveStock } from '@/lib/adminApi';

const skuOf = (product, dose) => `${product.id}_${dose}`;
// Only real, sellable products (skip the internal test item).
const CATALOG = PRODUCTS.filter((p) => p.id !== 'test-item');

function statusFor(val, low) {
  if (val === '' || val == null) return { label: 'Not set', cls: 'text-muted-foreground bg-secondary' };
  const n = Number(val);
  if (n <= 0) return { label: 'Sold out', cls: 'text-red-600 bg-red-500/10' };
  if (n < low) return { label: 'Low stock', cls: 'text-amber-600 bg-amber-500/10' };
  return { label: 'In stock', cls: 'text-emerald-600 bg-emerald-500/10' };
}

export default function StockView({ onLogout }) {
  const [low, setLow] = useState(9);
  const [orig, setOrig] = useState({});      // sku -> count (only tracked)
  const [counts, setCounts] = useState({});  // sku -> string
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    fetchStock()
      .then((d) => {
        const stock = d.stock || {};
        setLow(d.lowStock || 9);
        setOrig(stock);
        const init = {};
        for (const p of CATALOG) for (const v of p.variants) {
          const sku = skuOf(p, v.dose);
          init[sku] = sku in stock ? String(stock[sku]) : '';
        }
        setCounts(init);
      })
      .catch((e) => (e.message === 'unauthorized' ? onLogout?.() : setError(e.message)))
      .finally(() => setLoading(false));
  }, []);

  const set = (sku, val) => { setCounts((c) => ({ ...c, [sku]: val })); setOk(''); };
  const step = (sku, d) => set(sku, String(Math.max(0, (Number(counts[sku] || 0)) + d)));

  const dirty = useMemo(() => {
    const changed = [];
    for (const [sku, val] of Object.entries(counts)) {
      const was = sku in orig ? String(orig[sku]) : '';
      if (val !== was && val !== '') changed.push({ sku, count: Math.max(0, Math.floor(Number(val) || 0)) });
    }
    return changed;
  }, [counts, orig]);

  const summary = useMemo(() => {
    let lowN = 0, out = 0, tracked = 0;
    for (const val of Object.values(counts)) {
      if (val === '') continue;
      tracked++;
      const n = Number(val);
      if (n <= 0) out++; else if (n < low) lowN++;
    }
    return { lowN, out, tracked };
  }, [counts, low]);

  const save = async () => {
    if (!dirty.length) return;
    setSaving(true); setError(''); setOk('');
    try {
      const d = await saveStock(dirty);
      setOrig(d.stock || {});
      setOk(`Saved ${dirty.length} update${dirty.length === 1 ? '' : 's'}.`);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" /></div>;
  if (error && !counts) return <p className="text-destructive text-sm">{error}</p>;

  const query = q.trim().toLowerCase();
  const shown = query ? CATALOG.filter((p) => p.name.toLowerCase().includes(query)) : CATALOG;

  return (
    <div className="pb-24">
      {/* summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: Boxes, label: 'Tracked SKUs', value: summary.tracked, tint: 'text-primary bg-primary/10' },
          { icon: AlertTriangle, label: 'Low stock', value: summary.lowN, tint: 'text-amber-500 bg-amber-500/10' },
          { icon: AlertTriangle, label: 'Sold out', value: summary.out, tint: 'text-red-500 bg-red-500/10' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${s.tint}`}><s.icon className="h-4 w-4" /></div>
            <p className="text-2xl font-bold tabular-nums leading-none">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…"
          className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <p className="text-xs text-muted-foreground mb-5">Set the number of vials on hand for each dose. Under {low} shows a <span className="text-amber-600 font-medium">Low stock</span> badge on the store, and paid orders subtract automatically.</p>

      <div className="space-y-4">
        {shown.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="font-semibold text-sm">{p.name}</span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{p.category}</span>
            </div>
            <div className="divide-y divide-border">
              {p.variants.map((v) => {
                const sku = skuOf(p, v.dose);
                const val = counts[sku] ?? '';
                const st = statusFor(val, low);
                return (
                  <div key={sku} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-16 shrink-0">
                      <span className="text-sm font-semibold">{v.dose}</span>
                    </div>
                    <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                    <div className="flex-1" />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button type="button" onClick={() => step(sku, -1)} className="h-8 w-8 rounded-lg border border-border inline-flex items-center justify-center hover:bg-accent transition-colors"><Minus className="h-3.5 w-3.5" /></button>
                      <input
                        type="number" min="0" inputMode="numeric"
                        value={val}
                        onChange={(e) => set(sku, e.target.value)}
                        placeholder="—"
                        className="w-20 h-8 text-center rounded-lg border border-border bg-background text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button type="button" onClick={() => step(sku, 1)} className="h-8 w-8 rounded-lg border border-border inline-flex items-center justify-center hover:bg-accent transition-colors"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* sticky save bar */}
      {(dirty.length > 0 || ok) && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full border border-border bg-card/95 backdrop-blur px-4 py-2.5 shadow-2xl">
          {ok && !dirty.length ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600"><Check className="h-4 w-4" /> {ok}</span>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">{dirty.length} unsaved change{dirty.length === 1 ? '' : 's'}</span>
              <Button onClick={save} disabled={saving} className="h-9 px-4">{saving ? 'Saving…' : 'Save changes'}</Button>
            </>
          )}
        </div>
      )}
      {error && <p className="text-destructive text-sm mt-3">{error}</p>}
    </div>
  );
}
