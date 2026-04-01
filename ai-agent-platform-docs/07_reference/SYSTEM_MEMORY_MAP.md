# AI Agent Platform — System Memory Map

## Purpose

This document is the **routing layer** for the AI Agent Platform documentation system.

It exists to answer three questions quickly and consistently:

- What documents exist?
- When should they be loaded?
- Which documents are mandatory vs optional vs reference-only?

This file is **not** the product spec.
It is **not** a repo tree dump.
It is the **decision-based routing guide** for the Project Manager and Codex.

---

# Routing Philosophy (Critical)

This system routes in layers:

1. Control Plane (truth + motion)
2. System Layer (RAG / LLM / Workspace / Runtime)
3. Feature Domain (e.g., Gmail)
4. Execution Layer (Codex rules)
5. Data Layer (schema / queries)
6. Archive Layer (history only)

All routing decisions must follow this hierarchy.

Gmail is a feature domain, not the system.

The platform must always be reasoned at the system level first, then routed into feature domains.

---

# Core Routing Rule

Always load the **Control Plane** first.
Then load only the minimum additional document set required by the task.

Routing order:

1. **Control Plane**
2. **Feature or system domain docs**
3. **Execution protocol docs**
4. **Reference / schema docs if needed**
5. **Archive / proof docs only when explicitly needed**

Do not load large parts of the doc system by default.
Do not use memory as a substitute for routing.

---

# 1. Control Plane (ALWAYS LOAD)

These files must always be loaded first:

- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

## Why this layer matters
These files define:

- what is true right now
- what is changing right now
- what the PM is responsible for
- what work is still open

## Rules
- These files are mandatory for every task.
- No task should begin without them.
- No system state should be assumed outside them.

---

# 2. Core System Architecture (LOAD WHEN NEEDED)

Load this layer when the task involves:

- architecture decisions
- cross-workspace logic
- system design
- modularity questions
- deciding where a feature belongs

## Required subset when routing here
- `01_workspace_architecture/AI_WORKSPACE_ARCHITECTURE.md`
- `01_workspace_architecture/AI_WORKSPACE_IMPLEMENTATION_RULES.md`
- `01_workspace_architecture/AI_WORKSPACE_SYSTEM_INDEX.md`
- `01_workspace_architecture/system_overview.md`

## Optional supporting subset
- relevant files under `02_agent_runtime/`

## Why this layer matters
This layer defines the stable architecture of the platform and prevents feature work from drifting into the wrong system layer.

---

# 3. Gmail Workspace (Feature Domain Routing)

Load this layer when the task is specifically about Gmail Workspace behavior.

Start with the overview docs, then route into the correct Gmail subdomain.

## Gmail overview docs
Load first when entering the Gmail feature domain:

- `03_gmail_workspace/00_overview/gmail_workspace_phase_plan.md`
- `03_gmail_workspace/00_overview/gmail_workspace_product_flow.md`
- `03_gmail_workspace/00_overview/final_product_spec.md`
- `03_gmail_workspace/09_reference/gmail_workspace_system_index.md`

## 3A. Ingestion
Load when the task involves:

- syncing
- indexing
- ingestion logic
- mailbox scan behavior
- Smart Sync / maintenance traversal

### Required subset
- `03_gmail_workspace/01_ingestion/inbox_ingestion_spec.md`
- `03_gmail_workspace/01_ingestion/smart_sync_and_maintenance_spec.md`

## 3B. Intelligence
Load when the task involves:

- analytics
- inbox health
- intelligence-layer truth
- dashboard intelligence
- orchestrated health or insight generation

### Required subset
- `03_gmail_workspace/02_intelligence/inbox_health_spec.md`
- `03_gmail_workspace/02_intelligence/intelligence_dashboard_spec.md`
- `03_gmail_workspace/02_intelligence/intelligence_orchestrator.md`
- `03_gmail_workspace/02_intelligence/visual_intelligence_spec.md`

### Optional supporting subset
- `03_gmail_workspace/02_intelligence/inbox_health_algorithm.md`
- `03_gmail_workspace/02_intelligence/analytics_spec.md`
- `03_gmail_workspace/02_intelligence/health_engine.md`

## 3C. Decision System
Load when the task involves:

- decision logic
- scoring
- sender classification
- storage of decisions
- routing decision outcomes

