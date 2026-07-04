#!/usr/bin/env node
'use strict';
// 2026-07-03 contact migration: public contact = info@instanthpi.ai.
// - cff@centremedicalfont.ca -> info@instanthpi.ai everywhere EXCEPT inside
//   PayPal URLs (business=cff%40... is the receiving PayPal ACCOUNT — only
//   Carlos can change that in PayPal). The visible link text is hidden.
// - instanthpi@gmail.com (mailto + display) -> info@instanthpi.ai (Cloudflare
//   routes it to the same inbox).
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, 'site');
function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.(html|js|json)$/.test(e.name)) out.push(p);
  }
  return out;
}

for (const f of walk(SITE)) {
  let s = fs.readFileSync(f, 'utf8');
  const before = s;
  // 1) protect PayPal URLs (percent-encoded form is untouched by the plain replace below,
  //    but the visible anchor text next to them must go)
  s = s.replace(/>cff@centremedicalfont\.ca<\/a>/g, '>PayPal — InstantHPI donation</a>');
  // 2) plain replacements
  s = s.split('cff@centremedicalfont.ca').join('info@instanthpi.ai');
  s = s.split('instanthpi@gmail.com').join('info@instanthpi.ai');
  if (s !== before) {
    fs.writeFileSync(f, s);
    console.log('swapped:', path.relative(SITE, f));
  }
}
console.log('done');
