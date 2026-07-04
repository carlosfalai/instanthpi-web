# InstantHPI Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the InstantHPI Hub — reach-out pages with per-project data arrays, a Google-login donations account, Vision Control ($1 ideas, $1+ earmarked donation-votes), and the /hub gate — live on instanthpi.ai.

**Architecture:** Extend the live Cloudflare Worker `petition-familles` (KV-backed, custom domain petition.instanthpi.ai) with reachout/auth/ideas/credit endpoints; static pages in `site/` deployed additively to Netlify nexus (c1e311c5) via `deploy-pages.cjs`; Stripe Payment Link + hourly `refresh-vision.cjs` for per-idea attribution.

**Tech Stack:** Cloudflare Workers + KV (REST-deployed, no wrangler), vanilla HTML/CSS/JS (site ink/brass design language), Stripe Payment Links API, Google Identity Services, Node .cjs scripts (repo convention — no test framework; smoke-test scripts are the tests).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-03-instanthpi-hub-design.md` — read it first.
- Nobody is paid at this time: every reach-out page states "all roles are volunteer — no salaries at this time" verbatim in its hero.
- Earmark wording verbatim: "100% of your donation, net of payment-processing fees, is allocated to this idea. Each idea's total and spending are reported publicly."
- Petition endpoints `/sign` `/count` `/wall` must remain byte-compatible (regression-test after every worker deploy).
- Distinct KV arrays: `sig:` `ro:<project>:` `user:` `idea:` `seq:idea` `tally:` `pay:` — never mix prefixes.
- Reach-out project whitelist: `careers, partnerships, corporate, consultation, volunteers, physicians, nodes`.
- English-primary on all new pages (petition /familles stays FR-first).
- scrub-check: no `@centremedicalfont.ca`, no gmail addresses in any `site/` HTML. Public contact = `info@instanthpi.ai`.
- Deploys: `MSYS_NO_PATHCONV=1 NETLIFY_SITE_ID=c1e311c5-9bf4-4ad8-a2a4-9922493d4fab node deploy-pages.cjs /path/index.html` from repo root (Git Bash) — the MSYS flag is mandatory or leading-slash args are mangled.
- Worker deploys: `node petition-worker/deploy-worker.cjs` (uploads `petition-worker/worker.js`, rebinds KV `SIGS`; extend its metadata bindings when adding secrets).
- Cloudflare account `70443374001b15666eeaa70ab5f0062b`, KV namespace `1ee7ea2b95fa40c98325e321477bfbf1`; creds from `~/.claude/.env` (`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_API_KEY`).
- `STRIPE_SECRET_KEY` in `~/.claude/.env`.
- GOOGLE_CLIENT_ID is NOT available yet (desktop-type client on disk is unusable): frontend config ships with `GOOGLE_CLIENT_ID: ''` and every page must degrade gracefully (browse-only; sign-in tile says "Sign-in coming online shortly").
- Commit after every task (repo = `~/instanthpi-donations`, pushes to `carlosfalai/instanthpi-web`).

---

### Task 1: Worker v2 — reachout, auth, ideas, credit

**Files:**
- Modify: `petition-worker/worker.js` (extend; keep petition handlers intact)
- Modify: `petition-worker/deploy-worker.cjs` (add secret bindings)
- Create: `petition-worker/smoke-api.cjs` (endpoint tests)
- Create: `petition-worker/.secrets.json` (gitignored; ADMIN_SECRET + SESSION_SECRET)

**Interfaces:**
- Produces HTTP API at `https://petition.instanthpi.ai`:
  - `POST /reachout {project,name,email,org?,message?,lang?}` → `{ok, already}`
  - `GET /reachout-count?project=careers` → `{count}`
  - `POST /auth/google {credential}` → `{token, profile:{sub,email,name,picture}}` (501 `{error:'auth not configured'}` until GOOGLE_CLIENT_ID worker var is set)
  - `GET /me` (Authorization: Bearer token) → `{profile, ideas:[], donations:[]}`
  - `POST /ideas` (Bearer) `{title,body,lang?}` → `{id:'VC-1', payUrl}`
  - `GET /ideas` → `{ideas:[{id,title,body,cents,status,created}]}` (active sorted by cents desc; plus caller's pending if authed)
  - `POST /admin/credit {secret,sessionId,ideaId,userKey,cents,when}` → `{ok, credited, tally}` (idempotent by sessionId)
- Session token format: `base64url(JSON{sub,exp}) + '.' + base64url(HMAC-SHA256(payload, SESSION_SECRET))`.
- userKey (for Stripe client_reference_id) = first 16 hex of sha256(sub).

- [ ] **Step 1: generate secrets file** — `node -e "const c=require('crypto');require('fs').writeFileSync('petition-worker/.secrets.json',JSON.stringify({ADMIN_SECRET:c.randomBytes(32).toString('hex'),SESSION_SECRET:c.randomBytes(32).toString('hex')}))"`; add `petition-worker/.secrets.json` to `.gitignore`.
- [ ] **Step 2: extend worker.js.** Keep existing sha256/cors/countAll/displayName + petition routes. Add (complete code):

```js
// ---- helpers (add) ----
const RO_PROJECTS = ['careers','partnerships','corporate','consultation','volunteers','physicians','nodes'];
const enc = (s) => btoa(String.fromCharCode(...new Uint8Array(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function hmac(payload, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  return enc(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
}
async function makeToken(sub, env) {
  const payload = enc(new TextEncoder().encode(JSON.stringify({ sub, exp: Date.now() + 30*86400e3 })));
  return payload + '.' + await hmac(payload, env.SESSION_SECRET);
}
async function readToken(req, env) {
  const m = (req.headers.get('Authorization') || '').match(/^Bearer (.+)$/);
  if (!m) return null;
  const [payload, sig] = m[1].split('.');
  if (!payload || !sig || sig !== await hmac(payload, env.SESSION_SECRET)) return null;
  try {
    const j = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(payload.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0))));
    return j.exp > Date.now() ? j : null;
  } catch { return null; }
}
// ---- routes (add inside fetch, before the fallback response) ----
if (req.method === 'POST' && url.pathname === '/reachout') {
  let b; try { b = await req.json(); } catch { return new Response(JSON.stringify({error:'bad json'}),{status:400,headers:h}); }
  const project = String(b.project||'');
  if (!RO_PROJECTS.includes(project)) return new Response(JSON.stringify({error:'unknown project'}),{status:400,headers:h});
  const name = String(b.name||'').trim().slice(0,120);
  const email = String(b.email||'').trim().toLowerCase().slice(0,200);
  if (name.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return new Response(JSON.stringify({error:'name and valid email required'}),{status:400,headers:h});
  const key = 'ro:' + project + ':' + await sha256(email);
  const existing = await env.SIGS.get(key);
  if (!existing) await env.SIGS.put(key, JSON.stringify({ name, email, org:String(b.org||'').trim().slice(0,200), message:String(b.message||'').trim().slice(0,1000), lang:b.lang==='fr'?'fr':'en', when:new Date().toISOString() }));
  return new Response(JSON.stringify({ok:true, already:!!existing}),{headers:h});
}
if (req.method === 'GET' && url.pathname === '/reachout-count') {
  const project = url.searchParams.get('project')||'';
  if (!RO_PROJECTS.includes(project)) return new Response(JSON.stringify({error:'unknown project'}),{status:400,headers:h});
  let count = 0, cursor;
  do { const p = await env.SIGS.list({prefix:'ro:'+project+':',cursor,limit:1000}); count += p.keys.length; cursor = p.list_complete?null:p.cursor; } while (cursor);
  return new Response(JSON.stringify({count}),{headers:h});
}
if (req.method === 'POST' && url.pathname === '/auth/google') {
  if (!env.GOOGLE_CLIENT_ID) return new Response(JSON.stringify({error:'auth not configured'}),{status:501,headers:h});
  let b; try { b = await req.json(); } catch { return new Response(JSON.stringify({error:'bad json'}),{status:400,headers:h}); }
  const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(String(b.credential||'')));
  if (!r.ok) return new Response(JSON.stringify({error:'invalid token'}),{status:401,headers:h});
  const info = await r.json();
  if (info.aud !== env.GOOGLE_CLIENT_ID || !info.sub) return new Response(JSON.stringify({error:'wrong audience'}),{status:401,headers:h});
  const profile = { sub: info.sub, email: info.email||'', name: info.name||'', picture: info.picture||'' };
  const prev = await env.SIGS.get('user:'+info.sub,'json');
  await env.SIGS.put('user:'+info.sub, JSON.stringify({ ...profile, created: prev?.created||new Date().toISOString(), lastSeen:new Date().toISOString() }));
  return new Response(JSON.stringify({ token: await makeToken(info.sub, env), profile }),{headers:h});
}
if (req.method === 'GET' && url.pathname === '/me') {
  const t = await readToken(req, env);
  if (!t) return new Response(JSON.stringify({error:'unauthorized'}),{status:401,headers:h});
  const profile = await env.SIGS.get('user:'+t.sub,'json');
  const userKey = (await sha256(t.sub)).slice(0,16);
  const ideas = [], donations = [];
  let cursor; do { const p = await env.SIGS.list({prefix:'idea:',cursor,limit:1000});
    for (const k of p.keys) { const v = await env.SIGS.get(k.name,'json'); if (v && v.authorSub===t.sub) ideas.push({id:k.name.slice(5),...v, cents: parseInt(await env.SIGS.get('tally:'+k.name.slice(5))||'0',10)}); }
    cursor = p.list_complete?null:p.cursor; } while (cursor);
  cursor = undefined; do { const p = await env.SIGS.list({prefix:'pay:',cursor,limit:1000});
    for (const k of p.keys) { const v = await env.SIGS.get(k.name,'json'); if (v && v.userKey===userKey) donations.push(v); }
    cursor = p.list_complete?null:p.cursor; } while (cursor);
  return new Response(JSON.stringify({profile, ideas, donations}),{headers:h});
}
if (req.method === 'POST' && url.pathname === '/ideas') {
  const t = await readToken(req, env);
  if (!t) return new Response(JSON.stringify({error:'unauthorized'}),{status:401,headers:h});
  let b; try { b = await req.json(); } catch { return new Response(JSON.stringify({error:'bad json'}),{status:400,headers:h}); }
  const title = String(b.title||'').trim().slice(0,80);
  const body = String(b.body||'').trim().slice(0,1000);
  if (title.length < 4 || body.length < 10) return new Response(JSON.stringify({error:'title and body required'}),{status:400,headers:h});
  const n = parseInt(await env.SIGS.get('seq:idea')||'0',10) + 1;
  await env.SIGS.put('seq:idea', String(n));
  const id = 'VC-' + n;
  await env.SIGS.put('idea:'+id, JSON.stringify({ title, body, authorSub:t.sub, status:'pending', lang:b.lang==='fr'?'fr':'en', created:new Date().toISOString() }));
  const userKey = (await sha256(t.sub)).slice(0,16);
  return new Response(JSON.stringify({ id, payUrl: env.VC_PAY_URL + '?client_reference_id=' + id + '.' + userKey }),{headers:h});
}
if (req.method === 'GET' && url.pathname === '/ideas') {
  const t = await readToken(req, env);
  const out = []; let cursor;
  do { const p = await env.SIGS.list({prefix:'idea:',cursor,limit:1000});
    for (const k of p.keys) { const v = await env.SIGS.get(k.name,'json'); if (!v) continue;
      const id = k.name.slice(5);
      if (v.status==='active' || (t && v.authorSub===t.sub)) out.push({ id, title:v.title, body:v.body, status:v.status, created:v.created, cents: parseInt(await env.SIGS.get('tally:'+id)||'0',10), mine: !!(t && v.authorSub===t.sub) });
    }
    cursor = p.list_complete?null:p.cursor; } while (cursor);
  out.sort((a,b2)=> b2.cents - a.cents);
  return new Response(JSON.stringify({ideas:out, payBase: env.VC_PAY_URL||''}),{headers:h});
}
if (req.method === 'POST' && url.pathname === '/admin/credit') {
  let b; try { b = await req.json(); } catch { return new Response(JSON.stringify({error:'bad json'}),{status:400,headers:h}); }
  if (!env.ADMIN_SECRET || b.secret !== env.ADMIN_SECRET) return new Response(JSON.stringify({error:'forbidden'}),{status:403,headers:h});
  const sid = String(b.sessionId||''); const ideaId = String(b.ideaId||''); const cents = Math.floor(Number(b.cents)||0);
  if (!sid || !/^VC-\d+$/.test(ideaId) || cents < 1) return new Response(JSON.stringify({error:'bad credit'}),{status:400,headers:h});
  if (await env.SIGS.get('pay:'+sid)) return new Response(JSON.stringify({ok:true, credited:false, tally: parseInt(await env.SIGS.get('tally:'+ideaId)||'0',10)}),{headers:h});
  await env.SIGS.put('pay:'+sid, JSON.stringify({ ideaId, userKey:String(b.userKey||'').slice(0,16), cents, when:String(b.when||new Date().toISOString()) }));
  const tally = parseInt(await env.SIGS.get('tally:'+ideaId)||'0',10) + cents;
  await env.SIGS.put('tally:'+ideaId, String(tally));
  const idea = await env.SIGS.get('idea:'+ideaId,'json');
  if (idea && idea.status==='pending' && tally >= 100) { idea.status='active'; await env.SIGS.put('idea:'+ideaId, JSON.stringify(idea)); }
  return new Response(JSON.stringify({ok:true, credited:true, tally}),{headers:h});
}
```

- [ ] **Step 3: bind secrets in deploy-worker.cjs.** Read `.secrets.json`; metadata bindings become: KV `SIGS` + `{type:'plain_text',name:'ADMIN_SECRET',text:s.ADMIN_SECRET}` + `{type:'plain_text',name:'SESSION_SECRET',text:s.SESSION_SECRET}` + `{type:'plain_text',name:'VC_PAY_URL',text:s.VC_PAY_URL||''}` + `{type:'plain_text',name:'GOOGLE_CLIENT_ID',text:s.GOOGLE_CLIENT_ID||''}` (VC_PAY_URL filled by Task 2; GOOGLE_CLIENT_ID stays '' until Carlos supplies it).
- [ ] **Step 4: deploy** — `node petition-worker/deploy-worker.cjs`. Expected: `worker uploaded: petition-familles`.
- [ ] **Step 5: write smoke-api.cjs** — Node script hitting the live API: petition regression (`GET /count` returns `{count:>=1}`), `POST /reachout` careers happy-path then duplicate (`already:true`), bad project → 400, `GET /reachout-count?project=careers` ≥1 (allow KV lag: retry 60s), `/auth/google` → 501, `/me` no token → 401, `POST /ideas` no token → 401, `/admin/credit` wrong secret → 403, right secret + fake idea `VC-999999` sessionId `test-1` → credited:true, replay same sessionId → credited:false (idempotent). Exit non-zero on any failure.
- [ ] **Step 6: run it** — `node petition-worker/smoke-api.cjs`. Expected: all PASS.
- [ ] **Step 7: cleanup test keys** (KV REST delete `pay:test-1`, `tally:VC-999999`) and commit: `git add -A && git commit -m "worker v2: reachout arrays, google auth, vision ideas, idempotent credits"`.

### Task 2: Stripe Vision Control payment link + config

**Files:**
- Create: `petition-worker/create-vc-link.cjs`
- Create: `site/hub-config.js`
- Modify: `petition-worker/.secrets.json` (add VC_PAY_URL)

**Interfaces:**
- Produces: Stripe Payment Link (USD, custom amount, min $1) — URL saved to `.secrets.json` (worker var) and `site/hub-config.js` (frontend).
- `site/hub-config.js` (loaded by /vision, /hub, reach-out pages): `window.HUB = { API:'https://petition.instanthpi.ai', GOOGLE_CLIENT_ID:'', VC_PAY_URL:'<link url>' }`.

- [ ] **Step 1: create-vc-link.cjs** — read STRIPE_SECRET_KEY from `~/.claude/.env`; `POST https://api.stripe.com/v1/payment_links` form-encoded: `line_items[0][price_data][currency]=usd`, `line_items[0][price_data][product_data][name]=InstantHPI Vision Control — idea fund`, `line_items[0][price_data][custom_unit_amount][enabled]=true`, `line_items[0][price_data][custom_unit_amount][minimum]=100`, `line_items[0][quantity]=1`, `after_completion[type]=redirect`, `after_completion[redirect][url]=https://instanthpi.ai/vision/?thanks=1`. NOTE: if the API rejects `price_data.custom_unit_amount` on payment links, create the price first via `POST /v1/prices` with `custom_unit_amount[enabled]=true&currency=usd&product_data[name]=...` then the link with `line_items[0][price]=<price_id>`. Print link id + url.
- [ ] **Step 2: run it**, save url into `.secrets.json` as VC_PAY_URL, write `site/hub-config.js`, redeploy worker (`node petition-worker/deploy-worker.cjs`) so `env.VC_PAY_URL` is live.
- [ ] **Step 3: verify** — `curl -s https://petition.instanthpi.ai/ideas` returns `payBase` = the link URL; open link URL with curl → 200/303. Commit.

### Task 3: refresh-vision.cjs + hourly task

**Files:**
- Create: `refresh-vision.cjs` (repo root, beside `refresh-donations.cjs`)

**Interfaces:**
- Consumes: Stripe Checkout Sessions of the VC payment link (`GET /v1/checkout/sessions?payment_link=<id>&limit=100`, paginate, filter `payment_status=paid`), `client_reference_id` = `VC-n.userKey16`.
- Produces: `POST https://petition.instanthpi.ai/admin/credit` per session (idempotent server-side).

- [ ] **Step 1: write script** — read STRIPE_SECRET_KEY + `.secrets.json`; for each paid session with parseable `client_reference_id` matching `/^(VC-\d+)\.([0-9a-f]{4,16})$/` → credit `{secret, sessionId:s.id, ideaId, userKey, cents:s.amount_total, when:new Date(s.created*1000).toISOString()}`; log summary `credited X / skipped Y / already Z`.
- [ ] **Step 2: run once** — expected `credited 0` (no payments yet), exit 0.
- [ ] **Step 3: register hourly scheduled task** (PowerShell, same pattern as "InstantHPI Donations Refresh"): name `InstantHPI Vision Refresh`, hourly, `node.exe C:\Users\insta\instanthpi-donations\refresh-vision.cjs`. Verify with `Get-ScheduledTask`. Commit.

### Task 4: reach-out pages (/join + 5 pages)

**Files:**
- Create: `site/join/index.html`, `site/careers/index.html`, `site/partnerships/index.html`, `site/corporate/index.html`, `site/consultation/index.html`, `site/volunteers/index.html`

**Interfaces:**
- Consumes: `POST /reachout` with project = page name (consultation page posts project `consultation`); `site/hub-config.js`.
- Every page: site ink/brass design (copy the CSS variables/header/nav/footer pattern from `site/familles/index.html`, English-primary, no FR toggle), nav includes `Hub` and `Familles`, hero states the volunteer constraint verbatim, form (name*, email*, organization (optional; hidden on volunteers/careers? keep visible), message optional, consent line "We keep your name and email only to contact you about this — never sold or shared."), POST to `${HUB.API}/reachout`, success message inline, footer contact info@instanthpi.ai.
- Per-page copy (hero title / one-liner / 3 cards):
  - **careers** — "Build free healthcare with us" / "All roles are volunteer — no salaries at this time. What you get: real shipped systems, public credit, and first position when funding arrives." Cards: Engineering (bots, workers, EHR automation) · Clinical (physicians reviewing AI output, guild) · Growth (content, community, translations).
  - **partnerships** — "Partner with InstantHPI" / "Clinics, community organizations, patient groups, universities: bring the free bot and pilot programs to your people. All collaboration is volunteer-based at this time." Cards: Pilot sites · Research & evaluation · Community distribution.
  - **corporate** — "Corporate & sponsors" / "Fund what your employees and customers actually need: free healthcare access. Sponsorships are public and earmarked. Nobody draws a salary at this time." Cards: Sponsor course seats · Sponsor an idea (Vision Control) · Infrastructure sponsorship.
  - **consultation** — "AI automation consultation" / "We automated a real medical practice end-to-end and published how. Ask us anything — consultations are free and volunteer-run at this time." Cards: Practice automation audit · Build-with-you sessions · Talks & training.
  - **volunteers** — "Volunteer with InstantHPI" / "A few hours a week moves real healthcare. All volunteer, all public credit." Cards: Test the bots · Translate & localize · Spread the word (family & clinics).
  - **join** — "Get involved" hub: 6 cards linking careers/partnerships/corporate/consultation/volunteers + "Physicians & Nodes → /hub".
- [ ] **Step 1: build the 6 pages** (single shared markup, per-page copy above).
- [ ] **Step 2: scrub-check** — `grep -ri "centremedicalfont\|gmail" site/join site/careers site/partnerships site/corporate site/consultation site/volunteers` → no matches.
- [ ] **Step 3: deploy all 6** (`MSYS_NO_PATHCONV=1 NETLIFY_SITE_ID=... node deploy-pages.cjs /join/index.html /careers/index.html /partnerships/index.html /corporate/index.html /consultation/index.html /volunteers/index.html /hub-config.js=hub-config.js`).
- [ ] **Step 4: live test** — puppeteer (safe-browser 9333): load each page, submit the careers form with test data, expect success message; `GET /reachout-count?project=careers` ≥ 1. Commit.

### Task 5: /vision (Vision Control)

**Files:**
- Create: `site/vision/index.html`

**Interfaces:**
- Consumes: `GET /ideas`, `POST /ideas` (Bearer), `POST /auth/google` (dormant), `GET /me`, `HUB.VC_PAY_URL`.
- Page sections: (1) hero "Vision Control — you decide what gets built"; rules box: "Post an idea: $1. Support an idea: donate $1 or more — every donation is a vote." + earmark wording verbatim + fee honesty line "Posting fee note: card processing costs about $0.63 on a $1 charge; larger amounts lose proportionally less."; (2) Google sign-in area (renders GIS button if `HUB.GOOGLE_CLIENT_ID`, else the dormant notice); (3) idea list from `GET /ideas` — card per idea: title, body, `$X.XX raised`, status badge, Support button → `VC_PAY_URL + '?client_reference_id=' + id + '.' + (myUserKey||'anon')`; (4) post-idea form (auth-gated; on submit → shows payUrl button "Pay $1 to activate"); (5) "My account" strip when signed in: my ideas + my donation history from `/me`; (6) note "totals update hourly".
- [ ] **Step 1: build page.** Sign-in JS: load `https://accounts.google.com/gsi/client` only when client id present; callback posts credential to `/auth/google`, stores `{token,profile}` in localStorage `hub-auth`.
- [ ] **Step 2: deploy + live test** — page loads, ideas list renders (empty state "No ideas yet — be the first"), post form correctly gated, Support buttons absent when no ideas. Commit.

### Task 6: /hub gate

**Files:**
- Create: `site/hub/index.html`

**Interfaces:** links only + optional signed-in strip (reuses `hub-auth` localStorage + `/me`).
- Tiles (2-col grid): **Physicians side** → /physicians ("automation levels, guild, association") · **Nodes side** → /network ("run a node, healthcare blockchain") · **Learning** → /courses ("6 modules: build all of this yourself") · **Sponsoring** → in-page section listing: course bulk-sponsorship (link /courses), donation tiers (link /donations), Physicians Association $100/mo (existing Stripe link on /donations), top ideas needing funds (link /vision) · **Vision Control** → /vision · **Petition — Une solution pour nos familles** → /familles · **Get involved** → /join.
- Sign-in header strip: dormant notice until GOOGLE_CLIENT_ID set.
- [ ] **Step 1: build page; Step 2: deploy + live test (all tile links 200). Commit.**

### Task 7: sitewide nav update

**Files:**
- Create: `add-hub-nav.cjs`
- Modify: every `site/*/index.html` currently live (education, network, donations, courses, physicians, law, 4chan, safety, models, familles) + `site/index.html`

**Interfaces:** inserts `<a href="/hub/" ...>Hub</a>` after the INSTANTHPI brand separator and `<a href="/familles/" ...>Familles</a>` before it, matching existing nav anchor markup style; idempotent (skips files already containing `/hub/`).

- [ ] **Step 1: write script** (string-insert on the `<nav` block, no regex over whole file; dry-run mode listing changes).
- [ ] **Step 2: run, eyeball one diff, deploy all touched pages, verify nav renders on 3 spot-checked pages via curl grep. Commit.**

### Task 8: full verification + push + memory

- [ ] **Step 1: rerun** `node petition-worker/smoke-api.cjs` (worker regression incl. petition).
- [ ] **Step 2: puppeteer sweep** — /familles /join /careers /partnerships /corporate /consultation /volunteers /vision /hub: HTTP 200, no console errors, screenshot each.
- [ ] **Step 3: scrub-check whole site dir** (`grep -ri "centremedicalfont\|@gmail" site/ --include=*.html` → only historical allowed PayPal-URL matches on donations pages; none on new pages).
- [ ] **Step 4:** `git push origin HEAD`.
- [ ] **Step 5:** update memory files (hub architecture, worker endpoints, secrets location, refresh task, dormant Google login + the one manual step for Carlos).
