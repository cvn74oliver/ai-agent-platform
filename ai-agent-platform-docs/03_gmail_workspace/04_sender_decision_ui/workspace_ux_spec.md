# 3. Sender Decision Workspace (Swipe Mode)

This is the **most important UX surface in the entire product**.

This page is no longer a table-first analytical interface.

It is a **high-speed decision engine inspired by swipe-based systems (e.g., Tinder)**.

The goal is:

- Maximum speed
- Zero cognitive overload
- Continuous forward momentum
- Clear, confident decisions

Users should be able to process **dozens or hundreds of senders quickly** without fatigue.

---

## Core Interaction Model

Users see **one sender at a time**.

Each sender appears as a **profile card**.

The rest of the UI fades into the background.

After each decision, the next sender appears immediately.

No scrolling. No tables. No clutter.

---

## Sender Profile Card (Primary UI)

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

## Flow Behavior

- User clicks a decision
- Card animates out
- Next sender appears instantly

No confirmation step here.

No friction.

---

## Progress System

Display minimal but motivating progress:

- Senders reviewed in this session
- Total senders remaining in the cluster
- Completion percentage

Example:
"32 of 120 senders reviewed"

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