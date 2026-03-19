# Management Execution Engine (Unified Spec)

## Purpose
The Management Execution Engine transforms user decisions into safe, observable, and reversible Gmail actions.

This layer sits AFTER:
- Sender Decision Engine
- Decision UI Flow

This is NOT a thinking system.
This is an EXECUTION + TRUST system.

---

## Core Principles

The system must be:

### Deterministic
Same inputs → same outputs  
No hidden behavior

### Reversible
Every destructive action must be undoable

### Observable
User always knows:
- What will happen
- What is happening
- What already happened

### Controlled
Nothing executes instantly — everything flows through a controlled pipeline

---

## Core Responsibilities

The engine must:

1. Translate decisions into Gmail actions
2. Queue and batch operations
3. Execute safely via Gmail API
4. Track execution state
5. Allow undo
6. Prevent destructive mistakes
7. Provide clear feedback

---

## Decision → Action Mapping

| Decision | Bucket | Action |
|----------|--------|--------|
| Like All | Keep | No action |
| Like Some | Custom Rules | Conditional execution |
| Like None | Archive | Remove from inbox |
| Not Sure | Quarantine | No action |

---

## Execution Buckets

### 1. Archive Queue
- All senders marked “Like None”

### 2. Custom Rules Queue
- Senders with mixed decisions

### 3. Quarantine Queue
- Deferred decisions
- No execution

---

## Execution Architecture

### Flow

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

## Execution Queue System

### Queue Purpose
Ensures:
- Order
- Retry safety
- Observability
- Undo tracking

### Job Structure

Each job includes:

- job_id
- sender_id
- action_type
- message_ids
- status
- created_at
- executed_at

### Job States

- Pending
- Queued
- In Progress
- Completed
- Failed
- Rolled Back

---

## Batch Processing Rules

- Max 500 messages per batch
- Group by action type
- Retry failed batches (max 3 times)
- Exponential backoff for rate limits
- Idempotent execution (no duplicates)

---

## Gmail Execution Layer

### Archive
- Remove `INBOX` label

### Labeling
- Add/remove labels

### Custom Rules
- Apply category-based logic
- Future: Gmail filter creation

### Quarantine
- No Gmail action

---

## Push-to-Gmail System (CRITICAL)

### Explicit Execution

Nothing runs automatically.

User must click:
👉 **"Push to Gmail"**

---

### Pre-Execution Summary (Trust Layer)

Show before execution:

- Total emails affected
- Sender count
- Action breakdown

Example:
"You are about to archive 18,240 emails from 37 senders."

---

## Per-Sender Execution State

Each sender tracks:

- decision_type
- execution_status
- pushed_to_gmail (true/false)
- undo_available (true/false)
- last_executed_at

---

## Execution Status Model

Each batch tracks:

- status: pending | processing | completed | failed
- total_messages
- processed_messages
- failed_messages

---

## Undo System

### Undo Behavior

| Action | Undo |
|--------|------|
| Archive | Re-add INBOX |
| Label | Remove label |
| Rule | Revert rule actions |

### Undo Constraints

- Time window (default 24h)
- Must store:
  - message IDs
  - previous label state

### Undo Levels

- Batch-level undo
- Sender-level undo

---

## Feedback System

After execution, show:

- "Archived 320 emails"
- "Rules applied to 12 senders"

### Enhanced Feedback (NEW)

- Emails processed
- Time saved estimate
- Inbox improvement %

Example:
"You removed 18,240 emails — your inbox is now 82% cleaner."

---

## Gamification Layer (NEW)

- "You're on a roll"
- Progress indicators
- Completion milestones
- Momentum feedback

---

## Safety Constraints

- Never delete emails
- Never modify message content
- Only modify labels
- Require explicit user action
- Always allow undo

---

## Failure Handling

If execution fails:

- Mark batch as `failed`
- Show retry option
- Preserve all state

### Retry Logic

- Exponential backoff
- Retry up to 3 times
- Surface failures clearly

---

## Logging

Per execution:

- run_id
- user_id
- action_type
- message_count
- success_count
- failure_count

---

## Performance Requirements

- Rate-limit aware
- Parallel where safe
- Efficient batching
- No duplicate execution

---

## Integration Points

- Sender Decision Engine
- Smart Sync
- Gmail Sync Engine
- Decision Storage

---

## Future Enhancements

- Scheduled execution
- AI-recommended execution
- Confidence-based automation
- Continuous maintenance mode
- Gmail filter creation

---

## Key Principle

This layer must feel like:

> "I click one button, and everything is handled safely."

No friction.  
No confusion.  
No risk.  
High trust.