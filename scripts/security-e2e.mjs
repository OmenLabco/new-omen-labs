#!/usr/bin/env node
// Local end-to-end security tests: logins, sessions, password upgrades, and
// staff-vs-owner permissions, exercised against the real worker running in
// `wrangler dev` with a throwaway local D1. Never points at production — it
// seeds and deletes accounts.
//
//   npx wrangler d1 execute omenlabs-orders --local --file=schema.sql   (once)
//   npx wrangler dev --local --port 8787                                (separate terminal)
//   node scripts/security-e2e.mjs
//
// Needs .dev.vars with ADMIN_PASSWORD and STAFF_PASSWORD (local-only values).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const BASE = process.env.BASE || 'http://127.0.0.1:8787';
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(BASE)) {
  console.error('Refusing to run: this test seeds and deletes accounts, so it only runs against a local wrangler dev server.');
  process.exit(2);
}
const vars = Object.fromEntries(readFileSync('.dev.vars', 'utf8').split('\n')
  .filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const ADMIN = vars.ADMIN_PASSWORD;
const STAFF = vars.STAFF_PASSWORD;
if (!ADMIN || !STAFF) { console.error('.dev.vars needs ADMIN_PASSWORD and STAFF_PASSWORD.'); process.exit(2); }

const sql = (q) => JSON.parse(execFileSync('npx', ['wrangler', 'd1', 'execute', 'omenlabs-orders', '--local', '--json', '--command', q],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }))[0].results;
// The pre-PBKDF2 scheme, to seed an account exactly as old production rows look.
const legacyHash = (pw, email) => createHash('sha256').update(`${pw}:${email}:${ADMIN}`).digest('hex');
const basic = (email, pw) => Buffer.from(`${email}:${pw}`).toString('base64');
const call = (path, { method = 'GET', bearer, body } = {}) => fetch(BASE + path, {
  method,
  headers: { ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
});
const jsonOf = async (r) => { try { return await r.json(); } catch { return {}; } };

let passed = 0, failed = 0;
function check(name, ok, detail = '') {
  ok ? passed++ : failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const EMAIL = 'legacy.e2e@test.local';
const PW = 'Correct-Horse-Battery-1';
const AFF_CODE = 'E2ETEST';

// ---- Seed: one customer + linked affiliate, both still on the OLD hash scheme
sql(`DELETE FROM customers WHERE email='${EMAIL}'; DELETE FROM affiliates WHERE email='${EMAIL}';`);
sql(`INSERT INTO customers (email, name, password_hash, points, lifetime_spend, created_date) VALUES ('${EMAIL}', 'E2E Legacy', '${legacyHash(PW, EMAIL)}', 0, 0, datetime('now'));`);
sql(`INSERT INTO affiliates (code, name, email, password_hash, created_date) VALUES ('${AFF_CODE}', 'E2E Legacy', '${EMAIL}', '${legacyHash(PW, EMAIL)}', datetime('now'));`);

console.log('\n== Customer sign-in & sessions ==');
let r = await call('/api/customer/login', { method: 'POST', bearer: basic(EMAIL, 'wrong-password') });
check('wrong password is rejected', r.status === 401, `HTTP ${r.status}`);

r = await call('/api/customer/login', { method: 'POST', bearer: basic(EMAIL, PW) });
let d = await jsonOf(r);
const token = d.token;
check('existing (old-hash) customer can still sign in', r.status === 200, `HTTP ${r.status}`);
check('sign-in returns a signed session token, not the password', typeof token === 'string' && token.startsWith('cs1.') && !token.includes(Buffer.from(PW).toString('base64')));
const upgraded = sql(`SELECT password_hash FROM customers WHERE email='${EMAIL}'`)[0]?.password_hash || '';
check('password hash upgraded to PBKDF2 on sign-in', upgraded.startsWith('pbkdf2$100000$'), upgraded.slice(0, 20));

r = await call('/api/customer/me', { bearer: token });
d = await jsonOf(r);
check('session token opens the account', r.status === 200 && d.email === EMAIL, `HTTP ${r.status}`);
check('a normal session is not re-issued', d.token === undefined);

r = await call('/api/customer/me', { bearer: basic(EMAIL, PW) });
d = await jsonOf(r);
check('old browser credential is migrated to a session token', r.status === 200 && typeof d.token === 'string' && d.token.startsWith('cs1.'));

const [kind, body, sig] = token.split('.');
const forgedBody = Buffer.from(JSON.stringify({ e: 'someone.else@test.local', h: 'x', k: 'cs1', exp: Date.now() + 1e9 })).toString('base64');
r = await call('/api/customer/me', { bearer: `${kind}.${forgedBody}.${sig}` });
check('forged session (edited email) is rejected', r.status === 401, `HTTP ${r.status}`);
r = await call('/api/customer/me', { bearer: `${kind}.${body}.${'0'.repeat(sig.length)}` });
check('session with a fake signature is rejected', r.status === 401, `HTTP ${r.status}`);
const expiredBody = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, 'base64').toString()), exp: Date.now() - 1000 })).toString('base64');
r = await call('/api/customer/me', { bearer: `${kind}.${expiredBody}.${sig}` });
check('expired session is rejected', r.status === 401, `HTTP ${r.status}`);

