# ACE-048 Framework-First Decision Workspace Phase 3 Slice 4 — Verifier Review Packet

Date: 2026-09-02
Status: `HUMAN-ACCEPTED / CLOSED`
Governing event: `ACE-048`
Execution mode: `transitional_self_verification`
Problem class: `runtime data-facade boundary with provider-action and lifecycle preservation`
Verifier decision: `ACCEPT`
Verification confidence: `HIGH`
Result classification: `Accepted Fix Proven — Human accepted`

## Executive summary

### What changed

Decision Mode and Decision Management now obtain the existing managed decision-state summary through the shared Decision Workspace adapter instead of importing the Gmail management-summary helper directly in each page.

### What the operator gets

The Gmail screens still look and behave the same: the same counts, filters, sender rows, Decision Mode evidence, provider controls, and close/return behavior. Behind those stable screens, future workflows can describe their own managed subjects, states, sources, roles, capabilities, evidence, and provenance through the same validated framework boundary.

### Why it matters

This closes the final proven Phase 3 shared-read leak without pretending Gmail actions are generic. Provider execution remains explicit and separately governed for Phase 4.

## Authorized scope and outcome

The implementation stayed within the exact six-file source allowlist:

1. `web/src/lib/runtime/decisionWorkspaceReadModel.ts`
2. `web/src/components/runtime/DecisionWorkspaceReadContext.tsx`
3. `web/src/lib/integrations/gmail/gmailDecisionWorkspaceReadAdapter.ts`
4. `web/src/app/agents/[id]/operations/review/page.tsx`
5. `web/src/app/agents/[id]/operations/management/page.tsx`
6. `web/scripts/workspace-decision-read-model-fixtures.mjs`

The framework now validates a portable managed decision-state read model covering subject/workflow/state identity, adapter-owned labels, activity/evidence, capability and execution provenance, source identity, and agent-role identity. Invalid or incomplete provider projections fail closed.

The selected adapter exposes one managed summary read service. The Gmail adapter alone calls the accepted `fetchGmailDecisionManagementSummary` helper and projects the portable model plus the existing Gmail compatibility payload. Both pages consume the selected service. Their reducers, actions, rendering, request cancellation, provider controls, and reload behavior remain unchanged.

No route, provider operation, provider data, database, artifact, index, publication, request family, cache owner, polling behavior, lifecycle transition, commit, push, or deployment was changed. Push, restore, reopen, and destination decisions were not invoked.

## Preservation and rollback evidence

Pre-implementation backup: `VERIFIED`

`/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - Pre ACE-048 framework-first Decision Workspace Phase 3 Slice 4 managed decision-)`

- Files: `1,579`
- Git identity: detached `8f8e4d670cabdd21459c0b4b8e502d16e272afc0`
- Changed paths at backup time: `53`
- Retention: normal project-scoped seven-day pruning
- `KEEP` preservation: all `23` archives preserved
- Pre-existing diff status: present and preserved
- Existing diffs part of a previously failed Slice 4 attempt: no
- New Slice 4 source edits: exactly the six allowlisted seams above
- Backup-to-current source comparison: no seventh source file differs

Pre-discovery hashes were reattested before editing and matched the PM Brief exactly. Current source hashes are:

| File | SHA-256 |
|---|---|
| `decisionWorkspaceReadModel.ts` | `8adfddab14b6c88ffaa6b0dead0b24fee621acef178331539ac5efc5af941069` |
| `DecisionWorkspaceReadContext.tsx` | `7b1a2cf01fea98ef5dba88d2813a0419698cf12e2886c434645978a9b53e982e` |
| `gmailDecisionWorkspaceReadAdapter.ts` | `eaff2fee06df012ad3edbc41c3f2b0ab9ac8a7596756fdaf6e345e089a56a294` |
| `operations/review/page.tsx` | `aaa0df573ca60fe60d7c9acfa888d66a6131ae20e0b6a935fa1feb4d157cabf2` |
| `operations/management/page.tsx` | `fdeb2468773e6c48da1ffb2afd561efb949881d6572dd870e0f715b39481e6e9` |
| `workspace-decision-read-model-fixtures.mjs` | `bda62f5378ed044eb4ca10b9c7926bec24db267ba35255618cac7ff5b2a69255` |

