

# CODEX ARCHITECTURE LOCK

## Purpose
This document defines the **architecture lock rules** Codex must follow when working inside the AI Agent Platform repository.

Its purpose is to prevent Codex from accidentally changing core architecture during implementation work, bug fixing, performance passes, or rebuild phases.

Codex must treat the architecture described in the repository documentation as **locked unless explicit human approval is given to change it**.

---

# What “Architecture Lock” Means

Architecture lock means Codex must **not change foundational system structure** unless a human explicitly instructs it to do so.

Codex may implement features inside the architecture.

Codex may improve performance inside the architecture.

Codex may fix bugs inside the architecture.

Codex may **not redesign the architecture itself** unless directly authorized.

---

# Locked Architecture Areas

The following areas are considered locked by default.

## 1. Route Structure
Codex must not rename, move, or remove core product routes unless explicitly instructed.

Examples of locked route surfaces:

- `/operations`
- `/operations/intelligence`
- `/operations/clusters`
- `/operations/review`
- `/operations/approvals`
- `/operations/history`

Allowed:

- editing page behavior
- improving UI
- improving performance
- changing copy

Not allowed without approval:

- renaming routes
- deleting routes
- changing the workflow topology

---

## 2. Sender-First Gmail Architecture
The Gmail Workspace architecture is locked as:

```text
Mailbox
  → Sender Universe
      → Sender Clusters
          → Sender Decisions
              → Confirmation
```

Codex must not revert to:

- message-first architecture
- batch-review architecture
- message-cluster architecture

Messages are **evidence**, not the primary decision object.

This is a locked architectural rule.

---

## 3. Data Model Expectations
Codex must not invent new persistent system models without approval.

Examples of locked persistence expectations:

- `agent_events` remains the event memory layer
- `rag_documents` remains the semantic memory layer
- Gmail decision memory writes go through these layers

Codex must not introduce a replacement memory table or redesign the data model unless instructed.

---

## 4. Runtime Control Pattern
The runtime control model is locked as:

- plan
- approve
- execute
- monitor

Codex may extend behavior within this pattern.

Codex may not replace it with a different execution model.

---

## 5. Documentation Authority Model
The repo documentation structure is locked.

Top-level documentation folders under `ai-agent-platform-docs/` must not be reorganized without approval.

Locked doc structure:

- `00_core_context`
- `01_workspace_architecture`
- `02_agent_runtime`
- `03_gmail_workspace`
- `04_product_design`
- `05_operational_playbooks`
- `06_system_state`
- `07_reference`
- `08_codex_instructions`

Codex must not create new top-level doc categories without human approval.

---

# Allowed Changes Inside The Lock

Codex is allowed to:

- improve performance
- add caching
- add analytics
- improve UI
- create helper modules
- patch route logic
- refine API behavior
- add placeholders for future phases

These are considered **implementation changes**, not architecture changes.

---

# Forbidden Changes Without Approval

Codex must not do any of the following unless explicitly instructed.

## Forbidden

- rename major routes
- replace sender-first workflow with another model
- redesign the memory system
- reorganize documentation structure
- move major runtime responsibilities between subsystems
- create a new architecture because the current one seems inconvenient

If Codex believes an architecture change is needed, it must:

1. stop implementation
2. document the proposed change
3. explain why the current architecture blocks progress
4. wait for approval

---

# Lock Override Protocol

Architecture lock may be overridden only by explicit human instruction.

A valid override must clearly state:

- what architecture area is changing
- why it is changing
- which documents must be updated

Without that instruction, Codex must preserve the locked architecture.

---

# Rebuild Rule

Even during large rebuilds, architecture remains locked.

A rebuild does **not** grant permission to:

- reinterpret the architecture
- widen the workflow
- add later-phase features early
- shift the product mental model

Rebuilds must occur **inside** the architecture unless explicitly approved otherwise.

---

# Performance Rule Under Architecture Lock

Codex must not “solve” performance by removing required architecture.

Examples:

Not allowed:

- removing sender intelligence to make pages faster
- removing charts to avoid analytics work
- collapsing stages because caching was not implemented correctly

Allowed:

- cache intelligence
- cache sender universe
- lazy-load evidence
- paginate sender results

Performance improvements must preserve architecture.

---

# PM Review Packet Requirement

If Codex touches any locked architecture area, the PM Review Packet must explicitly state whether:

- architecture was preserved
- architecture was challenged
- architecture changes were proposed

This must be reported clearly.

---

# Architecture Conflict Rule

If Codex finds a conflict between:

- the architecture lock
- the current codebase
- implementation-phase requirements

Codex must not guess.

Codex must:

1. stop
2. identify the conflict
3. cite the exact files/docs involved
4. request direction

---

# Final Rule

Codex is allowed to build **within** the architecture.

Codex is not allowed to redesign the architecture.

The architecture is locked until explicitly unlocked by a human.