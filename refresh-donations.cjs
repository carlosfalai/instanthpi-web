#!/usr/bin/env node
/**
 * refresh-donations.cjs
 * Pulls paid donations from the Stripe payment link, rebuilds
 * site/donations/donations.json, and additively deploys
 * /donations/index.html + /donations/donations.json to the Netlify
 * site "instanthpi" (instanthpi.ai / instanthpi.netlify.app).
 *
 * Run: node refresh-donations.cjs
 * Scheduled task "InstantHPI Donations Refresh" runs this hourly.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_PATH = 'C:\\Users\\insta\\.claude\\.env';
const SITE_ID = '60d1889b-2759-4155-a141-4534c9c1864f';
const PAYMENT_LINK = 'plink_1TooGlKyyCqeElTHOrspyzSC';
const ASSOC_LINK = 'plink_1TopCoKyyCqeElTHu90yGEng'; // $100/mo physicians association
const COURSE_LINKS = { // $35 modules; unlock free for everyone at 1000 buyers
  m1: 'plink_1ToqKVKyyCqeElTHMLVWIGI4',
  m2: 'plink_1ToqKYKyyCqeElTH3TveLvDi',
  m3: 'plink_1ToqKaKyyCqeElTHpAtIpumJ',
  m4: 'plink_1ToqKcKyyCqeElTHK9pANnYX',
  m5: 'plink_1ToqKfKyyCqeElTHYYgvk1ch',
  m6: 'plink_1ToqKiKyyCqeElTHJMa1yXaf',
  m7: 'plink_1Toqe8KyyCqeElTHI0ceRBnR', // Prepping / post-apocalyptic healthcare
};
const UNLOCK_AT = 1000;
const SITE_DIR = path.join(__dirname, 'site');
const JSON_PATH = path.join(SITE_DIR, 'donations', 'donations.json');
const COURSES_PATH = path.join(SITE_DIR, 'courses', 'courses.json');
const FILES = ['/donations/index.html', '/donations/donations.json', '/4chan/index.html', '/4chan/threads.json', '/courses/index.html', '/courses/courses.json', '/index.html', '/story.html', '/timeline-data.js'];
// paths REMOVED from the site on every deploy (internal material + license-association mentions)
const OMIT = p => p.startsWith('/grants/') || /^\/cdp-[^/]+\.js$/.test(p);

function env(name) {
  const line = fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)
    .find(l => l.startsWith(name + '='));
  if (!line) throw new Error('Missing ' + name + ' in ' + ENV_PATH);
  return line.slice(name.length + 1).trim();
}

function req(method, url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const r = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method, headers,
    }, res => {
      let data = [];
      res.on('data', c => data.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(data).toString('utf8') }));
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

async function stripeDonations(key) {
  const auth = { Authorization: 'Basic ' + Buffer.from(key + ':').toString('base64') };
  const PROJECTS = { healthbots: 'Health bots', preppers: 'Preppers', doctors: 'For doctors', gita: 'Sacred Gita', law: 'Law system', marriage: 'Dating/Marriage', courses: 'Courses', all: 'All of it' };
  let donors = [];
  for (const [plink, defaultProject] of [[PAYMENT_LINK, ''], [ASSOC_LINK, 'Physicians Assoc']]) {
    let starting_after = null;
    for (let page = 0; page < 50; page++) {
      let url = 'https://api.stripe.com/v1/checkout/sessions?limit=100&payment_link=' + plink;
      if (starting_after) url += '&starting_after=' + starting_after;
      const res = await req('GET', url, auth);
      const d = JSON.parse(res.body);
      if (d.error) throw new Error('Stripe: ' + d.error.message);
      for (const s of d.data) {
        if (s.payment_status !== 'paid') continue;
        const cf = (s.custom_fields || []).find(f => f.key === 'display_name');
        const name = (cf && cf.text && cf.text.value) ? cf.text.value.slice(0, 40) : 'Anonymous';
        const pf = (s.custom_fields || []).find(f => f.key === 'project');
        donors.push({
          name,
          project: PROJECTS[(pf && pf.dropdown && pf.dropdown.value) || ''] || defaultProject,
          amount: Math.round((s.amount_total || 0) / 100),
          currency: (s.currency || 'usd').toUpperCase(),
          date: new Date(s.created * 1000).toISOString().slice(0, 10),
          ts: s.created,
        });
      }
      if (!d.has_more) break;
      starting_after = d.data[d.data.length - 1].id;
    }
  }
  donors.sort((a, b) => b.ts - a.ts);
  donors.forEach(x => delete x.ts);
  return donors;
}

function sha1(buf) { return crypto.createHash('sha1').update(buf).digest('hex'); }

async function courseCounts(key) {
  const auth = { Authorization: 'Basic ' + Buffer.from(key + ':').toString('base64') };
  const modules = {};
  for (const [mod, plink] of Object.entries(COURSE_LINKS)) {
    let sold = 0, starting_after = null;
    for (let page = 0; page < 50; page++) {
      let url = 'https://api.stripe.com/v1/checkout/sessions?limit=100&payment_link=' + plink;
      if (starting_after) url += '&starting_after=' + starting_after;
      const d = JSON.parse((await req('GET', url, auth)).body);
      if (d.error) throw new Error('Stripe courses: ' + d.error.message);
      sold += d.data.filter(s => s.payment_status === 'paid').length;
      if (!d.has_more) break;
      starting_after = d.data[d.data.length - 1].id;
    }
    modules[mod] = { sold, unlocked: sold >= UNLOCK_AT };
  }
  return modules;
}

async function netlifyDeploy(token) {
  const auth = { Authorization: 'Bearer ' + token };
  // 1. current file digest (additive: keep everything already on the site)
  const cur = await req('GET', 'https://api.netlify.com/api/v1/sites/' + SITE_ID + '/files', auth);
  if (cur.status !== 200) throw new Error('Netlify files list: HTTP ' + cur.status);
  const digest = {};
  let omitted = 0;
  for (const f of JSON.parse(cur.body)) {
    if (OMIT(f.id)) { omitted++; continue; }
    digest[f.id] = f.sha;
  }
  if (omitted) console.log('omitting', omitted, 'files from the site (grants/, cdp-*.js)');
  // 2. overlay our files; skip the whole deploy if the site already has them
  const local = {};
  let changed = false;
  for (const p of FILES) {
    const buf = fs.readFileSync(path.join(SITE_DIR, p.replace(/\//g, path.sep).replace(/^\\/, '')));
    local[p] = buf;
    if (digest[p] !== sha1(buf)) changed = true;
    digest[p] = sha1(buf);
  }
  if (omitted) changed = true; // removing files is a change too
  if (!changed) { console.log('site already current — no deploy needed'); return; }
  // 3. create deploy. Do NOT wait for "prepared" — on this 16k-file site the
  //    sync digest can sit in state "new" for 10+ minutes. PUT the files
  //    immediately after create; Netlify accepts content-addressed uploads
  //    right away and flips the deploy to ready (verified 2026-07-02).
  const dep = await req('POST', 'https://api.netlify.com/api/v1/sites/' + SITE_ID + '/deploys',
    Object.assign({ 'Content-Type': 'application/json' }, auth),
    JSON.stringify({ files: digest }));
  if (dep.status >= 300) throw new Error('Netlify deploy create: HTTP ' + dep.status + ' ' + dep.body.slice(0, 200));
  let deploy = JSON.parse(dep.body);
  console.log('deploy', deploy.id, 'state:', deploy.state);
  // wait for the deploy to leave "new" — uploads are rejected until then,
  // and a cold digest of this 16k-file site can take 10+ minutes to process
  for (let i = 0; i < 540 && deploy.state === 'new'; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const st = await req('GET', 'https://api.netlify.com/api/v1/deploys/' + deploy.id, auth);
    deploy = JSON.parse(st.body);
    if (i % 24 === 0) console.log('  digest processing:', deploy.state, '(' + Math.round(i * 5 / 60) + ' min)');
  }
  if (deploy.state === 'new') throw new Error('deploy stuck in "new" after 45 min');
  if (deploy.state === 'error') throw new Error('deploy errored during digest processing');
  // 4. upload our files unconditionally (required[] is unreliable on this site)
  for (const p of FILES) {
    const up = await req('PUT', 'https://api.netlify.com/api/v1/deploys/' + deploy.id + '/files' + encodeURI(p),
      Object.assign({ 'Content-Type': 'application/octet-stream' }, auth), local[p]);
    if (up.status >= 300 && up.status !== 422) throw new Error('Upload ' + p + ': HTTP ' + up.status + ' ' + up.body.slice(0, 200));
    console.log('uploaded', p, up.status);
  }
  // 5. wait until ready
  for (let i = 0; i < 240; i++) {
    const st = await req('GET', 'https://api.netlify.com/api/v1/deploys/' + deploy.id, auth);
    const s = JSON.parse(st.body).state;
    if (s === 'ready') { console.log('deploy ready:', deploy.id); return; }
    if (s === 'error') throw new Error('Netlify deploy failed');
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('Netlify deploy timed out');
}

(async () => {
  const stripeKey = env('STRIPE_SECRET_KEY');
  const nlToken = env('NETLIFY_ACCESS_TOKEN');
  const donors = await stripeDonations(stripeKey);
  const out = {
    updated: new Date().toISOString(),
    total_usd: donors.reduce((s, x) => s + x.amount, 0),
    count: donors.length,
    donors: donors.slice(0, 500),
  };
  // only rewrite when donor data changed — a fresh timestamp alone would
  // force a full site deploy every hour for nothing
  let prev = null;
  try { prev = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8')); } catch (e) {}
  const same = prev && JSON.stringify({ t: prev.total_usd, c: prev.count, d: prev.donors })
    === JSON.stringify({ t: out.total_usd, c: out.count, d: out.donors });
  if (!same) fs.writeFileSync(JSON_PATH, JSON.stringify(out, null, 2));
  console.log('donations.json:', out.count, 'donations, $' + out.total_usd, same ? '(unchanged)' : '(updated)');

  const modules = await courseCounts(stripeKey);
  let prevC = null;
  try { prevC = JSON.parse(fs.readFileSync(COURSES_PATH, 'utf8')); } catch (e) {}
  const sameC = prevC && JSON.stringify(prevC.modules) === JSON.stringify(modules);
  if (!sameC) {
    fs.writeFileSync(COURSES_PATH, JSON.stringify(
      { updated: new Date().toISOString(), unlock_at: UNLOCK_AT, modules }, null, 2));
  }
  console.log('courses.json:', Object.entries(modules).map(([m, v]) => m + '=' + v.sold).join(' '), sameC ? '(unchanged)' : '(updated)');
  await netlifyDeploy(nlToken);
  console.log('LIVE: https://instanthpi.netlify.app/donations/');
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
