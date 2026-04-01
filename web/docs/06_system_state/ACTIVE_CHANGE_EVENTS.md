# ACTIVE_CHANGE_EVENTS.md

## Purpose
This file tracks active architectural, product, workflow, UI, and operating-model decisions that have changed and still require propagation across code, documentation, and operating context.

## Rules
- Only include changes that are still live and not fully propagated.
- Each change event must be specific and scoped.
- When all related docs/code are updated, mark the event completed or move it to a completed section later.
- This file is a control-plane document, not a brainstorming document.
- Propagation status must be explicit.

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

### [ACE-006] Codex Operating System Implementation

Date: 2026-04-01  
Owner: PM  
Status: Active  
Propagation Owner: Codex

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

---

## Completed Change Events

(None yet — this file is still in active rollout mode.)