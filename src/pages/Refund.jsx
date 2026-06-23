const SECTIONS = [
  {
    title: '1. All Sales Are Final',
    body: 'Because our products are research materials whose integrity depends on proper cold-chain handling and storage, all sales are final. We cannot accept returns or exchanges of products once an order has shipped, as we are unable to verify the storage conditions of returned items.',
  },
  {
    title: '2. Damaged, Defective, Incorrect, or Lost Orders',
    body: 'We stand behind every shipment. If your order arrives damaged or defective, contains the wrong item, or does not arrive at all, we will make it right with a replacement or a refund. This is the exception to our final-sale policy.',
  },
  {
    title: '3. How to Request a Replacement or Refund',
    body: 'Contact support@omenlabs.co within 7 days of delivery (or, for non-delivery, within 7 days of the expected delivery date). Include your order number and, for damaged or incorrect items, clear photos of the product and packaging. We will respond promptly to resolve the issue.',
  },
  {
    title: '4. Refund Method & Timing',
    body: 'Approved refunds are issued to the original payment method. Once approved, refunds are typically processed within 5–10 business days, though the time it takes to appear on your statement depends on your bank or card issuer.',
  },
  {
    title: '5. Order Cancellations',
    body: 'Orders may be canceled for a full refund only if they have not yet been packed or shipped. Once an order has shipped, our final-sale policy applies, subject to the exceptions above.',
  },
  {
    title: '6. Refused or Undeliverable Shipments',
    body: 'If a shipment is returned to us as undeliverable or refused, we will contact you to arrange reshipment. Reshipment may require payment of additional shipping costs.',
  },
  {
    title: '7. Contact',
    body: 'Questions about returns or refunds may be directed to support@omenlabs.co.',
  },
];

export default function Refund() {
  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-6 bg-primary" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Legal</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">Refund &amp; Return Policy</h1>
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
