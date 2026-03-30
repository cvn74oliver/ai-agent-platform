

# Sender Distribution Chart — Spec

## Purpose
Provide a **ranked, scope-aware view of all senders** to help operators decide *what to act on next*. This chart complements (does not replace):
- Timeframe rail (context + comparison)
- Sender list (execution surface)
- Decision Mode (action engine)

It answers: **“Who is driving my inbox right now (by volume/activity) in this scope?”**

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

---

## Workflow Coupling (IMPORTANT)
The chart is not passive.

- Clicking a sender row:
  → opens Sender Overview focused on that sender
  → preserves current `workflow_scope`

- (Future) multi-select / range select:
  → creates temporary decision queue subset

- The chart acts as a **priority entry point into Decision Mode**

---

## Visualization
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