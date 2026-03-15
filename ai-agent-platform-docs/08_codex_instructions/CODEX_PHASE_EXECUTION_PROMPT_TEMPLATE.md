

# Codex Phase Execution Prompt Template

This template is used whenever we send a **phase execution prompt** to Codex. 
It ensures Codex operates with the correct context, scope, and discipline when implementing large architecture changes.

This file should be **copied and adapted for each phase execution request**.

---

# Codex Phase Execution Request

## Project
AI Agent Platform

## Phase
<PHASE NUMBER AND NAME>

Example:
Phase 1 — Performance Stabilization

---

# Objective

Clearly describe the **single objective of this phase**.

Example:

- Stabilize page load speed
- Implement caching for Gmail workspace routes
- Ensure intelligence and review pages load under 2 seconds

This phase should **not implement new product features**.

---

# Authoritative Documentation

Codex must read and follow the following documents before implementation:

- `AI_WORKSPACE_ARCHITECTURE.md`
- `AI_WORKSPACE_PRODUCT_ARCHITECTURE.md`
- `AI_WORKSPACE_SYSTEM_INDEX.md`

For Gmail workspace work specifically:

- `GMAIL_WORKSPACE_PRODUCT_FLOW_SPEC.md`
- `GMAIL_WORKSPACE_UX_SPEC.md`
- `GMAIL_WORKSPACE_ANALYTICS_SPEC.md`
- `GMAIL_WORKSPACE_PERFORMANCE_SPEC.md`

---

# Scope of Work

List the **exact areas Codex is allowed to modify**.

Example:

Allowed:

- Gmail Intelligence page
- Sender Decisions page
- Data loaders
- Server route caching

Not allowed:

- Database schema changes
- Runtime agent architecture
- Playground systems

---

# Implementation Tasks

Break the work into **explicit steps**.

Example:

1. Add caching layer for Gmail intelligence loaders
2. Cache sender workspace data
3. Avoid recomputation when navigating between pages
4. Ensure sender decisions reuse cached workspace data

---

# Performance Requirements

Codex must ensure:

- Page load under **2 seconds** after initial load
- Navigation between steps **<500ms**
- No full recomputation between stages

Caching must occur for:

- mailbox intelligence
- cleanup groups
- sender workspace

---

# Validation Requirements

Codex must run:

- targeted eslint
- targeted typecheck
- production build

Codex must confirm:

- routes compile
- runtime contracts compile
- no new lint failures

---

# Deliverables

Codex must provide:

1. Summary of work completed
2. Files changed
3. Validation results
4. Remaining risks

---

# Codex Execution Rules

Codex must:

- avoid large speculative refactors
- modify only files required for the phase
- avoid touching unrelated subsystems
- prefer minimal surgical fixes

---

# After Implementation

Codex must update documentation:

- `CHANGELOG.md`
- `CURRENT_STATE.md`
- `TODO.md`

---

# Phase Completion Condition

The phase is considered complete when:

- all implementation tasks are finished
- validation passes
- documentation updated

---

End of template.