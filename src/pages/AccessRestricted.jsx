import { Link } from 'react-router-dom';
import OmenLogo from '../components/OmenLogo';
import { Button } from '@/components/ui/button';

export default function AccessRestricted() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-5">
          <OmenLogo size={44} className="text-foreground" />
        </div>
        <p className="font-mono text-[12px] uppercase tracking-[0.4em] text-muted-foreground mb-6">Omen Labs</p>

        <h1 className="text-3xl font-bold tracking-tight mb-4">Access Restricted</h1>
        <p className="text-base text-muted-foreground leading-relaxed mb-8">
          You must be <strong className="text-foreground">21 years or older</strong> to access this site. Our products
          are sold strictly for laboratory and research use only.
        </p>

        <Button asChild variant="outline" className="h-12 px-8">
          <Link to="/">Return when you are 21 or older</Link>
        </Button>

        <p className="mt-10 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
          For Research Use Only — Not for Human Consumption
        </p>
      </div>
    </div>
  );
}
