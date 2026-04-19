# ACTIVE_CHANGE_EVENTS.md

## Purpose
This file tracks active architectural, product, workflow, UI, and operating-model decisions that have changed and still require propagation across code, documentation, and operating context.

## Rules
- Only include changes that are still live and not fully propagated.
- Each change event must be specific and scoped.
- When all related docs/code are updated, mark the event completed or move it to a completed section later.
- This file is a control-plane document, not a brainstorming document.
- Propagation status must be explicit.
- Completed change events must be moved out of the Active section and placed in the Completed section with their final propagation state preserved.




## Active Change Events



### [ACE-046] Analysis Rail Remaining Stability + Time Truth Cleanup

Date: 2026-04-09  
Owner: PM  
Status: Active  
Propagation Owner: Codex

Decision:
- The remaining Analysis Rail issue package is now governed by a separate post-ACE-045 cleanup lane.
- This lane must proceed in the following ordered phases:
  - Phase 1 — Rail Stability / Request Discipline
    - eliminate overlapping Sender Distribution request churn
    - resolve `already_running` / cooldown contention
    - stabilize scope switching behavior (`All indexed`, `1Y`, `1Q`, `1M`, `1W`)
    - clarify/normalize the authoritative scoped request path for protected/trusted senders
  - Phase 2 — Time Truth / Coverage Congruence
    - accepted and complete as the scoped Time Context state-model rebuild on the review page
    - route params are the durable scoped authority
    - bucket focus is local-only
    - default overview gate is baseline-only
    - scoped transitions use one navigation path and one workspace coordinator
  - Phase 3 — Canonical Time Context Truth Model Implementation
    - build one canonical daily sender-time fact model
    - add exact bucket span metadata
    - unify live-route, workspace-snapshot, and artifact/bootstrap timeline derivation
    - render `all_indexed` as full-history monthly truth when canonical data exists
    - eliminate scope-local recomputation inside visible Time Context derivation
    - keep the invariant: same dates = same senders = same counts
- This lane must remain separate from:
  - accepted runtime continuity work
  - accepted Time Context render-authority work
  - accepted coverage/backfill display work
  - accepted Sender Distribution `All indexed` reconciliation work
  - accepted hero/layout cleanup
  - unrelated copy polish or broader shell redesign

Reason:
- The prior Analysis Rail hardening lanes are accepted and closed, but the remaining Time Context work still exposes cross-scope contradictions because multiple derivation paths can produce different visible stories for the same dates.
- The next work must be phased and preserved in order so it is not lost or merged into unrelated follow-on cleanup.
- PM review established that separate scoped universes are not acceptable product behavior for Time Context; one visible truth model must govern all scopes.

Affected product areas:
- Operations Review
- Shared Analysis Rail review surface

Affected code areas:
- `review/page.tsx`
- `gmailCleanupWorkspace.ts`
- `inboxAnalysis.ts`
- `gmailArtifactFullMailboxProjector.ts`
- `runtimeStateService.ts`
- related Shared Analysis Rail presentation components, only when required by the phased lane scope

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md` when a minimal operating-model clarification is required

-Notes:
  - Phase order is governing truth and must be preserved:
    - Phase 1 first
    - Phase 2 second
    - Phase 3 third
  - Newly accepted runtime stabilization sub-fix under this active lane:
    - build-pending and failed-artifact request-flood conditions on the canonical protected-trust review route are now resolved
    - runtime now maintains a bounded single-owner polling pattern across:
      - `/api/agents/playground`
      - `/api/integrations/gmail/mailbox-index`
      - `/api/integrations/gmail/inbox-analysis`
    - no repeated relaunch loops, no multi-owner polling, and no 409 churn under both:
      - `build_pending_showing_stable_snapshot`
      - failed-artifact steady-state rehydrate
    - this establishes a stable runtime baseline required for further Phase 3 work
    - Recovery Contract: `CHANGELOG.md` -> `April 13, 2026 — ACE-046 Runtime Request-Flood Stabilization (Build-Pending + Failed-Artifact) Accepted`
- Historical post-stabilization runtime blocker under this active lane:
  - the canonical protected-trust review route previously failed on a server-side `inbox-analysis` `500`
  - root cause was a missing helper import in `gmailCleanupWorkspace.ts` on the `buildSenderWorkspaceActivityTimelineFromRows(...)` call path
  - the narrow runtime repair removed the `ReferenceError` and restored the blocked server execution path
  - this runtime blocker is no longer the governing Phase 3 blocker, but remains important historical continuity for this lane until accepted-fix closeout propagation is fully aligned
- Newly discovered governing Phase 3 truth under this active lane:
  - the remaining blocker is no longer route survival; it is timeline derivation inconsistency across the Analysis Rail surfaces
  - root cause = timeline derivation inconsistency
  - problem class = source / index truth
  - required fix = canonical timeline contract (`ace046_phase3_timeline_v1`)
  - Phase 3 — Canonical Time Context Truth Model is blocked by:
    - timeline derivation inconsistency across:
      - Time Context
      - Sender Distribution
      - workflow narrowing
    - multiple competing timeline models:
      - sender_activity (single-bucket assignment — invalid)
      - message_pressure (row-based — valid but separate)
    - bucket click-through not using canonical interval bounds
    - inconsistent timezone / boundary handling
  - Time Context, Sender Distribution, Sender Overview workflow filtering, and Mailbox Intelligence / Pressure Trend currently expose multiple metric families and multiple derivation paths that can produce conflicting visible stories
  - Phase 3 must now be governed by one canonical timeline contract, not by chart-local or scope-local recomputation
  - the canonical model must explicitly separate:
    - sender activity truth
      - metric = distinct active senders in bucket
      - bucket membership = sender had at least one qualifying message in the bucket
    - message pressure truth
      - metric = supporting messages in bucket
      - bucket membership = qualifying messages received in the bucket
  - Pressure Trend / Mailbox Intelligence message bars must not be treated as sender-count proof surfaces
  - Time Context must visibly declare its metric family and bucket semantics so operator validation does not depend on implied interpretation
  - exact bucket-span metadata is now required for every visible timeline bucket, including:
    - bucket start
    - bucket end
    - grouping kind
    - metric family
    - exact click-through filter contract
  - same dates must reconcile across daily, weekly, monthly, yearly, and full-history views when the metric family is the same
  - rolling windows and calendar buckets must not be conflated:
    - rolling `7d` / `30d` are distinct from calendar month / quarter buckets
    - clicking a calendar bucket must filter to that bucket only, with no bleed from adjacent months/quarters
  - execution is blocked unless all Time Context derivation paths switch to the canonical model in the same pass
  - partial migration across live route, workspace snapshot, artifact/bootstrap seed, or chart-local bucket math is invalid
- Accepted runtime continuity sub-fix under this active lane:
  - build-liveness reconciliation before continuity emission is accepted and complete
  - runtime now uses reconciled `build_is_live` truth instead of raw publication-row `build_status` alone
  - stale/dead build rows are reclaimed before continuity evaluation
  - Recovery Contract: `CHANGELOG.md` -> `April 9, 2026 — ACE-046 Runtime Continuity Build-Liveness Reconciliation Accepted`
- Accepted runtime sub-fix under this active lane:
  - Smart Sync -> artifact rebuild handoff is accepted and complete
  - Smart Sync completion now triggers or observes the expected artifact rebuild handoff without manual refresh
  - generic cooldown / `flag_disabled` gating no longer suppresses the required handoff
- Accepted runtime enforcement sub-fix under this active lane:
  - runtime guardrail enforcement is accepted and complete
  - continuity execution matrix is now enforced during build-pending runtime continuity
  - lifecycle polling is bounded and same-edge refreshes coalesce instead of stacking
  - critical lifecycle edges bypass stale publication-cache reads while steady-state caching remains intact
  - guarded heavy-action consumers attach instead of relaunching overlapping runtime work
- Newly discovered governing Phase 2 interaction truth under this active lane:
  - current product behavior allows Time Context and Sender Distribution bar clicks to drive an unintended full narrowed render / workflow collapse behavior
  - corrected product truth is:
    - bar click = local chart focus only
    - chart retains surrounding context
    - in-focus details may update
    - workflow sender universe must not collapse from chart click alone
    - clearing narrowed state should not be required to recover from an unintended isolated render
  - this is a product-truth clarification for the next scoped correction pass, not a runtime/data-truth rewrite
  - likely hot files:
    - `web/src/app/agents/[id]/operations/review/page.tsx`
    - `web/src/components/runtime/GmailCleanupComponents.tsx`
- Accepted Phase 2 closeout under this active lane:
  - protected-trust `all_indexed` review truth remains preserved at canonical `1844`
  - sender workspace / sender distribution parity for that restored `all_indexed` baseline remains preserved
  - scoped Time Context page-state orchestration is now accepted on the review route
  - accepted live proof on the canonical protected-trust route confirms:
    - `7d`
    - `30d`
    - `90d`
    - `365d`
    - no render loop
    - no red overlay
    - no flicker on the accepted run
    - bucket isolation confirmed on scoped `30d`
  - Recovery Contract: `CHANGELOG.md` -> `April 11, 2026 — ACE-046 Phase 2 — Scoped Time Context State-Model Rebuild Accepted`
- Do not reopen accepted `ACE-040`, `ACE-042`, `ACE-043`, `ACE-044`, or `ACE-045` while this lane is active.
- Phase state:
  - Runtime continuity build-liveness reconciliation: ✅ accepted and complete
    - Recovery Contract: `CHANGELOG.md` -> `April 9, 2026 — ACE-046 Runtime Continuity Build-Liveness Reconciliation Accepted`
  - Phase 1 — Rail Stability / Request Discipline: ✅ accepted and complete
    - Recovery Contract: `CHANGELOG.md` -> `April 9, 2026 — ACE-046 Phase 1 — Rail Stability / Request Discipline Accepted`
  - Smart Sync -> artifact rebuild handoff: ✅ accepted and complete
  - Runtime guardrail enforcement layer: ✅ accepted and complete
    - Recovery Contract: `CHANGELOG.md` -> `April 10, 2026 — ACE-046 Runtime Guardrail Enforcement Layer Accepted`
  - Runtime request-flood stabilization (build-pending + failed-artifact): ✅ accepted and complete
    - Recovery Contract: `CHANGELOG.md` -> `April 13, 2026 — ACE-046 Runtime Request-Flood Stabilization (Build-Pending + Failed-Artifact) Accepted`
  - Phase 2 — Time Truth / Coverage Congruence: ✅ accepted and complete
    - Recovery Contract: `CHANGELOG.md` -> `April 11, 2026 — ACE-046 Phase 2 — Scoped Time Context State-Model Rebuild Accepted`
  - Phase 3 — Canonical Time Context Truth Model Implementation: preserved as historical continuity only; direct implementation is not the active lane while `ACE-047` Phase 2 governs execution

---

### [ACE-047] Time Context Rebuild

Date: 2026-04-16  
Owner: PM  
Status: Active  
Propagation Owner: Codex

Decision:
- Time Context is now governed as a spec-driven phased rebuild lane.
- Governing documents for this lane are now:
  - `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_SPEC.md`
  - `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
- Active phase:
  - Phase 2 — Scope Semantics Lock
- Phase 1 — Runtime Safety / Churn Containment is now complete and accepted.
- Phase 2 now governs the next executable work for this lane.
- Execution model:
  - phased rebuild
  - spec-driven
  - no implementation may proceed outside the active defined phase

Reason:
- PM review established that Time Context work must no longer proceed as ad hoc fixes.
- The authoritative spec and phased plan now govern Time Context behavior and sequencing.
- Runtime safety must be re-locked first so later Time Context validation is trustworthy and does not reintroduce request churn or Supabase-risking load.

Affected product areas:
- Operations Review
- Shared Analysis Rail review surface
- canonical protected-trust review route during runtime diagnosis

Affected code areas:
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/app/agents/[id]/operations/review/page.tsx`
- `web/src/lib/runtime/runtimeStateService.ts` for accepted runtime safety / READY unblock work only

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md` only if a new operating-model rule is required

Notes:
- Historical continuity:
  - prior `ACE-046` runtime request-flood stabilization remains accepted historical truth
  - prior `ACE-047` verification-discipline intent remains historical context only and no longer governs the immediate next step
- Phase 1 complete:
  - eliminated mailbox-index poll loop caused by stale `active_run` gating
  - runtime now polls only when `execution_state === 'running'`
  - cold load, scope switching, and idle now operate with zero unnecessary churn
