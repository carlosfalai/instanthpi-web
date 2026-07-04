// Deploy petition-familles worker + KV to Cloudflare via REST API.
// Reads CLOUDFLARE_API_TOKEN (or CLOUDFLARE_API_KEY + email) from ~/.claude/.env
const fs = require('fs');
const path = require('path');
const os = require('os');

const NAME = 'petition-familles';
const KV_TITLE = 'PETITION_SIGNATURES';

function loadEnv(p) {
  const out = {};
  try {
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
  return out;
}
const env = { ...loadEnv(path.join(os.homedir(), '.claude', '.env')), ...loadEnv(path.join(os.homedir(), '.claude', '.env.from-laptop1')) };

const headers = env.CLOUDFLARE_API_TOKEN
  ? { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` }
  : { 'X-Auth-Key': env.CLOUDFLARE_API_KEY, 'X-Auth-Email': env.CLOUDFLARE_EMAIL || 'cff@centremedicalfont.ca' };

const api = async (p, opts = {}) => {
  const r = await fetch(`https://api.cloudflare.com/client/v4${p}`, { ...opts, headers: { ...headers, ...(opts.headers || {}) } });
  const j = await r.json();
  if (!j.success) throw new Error(`${p}: ${JSON.stringify(j.errors).slice(0, 300)}`);
  return j.result;
};

(async () => {
  const accounts = await api('/accounts');
  const acct = accounts[0].id;
  console.log('account:', acct, accounts[0].name);

  // KV namespace — reuse if exists
  const spaces = await api(`/accounts/${acct}/storage/kv/namespaces?per_page=100`);
  let kv = spaces.find((n) => n.title === KV_TITLE);
  if (!kv) kv = await api(`/accounts/${acct}/storage/kv/namespaces`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: KV_TITLE }) });
  console.log('kv namespace:', kv.id);

  // Upload worker (module syntax)
  const code = fs.readFileSync(path.join(__dirname, 'worker.js'), 'utf8');
  const metadata = { main_module: 'worker.js', bindings: [{ type: 'kv_namespace', name: 'SIGS', namespace_id: kv.id }], compatibility_date: '2025-01-01' };
  const fd = new FormData();
  fd.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  fd.append('worker.js', new Blob([code], { type: 'application/javascript+module' }), 'worker.js');
  await api(`/accounts/${acct}/workers/scripts/${NAME}`, { method: 'PUT', body: fd });
  console.log('worker uploaded:', NAME);

  // Enable workers.dev route
  await api(`/accounts/${acct}/workers/scripts/${NAME}/subdomain`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: true }) });
  const sub = await api(`/accounts/${acct}/workers/subdomain`);
  console.log(`LIVE: https://${NAME}.${sub.subdomain}.workers.dev`);
})().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
