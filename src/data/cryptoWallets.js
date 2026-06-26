// Manual crypto receive addresses (Exodus). Public addresses — shown to
// customers at checkout. Keep in sync with worker/order.js CRYPTO_WALLETS.
// ⚠️ Each address is network-specific — sending on the wrong network loses funds.
export const CRYPTO_WALLETS = [
  { coin: 'USDC', network: 'Solana',       address: '3Ki9NTBDiDhobUEW7UwMJ8Dnad4zjvK1smGwLpVDF2Kp', note: 'Lowest fees · recommended' },
  { coin: 'USDT', network: 'Tron (TRC-20)', address: 'TNVyMC9hkAUamS2jZTjxZagwbtN2voFtVz',           note: 'Most common stablecoin' },
  { coin: 'BTC',  network: 'Bitcoin',       address: 'bc1qfv4s0yl33apzafnagkhn4fuh7t5qyqkr7tdwcf',     note: 'Allow ~10–60 min to confirm' },
  { coin: 'USDC', network: 'Polygon',       address: '0x0EdB90f6d02db9B1D8CE7175523F042D6fa9ddA9',     note: 'Backup' },
  { coin: 'USDT', network: 'Solana',        address: '3Ki9NTBDiDhobUEW7UwMJ8Dnad4zjvK1smGwLpVDF2Kp', note: 'Backup' },
];
