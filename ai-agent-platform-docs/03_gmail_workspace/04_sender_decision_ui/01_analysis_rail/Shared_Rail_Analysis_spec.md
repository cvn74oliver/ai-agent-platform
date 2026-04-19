

# Shared Analysis Rail — Spec (Authoritative)

## Purpose
Define the unified analysis surface inside Sender Overview that supports multiple analytical lenses without increasing page complexity.

This rail consolidates:
- Sender Distribution (who matters)
- Time Context (when it matters)

The rail is a **decision control layer**, not just a visualization.

---

## Core Model

### One Rail, Two Modes

A single full-width container with tab switching:

- Tab 1: Sender Distribution
- Tab 2: Time Context

Rules:
- Only ONE chart visible at a time
- No stacked full-width charts
- Tabs change perspective, not layout

---

## Shared Workflow Subset (SYSTEM CORE)

The rail is powered by a shared page-session contract.

### Contract Shape
```
{
  kind: 'base_cluster' | 'derived_workflow_scope' | 'focused_sender',
  parentClusterId,
  analysisScope,
  activeWorkflowScope,
  authoritativeScope,
  populationMode,
  orderedSenderKeys,
  focusedSenderKey,
  label,
  resolvedSenderCount,
  resolvedFilters,
  source
}
```

### Truth Hierarchy
- Page shell → analysis_scope
- Workflow behavior → workflow_scope (when ready)
- Decision Mode → shared workflow subset

All rail modes must use this same contract.
All active narrowing inputs must resolve into ONE explicit authoritative sender universe.

---

## Behavior Model

### Tab Switching
- Does NOT change:
  - analysis_scope
  - workflow_scope
  - queue state
- Does NOT trigger runtime rehydrate

### Timeframe Interaction
- READY scope:
  - becomes authoritativeScope
  - updates chart
  - updates workflow list
  - updates Decision Mode

- NOT READY scope:
  - comparison only
  - does NOT change workflow subset

### Narrowing Feedback Contract
- Every narrowing click must acknowledge immediately in the clicked control.
- Immediate feedback is UI-only and must happen before `startTransition`.
- The rail must show a source-aware pending pill while the narrowed state is resolving.
- The workflow header and top summary cards must reflect that the narrowed sender universe is updating in place.
- Completion must NOT rely on route change alone.
- Completion requires:
  - requested route/session state is updated
  - the authoritative sender universe matches that requested narrowed state
  - relevant loading states are clear
- Reset actions (`Clear narrowed state`, `Back to All indexed`) must clear stale narrowed highlights immediately and show `Returning to broader scope…` while the broader sender universe settles.
- This feedback layer is visual/interaction-only:
  - no new data flow
  - no backend change
  - no page redesign

---

## Sender Distribution Mode

### Purpose
Answer: “Who is driving my inbox right now?”

### Behavior
- Ranked list of senders
- Artifact-backed ordering
- Click → focus sender

### Effects
- Updates workflow subset
- Updates workflow list
- Updates Decision Mode
- Clicked sender shows immediate pending highlight before the narrowed sender universe settles.

---

## Time Context Mode

### Purpose
Answer: “When is activity happening?”

### Behavior
- Time-based aggregation
- Matches pressure trend quality
- Daily granularity where appropriate

### Workflow Behavior
- Click valid bucket → derived workflow subset
- Bucket selection is session-only, not URL-backed
- Chart stays full-scope with one selected bucket highlighted
- On `workflow_scope=7d`, the broad weekly chart must stay row-backed even when overview bootstrap comes from a persisted snapshot
- When a bucket is selected, the lower Time Context context panel anchors to that selected bucket
- Hover is preview-only for Time Context:
  - quick-read/preview may change on hover
  - the anchored lower panel must not switch away from the selected bucket
- Clearing narrowed state returns the lower Time Context panel to its existing default-focus behavior
- On weekly bucket-selected state, workflow-scope totals must settle from the narrowed workflow coverage workspace rather than the preserved broad chart workspace
- Active workflow filters combine deterministically into one resolved sender set
- Sender Distribution, sender rows, pagination totals, and Decision Mode all consume that same ordered sender set
- Clicked bucket shows immediate pending highlight, then stays selected only after the narrowed sender universe is actually applied.
- Chart-only windows `1D` and `Custom` use compressed active-timeline rendering:
  - zero-value buckets are not rendered as reserved visible gaps
  - inactive periods must be disclosed explicitly in the UI
  - raw bucket truth still powers hover, focus, and lower-card reads
  - fully empty compressed windows show an explicit empty state
  - this continuity rule is presentation-only and does not widen workflow semantics

---

## Visualization Standards

### Must Match Pressure Trend
- Full timeframe coverage
- Daily bars where applicable
- Empty days shown
- Hover = detailed context
- Clean ordering (no reversal)
- Accepted chart-only continuity exception:
  - `1D` and `Custom` may hide inactive periods from the visible chart to preserve continuous active flow
  - when inactive periods are hidden, the rail must disclose that compression explicitly
  - hidden periods must not be replaced with interpolated values
- Accepted Pass 1 Time Context ordering:
  - `All indexed`
  - `1Y`
  - `1Q`
  - `1M`
  - `1W`
- Sender Distribution is not changed by this accepted Time Context-only pass

---

## Dynamic Context Panel

Below the chart, a shared context panel updates based on mode.

### Sender Distribution
- Selected sender
- Rank
- % of total
- Recommended action

### Time Context
- Selected timeframe
- Activity level
- Trend insight
- Recommended action
- When a workflow bucket is active, these reads anchor to the selected bucket rather than hover state
- Accepted Pass 1 Time Context scope grammar:
  - `All indexed`
  - `1Y`
  - `1Q`
  - `1M`
  - `1W`
- Accepted Pass 1 mapping:
  - `all_indexed -> all_indexed`
  - `last_year -> 365d`
  - `last_quarter -> 90d`
  - `last_month -> 30d`
  - `last_week -> 7d`
- `1D` and `Custom` are now accepted as chart-only windows with compressed continuity rendering and are not workflow-driving in the accepted state

---

## No-Rehydrate Rule (CRITICAL)

The rail must NOT trigger:
- /api/agents/playground
- runtime snapshot refresh
- page-wide rehydrate
- hidden route-param filter state for Time Context

Applies to:
- tab switching
- timeframe switching
- chart interaction

All behavior must use existing in-memory or artifact-backed data.

---

## Performance Requirements

- Instant tab switching
- Fast timeframe switching
- No new query patterns
- Reuse sender_workspace
- Separate accepted note only:
  - PM observed material load-time cost on the newly exposed Time Context scopes
  - roughly `61s` on `1Y`
  - roughly `19s` on `1Q`
  - this performance issue is separate from the accepted Pass 1 functional closeout and requires its own narrow thread if prioritized

---

## Anti-Patterns

Do NOT:
- Stack multiple full-width charts
- Create duplicate queue logic
- Introduce client-side ranking that differs from artifact truth
- Trigger rehydrate from UI interactions
- Let chart interaction imply narrowing while the workflow uses a different sender universe
- Allow multiple active filters to compete instead of resolving into one explicit sender set

---

## Summary

The Shared Analysis Rail is a unified decision system:

- Sender Distribution → who to act on
- Time Context → when to act

Both feed into one workflow.

One truth.
One system.
No drift.
