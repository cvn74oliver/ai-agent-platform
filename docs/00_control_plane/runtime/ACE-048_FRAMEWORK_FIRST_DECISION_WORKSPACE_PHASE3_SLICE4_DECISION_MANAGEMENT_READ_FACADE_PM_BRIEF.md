# ACE-048 Framework-First Decision Workspace Phase 3 Slice 4 — Managed Decision State Read Facade PM Brief

Date: 2026-09-02
Status: `HUMAN-ACCEPTED / CLOSED`
Governing event: `ACE-048`
Feature domain: Decision Workspace generic runtime/data facade — managed decision-state read slice
Mode: bounded `EXECUTION MODE` after explicit authorization
Execution mode: `transitional_self_verification`
Reasoning level: `HIGH` — two accepted shared consumers with provider-write seams that must remain untouched
Problem class: `runtime data-facade boundary with provider-action preservation`
Target-lock status: `inferred_target_lock`
Execution readiness: `target-locked / implementation authorized`

## Executive summary

### What is changing

Decision Mode and Decision Management will read managed decision state through the selected Decision Workspace adapter instead of both shared pages calling the Gmail management-summary helper directly.

### What Oliver will get

The same visible Gmail decisions, counts, filters, execution states, provider controls, and close/return behavior, backed by a reusable read contract for cases, properties, positions, campaigns, transactions, tax issues, orders, and shipments.

### Why it matters

This closes the final proven Phase 3 read leak without pretending provider actions are generic. Gmail push, restore, reopen, and destination commits remain explicit provider operations for separately planned Phase 4 capability/action work.

## Discovery conclusion

The remaining surfaces do not require a broad Decision Mode rewrite.

- Decision Mode is embedded in `operations/review/page.tsx`, not a separate route.
- Its selected subject, ordered queue, workspace/window/distribution reads, evidence snippets, full preview, pagination, and close/return state already consume the Human-accepted Item Overview service or generic Operations evidence helpers.
- Its only residual direct shared read leak is `fetchGmailDecisionManagementSummary`, used to determine which subjects are already managed and to preserve queue/count truth.
- Its destination commit remains one explicit `POST /api/runtime/gmail-destinations` provider-write seam and belongs outside this slice.
- Decision Management directly calls the same Gmail management-summary helper for cold load and reload, while its two Gmail push/restore calls and one reopen-memory mutation remain explicit provider behavior.

The safe final Phase 3 target is therefore one shared **managed decision-state read service** consumed by both pages. Provider actions, action availability, execution mutation, retries, receipts, and lifecycle transitions remain unchanged and separately governed by Phase 4.

## Objective

Extend the accepted Decision Workspace read facade with a generic, validated managed decision-state model and selected-adapter read service; migrate only the two direct Gmail management-summary read calls; preserve every accepted Gmail route, visible value, cache, request, action, mutation, retry, execution, and return behavior.

## Scope

In scope:

- generic managed-subject, decision-state, destination/intent summary, execution-state observation, recent-decision activity, evidence/provenance, freshness, quality, workflow/source/role identity, and fail-closed validation contracts;
- a selected-adapter management read service over the existing Gmail summary helper;
- provider-projected compatibility values required to preserve the accepted Gmail UI and action handlers;
- conversion of the review page and management page from direct Gmail summary reads to `useDecisionWorkspaceRead().management`;
- extension of the existing eight-domain fixture with managed decision-state semantics, multi-source/multi-role identity, capability references, and fail-closed cases;
- exact authenticated post-settle before/after proof without invoking any provider action.

Out of scope:

- changing destination options, decision outcomes, action catalogs, approvals, reversibility, execution receipts, retries, provider verification, or lifecycle mutation;
- changing `POST /api/runtime/gmail-destinations`, `POST /api/runtime/gmail-memory`, their request bodies, server handlers, database reads/writes, or provider calls;
- changing the `15s` management-summary cache, single-flight behavior, cache key, localStorage behavior, or reload timing;
- moving Decision Mode route/window/queue/evidence/close-return lifecycle out of the review page;
- route/query renames or aliases, new endpoints, requests, polling, caches, providers, contexts, or runtime state;
- Workflow Studio, proprietary-brain UI, shared learning, marketplace behavior, multi-agent orchestration, or a real non-Gmail provider;
- commit, push, deployment, database, artifact, index, or publication mutation.

## Exact locked routes

Primary locked route:

- Route template: `/agents/[id]/operations/management`
- Locked route file: `web/src/app/agents/[id]/operations/management/page.tsx`
- Exact accepted Gmail path: `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/management`
- Compatibility query keys to preserve: `playground_session_id`, `analysis_scope`, and `bucket`.

Linked Decision Mode consumer:

- Route template: `/agents/[id]/operations/review`
- Locked route file: `web/src/app/agents/[id]/operations/review/page.tsx`
- Exact accepted simple path: `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions&subset_source=review_unit&subset_value=family%3Aoffer_campaign&sender_overview_window=last_month`
- Exact accepted composite path: `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions&subset_source=review_unit&subset_value=review-unit%3Asemantic_parent_subscription_senders_family_marketing_promotional%3Asubtype-marketing_promotional_remainder%3Apattern-promotional_cycle&sender_overview_window=last_month`

No path, query key, filter, link target, mode transition, action target, redirect, or return route may change.

## Locked source allowlist — exactly six files

1. `web/src/lib/runtime/decisionWorkspaceReadModel.ts` — add managed decision-state DTOs, service contract, provider-compatibility value, validation, and fail-closed finalization.
2. `web/src/components/runtime/DecisionWorkspaceReadContext.tsx` — expose the selected adapter's management read service through the existing provider; add no state, request, cache, timer, or provider.
3. `web/src/lib/integrations/gmail/gmailDecisionWorkspaceReadAdapter.ts` — wrap the existing `fetchGmailDecisionManagementSummary` helper and project Gmail compatibility values without changing request/cache behavior.
4. `web/src/app/agents/[id]/operations/review/page.tsx` — replace only the direct management-summary read with the selected adapter service; retain Item Overview lifecycle, managed queue/count logic, destination commit, evidence, and close/return behavior.
5. `web/src/app/agents/[id]/operations/management/page.tsx` — replace only the direct management-summary read with the selected adapter service; retain all Gmail presentation, filters, action handlers, reload points, and JSX behavior.
6. `web/scripts/workspace-decision-read-model-fixtures.mjs` — add eight-domain managed-state fixtures, fail-closed validation, and static guards for the read/provider-action boundary.

No new source file, component file, API route, server loader, or `package.json` change is required. If any source file outside this allowlist is required, stop and return to the Project Manager for explicit rescope.

## Exact current render/read/action path

```text
web/src/app/agents/[id]/operations/layout.tsx
  -> DecisionWorkspacePresentationProvider(gmail)
  -> OperationsWorkspaceShell
       -> OperationsRuntimeProvider
       -> DecisionWorkspaceReadProvider(adapterId=gmail)
            -> gmailDecisionWorkspaceReadAdapter

Decision Mode consumer
  -> web/src/app/agents/[id]/operations/review/page.tsx
       -> accepted itemOverview service for workspace/window/distribution/queue
       -> generic operationsWorkspace message snippets/full preview
       -> DIRECT fetchGmailDecisionManagementSummary (targeted read leak)
            -> 15-second client cache + single-flight
            -> GET /api/runtime/gmail-memory?view=decision_management
       -> POST /api/runtime/gmail-destinations destination commit (frozen provider write)
       -> exact in-place close/return state (frozen)

Decision Management consumer
  -> web/src/app/agents/[id]/operations/management/page.tsx
       -> DIRECT fetchGmailDecisionManagementSummary (targeted read leak)
            -> 15-second client cache + single-flight
            -> GET /api/runtime/gmail-memory?view=decision_management
                 -> loadGmailDecisionManagementSummary
                 -> bounded rag_documents profile read (limit 500)
                 -> bounded agent_events history read (limit 200)
       -> POST /api/runtime/gmail-destinations push_archive (frozen provider write)
       -> POST /api/runtime/gmail-destinations restore_archive (frozen provider write)
       -> POST /api/runtime/gmail-memory destination_state_clear through existing helper (frozen provider write)
```

