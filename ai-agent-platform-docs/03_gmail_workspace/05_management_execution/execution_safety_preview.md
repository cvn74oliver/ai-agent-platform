# Execution Safety & Preview Spec

## Overview
This system ensures that **no action is blindly executed on a user’s inbox**.  
Before any archive, rule creation, or automation is applied, the user is shown a **clear, human-readable preview of impact**.

This layer builds **trust, control, and confidence**, which is critical for a system that modifies a user’s email environment.

---

## Core Principles

### 1. No Blind Execution
- Every bulk action must be previewed before execution
- Users must always understand:
  - What will happen
  - How many emails are affected
  - Which senders are affected

---

### 2. Human-Readable Impact
System outputs must translate technical changes into plain language:

Examples:
- “Archive 3,241 emails from 12 senders”
- “Create rule to keep receipts from Amazon in inbox”
- “Silence notifications from 8 low-priority senders”

---

### 3. Reversible by Design
- Every executed action must support:
  - Undo
  - Rollback
- No irreversible operations without explicit user confirmation

---

## Execution Flow

### Step 1: Decision Completed
User completes:
- Sender decisions
- Category-level decisions
- Management bucket review

---

### Step 2: Preview Mode Triggered

User clicks:
- “Apply Changes”
- or “Push to Gmail”

System enters **Preview Mode**

---

### Step 3: Impact Summary (Primary Screen)

Display:

#### Summary Block
- Total emails affected
- Total senders affected
- Breakdown by action:
  - Archive
  - Keep
  - Custom rules
  - Quarantine

#### Example:
```
You are about to:

• Archive 3,241 emails (12 senders)
• Keep all emails from 18 senders
• Create 6 custom filtering rules
• Leave 9 senders in quarantine

Total impact: 3,241 emails across 45 senders
```

---

### Step 4: Expandable Details

Each action category is expandable:

#### Archive
- List of senders
- Email volume per sender
- Sample emails

#### Custom Rules
- Rule logic preview:
  - “Keep invoices, archive promotions”
- Example emails for each rule

#### Keep
- Senders explicitly preserved

#### Quarantine
- Deferred decisions

---

### Step 5: Confidence Signals

Display reassurance elements:
- “No emails will be deleted”
- “All actions are reversible”
- “You can undo this anytime”

---

### Step 6: User Decision

Primary CTA:
- “Confirm & Apply”

Secondary CTA:
- “Go Back & Adjust”

Optional:
- “Download Summary” (future)

---

## Dry Run Mode (Internal + Optional User Toggle)

### Purpose
Simulate execution without applying changes.

### Behavior
- Runs full execution logic
- Returns:
  - Expected changes
  - Errors
  - Rule conflicts

### Use Cases
- Debugging
- Power users
- Future “Test Mode”

---

## Execution Safety Rules

### 1. Hard Safeguards
- Never execute if:
  - Gmail connection is invalid
  - API scope is insufficient
  - User session is expired

---

### 2. Soft Safeguards
- Warn if:
  - High volume (>10k emails affected)
  - New rules overlap existing ones
  - Multiple large senders affected

---

### 3. Rate-Limited Execution
- Apply actions in batches
- Track progress
- Prevent Gmail API abuse

---

## Undo / Rollback System

### Immediate Undo
After execution:
- Show:
  - “Undo last action”
- Available for short window (e.g., 5–10 minutes)

---

### Persistent Undo (Advanced)
- Maintain execution log
- Allow:
  - Reversal of rules
  - Reversal of archive operations

---

## Execution Status Tracking

### States
- Pending
- Running
- Completed
- Failed
- Partially Completed

---

### User Feedback
Display:
- Progress bar
- “Processing 2,134 of 3,241 emails”
- Real-time status updates

---

## Error Handling

### Types
- Gmail API failure
- Network interruption
- Rule conflict
- Permission issues

---

### Behavior
- Stop safely
- Preserve partial progress
- Show clear error message:
  - “We paused your changes due to a connection issue”
- Offer:
  - Retry
  - Resume

---

## UI Requirements

### Preview Modal / Screen
- Clean, focused layout
- No distractions
- Strong hierarchy:
  - Summary → Details → Confirmation

---

### Visual Signals
- Green = Safe / Confirmed
- Yellow = Warning
- Red = Critical issue

---

## Future Enhancements

### 1. AI Explanation Layer
- “Why we recommend this action”

---

### 2. Risk Scoring
- Low / Medium / High impact classification

---

### 3. Smart Defaults
- Auto-suggest safe execution batches

---

## Success Criteria

This system is successful when:

- Users feel **safe executing large changes**
- Users understand **exactly what will happen**
- Users trust the system enough to:
  - Click “Apply Changes” without hesitation
- Support requests related to “unexpected changes” drop significantly

---

## Final Note

This layer is not optional.

This is the **trust engine of the product**.

Without this, users hesitate.  
With this, users move fast.
