# ACE-048 Framework-First Decision Workspace Phase 3 Slice 3 — Verifier Review Packet

Date: 2026-09-01
Status: `HUMAN-ACCEPTED / CLOSED`
Governing event: `ACE-048`
Execution mode: `transitional_self_verification`
Problem class: `runtime data-facade boundary with lifecycle preservation`
Verification confidence: `HIGH`
Result classification: `Verifier Proof Complete — Human acceptance pending`

## Executive summary

### What changed

Sender Overview now obtains its existing workspace, workflow-window, Sender Distribution, authority-identity, and Time Context reads through the shared Decision Workspace adapter instead of importing those Gmail read helpers directly in the page.

### What the operator gets

The Gmail page still looks and behaves the same: the same review units, counts, windows, charts, sender rows, evidence, pagination, Decision Mode, provider controls, and close/return flow. Behind that stable screen, other workflows can supply their own subjects, activities, evidence, metrics, roles, sources, provenance, and approved domain titles through the same framework boundary.

### Why it matters

The framework can support detailed review work for support, real estate, crypto, paid media, bookkeeping, tax, purchasing/shipping, and future company workflows without making Gmail nouns or Gmail request mechanics universal platform truth.

## Authorized scope and outcome

The implementation stayed within the exact six-file source allowlist:

1. `web/src/lib/runtime/decisionWorkspaceReadModel.ts`
2. `web/src/components/runtime/DecisionWorkspaceReadContext.tsx`
3. `web/src/lib/integrations/gmail/gmailDecisionWorkspaceReadAdapter.ts`
4. `web/src/app/agents/[id]/operations/review/page.tsx`
5. `web/src/components/runtime/GmailCleanupComponents.tsx`
6. `web/scripts/workspace-decision-read-model-fixtures.mjs`

The framework now defines a portable, validated Item Overview contract for subject identity, activity/evidence, semantic metrics, workflow/group/window identity, pagination, ordering, lifecycle, freshness, quality, provenance, sources, and agent roles. Domain-visible titles remain adapter/workflow metadata. Missing or unsafe metadata fails closed or uses the safe framework fallback; no model call occurs during rendering.

The generic read service exposes the existing workspace, window, distribution, authority-ID, and review-unit activity-series reads. The Gmail adapter translates those calls to the accepted Gmail helpers without changing cache keys, request bodies, response acceptance, retry/abort ownership, or lifecycle behavior. The shared review page remains the lifecycle owner and consumes transitional Gmail DTOs only as provider-projected compatibility values.

No route, provider operation, provider data, database, artifact, index, publication, request family, cache owner, polling behavior, commit, push, or deployment was changed. The direct Gmail destination action remains provider-specific and unchanged.

## Preservation and rollback evidence

Pre-implementation backup: `VERIFIED`

`/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - Pre ACE-048 framework-first Decision Workspace Phase 3 Slice 3 Sender Overview r)`

- Source: `/Users/olivercarlin/.codex/worktrees/8642/ai-agent-platform`
- Files: `1,138`
- Git identity: detached `8f8e4d670cabdd21459c0b4b8e502d16e272afc0`
- Changed paths at backup time: `50`
- Retention: normal project-scoped seven-day pruning
- `KEEP` preservation: all `23` discovered archives preserved
- Backup-to-current source comparison: exactly the six allowlisted source files differ
- Pre-existing diff status: present and preserved
- Existing diffs part of a previously failed Slice 3 attempt: no
- New Slice 3 edits: exactly the six allowlisted source seams above

Current source hashes:

| File | SHA-256 |
|---|---|
| `decisionWorkspaceReadModel.ts` | `8cec7608805161695fd4a2f3ee0113ffe75df980811d19753e9f23373dac8d00` |
| `DecisionWorkspaceReadContext.tsx` | `6d1e838b1e775dc45c0efc2b93f11f2d64eef070814e90d5ea5b2a82d29c385d` |
| `gmailDecisionWorkspaceReadAdapter.ts` | `e572367e95f6630b86f3fff20ba3c049c2fd3ffcfdd67a485c1ad62b76ee4d95` |
| `operations/review/page.tsx` | `350c5da0d5f4b8599a1fbfbd1c025b7149a1b29effd1ea81dcf44e24adfe0583` |
| `GmailCleanupComponents.tsx` | `d2a4099a166550001493e9c54123c024a528a071dea45b42dcf335e2df373765` |
| `workspace-decision-read-model-fixtures.mjs` | `ae123d445db5bd6e0895fd204dde6781f75f39ff38e2a525ae5fa28466805c44` |

Rollback remains source-only and seam-specific: reverse only Slice 3 edits against the verified snapshot. Do not restore whole files from Git or alter provider/data/database/artifact/index/publication state.

## Targeted verification and correction loop

The first TypeScript run found three bounded compatibility defects: Gmail failure reasons can be nullable, generic request phases were wider than the accepted Gmail union, and the existing distribution cache-key helper requires a non-null version. Root Cause Execution Translation: preserve the exact provider nullability and phase vocabulary at the generic compatibility boundary, and normalize only the cache-key input to the existing `default` value. Those seams were corrected and re-verified.

During browser proof, an initial `127.0.0.1` visit did not receive the saved `localhost` authentication cookie. That pre-settle capture was rejected as evidence. The exact accepted `http://localhost:3000` origin then authenticated and passed. A later route-2 automation wait assumed the wrong pagination phrase, and an evidence-row click correctly opened the Decision Mode overlay before a second underlying click could occur. These were verifier-tool assumptions, not product failures; focused probes supplied new signal without repeating the completed matrix.

Final static verification:

- TypeScript `--noEmit`: `PASS`
- Targeted ESLint on all six files: `PASS` with zero errors; `14` inherited hook warnings remain in the accepted large review page
- `git diff --check`: `PASS`
- Exact six-file backup allowlist comparison: `PASS`
- Direct banned Gmail Item Overview read-helper calls in the shared review page: `0`
- New page-load model calls: `0`
- New request definitions, pollers, caches, or providers: `0`
- Direct Gmail destination action definitions: preserved exactly once; never invoked during verification

Regression fixtures passed:

- generic Decision Workspace contract
- presentation metadata and safe fallback
- Decision Workspace read model and Item Overview validator
- generic and Gmail review-unit contracts
- generic and Gmail window-projection contracts
- Gmail cleanup-group assignment
- Gmail Pressure Trend
- Gmail optional-evidence detail
- Gmail mailbox-index continuity

The generated-chrome fixture passed eight domains: Gmail, customer service, real estate, crypto/investments, multi-source paid media, bookkeeping, tax, and multi-role purchasing/shipping. It proved different approved Item Overview titles from the same semantic slot, four-source paid-media identity, three-role/three-source purchasing-shipping identity, compatible metric units, evidence/provenance requirements, deterministic pagination/order, fail-closed corruptions, zero render-time model calls, and zero new request definitions.

## Full post-settle browser proof

Runtime target: `http://localhost:3000`

Authentication: reused the established local Playwright state bound to `localhost`; secret values were not copied into this packet.

Ready-state satisfied: `YES`

Ready-state signals used:

- exact requested route and agent identity;
- expected Sender Overview heading or accepted editorial redirect destination;
- populated sender rows for active review units;
- settled hero, workflow, distribution, and analysis surfaces;
- no loading state, workspace error, distribution error, or runtime overlay.

Settle strategy: wait for the exact route/destination, populated rows and decisive headings, absence of loaders/errors, then hold for an additional `1.8s` before final capture. Evidence preview waited until `Loading full message preview` disappeared.

Artifacts captured post-settle: `YES`

Primary evidence directory:

`output/playwright/ace-048-phase3-slice3/`

Decisive artifacts:

- `final-route-1-offer-campaign.png`
- `final-route-2-promotional-cycle.png`
- `final-route-3-editorial-baseline-redirect.png`
- `offer-campaign-all-indexed.png`
- `offer-campaign-1y.png`
- `offer-campaign-1m-before.png`
- `offer-campaign-1m-after.png`
- `offer-campaign-1w.png`
- `offer-campaign-1d.png`
- `offer-campaign-custom-open.png`
- `offer-campaign-custom-applied.png`
- `promotional-cycle-time-context.png`
- `promotional-cycle-distribution-return.png`
- `promotional-cycle-page-2.png`
- `promotional-cycle-evidence-expanded.png`
- `promotional-cycle-full-message-preview-settled.png`
- `promotional-cycle-returned-overview.png`
- `browser-console.log`
- `request-summary.sanitized.json`

Private local trace support:

- `.playwright-cli/traces/trace-1788225350171.trace`
- `.playwright-cli/traces/trace-1788225350171.network`

The raw authenticated trace can contain cookies and supporting evidence, so it is private local verification support and is not a publication artifact. The sanitized summary omits headers, cookies, query strings, and bodies.

### State Transition Matrix

| Mode / Path | Baseline visible state before action | Operator action performed | Settled visible state after action | Downstream gate/status/result after action | Remaining blocker | Separate from tested control? | Verdict |
|---|---|---|---|---|---|---|---|
| Offer campaign cold load / `1M` | Authenticated exact route opened | Load locked URL | `108` senders, `1` managed, `107` remaining, `1,030` messages, `12` rows, page `1/9` | Sender Distribution and workflow settle without errors | None | NA | PASS |
| Offer campaign / All indexed | `1M` ready | Select `All indexed` | `267` senders, `2` managed, `265` remaining, `39,867` messages, `12` rows, page `1/23` | Workflow, rows, distribution, and Decision Mode handoff share the full unit | None | NA | PASS |
| Offer campaign / `1Y` | All indexed ready | Select `1Y` | `175` senders, `12` rows, page `1/15`; yearly URL identity preserved | No loader, workspace error, distribution error, or overlay | None | NA | PASS |
| Offer campaign / restore `1M` | `1Y` ready | Select `1M` | `108` senders, `12` rows, page `1/9`; same values as cold load | Restored linked-surface truth matches the baseline | None | NA | PASS |
| Offer campaign / `1W` | `1M` ready | Select `1W` | `84` senders, `12` rows, page `1/7` | Daily Time Context and workflow remain populated | None | NA | PASS |
| Offer campaign / `1D` | `1W` ready | Select `1D` | `2` senders and `2` visible rows; all matches on one page | Hourly window settles without error | None | NA | PASS |
| Offer campaign / Custom | `1D` ready | Open Custom, enter `2026-08-20` through `2026-08-31`, apply | `100` senders, `12` rows, page `1/9`; Custom URL bounds preserved | Daily window settles without error | None | NA | PASS |
| Promotional cycle cold load / `1M` | Authenticated exact composite route opened | Load locked URL | `43` senders, `0` managed, `43` remaining, `132` messages, `12` rows, page `1/4` | Workflow and distribution are ready | None | NA | PASS |
| Analysis Rail / Time Context | Promotional cycle ready on Sender Distribution | Select `Time Context` | Time Context tab selected; activity bars and workflow-window explanation visible | No workflow/count collapse or loading fallback | None | NA | PASS |
| Analysis Rail / Sender Distribution return | Time Context ready | Select `Sender Distribution` | Sender Distribution selected with ranked contributors and same `43`-sender workflow | Shared window and rows remain unchanged | None | NA | PASS |
| Promotional cycle pagination | Page `1/4` ready | Select `Next`, then return with `Previous` | Page `2/4` rendered; return restored page `1/4` | Ordered review-unit rows remain populated | None | NA | PASS |
| Decision Mode inspect / evidence | Promotional cycle page `1/4` ready | Open first sender row | In-place Decision Mode shows sender `1/43`, semantic context, `23` grouped messages, `25` unread/indexed, and two evidence items | Provider action controls visible but not selected | None | NA | PASS |
| Full message preview | Decision Mode evidence ready | Open first full message preview | Sender, subject, date, snippet, and full message content visible after settle | Read-only evidence path succeeds; no mutation | None | NA | PASS |
| Decision Mode close/return | Settled preview and Decision Mode open | Close preview, then close Decision Mode | Exact promotional-cycle overview route restored with `12` rows | Subset and `1M` window identity preserved | None | NA | PASS |
| Editorial compatibility path | Locked editorial URL requested | Cold-load exact accepted URL | Preserved Phase 2 baseline redirect to Review Groups; `Choose a bounded sender group to review next.` visible | No overlay, error, or broken destination | None | NA | PASS |

