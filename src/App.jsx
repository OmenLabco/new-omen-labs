import { Toaster } from "@/components/ui/toaster"
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Layout from './components/Layout';
import AgeGate from './components/AgeGate';
import Terms from './pages/Terms';
import AccessRestricted from './pages/AccessRestricted';
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

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AgeGate />
      <Routes>
        <Route path="/restricted" element={<AccessRestricted />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
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