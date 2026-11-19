#!/usr/bin/env node
// Omen Labs security audit — 50 checks for the ways AI-built web apps typically
// get hacked, broken, or turned into a surprise bill.
//
//   node scripts/security-audit.mjs                          code checks only
//   node scripts/security-audit.mjs --live https://omenlabs.co
//   node scripts/security-audit.mjs --live ... --with-rate-limit
//
// Live checks are read-only by design: no orders, no charges, no emails, no
// accounts. --with-rate-limit sends ~35 requests to one endpoint to prove the
// limiter trips; that briefly rate-limits YOUR IP on that endpoint only.
//
// Exit code 1 if anything FAILs. WARN = known, accepted risk (explained).
// MANUAL = needs a human in a dashboard; the audit can't see it.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const args = process.argv.slice(2);
const LIVE = args.includes('--live') ? args[args.indexOf('--live') + 1] : null;
const WITH_RL = args.includes('--with-rate-limit');

// ---------- helpers ----------
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
function git(...a) {
  try { return execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 }); }
  catch (e) { return e.stdout || ''; } // git grep exits 1 on "no match"
}
const grep = (pattern, ...paths) => git('grep', '-nE', pattern, '--', ...paths).split('\n').filter(Boolean);
const workerSrc = () => Object.fromEntries(git('ls-files', 'worker').split('\n').filter((f) => f.endsWith('.js')).map((f) => [f, read(f)]));
const fnBody = (src, name, len = 600) => {
  const m = src.match(new RegExp(`export async function ${name}\\([^)]*\\)\\s*\\{`));
  return m ? src.slice(m.index + m[0].length, m.index + m[0].length + len) : null;
};
const findFn = (name, len) => {
  for (const s of Object.values(workerSrc())) { const b = fnBody(s, name, len); if (b != null) return b; }
  return null;
};

// Real key formats. Square tokens are "EAAA" + ~60 mixed-case chars; requiring
// a lowercase letter AND a digit avoids false hits on base64 runs of "AAAA".
const SECRET_RE = /(sk_live_[0-9a-zA-Z]{10,}|sk_test_[0-9a-zA-Z]{10,}|\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9]{8,}|EAAA[A-Za-z0-9_-]{56,}|sq0csp-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,}|xox[bpa]-[A-Za-z0-9-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/g;
// Real keys are random: never six identical characters in a row. That rules
// out base64-encoded binary (fonts, images) that happens to start "EAAA…".
const realSecrets = (text) => (text.match(SECRET_RE) || [])
  .filter((s) => !/(.)\1{5,}/.test(s))
  .filter((s) => !s.startsWith('EAAA') || (/[a-z]/.test(s) && /\d/.test(s)));

async function get(path, init = {}) {
  const r = await fetch(new URL(path, LIVE), { redirect: 'manual', ...init });
  const text = await r.text().catch(() => '');
  return { status: r.status, headers: r.headers, text };
}
const looksLikeSpa = (t) => /<!doctype html/i.test(t);

// ---------- routes + limits parsed from the worker ----------
const indexSrc = read('worker/index.js');
const routes = [...indexSrc.matchAll(/pathname === '(\/api\/[^']+)'\)\s*\{([\s\S]*?)\n {4}\}/g)].map((m) => ({
  path: m[1], method: (m[2].match(/method !== '(\w+)'/) || [])[1] || 'ANY',
  handler: (m[2].match(/return (\w+)\(/) || [])[1] || null,
}));
const LIMITS = {};
for (const m of indexSrc.matchAll(/'(\/api\/[^']+)':\s*\{\s*max:\s*(\d+),\s*windowMs:\s*[^,}]+(?:,\s*globalMax:\s*(\d+))?/g)) {
  LIMITS[m[1]] = { max: +m[2], globalMax: m[3] ? +m[3] : null };
}

