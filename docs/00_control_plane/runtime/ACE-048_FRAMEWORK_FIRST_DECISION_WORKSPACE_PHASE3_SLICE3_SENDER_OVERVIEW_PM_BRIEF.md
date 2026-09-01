# ACE-048 Framework-First Decision Workspace Phase 3 Slice 3 — Sender Overview Read Facade PM Brief

Date: 2026-09-01
Status: `HUMAN-ACCEPTED / CLOSED`
Governing event: `ACE-048`
Feature domain: Decision Workspace generic runtime/data facade — item overview read slice
Mode: bounded `EXECUTION MODE`
Execution mode: `transitional_self_verification`
Reasoning level: `HIGH` — accepted lifecycle-heavy shared page with bounded adapter extraction
Problem class: `runtime data-facade boundary with lifecycle preservation`
Target-lock status: `inferred_target_lock`
Execution readiness: `authorized by Oliver's direct 2026-09-01 accept response to this implementation gate`

## Executive summary

### What is changing

Sender Overview's read-side data will come through the existing generic Decision Workspace adapter instead of the shared page calling Gmail workspace, window, distribution, identity, and semantic-projection helpers directly.

### What Oliver will get

The same visible Gmail page, counts, charts, rows, evidence, controls, and Decision Mode behavior, backed by a reusable item-review contract for other businesses and workflows.

### Why it matters

This lets the framework support detailed decisions across many domains while Gmail remains the proof application. It also avoids a risky rewrite of a mature page whose lifecycle already works.

## Objective

Extend the accepted Decision Workspace read facade with a generic, validated Item Overview model and adapter read service; migrate only the read-side Sender Overview seams; preserve all accepted Gmail presentation, route identity, data, cache, request, retry, evidence, linked-surface, provider-action, and close/return behavior.

## Scope

In scope:

- generic subject-row, evidence, selected-group, workflow-subset, pagination, distribution, activity-window, review-unit projection, provenance, freshness, quality, and validation contracts;
- a generic Item Overview adapter read service over existing read/cache helpers;
- Gmail compatibility projection that keeps current payloads, cache keys, request bodies, and response acceptance rules unchanged;
- conversion of the review page's read calls and overview-specific component prop types to the generic service/DTOs;
- the existing deterministic eight-domain fixture extended with Item Overview and fail-closed cases;
- exact accepted Gmail before/after browser proof.

Out of scope:

- route/query renames or aliases;
- moving route state, effect sequencing, cache ownership, retries, request ownership, or Decision Mode close/return out of the page;
- provider mutations, Gmail destination actions, Smart Sync, indexing, authentication, database, artifact, publication, or management behavior;
- new request families, polling, cache layers, lifecycle behavior, runtime providers, or contexts;
- Workflow Studio, live AI copy generation, proprietary-brain UI, shared learning, marketplace, or multi-agent orchestration;
- a real non-Gmail adapter or provider integration.

## Exact locked route

- Route template: `/agents/[id]/operations/review`
- Locked route file: `web/src/app/agents/[id]/operations/review/page.tsx`
- Exact accepted Gmail agent: `d256b48e-5acf-4b3d-af22-003d52e7e582`
- Compatibility query keys to preserve include `playground_session_id`, `cluster_id`, `workflow_scope`, `subset_source`, `subset_value`, `semantic_family`, `semantic_subtype`, `sender_page`, `sender_key`, `overlay_intent`, `mode`, `sender_overview_window`, `sender_overview_start`, `sender_overview_end`, `time_context_bucket_label`, `time_context_bucket_start_at`, and `time_context_bucket_end_exclusive_at`.

No path, query key, link target, redirect, mode transition, or return route may change.

## Locked source allowlist — exactly six files

1. `web/src/lib/runtime/decisionWorkspaceReadModel.ts` — extend the accepted generic schema with Item Overview DTOs, compatibility DTOs, read-service contracts, validation, and fail-closed finalization.
2. `web/src/components/runtime/DecisionWorkspaceReadContext.tsx` — expose the selected adapter's Item Overview read service through the existing provider. Add no provider, request, cache, polling, or route state.
3. `web/src/lib/integrations/gmail/gmailDecisionWorkspaceReadAdapter.ts` — wrap the existing Gmail cached/network workspace, overview-window, distribution, identity, activity, semantic-projection, and adapter-capability helpers without changing their behavior.
4. `web/src/app/agents/[id]/operations/review/page.tsx` — replace only direct Gmail read/data-projection calls and types with the generic adapter service/DTOs; retain all current state machines, effects, sequencing, route state, generic message evidence reads, Decision Mode provider action, and JSX behavior.
5. `web/src/components/runtime/GmailCleanupComponents.tsx` — change only Item Overview, Time Context, Sender Distribution, and shared sender-card read prop/type seams required by this slice; provider-operational controls and behavior remain Gmail-specific.
6. `web/scripts/workspace-decision-read-model-fixtures.mjs` — extend the existing eight-domain/static fixture with Item Overview, multi-source/multi-role identity, validation, and source-guard assertions.