### Required subset
- `03_gmail_workspace/03_decision_system/decision_model_spec.md`
- `03_gmail_workspace/03_decision_system/decision_storage_spec.md`
- `03_gmail_workspace/03_decision_system/decision_destinations_spec.md`
- `03_gmail_workspace/03_decision_system/decision_engine_spec.md`

### Optional supporting subset
- `03_gmail_workspace/03_decision_system/decision_scoring_advanced.md`
- `03_gmail_workspace/03_decision_system/sender_surface_unification_spec.md`

## 3D. Sender Decision UI
Load when the task involves:

- UI behavior
- workflow transitions
- interaction design
- sender review surfaces
- Cleanup Groups
- Sender Overview
- Decision Mode
- Shared Analysis Rail
- Time Context
- Sender Distribution

### Required foundation subset
- `03_gmail_workspace/04_sender_decision_ui/00_foundation/workspace_ui_structure.md`
- `03_gmail_workspace/04_sender_decision_ui/00_foundation/workspace_ux_spec.md`

### Route further by sub-surface
- Shared Analysis Rail:
  - `03_gmail_workspace/04_sender_decision_ui/01_analysis_rail/Shared_Rail_Analysis_spec.md`
  - `03_gmail_workspace/04_sender_decision_ui/01_analysis_rail/SHARED_ANALYSIS_RAIL_IMPLEMENTATION_PLAN.md`
- Sender Distribution:
  - `03_gmail_workspace/04_sender_decision_ui/02_distribution_chart/SENDER_DISTRIBUTION_CHART_SPEC.md`
