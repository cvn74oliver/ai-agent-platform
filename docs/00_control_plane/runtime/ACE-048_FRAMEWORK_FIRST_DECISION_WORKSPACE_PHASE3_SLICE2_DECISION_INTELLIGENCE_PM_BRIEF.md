# ACE-048 Framework-First Decision Workspace Phase 3 Slice 2 — Decision Intelligence Read Facade PM Brief

Date: 2026-09-01
Status: `HUMAN-ACCEPTED / CLOSED`
Governing event: `ACE-048`
Feature domain: Decision Workspace generic runtime/data facade — Decision Intelligence read slice
Mode: `EXECUTION MODE` under the accepted target-locked plan
Execution mode: `transitional_self_verification`
Reasoning level: `HIGH` — bounded multi-file read-facade extraction across accepted cache/request lifecycle
Problem class: `runtime data-facade boundary with read lifecycle preservation`
Target-lock status: `inferred_target_lock`
Execution readiness: `authorized by Oliver's direct 2026-09-01 accept response to the Phase 3 Slice 2 implementation gate`

## Executive summary

### What is changing

Inbox health will receive a generic Decision Intelligence read model instead of understanding Gmail cache, message, sender, pressure-trend, and management-summary structures directly. Gmail will continue supplying the same information through its compatibility adapter.

### What Oliver will get

The same visible Gmail dashboard, numbers, charts, recommendations, links, and provider controls, with a reusable decision-health boundary that support, investment, advertising, finance, and purchasing/shipping workflows can also supply.

### Why it matters

Slice 1 made Review Groups reusable. Slice 2 makes the system's top-level decision briefing reusable without moving into provider actions, complex item review, or a broad rewrite.

## Objective

Extend the accepted Phase 3 read facade with a generic, validated Decision Intelligence model and adapter service; convert only the accepted Intelligence route and its intelligence-specific component contracts; preserve every accepted Gmail value, route, request, cache, retry, focus-refresh, activity-series, recommendation, and provider-control behavior.

## Scope

In scope:

- generic decision-health, scope-metric, activity-series, workflow-progress, lifecycle-signal, recommendation, and navigation DTOs;
- strict validation and fail-closed finalization for the new DTOs;
- Gmail compatibility projection over the existing runtime, browser caches, draft storage, mailbox-intelligence read, pressure-trend read, and management-summary read;
- generic adapter methods that wrap the existing Gmail read helpers without changing them;
- conversion of only the Decision Intelligence page and its intelligence-specific component prop contracts;
- eight-domain deterministic fixtures and exact Gmail before/after parity proof.

Out of scope:

- Sender Overview, Sender Distribution, Time Context, Decision Mode, Decision Management, Pending Approvals, or History data migration;
- provider actions, approval execution, Gmail push/restore, destination writes, or memory writes;
- changes to APIs, caches, retries, polling, lifecycles, runtime assembly, provider controls, or published data;
- any real non-Gmail adapter or provider integration.

## Discovery recommendation

Implement Decision Intelligence as Phase 3 Slice 2.

Why this surface is next:

- It is the top-level human decision-support surface and exercises health, semantic metrics, trends, recommendations, progress, provenance, freshness, quality, and management-state summaries.
- It is read-oriented and performs no Gmail mutation.
- Its Gmail calls are already centralized in helper functions, so the adapter can wrap them without changing route/API implementations.
- The existing Slice 1 provider/adapter is already mounted above this route.
- The remaining alternatives are materially riskier: Sender Overview is `14,706` lines and lifecycle-heavy; Management owns provider execution; legacy audit routes are not the framework's primary workflow.

## Exact current render/data/request path

```text
web/src/app/agents/[id]/operations/layout.tsx
  -> OperationsWorkspaceShell
  -> OperationsRuntimeProvider
       -> fetchOperationsRuntimeSnapshot
       -> POST /api/agents/playground (existing runtime hydration)
       -> existing mailbox-index health read
  -> DecisionWorkspaceReadProvider
       -> gmailDecisionWorkspaceReadAdapter
  -> web/src/app/agents/[id]/operations/intelligence/page.tsx
       -> useOperationsRuntime
       -> runtime_cleanup_plan / runtime_mailbox_intelligence / runtime_mailbox_profile
       -> readCachedGmailMailboxIntelligence
       -> readLatestCachedGmailMailboxIntelligence
       -> fetchGmailMailboxIntelligence
            -> requestCachedInboxAnalysis
            -> POST /api/integrations/gmail/inbox-analysis action=mailbox_intelligence
       -> readCachedGmailPressureTrend / primeCachedGmailPressureTrend
       -> fetchGmailPressureTrend
            -> requestCachedInboxAnalysis
            -> POST /api/integrations/gmail/inbox-analysis action=mailbox_pressure_trend
       -> readGmailCleanupWorkflowDraft on cold/storage/focus synchronization
       -> fetchGmailDecisionManagementSummary
            -> 15-second cache + single-flight
            -> GET /api/runtime/gmail-memory?view=decision_management
       -> Gmail-specific health/recommendation projection
       -> intelligence-specific exports in GmailCleanupComponents.tsx
```

