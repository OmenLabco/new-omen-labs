import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Tag, Copy, MapPin } from 'lucide-react';
import { saveOrder } from '@/lib/adminApi';
import { downloadOrderLabel } from '@/lib/orderLabel';

const STATUSES = ['awaiting_payment', 'processing', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'refunded', 'cancelled'];
const CARRIERS = ['USPS', 'UPS', 'FedEx', 'DHL', 'Other'];
const LABEL = 'font-mono text-[10px] uppercase tracking-wider text-muted-foreground';

export default function OrderEditForm({ order, onSaved }) {
  const [form, setForm] = useState({
    status: order.status || 'processing',
    tracking_number: order.tracking_number || '',
    carrier: order.carrier || '',
    notes: order.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const cityLine = [order.city, order.state, order.zip].filter(Boolean).join(', ').replace(/, (\S+)$/, ' $1');
  const hasAddress = !!(order.address || order.city || order.zip);
  const addressLines = [
    order.customer_name,
    order.company_name,
    order.address + (order.address2 ? `, ${order.address2}` : ''),
    cityLine,
    order.country,
  ].filter((l) => l && l.trim());

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(addressLines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked */ }
  };

  const itemsTotal = (order.items || []).reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);

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
    <div className="p-4 sm:p-5 space-y-4 bg-card/40">
      {/* Ship-to / contact */}
      <div className="rounded-xl border border-border bg-background/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className={`${LABEL} flex items-center gap-1.5 mb-1.5`}><MapPin className="h-3 w-3" /> {hasAddress ? 'Ship to' : 'Customer'}</span>
            {addressLines.length > 0 ? (
              <div className="text-sm leading-relaxed">
                <p className="font-semibold">{order.customer_name || '—'}</p>
                {(order.company_name || order.company) && (
                  <p className="text-xs text-muted-foreground">{order.company_name}{order.company ? ` · ${order.company}` : ''}</p>
                )}
                {hasAddress && (
                  <p className="text-muted-foreground mt-1">
                    {order.address}{order.address2 ? `, ${order.address2}` : ''}<br />
                    {cityLine}{order.country ? <><br />{order.country}</> : null}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Local pickup — no shipping address</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
              {order.customer_email && <a href={`mailto:${order.customer_email}`} className="text-primary hover:underline break-all">{order.customer_email}</a>}
              {order.customer_phone && <a href={`tel:${order.customer_phone}`} className="text-primary hover:underline">{order.customer_phone}</a>}
            </div>
          </div>
          {hasAddress && (
            <button
              type="button"
              onClick={copyAddress}
              className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs font-medium hover:bg-accent transition-colors"
              title="Copy the shipping address"
            >
              {copied ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      {order.items?.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className={`${LABEL} px-4 pt-3 pb-2`}>Items</div>
          <div className="divide-y divide-border">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="truncate pr-3">{item.product_name || item.name} <span className="text-muted-foreground">× {item.quantity}</span></span>
                <span className="font-mono text-sm shrink-0">${((Number(item.price) || 0) * (Number(item.quantity) || 0)).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-secondary/30">
            <span className={LABEL}>Order total</span>
            <span className="font-semibold text-sm">${Number(order.total ?? itemsTotal).toFixed(2)}{order.payment_method ? <span className="text-muted-foreground font-normal font-mono text-[11px]"> · {order.payment_method}</span> : null}</span>
          </div>
        </div>
      )}

      {/* Fulfillment */}
      <div>
        <div className={`${LABEL} mb-2`}>Fulfillment</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`${LABEL} block mb-1.5`}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className={`${LABEL} block mb-1.5`}>Carrier</label>
            <select value={form.carrier} onChange={e => set('carrier', e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select carrier</option>
              {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className={`${LABEL} block mb-1.5`}>Tracking Number</label>
            <input type="text" value={form.tracking_number} onChange={e => set('tracking_number', e.target.value)}
              placeholder="e.g. 9400 1118 9922 3396 …"
              className="w-full h-9 px-3 rounded-lg border border-border bg-background font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={`${LABEL} block mb-1.5`}>Notes</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
          placeholder="Internal notes…"
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between items-center gap-2">
        <Button type="button" variant="outline" onClick={() => downloadOrderLabel(order)} className="h-9 px-4 gap-2"
          title="Download a Niimbot packing label (PNG) for this order">
          <Tag className="h-3.5 w-3.5" /> Label
        </Button>
        <Button onClick={handleSave} disabled={saving || saved} className="h-9 px-6 gap-2">
          {saved ? <><Check className="h-3.5 w-3.5" /> Saved</> : saving ? (
            <div className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
          ) : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
