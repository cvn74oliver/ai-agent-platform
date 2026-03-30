

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
  source
}
```

### Truth Hierarchy
- Page shell → analysis_scope
- Workflow behavior → workflow_scope (when ready)
- Decision Mode → shared workflow subset

All rail modes must use this same contract.

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

---

## Time Context Mode

### Purpose
Answer: “When is activity happening?”

### Behavior
- Time-based aggregation
- Matches pressure trend quality
- Daily granularity where appropriate

### Future Behavior
- Click timeframe → derived workflow subset

---

## Visualization Standards

### Must Match Pressure Trend
- Full timeframe coverage
- Daily bars where applicable
- Empty days shown
- Hover = detailed context
- Clean ordering (no reversal)

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

---

## No-Rehydrate Rule (CRITICAL)

The rail must NOT trigger:
- /api/agents/playground
- runtime snapshot refresh

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

---

## Anti-Patterns

Do NOT:
- Stack multiple full-width charts
- Create duplicate queue logic
- Introduce client-side ranking that differs from artifact truth
- Trigger rehydrate from UI interactions

---

## Summary

The Shared Analysis Rail is a unified decision system:

- Sender Distribution → who to act on
- Time Context → when to act

Both feed into one workflow.

One truth.
One system.
No drift.