Rollback remains source-only and seam-specific against the verified snapshot. Do not restore whole shared files from Git or alter provider/data/database/artifact/index/publication state.

## Load and lifecycle declaration

- Heavy endpoint affected: none; the existing management-summary GET remains the only managed-summary read.
- Existing summary request family: `GET /api/runtime/gmail-memory?...view=decision_management`.
- Cache: existing `15s` TTL and per-key single-flight ownership preserved in the Gmail helper.
- Polling: none before, none added, and zero settled polling observed.
- Expected settled summary load: one GET on cold load; cache reuse within TTL; a later read may refresh only when a consumer explicitly requests it after expiry.
- Provider writes: existing action families preserved, never invoked.
- Build-pending continuity, build completion, Smart Sync handoff, and stale-build reclaim: unaffected.

## Implementation and verification loop

Implementation created the portable model, context service, Gmail projection, two page consumers, and eight-domain fixtures. Targeted fixtures, TypeScript, lint, and diff checks passed without an implementation defect requiring source correction.

Two verifier-tool issues were diagnosed without changing product source:

1. A combined readiness predicate timed out after summary cards appeared but before sender-row controls settled. Root-cause translation: separate summary readiness from row/control readiness and use bounded waits for each signal.
2. A later optional production-server repeat failed during the authenticated mailbox-index preflight because the existing Supabase connection returned `ECONNRESET` and then a connection timeout/HTTP `500`. Root-cause translation: sanitize the preflight failure and stop after one bounded retry. This repeat never reached the accepted UI and is non-admissible as product evidence. It does not replace or contradict the earlier complete exact-origin post-settle run.

Final code and fixture verification:

- `npm run test:workspace-decision-read-model`: `PASS`
- `npm run test:workspace-decision-contract`: `PASS`
- `npm run test:workspace-decision-presentation`: `PASS`
- `npm run test:workspace-review-unit-contract`: `PASS`
- `npm run test:review-unit-window-projection-contract`: `PASS`
- `npm run test:gmail-review-unit-window-projection-contract`: `PASS`
- `npm run test:gmail-optional-evidence-detail-contract`: `PASS`
- TypeScript `--noEmit`: `PASS`
- Targeted ESLint: `PASS`, zero errors; `14` inherited warnings remain in the accepted large review page
- `git diff --check`: `PASS`
- Default Turbopack production build: `PASS`, including TypeScript, page-data generation, and all `63` pages
- Exact six-file backup comparison: `PASS`

The generated-chrome fixture passed Gmail, customer service, real estate, crypto/investments, multi-source paid media, bookkeeping, tax, and multi-role purchasing/shipping. It proves domain-owned state labels, multiple source/role identities, capability/execution provenance, deterministic projection, fail-closed corruption handling, zero page-load model calls, zero new request definitions, and preserved provider-action seams.

## Full post-settle browser proof

Runtime target: `http://localhost:3000`

Exact routes:

- `http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/management`
- `http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions&subset_source=review_unit&subset_value=family%3Aoffer_campaign&sender_overview_window=last_month`
- `http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions&subset_source=review_unit&subset_value=review-unit%3Asemantic_parent_subscription_senders_family_marketing_promotional%3Asubtype-marketing_promotional_remainder%3Apattern-promotional_cycle&sender_overview_window=last_month`

Authentication: reused private local Playwright state bound to `localhost`; no credential or cookie is published in this packet.

Ready-state satisfied: `YES`

Ready-state signals used:

- exact route and agent identity;
- decisive summary cards populated;
- sender rows and pagination settled;
- no loading placeholders;
- Decision Mode overlay and evidence settled when opened.

Settle strategy: DOM-visible signals plus bounded waits; final artifacts were captured only after the route-specific ready state.

Artifacts captured post-settle: `YES`

Local review-evidence directory: `output/playwright/ace-048-phase3-slice4/` (the published request log is sanitized; authenticated screenshots remain local review evidence)

