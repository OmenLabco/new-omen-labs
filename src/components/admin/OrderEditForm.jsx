import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Tag } from 'lucide-react';
import { saveOrder } from '@/lib/adminApi';
import { downloadOrderLabel } from '@/lib/orderLabel';

const STATUSES = ['awaiting_payment', 'processing', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'refunded', 'cancelled'];
const CARRIERS = ['USPS', 'UPS', 'FedEx', 'DHL', 'Other'];

export default function OrderEditForm({ order, onSaved }) {
  const [form, setForm] = useState({
    status: order.status || 'processing',
    tracking_number: order.tracking_number || '',
    carrier: order.carrier || '',
    estimated_delivery: order.estimated_delivery || '',
    notes: order.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await saveOrder({
        id: order.id,
        status: form.status,
        tracking_number: form.tracking_number,
      });
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onSaved(updated || { ...order, ...form });
      }, 800);
    } catch (e) {
      setSaving(false);
      setError(e.message || 'Failed to save.');
    }
  };

  return (
    <div className="p-5 space-y-4 bg-card/40">
      {/* Company / research-use (compliance) */}
      {(order.company_name || order.company) && (
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-0.5">Company / Organization</span>
          <p className="text-sm font-medium">
            {order.company_name || '—'}
            {order.company && <span className="text-muted-foreground font-normal"> · {order.company}</span>}
          </p>
        </div>
      )}

      {/* Items summary */}
      {order.items?.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span>{item.product_name || item.name} × {item.quantity}</span>
              <span className="font-mono">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Status */}
        <div>
          <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">Status</label>
          <select
            value={form.status}
            onChange={e => set('status', e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {/* Carrier */}
        <div>
          <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">Carrier</label>
          <select
            value={form.carrier}
            onChange={e => set('carrier', e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select carrier</option>
            {CARRIERS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Tracking Number */}
        <div>
          <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">Tracking Number</label>
          <input
            type="text"
            value={form.tracking_number}
            onChange={e => set('tracking_number', e.target.value)}
            placeholder="e.g. 9400111899223396111111"
            className="w-full h-9 px-3 rounded-lg border border-border bg-background font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Est. Delivery */}
        <div>
          <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">Est. Delivery</label>
          <input
            type="text"
            value={form.estimated_delivery}
            onChange={e => set('estimated_delivery', e.target.value)}
            placeholder="e.g. June 10, 2026"
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={2}
          placeholder="Internal notes..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => downloadOrderLabel(order)}
          className="h-9 px-4 gap-2"
          title="Download a Niimbot packing label (PNG) for this order"
        >
          <Tag className="h-3.5 w-3.5" /> Label
        </Button>
        <Button onClick={handleSave} disabled={saving || saved} className="h-9 px-6 gap-2">
          {saved ? (
            <><Check className="h-3.5 w-3.5" /> Saved</>
          ) : saving ? (
            <div className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
          ) : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}