# Step 2 — Sender Decisions

This is the **primary decision workspace**.

This step is intentionally split into two modes:

1. High-Level Sender Intelligence (Overview)
2. Focused Sender Decision Mode (Tinder-style flow)

This preserves both:
• strategic understanding (zoomed out)
• fast decision-making (zoomed in)

---

## Mode 1 — Sender Intelligence (Overview)

Purpose:

Give the user a **clear, high-level understanding of the senders in this cleanup group before making decisions**.

This acts like a **mini dashboard for the selected cleanup group**.

Layout:

```
Sender Intelligence Overview

Analysis Rail (Tabbed)
Dynamic Context Panel
Primary CTA
```

### Analysis Rail (Primary Surface)

This is the central analysis system for the page.

It is a shared, full-width container with two modes:

- Sender Distribution (primary)
- Time Context (secondary)

Only one mode is visible at a time (tab-based system).

Behavior:
- Both modes share the same timeframe controls
- Both read from the same workflow subset contract
- Both reflect the active cleanup group and scope
- Switching tabs does NOT trigger runtime rehydrate

Purpose:
- Sender Distribution → who to act on
- Time Context → when activity is happening

This replaces stacking multiple charts vertically.

### Dynamic Context Panel

This section replaces static summary cards.

It updates based on the active Analysis Rail mode and selection.

Examples:

Sender Distribution mode:
- Selected sender
- Rank
- % of total
- Suggested action

Time Context mode:
- Selected timeframe
- Activity trend
- Volume comparison
- Suggested action

Purpose:
Provide immediate, actionable insight tied to the current view.

---

### Primary Action

```
Start Reviewing Senders
```

Behavior:

• Locks the overview UI  
• Transitions into focused decision mode  
• Begins sender-by-sender flow  

Important:
- The workflow subset established in the Analysis Rail carries into Decision Mode
- The overview is not just informational; it defines the starting execution context

---

## Mode 2 — Sender Decision Mode (Primary UX)

This is the **core experience of the product**.

Instead of tables, the user sees **one sender at a time**, similar to a dating app.

---

### Layout

```
--------------------------------------------------
Sender Profile Card
--------------------------------------------------

Hero Section (Sender Identity)

Sender Details

Email Categories (Expandable)

Decision Buttons
```

---

### Sender Profile Card

Each sender is presented as a **single focused decision unit**.

#### Hero Section

Sender name  
Sender avatar (logo/profile image if available)  
Primary classification (e.g., Promotions, Updates, Personal)  

#### Sender Details

Short AI-generated description:

Example:

"This sender primarily sends promotional offers and marketing campaigns."

Key signals:

• Human vs Machine probability  
• Frequency  
• Last activity  
• Total messages  

---

### Email Category Breakdown

Grouped by type:

Promotions  
Updates  
Alerts  
Receipts  
etc.

Each category is expandable:

```
Promotions (120 emails)
→ expand to preview examples
```

Preview includes:

Subject  
Snippet  
Date  

---

### Decision Buttons (Core Interaction)

Only four actions:

```
✓ Keep All
◐ Keep Some
✕ Archive All
? Not Sure
```

Meaning:

Keep All → stays in inbox  
Keep Some → goes to custom rules flow (management)  
Archive All → goes to archive bucket  
Not Sure → goes to quarantine  

---

### Interaction Flow

• User selects an action  
• Card animates out  
• Next sender loads instantly  

Goal:

**Fast, continuous flow with minimal friction**

---

### Completion State

When all senders are reviewed:

```
You're done reviewing this group
→ Continue to Management
```

---

## Key Design Principle

The system uses a three-layer decision model:

1. Analysis (Analysis Rail)
   - understand who and when
   - define the workflow subset

2. Context (Dynamic Context Panel)
   - interpret the current state
   - suggest action

3. Execution (Decision Mode)
   - act on one sender at a time

This ensures:
- clarity before action
- consistency between analysis and execution
- no duplicated or conflicting decision logic

---

## Important Constraint

Do NOT mix table-based decisions with card-based decisions.

Tables are for:
• analysis
• exploration

Cards are for:
• decisions
• speed

Additionally:
- Do NOT introduce parallel decision systems
- Charts, workflow list, and Decision Mode must share one authoritative subset
- No UI interaction should trigger a runtime rehydrate