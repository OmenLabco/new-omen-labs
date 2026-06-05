import { Shield } from 'lucide-react';

export default function PurityBadge({ purity }) {
  return (
    <div className="purity-pulse inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-500/30 bg-blue-500/10">
      <Shield className="h-3 w-3 text-blue-500" />
      <span className="font-mono text-[10px] font-medium text-blue-500 tracking-wider">
        {purity}% PURE
      </span>
    </div>
  );
}