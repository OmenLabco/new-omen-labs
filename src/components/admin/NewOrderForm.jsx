import { useState } from 'react';
import { PRODUCTS } from '@/data/products';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, X } from 'lucide-react';
import { createOrder } from '@/lib/adminApi';

const SELLABLE = PRODUCTS.filter((p) => p.slug !== 'test-item' && p.variants && p.variants.length);
const SHIP = [
  { id: 'pickup', label: 'Local Pickup — Free' },
  { id: 'ground', label: '3–5 Day Ground — $9.99' },
  { id: 'first', label: '2-Day First Class — $14.99' },
];
const PAY = ['Cash App', 'Zelle', 'Crypto', 'Cash', 'Other'];
const priceOf = (p, dose) => (p.variants.find((v) => v.dose === dose)?.price) || 0;

export default function NewOrderForm({ onClose, onCreated }) {
  const [c, setC] = useState({ name: '', email: '', phone: '' });
  const [addr, setAddr] = useState({ address: '', city: '', state: '', zip: '' });
  const [rows, setRows] = useState([{ pid: SELLABLE[0]?.id || '', dose: SELLABLE[0]?.variants[0]?.dose || '', qty: 1 }]);
  const [ship, setShip] = useState('pickup');
  const [payment, setPayment] = useState('Cash App');
  const [paid, setPaid] = useState(true);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const prodOf = (pid) => SELLABLE.find((p) => p.id === pid);
  const setRow = (i, patch) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, { pid: SELLABLE[0]?.id || '', dose: SELLABLE[0]?.variants[0]?.dose || '', qty: 1 }]);
  const rmRow = (i) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const shipCost = ship === 'ground' ? 9.99 : ship === 'first' ? 14.99 : 0;
  const subtotal = rows.reduce((s, r) => { const p = prodOf(r.pid); return s + (p ? priceOf(p, r.dose) * (Number(r.qty) || 0) : 0); }, 0);
  const total = subtotal + shipCost;

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const items = rows.filter((r) => r.pid && r.dose).map((r) => {
        const p = prodOf(r.pid);
        return { product_id: `${r.pid}_${r.dose}`, product_name: `${p.name} ${r.dose}`, quantity: Number(r.qty) || 1 };
      });
      if (!items.length) throw new Error('Add at least one item.');
      const res = await createOrder({ customer: { ...c, ...addr }, items, shipping_method: ship, payment_method: payment, paid, notes });
      onCreated(res);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const cls = 'h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
  const lbl = 'block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1';

  return (
    <div className="mb-6 rounded-2xl border border-primary/25 bg-primary/[0.03] p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold">New manual order</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className={lbl}>Customer name *</label><input required value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} className={`${cls} w-full`} /></div>
          <div><label className={lbl}>Email</label><input type="email" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} className={`${cls} w-full`} /></div>
          <div><label className={lbl}>Phone</label><input value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} className={`${cls} w-full`} /></div>
        </div>

        {/* items */}
        <div>
          <label className={lbl}>Items</label>
          <div className="space-y-2">
            {rows.map((r, i) => {
              const p = prodOf(r.pid);
              return (
                <div key={i} className="flex gap-2">
                  <select value={r.pid} onChange={(e) => { const np = prodOf(e.target.value); setRow(i, { pid: e.target.value, dose: np?.variants[0]?.dose || '' }); }} className={`${cls} flex-1 min-w-0`}>
                    {SELLABLE.map((pp) => <option key={pp.id} value={pp.id}>{pp.name}</option>)}
                  </select>
                  <select value={r.dose} onChange={(e) => setRow(i, { dose: e.target.value })} className={`${cls} w-28`}>
                    {(p?.variants || []).map((v) => <option key={v.dose} value={v.dose}>{v.dose}{v.price != null ? ` · $${v.price}` : ''}</option>)}
                  </select>
                  <input type="number" min="1" value={r.qty} onChange={(e) => setRow(i, { qty: e.target.value })} className={`${cls} w-16 text-center`} />
                  <button type="button" onClick={() => rmRow(i)} disabled={rows.length === 1} className="h-10 w-10 shrink-0 rounded-lg border border-border inline-flex items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={addRow} className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary font-medium"><Plus className="h-3.5 w-3.5" /> Add item</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className={lbl}>Shipping</label><select value={ship} onChange={(e) => setShip(e.target.value)} className={`${cls} w-full`}>{SHIP.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
          <div><label className={lbl}>Payment</label><select value={payment} onChange={(e) => setPayment(e.target.value)} className={`${cls} w-full`}>{PAY.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
          <div className="flex items-end"><label className="flex items-center gap-2 h-10 cursor-pointer select-none"><input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="h-4 w-4 accent-primary" /><span className="text-sm">Paid (subtract stock)</span></label></div>
        </div>

        {ship !== 'pickup' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2"><label className={lbl}>Address</label><input value={addr.address} onChange={(e) => setAddr({ ...addr, address: e.target.value })} className={`${cls} w-full`} /></div>
            <div><label className={lbl}>City</label><input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className={`${cls} w-full`} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={lbl}>State</label><input value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} className={`${cls} w-full`} /></div>
              <div><label className={lbl}>ZIP</label><input value={addr.zip} onChange={(e) => setAddr({ ...addr, zip: e.target.value })} className={`${cls} w-full`} /></div>
            </div>
          </div>
        )}

        <div><label className={lbl}>Notes</label><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. IG DM sale" className={`${cls} w-full`} /></div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-muted-foreground">Total <span className="text-foreground font-bold text-base">${total.toFixed(2)}</span></span>
          <Button type="submit" disabled={busy} className="h-10 px-6">{busy ? 'Creating…' : 'Create order'}</Button>
        </div>
      </form>
    </div>
  );
}
