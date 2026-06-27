import { Link } from 'react-router-dom';

export default function FdaDisclaimer({ className = '' }) {
  return (
    <div className={`max-w-3xl mx-auto rounded-xl border border-border bg-secondary/30 p-4 ${className}`}>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">FDA Disclaimer</p>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Statements made regarding our products have not been evaluated by the U.S. Food and Drug Administration.
        The efficacy of these products has not been confirmed by FDA-approved research. Products are not intended
        to diagnose, treat, cure, or prevent any disease. Information presented on this website is not a substitute
        for, or alternative to, information from a qualified health care practitioner. Please consult a licensed
        health care professional regarding any potential interactions or complications before using any product.
        This notice is required under the Federal Food, Drug, and Cosmetic Act.{' '}
        <Link to="/terms" className="text-primary hover:underline">Read the full disclaimer →</Link>
      </p>
    </div>
  );
}