No new source file or `package.json` change is required. If any source file outside this allowlist is required, stop and return to the Project Manager for explicit rescope.

## Framework / adapter / provider responsibility matrix

| Layer | Owns | Must not own |
|---|---|---|
| Framework read model | stable item-overview slot; subject/activity vocabulary fields; workflow/runtime/role/source identity; selected group; canonical scope/window/subset semantics; ordered subject keys; pagination; semantic metric definitions/units; evidence references; provenance; freshness; quality; validation and safe failure | Gmail sender/message fields; Gmail cache keys/endpoints; provider labels/actions; provider execution claims |
| Workflow/presentation adapter | visible title/subtitle/nouns; subject/activity/evidence labels; domain classifications; approved explanatory copy; semantic metric mapping; page-size/capability projection; deterministic versioned presentation | framework validation bypass; page-load model calls; silent copy drift; incompatible aggregation |
| Gmail read adapter | Gmail DTO compatibility; cluster identity; existing cache/read helpers; request body/query compatibility; semantic presentation projection; accepted cache validation and transient-guard result translation | UI state/effect ownership; duplicate cache; new retries/polling; Gmail mutations |
| Shared review page | canonical route state; cache-to-network sequencing; request owner/generation; transient-guard attachment; loading/ready/error state; window/subset/focus/pagination; evidence expansion; Decision Mode entry and close/return | Gmail read endpoint construction; Gmail cache-key construction; redefining domain semantics |
| Provider-operational layer | Gmail destination actions, trust signals, Smart Sync/index/auth/provider controls, execution verification | generic subject/activity meaning; cross-provider claims; framework learning policy |

## Generic Item Overview contract

Extend the existing read-model envelope rather than creating a parallel contract.

Framework-owned structures must cover:

- `DecisionWorkspaceItemOverviewReadModel`
  - workspace/workflow/runtime/analysis identity;
  - versioned vocabulary, roles, sources, generated/observed timestamps;
  - selected workflow group and optional review-unit identity;
  - canonical scope, workflow window, time bucket, route subset, semantic focus, and focused-subject identity;
  - ordered subject-key authority and population mode;
  - subject rows, pagination, distribution, activity/time context, review-unit projection, and workspace metrics;
  - provenance, freshness, quality, loading/error/unavailable state, and validation.
- `DecisionWorkspaceSubjectReadModel`
  - stable subject ID and adapter display identity;
  - metric observations rather than hard-coded message/count meaning;
  - classification/pattern fields with stable IDs plus adapter labels;
  - evidence references/previews with source identity and availability state;
  - confidence, risk/safety guidance, decision eligibility, and optional provider-projected compatibility fields.
- `DecisionWorkspaceItemOverviewReadService`
  - adapter capabilities and approved page-size limits;
  - cached workspace read and bounded workspace fetch;
  - cached window read and bounded window fetch;
  - stable distribution request-key construction, cached distribution read, bounded distribution fetch, and ordered-subject authority resolution;
  - review-unit activity-series projection and domain semantic-presentation projection;
  - no lifecycle state, timer, route, or provider mutation ownership.

Transitional provider-projected compatibility DTOs may preserve accepted Gmail field shapes while the generic model owns portable meaning. They must be explicitly documented as compatibility values, not framework semantics.

## Validation and fail-closed behavior

Reject or fail closed on:

- missing/duplicate workflow, runtime, group, review-unit, subject, source, role, evidence, metric, bucket, or provenance identity;
- invalid or incompatible metric definitions/units across sources;
- negative/non-finite counts, invalid pagination, duplicate ordered subject keys, or totals that contradict a required exact review-unit projection;
- scope/window/time-bucket identity that contradicts the returned read model;
- unordered/overlapping activity buckets or silently missing required zero buckets;
- evidence without subject/source identity or provider execution claims without provider evidence;
- missing/unsafe adapter vocabulary, which must use the existing safe framework fallback rather than leaking Gmail language;
- missing provenance, freshness, quality, workflow version, or validation state.

