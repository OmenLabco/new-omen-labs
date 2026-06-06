import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { cart } from '@/lib/cart';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollProgress from './ScrollProgress';
import CartDock from './CartDock';

export default function Layout() {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const loadCart = () => {
    setCartItems(cart.list());
  };

  useEffect(() => {
    loadCart();
    window.addEventListener('storage', loadCart);
    return () => window.removeEventListener('storage', loadCart);
  }, []);

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
    </div>
  );
}