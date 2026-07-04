#!/usr/bin/env node
/**
 * deploy-pages.cjs — additively deploy an arbitrary list of site/ files to
 * the Netlify site "instanthpi" (instanthpi.ai). Same create→wait-out-of-new→PUT
 * recipe as refresh-donations.cjs, without touching Stripe data.
 *
 * Usage: node deploy-pages.cjs /education/index.html /network/index.html
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_PATH = 'C:\\Users\\insta\\.claude\\.env';
// default = OLD instanthpi.netlify.app site; the APEX instanthpi.ai is the
// NEXUS site c1e311c5-9bf4-4ad8-a2a4-9922493d4fab (set NETLIFY_SITE_ID).
const SITE_ID = process.env.NETLIFY_SITE_ID || '60d1889b-2759-4155-a141-4534c9c1864f';
const SITE_DIR = path.join(__dirname, 'site');
// each arg: "/remote/path.html" (read from site/<path>) or
// "/remote/path.html=local-relative-file" (read from site/<local file>)
const ARGS = process.argv.slice(2);
if (!ARGS.length) { console.error('usage: node deploy-pages.cjs </path/one.html[=localfile]> ...'); process.exit(2); }
const FILES = ARGS.map(a => { const i = a.indexOf('='); return i < 0 ? { remote: a, local: a } : { remote: a.slice(0, i), local: '/' + a.slice(i + 1) }; });
const OMIT = p => p.startsWith('/grants/') || /^\/cdp-[^/]+\.js$/.test(p);

function env(name) {
  const line = fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/).find(l => l.startsWith(name + '='));
  if (!line) throw new Error('Missing ' + name + ' in ' + ENV_PATH);
  return line.slice(name.length + 1).trim();
}
function req(method, url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const r = https.request({ hostname: u.hostname, path: u.pathname + u.search, method, headers }, res => {
      let data = [];
      res.on('data', c => data.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(data).toString('utf8') }));
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}
function sha1(buf) { return crypto.createHash('sha1').update(buf).digest('hex'); }

(async () => {
  const auth = { Authorization: 'Bearer ' + env('NETLIFY_ACCESS_TOKEN') };
  const cur = await req('GET', 'https://api.netlify.com/api/v1/sites/' + SITE_ID + '/files', auth);
  if (cur.status !== 200) throw new Error('Netlify files list: HTTP ' + cur.status);
  const digest = {};
  for (const f of JSON.parse(cur.body)) {
    if (OMIT(f.id)) continue;
    digest[f.id] = f.sha;
  }
  const local = {};
  let changed = false;
  for (const f of FILES) {
    const buf = fs.readFileSync(path.join(SITE_DIR, ...f.local.split('/').filter(Boolean)));
    local[f.remote] = buf;
    if (digest[f.remote] !== sha1(buf)) changed = true;
    digest[f.remote] = sha1(buf);
  }
  if (!changed) { console.log('site already current — no deploy needed'); return; }
  const dep = await req('POST', 'https://api.netlify.com/api/v1/sites/' + SITE_ID + '/deploys',
    Object.assign({ 'Content-Type': 'application/json' }, auth), JSON.stringify({ files: digest }));
  if (dep.status >= 300) throw new Error('deploy create: HTTP ' + dep.status + ' ' + dep.body.slice(0, 200));
  let deploy = JSON.parse(dep.body);
  console.log('deploy', deploy.id, 'state:', deploy.state);
  for (let i = 0; i < 540 && deploy.state === 'new'; i++) {
    await new Promise(r => setTimeout(r, 5000));
    deploy = JSON.parse((await req('GET', 'https://api.netlify.com/api/v1/deploys/' + deploy.id, auth)).body);
    if (i % 24 === 0) console.log('  digest processing:', deploy.state, '(' + Math.round(i * 5 / 60) + ' min)');
  }
  if (deploy.state === 'new') throw new Error('deploy stuck in "new" after 45 min');
  if (deploy.state === 'error') throw new Error('deploy errored during digest processing');
  for (const f of FILES) {
    const up = await req('PUT', 'https://api.netlify.com/api/v1/deploys/' + deploy.id + '/files' + encodeURI(f.remote),
      Object.assign({ 'Content-Type': 'application/octet-stream' }, auth), local[f.remote]);
    if (up.status >= 300 && up.status !== 422) throw new Error('Upload ' + f.remote + ': HTTP ' + up.status + ' ' + up.body.slice(0, 200));
    console.log('uploaded', f.remote, up.status);
  }
  for (let i = 0; i < 240; i++) {
    const s = JSON.parse((await req('GET', 'https://api.netlify.com/api/v1/deploys/' + deploy.id, auth)).body).state;
    if (s === 'ready') { console.log('READY — https://instanthpi.ai' + FILES[0].remote.replace(/index\.html$/, '')); return; }
    if (s === 'error') throw new Error('deploy failed');
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('timed out waiting for ready');
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
