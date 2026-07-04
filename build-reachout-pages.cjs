// build-reachout-pages.cjs — stamp the shared reach-out template into
// site/{join,careers,partnerships,corporate,consultation,volunteers}/index.html.
// Copy lives here; rerun after edits, then deploy the changed pages.
const fs = require('fs');
const path = require('path');

const VOLUNTEER_LINE = 'All roles are volunteer — no salaries at this time.';

const PAGES = {
  careers: {
    title: 'Careers — InstantHPI',
    kicker: 'Careers · Volunteer-first',
    h1: 'Build <em>free healthcare</em> with us',
    lead: `${VOLUNTEER_LINE} What you get: real shipped systems, public credit for everything you build, and first position when funding arrives. What we get: healthcare that costs patients nothing.`,
    cards: [
      ['Engineering', 'Bots, Cloudflare workers, EHR automation, vision pipelines. Everything ships to production and stays public where possible.'],
      ['Clinical', 'Physicians and nurses reviewing AI output, shaping the guild, signing off on what patients see.'],
      ['Growth', 'Content, community, translations. Take what works in one language and make it work in twelve.'],
    ],
    formTitle: 'Tell us what you can build',
    project: 'careers',
  },
  partnerships: {
    title: 'Partnerships — InstantHPI',
    kicker: 'Partnerships',
    h1: 'Partner with <em>InstantHPI</em>',
    lead: `Clinics, community organizations, patient groups, universities: bring the free bot and pilot programs to your people. ${VOLUNTEER_LINE.replace('roles are', 'collaboration is').replace('All roles are volunteer', 'All collaboration is volunteer-based')}`,
    cards: [
      ['Pilot sites', 'Emergency departments, GMFs, and walk-in clinics that want to test patient-completed intake — see the Quebec petition at /familles/.'],
      ['Research & evaluation', 'Universities and research groups: independent evaluation of wait-time and documentation-time impact.'],
      ['Community distribution', 'Patient associations and community groups distributing free access to the people who need it most.'],
    ],
    formTitle: 'Propose a partnership',
    project: 'partnerships',
  },
  corporate: {
    title: 'Corporate & Sponsors — InstantHPI',
    kicker: 'Corporate · Sponsoring',
    h1: 'Corporate &amp; <em>sponsors</em>',
    lead: `Fund what your employees and customers actually need: free healthcare access. Sponsorships are public and earmarked — you see exactly what your money did. Nobody draws a salary at this time.`,
    cards: [
      ['Sponsor course seats', 'Bulk-sponsor the AI-automation-in-healthcare modules; extra copies go free to people who can\'t pay. See /courses/.'],
      ['Sponsor an idea', 'Vision Control at /vision/: fund a specific feature or project — donations are allocated to that idea, net of processing fees, and reported publicly.'],
      ['Infrastructure', 'Servers, AI inference, fax lines, phone numbers — the unglamorous things that keep a free service free.'],
    ],
    formTitle: 'Talk to us about sponsoring',
    project: 'corporate',
  },
  consultation: {
    title: 'AI Automation Consultation — InstantHPI',
    kicker: 'AI Automation · Consultation',
    h1: 'AI automation <em>consultation</em>',
    lead: `We automated a real medical practice end-to-end — intake, documentation, follow-up, billing support — and published how. Ask us anything. Consultations are free and volunteer-run at this time.`,
    cards: [
      ['Practice automation audit', 'Where AI actually saves clinician time in your workflow — and where it doesn\'t. Honest, vendor-neutral.'],
      ['Build-with-you sessions', 'Hands-on sessions recreating our systems in your environment, using the same open playbooks as our courses.'],
      ['Talks & training', 'Clinics, associations, classrooms: what automating a practice really looks like, demos included.'],
    ],
    formTitle: 'Request a consultation',
    project: 'consultation',
  },
  volunteers: {
    title: 'Volunteers — InstantHPI',
    kicker: 'Volunteers',
    h1: 'Volunteer with <em>InstantHPI</em>',
    lead: `A few hours a week moves real healthcare. ${VOLUNTEER_LINE} Everything you contribute is publicly credited.`,
    cards: [
      ['Test the bots', 'Use the free bots, break them, tell us what confused you. Every confusing answer you find improves care for the next person.'],
      ['Translate & localize', 'The bots speak the patient\'s language — help us make sure they speak yours correctly.'],
      ['Spread the word', 'Family, clinics, community boards, group chats. Free healthcare only helps people who know it exists.'],
    ],
    formTitle: 'Join as a volunteer',
    project: 'volunteers',
  },
};

