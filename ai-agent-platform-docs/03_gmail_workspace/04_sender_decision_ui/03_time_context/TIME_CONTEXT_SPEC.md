# Time Context — Canonical Specification (v1)

## Purpose

Define the **single source of truth** for how Time Context works across:
- chart rendering
- workflow narrowing
- sender distribution alignment
- decision mode

This document exists to eliminate ambiguity and prevent regressions.

## Role Of This Document

This file is the **behavioral specification** for Time Context.

It defines:
- what Time Context means
- what each scope must show
- what counts as PASS / FAIL

It does **not** replace the phased execution plan.

Use this document for:
- product truth
- implementation validation
- regression detection

Use the phased execution plan for:
- rollout sequencing
- lane boundaries
- milestone order

---

## Regression Floor (MUST NOT BREAK)

Future Time Context work is not allowed to break:
- cleanup-group loading
- Sender Distribution behavior
- canonical cleanup-group hydration
- workflow scope truth
- Decision Mode handoff integrity
- local clear/reset behavior already accepted elsewhere in Sender Overview

If a Time Context pass regresses any of the above, the pass is FAIL even if the chart itself improves.

---

## Core Principle (NON-NEGOTIABLE)

A sender must appear in **every time bucket where it has ≥1 message**.

There is:
- ONE dataset
- ONE time-boundary contract
- ONE bucket engine

No alternate derivations allowed.

---

## Data Model

### Canonical Inputs

All Time Context views MUST use:

- unified row dataset (selectedClusterRows or equivalent)
- identical filtering logic
- identical time boundaries

No scope-specific loaders.

---

## Time Scope Definitions

### 1D (Last 24 Hours)
- exactly 24 hourly buckets
- missing hours must be shown as zero
- no collapsing of empty buckets

---

### 1W (Last 7 Days)
- exactly 7 daily buckets
- missing days must be shown as zero

---

### 1M (Last 30 Days)
- rolling 30-day window
- NOT calendar month
- exactly 30 daily buckets

---

### 1Q (Last 90 Days)
- rolling 90-day window
- NOT calendar quarter
- bucket unit must be explicit and deterministic in implementation
- missing intervals must not collapse the visible coverage of the selected 90-day period

---

### 1Y (Last 365 Days)
- rolling 365-day window
- grouped into 12 calendar months
- MUST include current month
- missing months must still remain visible as zero-value months

---

### all_indexed
- full dataset
- grouped by calendar month

---

## Boundary Contract (CRITICAL)

All scopes MUST use the SAME boundary logic:

- same timezone
- same lower bound calculation
- same upper bound calculation

No mixing of:
- UTC boundaries
- local boundaries

---

## Runtime Safety Rules

Time Context interaction MUST NOT:
- trigger `/api/agents/playground`
- cause page-wide runtime rehydrate
- introduce hidden route/state truth that conflicts with the visible workflow truth
- create a request loop, polling storm, or repeated heavy refresh churn

A Time Context pass is FAIL if it fixes chart math but reintroduces runtime instability.

---

## Cross-Scope Truth Rule

For overlapping periods:

1D ⊆ 1W ⊆ 1M ⊆ 1Q ⊆ 1Y

Counts MUST reconcile.

If they do not:
- system is in FAIL state

---

## Chart Rendering Rules

- bucket count is FIXED per scope
- empty buckets MUST render as zero
- no collapsing
- no interpolation

Fail conditions:
- missing expected buckets
- missing current month
- inconsistent bucket counts

---

## Click-through Behavior

Clicking a bucket MUST:

- filter EXACT sender set for that interval
- not include data outside interval
- not bleed across adjacent buckets

---

## Interaction Contract

When a bucket is clicked:
- the click must register immediately in the UI
- the narrowed state must resolve into one explicit authoritative sender universe
- the workflow below must clearly transition from broad state to narrowed state
- clear/reset behavior must restore the broader scope without stale narrowed truth remaining behind

A visual highlight without real workflow narrowing does NOT count as success.

---

## Workflow Alignment

The following MUST match the selected bucket:

- sender list
- sender distribution
- decision mode
- top summary cards

All must use SAME filtered dataset.

---

## UI Truth Rules

UI is considered FAIL if ANY of the following occur:

- chart shows "no visible data" when data exists
- bucket count is incorrect
- buckets collapse or disappear
- counts do not match sender distribution
- counts do not match workflow list

---

## Accepted Visible Surfaces

Any Time Context pass must be verified on the exact accepted visible surfaces:
- chart itself
- lower workflow list
- sender distribution
- top summary cards

A pass is invalid if proof is taken only from backend payloads or logs without matching visible chart proof.

---

## Anti-Patterns (DO NOT ALLOW)

- multiple timeline derivation paths
- scope-specific datasets
- mixing message vs sender metrics
- collapsing empty buckets
- inconsistent boundaries

---

## Acceptance Criteria

A pass is only valid when:

- 1D == 1W (same day)
- 1W == 1M (overlap)
- 1M == 1Y (same month)
- visible bucket count matches the scope contract
- current month is present when required
- empty intervals remain visible when required by the scope
- workflow matches chart exactly
- sender distribution matches the same narrowed sender universe
- top summary cards match the same narrowed sender universe
- no runtime rehydrate / request-loop regression is introduced

---

## Anti-Cheating Rules

A Time Context pass does NOT count as success if:
- the chart looks better but the workflow is still broad
- the backend parity passes but the visible chart is missing expected buckets
- a scope silently changes meaning between patches
- a chart hides missing data by collapsing intervals
- the visible chart says `no visible data` while the dataset exists
- runtime churn or repeated heavy requests are reintroduced while testing the chart

---

## Summary

Time Context is a **deterministic system**.

If:
- same data
- same boundaries

Then:
- same results

Any deviation = system failure.