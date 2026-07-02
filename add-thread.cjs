#!/usr/bin/env node
/**
 * add-thread.cjs — append a 4chan (or any) thread to the blockchain-like
 * thread ledger at site/4chan/threads.json, then redeploy via refresh-donations.cjs.
 *
 * Each entry is hash-chained: hash = sha256(i|ts|board|url|title|note|prev).
 * Append-only. Never edit past entries — that breaks the chain on purpose.
 *
 * Usage:
 *   node add-thread.cjs <url> <title> [note]     append a thread OR a post
 *   node add-thread.cjs                          init ledger (genesis) if missing
 *
 * Threads and individual posts both go in the same chain. A URL with a
 * #p anchor (e.g. .../thread/123#p456) is recorded as a post, else a thread.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const LEDGER = path.join(__dirname, 'site', '4chan', 'threads.json');

function entryHash(e) {
  return crypto.createHash('sha256')
    .update([e.i, e.ts, e.board, e.url, e.title, e.note, e.prev].join('|'))
    .digest('hex');
}
// NOTE: `type` is display metadata, deliberately outside the hash preimage
// so old entries (genesis) stay valid.

function load() {
  if (fs.existsSync(LEDGER)) return JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
  const genesis = {
    i: 0,
    ts: new Date().toISOString(),
    board: '-',
    url: 'https://instanthpi.ai/4chan',
    title: 'GENESIS — InstantHPI public launch ledger',
    note: 'Every thread we participate in gets appended here, hash-chained.',
    prev: '0'.repeat(64),
  };
  genesis.hash = entryHash(genesis);
  return { chain: [genesis] };
}

function verify(chain) {
  for (let k = 0; k < chain.length; k++) {
    const e = chain[k];
    if (e.hash !== entryHash(e)) throw new Error('hash mismatch at ' + k);
    if (k > 0 && e.prev !== chain[k - 1].hash) throw new Error('broken link at ' + k);
  }
}

const [url, title, note] = process.argv.slice(2);
const ledger = load();
verify(ledger.chain);

if (url) {
  const boardMatch = url.match(/boards\.4chan(?:nel)?\.org\/(\w+)\//);
  const e = {
    i: ledger.chain.length,
    ts: new Date().toISOString(),
    board: boardMatch ? '/' + boardMatch[1] + '/' : '-',
    type: /#p\d+/.test(url) ? 'post' : 'thread',
    url,
    title: title || url,
    note: note || '',
    prev: ledger.chain[ledger.chain.length - 1].hash,
  };
  e.hash = entryHash(e);
  ledger.chain.push(e);
  verify(ledger.chain);
  console.log('appended #' + e.i, e.board, e.title, e.hash.slice(0, 16) + '…');
}

fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2));
console.log('ledger:', ledger.chain.length, 'entries, chain verified');

execSync('node "' + path.join(__dirname, 'refresh-donations.cjs') + '"', { stdio: 'inherit' });