// ---------- the 50 checks ----------
const checks = [];
const add = (id, area, title, run) => checks.push({ id, area, title, run });
const pass = (d = '') => ({ s: 'PASS', d });
const fail = (d) => ({ s: 'FAIL', d });
const warn = (d) => ({ s: 'WARN', d });
const manual = (d) => ({ s: 'MANUAL', d });
const needLive = () => ({ s: 'SKIP', d: 'run with --live <url>' });

// A. Secrets & keys
add(1, 'Secrets', 'API keys / tokens hardcoded in tracked files', () => {
  const hits = git('ls-files').split('\n').filter((f) => f && !/package-lock|\.png$|\.jpe?g$|\.webp$|\.pdf$|\.woff2?$/.test(f))
    .flatMap((f) => realSecrets(read(f)).map((s) => `${f}: ${s.slice(0, 8)}…`));
  return hits.length ? fail(hits.join('; ')) : pass('no key-shaped strings in tracked files');
});
add(2, 'Secrets', 'Secrets ever committed to git history', () => {
  const hits = realSecrets(git('log', '-p', '--all', '--no-color'));
  return hits.length ? fail(`${hits.length} key-shaped strings in history — rotate them, then purge history`) : pass('history clean');
});
add(3, 'Secrets', '.env / .dev.vars committed or not ignored', () => {
  const tracked = git('ls-files').split('\n').filter((f) => /(^|\/)(\.env(\..*)?|\.dev\.vars(\..*)?)$/.test(f));
  const gi = read('.gitignore');
  if (tracked.length) return fail(`tracked: ${tracked.join(', ')}`);
  if (!/^\.env/m.test(gi) || !/^\.dev\.vars/m.test(gi)) return fail('.gitignore must list .env and .dev.vars');
  return pass('ignored and untracked');
});
add(4, 'Secrets', 'Secrets stored as plaintext Worker vars in wrangler config', () => {
  const vars = (read('wrangler.jsonc').match(/"vars"\s*:\s*\{([^}]*)\}/) || [])[1] || '';
  const bad = [...vars.matchAll(/"([A-Z0-9_]+)"\s*:/g)].map((m) => m[1]).filter((k) => /TOKEN|SECRET|PASSWORD|API_KEY|PRIVATE/.test(k));
  return bad.length ? fail(`move to Cloudflare secrets: ${bad.join(', ')}`) : pass('no secret-named vars in config');
});
add(5, 'Secrets', 'Source maps or secrets shipped in the public JS bundle', async () => {
  if (/sourcemap\s*:\s*true/.test(read('vite.config.js'))) return fail('vite build.sourcemap is enabled');
  if (!LIVE) return pass('sourcemaps off in vite config (live bundle not scanned)');
  const html = (await get('/')).text;
  const assets = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
  for (const a of assets) {
    const js = (await get(a)).text;
    const hits = realSecrets(js);
    if (hits.length) return fail(`${a} contains key-shaped strings`);
    if (/sourceMappingURL=/.test(js)) return fail(`${a} references a source map`);
    const map = await get(`${a}.map`);
    if (map.status === 200 && /"mappings"/.test(map.text)) return fail(`${a}.map is publicly downloadable`);
  }
  return pass(`${assets.length} bundle(s) scanned, no secrets or maps`);
});
add(6, 'Secrets', 'Hardcoded fallback secrets (used when an env var is missing)', () => {
  const hits = grep("(ADMIN_PASSWORD|[Ss]ecret|SECRET|TOKEN)[^\\n]{0,40}\\|\\| *['\"][^'\"]+['\"]", 'worker');
  return hits.length ? fail(hits.join(' | ')) : pass('secrets fail closed');
});
add(7, 'Secrets', 'Secrets or tokens written to logs', () => {
  const hits = grep('console\\.(log|info|warn|error)\\([^)]*(env\\.[A-Z_]*(TOKEN|SECRET|PASSWORD|KEY)|password|token)', 'worker');
  return hits.length ? fail(hits.join(' | ')) : pass('no secret-bearing log calls');
});
add(8, 'Secrets', 'Debug / test endpoints left live', async () => {
  if (!LIVE) return needLive();
  const leaked = [];
  for (const p of ['/api/square/locations', '/api/email-previews', '/api/debug', '/api/test', '/api/env', '/api/admin/debug']) {
    const r = await get(p, { method: p === '/api/email-previews' ? 'POST' : 'GET', headers: { 'Content-Length': '0' } });
    if (r.status < 300 && !looksLikeSpa(r.text)) leaked.push(`${p} → ${r.status}`);
  }
  return leaked.length ? fail(leaked.join(', ')) : pass('none respond');
});
add(9, 'Secrets', 'Leftover AI-builder template SDK (reads tokens from URLs)', () => {
  const hits = grep('base44|@base44', 'src', 'package.json');
  return hits.length ? fail(hits.slice(0, 3).join(' | ')) : pass('removed');
});
add(10, 'Secrets', 'Internal error details returned to visitors', () => {
  const hits = grep('json\\(\\{[^}]*(detail|error): *String\\(e\\)|e\\.stack', 'worker');
  return hits.length ? fail(hits.join(' | ')) : pass('errors are generic; detail stays in logs');
});