## Locked accepted route

- Route template: `/agents/[id]/operations/intelligence`
- Locked route file: `web/src/app/agents/[id]/operations/intelligence/page.tsx`
- Exact accepted Gmail route: `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/intelligence`
- Compatibility query keys: `playground_session_id`, existing analysis-scope keys, `pressure_window`, `pressure_start`, and `pressure_end`

No route, query-key, link, redirect, or navigation change is allowed.

## Locked source allowlist — exactly six files

1. `web/src/lib/runtime/decisionWorkspaceReadModel.ts` — extend the accepted schema with generic Decision Intelligence DTOs, adapter read-service contracts, validators, and fail-closed finalization.
2. `web/src/components/runtime/DecisionWorkspaceReadContext.tsx` — expose the selected adapter's generic Decision Intelligence read service and model state through the existing provider; do not add another provider or lifecycle owner.
3. `web/src/lib/integrations/gmail/gmailDecisionWorkspaceReadAdapter.ts` — add Gmail compatibility projection and wrappers over existing cache/read helpers, preserving request bodies, cache keys, retries, aborts, and request context.
4. `web/src/app/agents/[id]/operations/intelligence/page.tsx` — consume only generic read-facade types/methods plus existing presentation metadata; remove direct Gmail data/cache/request/draft imports while preserving sequencing and rendered behavior.
5. `web/src/components/runtime/GmailCleanupComponents.tsx` — change only the Decision Intelligence component prop/type seams (`InboxHealthGauge`, `MailboxMissionPanel`, `MailboxIntelligenceLoadingState`, `CleanupGroupContributionCards`, `MailboxIntelligenceDashboard`, and their directly required private intelligence helpers) to consume the generic DTO. No Sender Overview, Decision Mode, confirmation, evidence, or management component behavior may change.
6. `web/scripts/workspace-decision-read-model-fixtures.mjs` — extend the accepted eight-domain fixture with Decision Intelligence, activity-series, lifecycle-signal, recommendation, compatibility, and fail-closed proof.

No new source file or `package.json` change is required. If implementation requires any other source file, it must stop and return to the Project Manager for explicit rescope.

## Framework / adapter / provider responsibility matrix

| Layer | Owns | Must not own |
|---|---|---|
| Framework read model | stable IDs; workflow/runtime/source/role identity; semantic metric definitions; score definition; scope metrics; activity series; provenance; freshness; quality; recommendation/evidence links; generic lifecycle categories; fail-closed validation | Gmail sender/message fields; Gmail endpoints; Gmail cache keys; provider controls; provider execution |
| Workflow/adapter | domain subject/activity vocabulary; health definition and directionality; domain metric mapping; approved operator guidance; group/recommendation mapping; domain-specific route compatibility | framework validation bypass; silent incompatible aggregation; new page-load model calls |
| Gmail compatibility adapter | runtime/cache selection; sender/message projection; pressure-window translation; Gmail request wrappers; 15-second management-summary cache behavior; draft progress mapping; Gmail link/query compatibility | UI lifecycle ownership; duplicate caches; provider mutations; route renames |
| Provider-operational layer | Smart Sync, backfill, reindex, Gmail push/restore, authentication, execution verification | generic health semantics; cross-provider action claims |

## Generic Slice 2 read contract

The shared envelope from Slice 1 remains authoritative and is reused rather than duplicated.

Add these framework-owned structures:

- `DecisionWorkspaceIntelligenceReadModel`
  - workspace/workflow/runtime/analysis identity;
  - vocabulary, sources, roles, generated/observed timestamps;
  - freshness, quality, provenance, validation, loading/error/unavailable state;
  - score plus score-definition ID, range, directionality, state/band, and explanation;
  - scope metric observations for items, activities, review candidates, and decisions;
  - primary driver, recommended intervention, expected impact, confidence, rationale, alternatives/assumptions when available, and evidence references;
  - workflow progress and one generic next-action navigation target;
  - lifecycle signal counts: `awaiting_approval`, `executing_or_verifying`, `failed`, `executed_reversible`, and `deferred_or_unsupported`;
  - reference to the accepted generic Review Groups model/recommendation instead of duplicating group truth.
