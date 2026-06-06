const SECTIONS = [
  {
    title: '1. Research Use Only',
    body: 'All products sold by Omen Labs are intended strictly for laboratory and scientific research purposes. They are NOT intended for human or animal consumption, ingestion, or any form of in vivo use. Products are not drugs, foods, cosmetics, or dietary supplements, and have not been evaluated or approved by the U.S. Food and Drug Administration (FDA) for the diagnosis, treatment, cure, or prevention of any disease or condition.',
  },
  {
    title: '2. Eligibility',
    body: 'You must be at least 21 years of age to access this website or purchase any product. By placing an order, you represent and warrant that you are at least 21 years old, that you are a qualified researcher or affiliated with a research institution, and that you will use all products in a lawful manner consistent with their intended research use.',
  },
  {
    title: '3. Acceptance of Terms',
    body: 'By accessing this website and placing an order, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use this website or purchase any products.',
  },
  {
    title: '4. Buyer Responsibility',
    body: 'You assume full responsibility for the safe handling, storage, use, and disposal of all products purchased. You agree to comply with all applicable federal, state, and local laws and regulations governing the purchase, possession, and use of these products. You agree that you will not misuse, resell for human consumption, or distribute products in violation of any law.',
  },
  {
    title: '5. No Medical Claims',
    body: 'Omen Labs makes no claims, representations, or warranties regarding the therapeutic or medical efficacy of any product. No information provided on this website should be interpreted as medical advice or as a recommendation for human use.',
  },
  {
    title: '6. Orders & Payment',
    body: 'All orders are subject to acceptance and product availability. Prices are listed in U.S. dollars and are subject to change without notice. We reserve the right to refuse or cancel any order at our discretion.',
  },
  {
    title: '7. Shipping',
    body: 'Orders are processed and shipped after confirmation. Delivery times are estimates and not guaranteed. Title and risk of loss pass to you upon delivery to the carrier.',
  },
  {
    title: '8. Returns',
    body: 'Due to the nature of research compounds, all sales are final. We do not accept returns or exchanges except in the case of products damaged in transit or shipped in error, reported within 7 days of delivery.',
  },
  {
    title: '9. Limitation of Liability',
    body: 'To the fullest extent permitted by law, Omen Labs shall not be liable for any direct, indirect, incidental, or consequential damages arising from the purchase, handling, or use of any product. Our total liability shall not exceed the purchase price of the product in question.',
  },
  {
    title: '10. Governing Law',
    body: 'These Terms of Service are governed by the laws of the State of Washington, United States, without regard to its conflict of law principles.',
  },
  {
    title: '11. Changes to These Terms',
    body: 'We may update these Terms of Service at any time. Continued use of the website after changes constitutes acceptance of the revised terms.',
  },
  {
    title: '12. Contact',
    body: 'Questions about these Terms of Service may be directed to support@omenlabs.co.',
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-6 bg-primary" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Legal</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: June 2026</p>

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