- Recovery Contract: `CHANGELOG.md` -> `April 16, 2026 — Phase 1 Runtime Safety Fix`
- Accepted runtime READY unblock:
  - runtime READY blocker is resolved on the canonical protected-trust review route
  - canonical route now reaches READY within the locked protocol window
  - baseline runtime snapshot now attaches without blocking on heavy selected-cluster bootstrap
  - `rehydrate_only` returns a minimal same-scope baseline rail seed from already-loaded cleanup discovery data
  - heavy selected-cluster rail-family bootstrap, artifact bootstrap, and deep rail hydration remain deferred from the initial baseline attach path
  - this unblocks Phase 2 final post-settle verification
- Recovery Contract: `CHANGELOG.md` -> `April 16, 2026 — ACE-047 Runtime READY Unblock Accepted`
- Governing execution rule:
  - no further Time Context implementation may proceed outside the phased rebuild order
  - no implementation may proceed outside the currently active defined phase

---

### [ACE-001] Cleanup Groups — Marketing Unit-Only Entry Model

Date: 2026-04-01  
Owner: PM  
Status: Active  
Propagation Owner: Codex

Decision:
- Marketing cleanup group (`semantic.marketing_subscriptions`) is now strictly unit-entry only.
- Parent-level broad review is blocked.
- All entry must go through a valid review unit.
- Invalid, missing, and blank unit routes are explicitly blocked with no fallback.

Reason:
- Prevents ambiguity in review scope.
- Enforces the first-click workflow contract.
- Eliminates silent broad-parent fallback.

Affected product areas:
- Cleanup Groups
- Review Page (Marketing only)

Affected code areas:
- `review/page.tsx`

Docs requiring propagation:
- `03_gmail_workspace/04_sender_decision_ui/06_cleanup_groups/Cleanup_Groups_spec_phase_plan.md`
- `03_gmail_workspace/04_sender_decision_ui/06_cleanup_groups/CLEANUP_GROUP_REDISCOVERY_IMPLEMENTATION_PLAN.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`

Notes:
- Behavior is implemented but not fully reflected across all Cleanup Groups documentation.

---

### [ACE-002] Cleanup Groups — Marketing Review-Unit Truth Model (Hero + Handoff)

Date: 2026-04-01  
Owner: PM  
Status: Active  
Propagation Owner: Codex

Decision:
- Marketing review page hero and decision handoff now use unit-scoped truth only.
- Parent totals are no longer allowed in KPI positions.
- Unit counts must come from the full unit dataset, not the page slice.

Reason:
- Eliminates “what am I reviewing?” confusion.
- Aligns top-of-page truth with workflow truth.

Affected product areas:
- Cleanup Groups
- Review Page

Affected code areas:
- `review/page.tsx`

Docs requiring propagation:
- `03_gmail_workspace/04_sender_decision_ui/06_cleanup_groups/Cleanup_Groups_Discovery_Spec_(Artifact-Driven).md`
- `03_gmail_workspace/04_sender_decision_ui/04_workflow_integration/decision_ui_flow.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`

Notes:
- Docs still partially describe parent-scoped summaries.

---

### [ACE-003] Time Context — Row-Backed Monthly Truth (All Indexed Fix)

Date: 2026-04-01  
Owner: PM  
Status: Active  
Propagation Owner: Codex

Decision:
- `All Indexed` timeline is now built from real selected-cluster rows.
- Bucket counts = distinct senders active in that month.
- Message counts = real indexed messages in that month.

Reason:
- Previous implementation produced misleading data.
- Required for trust in the Shared Analysis Rail.

Affected product areas:
- Time Context
- Shared Analysis Rail

Affected code areas:
- `inboxAnalysis.ts`
- `gmailCleanupWorkspace.ts`
- `GmailCleanupComponents.tsx`

Docs requiring propagation:
- `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
- `03_gmail_workspace/04_sender_decision_ui/01_analysis_rail/Shared_Rail_Analysis_spec.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`

Notes:
- Docs still reference older timeline logic.

---

### [ACE-004] Time Context — Bucket Truth vs Workflow Scope Clarification

Date: 2026-04-01  
Owner: PM  
Status: Active  
Propagation Owner: Codex

Decision:
- Bucket bars = distinct active senders.
- Supporting messages = email volume.
- Bucket counts are non-additive.
- Workflow scope remains authoritative.

Reason:
- Prevents misinterpretation of chart data.

Affected product areas:
- Time Context
- Shared Analysis Rail

Affected code areas:
- `GmailCleanupComponents.tsx`

Docs requiring propagation:
- `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
- `03_gmail_workspace/04_sender_decision_ui/01_analysis_rail/Shared_Rail_Analysis_spec.md`
- `03_gmail_workspace/04_sender_decision_ui/02_distribution_chart/SENDER_DISTRIBUTION_CHART_SPEC.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`

Notes:
- Spec docs still mix additive vs non-additive logic.

---

### [ACE-005] Residual Runtime Issue — Empty Action Inbox Analysis Requests

Date: 2026-04-01  
Owner: PM  
Status: Active  
Propagation Owner: Codex

Decision:
- Empty `action:""` inbox-analysis requests are invalid and must be eliminated.

Reason:
- Indicates malformed request path.
- Creates runtime instability risk.

Affected product areas:
- Gmail Workspace runtime
- API layer

Affected code areas:
- `operationsWorkspace.ts`
- `gmailCleanupWorkspace.ts`
- `inbox-analysis` API route

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`

Notes:
- Not blocking feature acceptance, but must be resolved before system hardening.
- April 2 review-path runtime hygiene pass narrowed the scoped review route:
  - `operationsWorkspace.ts` and `gmailCleanupWorkspace.ts` already guard missing actions before fetch
  - fresh-boot review-route sessions can still emit malformed inbox-analysis POSTs even with those guards in place
  - the inbox-analysis API route now distinguishes:
    - `reason: "empty_request_body"` for empty-body / null-body transport noise
    - `reason: "missing_action"` only when a valid object exists but `action` is missing/blank
    - `reason: "invalid_json"` for non-empty unparsable bodies
  - diagnostics now log `body_length` and `parse_status` alongside referer/origin/body keys so empty-body transport noise is not misclassified as missing action
- April 2 live probing also confirmed the remaining review-path runtime noise is a cold boot request to `/api/agents/playground`:
  - source = `OperationsRuntimeProvider` bootstrap via `fetchOperationsRuntimeSnapshot`
  - bucket interaction was not implicated by the scoped callers
- The current review-route cold-boot `/api/agents/playground` request is now proven required under the present architecture:
  - `review/page.tsx` depends on runtime snapshot data before clusters/workflow context can resolve
  - removing the request in this lane would require a broader runtime-seeding redesign outside scope
- This event remains open until the emitting empty-body inbox-analysis runtime path is identified and removed.

---

## Completed Change Events

### [ACE-046-TURNOVER] Analysis Rail PM v3 → PM v4 Turnover Continuity Capture

Date: 2026-04-09  
Owner: PM  
Status: Active  
Propagation Owner: Codex

Decision:
- Capture turnover continuity ONLY (no product change).
- Explicitly state that ACE-046 Phase 2 is the active governing execution phase and must remain unchanged.

Reason:
- Preserve lane continuity across PM replacement and ensure no governing truth remains only in the retiring session.

Affected product areas:
- Operations Review
- Shared Analysis Rail

Affected code areas:
- none (docs-only)

Docs requiring propagation:
- CURRENT_STATE.md
- TODO.md
- ACTIVE_CHANGE_EVENTS.md

Notes:
- Confirm Phase 2 remains active next step
- Confirm Phase 3 remains queued
- Confirm no new governing product truth was introduced beyond what is already captured in ACE-046
- Confirm no scope expansion occurred

[ACE-045] Operations Review Hero/Layout Cleanup

Date: 2026-04-09
Owner: PM
Status: Complete
Propagation Owner: Codex
Propagation Status: Accepted fix propagated; Recovery Contract recorded

Decision:
- The Operations Review top fold now keeps the hero limited to cleanup-group identity, actions, KPI cards, and the `Sender Review Goal` section directly beneath the KPI cards.
- `Smart Sync continuity`, `Page Truth Guide`, and related support/status sections now remain outside the hero in the restored stacked full-width layout.
- This accepted fix remains separate from any future copy polish or broader shell redesign.

Reason:
- The prior top fold mixed support/status content into the hero and later regressed width grammar during the first cleanup attempt.
- The accepted corrective implementation restored the intended visual hierarchy without reopening any accepted data/runtime lanes.

Affected product areas:
- Operations Review
- Shared Analysis Rail review surface

Affected code areas:
- `review/page.tsx`

Docs updated:
- `06_system_state/CHANGELOG.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

Recovery Contract:
- `CHANGELOG.md` -> `April 9, 2026 — ACE-045 Operations Review Hero/Layout Cleanup Accepted`

[ACE-044] Analysis Rail — Sender Distribution `All indexed` Reconciliation Cleanup

Date: 2026-04-08
Owner: PM
Status: Complete
Propagation Owner: Codex
Propagation Status: Accepted fix propagated; Recovery Contract recorded
Recovery Contract: `CHANGELOG.md` -> `April 8, 2026 — ACE-044 Sender Distribution All indexed Reconciliation Cleanup Accepted`

Decision:
- Sender Distribution on the Operations Review page now renders authoritative full-population truth for `All indexed`.
- The accepted contract guarantees:
  - full-population Sender Distribution truth for `All indexed`
  - no false `distribution incomplete` render-block on the accepted surface
  - alignment between the distribution dataset and the authoritative workflow sender universe
  - preserved separation from coverage/backfill, Time Context, runtime continuity, and layout work

Reason:
- The accepted defect was a workspace reconciliation + review-page render-gating mismatch on the canonical Operations Review route.
- The prior `All indexed` rail could classify authoritative distribution data as incomplete because the rail payload and the workflow-driving sender universe were not derived from the same full sender population.

Affected product areas:
- Operations Review page
- Sender Distribution
- Shared Analysis Rail sender-universe reconciliation

Affected code areas:
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/app/agents/[id]/operations/review/page.tsx`

Docs requiring propagation:
- `06_system_state/CHANGELOG.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

Notes:
- `ACE-043` remains accepted and closed.
- `ACE-042` remains accepted and closed.
- `ACE-041` remains active unchanged as the control-plane execution-efficiency layer.
- `ACE-040` remains accepted and closed.
- Hero/layout cleanup is now active under `ACE-045` as the separate Analysis Rail lane.

---

[ACE-043] Analysis Rail — Coverage / Backfill Display Contract Cleanup

Date: 2026-04-08
Owner: PM
Status: Complete
Propagation Owner: Codex
Propagation Status: Accepted fix propagated; Recovery Contract recorded
Recovery Contract: `CHANGELOG.md` -> `April 8, 2026 — ACE-043 Coverage / Backfill Display Contract Cleanup Accepted`

Decision:
- Coverage / backfill display on the Operations Review page now settles onto valid mailbox-index truth instead of rendering epoch leakage or remaining stuck at mailbox-index unavailable state when same-tab truth is already available.
- The accepted contract now guarantees:
  - no visible `1970` / epoch fallback leakage
  - real bounded indexed coverage when valid truth exists
  - real historical cutoff truth when valid backfill truth exists
  - safe unavailable fallbacks only when truth is genuinely absent or invalid
  - visible separation between coverage and backfill concepts

Reason:
- The accepted defect was a source/display-contract problem on the shared mailbox shell, not a Time Context defect, Sender Distribution defect, or Smart Sync continuity defect.
- Acceptance required proof that the exact mailbox shell on the canonical review route visibly matched same-tab mailbox-index truth.

Affected product areas:
- Operations Review page
- Mailbox coverage / backfill display
- Shared Analysis Rail coverage truth presentation

Affected code areas:
- `web/src/lib/integrations/gmail/gmailMailboxIndexer.ts`
- `web/src/components/runtime/OperationsWorkspaceShell.tsx`
- `web/src/components/runtime/OperationsRuntimeContext.tsx`