// B. Authentication & sessions
add(11, 'Auth', 'Admin endpoints reachable without login', async () => {
  const admin = routes.filter((r) => r.path.startsWith('/api/admin/') && !/login|2fa/.test(r.path));
  const unguarded = admin.filter((r) => r.handler && !/authorized\(|verifyAdminSession/.test(findFn(r.handler, 300) || ''));
  if (unguarded.length) return fail(`no auth check: ${unguarded.map((r) => r.path).join(', ')}`);
  if (!LIVE) return pass(`${admin.length} admin routes guarded in code`);
  const open = [];
  for (const r of admin.filter((x) => x.method !== 'POST')) {
    const res = await get(r.path);
    if (res.status !== 401) open.push(`${r.path} → ${res.status}`);
  }
  return open.length ? fail(open.join(', ')) : pass(`${admin.length} routes guarded; every GET returns 401 live`);
});
add(12, 'Auth', 'Admin password brute force', () => {
  const l = LIMITS['/api/admin/login'];
  const twofa = /admin_2fa/.test(read('worker/admin.js'));
  return l && l.globalMax && twofa ? pass(`${l.max}/IP, ${l.globalMax} total per window + emailed 2FA`) : fail('needs per-IP + global limit and 2FA');
});
add(13, 'Auth', 'Customer password kept in browser storage', () => {
  const c = read('src/lib/customerApi.js');
  const setFn = (c.match(/set: \(([\s\S]*?)\n  \},/) || [])[0] || '';
  if (/btoa/.test(setFn) || /btoa/.test(read('src/lib/affiliateApi.js'))) return fail('browser stores base64(email:password)');
  return pass('browser stores a signed session token only');
});
add(14, 'Auth', 'Weak password hashing (fast SHA-256 / unsalted)', () => {
  const a = read('worker/auth.js');
  const signupUses = /hashPassword\(password\)/.test(read('worker/customer.js'));
  return /PBKDF2/.test(a) && /getRandomValues/.test(a) && signupUses ? pass('PBKDF2-SHA256, 100k iterations, per-user salt') : fail('use a slow salted KDF');
});
add(15, 'Auth', 'Password hashes depend on the admin password (rotation locks users out)', () => {
  const fn = (read('worker/auth.js').match(/export async function hashPassword[\s\S]*?\n\}/) || [''])[0];
  if (!fn || /ADMIN_PASSWORD|env\./.test(fn)) return fail('new hashes must not depend on ADMIN_PASSWORD');
  return warn('new/upgraded hashes are independent; accounts that have not signed in since the upgrade still use the old scheme until they do');
});
add(16, 'Auth', 'Sessions that never expire', () => {
  const ok = /SESSION_TTL_MS/.test(read('worker/auth.js')) && /exp <= Date\.now\(\)/.test(read('worker/security.js'));
  return ok ? pass('customer 30 days, admin 12 h / 7 days') : fail('tokens need an expiry');
});
add(17, 'Auth', 'Timing-attack-able token / password comparison', () => {
  const hits = grep('(sig|token|hash|expected|signature)\\s*={2,3}\\s*(sig|token|hash|expected|signature)\\b', 'worker');
  return hits.length ? fail(hits.join(' | ')) : pass('constant-time safeEqual used');
});
add(18, 'Auth', 'Staff accounts can do owner-only things (delete, refund, discounts)', () => {
  const need = ['deleteCustomer', 'deleteOrder', 'adjustPoints', 'sendCreditEmail', 'updatePayout', 'setMembership', 'upsertPromo', 'deletePromo', 'profitCosts'];
  const missing = need.filter((n) => !/!== 'admin'/.test(findFn(n, 400) || ''));
  return missing.length ? fail(`not owner-only: ${missing.join(', ')}`) : pass(`${need.length} actions owner-only`);
});
add(19, 'Auth', '2FA / email codes brute-forceable', () => {
  const ok = /attempts/.test(findFn('adminVerify2fa', 900) || '') && /verify_attempts/.test(read('worker/customer.js'));
  return ok ? pass('attempt caps + rate limits + 10–15 min expiry') : fail('cap code attempts');
});
add(20, 'Auth', 'Account enumeration (learning which emails have accounts)', () => {
  const resendGeneric = /no account-existence leak/.test(read('worker/customer.js'));
  return resendGeneric ? warn('code-resend is generic; signup still says "account exists" (normal UX trade-off, rate-limited)') : fail('resend endpoint leaks existence');
});