const NAV = `<nav style="background:#0b0e12;border-bottom:1px solid #243040;font-family:'Courier New',monospace;font-size:13px;display:flex;flex-wrap:wrap;justify-content:center;gap:2px 4px;padding:11px 12px">
  <a href="/" style="color:#d4af7a;font-weight:bold;text-decoration:none;padding:6px 12px;letter-spacing:.12em">INSTANTHPI</a>
  <span style="color:#243040;padding:6px 2px">|</span>
  <a href="/hub/" style="color:#d4af7a;text-decoration:none;padding:6px 12px">Hub</a>
  <a href="/familles/" style="color:#d7dde5;text-decoration:none;padding:6px 12px">Familles</a>
  <a href="/vision/" style="color:#d7dde5;text-decoration:none;padding:6px 12px">Vision Control</a>
  <a href="/join/" style="color:#d7dde5;text-decoration:none;padding:6px 12px">Get Involved</a>
  <a href="/education/" style="color:#d7dde5;text-decoration:none;padding:6px 12px">Education</a>
  <a href="/network/" style="color:#d7dde5;text-decoration:none;padding:6px 12px">Blockchain</a>
  <a href="https://app.instanthpi.ai" style="color:#d7dde5;text-decoration:none;padding:6px 12px">AI Council</a>
  <a href="https://t.me/InstantHPIBot" style="color:#d7dde5;text-decoration:none;padding:6px 12px">Free Bots</a>
  <a href="/donations/" style="color:#d7dde5;text-decoration:none;padding:6px 12px">Donations</a>
  <a href="/courses/" style="color:#d7dde5;text-decoration:none;padding:6px 12px">Courses</a>
  <a href="/physicians/" style="color:#d7dde5;text-decoration:none;padding:6px 12px">For Physicians</a>
</nav>`;

const CSS = `:root{--ink:#0b0e12;--ink2:#11161d;--panel:#141b24;--line:#243040;--brass:#b08d57;--brass-bright:#d4af7a;--text:#d7dde5;--dim:#8b96a5;--good:#7fb069;--warn:#c9704a}
*{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth}
body{background:var(--ink);color:var(--text);font-family:Georgia,'Times New Roman',serif;line-height:1.65;-webkit-font-smoothing:antialiased}
.wrap{max-width:880px;margin:0 auto;padding:0 24px}
header{border-bottom:1px solid var(--line);padding:20px 0}
header .wrap{display:flex;justify-content:space-between;align-items:center;gap:16px}
.brand{font-family:'Courier New',monospace;letter-spacing:.18em;font-size:14px;color:var(--brass);text-transform:uppercase}
.brand b{color:var(--text)}
.hero{padding:70px 0 50px;border-bottom:1px solid var(--line)}
.kicker{font-family:'Courier New',monospace;font-size:12px;letter-spacing:.25em;text-transform:uppercase;color:var(--brass);margin-bottom:18px}
h1{font-size:clamp(30px,5vw,44px);line-height:1.15;font-weight:normal;margin-bottom:20px}
h1 em{color:var(--brass-bright);font-style:italic}
.lead{font-size:18px;color:var(--dim);max-width:680px}
.lead b{color:var(--text)}
section{padding:52px 0;border-bottom:1px solid var(--line)}
h2{font-family:'Courier New',monospace;font-size:13px;letter-spacing:.25em;text-transform:uppercase;color:var(--brass);margin-bottom:26px}
h2::before{content:"— ";color:var(--line)}
.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
@media(max-width:700px){.grid{grid-template-columns:1fr}}
.card{background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:22px}
.card h3{font-size:16px;font-weight:normal;color:var(--brass-bright);margin-bottom:8px}
.card p{font-size:14.5px;color:var(--dim)}
a.card{display:block;text-decoration:none;transition:border-color .15s}
a.card:hover{border-color:var(--brass)}
form{background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:30px;max-width:640px}
label{display:block;font-family:'Courier New',monospace;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin:16px 0 6px}
input,textarea{width:100%;background:var(--ink);border:1px solid var(--line);border-radius:3px;color:var(--text);padding:11px 12px;font-family:Georgia,serif;font-size:15px}
input:focus,textarea:focus{outline:none;border-color:var(--brass)}
.btn{display:inline-block;background:var(--brass);color:#0b0e12;font-family:'Courier New',monospace;font-weight:bold;letter-spacing:.08em;padding:14px 34px;border-radius:3px;font-size:15px;text-transform:uppercase;border:none;cursor:pointer;margin-top:20px}
.btn:hover{background:var(--brass-bright)}
.note{font-size:12.5px;color:var(--dim);margin-top:14px;font-family:'Courier New',monospace}
#form-msg{display:none;margin-top:16px;padding:13px 16px;border-radius:3px;font-family:'Courier New',monospace;font-size:14px}
#form-msg.ok{display:block;background:var(--good);color:#0b0e12}
#form-msg.err{display:block;background:var(--warn);color:#0b0e12}
footer{padding:36px 0 60px;font-size:12px;color:var(--dim);font-family:'Courier New',monospace;line-height:1.8}`;

