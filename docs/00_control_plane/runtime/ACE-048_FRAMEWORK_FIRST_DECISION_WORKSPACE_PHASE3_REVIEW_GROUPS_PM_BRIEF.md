# ACE-048 Framework-First Decision Workspace Phase 3 — Review Groups Read Facade PM Brief

Date: 2026-09-01
Status: `TARGET-LOCKED / EXECUTION-READY / AWAITING EXPLICIT IMPLEMENTATION DECISION`
Governing event: `ACE-048`
Feature domain: Decision Workspace generic runtime/data facade — Review Groups read-only slice
Mode: `PLAN MODE`
Execution mode: `transitional_self_verification`
Reasoning level: `HIGH` — bounded multi-file type/interface extraction over an accepted runtime/UI surface
Problem class: `runtime data-facade boundary with a locked UI consumer`; no provider or lifecycle behavior change
Target-lock status: `inferred_target_lock`
Execution readiness: `execution-ready only after Oliver separately authorizes Phase 3 Slice 1 implementation`

## Executive summary

### What is changing

Review Groups will receive a generic decision-workspace read model instead of understanding Gmail sender/message structures directly. Gmail will translate its existing accepted data into that model through a compatibility adapter.

### What Oliver will get

The same visible Gmail Review Groups page and behavior, but with a reusable information boundary that future support, investment, advertising, finance, and purchasing/shipping workflows can also supply.

### Why it matters

Phase 2 made the visible language adaptable. This first Phase 3 slice makes the information underneath one safe, read-only page adaptable without disturbing Gmail, provider controls, requests, decisions, or actions.

## Objective

Introduce one generic, validated decision-workspace read boundary for Review Groups, place all Gmail-to-framework projection behind a Gmail compatibility adapter, and preserve the accepted Gmail route, visible truth, requests, cache/lifecycle behavior, and downstream links exactly.

## Scope

In scope:

- generic Slice 1 read-envelope and Review Groups DTOs;
- Gmail compatibility projection from existing runtime/cache/draft inputs;
- client context and explicit adapter composition;
- conversion of only the accepted Review Groups route to the generic read model;
- deterministic cross-domain/Gmail-parity fixtures and full accepted-route verification.

Out of scope:

- Intelligence, Sender Overview, Decision Mode, and Management data migration;
- generic runtime response/API replacement;
- provider operations, lifecycle behavior, real non-Gmail integrations, or any later Phase 3 slice.

## Discovery conclusion and recommendation

Recommendation: implement Review Groups as the first generic runtime/data-facade consumer.

Why this surface is first:

- It is an accepted, meaningful data surface rather than a cosmetic landing page.
- The route file contains zero direct `fetch(...)` calls.
- It reads the shared runtime snapshot and browser caches but does not initiate Gmail mutations.
- It exercises groups, review units, metrics, recommendations, provenance, freshness, source identity, workflow progress, and links into the accepted Sender Overview flow.
- Decision Intelligence directly coordinates pressure-trend and management-summary reads; Sender Overview/Decision Mode is a 14,706-line high-interaction surface; Management contains provider execution controls. Those remain later slices.

## Exact current path proved by repository discovery

```text
operations/layout.tsx
  -> gmailDecisionWorkspacePresentation
  -> OperationsWorkspaceShell
  -> OperationsRuntimeProvider
  -> fetchOperationsRuntimeSnapshot
  -> POST /api/agents/playground (rehydrate_only)
  -> runtimeStateService
  -> assembleGmailRuntimeState
  -> playgroundResponseBuilder
  -> OperationsRuntimeData
       runtime_cleanup_plan
       runtime_mailbox_intelligence
       runtime_sender_overview
       runtime_selected_cluster_rail_family
  -> operations/clusters/page.tsx
       Gmail runtime/cache types
       Gmail semantic/presentation transforms
       Gmail workflow-draft progress
       rendered Review Groups
```

Additional accepted Gmail reads remain behind their current helpers and routes, including `/api/integrations/gmail/inbox-analysis`, `/api/runtime/gmail-memory`, `/api/runtime/gmail-destinations`, and `/api/integrations/gmail/mailbox-index`. This slice neither renames nor rewrites them.

## Locked accepted route

- Route template: `/agents/[id]/operations/clusters`
- Locked route file: `web/src/app/agents/[id]/operations/clusters/page.tsx`
- Exact accepted Gmail proof route: `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/clusters`
- Accepted downstream compatibility route: `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions&subset_source=review_unit&subset_value=family%3Aoffer_campaign&sender_overview_window=last_month`

No route rename, alias, or query-key change is allowed.

## Locked source allowlist — exactly eight files

