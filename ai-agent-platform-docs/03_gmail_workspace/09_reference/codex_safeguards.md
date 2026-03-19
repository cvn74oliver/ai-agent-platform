

# Gmail Workspace — Codex Safeguards

## Purpose

This document defines **mandatory guardrails for Codex when modifying the Gmail Workspace system**.

Large architectural rebuilds previously introduced regressions, slow page loads, broken analytics, and incomplete UX behavior. These safeguards ensure Codex works **incrementally, safely, and observably** during the Gmail Workspace rebuild.

Codex must treat this document as **authoritative during any Gmail Workspace work.**

---

# 1. Codex Execution Rules

Codex must follow these rules whenever working on Gmail Workspace code.

## 1.1 Work in Phases Only

Codex must **never attempt to implement the entire Gmail Workspace at once.**

Instead, development occurs in controlled phases defined in:

`GMAIL_WORKSPACE_PHASE_PLAN.md`

Each phase must:

• Have a clearly defined scope
• Modify only a limited surface area
• Be validated before the next phase begins

Codex must **not implement functionality from later phases early.**

---

## 1.2 Do Not Break Existing Routes

Codex must **not break working functionality while implementing new behavior.**

Specifically:

Working routes must remain functional:

• `/operations`
• `/operations/intelligence`
• `/operations/clusters`
• `/operations/review`
• `/operations/approvals`

If replacing behavior, Codex must:

• preserve route structure
• migrate functionality safely
• avoid temporary regressions

---

## 1.3 UI Performance Budget

Every Gmail Workspace page must load within:

**Target:**

• < 2 seconds initial load
• < 500ms navigation between stages

Codex must never introduce UI behavior that causes:

• full mailbox reloads on every page change
• blocking synchronous data loading
• expensive recomputation per navigation

### Required Performance Patterns

Codex must use:

• cached mailbox intelligence
• cached sender analytics
• pagination for sender lists
• incremental data loading

Heavy analytics queries must run **once per session**, not per page.

---

# 2. Sender‑First Data Model Safeguards

The Gmail Workspace system is **sender‑first**.

Codex must **not revert to message‑first models.**

## Correct hierarchy

```
Mailbox
  → Senders
      → Messages
```

Decisions apply to **senders**, not individual messages.

Examples of sender decisions:

• Keep sender
• Archive sender
• Quarantine sender
• Unsubscribe sender
• Custom rule

Messages only appear as **evidence inside sender views.**

Codex must **never design UI that treats messages as the decision object.**

---

# 3. Cluster Safeguards

Clusters must be **sender clusters**, not message clusters.

Correct examples:

```
Retail promotions senders
Travel company senders
Subscription service senders
Social platform senders
```

Incorrect examples:

```
"Unread messages"
"Messages older than 30 days"
"Message types"
```

Clusters must group **senders with similar behavior**.

Each sender may belong to **only one cluster at a time.**

---

# 4. UX Safeguards

Codex must not remove UX capabilities during refactors.

The following features are **required in the final UI**:

## 4.1 Interactive Analytics

Analytics must include:

• bar charts
• pie charts
• sender distribution graphs
• timeline graphs

Charts must allow interaction:

• hover insights
• click filtering
• drill‑down into sender sets

Static analytics are **not acceptable.**

---

## 4.2 Sender Filtering

The sender decision workspace must support filtering by:

• sender volume
• unread count
• last activity
• domain
• cluster

Codex must not ship a UI where users must manually scan hundreds of senders.

---

## 4.3 Decision Visibility

Users must clearly see:

• what decisions they made
• what actions will occur
• what rules will be created

Confirmation must show:

```
Senders archived
Senders kept
Senders quarantined
Rules created
```

---

# 5. Memory + RAG Safeguards

Codex must maintain the learning system implemented earlier.

Every explicit user decision must:

1. Write an event to

```
agent_events
```

2. Create or update a memory document in

```
rag_documents
```

Monitoring must read from:

• event memory
• semantic memory
• sender analytics

Codex must not remove or bypass this learning pipeline.

---

# 6. Page‑Load Safeguards

Codex must ensure Gmail Workspace pages are **cached where appropriate.**

Required caching:

Mailbox Intelligence

Sender analytics

Cluster results

Sender lists

Sender evidence previews

Only **confirmation previews** should require recomputation.

---

# 7. Safety Rules for Large Changes

Before making large changes, Codex must:

1. Review

```
GMAIL_WORKSPACE_PRODUCT_FLOW_SPEC.md
GMAIL_WORKSPACE_UX_SPEC.md
GMAIL_WORKSPACE_ANALYTICS_SPEC.md
```

2. Confirm the change does not conflict with those specs.

3. Implement the change in a **phase‑limited patch**.

---

# 8. Required PM Review Packet

At the end of every Codex execution, a **PM Review Packet must be generated.**

This packet must include:

### Summary

What was implemented

What phase this corresponds to


### Files Changed

Exact file list


### Validation

Lint

TypeScript

Build

Manual testing scope


### Risks

Known limitations

Next phase work


Codex should use the repository script for this whenever possible.

---

# 9. Absolute Non‑Goals

Codex must **not introduce the following regressions:**

• minute‑long page loads
• message‑first decision models
• non‑interactive analytics
• removing filtering capability
• removing sender insights
• removing memory recording

Any change that causes these issues must be rolled back.

---

# 10. Guiding Principle

The Gmail Workspace system is designed to feel like:

```
An AI agent briefing you on your inbox
```

The system should always answer:

• What happened
• What decisions were made
• What remains to be done
• What the AI recommends next

Codex must preserve this **agent‑guided workflow experience**.