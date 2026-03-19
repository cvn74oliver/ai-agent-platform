


# GMAIL WORKSPACE — SENDER DECISION MODE SPEC

## 1. Purpose

This document defines the **Sender Decision Mode**, a rapid, low-friction interaction model for reviewing and classifying senders within a Cleanup Group.

The goal is to:
- maximize speed of decision-making
- reduce cognitive load
- create momentum through quick wins
- map cleanly into the existing decision destination system (Keep, Archive, Custom Rule, Quarantine)

This mode introduces a **single-sender card flow** (similar to a swipe/stack interaction), while preserving the underlying sender-first architecture.

---

## 2. Core Principle

> One sender at a time. One clear decision. Immediate progression.

Instead of reviewing large tables or lists, the user:
1. sees one sender
2. makes one decision
3. immediately moves to the next sender

This continues until the entire Cleanup Group is processed.

---

## 3. Entry Point

User flow:

1. User selects a **Cleanup Group**
2. System shows:
   - high-level group summary
   - sender breakdown
3. User clicks:
   **"Start Reviewing Senders"**

This triggers **Sender Decision Mode**.

---

## 4. Sender Card Structure

Each sender is presented as a **single full-focus card**.

### 4.1 Visual Layout

Each card contains:

1. **Sender Identity**
   - sender name
   - email/domain
   - optional avatar/logo (Gmail profile or derived icon)

2. **Quick Classification Signals**
   - machine vs human likelihood
   - message frequency
   - importance indicators

3. **Summary Description**
   - short explanation of who the sender is
   - example: "E-commerce promotions", "Account alerts", "Personal contact"

4. **Email Type Breakdown**
   - categories such as:
     - promotions
     - updates
     - alerts
     - newsletters
   - each category shows:
     - count
     - relative share

5. **Expandable Evidence Section**
   - sample emails per category
   - subject lines
   - preview snippets

---

## 5. Primary Decision Actions

The user has exactly **four actions** per sender:

1. **Keep All**
2. **Keep Some**
3. **Archive All**
4. **Review Later**

### 5.1 Behavior Mapping

| User Action      | System Outcome                          |
|-----------------|----------------------------------------|
| Keep All        | Sender routed to **Keep**              |
| Keep Some       | Sender routed to **Custom Rule** flow  |
| Archive All     | Sender routed to **Archive**           |
| Review Later    | Sender routed to **Quarantine**        |

---

## 6. Interaction Flow

### 6.1 Primary Loop

For each sender:

1. Card is displayed
2. User selects one of the four actions
3. Decision is stored
4. Next sender appears immediately

No confirmation step in this mode.

### 6.2 Progress Feedback

Display:
- total senders in group
- current position
- completion percentage

---

## 7. Mixed Decision Path ("Keep Some")

When a user selects **Keep Some**:

The sender is deferred to a **second-pass decision flow**.

### 7.1 Second-Pass Mode

This mode also uses a **single-sender focus**, but now decisions happen at the **category level**.

For each sender:

User sees categories such as:
- promotions
- updates
- alerts

For each category:
- user selects:
  - keep
  - archive

### 7.2 Outcome

The system generates a **custom rule** for that sender:
- keep selected categories
- archive others

---

## 8. Destination Mapping (Management Integration)

After Sender Decision Mode completes:

### 8.1 Buckets

Senders are routed into:

- **Keep** (no action needed)
- **Custom Rules** (requires category-level confirmation)
- **Archive** (ready to apply)
- **Quarantine** (deferred decisions)

### 8.2 Management Behavior

- Keep: remains in inbox
- Archive: can be pushed to Gmail
- Custom Rules: requires final review, then pushed
- Quarantine: optional later review

---

## 9. Apply / Push to Gmail

Only these require Gmail actions:

- Archive
- Custom Rules

### 9.1 Controls

User can:
- "Apply to Gmail"
- see status: applied / not applied
- undo applied actions

---

## 10. Completion State

When all senders in a Cleanup Group are processed:

System shows:
- completion summary
- counts per bucket
- next recommended action (e.g., review custom rules)

---

## 11. Maintenance Mode

After initial cleanup:

The system transitions into **maintenance mode**.

### 11.1 Behavior

- new senders are detected
- user is prompted:
  - "New senders to review"

### 11.2 Flow

User re-enters Sender Decision Mode for only new senders.

---

## 12. Design Principles

This mode must:

- prioritize speed over completeness
- minimize decision friction
- avoid overwhelming the user
- separate quick decisions from complex decisions
- maintain forward momentum at all times

---

## 13. Non-Goals (This Pass)

This mode does NOT:

- redesign underlying data models
- change Gmail query scope
- replace Management workflows
- alter Pressure Trend or Intelligence logic

It is purely an **interaction layer improvement** on top of existing architecture.

---

