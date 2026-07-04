// refresh-vision.cjs — hourly: pull paid Stripe Checkout Sessions for the
// Vision Control payment link and credit each to its idea via the worker's
// idempotent /admin/credit endpoint. client_reference_id = "VC-n.userKey16"
// ("VC-n.anon" for logged-out supporters).
const fs = require('fs');
const path = require('path');
const os = require('os');

function loadEnv(p) {
  const o = {};
  try {
    for (const l of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) o[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
  return o;
}
const env = { ...loadEnv(path.join(os.homedir(), '.claude', '.env')), ...loadEnv(path.join(os.homedir(), '.claude', '.env.from-laptop1')) };
const KEY = env.STRIPE_SECRET_KEY;
const secrets = JSON.parse(fs.readFileSync(path.join(__dirname, 'petition-worker', '.secrets.json'), 'utf8'));
if (!KEY || !secrets.VC_LINK_ID || !secrets.ADMIN_SECRET) { console.error('missing config'); process.exit(1); }

(async () => {
  let credited = 0, already = 0, skipped = 0, starting_after = null;
  for (;;) {
    const qs = new URLSearchParams({ payment_link: secrets.VC_LINK_ID, limit: '100' });
    if (starting_after) qs.set('starting_after', starting_after);
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions?' + qs, { headers: { Authorization: 'Bearer ' + KEY } });
    const page = await r.json();
    if (page.error) throw new Error(page.error.message);
    for (const s of page.data || []) {
      if (s.payment_status !== 'paid') { skipped++; continue; }
      const m = String(s.client_reference_id || '').match(/^(VC-\d+)\.([0-9a-f]{4,16}|anon)$/);
      if (!m) { skipped++; continue; }
      const res = await fetch('https://petition.instanthpi.ai/admin/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: secrets.ADMIN_SECRET,
          sessionId: s.id,
          ideaId: m[1],
          userKey: m[2] === 'anon' ? '' : m[2],
          cents: s.amount_total,
          when: new Date(s.created * 1000).toISOString(),
        }),
      });
      const j = await res.json();
      if (j.credited) credited++; else if (j.ok) already++; else { skipped++; console.error('credit failed', s.id, JSON.stringify(j)); }
    }
    if (!page.has_more) break;
    starting_after = page.data[page.data.length - 1].id;
  }
  console.log(new Date().toISOString(), `vision refresh: credited ${credited} / already ${already} / skipped ${skipped}`);
})().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
