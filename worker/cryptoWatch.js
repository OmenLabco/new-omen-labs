// Crypto payment watcher — runs on a Cloudflare Cron trigger.
// Polls the receive addresses on-chain, finds new incoming payments, matches
// them to awaiting-payment orders BY AMOUNT, and auto-confirms.
//
// Keyless chains (work immediately): BTC (mempool.space), USDT-Tron (TronGrid).
// Key-gated chains (activate when the env key is set):
//   Solana USDC/USDT  → HELIUS_API_KEY
//   Polygon USDC      → POLYGONSCAN_API_KEY
import { renderImageEmail, sendEmail } from './email.js';
import { signOrder } from './token.js';

const SITE = 'https://omenlabs.co';

// ---- address + token config (mirror src/data/cryptoWallets.js) ----
const SOL_OWNER = '3Ki9NTBDiDhobUEW7UwMJ8Dnad4zjvK1smGwLpVDF2Kp';
const TRON_USDT = 'TNVyMC9hkAUamS2jZTjxZagwbtN2voFtVz';
const POLY_USDC = '0x0EdB90f6d02db9B1D8CE7175523F042D6fa9ddA9';
const BTC_ADDR  = 'bc1qfv4s0yl33apzafnagkhn4fuh7t5qyqkr7tdwcf';

const SOL_USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const SOL_USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
const TRON_USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const POLY_USDC_CONTRACTS = [
  '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', // native USDC
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // bridged USDC.e
];

const STABLE_TOL = 0.75;   // $ tolerance for stablecoin matching
const BTC_TOL_PCT = 0.03;  // ±3% tolerance for BTC (price drift)

async function jget(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function btcUsd() {
  try {
    const d = await jget('https://api.coinbase.com/v2/prices/BTC-USD/spot');
    return Number(d?.data?.amount) || null;
  } catch { return null; }
}

// Returns array of { txid, usd, coin, network, confirmed }
export async function fetchIncoming(env) {
  const out = [];

  // --- BTC (keyless) ---
  try {
    const txs = await jget(`https://mempool.space/api/address/${BTC_ADDR}/txs`);
    const price = await btcUsd();
    for (const t of (txs || []).slice(0, 25)) {
      const sats = (t.vout || []).filter((v) => v.scriptpubkey_address === BTC_ADDR).reduce((s, v) => s + Number(v.value || 0), 0);
      if (sats <= 0) continue;
      const btc = sats / 1e8;
      out.push({ txid: `btc:${t.txid}`, usd: price ? +(btc * price).toFixed(2) : null, coin: 'BTC', network: 'Bitcoin', confirmed: !!t.status?.confirmed, fuzzy: true });
    }
  } catch {}

  // --- USDT on Tron (keyless) ---
  try {
    const d = await jget(`https://api.trongrid.io/v1/accounts/${TRON_USDT}/transactions/trc20?only_to=true&contract_address=${TRON_USDT_CONTRACT}&limit=25`);
    for (const t of (d?.data || [])) {
      if (t.to !== TRON_USDT && t.to !== TRON_USDT) {} // only_to already filters
      const dec = Number(t.token_info?.decimals ?? 6);
      const usd = Number(t.value) / 10 ** dec;
      out.push({ txid: `tron:${t.transaction_id}`, usd: +usd.toFixed(2), coin: 'USDT', network: 'Tron', confirmed: true });
    }
  } catch {}

  // --- Solana USDC/USDT (needs HELIUS_API_KEY) ---
  if (env.HELIUS_API_KEY) {
    try {
      const d = await jget(`https://api.helius.xyz/v0/addresses/${SOL_OWNER}/transactions?api-key=${env.HELIUS_API_KEY}&type=TRANSFER&limit=25`);
      for (const tx of (d || [])) {
        for (const tt of (tx.tokenTransfers || [])) {
          if (tt.toUserAccount !== SOL_OWNER) continue;
          const coin = tt.mint === SOL_USDC_MINT ? 'USDC' : tt.mint === SOL_USDT_MINT ? 'USDT' : null;
          if (!coin) continue;
          const usd = Number(tt.tokenAmount);
          if (!(usd > 0)) continue;
          out.push({ txid: `sol:${tx.signature}:${coin}`, usd: +usd.toFixed(2), coin, network: 'Solana', confirmed: true });
        }
      }
    } catch {}
  }

  // --- Polygon USDC (needs POLYGONSCAN_API_KEY) ---
  if (env.POLYGONSCAN_API_KEY) {
    for (const contract of POLY_USDC_CONTRACTS) {
      try {
        const d = await jget(`https://api.polygonscan.com/api?module=account&action=tokentx&address=${POLY_USDC}&contractaddress=${contract}&sort=desc&page=1&offset=25&apikey=${env.POLYGONSCAN_API_KEY}`);
        if (d?.status !== '1') continue;
        for (const t of (d.result || [])) {
          if ((t.to || '').toLowerCase() !== POLY_USDC.toLowerCase()) continue;
          const dec = Number(t.tokenDecimal || 6);
          const usd = Number(t.value) / 10 ** dec;
          out.push({ txid: `poly:${t.hash}`, usd: +usd.toFixed(2), coin: 'USDC', network: 'Polygon', confirmed: Number(t.confirmations || 0) >= 6 });
        }
      } catch {}
    }
  }

  return out;
}

async function alreadySeen(env, txid) {
  const row = await env.DB.prepare('SELECT 1 FROM seen_crypto_tx WHERE txid = ?').bind(txid).first();
  return !!row;
}

async function markSeen(env, txid, orderNumber) {
  await env.DB.prepare('INSERT OR IGNORE INTO seen_crypto_tx (txid, order_number, seen_at) VALUES (?,?,?)')
    .bind(txid, orderNumber || null, new Date().toISOString()).run();
}

// Find a single awaiting-payment crypto order matching the paid USD amount.
async function matchOrder(env, payment) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM orders WHERE status = 'awaiting_payment' AND payment_method LIKE 'Crypto%' ORDER BY id ASC"
  ).all();
  const tol = payment.fuzzy ? null : STABLE_TOL;
  const candidates = (results || []).filter((o) => {
    const total = Number(o.total || 0);
    if (payment.usd == null) return false;
    if (payment.fuzzy) return Math.abs(total - payment.usd) <= total * BTC_TOL_PCT;
    return Math.abs(total - payment.usd) <= tol;
  });
  return candidates[0] || null; // oldest matching awaiting order
}

