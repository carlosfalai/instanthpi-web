// create-vc-link.cjs — create the "InstantHPI Vision Control" Stripe payment
// link: custom amount, minimum $1 USD, redirect back to /vision.
// Prints the link id + url; run once.
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
if (!KEY) { console.error('no STRIPE_SECRET_KEY'); process.exit(1); }

const stripe = async (p, params) => {
  const r = await fetch('https://api.stripe.com/v1' + p, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
  const j = await r.json();
  if (j.error) throw new Error(p + ': ' + j.error.message);
  return j;
};

(async () => {
  // custom_unit_amount prices must be created via /v1/prices, then attached.
  const price = await stripe('/prices', {
    currency: 'usd',
    'custom_unit_amount[enabled]': 'true',
    'custom_unit_amount[minimum]': '100',
    'custom_unit_amount[preset]': '500',
    'product_data[name]': 'InstantHPI Vision Control — idea fund',
  });
  console.log('price:', price.id);
  const link = await stripe('/payment_links', {
    'line_items[0][price]': price.id,
    'line_items[0][quantity]': '1',
    'after_completion[type]': 'redirect',
    'after_completion[redirect][url]': 'https://instanthpi.ai/vision/?thanks=1',
  });
  console.log('payment link:', link.id);
  console.log('URL:', link.url);

  // persist into .secrets.json for the worker deploy
  const sp = path.join(__dirname, '.secrets.json');
  const s = JSON.parse(fs.readFileSync(sp, 'utf8'));
  s.VC_PAY_URL = link.url;
  s.VC_LINK_ID = link.id;
  fs.writeFileSync(sp, JSON.stringify(s, null, 1));
  console.log('saved VC_PAY_URL to .secrets.json');
})().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
