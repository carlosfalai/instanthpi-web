#!/usr/bin/env node
'use strict';
// One-shot: insert an Education nav link before the /network/ nav link on
// every page that carries the shared nav but lacks /education/.
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, 'site');
const PAGES = [
  'index-nexus.html',
  path.join('donations', 'index.html'),
  path.join('courses', 'index.html'),
  path.join('physicians', 'index.html'),
  path.join('law', 'index.html'),
  path.join('4chan', 'index.html'),
  path.join('safety', 'index.html'),
];

for (const rel of PAGES) {
  const p = path.join(SITE, rel);
  let html = fs.readFileSync(p, 'utf8');
  if (html.includes('href="/education/"')) { console.log('skip (has edu):', rel); continue; }
  // find the network nav anchor and clone its attribute style for education
  const m = html.match(/<a href="\/network\/"([^>]*)>([^<]*)<\/a>/);
  if (!m) { console.log('NO NETWORK ANCHOR:', rel, '— manual attention needed'); continue; }
  const eduAnchor = `<a href="/education/"${m[1]}>Education</a>`;
  html = html.replace(m[0], eduAnchor + '\n  ' + m[0]);
  fs.writeFileSync(p, html);
  console.log('added Education link:', rel);
}