- Time Context:
  - `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
- Workflow integration:
  - `03_gmail_workspace/04_sender_decision_ui/04_workflow_integration/decision_ui_flow.md`
- Decision Mode:
  - `03_gmail_workspace/04_sender_decision_ui/05_decision_mode/sender_decision_mode_spec.md`
  - `03_gmail_workspace/04_sender_decision_ui/05_decision_mode/decision_mode_full_build_spec.md`
  - `03_gmail_workspace/04_sender_decision_ui/05_decision_mode/decision_mode_ui_final_build_spec.md`
- Cleanup Groups:
  - `03_gmail_workspace/04_sender_decision_ui/06_cleanup_groups/CLEANUP_GROUPS_REBUILD_PHASED_EXECUTION_PLAN.md`
  - `03_gmail_workspace/04_sender_decision_ui/06_cleanup_groups/CLEANUP_GROUP_REDISCOVERY_IMPLEMENTATION_PLAN.md`
  - `03_gmail_workspace/04_sender_decision_ui/06_cleanup_groups/Cleanup_Groups_Discovery_Spec_(Artifact-Driven).md`
  - `03_gmail_workspace/04_sender_decision_ui/06_cleanup_groups/Cleanup_Groups_spec_phase_plan.md`

## 3E. Management Execution
Load when the task involves:

- execution queues
- action previews
- management flows
- push-to-Gmail logic
- execution safety behavior

### Required subset
- `03_gmail_workspace/05_management_execution/management_flow_spec.md`
- `03_gmail_workspace/05_management_execution/management_execution_engine.md`
- `03_gmail_workspace/05_management_execution/execution_queue_spec.md`
- `03_gmail_workspace/05_management_execution/execution_safety_preview.md`

## 3F. Learning System
Load when the task involves:

- learning loops
- feedback systems
- self-improving automation
- reinforcement behavior
- long-term adaptation

### Required subset
- `03_gmail_workspace/06_learning_system/system_feedback_and_reinforcement.md`
- `03_gmail_workspace/06_learning_system/self_learning_pipeline.md`

### Optional supporting subset
- `03_gmail_workspace/06_learning_system/ai_learning_layer_moat.md`
- `03_gmail_workspace/06_learning_system/autonomous_inbox_evolution_loop.md`

## 3G. Engines / Gamification
Load when the task involves:

- recommendation systems
- trust / relationship engines
- gamification
- engine-specific logic outside the main UI flow

### Required subset
- `03_gmail_workspace/07_engines/recommendation_engine_spec.md`
- `03_gmail_workspace/07_engines/sender_trust_graph.md`

### Optional supporting subset
- `03_gmail_workspace/08_gamification/gamification_reward_system.md`

---

# 4. Product Design Layer (LOAD WHEN NEEDED)

Load this layer when the task involves:

- product flow
- UX decisions
- PM operating structure
- broader workflow design
- onboarding or operational framing

## Required subset
- `04_product_design/AI_WORKSPACE_PRODUCT_FLOW.md`
- `04_product_design/operational_workflow.md`
- `04_product_design/PM_CODEX_EXECUTION_SYSTEM.md`

## Optional supporting subset
- `04_product_design/playground-runtime-architecture.md`
- `04_product_design/PM_ONBOARDING_BRIEF.md`

## Why this layer matters
This layer helps distinguish product intent and workflow design from implementation mechanics.

---

# 5. Codex Instruction Layer (LOAD WHEN NEEDED)

Load this layer when the task involves:

- executing a complex Codex task
- debugging execution quality
- enforcing protocol
- preparing PM review expectations
- reducing implementation drift

## Required subset
- `00_core_context/09_CODEX_EXECUTION_PROTOCOL.md`
- `00_core_context/10_CODEX_SESSION_CHECKLIST.md`
- `08_codex_instructions/CODEX_EXECUTION_RULES.md`
- `08_codex_instructions/CODEX_SOURCE_OF_TRUTH.md`

## Optional supporting subset
- `08_codex_instructions/CODEX_DEBUG_PLAYBOOK.md`
- `08_codex_instructions/CODEX_EXECUTION_CHECKLIST.md`
- `08_codex_instructions/CODEX_RELIABILITY_SYSTEM.md`
- `08_codex_instructions/CODEX_IMPLEMENTATION_GUARDRAILS.md`
- `08_codex_instructions/PM_CODEX_UI_REVIEW_PROTOCOL.md`
- `08_codex_instructions/CODEX_PM_REVIEW_PACKET_SPEC.md`

## Why this layer matters
This layer governs how Codex executes work, how scope is controlled, and how PM review should be structured.

---

# 5A. Worktree Sync / Merge Recovery Routing (LOAD WHEN NEEDED)

Load this route when the task involves:

- syncing docs between `main` and a worktree
- merge recovery after an unsafe full merge
- hot-file overlap classification
- PM activation or turnover blocked on worktree sync

## Required subset
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `07_reference/Shared_Hot_File_Merge_Protocol.md`
- `07_reference/Git_GitHub_Worktrees_Backups_operating_Model.md`
- `07_reference/Simple_Worktrees_Setup_Checklist.md`
- `07_reference/OLIVER_OPERATING_CHECKLIST.md`

## Optional supporting subset
- `00_core_context/Project Manager Activation & Turnover Protocol.md`
- `07_reference/CODEX_PROMPT_TEMPLATES.md`
- `AGENTS.md`

## Why this layer matters
This route separates docs-only sync from shared hot-file integration and routes merge work through one authoritative protocol so PM/Codex do not fall back to manual merge triage.

---

# 6. Data / Schema / Reference Layer (LOAD WHEN NEEDED)

Load this layer when the task involves:

- database changes
- schema questions
- query behavior
- table definitions
- automation logic
- workflow engine mechanics
- RAG / memory model reasoning

## Required subset by task
- Schema / table work:
  - `07_reference/AI_WORKSPACE_TABLE_SCHEMAS.md`
  - `07_reference/schema_comparison_checklist.md`
- Data / event model work:
  - `07_reference/AI_WORKSPACE_DATA_MODEL.md`
  - `07_reference/AI_WORKSPACE_EVENT_MODEL.md`
  - `07_reference/AI_WORKSPACE_ACTION_MODEL.md`
- Query / automation work:
  - `07_reference/AI_WORKSPACE_QUERY_PATTERNS.md`
  - `07_reference/automation_map.md`
- Workflow engine work:
  - `07_reference/AI_WORKSPACE_WORKFLOW_ENGINE_SPEC.md`
- Memory / RAG work:
  - `07_reference/AI_WORKSPACE_LLM_MEMORY_MODEL.md`
  - `07_reference/AI_WORKSPACE_RAG_PIPELINE.md`

## Why this layer matters
This layer is reference-heavy and should only be loaded when the task truly touches data contracts, schema, queries, or automation logic.

---

# 7. Archive / Historical / Proof Layer (LOAD ONLY WHEN NEEDED)

Load this layer only when:

- debugging historical behavior
- validating a previous milestone
- auditing what happened in an earlier thread or build
- checking generated proof artifacts
- comparing rollback / publish / postpublish states

## Includes
- `03_gmail_workspace/10_archive_legacy/`
- `03_gmail_workspace/04_sender_decision_ui/07_archived_legacy/`
- `06_system_state/ARCHIVE_TODO_HISTORY.md`
- generated proof bundles / publication readiness JSON and proof files
- historical rollout / stabilization evidence docs

## Rule
These files must NOT be part of default task context.
They are audit material, not active operating context.

---

# Mandatory vs Optional vs Reference-Only

## Mandatory every time
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

## Mandatory when task enters a domain
Load the smallest required subset from:
- Core System Architecture
- Gmail Workspace subdomain routing
- Product Design
- Codex Instruction Layer
- Data / Schema / Reference Layer

## Reference-only by default
- archive docs
- legacy docs
- generated proof artifacts
- low-level reference docs not touched by the task

---

# Practical Routing Rules

## If the task is a UI review
Load:
1. Control Plane
2. Gmail overview docs
3. relevant Sender Decision UI subdomain docs
4. Product Design docs if workflow/UX ambiguity exists
5. Codex UI review docs only if execution guidance is needed

## If the task is a new Codex implementation prompt
Load:
1. Control Plane
2. relevant domain docs
3. Codex Instruction Layer
4. Data / schema docs only if touched

## If the task is architecture or system-boundary reasoning
Load:
1. Control Plane
2. Core System Architecture
3. relevant Product Design docs
4. Agent Runtime docs if runtime architecture is involved

## If the task is debugging historical behavior
Load:
1. Control Plane
2. current active domain docs
3. Archive / Historical / Proof docs only for the exact historical question

## If the task is doc propagation
Load:
1. Control Plane
2. ACTIVE_CHANGE_EVENTS.md
3. only the docs listed in the relevant change event
4. Codex Instruction Layer if execution protocol is needed

---

# Current Workflow Reality

The current operating model is:

```text
Oliver
→ Project Manager
→ Codex
```

Operational truths:
- Oliver defines intent, approvals, and final direction
- Project Manager defines scope, routing, impact, and review standard
- Codex executes scoped work and propagates truth

This routing system exists to reduce:
- memory-based coordination
- document overload
- turnover time
- repeated explanations
- system drift

---

# Summary

`SYSTEM_MEMORY_MAP.md` is the routing layer for project documentation.

It should be used to decide:
- what to load first
- what to load next
- what not to load unless required

It is not a tree dump.
It is not a spec.
It is the document-loading decision system for PM and Codex.
# AI Agent Platform — System Memory Map (Routing System)

## Purpose
This document is the **routing system** for the entire AI Agent Platform.

It defines:
- what documents exist
- when they should be loaded
- how the system is mentally organized
- how Codex and PM navigate the system without drift

This is a **decision system**, not a document list.

---

# System Overview (Big Picture)

The AI Agent Platform consists of three major systems:

1. **Workspace System** (Applications like Gmail Workspace)
2. **RAG System** (knowledge ingestion, retrieval, memory)
3. **LLM System** (reasoning, prompting, execution intelligence)

Supporting layers:
- Agent Runtime
- Artifact Engine
- Decision System
- Execution System

This memory map must allow routing across ALL of these.

---

# Core Routing Rule

Always follow this order:

1. **Control Plane (ALWAYS)**
2. **System Layer (RAG / LLM / Workspace / Runtime)**
3. **Feature Domain (e.g., Gmail)**
4. **Execution / Codex Rules (if implementing)**
5. **Data / Schema (if needed)**
6. **Archive (only if debugging history)**

Do NOT preload the system.
Only load what is required.

---

# 1. Control Plane (ALWAYS LOAD)

Load FIRST for every task:

- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

## Why
Defines:
- system truth
- active work
- decision context
- change tracking

## Rule
No task starts without this.

---

# 2. Core Context Layer (SYSTEM FOUNDATIONS)

Load when:
- understanding the system at a high level
- onboarding
- resolving ambiguity across domains

## Required subset
- `00_core_context/00_MASTER_PROJECT.md`
- `00_core_context/01_ARCHITECT_CONTEXT.md`
- `00_core_context/02_FRONTEND_CONTEXT.md`
- `00_core_context/03_BACKEND_CONTEXT.md`
- `00_core_context/04_WORKFLOWS_CONTEXT.md`

## Optional
- `00_core_context/05_LLM_TRAINER_CONTEXT.md`
- `00_core_context/06_AVATAR_VOICE_CONTEXT.md`
- `00_core_context/08_PROMPT_ENGINEER_CONTEXT.md`
- `00_core_context/agent_activation_checklist.md`

## Why
This defines the **mental model of the system**.

---

# 3. Workspace System (APPLICATION LAYER)

Load when:
- working on app features
- UI workflows
- user-facing behavior

## Core Workspace Architecture
- `01_workspace_architecture/AI_WORKSPACE_ARCHITECTURE.md`
- `01_workspace_architecture/AI_WORKSPACE_MASTER_BLUEPRINT.md`
- `01_workspace_architecture/AI_WORKSPACE_PRODUCT_ARCHITECTURE.md`
- `01_workspace_architecture/system_overview.md`

## Why
Defines how apps like Gmail fit into the system.

---

# 4. Agent Runtime Layer

Load when:
- reasoning about agent behavior
- execution logic
- decision orchestration

## Required subset
- `02_agent_runtime/AI_AGENT_RUNTIME.md`
- `02_agent_runtime/AI_WORKSPACE_RUNTIME_EXECUTION_MODEL.md`
- `02_agent_runtime/AGENT_MEMORY_AND_DECISION_ENGINE.md`

## Why
Defines how intelligence actually executes.

---

# 5. Gmail Workspace (Feature Domain)

Load ONLY when working on Gmail.

## Start with
- `03_gmail_workspace/00_overview/gmail_workspace_product_flow.md`
- `03_gmail_workspace/00_overview/final_product_spec.md`

## Then route to subdomains

### Ingestion
- `03_gmail_workspace/01_ingestion/*`

### Intelligence
- `03_gmail_workspace/02_intelligence/*`

### Decision System
- `03_gmail_workspace/03_decision_system/*`

### Sender Decision UI
- `03_gmail_workspace/04_sender_decision_ui/*`

### Management Execution
- `03_gmail_workspace/05_management_execution/*`

### Learning System
- `03_gmail_workspace/06_learning_system/*`

### Engines / Gamification
- `03_gmail_workspace/07_engines/*`

## Important Rule
Gmail is a **feature domain**, not the system.

---

# 6. Artifact Engine (DATA + TRUTH SYSTEM)

Load when:
- working with artifacts
- publishing datasets
- validation logic

## Required subset
- `09_artifact_engine/ARTIFACT_ENGINE_BLUEPRINT.md`
- `09_artifact_engine/WORKSPACE_ARTIFACT_METHODOLOGY.md`

## Why
Artifacts define **system truth at scale**.

---

# 7. Agent Architecture Layer

Load when:
- multi-agent systems
- orchestration
- hierarchy logic

## Required subset
- `10_agent_architecture/AGENT_WORKSPACE_HIERARCHY_BLUEPRINT.md`
- `10_agent_architecture/MULTI_AGENT_ORCHESTRATION_METHODOLOGY.md`

---

# 8. Product Design Layer

Load when:
- UX decisions
- workflows
- product direction

## Required subset
- `04_product_design/AI_WORKSPACE_PRODUCT_FLOW.md`
- `04_product_design/operational_workflow.md`

---

# 9. Codex Instruction Layer

Load when:
- executing tasks
- debugging
- enforcing discipline

## Required subset
- `08_codex_instructions/CODEX_SOURCE_OF_TRUTH.md`
- `08_codex_instructions/CODEX_EXECUTION_RULES.md`
- `00_core_context/09_CODEX_EXECUTION_PROTOCOL.md`

---

# 10. Data / Schema Layer

Load when:
- touching database
- queries
- schema

## Required subset
- `07_reference/AI_WORKSPACE_TABLE_SCHEMAS.md`
- `07_reference/AI_WORKSPACE_DATA_MODEL.md`
- `07_reference/AI_WORKSPACE_QUERY_PATTERNS.md`

---

# 11. Operational Layer

Load when:
- running system
- checklists
- maintenance

## Required subset
- `05_operational_playbooks/*`

---

# 12. Archive / Proof Layer

Load ONLY when:
- debugging
- auditing

## Includes
- `03_gmail_workspace/10_archive_legacy/*`
- generated proofs

## Rule
Never load by default.

---

# Worktree Rule (IMPORTANT)

There may be:
- main repo docs
- worktree docs (active experimental lanes)

Routing must prefer:

1. Control Plane truth
2. Active change events
3. Worktree docs if they are part of active implementation

---

# Summary

This file is the **navigation system for the entire platform**.

It ensures:
- no context overload
- no drift
- fast execution
- correct document usage

It is a routing system, not a reference list.
