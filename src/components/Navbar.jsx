import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import OmenLogo from './OmenLogo';
import { customerAuth, customerMe } from '@/lib/customerApi';

const LINKS = [
  { label: 'Catalog', to: '/catalog' },
  { label: 'Protocols', to: '/protocols' },
  { label: 'About', to: '/about' },
  { label: 'FAQ', to: '/faq' },
];

export default function Navbar({ cartCount = 0, onCartOpen }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [me, setMe] = useState(null); // { name, affiliate:{enrolled,code} } or null
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setOpen(false), [location.pathname]);

  // load account state (so the menu can show Dashboard / Sign Out)
  useEffect(() => {
    if (!customerAuth.isLoggedIn()) { setMe(null); return; }
    customerMe().then(setMe).catch(() => setMe(null));
  }, [location.pathname]);

  const loggedIn = !!me;
  const isAffiliate = me?.affiliate?.enrolled;
  const signOut = () => { customerAuth.clear(); setMe(null); setOpen(false); navigate('/'); };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[120] transition-all duration-300 ${scrolled ? 'bg-white/85 backdrop-blur-xl border-b border-border shadow-[0_6px_30px_-18px_rgba(20,30,80,.35)]' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 h-[68px] flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <OmenLogo size={26} className="text-primary transition-transform group-hover:scale-110" />
          <span className="font-extrabold tracking-[0.18em] uppercase text-[15px]">Omen Labs</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to}
              className={`text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors ${location.pathname === l.to ? 'text-foreground bg-secondary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <Link to="/account" aria-label="Account" className="p-2.5 rounded-lg hover:bg-secondary transition-colors">
            <User className="h-[18px] w-[18px]" />
          </Link>
          <button onClick={onCartOpen} aria-label="Cart" className="relative p-2.5 rounded-lg hover:bg-secondary transition-colors">
            <ShoppingBag className="h-[18px] w-[18px]" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>
            )}
          </button>
          {/* Peptide hamburger */}
          <button onClick={() => setOpen((o) => !o)} aria-label="Menu"
            className={`burger ml-1 h-11 w-11 rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-[5px] transition-colors hover:border-foreground ${open ? 'is-open' : ''}`}>
            <span className="bar" /><span className="bar" /><span className="bar" />
          </button>
        </div>
      </div>

      {/* Slide-down menu */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 top-[68px] bg-black/40 backdrop-blur-sm z-[110]"
            />
            <motion.div
              initial={{ opacity: 0, y: -14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -14, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.2, 0.7, 0.3, 1] }}
              className="absolute right-4 sm:right-6 top-[64px] w-[300px] max-w-[calc(100vw-32px)] z-[115] rounded-2xl border border-line-d bg-[#0a0a0b] text-white p-3.5 shadow-2xl"
              style={{ borderColor: '#2a2b2f' }}
            >
              <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-white/40 px-3 pt-2 pb-1">Browse</p>
              {[...LINKS, { label: 'Membership', to: '/membership' }].map((l) => (
                <Link key={l.to} to={l.to} className="flex items-center justify-between px-3.5 py-3 rounded-xl text-[14.5px] font-semibold text-white/75 hover:text-white hover:bg-white/[0.07] transition-colors">
                  {l.label} <span className="font-mono text-[11px] text-white/35">→</span>
                </Link>
              ))}
              <div className="h-px bg-[#2a2b2f] my-2 mx-2" />
              <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-white/40 px-3 pt-1 pb-1">
                {loggedIn ? `Hi, ${me.name?.split(' ')[0] || 'there'}` : 'Account'}
              </p>

              <Link to="/account" className="flex items-center justify-between px-3.5 py-3 rounded-xl text-[14px] font-semibold text-white border border-primary/40 bg-primary/[0.14] hover:bg-primary transition-colors">
                {loggedIn ? 'My Account & Rewards' : 'Sign In / Create Account'} <span className="font-mono text-[12px] text-primary">→</span>
              </Link>

              <Link to="/order-status" className="flex items-center justify-between mt-1 px-3.5 py-3 rounded-xl text-[14px] font-semibold text-white border border-primary/40 bg-primary/[0.14] hover:bg-primary transition-colors">
                Track Order <span className="font-mono text-[12px] text-primary">◷</span>
              </Link>

              <Link to="/affiliates" className="flex items-center justify-between mt-1 px-3.5 py-3 rounded-xl text-[14px] font-extrabold bg-white text-[#0a0a0b] hover:bg-white/90 transition-colors">
                {isAffiliate ? 'Affiliate Dashboard' : 'Become an Affiliate — Earn 17%'}
                <span className="font-mono text-[12px] text-[#0a0a0b]">✦</span>
              </Link>

              {loggedIn && (
                <button onClick={signOut} className="w-full flex items-center justify-between mt-2 px-3.5 py-3 rounded-xl text-[14px] font-semibold text-white/60 hover:text-white hover:bg-white/[0.07] transition-colors">
                  Sign Out <span className="font-mono text-[11px]">⏻</span>
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
