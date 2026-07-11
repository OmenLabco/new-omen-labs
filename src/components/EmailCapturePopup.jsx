import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Check, Copy, Tag } from 'lucide-react';
import { subscribe } from '@/lib/subscribeApi';

const SEEN = 'omenlabs_promo_seen';

export default function EmailCapturePopup() {
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(SEEN)) return;
    if (pathname.startsWith('/admin') || pathname === '/checkout') return;
    const t = setTimeout(() => setShow(true), 14000);
    return () => clearTimeout(t);
  }, [pathname]);

  const close = () => { setShow(false); localStorage.setItem(SEEN, '1'); };
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await subscribe(email, 'popup'); setDone(true); localStorage.setItem(SEEN, '1'); }
    catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  const copy = () => { navigator.clipboard?.writeText('WELCOME10'); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  if (!show) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 w-[330px] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden" style={{ animation: 'fadeInUp .35s ease' }}>
      <div className="relative p-5 text-white" style={{ background: 'linear-gradient(135deg,#0a0a0b 0%,#12183a 60%,#1746c7 140%)' }}>
        <button onClick={close} aria-label="Close" className="absolute top-3 right-3 h-7 w-7 inline-flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
          <X className="h-4 w-4" />
        </button>
        {!done ? (
          <>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/60 mb-1.5">Omen Labs</p>
            <p className="text-xl font-bold leading-tight">Get 10% off your first order</p>
          </>
        ) : (
          <>
            <div className="h-9 w-9 rounded-full bg-emerald-500/25 border border-emerald-400/40 flex items-center justify-center mb-2"><Check className="h-5 w-5 text-emerald-300" /></div>
            <p className="text-xl font-bold leading-tight">You're in!</p>
          </>
        )}
      </div>

      <div className="p-5">
        {!done ? (
          <form onSubmit={submit}>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">Join the list for lab drops, restocks &amp; a code for <span className="font-semibold text-foreground">10% off</span> your first order.</p>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com"
              className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            {err && <p className="text-xs text-destructive mb-2">{err}</p>}
            <button type="submit" disabled={busy} className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
              {busy ? 'Joining…' : 'Get my 10% code'}
            </button>
            <p className="text-[10px] text-muted-foreground text-center mt-2">No spam. Research-use only. Unsubscribe anytime.</p>
          </form>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-3">Here's your code — it auto-applies at checkout:</p>
            <button onClick={copy} className="w-full flex items-center justify-between gap-2 h-12 px-4 rounded-lg border-2 border-dashed border-primary/40 bg-primary/[0.04] hover:bg-primary/[0.08] transition-colors">
              <span className="inline-flex items-center gap-2 font-mono text-lg font-bold tracking-wider"><Tag className="h-4 w-4 text-primary" /> WELCOME10</span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                {copied ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
              </span>
            </button>
            <button onClick={close} className="w-full h-10 mt-3 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors">Start shopping</button>
          </>
        )}
      </div>
    </div>
  );
}
