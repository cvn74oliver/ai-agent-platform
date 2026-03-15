

# Gmail Workspace — Inbox Ingestion Specification

## Purpose
This document defines how the Gmail Workspace should ingest, index, refresh, and maintain a **complete mailbox history** instead of relying on a limited one-year or 50k-message working window.

The goal is to ensure the Gmail cleanup system operates on the **true sender universe and full mailbox history**, so all analytics, sender clusters, health scoring, and future automation decisions are grounded in the complete dataset.

This document exists because the current system appears to work primarily on a limited indexed subset, which is useful for early development but not sufficient for the final product.

---

# Core Requirements

The Gmail ingestion system must satisfy four requirements:

1. **Full mailbox coverage**
   The system must eventually ingest the user's complete accessible Gmail history.

2. **Incremental refresh**
   After the full mailbox is ingested once, future updates should be incremental and lightweight.

3. **Sender-first indexing**
   Ingestion must support the sender-first cleanup model, not just raw message storage.

4. **Safe background operation**
   Heavy Gmail sync work must never block interactive product flows.

---

# Final Product Goal

The final Gmail workspace should understand:

- every sender in the mailbox
- the full historical message volume of each sender
- long-term sender behavior
- historical protected vs non-protected mail
- sender lifecycle changes over time

The product should **not** be limited to the most recent one-year or 50k-message sample.

---

# Ingestion Model

The ingestion system should operate in **three layers**.

## Layer 1 — Full Historical Ingestion

This is the initial mailbox backfill.

Purpose:

- fetch the full accessible Gmail message history
- build the canonical indexed dataset
- build the canonical sender universe

Characteristics:

- long-running
- asynchronous
- background-only
- resumable

This process should never be tied to a normal page load.

---

## Layer 2 — Incremental Sync

After historical ingestion is complete, future syncs should only fetch changes.

Purpose:

- new messages
- changed labels
- newly seen senders
- updated sender statistics

Characteristics:

- frequent
- small
- fast
- checkpoint-based

This should be the default steady-state sync mode.

---

## Layer 3 — Derived Sender Index

After raw message ingestion, the system must build sender-first derived structures.

Purpose:

- sender statistics
- sender clusters
- sender behavior models
- inbox health inputs
- cleanup candidates

This ensures the product works from sender-first derived data rather than recomputing sender logic from raw rows on every request.

---

# Full Historical Ingestion Requirements

## 1. Must paginate through full Gmail history

The system must continue fetching until all accessible Gmail history has been processed.

It must not stop after:

- 50,000 rows
- one year of history
- arbitrary date cutoffs

---

## 2. Must be resumable

Historical ingestion must store progress so it can continue after interruption.

Required checkpoint concepts:

- next page token
- ingestion cursor
- last completed batch
- total rows indexed so far

---

## 3. Must support long-running background execution

Historical ingestion may take minutes or hours depending on mailbox size.

Therefore:

- it must run outside the interactive request path
- it must expose status updates
- it must be restartable

---

## 4. Must not block normal UX

The user should be able to use the product while ingestion continues.

During partial ingestion the UI should communicate:

- ingestion in progress
- current coverage estimate
- current indexed row count
- which analytics are partial vs complete

---

# Incremental Sync Requirements

## Purpose
Incremental sync keeps the indexed mailbox current after the initial full ingestion finishes.

## Required behavior

The system should track:

- latest successful sync checkpoint
- latest Gmail history reference if available
- latest indexed message timestamp

Then only fetch:

- newly received mail
- changed label state
- changed sender status

This must be much cheaper than historical ingestion.

---

# Sender-First Derived Index Requirements

The ingestion system must produce sender-first structures that power the workspace directly.

Required sender-derived outputs:

- canonical sender table
- sender message count
- sender unread count
- sender protected count
- sender activity timeline
- sender last-seen timestamp
- sender category candidates
- sender health impact score

These derived structures should be refreshed incrementally, not fully recomputed during UI navigation.

---

# Caching and Refresh Rules

## Rule 1 — Interactive pages may read cached indexed state only

The following pages must never trigger full mailbox ingestion:

- Mailbox Intelligence
- Cleanup Groups
- Sender Decisions
- Confirmation

They may only consume:

- current indexed snapshot
- derived sender structures
- cached analytics

---

## Rule 2 — Explicit refresh may request incremental refresh, not full historical rebuild

When users click something like:

- Refresh cleanup analysis
- Refresh mailbox intelligence

that action should:

- refresh derived analytics
- optionally request incremental sync
- never silently trigger a giant historical rebuild

---

## Rule 3 — Historical backfill must be separated from UI refresh

The system must not confuse:

- reindex full mailbox history
n with:
- refresh current cleanup analysis

These are different operations and must remain separate in the architecture.

---

# Product Status Indicators

The UI needs visibility into ingestion completeness.

Suggested indicators:

## 1. Mailbox Coverage

Example:

```text
Mailbox Coverage
68% historical coverage indexed
```

## 2. Ingestion State

Possible values:

- Not started
- Historical backfill in progress
- Incremental sync active
- Fully indexed
- Sync error

## 3. Partial-data warning

If the mailbox is not fully indexed, the UI should clearly state that some analytics are based on partial history.

---

# Architecture Requirements

## Background Job Model

Historical ingestion should run as a background job with:

- progress state
- restart support
- failure recovery
- checkpoint persistence

## Data Layers

The system should conceptually maintain:

1. raw Gmail message index
2. sender-derived index
3. analytics/health aggregates

## Failure Handling

If ingestion fails:

- preserve completed progress
- show error state
- allow retry from checkpoint

---

# Performance Requirements

The ingestion system must not degrade interactive UX.

Interactive targets remain:

- Mailbox Intelligence < 2s warm
- Cleanup Groups < 1s warm
- Sender Decisions < 2s warm

Background ingestion is allowed to be slow.

Interactive reads are not.

---

# Relationship to Inbox Health

The Inbox Health Engine depends on ingestion completeness.

Examples:

- sender control score is more accurate with full history
- noise reduction score is more accurate with full sender population
- recommendations become more intelligent with longer behavior history

If ingestion is partial, health scoring should either:

- indicate partial confidence
or
- mark itself as based on partial history

---

# Phase Relationship

## Phase 1

- allowed to operate on a limited indexed window for early product iteration
- should disclose partial coverage clearly

## Phase 2

- introduces full historical ingestion architecture
- introduces ingestion progress indicators
- introduces stronger sender-universe completeness

## Phase 3+

- supports predictive sender modeling
- supports deeper health intelligence
- supports durable automation from full history

---

# Future Enhancements

Later improvements may include:

- sender reputation scoring from long history
- anomaly detection on sender behavior shifts
- aging models for dormant senders
- better cluster generation using complete sender histories

---

# Related Documents

This spec works together with:

- `GMAIL_WORKSPACE_INBOX_HEALTH_SPEC.md`
- `GMAIL_WORKSPACE_ANALYTICS_SPEC.md`
- `GMAIL_WORKSPACE_DECISION_STORAGE_SPEC.md`
- `GMAIL_WORKSPACE_ENGINEERING_SPEC.md`

---

# Summary

The Gmail Workspace cannot become a true sender intelligence system unless it eventually ingests the **full mailbox history**.

This specification separates:

- historical mailbox ingestion
- incremental sync
- sender-derived indexing
- interactive analytics consumption

That separation is essential for both product correctness and performance.

---

End of Specification