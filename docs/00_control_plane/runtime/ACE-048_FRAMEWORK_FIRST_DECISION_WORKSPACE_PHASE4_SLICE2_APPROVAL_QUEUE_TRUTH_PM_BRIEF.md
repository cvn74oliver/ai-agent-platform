# ACE-048 Framework-First Decision Workspace Phase 4 Slice 2 — Approval Queue Truth Projection PM Brief

Date: 2026-09-02
Status: `HUMAN-ACCEPTED / RECOVERY-BACKED / GIT PUBLICATION PENDING`
Governing event: `ACE-048`
Feature domain: Decision Workspace approval queue — complete proposed-action truth and deterministic adapter presentation
Mode: bounded `EXECUTION MODE` completed; accepted closeout in progress
Execution mode: `transitional_self_verification`
Reasoning level: `HIGH` — one shared stateful UI consumer over frozen approval/execution seams
Problem class: `UI grammar / rendering plus read-only approval-bundle truth projection`
Target-lock status: `inferred_target_lock`
Execution readiness: `target-locked / execution-ready for presentation and read projection only`

## Executive summary

### What is changing

The next recommended slice makes the Approval Queue describe the complete work a human is approving. Today a request may contain several proposed actions, but the page describes only the first one even though the existing execute endpoint later processes the full bundle.

### What Oliver will get

Gmail keeps its current route and familiar controls, while every valid proposed action is shown with its own source, scope, effect, risk, reversibility, workflow stage, and responsible role. The same framework can then describe support, investing, advertising, bookkeeping, tax, and purchasing/records/shipping approvals without inheriting Gmail wording or collapsing several agents/providers into one opaque action.

### Why it matters

A human cannot make a well-governed decision unless the approval screen truthfully shows everything that approval can authorize. This slice closes that presentation gap without changing what any button calls, executing a provider action, or pretending that the separate runtime approval endpoints are already generalized or fully hardened.

## Discovery conclusion and recommendation

Proceed with **Approval Queue truth projection** as Phase 4 Slice 2.

Repository tracing proves the exact shared consumer is `web/src/app/agents/[id]/operations/approvals/page.tsx`, already rendered beneath the accepted Operations action provider. The page currently owns Gmail-specific queue types, action labels, consequences, scope nouns, and queue derivation. In the authoritative backend queue branch it reads only `proposed_actions[0]`. The existing `/api/runtime/execute` endpoint parses and iterates the complete `proposed_actions[]` array. Therefore the visible approval description and the executable bundle can diverge.

The smallest safe correction is a pure framework queue/bundle presentation contract plus a deterministic Gmail adapter projection, consumed by the existing page. Existing approve/reject/execute functions, request bodies, refresh behavior, server routes, event history, provider operations, and runtime lifecycle remain frozen.

This target lock is deliberately **not** an approval/execution-facade integration or endpoint-hardening slice. Discovery found separate runtime-integrity issues that must be handled through a later PM plan before the platform claims generalized or end-to-end safe provider execution:

- the execute endpoint's approval-decision and execution-result lookups are not constrained by `agent_id`;
- execution accepts the existence of any earlier approved decision rather than resolving the latest decision, so an approved-then-rejected history is not server-authoritative;
- the approve endpoint records a decision before proving that the matching approval request exists;
- execute requires the latest runtime mode to be `guarded`, but the Approval Queue does not currently expose that execution-readiness prerequisite;
- current queue items do not natively carry the complete workflow/version, role, source/connection, risk, reversibility, or receipt identity future providers require.

Those findings do not block a read/presentation correction because Slice 2 changes no endpoint and makes no new safety claim. They do block any later scope that connects new providers, changes execution authorization, or presents this legacy lifecycle as the final generic execution boundary.

## Objective

Replace the Approval Queue's page-local Gmail vocabulary and first-action-only projection with a validated, adapter-selected, complete ordered approval-bundle presentation while preserving the exact current route, status sections, controls, handler bodies, requests, event history, runtime lifecycle, and provider behavior.

