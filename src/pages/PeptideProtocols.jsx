import { motion } from 'framer-motion';
import { Thermometer, Droplets, ShieldAlert, FlaskConical, PackageCheck, AlertTriangle } from 'lucide-react';

const sections = [
  {
    icon: Thermometer,
    colorClass: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
    title: 'Storage Temperatures',
    steps: [
      'Store lyophilized (powder) peptides at −20°C for long-term preservation (up to 12 months).',
      'Short-term storage (up to 4 weeks) is acceptable at 4°C in a dedicated laboratory refrigerator.',
      'Keep away from frost-free freezers — repeated freeze-thaw cycles degrade compound integrity.',
      'Never store peptides at room temperature for extended periods.',
    ],
  },
  {
    icon: Droplets,
    colorClass: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
    title: 'Reconstitution Protocol',
    steps: [
      'Use only Bacteriostatic Water (BW) or sterile water for injection for reconstitution.',
      'Allow the vial to come to room temperature before adding solvent to minimize thermal shock.',
      'Inject solvent slowly down the side of the vial — do not inject directly onto the lyophilized cake.',
      'Gently swirl; never vortex or shake vigorously. Vigorous agitation causes peptide degradation.',
      'Once reconstituted, store at 4°C and use within 28 days.',
    ],
  },
  {
    icon: FlaskConical,
    colorClass: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/20',
    title: 'Handling Best Practices',
    steps: [
      'Always work in a clean, sterile environment using appropriate PPE (gloves, eye protection).',
      'Use sterile syringes and needles for every reconstitution and transfer.',
      'Label each reconstituted vial with the compound name, concentration, date, and initials.',
      'Avoid repeated re-entry into vials — minimize exposure to contaminants.',
      'Discard any vial showing visible particulates, cloudiness, or discoloration.',
    ],
  },
  {
    icon: PackageCheck,
    colorClass: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    title: 'Upon Receipt',
    steps: [
      'Inspect packaging integrity immediately upon delivery.',
      'Verify cold pack condition — if warm on arrival, contact support before use.',
      'Cross-reference vial labeling with your Certificate of Analysis (CoA).',
      'Transfer peptides to appropriate storage immediately after inspection.',
    ],
  },
  {
    icon: ShieldAlert,
    colorClass: 'text-rose-400',
    bg: 'bg-rose-400/10',
    border: 'border-rose-400/20',
    title: 'Freeze-Thaw Cycles',
    steps: [
      'Limit freeze-thaw cycles to a maximum of 3 for any single vial.',
      'Aliquot large quantities into single-use volumes before freezing to avoid repeated thawing.',
      'Track the number of freeze-thaw cycles per vial using labels or a laboratory logbook.',
      'If peptide activity appears diminished, consider the cycle history before troubleshooting.',
    ],
  },
  {
    icon: AlertTriangle,
    colorClass: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20',
    title: 'Safety & Compliance',
    steps: [
      'All Omen Labs compounds are strictly for in-vitro and laboratory research use only.',
      'Not intended for human or veterinary use. Not a drug or pharmaceutical product.',
      'Comply with all local, state, and federal regulations governing research compound usage.',
      'Maintain a detailed research log documenting usage, storage conditions, and observations.',
      "Dispose of peptides and sharps according to your institution's biohazard waste protocols.",
    ],
  },
];

export default function PeptideProtocols() {
  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 hex-grid opacity-40 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 pt-28 pb-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-primary" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">
              Research Guidelines
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold tracking-[-0.04em]">
            Peptide Protocols
          </h1>
          <p className="mt-6 text-muted-foreground max-w-xl leading-relaxed">
            Proper storage and handling are critical to maintaining peptide integrity and ensuring reliable research outcomes.
          </p>
        </motion.div>
      </div>

      {/* Disclaimer */}
      <div className="relative z-10 border-y border-amber-400/20 bg-amber-400/[0.05] py-3 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <p className="font-mono text-[11px] uppercase tracking-widest text-amber-400/80">
            For Research Use Only — Not intended for human or veterinary use
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section, i) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`rounded-2xl border ${section.border} bg-card p-7 hover:bg-card/80 transition-all duration-300`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`h-11 w-11 rounded-xl ${section.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${section.colorClass}`} />
                  </div>
                  <h2 className="text-base font-bold tracking-tight">{section.title}</h2>
                </div>
                <ul className="space-y-3.5">
                  {section.steps.map((step, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span className={`font-mono text-[10px] mt-0.5 shrink-0 ${section.colorClass}`}>
                        {String(j + 1).padStart(2, '0')}
                      </span>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-6 rounded-2xl border border-border bg-card p-8 text-center"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Questions?</p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            If you have questions about storage, reconstitution, or handling specific to a compound, review the product's Certificate of Analysis or contact our research support team at{' '}
            <span className="text-primary">support@omenlabs.com</span>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}