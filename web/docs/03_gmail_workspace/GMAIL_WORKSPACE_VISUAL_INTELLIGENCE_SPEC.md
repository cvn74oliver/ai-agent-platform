# Gmail Workspace — Visual Intelligence Specification

## Purpose

This document defines the **visual intelligence layer** for the Gmail Workspace.  
The goal is to ensure every major operational page presents **data + visual interpretation** so users can understand the system state in seconds.

The visual layer should:

- Translate large data sets into **immediate visual insight**
- Reduce cognitive load for operators
- Surface trends and risks automatically
- Support hover, drill‑down, and interactive exploration

Every operational page should follow the pattern:

**Raw Data + Visual Interpretation = Operator Understanding**

---

# Core Visual Design Principles

## 1. Visuals Come Before Tables

Every page should begin with **visual summaries** before long lists of records.

Correct hierarchy:

1. Visual intelligence layer
2. Key metrics
3. Supporting explanation
4. Raw data tables

---

## 2. Interactive Visuals

All charts should support:

• Hover tooltips  
• Highlighting segments  
• Drill‑down navigation  
• Click‑to‑filter behavior

Example:

Hovering a sender category should highlight the corresponding senders in the table below.

---

## 3. Immediate Pattern Recognition

Visuals must answer questions instantly:

- What is happening?
- What matters most?
- Where should I act?

A user should understand the page **in under 3 seconds**.

### Visual-First Command Rule (Global)

All visual intelligence surfaces must prioritize **instant comprehension over completeness**.

Required reading order for any screen:

1. Visual signal
2. Short label
3. Key number
4. Supporting explanation

If the operator must read multiple lines of text to understand what is happening, the visual layer has failed.

The intended experience is:

> The operator should understand the current state, the main problem, and the next action in under 3 seconds without needing to read every card.

This rule applies across all current and future workspaces and must not be violated.

---

# Visual Components Library

The Gmail Workspace will use a standardized set of visual components.

## Trend Charts

Used for:

• Inbox pressure
• Email arrival rate
• Cleanup progress

Type:

Line or area chart

Hover:

Shows exact values for that date.

### Trend Interaction Rule

Trend charts must provide **insight, not repetition**.

Required behavior:

- One location shows the current value
- One location shows the previous comparison
- One location shows the change (delta)
- One location shows the dominant driver
- One location shows the recommended action

The same number must not be repeated across:
- tooltip
- label
- lower panels

without adding new meaning.

If the interaction only swaps numbers without changing interpretation, the chart is considered low-value.

---

## Distribution Charts

Used for:

• Sender category breakdown
• Decision type distribution

Type:

Donut or stacked bar chart

Hover:

Shows percentage and sender count.

---

## Progress Charts

Used for:

• Cleanup completion
• Approval queue progress

Type:

Horizontal progress bar

### Single Progress Rule

Each surface should have only **one dominant progress signal**.

For the Gmail Workspace:

```text
Every sender should have a decision
```

This is the primary progress metric.

Requirements:
- only one progress bar should represent this goal
- it must visually outrank other metrics
- it must clearly show:
  - current value (decided senders)
  - total value (indexed sender universe)

No secondary element should visually compete with this progress signal.

---

## Impact Charts

Used for:

• Noise reduction
• Messages removed from inbox

Type:

Bar chart comparing:

Before cleanup vs after cleanup

---

## Visual Semantics Rules (Non-Negotiable)

Visual components must have **clear, consistent meaning across the entire platform**.

### Allowed Visual Meanings

1. **Progress**
   - Indicates movement toward a goal
   - Must always have a clear denominator
   - Example: sender decision coverage

2. **Scope / Scale**
   - Indicates size of the system or dataset
   - Must NOT look like progress
   - Example: total senders indexed

3. **Pressure / Load**
   - Indicates volume or system stress
   - Must not visually imply success or completion
   - Example: supporting messages

4. **Health**
   - Indicates system condition
   - Must use a dedicated health visualization (rail, gauge, etc.)

### Visual Integrity Rule

A visual may NOT look like a progress bar unless it represents true progress.

Examples of violations:
- full-width bars for non-progress metrics
- gradients that imply improvement when none exists
- decorative segmented rails without defined meaning

If a visual can be misinterpreted as “good,” “complete,” or “improving” when it is not, it must be redesigned.

### Consistency Rule

All metrics in the same row must use a **shared visual grammar**.

The user must not need to decode:
- circles vs bars vs segments vs gradients
- different meanings for similar shapes

If multiple visual grammars are present in the same metric row, the UI is considered inconsistent.

---

# Page‑Level Visual Requirements

## 1. Mailbox Intelligence Dashboard

Required visuals:

### Inbox Health Gauge

Shows health score (0‑100).

