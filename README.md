# instanthpi-web — the public pages of instanthpi.ai

**Audience: everyone.** This repo holds the public web pages and the deploy
tooling for [instanthpi.ai](https://instanthpi.ai) — the communication surface
of the Free Universal Healthcare AI project.

The project is split into one repository per audience, so nothing mixes:

| Repo | Audience | What |
|---|---|---|
| [free-universal-healthcare-ai](https://github.com/carlosfalai/free-universal-healthcare-ai) | **People / patients** | The Telegram bot source, master build file, chat images, SECURITY.md — MIT, fork it |
| **instanthpi-web** (this repo) | **Everyone** | The pages: /donations (+ supporter wall), /courses ($35 modules, free-at-1000-buyers), /4chan (hash-chained thread ledger), homepage banner |
| instanthpi-for-doctors | **Physicians** | The practice-automation architecture, the Physician Guild — sanitized patterns, no patient data, ever |

## Contents

- `site/` — the pages exactly as deployed (donations, courses, 4chan ledger)
- `refresh-donations.cjs` — hourly job: pulls paid Stripe sessions → supporter
  wall + course unlock counters → additive Netlify deploy (keys read from a
  local env file, never committed)
- `add-thread.cjs` — appends a thread/post to the hash-chained public ledger
  (`site/4chan/threads.json`), SHA-256 chain verified in the browser
- `finish-deploy.cjs` — babysits Netlify's slow cold-digest deploys to completion
- `trw-postback-worker.js` — Cloudflare Worker receiving affiliate sale postbacks
- `posts/` — the 4chan launch kit: post texts + AI-generated images
- `gen-post-images.cjs` — image generation for the post series

## The rules encoded here

- Donations: one link, any amount; supporter wall updates hourly; if we ever
  obtain non-profit status, receipts will be provided retroactively.
- Courses: $35/module; at 1,000 buyers a module unlocks free for everyone.
- Every thread we post in is indexed append-only, hash-chained, publicly
  verifiable.
- No patient information, no secrets, no API keys in this repository.

— Carlos Faviel Font, MD · cff@centremedicalfont.ca · Solrac in The Real World
(`01GKB01NCKP96WKE961GW9GY40`)
