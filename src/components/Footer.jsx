import { Link } from 'react-router-dom';
import OmenLogo from './OmenLogo';

export default function Footer() {
  return (
    <footer className="relative border-t border-border mt-16">
      {/* Subtle top gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(90,130,255,0.3), transparent)' }}
      />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <OmenLogo size={26} className="text-primary" />
              <span className="font-mono text-sm font-semibold tracking-[0.22em] uppercase text-foreground">
                OMEN LABS
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Pioneering peptide research with pharmaceutical-grade compounds.
              Every product undergoes rigorous HPLC testing to ensure ≥98% purity.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-destructive/20 bg-destructive/5">
              <span className="font-mono text-[10px] text-destructive uppercase tracking-wider">
                For Research Use Only — Not for Human Consumption
              </span>
            </div>
          </div>

          {/* Navigate */}
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-5">
              Navigate
            </h4>
            <div className="space-y-3">
              {[
                { label: 'Catalog', to: '/catalog' },
                { label: 'Handling & Storage', to: '/handling' },
                { label: 'About', to: '/about' },
                { label: 'FAQ', to: '/faq' },
                { label: 'Track Order', to: '/order-status' },
                { label: 'Affiliate Program', to: '/affiliates' },
              ].map((l) => (
                <Link key={l.to} to={l.to} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-5">
              Contact
            </h4>
            <div className="space-y-3">
              <p className="text-sm text-foreground">support@omenlabs.co</p>
              <a href="tel:+15098427930" className="block text-sm text-foreground hover:text-primary transition-colors">(509) 842-7930</a>
              <p className="text-sm text-muted-foreground">Mon–Fri, 9AM–5PM EST</p>
              <div className="pt-2">
                <div className="inline-flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                    Systems Operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FDA disclaimer */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">FDA Disclaimer</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground max-w-4xl">
            Statements made regarding our products have not been evaluated by the U.S. Food and Drug Administration.
            The efficacy of these products has not been confirmed by FDA-approved research. Products are not intended
            to diagnose, treat, cure, or prevent any disease. Information presented on this website is not a substitute
            for, or alternative to, information from a qualified health care practitioner. Please consult a licensed
            health care professional regarding any potential interactions or complications before using any product.
            This notice is required under the Federal Food, Drug, and Cosmetic Act.{' '}
            <Link to="/terms" className="text-primary hover:underline">Read the full disclaimer →</Link>
          </p>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Omen Labs. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to="/privacy" className="font-mono text-[11px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/refund" className="font-mono text-[11px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              Refund Policy
            </Link>
            <Link to="/shipping" className="font-mono text-[11px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              Shipping Policy
            </Link>
            <Link to="/terms" className="font-mono text-[11px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}