Docs requiring propagation:
- `06_system_state/CHANGELOG.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

Notes:
- `ACE-040` remains accepted and closed.
- `ACE-042` remains accepted and closed.
- Sender Distribution `All indexed` reconciliation later landed and was accepted under `ACE-044` as the separate Analysis Rail lane.
- Stale epoch-span values may still exist in session storage as non-user-visible technical debt and are not part of the accepted visible defect surface for `ACE-043`.

---

[ACE-042] Analysis Rail — Time Context Render Authority + Scope Unification

Date: 2026-04-08
Owner: PM
Status: Complete
Propagation Owner: Codex
Propagation Status: Accepted fix propagated; Recovery Contract recorded
Recovery Contract: `CHANGELOG.md` -> `April 8, 2026 — ACE-042 Time Context Render Authority + Scope Unification Accepted`

Decision:
- Time Context on the Operations Review page now uses a single stable render authority.
- `1D` and `Custom` now resolve as explicit workflow windows independent of prior workflow-scope state.
- `1W` and `1M` now remain quantitative during Smart Sync and no longer oscillate into fallback/status mode.

Reason:
- The accepted defect was review-page render-authority instability, not runtime continuity.
- Acceptance required proof that:
  - `All indexed -> 1D` and `1W -> 1D` settle to the same correct 24-hour chart contract
  - Smart Sync on `1W` and `1M` does not trigger flicker or fallback/status displacement
  - the final rendered Time Context surface remains deterministic and stable under live row growth

Affected product areas:
- Operations Review page
- Time Context
- Shared Analysis Rail render orchestration

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`
- `web/src/components/runtime/GmailCleanupComponents.tsx`

Docs requiring propagation:
- `06_system_state/CHANGELOG.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

Notes:
- `ACE-040` remains the accepted Smart Sync continuity + UI stabilization contract and was not reopened.
- Keep separate follow-on lanes out of this accepted fix:
  - `1970` coverage display anomaly
  - `all-indexed` Sender Distribution render inconsistency
  - hero/layout cleanup regression on the review page

---

[ACE-040] Analysis Rail — Post-ACE-039 Smart Sync Continuity + UI Stabilization

Date: 2026-04-07
Owner: PM
Status: Complete
Propagation Owner: Codex
Propagation Status: Accepted fix propagated; Recovery Contract recorded
Recovery Contract: `CHANGELOG.md` -> `April 8, 2026 — ACE-040 Smart Sync Continuity + UI Stabilization Accepted`

Decision:
- Post-ACE-039 Smart Sync continuity is now fixed and accepted for the canonical Analysis Rail review route.
- Drift-producing Smart Sync no longer crashes forced refresh during active artifact build.
- During `refresh_in_progress / building`, forced refresh now serves the last stable snapshot with explicit build-pending continuity state.
- After publication becomes ready, the page swaps to the new runtime truth without clearing visible review content, and downstream sender workspace / sender distribution refreshes complete on the rotated version.

Reason:
- The accepted defect was the end-to-end Smart Sync continuity/UI contract, not just the runtime data contract.
- Acceptance required proof that:
  - the last stable snapshot remained visible while build was pending
  - the final ready-state UI remained populated after swap
  - transient `409` guard churn was non-final and non-user-visible in the accepted flow

Affected product areas:
- Review Page (Sender Overview)
- Smart Sync / mailbox-index continuity
- Shared Analysis Rail runtime continuity

Affected code areas:
- `web/src/app/api/agents/playground/route.ts`
- `web/src/lib/runtime/runtimeStateService.ts`
- `web/src/components/runtime/OperationsRuntimeContext.tsx`
- `web/src/app/agents/[id]/operations/review/page.tsx`

Docs requiring propagation:
- `06_system_state/CHANGELOG.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

Notes:
- `ACE-039` remains the accepted upstream data-truth recovery contract.
- `ACE-040` is now closed as the accepted Smart Sync continuity + UI stabilization contract on top of that recovered source truth.
- Keep separate adjacent issues out of this accepted fix:
  - `1970` coverage display anomaly
  - `all-indexed` Sender Distribution render inconsistency

---

[ACE-041] Control Plane — Execution Efficiency Optimization Layer

Date: 2026-04-07
Owner: Architect
Status: Active
Propagation Owner: Codex
Propagation Status: Control-plane aligned; efficiency model active

⸻

Decision:

The system introduces a non-breaking efficiency optimization layer across:
	•	AGENTS.md
	•	CODEX_PROMPT_TEMPLATES.md
	•	PROJECT_MANAGER_CONTEXT.md
	•	implementation_pass skill
	•	change_propagation_pass skill
	•	SYSTEM_MEMORY_MAP.md

This layer preserves all existing correctness, verification, and propagation guarantees while reducing unnecessary coordination overhead.

Core optimizations introduced:
	1.	Same-Thread Control Plane Carry-Forward
	•	full control-plane load required for new threads only
	•	same-thread execution may use:
	•	Control plane unchanged
	•	or a structured delta block
	2.	Propagation Cadence Optimization
	•	propagation remains mandatory
	•	no longer required after every micro-step
	•	required at defined checkpoints only:
	•	accepted fix
	•	governing truth change
	•	phase transition
	•	thread closeout
	•	pre-new-thread boundary
	3.	Verification Ladder
	•	diagnostic → correction → accepted-fix closeout
	•	full artifact proof is required only at accepted-fix stage
	•	early-stage over-verification is explicitly prohibited
	4.	Reasoning Tier Optimization
	•	MEDIUM becomes default
	•	HIGH / EXTRA-HIGH restricted to:
	•	ambiguity
	•	cross-layer issues
	•	architectural work
	5.	Problem-Class Lock
	•	required before heavy execution
	•	prevents cross-layer misdiagnosis and wasted cycles
	6.	PM Context Canonicalization
	•	PROJECT_MANAGER_CONTEXT.md is now:
	•	canonical operating-model file
	•	not a lane-state ledger
	•	lane truth must live in:
	•	CURRENT_STATE.md
	•	ACTIVE_CHANGE_EVENTS.md
	7.	Propagation Efficiency Controls
	•	no-op detection
	•	minimal write scope enforcement
	•	checkpoint-based propagation discipline

⸻

Reason:

The system reached a stable and fully functioning verification model but incurred excessive cost due to:
	•	repeated full control-plane reloads
	•	overuse of HIGH / EXTRA-HIGH reasoning
	•	full artifact verification too early in the cycle
	•	propagation after every micro-step
	•	duplicated context (especially in PM context)

This ACE reduces cost while preserving:
	•	control-plane authority
	•	governing-truth propagation
	•	accepted-fix recovery contracts
	•	final UI truth verification discipline

⸻

Affected system areas:
	•	Control Plane
	•	PM/Codex execution model
	•	verification workflow
	•	propagation workflow
	•	runtime/UI validation discipline
	•	cost model / token usage

⸻

Affected code / docs:
	•	AGENTS.md  ￼
	•	CODEX_PROMPT_TEMPLATES.md  ￼
	•	PROJECT_MANAGER_CONTEXT.md  ￼
	•	SYSTEM_MEMORY_MAP.md  ￼
	•	implementation_pass SKILL
	•	change_propagation_pass SKILL

⸻

Notes:
	•	This is a non-breaking system optimization
	•	No product behavior changed
	•	No verification guarantees weakened
	•	No propagation guarantees weakened

This ACE changes:
👉 when cost is paid, not
👉 what correctness is required

---

### [ACE-039] Time Context — Mailbox-Index Freshness Recovery

Date: 2026-04-06  
Owner: PM  
Status: Accepted  
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Current `1W` / `1M` Time Context failures were correctly treated as a recent-period data-truth / source-of-truth recovery problem, not a UI grammar-only or chart-styling problem.
- The accepted root cause was `stale index reuse`.
- The accepted source layer fixed was the mailbox-index freshness / checkpoint layer.
- Accepted recovery behavior is now:
  - detect false healthy recent-gap state
  - stop treating stale cached index truth as usable when recent truth is incomplete
  - upgrade `smart_sync` recent-gap recovery into a fresh head-of-mailbox full run
  - disable stale checkpoint resume during that recovery run
  - stop the recovery run at the recent-window boundary once the head window has been rebuilt

Reason:
- Baseline proof showed raw `gmail_messages`, `gmail_sender_stats`, `sender_workspace`, `browse_query_cluster`, and final Time Context charts all collapsed across the same late-March / early-April span.
- The previous mailbox-index state still reported `healthy` cached incremental truth while recent days were missing and checkpoint reuse remained available.
- The accepted recovery run completed as:
  - `requested_mode = incremental`
  - `effective_mode = full`
  - `started_from_checkpoint = false`
  - `terminal_reason = recent_window_reached`

Affected product areas:
- Shared Analysis Rail
- Time Context
- Sender Overview review surface
- Marketing / subscription review routes
- Mailbox index health and recovery

Affected code areas:
- `web/src/lib/integrations/gmail/gmailMailboxIndexer.ts`
- `web/src/app/api/integrations/gmail/mailbox-index/route.ts`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Acceptance proof:
- raw mailbox truth moved from:
  - `2026-03-30: 0`
  - `2026-03-31: 1`
  - `2026-04-01: 1`
  - `2026-04-02: 0`
  - `2026-04-03: 0`
  to:
  - `2026-03-30: 180`
  - `2026-03-31: 241`
  - `2026-04-01: 206`
  - `2026-04-02: 175`
  - `2026-04-03: 170`
- derived sender truth in `gmail_sender_stats.last_seen` moved from:
  - `2026-03-30: 0`
  - `2026-03-31: 1`
  - `2026-04-01: 0`
  - `2026-04-02: 0`
  - `2026-04-03: 0`
  to:
  - `2026-03-30: 7`
  - `2026-03-31: 14`
  - `2026-04-01: 17`
  - `2026-04-02: 12`
  - `2026-04-03: 12`
- live `1W` sender workspace now settles at:
  - `160 senders / 360 messages`
  - `7` non-zero daily buckets from `Mar 31` through `Apr 6`
- live `1M` sender workspace now settles at:
  - `277 senders / 1674 messages`
  - `30` non-zero daily buckets through late March into early April
- corroborating `Custom` remained aligned:
  - `customWorkspace.selected_cluster = 254 senders / 1143 messages`
  - `customOverview.summary = 254 active senders / 1143 supporting messages`
- final UI screenshots now visually show the restored daily activity rather than the prior zero-run drop-off.

Recovery Contract:
- `CHANGELOG.md` -> `April 6, 2026 — ACE-039 Mailbox-Index Freshness Recovery Accepted`

Notes:
- Preserve the original diagnostic result as historical continuity:
  - the issue was not primarily UI grammar
  - the visible chart was accurately exposing deeper missing recent truth
- `ACE-037` remains historically correct for compressed `1D` / `Custom` behavior.
- `ACE-038` remains preserved as accepted historical UI grammar context.

---

### [ACE-039-DIAG] Time Context — 1W / 1M Data-Truth Recovery Diagnosis (Historical)

Date: 2026-04-06  
Owner: PM  
Status: Historical  
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Current `1W` / `1M` Time Context failures must now be treated as a data-truth / source-of-truth recovery problem, not a UI grammar-only or chart-styling problem.
- The chart remains the final pass surface, but the implementation target is the upstream truth feeding the chart:
  - row-backed timeline inputs
  - artifact freshness / snapshot truth
  - recent-scope publication correctness
  - any related runtime/data-path issue that causes recent activity to disappear or collapse after mid/late March on the canonical marketing/subscription routes
- `1W` and `1M` must not be “fixed” by hiding, compressing, or visually removing empty periods when the underlying expectation is that qualifying recent data should exist.
- The diagnostic pass proved the source-truth problem first; future execution is now governed by the active mailbox-index freshness recovery event above.

Reason:
- PM validation now indicates the remaining issue is not primarily UI grammar.
- The visible chart is accurately exposing a deeper problem: recent expected activity is missing or dropping off in the underlying truth feeding `1W`, `1M`, and related custom ranges.
- Prior passes over-focused on chart rendering behavior and allowed incorrect outcomes to be treated as success even while the underlying recent-period truth remained suspect.

Affected product areas:
- Shared Analysis Rail
- Time Context
- Sender Overview review surface
- Marketing / subscription review routes
- Artifact-backed recent-scope analysis