## Scope and constraints

Scope is limited to the one existing Approval Queue consumer, the accepted pure action model, the selected Gmail action adapter, and the existing action fixture script. The slice may change deterministic presentation and fail-closed control availability only. It may not alter approval authorization, execution semantics, provider operations, runtime state, routes, requests, caching, polling, data, or publication state.

## Exact locked route and render path

- Route template: `/agents/[id]/operations/approvals`
- Locked route file: `web/src/app/agents/[id]/operations/approvals/page.tsx`
- Exact accepted agent path: `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/approvals`
- Existing optional query identity: `playground_session_id` plus `analysis_scope`; preserve both when present.

```text
web/src/app/agents/[id]/operations/layout.tsx (frozen)
  -> DecisionWorkspacePresentationProvider(adapterId=gmail)
  -> DecisionWorkspaceActionProvider(adapterId=gmail)
  -> OperationsWorkspaceShell
  -> OperationsRuntimeProvider (frozen lifecycle/cache/single-flight owner)
  -> web/src/app/agents/[id]/operations/approvals/page.tsx
       -> useOperationsRuntime().data
       -> runtime_approval_queue_items (authoritative first source)
       -> runtime_suggestion_sets / runtime_cleanup_plan (existing compatibility fallbacks)
       -> current page-local deriveQueueItems (targeted leak)
       -> current submitDecision / executeApproved handlers (frozen)

OperationsRuntimeProvider
  -> fetchOperationsRuntimeSnapshot
  -> POST /api/agents/playground with rehydrate_only=true (frozen)
  -> loadPlaygroundRuntimeState
  -> approval_request / approval_decision / execution_result event history

Human controls (frozen invocation path)
  -> POST /api/runtime/approve
  -> POST /api/runtime/execute
  -> existing forced/silent runtime snapshot refresh
```

No runtime inspection was necessary: the route, import chain, queue derivation, event projection, endpoint parsing, execution loop, cache owner, and lifecycle owners are statically explicit.

## Locked source allowlist — exactly four files

1. `web/src/lib/runtime/decisionWorkspaceActionModel.ts` — extend the accepted pure action model with approval queue, request, ordered bundle, per-action provenance/safety, lifecycle-control presentation, validation, and fail-closed contracts.
2. `web/src/lib/integrations/gmail/gmailDecisionWorkspaceActionAdapter.ts` — add deterministic projection for the existing Gmail runtime approval actions and compatibility fallbacks; preserve every proposed action in order.
3. `web/src/app/agents/[id]/operations/approvals/page.tsx` — replace page-local Gmail action vocabulary and first-action derivation with the selected adapter's validated queue projection; retain existing state, route/query/link, submit, execute, and refresh handlers.
4. `web/scripts/workspace-decision-action-model-fixtures.mjs` — extend the existing action fixture family with eight-domain approval bundles, multi-source/role cases, unsafe/missing metadata, and static boundary guards.

No fifth source file is authorized. `DecisionWorkspaceActionContext.tsx` and `operations/layout.tsx` need no change because the page is already below the accepted selected-adapter provider and can use the existing `useDecisionWorkspaceActions()` seam. The existing package command must be reused; `package.json` must not change.

If implementation requires an API route, runtime service, provider helper, database/schema file, lifecycle/cache owner, context/layout file, new test source, or any other source file, stop and return to the Project Manager for explicit rescope.

## Baseline source and handler locks

The implementation preflight must reattest these SHA-256 identities before editing:

| Frozen or allowlisted target | Discovery hash |
|---|---|
| Approval page | `d5af32626c5addd721ec15fa4bb6d04e1890db03ead2e062d7ddda1182a71636` |
| Approval page handler slice, lines 392-452 | `723b3fa0a773a0c92352fa4f62e0b2829fc5e96c7920c14987b3909fadb951a6` |
| Action model | `29b627920980ddc96d7a92d81b75259c460dcbcee4701018260e999e8dfc95f2` |
| Gmail action adapter | `29c79eec16b108a6180a24b5a12e54a767d388a85db69984556f6718358e5dbf` |
| Action-model fixtures | `fc93a526af56c29c159214cfd4e5a382e5194ee36169d30312cea145da9ae743` |
| `/api/runtime/approve` | `0da3c2d4d6629878d606875a28b1964e4a465f9451f8dd61af64707a47968b4b` |
| `/api/runtime/execute` | `12cc37fc776af0b3ffcb9de3b90e4fcf2b9600e4a1c11d55faa575884e22208c` |
| Runtime-state service | `8c7b40bd242578b4adab054507c44c80fd4a95ca5a09a6ff0bf734662f33d8ef` |
| Operations workspace read helper | `f53c81c8e4bc4944832f35e0ee3a3857aec5237f89a20479bbaf9b9127b3d523` |
| Operations runtime context | `05ad5c3805bf18b5e408eab864a4213206914a3ffd0199d7a52b7ed3062736ac` |

The handler-slice hash must remain byte-identical. Frozen-file hashes must remain unchanged. If line movement makes the handler range insufficient, compare the named `submitDecision` and `executeApproved` function bodies structurally and byte-for-byte against the governed pre-implementation snapshot.

## Framework / workflow / adapter / provider responsibility matrix

| Layer | Owns | Must not own |
|---|---|---|
| Framework approval model | stable request/bundle/action/status/control slots; ordered full-bundle validation; source/workflow/role/provenance requirements; risk/reversibility/approval semantics; generic fallback and fail-closed behavior | Gmail nouns, provider credentials, endpoint implementation, live model-generated copy, provider mutation |
| Published workflow definition | approved action combinations; workflow/version and stage; responsible roles; atomic versus separately approved steps; governing policy/SOP and prerequisites | live connection health, page state, unversioned label drift, silent self-modification |
| Domain/provider adapter | deterministic visible title/nouns/consequence copy; mapping of each known raw action to source/capability/effect/safety metadata; provider-specific controls; current compatibility projection | event-history authority, approval authorization, provider execution, cache/poll lifecycle, invented capability |
| Shared Approval Queue page | render validated requests, every ordered action, counts/status, evidence, and available controls; invoke only the existing handlers with validated compatibility identity | Gmail-specific action catalog; first-action truncation; new endpoint calls; execution authorization logic |
| Runtime approval/execution layer | current event writes, guarded-mode check, action parsing, provider invocation, results, and runtime refresh inputs | presentation vocabulary, cross-domain promises, hidden approval-bundle semantics |
| Provider operational layer | provider-specific authentication, scope, mutation, receipt, verification, retry, and reversal truth | framework semantics, other-provider actions, cross-source aggregation |

## Required approval queue and bundle contract

The pure model and adapter projection must provide:

- adapter, workflow definition/version, runtime instance/session, approval request, created-at, and current status identity;
- one ordered `actions[]` collection that preserves **every** proposed action; index, raw tool/action identity, stable presented action ID, source/connection, workflow stage, agent role, capability, effect, risk, approval, reversibility, preview, idempotency, and provider-specific status;
- bundle-level title, reason, scope, evidence, safety exclusions, effect summary, rejection consequence, and whether the bundle is valid for one approval decision;
- deterministic adapter-owned domain labels and safe generic framework fallbacks;
- lifecycle controls for approve, reject, and execute that map only to the existing page handlers and become unavailable when the request/bundle is invalid or unsafe;
- duplicate rejection, stable ordering, bounded text/identity validation, and explicit validation errors;
- full preservation of source/workflow/role/provenance identity for multi-agent and multi-source workflows;
- explicit atomicity: a multi-source bundle is actionable as one approval only when the published workflow declares that relationship and every constituent action is valid; otherwise fail closed or require separately approved requests;
- no exposure of a compatibility value when validation fails.