Invalid models must expose no actionable subjects and must not silently reuse an incompatible source aggregate.

## Required replacement logic

1. Extend `decisionWorkspaceReadModel.ts` with the generic Item Overview DTO/service and validators; reuse the accepted shared identity, metric, provenance, freshness, quality, role, source, and activity-series types.
2. Add `itemOverview` to the existing Gmail adapter and read context; do not add another context/provider.
3. Wrap existing Gmail helpers exactly. The adapter may translate names and compatibility DTOs but may not alter request bodies, cache keys, response acceptance, retries, aborts, or data ordering.
4. In the page, replace only direct read-side helper calls and Gmail read-model types with `useDecisionWorkspaceRead().itemOverview`. Keep route parsing, hooks, state transitions, timers, request ownership, generic evidence helpers, and provider mutation logic in place.
5. Move adapter-owned page-size limits, cluster identity, resolved-window, and semantic-presentation projection behind the service only where required to remove read-side provider knowledge. Do not move provider actions or provider trust-signal construction.
6. Change component props only where the migrated read DTO crosses the component boundary. Preserve JSX hierarchy, CSS classes, text, accessibility, controls, charts, row order, and visible behavior.
7. Extend the existing eight-domain fixture and add static guards proving no page-load model call, no new request/poller/cache owner, no new provider, and no direct banned Gmail read-helper import remains in the shared page.

## Cross-domain acceptance fixture

The fixture must prove all of the following:

| Domain | Overview title | Subjects | Activities/evidence | Required identity proof |
|---|---|---|---|---|
| Gmail | Sender Overview | senders | emails/messages | Gmail source and mailbox role |
| Customer service | Case Overview | cases | case/chat/call/SLA events | support, chat, and email sources |
| Real estate | Property Overview | properties | observations/inspections/cash flow | property/market sources |
| Crypto | Position Overview | positions/assets | trades/prices/risk/custody events | market plus exchange/custody sources |
| Paid media | Campaign Overview | campaigns/ad sets | spend/impressions/conversions | four source identities and compatible units |
| Bookkeeping | Transaction Overview | transactions/accounts | ledger/receipt/reconciliation evidence | ledger and document provenance |
| Tax | Compliance Item Overview | filings/issues/records | deadlines/documents/rules | tax source and reviewer role |
| Purchasing/shipping | Order & Shipment Overview | orders/shipments | purchase/spreadsheet/fulfillment/tracking events | three source identities and three agent roles |

Also prove:

- different adapters render different approved titles for the same `item_overview` slot;
- missing/unsafe title metadata falls back to `Item Overview`;
- multi-source data retains every contributing source ID;
- multi-role workflows retain every role ID without assuming one agent owns the work;
- incompatible cross-source aggregation fails closed;
- framework behavior is deterministic and makes zero model calls at render time.

## Proprietary-brain constraint

Any learned recommendation, classification, or future adapter configuration referenced by this read model must be versioned, inspectable, human-governed, provenance-backed, evaluated, tenant-scoped, and reversible. This slice does not implement training, shared learning, self-modification, or cross-tenant learning. The page renders a published deterministic definition only.

## Runtime load declaration

- Problem class: read facade over an accepted async UI lifecycle.
- Existing heavy endpoints: `POST /api/agents/playground`; `POST /api/integrations/gmail/inbox-analysis` with `sender_workspace`, `sender_overview_window`, and `sender_distribution`; existing message preview/snippet reads; existing Gmail management read when Decision Mode requires it.
- Existing provider mutation: `POST /api/runtime/gmail-destinations`, frozen and excluded.
- Polling: no interval poller. Existing bounded guard-attachment sampling only.
- Window retry: maximum five retries at `1,200ms`, transient-guard errors only.
- Workspace/distribution attachment: maximum `5,000ms` at `150ms` sampling, current request owner only.
- Expected steady-state request count: byte-for-behavior equivalent to the captured before baseline for each exact route/state; no additional request per load, focus, switch, expansion, page change, Decision Mode entry, or return.
- Lifecycle edges affected: none intentionally. Cache continuity, request ownership, window switching, route subset transitions, evidence hydration, Decision Mode entry, provider action, and close/return must remain unchanged.
- Build-pending continuity, Smart Sync-to-artifact handoff, and stale-build reclaim: not changed.

Any new request family, repeated heavy request, overlapping owner, extra guard churn, polling, cache, or lifecycle change is a failure and requires PM rescope.

## Frozen Gmail behavior

