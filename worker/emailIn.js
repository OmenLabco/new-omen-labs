// Cloudflare Email Worker — receives Cash App receipt emails and auto-confirms
// the matching order. Configure Email Routing in the Cloudflare dashboard to
// route an address (e.g. cashapp@omenlabs.co) to this Worker.
//
// SECURITY: we only reconcile when the message is genuinely from Cash App —
// sender domain must be allowlisted AND DKIM must pass (Cloudflare Email Routing
// adds an Authentication-Results header). This prevents a spoofed "you got paid"
// email from confirming an unpaid order via amount matching.
import { reconcilePayment } from './zelle.js';

const DEFAULT_SENDERS = 'square.com,cash.app,squareup.com';

async function readRaw(message, cap = 512 * 1024) {
  try {
    const reader = message.raw.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.length;
      if (total >= cap) break;
    }
    const buf = new Uint8Array(total);
    let o = 0;
    for (const c of chunks) { buf.set(c, o); o += c.length; }
    return new TextDecoder('utf-8').decode(buf);
  } catch { return ''; }
}

// Turn a raw MIME email into searchable plain-ish text: undo quoted-printable
// soft breaks + =XX escapes, then strip HTML tags.
function toText(raw) {
  let t = raw.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  t = t.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&');
  return t;
}

export async function handleIncomingEmail(message, env) {
  const from = String(message.from || message.headers.get('from') || '').toLowerCase();
  const auth = String(message.headers.get('authentication-results') || '').toLowerCase();
  const senders = String(env.CASHAPP_SENDERS || DEFAULT_SENDERS).split(',').map((s) => s.trim()).filter(Boolean);

  const senderOk = senders.some((d) => from.includes(d));
  const dkimOk = auth.includes('dkim=pass');
  // Only trust genuinely-authenticated Cash App mail.
  if (!senderOk || !dkimOk) return;

  const subject = message.headers.get('subject') || '';
  const text = subject + '\n' + toText(await readRaw(message));

  // Scope amount-only matching to Cash App orders.
  await reconcilePayment(env, text, { methodPrefix: 'Cash App' });
}
