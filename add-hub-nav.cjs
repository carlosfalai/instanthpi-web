// add-hub-nav.cjs — idempotently insert Hub + Familles links into the nav of
// every existing live page. Inserts right after the INSTANTHPI brand |
// separator, matching the site's inline-styled anchor markup.
// Usage: node add-hub-nav.cjs [--write]   (default = dry run)
const fs = require('fs');
const path = require('path');

const WRITE = process.argv.includes('--write');
const PAGES = [
  'site/index.html',
  'site/education/index.html',
  'site/network/index.html',
  'site/donations/index.html',
  'site/courses/index.html',
  'site/physicians/index.html',
  'site/law/index.html',
  'site/4chan/index.html',
  'site/safety/index.html',
  'site/models/index.html',
];

const SEP = /(<span style="color:#243040;padding:6px 2px">\|<\/span>)/;
const INSERT = `$1\n  <a href="/hub/" style="color:#d4af7a;text-decoration:none;padding:6px 12px">Hub</a>\n  <a href="/familles/" style="color:#d7dde5;text-decoration:none;padding:6px 12px">Familles</a>`;

const touched = [];
for (const rel of PAGES) {
  const p = path.join(__dirname, rel);
  if (!fs.existsSync(p)) { console.log('skip (missing):', rel); continue; }
  const html = fs.readFileSync(p, 'utf8');
  if (html.includes('href="/hub/"')) { console.log('skip (already has hub):', rel); continue; }
  if (!SEP.test(html) && !/<a class="brand" href="\/">/.test(html)) { console.log('skip (no known nav pattern):', rel); continue; }
  let out;
  if (SEP.test(html)) {
    out = html.replace(SEP, INSERT); // first occurrence only (the nav)
  } else {
    // class-styled nav variant (e.g. /safety): plain anchors after the brand
    out = html.replace(/(<a class="brand" href="\/">[^<]*<\/a>)/,
      `$1\n  <a href="/hub/">Hub</a>\n  <a href="/familles/">Familles</a>`);
  }
  console.log((WRITE ? 'WROTE' : 'would write') + ':', rel);
  if (WRITE) fs.writeFileSync(p, out);
  touched.push('/' + rel.replace(/^site\//, '').replace(/\\/g, '/'));
}
console.log('\ndeploy args:', touched.join(' '));
