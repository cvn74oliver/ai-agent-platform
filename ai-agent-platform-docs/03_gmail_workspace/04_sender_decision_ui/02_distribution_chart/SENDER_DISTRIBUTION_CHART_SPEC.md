# Sender Distribution Chart — Spec

## Purpose
Provide a **ranked, scope-aware view of all senders** to help operators decide *what to act on next*. This chart complements (does not replace):
- Timeframe rail (context + comparison)
- Sender list (execution surface)
- Decision Mode (action engine)

It answers: **“Who is driving my inbox right now (by volume/activity) in this scope?”**

---

## Shared Rail Context (IMPORTANT)
This chart does not exist independently.

It lives inside the **Shared Analysis Rail**, which contains two modes:
- Sender Distribution (this chart)
- Time Context (activity chart)

Rules:
- Only ONE chart is visible at a time (tab-based system)
- Both charts share the SAME:
  - timeframe controls
  - workflow scope
  - data truth
- Switching tabs must NOT trigger runtime rehydrate
- This chart must integrate into the shared workflow subset contract (see below)

---

## Core Behavior
- Show **all senders ranked** by selected metric:
  - default: message volume
  - optional: recency-weighted volume, unread volume (future)
- Support **time-bounded ranking** via scope:
  - page `analysis_scope`
  - `workflow_scope` (if active)
- Ranking must be **stable and deterministic** within a scope
- List is **descending by importance** (top contributors first)
- Must always mirror the authoritative scoped ordering used by workflow + Decision Mode

---

## Scope Model (CRITICAL)
The chart must respect the same dual-scope model as Sender Overview:

- **Page scope (`analysis_scope`)**
  - drives chart baseline and totals

- **Workflow scope (`workflow_scope`)**
  - when present, **filters the ranked list and counts**
  - reflects operator’s active working window

Rule:
> If `workflow_scope` exists → chart uses it. Otherwise → uses `analysis_scope`.

---

## Shared Workflow Subset Contract (CRITICAL)

This chart must NOT create its own local state model.

It must read from and update the shared page-session workflow subset contract used by:
- chart
- sender workflow list
- Decision Mode

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

### Truth Rules

- Page shell → `analysis_scope`
- Workflow behavior → `workflow_scope` when ready
- Decision Mode → shared workflow subset contract

The chart MUST NOT introduce any competing ordering or queue logic.

---

## Data Source (Contract)
Primary:
- Artifact-backed aggregates (preferred)
  - cluster summaries
  - sender stats

Fallback (only when necessary):
- bounded sender-workspace queries

Hard rules:
- No recomputing full distribution per render
- No live mailbox scans
- Must align with artifact snapshot version

---

## Ranking Dimensions
Minimum (v1):
- `message_count` within scope

Planned (v2+):
- recency-weighted score
- unread / actionable volume
- decision-impact score (future agent feature)

---

## Timeframe Interaction (Sniper Pass Requirement)
When a user clicks a timeframe chip in the rail:

1. If `ready`:
   - set `workflow_scope`
   - **Sender Distribution Chart re-ranks within that scope**
   - **Sender Workflow below becomes filtered cluster (derived)**

2. If `outside_timeframe` or `not yet loaded`:
   - chart updates context label only
   - workflow remains unchanged
   - UI explains why

Key behavior:
> Timeframe selection must create a **visible, actionable change** in both the chart and the workflow below.

Important invariant:
- If timeframe is NOT ready, the existing workflow subset remains authoritative
- The chart must NOT switch to an empty or comparison-only subset

---

## Workflow Coupling (IMPORTANT)
The chart is not passive. It is a **decision entry surface**.

### Sender click behavior

Clicking a sender row:
- sets shared subset:
  - `kind = 'focused_sender'`
  - `orderedSenderKeys = [senderKey]`
- preserves:
  - `analysis_scope`
  - `workflow_scope`
  - parent `cluster_id`

### Effects

- Sender Overview focuses on that sender
- Workflow list narrows to that sender
- Decision Mode opens that same sender first

### Important

- This does NOT create a new queue model
- It reuses the same authoritative ordering source

---

## Visualization
This chart is one of two tabbed views inside a shared full-width container.

- Vertical ranked list OR horizontal bar chart (top-N visible, scroll for full list)
- Each row shows:
  - sender name
  - message count
  - % of total (within scope)
  - optional sparkline (future)

- Must clearly label:
  - scope (e.g., “Last 30 days” or “Workflow: 1Q”)
  - denominator (messages within scope)

---

## Relationship to Existing Surfaces

| Surface | Role |
|------|------|
| Timeframe rail | chooses scope |
| Distribution chart | ranks contributors |
| Sender list | execution surface |
| Decision Mode | action engine |

The chart must **not duplicate rail logic** and must **not override Decision Mode ordering**.

---

## Guardrails
- No divergence from artifact truth
- No duplicated computation vs rail
- No additional Supabase pressure
- No page-wide rehydrate
- Must remain deterministic across refresh

---

## No-Rehydrate Guard (CRITICAL)

Interactions must NOT trigger:
- `/api/agents/playground`
- runtime snapshot refresh

This includes:
- tab switching
- timeframe switching
- sender click

All behavior must be resolved within the existing page session using cached / artifact-backed data.

---

## Future Extension (Non-Gmail)
This pattern generalizes to any workspace:
- “senders” → “entities” (wallets, accounts, positions, etc.)
- “messages” → “events / transactions / signals”

So the abstraction is:
> **Entity Distribution Chart**

---

## Acceptance Criteria
- Ranking updates immediately when `workflow_scope` changes
- Top contributors visibly reorder
- Clicking a sender leads to correct focused view
- Counts match artifact-backed totals
- No performance regression
- No mismatch with Decision Mode queue
- Chart ordering matches workflow list ordering
- Decision Mode first sender matches chart top-ranked sender (excluding managed senders)
- Clicking a sender does not create a separate queue model
- No `/api/agents/playground` calls triggered by chart interactions

## Derived Workflow Cluster (Timeframe Coupling)

When a timeframe is selected and `ready`:

- A **temporary derived cluster** is created in-memory:
  - based on current `workflow_scope`
  - containing only senders active in that timeframe

- This derived cluster:
  - feeds Sender Workflow
  - feeds Decision Mode queue
  - does NOT persist as a cleanup group
  - does NOT modify artifact structure

- This ensures:
  - timeframe selection always produces a real actionable queue
  - no empty “nothing happened” states
---

## Notes
- Do not implement new backend lanes in this slice
- This is a UI + contract wiring pass only
- Heavy ranking logic stays artifact-backed