Affected code areas:
- `web/src/lib/integrations/gmail/inboxAnalysis.ts`
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/lib/integrations/gmail/gmailArtifactStore.ts`
- `web/src/lib/integrations/gmail/gmailArtifactIncrementalUpdater.ts`
- `web/src/components/runtime/GmailCleanupComponents.tsx`
- `web/src/app/agents/[id]/operations/review/page.tsx`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- This historical diagnostic event supersedes any thread-local assumption that `1W` / `1M` should be solved by UI grammar alone.
- `ACE-037` remains historically correct for compressed `1D` / `Custom` behavior.
- `ACE-038` remains historically correct for the accepted fixed-slot `1W` / `1M` UI grammar clarification, but it is no longer sufficient to explain the current observed defect.
- The current open question is whether recent-period truth loss is coming from:
  - row selection / filtering
  - artifact publication freshness
  - snapshot eligibility / reuse
  - timeline-source divergence
  - another upstream runtime/data-path defect
- The diagnostic pass is now historical context only; the active next step is governed by the mailbox-index freshness recovery event above.

---

### [ACE-038] Time Context — Continuity Grammar Clarification

Date: 2026-04-06
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- `ACE-037` remains historically correct as the accepted narrow compressed-continuity fix for `1D` / `Custom`.
- `ACE-038` clarified the Time Context surface grammar explicitly:
  - `1D` and `Custom` remain compressed compare-only/chart-only continuity surfaces
  - `1W` must preserve a fixed 7-day frame with 7 visible daily buckets, including visible zero slots
  - `1M` must preserve a fixed 30-day frame with 30 visible daily buckets, including visible zero slots
- This is a UI grammar clarification only.
- This event does NOT approve runtime/data-path changes, sender-universe changes, or newsletter parent-universe reconstruction changes.

Reason:
- Live PM validation proved that the UI still visibly shows gap/broken continuity behavior on `1W` and `1M`.
- Prior control-plane state only recorded the accepted narrow `ACE-037` chart-only continuity fix for `1D` / `Custom`.
- The first ACE-038 propagation was directionally correct but too coarse because it implied one continuity behavior across all four accepted surfaces.
- PM validation then clarified that workflow-driving windows cannot use the same compressed grammar as compare-only windows.
- Future Codex threads must recover this truth from docs, not from PM memory.

Affected product areas:
- Shared Analysis Rail
- Time Context
- Sender Overview review surface

Affected code areas:
- `web/src/components/runtime/GmailCleanupComponents.tsx`

Verification:
- Repo proof:
  - `npm run lint -- src/components/runtime/GmailCleanupComponents.tsx` passed
  - `npx tsc --noEmit` still fails from unrelated pre-existing repo errors outside this pass
- Live proof on:
  - `http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions`
  - `1W` accepted defect surface proved:
    - `workflow_scope = 7d`
    - `compressedMode = false`
    - `granularity = day`
    - `rawBucketCount = 7`
    - `renderBucketCount = 7`
    - visible empty days remained reserved and bars stayed inside their day slots
  - `1M` accepted defect surface proved:
    - `workflow_scope = 30d`
    - `compressedMode = false`
    - `granularity = day`
    - `rawBucketCount = 30`
    - `renderBucketCount = 30`
    - visible empty days remained reserved and dense bars stayed visually separated
  - regression proof also confirmed:
    - `1D` remained compressed with `compressedMode = true`, `rawBucketCount = 24`, `renderBucketCount = 16`, `hiddenBucketCount = 8`
    - `Custom` remained compressed with `compressedMode = true`, `rawBucketCount = 20`, `renderBucketCount = 15`, `hiddenBucketCount = 5`
  - accepted artifact bundle captured screenshots, DOM/state, and request traces for:
    - final settled `1W`
    - final settled `1M`
    - regression `1D`
    - regression `Custom`
  - guard churn observed:
    - none

Recovery Contract:
- `CHANGELOG.md` -> `April 6, 2026 — ACE-038 Time Context Fixed-Slot UI Grammar Recovery Accepted`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- `ACE-037` remains historically correct for the narrow accepted `1D` / `Custom` fix.
- `ACE-038` preserved the accepted split grammar instead of one shared compressed/gap-free rule across all four surfaces.
- `ACE-038` is now accepted as the narrow fixed-slot UI grammar recovery for `1W` / `1M`.
- `ACE-038` is now preserved as historical accepted context; `ACE-039` governs future `1W` / `1M` recovery work.
- Control-plane propagation is now aligned across:
  - `06_system_state/CURRENT_STATE.md`
  - `06_system_state/TODO.md`
  - `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
  - `06_system_state/ACTIVE_CHANGE_EVENTS.md`
  - `06_system_state/CHANGELOG.md`
- No pending implementation work remains under this event.

### [ACE-037] Time Context Chart-Only Continuity Recovery

Date: 2026-04-06
Owner: PM
Status: Completed
Propagation Owner: Codex

Decision:
- Time Context chart-only windows `1D` and `Custom` now use compressed active-timeline rendering so visible bars flow continuously across active periods instead of reserving visual zero-gap slots.
- Raw bucket truth is preserved for hover, focus, and lower-card readouts.
- This pass remains narrow and does not change:
  - backend aggregation
  - route/query behavior
  - Sender Distribution / workflow totals logic
  - workflow-driving windows:
    - `All indexed`
    - `1Y`
    - `1Q`
    - `1M`
    - `1W`
  - interpolation / synthetic continuity

Reason:
- The final rendered Time Context UI was still visibly wrong in chart-only windows because literal zero buckets created broken continuity between active periods.
- Users need Time Context to communicate activity flow meaningfully without inventing data or widening workflow semantics.

Affected product areas:
- Gmail Workspace
- Shared Analysis Rail
- Time Context visualization

Affected code areas:
- `web/src/components/runtime/GmailCleanupComponents.tsx`

Verification:
- Repo proof:
  - `npm run lint -- src/components/runtime/GmailCleanupComponents.tsx` passed
  - `npx tsc --noEmit` still fails from unrelated pre-existing repo errors outside this pass
- Live proof on:
  - `http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions`
  - `1D` cold-load settled state proved:
    - `compressedMode = true`
    - `rawBucketCount = 24`
    - `renderBucketCount = 17`
    - `hiddenBucketCount = 7`
    - disclosure copy visible
  - sparse `Custom` settled state proved:
    - `compressedMode = true`
    - `rawBucketCount = 20`
    - `renderBucketCount = 15`
    - `hiddenBucketCount = 5`
    - focused visible bucket remained truthful at `Mar 20` with `63` active senders and `75` supporting messages
  - empty custom-window state proved:
    - `renderBucketCount = 0`
    - explicit empty-state title visible
  - accepted artifact bundle captured screenshots, DOM/state, and request traces for:
    - cold `1D`
    - sparse `Custom`
    - final settled `1D`
    - empty custom-window state
  - guard churn observed:
    - none

Recovery Contract:
- `CHANGELOG.md` -> `April 6, 2026 — ACE-037 Time Context Chart-Only Continuity Recovery Accepted`

### [ACE-036] Gmail Marketing Classification Coverage + Sender Distribution `1W` UI Consistency Recovery

Date: 2026-04-06
Owner: PM
Status: Completed
Propagation Owner: Codex

Decision:
- `semantic.marketing_subscriptions` now rescues broader-row promotional/newsletter senders when broader sender evidence already classifies the sender as `subscription-senders`, the sender does not look human, and promotional/newsletter evidence exists.
- Sender Distribution workflow-scope chips remain workflow-driving controls and must not be blocked by detached comparison rail-package readiness.
- This pass remains narrow and does not change:
  - artifact publication
  - Smart Sync ingestion
  - workflow-window logic
  - route shape

Reason:
- Recent Gmail inbox activity showed daily marketing activity, but the published `30d` marketing cluster still had avoidable gaps because thin-row promotional/newsletter senders were being stranded in `needs-review`.
- The Sender Distribution `1W` chip could also become inert because the route update path was still waiting on detached rail-package readiness even though the chip itself is a workflow-driving control.

Affected product areas:
- Gmail Workspace
- Sender classification
- Sender Distribution
- Analysis Rail monthly marketing coverage

Affected code areas:
- `web/src/lib/integrations/gmail/inboxAnalysis.ts`
- `web/src/app/agents/[id]/operations/review/page.tsx`

Verification:
- Repo proof:
  - fixture harness passed with new marketing broader-row rescue cases
  - targeted lint passed with no errors for the touched runtime/UI files and verification scripts
- Live proof:
  - published `30d` marketing artifact moved:
    - `subscription-senders: 192 -> 248`
    - `needs-review-senders: 177 -> 121`
  - live recent marketing coverage now reports:
    - `missing_promotional_days = []`
  - exact canonical runtime route verified:
    - `http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions`
  - accepted click flow proved final settled URL:
    - `http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?workflow_scope=7d&cluster_id=semantic.marketing_subscriptions`
  - final settled UI state proved:
    - active tab = `sender_distribution`
    - `1W` chip active
    - no `409` guard churn

Recovery Contract:
- `CHANGELOG.md` -> `April 6, 2026 — ACE-036 Gmail Marketing Classification Coverage + Sender Distribution \`1W\` UI Consistency Recovery Accepted`

### [ACE-035] Gmail Artifact Integrity — Incremental Refresh Consistency Recovery

Date: 2026-04-06
Owner: PM
Status: Completed
Propagation Owner: Codex

Decision:
- Incremental Gmail artifact refresh now rebuilds impacted preview rows, headers, cluster summaries, and mailbox intelligence from the same projected preview dataset before validation and persistence.
- Incremental Gmail artifact validation now counts cleanup-candidate preview rows using the same cleanup-group reference rules as the mailbox-intelligence snapshot builder:
  - direct cleanup-group cluster ids
  - projected rows that still reference cleanup groups through `cleanup_group_source_cluster_ids`
- Integrity checks remain active and continue rejecting inconsistent or partial artifacts; this pass does not weaken or remove any safeguard.

Reason:
- Incremental refresh could previously validate/persist a mixed dataset where projected headers and summaries no longer matched the preview rows being counted.
- After the preview/header fix, candidate-universe validation still used a narrower cleanup-candidate predicate than mailbox intelligence itself, so projected cleanup-candidate rows could be counted in the snapshot but excluded by validation.
- That left live incremental artifact refresh failing with:
  - `Preview row ... references missing header ...`
  - `Mailbox intelligence candidate message count no longer matches preview rows.`

Affected product areas:
- Gmail Workspace
- Mailbox Index + Artifact Pipeline
- Analysis Rail artifact integrity

Affected code areas:
- `web/src/lib/integrations/gmail/gmailArtifactIncrementalUpdater.ts`

Verification:
- Repo proof:
  - targeted lint passed for:
    - `src/lib/integrations/gmail/gmailArtifactIncrementalUpdater.ts`
    - `scripts/gmail-artifact-incremental-integrity-live-audit.mjs`
- Live proof:
  - Smart Sync produced a real incremental mailbox delta:
    - `rows_after = 234516`
    - `growth_delta = 3`
    - `processed_messages = 4`
    - `upserted_messages = 3`
  - bounded incremental artifact refresh then published successfully for:
    - `30d -> incremental-20260405231931612`
    - `7d -> incremental-20260405231940420`
    - `all_indexed -> incremental-20260405231945344`
  - live `all_indexed` recovered from:
    - `build_status = failed`
    - `freshness_state = refresh_failed`
    - `freshness_reason = Mailbox intelligence candidate message count no longer matches preview rows.`
    to:
    - `build_status = published`
    - `freshness_state = fresh`
    - `freshness_reason = published_artifact_current`
  - live logs no longer emitted:
    - `references missing header`
    - `candidate message count no longer matches preview rows`
  - live continuity proof passed:
    - `1W / 7d = 7` daily buckets
    - `1M / 30d = 30` daily buckets

Recovery Contract:
- `CHANGELOG.md` -> `April 6, 2026 — ACE-035 Gmail Artifact Integrity Incremental Refresh Recovery Accepted`

### [ACE-034] Gmail Analysis Rail — Smart Sync Freshness and Recent-Scope Publication Recovery

Date: 2026-04-06
Owner: PM
Status: Completed
Propagation Owner: Codex

Decision:
- Successful Gmail artifact publish now clears stale failed freshness metadata for the build/version that actually published.
- Smart Sync artifact refresh planning now manages recent publication scopes instead of only pre-existing publication rows:
  - `7d`
  - `30d`
  - `90d`
  - `180d`
  - `365d`
  - `all_indexed`
- `unavailable_scope` remains an integrity safeguard and is not removed or weakened.

Reason:
- A later successful full rebuild could previously publish a new artifact version while leaving `freshness_state=refresh_failed` on the publication row.
- Smart Sync could previously skip missing recent scopes entirely, leaving recent windows unpublished and resolving through `unavailable_scope` because truth was absent, not because the window was honestly empty.

Affected product areas:
- Gmail Workspace
- Mailbox Index + Artifact Pipeline
- Analysis Rail freshness

Affected code areas:
- `web/src/lib/integrations/gmail/gmailArtifactStore.ts`
- `web/src/app/api/integrations/gmail/mailbox-index/route.ts`

Verification:
- Repo proof:
  - simulated stale failed freshness metadata with `refresh_requested_at > refresh_started_at`
  - confirmed later publish advances `published_version`, sets `build_status=published`, and lands `freshness_state=fresh`