// Changing the stored password must kill existing sessions.
sql(`UPDATE customers SET password_hash='pbkdf2$100000$AAAAAAAAAAAAAAAAAAAAAA==$changed-password-hash-xyz' WHERE email='${EMAIL}'`);
r = await call('/api/customer/me', { bearer: token });
check('password change invalidates old sessions', r.status === 401, `HTTP ${r.status}`);
sql(`UPDATE customers SET password_hash='${upgraded}' WHERE email='${EMAIL}'`);

console.log('\n== Affiliate dashboard (same login) ==');
r = await call('/api/affiliate/stats', { bearer: token });
check('customer session opens the linked affiliate dashboard', r.status === 200, `HTTP ${r.status}`);
r = await call('/api/affiliate/login', { method: 'POST', bearer: basic(EMAIL, PW) });
d = await jsonOf(r);
check('affiliate sign-in returns a session token', r.status === 200 && String(d.token || '').startsWith('cs1.'), `HTTP ${r.status}`);
r = await call('/api/affiliate/stats', { bearer: basic(EMAIL, 'wrong-password') });
check('affiliate dashboard rejects a wrong password', r.status === 401, `HTTP ${r.status}`);

console.log('\n== Admin tokens vs customer tokens ==');
r = await call('/api/admin/login', { method: 'POST', bearer: ADMIN, body: { remember: false } });
const adminTok = (await jsonOf(r)).token;
check('owner can sign in to admin (local, no 2FA email configured)', r.status === 200 && !!adminTok, `HTTP ${r.status}`);
r = await call('/api/customer/me', { bearer: adminTok });
check('an admin token is not accepted as a customer session', r.status === 401, `HTTP ${r.status}`);
r = await call('/api/admin/customers', { bearer: token });
check('a customer session is not accepted by admin endpoints', r.status === 401, `HTTP ${r.status}`);

console.log('\n== Staff vs owner permissions ==');
r = await call('/api/admin/login', { method: 'POST', bearer: STAFF, body: { remember: false } });
const staffTok = (await jsonOf(r)).token;
check('staff can sign in', r.status === 200 && !!staffTok, `HTTP ${r.status}`);
r = await call('/api/admin/orders', { bearer: staffTok });
check('staff can still view orders', r.status === 200, `HTTP ${r.status}`);
const ownerOnly = [
  ['/api/admin/customers/delete', { email: 'nobody@test.local' }],
  ['/api/admin/orders/delete', { id: -1 }],
  ['/api/admin/customers/points', { email: EMAIL, delta: 500 }],
  ['/api/admin/customers/credit-email', { email: EMAIL, points: 500 }],
  ['/api/admin/customers/membership', { email: EMAIL, vip: true }],
  ['/api/admin/payouts/update', { id: -1, status: 'paid' }],
  ['/api/admin/promos', { code: 'STAFF100', pct: 100 }],
  ['/api/admin/promos/delete', { code: 'NOPE' }],
];
for (const [path, body] of ownerOnly) {
  r = await call(path, { method: 'POST', bearer: staffTok, body });
  check(`staff blocked from ${path}`, r.status === 403, `HTTP ${r.status}`);
}
r = await call('/api/admin/customers/points', { method: 'POST', bearer: adminTok, body: { email: EMAIL, delta: 1 } });
check('owner can still adjust points', r.status === 200, `HTTP ${r.status}`);

console.log('\n== Request hygiene ==');
r = await fetch(BASE + '/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('{"email":"a@b.c"}')); c.close(); } }), duplex: 'half' });
check('POST without Content-Length is refused', r.status === 411, `HTTP ${r.status}`);
r = await fetch(BASE + '/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pad: 'x'.repeat(110 * 1024) }) });
check('oversized body (110 KB) is refused', r.status === 413, `HTTP ${r.status}`);
r = await call('/api/receipt-image?o=OMEN-AAAAAA&t=000000000000000000000000');
check('receipt image with a forged link token is refused', r.status === 404, `HTTP ${r.status}`);

// ---- Cleanup
sql(`DELETE FROM customers WHERE email='${EMAIL}'; DELETE FROM affiliates WHERE email='${EMAIL}';`);
try { sql(`DELETE FROM points_adjustments WHERE email='${EMAIL}';`); } catch { /* table only exists once points were adjusted */ }

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
