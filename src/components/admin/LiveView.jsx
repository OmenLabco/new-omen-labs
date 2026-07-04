import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ShoppingCart, CreditCard, Eye, Radio, Activity, Globe as GlobeIcon, MapPin, Package } from 'lucide-react';
import { fetchLive } from '@/lib/adminApi';
import VisitorGlobe from './VisitorGlobe';

const STATE_BADGE = {
  checkout: { label: 'Checking out', cls: 'text-emerald-600 bg-emerald-500/12' },
  product: { label: 'Viewing product', cls: 'text-primary bg-primary/12' },
  browsing: { label: 'Browsing', cls: 'text-muted-foreground bg-secondary' },
};

// ISO alpha-2 -> flag emoji + English country name (both built into the browser).
let REGION_NAMES;
try { REGION_NAMES = new Intl.DisplayNames(['en'], { type: 'region' }); } catch { REGION_NAMES = null; }
const countryName = (cc) => { if (!cc) return 'Unknown'; try { return REGION_NAMES?.of(cc) || cc; } catch { return cc; } };
const flagEmoji = (cc) => {
  if (!cc || cc.length !== 2) return '🌐';
  const A = 0x1f1e6;
  const u = cc.toUpperCase();
  return String.fromCodePoint(A + u.charCodeAt(0) - 65, A + u.charCodeAt(1) - 65);
};