- Live proof:
  - confirmed recent-scope publication rows are now created/queued for `7d`, `30d`, `90d`, `180d`, and `365d`
  - confirmed live `7d` full rebuild published successfully
  - confirmed live `7d` rail state moved from `unavailable_scope` to artifact-backed truth (`outside_timeframe` for the audited selected cluster)
  - confirmed injected live `refresh_failed` freshness on `7d` is cleared by a later successful publish

Residual note:
- A separate pre-existing `all_indexed` incremental integrity failure was observed live:
  - `Preview row 1919a35fe8973469 references missing header semantic.marketing_subscriptions. | Mailbox intelligence candidate message count no longer matches preview rows.`
- That integrity issue remains out of scope for `ACE-034` and does not reopen this accepted recent-scope publication fix.

Recovery Contract:
- `CHANGELOG.md` -> `April 6, 2026 — ACE-034 Gmail Analysis Rail Smart Sync Freshness Recovery Accepted`

---

[ACE-033] Control Plane — Protected Files Enforcement System

Date: 2026-04-05
Owner: Architect
Status: Active
Propagation Owner: Codex

⸻

Decision:
	•	Introduced a Protected Files Enforcement System across the entire Codex operating system.
	•	Defined a class of architect-controlled files that are read-only unless explicitly scoped by Oliver.
	•	Enforced this rule across:
	•	AGENTS.md (system rule layer)
	•	Codex prompt templates (execution instruction layer)
	•	implementation_pass skill (execution layer)
	•	change_propagation_pass skill (propagation layer)
	•	turnover protocols (activation/continuity layer)

Protected files include:
	•	AGENTS.md
	•	CODEX_PROMPT_TEMPLATES.md
	•	all SKILL.md files
	•	Control Plane Architect Activation & Turnover Protocol
	•	Project Manager Activation & Turnover Protocol
	•	One Command Activation Message
	•	Agent Turnover Readiness Check

⸻

Reason:
	•	Codex propagation previously modified protected system-rule files unintentionally.
	•	This caused:
	•	system instability
	•	rule drift
	•	unnecessary rework
	•	The system required a hard enforcement boundary between:
	•	control-plane propagation
	•	system rule modification

⸻

Affected System Areas:
	•	Control Plane
	•	Codex execution discipline
	•	propagation behavior
	•	turnover safety
	•	system integrity enforcement

⸻

Affected Code / Docs:
	•	AGENTS.md
	•	CODEX_PROMPT_TEMPLATES.md
	•	implementation_pass SKILL
	•	change_propagation_pass SKILL
	•	Control Plane Architect Activation & Turnover Protocol
	•	One Command Activation Message for Agent Turnovers

⸻

Notes:
	•	This is a system-level enforcement change, not a product feature.
	•	This establishes a read-only boundary layer inside the Codex OS.
	•	Codex must now:
	•	STOP if a protected file needs modification
	•	request explicit approval before proceeding
	•	This rule applies to:
	•	execution passes
	•	propagation passes
	•	turnover passes

### [ACE-032] Analysis Rail — PM v1 → PM v2 Turnover Activation

Date: 2026-04-05
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Retire `Analysis Rail PM v1` and activate `Analysis Rail PM v2` as the active lane owner.
- Reset the Analysis Rail execution path before any further implementation following Phase 1 Time Context (`1D`) instability and verification-discipline gaps.
- Require the next Analysis Rail thread to start in `PLAN MODE` for `1D` Time Context correctness and stability.
- Preserve the already-approved `ACE-030` architecture while preventing immediate EXECUTION MODE continuation without a fresh plan.
- Require all subsequent Analysis Rail passes to follow the Runtime/UI Closeout Contract with artifact-backed proof.

Reason:
- Repeated regressions and incomplete verification cycles indicate an execution-discipline failure in this lane, not a need to widen product scope.
- Turnover is required to restore:
  - strict scope control (Sniper Method)
  - full artifact-backed verification
  - proper `PLAN MODE -> EXECUTION MODE` continuity

Affected product areas:
- Sender Overview
- Time Context (`1D` / `Custom`)
- Shared Analysis Rail

Affected code areas:
- None in this pass

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- This ACE is a docs-only lane-ownership transition and execution reset, not a product fix or implementation pass.
- `Analysis Rail PM v2` is now the governing lane owner in the control plane.
- Immediate next executable step after turnover:
  - `PLAN MODE` for `1D` Time Context correction and stability
- `ACE-030` remains the governing architecture approval for chart-only `1D` / `Custom`, but direct implementation is paused until that PLAN MODE pass is approved.

### [ACE-031] Control Plane — Verification Hardening Closeout Alignment

Date: 2026-04-05
Owner: Architect
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- The runtime/UI verification hardening work was already implemented in the authoritative execution-rule documents before this pass.
- This ACE was limited to **control-plane alignment and closeout capture**.
- The control plane now records the hardened verification standard as accepted system truth.
- Codex must NOT reopen or re-edit already-correct source rule files unless a specific mismatch is explicitly identified first.

Reason:
- The prior ACE-031 wording was too broad and caused unnecessary re-edit churn in already-correct source rule documents.
- The correct closeout action was to align control-plane continuity to the already-landed verification standard, not to re-implement the rules.

Affected system areas:
- Control Plane
- PM / Codex continuity
- Verification-governance tracking

Affected code areas:
- None in this pass

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- This was a docs-only closeout alignment pass.
- No product code, runtime behavior, route behavior, or source execution-rule documents changed in `ACE-031`.
- The hardened verification standard is now accepted control-plane truth and no pending `ACE-031` source-rule rewrite work remains.

### [ACE-030] Sender Overview — `1D` / `Custom` Chart-Only Architecture and Phase 1 Activation

Date: 2026-04-04
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Sender Overview now has an approved architecture for the previously deferred windows:
  - `1D` and `Custom` are approved as chart-only windows
  - existing accepted chips remain workflow-driving:
    - `All indexed`
    - `1Y`
    - `1Q`
    - `1M`
    - `1W`
- The next shared-analysis execution step is now committed:
  - `Phase 1 — Time Context only` implementation
- `Phase 1` is explicitly limited to:
  - Time Context only
  - chart-only `1D` / `Custom`
  - no Sender Distribution `1D` / `Custom` rendering
  - no `workflow_scope` expansion
  - no `analysis_scope` expansion
  - no route/query changes
- Sender Distribution `1D` / `Custom` chart-window rendering is explicitly deferred to a later phase.

Reason:
- The control plane still described the next shared-analysis step as undecided.
- The approved plan needed to be recoverable from docs alone before any new implementation thread could begin.
- The previously hidden/deferred language for `1D` / `Custom` no longer matched the approved architecture.

Affected product areas:
- Review Page
- Shared Analysis Rail
- Sender Overview
- Time Context
- Sender Distribution

Affected code areas:
- None in this pass

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- This was a docs-only approved-plan capture and phase-activation pass.
- No product code, route behavior, query behavior, or UI behavior changed in `ACE-030`.
- The blocker is removed because the control plane now explicitly records:
  - approved architecture = chart-only `1D` / `Custom`
  - next execution step = `Phase 1 — Time Context only` implementation
  - Sender Distribution `1D` / `Custom` rendering = deferred to a later phase
  - no `workflow_scope` or `analysis_scope` expansion in Phase 1

### [ACE-029] Control Plane — Accepted-Fix Recovery Contract Hardening

Date: 2026-04-04
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Accepted fixes must now be captured in a recovery-grade format, not only as milestone history or lane-state memory.
- `CHANGELOG.md` now serves as the authoritative Accepted-Fix Recovery Ledger for accepted fixes.
- Every accepted fix must include a Recovery Contract containing:
  - accepted invariant
  - source layer fixed
  - exact touched files/functions
  - canonical verification route
  - acceptance smoke / proof
  - replay steps
  - rollback guidance
- `ACTIVE_CHANGE_EVENTS.md` completed accepted-fix entries must point to the corresponding `CHANGELOG.md` recovery contract instead of trying to duplicate it.
- Accepted fixes are not considered fully propagated until the recovery contract exists and the completed ACE references it.

Reason:
- Recent regressions proved the control plane remembered that a fix was accepted, but not the fix in a deterministic replayable form.
- This caused repeated re-diagnosis of previously accepted behavior instead of fast recovery from authoritative system memory.
- The specific failure example is the weekly `1W` Time Context regression, where prior acceptance existed but recovery-grade replay information did not.

Affected product areas:
- Control Plane
- PM / Codex execution discipline
- propagation discipline
- turnover / continuity discipline

Affected code areas:
- `AGENTS.md`
- `ai-agent-platform-docs/07_reference/CODEX_PROMPT_TEMPLATES.md`
- `ai-agent-platform-docs/00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `ai-agent-platform-docs/06_system_state/CHANGELOG.md`
- `ai-agent-platform-docs/06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `ai-agent-platform-docs/01_workspace_architecture/system_overview.md`
- `/Users/olivercarlin/.codex/skills/implementation_pass/SKILL.md`
- `/Users/olivercarlin/.codex/skills/change_propagation_pass/SKILL.md`
- `/Users/olivercarlin/.codex/skills/turnover_pack_builder/SKILL.md`
- `ai-agent-platform-docs/00_core_context/Project Manager Activation & Turnover Protocol.md`

Docs requiring propagation:
- `06_system_state/CHANGELOG.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `01_workspace_architecture/system_overview.md`
- `07_reference/CODEX_PROMPT_TEMPLATES.md`
- `AGENTS.md`
- `00_core_context/Project Manager Activation & Turnover Protocol.md`
- `/Users/olivercarlin/.codex/skills/implementation_pass/SKILL.md`
- `/Users/olivercarlin/.codex/skills/change_propagation_pass/SKILL.md`
- `/Users/olivercarlin/.codex/skills/turnover_pack_builder/SKILL.md`

Notes:
- This was a docs/process hardening pass only.
- No product code, route behavior, or execution-lane product scope changed in this event.
- Final propagation state:
  - `CHANGELOG.md` is the authoritative recovery ledger for accepted fixes
  - `CURRENT_STATE.md` and `TODO.md` now reflect the enforced model without storing full Recovery Contracts
  - `PROJECT_MANAGER_CONTEXT.md`, `AGENTS.md`, `CODEX_PROMPT_TEMPLATES.md`, `system_overview.md`, the turnover protocol, and the named skills all enforce the same closeout rule
- No pending `ACE-029` implementation work remains.
- `ACE-029` establishes accepted-fix recovery capture rules; it does not itself require a separate Recovery Contract entry.

### [ACE-028] Sender Distribution — Monthly `30d` Truth Correction

Date: 2026-04-04
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated and PM-Verified

Decision:
- Sender Distribution monthly `1M` / `workflow_scope=30d` truth must reconcile with the workflow truth on the same protected-trusted review route.
- The accepted correction is to make `loadGmailSenderDistributionForTenant(...)` treat `30d` like `sender_workspace` already does for persisted snapshot eligibility.
- `analysisScope === '30d'` is now excluded from the Sender Distribution persisted snapshot shortcut so monthly Sender Distribution falls through to the truthful non-snapshot path.

Reason:
- PM verification isolated a narrow monthly divergence on the same route:
  - Sender Distribution `1M` showed `61`
  - the workflow below showed `48`
  - Time Context `1M` remained correct
- Diagnosis confirmed the divergence was a Sender Distribution snapshot-serving mismatch, not a workflow-truth, route/query, or Time Context issue.

Affected product areas:
- Review Page
- Shared Analysis Rail
- Sender Distribution

Affected code areas:
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- PM verification confirmed on the protected-trusted review route:
  - Sender Distribution `1M` now shows `48`
  - the workflow below shows `48`
  - Time Context `1M` remains correct
- This accepted fix remained narrowly bounded:
  - no route/query-shape changes
  - no API contract changes
  - no Time Context changes
  - no Decision Mode changes
  - no sender ordering or pagination changes
  - no changes to `1W`, `1Q`, `1Y`, or `all_indexed`
- Separate performance follow-up item only:
  - `1Y` still has a significant workflow-load delay; `1Q` is slower than ideal but materially better; `1W` is near-instant. This is a separate future performance diagnosis item and not part of the accepted monthly `30d` Sender Distribution truth fix.

---

### [ACE-027] Sender Distribution — Pass 2 Scope Congruency

Date: 2026-04-04
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated and PM-Verified

Decision:
- Sender Distribution scope-congruency Pass 2 is completed and accepted.
- Sender Distribution visible chips are now restricted to:
  - `All indexed`
  - `1Y`
  - `1Q`
  - `1M`
  - `1W`
- Visible `2M` and `6M` are removed from Sender Distribution UI only.
- `1D` and `Custom` were not part of the accepted Sender Distribution grammar in `ACE-027`; `ACE-030` later approved them as chart-only windows for Time Context while keeping Sender Distribution deferred.

Reason:
- Align Sender Distribution visible grammar to the accepted truthful overlap grammar without widening into a new chart-window model, route/query work, or backend/API contract changes.

Affected product areas:
- Review Page
- Shared Analysis Rail
- Sender Distribution

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- PM verification confirmed the accepted visible Sender Distribution grammar is now:
  - `All indexed`
  - `1Y`
  - `1Q`
  - `1M`
  - `1W`
- This accepted pass did not change:
  - Time Context
  - backend/API contracts
  - route/query shape
  - `OperationsAnalysisScope`
  - Decision Mode semantics
  - pagination
  - sender ordering logic
  - lower-card anchoring
- The narrow monthly `30d` Sender Distribution truth mismatch surfaced separately after this pass and is now closed under `ACE-028`.

### [ACE-026] Time Context — Pass 1 Scope Congruency

Date: 2026-04-03
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated and PM-Verified

Decision:
- Time Context scope grammar is now expanded in a narrow Pass 1 that is limited to Time Context only.
- The accepted visible Time Context scope strip is:
  - `All indexed`
  - `1Y`
  - `1Q`
  - `1M`
  - `1W`
- The accepted safe mapping is:
  - `all_indexed -> all_indexed`
  - `last_year -> 365d`
  - `last_quarter -> 90d`
  - `last_month -> 30d`
  - `last_week -> 7d`
- `1D` and `Custom` were intentionally hidden in the accepted Pass 1 state; `ACE-030` later approved them as chart-only windows while preserving the Pass 1 workflow-driving surface.

Reason:
- Time Context needed scope-grammar congruency progress toward the Mailbox Intelligence control structure without widening into Sender Distribution, route/query changes, or backend/API contract changes.
- The smallest safe step was a Time Context-local chart-scope adapter using only existing safe workflow scopes.

Affected product areas:
- Review Page
- Shared Analysis Rail
- Time Context

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`
- `web/src/components/runtime/GmailCleanupComponents.tsx`
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/lib/integrations/gmail/inboxAnalysis.ts`

Docs requiring propagation:
- `03_gmail_workspace/04_sender_decision_ui/01_analysis_rail/Shared_Rail_Analysis_spec.md`
- `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- PM verification confirmed:
  - Time Context chips now show `All indexed`, `1Y`, `1Q`, `1M`, `1W`
  - `1D` and `Custom` remain hidden, which is correct for Pass 1
  - `1Y` loaded and clicked-bucket filtering behaved correctly
  - `1Q` loaded and clicked-bucket filtering behaved correctly
  - `1M`, `1W`, and `All indexed` remained correct
  - Sender Distribution behavior appeared unchanged