- `DecisionWorkspaceActivitySeriesReadModel`
  - semantic metric definition ID and unit;
  - stable time-window semantic ID plus adapter compatibility query identity;
  - requested/effective range, time zone, grouping/granularity, coverage bounds, and coverage limitation;
  - ordered buckets with start/end, label, value, source IDs, and explicit zero buckets;
  - provenance, freshness, quality, and validation.
- `DecisionWorkspaceIntelligenceReadService`
  - cached/latest-stable seed resolution;
  - bounded intelligence read;
  - cached/seeded activity-series resolution and one request per uncached key;
  - read-only management-summary resolution;
  - workflow-progress resolution from adapter storage;
  - route/query compatibility serialization.

Validation must reject or fail closed on:

- missing/duplicate workspace, workflow, source, role, metric, recommendation, evidence, or bucket identity;
- score outside its declared range or missing score-definition/directionality;
- count, ratio, currency, duration, or score values with incompatible definitions/units;
- activity buckets that are unordered, overlapping, non-finite, outside declared coverage, or silently omit required zero buckets;
- recommendation without rationale/evidence/metric linkage;
- lifecycle counts that are negative/non-finite or claim provider execution without adapter evidence;
- cross-source aggregates without explicit metric compatibility;
- invalid route/query compatibility output.

## Required replacement logic

1. Extend the existing read model and validator; do not create a parallel contract.
2. Extend the Gmail adapter so all Gmail cache/read/draft/summary types and helper calls are imported only by the adapter, not the Intelligence page.
3. Preserve the current page's request sequencing exactly through generic adapter methods:
   - cache/runtime/latest-stable intelligence before network;
   - bounded transient-guard retry only on the current conditions, maximum `20` retries at `1,200ms`;
   - seeded pressure trend before network;
   - one pressure request per request key, with current interactive abort behavior;
   - management summary on initial load and focus using the existing `15s` cache and single-flight behavior;
   - workflow progress on initial load, storage, and focus with no network request.
4. Project the current Gmail health/recommendation copy and calculations in the Gmail adapter. The framework validates meaning and evidence but does not impose Gmail language or pretend scores are comparable across different definitions.
5. Convert the page and intelligence-specific component props to the generic DTO without changing JSX structure, CSS classes, ordering, labels, links, controls, loading/error states, or visible values.
6. Extend the existing eight-domain fixture; do not add a runtime adapter, provider call, model call, or new test command.

## Cross-domain contract test

| Domain | Visible title | Decision subject | Activity/series example | Health/recommendation example | Source/role requirement |
|---|---|---|---|---|---|
| Gmail | Inbox health | sender | message pressure | decision coverage plus Gmail execution friction | Gmail index; mailbox operator |
| Customer service | Service health | case | case arrivals/SLA events | reduce SLA breach/refund risk | support, chat, email; service operator |
| Real estate | Portfolio health | property | observations/cash flow | resolve stale diligence or risk | market/property data; portfolio operator |
| Crypto | Portfolio health | position/asset | market/risk events | rebalance exposure under declared policy | market plus exchange; portfolio operator |
| Paid media | Campaign health | campaign/ad set | spend/conversions | address inefficient spend | Facebook, Google, TikTok, email; media operator |
| Bookkeeping | Reconciliation health | transaction/account | ledger activity | clear unmatched or anomalous entries | ledger; bookkeeper |
| Tax | Compliance health | issue/record | deadlines/document events | resolve filing/documentation risk | tax records; tax reviewer |
| Purchasing/shipping | Fulfillment health | order/product/shipment | purchase/tracking events | resolve stalled purchase or shipment | commerce, spreadsheet, shipping; purchasing, records, shipping roles |

Required fixture assertions:

- every domain validates through the same envelope and intelligence/activity-series structures;
- titles and nouns remain adapter-owned presentation metadata;
- health score definitions are versioned and are not cross-workflow comparable by default;
- four-source paid media preserves every source and rejects incompatible metric aggregation;
- purchasing/shipping preserves three sources and three roles without implying orchestration implementation;
- recommendations retain evidence, metric, workflow-version, and source provenance;
- missing/unsafe metadata fails closed without leaking Gmail terms;
- zero page-load model calls and zero new request definitions.

