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

---

## Completed Change Events

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
