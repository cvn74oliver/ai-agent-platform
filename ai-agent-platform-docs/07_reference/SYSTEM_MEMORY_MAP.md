

# AI Agent Platform — System Memory Map

## Purpose
This document is the **top-level memory and navigation layer** for the AI Agent Platform.

It exists to help the Project Manager, Codex, and future agents quickly answer:

- What are the most important source-of-truth documents?
- Which document governs which part of the system?
- Which documents matter for Gmail Workspace work vs broader platform work?
- Which files should be consulted before implementation, testing, or handoff?

This document is **not** the product spec itself.
It is the **memory index and operating map** for the documentation system.

---

# Core Rule

When reasoning about the project, follow this order:

1. **Core project intent**
2. **Workspace architecture**
3. **Active product/workstream specs**
4. **Current system state**
5. **Codex execution rules**

This prevents implementation from drifting away from the documented product vision.

---

# Source-of-Truth Hierarchy

## Layer 1 — Core Project Intent
These files define the overall mission, scope, and operating model of the AI Agent Platform.

### Primary file
- `00_core_context/00_MASTER_PROJECT.md`

### Supporting execution files
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `00_core_context/09_CODEX_EXECUTION_PROTOCOL.md`
- `00_core_context/10_CODEX_SESSION_CHECKLIST.md`

### Use this layer when
- deciding if a feature fits the product vision
- determining project priorities
- activating or directing Codex
- resolving ambiguity about how the Project Manager should operate

---

## Layer 2 — Workspace Architecture
These files define the stable architectural model of the overall platform.

### Primary files
- `01_workspace_architecture/AI_WORKSPACE_ARCHITECTURE.md`
- `01_workspace_architecture/AI_WORKSPACE_IMPLEMENTATION_RULES.md`
- `01_workspace_architecture/AI_WORKSPACE_SYSTEM_INDEX.md`
- `01_workspace_architecture/system_overview.md`

### Use this layer when
- checking whether a UI or workflow violates platform architecture
- deciding where a feature belongs
- validating that implementation stays modular
- updating system-state summaries after a milestone

---

## Layer 3 — Active Product System: Gmail Workspace
These files define the Gmail Workspace product, architecture, UX, intelligence layer, ingestion model, sender-decision system, and management/execution behavior.

This is currently the **most active product system** in the project.

### Core Gmail overview files
- `03_gmail_workspace/00_overview/gmail_workspace_phase_plan.md`
- `03_gmail_workspace/00_overview/gmail_workspace_product_flow.md`
- `03_gmail_workspace/00_overview/final_product_spec.md`
- `03_gmail_workspace/09_reference/gmail_workspace_system_index.md`

### Gmail ingestion files
- `03_gmail_workspace/01_ingestion/inbox_ingestion_spec.md`
- `03_gmail_workspace/01_ingestion/smart_sync_and_maintenance_spec.md`

### Gmail intelligence files
- `03_gmail_workspace/02_intelligence/inbox_health_spec.md`
- `03_gmail_workspace/02_intelligence/inbox_health_algorithm.md`
- `03_gmail_workspace/02_intelligence/intelligence_dashboard_spec.md`
- `03_gmail_workspace/02_intelligence/intelligence_orchestrator.md`
- `03_gmail_workspace/02_intelligence/visual_intelligence_spec.md`
- `03_gmail_workspace/02_intelligence/analytics_spec.md`
- `03_gmail_workspace/02_intelligence/health_engine.md`

### Gmail decision-system files
- `03_gmail_workspace/03_decision_system/decision_model_spec.md`
- `03_gmail_workspace/03_decision_system/decision_storage_spec.md`
- `03_gmail_workspace/03_decision_system/decision_destinations_spec.md`
- `03_gmail_workspace/03_decision_system/decision_engine_spec.md`
- `03_gmail_workspace/03_decision_system/decision_scoring_advanced.md`

