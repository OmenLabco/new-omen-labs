import { useState, useEffect } from 'react';
import OmenLogo from './OmenLogo';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'omenlabs_age_verified';

export default function AgeGate() {
  const [verified, setVerified] = useState(true); // assume true until we check (avoids flash)

  useEffect(() => {
    setVerified(localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVerified(true);
  };

  const decline = () => {
    window.location.href = 'https://www.google.com';
  };

  if (verified) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md px-6">
      <div className="max-w-md w-full text-center rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <OmenLogo size={40} className="text-primary" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="h-px w-6 bg-primary" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Age Verification</span>
          <div className="h-px w-6 bg-primary" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-3">You must be 21 or older</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          All products are sold strictly <strong>for laboratory and research use only</strong> — not for human or
          animal consumption.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          By entering, you confirm that you are at least 21 years of age and agree to our Terms of Use.
        </p>

        <div className="flex flex-col gap-3">
          <Button onClick={accept} className="w-full h-12 text-sm font-medium tracking-wide">
            I am 21 or older — Enter
          </Button>
          <Button onClick={decline} variant="outline" className="w-full h-11 text-sm">
            I am under 21 — Exit
          </Button>
        </div>

        <p className="mt-6 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
          For Research Use Only — Not for Human Consumption
        </p>
      </div>
    </div>
  );
}