Visual style:

Semi‑circle gauge.

Color zones:

Red – Critical  
Yellow – At risk  
Green – Healthy

---

### Inbox Pressure Trend

Shows message arrival vs cleanup rate over time.

Chart type:

Line graph.

Hover shows:

• message volume
• cleanup volume

---

### Sender Category Distribution

Donut chart showing:

• subscription senders
• system notifications
• retail/commercial
• social platforms

---

### Noise Reduction Projection

Bar chart showing:

Projected inbox reduction after next action.

---

### Hero Visual Contract (Mailbox Intelligence)

The Mailbox Intelligence hero must follow a strict visual system.

Allowed visual types in the hero:

1. Neutral scope indicators (for scale)
2. True progress indicators (for decision coverage)
3. Health rail or gauge (for inbox condition)

Disallowed:
- decorative bars with unclear meaning
- multiple competing progress visuals
- mixed visual grammars in the same metric row

### Cleanliness Goal Rule

The cleanliness goal must be the strongest visual element in the hero.

Requirements:
- one progress bar only
- no duplicate bars
- clear numerator and denominator
- visually dominant compared to other metrics

### Management Signal Rule

Management signals must behave like **signal displays**, not standard metric cards.

Requirements:
- count-first visual design
- large, high-contrast numbers
- minimal text
- action only when relevant

Do not use generic icons as the primary visual anchor.

The number itself must carry the visual weight.

---

## 2. Cleanup Groups

Required visuals:

### Hero Signal Row

Four count-first signal cards:

- Cleanup groups in scope
- Groups with saved work
- Groups still to review
- Senders in cleanup scope

### Goal / Progress Module

One dominant goal module that includes:

- Cleanup selection goal
- group-started coverage counter
- real progress bar
- bottom guidance row with progress summary and next-step instruction

### Recommendation + Comparison Support

Use compact structured surfaces, not charts, to help the operator choose the next group.

Cleanup Groups should not require charts in the current phase.

---

## 3. Sender Decisions

Required visuals:

### Sender Category Breakdown

Distribution chart of senders currently visible in the cluster.

### Message Volume Histogram

Shows senders grouped by message volume.

### Decision Distribution

Shows how many senders are currently marked as:

Archive  
Keep  
Quarantine  
Unsubscribe  
Custom rule

---

## 4. Confirmation

Required visuals:

### Execution Impact Preview

Bar chart showing:

Messages currently visible vs messages removed after approval.

### Decision Summary

Donut chart summarizing decision types in this approval.

---

## 5. Management Dashboard

Required visuals:

### Destination State Overview

Donut chart showing number of senders in:

Keep  
Archive  
Quarantine  
Unsubscribe  
Custom Rule

---

### Execution Status

Bar chart showing:

Succeeded  
Deferred  
Failed  
Not applicable

---

### Decision Activity Timeline

Line chart showing decision activity over time.

---

### Automation Opportunity Signals

Visual highlighting patterns where rule automation is possible.

---

# Interaction Behavior

Charts should support:

Hover → reveal detail  
Click → filter below table  
Legend toggle → hide/show categories

Example:

Clicking the "Archive" segment filters the sender list to archive senders.

### Interaction Honesty Rule

UI controls must never appear interactive unless they actually function.

Examples:
- clickable-looking filters must work
- time-range selectors must switch data

If functionality is not implemented:
- the control must be removed, or
- the control must be clearly styled as non-interactive

Fake interaction breaks operator trust and is not allowed.

---

# Mailbox Intelligence Visual Contract (Implementation Lock)

This section exists to remove ambiguity during implementation.

## Non-Negotiable Rules

1. Visuals must be understandable instantly.
2. The hero must use one consistent visual grammar.
3. Only one dominant progress signal is allowed.
4. Non-progress metrics must not look like progress.
5. Management signals must be count-led, not icon-led.
6. Trend interactions must provide new insight.
7. No fake or non-functional controls may appear interactive.

## Failure Conditions

The UI is considered incorrect if:

- users cannot explain what the top visuals mean
- multiple elements look like progress indicators
- visuals feel decorative instead of informative
- hover interactions only repeat numbers
- signal blocks look like generic stat cards
- controls look clickable but do not function

## Framework Rule

The Gmail Workspace defines the visual framework for all future workspaces.

This includes:
- tax
- crypto
- customer support
- email marketing
- paid ads platforms

All visual decisions must be:
- reusable
- consistent
- easy to understand

If a visual pattern cannot be reused across workspaces, it should not be part of the framework.

---

# Summary

The visual intelligence layer transforms the Gmail Workspace from a data viewer into an **AI‑assisted decision system**.

Visuals will allow operators to understand inbox state instantly, act confidently, and trust the system’s recommendations.