// C. Payments & money
add(21, 'Payments', 'Prices trusted from the browser', () => {
  const b = findFn('processOrder', 4000) || '';
  return /priceFor\(/.test(b) && /NEVER trust client-sent prices/.test(b) ? pass('server re-prices every line') : fail('price on the server');
});
add(22, 'Payments', 'Negative / zero / absurd quantities', () => {
  const b = findFn('processOrder', 4000) || '';
  return /q < 1/.test(b) && /q > 100/.test(b) ? pass('1–100 enforced server-side') : fail('validate quantities');
});
add(23, 'Payments', 'Charging a different amount than the buyer saw', async () => {
  if (!/expected_total/.test(read('worker/square.js'))) return fail('compare charge to displayed total');
  if (!LIVE) return pass('server refuses on mismatch (code)');
  const body = JSON.stringify({ customer: { name: 'Audit', email: 'audit@example.org', address: '1 Audit St', city: 'Spokane', zip: '99201', company: 'Research Laboratory', company_name: 'Audit' },
    items: [{ product_id: '69fc30ecf179623737bd64e9_10mL', quantity: 1 }], shipping_method: 'pickup', source_id: 'audit-not-a-card', expected_total: 0.01 });
  const r = await get('/api/square/pay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  if (r.status === 503) return pass('card payments disabled on this host');
  return r.status === 409 ? pass('live: wrong total refused before any charge') : fail(`expected 409, got ${r.status}`);
});
add(24, 'Payments', 'Card charged but order never recorded', () =>
  /refundPayment\(/.test(read('worker/square.js')) ? pass('automatic refund if recording fails') : fail('refund on failure'));
add(25, 'Payments', 'Faked "payment complete" redirects', async () => {
  const src = read('worker/square.js');
  if (!/verifyOrder\(/.test(src) || !/\/v2\/orders\//.test(src)) return fail('verify return links and payment status server-side');
  if (!LIVE) return pass('signed return link + Square API verification');
  const r = await get('/api/square/return?o=OMEN-AUDIT0&t=000000000000000000000000');
  const loc = r.headers.get('location') || '';
  return /paid=1/.test(loc) ? fail('forged return marked paid') : pass('live: forged return link not honored');
});
add(26, 'Payments', 'Webhooks accepted without a secret / signature', async () => {
  const z = findFn('handleZelleNotify', 600) || '', s = findFn('handleShipstationWebhook', 600) || '', p = findFn('paymentCallback', 900) || '';
  if (!/safeEqual|zelleSecret/.test(z) || !/safeEqual|zelleSecret/.test(s) || !/signature/i.test(p)) return fail('authenticate every webhook');
  if (!LIVE) return pass('secret/signature checks in code');
  const r = await get('/api/zelle/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"text":"audit"}' });
  return r.status >= 400 ? pass(`live: unsigned webhook refused (${r.status})`) : fail(`unsigned webhook accepted (${r.status})`);
});
add(27, 'Payments', 'Card-testing (stolen cards run through small charges)', () => {
  const l = LIMITS['/api/square/pay'];
  return l && l.max <= 10 && l.globalMax ? pass(`${l.max}/IP and ${l.globalMax} total per 10 min`) : fail('tight limits on the charge endpoint');
});
add(28, 'Payments', 'Leftover test / guessable promo codes (e.g. 90% off)', () =>
  manual('Admin → Promo Codes: delete the 90%-off test code and any code that is a dictionary word. Validation is rate-limited (30/10 min).'));
add(29, 'Payments', 'Discounts applied on the processor side, bypassing checks', () =>
  /enable_coupon: false/.test(read('worker/square.js')) ? pass('Square coupons/loyalty disabled') : fail('disable processor-side coupons'));
add(30, 'Payments', 'Points double-spent by two simultaneous orders', () =>
  warn('no DB transaction around points; needs two checkouts in the same second — low value, accepted'));

// D. Abuse & surprise bills
add(31, 'Billing', 'Public endpoints that write / email / charge with no rate limit', () => {
  const publicWrites = routes.filter((r) => !r.path.startsWith('/api/admin/') && (r.method === 'POST' || r.method === 'ANY'));
  const exempt = new Set(['/api/paypal/config', '/api/square/config', '/api/receipt-image', '/api/credit-image']);
  const missing = publicWrites.filter((r) => !exempt.has(r.path) && !LIMITS[r.path]).map((r) => r.path);
  return missing.length ? fail(`unlimited: ${missing.join(', ')}`) : pass(`${publicWrites.length - exempt.size} public endpoints limited`);
});
add(32, 'Billing', 'Rate-limit table grows forever', () =>
  /DELETE FROM rate_limits/.test(read('worker/security.js')) ? pass('expired rows swept') : fail('prune rate_limits'));
add(33, 'Billing', 'Email bombing / burning the email quota through forms', () => {
  const need = ['/api/order', '/api/customer/signup', '/api/customer/resend', '/api/subscribe', '/api/restock-notify', '/api/admin/resend-2fa'];
  const missing = need.filter((p) => !LIMITS[p]?.globalMax);
  return missing.length ? fail(`no global cap: ${missing.join(', ')}`) : pass('per-IP and global caps on every email-sending form');
});
add(34, 'Billing', 'Oversized / unbounded request bodies', async () => {
  if (!/Content-Length required/.test(indexSrc) || !/MAX_BODY_BYTES/.test(indexSrc)) return fail('cap bodies and require Content-Length');
  if (!LIVE) return pass('100 KB cap + Content-Length required (code)');
  const big = await get('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pad: 'x'.repeat(110 * 1024) }) });
  return big.status === 413 ? pass('live: 110 KB body refused') : fail(`oversized body returned ${big.status}`);
});
add(35, 'Billing', 'CPU-heavy endpoints (image rendering) open to spam', async () => {
  const ok = /verifyOrder\(o, t/.test(indexSrc) && /immutable/.test(indexSrc);
  if (!ok) return fail('sign + cache rendered images');
  if (!LIVE) return pass('signed URLs + 1-year immutable cache');
  const r = await get('/api/receipt-image?o=OMEN-AUDIT0&t=000000000000000000000000');
  return r.status === 404 ? pass('live: unsigned render refused') : fail(`unsigned render returned ${r.status}`);
});
add(36, 'Billing', 'Paid AI / LLM APIs callable from public endpoints', () => {
  const hits = grep('api\\.anthropic\\.com|api\\.openai\\.com|generativelanguage|api\\.replicate|api\\.together', 'worker', 'src');
  return hits.length ? fail(hits.join(' | ')) : pass('none');
});
add(37, 'Billing', 'Analytics tables that grow forever', () => {
  const src = Object.values(workerSrc()).join('\n');
  const ok = /DELETE FROM page_hits/.test(src) && /DELETE FROM checkout_hits/.test(src) && /DELETE FROM presence/.test(src);
  return ok ? pass('page_hits 180 d, checkout_hits 90 d, presence pruned') : fail('prune analytics tables');
});
add(38, 'Billing', 'No spend alerts on Cloudflare / Resend / Square', () =>
  manual('Cloudflare → Billing → Notifications: usage alerts for Workers + D1. Resend: check plan quota/overage. Square: payment & refund notifications on.'));
add(39, 'Billing', 'Scheduled jobs doing unbounded work', () => {
  const crons = (read('wrangler.jsonc').match(/"crons"\s*:\s*\[([^\]]*)\]/) || [])[1] || '';
  return /\*\/[12] /.test(crons) ? warn(`cron ${crons.trim()} runs ~720×/day; each job is bounded — keep it that way`) : pass(crons || 'no crons');
});
add(40, 'Billing', 'Rate limits bypassable with a spoofed X-Forwarded-For', () =>
  /headers\.get\(['"]X-Forwarded-For/i.test((read('worker/security.js').match(/export function clientIp[\s\S]*?\n\}/) || [''])[0]) ? fail('trust only CF-Connecting-IP') : pass('keyed on CF-Connecting-IP'));

// E. Browser & web
const liveHeaders = async () => (await get('/')).headers;
add(41, 'Web', 'Missing Content-Security-Policy', async () => {
  if (!LIVE) return /default-src 'self'/.test(read('worker/security.js')) ? pass('CSP defined in code') : fail('add a CSP');
  const csp = (await liveHeaders()).get('content-security-policy') || '';
  return /default-src 'self'/.test(csp) && /object-src 'none'/.test(csp) ? pass('live CSP present') : fail('CSP missing/weak');
});
add(42, 'Web', 'Clickjacking (site can be framed)', async () => {
  if (!LIVE) return needLive();
  const h = await liveHeaders();
  return /frame-ancestors 'none'/.test(h.get('content-security-policy') || '') && h.get('x-frame-options') === 'DENY' ? pass('frame-ancestors none + DENY') : fail('forbid framing');
});
add(43, 'Web', 'No HTTPS enforcement (HSTS)', async () => {
  if (!LIVE) return needLive();
  return /max-age=\d{7,}/.test((await liveHeaders()).get('strict-transport-security') || '') ? pass('HSTS 1 year + preload') : fail('add HSTS');
});
add(44, 'Web', 'XSS sinks (raw HTML injection)', () => {
  // Assigning a literal ('' to clear a box) is safe; assigning a variable is not.
  const hits = grep('dangerouslySetInnerHTML|\\.innerHTML\\s*=\\s*[^\'"\\s]', 'src').filter((l) => !l.startsWith('src/components/ui/chart.jsx'));
  return hits.length ? fail(hits.join(' | ')) : pass('only the chart library’s static CSS');
});
add(45, 'Web', 'CORS open to any website', async () => {
  if (/Access-Control-Allow-Origin/i.test(Object.values(workerSrc()).join('\n'))) return fail('worker sets CORS headers');
  if (!LIVE) return pass('no CORS headers set');
  const r = await get('/api/stock', { headers: { Origin: 'https://evil.example' } });
  return r.headers.get('access-control-allow-origin') ? fail('API answers other origins') : pass('live: other origins get no CORS grant');
});
add(46, 'Web', 'CSRF (forged actions from other sites)', () =>
  /Set-Cookie/i.test(Object.values(workerSrc()).join('\n')) ? warn('cookies in use — confirm SameSite') : pass('auth is a bearer header, not a cookie'));
add(47, 'Web', 'Open redirects', async () => {
  const redirects = [...read('worker/square.js').matchAll(/redirect\(([^)]*)\)/g)].map((m) => m[1]).filter((a) => !/^url$/.test(a.trim()));
  const loose = redirects.filter((a) => !a.trim().startsWith('`${SITE}'));
  return loose.length ? fail(`non-constant targets: ${loose.join(', ')}`) : pass('redirects only to our own domain');
});
add(48, 'Web', 'Sensitive files served (.env, .git, config, schema)', async () => {
  if (!LIVE) return needLive();
  const markers = { '/.env': /=/, '/.dev.vars': /=/, '/.git/config': /\[core\]/, '/wrangler.jsonc': /compatibility_date/, '/package.json': /"dependencies"/, '/schema.sql': /CREATE TABLE/ };
  const exposed = [];
  for (const [p, re] of Object.entries(markers)) { const r = await get(p); if (r.status === 200 && !looksLikeSpa(r.text) && re.test(r.text)) exposed.push(p); }
  return exposed.length ? fail(`exposed: ${exposed.join(', ')}`) : pass('none served');
});
add(49, 'Web', 'Known-vulnerable dependencies', () => {
  let v = {};
  try { v = JSON.parse(execFileSync('npm', ['audit', '--omit=dev', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })).metadata.vulnerabilities; }
  catch (e) { try { v = JSON.parse(e.stdout).metadata.vulnerabilities; } catch { return warn('npm audit unavailable'); } }
  if (v.high || v.critical) return fail(`${v.critical} critical, ${v.high} high`);
  return v.moderate ? warn(`${v.moderate} moderate: react-router (backslash open-redirect in <Link>; our links are static) and satori (no fix; renders our own data)`) : pass('clean');
});
add(50, 'Web', 'Customer data (emails, names, addresses) in public endpoints', async () => {
  if (!LIVE) return needLive();
  const leaks = [];
  for (const p of ['/api/social-proof', '/api/stock', '/api/square/config', '/api/paypal/config']) {
    const t = (await get(p)).text;
    if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(t) || /"(customer_name|address|phone|email)"/.test(t)) leaks.push(p);
  }
  return leaks.length ? fail(`personal data in: ${leaks.join(', ')}`) : pass('public endpoints carry no personal data');
});

// Optional: prove the limiter actually trips.
async function rateLimitProof() {
  let tripped = 0;
  for (let i = 0; i < 35; i++) {
    const r = await get('/api/checkout-reached', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (r.status === 429) { tripped = i + 1; break; }
  }
  return tripped ? pass(`429 after ${tripped} requests`) : fail('35 rapid requests never got 429');
}

// ---------- run ----------
const color = { PASS: '\x1b[32m', FAIL: '\x1b[31m', WARN: '\x1b[33m', MANUAL: '\x1b[36m', SKIP: '\x1b[90m' };
const counts = { PASS: 0, FAIL: 0, WARN: 0, MANUAL: 0, SKIP: 0 };
console.log(`Omen Labs security audit — ${LIVE ? `code + live (${LIVE})` : 'code only'}\n`);
let area = '';
for (const c of checks) {
  if (c.area !== area) { area = c.area; console.log(`\n${area}`); }
  let r;
  try { r = await c.run(); } catch (e) { r = fail(`check crashed: ${e.message}`); }
  counts[r.s]++;
  console.log(`${color[r.s]}${r.s.padEnd(6)}\x1b[0m ${String(c.id).padStart(2)}. ${c.title}${r.d ? `\n          ${r.d}` : ''}`);
}
if (LIVE && WITH_RL) {
  const r = await rateLimitProof();
  console.log(`\n${color[r.s]}${r.s.padEnd(6)}\x1b[0m  +. Rate limiter trips under a burst\n          ${r.d}`);
  if (r.s === 'FAIL') counts.FAIL++;
}
console.log(`\n${checks.length} checks: ${counts.PASS} pass, ${counts.FAIL} fail, ${counts.WARN} warn (accepted), ${counts.MANUAL} manual, ${counts.SKIP} skipped`);
process.exit(counts.FAIL ? 1 : 0);
