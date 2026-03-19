# Management Execution Spec (Full System)

## 1. Purpose
The Management layer is where user decisions are executed against Gmail.

It transforms:
- Sender-level intent
into:
- Concrete Gmail actions (archive, label, filter, etc.)

This layer must be:
- Safe (undoable)
- Transparent (status visible)
- Deterministic (no surprises)

---

## 2. Core Responsibilities

The Management system is responsible for:

1. Converting decisions into actions
2. Grouping actions into execution batches
3. Executing changes in Gmail
4. Tracking execution status
5. Providing undo capability

---

## 3. Decision → Action Mapping

### 3.1 Sender Decisions → Buckets

| Decision | Destination | Action Type |
|----------|------------|------------|
| Like All | Keep | No action |
| Like Some | Custom Rules | Mixed rules |
| Like None | Archive | Archive all |
| Not Sure | Quarantine | Hold |

---

### 3.2 Execution Types

#### Archive
- Remove from inbox
- Keep in Gmail archive

#### Keep
- No action

#### Custom Rules
- Apply label rules
- Conditional archive/keep

#### Quarantine
- Move to review state
- No Gmail action yet

---

## 4. Execution Model

### 4.1 Batch Execution

Actions are executed in batches:

- Grouped by sender
- Grouped by action type

Example:

```
Batch 1:
- Sender A → Archive
- Sender B → Archive

Batch 2:
- Sender C → Custom rules
```

---

### 4.2 Execution Flow

1. User clicks “Push to Gmail”
2. System prepares batch
3. System executes API calls
4. System updates status

---

## 5. Gmail API Actions

### 5.1 Archive Action

Operation:
- Remove `INBOX` label

### 5.2 Labeling

Operation:
- Add label
- Remove label

### 5.3 Filtering (future)

- Gmail filter creation
- Auto-routing

---

## 6. Status System

Each batch must track:

- Pending
- In Progress
- Completed
- Failed

UI should show:

- % complete
- Items processed
- Errors

---

## 7. Undo System

### 7.1 Undo Window

- 5–30 seconds after execution

### 7.2 Undo Behavior

Reverts:
- Archive → restore INBOX
- Labels → remove applied labels

---

## 8. Safety Rules

- Never execute without user intent
- Never auto-archive without confirmation
- Always allow undo for destructive actions

---

## 9. Performance Requirements

- Batch size: optimized for Gmail API limits
- Retry on failure
- Rate-limit aware

---

## 10. Future Enhancements

- Auto execution (scheduled)
- AI-recommended execution
- Confidence-based automation

---

## 11. UX Requirements

- Clear action summary before execution
- Visible progress
- Immediate feedback
- Undo visibility

---

## 12. Integration Points

This system integrates with:

- Sender Decision Engine
- Gmail Sync Engine
- Smart Sync

---

## 13. Key Principle

The Management layer is where decisions become real.

It must be:
- Reliable
- Reversible
- Understandable

# Management Execution Spec (Full System) — V2

## 1. Purpose
The Management layer is the **decision → execution engine** of the system.

It transforms:
- Sender-level decisions
into:
- Safe, observable, reversible Gmail actions

This layer is not just execution — it is:
- A **trust system**
- A **state machine**
- A **controlled pipeline**

---

## 2. Core Principles

The Management system must be:

### 2.1 Deterministic
Same inputs → same outputs  
No hidden behavior

### 2.2 Reversible
Every destructive action must be undoable

### 2.3 Observable
User always knows:
- What will happen
- What is happening
- What already happened

### 2.4 Batch-Controlled
Nothing executes “live” per click — everything flows through controlled batches

---

## 3. System Architecture

### 3.1 High-Level Flow

```
Sender Decision
    ↓
Decision Buckets
    ↓
Execution Queue
    ↓
Batch Processor
    ↓
Gmail API
    ↓
Execution State + Feedback
```

---

## 4. Decision → Execution Mapping

| Decision | Bucket | Execution Behavior |
|----------|--------|------------------|
| Like All | Keep | No Gmail action |
| Like Some | Custom Rules | Rule-based execution |
| Like None | Archive | Archive all messages |
| Not Sure | Quarantine | No action (deferred) |

---

## 5. Execution Queue System (NEW)

### 5.1 Queue Purpose
All actions must go through a queue to ensure:
- Order
- Retry safety
- Observability
- Undo tracking

### 5.2 Queue Structure

Each job includes:

- `job_id`
- `sender_id`
- `action_type`
- `message_ids`
- `status`
- `created_at`
- `executed_at`

### 5.3 Job Status States

- Pending
- Queued
- In Progress
- Completed
- Failed
- Rolled Back

---

## 6. Per-Sender Execution State (NEW)

Each sender must track:

- decision_type
- execution_status
- pushed_to_gmail (true/false)
- undo_available (true/false)
- last_executed_at

---

## 7. Batch Execution Model

### 7.1 Batch Rules

- Group by action type
- Group by sender when possible
- Respect Gmail API limits

### 7.2 Example

```
Batch:
- 500 messages → Archive
- 300 messages → Label
```

---

## 8. Push to Gmail System (CRITICAL)

### 8.1 Explicit Push Model

Nothing executes automatically.

User must explicitly:
👉 “Push to Gmail”

### 8.2 Pre-Execution Summary (Trust Layer)

Before execution, show:

- Total emails affected
- Action breakdown
- Senders affected

Example:

“You are about to archive 18,240 emails from 37 senders.”

---

## 9. Gmail Execution Layer

### 9.1 Archive
- Remove `INBOX` label

### 9.2 Label Application
- Add/remove labels

### 9.3 Custom Rule Execution
- Apply per-category rules

---

## 10. Undo System (Expanded)

### 10.1 Undo Window
- Immediate undo (5–30 seconds)
- Extended undo (via history panel)

### 10.2 Undo Scope

Undo operates at:
- Batch level
- Sender level

### 10.3 Undo Behavior

| Action | Undo |
|--------|------|
| Archive | Re-add INBOX |
| Label | Remove label |
| Rule | Revert rule actions |

---

## 11. Execution Feedback System (NEW)

After execution, show:

- Emails processed
- Time saved estimate
- Inbox noise reduced
- % improvement

Example:

“You removed 18,240 emails — your inbox is now 82% cleaner.”

---

## 12. Reward System (NEW)

Introduce subtle gamification:

- “You're on a roll”
- “Inbox health improving”
- Progress bars
- Completion milestones

---

## 13. Error Handling

### 13.1 Retry Logic
- Automatic retry on transient failures
- Exponential backoff

### 13.2 Failure Visibility
User must see:
- What failed
- Why it failed
- What can be retried

---

## 14. Performance Requirements

- Batch size optimized for Gmail API
- Parallel execution where safe
- Rate-limit aware
- No duplicate execution (idempotent)

---

## 15. Integration Points

- Sender Decision Engine
- Smart Sync
- Gmail Sync Engine
- Decision Storage

---

## 16. Future Enhancements

- Scheduled auto-execution
- AI-recommended execution
- Confidence-based auto-actions
- Continuous inbox maintenance mode

---

## 17. Key Principle

The Management layer is the moment of truth.

This is where:
- Decisions become real
- Trust is earned or lost

If this layer is weak, the entire product fails.

If this layer is strong, the product becomes addictive.