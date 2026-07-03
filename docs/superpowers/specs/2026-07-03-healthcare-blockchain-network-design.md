# The Healthcare Blockchain — node network & physician grading

**Date:** 2026-07-03 · **Owner:** Carlos Faviel Font, MD (Solrac) · **Status:** approved design

## Purpose

A network where anyone can host a "node" — their own InstantHPI-style AI
consultation service (their models or combinations, served over Telegram or
their own site, at their own price) — and where **board-certified,
license-verified physicians grade the AI's work case by case, signing their
name on each case**. The nexus (instanthpi.ai) gathers de-identified cases,
routes them to physicians, and publishes the signed record. Physicians get
paid per grade; node hosts earn from consults; both build public reputation.

Not for prescriptions. This is the proof-of-concept that refines the
technology until it earns trust — and a protection for mankind against any
minority becoming the exclusive possessor of medical knowledge.

## Core model: the signed case

The unit of record is the **case**, not the vote.

```
CASE RECORD (public, append-only, hash-chained)
├─ case_id, submitted_at
├─ node_id  (which node produced it)
├─ models   (which AI models / combination)
├─ case_text        (de-identified — enforced at the gate)
├─ ai_conclusion    (the consensus the node's AIs produced)
└─ signatures[]     (appended over time)
   ├─ physician_id + display name + license verification ref
   ├─ grade: AGREED | DISAGREED
   ├─ correction/comment (optional, public)
   └─ signed_at, signature hash (chains to previous record)
```

A grade is a public professional act: "your name is signed on this case."

## Three public faces of the same data (instanthpi.ai/network)

1. **Case page** — the case, the AI conclusion, every physician signature+grade.
2. **Node page** — the node's cases, agree-rate, models used, trend, price.
3. **Physician page** — name, license verification status, every case they
   signed with their grade (record of involvement: reviewed count, agree vs
   disagree split).

All hash-chained (same pattern as the /4chan thread ledger) so the record is
verifiable and append-only.

## Components

| # | Component | Where | What |
|---|---|---|---|
| 1 | **Nexus API** | Cloudflare Worker + KV/D1 (same account as trw-postback) | `POST /nodes/register` → node_id+key · `POST /cases` (auth: node key) → PHI gate → stored · `GET /cases/:id`, `GET /network.json` (public data) |
| 2 | **PHI gate** | inside the Worker | reject submissions containing detectable identifiers: regex (names/DOB/phones/emails/IDs) + AI screen (cheap model). De-identification is the node's job; enforcement is ours. Rejected cases bounce back with reason. |
| 3 | **Review portal** | instanthpi.ai/review (code-gated; physician accounts) | one case at a time: case + AI conclusion → AGREE / DISAGREE + optional correction. Each submit = signed, final, public. Carousel-style loop. |
| 4 | **Public record** | instanthpi.ai/network (+ /network.json) | the three faces above; static pages regenerated from Worker data (deploys to the nexus Netlify site via zip — seconds). |
| 5 | **Physician verification** | manual v1 | license checked against regional board registries (NPI/NPPES, CMQ, etc.) by Carlos; verified physicians get portal credentials + public profile. Ties into the Physician Guild ($100/mo members are natural first reviewers). |
| 6 | **Payments** | manual v1 | per-grade credit (rate set by Carlos, e.g. $1–2/grade) accrued per physician, paid monthly (Stripe/PayPal). Funded by donations + guild fees + later a small per-case network fee. Node hosts keep 100% of their consult revenue in v1. |

## Rollout (dogfood first)

1. **Node #1 = our own Telegram bot.** Its daily consensus outputs flow into
   the review queue first — proves submission → PHI gate → grading → signed
   public record end-to-end with cases we control.
2. **Physician #1 = Carlos** (first public physician record).
3. **API spec published on GitHub** (free-universal-healthcare-ai repo) the
   same day, so anyone can build a node toward it.
4. Open registration for external nodes once the loop is proven.
5. Later: N-physician quorum per case (start N=1), per-case network fee,
   automated license verification, cryptographic physician keys (true
   signatures replacing v1's server-side signature hashes).

## Constraints & guardrails

- **Naming:** nodes are called **nodes** or **physician simulators**.
- **Node neutrality:** the nexus supports no node over any other. Nodes are
  privately run and privately owned; **we never change the nodes** — we
  neither operate, endorse, nor rank them editorially. The only
  differentiation is the public, signed grading record — the data speaks.
- **Business model:** joining/using a node is between the user and the node.
  **Running a node costs money: node operators pay us for API usage** (case
  submission + validation service). In return the network publishes the
  **list of validated nodes with the scores our physicians provided** — the
  validation is what operators are buying. We also **index node operators'
  educational platforms** as part of the listing.
- **Opt-in publicity:** we only post and make public the nodes whose owners
  decide to share them with us through the API. Unshared nodes stay private.
- **Verification funding:** part of the proof-of-verification money comes
  from the physicians themselves (guild membership) — physicians co-fund the
  system that pays them per signed grade, keeping verification independent
  of node money alone.
- **No PHI ever reaches the nexus** — gate enforced, submissions are
  de-identified by design; violators bounced, repeat violators deregistered.
- **No prescriptions** — graded conclusions are education/recommendations.
- **Grades are final and public** — no anonymous grading, no retraction
  (corrections may be appended as new signatures).
- **AI-automated disclaimer** stays on all patient-facing surfaces; the
  network page explains that grading is retrospective quality measurement,
  not pre-delivery review.

## Success criteria (v1)

- 50+ of our own bot's cases in the queue, graded and published.
- The three public faces render from live data on instanthpi.ai/network.
- At least one external physician verified and signing.
- API spec public; at least one external node registered (even a test one).
