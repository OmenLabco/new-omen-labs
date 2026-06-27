import { Link } from 'react-router-dom';

export default function FdaDisclaimer({ className = '' }) {
  return (
    <div className={`max-w-3xl mx-auto rounded-xl border border-amber-300/60 bg-amber-50/70 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <svg className="h-3.5 w-3.5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <p className="font-mono text-[10px] uppercase tracking-widest text-amber-700">FDA Disclaimer</p>
      </div>
      <p className="text-[11px] leading-relaxed text-amber-900/80">
        Statements made regarding our products have not been evaluated by the U.S. Food and Drug Administration.
        The efficacy of these products has not been confirmed by FDA-approved research. Products are not intended
        to diagnose, treat, cure, or prevent any disease. Information presented on this website is not a substitute
        for, or alternative to, information from a qualified health care practitioner. Please consult a licensed
        health care professional regarding any potential interactions or complications before using any product.
        This notice is required under the Federal Food, Drug, and Cosmetic Act.{' '}
        <Link to="/terms" className="font-semibold text-amber-700 hover:underline">Read the full disclaimer →</Link>
      </p>
    </div>
  );
}