For the curated Gmail adapter, deterministic mappings must cover the currently executable Gmail actions `draft_email`, `analyze_inbox`, `review_sender_cluster`, `review_query_cluster`, and `archive_messages`. Read-only review/analysis actions must remain visibly distinct from Gmail writes. Archive must retain exact message-id/window/selection and protected-exclusion truth. Unsupported tool/action combinations, arbitrary undeclared sandbox actions, invalid arguments, empty bundles, or partially invalid bundles must remain visible for diagnosis but expose no approve/execute compatibility control.

## Required replacement logic

1. Add a pure approval queue model/finalizer beside the accepted action model. It must define no fetch, effect, cache, timer, state store, model call, provider SDK, event write, or mutation method.
2. Extend the selected adapter with an `approvals` projection that consumes the existing Operations runtime DTO as `unknown`, validates it, gives `runtime_approval_queue_items` precedence, and uses the current suggestion/cleanup sources only as compatibility fallbacks with the existing approval-ID dedupe order.
3. Project all `proposed_actions[]` entries, not only index `0`. Never summarize a multi-action bundle in language that implies only the first action will run.
4. Preserve current Gmail labels and explanations where they are truthful, but render each action separately and use bundle-level wording for what one approval authorizes.
5. Keep `submitDecision` and `executeApproved` byte-identical. Their endpoints, bodies, local overrides, busy states, success/error notes, and forced/silent refresh remain the page's current lifecycle.
6. Preserve queue status sections/counts, route/query identity, legacy-console return link, sort/dedupe behavior, loading/error/empty states, and familiar Gmail appearance.
7. For valid known current Gmail requests, preserve the current approve/reject/execute availability. For missing, unknown, ambiguous, or unsafe metadata, fail closed with an operator-readable reason and no invocation value.
8. Add eight-domain fixtures and static guards proving there is no first-action truncation, no Gmail vocabulary leakage, no new request path, and no edit outside the four-file allowlist.

## Reference-domain approval matrix

| Domain/workflow | Example approval bundle | Required identity and safety behavior |
|---|---|---|
| Gmail | review a sender/query; analyze metadata; create draft; archive exact messages | show every action; distinguish reads/draft/write; retain Gmail source, exact scope, exclusions, risk, reversibility, and approval consequence |
| Customer service | issue refund, reassign case, then close ticket | support source and role per step; refund amount/materiality and compensating path; no opaque “resolve” bundle |
| Real estate | request diligence, authorize offer, later withdraw | property/workflow/broker identity; offer action requires explicit high-risk approval; later withdrawal is separate unless declared atomic |
| Crypto/investments | rebalance across custody/exchange sources | exact venue/account per action, high-risk approval, idempotency and receipt; never merge providers into one unlabeled trade |
| Multi-source paid media | pause Meta campaign and reduce Google budget | each provider remains a separate presented action with its own source, scope, capability, and receipt expectation |
| Bookkeeping | match transaction, post entry, optionally reverse | ledger/source, reviewer role, amount/materiality, audit provenance, and reversal semantics are explicit |
| Tax | prepare, file/amend, and pay | preparation/read work is distinct from filing/payment; conservative fail-closed behavior for missing jurisdiction, period, reviewer, or evidence |
| Purchasing / records / shipping | purchasing agent places order; records agent updates spreadsheet; logistics agent creates and tracks shipment | preserve each role, source, workflow stage, prerequisite, and receipt; one human decision may authorize the bundle only when the versioned workflow explicitly declares it |

Fixtures must prove that an explicit multi-role/multi-source bundle preserves every action and identity; an ambiguous equivalent fails closed; missing or unsafe metadata cannot leak an invocation value; non-Gmail adapters never inherit `Inbox`, `sender`, `message`, or Gmail control language.

## Frozen behavior and exclusions

Preserve exactly:

- route, optional session/scope query, navigation label, legacy-console link/return target, loading/error/empty states, section order, current status counts, local status overrides, and sort/dedupe precedence;
- one `POST /api/runtime/approve` per explicit approve/reject click and one `POST /api/runtime/execute` per explicit execute click;
- current request bodies, UUID validation, runtime-mode behavior, event history, provider execution, action parsing, refresh call, cache/single-flight/poll behavior, provider authentication/scopes, Gmail calls, and execution results;
- accepted Phase 1-4 Slice 1 contracts, Gmail Review/Management controls, all routes/counts/groups/charts/windows/rows/actions, and close/return behavior;
- explicit provider-specific operational vocabulary where the adapter owns it.

Excluded:

- runtime endpoint correction, approval-history semantics, authorization/security hardening, schema/migration work, event rewriting, provider connection or mutation;
- new requests, polling, cache, invalidation, retry, lifecycle owner, model call, dynamic label generation, or provider SDK;
- Decision Mode or Management behavior; Workflow Studio; proprietary-brain UI; training/shared learning; marketplace; multi-agent orchestration implementation;
- route rename/alias, data/database/artifact/index/publication mutation, commit, push, merge, deployment, force operation, or lineage deletion.

## Runtime load declaration

- Problem class: UI grammar/rendering plus pure approval-bundle read projection.
- Existing read family: the current `POST /api/agents/playground` rehydrate path owned by `OperationsRuntimeProvider`; unchanged.
- Existing approve family: at most one `POST /api/runtime/approve` per explicit approve/reject click; unchanged.
- Existing execute family: at most one `POST /api/runtime/execute` per explicit execute click; unchanged.
- Existing post-action refresh: one forced/silent refresh through the current runtime context and single-flight owner; unchanged.
- Polling: no new poller or cadence change.
- New requests, caches, retries, guards, model calls, provider calls, event writes, or server work: zero.
- Expected steady-state action request count: zero without an operator click.
- Lifecycle edges affected: none; status projection and controls consume current state only.
- Build-pending continuity, Smart Sync/artifact handoff, stale-build reclaim, provider execution, and outcome measurement: unchanged.

Any request-count increase, handler change, endpoint change, provider invocation during verification, cache/poll/lifecycle change, or new live capability claim is a failure and requires PM rescope.

## Four implementation slices

1. **Contract** — add pure approval queue/request/bundle/action/control types, validation, and fail-closed finalizer.
2. **Gmail adapter** — project all known current Gmail actions and compatibility fallbacks while preserving every action and identity.
3. **Consumer** — replace only page-local derivation/vocabulary; retain all existing state and handler bodies.
4. **Fixtures and proof** — add eight-domain/static generated-chrome coverage, regression/static checks, and exact-route post-settle browser proof.

Each slice requires targeted verification before the next. A non-trivial failure must follow implementation -> targeted verification -> diagnosis -> root-cause execution translation -> bounded correction -> re-verification -> guided exploratory discovery -> final verification.

## Verification contract

Static and regression proof must include:

- existing `npm run test:workspace-decision-action-model`, extended for approval bundles without changing `package.json`;
- existing `test:workspace-decision-contract`, `test:workspace-decision-presentation`, and applicable Phase 3 read-model fixtures;
- applicable Gmail review-unit, cleanup-assignment, approval-summary, runtime-state, destination, and Operations regressions already available in the repo;
- TypeScript/Next source validation and targeted ESLint on the exact four-file allowlist;
- `git diff --check`, pre/post hashes, exact allowlist comparison, and no fifth source file;
- byte-identical `submitDecision` and `executeApproved` function bodies and unchanged frozen-file hashes;
- static proof of zero new `fetch`, route, API, provider SDK, timer, poller, cache, model-call, event-write, or lifecycle owner;
- eight-domain full-bundle, multi-role/source, explicit-atomicity, invalid/missing metadata, duplicate, unsafe text, and fail-closed fixtures;
- a generated-chrome fixture showing different approved domain vocabulary from the same framework slots and every action in purchasing/records/shipping and paid-media bundles.

