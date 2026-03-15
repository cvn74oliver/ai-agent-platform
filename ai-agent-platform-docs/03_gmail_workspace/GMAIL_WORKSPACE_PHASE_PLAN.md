# Gmail Workspace Phase Execution Plan

This document defines the **phased rebuild strategy** for the Gmail Workspace system. The goal is to avoid large unstable rebuilds and instead execute controlled, testable iterations using Codex.

Each phase must be completed, validated, and approved before moving to the next phase.

Codex must follow this plan strictly.

---

# Core Execution Principles

1. **One Phase At A Time**
   Codex must only implement the current phase.

2. **No Hidden Changes**
   Codex must not refactor unrelated systems during a phase.

3. **Validation Required**
   Each phase must include:

   - build validation
   - lint validation
   - runtime validation

4. **PM Packet Required After Every Phase**

   Codex must generate the **PM Review Packet** after completing work.

   The PM packet must follow the format defined in:

   `08_codex_instructions/CODEX_MASTER_INSTRUCTION_PACKET.md`

   Codex should run the **PM packet script** to structure this automatically.

---

# Phase Overview

| Phase | Goal |
|-----|-----|
| Phase 1 | Sender‑First Foundation + Performance Stabilization |
| Phase 2 | Mailbox Intelligence Analytics Expansion |
| Phase 3 | Sender Cluster Architecture |
| Phase 4 | Sender Decision Workspace |
| Phase 5 | Confirmation + Execution |
| Phase 6 | Rules + Automation Layer |
| Phase 7 | Monitoring + Learning Layer |
| Phase 8 | Final UX Polish + Analytics |

---

# Phase 1 — Sender‑First Foundation + Performance Stabilization

Goal:

Stabilize the Gmail Workspace so the **sender‑first workflow is usable and fast enough for real testing**.

Phase 1 includes the core workflow foundation:

Mailbox Intelligence → Cleanup Groups → Sender Decisions → Confirmation

Later workflow stages (Exceptions, Rules, Monitoring) must remain present as **inactive placeholders only**.

---

Current problems to fix

- pages take 30–60 seconds to load
- analytics recompute on every navigation
- mailbox index not cached
- clusters sometimes recompute repeatedly
- navigation between stages triggers redundant data loading

---

Required fixes

1. Introduce caching layer for mailbox intelligence
2. Cache sender universe
3. Cache cleanup clusters
4. Cache cleanup group results
5. Add pagination API support
6. Avoid recomputing analytics per page navigation
7. Ensure Intelligence → Clusters navigation reuses cached data
8. Prevent stage changes from triggering full mailbox analysis

---

Required functional scope

Phase 1 must stabilize the following pages:

• Mailbox Intelligence
• Cleanup Groups
• Sender Decisions
• Confirmation

The following pages must remain **non‑functional placeholders**:

• Exceptions
• Rules
• Monitoring

Opening these routes should display a "Phase 2+" placeholder message instead of executing logic.

---

Expected result

- Mailbox intelligence loads from cache
- cleanup groups reuse intelligence results
- sender workspace supports pagination
- confirmation stage calculates impact from cached sender selections

---

Phase 1 validation

Mailbox intelligence loads under 2 seconds

Cluster page loads under 1 second

Sender workspace loads under 2 seconds

Navigation between stages does NOT recompute mailbox analytics

---

# Phase 2 — Mailbox Intelligence Dashboard

Goal:

Build the **true Gmail analytics dashboard**.

Required features:

Analytics must include:

- sender distribution
- message volume trends
- sender activity timeline
- sender categories
- top senders

Visualizations:

Required charts:

- sender volume bar chart
- message volume line chart
- sender category pie chart
- inbox health indicators

Dashboard must also include:

- "Mission" panel
- inbox health score
- pending actions
- recommended cleanup clusters

---

# Phase 3 — Sender Cluster Architecture

Goal:

Cluster **senders**, not messages.

Cluster types:

1. AI Smart Clusters

Examples:

- retail senders
- travel companies
- social platforms
- newsletters
- subscriptions

2. Analytical Clusters

Examples:

- top 10% senders
- inactive senders
- unread senders
- promotional senders

Clusters must be **sender-based**.

Important:

Clusters must be built from **senders**, not message types.

A sender must belong to exactly one cluster.

Messages remain secondary evidence used only for preview and decision support.

This prevents duplicate senders appearing across multiple clusters and keeps the system aligned with the sender‑first cleanup model.

Messages remain secondary evidence.

---

# Phase 4 — Sender Decision Workspace

Goal:

Create the primary decision interface.

Users interact with **senders**, not messages.

Required features:

Sender analytics panel

- sender message volume
- sender activity history
- sender engagement

Decision controls

- Keep
- Archive
- Unsubscribe
- Quarantine
- Custom Rule

These controls operate on **senders**, not individual messages.

Message previews are displayed only as supporting evidence.

Message previews

- expandable
- evidence only

Filtering must include

- volume
- unread
- domain
- category

---

# Phase 5 — Confirmation Stage

Goal:

Review all decisions before execution.

Confirmation must show:

- number of senders affected
- number of messages affected
- protected senders
- archive scope

Execution rules

Archive operations must support

- Gmail batchModify
- chunking beyond 100 messages

---

# Phase 6 — Rules + Automation

Goal:

Convert decisions into automation rules.

Rules supported:

- always archive
- always keep
- quarantine rules
- unsubscribe rules
- custom filters

Rules must be editable.

---

# Phase 7 — Monitoring + Learning

Goal:

Expose the AI learning layer.

Monitoring should display

- learned sender policies
- rule intents
- recommendations

Recommendation types:

- domain suggestions
- sender automation
- cleanup suggestions

---

# Phase 8 — UX Polish + Analytics

Goal:

Finalize the product experience.

Includes

- analytics polish
- UX improvements
- decision speed
- keyboard shortcuts

---

# Required Codex Output After Each Phase

Codex must provide:

PM Review Packet

including:

- root cause analysis
- files changed
- validation results
- next risks

Codex should use the packet structure defined in:

`08_codex_instructions/CODEX_MASTER_INSTRUCTION_PACKET.md`

---

# Performance Requirements

The system must meet these requirements:

| Page | Target Load Time |
|-----|-----|
| Mailbox Intelligence | < 2s warm cache |
| Cluster Page | < 1s |
| Sender Workspace | < 2s |
| Confirmation | < 1s |
| Navigation Between Steps | instant (no recomputation) |

Analytics must be cached.

Mailbox indexing must not rerun on every navigation.

---

# Completion Criteria

The Gmail Workspace rebuild is considered complete when:

- sender-first architecture fully implemented
- inbox cleanup operates at scale
- automation rules function
- monitoring recommendations work
- performance targets achieved

---

End of Document
