import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, Eye, X } from 'lucide-react';

const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

// Honest social proof: real recent purchases + live viewer count. Shows nothing
// when there's no activity, so it never looks empty/fake.
export default function SocialProof() {
  const { pathname } = useLocation();
  const [msgs, setMsgs] = useState([]);
  const [idx, setIdx] = useState(-1);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('omen_sp_off') === '1');
  const timer = useRef();

  const hidden = dismissed || pathname.startsWith('/admin');

  useEffect(() => {
    if (hidden) return;
    fetch('/api/social-proof').then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d) return;
      const list = [];
      (d.recent || []).forEach((r) => list.push({ type: 'buy', product: r.product, ago: r.ago }));
      if ((d.online || 0) > 2) list.push({ type: 'view', online: d.online });
      if (list.length) setMsgs(shuffle(list));
    }).catch(() => {});
  }, [hidden]);

  useEffect(() => {
    if (!msgs.length || hidden) return;
    let i = 0;
    const cycle = () => {
      setIdx(i % msgs.length);
      timer.current = setTimeout(() => {
        setIdx(-1);
        timer.current = setTimeout(() => { i += 1; cycle(); }, 6500);
      }, 5000);
    };
    const start = setTimeout(cycle, 4000);
    return () => { clearTimeout(start); clearTimeout(timer.current); };
  }, [msgs, hidden]);

  if (hidden || idx < 0 || !msgs[idx]) return null;
  const m = msgs[idx];
  const off = () => { setDismissed(true); sessionStorage.setItem('omen_sp_off', '1'); };

  return (
    <div className="fixed bottom-5 left-5 z-40 max-w-[290px] pointer-events-none">
      <AnimatePresence>
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -16, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-auto relative flex items-center gap-3 rounded-2xl border border-border bg-card/95 backdrop-blur shadow-xl p-3 pr-8"
        >
          <span className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${m.type === 'buy' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
            {m.type === 'buy' ? <ShoppingBag className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            {m.type === 'buy' ? (
              <>
                <p className="text-sm font-medium truncate">{m.product}</p>
                <p className="text-[11px] text-muted-foreground">Purchased · {m.ago}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">{m.online} researchers browsing</p>
                <p className="text-[11px] text-muted-foreground">on the site right now</p>
              </>
            )}
          </div>
          <button onClick={off} aria-label="Dismiss" className="absolute top-2 right-2 text-muted-foreground/50 hover:text-foreground transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
