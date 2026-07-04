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

    return new Response(JSON.stringify({ service: 'petition-familles', endpoints: ['/sign', '/count', '/wall'] }), { headers: h });
  },
};
