import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { LifeBuoy, X, Mail, PackageSearch, HelpCircle } from 'lucide-react';

// Floating support launcher (bottom-right, site-wide). No backend — routes to
// email + self-serve help. Hidden on admin pages.
export default function SupportWidget() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  if (pathname.startsWith('/admin')) return null;

  const mailto = `mailto:support@omenlabs.co?subject=${encodeURIComponent('Support request')}`;

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end print:hidden">
      {open && (
        <div className="mb-3 w-[300px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-[fadeInUp_0.18s_ease-out]">
          <div className="p-4 bg-primary text-primary-foreground">
            <p className="font-semibold text-[15px]">Need help?</p>
            <p className="text-xs opacity-90 mt-0.5">Questions about an order or payment? We're here.</p>
          </div>
          <div className="p-2">
            <a href={mailto} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
              <span className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Mail className="h-4 w-4 text-primary" /></span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">Email support</span>
                <span className="block text-xs text-muted-foreground truncate">support@omenlabs.co</span>
              </span>
            </a>
            <Link to="/order-status" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
              <span className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><PackageSearch className="h-4 w-4 text-primary" /></span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">Track your order</span>
                <span className="block text-xs text-muted-foreground">Check status &amp; tracking</span>
              </span>
            </Link>
            <Link to="/faq" onClick={() => setOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors">
              <span className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><HelpCircle className="h-4 w-4 text-primary" /></span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">FAQ</span>
                <span className="block text-xs text-muted-foreground">Common questions</span>
              </span>
            </Link>
          </div>
          <div className="px-4 py-3 border-t border-border bg-secondary/40">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Paid but still awaiting? Allow <span className="font-medium text-foreground">1–5 min</span> — orders confirm automatically. Always include your <span className="font-medium text-foreground">order number</span>.
            </p>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close support' : 'Open support'}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        {open ? <X className="h-6 w-6" /> : <LifeBuoy className="h-6 w-6" />}
      </button>
    </div>
  );
}
