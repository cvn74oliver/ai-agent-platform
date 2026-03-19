

# Gmail Workspace — Decision Destinations Spec

## Purpose

This document defines what happens **after Confirmation** in the Gmail Workspace.

It exists to replace the earlier queue-heavy, developer-oriented mental model (`Pending Approvals`, `Executed Actions`, `History`) with a more product-native system built around:

- decision destinations
- sender profiles
- reversible actions
- AI-assisted rule recommendations
- long-term learning from user decisions

This is a foundational layer for the Gmail Workspace because Mailbox Intelligence can only become fully trustworthy once the system has real downstream destinations for decisions.

---

# Core Product Principle

**Confirmation is the final human approval checkpoint.**

When the user presses **Approve** on the Confirmation screen, that action is the approval.

The product should not then route the user into a second artificial approval queue as the primary workflow.

Instead:

1. decisions are approved
2. the approved items move into their destination states
3. the user later manages them from the appropriate destination surfaces

This keeps the workflow understandable and removes scaffolding that was useful during development but confusing in the final product.

---

# Product Model

## The Three Layers

The decision system should be understood as three distinct layers.

### Layer 1 — Pending Intent
This is the temporary layer **before approval**.

Examples:
- sender decisions in progress
- partially completed review work
- a confirmation set that has been assembled but not yet approved

This is conceptually similar to a shopping cart or draft approval set.

It is valid for the system to store this state internally.

However, this should not dominate the user-facing navigation.

### Layer 2 — Executed Decision State
This is the real system state after approval.

Once the user approves, decisions move into one of the actual decision destinations:

- Keep
- Archive
- Quarantine
- Unsubscribe
- Custom Rule

These are the primary user-facing destinations.

### Layer 3 — Historical Record
Every meaningful action should still be logged.

But history should be represented in two ways:

1. **sender-level history** (primary user-facing history)
2. **global system log** (secondary admin/audit history)

The system should not require users to think in terms of a queue or an execution audit just to manage normal inbox behavior.

---


# Decision Destinations

## Decision Flow Context (Important)

All Decision Destinations are populated through the **Sender Decision Flow (Tinder Mode)**.

This means:
- Users review one sender at a time
- They make one of four decisions:
  - Like All
  - Like Some
  - Like None
  - Not Sure

Those decisions map directly to destinations:

- Like All → Keep
- Like Some → Custom Rule (deferred configuration)
- Like None → Archive
- Not Sure → Quarantine

This ensures:
- fast decision velocity
- low cognitive load
- consistent data entering the system

## 1. Keep

### Meaning
The sender is intentionally preserved as inbox-allowed or inbox-preferred.

### Typical use
- high-value sender
- personally important sender
- operationally important sender
- sender the user explicitly does not want caught by cleanup automation

### Stored data
- sender id
- approval timestamp
- reason/source context
- who/what marked it as keep
- any protected-message evidence
- later rule recommendation eligibility

### Future actions allowed
- remove from Keep
- move to Quarantine
- move to Archive
- create keep-oriented rule
- restore previous state if recently changed

---

## 2. Archive

### Meaning
The approved archive action has been executed for the applicable inbox-visible items, and the sender now exists in an archive-managed state.

### Typical use
- bulk inbox noise reduction
- approved cleanup for low-value recurring senders
- clutter reduction with reversible history

### Stored data
- sender id
- approval timestamp
- estimated and actual impact
- number of affected messages
- archive reason/context
- whether archive reflects one-time action vs future learned recommendation source

### Future actions allowed
- restore to inbox
- move to Keep
- move to Quarantine
- generate archive-related rule recommendation
- inspect per-sender history
- push archive action to Gmail
- undo archive action after push

---

## 3. Quarantine

### Meaning
The sender is placed into a temporary caution state where it is not treated as fully trusted inbox content.

This should function like a controlled holding area, not like deletion.

### Typical use
- uncertain sender
- mixed-signal sender
- suspicious but not obviously disposable sender
- sender user wants to suppress while evaluating

### Stored data
- sender id
- quarantine timestamp
- quarantine reason
- risk signals / caution signals
- later recommendation eligibility

### Future actions allowed
- restore to inbox
- promote to Keep
- demote to Archive
- recommend unsubscribe or custom rule if pattern persists
- inspect quarantine history