1. `web/src/lib/runtime/decisionWorkspaceReadModel.ts` — new generic read-envelope, metric observation, review-group, review-unit, recommendation summary, provenance/freshness/quality, validator, and adapter interfaces.
2. `web/src/components/runtime/DecisionWorkspaceReadContext.tsx` — new client context that resolves an explicitly selected adapter and exposes generic read models to accepted pages.
3. `web/src/lib/integrations/gmail/gmailDecisionWorkspaceReadAdapter.ts` — new Gmail compatibility projection over the existing runtime snapshot, caches, semantic presentation helpers, and workflow-draft progress.
4. `web/src/app/agents/[id]/operations/layout.tsx` — declare the existing Gmail workspace adapter identity as serializable composition metadata; retain the Phase 2 presentation provider.
5. `web/src/components/runtime/OperationsWorkspaceShell.tsx` — mount the generic read context inside the existing runtime provider without changing provider controls, requests, polling, cache, or lifecycle behavior.
6. `web/src/app/agents/[id]/operations/clusters/page.tsx` — consume only the generic Review Groups read model plus Phase 2 presentation metadata; remove direct Gmail data/cache/semantic/draft imports from this route file.
7. `web/scripts/workspace-decision-read-model-fixtures.mjs` — new deterministic cross-domain and Gmail-parity contract fixtures.
8. `web/package.json` — add only the targeted fixture script command.

If any implementation requires another source file, execution must stop and return to the Project Manager for explicit rescope. Existing unrelated dirty state must remain untouched.

## Generic read-model contract for Slice 1

Framework-owned fields:

- `schemaVersion`
- workspace type, workflow definition/version, runtime instance, and analysis scope identity
- subject and activity vocabulary references
- source identities and source roles
- `generatedAt`, `observedAt`, `freshness`, `quality`, and `transformationVersion`
- semantic metric observations with definition IDs, values, units, time basis, and source IDs
- review-group stable ID, canonical ID, compatibility IDs, section/role, title reference, explanation, safety/risk guidance, and status
- review-unit stable ID, parent ID, decomposition identity, subject count, activity count, group share, manageability state, and target route identity
- recommendation reason, recommended group/unit IDs, rationale, expected impact, confidence, and evidence references
- validation result and fail-closed unavailable state

Adapter-owned mapping:

- Gmail sender/message fields into subject/activity metrics
- Gmail cleanup-plan and mailbox-intelligence cache selection
- Gmail semantic rollup, group partition, label, and review-unit derivation
- Gmail draft/progress compatibility and browser storage/focus subscriptions
- Gmail route compatibility identities and query values
- Gmail source/provenance/freshness translation

Provider-operational controls remain explicitly provider-specific and outside the read model.

## Required replacement logic

1. Add the generic Slice 1 DTOs and strict validator. Invalid IDs, missing workflow/source identity, incompatible metric definitions, missing provenance requirements, duplicate group/unit identity, negative/non-finite counts, or child totals that contradict a required parent total must fail closed.
2. Add the Gmail adapter. It must reuse existing Gmail runtime/cache/draft and semantic helpers; it must not duplicate provider fetch logic or introduce a second cache.
3. Add a client read context selected by serializable adapter identity. The context may project existing runtime state; it must not fetch, poll, mutate, or call a model.
4. Wire the provider inside the existing Operations runtime boundary. The current runtime provider remains the only owner of its snapshot lifecycle and Gmail index controls.
5. Convert Review Groups to consume the generic model. All existing visual sections, group ordering, counts, review-unit links, progress semantics, and empty/error/loading states remain unchanged.
6. Add deterministic fixtures for all reference domains and Gmail before/after parity.

## Cross-domain model test

| Domain | Decision subject | Activity/impact | Review grouping | Source requirement |
|---|---|---|---|---|
| Gmail | sender | messages | cleanup purpose, pattern, age, risk | Gmail index/artifact |
| Customer service | case | case events, SLA time, refund value | urgency, issue type, refund risk | support, chat, support email |
| Real estate | property | observations, cash flow, valuation | market, strategy, risk | property market data |
| Crypto | position/asset | market events, exposure, return | asset class, strategy, risk | market data plus exchange |
| Paid media | campaign/ad set | spend, revenue, conversions | channel, objective, efficiency | Facebook, Google, TikTok, email |
| Bookkeeping | transaction/account | ledger activity and reconciliation | account, exception type, period | bookkeeping ledger |
| Tax | tax issue/record | documentation, rules, deadlines | tax year, issue type, risk | tax/accounting records |
| Purchasing/shipping | order/product/shipment | purchase and tracking events | supplier, fulfillment state, exception | commerce, spreadsheet, shipping |

The same framework slots are sufficient. Domain adapters supply the subject/activity mapping, metric definitions, group semantics, source identity, and approved vocabulary. Multi-source values may aggregate only when metric compatibility allows it; otherwise the validator fails closed. Multi-role workflows preserve role and provenance identity but do not implement orchestration in this slice.

## Load declaration

- Heavy endpoints affected: none behaviorally.
- Existing request families observed on the accepted Review Groups flow: `POST /api/agents/playground` and `POST /api/integrations/gmail/inbox-analysis`; Gmail index-health/provider controls remain owned by the existing shell/runtime.
- New request families: `0`.
- Polling introduced: no.
- Cache introduced or changed: no.
- Expected steady-state request count: byte-for-behavior identical to the accepted before baseline; exact before/after traces must match.
- Lifecycle edges affected: none. Build-pending continuity, Smart Sync handoff, stale-build reclaim, mailbox index health, and provider operations are frozen.

