import HeroSection from '../components/HeroSection';
import FeaturedProducts from '../components/FeaturedProducts';
import TrustSection from '../components/TrustSection';
import CtaBanner from '../components/CtaBanner';
import WhyOmenLabs from '../components/WhyOmenLabs';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <FeaturedProducts />
      <TrustSection />
      <WhyOmenLabs />
      <CtaBanner />
    </div>
  );
}