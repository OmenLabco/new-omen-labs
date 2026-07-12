import { useEffect, useState } from 'react';
import { Tag, Trash2, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchPromos, savePromo, deletePromo } from '@/lib/adminApi';

const blank = { code: '', pct: '', firstOrderOnly: false, active: true, expires: '', maxUses: '' };

export default function PromosView({ onLogout }) {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [busyCode, setBusyCode] = useState('');

  const load = () => fetchPromos()
    .then(setPromos)
    .catch((e) => (e.message === 'unauthorized' ? onLogout?.() : setError(e.message)))
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const create = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      await savePromo({
        code: form.code, pct: Number(form.pct), firstOrderOnly: form.firstOrderOnly, active: form.active,
        expiresAt: form.expires ? new Date(form.expires + 'T23:59:59').getTime() : null,
        maxUses: form.maxUses === '' ? null : Number(form.maxUses),
      });
      setForm(blank); await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const toggle = async (p) => {
    setBusyCode(p.code);
    try { await savePromo({ code: p.code, pct: p.pct, firstOrderOnly: !!p.first_order_only, active: !p.active, expiresAt: p.expires_at, maxUses: p.max_uses, label: p.label }); await load(); }
    catch (err) { setError(err.message); } finally { setBusyCode(''); }
  };

  const remove = async (code) => {
    if (!window.confirm(`Delete code ${code}?`)) return;
    setBusyCode(code);
    try { await deletePromo(code); setPromos((ps) => ps.filter((p) => p.code !== code)); }
    catch (err) { setError(err.message); } finally { setBusyCode(''); }
  };

  const fmtDate = (ms) => (ms ? new Date(ms).toLocaleDateString() : null);
  const expired = (p) => p.expires_at && Date.now() > p.expires_at;
  const maxed = (p) => p.max_uses != null && p.uses >= p.max_uses;

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" /></div>;

  const inputCls = 'h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <div className="space-y-6">
      {/* Create */}
      <form onSubmit={create} className="p-5 rounded-2xl border border-border bg-card">
        <p className="text-sm font-semibold mb-4 flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Create a code</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Code</label>
            <input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} required placeholder="SUMMER20" className={`${inputCls} w-full uppercase font-mono`} />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">% off</label>
            <input type="number" min="1" max="90" value={form.pct} onChange={(e) => set('pct', e.target.value)} required placeholder="20" className={`${inputCls} w-full`} />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Expires (optional)</label>
            <input type="date" value={form.expires} onChange={(e) => set('expires', e.target.value)} className={`${inputCls} w-full`} />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Max uses (optional)</label>
            <input type="number" min="1" value={form.maxUses} onChange={(e) => set('maxUses', e.target.value)} placeholder="∞" className={`${inputCls} w-full`} />
          </div>
        </div>
        <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
          <input type="checkbox" checked={form.firstOrderOnly} onChange={(e) => set('firstOrderOnly', e.target.checked)} className="h-4 w-4 accent-primary" />
          <span className="text-sm text-muted-foreground">First order only (new customers)</span>
        </label>
        {error && <p className="text-sm text-destructive mt-3">{error}</p>}
        <Button type="submit" disabled={busy} className="mt-4 h-10 px-5">{busy ? 'Saving…' : 'Create code'}</Button>
      </form>

      {/* List */}
      {promos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No promo codes yet. WELCOME10 works by default until you override it.</div>
      ) : (
        <div className="space-y-2">
          {promos.map((p) => {
            const dead = !p.active || expired(p) || maxed(p);
            return (
              <div key={p.code} className={`flex items-center justify-between gap-4 p-4 rounded-2xl border ${dead ? 'border-border bg-secondary/20 opacity-70' : 'border-border'}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold">{p.code}</span>
                    <span className="text-sm font-bold text-primary">{p.pct}% off</span>
                    {!!p.first_order_only && <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-500">1st order</span>}
                    {expired(p) && <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500">Expired</span>}
                    {maxed(p) && <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600">Maxed</span>}
                    {!p.active && <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Off</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Used {p.uses}{p.max_uses != null ? ` / ${p.max_uses}` : ''}{fmtDate(p.expires_at) ? ` · expires ${fmtDate(p.expires_at)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant={p.active ? 'outline' : 'default'} onClick={() => toggle(p)} disabled={busyCode === p.code} className="h-8 px-3 text-xs">
                    {busyCode === p.code ? '…' : p.active ? 'Disable' : 'Enable'}
                  </Button>
                  <button onClick={() => remove(p.code)} disabled={busyCode === p.code} aria-label="Delete" className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors disabled:opacity-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
