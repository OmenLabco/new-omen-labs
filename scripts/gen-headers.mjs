// Writes dist/_headers so pages Cloudflare serves straight from storage (the
// homepage, 404.html, assets) carry the same security headers the worker adds
// to everything it handles. Generated from worker/security.js at build time so
// the two lists can never drift apart.
import { writeFileSync } from 'node:fs';
import { SECURITY_HEADERS } from '../worker/security.js';

const lines = ['/*', ...Object.entries(SECURITY_HEADERS).map(([k, v]) => `  ${k}: ${v}`)];
writeFileSync(new URL('../dist/_headers', import.meta.url), `${lines.join('\n')}\n`);
console.log(`dist/_headers: ${Object.keys(SECURITY_HEADERS).length} headers`);