## Framework / adapter / provider responsibility matrix

| Layer | Owns | Must not own |
|---|---|---|
| Framework read model | workflow/runtime/source/role identity; managed-subject identity; decision/intent state; generic execution lifecycle observation; activity/evidence references; counts/metrics; provenance; freshness; quality; validation and safe failure | Gmail destination names; Gmail endpoint/cache keys; provider mutation promises; provider receipt interpretation |
| Workflow/presentation adapter | approved visible domain nouns, state labels, explanations, grouping, and deterministic versioned copy | validation bypass; page-load model calls; silent cross-source state merging |
| Gmail read adapter | Gmail summary DTO compatibility; current helper call; Gmail destination/execution-state projection; current cache/single-flight result behavior | route/effect ownership; new cache/retry/poller; any provider mutation |
| Shared review page | managed subject index, queue/count exclusion, Decision Mode route/evidence/close-return lifecycle, existing destination commit handler | direct Gmail summary fetch; generic provider capability claims |
| Shared management page | route/filter state, read loading/error/ready state, accepted provider-specific management presentation and existing action handlers | direct Gmail summary fetch; new action policy; new provider lifecycle |
| Provider operational layer | destination commit, push, restore, reopen, approval/risk/reversibility rules, provider execution, verification, receipts, retry, rollback | framework identity/metric/provenance semantics; cross-provider promises |

## Generic managed decision-state contract

Extend the existing read-model envelope rather than creating a parallel framework.

Framework-owned structures must cover:

- `DecisionWorkspaceManagementReadModel`
  - schema/workspace/workflow/runtime/analysis identity;
  - subject/activity vocabulary, agent roles, and all contributing sources;
  - generated/observed timestamps, freshness, quality, and transformation provenance;
  - destination/decision-state summaries with stable IDs, subject counts, activity impact, last-change time, source IDs, and evidence references;
  - managed-subject profiles with stable subject ID, presentation ID, source/group/workflow identity, decision-state ID, reason, timestamps, history references, and generic execution observation;
  - recent decision/execution activity with immutable event identity and provenance;
  - optional recommendation status that cannot imply an executable provider action;
  - loading/error/unavailable state and validation.
- `DecisionWorkspaceManagedSubjectExecutionReadModel`
  - generic lifecycle status limited to observed read truth such as `not_applicable`, `pending`, `executed`, `failed`, `deferred`, or `reverted`;
  - provider/source identity, observed timestamp, warning, impact metric, and receipt/evidence references when available;
  - no mutation method or automatic retry.
- `DecisionWorkspaceManagementReadService`
  - one bounded summary read by agent/workspace identity;
  - provider-projected compatibility value for accepted transitional UI/action seams;
  - optional adapter projection into the portable model;
  - no route, state, cache, timer, poller, retry, action, approval, execution, or provider mutation ownership.

Transitional provider-projected compatibility values may preserve the accepted Gmail field shape while the generic model owns portable meaning. They must remain explicitly typed as compatibility values rather than framework semantic definitions.

## Validation and fail-closed behavior

Reject or fail closed on:

- missing/duplicate workflow, runtime, subject, state, event, source, role, capability, metric, evidence, or provenance identity;
- a managed subject whose state/history/event references a missing subject, source, workflow, or decision-state definition;
- negative/non-finite subject or activity counts, contradictory destination totals, duplicate managed subjects, invalid timestamps, or lifecycle order contradictions;
- provider execution claims without source identity and evidence/receipt reference when the provider reports execution as verified;
- an action/capability reference that is not declared by the contributing source;
- incompatible multi-source metrics or silent merging of unlike provider states;
- missing freshness, quality, workflow version, or validation state.

Invalid models must expose no actionable managed subjects. The provider-specific action controls must not render from an invalid generic model unless the accepted Gmail compatibility payload has separately passed the existing provider boundary; no generic fallback may invent an executable action.

## Required replacement logic

1. Add the portable managed decision-state model, compatibility value, service contract, validators, and fail-closed finalizer to `decisionWorkspaceReadModel.ts`; reuse accepted identity, metric, provenance, freshness, quality, role, and source types.
2. Add `management` to the existing `DecisionWorkspaceReadAdapter` and `DecisionWorkspaceReadContext`; do not add another provider/context or any hook-owned request state.
3. In the Gmail adapter, wrap `fetchGmailDecisionManagementSummary` exactly. Do not alter its cache key, `15s` TTL, in-memory/localStorage behavior, single-flight map, GET URL/query, response acceptance, or error translation.
4. In the review page, replace only the direct helper call with `useDecisionWorkspaceRead().management`. Keep the managed-state reduction, queue ordering, counts, state/effect cancellation, one destination-commit POST, next-subject behavior, and close/return logic unchanged.
5. In the management page, replace only the direct helper call with the selected management service. Keep state transitions, filter routes, profile decoration/sorting, two destination POST handlers, reopen helper, reload call sites, visible Gmail copy, buttons, and action availability unchanged.
6. Extend the eight-domain fixture and static guards. Both shared pages must contain zero direct `fetchGmailDecisionManagementSummary` references after migration, while the Gmail adapter must remain the sole selected-adapter caller.
7. Preserve exactly one review-page Gmail destination POST, exactly two management-page Gmail destination POSTs, exactly one management reopen-memory helper, zero new request definitions, and zero new pollers/model calls.

## Cross-domain acceptance fixture

| Domain | Managed subjects | Decision/intent examples | Provider operations that remain adapter-specific | Required identity proof |
|---|---|---|---|---|
| Gmail | senders | Keep, Archive, Custom Rule, Quarantine | archive push/restore and Gmail verification | Gmail source, mailbox role, destination/execution provenance |
| Customer service | cases | resolve, escalate, defer, reopen | ticket close/reopen/refund/escalation | support/chat/email sources and service role |
| Real estate | properties | shortlist, reject, hold, investigate | submit/withdraw offer, broker workflow | property/market sources and portfolio role |
| Crypto/investments | positions/assets | watch, hold, reduce, exit | exchange order/cancel and custody receipt | market plus exchange/custody sources |
| Paid media | campaigns/ad sets | keep, pause, scale, reduce | Facebook/Google/TikTok/email provider controls | four source identities with capability separation |
| Bookkeeping | transactions/accounts | accept, categorize, reconcile, flag | ledger post/reverse/match | ledger/document provenance and bookkeeper role |
| Tax | filings/issues/records | accept, investigate, escalate, defer | filing submission/amendment/payment | tax source, reviewer role, rule/evidence identity |
| Purchasing/shipping | orders/shipments | approve purchase, hold, fulfill, investigate | commerce purchase, spreadsheet update, carrier dispatch | three sources and purchasing/records/shipping roles |

Also prove:

- different adapters can use distinct approved state labels over the same generic managed-state semantics;
- multiple sources preserve distinct capability and execution provenance;
- multiple agent roles preserve role identity across decision, records, and fulfillment stages;
- incompatible states/metrics fail closed rather than being combined;
- verified provider execution requires source/evidence identity;
- missing/unsafe metadata cannot leak Gmail labels into non-Gmail fixtures;
- model rendering and validation make zero model calls and define zero new requests.

