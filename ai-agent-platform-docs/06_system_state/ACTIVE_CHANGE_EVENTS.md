# ACTIVE_CHANGE_EVENTS.md

## Purpose:
This file tracks active architectural, product, workflow, and UI decisions that have changed and still require propagation across code, documentation, and operating context.

## Rules:
- Only include changes that are still “live” and not fully propagated.
- Each change event must be specific and scoped.
- When all related docs/code are updated, mark the event completed or move it to a completed section later.
- This file is a control-plane document, not a brainstorming document.

---

## Active Change Events

---

### [ACE-001] Cleanup Groups — Marketing Unit-Only Entry Model

Date: 2026-04-01  
Owner: PM  
Status: Active  
Propagation Owner: Codex  

Decision:
- Marketing cleanup group (`semantic.marketing_subscriptions`) is now strictly unit-entry only
- Parent-level broad review is blocked
- All entry must go through a valid review unit
- Invalid/missing/blank unit routes are explicitly blocked (no fallback)

Reason:
- Prevents ambiguity in review scope  
- Enforces Phase 3 first-click workflow contract  
- Eliminates silent broad-parent fallback  

Affected product areas:
- Cleanup Groups  
- Review Page (Marketing only)  

Affected code areas:
- review/page.tsx  

Docs requiring propagation:
- 03_gmail_workspace/04_sender_decision_ui/06_cleanup_groups/Cleanup_Groups_spec_phase_plan.md  
- 03_gmail_workspace/04_sender_decision_ui/06_cleanup_groups/CLEANUP_GROUP_REDISCOVERY_IMPLEMENTATION_PLAN.md  
- 06_system_state/CURRENT_STATE.md  
- 06_system_state/TODO.md  
- 00_core_context/07_PROJECT_MANAGER_CONTEXT.md  

Notes:
- Behavior is implemented but not fully reflected across all Cleanup Groups documentation  

---

### [ACE-002] Cleanup Groups — Marketing Review-Unit Truth Model (Hero + Handoff)

Date: 2026-04-01  
Owner: PM  
Status: Active  
Propagation Owner: Codex  

Decision:
- Marketing review page hero and decision handoff now use unit-scoped truth only  
- Parent totals are no longer allowed in KPI positions  
- Unit counts must come from full unit dataset (not page slice)  

Reason:
- Eliminates “what am I reviewing?” confusion  
- Aligns top-of-page truth with workflow truth  

Affected product areas:
- Cleanup Groups  
- Review Page  

Affected code areas:
- review/page.tsx  

Docs requiring propagation:
- 03_gmail_workspace/04_sender_decision_ui/06_cleanup_groups/Cleanup_Groups_Discovery_Spec_(Artifact-Driven).md  
- 03_gmail_workspace/04_sender_decision_ui/04_workflow_integration/decision_ui_flow.md  
- 06_system_state/CURRENT_STATE.md  
- 06_system_state/TODO.md  
- 00_core_context/07_PROJECT_MANAGER_CONTEXT.md  

Notes:
- Docs still partially describe parent-scoped summaries  

---

### [ACE-003] Time Context — Row-Backed Monthly Truth (All Indexed Fix)

Date: 2026-04-01  
Owner: PM  
Status: Active  
Propagation Owner: Codex  

Decision:
- All Indexed timeline is now built from real selected-cluster rows  
- Bucket counts = distinct senders active in that month  
- Message counts = real indexed messages in that month  

Reason:
- Previous implementation produced misleading data  
- Required for trust in analysis rail  

Affected product areas:
- Time Context  
- Shared Analysis Rail  

Affected code areas:
- inboxAnalysis.ts  
- gmailCleanupWorkspace.ts  
- GmailCleanupComponents.tsx  

Docs requiring propagation:
- 03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md  
- 03_gmail_workspace/04_sender_decision_ui/01_analysis_rail/Shared_Rail_Analysis_spec.md  
- 06_system_state/CURRENT_STATE.md  
- 06_system_state/TODO.md  
- 00_core_context/07_PROJECT_MANAGER_CONTEXT.md  

Notes:
- Docs still reference old timeline logic  

---

### [ACE-004] Time Context — Bucket Truth vs Workflow Scope Clarification

Date: 2026-04-01  
Owner: PM  
Status: Active  
Propagation Owner: Codex  

Decision:
- Bucket bars = distinct active senders  
- Supporting messages = email volume  
- Bucket counts are non-additive  
- Workflow scope remains authoritative  

Reason:
- Prevents misinterpretation of chart data  

Affected product areas:
- Time Context  
- Analysis Rail  

Affected code areas:
- GmailCleanupComponents.tsx  

Docs requiring propagation:
- 03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md  
- 03_gmail_workspace/04_sender_decision_ui/01_analysis_rail/Shared_Rail_Analysis_spec.md  
- 02_distribution_chart/SENDER_DISTRIBUTION_CHART_SPEC.md  
- 06_system_state/CURRENT_STATE.md  
- 06_system_state/TODO.md  

Notes:
- Spec docs still mix additive vs non-additive logic  

---

### [ACE-005] Residual Runtime Issue — Empty Action Inbox Analysis Requests

Date: 2026-04-01  
Owner: PM  
Status: Active  
Propagation Owner: Codex  

Decision:
- Empty `action:""` inbox-analysis requests are invalid and must be eliminated  

Reason:
- Indicates malformed request path  
- Creates runtime instability risk  

Affected product areas:
- Gmail Workspace runtime  
- API layer  

Affected code areas:
- operationsWorkspace.ts  
- gmailCleanupWorkspace.ts  
- inbox-analysis API route  

Docs requiring propagation:
- 06_system_state/CURRENT_STATE.md  
- 06_system_state/TODO.md  
- 00_core_context/07_PROJECT_MANAGER_CONTEXT.md  

Notes:
- Not blocking feature acceptance, but must be resolved before system hardening  

---

## Completed Change Events

(None yet — Phase 1 intentionally starts without backfilling)