---

## 4. Unsubscribe

### Meaning
The sender has been marked for unsubscribe intent and is tracked as part of the unsubscribe management flow.

### Important
In early phases, unsubscribe may begin as a destination/intention state before all unsubscribe execution logic is fully productized.

### Stored data
- sender id
- unsubscribe decision timestamp
- current unsubscribe status
- whether unsubscribe was attempted, completed, deferred, or failed
- related sender history

### Future actions allowed
- cancel unsubscribe intent
- move to Archive
- move to Quarantine
- convert into rule candidate
- inspect unsubscribe history

---

## 5. Custom Rule

### Meaning
The sender has been marked as requiring more nuanced logic than Keep / Archive / Quarantine / Unsubscribe alone.

### Important product rule
**Confirmation should not require the full rule to be authored immediately.**

At Confirmation time, the user can approve a **custom rule intent**.

The actual rule definition can then be created or refined later in the Decision Destinations layer.

This is critical because it keeps Confirmation lightweight while still allowing sophisticated behavior later.

### Stored data
- sender id
- custom rule intent timestamp
- reason for custom-rule classification
- AI recommendation eligibility
- draft rule state if created later

### Future actions allowed
- define the actual rule
- edit the rule
- move back to Keep / Archive / Quarantine / Unsubscribe
- accept an AI-suggested rule
- review rule history

### Important UX behavior

Custom Rule does not require immediate configuration.

Instead:
- the sender is flagged for later review
- user is routed to Management → Custom Rules
- user defines granular preferences (keep vs archive by category)

This keeps the initial decision flow fast and uninterrupted.

---

# Confirmation Behavior

## Product rule
The Confirmation screen should approve and commit decisions directly into these destinations.

It should not behave like:

Confirmation -> Pending Approvals -> Executed Actions -> History

Instead it should behave like:

Confirmation -> Decision Destinations

## Clarification
That does **not** mean the system cannot internally preserve approval metadata, queue semantics, or audit information.

It means those concepts should be implementation detail or secondary views — not the primary UX.

---

# Pending Approvals, Executed Actions, and History

## Pending Approvals
Pending approvals still make sense **internally** as draft or unsubmitted confirmation state.

Examples:
- sender decisions have been staged but not approved
- confirmation set was built but user left before submitting

This can still exist as stored draft state.

But it should not be the main product destination after confirmation.

## Executed Actions
Executed actions are real, but they should be represented primarily by the state of the destination buckets.

The user should feel like:
- “this sender is in Quarantine”
- “this sender is in Keep”

not:
- “this exists in an execution queue”

## History
History should exist, but as:

### Sender-level history (primary)
Each sender should behave like a profile with its own activity timeline.

Example:
- archived on date X
- moved to quarantine on date Y
- restored to inbox on date Z
- custom rule approved on date A

### Global system history (secondary)
The system may still maintain an overall activity log for audit, admin, or power-user use.

But this should not be the primary user workflow.

---

# Sender Profiles

Each sender should increasingly behave like a managed profile object.

A sender profile should eventually hold:
- identity / classification
- trust signals
- decision destination
- inbox impact metrics
- last activity
- protected-message evidence
- rule recommendations
- historical actions

This is important because the sender profile becomes the durable entity the user and the AI both reason about.

---

# AI Rule Recommendations

## Core principle
AI rule recommendations should live **in the same management layer as the decision destinations**, not on a totally separate isolated page.

## Why
Because rule recommendations depend on accumulated decision context:
- Keep patterns
- Archive patterns
- Quarantine patterns
- Unsubscribe intent
- Custom-rule intent
- sender behavior over time

The best recommendations appear when the AI can inspect those destination states together.

## Product recommendation
The management experience should have:

### A shared management dashboard layer
This acts as the umbrella surface for:
- destination bucket summaries
- AI rule recommendations
- sender state overviews
- action counts
- important exceptions or risks

### Destination-specific detail views
When the user drills into a bucket, that specific page/view loads:
- Keep view
- Archive view
- Quarantine view
- Unsubscribe view
- Custom Rule view

### Recommendation section inside the management layer
AI rule recommendations should be visible from the main management layer and also contextually inside relevant bucket views.

That gives the best balance:
- not too many disconnected pages
- not everything smashed into one giant page
- AI recommendations remain close to the decisions that generated them

