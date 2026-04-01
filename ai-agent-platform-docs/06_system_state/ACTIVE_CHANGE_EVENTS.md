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

---

## Active Change Events

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

---

## Completed Change Events

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
   - Bucket-to-workflow filtering, residual validation/reconciliation, and empty `action:""` runtime-noise investigation remain open.

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
