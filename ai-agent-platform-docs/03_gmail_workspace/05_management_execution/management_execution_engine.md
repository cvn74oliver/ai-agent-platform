

# Management Execution Engine Spec

## Purpose
The Management Execution Engine is responsible for turning user decisions into real, safe, and reversible actions inside Gmail.

This layer sits AFTER:
- Sender Decision Engine
- Decision UI Flow

It must be:
- Safe
- Reversible
- Transparent
- Fast

This is NOT a thinking system.
This is an EXECUTION system.

---

## Core Responsibilities

The engine must:

1. Translate decisions into Gmail actions
2. Batch operations efficiently
3. Track execution state
4. Allow undo
5. Prevent destructive mistakes
6. Provide clear feedback

---

## Decision → Action Mapping

### 1. Keep All
- No Gmail action required
- System records decision only

### 2. Archive ("Like None")
- Action: Remove INBOX label
- Optional: Add internal tag (for tracking only)

### 3. Custom Rules ("Like Some")
- Action:
  - Apply Gmail filter logic (future phase)
  - OR batch archive based on selected categories

### 4. Quarantine ("Not Sure")
- Action: None
- Stored for later review

---

## Execution Buckets

The system maintains 3 execution queues:

### 1. Archive Queue
- All senders marked “Like None”

### 2. Custom Rules Queue
- Senders with mixed decisions

### 3. Quarantine Queue
- No execution

---

## Execution Flow

### Step 1: User Enters Management
- System shows bucket summaries

### Step 2: User Clicks Execute (Archive or Rules)
- System prepares batch

### Step 3: Execution Engine Runs
- Sends batched Gmail API calls

### Step 4: Status Updates
- Updates UI with:
  - Pending
  - Processing
  - Completed

### Step 5: Completion State
- Marks bucket as "Applied"

---

## Batch Processing Rules

- Max 500 messages per batch
- Retry failed batches (max 3 times)
- Exponential backoff on rate limits
- Log failures with message IDs

---

## Undo System

Every execution MUST be reversible.

### Undo Behavior

- Archive Undo:
  - Re-add INBOX label

- Custom Rules Undo:
  - Remove applied actions

### Undo Constraints

- Time window: configurable (default 24 hours)
- Must store:
  - message IDs
  - previous label state

---

## Execution Status Model

Each bucket has:

- status: `pending | processing | completed | failed`
- total_messages
- processed_messages
- failed_messages

---

## Feedback System

Show lightweight confirmations:

- "Archived 320 emails"
- "Rules applied to 12 senders"

No modal interruptions.
No confirmations mid-flow.

---

## Safety Constraints

- Never delete emails
- Never modify message content
- Only modify labels
- Require explicit user action to execute

---

## Failure Handling

If execution fails:

- Mark bucket as `failed`
- Show retry option
- Preserve all state

---

## Logging

Log per execution:

- run_id
- user_id
- action_type
- message_count
- success_count
- failure_count

---

## Future Enhancements

- Real Gmail filter creation
- Scheduled execution
- Smart batching based on sender priority
- Multi-account support

---

## Key Principle

This system must feel:

> "I click one button, and everything is handled safely."

No friction.
No confusion.
No risk.