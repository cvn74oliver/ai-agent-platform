# ACE-048 Framework-First Decision Workspace Phase 4 Slice 1 — Capability-Driven Action Presentation PM Brief

Date: 2026-09-02
Status: `HUMAN-ACCEPTED / RECOVERY-BACKED / CLOSEOUT PUBLICATION IN PROGRESS`
Governing event: `ACE-048`
Feature domain: Decision Workspace capability/action boundary — deterministic action presentation and availability
Mode: `PLAN MODE` until explicit implementation authorization; later bounded `EXECUTION MODE`
Execution mode: `transitional_self_verification`
Reasoning level: `HIGH` — two accepted shared UI consumers over frozen provider-write seams
Problem class: `UI grammar / rendering with a read-only capability-availability boundary`
Target-lock status: `inferred_target_lock`
Execution readiness: `target-locked / implementation authorized after prerequisite publication checkpoint`

## Executive summary

### What is changing

Decision Mode and Decision Management will obtain visible action labels, explanations, capability requirements, and availability from the selected workflow/provider adapter instead of defining Gmail action lists and eligibility directly inside the shared pages.

### What Oliver will get

The Gmail screens will look and behave the same, but the same shared decision surfaces will be able to present approved actions for customer service, real estate, investments, paid media, bookkeeping, tax, purchasing, records, and shipping without inheriting Gmail vocabulary or pretending unsupported actions exist.

### Why it matters

Phases 1-3 generalized what Operations understands, shows, and reads. This first Phase 4 slice begins generalizing what a human is allowed to choose, while preserving the critical separation between recommendation, human decision, approval, provider execution, verification receipt, reversal, and measured outcome.

## Discovery conclusion

The framework already defines static action capability, risk, approval, reversibility, preview, idempotency, execution lifecycle, provider receipt, and rollback fields in `decisionWorkspaceContract.ts`. Gmail declares matching static capabilities/actions in `gmailReviewUnitContract.ts`.

The live shared surfaces do not yet consume that catalog:

- Decision Mode defines `Keep All`, `Keep Some`, `Archive All`, and `Not Sure` directly in `operations/review/page.tsx`, then calls the existing Gmail destination-commit handler.
- Decision Management computes push, restore, and reopen eligibility inside `executionPresentation` in `operations/management/page.tsx` and renders `Push to Gmail`, `Restore`, and `Reopen in Decisions` directly.
- `POST /api/runtime/gmail-destinations` remains the Gmail operational owner for destination commit, archive execution, archive verification, and restoration.
- the existing generic management read model exposes observed provider-specific execution capabilities, but its operation identifiers do not yet constitute a live adapter-selected action catalog;
- the separate approval/execution runtime pages are not connected to Gmail Decision Mode/Management actions, so silently routing these controls through them would be a lifecycle and behavior change rather than a presentation migration;
- the current static capability declaration does not prove a live connection, current scope grant, fulfilled prerequisite, approval state, or executable provider operation.

Therefore the first safe slice is **deterministic adapter-selected action presentation and fail-closed availability only**. Existing page callbacks, Gmail request bodies, server handlers, provider calls, state transitions, cache/reload behavior, and exact visible defaults remain frozen.

## Objective

Add a generic action-presentation/availability model and selected-adapter context; add a Gmail adapter that projects the exact current Decision Mode and Management controls; migrate only the two shared pages' hard-coded action rendering and eligibility decisions; prove portability across eight reference workflows; change no provider execution behavior.

## Exact locked routes

Decision Mode consumer:

- Route template: `/agents/[id]/operations/review`
- Locked route file: `web/src/app/agents/[id]/operations/review/page.tsx`
- Exact accepted simple path: `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions&subset_source=review_unit&subset_value=family%3Aoffer_campaign&sender_overview_window=last_month`
- Exact accepted composite path: `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions&subset_source=review_unit&subset_value=review-unit%3Asemantic_parent_subscription_senders_family_marketing_promotional%3Asubtype-marketing_promotional_remainder%3Apattern-promotional_cycle&sender_overview_window=last_month`

