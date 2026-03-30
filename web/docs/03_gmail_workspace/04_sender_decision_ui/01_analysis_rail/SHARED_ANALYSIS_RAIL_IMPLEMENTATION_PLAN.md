

# Shared Analysis Rail — Implementation Plan

## Purpose
This document defines the phased implementation plan for the **Shared Analysis Rail system**, combining:
- Sender Distribution Chart
- Timeframe (Activity) Chart
- Shared Workflow Subset Contract

This is the authoritative execution plan for Codex.

---

# Core Principles (DO NOT VIOLATE)

1. Artifact-backed only (no new DB query patterns)
2. No page-wide rehydrate
3. One shared workflow subset contract
4. Decision Mode remains the single execution authority
5. Chart = visualization of truth, not creator of truth

---

# System Model (Final Target)

## Two-Tab Full-Width Analysis Rail

### Tab 1 — Sender Distribution (PRIMARY)
- Ranked senders (by message volume initially)
- Drives workflow prioritization
- Fully interactive

### Tab 2 — Timeframe Activity
- Shows when activity happened
- Drives temporal slicing
- Also interactive (creates derived subset)

---

## Shared Workflow Subset Contract (CRITICAL)

Single source of truth for:
- Chart
- Workflow List
- Decision Mode

### Shape
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

---

# Phased Implementation Plan

---

## PHASE 1 — Rail Foundation (NO NEW CHARTS YET)

### Goal
Establish shared state contract and tab system.

### Work
- Add tab switcher UI
- Implement shared workflow subset contract
- Route both existing chart + future chart through same contract

### Files
- review/page.tsx

### Output
- Tabs visible
- No behavior change yet

---

## PHASE 2 — Sender Distribution Chart (Core Build)

### Goal
Build primary chart (replaces contributor chart)

### Behavior
- Pull from sender_workspace
- Sorted by message_count DESC
- Pagination = display only

### Interaction
- Click sender → focused subset
- Updates:
  - workflow list
  - decision queue

### Files
- review/page.tsx

---

## PHASE 3 — Timeframe Chart Integration

### Goal
Make timeframe chart drive workflow

### Behavior
- Clicking timeframe:
  - If READY → becomes authoritativeScope
  - If NOT READY → comparison only

### Output
- Derived workflow subset

---

## PHASE 4 — Chart → Workflow Sync

### Goal
Ensure perfect alignment across:
- chart
- workflow list
- decision mode

### Rules
- Same ordering
- Same subset
- Same first sender

---

## PHASE 5 — Daily Granularity + Visual Upgrade

### Goal
Match pressure trend quality

### Changes
- Daily bars for 1M + 1W
- Show empty days
- Fix reversed ordering

---

## PHASE 6 — Context Panel ("In Focus")

### Goal
Dynamic context below charts

### Behavior
- Changes based on:
  - selected timeframe
  - selected sender

---

## PHASE 7 — Performance Hardening

### Goal
Ensure no regressions

### Checks
- No /api/agents/playground calls
- No rehydrate
- Fast scope switching

---

# Execution Order (STRICT)

1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4
5. Phase 5
6. Phase 6
7. Phase 7

Do NOT combine phases.

---

# Acceptance Criteria

- Charts update without rehydrate
- Workflow list matches chart
- Decision Mode matches chart
- No duplicate queue logic
- No performance regression

---

# Notes

- This system must be workspace-agnostic
- Gmail is only the first implementation
- Future workspaces will reuse this exact model
