# Decision Mode – Component Build Specification (v1)

## Purpose
This document defines the exact frontend architecture and component system for building **Decision Mode**, the Tinder-style sender review experience.

Goal:
- Fast
- Addictive
- Zero friction
- High-throughput decision making

---

## Core Experience

User flow:
1. User lands on sender overview (charts + analytics)
2. Clicks: **Start Reviewing Senders**
3. Screen transitions into **Decision Mode**
4. One sender at a time appears
5. User selects:
   - Keep All
   - Keep Some
   - Archive All
   - Not Sure
6. Next sender loads instantly
7. Repeat until complete

---

## Architecture Overview

### State Model

```
type Decision = 'keep_all' | 'keep_some' | 'archive_all' | 'not_sure'

interface SenderQueueState {
  currentIndex: number
  senders: Sender[]
  decisions: Record<string, Decision>
}
```

---

## Component Tree

```
DecisionModePage
 ├── DecisionHeader
 ├── SenderCard
 │    ├── SenderHero
 │    ├── SenderInfo
 │    ├── SenderSignals
 │    ├── SenderCategories
 │    └── SenderExamples (expandable)
 ├── DecisionActions
 └── ProgressIndicator
```

---

## Core Components

### 1. DecisionModePage

Responsibilities:
- Holds queue state
- Handles transitions
- Preloads next senders

Key logic:
```
const [state, setState] = useState<SenderQueueState>()

const handleDecision = (decision: Decision) => {
  const sender = state.senders[state.currentIndex]

  saveDecision(sender.id, decision)

  setState(prev => ({
    ...prev,
    currentIndex: prev.currentIndex + 1
  }))
}
```

---

### 2. SenderCard

Displays:
- Hero image (sender avatar or logo)
- Sender name
- Description
- Signals (human vs machine, frequency, type)
- Categories breakdown
- Expandable email examples

---

### 3. DecisionActions

Buttons:
- Keep All
- Keep Some
- Archive All
- Not Sure

Optional keyboard shortcuts:
```
A → Keep All
S → Keep Some
D → Archive All
F → Not Sure
```

---

### 4. ProgressIndicator

Displays:
- % complete
- Number of senders remaining

---

## Performance System (CRITICAL)

### Preload Queue

```
const preloadQueue = senders.slice(currentIndex, currentIndex + 3)
```

Always preload:
- next sender
- next 2 senders

Goal:
→ zero loading delay between decisions

---

## UX Behavior

### Instant Transition

- No loading spinners between senders
- Card fades/slides instantly

### Micro Feedback (IMPORTANT)

On decision:
```
showFeedback({
  type: 'success',
  message: "Sender processed"
})
```

Optional later:
- haptic feedback
- subtle sound
- glow animation

---

## Animation System

Recommended:
- fade + slide transition
- slight scale-in for new card

Example:
```
initial: { opacity: 0, y: 20 }
animate: { opacity: 1, y: 0 }
exit: { opacity: 0, y: -20 }
```

---

## Routing Logic

Decision → Destination:

| Decision      | Result Location |
|--------------|----------------|
| keep_all     | Inbox (no action) |
| keep_some    | Management → Custom Rules |
| archive_all  | Management → Archive |
| not_sure     | Management → Quarantine |

---

## Edge Cases

- No senders → show completion screen
- Last sender → transition to summary view
- Empty categories → hide section
- No avatar → fallback icon

---

## Completion State

When finished:
- Show summary:
  - senders processed
  - decisions breakdown
- CTA:
  - "Go to Management"
  - "Apply changes"

---

## Future Enhancements (Already Planned)

- Gamification:
  - streaks
  - “You’re on a roll” feedback
- Swipe gestures (mobile)
- Undo last decision
- Batch skip
- Smart suggestions (AI-assisted decisions)

---

## Key Principle

This is NOT a dashboard.

This is a **decision engine**.

Everything must optimize for:
→ speed
→ clarity
→ momentum

---

## Build Order (IMPORTANT)

1. DecisionModePage
2. SenderCard
3. DecisionActions
4. State handling
5. Preloading system
6. Animations
7. Feedback layer
8. Keyboard shortcuts

---

## Definition of Done

Decision Mode is complete when:
- User can process senders continuously with zero delay
- Decisions route correctly
- Experience feels fast and engaging
- No cognitive overload

---

## Final Note

This system is designed to feel like:
→ Tinder for your inbox

Fast decisions.
Clear outcomes.
Addictive flow.

That is the standard.
