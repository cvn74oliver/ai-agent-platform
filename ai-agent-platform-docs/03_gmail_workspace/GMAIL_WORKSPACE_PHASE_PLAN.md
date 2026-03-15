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
| Phase 1 | Performance + Data Loading Stabilization |
| Phase 2 | Mailbox Intelligence Dashboard |
| Phase 3 | Sender Cluster Architecture |
| Phase 4 | Sender Decision Workspace |
| Phase 5 | Confirmation + Execution |
| Phase 6 | Rules + Automation Layer |
| Phase 7 | Monitoring + Learning Layer |
| Phase 8 | Final UX Polish + Analytics |

---

# Phase 1 — Performance Stabilization

Goal:

Make the system fast enough for real testing.

Current issues:

- pages take 30–60 seconds to load
- analytics recompute on every navigation
- mailbox index not cached

Required fixes:

1. Add caching layer for mailbox intelligence
2. Cache sender clusters
3. Cache cleanup group results
4. Add pagination API support
5. Avoid recomputing analytics per page

Expected Result:

- page load < 2 seconds
- navigation between steps instant

Phase 1 validation:

- mailbox intelligence loads under 2s
- cluster page loads under 1s
- sender workspace loads under 2s

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
| Mailbox Intelligence | < 2s |
| Cluster Page | < 1s |
| Sender Workspace | < 2s |
| Navigation Between Steps | instant |

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
