# Sender Decision Engine Specification

## Purpose
The Sender Decision Engine defines how users rapidly evaluate and classify senders using a high-speed, single-focus decision interface. This system is designed to maximize:
- speed
- clarity
- confidence
- completion rate

It transforms sender review from a complex task into a fast, momentum-driven experience.

---

## Core Philosophy

The engine follows a strict two-phase model:

1. **Orientation (Thinking)**
   - User reviews high-level analytics and sender group context.
   - No decisions are made yet.

2. **Execution (Acting)**
   - User enters a focused, distraction-free decision mode.
   - One sender at a time.
   - Immediate action → immediate next.

> The system must never mix analysis and decision-making in the same UI state.

---

## Entry Point

### Trigger
User clicks:

`Start Cleaning`  
or  
`Start Reviewing Senders`

### Pre-Entry Context (Required)
Before entering decision mode, show:

- Sender group summary
- Total senders in group
- Estimated impact:
  - total emails affected
  - % of inbox noise reduced

### Example
```
Reviewing this group could reduce:
• 18,200 emails
• 65% of your inbox noise
```

### State Transition Rule (Critical)

Entering Decision Mode must:
- lock the overview state
- visually transition the user into execution mode (fade/overlay)
- disable all non-decision navigation

Exiting Decision Mode must:
- return to overview OR
- route directly to Management if complete

There should never be ambiguity about whether the user is:
- reviewing data (overview)
- or making decisions (execution)

---

## Decision Mode (Core Engine)

### UI Rules
- One sender at a time
- Full-screen or dominant focus
- Background dimmed
- No tables
- No scrolling lists of senders
- No competing actions

### Mode Indicator

The UI must clearly indicate that the user is in Decision Mode:
- subtle label: “Decision Mode”
- progress indicator (e.g., “23 of 120 senders”)
- optional momentum indicator (e.g., “On a 5 decision streak”)

This reinforces context and progress.

---

## Sender Card Structure

Each decision card contains:

### 1. Identity Layer
- Sender name
- Sender email/domain
- Profile image (if available)

---

### 2. Summary Layer
- Short description of sender behavior
- Example:
  - “E-commerce brand sending promotions and shipping updates”
  - “Automated alerts and system notifications”

---

### 3. Signal Layer
- Machine vs Human likelihood
- Key tags:
  - Promotions
  - Updates
  - Alerts
  - Security
  - Personal
- Frequency indicator (high / medium / low)

---

### 4. Content Preview Layer
Expandable sections showing:

- Categories of emails (grouped)
  - Promotions
  - Updates
  - Alerts
- Each category:
  - sample subject lines
  - sample snippets

User can expand but is not required to.

---

### 5. Impact Layer (High Value)

Show estimated impact of decision:

- Total emails from this sender
- % of inbox contribution
- Example:
  - “This sender represents 8% of your inbox”
  - “1,240 emails over last 6 months”

Purpose:
- helps user make faster confident decisions
- increases perceived value of action

---

## Decision Actions

User must choose one:

### 1. Like All
- Keep all emails from sender
- No action required downstream

---

### 2. Like Some
- Mixed intent
- Routes sender to:
  → **Custom Rules Queue (Management)**

---

### 3. Like None
- User does not want emails
- Routes sender to:
  → **Archive Queue (Management)**

---

### 4. Not Sure
- Uncertain classification
- Routes sender to:
  → **Quarantine Queue (Management)**

---

### Decision Shortcut Support (Optional but Recommended)

- Keyboard support:
  - 1 → Like All
  - 2 → Like Some
  - 3 → Like None
  - 4 → Not Sure

Purpose:
- power users can move extremely fast
- increases completion speed significantly

---

## Interaction Model

### Behavior
- One click → immediate transition
- Next sender loads instantly
- No confirmation step
- No modal interruption

---

### Flow
```
Decision → Animate out → Next sender appears
```

---

### Animation (Guidelines)
- Fast (150–250ms)
- Directional (left/right fade or slide)
- Must reinforce momentum

---

### Undo Window (Soft Safety)

After each decision:
- allow a short undo window (e.g., 2–3 seconds)
- small unobtrusive “Undo” button appears

Important:
- do not interrupt flow
- do not require confirmation dialogs

Purpose:
- reduces anxiety
- increases willingness to act quickly

---

## Decision Confidence Feedback (Micro UX)

After each decision, show subtle feedback:

• "Archived 120 emails"
• "Moved to custom rules"
• "Kept in inbox"

Purpose:
- reinforces progress
- builds confidence
- keeps momentum high

Do NOT block flow or require acknowledgement.

## Performance Requirements

### Preloading
- Always preload:
  - next sender
  - next-next sender (optional buffer)

---

### Latency
- Transition must feel instant (<100ms perceived)

---

### Data Strategy
- Sender data batch loaded in advance
- No blocking API calls during decision click

---

## Decision State Handling

Each decision immediately writes to:

```
sender_decision_state
```

Fields:
- sender_id
- decision_type
- timestamp
- source_group

---

## Completion State

When all senders are processed:

### Show:
- Completion screen
- Summary:
  - X senders processed
  - emails impacted
  - breakdown by decision type

---

### Next Step CTA:
- “Review Your Changes”
- Routes to Management

---

### Completion Reward Layer

Show a positive reinforcement moment:

Examples:
- “Inbox clarity increased by 62%”
- “You cleaned 18,200 emails”
- “You’re done with this group 🎉”

Optional:
- subtle animation
- progress bar fill
- milestone badge

Purpose:
- create emotional reward
- reinforce completion behavior

---

## Management Integration

Decisions map to queues:

| Decision      | Destination            |
|--------------|----------------------|
| Like All     | No action            |
| Like Some    | Custom Rules         |
| Like None    | Archive              |
| Not Sure     | Quarantine           |

---

## Secondary Decision Mode (Custom Rules)

For "Like Some":

### New Flow
- Same card style
- But now per **email category**

User chooses:
- Like / Don’t Like per category

---

### Output
- Rule set created:
  - Keep X
  - Archive Y

---

## Push to Gmail

Only two queues require execution:

- Archive
- Custom Rules

### Behavior
- Manual trigger:
  - “Push to Gmail”
- Status states:
  - Not pushed
  - Pushed
  - Undo available

---

## Maintenance Mode (Post-Cleanup)

After full pass:

System shifts to:

### Continuous Maintenance
- New senders detected
- Small batches appear

User sees:
- “You have 3 new senders to review”

---

### Maintenance Experience Design

Maintenance must feel light and non-overwhelming:

- small batch size (1–5 senders)
- quick entry into decision mode
- no heavy analytics required

Goal:
- keep inbox clean with minimal effort
- reinforce habit formation

---

## Edge Cases

### Duplicate Senders
- Merge logic must prevent duplicate decision cards
- Multiple domains from same brand should be grouped when possible

### Low-Data Senders
- If limited data exists:
  - show minimal card
  - allow decision without expansion

### High-Volume Senders
- Emphasize impact layer strongly
- prioritize these earlier in the queue

### Previously Decided Senders
- Must not reappear in decision mode
- unless explicitly reset or new behavior detected

---

## Summary

The Sender Decision Engine is a **momentum system**, not a data system.

It must:
- feel fast
- feel clear
- feel decisive

If users hesitate, the system is wrong. If users flow, the system is right.