Preserve exactly:

- all current visible titles, subtitles, counts, rows, groups, distributions, activity charts, windows, labels, evidence, pagination, and controls;
- the shared workflow-window authority consumed by Time Context, Sender Distribution, Sender Overview, rows/pagination, and Decision Mode;
- review-unit validation and fail-closed entry behavior;
- cached/runtime/latest-safe continuity and current loading/error states;
- current request contexts, keys, bodies, acceptance validators, retries, aborts, and guard attachment;
- current `sender_workspace`, `sender_overview_window`, `sender_distribution`, message preview/snippet, management-summary, and destination-action behavior;
- Decision Mode queue identity, entry, action behavior, next-subject behavior, close/return route, subset/window/time bucket/page/scroll restoration;
- explicit Gmail provider controls and trust/evidence language;
- Phase 1 contract, Phase 2 presentation, Phase 3 Slice 1 Review Groups, and Phase 3 Slice 2 Decision Intelligence behavior.

## Five implementation slices

1. **Contract** — add generic Item Overview DTO/service/validation and provider-projected compatibility types.
2. **Adapter** — wrap current Gmail read/cache/identity/semantic helper seams with no behavioral change.
3. **Provider seam** — expose `itemOverview` through the existing read context with no added lifecycle.
4. **Consumer migration** — convert only read-side page/component seams, leaving page lifecycle and provider mutations intact.
5. **Fixtures and verification** — extend eight-domain/static guards, run regressions, then perform full accepted-route browser proof.

Each slice must receive targeted verification before the next slice. A non-trivial failure must follow diagnosis -> root-cause execution translation -> bounded correction -> re-verification.

## Static and regression verification

Required:

- `npm run test:workspace-decision-read-model`
- `npm run test:workspace-decision-presentation`
- existing Phase 1 Decision Workspace contract fixtures;
- existing Gmail cleanup-group assignment and review-unit/window projection fixtures;
- existing Sender Overview, Sender Distribution, Time Context, Decision Mode, route/return, and surface-consistency regressions applicable to the accepted path;
- targeted TypeScript/Next build validation;
- targeted ESLint for all changed source files;
- scoped diff and exact allowlist check;
- source guards for zero page-load model calls, zero new request definitions, zero new pollers, zero new caches/providers, and no direct banned Gmail read-helper imports in the shared page;
- confirmation that `POST /api/runtime/gmail-destinations` and provider controls are byte-for-behavior unchanged.

## Full post-settle Playwright proof

Use saved authentication or the approved bootstrap flow. Define ready state before verdict: exact canonical route, selected group/review unit, requested window/bucket/control visible, workspace and rails settled, no loader/fallback-only copy, decisive rows/charts/controls in frame.

Required exact accepted Gmail paths include:

1. `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions&subset_source=review_unit&subset_value=family%3Aoffer_campaign&sender_overview_window=last_month`
2. `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions&subset_source=review_unit&subset_value=review-unit%3Asemantic_parent_subscription_senders_family_marketing_promotional%3Asubtype-marketing_promotional_remainder%3Apattern-promotional_cycle&sender_overview_window=last_month`
3. `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions&subset_source=review_unit&subset_value=family%3Amarketing_candidate_editorial_content`

For the first two paths, capture before and after for:

- cold load;
- All Indexed, `1Y`, `1M`, `1W`, `1D`, and Custom workflow-window switch loop where valid;
- Time Context bucket selection and clear;
- Sender Distribution selection and clear;
- semantic/subset focus and pagination;
- evidence row expansion, snippet hydration, and message preview;
- Decision Mode entry, one non-mutating inspect flow, and Close back to the exact prior overview state;
- provider-action controls present but do not mutate provider state during automated verification.

Every final artifact must be post-settle and include screenshot, DOM/state capture, aligned request trace, console state, page-error state, route/href, and before/after comparison. Pre-settle artifacts are diagnostic only.

## Linked-surface parity and State Transition Matrix

The verifier must reconcile the same authoritative ordered subject universe across:

- Sender Overview totals;
- visible rows and pagination;
- Time Context totals/buckets;
- Sender Distribution totals/selection;
- active review unit and semantic focus;
- Decision Mode queue/position;
- Close/return overview state.

Required State Transition Matrix columns:

| Mode / Path | Baseline visible state before action | Operator action | Settled visible state after action | Downstream gate/status/result | Remaining blocker | Separate blocker? | Verdict |
|---|---|---|---|---|---|---|---|