function page(p) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${p.title}</title>
<meta name="description" content="${p.lead.replace(/<[^>]+>/g, '').replace(/"/g, '&quot;').slice(0, 155)}">
<style>${CSS}</style>
<script src="/hub-config.js"></script>
</head>
<body>
${NAV}
<header><div class="wrap"><div class="brand">INSTANT<b>HPI</b> · ${p.kicker.split('·')[0].trim().toUpperCase()}</div></div></header>
<div class="hero"><div class="wrap">
  <div class="kicker">${p.kicker}</div>
  <h1>${p.h1}</h1>
  <p class="lead">${p.lead}</p>
</div></div>
<section><div class="wrap">
  <h2>Where you fit</h2>
  <div class="grid">
${p.cards.map(([t, d]) => `    <div class="card"><h3>${t}</h3><p>${d}</p></div>`).join('\n')}
  </div>
</div></section>
<section><div class="wrap">
  <h2>${p.formTitle}</h2>
  <form id="ro-form" onsubmit="return submitRO(event)">
    <label for="f-name">Name *</label><input id="f-name" required maxlength="120" autocomplete="name">
    <label for="f-email">Email *</label><input id="f-email" type="email" required maxlength="200" autocomplete="email">
    <label for="f-org">Organization (optional)</label><input id="f-org" maxlength="200" autocomplete="organization">
    <label for="f-message">Message (optional)</label><textarea id="f-message" rows="4" maxlength="1000"></textarea>
    <button class="btn" type="submit">Send</button>
    <div class="note">We keep your name and email only to contact you about this — never sold or shared.</div>
    <div id="form-msg"></div>
  </form>
</div></section>
<footer><div class="wrap">
  INSTANTHPI · Free health education, not medical advice. Not for emergencies.
  All positions and collaborations are volunteer at this time — nobody draws a salary.
  No health information is collected on this page. Write us: info@instanthpi.ai
</div></footer>
<script>
function submitRO(e){
  e.preventDefault();
  var msg = document.getElementById('form-msg'); msg.className='';
  fetch(window.HUB.API + '/reachout', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      project: '${p.project}',
      name: document.getElementById('f-name').value,
      email: document.getElementById('f-email').value,
      org: document.getElementById('f-org').value,
      message: document.getElementById('f-message').value
    })
  }).then(function(r){return r.json();}).then(function(d){
    if (d.ok) { msg.className='ok'; msg.textContent = d.already ? 'We already have you — we\\'ll be in touch!' : 'Received — we\\'ll be in touch!'; document.getElementById('ro-form').reset(); }
    else { msg.className='err'; msg.textContent = 'Please check your name and email.'; }
  }).catch(function(){ msg.className='err'; msg.textContent='Network error — please try again.'; });
  return false;
}
</script>
</body>
</html>`;
}

const JOIN = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Get Involved — InstantHPI</title>
<meta name="description" content="Careers, partnerships, corporate sponsoring, AI automation consultation, volunteering — organize the reach-out. All volunteer, nobody is paid at this time.">
<style>${CSS}</style>
</head>
<body>
${NAV}
<header><div class="wrap"><div class="brand">INSTANT<b>HPI</b> · GET INVOLVED</div></div></header>
<div class="hero"><div class="wrap">
  <div class="kicker">Get Involved</div>
  <h1>Pick your <em>door</em></h1>
  <p class="lead">${VOLUNTEER_LINE} Every door below leads to a real person reading a real inbox — pick the one that fits and tell us who you are.</p>
</div></div>
<section><div class="wrap">
  <h2>Six ways in</h2>
  <div class="grid" style="grid-template-columns:1fr 1fr;gap:14px">
    <a class="card" href="/careers/"><h3>Careers</h3><p>Engineering, clinical, growth. Volunteer today, first in line when funding arrives.</p></a>
    <a class="card" href="/partnerships/"><h3>Partnerships</h3><p>Clinics, universities, community organizations — pilots and distribution.</p></a>
    <a class="card" href="/corporate/"><h3>Corporate &amp; sponsors</h3><p>Earmarked, public sponsorships: course seats, ideas, infrastructure.</p></a>
    <a class="card" href="/consultation/"><h3>AI automation consultation</h3><p>We automated a real practice — free, volunteer-run consultations.</p></a>
    <a class="card" href="/volunteers/"><h3>Volunteers</h3><p>Test bots, translate, spread the word. A few hours moves real healthcare.</p></a>
    <a class="card" href="/hub/"><h3>Physicians &amp; Nodes</h3><p>The gate: physicians side, nodes side, learning, sponsoring, Vision Control.</p></a>
  </div>
</div></section>
<footer><div class="wrap">
  INSTANTHPI · Free health education, not medical advice. Not for emergencies.
  All positions and collaborations are volunteer at this time — nobody draws a salary.
  Write us: info@instanthpi.ai
</div></footer>
</body>
</html>`;

for (const [name, p] of Object.entries(PAGES)) {
  const dir = path.join(__dirname, 'site', name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(p));
  console.log('wrote site/' + name + '/index.html');
}
fs.mkdirSync(path.join(__dirname, 'site', 'join'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'site', 'join', 'index.html'), JOIN);
console.log('wrote site/join/index.html');
