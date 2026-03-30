# Decision Mode Component Map

## Purpose
Defines the exact file structure, component boundaries, and data flow for the Tinder-style Sender Decision Mode.

This is the **source of truth for implementation**.

---

## Route Entry

`/agents/[id]/operations/decisions`

---

## Top-Level Structure

### Page

```
app/agents/[id]/operations/decisions/page.tsx
```

Responsibilities:
- Load sender queue for selected cleanup group
- Render high-level overview
- Toggle into Decision Mode

---

## Layout Layers

### 1. Overview Layer (Pre-Decision)

```
components/decision/OverviewPanel.tsx
```

Contains:
- Sender count
- Category distribution
- Machine vs human ratio
- Estimated cleanup impact

Action:
```
Start Reviewing Senders
```

---

### 2. Decision Mode Layer

```
components/decision/DecisionModeContainer.tsx
```

State Manager:
- activeSenderIndex
- senderQueue
- decisionsMade
- currentSender

---

## Core Components

### Sender Card (MAIN UI)

```
components/decision/SenderDecisionCard.tsx
```

Sections:

#### Header
- Sender name
- Email domain
- Trust indicators

#### Hero Section
- Avatar (logo/profile image)
- Sender category (Newsletter, Promo, Alerts, etc.)

#### Summary
- AI-generated description
- Frequency (emails/week)
- First seen / last seen

#### Signals
- Machine vs Human score
- Promotional intensity
- Urgency pattern

#### Categories (Expandable)

```
SenderCategoryGroup.tsx
```

Each group contains:
- Category label
- % of emails
- Expand → preview emails

---

### Decision Actions

```
components/decision/DecisionActions.tsx
```

Buttons:

1. Keep All
2. Keep Some
3. Archive All
4. Not Sure

Behavior:
- Instant commit
- Animate out
- Load next sender

---

### Transition Engine

```
components/decision/DecisionTransition.tsx
```

Handles:
- Swipe animation
- Fade/slide transitions
- Queue advancement

---

### Progress Indicator

```
components/decision/DecisionProgress.tsx
```

Displays:
- Total senders
- Completed
- Remaining
- Momentum state

---

### Undo System

```
components/decision/UndoController.tsx
```

Functions:
```
undoLastDecision()
```

Rules:
- Single-step undo
- Restores previous sender

---

## “Keep Some” Flow (Secondary Mode)

### Route

```
/agents/[id]/operations/decisions/custom
```

### Component

```
SenderCategoryDecisionCard.tsx
```

Differences:
- Decisions per category
- Like / Don’t Like per group

---

## State Management

### Client State

- activeSenderIndex
- currentSender
- decisionHistory
- UI animation state

### Server Interaction

API:

```
POST /api/decisions
```

Payload:

```
{
  senderId,
  decisionType,
  categoryDecisions?
}
```

---

## Data Flow

1. Load sender cluster
2. Render Overview
3. User clicks “Start Reviewing”
4. Enter Decision Mode
5. Show 1 sender at a time
6. Capture decision
7. Push to queue
8. Load next sender
9. Repeat until complete

---

## Performance Rules

- Preload next sender in queue
- No full-page re-render
- Use local state transitions
- Optimistic UI updates

---

## UX Rules

- One decision at a time
- No clutter
- Fast transitions
- Zero hesitation
- Reward feedback after streaks

---

## File Tree Summary

```
components/decision/
  DecisionModeContainer.tsx
  SenderDecisionCard.tsx
  SenderCategoryGroup.tsx
  DecisionActions.tsx
  DecisionTransition.tsx
  DecisionProgress.tsx
  UndoController.tsx
  OverviewPanel.tsx
  SenderCategoryDecisionCard.tsx
```

---

## Future Extensions

- Gesture support (swipe left/right)
- Keyboard shortcuts
- Gamification hooks
- Confidence scoring feedback

---

## Notes

- This system is optimized for **speed + clarity**
- Every design choice supports fast decision throughput
- This is the core engagement loop of the product
