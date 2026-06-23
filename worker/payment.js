// Card-payment integration (hosted / tokenized) — STUB.
//
// This is wired but inert until AllayPay approves the account and provides
// gateway credentials. Card data is NEVER handled here: the browser submits
// card details directly to the gateway's hosted form/iframe, and we only ever
// receive a token / transaction id. This keeps us in PCI DSS SAQ A scope.
//
// Required Cloudflare secrets when going live (set via `wrangler secret put`):
//   PAYMENTS_ENABLED       = "true" to turn on card checkout
//   PAYMENT_GATEWAY        = "authorizenet" | "nmi"
//   Authorize.Net: AUTHNET_API_LOGIN_ID, AUTHNET_TRANSACTION_KEY, AUTHNET_SIGNATURE_KEY
//   NMI:           NMI_SECURITY_KEY
//
// Flow once implemented:
//   1) POST /api/pay/session  → server asks gateway for a hosted-payment token
//      using the cart/amount, returns it (+ hosted URL) to the browser.
//   2) Browser loads the gateway's hosted form with that token; customer pays.
//   3) Gateway redirects back / calls POST /api/pay/callback (webhook).
//   4) We verify the gateway response signature, then finalize the order
//      (save to D1, decrement stock, send the Resend confirmation).

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

function paymentsLive(env) {
  return env.PAYMENTS_ENABLED === 'true' && !!env.PAYMENT_GATEWAY;
}

// POST /api/pay/session — create a hosted-payment session/token.
export async function createPaymentSession(request, env) {
  if (!paymentsLive(env)) {
    return json({ error: 'Card payments are not enabled yet.', enabled: false }, 503);
  }
  // TODO: build the gateway request (Authorize.Net Accept Hosted getHostedPaymentPageRequest,
  // or NMI Collect.js / Payment API) using the secret keys, and return the token + hosted URL.
  return json({ error: 'Payment gateway not yet implemented.', enabled: true }, 501);
}

// POST /api/pay/callback — gateway redirect/webhook → verify + finalize order.
export async function paymentCallback(request, env) {
  if (!paymentsLive(env)) {
    return json({ error: 'Card payments are not enabled yet.', enabled: false }, 503);
  }
  // TODO: verify the gateway signature, confirm the transaction succeeded,
  // then create the order (reuse the order-creation logic) and email the customer.
  return json({ error: 'Payment callback not yet implemented.', enabled: true }, 501);
}

// GET /api/pay/status — lets the frontend know if card checkout is available.
export async function paymentStatus(request, env) {
  return json({ enabled: paymentsLive(env), gateway: paymentsLive(env) ? env.PAYMENT_GATEWAY : null });
}
