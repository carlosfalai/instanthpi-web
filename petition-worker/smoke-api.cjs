// smoke-api.cjs — live endpoint tests for the petition/hub worker.
// Run: node petition-worker/smoke-api.cjs   (exit 0 = all pass)
const fs = require('fs');
const path = require('path');

const API = 'https://petition.instanthpi.ai';
const secrets = JSON.parse(fs.readFileSync(path.join(__dirname, '.secrets.json'), 'utf8'));

let failures = 0;
const check = (name, cond, detail) => {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (cond ? '' : '  <- ' + detail));
  if (!cond) failures++;
};
const j = async (p, opts) => {
  const r = await fetch(API + p, { headers: { 'Content-Type': 'application/json', Origin: 'https://instanthpi.ai' }, ...opts });
  return { status: r.status, body: await r.json() };
};

(async () => {
  // petition regression
  const count = await j('/count');
  check('petition /count still works', count.status === 200 && count.body.count >= 1, JSON.stringify(count));
  const wall = await j('/wall');
  check('petition /wall still works', wall.status === 200 && Array.isArray(wall.body.recent), JSON.stringify(wall.body).slice(0, 80));

  // reachout
  const ro = await j('/reachout', { method: 'POST', body: JSON.stringify({ project: 'careers', name: 'Smoke Test', email: 'smoke-careers@example.com' }) });
  check('reachout careers accepts', ro.status === 200 && ro.body.ok === true, JSON.stringify(ro));
  const ro2 = await j('/reachout', { method: 'POST', body: JSON.stringify({ project: 'careers', name: 'Smoke Test', email: 'smoke-careers@example.com' }) });
  check('reachout dedupes per email', ro2.body.already === true, JSON.stringify(ro2));
  const roBad = await j('/reachout', { method: 'POST', body: JSON.stringify({ project: 'hacking', name: 'X Y', email: 'x@y.zz' }) });
  check('reachout rejects unknown project', roBad.status === 400, JSON.stringify(roBad));

  // reachout-count (KV list lag: retry up to 60s)
  let rc = { body: { count: 0 } };
  for (let i = 0; i < 12; i++) {
    rc = await j('/reachout-count?project=careers');
    if (rc.body.count >= 1) break;
    await new Promise((r) => setTimeout(r, 5000));
  }
  check('reachout-count careers >= 1', rc.body.count >= 1, JSON.stringify(rc));

  // auth surface
  const auth = await j('/auth/google', { method: 'POST', body: JSON.stringify({ credential: 'x' }) });
  check('auth/google returns 501 until configured', auth.status === 501, JSON.stringify(auth));
  const me = await j('/me');
  check('/me without token -> 401', me.status === 401, JSON.stringify(me));
  const post = await j('/ideas', { method: 'POST', body: JSON.stringify({ title: 'test', body: 'test body here' }) });
  check('POST /ideas without token -> 401', post.status === 401, JSON.stringify(post));
  const ideas = await j('/ideas');
  check('GET /ideas returns list', ideas.status === 200 && Array.isArray(ideas.body.ideas), JSON.stringify(ideas.body).slice(0, 80));

  // admin credit: forbidden, credit, idempotent replay
  const bad = await j('/admin/credit', { method: 'POST', body: JSON.stringify({ secret: 'wrong', sessionId: 's', ideaId: 'VC-999999', cents: 100 }) });
  check('admin/credit wrong secret -> 403', bad.status === 403, JSON.stringify(bad));
  const c1 = await j('/admin/credit', { method: 'POST', body: JSON.stringify({ secret: secrets.ADMIN_SECRET, sessionId: 'smoke-test-1', ideaId: 'VC-999999', userKey: 'deadbeefdeadbeef', cents: 150 }) });
  check('admin/credit credits', c1.status === 200 && c1.body.credited === true && c1.body.tally === 150, JSON.stringify(c1));
  const c2 = await j('/admin/credit', { method: 'POST', body: JSON.stringify({ secret: secrets.ADMIN_SECRET, sessionId: 'smoke-test-1', ideaId: 'VC-999999', userKey: 'deadbeefdeadbeef', cents: 150 }) });
  check('admin/credit idempotent replay', c2.body.credited === false && c2.body.tally === 150, JSON.stringify(c2));

  console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error('SMOKE CRASH:', e.message); process.exit(1); });