## Request, lifecycle, and browser integrity

- Request families observed: existing Gmail management summary, mailbox index, inbox-analysis reads, and contextual agent playground only.
- Sanitized final trace: `GET /api/runtime/gmail-memory 200` x1, `GET /api/integrations/gmail/mailbox-index 200` x1, `POST /api/integrations/gmail/inbox-analysis 200` x2, `POST /api/agents/playground 200` x2, and one navigation-aborted playground request.
- The aborted playground request occurred during deliberate route replacement, produced no console error, and did not interfere with either accepted settled page.
- Provider mutations: `0`
- New request families: `0`
- Polling added: `0`
- `409` guard churn: `0`
- Browser console inspected: `YES`
- Console errors: `0`
- Duplicate-key warnings: `0`
- Runtime overlay present: `NO`
- Runtime errors found: `NONE`
- Final rendered UI truth inspected directly: `YES`; no clipped decisive surface, broken chart, empty accepted workflow, stale contradiction, or visible regression was found.

## Verification tooling disclosure

The required Playwright skill loaded successfully. Browser tool used: Playwright CLI wrapper. Wrapper attempted: `YES`. Fallback used: `NO`. The initial non-admissible `127.0.0.1` capture lacked the `localhost`-bound auth cookie; the accepted origin supplied the new signal and authenticated normally. Later selector/wait friction was classified as verifier-tool instability and resolved with focused probes rather than broad reruns.

## Verifier decision

`ACCEPT`

Verification Confidence: `HIGH`

Missing Proof Type: `none`

The six-file Slice 3 candidate satisfies the target-locked PM Brief and may proceed to Human Review. This verifier decision is not Human acceptance and does not authorize a later Phase 3 slice, Phase 4, commit, push, deployment, provider mutation, or publication.

## Human Review decision

Status: `ACCEPTED / CLOSED`

Oliver returned `accept` on 2026-09-01 after reviewing the page and reporting no visible regression. Phase 3 Slice 3 is Human-accepted and closed.

Suggested operator check:

1. Open the Offer campaign `1M` route and confirm the familiar Gmail Sender Overview still looks right.
2. Switch among All indexed, `1Y`, `1M`, `1W`, `1D`, and Custom and confirm the page remains coherent.
3. Open one sender in Decision Mode, inspect evidence, and close back to Sender Overview without choosing a provider action.
4. Oliver returned `ACCEPT`.

Recovery Contract: `CHANGELOG.md` -> `September 1, 2026 — ACE-048 Framework-First Decision Workspace Phase 3 Slice 3 Accepted`.

Human-acceptance milestone backup: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - ACE-048 framework-first Decision Workspace Phase 3 Slice 3 Human acceptance)`; `1,574` files, exact linked-worktree source, detached HEAD `8f8e4d670cabdd21459c0b4b8e502d16e272afc0`, `51` changed paths at backup time, normal project-scoped seven-day pruning, and all `23` `KEEP` archives preserved.

Checkpoint Status: `none`

- Material implementation, verifier proof, Human acceptance, Recovery Contract, milestone backup, and closeout are propagated.
- No later slice, commit, push, deployment, provider mutation, or publication is authorized.