### Gmail sender-decision UI files
- `03_gmail_workspace/04_sender_decision_ui/sender_decision_mode_spec.md`
- `03_gmail_workspace/04_sender_decision_ui/decision_ui_flow.md`
- `03_gmail_workspace/04_sender_decision_ui/decision_mode_full_build_spec.md`
- `03_gmail_workspace/04_sender_decision_ui/workspace_ui_structure.md`
- `03_gmail_workspace/04_sender_decision_ui/workspace_ux_spec.md`
- `03_gmail_workspace/04_sender_decision_ui/decision_mode_animation_spec.md`
- `03_gmail_workspace/04_sender_decision_ui/decision_mode_component_map.md`
- `03_gmail_workspace/04_sender_decision_ui/decision_mode_ui_final_build_spec.md`

### Gmail management / execution files
- `03_gmail_workspace/05_management_execution/management_flow_spec.md`
- `03_gmail_workspace/05_management_execution/management_execution_engine.md`
- `03_gmail_workspace/05_management_execution/execution_queue_spec.md`
- `03_gmail_workspace/05_management_execution/execution_safety_preview.md`

### Gmail learning / reinforcement files
- `03_gmail_workspace/06_learning_system/ai_learning_layer_moat.md`
- `03_gmail_workspace/06_learning_system/system_feedback_and_reinforcement.md`
- `03_gmail_workspace/06_learning_system/self_learning_pipeline.md`
- `03_gmail_workspace/06_learning_system/autonomous_inbox_evolution_loop.md`

### Gmail engine / supporting files
- `03_gmail_workspace/07_engines/recommendation_engine_spec.md`
- `03_gmail_workspace/07_engines/sender_trust_graph.md`
- `03_gmail_workspace/08_gamification/gamification_reward_system.md`
- `03_gmail_workspace/09_reference/codex_safeguards.md`
- `03_gmail_workspace/09_reference/engineering_spec.md`
- `03_gmail_workspace/09_reference/implementation_phase_1.md`
- `03_gmail_workspace/09_reference/performance_spec.md`

### Use this layer when
- reviewing Mailbox Intelligence screenshots
- reviewing Cleanup Groups screenshots
- reviewing Sender Decisions screenshots
- reviewing Management / execution behavior
- deciding whether a requested improvement belongs to ingestion, intelligence, decision UI, or management execution
- instructing Codex on Gmail implementation
- deciding what belongs in current scope vs later optimization

---

## Layer 4 — Current System State
These files define what is actually implemented now and what still remains.

### Primary files
- `06_system_state/CHANGELOG.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/ARCHIVE_TODO_HISTORY.md`

### Use this layer when
- validating whether something was already implemented
- checking the latest milestone outcome
- identifying what remains in the current phase
- preparing Codex follow-up tasks
- producing PM summaries and handoffs

---

## Layer 5 — Codex Control System
These files define how Codex should be managed, constrained, and evaluated.

### Primary files
- `08_codex_instructions/CODEX_ARCHITECTURE_LOCK.md`
- `08_codex_instructions/CODEX_DEBUG_PLAYBOOK.md`
- `08_codex_instructions/CODEX_EXECUTION_CHECKLIST.md`
- `08_codex_instructions/CODEX_EXECUTION_RULES.md`
- `08_codex_instructions/PM_CODEX_UI_REVIEW_PROTOCOL.md`
- `00_core_context/09_CODEX_EXECUTION_PROTOCOL.md`
- `00_core_context/10_CODEX_SESSION_CHECKLIST.md`

### Use this layer when
- preparing a Codex task
- keeping Codex in scope
- reducing architecture drift
- deciding whether to use the same Codex thread or a new one
- determining the correct PM review expectations

---

# Recommended Reasoning Order by Task Type

## If reviewing UI screenshots
Consult in this order:

1. `00_MASTER_PROJECT.md`
2. `07_PROJECT_MANAGER_CONTEXT.md`
3. `system_overview.md`
4. `03_gmail_workspace/00_overview/gmail_workspace_product_flow.md`
5. `03_gmail_workspace/04_sender_decision_ui/workspace_ui_structure.md`
6. `03_gmail_workspace/04_sender_decision_ui/workspace_ux_spec.md`
7. `03_gmail_workspace/02_intelligence/visual_intelligence_spec.md`
8. `03_gmail_workspace/02_intelligence/intelligence_dashboard_spec.md`
9. `CURRENT_STATE.md`
10. `TODO.md`