- `management-cold-load-authenticated.png`
- `management-filter-archive.png`
- `management-filter-custom-rule.png`
- `management-filter-quarantine.png`
- `management-filter-keep.png`
- `management-filter-all.png`
- `review-offer-campaign-settled.png`
- `review-offer-campaign-decision-open.png`
- `review-offer-campaign-decision-closed.png`
- `review-promotional-cycle-settled.png`
- `review-promotional-cycle-decision-open.png`
- `review-promotional-cycle-decision-closed.png`
- `management-expiry-idle-hold.png`
- `verified-state.json`
- `sanitized-request-trace.json`
- `state-transition-matrix.json`

Private local support only:

- `.playwright-cli/ace048-slice4-auth.local.json`
- `.playwright-cli/traces/ace048-phase3-slice4-authenticated.zip`
- `.playwright-cli/ace048-slice4-management-preauth-diagnostic.png`

The raw authenticated trace and auth state may contain cookies or evidence, so they remain private/local. Only the sanitized evidence above is suitable for review.

Accepted visible truth:

- Management: `17` managed, `3` archive ready, `2` Custom Rules, `10` quarantined, `0` archive applied, `2` Keep protected.
- Offer campaign `1M`: `108` senders, `1` managed, `107` remaining, `1,030` supporting messages, page `1/9`.
- Composite promotional-cycle `1M`: `43` senders, `0` managed, `43` remaining, `132` supporting messages, page `1/4`.
- Decision Mode opened and closed on both review routes; evidence settled and no destination was selected.
- Management-to-Review cache transition added zero summary GETs.
- A `16s` idle hold after TTL expiry added zero automatic summary GETs.
- Provider writes: `0`.
- Console errors: `0`; page errors: `0`; duplicate-key warnings: `0`; runtime overlay: absent.

Sanitized accepted-flow requests:

- management-summary GET: `3` x `200`
- mailbox-index GET: `2` x `200`
- inbox-analysis POST: `6` x `200`
- contextual agent playground POST: `2` x `200`
- new request families: `0`
- provider-action requests: `0`
- `409` guard churn: `0`

### State Transition Matrix

| Mode / Path | Baseline visible state before action | Operator action performed | Settled visible state after action | Downstream gate/status/result after action | Remaining blocker | Separate from tested control? | Verdict |
|---|---|---|---|---|---|---|---|
| Management cold load | Fresh authenticated context | Open exact Management route | `17 / 3 / 2 / 10 / 0 / 2` summary | Management ready; provider controls visible | None | NA | PASS |
| Management / Archive | All active work | Click Archive | `ARCHIVE` route filter | Totals remain `17` | None | NA | PASS |
| Management / Custom Rules | Archive | Click Custom Rules | `CUSTOM_RULE` route filter | Totals remain `17` | None | NA | PASS |
| Management / Quarantine | Custom Rules | Click Quarantine | `QUARANTINE` route filter | Totals remain `17` | None | NA | PASS |
| Management / Keep | Quarantine | Click Keep (quiet) | `KEEP` route filter | Totals remain `17` | None | NA | PASS |
| Management / All | Keep | Click All active work | `ALL` route filter | Totals remain `17` | None | NA | PASS |
| Cached cross-surface transition | Management ready with cached summary | Open exact offer-campaign Review route | `108 / 1 / 107 / 1,030`, page `1/9` | Zero added summary GETs | None | NA | PASS |
| Offer campaign Decision Mode open | Offer-campaign rows settled | Open first sender | Overlay and evidence visible | No destination selected | None | NA | PASS |
| Offer campaign Decision Mode close | Overlay visible | Click Close | Sender list restored | Canonical route retained | None | NA | PASS |
| Composite Review cold load | Exact composite route | Cold-open review unit | `43 / 0 / 43 / 132`, page `1/4` | Linked surfaces reconciled | None | NA | PASS |
| Composite Decision Mode open | Composite rows settled | Open first sender | Overlay and evidence visible | No destination selected | None | NA | PASS |
| Composite Decision Mode close | Overlay visible | Click Close | Composite list restored | Canonical route retained | None | NA | PASS |
| Management expiry idle hold | Management ready before expiry | Wait `16s` | Management remains settled | Zero automatic summary GETs | None | NA | PASS |
| Provider-action non-invocation | Push/restore/reopen controls present as applicable | Click no provider action | Controls remain untouched | Zero provider-write requests | None | NA | PASS |

