

# CODEX MASTER INSTRUCTION PACKET

## Purpose
This document defines the **standard operating instructions for Codex** when performing major architectural work inside the AI Agent Platform repository.

The goal is to ensure that Codex:

- Understands the project architecture
- Executes tasks in controlled phases
- Avoids architectural drift
- Updates the authoritative documentation after each milestone

This packet must be referenced whenever Codex is asked to perform **large rebuilds, system refactors, or multi-file architectural work.**

---

# Codex Operating Principles

Codex must follow these principles for all major work:

1. **Read the Architecture First**
2. **Plan Before Editing**
3. **Execute in Phases**
4. **Validate Before Moving Forward**
5. **Update Authoritative Docs**

Codex should never jump directly into implementation for complex changes without first confirming the plan.

---

# Required Documentation Context

Before starting implementation, Codex must read the following documents:

```
ai-agent-platform-docs/

00_core_context/
01_workspace_architecture/
02_agent_runtime/
03_gmail_workspace/
04_product_design/
05_operational_playbooks/
06_system_state/
07_reference/
```

The following files are **mandatory reading**:

- `00_MASTER_PROJECT.md`
- `AI_WORKSPACE_MASTER_BLUEPRINT.md`
- `AI_WORKSPACE_ARCHITECTURE.md`
- `AI_AGENT_RUNTIME.md`
- `AI_WORKSPACE_LLM_MEMORY_MODEL.md`
- `system_overview.md`

These files represent the **source of truth for system architecture.**

---

# Codex Execution Workflow

Codex must follow this workflow when implementing major features or rebuilds.

## Step 1 — Architecture Review

Codex must confirm:

- The architecture intent
- Existing system structure
- Any constraints defined in docs

Codex should explicitly state the **implementation map** before editing code.

---

## Step 2 — Implementation Plan

Codex must produce a plan that includes:

- Routes affected
- Components created
- APIs added or modified
- Runtime services impacted
- Data models changed

No code should be written until this plan is confirmed.

---

## Step 3 — Phased Implementation

Large work must be broken into **phases**.

Example:

Phase 1 — Data layer
Phase 2 — Runtime logic
Phase 3 — UI components
Phase 4 — Integrations
Phase 5 — Monitoring & memory

Each phase should remain independently testable.

---

## Step 4 — Validation

After each phase, Codex must run:

- ESLint
- TypeScript typecheck
- Production build

Commands:

```
npx eslint
npx tsc --noEmit
npm run build
```

Codex should report validation results before continuing.

---

## Step 5 — Documentation Updates

After a major implementation milestone, Codex must update the authoritative documents:

- `CHANGELOG.md`
- `CURRENT_STATE.md`
- `TODO.md`
- `system_overview.md`

These files must always reflect the **current reality of the system.**

---

# Architectural Guardrails

Codex must not violate these constraints:

### 1. Sender‑First Design

For Gmail cleanup features:

- **Senders are the primary decision object**
- Messages are evidence only

### 2. Agent‑Driven Architecture

All workflows must be compatible with:

- agent runtime
- memory layer
- RAG retrieval

### 3. Memory Persistence

User decisions must persist through:

- `agent_events`
- `rag_documents`

These enable the system to **learn user behavior.**

### 4. No Fake Automation

Only the following Gmail action is executed immediately:

```
Archive
```

Other actions become:

- rule intents
- learned policies

---

# Performance Requirements

Codex must respect the following performance rules:

- No page should take **>2 seconds** to load under normal conditions
- Heavy computations must run server‑side
- Expensive queries must be cached
- Data should load incrementally where possible

Mailbox intelligence pages must never block the UI for large datasets.

---

# Product Philosophy

This system is not just a tool.

It is designed to function like a **team of AI department heads**.

The platform should feel like:

- a CEO dashboard
- an AI operations center
- a decision briefing system

Users should be able to:

- understand system status instantly
- make high‑level decisions
- allow AI agents to execute details

---

# Codex Response Format

When completing a task, Codex should return a structured response containing:

1. Root Cause
2. Files Changed
3. Validation Results
4. Remaining Risks
5. Recommended Next Steps

This ensures that the project manager can quickly evaluate the change.

---

# Summary

Codex should treat this repository as a **long‑lived AI platform**, not a single application.

Major changes must always be:

- architecture aware
- phased
- validated
- documented

Following this packet ensures that large rebuilds remain stable and predictable.