---
---

# Push to Gmail (Execution Layer)

## Core Principle

Decisions are not automatically executed against Gmail.

Instead, execution is **explicit and reversible**.

## Buckets that require execution

Only two destinations require pushing changes to Gmail:

- Archive
- Custom Rule

Keep:
- requires no action (already inbox-safe)

Quarantine:
- internal state only (no Gmail action required)

Unsubscribe:
- handled separately via unsubscribe system

## Execution Model

Each actionable bucket includes:

- "Push to Gmail" button
- Status indicator:
  - Not Pushed
  - Pushed
- Undo capability

### Example behavior

- User approves Archive decisions
- Archive bucket shows:
  - "Not pushed yet"
- User clicks "Push to Gmail"
- Status becomes:
  - "Pushed"
- User can undo if needed

This creates:
- safety
- trust
- reversibility

# Recommended UX Structure

## Management Layer
This should become the post-confirmation home for the user.

It can be conceptualized as:

Decision Management Dashboard
- destination summaries
- recommendation summaries
- key counts
- items needing attention
- recent decision activity
- execution status (pushed vs not pushed)
- quick action buttons for Archive and Custom Rule

## Drill-down Pages / Views
From there, users can open focused destination views.

Recommended structure:
- Keep
- Archive
- Quarantine
- Unsubscribe
- Custom Rules

## Why this is better than one giant page
A single giant page would become too dense once:
- bucket management
- rule authoring
- rule recommendations
- sender histories
- restore actions
- per-destination filters

all exist together.

So the best product model is:

### One management dashboard
for overview and AI guidance

### Multiple focused destination views
for actual management work

This mirrors the logic already used in Mailbox Intelligence vs Cleanup Groups vs Sender Decisions.

---

# AI Recommendation Lifecycle

The AI should not convert one-off user actions into automatic rules blindly.

Instead, the system should:

1. accumulate destination decisions over time
2. analyze recurring patterns
3. inspect sender behavior, trust, and historical actions
4. propose thoughtful rule candidates
5. let the user approve / reject / edit / defer those candidates

This is where the deeper intelligence stack connects:
- Sender Trust Graph
- Inbox Health Engine
- Recommendation Engine
- Decision Model
- Self-Learning Inbox Intelligence Pipeline

So the decision destinations layer is not just storage.
It is the foundation for future inbox intelligence.

---

# Phase Guidance

## Phase 1
Phase 1 should support:
- direct approval from Confirmation into destination states
- visible destination semantics
- early sender history scaffolding
- lightweight management/dashboard framing

## Later phases
Later phases can expand:
- full rule authoring
- richer AI recommendations
- stronger sender profiles
- reversible operations and restore logic
- fully realized unsubscribe execution lifecycle
- advanced history and global activity exploration

---

# Relationship to Mailbox Intelligence

Mailbox Intelligence should remain the umbrella mission-control surface.

But it can only be fully completed once the destination layer exists, because the dashboard needs real downstream surfaces to point toward.

Examples:
- “3 senders in Quarantine need review”
- “12 custom rule candidates are ready”
- “Archive destination has 204 recently applied senders”
- “Keep bucket is protecting 81 high-trust senders”

Without those destinations, the dashboard can only partially express the system.

---
---

# Daily Maintenance Model (Future Behavior)

Once historical backfill is complete and initial decisions are made:

The system shifts into **maintenance mode**.

## Behavior

- New senders automatically surface for review
- User receives:
  - "New senders to review"
- User enters Sender Decision Flow again
- Same 4-button decision process applies

## Smart Sync Role

- Smart Sync runs periodically (recommended: daily)
- Pulls new emails and sender activity
- Surfaces only delta decisions

## Outcome

User is no longer cleaning inbox manually.

They are:
- reviewing new senders
- maintaining inbox health
- reinforcing system intelligence

This is the long-term product loop.

# Summary

The post-confirmation layer should be a **Decision Destinations system**, not a queue-oriented approval/execution/history UX.

The final mental model is:

1. review senders
2. confirm decisions
3. move approved decisions into destination states
4. manage those destination states over time
5. let AI generate smarter rule recommendations from accumulated behavior

This preserves the original platform framework while making the Gmail Workspace much more understandable and product-native.