## Verifier decision

`ACCEPT`

Verification Confidence: `HIGH`

Missing Proof Type: `none for the required exact-origin accepted surfaces`

The six-file Slice 4 candidate satisfies the target-locked PM Brief and may proceed to Human Review. The optional production-server repeat is separately blocked before UI evaluation by the existing external Supabase connection; it is not used as acceptance evidence and creates no product-failure finding.

This verifier decision is not Human acceptance and does not authorize Phase 4, commit, push, deployment, provider mutation, artifact/index/publication mutation, or any provider action.

## Delegated Playwright verification refresh — 2026-09-01

Oliver explicitly asked Codex to perform the simple visible check because he was away from his computer. The exact authenticated `localhost:3000` routes were re-exercised through the authoritative local Playwright skill.

Result: `PASS / HIGH`

- Decision Management settled to `17 / 3 / 2 / 10 / 0 / 2`; all five filters and provider controls were visible and untouched.
- Offer campaign settled to `108 / 1 / 107 / 1,030`, page `1 / 9`.
- The first sender opened in Decision Mode as sender `1 of 108`; evidence and the exact `Close` control were visible.
- Codex clicked only `Close`. The exact original review-unit/window route returned with the same `108 / 1 / 107 / 1,030` values.
- Provider actions, destination decisions, provider-write requests, `409` responses, runtime overlays, duplicate-key warnings, settled console errors, and settled console warnings were all zero.
- The initial Management load was pre-settle and non-admissible after an external Supabase timeout produced summary `500` and playground `404`. Mailbox index then succeeded, providing a new signal for one bounded reload. The reload and complete accepted flow settled successfully with `200` responses. No repeated retry occurred.

Supplemental local evidence directory: `output/playwright/ace-048-phase3-slice4-delegated-review/` (`created`; authoritative supplemental evidence for this delegated verification refresh, subordinate to this review packet)

- `01-management-post-settle.png`
- `02-review-post-settle.png`
- `03-decision-mode-open-post-settle.png`
- `04-review-return-post-settle.png`
- `verification-summary.json`
- `state-transition-matrix.json`

Ready-state satisfied: `YES`

Artifacts captured post-settle: `YES`

Browser console inspected: `YES`

Runtime overlay present: `NO`

Duplicate key warnings present: `NO`

Runtime errors found: `NONE after settle`

This delegated Playwright pass independently confirms the visible result but does not silently convert itself into Oliver's Human Review decision. The decision status below remains explicit.

## Human Review decision

Status: `ACCEPTED / CLOSED`

Oliver returned explicit `Accept` on 2026-09-02 after reviewing Codex's delegated Playwright `PASS / HIGH` report. This is the Human Review decision; it is not inferred from the earlier general approval that Oliver had clarified was not review.

Recovery Contract: `CHANGELOG.md` -> `September 2, 2026 — ACE-048 Framework-First Decision Workspace Phase 3 Slice 4 Accepted`.

Explicit Human-acceptance snapshot: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-02/ai-agent-platform-worktree-8642 (incremental 2 September 2026 - ACE-048 Phase 3 Slice 4 explicit Human Review acceptance after delegated Playwri)`; `2,163` files, detached HEAD `8f8e4d670cabdd21459c0b4b8e502d16e272afc0`, `54` changed paths at backup time, normal project-scoped seven-day pruning, and all `KEEP` archives preserved.

The earlier `2,116`-file snapshot with `Human acceptance` in its filename remains a valid post-verifier recovery point, but it is not the acceptance authority. The September 2 explicit-decision snapshot above is authoritative for this closeout.

Phase 3 is Human-accepted and closed across Slices 1-4. Phase 4 remains separately gated; no provider action, mutation, commit, push, or deployment is authorized.

Checkpoint Status: `none`
