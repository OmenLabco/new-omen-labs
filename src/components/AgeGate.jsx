import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import OmenLogo from './OmenLogo';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'omenlabs_age_verified';
const EXEMPT_PATHS = ['/terms', '/restricted'];

export default function AgeGate() {
  const [verified, setVerified] = useState(true); // assume true until we check (avoids flash)
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setVerified(localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVerified(true);
  };

  const decline = () => {
    navigate('/restricted');
  };

  // Don't gate the terms or the restricted page
  if (verified || EXEMPT_PATHS.includes(location.pathname)) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md px-6">
      <div className="max-w-lg w-full text-center rounded-2xl border border-border bg-card p-10 shadow-2xl">
        <div className="flex justify-center mb-4">
          <OmenLogo size={44} className="text-foreground" />
        </div>

        <p className="font-mono text-[12px] uppercase tracking-[0.4em] text-muted-foreground mb-6">
          Omen Labs
        </p>

        <h1 className="text-4xl font-bold tracking-tight mb-5">Age Verification</h1>
        <p className="text-base text-muted-foreground leading-relaxed mb-9 max-w-md mx-auto">
          This site contains research compounds intended for adults only. You must be{' '}
          <strong className="text-foreground">21 years or older</strong> to enter.
        </p>

        <div className="flex flex-col gap-3">
          <Button onClick={accept} className="w-full h-14 text-base font-semibold tracking-wide">
            Yes, I am 21 or older
          </Button>
          <Button onClick={decline} variant="outline" className="w-full h-14 text-base">
            No, I am under 21
          </Button>
        </div>

        <p className="mt-8 text-[13px] text-muted-foreground leading-relaxed max-w-md mx-auto">
          By entering you confirm you are of legal age and agree to our{' '}
          <Link to="/terms" className="underline hover:text-foreground transition-colors">
            terms of service
          </Link>
          . Products are for research use only.
        </p>
      </div>
    </div>
  );
}
