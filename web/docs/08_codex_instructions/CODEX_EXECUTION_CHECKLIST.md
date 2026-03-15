

# Codex Execution Checklist

This checklist is used by Codex before starting any implementation phase in the AI Agent Platform project. The goal is to prevent architectural drift, incomplete implementations, or uncontrolled changes during large rebuilds.

Codex MUST complete this checklist before writing code.

---

# 1. Verify Authoritative Documentation

Codex must read the following documents before implementation begins:

Required reading:

- 00_core_context/00_MASTER_PROJECT.md
- 01_workspace_architecture/system_overview.md
- 03_gmail_workspace/GMAIL_CLEANUP_REBUILD_PLAN.md
- 03_gmail_workspace/GMAIL_WORKSPACE_PHASE_PLAN.md
- 03_gmail_workspace/GMAIL_WORKSPACE_PRODUCT_FLOW_SPEC.md
- 03_gmail_workspace/GMAIL_WORKSPACE_UX_SPEC.md
- 03_gmail_workspace/GMAIL_WORKSPACE_ANALYTICS_SPEC.md
- 03_gmail_workspace/GMAIL_WORKSPACE_PERFORMANCE_SPEC.md
- 03_gmail_workspace/GMAIL_WORKSPACE_CODEX_SAFEGUARDS.md

If any document is missing, Codex must STOP and request clarification.

---

# 2. Confirm Phase Scope

Codex must verify which implementation phase is currently active.

Example phases:

Phase 1 – Core navigation and data flow
Phase 2 – Sender dashboard and analytics
Phase 3 – Decision workflow
Phase 4 – Rules and monitoring

Codex must NOT implement features outside the current phase.

If scope is unclear, Codex must STOP and ask the Project Manager.

---

# 3. Validate Performance Expectations

Codex must follow the performance constraints defined in:

GMAIL_WORKSPACE_PERFORMANCE_SPEC.md

Critical rules:

Pages must NOT perform full mailbox scans

Pages must use cached intelligence results

Expected load targets:

Mailbox Intelligence: < 2 seconds

Sender Dashboard: < 2 seconds

Sender Decisions: < 1 second

Navigation between stages: < 500ms

If a change would violate these constraints, Codex must redesign the implementation.

---

# 4. Verify Sender‑First Architecture

The Gmail Workspace is **sender‑first**, not message‑first.

Codex must ensure:

Clusters are sender clusters

Decisions apply to senders

Messages are only evidence

Confirmation resolves message impact

If any implementation reverts to message‑based grouping, Codex must correct it.

---

# 5. Verify Runtime Memory Integration

Sender decisions must be written to:

agent_events

rag_documents

Memory must support:

sender decision history

rule intent tracking

monitoring recommendations

Codex must confirm that these writes occur whenever a decision is saved.

---

# 6. Confirm API Contracts

Before implementing UI features, Codex must verify the following contracts exist:

mailbox_intelligence
sender_workspace
confirmation_preview
monitoring_summary

If any contract is missing, Codex must implement it before building UI logic.

---

# 7. Run Local Validation

Codex must run these validations before reporting completion:

```
npm run build
npx eslint
npx tsc --noEmit
```

If any command fails, Codex must resolve the issue before continuing.

---

# 8. Update Authoritative Documentation

After each phase, Codex must update:

- CHANGELOG.md
- CURRENT_STATE.md
- TODO.md
- system_overview.md

These files are the authoritative state of the system.

---

# 9. Generate PM Review Packet

Before ending the session, Codex must generate a PM Review Packet including:

- Summary of work completed
- Files created or modified
- Validation commands executed
- Remaining risks
- Next recommended phase

The packet format must follow:

CodexPMReviewPacketSpec.md

---

# 10. Stop Conditions

Codex must STOP and request guidance if:

- Documentation conflicts
- Phase scope is unclear
- Performance rules cannot be satisfied
- Sender‑first model would be violated

Codex must never guess architecture.

---

# End of Checklist