## Load and lifecycle declaration

- Heavy endpoints affected: none behaviorally; existing read helpers are wrapped only.
- Existing request families on the accepted route:
  - `POST /api/agents/playground` — runtime provider hydration;
  - `GET /api/integrations/gmail/mailbox-index` — shell/provider health;
  - `POST /api/integrations/gmail/inbox-analysis` — existing `mailbox_intelligence` and `mailbox_pressure_trend` actions only when current cache/seed logic requires;
  - `GET /api/runtime/gmail-memory?...view=decision_management` — read-only management summary.
- New request families: `0`.
- Polling: none before; none after.
- New cache: none.
- Existing retry: mailbox-intelligence transient guard only, bounded exactly as current; no widening.
- Existing focus behavior: draft synchronization and management-summary refresh only; preserve cache/single-flight suppression.
- Expected settled request count: `0` recurring requests after the route settles.
- Expected interactive pressure-window load: at most one inbox-analysis request for one uncached request key; cached keys return without a request.
- Lifecycle edges affected: none. Build-pending continuity, Smart Sync handoff, stale-build reclaim, index publication, provider execution, and decision lifecycle remain frozen.

## Hard constraints and exclusions

- Do not modify `web/src/lib/runtime/gmailCleanupWorkspace.ts`, API routes, runtime assemblers, runtime response builders, cache constants, or provider controls.
- Do not move request sequencing into a second provider/effect tree.
- Do not introduce polling, retry expansion, cache duplication, request fan-out, background refresh, or model calls.
- Do not alter pressure-window query identity or legacy analysis-scope fallback behavior.
- Do not change health formulas, score, recommendation priority, management-signal derivation, group recommendation, or links.
- Do not change any Sender Overview, Decision Mode, Management, confirmation, evidence, or provider-action behavior inside the shared component file.
- Do not mutate providers, data, databases, artifacts, indexes, publication, browser storage, or accepted drafts.
- Do not implement Workflow Studio, proprietary-brain UI, shared learning, marketplace, multi-agent orchestration, real non-Gmail integrations, or capability-driven actions.
- No commit, push, deployment, route rename, unrelated refactor, or dirty-state cleanup.

## Frozen Gmail regression truth

The accepted before baseline is `output/playwright/ace-048-phase2-presentation/after-intelligence.png` plus the `intelligence` record in `output/playwright/ace-048-phase2-presentation/after-verification.json`.

Preserve:

- headings `Inbox health` and `AI-guided next move`;
- `5,144` senders in scope, approximately `259,422` supporting messages, `1,999` review candidates, and `17` decisions in the accepted snapshot;
- health score `5 / 100`, its explanation, driver, intervention, and expected improvement;
- pressure-trend values, order, zero buckets, coverage, selected controls, and custom-range bounds;
- current group recommendation, `915 / 75,844` impact truth, and Review Groups link identity;
- Management summary values and navigation identity;
- provider controls and explicit Gmail wording;
- loading/error/empty states, route/query identity, focus behavior, and final visual hierarchy;
- existing request families, cache keys, retry/abort behavior, and zero settled polling.

If live accepted source data legitimately differs at implementation time, before/after parity must be captured from the same exact pre-implementation runtime state; old numeric artifacts remain the regression reference but must not override newer authoritative data.

## Accepted proof surfaces

1. Exact Decision Intelligence cold load.
2. Post-settle metric/health/recommendation/management state.
3. Pressure Trend switch loop: `All indexed -> 1Y -> 1M -> All indexed`.
4. One valid custom pressure range within visible coverage.
5. Focus-loss/focus-return behavior proving no request fan-out and correct management-summary cache behavior.
6. Recommended Review Groups handoff and return to Intelligence with route/query and visible state preserved.
7. Shared Gmail provider controls visible and unchanged; no provider action is clicked.
8. Eight-domain deterministic read-model fixtures.

## Required verification

### Static and contract proof

- `npm run test:workspace-decision-contract`
- `npm run test:workspace-decision-presentation`
- `npm run test:workspace-decision-read-model`
- existing generic/Gmail review-unit, cleanup-assignment, window-projection, Pressure Trend, optional-evidence, and mailbox-continuity fixtures
- TypeScript `--noEmit`
- targeted ESLint on the exact six-file allowlist
- `git diff --check`
- allowlist-only Slice 2 source diff proof and inherited dirty-state preservation
- source assertion that the Intelligence page has zero Gmail data/cache/request/draft imports after migration
- source assertion that no new `fetch`, interval, poll, model-call, or request definition exists

