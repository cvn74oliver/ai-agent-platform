# ACE-048 Framework-First Decision Workspace Phase 4 Discovery Handoff

Date: 2026-09-02
Status: `DISCOVERY COMPLETED / TARGET-LOCKED; IMPLEMENTATION AWAITING EXPLICIT DECISION`
Governing event: `ACE-048`
Active phase: `Phase 4 — Capability-driven Decision Mode and Management discovery`
Mode: `PLAN MODE — read-only discovery and target locking`
Problem class: `mixed / unresolved — UI action grammar, provider capability boundary, approval policy, and execution lifecycle`
Reasoning level: `EXTRA-HIGH — cross-layer capability/action boundary over Human-accepted Gmail behavior`

## Executive summary

### What is changing

Nothing is being implemented in this pass. The Project Manager will trace the existing Gmail Decision Mode and Decision Management action paths and determine the smallest safe provider-neutral capability/action boundary.

### What Oliver will get

An operator-readable recommendation and either one exact target-locked, execution-ready Phase 4 slice or a precise candidate-grounded blocker. Any implementation will remain behind a separate explicit decision.

### Why it matters

Phases 1-3 generalized what the system understands, displays, and reads. Phase 4 must generalize how an approved decision can become a controlled provider action without inventing unsupported actions, hiding provider semantics, or conflating recommendation, decision, approval, execution, receipt, rollback, and measured outcome.

## Authority

Oliver returned `ACCEPT PHASE 4 DISCOVERY` on 2026-09-02.

This authorizes only bounded read-only repository discovery and, only if necessary, read-only runtime inspection. It does not authorize source/UI/runtime implementation, action invocation, provider or data mutation, database/artifact/index/publication changes, new requests or polling, commit, push, deployment, Workflow Studio, proprietary-brain UI, shared learning, marketplace work, or multi-agent orchestration.

## Carry-forward context

- Control Plane: phase delta recorded; `ACE-048` unchanged.
- Prior status: Phases 1-3 Human-accepted, recovery-backed, and closed.
- Accepted-fix status: unchanged.
- Governing truth change: Phase 4 discovery is now authorized; Phase 4 implementation remains unauthorized.
- Accepted Gmail behavior: frozen regression truth.
- Execution mode: `transitional_self_verification` for any later separately authorized implementation; this pass is PM discovery only.
- Authoritative parent plan: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_REFACTOR_PM_BRIEF.md`.
- Latest accepted action/read boundary: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE4_DECISION_MANAGEMENT_READ_FACADE_PM_BRIEF.md`.
- Latest accepted proof: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE4_REVIEW_PACKET.md`.

## Discovery objective

Prove the exact shared, adapter, API, provider, approval, lifecycle, and return-state paths for Decision Mode and Decision Management actions, then separate:

1. framework-owned capability/action/approval/lifecycle contracts;
2. workflow-owned declared action policy and presentation;
3. provider-adapter execution mapping and provider-specific controls;
4. existing Gmail behavior that must remain frozen;
5. later work that does not belong in the first Phase 4 slice.

## Required discovery work

- Trace Decision Mode action rendering, selection, decision capture, evidence, close/return, and any provider-action call path.
- Trace Decision Management push, restore, reopen, destination commit, history, retry, receipt, and cache invalidation seams.
- Identify existing action catalogs, capability declarations, approval policy, risk/reversibility, idempotency, execution lifecycle, receipts, and rollback contracts.
- Identify every request family, cache, poller, transient guard, lifecycle owner, provider write, and downstream state refresh that a later implementation must preserve or explicitly govern.
- Prove whether the first slice can remain additive and fail closed without altering existing Gmail semantics or invoking provider actions.
- Test the proposed contract against Gmail, customer service, real estate, crypto/investments, multi-source paid media, bookkeeping, tax, and multi-role/multi-source purchasing, spreadsheet, inventory, and shipping workflows.
- Preserve source, workflow definition/version, runtime instance, agent role, provider connection, provenance, approval actor, execution receipt, outcome, and tenant identity.

## Candidate accepted surfaces

These are discovery candidates, not yet target-locked implementation surfaces:

- `/agents/[id]/operations/review` including in-place Decision Mode and exact close/return state;
- `/agents/[id]/operations/management`;
- selected Decision Workspace action/catalog contracts and Gmail adapter seams;
- existing Gmail API/provider operation helpers reached by those surfaces;
- static/generated contract fixtures only if they are selected in the final target lock.

## Frozen regression boundary

- All Human-accepted Gmail counts, groups, windows, charts, rows, pagination, evidence, optional-evidence behavior, recommendations, decisions, management summaries, and close/return identity.
- Explicit Gmail provider controls and truthful Gmail action names.
- Existing request families, caches, single-flight behavior, polling cadence, transient guards, lifecycle ownership, and provider-write behavior.
- Routes and query identities.
- Provider/data/database/artifact/index/publication state.
- No page-load model calls or nondeterministic action generation.
- Proprietary-brain improvement remains versioned, inspectable, human-governed, provenance-backed, evaluated, tenant-scoped, and reversible.

## Required output

- operator-readable recommendation;
- exact problem-class classification;
- exact route/render/import/API/provider/lifecycle trace;
- framework/workflow/adapter/provider responsibility matrix;
- reference-domain capability/action matrix;
- load declaration for any proposed implementation;
- exact locked file/route allowlist and verification contract, or a precise candidate-grounded blocker;
- separate explicit implementation decision gate.

## Discovery result

- Problem class resolved from mixed/unresolved to `UI grammar / rendering with a read-only capability-availability boundary` for the first slice.
- The exact live action leaks are the hard-coded Decision Mode action array in `operations/review/page.tsx` and `executionPresentation`/hard-coded Management controls in `operations/management/page.tsx`.
- The accepted Phase 1 contract already owns action capability, effect, risk, approval, reversibility, preview, idempotency, lifecycle, provider receipt, and rollback semantics.
- The Gmail adapter contract already declares static action/capability policy, but static declaration is not live provider availability.
- Current destination commit, push archive, restore archive, verification, reopen, reload, and return-state owners are explicit Gmail paths and must remain unchanged in the first slice.
- The separate runtime approval/execution pages are not currently the owner of these Gmail actions; connecting them now would expand the lifecycle and is deferred.
- The safest first slice is deterministic adapter-selected action presentation and fail-closed availability with zero new request, cache, poller, model call, provider action, or lifecycle owner.
- Exact target lock: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE1_ACTION_PRESENTATION_PM_BRIEF.md`.
- Dirty Git/publication truth is separately captured in `docs/00_control_plane/runtime/ACE-048_GIT_PUBLICATION_SAFETY_AUDIT.md`; no commit or push occurred.

## Checkpoint

Checkpoint Status: continuity checkpoint created. Phase 4 discovery is complete and the exact eight-file first-slice target lock is captured. No product implementation, provider action, commit, push, or deployment is authorized by this discovery closeout.
