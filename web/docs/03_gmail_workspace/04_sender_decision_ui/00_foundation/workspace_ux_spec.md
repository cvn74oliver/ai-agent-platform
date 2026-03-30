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

### Analysis Rail Integration (NEW)

The Sender Exploration surface is now preceded by a **Shared Analysis Rail** (tabbed):
- Sender Distribution (who matters)
- Time Context (when it happens)

Rules:
- Only ONE chart is visible at a time (tabs)
- Tabs do NOT change `analysis_scope`
- Tabs do NOT trigger runtime rehydrate
- Both tabs read from the SAME shared workflow subset contract

The rail defines the **active workflow subset** that the list and Decision Mode must follow.

### Overview Mode (Explore)
- Multiple senders visible
- Scrollable list
- Expand rows for quick context
- Compare and scan patterns

Primary action:
- Click a sender to enter Decision Mode (overlay)

Source of truth:
- The list must reflect the active workflow subset defined by the Analysis Rail
- Ordering must match the authoritative scoped order (no client-side re-sorting)

---

### Decision Mode (Execute)
- One sender in focus
- Same data as overview
- Decisions enabled
- Auto-advance progression

Primary loop:
Show 1 sender → decide → next → repeat

Consistency rule:
- The first sender shown in Decision Mode must match the top-ranked sender from the active workflow subset
- Decision Mode must never use a different ordering than the chart/list

---

### Transition (Critical)
- Clicking a sender opens Decision Mode as an overlay
- No navigation or context reset
- Exiting returns to the same scroll position

Additional constraint:
- Entering Decision Mode must preserve the active workflow subset (including timeframe and any focused sender)

---

## Sender Profile Card (Primary UI)

Note:
- This card is driven by the active workflow subset from the Analysis Rail
- It must not fetch or compute an independent view of the sender outside that subset

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

Subset continuity:
- After each decision, the next sender must come from the SAME authoritative subset
- No reordering or re-selection mid-session

---

## Progress System

Display minimal but motivating progress:

- Senders reviewed in this session
- Total senders remaining in the cluster
- Completion percentage

Example:
"32 of 120 senders reviewed"

Progress must remain consistent regardless of entry path (guided or direct click).

Scope rule:
- Progress must be computed against the active workflow subset, not the full cluster unless no subset is active

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

### Single Source of Truth
Charts, list, and Decision Mode must all reflect the same subset, scope, and ordering.
No parallel or competing decision logic is allowed.

---

## Critical Constraint

This page must **NOT revert to table-based UX**.

Tables can exist elsewhere (analytics, management), but not here.

This is a **decision engine, not a data browser**.

Additionally:
- Do NOT trigger `/api/agents/playground` or runtime rehydrate from:
  - chart interactions
  - timeframe changes
  - sender selection
- Do NOT introduce a separate queue model for charts or lists

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

---

## Integration Summary (NEW)

The full flow is now:

Analysis Rail → Workflow Subset → Sender List → Decision Mode

Key invariants:
- One shared subset
- One ordering
- One execution path
- No context loss
- No rehydrate