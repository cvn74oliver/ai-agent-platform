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

Charts
Summary Cards
Sender Distribution
Primary CTA
```

### Charts

Top senders in this group  
Recency distribution  
Category breakdown  
Human vs automation ratio  

These mirror the intelligence page but are **scoped to the selected cleanup group**.

### Summary Cards

Batch Size  
Sender Count  
Unread Ratio  
Automation Ratio  

### Sender Distribution

Optional lightweight table or ranked list of top senders.

---

### Primary Action

```
Start Reviewing Senders
```

Behavior:

• Locks the overview UI  
• Transitions into focused decision mode  
• Begins sender-by-sender flow  

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

The system uses a **two-phase zoom model**:

Zoom Out → Understand the group (overview)  
Zoom In → Make fast decisions (card flow)

This ensures:
• confidence before action  
• speed during action  

---

## Important Constraint

Do NOT mix table-based decisions with card-based decisions.

Tables are for:
• analysis
• exploration

Cards are for:
• decisions
• speed