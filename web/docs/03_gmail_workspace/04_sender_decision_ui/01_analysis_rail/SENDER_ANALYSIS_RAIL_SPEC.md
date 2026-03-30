

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
# Shared Analysis Rail — Time Context + Sender Distribution

## Purpose
Define a unified, full-width analysis system inside Sender Overview that allows operators to switch between different analytical lenses (Time Context and Sender Distribution) without increasing page length or cognitive load.

This replaces stacking multiple large charts vertically.

---

## Core Concept

👉 ONE shared full-width analysis rail
👉 TWO modes (tabs)
👉 ONE shared data + workflow truth

### Modes
1. Sender Distribution (primary)
2. Time Context (secondary)

Only one mode is visible at a time.

---

## Product Principles

### 1. One Frame, Multiple Lenses
- Only one full-width chart visible
- No vertical stacking of large charts
- Switching modes changes perspective, not layout

### 2. Operator Control (NOT passive UI)
- Tabs / segmented control only
- No carousel
- No implicit auto-rotation

### 3. Shared Workflow Truth (CRITICAL)
The analysis rail does not operate independently.

All modes must read from the same **shared workflow subset contract**:
- chart
- workflow list
- decision mode

No competing interpretations of data.

### 4. Scope Alignment
All charts must reflect:
- current cleanup group
- current `analysis_scope`
- current `workflow_scope` (when ready)

### 5. No Rehydrate Rule
Switching:
- tabs
- timeframe
- chart interaction

MUST NOT trigger:
- `/api/agents/playground`
- runtime rehydrate

---

## Layout Structure

```
[ Analysis Rail Header ]
    [ Sender Distribution ] [ Time Context ]

[ Full Width Chart Area ]

[ Dynamic Supporting Context Block ]
```

---

## Shared Workflow Subset Contract (Reference)

This rail relies on a shared page-session contract:

```
{
  kind,
  parentClusterId,
  analysisScope,
  activeWorkflowScope,
  authoritativeScope,
  populationMode,
  orderedSenderKeys,
  focusedSenderKey
}
```

### Truth Hierarchy

- Page shell → `analysis_scope`
- Workflow behavior → `workflow_scope` when ready
- Decision Mode → shared workflow subset contract

---

# Phase Plan

---

## Phase 1 — Rail Foundation

### Goal
Introduce shared rail container + tabs.

### Scope
- Add tab switcher
- Move Time Context into shared rail
- Introduce shared workflow subset contract

### Do NOT
- Add new chart yet
- Change data behavior
- Modify backend

---

## Phase 2 — Sender Distribution (Primary Mode)

### Goal
Add full sender ranking chart.

### Chart Model
- Each bar = one sender
- Sorted by message_count DESC
- Artifact-backed

### Interaction
- Hover → sender info
- Click → focus sender

### Behavior
- Updates workflow subset
- Updates workflow list
- Updates Decision Mode

---

## Phase 3 — Time Context Integration

### Goal
Make Time Context chart actionable.

### Behavior
- Clicking timeframe:
  - READY → becomes active workflow scope
  - NOT READY → comparison only

### Output
- Creates derived workflow subset

---

## Phase 4 — Chart → Workflow Sync

### Goal
Ensure all surfaces stay aligned.

### Must match:
- chart order
- workflow list order
- Decision Mode first sender

No divergence allowed.

---

## Phase 5 — Visual & Granularity Upgrade

### Goal
Match Pressure Trend quality.

### Changes
- Daily bars for 1W and 1M
- Show empty days
- Fix reversed ordering
- Improve hover detail

---

## Phase 6 — Dynamic Context Panel

### Goal
Make insights actionable.

### Behavior
Context block changes based on:
- selected timeframe
- selected sender

---

## Phase 7 — Performance Hardening

### Goal
Ensure stability.

### Requirements
- No runtime rehydrate
- Fast switching
- Artifact-backed only

---

# Data Requirements

## Time Context
- Artifact-backed time series
- Message volume over time

## Sender Distribution
- Sender-level aggregation
- Message counts
- % contribution

---

# Design Decisions

### Tabs instead of stacking
- prevents visual overload
- maintains clarity

### Tabs instead of carousel
- keeps operator in control

### Distribution as primary
- this is a Sender Overview page
- users care first about *who*

---

# Risks / Considerations

- Distribution may become dense → paginate
- Must not create duplicate queue logic
- Must stay consistent with Decision Mode

---

# Out of Scope (for now)

- Backend redesign
- New artifact schema
- Advanced filtering inside charts
- Decision Mode redesign

---

# Summary

This system transforms Sender Overview into a decision surface:

- Sender Distribution → who matters
- Time Context → when it matters

Both feed into one workflow system.

No duplication.
No drift.
No extra complexity.

Only clearer decisions.