---

## If sending Codex a new implementation task
Consult in this order:

1. `00_MASTER_PROJECT.md`
2. `07_PROJECT_MANAGER_CONTEXT.md`
3. relevant Gmail spec from:
   - `03_gmail_workspace/00_overview/`
   - `03_gmail_workspace/03_decision_system/`
   - `03_gmail_workspace/04_sender_decision_ui/`
   - `03_gmail_workspace/05_management_execution/`
4. `CURRENT_STATE.md`
5. `TODO.md`
6. `09_CODEX_EXECUTION_PROTOCOL.md`
7. `10_CODEX_SESSION_CHECKLIST.md`
8. `PM_CODEX_UI_REVIEW_PROTOCOL.md` (for UI tasks)

---

## If reviewing a PM REVIEW PACKET
Consult in this order:

1. relevant active phase file
2. `CURRENT_STATE.md`
3. `TODO.md`
4. `system_overview.md`
5. Codex instruction files if scope drift is suspected

---

## If deciding whether something is Phase 1 or later
Consult in this order:

1. `03_gmail_workspace/00_overview/gmail_workspace_phase_plan.md`
2. `03_gmail_workspace/09_reference/implementation_phase_1.md`
3. `03_gmail_workspace/00_overview/gmail_workspace_product_flow.md`
4. `03_gmail_workspace/00_overview/final_product_spec.md`
5. `TODO.md`

---

# Gmail Workspace Quick Memory Model

```text
Mailbox Intelligence
→ high-level mission dashboard and macro inbox understanding

Cleanup Groups
→ cluster selection and handoff into sender review

Sender Overview
→ high-level sender analytics for the chosen group

Decision Mode
→ primary one-sender-at-a-time Tinder-style decision engine

Management
→ execution buckets, preview, push-to-Gmail, undo

Rules / Monitoring / Maintenance
→ learning, automation evolution, and Smart Sync-driven upkeep
```

And hold these product truths:

- the system is **sender-first**, not message-first
- Mailbox Intelligence should not become a second Sender Overview page
- Cleanup Groups should not become a full review workspace
- Sender Overview provides the macro context before Decision Mode starts
- Decision Mode is the deepest focused interaction layer and must remain one-sender-at-a-time
- Management is where actions become real and trust is won or lost
- Smart Sync handles incremental maintenance only; historical traversal belongs to Continue Backfill
- runtime stability should be preserved while UX improves incrementally

---

# Gmail Workspace Intelligence Memory Model

```text
Inbox Ingestion
→ Inbox Health Engine
→ Intelligence Orchestrator
→ Sender Decision Model
→ Decision Storage
→ Sender Decision UI
→ Management Execution Engine
→ Learning / Reinforcement Layer
→ Smart Sync Maintenance Layer
```

These systems should be consulted conceptually when determining whether a dashboard, recommendation, sender workflow, or execution behavior is aligned with the documented product.

---

# What This File Replaces

This file reduces the need to repeatedly paste:

- full project trees
- folder structures
- reminders about which documents matter most

Instead, this file should become the **single memory entry point** for documentation-driven reasoning.

---

# What This File Does Not Replace

This file does **not** replace:

- the actual product specs
- the active phase plan
- the current system-state documents
- Codex execution constraints

It only tells the system **where to look first and why**.

---

# Repository Document Tree (Reference Snapshot)

This section provides a compact structural snapshot of the current documentation layout so the PM, Codex, and future agents can quickly remember where major document families live.

It is a **reference snapshot**, not the source of truth for individual file contents.
If the repo structure changes materially, this section should be refreshed.

