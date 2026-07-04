# InstantHPI Hub — design

**Date:** 2026-07-03 · **Status:** approved by Carlos (menu answers: $1 idea fee kept; earmark = net-of-fees, tracked publicly; learning links to /courses; hub at /hub)

## What this is

One public, non-PHI system on instanthpi.ai that adds: (1) reach-out pages so people can organize around the project, (2) a Google-login "donations account," (3) Vision Control — post an idea for $1, vote by donating $1+ earmarked to that idea, (4) a gate page routing physicians side vs nodes side vs learning vs sponsoring. Every project keeps its own distinct data array.

**Standing constraint (Carlos, 2026-07-03): nobody is paid at this time — all positions and collaborations are volunteer work. Every reach-out page states this plainly.**

## Architecture

- **Backend:** the existing Cloudflare Worker `petition-familles` (account 70443374001b15666eeaa70ab5f0062b, KV `PETITION_SIGNATURES` id 1ee7ea2b95fa40c98325e321477bfbf1, custom domain `petition.instanthpi.ai`) is extended in place. Petition endpoints (`/sign`, `/count`, `/wall`) stay byte-compatible.
- **Frontend:** static pages in `~/instanthpi-donations/site/`, deployed additively to Netlify site `instanthpi-nexus` (c1e311c5) via `deploy-pages.cjs` (MSYS_NO_PATHCONV=1, NETLIFY_SITE_ID env).
- **Payments:** existing Stripe account; new Payment Link "InstantHPI Vision Control" (custom amount, min USD $1, created via API with `custom_unit_amount`). Attribution via `?client_reference_id=<ideaId>.<userKey>` appended to the link. `refresh-vision.cjs` on work126 (hourly scheduled task, same recipe as the donations wall refresher) lists paid Checkout Sessions and credits them to ideas through an authenticated worker endpoint. Credits are idempotent by session id.
- **Auth:** Google Identity Services in the browser → ID token → worker verifies against Google's tokeninfo endpoint → stores/updates `user:<sub>` → returns an HMAC-signed session token (30-day expiry, secret bound to the worker). Pages store it in localStorage. Until Carlos creates a **Web application** OAuth client (manual Cloud Console step; the on-disk client is desktop-type) the sign-in button shows "coming online shortly" and everything else works logged-out.

## Distinct arrays (KV key prefixes)

| Prefix | Holds |
|---|---|
| `sig:<sha256(email)>` | petition signatures (existing, untouched) |
| `ro:<project>:<sha256(email)>` | reach-out submissions; project ∈ careers, partnerships, corporate, consultation, volunteers, physicians, nodes |
| `user:<googleSub>` | account: name, email, picture, created, lastSeen |
| `idea:<VC-n>` | Vision Control idea: title ≤80, body ≤1000, authorSub, status pending→active, created |
| `seq:idea` | idea id counter |
| `tally:<VC-n>` | cents credited to that idea |
| `pay:<checkoutSessionId>` | idempotency record: ideaId, userKey, cents, when |

## Endpoints (worker)

- `POST /sign`, `GET /count`, `GET /wall` — unchanged petition API.
- `POST /reachout` `{project, name, email, org?, message?, lang?}` → its project's array; dedupe per email per project; `GET /reachout-count?project=x`.
- `POST /auth/google` `{credential}` → verify → upsert user → `{token, profile}`.
- `GET /me` (Bearer) → profile + donation history (their `pay:` records) + their ideas.
- `POST /ideas` (Bearer) → create pending idea, returns `{id, payUrl}` where payUrl = Vision Control link + `client_reference_id=<id>.<userKey>`.
- `GET /ideas` → active ideas with tallies (desc by tally) + caller's own pending ones when authed.
- `POST /admin/credit` `{secret, sessionId, ideaId, userKey, cents, when}` → idempotent credit; activates a pending idea once total ≥ 100¢. Secret = long random string bound as worker var, known only to refresh-vision.cjs.

## Pages

- `/join` — Get Involved hub: 5 cards linking the reach-out pages + nodes/physicians interest.
- `/careers`, `/partnerships`, `/corporate`, `/consultation`, `/volunteers` — one shared template (site's ink/brass design), distinct copy, English-primary (international audience; the petition alone stays FR-first as a Quebec-native product), each with a form → `POST /reachout` with its own project tag. Careers copy is explicit: volunteer only, no salaries at this time.
- `/vision` — Vision Control: rules ($1 to post; $1+ donations = votes; "100% of your donation, net of payment-processing fees, is allocated to this idea; each idea's total and spending are reported publicly"), idea list with live totals and Support buttons, post form (auth), account strip (my ideas / my donations).
- `/hub` — the gate: sign-in + tiles → Physicians side (/physicians), Nodes side (/network), Learning (/courses), Sponsoring catalog (course bulk-sponsorship links, donation tiers, physicians association, top unfunded ideas), Vision Control (/vision), Petition (/familles), Get Involved (/join).
- Sitewide nav on existing pages gains `Hub` and `Familles` entries (additive redeploy of the ~9 live pages).

## Error handling & safety

Worker validates and length-caps all inputs; CORS locked to instanthpi.ai origins; per-email dedupe on all arrays; credits idempotent; no PHI collected anywhere; scrub-check on every new page (no @centremedicalfont.ca, no gmail addresses); public contact = info@instanthpi.ai only.

## Testing

curl smoke tests for every new endpoint (incl. dedupe + idempotent credit replay); safe-browser puppeteer pass on every new page (render, form submit, console errors); re-verify petition endpoints unchanged after worker redeploy; scrub-check sweep before deploy.

## Out of scope (YAGNI)

Idea comments/moderation UI, refunds, per-idea spending ledgers (manual reporting for now), email notifications, non-Google login, French versions of the reach-out pages (add on demand).
