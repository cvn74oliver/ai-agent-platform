# ACE-048 Framework-First Decision Workspace Phase 2 — Discovery Handoff

Date: 2026-08-31
Status: `COMPLETED — TARGET LOCK ACCEPTED / SUPERSEDED BY PHASE 2 PM BRIEF`
Governing event: `ACE-048`
Execution mode: `transitional_self_verification`
Reasoning level: `HIGH` for bounded cross-page UI ownership discovery; escalate only if render-path authority remains materially ambiguous
Problem class: `UI grammar / rendering`
Execution readiness: `target-locked / execution-ready after separate Oliver authorization`
Target-lock status: `RESOLVED — inferred_target_lock`

## Executive summary

### What is changing

Phase 2 will identify the exact shared presentation path that currently makes Gmail-specific language appear to be platform language, then define a provider-neutral presentation contract for Automata's reporting and human-decision workspace.

### What the operator will get

A concise recommendation showing which names, labels, navigation concepts, metrics, assistant prompts, and workspace explanations should become framework-owned, which Gmail controls must remain provider-specific, and the exact route/file set required for a safe implementation.

### Why it matters

The same interface must make sense for customer service, real estate, crypto, paid media, bookkeeping, tax, and arbitrary future integrations without weakening the already accepted Gmail workflow.

## Carry-Forward Context

- Control plane: Phase 1 Human-accepted, Recovery Contract recorded, milestone backup complete; Phase 2 discovery newly active
- Governing ACE: `ACE-048`
- Active phase: Phase 2 discovery / target lock
- Last propagated point: Phase 1 closeout plus Oliver's 2026-08-31 authorization to proceed with the recommended Phase 2 discovery
- Governing truth changed since last propagation: YES — Phase 2 discovery is now authorized
- Accepted-fix status changed: NO — Phase 1 remains accepted and closed
- Approved scope: read-only discovery, recommendation, and target lock only
- Authoritative Phase 1 plan: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_REFACTOR_PM_BRIEF.md`
- Accepted Phase 1 review: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE1_REVIEW_PACKET.md`
- Canonical generic contract: `web/src/lib/runtime/decisionWorkspaceContract.ts`

## Objective

Prove the authoritative shared render path and produce a decision-ready Phase 2 recommendation for provider-neutral presentation and workspace-shell vocabulary. If discovery resolves one exact implementation path, produce an execution-ready PM Brief with locked routes/files and a bounded verification contract. Do not implement the recommendation in this task.

## Feature domain

Shared Agents/Operations presentation and decision-workspace grammar, including:

- top-level and sidebar navigation labels
- page names and explanatory copy
- generic subject, activity, recommendation, decision, action, and outcome vocabulary
- summary-card labels such as the currently misleading `Senders in review`
- assistant context and suggested prompts
- shared workspace/window explanations
- visible distinction between framework-owned controls and Gmail/provider-operational controls

## Discovery scope

1. Trace the active import/render chain for the shared Operations shell and the Intelligence, Cleanup Groups, Overview, Decision Mode, and Management surfaces.
2. Inventory visible strings and DTO/view-model fields as one of:
   - framework-owned and provider-neutral
   - adapter-provided domain vocabulary
   - provider-operational and intentionally specific
   - legacy/historical and separately migrated
3. Test the proposed vocabulary against Gmail, customer service, real estate, crypto, multi-source paid media, bookkeeping, and tax reference cases.
4. Recommend a shared presentation metadata contract that consumes the accepted Phase 1 decision-workspace contract without duplicating Workflow Studio ownership.
5. Preserve current routes initially. Treat route renames or aliases as a separate compatibility decision.
6. Return one of:
   - `target-locked / execution-ready` with exact locked route/file set and PM Brief, or
   - `candidate-grounded / blocked` with the precise remaining ambiguity and minimum next discovery step.

## Constraints and exclusions

- Read-only discovery by default.
- No source edits outside control-plane/discovery artifacts.
- No visible UI/runtime implementation.
- No route rename or alias implementation.
- No provider connection, Gmail access, Smart Sync, indexing, database, artifact, publication, polling, or lifecycle mutation.
- No Automations Workflow Studio, marketplace, shared-learning, or proprietary-brain UI implementation.
- No Decision Mode or Management behavior change.
- No commit, push, deployment, or worktree integration.
- Preserve all accepted Gmail data, cleanup groups, Sender Distribution, Time Context, Pressure Trend, workflow rows, and Decision Mode behavior as frozen regression truth.
- Preserve unrelated dirty state.

## Accepted discovery surfaces

- Repository import/render-chain evidence for the exact shared Operations shell and affected pages
- Current accepted canonical Operations routes, using the existing agent identity and required query identity when runtime inspection is useful
- Existing screenshots and accepted Phase 1 contract fixtures as product-context evidence
- A cross-domain vocabulary matrix covering all seven Phase 1 reference definitions
- A provider/core boundary table identifying Gmail-specific controls that must remain explicit

## Verification expectations

- Discovery claims must cite exact routes, components, view models, and ownership seams.
- Candidate files must never be mislabeled as locked files.
- If browser inspection is used, it is PM discovery evidence, not accepted-fix verification.
- No Playwright accepted-fix artifact bundle is required because implementation is prohibited; explain any browser tooling used.
- The final recommendation must include: what changes, what the operator gets, why it matters, tradeoffs, regression protections, and target-lock classification.
- Ask: `What else breaks under realistic use by a non-Gmail integration?`

## Regression protections for the later execution plan

- Gmail-specific provider actions and controls remain explicit and are not renamed into misleading generic operations.
- Shared labels derive from presentation metadata or generic contract truth, not provider-shaped DTO names.
- Metrics retain semantic definitions and do not aggregate across incompatible sources.
- Current route/query identity and accepted linked-surface parity remain stable unless separately approved.
- Provider-neutral wording must remain understandable without exposing internal architecture terms to operators.

## Thread-retirement boundary

The prior Project Manager task is retired because Phase 1 closed, Phase 2 is a materially new work unit, and the prior thread accumulated multiple major passes. This handoff is the authoritative portability layer. No material unpropagated state remains in the retiring task.

Discovery completed and Oliver accepted the target-locked direction on 2026-08-31. The authoritative successor is `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE2_PM_BRIEF.md`. That brief records logged deferred execution; implementation still requires a separate explicit decision.

Checkpoint Status: `none` — this discovery artifact is retired and the recommendation, target lock, product framing, and deferred-execution state are captured in the successor PM Brief and control plane.
