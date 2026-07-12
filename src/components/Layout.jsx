import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cart } from '@/lib/cart';
import { syncCart } from '@/lib/cartSync';
import { getProductBySlug } from '@/data/products';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollProgress from './ScrollProgress';
import CartDock from './CartDock';
import SupportWidget from './SupportWidget';
import EmailCapturePopup from './EmailCapturePopup';
import SocialProof from './SocialProof';

export default function Layout() {
  const location = useLocation();
  // Scroll to top whenever the route (path) changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  // Live presence heartbeat (powers the admin Live View). Skips admin pages.
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/admin')) return;
    let sid = sessionStorage.getItem('omenlabs_sid');
    if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('omenlabs_sid', sid); }
    const pageLabel = () => {
      if (path === '/') return 'Home';
      if (path.startsWith('/product/')) return 'Product page';
      if (path === '/catalog') return 'Catalog';
      if (path === '/checkout') return 'Checkout';
      if (path === '/account') return 'Account';
      if (path === '/order-confirmed') return 'Order confirmation';
      if (path === '/affiliates') return 'Affiliates';
      return path.replace('/', '').replace(/-/g, ' ') || 'Site';
    };
    const stateOf = () => (path === '/checkout' ? 'checkout' : path.startsWith('/product/') ? 'product' : 'browsing');
    // On a product page, resolve the slug to the real product name so the admin
    // Live View can show exactly which product each visitor is viewing.
    const productName = () => {
      if (!path.startsWith('/product/')) return null;
      const slug = path.split('/product/')[1]?.split('/')[0];
      return slug ? (getProductBySlug(slug)?.name || null) : null;
    };
    const ping = () => {
      const items = cart.list();
      const cartCount = items.reduce((s, i) => s + (i.quantity || 0), 0);
      // Compact cart summary (name + qty) so the admin Live View can show what's
      // actually in each cart, not just a count. Capped to keep the payload small.
      const cartItems = items.slice(0, 20).map((i) => ({ n: String(i.product_name || 'Item').slice(0, 60), q: i.quantity || 0 }));
      try {
        fetch('/api/presence', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
          body: JSON.stringify({ sid, path, page: pageLabel(), state: stateOf(), cartCount, cartItems, product: productName() }),
        });
      } catch {}
    };
    ping();
    const id = setInterval(ping, 15000);
    return () => clearInterval(id);
  }, [location.pathname]);

  const loadCart = () => {
    setCartItems(cart.list());
  };

  useEffect(() => {
    loadCart();
    window.addEventListener('storage', loadCart);
    return () => window.removeEventListener('storage', loadCart);
  }, []);

  // Mirror a logged-in shopper's cart to the server (abandoned-cart recovery).
  useEffect(() => {
    const t = setTimeout(() => syncCart(cartItems), 900);
    return () => clearTimeout(t);
  }, [cartItems]);

  const handleUpdateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      cart.remove(id);
    } else {
      cart.update(id, { quantity });
    }
    loadCart();
  };

  const handleRemove = (id) => {
    cart.remove(id);
    loadCart();
  };

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Navbar cartCount={cartItems.reduce((s, i) => s + i.quantity, 0)} onCartOpen={() => setCartOpen(true)} />
      <main>
        <Outlet context={{ cartItems, loadCart }} />
      </main>
      <Footer />
      <CartDock
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemove}
      />
      <SupportWidget />
      <EmailCapturePopup />
      <SocialProof />
    </div>
  );
}