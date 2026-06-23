import HeroSection from '../components/HeroSection';
import TrustBar from '../components/TrustBar';
import FeaturedProducts from '../components/FeaturedProducts';
import ProcessStrip from '../components/ProcessStrip';
import TrustSection from '../components/TrustSection';
import WhyOmenLabs from '../components/WhyOmenLabs';
import CtaBanner from '../components/CtaBanner';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <TrustBar />
      <FeaturedProducts />
      <ProcessStrip />
      <TrustSection />
      <WhyOmenLabs />
      <CtaBanner />
    </div>
  );
}
