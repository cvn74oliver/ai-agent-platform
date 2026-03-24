# 3. Sender Exploration & Decision Workspace (Unified Modes)

This is the most important UX surface in the product.

It supports TWO modes on the SAME sender card:
- Overview Mode (map/explore)
- Decision Mode (drive/execute)

## ⚠️ ARCHITECTURE UPDATE (Phase L — Unified Sender Surface)

This page is no longer a standalone screen.

It is a MODE of the unified sender card system used across Sender Overview and Decision Mode.

- Overview Mode = exploration (many senders, scrollable)
- Decision Mode = execution (one sender, focused)

Decision Mode must open in-place (overlay/focus), not via navigation.
Users must never lose context (same cleanup group, same scroll position on exit).

---

## Core Interaction Model (Updated)

### Overview Mode (Explore)
- Multiple senders visible
- Scrollable list
- Expand rows for quick context
- Compare and scan patterns

Primary action:
- Click a sender to enter Decision Mode (overlay)

---

### Decision Mode (Execute)
- One sender in focus
- Same data as overview
- Decisions enabled
- Auto-advance progression

Primary loop:
Show 1 sender → decide → next → repeat

---

### Transition (Critical)
- Clicking a sender opens Decision Mode as an overlay
- No navigation or context reset
- Exiting returns to the same scroll position

---

## Sender Profile Card (Primary UI)

NOTE:
This is the SAME card used in Sender Overview.
Decision Mode does not introduce a new card.
It promotes this card into a focused execution state.

Each sender is presented like a **profile**.

### Layout

1. Hero Section
- Sender avatar/logo (if available)
- Sender name
- Domain
- Short AI-generated description

Example:
"Amazon — E-commerce platform sending order confirmations, promotions, and updates."

---

2. Key Signals Panel

Quick-glance intelligence:

- Message volume
- Frequency (daily / weekly / occasional)
- Human vs Machine likelihood
- Category mix (promotions, updates, transactional, etc.)
- Engagement signal (opened, ignored, unread-heavy)

---

3. Behavior Summary

Simple explanation:

"This sender primarily sends promotional content with occasional order updates."

---

4. Expandable Email Evidence

Grouped by category:

- Promotions
- Updates
- Transactions
- Other

Each group can be expanded to show:
- Subject lines
- Snippets
- Sample messages

Messages are **evidence only**, not decision units.

---

## Decision Actions (ONLY 4 BUTTONS)

This is critical.

Users are not overwhelmed with options.

They choose one of four:

1. **Keep All**
→ Keep all emails from this sender

2. **Keep Some**
→ Send to custom rule builder (Management phase)

3. **Archive All**
→ Archive all emails from this sender

4. **Not Sure**
→ Send to quarantine bucket for later review

---

## Flow Behavior (Updated)

- Decision Mode opens in-place (overlay/focus)
- User remains in the same cleanup group context
- After each decision → next sender loads instantly
- No confirmation step in Decision Mode
- User can exit Decision Mode and return to the same scroll position

---

## Progress System

Display minimal but motivating progress:

- Senders reviewed in this session
- Total senders remaining in the cluster
- Completion percentage

Example:
"32 of 120 senders reviewed"

Progress must remain consistent regardless of entry path (guided or direct click).

---

## Session Completion

When all senders are processed:

- Show completion state
- Direct user to **Management phase**

Example:
"You’ve reviewed all senders in this group."

---

## Advanced Review: “Keep Some” Senders

Senders marked as **Keep Some** move to a secondary flow.

### Secondary Decision Mode

Still uses card-style UX, but now focused on **categories within a sender**.

For each sender:

- Show categories (Promotions, Updates, etc.)
- Each category has:
  - Example messages
  - Like / Don’t Like toggle

User defines:
- What to keep
- What to archive

---

## Output Buckets (Management Input)

Decisions map into:

- Keep → no action required
- Keep Some → Custom Rules
- Archive → Archive Queue
- Not Sure → Quarantine

---

## UX Design Principles for This Page

### Speed Over Detail
The system prioritizes fast decision-making.

### One Decision at a Time
No tables. No multi-select.

### Confidence Through Context
Provide just enough data to decide.

### Momentum
Every action moves the user forward.

### Context Preservation
The user must never lose context when moving from exploration to execution.
Decision Mode must feel like a continuation, not a separate screen.

---

## Critical Constraint

This page must **NOT revert to table-based UX**.

Tables can exist elsewhere (analytics, management), but not here.

This is a **decision engine, not a data browser**.

---

## Final Goal

The Sender Decision Workspace should feel like:

"A fast, intuitive system that lets me clean my inbox in minutes, not hours."

Users should experience:

- Clarity
- Speed
- Control
- Progress

And most importantly:

They should **want to keep going**.

---

## Unified Interaction Model (Final)

Cleanup Group → Sender Overview → Click Sender → Decision Mode (overlay) → Next → Next → Next → Management

Key rules:
- one card system
- two modes
- no context loss
- no navigation reset
- decision always available when sender is in focus

This creates a continuous "slippery slide" from understanding → decision → completion.