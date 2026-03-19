# Decision Mode UI Spec (Final Build Version)

## Overview

Decision Mode is the **core user experience** of Automata.

It transforms inbox cleanup into a:
- fast
- intuitive
- high-flow
- low-friction decision system

Inspired by swipe-based apps (like Tinder), Decision Mode allows users to process large volumes of senders quickly without cognitive overload.

---

## Core Philosophy

Decision Mode must:
- Show **one sender at a time**
- Require **one simple decision per step**
- Eliminate distractions
- Maintain continuous momentum (flow state)

The system should feel:
> fast, clear, and slightly addictive

---

## Entry Point

User flow:

1. User selects a **Cleanup Group**
2. User sees **high-level overview dashboard**
   - sender distribution
   - pressure mix
   - signals
3. User clicks:

👉 **"Start Reviewing Senders"**

---

## High-Level Overview (Pre-Decision Layer)

Before entering Decision Mode, users see:

### Purpose
Give context before decisions.

### Includes:
- Total senders in group
- Category breakdown (promotions, updates, alerts, etc.)
- Machine vs human signal distribution
- Volume + frequency indicators

### CTA
👉 “Start Reviewing Senders”

---

## Decision Mode Activation

When user clicks:

👉 Entire UI transitions into **Decision Mode**

### Behavior:
- Background dims / de-emphasizes
- Focus locks onto a single sender profile
- No side navigation distractions

---

## Sender Profile Card (Main UI)

Each sender is displayed as a **full-screen card**

### Structure

#### 1. Hero Section
- Sender avatar / logo (if available)
- Fallback: generated identity visual
- Sender name (large, clear)

#### 2. Sender Summary
- Short description of sender
- Example:
  - “Weekly promotions from Amazon”
  - “Security alerts from Google”

#### 3. Key Signals
- Machine vs Human likelihood
- Frequency (high / medium / low)
- Volume (email count)
- Recency

#### 4. Email Category Breakdown
Expandable sections:
- Promotions
- Updates
- Alerts
- Other

Each section shows:
- number of emails
- preview examples
- subject lines

---

## Decision Buttons (Primary Interaction)

User has **4 options only**:

### 1. 👍 Keep All
> “I like all emails from this sender”

Result:
- No action needed
- Sender remains in inbox

---

### 2. ⚖️ Keep Some
> “I like some emails from this sender”

Result:
- Sender goes to **Custom Rules (Management)**
- Requires deeper classification later

---

### 3. 🗑 Archive All
> “I don’t like any emails from this sender”

Result:
- Sender goes to **Archive bucket**
- Ready for Gmail execution

---

### 4. ❓ Not Sure
> “I’m unsure about this sender”

Result:
- Sender goes to **Quarantine bucket**
- Can review later

---

## Interaction Flow

After each decision:

1. Button click triggers:
   - instant feedback animation
   - slight haptic-style response (visual)

2. Current card disappears

3. Next sender appears immediately

👉 No loading delays  
👉 No confirmation screens  

---

## Flow State Rules

To maintain momentum:

- No popups
- No interruptions
- No extra clicks
- No navigation changes

User should feel:

> “I’m flying through this”

---

## Completion State

When all senders are processed:

### Show:
- Completion screen
- Summary:
  - X kept
  - X archived
  - X custom rules
  - X unsure

### CTA:
👉 “Review Decisions in Management”

---

## Management Integration

After Decision Mode:

### Buckets:
- Keep → no action
- Custom Rules → needs refinement
- Archive → ready to execute
- Quarantine → optional review

---

## Secondary Decision Mode (Custom Rules)

For “Keep Some” senders:

### Same card UI reused

BUT:
- decisions are now per category
- each category = like / don’t like

---

## Visual Design Principles

- Minimal
- Dark UI
- Strong contrast
- Large touch targets
- Smooth transitions

---

## Animation & Feedback

- Card slide-in
- Card dismiss animation
- Subtle glow on selection
- Progress indicator (optional)

---

## Gamification Hooks

- “You’re on a roll”
- “10 senders completed”
- Progress streak indicator

---

## Performance Requirements

- Instant transitions (<100ms)
- Preload next sender
- No visible loading states

---

## Success Criteria

Decision Mode is successful when:
- Users complete sessions quickly
- Users don’t feel overwhelmed
- Users return to continue cleanup
- Inbox clarity improves immediately

---

## Future Enhancements

- Swipe gestures (mobile)
- AI-assisted recommendations
- Auto-decision mode (advanced users)
- Confidence scoring

---

## Final Note

Decision Mode is the **heartbeat of the product**.

Everything else supports it.

If this is fast, clear, and enjoyable:
👉 the product wins.