async function confirmOrder(env, order, payment) {
  const fixedLabel = (order.payment_method || 'Crypto').replace(/awaiting payment/i, 'payment confirmed');
  await env.DB.prepare("UPDATE orders SET status = 'confirmed', payment_method = ? WHERE id = ?")
    .bind(fixedLabel, order.id).run();

  if (env.RESEND_API_KEY && order.customer_email) {
    try {
      const token = await signOrder(order.order_number, env.ADMIN_PASSWORD);
      const imageUrl = `${SITE}/api/receipt-image?o=${encodeURIComponent(order.order_number)}&t=${token}&type=confirmation`;
      let items = []; try { items = JSON.parse(order.items || '[]'); } catch {}
      const orderObj = { ...order, status: 'confirmed', payment_method: fixedLabel, items };
      await sendEmail(env, {
        to: order.customer_email,
        subject: `Payment Received — Order Confirmed ${order.order_number}`,
        html: renderImageEmail({ imageUrl, order: orderObj }),
      });
    } catch {}
  }
  // Notify the owner that an auto-confirm happened
  if (env.RESEND_API_KEY) {
    try {
      await sendEmail(env, {
        to: env.ORDER_TO_EMAIL || 'support@omenlabs.co',
        subject: `✅ Crypto auto-confirmed ${order.order_number} — ${payment.coin} ${payment.network}`,
        html: `<p>Order <b>${order.order_number}</b> auto-confirmed. Received ~$${payment.usd} in ${payment.coin} on ${payment.network}.</p>`,
      });
    } catch {}
  }
}

// On-demand diagnostics for the admin panel: runs a watch pass, then reports
// what was seen on-chain + which orders are awaiting, so problems are visible.
export async function cryptoWatchDebug(env) {
  await runCryptoWatch(env);
  let incoming = [];
  let err = null;
  try { incoming = await fetchIncoming(env); } catch (e) { err = String(e); }
  let awaiting = [];
  try {
    const { results } = await env.DB.prepare(
      "SELECT order_number, total, payment_method, created_date FROM orders WHERE status = 'awaiting_payment' AND payment_method LIKE 'Crypto%' ORDER BY id DESC LIMIT 20"
    ).all();
    awaiting = results || [];
  } catch {}
  return {
    heliusSet: !!env.HELIUS_API_KEY,
    polygonscanSet: !!env.POLYGONSCAN_API_KEY,
    fetchError: err,
    incoming: incoming.map((p) => ({ coin: p.coin, network: p.network, usd: p.usd, confirmed: p.confirmed, txid: p.txid })),
    awaiting,
  };
}

export async function runCryptoWatch(env) {
  if (!env.DB) return;
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS seen_crypto_tx (txid TEXT PRIMARY KEY, order_number TEXT, seen_at TEXT)').run();

  let incoming = [];
  try { incoming = await fetchIncoming(env); } catch { return; }

  for (const p of incoming) {
    try {
      // Skip only if this tx already CONFIRMED an order. If it was seen but
      // never matched (order_number null), keep retrying — the order may have
      // existed at a different amount, or matching ran before the order did.
      const seen = await env.DB.prepare('SELECT order_number FROM seen_crypto_tx WHERE txid = ?').bind(p.txid).first();
      if (seen && seen.order_number) continue;
      // For BTC require an on-chain confirmation before auto-confirming.
      if (p.coin === 'BTC' && !p.confirmed) continue;
      const order = await matchOrder(env, p);
      if (order) {
        await confirmOrder(env, order, p);
        await env.DB.prepare(
          'INSERT INTO seen_crypto_tx (txid, order_number, seen_at) VALUES (?,?,?) ON CONFLICT(txid) DO UPDATE SET order_number = excluded.order_number'
        ).bind(p.txid, order.order_number, new Date().toISOString()).run();
      } else if (!seen) {
        await markSeen(env, p.txid, null); // first sight, no match yet — will retry next run
      }
    } catch {}
  }
}
