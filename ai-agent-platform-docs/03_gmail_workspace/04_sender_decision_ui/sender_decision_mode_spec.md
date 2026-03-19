


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