## Proprietary-brain constraint

Decision history, corrections, execution outcomes, and future recommendation feedback may inform the tenant-owned proprietary brain only through versioned, inspectable, human-governed, provenance-backed, evaluated, tenant-scoped, and reversible records. This slice does not implement training, self-modification, shared learning, or cross-tenant transfer.

## Runtime load declaration

- Problem class: read facade over an accepted management summary and provider-action lifecycle.
- Existing read family: `GET /api/runtime/gmail-memory?agent_id=<id>&view=decision_management`.
- Client cache: existing key `decision_management::<agentId>`, `15s` TTL, in-memory plus localStorage, single-flight per key.
- Server read bounds: maximum `500` destination-profile documents plus `200` recent destination events per summary request.
- Existing provider writes: one review-page destination commit; management push archive, restore archive, and reopen state-clear. All are frozen and excluded.
- Polling: none. The pages read on initial agent identity and after existing explicit management actions only.
- Expected steady state: at most one uncached management-summary GET per agent/cache window; cached cross-surface reuse adds zero GETs; no automatic request after cache expiry without a new existing trigger.
- Lifecycle edges intentionally affected: none. Decision commit, managed queue exclusion, management reload, provider push/restore/reopen, execution verification, and Decision Mode close/return must remain unchanged.
- Build-pending continuity, Smart Sync/artifact handoff, index freshness, and stale-build reclaim: not changed.

Any new request family, extra GET, repeated summary poll, cache invalidation policy, action retry, mutation, overlapping owner, or guard churn is a failure and requires PM rescope.

## Frozen Gmail behavior

Preserve exactly:

- Management cold-load truth: `17` managed, `3` archive ready, `2` Custom Rules, `10` quarantined, `0` archive applied, and `2` Keep;
- all Management filters, section ordering, badges, state explanations, profile rows, message-impact counts, and explicit Gmail action copy;
- `Push to Gmail`, restore, and reopen availability plus their exact request bodies, result handling, reload call sites, and error/success states;
- Offer campaign `1M`: `108` senders, `1` managed, `107` remaining, `1,030` messages, `12` rows, page `1/9`;
- Offer campaign All indexed: `267` senders, `2` managed, `265` remaining, `39,867` messages, `12` rows, page `1/23`;
- promotional-cycle `1M`: `43` senders, `0` managed, `43` remaining, `132` messages, `12` rows, page `1/4`;
- Decision Mode queue/position, evidence, full preview, destination options, one destination-commit provider action, next-subject behavior, and exact close/return state;
- existing management-summary cache/single-flight semantics and zero settled polling;
- stable routes/query identities and explicit provider controls;
- all Phase 1, Phase 2, and Phase 3 Slices 1-3 Recovery Contracts.

## Five implementation slices

1. **Contract** — add generic managed decision-state DTO/service/validation and provider-compatibility type.
2. **Adapter** — wrap the current Gmail management-summary read with no request/cache/result change.
3. **Provider seam** — expose `management` through the existing read context with no lifecycle.
4. **Consumers** — replace only the two direct summary calls; preserve all action and route behavior.
5. **Fixtures and verification** — extend eight-domain/static proof, run regressions, and capture exact post-settle Management/Decision Mode evidence.

Each slice requires targeted verification before the next. Any non-trivial failure must follow diagnosis -> root-cause execution translation -> bounded correction -> re-verification.

## Static and regression verification

Required:

- `npm run test:workspace-decision-read-model`;
- `npm run test:workspace-decision-presentation`;
- existing Phase 1 Decision Workspace contract fixtures;
- existing Gmail review-unit, cleanup-assignment, window-projection, Pressure Trend, optional-evidence, mailbox-continuity, and management/destination regressions applicable to these routes;
- targeted TypeScript/Next source validation;
- targeted ESLint on the exact six-file allowlist;
- `git diff --check`, source hashes, scoped diff, and exact allowlist comparison against the pre-implementation backup;
- source guards proving the two pages no longer import/call `fetchGmailDecisionManagementSummary`, the Gmail adapter is the sole selected-adapter caller, and the service/context define no request;
- source guards proving the existing one review destination POST, two management destination POSTs, and one management reopen-memory helper remain exactly present with no new action path;
- zero page-load model calls, zero new request definitions, zero pollers, zero cache owners, and zero route/provider files changed.

## Full post-settle Playwright proof

Use the accepted `http://localhost:3000` origin, saved authentication or the approved bootstrap flow, and exact route identities above. Define ready state before verdict: exact route, decisive heading/cards/rows or Decision Mode subject visible, loaders/errors absent, and final state held after settle.

Required before/after surfaces:

1. Management cold load with the accepted six headline counts.
2. Management `ALL -> ARCHIVE -> CUSTOM_RULE -> QUARANTINE -> KEEP -> ALL` filter loop using route-backed controls only.
3. Offer campaign `1M` cold load, managed/remaining/count/rows parity, Decision Mode open, evidence, and exact Close return.
4. Offer campaign All indexed managed/remaining parity.
5. Promotional-cycle `1M` cold load and Decision Mode open/Close return.
6. Cross-route cache proof within the existing `15s` window and a post-expiry idle hold proving there is no automatic poll.
7. Provider controls visibly present, with zero clicks on push, restore, reopen, or destination decisions during verifier automation.

Every final artifact must be post-settle and include screenshot, DOM/state capture, aligned request trace, console/page-error state, route/href, and before/after comparison. Pre-settle evidence is diagnostic only.

Request acceptance:

- existing request families only;
- no more than one uncached management-summary GET per agent/cache window;
- cached cross-surface return may issue zero summary GETs;
- zero `POST /api/runtime/gmail-destinations` and zero `POST /api/runtime/gmail-memory` during the non-mutating verifier flow;
- zero polling after settle/cache expiry, failed requests, `409` churn, model calls, console warnings/errors, page errors, or runtime overlays.

## State Transition Matrix

Required columns:

| Mode / Path | Baseline visible state before action | Operator action | Settled visible state after action | Downstream gate/status/result | Remaining blocker | Separate blocker? | Verdict |
|---|---|---|---|---|---|---|---|

Use separate rows for Management cold load, each filter transition, cached cross-surface transition, expiry idle hold, both accepted review paths, each Decision Mode open/Close transition, and provider-action non-invocation. A single aggregate row is invalid.

## Exploratory discovery

After targeted re-verification, ask: `What else breaks under realistic user behavior?`

Bounded probes:

- rapid but realistic Management filter changes followed by settle;
- direct Management reload versus cached cross-surface navigation;
- Decision Mode enter/Close after a narrowed window and after cached managed-state reuse;
- empty management summary, missing profile identity, duplicate profiles, stale cache, and summary failure;
- multi-source capability mismatch, multi-role history, invalid execution provenance, and unsafe/missing labels in fixtures.

Stop after bounded probing produces no new finding. Do not click provider actions, mutate decisions, or explore unrelated routes.

## Verifier acceptance gate

Before Human Review, produce a pre-closeout packet containing:

- exact files changed, hashes, scoped diffs, and allowlist proof;
- exact routes/surfaces affected;
- static, fixture, TypeScript, lint, regression, and diff results;
- post-settle screenshots, DOM/state, request traces, console/page errors, cache/load proof, and complete State Transition Matrix;
- explicit provider-write count of zero during verification and source proof that existing action seams are unchanged;
- ready-state report and `Verification Confidence: HIGH` for decisive visible truth;
- a 3-6 step operator checklist limited to residual Human Review.

Verifier decision must be `ACCEPT`, `REJECT`, or `BLOCKED`. Do not present implementation as complete before verifier acceptance and Oliver's separate Human Review decision.

