

# GMAIL WORKSPACE — MANAGEMENT FLOW SPEC

## 1. Purpose

The Management layer is the **execution and control center** of the Gmail Workspace.

It is NOT a decision-making interface.

All decisions are made upstream (Sender Decision Flow).  
Management is where users:

- Review outcomes
- Refine rules (only when needed)
- Execute actions to Gmail
- Monitor system state

---

## 2. Core Philosophy

- Decisions should already be made before arriving here
- Management should feel **organized, calm, and controlled**
- No cognitive overload
- No bulk confusion
- Everything is grouped, predictable, and reversible

---

## 3. Buckets (System State)

After Sender Decisions, all senders are routed into exactly one of these buckets:

### 3.1 Keep (Implicit)
- User selected: “I like all emails”
- No action required
- Emails remain in inbox

👉 Not shown as an active work area

---

### 3.2 Custom Rules (Mixed)
- User selected: “I like some emails”

Purpose:
- Define which email types to keep vs remove

State:
- Requires user refinement before execution

---

### 3.3 Archive
- User selected: “I like none”

Purpose:
- Remove all emails from these senders

State:
- Ready for execution immediately

---

### 3.4 Quarantine
- User selected: “I’m not sure”

Purpose:
- Defer decision
- No urgency

State:
- Optional review later

---

## 4. Page Structure

### 4.1 Top Summary

Display:

- Inbox health status (e.g., “Healthy / Needs attention”)
- Pending actions:
  - X senders in Custom Rules
  - X senders ready to Archive
- Execution status:
  - “X actions pushed to Gmail”
  - “Y pending”

---

### 4.2 Bucket Sections

Each bucket is its own section:

- Custom Rules
- Archive
- Quarantine

Each section includes:
- Count of senders
- Status (pending / executed)
- Action button (if applicable)

---

## 5. Custom Rules Flow (Mixed Senders)

### 5.1 Entry

User clicks:
👉 “Review Custom Rules”

---

### 5.2 Interaction Model (Swipe Continuation)

Reuse the **same Tinder-style interface**:

For each sender:
- Show profile again
- Show categories (Promotions, Updates, etc.)

User actions per category:
- 👍 Keep
- 👎 Archive

---

### 5.3 Completion

After finishing a sender:
- Move to next sender
- Continue until all complete

---

### 5.4 Result

Creates a **rule set per sender**:
- Keep X categories
- Archive Y categories

---

## 6. Archive Execution Flow

### 6.1 State

All Archive senders are:

- Already decided
- Ready to execute

---

### 6.2 UI

Show:

- Sender list (collapsed by default)
- Count of emails affected

Primary action:
👉 “Push Archive to Gmail”

---

### 6.3 Execution Behavior

On click:

- Apply archive rules via Gmail API
- Move messages out of inbox

---

### 6.4 Status

After execution:

- Mark as:
  - ✅ “Pushed to Gmail”

- Show:
  - Undo button

---

## 7. Custom Rule Execution

### 7.1 State

After user defines rules:
- Bucket becomes executable

---

### 7.2 Action

👉 “Apply Custom Rules”

---

### 7.3 Behavior

For each sender:
- Archive unwanted categories
- Keep desired ones in inbox

---

### 7.4 Status

- Show:
  - ✅ “Rules applied”

- Allow:
  - Undo

---

## 8. Quarantine Flow

### 8.1 Purpose

Low-priority decision backlog

---

### 8.2 Behavior

- No automatic action
- No required review

User options:
- Re-open in Sender Decision Flow
- Leave indefinitely

---

## 9. Undo System

All executed actions must support undo.

### 9.1 Scope

Undo applies to:
- Archive actions
- Custom rule applications

---

### 9.2 Behavior

Undo reverses:
- Gmail archive actions
- Rule effects

---

## 10. Execution Model

### 10.1 Manual Trigger

User must explicitly push:

- Archive
- Custom Rules

---

### 10.2 Feedback

After execution:

- Immediate visual confirmation
- No silent background actions

---

## 11. Post-Cleanup State

When all buckets are resolved:

System enters **Maintenance Mode**

### 11.1 Dashboard Behavior

- Show:
  - “Your inbox is clean”
  - “New senders detected: X”

---

### 11.2 New Workflow

Only new senders trigger:
- Sender Decision Flow

---

## 12. System Loop

1. New sender appears
2. User classifies sender
3. Sender enters bucket
4. User optionally refines rules
5. User executes actions
6. Inbox remains clean

---

## 13. Non-Goals (Important)

This page must NOT:

- Show raw email lists
- Require scanning through emails manually
- Combine decision + execution in one step
- Overwhelm user with options

---

## 14. Key Design Principles

- One job per screen
- Decisions are fast
- Execution is clear
- State is visible
- Actions are reversible

---

## 15. Future Enhancements (Not in Scope Now)

- Auto-execution after user confidence threshold
- Scheduled sync + execution
- AI-assisted rule suggestions
- Batch undo history

---

## FINAL SUMMARY

Management is where:

- Decisions become actions
- Actions become system state
- System state becomes a clean inbox

It is NOT where thinking happens.

Thinking happens before.