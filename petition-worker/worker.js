// petition-familles — signature collection for instanthpi.ai/familles
// KV binding: SIGS. Endpoints:
//   POST /sign   {name, email, postal, role, comment, lang} -> {ok, count}
//   GET  /count  -> {count}
//   GET  /wall   -> {count, recent:[{display, role, when}]}  (first name + last initial only)

const ALLOWED = ['https://instanthpi.ai', 'https://www.instanthpi.ai', 'http://localhost:8888'];

function cors(origin) {
  const o = ALLOWED.includes(origin) ? origin : ALLOWED[0];
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

async function sha256(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function countAll(env) {
  let count = 0, cursor;
  do {
    const page = await env.SIGS.list({ prefix: 'sig:', cursor, limit: 1000 });
    count += page.keys.length;
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  return count;
}

function displayName(name) {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return parts[0] + ' ' + parts[parts.length - 1][0].toUpperCase() + '.';
}

// ---- hub v2: distinct arrays per project ----
const RO_PROJECTS = ['careers', 'partnerships', 'corporate', 'consultation', 'volunteers', 'physicians', 'nodes'];
const encB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function hmacSign(payload, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return encB64(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
}
async function makeToken(sub, env) {
  const payload = encB64(new TextEncoder().encode(JSON.stringify({ sub, exp: Date.now() + 30 * 86400e3 })));
  return payload + '.' + (await hmacSign(payload, env.SESSION_SECRET));
}
async function readToken(req, env) {
  const m = (req.headers.get('Authorization') || '').match(/^Bearer (.+)$/);
  if (!m) return null;
  const [payload, sig] = m[1].split('.');
  if (!payload || !sig || sig !== (await hmacSign(payload, env.SESSION_SECRET))) return null;
  try {
    const j = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(payload.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))));
    return j.exp > Date.now() ? j : null;
  } catch { return null; }
}
async function listAll(env, prefix, fn) {
  let cursor;
  do {
    const page = await env.SIGS.list({ prefix, cursor, limit: 1000 });
    for (const k of page.keys) await fn(k);
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const h = cors(req.headers.get('Origin') || '');
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });

    if (req.method === 'POST' && url.pathname === '/sign') {
      let b;
      try { b = await req.json(); } catch { return new Response(JSON.stringify({ error: 'bad json' }), { status: 400, headers: h }); }
      const name = String(b.name || '').trim().slice(0, 120);
      const email = String(b.email || '').trim().toLowerCase().slice(0, 200);
      if (name.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return new Response(JSON.stringify({ error: 'name and valid email required' }), { status: 400, headers: h });
      }
      const key = 'sig:' + (await sha256(email));
      const existing = await env.SIGS.get(key);
      if (!existing) {
        await env.SIGS.put(key, JSON.stringify({
          name, email,
          postal: String(b.postal || '').trim().slice(0, 10),
          role: ['patient', 'soignant', 'medecin', 'citoyen'].includes(b.role) ? b.role : 'citoyen',
          comment: String(b.comment || '').trim().slice(0, 500),
          lang: b.lang === 'en' ? 'en' : 'fr',
          when: new Date().toISOString(),
          ip: req.headers.get('CF-Connecting-IP') || '',
        }));
      }
      const count = await countAll(env);
      return new Response(JSON.stringify({ ok: true, already: !!existing, count }), { headers: h });
    }

    if (req.method === 'GET' && url.pathname === '/count') {
      return new Response(JSON.stringify({ count: await countAll(env) }), { headers: h });
    }

    if (req.method === 'GET' && url.pathname === '/wall') {
      const page = await env.SIGS.list({ prefix: 'sig:', limit: 1000 });
      const rows = [];
      for (const k of page.keys.slice(-60)) {
        const v = await env.SIGS.get(k.name, 'json');
        if (v) rows.push({ display: displayName(v.name), role: v.role, when: v.when });
      }
      rows.sort((a, b) => (a.when < b.when ? 1 : -1));
      return new Response(JSON.stringify({ count: await countAll(env), recent: rows.slice(0, 40) }), { headers: h });
    }

    // ---- hub v2 routes ----
    if (req.method === 'POST' && url.pathname === '/reachout') {
      let b;
      try { b = await req.json(); } catch { return new Response(JSON.stringify({ error: 'bad json' }), { status: 400, headers: h }); }
      const project = String(b.project || '');
      if (!RO_PROJECTS.includes(project)) return new Response(JSON.stringify({ error: 'unknown project' }), { status: 400, headers: h });
      const name = String(b.name || '').trim().slice(0, 120);
      const email = String(b.email || '').trim().toLowerCase().slice(0, 200);
      if (name.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return new Response(JSON.stringify({ error: 'name and valid email required' }), { status: 400, headers: h });
      }
      const key = 'ro:' + project + ':' + (await sha256(email));
      const existing = await env.SIGS.get(key);
      if (!existing) {
        await env.SIGS.put(key, JSON.stringify({
          name, email,
          org: String(b.org || '').trim().slice(0, 200),
          message: String(b.message || '').trim().slice(0, 1000),
          lang: b.lang === 'fr' ? 'fr' : 'en',
          when: new Date().toISOString(),
        }));
      }
      return new Response(JSON.stringify({ ok: true, already: !!existing }), { headers: h });
    }

    if (req.method === 'GET' && url.pathname === '/reachout-count') {
      const project = url.searchParams.get('project') || '';
      if (!RO_PROJECTS.includes(project)) return new Response(JSON.stringify({ error: 'unknown project' }), { status: 400, headers: h });
      let count = 0;
      await listAll(env, 'ro:' + project + ':', () => { count++; });
      return new Response(JSON.stringify({ count }), { headers: h });
    }

    if (req.method === 'POST' && url.pathname === '/auth/google') {
      if (!env.GOOGLE_CLIENT_ID) return new Response(JSON.stringify({ error: 'auth not configured' }), { status: 501, headers: h });
      let b;
      try { b = await req.json(); } catch { return new Response(JSON.stringify({ error: 'bad json' }), { status: 400, headers: h }); }
      const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(String(b.credential || '')));
      if (!r.ok) return new Response(JSON.stringify({ error: 'invalid token' }), { status: 401, headers: h });
      const info = await r.json();
      if (info.aud !== env.GOOGLE_CLIENT_ID || !info.sub) return new Response(JSON.stringify({ error: 'wrong audience' }), { status: 401, headers: h });
      const profile = { sub: info.sub, email: info.email || '', name: info.name || '', picture: info.picture || '' };
      const prev = await env.SIGS.get('user:' + info.sub, 'json');
      await env.SIGS.put('user:' + info.sub, JSON.stringify({ ...profile, created: prev?.created || new Date().toISOString(), lastSeen: new Date().toISOString() }));
      return new Response(JSON.stringify({ token: await makeToken(info.sub, env), profile }), { headers: h });
    }

    if (req.method === 'GET' && url.pathname === '/me') {
      const t = await readToken(req, env);
      if (!t) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: h });
      const profile = await env.SIGS.get('user:' + t.sub, 'json');
      const userKey = (await sha256(t.sub)).slice(0, 16);
      const ideas = [], donations = [];
      await listAll(env, 'idea:', async (k) => {
        const v = await env.SIGS.get(k.name, 'json');
        if (v && v.authorSub === t.sub) {
          const id = k.name.slice(5);
          ideas.push({ id, title: v.title, body: v.body, status: v.status, created: v.created, cents: parseInt((await env.SIGS.get('tally:' + id)) || '0', 10) });
        }
      });
      await listAll(env, 'pay:', async (k) => {
        const v = await env.SIGS.get(k.name, 'json');
        if (v && v.userKey === userKey) donations.push(v);
      });
      return new Response(JSON.stringify({ profile, ideas, donations }), { headers: h });
    }

    if (req.method === 'POST' && url.pathname === '/ideas') {
      const t = await readToken(req, env);
      if (!t) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: h });
      let b;
      try { b = await req.json(); } catch { return new Response(JSON.stringify({ error: 'bad json' }), { status: 400, headers: h }); }
      const title = String(b.title || '').trim().slice(0, 80);
      const body = String(b.body || '').trim().slice(0, 1000);
      if (title.length < 4 || body.length < 10) return new Response(JSON.stringify({ error: 'title and body required' }), { status: 400, headers: h });
      const n = parseInt((await env.SIGS.get('seq:idea')) || '0', 10) + 1;
      await env.SIGS.put('seq:idea', String(n));
      const id = 'VC-' + n;
      await env.SIGS.put('idea:' + id, JSON.stringify({ title, body, authorSub: t.sub, status: 'pending', lang: b.lang === 'fr' ? 'fr' : 'en', created: new Date().toISOString() }));
      const userKey = (await sha256(t.sub)).slice(0, 16);
      return new Response(JSON.stringify({ id, payUrl: (env.VC_PAY_URL || '') + '?client_reference_id=' + id + '.' + userKey }), { headers: h });
    }

    if (req.method === 'GET' && url.pathname === '/ideas') {
      const t = await readToken(req, env);
      const out = [];
      await listAll(env, 'idea:', async (k) => {
        const v = await env.SIGS.get(k.name, 'json');
        if (!v) return;
        const id = k.name.slice(5);
        if (v.status === 'active' || (t && v.authorSub === t.sub)) {
          out.push({ id, title: v.title, body: v.body, status: v.status, created: v.created, cents: parseInt((await env.SIGS.get('tally:' + id)) || '0', 10), mine: !!(t && v.authorSub === t.sub) });
        }
      });
      out.sort((a, b2) => b2.cents - a.cents);
      return new Response(JSON.stringify({ ideas: out, payBase: env.VC_PAY_URL || '' }), { headers: h });
    }

    if (req.method === 'POST' && url.pathname === '/admin/credit') {
      let b;
      try { b = await req.json(); } catch { return new Response(JSON.stringify({ error: 'bad json' }), { status: 400, headers: h }); }
      if (!env.ADMIN_SECRET || b.secret !== env.ADMIN_SECRET) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: h });
      const sid = String(b.sessionId || '');
      const ideaId = String(b.ideaId || '');
      const cents = Math.floor(Number(b.cents) || 0);
      if (!sid || !/^VC-\d+$/.test(ideaId) || cents < 1) return new Response(JSON.stringify({ error: 'bad credit' }), { status: 400, headers: h });
      if (await env.SIGS.get('pay:' + sid)) {
        return new Response(JSON.stringify({ ok: true, credited: false, tally: parseInt((await env.SIGS.get('tally:' + ideaId)) || '0', 10) }), { headers: h });
      }
      await env.SIGS.put('pay:' + sid, JSON.stringify({ ideaId, userKey: String(b.userKey || '').slice(0, 16), cents, when: String(b.when || new Date().toISOString()) }));
      const tally = parseInt((await env.SIGS.get('tally:' + ideaId)) || '0', 10) + cents;
      await env.SIGS.put('tally:' + ideaId, String(tally));
      const idea = await env.SIGS.get('idea:' + ideaId, 'json');
      if (idea && idea.status === 'pending' && tally >= 100) {
        idea.status = 'active';
        await env.SIGS.put('idea:' + ideaId, JSON.stringify(idea));
      }
      return new Response(JSON.stringify({ ok: true, credited: true, tally }), { headers: h });
    }

    return new Response(JSON.stringify({ service: 'petition-familles', endpoints: ['/sign', '/count', '/wall', '/reachout', '/reachout-count', '/auth/google', '/me', '/ideas', '/admin/credit'] }), { headers: h });
  },
};
