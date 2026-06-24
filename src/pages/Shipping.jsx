const SECTIONS = [
  {
    title: '1. Order Processing',
    body: 'Orders are processed Monday through Friday, excluding U.S. federal holidays. Orders typically ship within 1–2 business days of successful payment and verification. Orders placed on weekends or holidays are processed the next business day. You will receive an email confirmation when your order is placed and a second email with tracking once it ships.',
  },
  {
    title: '2. Order Verification',
    body: 'Because our products are sold for research use only, orders may be subject to verification before shipment, including confirmation of account and billing information. This may add a short delay to processing. Orders that cannot be verified may be canceled and refunded.',
  },
  {
    title: '3. Shipping Methods & Carriers',
    body: 'We ship within the United States via USPS (and comparable carriers where appropriate). Where required to preserve compound integrity, orders are shipped with insulated/cold-chain packaging. Shipping options and costs are calculated and displayed at checkout before payment.',
  },
  {
    title: '4. Delivery Times',
    body: 'Estimated transit time after dispatch is typically 2–5 business days depending on destination and the service selected at checkout. Delivery time frames are estimates provided by the carrier and are not guaranteed. We are not responsible for carrier delays caused by weather, holidays, or events outside our control.',
  },
  {
    title: '5. Shipping Destinations',
    body: 'We currently ship to addresses within the United States only. We do not ship to PO boxes for certain services and do not currently offer international shipping. Orders to addresses outside our serviceable area will be canceled and refunded.',
  },
  {
    title: '6. Tracking',
    body: 'A tracking number is emailed to you when your order ships and can also be viewed on our Track Order page. Please allow up to 24 hours for tracking information to update with the carrier.',
  },
  {
    title: '7. Incorrect Addresses',
    body: 'You are responsible for providing a complete and accurate shipping address. Orders returned to us due to an incorrect or incomplete address may incur an additional shipping charge for reshipment. Please review your address carefully before completing checkout.',
  },
  {
    title: '8. Lost, Delayed, or Damaged Shipments',
    body: 'If your order arrives damaged, is significantly delayed, or is lost in transit, contact us within 7 days of the delivery or expected delivery date at support@omenlabs.co or (509) 842-7930. Include your order number and, for damage, clear photos of the product and packaging. We will work with you on a replacement or refund per our Refund Policy.',
  },
  {
    title: '9. Risk of Loss',
    body: 'Title and risk of loss pass to the buyer upon delivery of the package to the carrier. Claims for lost or damaged shipments are handled in accordance with this policy and our Refund Policy.',
  },
  {
    title: '10. Contact',
    body: 'Questions about shipping may be directed to support@omenlabs.co or (509) 842-7930, Monday–Friday, 9AM–5PM EST.',
  },
];

export default function Shipping() {
  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-6 bg-primary" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Legal</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">Shipping Policy</h1>
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