Decision Management consumer:

- Route template: `/agents/[id]/operations/management`
- Locked route file: `web/src/app/agents/[id]/operations/management/page.tsx`
- Exact accepted path: `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/management`

No route, query identity, return route, selected review unit/window, filter, link, redirect, or provider target may change.

## Locked source allowlist — exactly eight files

1. `web/src/lib/runtime/decisionWorkspaceActionModel.ts` — new pure action-presentation, availability, adapter, validation, and fail-closed contracts built over the accepted Phase 1 action definitions.
2. `web/src/lib/integrations/gmail/gmailDecisionWorkspaceActionAdapter.ts` — new deterministic Gmail projection of the exact current Decision Mode and Management labels, compatibility values, and state-derived availability.
3. `web/src/components/runtime/DecisionWorkspaceActionContext.tsx` — new selected-adapter context only; no request, stateful lifecycle, cache, timer, model call, or provider invocation.
4. `web/src/app/agents/[id]/operations/layout.tsx` — install the selected Gmail action adapter alongside the accepted presentation/read providers.
5. `web/src/app/agents/[id]/operations/review/page.tsx` — replace only the hard-coded Decision Mode action array with adapter-projected actions; retain the current commit handler and exact destination/return behavior.
6. `web/src/app/agents/[id]/operations/management/page.tsx` — replace only hard-coded action labels/eligibility with adapter-projected operations; retain current push, restore, reopen, reload, status, and error handlers.
7. `web/scripts/workspace-decision-action-model-fixtures.mjs` — add eight-domain generated action/availability fixtures, invalid/unsafe fail-closed cases, and static boundary guards.
8. `web/package.json` — add only the targeted fixture command.

No existing contract, read model, API route, provider helper, database file, migration, cache owner, polling owner, or lifecycle owner may change. If any ninth source file is required, stop and return to the Project Manager for explicit rescope.

## Exact current render/action/provider trace

```text
web/src/app/agents/[id]/operations/layout.tsx
  -> DecisionWorkspacePresentationProvider(gmail)
  -> OperationsWorkspaceShell
       -> DecisionWorkspaceReadProvider(adapterId=gmail)

Decision Mode
  -> web/src/app/agents/[id]/operations/review/page.tsx
       -> hard-coded four-action array (targeted presentation leak)
       -> commitDecision(destinationState)
       -> POST /api/runtime/gmail-destinations
            -> destination commit only; no Gmail mailbox mutation
       -> exact in-place next-subject and close/return lifecycle (frozen)

Decision Management
  -> web/src/app/agents/[id]/operations/management/page.tsx
       -> executionPresentation(profile) hard-coded eligibility/copy (targeted presentation leak)
       -> pushArchive(profile)
            -> POST /api/runtime/gmail-destinations action=push_archive
            -> Gmail remove INBOX label -> verify -> persist execution state
       -> restoreArchive(profile)
            -> POST /api/runtime/gmail-destinations action=restore_archive
            -> Gmail add INBOX label -> verify -> persist reversal state
       -> reopenSender(profile)
            -> existing destination_state_clear memory mutation
       -> existing reload through selected management read service

Separate runtime approval/execution pages
  -> /operations/approvals and /api/runtime/approve + /api/runtime/execute
  -> not currently the owner of Gmail Decision Mode/Management actions
  -> explicitly deferred from Slice 1
```

## Framework / workflow / adapter / provider responsibility matrix

