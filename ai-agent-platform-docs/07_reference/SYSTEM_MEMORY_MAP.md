

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
- `01_workspace_architecture/AI_WORKSPACE_PRODUCT_ARCHITECTURE.md`
- `01_workspace_architecture/AI_WORKSPACE_MASTER_BLUEPRINT.md`
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
These files define the Gmail Workspace product, architecture, UX, intelligence layer, and implementation phases.

This is currently the **most active system** in the project.

### Core Gmail product / implementation files
- `03_gmail_workspace/GMAIL_WORKSPACE_PHASE_PLAN.md`
- `03_gmail_workspace/GMAIL_WORKSPACE_IMPLEMENTATION_PHASE_1.md`
- `03_gmail_workspace/GMAIL_WORKSPACE_PRODUCT_FLOW_SPEC.md`
- `03_gmail_workspace/GMAIL_WORKSPACE_PRODUCT_FLOW_V2.md`
- `03_gmail_workspace/GMAIL_WORKSPACE_ENGINEERING_SPEC.md`
- `03_gmail_workspace/GMAIL_WORKSPACE_FINAL_PRODUCT_SPEC.md`
- `03_gmail_workspace/GMAIL_WORKSPACE_UI_STRUCTURE.md`
- `03_gmail_workspace/GMAIL_WORKSPACE_UX_SPEC.md`
- `03_gmail_workspace/GMAIL_WORKSPACE_PERFORMANCE_SPEC.md`
- `03_gmail_workspace/GMAIL_WORKSPACE_ANALYTICS_SPEC.md`

### Gmail decision / workflow files
- `03_gmail_workspace/GMAIL_WORKSPACE_DECISION_MODEL_SPEC.md`
- `03_gmail_workspace/GMAIL_WORKSPACE_DECISION_STORAGE_SPEC.md`
- `03_gmail_workspace/GMAIL_WORKSPACE_DECISION_UI_FLOW.md`

### Gmail health / intelligence files
- `03_gmail_workspace/GMAIL_WORKSPACE_HEALTH_ENGINE.md`
- `03_gmail_workspace/GMAIL_WORKSPACE_INBOX_HEALTH_SPEC.md`
- `03_gmail_workspace/GMAIL_WORKSPACE_INBOX_HEALTH_ALGORITHM_MODEL.md`
- `03_gmail_workspace/GMAIL_WORKSPACE_INBOX_INGESTION_SPEC.md`
- `03_gmail_workspace/GMAIL_WORKSPACE_RECOMMENDATION_ENGINE_SPEC.md`
- `03_gmail_workspace/GMAIL_WORKSPACE_SENDER_TRUST_GRAPH.md`
- `03_gmail_workspace/GMAIL_WORKSPACE_INTELLIGENCE_ORCHESTRATOR.md`

### Use this layer when
- reviewing Mailbox Intelligence screenshots
- reviewing Cleanup Groups screenshots
- reviewing Sender Decisions screenshots
- reviewing Confirmation behavior
- deciding Phase 1 vs Phase 2 scope
- instructing Codex on Gmail implementation
- deciding whether a requested improvement belongs to runtime, UX, or future automation phases

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
- `08_codex_instructions/CODEX_DUAL_THREAD_CONTROL_SYSTEM.md`
- `08_codex_instructions/CODEX_EXECUTION_CHECKLIST.md`
- `08_codex_instructions/CODEX_EXECUTION_RULES.md`
- `08_codex_instructions/CODEX_IMPLEMENTATION_GUARDRAILS.md`
- `08_codex_instructions/CODEX_MASTER_INSTRUCTION_PACKET.md`
- `08_codex_instructions/CODEX_PHASE_EXECUTION_PLAN.md`
- `08_codex_instructions/CODEX_REBUILD_PROTOCOL.md`
- `08_codex_instructions/CODEX_SOURCE_OF_TRUTH.md`

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
2. `AI_WORKSPACE_PRODUCT_ARCHITECTURE.md`
3. relevant `03_gmail_workspace/*` product and UX files
4. `CURRENT_STATE.md`
5. `CODEX_SOURCE_OF_TRUTH.md`

---

## If sending Codex a new implementation task
Consult in this order:

1. `00_MASTER_PROJECT.md`
2. `PROJECT_MANAGER_CONTEXT.md`
3. relevant Gmail implementation / UX / engineering spec
4. `CURRENT_STATE.md`
5. `TODO.md`
6. `CODEX_EXECUTION_PROTOCOL.md`
7. `CODEX_SOURCE_OF_TRUTH.md`

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

1. `GMAIL_WORKSPACE_PHASE_PLAN.md`
2. `GMAIL_WORKSPACE_IMPLEMENTATION_PHASE_1.md`
3. `GMAIL_WORKSPACE_PRODUCT_FLOW_SPEC.md`
4. `GMAIL_WORKSPACE_FINAL_PRODUCT_SPEC.md`
5. `TODO.md`

---

# Gmail Workspace Quick Memory Model

When reasoning about the Gmail Workspace, hold this hierarchy:

```text
Mailbox Intelligence
→ high-level mission dashboard

Cleanup Groups
→ group selection and handoff

Sender Decisions
→ primary drill-down and decision workspace

Confirmation
→ review + archive-now approval + stored-later preference clarity

Rules / Monitoring
→ deferred beyond current Phase 1 unless explicitly activated
```

And hold these product truths:

- the system is **sender-first**, not message-first
- Mailbox Intelligence should not become a second Sender Decisions page
- Cleanup Groups should not become a full review workspace
- Sender Decisions should carry the deepest sender analytics and reasoning
- Confirmation should clearly distinguish archive-now from stored-later decisions
- runtime stability should be preserved while UX improves incrementally

---

# Gmail Workspace Intelligence Memory Model

The Gmail Workspace intelligence stack currently consists of:

```text
Inbox Ingestion
→ Sender Trust Graph
→ Inbox Health Engine
→ Recommendation Engine
→ Decision Model
→ Decision Storage
→ Autonomous Inbox Evolution Loop
→ Intelligence Orchestrator
```

These systems should be consulted conceptually when determining whether a dashboard, recommendation, or sender workflow is aligned with the documented product.

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

# Recommended Source Priority

If source/file limits exist, prioritize these groups in order:

1. `00_core_context`
2. `01_workspace_architecture`
3. `03_gmail_workspace`
4. `06_system_state`
5. `08_codex_instructions`

If a source cap is tight, keep this file plus the Gmail Workspace and Codex instruction files before lower-priority materials.

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