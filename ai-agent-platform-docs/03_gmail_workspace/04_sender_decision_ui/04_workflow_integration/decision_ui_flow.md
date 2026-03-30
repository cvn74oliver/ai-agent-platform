

# Gmail Workspace Decision UI Flow

## ⚠️ ARCHITECTURE UPDATE (Phase L — Unified Sender Surface)

The decision system is no longer a separate screen.

It is now a MODE of the unified sender card system.

- Sender Overview = Overview Mode (exploration)
- Decision Mode = Decision Mode (execution)

Users must never leave context when entering Decision Mode.
Decision Mode is entered in-place (overlay or focus transition), not via navigation to a different page.

## Purpose
This document defines the **user-facing flow for making, reviewing, approving, storing, and later managing sender decisions** inside the Gmail Workspace.

It exists to ensure the Gmail cleanup product behaves like a coherent decision system rather than a collection of disconnected pages.

This flow works together with:

- `GMAIL_WORKSPACE_IMPLEMENTATION_PHASE_1.md`
- `GMAIL_WORKSPACE_DECISION_STORAGE_SPEC.md`
- `GMAIL_WORKSPACE_PRODUCT_FLOW_SPEC.md`
- `GMAIL_WORKSPACE_UX_SPEC.md`

---

# Core Product Principle

The Gmail Workspace is a **sender-first decision system**.

That means:

- users review **senders** first
- messages are supporting evidence
- execution happens only after review
- future automation is stored separately from immediate Gmail actions

The system must feel like:

```text
Understand mailbox
→ choose sender cluster
→ review senders
→ make decisions
→ confirm impact
→ approve current action
→ manage stored decisions later
```

---

# Phase 1 UI Flow

Phase 1 supports only the minimum safe decision loop.

## Phase 1 Flow (Updated)

```text
Mailbox Intelligence
→ Cleanup Groups
→ Sender Overview (Explore)
→ Decision Mode (overlay)
→ Confirmation
→ Approval Created
```

Only one Gmail action executes in Phase 1:

- `archive_now`

All other decisions are stored as future intent.

These include:

- keep
- quarantine
- unsubscribe
- custom rule

---

# 1. Mailbox Intelligence

## Purpose
Mailbox Intelligence is the **high-level dashboard**.

It should help the operator answer:

- Where am I right now?
- What should I work on next?
- How healthy is my inbox?
- Which sender clusters need attention?

## What belongs here

- cleanup sender count
- started cluster count
- pending approvals count
- next recommended cluster
- progress indicator
- inbox health summary

## What does NOT belong here

Mailbox Intelligence is not the place for deep sender-level investigation.

It may show summary charts, but detailed sender analytics should not dominate this page.

## Main CTA

The primary action should always point the user toward:

- resuming a cluster
- opening a recommended cleanup group

---

# 2. Cleanup Groups

## Purpose
Cleanup Groups is the **cluster selection layer**.

This page allows the operator to choose which sender cluster to review next.

## Required behavior

Each cleanup group should communicate:

- cluster name
- sender count
- message count
- short explanation of why the cluster exists
- whether work has started on that cluster already

## Operator action

Primary action:

- `Review Sender Set`

## UX rule

Cleanup Groups should not feel like a second analytics dashboard.

It should feel like:

```text
Choose the sender cluster to work next
```

---

# 3. Sender Exploration & Decision (Unified Surface)

This surface supports TWO modes:

## Mode A — Overview Mode (Explore)
- multiple senders visible
- scrollable list
- expandable sender rows
- comparison and inspection

## Mode B — Decision Mode (Execute)
- one sender in focus
- same data as overview
- decision actions enabled
- auto-advance progression

IMPORTANT:
This is ONE system, not two separate pages.

---

## Core Interaction Model (Updated)

Two entry paths:

### Guided Mode
User clicks:
"Start Reviewing Senders"

Flow:
Show 1 sender → decision → next → repeat

### Direct Mode (Drill-down)
User clicks a sender from Overview Mode

Behavior:
- Decision Mode opens as overlay
- Same sender, same context
- No navigation reset

---

The system always behaves like:

Understand → click → decide → next

## Sender Card Structure

NOTE:
This is the SAME card used in Sender Overview.

Decision Mode does not introduce a new card.
It promotes this card into a focused decision state.

Each sender appears as a full focus card with:

### Header
- Sender name
- Sender email/domain
- Profile image (if available)

### Identity + Signals
- Machine vs Human likelihood
- Verification / protected indicators
- Message frequency
- Last activity

### Description
- Short AI-generated explanation of the sender
- Why this sender is grouped in the current cleanup cluster

### Email Categories (Expandable)
- Promotions
- Updates
- Alerts
- etc.

Each category can be expanded to:
- preview example emails
- understand content type

---

## Allowed Decisions (Primary Actions)

Each card presents exactly four actions:

1. **Keep All**
2. **Keep Some**
3. **Archive All**
4. **Not Sure**

---

## Decision Mapping

Each action routes the sender into a system bucket:

### Keep All
- Sender remains untouched
- No Gmail action required

### Keep Some
- Routed to **Custom Rule Review** (Management phase)
- User will later choose which categories to keep

### Archive All
- Routed to **Archive bucket**
- Will be executed in Gmail after approval

### Not Sure
- Routed to **Quarantine bucket**
- No immediate Gmail action

---

## Flow Behavior (Updated)