## 14. Relationship to Existing System

This mode plugs into the existing flow:

Mailbox Intelligence → Cleanup Groups → **Sender Decision Mode** → Management → Ongoing Maintenance

It does not replace any stage — it **optimizes the decision stage**.

# GMAIL WORKSPACE — SENDER DECISION MODE (MERGED SPEC)

## 1. Purpose

This document defines the **Sender Decision Mode UI + Interaction System**.

This is the core interaction layer of the Gmail Workspace.

Goals:
- Maximize speed of decision-making
- Minimize cognitive load
- Create momentum through rapid decisions
- Provide a clear, structured path into Management execution
- Deliver a **Tinder-style decision flow** for senders

---

## 2. Core Principle

> One sender at a time. One clear decision. Immediate progression.

The system:
1. Shows one sender
2. Captures one decision
3. Moves instantly to the next

No lists. No tables. No clutter.

---

## 3. Entry Flow

1. User selects a **Cleanup Group**
2. Lands on **Sender Overview Dashboard** (IMPORTANT — DO NOT REMOVE)
3. Sees:
   - Total senders
   - Email volume
   - Category distribution
   - Machine vs Human signals
4. User clicks:

👉 **"Start Reviewing Senders"**

System enters **Decision Mode**

---

## 4. Modes

### 4.1 Overview Mode (Default)
- Data-rich dashboard
- Charts + analytics
- Bird’s-eye understanding of the group
- No decisions made here

---

### 4.2 Decision Mode (Primary Experience)
- Full-screen focus mode
- Background dimmed
- One sender at a time
- No distractions

---

## 5. Layout: Decision Mode

```
--------------------------------------------------
| Sender Card (Centered)                         |
|                                                |
|  [Hero Image / Logo]                           |
|  Sender Name                                   |
|  Short Description                             |
|                                                |
|  Signals + Stats                               |
|                                                |
|  Expandable Email Categories                   |
|                                                |
|  Action Buttons                                |
--------------------------------------------------
```

---

## 6. Sender Card Components

### 6.1 Hero Section
- Sender logo / avatar
- Fallback: generated initials icon

---

### 6.2 Identity Block
- Sender name (bold)
- Email domain
- AI-generated description
  - Example: "Weekly marketing emails from Nike"

---

### 6.3 Signal Indicators (Badges)
- Machine Likely (%)
- Human Likely (%)
- Promotions / Updates / Alerts tags

---

### 6.4 Stats Row
- Total emails
- Frequency (daily / weekly / occasional)
- Last seen timestamp

---

### 6.5 Category Breakdown (Expandable)

Each sender grouped into categories:
- Promotions
- Updates
- Transactions
- Alerts

Each category shows:
- Count
- Relative share

Expanded view:
- 3–5 sample emails
- Subject lines
- Snippets

---

## 7. Core Decision Actions

User selects ONE action:

1. ✅ **Keep All**
2. ⚖️ **Keep Some**
3. 📦 **Archive All**
4. ❓ **Not Sure**

---

## 8. Decision Mapping

| Action        | Outcome                |
|--------------|------------------------|
| Keep All     | Keep bucket            |
| Keep Some    | Custom Rules bucket    |
| Archive All  | Archive bucket         |
| Not Sure     | Quarantine bucket      |

---

## 9. Interaction Flow

### Primary Loop

For each sender:
1. Show card
2. User clicks decision
3. Save decision instantly
4. Load next sender immediately

NO:
- confirmation screens
- modals
- delays

---

## 10. Progress System

### Top Progress Bar
- "23 / 120 senders reviewed"
- % completion

Optional:
- Estimated time remaining

---

## 11. Completion State

When finished:

Show:
- "You're done 🎉"
- Summary:
  - X kept
  - X archived
  - X custom rules
  - X deferred

CTA:
👉 "Go to Management"

---

## 12. Secondary Flow: Custom Rules (Keep Some)

When user enters Management → Custom Rules:

### Same Tinder-style flow, but at category level

User sees:
- Categories inside sender

Actions:
- 👍 Keep
- 👎 Archive

Outcome:
- System builds rule per sender

---

## 13. Apply to Gmail

Only required for:
- Archive
- Custom Rules

User controls:
- Apply to Gmail
- Undo
- Status indicator (Applied / Not Applied)

---

## 14. Maintenance Mode

After cleanup:

System behavior:
- Detect new senders
- Prompt:
  - "New senders to review"

User re-enters Decision Mode for only new senders

---

## 15. Performance Requirements

- Transitions < 100ms
- Preload next sender
- No visible loading

---

## 16. Design Principles

- One decision at a time
- No clutter
- No tables
- No inbox-style UI
- Momentum-first experience

---

## 17. Key Product Insight

This system converts:

👉 Inbox chaos

into

👉 Fast binary decisions

This is the core engine of the product.