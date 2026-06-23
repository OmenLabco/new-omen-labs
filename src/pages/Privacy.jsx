const SECTIONS = [
  {
    title: '1. Overview',
    body: 'This Privacy Policy explains how Omen Labs LLC ("Omen Labs," "we," "us") collects, uses, and protects information when you visit omenlabs.co or place an order. By using our website you consent to the practices described here.',
  },
  {
    title: '2. Information We Collect',
    body: 'We collect information you provide directly: your name, email address, shipping address, phone number (if provided), and order details. We also collect limited technical data automatically, such as your IP address and basic device/browser information, to operate and secure the site. We do NOT collect or store full payment card numbers — see "Payment Information" below.',
  },
  {
    title: '3. Payment Information',
    body: 'Card payments are processed entirely by our third-party payment gateway through a hosted, tokenized checkout. Your card details are entered on the gateway and are never transmitted to or stored on Omen Labs servers. We receive only a transaction confirmation and a non-sensitive token. We maintain PCI DSS SAQ A scope accordingly.',
  },
  {
    title: '4. How We Use Information',
    body: 'We use your information to process and ship orders, send order and shipping confirmations, provide customer support, operate our rewards and affiliate programs, prevent fraud and abuse, and comply with legal obligations.',
  },
  {
    title: '5. How We Share Information',
    body: 'We share information only as needed to run the business: with our payment gateway to process transactions, with shipping carriers (e.g., USPS) to deliver orders, and with our email service provider to send transactional emails. We do not sell your personal information. We may disclose information if required by law or to protect our rights.',
  },
  {
    title: '6. Cookies & Local Storage',
    body: 'We use browser local storage and minimal cookies to keep your cart, keep you signed in, and remember preferences. We do not use third-party advertising trackers. You can clear this data in your browser at any time.',
  },
  {
    title: '7. Data Security',
    body: 'We protect data with encryption in transit (HTTPS), access controls, rate limiting, and security headers. Account passwords are stored only as salted hashes. No method of transmission or storage is 100% secure, but we work to safeguard your information.',
  },
  {
    title: '8. Data Retention',
    body: 'We retain order and account records for as long as needed to provide our services and to meet legal, tax, and accounting requirements. You may request deletion of your account data subject to those obligations.',
  },
  {
    title: '9. Your Rights',
    body: 'You may request access to, correction of, or deletion of your personal information by contacting us. Depending on your jurisdiction, you may have additional rights regarding your data.',
  },
  {
    title: '10. Children',
    body: 'Our website and products are not intended for anyone under 21. We do not knowingly collect information from minors.',
  },
  {
    title: '11. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. Continued use of the website after changes constitutes acceptance of the revised policy.',
  },
  {
    title: '12. Contact',
    body: 'Questions about this Privacy Policy may be directed to support@omenlabs.co.',
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-6 bg-primary" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Legal</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">Privacy Policy</h1>
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