## Hard constraints and exclusions

- No changes to Gmail API routes, `gmailCleanupWorkspace.ts`, `operationsWorkspace.ts`, `OperationsRuntimeContext.tsx`, `runtimeStateService.ts`, `gmailRuntimeAssembler.ts`, or `playgroundResponseBuilder.ts`.
- No runtime response-key rename.
- No provider/data/database/artifact/index/publication mutation.
- No request, polling, cache, concurrency, retry, or lifecycle change.
- No Decision Mode or Management behavior/action change.
- No provider-control genericization; Gmail Smart Sync, reindex, backfill, push, and restore remain explicitly Gmail-specific.
- No Workflow Studio, live AI generation, proprietary-brain UI, shared learning, marketplace, or multi-agent orchestration implementation.
- No commit, push, deployment, route change, unrelated refactor, or dirty-state cleanup.

## Regression protections

- Phase 1 decision-workspace contract remains unchanged and passing.
- Phase 2 presentation contract remains unchanged and passing.
- Gmail Review Groups visible truth must remain identical: `7` main groups, `3` optional/reference groups, `5,144` senders in scope, accepted section order, recommendation, group counts, review-unit counts, and route/query identities.
- The accepted `915`-sender / `75,844`-message recommended group and its exact smaller-group decomposition remain unchanged.
- The exact accepted child route opens the same sender universe and returns to the same Review Groups state.
- Provider controls, shell copy, request families, cache behavior, and console state remain unchanged.

## Accepted proof surfaces

- Exact Review Groups cold load on the locked Gmail route.
- Focused Review Groups state using the existing `focus_cluster` query.
- Existing recommended group and smaller-group decomposition with exact counts and hrefs.
- Transition into the exact accepted child Review route and return to Review Groups.
- Shared shell/provider controls and identical request-family behavior.
- Cross-domain generated read models for all reference domains plus purchasing/shipping.

## Required verification

### Static and contract proof

- `npm run test:workspace-decision-contract`
- `npm run test:workspace-decision-presentation`
- new `npm run test:workspace-decision-read-model`
- existing generic/Gmail review-unit, cleanup-assignment, window-projection, optional-evidence, and mailbox-continuity fixtures
- TypeScript no-emit
- targeted ESLint on all eight allowlisted files
- `git diff --check`
- allowlist-only source diff proof and inherited dirty-state preservation

### Cross-domain fixture requirements

- Gmail plus the seven reference domains and purchasing/shipping all validate through the same generic envelope.
- Different subject/activity types and metric definitions remain truthful.
- Four-source paid media preserves source identity and rejects incompatible aggregation.
- Purchasing/shipping preserves three agent roles and three sources without implying one agent or one provider.
- Missing/invalid workflow, source, provenance, freshness, quality, metric, group, or unit identity fails closed.
- Fixture execution proves zero model calls and zero new request definitions.

### Full post-settle Playwright proof

Accepted defect surface: exact Review Groups route and its accepted child transition/return.

Ready-state contract:

- exact canonical route and agent ID loaded;
- Review Groups heading and all six stage/section headings visible;
- no loader/fallback-only copy;
- group cards and review-unit links present;
- provider controls visible and explicitly Gmail-specific;
- final state settled before screenshots, DOM/state capture, request trace, and console capture.

Required artifacts:

- before and after screenshots of the exact Review Groups route;
- before and after DOM/state capture with counts, headings, IDs, and hrefs;
- before and after request traces showing identical API families/counts/statuses;
- console/page-error state;
- one exact child open and return sequence;
- linked-surface parity for group/unit counts and route/query identity;
- final visible-truth inspection at `HIGH` confidence.

Required State Transition Matrix rows:

1. Review Groups cold load.
2. Focused Review Groups state using `focus_cluster`.
3. Recommended smaller-group link into the accepted Review route.
4. Return from the accepted Review route to Review Groups.

## Verification loop

Implementation -> targeted verification -> diagnosis -> root-cause execution translation -> correction -> re-verification -> bounded exploratory discovery (`What else breaks under realistic Review Groups navigation?`) -> additional correction if required -> final verification -> verifier decision -> Human Review.

## Rollback boundary

Rollback is source-only: remove the new generic read-model/context/Gmail-adapter/fixture files and restore the four modified allowlisted files to the accepted Phase 2 state. No provider, data, database, artifact, index, publication, or route rollback is required.

## Decision gate

Status: `Awaiting Decision`

This discovery and target lock are complete, but Phase 3 Slice 1 implementation has not started.

- `ACCEPT PHASE 3 SLICE 1 IMPLEMENTATION` — authorize exactly the eight-file Review Groups read-facade implementation and verification contract above.
- `REJECT` — keep Phase 3 unimplemented and return the recommendation to PM revision.
- `RETURN_TO_PM` — revise the first-surface choice or facade contract before execution.

Checkpoint Status: `none` — the discovery result, target lock, proof contract, and separate implementation gate are fully captured in this brief. No implementation or accepted-fix state is pending propagation.