Full post-settle Playwright proof must use `http://localhost:3000` and the exact accepted approvals route, with saved authentication or the approved bootstrap. Ready state requires canonical URL, the Approval Queue heading, all four status sections with either cards or explicit empty states, no loader/error/overlay, and stable DOM/request counts after settle.

Required evidence:

1. before/after cold load on the exact agent route;
2. before/after optional session-scoped route only if an existing canonical session identity is available from the page/runtime—never guess or create one;
3. every live valid queue card shows the complete ordered action bundle; if live data has no multi-action item, use the deterministic generated-chrome fixture rather than creating or executing a request;
4. pending, approved, executed, rejected, invalid, and multi-action fixture states with the correct visible controls and fail-closed reasons;
5. DOM/state capture tied to each accepted screenshot;
6. request trace proving the existing read family only, zero approve/execute POSTs during verifier proof, zero failed requests, and zero `409` churn;
7. console/page-error state and final visual inspection;
8. linked parity between queue summary, rendered status sections, approval IDs, and action counts;
9. a State Transition Matrix with one row per agent/session path and per pending/approved/executed/rejected/invalid/multi-action fixture state.

The verifier must not click approve, reject, or execute because verification is read-only and this slice changes no handler. Static handler hashes plus rendered availability prove the bounded change without mutating event/provider state.

Required closeout fields: `Ready-state satisfied`, signals, settle strategy, artifacts captured post-settle, guard-churn classification, direct verification versus operator assist, `Verification Confidence`, verifier verdict, and Human Review status.

## Acceptance criteria

- The page presents every proposed action; no first-action truncation remains.
- A valid Gmail single-action request retains its familiar wording and same controls.
- A valid multi-action request plainly states that one approval covers the shown bundle and renders every action in order.
- Per-action source, role, workflow stage, capability/effect, risk, reversibility, scope, evidence, and safety truth are retained or safely declared unavailable.
- Unknown, partially invalid, unsafe, or ambiguously combined requests fail closed without an approve/execute invocation value.
- Multi-role and multi-source fixtures preserve identity and never collapse into one opaque action.
- Existing page handlers and all frozen runtime/API/provider/cache/lifecycle files are unchanged.
- No new request, poller, cache, model call, provider operation, data mutation, route, or source file exists.
- Gmail routes, counts, sections, status behavior, query/return identity, and accepted Review/Management behavior remain intact.
- Verifier returns `ACCEPT / HIGH` with complete static and post-settle artifact proof before Human Review.

## Rollback

Rollback is source-only within the four-file allowlist: restore the approval page's pre-slice queue derivation/rendering and remove the approval projection additions from the action model, Gmail adapter, and existing fixture script. No database, event, provider, artifact, publication, or data rollback is allowed or required.

## Proprietary-brain and future-work constraint

Approval proposals, decisions, execution receipts, corrections, and measured outcomes may strengthen the tenant-owned proprietary brain only through versioned, inspectable, human-governed, provenance-backed, evaluated, tenant-scoped, and reversible records. This slice implements no learning, self-modification, cross-tenant transfer, Workflow Studio, live AI generation, or multi-agent orchestration.

## Authorization update

Oliver returned the exact decision `ACCEPT PHASE 4 SLICE 2 IMPLEMENTATION` on 2026-09-02. This authorizes the governed pre-implementation recovery point followed by implementation and verification of only the exact four-file presentation/read contract above.

It does not authorize a fifth source file, endpoint/runtime hardening, provider or data mutation, approval/execution during verification, route/request/cache/poll/lifecycle changes, commit, push, merge, deployment, force operations, or lineage deletion. Accepted-milestone backup and Git publication remain post-verifier/Human Review steps under the standing policy.

Checkpoint Status: propagation required before closeout. Human acceptance, the Recovery Contract, and the verified `2,434`-file acceptance snapshot are captured; exact-scope Git publication remains pending.