| Layer | Owns | Must not own |
|---|---|---|
| Framework action model | stable action and operation IDs; capability/source binding; effect, risk, approval, reversibility, preview and idempotency metadata; availability states and safe disabled reasons; validation and generic fallbacks | Gmail destination values, Gmail endpoint names, provider scopes, provider receipts, live AI copy generation |
| Published workflow definition | which actions are approved for the workflow/version; governing SOP/rule and prerequisites; permitted roles; human-review policy; deterministic presentation references | live provider authentication; unversioned copy drift; silent cross-tenant learning |
| Domain/provider adapter | visible domain label/description; provider-specific control vocabulary; mapping from framework action to the existing compatibility callback; current state-derived availability; source/capability identity | page lifecycle; provider mutation implementation; approval bypass; fabricated live capability |
| Shared Decision Mode page | render ordered adapter actions; current subject/queue/evidence state; invoke only the existing destination-commit callback; exact next/close/return behavior | hard-coded Gmail action catalog; new provider execution; approval lifecycle |
| Shared Management page | render current adapter operations and existing status; call only the existing push/restore/reopen handlers; route/filter/reload state | hard-coded Gmail eligibility; new retries, receipts, cache invalidation, or provider lifecycle |
| Gmail operational layer | current destination persistence, Gmail label mutation, verification, execution-state recording, and provider errors | framework presentation semantics; actions for other providers; cross-source promises |

## Required action-presentation and availability contract

The new model must reuse the accepted Phase 1 action definition rather than create a second policy truth. It must support:

- adapter, workflow definition/version, runtime instance, subject, source/connection, agent-role, and action identity;
- operation kind: human decision selection, provider execution, reversal, reopen/return, or verification;
- effect, capability, risk, approval, reversibility, preview support, and idempotency requirement;
- deterministic adapter-owned label, explanation, optional caution copy, and control tone;
- availability state: `available`, `unavailable`, `pending`, `executed`, `failed`, or `reverted`;
- structured unavailable reason, governing prerequisite, and source/capability reference;
- a narrowly typed provider-compatibility value used only to call the already-existing page handler;
- stable order and duplicate rejection;
- fail-closed handling for unknown adapters, actions, capabilities, operation kinds, compatibility values, or state combinations.

The model must not claim that a static `requiredCapabilities` declaration proves live connection health or granted provider scope. Slice 1 may expose only deterministic availability already derivable from the current accepted page state. Live connection/scope checks belong to a later separately planned execution-boundary slice.

## Required replacement logic

1. Build the action model as a pure validator/projector over existing Phase 1 definitions. Define no fetch, effect, cache, timer, state store, model call, provider SDK, or mutation method.
2. Add the Gmail adapter with the exact current four Decision Mode actions in the same order and the exact current Management push/restore/reopen labels and eligibility. Do not expose the statically declared unsubscribe action because no accepted live handler exists.
3. Install the action adapter at the existing Operations layout boundary. Preserve the current presentation and read providers and their nesting behavior.
4. In Decision Mode, render the adapter's current actions and pass only its validated compatibility value into the existing `commitDecision` function. Preserve one destination POST per operator decision and exact next/close behavior.
5. In Decision Management, derive displayed controls from the adapter using the current accepted profile/execution state, then call only the existing push/restore/reopen functions. Preserve current request bodies, disabled/busy behavior, success/error copy, and reload points.
6. Keep explicit Gmail provider wording where the adapter owns it. Provider-neutral framework terms do not require genericizing `Push to Gmail`.
7. Missing, unsafe, unsupported, source-unbound, or handler-less actions must not become clickable. Use an approved disabled explanation when the workflow expects the action; otherwise omit it.
8. Add eight-domain generated fixtures and static guards proving the two shared pages no longer own their action catalog/eligibility vocabulary and that no new request or execution path exists.

## Reference-domain action matrix

| Domain/workflow | Human decision examples | Provider operations that an adapter may expose | Required safety proof |
|---|---|---|---|
| Gmail | Keep, Archive, Custom Rule, Not Sure | Push archive, restore archive; unsubscribe remains unavailable until a real handler exists | Gmail source binding, existing approval/risk metadata, existing verification state, no new mutation |
| Customer service | resolve, escalate, defer, reopen | close ticket, issue refund, reassign case | refund requires explicit approval and compensating/receipt truth; support source retained |
| Real estate | shortlist, reject, investigate, hold | request diligence, submit or withdraw an offer | purchase/offer actions unavailable without broker/workflow capability and approval |
| Crypto/investments | watch, hold, reduce, exit | place/cancel/rebalance order | exchange/custody source, high-risk approval, idempotency, receipt and compensating path |
| Multi-source paid media | keep, pause, scale, reduce | pause or change budget per Facebook, Google, TikTok, or email source | same semantic action binds to one exact source; no merged provider control or receipt |
| Bookkeeping | accept, categorize, reconcile, flag | post, reverse, or match a ledger entry | ledger source, materiality policy, reviewer role, reversible audit trail |
| Tax | accept, investigate, escalate, defer | file, amend, or pay only when declared | conservative fail-closed default; reviewer/rule/evidence identity; no generic filing promise |
| Purchasing / spreadsheet / shipping | approve purchase, hold, fulfill, investigate | place order, update records, create shipment, track carrier | each step binds to its own source, agent role, prerequisite, receipt, and workflow stage; never one opaque cross-source action |