```text
├── ai-agent-platform-docs
│   ├── 00_core_context
│   │   ├── 00_MASTER_PROJECT.md
│   │   ├── 01_ARCHITECT_CONTEXT.md
│   │   ├── 02_FRONTEND_CONTEXT.md
│   │   ├── 03_BACKEND_CONTEXT.md
│   │   ├── 04_WORKFLOWS_CONTEXT.md
│   │   ├── 05_LLM_TRAINER_CONTEXT.md
│   │   ├── 06_AVATAR_VOICE_CONTEXT.md
│   │   ├── 07_PROJECT_MANAGER_CONTEXT.md
│   │   ├── 08_PROMPT_ENGINEER_CONTEXT.md
│   │   ├── 09_CODEX_EXECUTION_PROTOCOL.md
│   │   ├── 10_CODEX_SESSION_CHECKLIST.md
│   │   └── agent_activation_checklist.md
│   ├── 01_workspace_architecture
│   │   ├── AI_WORKSPACE_ARCHITECTURE.md
│   │   ├── AI_WORKSPACE_IMPLEMENTATION_RULES.md
│   │   ├── AI_WORKSPACE_MASTER_BLUEPRINT.md
│   │   ├── AI_WORKSPACE_PRODUCT_ARCHITECTURE.md
│   │   ├── AI_WORKSPACE_SYSTEM_INDEX.md
│   │   └── system_overview.md
│   ├── 02_agent_runtime
│   │   ├── AGENT_MEMORY_AND_DECISION_ENGINE.md
│   │   ├── AI_AGENT_RUNTIME.md
│   │   ├── AI_WORKSPACE_AGENT_BEHAVIOR.md
│   │   ├── AI_WORKSPACE_AGENT_EXECUTION_ENGINE.md
│   │   ├── AI_WORKSPACE_AGENT_RUNTIME_SPEC.md
│   │   └── AI_WORKSPACE_RUNTIME_EXECUTION_MODEL.md
│   ├── 03_gmail_workspace
│   │   ├── 00_overview
│   │   │   ├── final_product_spec.md
│   │   │   ├── gmail_workspace_phase_plan.md
│   │   │   └── gmail_workspace_product_flow.md
│   │   ├── 01_ingestion
│   │   │   ├── inbox_ingestion_spec.md
│   │   │   └── smart_sync_and_maintenance_spec.md
│   │   ├── 02_intelligence
│   │   │   ├── analytics_spec.md
│   │   │   ├── health_engine.md
│   │   │   ├── inbox_health_algorithm.md
│   │   │   ├── inbox_health_spec.md
│   │   │   ├── intelligence_dashboard_spec.md
│   │   │   ├── intelligence_orchestrator.md
│   │   │   └── visual_intelligence_spec.md
│   │   ├── 03_decision_system
│   │   │   ├── decision_destinations_spec.md
│   │   │   ├── decision_engine_spec.md
│   │   │   ├── decision_model_spec.md
│   │   │   ├── decision_scoring_advanced.md
│   │   │   ├── decision_storage_spec.md
│   │   │   └── sender_surface_unification_spec.md
│   │   ├── 04_sender_decision_ui
│   │   │   ├── decision_mode_animation_spec.md
│   │   │   ├── decision_mode_component_map.md
│   │   │   ├── decision_mode_full_build_spec.md
│   │   │   ├── decision_mode_ui_final_build_spec.md
│   │   │   ├── decision_ui_flow.md
│   │   │   ├── sender_decision_mode_spec.md
│   │   │   ├── sender_overview_card_target_spec.md
│   │   │   ├── Sender_Overview_Recovery_and_Improvement_Plan.md
│   │   │   ├── workspace_ui_structure.md
│   │   │   └── workspace_ux_spec.md
│   │   ├── 05_management_execution
│   │   │   ├── execution_queue_spec.md
│   │   │   ├── execution_safety_preview.md
│   │   │   ├── management_execution_engine.md
│   │   │   └── management_flow_spec.md
│   │   ├── 06_learning_system
│   │   │   ├── ai_learning_layer_moat.md
│   │   │   ├── autonomous_inbox_evolution_loop.md
│   │   │   ├── self_learning_pipeline.md
│   │   │   └── system_feedback_and_reinforcement.md
│   │   ├── 07_engines
│   │   │   ├── recommendation_engine_spec.md
│   │   │   └── sender_trust_graph.md
│   │   ├── 08_gamification
│   │   │   └── gamification_reward_system.md
│   │   ├── 09_reference
│   │   │   ├── codex_safeguards.md
│   │   │   ├── engineering_spec.md
│   │   │   ├── gmail_workspace_canonical_engine_pattern.md
│   │   │   ├── gmail_workspace_data_access_stabilization_acceptance.md
│   │   │   ├── gmail_workspace_data_access_stabilization_proof_bundle.json
│   │   │   ├── gmail_workspace_data_access_stabilization_proof_bundle.md
│   │   │   ├── gmail_workspace_data_access_stabilization_rollout.md
│   │   │   ├── gmail_workspace_data_access_stabilization_spec.md
│   │   │   ├── gmail_workspace_full_mailbox_coverage_proof.json
│   │   │   ├── gmail_workspace_system_index.md
│   │   │   ├── implementation_phase_1.md
│   │   │   ├── performance_spec.md
│   │   │   ├── sender_intelligence_system_build_plan.md
│   │   │   └── sender_overview_semantic_rebuild_handoff.md
│   │   └── 10_archive_legacy
│   │       ├── legacy_cleanup_rebuild_plan.md
│   │       └── legacy_product_flow_v2.md
│   ├── 04_product_design
│   │   ├── AI_WORKSPACE_PRODUCT_FLOW.md
│   │   ├── operational_workflow.md
│   │   ├── playground-runtime-architecture.md
│   │   ├── PM_CODEX_EXECUTION_SYSTEM.md
│   │   └── PM_ONBOARDING_BRIEF.md
│   ├── 05_operational_playbooks
│   │   ├── daily_checklist.md
│   │   ├── monthly_checklist.md
│   │   ├── troubleshooting_recovery.md
│   │   └── weekly_checklist.md
│   ├── 06_system_state
│   │   ├── ARCHIVE_TODO_HISTORY.md
│   │   ├── CHANGELOG.md
│   │   ├── CURRENT_STATE.md
│   │   └── TODO.md
│   ├── 07_reference
│   │   ├── AI_WORKSPACE_ACTION_MODEL.md
│   │   ├── AI_WORKSPACE_DATA_MODEL.md
│   │   ├── AI_WORKSPACE_EVENT_MODEL.md
│   │   ├── AI_WORKSPACE_LLM_MEMORY_MODEL.md
│   │   ├── AI_WORKSPACE_QUERY_PATTERNS.md
│   │   ├── AI_WORKSPACE_RAG_PIPELINE.md
│   │   ├── AI_WORKSPACE_TABLE_SCHEMAS.md
│   │   ├── AI_WORKSPACE_WORKFLOW_ENGINE_SPEC.md
│   │   ├── automation_map.md
│   │   ├── phase1_clarify_spec.md
│   │   ├── project_structure.txt
│   │   ├── schema_comparison_checklist.md
│   │   └── SYSTEM_MEMORY_MAP.md
│   ├── 08_codex_instructions
│   │   ├── CODEX_ARCHITECTURE_LOCK.md
│   │   ├── CODEX_DEBUG_PLAYBOOK.md
│   │   ├── CODEX_DUAL_THREAD_CONTROL_SYSTEM.md
│   │   ├── CODEX_EXECUTION_CHECKLIST.md
│   │   ├── CODEX_EXECUTION_RULES.md
│   │   ├── CODEX_IMPLEMENTATION_GUARDRAILS.md
│   │   ├── CODEX_MASTER_INSTRUCTION_PACKET.md
│   │   ├── CODEX_PHASE_EXECUTION_PLAN.md
│   │   ├── CODEX_PHASE_EXECUTION_PROMPT_TEMPLATE.md
│   │   ├── CODEX_PM_REVIEW_PACKET_SPEC.md
│   │   ├── CODEX_REBUILD_PROTOCOL.md
│   │   ├── CODEX_RELIABILITY_SYSTEM.md
│   │   ├── CODEX_SESSION_START_PROMPT.md
│   │   ├── CODEX_SOURCE_OF_TRUTH.md
│   │   └── PM_CODEX_UI_REVIEW_PROTOCOL.md
│   ├── 09_artifact_engine
│   │   ├── ARTIFACT_ENGINE_BLUEPRINT.md
│   │   ├── ARTIFACT_ENGINE_DECISIONS.md
│   │   ├── ARTIFACT_ENGINE_TODO.md
│   │   └── WORKSPACE_ARTIFACT_METHODOLOGY.md
│   ├── 10_agent_architecture
│   │   ├── AGENT_ARCHITECTURE_TODO.md
│   │   ├── AGENT_WORKSPACE_HIERARCHY_BLUEPRINT.md
│   │   ├── MANAGER_AGENT_DECISION_MODEL.md
│   │   └── MULTI_AGENT_ORCHESTRATION_METHODOLOGY.md
│   └── visuals
│       ├── Agent Next Training Suggestion Prompt.png
│       ├── Agent Playground.png
│       ├── Agent Summary.png
│       ├── Agents.png
│       ├── Automations Tab.png
│       ├── Cleanup Groups.png
│       ├── Confirmation.png
│       ├── Dashboard.png
│       ├── Executed Actions.png
│       ├── Fine Tune Dataset Preview p1.png
│       ├── Fine Tune Dataset Preview p2.png
│       ├── Mailbox Intelligence.png
│       ├── Management.png
│       ├── New Agent Prompt.png
│       ├── Pending Approvals.png
│       ├── PM_VISUAL_REFERENCE.md
│       ├── Review Timeline.png
│       ├── Sender Decisions.png
│       └── Settings Tab.png
```

