

# Gmail Workspace — Execution Queue Spec

## Summary
The Execution Queue is the **safety and reliability engine** that applies user decisions to Gmail.

It ensures:
- Actions are executed **safely**
- Gmail API limits are respected
- No duplicate or conflicting operations occur
- Every action is **traceable, reversible, and reliable**

This system turns user intent into **real Gmail changes** without breaking trust.

---

## Core Purpose

The Execution Queue exists to:
- Convert decisions → actions
- Execute actions in a controlled, reliable way
- Protect against API failures, rate limits, and mistakes
- Provide full visibility into what happened

---

## Key Principles

### 1. Safety First
No destructive action should happen without:
- Being explicitly queued
- Being tracked
- Being reversible (when possible)

---

### 2. Deterministic Execution
Each action:
- Runs exactly once
- Produces a known result
- Cannot be duplicated accidentally

---

### 3. Idempotency
Running the same action twice should:
- Not create duplicate effects
- Not break Gmail state

---

### 4. Observability
Every action must be:
- Logged
- Trackable
- Debuggable

---

### 5. Separation of Decision vs Execution
- Decision Engine → decides what should happen
- Execution Queue → actually does it

This prevents:
- UI bugs from causing destructive actions
- Duplicate execution
- Race conditions

---

## Queue Architecture

### Queue Types

#### 1. Archive Queue
- Removes emails from inbox
- Applies `ARCHIVE` behavior
- Usually bulk operations

#### 2. Keep Queue
- Ensures emails remain in inbox
- May remove labels that trigger filtering

#### 3. Custom Rule Queue
- Applies:
  - Labels
  - Filters
  - Category-specific actions

#### 4. Quarantine Queue
- Moves emails to safe holding area
- Does NOT immediately delete or archive permanently

---

## Execution Flow

### Step 1: User Decision
User selects:
- Like all
- Like some
- Like none
- Not sure

↓

### Step 2: Decision Routing
System maps decision to:
- Queue type
- Action set

↓

### Step 3: Queue Insertion
Create queue items:
- Sender ID
- Action type
- Target labels/actions
- Timestamp
- Status: `pending`

↓

### Step 4: Execution Worker
Background worker:
- Pulls queue items
- Processes in batches
- Applies Gmail API actions

↓

### Step 5: Result Handling
Each job updates:
- `success`
- `failed`
- `retrying`

↓

### Step 6: UI Feedback
User sees:
- “Pushed to Gmail”
- “Processing…”
- “Failed — retry”

---

## Data Model (Conceptual)

### Queue Item

- id
- tenant_id
- sender_id
- action_type
- payload
- status
- retry_count
- created_at
- updated_at

---

### Action Types

- ARCHIVE_SENDER
- KEEP_SENDER
- APPLY_RULE
- REMOVE_LABEL
- ADD_LABEL
- QUARANTINE_SENDER

---

## Batching Strategy

### Why batching matters
- Gmail API has strict limits
- Bulk operations are faster
- Reduces API calls

---

### Batch Rules

- Max batch size: 50–100 messages
- Group by:
  - sender
  - label
  - action type

---

## Rate Limiting & Backoff

### Rules

- Respect Gmail quotas
- Detect:
  - rateLimitExceeded
  - userRateLimitExceeded

---

### Backoff Strategy

- exponential backoff:
  - 1s → 2s → 4s → 8s
- retry up to 5 times
- escalate failure after limit

---

## Retry Logic

### Retryable Errors
- Network issues
- Rate limits
- Temporary Gmail failures

### Non-Retryable Errors
- Invalid permissions
- Invalid message ID
- Deleted messages

---

## Idempotency Strategy

Each queue item must:
- Include a unique operation key

Before execution:
- Check if action already applied

Prevents:
- Duplicate archives
- Double labeling
- Conflicting actions

---

## Failure Handling

### Failure Types

#### 1. Soft Failures
- Temporary issues
- Automatically retried

#### 2. Hard Failures
- Permanent errors
- Require user or system intervention

---

### Failure States

- pending
- processing
- retrying
- failed
- completed

---

## Undo / Reversal System

### Required Capability

User must be able to:
- Undo archive actions
- Undo label changes
- Reverse bulk actions

---

### Implementation Concept

- Store:
  - original labels
  - original inbox state

Undo action:
- reapply original state

---

## Execution Visibility (UI)

User should see:

- “Processing changes…”
- “23 actions applied”
- “3 failed — retry”

---

### Status Indicators

- Pending → gray
- Processing → blue
- Completed → green
- Failed → red

---

## Performance Expectations

- Actions feel near-instant
- Bulk actions processed in background
- UI never blocked

---

## Smart Sync Integration

Execution Queue is triggered by:
- Manual user actions
- Smart Sync
- Backfill completion

---

### Smart Sync Behavior

- Detect new messages
- Apply existing rules automatically
- Push into execution queue silently

---

## Future Enhancements

### 1. Priority Queueing
- High-value senders first

### 2. AI-Assisted Execution
- Predict actions without user input

### 3. Adaptive Batching
- Increase batch size when safe

### 4. Parallel Workers
- Multiple execution threads

---

## Final System Role

Execution Queue is the **last mile** of the product.

It ensures:
- Decisions actually happen
- Gmail reflects user intent
- The system is trustworthy

Without it:
- The app is just a dashboard

With it:
- The app becomes an **automation engine**