Fixtures must also prove that multiple agent roles and sources retain their identity, incompatible operations cannot be aggregated, missing/unsafe metadata fails closed, and non-Gmail adapters cannot inherit Gmail labels or compatibility values.

## Frozen Gmail behavior

Preserve exactly:

- Decision Mode's four current controls, order, wording, destination values, optional-evidence behavior, selected review unit/window, queue/position, next-subject behavior, and exact Close return;
- Management's current counts, buckets, rows, explanations, busy/success/error states, `Push to Gmail`, `Restore`, and `Reopen in Decisions` controls and eligibility;
- one Decision Mode destination-commit POST per decision;
- the existing Management push-archive POST, restore-archive POST, and reopen-memory mutation only when the operator invokes them;
- all current Gmail API request bodies, server validation, authentication/scopes, provider calls, verification, retries, execution-state records, and reload call sites;
- the existing management-summary `15s` cache and single-flight behavior, with no new invalidation or polling;
- all accepted Phase 1-3 counts, charts, groups, rows, windows, evidence, previews, routes, redirects, and provider controls.

## Runtime load declaration

- Problem class: UI grammar/rendering plus pure state-derived action availability.
- Existing Decision Mode write family: at most one `POST /api/runtime/gmail-destinations` per explicit human decision.
- Existing Management write families: at most one archive POST, one restore POST, or one reopen-memory POST per explicit operator click.
- Existing Management read family: the accepted management-summary GET through its `15s` cache/single-flight owner on existing triggers only.
- Polling: none introduced; no cadence change.
- New requests: zero.
- New caches, invalidations, retries, guards, server work, provider SDK calls, or page-load model calls: zero.
- Expected steady-state request count after render: unchanged; zero action requests without an operator action.
- Lifecycle edges intentionally affected: none. The slice changes only which deterministic descriptor supplies visible controls and eligibility.
- Build-pending continuity, Smart Sync/artifact handoff, index freshness, stale-build reclaim, provider execution, approval resolution, and outcome measurement: unchanged.

Any request-count increase, provider action during verification, altered handler body, cache/reload change, duplicate click path, action lifecycle change, or new live capability claim is a failure and requires PM rescope.

## Five implementation slices

1. **Contract** — add pure action presentation/availability types, validator, fail-closed finalizer, and selected-adapter interface.
2. **Gmail adapter** — project exact current Decision Mode and Management controls from accepted static definitions and current compatibility state.
3. **Provider seam** — install the selected adapter context in the existing Operations layout with no lifecycle owner.
4. **Consumers** — replace only hard-coded action rendering/eligibility in Review and Management; preserve every current handler.
5. **Fixtures and proof** — add eight-domain/static guards, run regression/static verification, and capture exact post-settle browser parity.

Each slice requires targeted verification before the next. A non-trivial failure must follow diagnosis -> root-cause execution translation -> bounded correction -> re-verification -> bounded exploratory discovery -> final verification.

## Verification contract

Static and regression proof must include:

- the new `npm run test:workspace-decision-action-model` fixture;
- existing `test:workspace-decision-contract`, `test:workspace-decision-presentation`, and `test:workspace-decision-read-model` fixtures;
- applicable Gmail review-unit, cleanup-assignment, window-projection, mailbox-continuity, optional-evidence, Management, and destination regressions;
- targeted TypeScript/Next source validation;
- targeted ESLint on the exact eight-file allowlist;
- `git diff --check`, pre/post source hashes, exact allowlist comparison, and no ninth source file;
- static proof of zero new `fetch`, route, API, provider SDK, timer, polling, cache, model-call, approval, or execution path;
- static proof that current Decision Mode and Management handler counts/request bodies remain unchanged;
- eight-domain fail-closed coverage, including multi-role purchasing/records/shipping and four-source paid media.

Full post-settle Playwright proof must use `http://localhost:3000`, saved authentication or approved bootstrap, and the exact accepted paths. Ready state requires the canonical URL, decisive heading/cards/rows or Decision Mode subject, no loader/error/overlay, and stable state after settle.

Required evidence:

1. before/after Decision Mode on the simple `1M` route, including the four controls, queue/count truth, evidence, no action click, and exact Close return;
2. before/after Decision Mode on the composite `1M` route, including exact review-unit identity and Close return;
3. before/after Management cold load and `ALL -> ARCHIVE -> CUSTOM_RULE -> QUARANTINE -> KEEP -> ALL` route/filter loop;
4. before/after visible action label and enabled/disabled parity for representative Management states without invoking push, restore, or reopen;
5. DOM/state capture tied to every accepted screenshot;
6. request trace proving existing read families only, zero action POSTs during verifier proof, zero failed requests, and zero `409` churn;
7. console/page-error state;
8. linked-surface parity for counts, rows, route identity, and selected window;
9. a State Transition Matrix with one row per route/control path.

Required closeout fields: `Ready-state satisfied`, signals, settle strategy, artifacts captured post-settle, guard-churn classification, direct verification versus operator assist, `Verification Confidence`, verifier verdict, and Human Review status.

## Rollback

Rollback is source-only: remove the action context/model/Gmail adapter/fixture and package command, restore the layout wrapper, and restore the two pages' pre-slice hard-coded rendering/eligibility from the governed pre-implementation snapshot. No database, provider, artifact, publication, or data rollback is allowed or required.

## Proprietary-brain constraint

Future action proposals and outcomes may inform the tenant-owned proprietary brain only through versioned, inspectable, human-governed, provenance-backed, evaluated, tenant-scoped, and reversible records. This slice implements no training, live AI label generation, uncontrolled self-modification, shared learning, cross-tenant transfer, Workflow Studio, or multi-agent orchestration.

## Authorization update

Oliver accepted the recommended sequence and authorized this exact eight-file/five-slice implementation on 2026-09-02. Execution begins only after the governed combined backup and accepted-baseline Git publication checkpoint pass. Any ninth source file or altered request/provider/lifecycle behavior returns to PM.

## Execution and verification result

The prerequisite backup and accepted-baseline Git publication passed. The exact eight-source-file implementation then completed inside the locked scope. The Verifier returned `ACCEPT / HIGH` after eight-domain/static validation, all required framework and Gmail regression fixtures, TypeScript, targeted lint with zero errors, exact allowlist/diff checks, byte-identical handler proof, and authenticated post-settle Playwright across both exact Review paths and exact Management.

Final clean browser proof preserved the accepted simple `108 / 1 / 107 / 1,030`, composite `43 / 0 / 43 / 132`, and Management `17 / 3 / 2 / 10 / 0 / 2` truth; the four Decision Mode controls retain exact wording/order; Management retains `3` Push, `0` Restore, and `15` Reopen controls in ALL; Close/return and the full filter loop pass; action POSTs, failed requests, `409` churn, settled polling, console errors, page errors, and runtime overlays are all zero. Review packet: `ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE1_REVIEW_PACKET.md`.

Checkpoint Status: continuity checkpoint created. Implementation and verifier acceptance are propagated. Status is `Awaiting Decision`; Human acceptance, Recovery Contract, Human-acceptance backup, implementation commit/push, merge, deployment, provider/data mutation, approval/execution-facade work, later Phase 4 slices, force operations, and lineage deletion remain separately gated.