- This accepted pass did not change:
  - Sender Distribution
  - Decision Mode
  - backend/API contracts
  - route/query shape
  - `OperationsAnalysisScope`
  - lower-card anchoring behavior
- Separate observation only:
  - PM observed significant load-time cost on the newly exposed scopes
  - roughly `61s` on `1Y`
  - roughly `19s` on `1Q`
  - this is not part of the accepted Pass 1 functional closeout
- The next execution step is now committed under `ACE-027`:
  - Sender Distribution scope-congruency Pass 2
- The separate narrow `1Y` / `1Q` performance diagnosis remains deferred.
- Those lanes must not be blended.

---

### [ACE-025] Time Context — Weekly `1W` Truth Alignment

Date: 2026-04-03
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated and PM-Verified

Decision:
- The weekly `workflow_scope=7d` Time Context chart and bucket-applied workflow totals must reconcile on the same row-backed sender truth.
- Persisted-snapshot weekly overview timelines may still be used for the broad page bootstrap, but the weekly chart timeline itself must be rebuilt from recent selected-cluster rows before render.
- When a weekly bucket is selected, the lower-card `Senders in current workflow scope` metric must settle from the narrowed workflow coverage workspace instead of the preserved broad chart workspace.

Reason:
- The remaining weekly mismatch was not monthly `30d` and not `all_indexed`.
- On `workflow_scope=7d`, the chart could show the correct row-backed bucket sender count while the lower-card/workflow scope still reflected the preserved broad weekly workspace during or after bucket application.

Affected product areas:
- Review Page
- Shared Analysis Rail
- Time Context

Affected code areas:
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/app/agents/[id]/operations/review/page.tsx`

Docs requiring propagation:
- `03_gmail_workspace/04_sender_decision_ui/01_analysis_rail/Shared_Rail_Analysis_spec.md`
- `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- Code is implemented, accepted, and fully propagated.
- Accepted weekly baseline on the tested route is now recorded as:
  - canonical route = `/operations/review?workflow_scope=7d&cluster_id=structural.protected_trust`
  - fresh Time Context base view shows one populated visible UTC-day bucket
  - visible weekly sender/workflow totals remain internally coherent
  - populated-bucket drilldown remains coherent after click
- Separate transient-state note only:
  - the immediate post-click frame can still show the prior workflow total before the narrowed weekly workspace settles
  - acceptance is based on the steady-state rendered result
- Separate non-blocking runtime note only:
  - transient loading jitter / temporary empty hero state can still appear during route churn
  - that runtime issue is outside `ACE-025` scope and does not reopen the accepted weekly fix
- `30d` and `all_indexed` remained preserved in this lane.
- Next active item after this closeout returns to Cleanup Groups Lane B — review entry behavior for decomposed parents.
- Weekly auto-scroll / refocus remains separate polish-only follow-up work and does not reopen `ACE-025`.
- Recovery Contract: `CHANGELOG.md` -> `April 3, 2026 — ACE-025 Weekly \`1W\` Truth Alignment Accepted`

---

### [ACE-024] Time Context — Lower-Card Anchoring on Selected Bucket

Date: 2026-04-03
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated and PM-Verified

Decision:
- When a Time Context bucket is selected on the review page, the lower Time Context cards must anchor to that selected bucket.
- Hover remains preview-only:
  - hover may change the quick-read tooltip
  - hover must not replace the lower-card truth while a bucket is selected
- Clearing narrowed state must return the lower cards to the existing default-focus behavior.

Reason:
- The lower Time Context cards were reading from hover/default-focus state instead of the selected bucket state.
- This created post-click confusion even when chart truth and workflow narrowing were correct.

Affected product areas:
- Review Page
- Shared Analysis Rail
- Time Context

Affected code areas:
- `web/src/components/runtime/GmailCleanupComponents.tsx`

Docs requiring propagation:
- `03_gmail_workspace/04_sender_decision_ui/01_analysis_rail/Shared_Rail_Analysis_spec.md`
- `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- PM/browser validation accepted the protected-trusted monthly route:
  - selected bucket stays anchored after click
  - lower-card content follows the selected bucket correctly
  - hover no longer steals the lower-card anchor once a bucket is selected
  - `Clear narrowed state` restores the default-focus behavior
  - monthly filtering behavior remains correct after selection
- This event is complete and must not be widened to include the separate weekly `1W` lower-card/workflow-scope inconsistency.
- The weekly `1W` inconsistency remains open as a separate next PLAN MODE thread.

---

### [ACE-023] Time Context — Monthly `30d` Trust Recovery Roadmap

Date: 2026-04-03
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated and PM-Verified

Decision:
- The monthly `30d` chart-driving truth must no longer diverge from the clicked-bucket workflow filter truth.
- The accepted correction is to keep monthly `30d` chart/filter parity on the same live row-backed semantics by excluding unbucketed `30d` reads from the persisted snapshot timeline shortcut.
- `time_context_bucket_label`, `1W`, and `All Indexed` behavior remain preserved by this correction.

Reason:
- The monthly mismatch came from a source-of-truth split:
  - the chart could read from a persisted snapshot timeline rebuilt from `allSenders` using sender `last_activity`
  - clicked-bucket filtering used live row-backed membership from `timelineRows`
- PM protected-trusted verification now confirms the corrected monthly parity:
  - `2026-03-06`: `9` in chart, `9` in filtered workflow
  - `2026-03-20`: `8` in chart, `8` in filtered workflow
  - `2026-03-30`: `3` in chart, `3` in filtered workflow
- `All Indexed` still matches after click.

Affected product areas:
- Review Page
- Time Context monthly chart
- Protected-trusted review flow
- Shared Analysis Rail monthly parity

Affected code areas:
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- This event is complete and should not be reopened for lower-card anchoring, weekly lower-card workflow-scope consistency, or auto-scroll polish.
- Any follow-up on those issues requires a new narrow diagnosis/plan pass.

---

### [ACE-019] Review Page — Protected-Trusted Time Context Stabilization Rollback

Date: 2026-04-02
Owner: PM
Status: Completed
Superseded By: ACE-023
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- The unstable April 2 Time Context review-page forward-fix chain was rolled back to the last stable review-page baseline.
- The detached-scope chart-source correction is no longer accepted as the current live-branch truth for this issue.
- The rollback restored the stable broad-chart / stable-rail baseline so the remaining monthly mismatch could be re-diagnosed from clean ground.

Reason:
- PM live review confirmed the branch had become worse:
  - the original mismatch still remained
  - clicking one bucket changed the rest of the chart behavior
  - rail presentation regressed materially
- The rollback was required to restore a trustworthy baseline before new diagnosis resumed.

Affected product areas:
- Review Page
- Time Context broad chart
- Time Context rail presentation
- Protected-trusted review flow

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`
- `web/src/components/runtime/GmailCleanupComponents.tsx`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- The rollback restored the last stable broad-chart / stable-rail contract instead of layering another forward parity fix.
- Follow-up PM validation after rollback showed the baseline was materially improved enough to isolate a narrower remaining problem:
  - `All Indexed` generally behaving correctly
  - `1W` generally behaving correctly at the workflow/filter level
  - `1M` / monthly `30d` remains the primary broken lane
- Ongoing Time Context trust recovery work now continues under `ACE-023`.

### [ACE-018] Review Page — Protected-Trusted Time Context Broad-Chart Source Selection Correction (Superseded Diagnosis)

Date: 2026-04-02
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- The remaining protected-trusted Time Context parity failure is a review-page broad-chart source-selection issue.
- When a Time Context bucket is active, the visible chart must prefer the latest broad normalized-scope overview/coverage workspace.
- The preserved click-time `broadSnapshot` must be used only as a fallback when current broad normalized-scope overview truth is unavailable.
- Workflow narrowing below the chart remains authoritative and unchanged.

Historical note:
- This completed pass is no longer the accepted final diagnosis for the detached `workflow_scope=30d` protected-trusted mismatch.
- `ACE-019` supersedes the normalized-scope overview preference as the current governing diagnosis for the remaining issue.

Reason:
- PM evidence showed the applied bucket request truth was already authoritative while the visible chart bar still disagreed for the same bucket label.
- The chart was preserving an older broad snapshot path ahead of fresher broad normalized-scope overview truth, which let the visible bar drift from the applied bucket request in protected-trusted.

Affected product areas:
- Review Page
- Time Context broad chart
- Protected-trusted review flow

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

What was propagated:
- Added a broad normalized-scope overview/coverage workspace preference in `review/page.tsx` for bucket-active chart truth.
- Moved the preserved click-time `broadSnapshot` behind that current broad workspace source as a fallback only.
- Left workflow narrowing, summary surfaces, and backend/API bucket-membership logic unchanged.
- Validated the changed page file with targeted ESLint.

### [ACE-017] Review Page — Protected-Trusted Time Context Display-State Parity Correction

Date: 2026-04-02
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- The residual protected-trusted `5 -> 9` Time Context parity failure is a review-page display/state issue, not a server bucket-membership issue.
- When a Time Context bucket is applied, narrowed sender totals shown on the review page must read from the applied bucket workspace total.
- The review page must not use broad sender-key-derived `sharedWorkflowSubset.resolvedSenderCount` as the source for bucket-applied summary sender totals.
- The Time Context lower-card workflow-scope total must use that same applied bucket workspace total.

Reason:
- PM evidence and route logging already showed the bucket request returned `5`, so the remaining drift lived in page-level display-state composition after apply.
- Summary and lower-card workflow-universe totals needed to align to the same authoritative applied bucket workspace truth as the narrowed workflow below.

Affected product areas:
- Review Page
- Time Context lower truth card
- Protected-trusted sender summary surfaces

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

