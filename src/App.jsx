import { Toaster } from "@/components/ui/toaster"
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Layout from './components/Layout';
import AgeGate from './components/AgeGate';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Refund from './pages/Refund';
import Shipping from './pages/Shipping';
import AccessRestricted from './pages/AccessRestricted';
import Affiliates from './pages/Affiliates';
import Account from './pages/Account';
import Membership from './pages/Membership';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import FAQ from './pages/FAQ';
import PeptideProtocols from './pages/PeptideProtocols';
import OrderStatus from './pages/OrderStatus';
import LabelPrint from './pages/LabelPrint';
import Checkout from './pages/Checkout';
import OrderConfirmed from './pages/OrderConfirmed';
import AdminOrders from './pages/AdminOrders';
import Verify from './pages/Verify';

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AgeGate />
      <Routes>
        <Route path="/restricted" element={<AccessRestricted />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/affiliates" element={<Affiliates />} />
          <Route path="/account" element={<Account />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/handling" element={<PeptideProtocols />} />
          <Route path="/protocols" element={<PeptideProtocols />} />
          <Route path="/order-status" element={<OrderStatus />} />
          <Route path="/labels" element={<LabelPrint />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmed" element={<OrderConfirmed />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App