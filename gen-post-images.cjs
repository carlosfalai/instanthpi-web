#!/usr/bin/env node
/**
 * gen-post-images.cjs — nano-banana (Gemini image) calls for the 4chan
 * post series. Each post in the sequence gets an accompanying image;
 * together the thread reads like an InstantHPI infographic.
 *
 * Usage: node gen-post-images.cjs [indexes...]   e.g. node gen-post-images.cjs 1 3
 *        node gen-post-images.cjs                (all)
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const MODEL = 'gemini-3-pro-image-preview';
const OUT = path.join(__dirname, 'posts');

function env(name) {
  const line = fs.readFileSync('C:\\Users\\insta\\.claude\\.env', 'utf8')
    .split(/\r?\n/).find(l => l.startsWith(name + '='));
  if (!line) throw new Error('missing ' + name);
  return line.slice(name.length + 1).trim();
}

const STYLE = 'Dark charcoal-ink background, antique brass and gold accents, ' +
  'clean bold readable typography, high contrast, meme-format composition, ' +
  'no watermarks, no logos of real companies. All text spelled EXACTLY as given.';

const IMAGES = [
  ['img-01-launch', 'Dramatic X-ray side view of a human skull; where the brain should be there is a glowing intricate brass clockwork-and-circuitry brain. Big bold headline text at top: "THE ARTICULATED BRAIN OF A PHYSICIAN". Bottom text: "POWERED BY AI - FREE ON TELEGRAM". Small footer text: "@InstantHPIBot". ' + STYLE],
  ['img-02-problem', 'Two-panel meme infographic. Left panel: an endless crowded hospital waiting room fading into darkness, caption "250,000 PATIENTS PER DOCTOR (SOUTH SUDAN)". Right panel: a single glowing smartphone showing a chat, caption "STRUCTURED CLINICAL REASONING. FREE. 30 SECONDS." Footer text: "instanthpi.ai". ' + STYLE],
  ['img-03-how', 'Flow-diagram infographic in a vintage anatomical-engraving style: a patient icon -> arrow -> "18-QUESTION INTAKE (OPQRST)" -> arrow -> five robed AI figures around a round council table debating, labeled "MULTIPLE AIs DEBATE YOUR CASE" -> arrow -> a sealed wax-stamped document labeled "CONSENSUS HPI REPORT". Footer: "HAND IT TO ANY DOCTOR ON EARTH". ' + STYLE],
  ['img-04-roadmap', 'Roadmap infographic as an old treasure map with four numbered waypoints along a dotted path: "1. FREE BOTS (NOW)", "2. MEMORY - YOUR FULL HISTORY", "3. LOCAL EXE - YOUR RECORD ON YOUR MACHINE", "4. CHRONIC CARE BY AI COUNCIL". Compass rose in corner. Footer: "instanthpi.ai/donations". ' + STYLE],
  ['img-05-honest', 'Minimalist meme: a plain brass plaque on dark wall, engraved text: "AI IS NOT A DOCTOR. SEE ONE IF YOU CAN. BUT AI IS 10,000,000x BETTER THAN GUESSING ALONE." Small footer: "InstantHPI - free health education". ' + STYLE],
  ['img-06-doctors', 'Two-panel comic, hand-drawn style: left panel a hunched exhausted doctor at 2AM buried under a mountain of paper charts, caption "YOUR DOCTOR RIGHT NOW"; right panel the same doctor relaxed drinking coffee while a brass clockwork assistant writes the charts, caption "PHYSICIANS ASSOCIATION - AUTOMATE THE GRIND. RECLAIM YOUR LIFE." Footer: "$100/MO - instanthpi.ai/donations". ' + STYLE],
];

function call(key, prompt) {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  });
  return new Promise((resolve, reject) => {
    const r = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: '/v1beta/models/' + MODEL + ':generateContent?key=' + key,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let d = [];
      res.on('data', c => d.push(c));
      res.on('end', () => resolve(JSON.parse(Buffer.concat(d).toString('utf8'))));
    });
    r.on('error', reject);
    r.write(body); r.end();
  });
}

(async () => {
  const key = env('GEMINI_API_KEY');
  fs.mkdirSync(OUT, { recursive: true });
  const want = process.argv.slice(2).map(Number);
  for (let i = 0; i < IMAGES.length; i++) {
    if (want.length && !want.includes(i + 1)) continue;
    const [name, prompt] = IMAGES[i];
    process.stdout.write(name + ' ... ');
    try {
      const res = await call(key, prompt);
      const parts = (((res.candidates || [])[0] || {}).content || {}).parts || [];
      const img = parts.find(p => p.inlineData && p.inlineData.data);
      if (!img) { console.log('NO IMAGE: ' + JSON.stringify(res).slice(0, 180)); continue; }
      const file = path.join(OUT, name + '.png');
      fs.writeFileSync(file, Buffer.from(img.inlineData.data, 'base64'));
      console.log('saved ' + file + ' (' + Math.round(fs.statSync(file).size / 1024) + ' KB)');
    } catch (e) { console.log('FAIL ' + e.message); }
  }
})();