What was propagated:
- Added an applied-bucket sender-total path in `review/page.tsx` backed by the authoritative bucket workspace total.
- Routed the top summary sender total through that path for bucket-applied state.
- Routed the Time Context lower-card workflow-scope total through that same path.
- Left the chart broad and left the existing row-workflow path unchanged.
- Validated the changed page file with targeted ESLint.

### [ACE-016] Time Context — Protected-Trusted Count Parity Correction

Date: 2026-04-02
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Protected-trusted Time Context bucket apply must use the same row-backed bucket-membership truth as the visible chart.
- Sender-history inference from `first_seen` / `last_activity` is not allowed to redefine narrowed workflow membership for this lane.
- Selecting a Time Context bucket must reset `sender_page` to the first narrowed page so a non-zero bucket cannot inherit an invalid broad-list page.
- The rail must remain broad while only the workflow below narrows.

Reason:
- The protected-trusted route regressed into chart/workflow count drift and occasional zero-row selected states.
- Bucket truth must stay explicit and identical across the clicked chart, narrowed workflow, top summaries, and Decision Mode queue.

Affected product areas:
- Time Context
- Review Page
- Decision Mode handoff

Affected code areas:
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/app/agents/[id]/operations/review/page.tsx`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

What was propagated:
- Restored row-backed bucket sender resolution in `gmailCleanupWorkspace.ts` so narrowed workflow membership matches the visible chart bucket truth.
- Restored row-backed narrowed timeline derivation for bucket-selected workflow data instead of sender-history inference.
- Reset `sender_page` on Time Context bucket selection in `review/page.tsx` while preserving session-only bucket state and broad-rail behavior.
- Validated the changed files with targeted ESLint; remaining warnings in `gmailCleanupWorkspace.ts` are pre-existing unused helpers, not introduced by this pass.

### [ACE-015] Review Page — Narrowing Interaction Feedback Layer

Date: 2026-04-02
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Review-page narrowing interactions now use one scoped pending-feedback model.
- Immediate click feedback must be set before transition work begins.
- Pending completion must not rely on route change alone.
- Pending clears only after:
  - requested route/session state is present
  - the authoritative sender universe matches that requested narrowed state
  - relevant loading states are clear

Reason:
- The previous interaction model could feel like a dead click because the narrowed result appeared later with no immediate confirmation.
- The review page now needs explicit feedback that preserves the accepted Lane B data/authority contract without redesigning the page.

Affected product areas:
- Sender Distribution
- Time Context
- Review Page workflow header
- Review Page top summaries

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`
- `web/src/components/runtime/GmailCleanupComponents.tsx`

Docs requiring propagation:
- `03_gmail_workspace/04_sender_decision_ui/01_analysis_rail/Shared_Rail_Analysis_spec.md`
- `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

What was propagated:
- Added local pending-interaction state on the review page for narrowing/reset interactions.
- Added immediate pending highlight treatment for Sender Distribution and Time Context selections.
- Unified the loading story across the rail status pill, workflow header, and top summary cards.
- Locked completion to authoritative narrowed sender-universe application plus cleared loading state.
- Strengthened the visual dominance of the same feedback model without changing its logic:
  - clicked pending targets now use stronger but geometry-stable emphasis so the charts stay full-scope
  - removed pending bar resizing that made Sender Distribution / Time Context feel visually collapsed or over-compressed
  - removed stacked glow / multi-outline emphasis in the rails
  - rail status pills now use clear prominence without overpowering the chart
  - the workflow area still reacts immediately with a clear updating banner and stronger in-place loading treatment
- Applied the final rail-context correction required to preserve full-scope chart rendering:
  - Sender Distribution now binds to the broad rail sender dataset instead of the narrowed workflow sender subset
  - Time Context now prefers the broader coverage workspace for rail context while sender-focused workflow narrowing stays below
  - live browser proof was re-run on `3000` and confirmed:
    - Sender Distribution stayed at `850` slots before and after sender click
    - Time Context stayed at `20` buckets after bucket click

Notes:
- This pass is UX feedback only.
- It does not change backend behavior, narrowing contract, or introduce a new rehydrate path.
- The only non-visual correction in this event is the render-source fix that keeps the rails attached to their intended broad-context datasets/workspaces.

---

### [ACE-014] Time Context — Lane B Filtering/Parity Closeout Accepted

Date: 2026-04-02
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Analysis Rail / Time Context Lane B is accepted as closed for workflow-filtering/parity behavior on the validated scoped review route.
- The closeout covers:
  - bucket-to-workflow parity
  - selected-bucket authority after hover/unhover
  - duplicate authoritative-context chip/key cleanup on the validated route
- The closeout does not include broader runtime simplification or removal of the cold-boot review bootstrap request.

Reason:
- The validated scoped review route now has an accepted answer to “what sender set am I looking at right now?” and that accepted answer remains stable during bucket interaction.
- The remaining runtime-noise follow-up is separate and should not keep the Lane B filtering/parity milestone open.

Affected product areas:
- Shared Analysis Rail
- Time Context

Affected code areas:
- None in this pass; closeout is a control-plane milestone acceptance.

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`
- `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`

What was propagated:
- Marked Lane B closed in the control plane for Time Context filtering/parity behavior.
- Kept ACE-005 active and explicitly separate from the Lane B milestone.
- Recorded the milestone in `CHANGELOG.md`.
- Updated the Time Context phased plan so the closeout language no longer conflicts with the accepted milestone.

Notes:
- This closeout is for filtering/parity behavior only.
- The broader Time Context grammar lock remains open as separate work.
- ACE-005 remains active for any residual malformed inbox-analysis caller outside the narrowed review-route chain.
- Cold-boot review-route `/api/agents/playground` bootstrap behavior is currently accepted as required under the present architecture and is not a Lane B blocker.

---

### [ACE-013] Time Context — Lane B Single-Authoritative-Sender-Universe Enforcement

Date: 2026-04-01
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Time Context filtering now resolves through one explicit authoritative sender universe across active workflow filters.
- Session-only bucket selection no longer competes with peer workflow filters through hidden precedence rules.
- Sender rows, workflow summary, pagination totals, Sender Distribution ordering/counts, and Decision Mode queue progression now read from the same resolved ordered sender set.
- Bucket highlighting remains visual-only for the chart:
  - no chart collapse
  - no aggregation rewrite

Reason:
- Lane B needed an enforceable answer to “what sender set am I looking at right now?”
- Previous bucket behavior could still drift when different narrowing paths used different authority sources.

Affected product areas:
- Time Context
- Shared Analysis Rail
- Sender Overview
- Decision Mode

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`

Docs requiring propagation:
- `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
- `03_gmail_workspace/04_sender_decision_ui/01_analysis_rail/Shared_Rail_Analysis_spec.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

What was propagated:
- Recorded the one-authoritative-sender-universe rule in the Time Context phased plan.
- Updated the Shared Analysis Rail spec to require deterministic combined filtering through the shared workflow subset.
- Updated control-plane continuity docs so the implementation status and remaining browser-proof work are explicit.
- Applied the April 2 correction pass in the review page / rail components so selected-bucket summary surfaces, hover behavior, and Sender Distribution authoritative-context chips no longer drift away from the resolved workflow sender universe.
- Applied the April 2 selected-bucket authority correction so the remaining `5 -> 9` mismatch no longer mixes chart bucket semantics with row-any-message bucket membership:
  - bucket-filtered workflow membership now resolves from the same sender-level Time Context semantics as the clicked chart
  - selected-bucket count surfaces now prefer the active narrowed bucket workspace over broader coverage fallbacks

Notes:
- This event recorded the contract-enforcement implementation that later closed under `ACE-014`.
- This event does not close the separate empty `action:""` runtime-noise follow-up.
- Cold-boot review-route `/api/agents/playground` bootstrap behavior is tracked separately and is not part of the Lane B closeout.

---

### [ACE-012] Shared Hot-File Merge System Hardening

Date: 2026-04-01
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- The hot-file merge system is refined through one authoritative protocol document instead of relying on scattered checklist-only guidance.
- Merge preflight must use merge-base, two-sided overlap detection rather than a one-sided changed-file view.
- If classification = `hot_file_integration_required`, full git merge is prohibited and the work must route to a dedicated Codex integration pass.
- Default merge bias rules are now explicit:
  - UI files prefer `main` unless PM overrides
  - runtime logic prefers the active worktree lane
  - imports union unless the conflict is semantic
  - types/interfaces prefer the superset, not reduction
- If Codex fails the same hot-file integration twice, execution must stop and return to PM instead of retrying blindly.

Reason:
- The April 1 baseline established the operating model, but the system still needed one authoritative protocol and tighter enforcement for preflight, merge prohibition, and escalation.
- The goal is to keep Oliver out of manual shared-file triage by default while preserving a lightweight and repeatable workflow.

Affected system areas:
- Codex execution system
- PM routing and review workflow
- worktree sync operating model
- hot-file integration workflow

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/lib/integrations/gmail/inboxAnalysis.ts`
- future PM-designated shared hot files

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/CHANGELOG.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `00_core_context/Project Manager Activation & Turnover Protocol.md`
- `07_reference/Shared_Hot_File_Merge_Protocol.md`
- `07_reference/Git_GitHub_Worktrees_Backups_operating_Model.md`
- `07_reference/Simple_Worktrees_Setup_Checklist.md`
- `07_reference/OLIVER_OPERATING_CHECKLIST.md`
- `07_reference/CODEX_PROMPT_TEMPLATES.md`
- `07_reference/SYSTEM_MEMORY_MAP.md`
- `AGENTS.md`

What was propagated:
- Added `Shared_Hot_File_Merge_Protocol.md` as the authoritative human-readable merge workflow.
- Tightened merge preflight to require merge-base, two-sided overlap classification.
- Added the hard prohibition on full git merge for `hot_file_integration_required`.
- Recorded the default merge bias rules for UI, runtime logic, imports, and types/interfaces.
- Added the two-failure escalation rule that returns the decision to PM.

Notes:
- `ACE-009`, `ACE-010`, and `ACE-011` remain completed historical context and were not reopened by this pass.
- No runtime, UI, schema, or product behavior changed in this pass.

### [ACE-010] Shared Hot-File Merge Protocol + Codex-Assisted Integration

Date: 2026-04-01
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Shared hot files must be explicitly identified and treated as a separate integration class from docs/control-plane files.
- Codex should perform preflight detection of overlapping hot-file edits between `main` and active worktrees before any attempted merge.
- Hot shared code merges should be handled through a dedicated Codex-assisted integration pass instead of ad hoc manual comparison by Oliver.

Reason:
- Files such as `review/page.tsx`, `gmailCleanupWorkspace.ts`, and `inboxAnalysis.ts` produced high-friction manual merge conflicts.
- These files are shared runtime surfaces that multiple lanes may touch concurrently.
- The system needs a repeatable mechanism to detect, classify, and route these merges safely.

