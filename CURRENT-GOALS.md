# Current goals (2026-07-03, live working file)

## Deploy system (SOLVED)
instanthpi.ai = Netlify site "instanthpi-nexus" c1e311c5-9bf4-4ad8-a2a4-9922493d4fab.
Deploy = rebuild nexus-build/ (copy site/index-nexus.html→index.html, site/{donations,courses,law,4chan,physicians,network}/index.html + json + _redirects), tar zip, POST zip to /sites/<id>/deploys. Seconds. NEVER touch old site 60d1889b (wedged digest queue); portfolio lives at instanthpi.netlify.app via _redirects.

## In progress
1. **CaseCheck upgrade** (~/casecheck-site, Render autodeploy on git push to carlosfalai/casecheck-site):
   - index.html ~line 283 "Pick the size of your AI panel" (SKUs p2 $25/p5 $49/p10 $99/p12 $249 in server.cjs CATALOG).
   - TODO: clickable model chips naming the exact LLMs per panel (Bedrock roster: Claude Opus/Sonnet/Haiku, Nova Pro/Lite/Micro, Llama 4, Mistral Large, Qwen, Cohere, DeepSeek, OpenAI-on-Bedrock) each showing MBE/MedQA score on click; price rises as models added (map count→sku p2/p5/p10/p12).
   - TODO: page-count pricing: first 250 pages included; +$10 per extra 250-page bundle (add CATALOG sku 'pages250' amount 1000, extra line_item quantity from intake page estimate).
   - Report output template MUST match sample.html styling exactly (check generate.cjs).
2. **/models page on nexus site** — site/models/index.html in site template (med MedQA + law MBE tables + costs; nav "Which AI?" → /models/). Previous heredoc attempt failed on quoting; use Write tool. Then rebuild+deploy zip + push.
3. **Solo-doctor warning** (dictated): "Do NOT invest in AI automation in your practice to save money — AI and secure systems are very expensive; building securely without programming knowledge is not realistically achievable. Warning to solo doctors." → SOLO-PRACTICE-LESSONS.md (instanthpi-for-doctors) + physicians page disclaimer.
4. **1000-page case cost answer** (verified prices): Textract $1.50 + Bedrock de-id Haiku ~$3 + chunk-map ~$1 + council: p5 ~$1.5-2 / p12 bench ~$4-8 → TOTAL ~$7-9 (5-AI) to ~$13-20 (12-AI). Current $249 12-AI price = healthy margin even at 1000 pages; per-page add-on protects beyond that.
5. Sibling apps: keys sanitized on disk; Carlos must ROTATE exposed keys (Blotato, Gumroad, Butler, RecuFlotte Stripe/Telegram/Gemini). NOT for GitHub — free hosted services, instanthpi = nexus.
6. Healthcare-blockchain build next step: writing-plans → Cloudflare Worker API (nodes register/POST cases, PHI gate) + /review portal + /network live scoreboard. Spec: docs/superpowers/specs/2026-07-03-healthcare-blockchain-network-design.md.
7. Pending tasks: CMQ strip on OLD portfolio site only now (low priority since domain moved); 4chan posts on demand (kit in posts/).

## CaseCheck (2026-07-03 late) — DONE this pass
- Bench section live: 12 named models, click→MBE/MedQA score, price climbs with selection (2/$25, 5/$49, 10/$99, 12/$249); triage-only caveat verbatim in pitch.
- Lawyer-cost comparison in pitch ($250-500/hr, 2-4 min/page → 1000p ≈ $12k-25k vs $249).
- Deliverable renamed "AI Opinion & Verdict".
- Print CSS in sample.html → clean PDF page breaks; make-pdf.cjs (Edge headless) ships; sample PDF on Desktop.
- STILL TODO: puppeteer PDF on Render + attach PDF to processPaid email; /models page on nexus (Write tool, heredoc quoting failed); solo-doctor "don't do this to save money" warning into SOLO-PRACTICE-LESSONS + physicians page.
