

# Decision Mode Animation & Interaction Spec (Tinder-Style UX)

## Overview
This document defines the **animation system, transitions, gestures, and interaction feel** for Decision Mode.

Goal:
- Fast
- Addictive
- Zero friction
- Feels like a modern mobile-first app (Tinder / TikTok / Reels)

---

## Core Experience Principles

### 1. One Decision at a Time
- Only ONE sender card is visible
- Everything else is visually suppressed (dimmed or hidden)

### 2. Instant Feedback
- Every click/swipe gives immediate visual response
- No waiting for backend

### 3. Momentum-Based Flow
- User should feel like they are “on a roll”
- No interruption between cards

---

## Layout State Transitions

### Enter Decision Mode
Trigger: “Start Reviewing Senders”

Animation:
- Background dashboard → fades to 20% opacity
- Sender card → scales in (0.92 → 1.0)
- Slight upward motion (translateY: 20px → 0)

Duration:
- 250ms ease-out

---

### Exit Decision Mode
Trigger: Finish or Back

Animation:
- Card fades out + slight shrink (1 → 0.95)
- Background restores (opacity 20% → 100%)

Duration:
- 200ms ease-in

---

## Card Behavior

### Base Card
- Slight shadow
- Rounded corners
- Centered focus

---

### Hover / Focus
- Scale: 1 → 1.02
- Shadow increases slightly

---

## Decision Actions (Primary Animation System)

### Swipe Right (LIKE ALL)
Direction: Right

Animation:
- Card translates → +120% X
- Slight rotate: +6°
- Opacity fades to 0

Duration:
- 220ms ease-out

Color Feedback:
- Subtle green glow during movement

---

### Swipe Left (LIKE NONE)
Direction: Left

Animation:
- Card translates → -120% X
- Slight rotate: -6°
- Opacity fades

Color:
- Soft red glow

---

### Swipe Up (LIKE SOME)
Direction: Up

Animation:
- Card moves upward → -120% Y
- No rotation
- Slight scale down

Color:
- Blue accent glow

---

### Swipe Down (UNSURE)
Direction: Down

Animation:
- Card moves downward → +120% Y
- Slight opacity fade

Color:
- Purple/neutral glow

---

## Button Click (Non-Swipe Users)

Same animations triggered programmatically.

IMPORTANT:
- Buttons MUST feel identical to swipe outcomes

---

## Next Card Transition

Immediately after decision:

1. Current card exits
2. Next card:
   - starts at scale 0.95
   - fades in
   - slight upward motion

Duration:
- 180ms (fast)

---

## Stacking Illusion

Optional enhancement (recommended):

- Next card slightly visible behind current
- Scale: 0.96
- Opacity: 60%

Creates:
- depth
- anticipation

---

## Micro Interactions

### Button Press
- Scale down to 0.96 on click
- Bounce back to 1.0

Duration:
- 120ms

---

### Decision Confirmation Pulse
After action:
- quick pulse glow behind card (150ms)
- fades instantly

---

### Progress Indicator Animation
- Smooth progress bar (linear)
- Micro tick forward per decision

---

## Gesture Support (Optional Future Phase)

- Drag card slightly before committing
- Show decision label while dragging:
  - “KEEP ALL”
  - “REMOVE ALL”
  - etc.

---

## Performance Rules

CRITICAL:
- Animations must run at 60fps
- Use:
  - transform
  - opacity

DO NOT animate:
- width
- height
- layout properties

---

## Interaction Timing Targets

| Action | Target |
|------|--------|
| Decision → next card | < 250ms |
| Button click response | < 50ms |
| Full transition cycle | ~200ms |

---

## Emotional Design Layer (HIGH IMPACT)

### Flow Reinforcement

After multiple actions:
- subtle “You’re on a roll” indicator
- small celebratory micro-feedback

---

### Completion Feedback

When finished:
- Confetti burst (subtle)
- “Inbox Upgrade Complete” moment

---

## Failure Handling (Important)

If backend fails:
- DO NOT block UI
- queue decisions locally
- retry in background

User should NEVER feel interruption

---

## Implementation Notes

- Use Framer Motion or equivalent
- Centralize animation constants
- All decisions must:
  - feel identical
  - be predictable
  - be fast

---

## Summary

This system should feel:
- smooth
- fast
- satisfying
- addictive

If it feels slow → it is broken  
If it feels clunky → it is broken  
If user has to think → it is broken  

Goal:
👉 **Effortless decision velocity**