export default function LiveView({ onLogout }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [pulse, setPulse] = useState(0);
  const timer = useRef(null);

  const load = async () => {
    try {
      const d = await fetchLive();
      setData(d);
      setPulse((p) => p + 1);
    } catch (e) {
      if (e.message === 'unauthorized') onLogout?.();
      else setErr(e.message);
    }
  };

  useEffect(() => {
    load();
    timer.current = setInterval(load, 5000);
    return () => clearInterval(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (err) return <p className="text-destructive text-sm">{err}</p>;
  if (!data) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" /></div>;

  const { online = 0, carts = 0, checkingOut = 0, viewingProduct = 0, itemsInCarts = 0, pages = [], sessions = [], products = [], locations = [], countries = [] } = data;
  const maxPage = Math.max(1, ...pages.map((p) => p.count));
  const maxProduct = Math.max(1, ...products.map((p) => p.count));

  // Globe dots: one per active place, with a hover label.
  const globePoints = locations.map((l) => {
    const place = l.city || l.region || countryName(l.country);
    const label = l.city && l.country ? `${l.city}, ${countryName(l.country)}` : (place || 'Unknown');
    return { key: `${l.city || ''}|${l.country || ''}|${l.lat},${l.lon}`, lat: l.lat, lon: l.lon, label, count: l.count };
  });
  const maxCountry = Math.max(1, ...countries.map((c) => c.count));
  const geoKnown = countries.reduce((s, c) => s + c.count, 0);

  const stats = [
    { icon: ShoppingCart, label: 'Active carts', value: carts, tint: 'text-primary bg-primary/10' },
    { icon: CreditCard, label: 'Checking out', value: checkingOut, tint: 'text-emerald-500 bg-emerald-500/10' },
    { icon: Eye, label: 'Viewing a product', value: viewingProduct, tint: 'text-violet-500 bg-violet-500/10' },
    { icon: Activity, label: 'Items in carts', value: itemsInCarts, tint: 'text-amber-500 bg-amber-500/10' },
  ];

  return (
    <div>
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground">Live · updates every 5s</span>
        </div>
        <Radio className="h-4 w-4 text-emerald-500" />
      </div>

      {/* hero — visitors online */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/25 p-6 sm:p-8 mb-4"
        style={{ background: 'linear-gradient(135deg, #0a0a0b 0%, #12183a 60%, #1746c7 140%)' }}>
        <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative flex items-center gap-5">
          <div className="relative shrink-0">
            <span className="absolute inset-0 rounded-2xl bg-primary/30 animate-ping" style={{ animationDuration: '2.2s' }} />
            <div className="relative h-16 w-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Users className="h-7 w-7 text-white" />
            </div>
          </div>
          <div>
            <AnimatePresence mode="popLayout">
              <motion.p key={`${online}-${pulse}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="text-5xl sm:text-6xl font-extrabold text-white tabular-nums leading-none">
                {online}
              </motion.p>
            </AnimatePresence>
            <p className="mt-2 text-sm text-white/70">{online === 1 ? 'visitor' : 'visitors'} on your site right now</p>
          </div>
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${s.tint}`}><s.icon className="h-4 w-4" /></div>
            <AnimatePresence mode="popLayout">
              <motion.p key={`${s.label}-${s.value}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-3xl font-bold tabular-nums leading-none">{s.value}</motion.p>
            </AnimatePresence>
            <p className="text-[11px] text-muted-foreground mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* products being viewed right now */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Products being viewed right now</p>
          {products.length > 0 && (
            <span className="ml-auto text-[11px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">{viewingProduct} viewing</span>
          )}
        </div>
        {products.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No products being viewed right now.</p>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {products.map((p, i) => (
                <motion.div key={p.name} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-[11px] font-mono text-muted-foreground w-4 tabular-nums">{i + 1}</span>
                    <span className="text-sm font-medium flex-1 truncate">{p.name}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums">
                      <Eye className="h-3.5 w-3.5 text-primary" />{p.count}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden ml-7">
                    <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${(p.count / maxProduct) * 100}%` }} transition={{ duration: 0.5 }} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* live visitor globe + top locations */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 mb-4"
        style={{ background: 'radial-gradient(120% 120% at 15% 0%, #132a5e 0%, #0d1830 45%, #0a0a0b 100%)' }}>
        <div className="grid lg:grid-cols-[1.15fr_1fr]">
          {/* globe */}
          <div className="relative p-5 sm:p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <GlobeIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-white">Where they're from</span>
            </div>
            <p className="text-xs text-white/50 mb-2">Drag to spin · live positions</p>
            <div className="flex-1 flex items-center justify-center py-2">
              {globePoints.length === 0 ? (
                <div className="text-center py-10 w-full">
                  <VisitorGlobe points={[]} />
                  <p className="text-xs text-white/40 mt-2">Visitor locations will light up here in real time.</p>
                </div>
              ) : (
                <VisitorGlobe points={globePoints} />
              )}
            </div>
          </div>

          {/* top locations list */}
          <div className="relative p-5 sm:p-6 border-t lg:border-t-0 lg:border-l border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-xs font-mono uppercase tracking-[0.18em] text-white/60">Top locations</span>
            </div>
            {countries.length === 0 ? (
              <p className="text-xs text-white/40 py-8 text-center">No located visitors right now.</p>
            ) : (
              <div className="space-y-3">
                {countries.map((c) => (
                  <div key={c.country} className="group">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-lg leading-none">{flagEmoji(c.country)}</span>
                      <span className="text-sm text-white/90 flex-1 truncate">{countryName(c.country)}</span>
                      <span className="text-sm font-semibold text-white tabular-nums">{c.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #2b6bff, #5b8dff)' }}
                        initial={{ width: 0 }} animate={{ width: `${(c.count / maxCountry) * 100}%` }} transition={{ duration: 0.5 }} />
                    </div>
                  </div>
                ))}
                {online > geoKnown && (
                  <p className="text-[11px] text-white/40 pt-1">+{online - geoKnown} with location hidden</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-3">
        {/* what they're viewing */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold mb-4">What they're viewing</p>
          {pages.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Nobody browsing right now.</p>
          ) : (
            <div className="space-y-2.5">
              {pages.map((p) => (
                <div key={p.page}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium truncate pr-2">{p.page}</span>
                    <span className="text-muted-foreground tabular-nums">{p.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div className="h-full rounded-full bg-primary/70" initial={{ width: 0 }} animate={{ width: `${(p.count / maxPage) * 100}%` }} transition={{ duration: 0.5 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* live activity feed */}
        <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold mb-4">Live activity</p>
          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No active visitors. Share your link to see them appear here in real time.</p>
          ) : (
            <div className="space-y-1.5 max-h-[360px] overflow-auto scrollbar-none">
              <AnimatePresence initial={false}>
                {sessions.map((s, i) => {
                  const b = STATE_BADGE[s.state] || STATE_BADGE.browsing;
                  return (
                    <motion.div key={`${s.page}-${i}`} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-sm flex-1 min-w-0 truncate">{s.product || s.page}</span>
                      {s.cartCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                          <ShoppingCart className="h-3 w-3" />{s.cartCount}
                        </span>
                      )}
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${b.cls}`}>{b.label}</span>
                      <span className="text-[10px] text-muted-foreground w-10 text-right shrink-0 tabular-nums">{s.ago}s ago</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