## Dirty-state and rollback boundary

All six files contain inherited accepted dirty state.

Pre-discovery source hashes:

- `decisionWorkspaceReadModel.ts` — `8cec7608805161695fd4a2f3ee0113ffe75df980811d19753e9f23373dac8d00`
- `DecisionWorkspaceReadContext.tsx` — `6d1e838b1e775dc45c0efc2b93f11f2d64eef070814e90d5ea5b2a82d29c385d`
- `gmailDecisionWorkspaceReadAdapter.ts` — `e572367e95f6630b86f3fff20ba3c049c2fd3ffcfdd67a485c1ad62b76ee4d95`
- `operations/review/page.tsx` — `350c5da0d5f4b8599a1fbfbd1c025b7149a1b29effd1ea81dcf44e24adfe0583`
- `operations/management/page.tsx` — `3d5c84e68657d6c613d4c7989d14a21eebdcf61607868a62f1e0e26717f58d98`
- `workspace-decision-read-model-fixtures.mjs` — `ae123d445db5bd6e0895fd204dde6781f75f39ff38e2a525ae5fa28466805c44`

Before implementation:

- reattest all six hashes and exact dirty-state status;
- create and verify the governed pre-implementation incremental backup with normal project-scoped seven-day pruning and all `KEEP` archives preserved;
- distinguish inherited accepted diffs from Slice 4 edits.

Rollback is source-only and seam-specific: reverse only Slice 4 edits within these six files using the pre-implementation snapshot. Never restore whole shared files from Git and never alter provider/data/database/artifact/index/publication state.

## Stop conditions

Stop and return to PM if:

- a seventh source file is required;
- either page requires a new provider/context/request/cache/timer or a route/effect lifecycle move;
- the existing summary helper, API route, cache, server loader, request body, result shape, or mutation handler must change;
- provider action, approval, reversibility, retry, execution, receipt, database, artifact, index, publication, authentication, or route behavior must change;
- accepted Gmail counts, filters, action availability, Decision Mode queue, or close/return truth changes;
- source dirty state cannot be distinguished safely;
- the read seam cannot be separated without beginning Phase 4 capability/action work.

## Implementation decision gate

Status: `AUTHORIZED / CONSUMED`

Oliver replied `accept` directly to the explicit implementation decision gate on 2026-09-01. This authorizes only the exact six-file implementation and verification contract in this brief.

To authorize only this exact six-file read-facade implementation and verification contract, Oliver must return:

`ACCEPT PHASE 3 SLICE 4 IMPLEMENTATION`

This decision does not authorize Phase 4 capability/action work, provider integration, action mutation, commit, push, or deployment.

The required pre-implementation incremental backup is verified at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - Pre ACE-048 framework-first Decision Workspace Phase 3 Slice 4 managed decision-)` with `1,579` files, exact linked-worktree source, detached HEAD `8f8e4d670cabdd21459c0b4b8e502d16e272afc0`, `53` changed paths at backup time, normal project-scoped seven-day pruning, and all `23` `KEEP` archives preserved.

## Human acceptance closeout

Verifier proof is `ACCEPT / HIGH` with no missing proof. Oliver returned explicit Human Review `Accept` on 2026-09-02 after Codex completed and reported the delegated Playwright `PASS / HIGH` refresh.

Recovery Contract: `CHANGELOG.md` -> `September 2, 2026 — ACE-048 Framework-First Decision Workspace Phase 3 Slice 4 Accepted`.

Explicit Human-acceptance snapshot: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-02/ai-agent-platform-worktree-8642 (incremental 2 September 2026 - ACE-048 Phase 3 Slice 4 explicit Human Review acceptance after delegated Playwri)`.

Checkpoint Status: `none` — Slice 4 and Phase 3 are Human-accepted, recovery-backed, propagated, and closed. Phase 4 remains separately gated.
