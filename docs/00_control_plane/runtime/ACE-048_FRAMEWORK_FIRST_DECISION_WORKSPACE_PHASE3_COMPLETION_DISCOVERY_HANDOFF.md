# ACE-048 Framework-First Decision Workspace Phase 3 — Completion Discovery Handoff

Date: 2026-09-01
Status: `COMPLETED / TARGET-LOCKED; IMPLEMENTATION HUMAN-ACCEPTED / CLOSED`
Governing event: `ACE-048`
Role: Project Manager
Execution mode: `transitional_self_verification`
Problem class: `runtime data-facade boundary with provider-action preservation`

## Operator decision

Oliver replied `accept` on 2026-09-01 to the recommendation for a bounded read-only audit of the remaining Decision Mode and Management read boundaries.

This is the next bounded task in the same ACE-048 Automata framework-first program. It is not a new project. The approval authorizes discovery and target locking only; it does not authorize source, UI, runtime, provider, or data implementation.

## Compact control-plane delta

- Active ACE: `ACE-048`, unchanged.
- Active phase: Phase 3 generic runtime/data facade, completion discovery.
- Last propagated point: Phase 3 Slice 3 Sender Overview Human acceptance, Recovery Contract, and verified Human-acceptance backup.
- Governing truth changed: Oliver approved the read-only completion audit defined here.
- Accepted-fix status changed: no; Phases 1-2 and Phase 3 Slices 1-3 remain Human-accepted and closed under their Recovery Contracts.
- Approved scope: read-only repository discovery and, only if useful, non-mutating runtime inspection of remaining Decision Mode and Management read boundaries.
- Implementation authority: none.

## Executive summary

### What is being examined

Determine whether Decision Mode or Decision Management still reads Gmail-shaped data directly where the shared framework should own a provider-neutral read contract, while keeping provider actions and execution controls explicitly provider-specific.

### What Oliver will get

An operator-readable recommendation and either one exact, bounded, target-locked next slice or a precise explanation that the remaining work belongs in Phase 4 capability/action design rather than Phase 3.

### Why it matters

This prevents a generic read-facade cleanup from accidentally changing decisions, approvals, provider actions, or execution lifecycle behavior. It also tells us when Phase 3 is genuinely complete instead of inventing another slice.

## Discovery objective

Prove the exact render, import, data, cache, request, lifecycle, and capability path for the remaining Decision Mode and Decision Management surfaces, then classify each seam as one of:

1. portable read-model work that belongs in a bounded Phase 3 slice;
2. provider capability/action behavior that belongs in separately planned Phase 4;
3. already generic and requiring no change.

## Required discovery work

- Trace the exact shared render path and selected-adapter path for Decision Mode and Decision Management.
- Identify every direct Gmail-shaped read dependency still consumed by shared pages/components.
- Separate read-only evidence, recommendation, decision-history, progress, and management-summary semantics from provider operations, approvals, destinations, execution receipts, retries, and lifecycle mutation.
- Identify request families, caches, polling, transient guards, lifecycle ownership, and close/return state that must remain unchanged.
- Test the proposed vocabulary and contracts against Gmail, customer service, real estate, crypto/investments, four-source paid media, bookkeeping, tax, and multi-role/multi-source purchasing and shipping.
- Preserve workflow definition/version, runtime instance, source, role, provenance, freshness, quality, semantic metric, decision, and action-capability identity without assuming one provider, one workflow, or one agent.
- Determine whether a safe Phase 3 target can be locked without touching capability/action behavior.

## Required output

Return an operator-readable recommendation with:

- what would change;
- what Oliver would get;
- why it matters;
- exact problem-class classification;
- exact route/render/import/request/lifecycle proof;
- framework-owned versus adapter-owned versus provider-operational responsibilities;
- either an execution-ready PM Brief with one authoritative locked route/file allowlist and acceptance proof contract, or a candidate-grounded blocker that explains why the work must move to Phase 4 planning.

