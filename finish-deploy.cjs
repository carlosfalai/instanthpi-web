#!/usr/bin/env node
/**
 * finish-deploy.cjs — babysit an existing Netlify deploy that is stuck in
 * "new" (cold digest processing). The moment it leaves "new", upload our
 * files and wait for ready. Never cancels anything.
 *
 * Usage: node finish-deploy.cjs <deploy_id> [file paths...]
 *        (default files: the FILES list of refresh-donations.cjs minus /index.html)
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const DEPLOY_ID = process.argv[2];
if (!DEPLOY_ID) { console.error('usage: node finish-deploy.cjs <deploy_id>'); process.exit(2); }
const SITE_DIR = process.env.SITE_DIR || path.join(__dirname, 'site');
const FILES = process.argv.length > 3 ? process.argv.slice(3) :
  ['/donations/index.html', '/donations/donations.json', '/4chan/index.html',
   '/4chan/threads.json', '/courses/index.html', '/courses/courses.json'];

function env(name) {
  const line = fs.readFileSync('C:\\Users\\insta\\.claude\\.env', 'utf8')
    .split(/\r?\n/).find(l => l.startsWith(name + '='));
  return line.slice(name.length + 1).trim();
}
function req(method, url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const r = https.request({ hostname: u.hostname, path: u.pathname + u.search, method, headers }, res => {
      let d = [];
      res.on('data', c => d.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(d).toString('utf8') }));
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

(async () => {
  const auth = { Authorization: 'Bearer ' + env('NETLIFY_ACCESS_TOKEN') };
  let deploy = { state: 'new' };
  for (let i = 0; i < 1080; i++) { // up to 90 min
    const st = await req('GET', 'https://api.netlify.com/api/v1/deploys/' + DEPLOY_ID, auth);
    deploy = JSON.parse(st.body);
    if (deploy.state !== 'new') break;
    if (i % 36 === 0) console.log('waiting:', deploy.state, Math.round(i * 5 / 60) + 'min');
    await new Promise(r => setTimeout(r, 5000));
  }
  console.log('left "new" ->', deploy.state);
  if (['error', 'new'].includes(deploy.state)) { console.log('FAILED:', deploy.state); process.exit(1); }
  if (deploy.state !== 'ready') {
    for (const p of FILES) {
      const buf = fs.readFileSync(path.join(SITE_DIR, ...p.split('/').filter(Boolean)));
      const up = await req('PUT', 'https://api.netlify.com/api/v1/deploys/' + DEPLOY_ID + '/files' + encodeURI(p),
        Object.assign({ 'Content-Type': 'application/octet-stream' }, auth), buf);
      console.log('PUT', p, up.status);
    }
  }
  for (let i = 0; i < 240; i++) {
    const st = await req('GET', 'https://api.netlify.com/api/v1/deploys/' + DEPLOY_ID, auth);
    const s = JSON.parse(st.body).state;
    if (s === 'ready') { console.log('READY'); process.exit(0); }
    if (s === 'error') { console.log('ERROR'); process.exit(1); }
    await new Promise(r => setTimeout(r, 3000));
  }
  console.log('timed out waiting for ready'); process.exit(1);
})().catch(e => { console.error(e.message); process.exit(1); });
