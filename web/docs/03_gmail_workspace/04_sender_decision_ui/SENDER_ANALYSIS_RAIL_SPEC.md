

# Shared Analysis Rail — Time Context + Sender Distribution

## Purpose
Define a unified, full-width analysis system inside Sender Overview that allows operators to switch between different analytical lenses (Time Context and Sender Distribution) without increasing page length or cognitive load.

This replaces the idea of stacking multiple large charts vertically.

---

## Core Concept

Instead of multiple charts stacked down the page:

👉 Use ONE shared full-width analysis rail  
👉 Allow switching between analysis modes inside that rail

### Initial Modes
1. Time Context (existing, upgraded)
2. Sender Distribution (new)

---

## Product Principles

### 1. One Frame, Multiple Lenses
- Only one chart visible at a time
- User selects the analytical perspective
- Avoid vertical stacking of heavy data sections

### 2. Operator Control > Passive Browsing
- Use tabs / segmented control (NOT carousel arrows)
- This is an analytical tool, not a slideshow

### 3. Reuse Proven Interaction Patterns
- Leverage Mailbox Intelligence chart behavior:
  - hover states
  - quick read overlays
  - dynamic supporting context below
  - selection persistence

### 4. Keep Context Aligned
- Charts must reflect:
  - current cleanup group
  - current analysis scope
  - current filters (if applicable)

---

## Layout Structure

```
[ Analysis Rail Header ]
    [ Time Context ] [ Sender Distribution ]

[ Full Width Chart Area ]

[ Dynamic Supporting Context Block ]
```

---

## Phase Plan

---

### Phase 1 — Upgrade Time Context (Foundation)

#### Goal
Convert the existing Time Context chart into the new shared analysis rail system.

#### Changes
- Move Time Context into the shared rail container
- Add:
  - hover interaction
  - selected bar state
  - quick read panel (like Mailbox Intelligence)
- Improve visual clarity and interaction feedback

#### Behavior
- Hover → shows quick read
- Click → locks selected state
- Supporting content updates dynamically

#### Data Source
- Must be artifact-backed
- No legacy or pre-artifact logic

---

### Phase 2 — Sender Distribution (New Mode)

#### Goal
Allow users to visually understand how senders contribute across the group.

#### Chart Model
- Each bar = one sender
- Sorted by:
  - default: supporting message count (descending)

#### Interaction
- Hover:
  - sender name
  - message count
  - % of group
- Click (future):
  - jump into sender workflow or focus

#### Default Scope
- Uses current page analysis scope
- Not independent from the rest of the system

---

### Phase 3 — Shared Controls + Refinement

#### Potential Enhancements
- Shared timeframe control (like Mailbox Intelligence)
- Metric toggles (later, not v1)
- Improved hover panel consistency across modes
- Consistent color mapping across charts

---

## Design Decisions

### Why NOT a Carousel
- Feels decorative
- Suggests passive browsing
- Breaks analytical intent

### Why Tabs / Mode Switch
- Clear mental model
- Direct control
- Matches operational tooling

---

## Data Requirements

### Time Context
- Artifact-backed time series
- Message volume over time
- Supporting signals (machine vs human, etc.)

### Sender Distribution
- Sender-level aggregation
- Message counts
- Percentage contribution to group

---

## Risks / Considerations

- Too many visual layers could overwhelm users → keep minimal
- Sender distribution could become dense → limit visible bars
- Must ensure performance stays fast (use artifact data only)
- Must maintain alignment with lower sender workflow

---

## Out of Scope (for now)

- No backend redesign
- No new artifact structures beyond existing capabilities
- No advanced filtering inside charts
- No redesign of sender workflow itself
- No Decision Mode changes

---

## Summary

This system turns Sender Overview into a true analytical surface:

- Time Context → when activity happened  
- Sender Distribution → who is driving activity  

Together, they give operators:
👉 temporal understanding  
👉 structural understanding  

Without increasing page complexity.