If an execution-ready Phase 3 slice is recommended, implementation must remain behind a new explicit implementation decision. If the remaining seam is inseparable from provider actions or lifecycle mutation, stop at the Phase 4 planning recommendation; do not silently broaden the phase.

## Accepted regression boundary

Preserve all Human-accepted Phase 1, Phase 2, and Phase 3 Slices 1-3 behavior and their Recovery Contracts, including:

- stable routes and route/query identity;
- Gmail counts, groups, charts, windows, rows, pagination, evidence, recommendations, Decision Mode close/return, and Management truth;
- existing request families, caches, polling cadence, transient guards, and lifecycle ownership;
- explicit Gmail provider controls and action semantics;
- zero live model calls for presentation/read labels;
- versioned, inspectable, human-governed, provenance-backed, evaluated, and reversible proprietary-brain constraints;
- multiple workflow, source, and agent-role identity.

## Hard boundaries

Do not implement UI/runtime changes, edit source files, rename or alias routes, mutate providers/data/databases/artifacts/indexes/publication, invoke provider actions, create requests or polling, change caches or lifecycle behavior, implement Workflow Studio, proprietary-brain UI, shared learning, marketplace behavior, or multi-agent orchestration, commit, push, or deploy.

Runtime inspection, if useful, must be non-mutating and use the accepted exact local route identity. Do not choose a provider action or change durable application state.

## Minimum context for the fresh task

Primary runtime artifact:

- `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_COMPLETION_DISCOVERY_HANDOFF.md`

Targeted supporting context only:

- `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_REFACTOR_PM_BRIEF.md` — Phase 3/Phase 4 boundary and framework contract.
- `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE3_REVIEW_PACKET.md` — latest accepted Gmail/runtime proof and preserved behavior.
- Targeted ACE-048 slices in `CURRENT_STATE.md`, `TODO.md`, and `ACTIVE_CHANGE_EVENTS.md`.

Do not reload unrelated historical packets unless discovery reveals a direct dependency.

## Authority boundary

Discovery and target locking are authorized. Implementation, provider/data mutation, Phase 4 behavior changes, commit, push, and deployment are not authorized.

## Discovery result

Repository tracing resolved the phase boundary without runtime contact.

- Decision Mode's workspace, queue, window, distribution, evidence, preview, pagination, and close/return reads already use the accepted Item Overview service or generic Operations evidence helpers.
- The remaining direct shared read leak is `fetchGmailDecisionManagementSummary`, called once from Decision Mode's review page and once from Decision Management.
- The helper owns an existing `15s` in-memory/localStorage cache and per-key single-flight around `GET /api/runtime/gmail-memory?view=decision_management`; the server read is bounded to `500` destination profiles and `200` recent events.
- Decision Mode's one destination commit, Management's push/restore calls, and Management's reopen-memory write are provider-operational behavior and remain outside Phase 3.
- The safe final Phase 3 slice is a selected-adapter managed decision-state read service consumed by both pages, with the existing action seams frozen.

Authoritative execution-ready brief:

`docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE4_DECISION_MANAGEMENT_READ_FACADE_PM_BRIEF.md`

## Target lock

- Primary route: `/agents/[id]/operations/management`.
- Linked Decision Mode route: `/agents/[id]/operations/review`.
- Locked source allowlist: exactly six files, listed in the PM Brief.
- Target-lock source: `inferred_target_lock` from layout/provider composition, import/call/request/cache/server-read/action tracing, and accepted Phase 2/Slice 3 runtime artifacts.
- Execution readiness: target-locked and execution-ready only after Oliver explicitly returns `ACCEPT PHASE 3 SLICE 4 IMPLEMENTATION`.

Runtime inspection was not used because repository proof plus accepted post-settle artifacts resolved the remaining boundary without contacting providers or runtime state.

Checkpoint Status: `none` — discovery findings, exact target lock, execution-ready PM Brief, and the separate implementation decision gate are propagated. No implementation is authorized.
