import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OmenLogo from './OmenLogo';

export default function Navbar({ cartCount = 0, onCartOpen }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const links = [
    { label: 'Catalog', to: '/catalog' },
    { label: 'Protocols', to: '/protocols' },
    { label: 'About', to: '/about' },
    { label: 'FAQ', to: '/faq' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'frosted' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <OmenLogo size={28} className="text-primary transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(90,130,255,0.6)]" />
          <span className="text-sm font-semibold tracking-[0.22em] text-foreground uppercase font-mono">
            OMEN LABS
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative px-4 py-2 text-[13px] tracking-wide transition-colors rounded-lg hover:text-foreground ${
                location.pathname === link.to
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {location.pathname === link.to && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 bg-white/[0.06] rounded-lg border border-white/[0.08]"
                />
              )}
              <span className="relative z-10">{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link
            to="/order-status"
            className="hidden md:block font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 border border-border rounded-lg hover:border-white/20"
          >
            Track Order
          </Link>
          <button
            onClick={onCartOpen}
            className="relative p-2.5 hover:bg-white/[0.06] rounded-lg transition-colors border border-transparent hover:border-white/[0.08]"
          >
            <ShoppingBag className="h-[18px] w-[18px] text-foreground" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-primary text-white text-[10px] font-medium rounded-full flex items-center justify-center glow-line">
                {cartCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2.5 hover:bg-white/[0.06] rounded-lg transition-colors"
          >
            {mobileOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden frosted border-t border-white/[0.06]"
          >
            <div className="px-6 py-5 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block text-sm py-2.5 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/order-status"
                className="block text-sm py-2.5 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all"
              >
                Track Order
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}