## Practical Folder Meanings
- `00_core_context/` = core mission, PM role, Codex execution protocol, and activation/checklist files
- `01_workspace_architecture/` = stable platform architecture and implementation rules
- `02_agent_runtime/` = runtime behavior, decision-engine, and execution-model docs
- `03_gmail_workspace/` = active Gmail Workspace product, UX, intelligence, and phase-specific specs
- `04_product_design/` = broader design / product flow support docs
- `05_operational_playbooks/` = recurring operating checklists and troubleshooting docs
- `06_system_state/` = authoritative project state, changelog, and active work tracking
- `07_reference/` = models, schemas, query patterns, structure references, and memory navigation docs
- `08_codex_instructions/` = Codex control system, guardrails, review packet standards, and execution rules

---

# Recommended Source Priority

If source/file limits exist, prioritize these groups in order:

1. `00_core_context`
2. `01_workspace_architecture`
3. `06_system_state`
4. `03_gmail_workspace/00_overview`
5. `03_gmail_workspace/03_decision_system`
6. `03_gmail_workspace/04_sender_decision_ui`
7. `03_gmail_workspace/05_management_execution`
8. `03_gmail_workspace/01_ingestion` and `03_gmail_workspace/02_intelligence`
9. `08_codex_instructions`
10. `07_reference`