Use one row per exact path and affected control/mode. A result cannot pass if the visible state, ordered universe, or return context differs from the before baseline without an explicitly expected route-state change.

## Exploratory discovery

After targeted re-verification, ask: `What else breaks under realistic user behavior?`

Bounded probes:

- rapid but realistic window changes followed by settle;
- page change then evidence expansion;
- semantic focus followed by Time Context or Distribution narrowing;
- Decision Mode enter/close after a narrowed workflow state;
- browser focus/storage synchronization without extra requests;
- empty, unavailable, low-confidence, stale-cache, and transient-guard states;
- multi-source/multi-role fixture corruption and unsafe/missing presentation metadata.

Stop after bounded probing produces no new finding. Do not explore provider mutation, unrelated routes, or new functionality.

## Verifier acceptance gate

Before Human Review, produce a pre-closeout packet containing:

- exact files changed and scoped diffs;
- exact routes/surfaces affected;
- static, fixture, TypeScript, lint, and allowlist results;
- post-settle screenshots, DOM/state, request traces, console/page errors, linked-surface parity, and complete State Transition Matrix;
- observed request families and guard churn classification;
- ready-state report and `Verification Confidence: HIGH` for decisive visible truth;
- a 3-6 step operator checklist limited to the residual human-visible review.

Verifier decision must be `ACCEPT`, `REJECT`, or `BLOCKED`. Do not present the implementation as complete before verifier acceptance and Oliver's Human Review decision.

## Dirty-state and rollback boundary

The six files contain inherited accepted work. Before implementation:

- record exact hashes and scoped diffs;
- create and verify the governed pre-implementation incremental backup with normal project-scoped seven-day pruning and `KEEP` preservation;
- distinguish pre-existing accepted diffs from Slice 3 edits.

Rollback is source-only and seam-specific: reverse only Slice 3 edits within the six allowlisted files using the pre-implementation snapshot. Do not restore whole files from Git and do not alter provider/data/database/artifact/index/publication state.

## Stop conditions

Stop and return to PM if:

- a seventh source file is required;
- preserving behavior requires moving route/effect/cache/request lifecycle ownership;
- a new endpoint, request family, cache, poller, retry, provider, or context is required;
- provider-action, data contract, schema, database, artifact, index, publication, or authentication behavior must change;
- accepted Gmail visible truth or linked-surface parity changes;
- the page cannot be separated without broad rearchitecture;
- existing dirty state cannot be distinguished safely.

## Implementation decision gate

Status: `AUTHORIZED / CONSUMED`

Oliver replied `accept` directly to this explicit gate on 2026-09-01, authorizing this exact six-file implementation and verification contract:

`ACCEPT PHASE 3 SLICE 3 IMPLEMENTATION`

The required pre-implementation incremental backup is verified at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - Pre ACE-048 framework-first Decision Workspace Phase 3 Slice 3 Sender Overview r)` with `1,138` files, source `/Users/olivercarlin/.codex/worktrees/8642/ai-agent-platform`, detached HEAD `8f8e4d670cabdd21459c0b4b8e502d16e272afc0`, `50` changed paths at backup time, normal project-scoped seven-day pruning, and preservation of all `23` discovered `KEEP` archives.

This gate does not authorize any later Phase 3 slice, Phase 4 capability/action work, provider integration, commit, push, or deployment.

## Verifier decision gate

Status: `ACCEPT / HUMAN REVIEW ACCEPTED / CLOSED`

The exact six-file implementation completed within the allowlist. Static/regression checks and authenticated post-settle Playwright proof passed at `HIGH` confidence across the locked routes, workflow-window matrix, Analysis Rail tabs, pagination, Decision Mode evidence/preview, close/return, and the accepted editorial compatibility redirect. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE3_REVIEW_PACKET.md`.

Oliver returned Human Review `accept` on 2026-09-01. Recovery Contract: `CHANGELOG.md` -> `September 1, 2026 — ACE-048 Framework-First Decision Workspace Phase 3 Slice 3 Accepted`. The verified Human-acceptance milestone backup is `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - ACE-048 framework-first Decision Workspace Phase 3 Slice 3 Human acceptance)` with `1,574` files, detached HEAD `8f8e4d670cabdd21459c0b4b8e502d16e272afc0`, `51` changed paths at backup time, normal project-scoped seven-day pruning, and all `23` `KEEP` archives preserved.

Checkpoint Status: `none` — implementation, verifier proof, Human acceptance, Recovery Contract, milestone backup, and closeout are propagated. No later slice is authorized.