Affected system areas:
- Codex execution system
- Worktree operating model
- Runtime integration workflow
- PM review workflow

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/lib/integrations/gmail/inboxAnalysis.ts`
- Any future files designated as shared hot files

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/CHANGELOG.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `07_reference/Git_GitHub_Worktrees_Backups_operating_Model.md`
- `07_reference/Simple_Worktrees_Setup_Checklist.md`
- `07_reference/OLIVER_OPERATING_CHECKLIST.md`
- `07_reference/CODEX_PROMPT_TEMPLATES.md`
- `AGENTS.md`

What was propagated:
- Defined `shared hot files` in the active operating model and prompt templates.
- Added merge preflight rules that classify overlap before any attempted full merge.
- Added a dedicated Codex-assisted hot-file integration workflow and explicitly removed Oliver as the default manual merge resolver.
- Locked the current shared hot-file list into the operating docs.

Notes:
- Human review may still be required for final product judgment, but Codex owns the comparison/proposal/integration workflow.
- `ACE-011` remains completed historical recovery context and is not reopened by this event.

---

### [ACE-009] Worktree Sync Automation + Conflict Recovery System

Date: 2026-04-01
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Worktree synchronization must no longer rely on manual human conflict resolution for control-plane and documentation files.
- The system must introduce a documented and automatable docs-only sync workflow between `main` and active worktrees.
- The system must introduce a documented conflict-recovery workflow for aborting unsafe full merges, restoring resolved docs, and completing docs-only sync safely.
- Control-plane sync and shared-code integration are now treated as separate operations.

Reason:
- Manual worktree sync created excessive operator overhead and unacceptable time cost.
- The current merge process exposed that control-plane/doc sync and hot shared code merges have different risk profiles.
- Future PM activation and turnover must not depend on repeating manual merge triage.

Affected system areas:
- Worktree operating model
- Control Plane
- PM activation / turnover workflow
- Codex execution system
- Local Git operating process

Affected code areas:
- Documentation / operating-model layer in this pass
- Optional future automation scripts / skills layer

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/CHANGELOG.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `01_workspace_architecture/system_overview.md`
- `07_reference/Git_GitHub_Worktrees_Backups_operating_Model.md`
- `07_reference/Simple_Worktrees_Setup_Checklist.md`
- `07_reference/OLIVER_OPERATING_CHECKLIST.md`
- `00_core_context/Project Manager Activation & Turnover Protocol.md`
- `07_reference/SYSTEM_MEMORY_MAP.md`
- `07_reference/CODEX_PROMPT_TEMPLATES.md`

What was propagated:
- Added formal `docs-only sync` procedures for `main -> worktree` and `worktree -> main`.
- Added formal `conflict recovery` steps for unsafe full merges.
- Added explicit rules for aborting a full merge and falling back to docs-only sync.
- Added PM/Codex-facing execution guidance so the recovery flow no longer depends on Oliver reconstructing it manually.

Notes:
- This event produced the official automation-ready documentation for the merge-recovery workflow.
- `ACE-011` remains the completed historical execution record for the recovery example itself.

---

### [ACE-011] Docs-Only Worktree Sync Recovery Executed

Date: 2026-04-01
Owner: PM
Status: Completed
Propagation Owner: Human + Git
Propagation Status: Fully Executed

Decision:
- The failed full merge between `main` and `cleanup-taxonomy-rebuild` was intentionally split into:
  - a docs/control-plane sync
  - deferred shared-code integration
- Resolved control-plane documents were preserved, the unsafe full merge was aborted, and docs-only sync was completed in both directions.

Reason:
- Full merge included shared hot-file conflicts that were not appropriate to resolve during control-plane alignment and PM activation prep.
- The immediate goal was to unify operating docs and control-plane truth without forcing risky code integration.

What was done:
- Backed up resolved doc merges from the interrupted main-repo merge.
- Aborted the unsafe full merge on `main`.
- Restored resolved control-plane docs into `main`.
- Pulled docs/proofs from `cleanup-taxonomy-rebuild` into `main` and committed/pushed a docs-only sync.
- Aborted the unsafe repo -> worktree full merge in `cleanup-taxonomy-rebuild`.
- Pulled updated control-plane / operating docs from `origin/main` into the cleanup worktree and committed/pushed a docs-only sync.

Files / areas affected:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/CHANGELOG.md`
- `07_reference/project_structure.txt`
- cleanup-group docs / proofs
- PM / Codex operating docs synced into both repo contexts

Notes:
- This event records what was already executed.
- Shared hot-file code integration remains intentionally deferred and should be handled under a separate active protocol.

---

### [ACE-008] Codex Prompt Standardization

Date: 2026-04-01
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Non-trivial PM -> Codex execution prompts now use `07_reference/CODEX_PROMPT_TEMPLATES.md` as the standard source of truth.
- If a task references a Skill, the prompt must include both `Skill` and `Skill Location`.
- Codex must explicitly load the referenced skill file from the local Codex skills directory before execution.
- Ambiguous or unscoped PM -> Codex execution prompts are no longer valid for non-trivial work.

Reason:
- Reduce execution drift between PM intent and Codex behavior.
- Make skill usage explicit and enforceable.
- Keep the `Oliver -> Project Manager -> Codex` communication model consistent across the control plane.

Affected system areas:
- Control Plane
- Core Context
- PM -> Codex communication model
- Codex instruction layer
- Skills workflow

Affected code areas:
- Documentation and operating-model layer only in this pass.

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `00_core_context/agent_activation_checklist.md`
- `AGENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- `07_reference/CODEX_PROMPT_TEMPLATES.md` is the reference source of truth for this standardization pass.
- Propagated in this pass:
  - `06_system_state/CURRENT_STATE.md`
  - `06_system_state/TODO.md`
  - `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
  - `00_core_context/agent_activation_checklist.md`
  - `06_system_state/CHANGELOG.md`
- Verified unchanged in this pass:
  - `AGENTS.md`

---

### [ACE-007] Context Migration — Multi-Thread Work Capture

Date: 2026-04-01
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- All active work, decisions, and system changes from the originating chat session are now migrated into the Control Plane.
- This entry replaced chat-held continuity across multiple threads and worktrees with explicit control-plane truth.
- Future work must reference the Control Plane + `ACTIVE_CHANGE_EVENTS.md` instead of prior chat history.

Reason:
- Chat-held continuity had exceeded sustainable session length and created drift risk.
- Critical Cleanup Groups and Analysis Rail decisions existed in chat but not in the authoritative docs.
- A clean Project Manager handoff required the current system state to be recoverable from docs alone.

Major work streams captured:
1. Cleanup Groups — Multi-Phase Rebuild
   - Phase 0-4 planning locked.
   - Lane A implemented and accepted for root-surface behavior.
   - Lane B partially closed with marketing unit-only entry, review-unit integrity, spillover as a first-class unit, unit-scoped hero truth, unit-scoped decision handoff, and invalid/missing/blank unit guards.
   - Lane B final closeout remains open and Lane C has not started.
2. Analysis Rail / Time Context / Charts
   - Lane A implemented with scope strip enforcement, exact bucket grammar, empty interval preservation, row-backed monthly aggregation, same-array truth, non-additive bucket truth, axis readability improvements, and ghost-slot rendering.
   - This migration event captured the then-open Lane B filtering/parity work that later closed under `ACE-014`.
   - Residual validation/reconciliation and the separate `ACE-005` runtime-noise follow-up remained open after the migration snapshot.

Affected systems:
- Gmail Workspace
- Sender Decision UI
- Cleanup Groups
- Analysis Rail
- Time Context
- Sender Distribution
- Decision Mode
- Runtime (inbox-analysis API)
- Artifact Engine (timeline dependency)
- Codex execution system
- Documentation system (control plane + orientation)

Affected code areas:
- `review/page.tsx`
- `clusters/page.tsx`
- `GmailCleanupComponents.tsx`
- `gmailCleanupWorkspace.ts`
- `inboxAnalysis.ts`
- runtime workspace + inbox-analysis API
- artifact / timeline generation logic

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `01_workspace_architecture/system_overview.md`
- `04_product_design/PM_ONBOARDING_BRIEF.md`
- `06_system_state/CHANGELOG.md`

Notes:
- This event is the authoritative migration point from chat -> system for the captured work streams.
- Propagated in this pass:
  - `06_system_state/CURRENT_STATE.md`
  - `06_system_state/TODO.md`
  - `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
  - `01_workspace_architecture/system_overview.md`
  - `04_product_design/PM_ONBOARDING_BRIEF.md`
  - `06_system_state/CHANGELOG.md`
- Verified unchanged in this pass:
  - `07_reference/SYSTEM_MEMORY_MAP.md`
  - `AGENTS.md`
  - `00_core_context/agent_activation_checklist.md`
- Incomplete product/runtime phases remain active work, but the context-migration event itself is fully propagated and closed.

### [ACE-006] Codex Operating System Implementation

Date: 2026-04-01
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- The project now runs on a Codex Operating System.
- The operating model is now split into Control Plane, Orientation, Routing, and Skills layers.
- Control Plane files define active truth.
- `SYSTEM_MEMORY_MAP.md` is now a routing system, not a static index.
- `AGENTS.md` defines enforceable Codex behavior.
- PM activation now uses a 3-message model: Control Plane, Orientation, Execution Continuity.
- Skills under `.agents/skills/` define repeatable execution workflows.

Reason:
- Reduce drift.
- Reduce manual document coordination.
- Reduce turnover time.
- Eliminate memory-based workflow management.
- Make PM → Codex execution repeatable and enforceable.

Affected system areas:
- Control Plane
- Core Context
- Workspace Architecture
- Agent Runtime
- Gmail Workspace
- Product Design
- Codex Instruction Layer
- Data / Schema / Reference Layer
- Operating Model
- Skills Layer

Affected code areas:
- Documentation and operating-system layer only in this pass.

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `01_workspace_architecture/system_overview.md`
- `04_product_design/PM_ONBOARDING_BRIEF.md`
- `07_reference/SYSTEM_MEMORY_MAP.md`
- `AGENTS.md`
- `00_core_context/agent_activation_checklist.md`
- `06_system_state/CHANGELOG.md`

Notes:
- This is the first full-system propagation test of the new operating model.
- `SYSTEM_MEMORY_MAP.md`, `AGENTS.md`, and `agent_activation_checklist.md` may already be aligned, but they must be verified against the new operating model rather than assumed.
- First full-system propagation validation pass completed on 2026-04-01.
- Propagated in this pass:
  - `06_system_state/CURRENT_STATE.md`
  - `06_system_state/TODO.md`
  - `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
  - `01_workspace_architecture/system_overview.md`
  - `04_product_design/PM_ONBOARDING_BRIEF.md`
  - `06_system_state/CHANGELOG.md`
- Verified unchanged in this pass:
  - `07_reference/SYSTEM_MEMORY_MAP.md`
  - `AGENTS.md`
  - `00_core_context/agent_activation_checklist.md`
- This event is complete and should now be treated as closed historical context unless a new operating-model change is introduced.

### Historical Continuity Note — Former ACE-047 Verification Discipline

Original Date: 2026-04-12  
Owner: PM  
Status: Superseded by the active `ACE-047 Time Context Rebuild` lane on 2026-04-16  
Propagation Owner: Codex

Decision:
- This former ACE-047 captured the verification-discipline escalation that preceded the rebuild activation.
- Codex may not treat a pass as complete, tentatively acceptable, or ready for propagation unless the rendered chart truth is reconciled against the workflow truth on the same live route.
- For ACE-046 Time Context work, required visible verification must compare at minimum:
  - Workflow totals
  - Sender Distribution totals
  - Time Context bucket totals
  - the same calendar dates across adjacent scopes when those scopes overlap
- The governing invariant is now explicit verification truth, not inferred implementation confidence:
  - same dates = same senders = same counts
  - Workflow is the authoritative sender universe
  - visible Time Context charts must reconcile to that same universe
  - Sender Distribution must reconcile to that same universe
- Codex may not close out a pass by saying the remaining issue is acceptable within a different chart “universe,” “story,” or derivation path.
- If visible surfaces disagree, the pass remains open.
- Codex must continue within the active thread/mode unless a real control-plane boundary is hit:
  - accepted fix
  - governing truth change
  - propagation checkpoint
  - thread-closeout boundary
  - explicit PM-directed replan/new thread
- “Could not finish” or “partial improvement only” is not a valid stopping point by itself when the active execution scope is still bounded and the blocker remains diagnosable.

Reason:
- Repeated QA evidence showed Codex reporting passes as materially complete while the rendered surfaces still visibly contradicted each other.
- PM had to repeatedly catch obvious cross-scope contradictions that should have been rejected during Codex self-verification, including:
  - daily vs weekly mismatch on the same dates
  - weekly vs monthly mismatch on the same dates
  - yearly April totals contradicting monthly April totals
  - Time Context chart totals contradicting Workflow and Sender Distribution totals
  - `all_indexed` failing to render while narrower scopes were still being treated as partially acceptable
- This is now recognized as an operating-model verification breakdown, not just a product bug.
- The control plane must preserve that accepted implementation is blocked unless Codex proves rendered-surface reconciliation, not merely code-path intent.
- This content remains historical governing continuity, but it no longer defines the active lane identifier or active next step.

Affected product areas:
- Operations Review
- Shared Analysis Rail
- Time Context
- Sender Distribution
- PM / Codex verification workflow

Affected code areas:
- no code target in this ACE itself
- enforcement applies to future ACE-046 implementation and verification passes

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/CHANGELOG.md` only when this enforcement event is later accepted/completed

Notes:
- This ACE does not replace `ACE-046`; it governs how `ACE-046` must be verified.
- Required PM/Codex proof for future Time Context closeout must include a reconciliation bundle on the same canonical route showing:
  - `1D`
  - `1W`
  - `1M`
  - `1Y`
  - `all_indexed` when applicable
  - explicit comparison between Workflow totals and visible chart totals
  - explicit comparison of overlapping dates across adjacent scopes
- Future verification language must reject phrases such as:
  - “correct in its own universe”
  - “acceptable enough to move on”
  - “partial fix with residual visible mismatch”
  when rendered surfaces still contradict each other.
- This ACE remains active until the control plane and execution discipline fully reflect this verification requirement.

---