### Full post-settle Playwright proof

Ready-state contract:

- exact canonical route and agent ID loaded;
- `Inbox health` and `AI-guided next move` visible;
- four scope metrics, health score, mission briefing, Pressure Trend, management signals, and Review Groups handoff visible;
- no loader, fallback-only copy, overlay, or incomplete chart state;
- Gmail provider controls visible;
- all screenshots, DOM/state, request traces, and console evidence captured after settle.

Required before/after artifacts:

- screenshots for cold load, `1Y`, `1M`, restored `All indexed`, custom range, post-focus, group handoff, and final return;
- DOM/state capture with metric values, score, recommendation, selected window, bucket count/order/values, zero-bucket preservation, coverage, link hrefs, and provider controls;
- request traces partitioned by state transition with method/path/action/status and guard classification;
- cache/seed behavior evidence for cold, window switch, focus, and final settled hold;
- console/page-error state and final visible-truth inspection at `HIGH` confidence;
- linked Review Groups counts/recommendation identity on handoff and exact Intelligence return.

Required State Transition Matrix rows:

1. Intelligence cold load.
2. Pressure Trend `All indexed -> 1Y`.
3. Pressure Trend `1Y -> 1M`.
4. Pressure Trend `1M -> All indexed`.
5. Valid custom range and return to `All indexed`.
6. Window focus loss/return with management-summary cache/single-flight behavior.
7. Recommended Review Groups handoff.
8. Return to Intelligence and final settled hold.

Guard-churn reporting is mandatory. Any `409`, transient retry, repeated management-summary request, overlapping inbox-analysis request, or unexpected request family must be reported and shown non-interfering before acceptance; otherwise the pass fails.

## Verification loop

Implementation -> targeted verification -> diagnosis -> root-cause execution translation -> correction -> re-verification -> bounded exploratory discovery (`What else breaks under realistic Intelligence window switching, focus changes, and group handoff?`) -> additional correction if needed -> final verification -> verifier decision -> Human Review.

## Dirty-state and rollback boundary

The six locked files already contain accepted Phase 2 and/or Phase 3 Slice 1 work. They are not a clean baseline and must not be restored wholesale from Git.

Before implementation:

- record file hashes and scoped diffs;
- create the governed pre-implementation worktree incremental backup;
- distinguish accepted pre-existing changes from Slice 2 edits.

Rollback is source-only and file/seam-specific: restore only the Slice 2 changes in the six allowlisted files from the pre-implementation snapshot while preserving accepted Phase 1, Phase 2, and Phase 3 Slice 1 work. No provider/data/database/artifact/index/publication rollback is required.

## Implementation authorization

Status: `HUMAN-ACCEPTED / CLOSED`

- Oliver replied `accept` directly to the explicit Phase 3 Slice 2 implementation decision gate on 2026-09-01.
- Authority is limited to this exact six-file Decision Intelligence read-facade implementation and verification contract, beginning with the governed pre-implementation backup.
- The exact six-file implementation completed. Static verification, all named regression fixtures, eight-domain fail-closed fixtures, and full authenticated post-settle browser verification pass at verifier `ACCEPT / HIGH`.
- Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE2_REVIEW_PACKET.md`.
- Oliver returned Human Review `ACCEPT` on 2026-09-01 after reviewing the page, reporting no visible regression, and approving continuation. Slice 2 is closed.
- Recovery Contract: `CHANGELOG.md` -> `September 1, 2026 — ACE-048 Framework-First Decision Workspace Phase 3 Slice 2 Accepted`.
- Human-acceptance milestone backup: `VERIFIED` at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - ACE-048 framework-first Decision Workspace Phase 3 Slice 2 Human acceptance)` with `1,136` files, normal seven-day project-scoped pruning, and `KEEP` exemption.

Pre-implementation backup: `VERIFIED` at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - Pre ACE-048 framework-first Decision Workspace Phase 3 Slice 2 Decision Intellig)` with `1,116` files, source `/Users/olivercarlin/.codex/worktrees/8642/ai-agent-platform`, detached HEAD `8f8e4d670cabdd21459c0b4b8e502d16e272afc0`, normal seven-day project-scoped pruning, and `KEEP` preservation.

This approval does not authorize any later Phase 3 slice, Phase 4 capability/action work, real provider integration, commit, push, or deployment.

Checkpoint Status: `none` — implementation, verifier proof, Human acceptance, milestone backup, Recovery Contract, and Slice 2 closeout are fully propagated. No later slice or phase is authorized by this acceptance.
