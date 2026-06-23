// Handling & Storage — compliant laboratory reference. No dosing, cycles,
// stacks, or human-use guidance. General lab handling/storage of lyophilized
// research peptides only.

const SECTIONS = [
  {
    title: 'Receiving & Inspection',
    body: 'On arrival, inspect the vial and packaging for damage. Lyophilized (freeze-dried) research peptides are shipped as a solid powder and are stable at ambient temperature for short transit periods. Verify the label, compound, and lot information against your order before storing.',
  },
  {
    title: 'Storing Lyophilized Powder',
    body: 'Store sealed, unopened lyophilized vials away from light, heat, and humidity. For short-term laboratory storage (weeks), a refrigerator at 2–8°C is typical. For long-term storage (months or longer), -20°C or colder in a frost-free freezer is generally preferred. Avoid repeated temperature cycling.',
  },
  {
    title: 'Reconstitution for Research',
    body: 'For in-vitro laboratory work, lyophilized peptides are typically reconstituted with a suitable solvent such as bacteriostatic or sterile water, added slowly down the side of the vial and swirled gently rather than shaken. Reconstitution volumes and solvents are determined by the researcher according to their experimental design and the compound’s solubility.',
  },
  {
    title: 'Storing Reconstituted Solutions',
    body: 'Once in solution, research peptides are generally less stable than the lyophilized powder. Reconstituted solutions are typically refrigerated at 2–8°C and protected from light. Aliquoting before freezing can help minimize freeze-thaw cycles, which may degrade peptides over time.',
  },
  {
    title: 'Handling & Safety',
    body: 'Handle all research materials using good laboratory practice: wear appropriate PPE (gloves, eye protection), work in a clean designated area, and avoid generating dust or aerosols. Keep materials clearly labeled and segregated from food, beverages, and consumer products.',
  },
  {
    title: 'Stability Factors',
    body: 'Peptide stability depends on sequence, temperature, pH, light exposure, and the number of freeze-thaw cycles. Minimizing exposure to heat, light, and repeated thawing helps preserve integrity for the duration of a study.',
  },
  {
    title: 'Disposal',
    body: 'Dispose of all research materials, solutions, and labware in accordance with your institution’s policies and applicable local, state, and federal regulations for laboratory waste.',
  },
];

export default function PeptideProtocols() {
  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-6 bg-primary" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Laboratory Reference</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">Handling &amp; Storage</h1>
        <p className="text-sm text-muted-foreground mb-10 leading-relaxed">
          General laboratory guidance for receiving, storing, and handling lyophilized research
          peptides. This page is reference information for laboratory use and does not constitute
          dosing, administration, or human-use instructions of any kind.
        </p>

        <div className="rounded-xl border border-destructive/20 bg-destructive/[0.04] p-4 mb-10">
          <p className="font-mono text-[11px] text-destructive uppercase tracking-wider leading-relaxed">
            All products are for laboratory, academic, or institutional research and identification
            purposes only — not for human or animal consumption, dosing, injection, or ingestion.
          </p>
        </div>

        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-semibold mb-2">{s.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>

        <p className="mt-14 font-mono text-[10px] text-muted-foreground uppercase tracking-wider text-center">
          For Research Use Only — Not for Human Consumption
        </p>
      </div>
    </div>
  );
}
