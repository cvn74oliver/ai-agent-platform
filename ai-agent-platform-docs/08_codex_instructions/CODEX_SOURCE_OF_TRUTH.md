# CODEX SOURCE OF TRUTH

## Purpose
This document defines the **single authoritative rule set Codex must follow when working inside this repository**. Its goal is to eliminate ambiguity between multiple documents and prevent Codex from acting on outdated, duplicate, or conflicting specifications.

When Codex executes work in this repository, it must determine the **Source of Truth hierarchy** below and follow it strictly.

If two documents conflict, **the document higher in this hierarchy wins**.

---

# SOURCE OF TRUTH HIERARCHY

Codex must resolve specification conflicts using this exact order.

## Level 1 — Phase Implementation Documents
These define the **current active work** and override everything else.

Location:

`ai-agent-platform-docs/03_gmail_workspace/`

Note: Only files explicitly labeled as Phase Implementation or Phase Plan are considered Level 1. All other files in this directory fall into lower levels unless explicitly stated.

Primary documents:

- `GMAIL_WORKSPACE_IMPLEMENTATION_PHASE_*.md`
- `GMAIL_WORKSPACE_PHASE_PLAN.md`

These documents define:

- The current development phase
- The features being built
- The allowed scope of changes
- The APIs and UI surfaces being modified

If any other document contradicts a **Phase Implementation document**, the Phase Implementation document wins.

---

## Level 2 — Product Specification Documents
These describe the **intended product behavior** but not necessarily the current implementation scope.

Location:

`ai-agent-platform-docs/03_gmail_workspace/`

Examples:

- `GMAIL_WORKSPACE_PRODUCT_FLOW_SPEC.md`
- `GMAIL_WORKSPACE_UX_SPEC.md`
- `GMAIL_WORKSPACE_ANALYTICS_SPEC.md`
- `GMAIL_WORKSPACE_PERFORMANCE_SPEC.md`

These define:

- UX design
- user flows
- analytics requirements
- performance requirements

However, they **must not expand scope beyond the current phase**.

Additionally:
- Product Specs define *target state*, not *current build state*
- If implementation conflicts with Product Spec but aligns with Phase Implementation, the Phase Implementation must be followed

If a Product Spec requires functionality outside the active phase:

Codex must **defer implementation** and mark it as Phase 2+.

---

## Level 3 — Engineering Specifications
These describe architectural intent and engineering models.

Location:

`ai-agent-platform-docs/03_gmail_workspace/`

Examples:

- `GMAIL_WORKSPACE_ENGINEERING_SPEC.md`
- `GMAIL_WORKSPACE_SPEC.md`

These documents define:

- data models
- runtime structure
- internal systems

However they **must not override Phase Implementation documents**.

---

## Level 4 — System Architecture Documents
These define the broader AI workspace architecture.

Location:

`ai-agent-platform-docs/01_workspace_architecture/`

Examples:

- `AI_WORKSPACE_ARCHITECTURE.md`
- `AI_WORKSPACE_PRODUCT_ARCHITECTURE.md`

These explain system design but **should never change the behavior of a feature under active phase development**.

---

## Level 5 — Historical or Planning Documents
These are background context only.

Examples:

- `GMAIL_CLEANUP_REBUILD_PLAN.md`
- `GMAIL_WORKSPACE_PRODUCT_FLOW.md`

They may contain outdated ideas.

Codex may read them for context but **must not treat them as requirements**.

---

# CODEX DECISION RULE

When Codex encounters conflicting instructions:

1. Identify the active Phase Implementation document.
2. Treat it as the **single execution authority**.
3. Use Product Specs only to clarify intent—not to expand scope.
4. Ignore any requirement not explicitly aligned with the current phase.
5. If two documents conflict and neither is clearly dominant, STOP and escalate via PM Review Packet.
6. Codex must never “blend” multiple documents into a hybrid behavior.

---

# DOCUMENT CHANGE POLICY

Codex is **not allowed to modify Source of Truth documents unless explicitly instructed**.

Protected documents include:

- Phase Implementation docs
- Product Specs
- Architecture docs
- Codex instruction documents

If Codex believes a document is incorrect, it must:

1. Flag the issue in its PM Review Packet
2. Explain the contradiction
3. Wait for human instruction

---

# PHASE-SCOPED DEVELOPMENT RULE

Codex must only implement features that belong to the **active phase**.

Example:

Phase 1 includes:

- Mailbox Intelligence
- Cleanup Groups
- Sender Decisions
- Confirmation

Phase 1 excludes:

- Rules automation
- Monitoring intelligence
- Exceptions logic

If code touches Phase 2+ features, Codex must **leave them unchanged or replace them with placeholders**.

Critical clarification:
- Codex must NOT partially implement Phase 2 logic
- Codex must NOT 'prepare' Phase 2 systems unless explicitly instructed
- Codex must NOT infer future architecture from Product Specs

---

# CACHING & PERFORMANCE RULE

The Gmail workspace must follow these performance rules:

- Mailbox analysis must never recompute on page transitions.
- Sender universe must be cached per cleanup snapshot.
- Intelligence → Clusters → Sender Decisions must reuse the same cached dataset.
- Review stage changes must not trigger refetches.

These rules override earlier experimental implementations.

Enforcement rule:
- Any implementation that violates these rules must be treated as a bug, even if it appears to function correctly

---

# PM REVIEW REQUIREMENT

After each Codex execution, the response must include a **PM REVIEW PACKET**.

Specification:

`ai-agent-platform-docs/08_codex_instructions/CODEX_PM_REVIEW_PACKET_SPEC.md`

Codex must generate the packet using the required format and include:

- Files changed
- Behavior changes
- Validation performed
- Known limitations

---

# DOCUMENT STRUCTURE REFERENCE

All authoritative documentation lives in:

`ai-agent-platform-docs/`

Primary directories:

```
00_core_context
01_workspace_architecture
02_agent_runtime
03_gmail_workspace
04_product_design
05_operational_playbooks
06_system_state
07_reference
08_codex_instructions
```

Codex must **never create new top-level documentation directories without explicit approval**.

---

# FINAL RULE

If Codex encounters uncertainty:

Stop immediately.

Do NOT proceed with implementation.

Produce a PM Review Packet explaining:
- what is unclear
- which documents conflict
- what decision is required

Do not guess.
Do not assume.
Do not proceed until clarified.

---

End of CODEX SOURCE OF TRUTH