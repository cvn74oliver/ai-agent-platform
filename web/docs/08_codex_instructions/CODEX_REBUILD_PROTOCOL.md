

# CODEX REBUILD PROTOCOL

## Purpose
This document defines the **standard protocol Codex must follow when executing large rebuilds or refactors** in the AI Agent Platform repository. The goal is to make rebuilds deterministic, safe, reviewable, and recoverable.

This protocol prevents:
- uncontrolled architectural drift
- partial implementations
- silent regressions
- undocumented changes

It also ensures every rebuild follows the same structure so humans and Codex stay synchronized.

---

# Core Principles

## 1. Documentation Is Source of Truth
Before any rebuild begins, Codex must treat documentation as authoritative.

Required docs to read before implementation:

- `ai-agent-platform-docs/03_gmail_workspace/*`
- `ai-agent-platform-docs/01_workspace_architecture/*`
- `ai-agent-platform-docs/02_agent_runtime/*`
- `ai-agent-platform-docs/08_codex_instructions/*`

If documentation conflicts with code:

**Docs win.**

Codex must adapt the code to the docs unless the docs are explicitly marked outdated.

---

# Rebuild Execution Flow

## Phase 1 — Plan
Codex must first generate a **full implementation plan**.

The plan must include:

- Files to modify
- Files to create
- Files to delete
- APIs affected
- Data contracts affected
- Performance implications
- Risk areas

Codex must **NOT modify code yet.**

Instead it must return a structured plan including a **PM Review Packet**.

Implementation only begins after approval.

---

## Phase 2 — Controlled Implementation
Once the plan is approved:

Codex executes the rebuild in **controlled passes**.

Each pass should modify **one logical system area only**, for example:

- API layer
- runtime logic
- UI components
- caching
- analytics

Codex must never attempt to rebuild everything simultaneously.

---

# Safety Rules

## Rule 1 — Never Expand Scope
If implementation reveals additional issues:

Codex must **report them**, not silently fix them.

Example:

"While implementing Phase 1, I discovered X dependency issue. This is outside Phase 1 scope. Recommend addressing in Phase 3."

---

## Rule 2 — Never Change APIs Without Documentation
If an API contract changes:

Codex must update:

- engineering spec
- product flow spec
- system overview

Documentation must remain synchronized.

---

## Rule 3 — Preserve Runtime Stability
Rebuilds must not break:

- existing API endpoints
- existing route structure
- existing authentication flow

If breaking changes are required:

Codex must propose a **migration strategy**.

---

# Performance Requirements

Large rebuilds must maintain acceptable performance.

Key requirements:

Page loads should remain under **2 seconds** after warm cache.

Expensive operations must use:

- caching
- derived data reuse
- snapshot indexing

Codex must never introduce full mailbox recomputation across page transitions.

---

# Required Validation

After each rebuild pass, Codex must validate using:

```
npm run lint
npx tsc --noEmit
npm run build
```

If validation fails:

Codex must stop and report the failure.

---

# PM Review Packet

Every rebuild stage must end with a **PM Review Packet**.

Required sections:

```
PHASE
SUMMARY
FILES CREATED
FILES MODIFIED
FILES DELETED
KEY IMPLEMENTATION NOTES
VALIDATION PERFORMED
KNOWN LIMITATIONS
NEXT RECOMMENDED STEP
```

This packet allows rapid human review.

---

# Failure Handling

If implementation begins failing repeatedly:

Codex must switch to **diagnostic mode**.

Steps:

1. Identify the failing subsystem
2. Isolate minimal failing path
3. Propose fix
4. Resume implementation

Never continue blindly through errors.

---

# Recovery Protocol

If a rebuild corrupts the working tree:

Codex must recommend:

- rollback strategy
- file restore
- rebuild restart point

The rebuild should resume from the last stable phase.

---

# Codex Behavioral Requirements

Codex must:

- think in phases
- implement incrementally
- validate continuously
- document all changes

Codex must **never attempt a full-system rewrite in a single execution step**.

---

# End of Protocol