- After each decision → next sender loads instantly
- Decision Mode remains in the same cleanup group context
- User can exit Decision Mode and return to the same scroll position in Overview
- No context reset at any point

---

## Completion State

When all senders in the group are processed:

- Show completion message
- Prompt transition to:
  - Confirmation (Phase 1)
  - or Management (Phase 2 behavior)

---

## UX Rules

### A. Momentum First
The system prioritizes speed over perfect analysis.

### B. One Decision at a Time
Only one sender is visible at once.

### C. No List Overload
Tables/lists may exist as secondary views, but not as the primary decision interface.

### D. Expand Only When Needed
Details are hidden by default and expanded on demand.

### E. No Backtracking Friction
Users can revisit decisions later in Management.

### F. No Context Switching
The user must never lose context when transitioning between exploration and decision.
Decision Mode must feel like a continuation, not a separate system.

---

## System Outcome

This design allows users to:
- process hundreds of senders quickly
- build intent without fatigue
- reach meaningful progress fast

This is a core product differentiator.

# 4. Confirmation

## Purpose
Confirmation is the **decision-review layer**.

This page must help the operator understand:

- what executes now
- what is only stored for later
- what remains untouched

## Confirmation sections

The page should clearly separate:

### Archive Now
These senders will result in Gmail action after approval.

### Stored for Later
These are future-intent decisions only in Phase 1:

- Keep
- Quarantine
- Unsubscribe
- Custom Rule

### Untouched / Undecided
These senders will remain unchanged for now.

## Required explanations

The page must make these truths obvious:

- archive executes only after approval
- stored-later decisions do not yet change Gmail in Phase 1
- undecided senders are safe to leave alone
- partial completion is allowed
- the user can approve current archive work now and return later to finish the cluster

## Required controls

Phase 1 Confirmation should support:

- remove decision
- change decision
- return to Sender Decisions
- create archive approval

Even if full rule editing is deferred, the user should not feel trapped.

---

# 5. Approval Created

## Purpose
After confirmation, the system creates an approval object for archive execution.

This is not the end of the broader workflow.

It is only the end of the Phase 1 immediate-action loop.

## Operator understanding after approval

The user should understand:

- archive-now decisions were queued for execution
- stored-later decisions remain part of future policy state
- they may return to continue the same cluster later

---

# Phase 2 UI Flow Extension

Phase 2 introduces the **Decision Management Layer**.

## Phase 2 Flow

```text
Mailbox Intelligence
→ Cleanup Groups
→ Sender Decisions
→ Confirmation
→ Approval Created
→ Decision Storage / Rules Center
```

This new layer gives users a place to inspect and modify stored decisions.

---

# Decision Management Layer

## Purpose
The Decision Management Layer is where users revisit and manage stored sender intent.

This should eventually include:

### Quarantined Senders
- view quarantined senders
- remove quarantine
- convert to archive
- convert to custom rule

### Unsubscribed Senders
- view unsubscribe decisions
- remove unsubscribe intent
- convert to archive
- convert to custom rule

### Keep Preferences
- inspect protected keep senders
- remove keep preference

### Custom Rules
- inspect all custom rules
- edit custom rule
- disable custom rule
- delete custom rule

---

# UX Guidance for “Stored For Later” Decisions

This is one of the most important product concepts.

The UI must avoid vague language like:

- “future intent”
- “stored later”

unless the system also clearly explains what that means.

Recommended plain-language pattern:

### Keep
Saved as a future keep preference. No Gmail change happens now.

### Quarantine
Saved as a future quarantine decision. No Gmail change happens now.

### Unsubscribe
Saved as a future unsubscribe decision. No Gmail change happens now.

### Custom Rule
Saved as a future custom rule placeholder. No Gmail change happens now.

This language should appear consistently across Sender Decisions, Confirmation, and later Decision Management views.

---

# Persistence Expectations

The UI flow assumes decision persistence at three levels:

## 1. In-page draft persistence
Selections remain visible while navigating within the cluster.

## 2. Cross-page draft persistence
Selections remain when moving between Intelligence, Cleanup Groups, Sender Decisions, and Confirmation.

## 3. Confirmed decision persistence
After approval, decisions remain available in the decision storage layer for future review.

---

# Inbox Health Connection

This flow should eventually connect to the Inbox Health engine.

Meaning:

- Inbox Health identifies what most needs attention
- Cleanup Groups organize the work
- Sender Decisions allows action
- Confirmation makes consequences clear
- Decision Storage allows ongoing policy management

This is how the product becomes self-explanatory without a separate training module.

---

# Final Product Vision

The final Gmail Workspace should feel like:

```text
Mission Control
→ Choose Work
→ Make Sender Decisions
→ Confirm Immediate Action
→ Build Long-Term Policy
```

The system should help the operator move from:

- reactive inbox cleanup

to:

- durable sender intelligence and reusable policy

---

# Summary

The Gmail Workspace Decision UI Flow is the bridge between:

- one-time cleanup actions
and
- long-term sender policy management

Phase 1 implements the safe immediate-action loop.
Phase 2 introduces stored decision management.

Together they create a Gmail cleanup system that is:

- sender-first
- understandable
- reversible
- scalable
- policy-driven


# Unified System Rule (Final)

There is only ONE sender decision system.

- Sender Overview = context layer
- Decision Mode = execution layer

Users must be able to:
- explore senders
- click any sender
- immediately enter decision mode
- act without losing context

This creates a continuous "slippery slide" from understanding → decision → completion.