### Active 40-File Source Strategy

The current preferred 40-file source set is optimized for:
- Project Manager startup speed
- Gmail Workspace execution accuracy
- Sender Decision UI build quality
- Codex prompt quality
- current system-state awareness

The current preferred 40-file source set is:

1. `00_core_context/00_MASTER_PROJECT.md`
2. `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
3. `00_core_context/09_CODEX_EXECUTION_PROTOCOL.md`
4. `00_core_context/10_CODEX_SESSION_CHECKLIST.md`
5. `00_core_context/agent_activation_checklist.md`
6. `01_workspace_architecture/AI_WORKSPACE_ARCHITECTURE.md`
7. `01_workspace_architecture/AI_WORKSPACE_IMPLEMENTATION_RULES.md`
8. `01_workspace_architecture/AI_WORKSPACE_SYSTEM_INDEX.md`
9. `01_workspace_architecture/system_overview.md`
10. `06_system_state/CHANGELOG.md`
11. `06_system_state/CURRENT_STATE.md`
12. `06_system_state/TODO.md`
13. `07_reference/SYSTEM_MEMORY_MAP.md`
14. `03_gmail_workspace/09_reference/gmail_workspace_system_index.md`
15. `03_gmail_workspace/00_overview/gmail_workspace_phase_plan.md`
16. `03_gmail_workspace/00_overview/gmail_workspace_product_flow.md`
17. `03_gmail_workspace/00_overview/final_product_spec.md`
18. `03_gmail_workspace/01_ingestion/inbox_ingestion_spec.md`
19. `03_gmail_workspace/01_ingestion/smart_sync_and_maintenance_spec.md`
20. `03_gmail_workspace/02_intelligence/inbox_health_spec.md`
21. `03_gmail_workspace/02_intelligence/inbox_health_algorithm.md`
22. `03_gmail_workspace/02_intelligence/intelligence_dashboard_spec.md`
23. `03_gmail_workspace/02_intelligence/intelligence_orchestrator.md`
24. `03_gmail_workspace/02_intelligence/visual_intelligence_spec.md`
25. `03_gmail_workspace/03_decision_system/decision_model_spec.md`
26. `03_gmail_workspace/03_decision_system/decision_storage_spec.md`
27. `03_gmail_workspace/03_decision_system/decision_destinations_spec.md`
28. `03_gmail_workspace/03_decision_system/decision_engine_spec.md`
29. `03_gmail_workspace/03_decision_system/decision_scoring_advanced.md`
30. `03_gmail_workspace/04_sender_decision_ui/sender_decision_mode_spec.md`
31. `03_gmail_workspace/04_sender_decision_ui/decision_ui_flow.md`
32. `03_gmail_workspace/04_sender_decision_ui/decision_mode_full_build_spec.md`
33. `03_gmail_workspace/04_sender_decision_ui/workspace_ui_structure.md`
34. `03_gmail_workspace/04_sender_decision_ui/workspace_ux_spec.md`
35. `03_gmail_workspace/05_management_execution/management_flow_spec.md`
36. `03_gmail_workspace/05_management_execution/management_execution_engine.md`
37. `03_gmail_workspace/05_management_execution/execution_queue_spec.md`
38. `03_gmail_workspace/05_management_execution/execution_safety_preview.md`
39. `03_gmail_workspace/06_learning_system/ai_learning_layer_moat.md`
40. `03_gmail_workspace/06_learning_system/system_feedback_and_reinforcement.md`

When source limits are tight, deprioritize:
- legacy archived docs
- duplicate pre-merge docs
- low-use design-side support docs
- generated mirror docs under `/web/docs`

---

# Operating Rule for the Project Manager

When new screenshots, PM packets, or UX feedback arrive:

1. interpret the issue against the product/architecture specs
2. decide whether the issue is:
   - runtime
   - UX hierarchy
   - wording/copy
   - workflow scope
   - future phase work
3. respond with a **narrow next action**, not a broad re-review of the whole system
4. minimize repeated explanation burden on Oliver

That rule is central to speeding up this project.

---

# Summary

`SYSTEM_MEMORY_MAP.md` is the documentation-memory entry point for the AI Agent Platform.

It tells the system:

- what the most important documents are
- which order to consult them in
- which files govern the Gmail Workspace
- how to reason about implementation, review, and Codex direction without repeatedly reconstructing the architecture from scratch

This file should be treated as the **memory navigation layer** for the project.
It now also includes a compact repository-tree snapshot so the PM and Codex can quickly remember where major document families live without requiring Oliver to repeatedly paste the full documentation tree into chat.

# Current Workflow Reality (March 2026)

The AI Agent Platform is currently operating on a simplified execution model:

```text
Oliver
→ Project Manager
→ Codex
```

This has replaced the earlier multi-agent execution concept in day-to-day practice.

Operational truths:
- PM is the primary product thinker and reviewer
- Codex is the primary implementation engine
- Oliver provides lightweight validation, screenshots, and approvals
- UI work must be spec-driven, not improvisational

This should be assumed when reasoning about active project execution unless a future system explicitly reintroduces specialist execution agents.

For the current Sender Decisions project, this also means:
- the PM should drive spec interpretation and Codex correction
- Oliver should not need to repeatedly restate the product direction
- Sources must stay tightly curated so the PM can reason from the correct merged Gmail docs without drift