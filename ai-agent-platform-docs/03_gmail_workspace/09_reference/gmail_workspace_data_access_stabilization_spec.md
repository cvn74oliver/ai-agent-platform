

# Gmail Workspace Data Access Stabilization Spec

## 1. Problem Statement

The Gmail workspace currently suffers from unstable and unsafe data-access behavior:

- Cold page opens (especially Sender Overview) can trigger:
  - `loadIndexedGmailMessagesForTenant(limit=100000)`
  - ~15–20s request times
  - full sender workspace rebuilds
- Fast-path logic (`sender-workspace-fast-path`) is frequently rejected, causing fallback to heavy paths
- UI performance and reliability are tightly coupled to raw indexed-row scans
- The system behaves inconsistently across pages depending on cache state

This creates:
- Poor user experience (slow first-open)
- High Supabase load risk
- Repeated regressions when new features are added

We must transition to a **snapshot-first, artifact-driven architecture**.

---

## 2. Non-Negotiable Principles

1. **Full mailbox is the source of truth**
   - All ~300k messages must inform system intelligence

2. **UI must never read raw mailbox at scale**
   - No page open should scan 100k+ rows

3. **All heavy computation must be precomputed**
   - Sender stats
   - Operator profiles
   - Cluster summaries
   - Intelligence metrics

4. **Page reads must be bounded**
   - Use snapshots, caches, and page seeds

5. **Heavy work must be explicit**
   - Sync, backfill, regeneration, scheduled jobs only

---

## 3. Current Failure Mode

Observed in logs:
- `loadIndexedGmailMessagesForTenant(limit=100000)`
- `sender_workspace duration ~19–21s`
- Fast path rejected: `rejected_candidate_breadth`

Flow today:
1. Page opens
2. Fast path fails
3. System falls back to full indexed-row scan
4. UI blocks on large rebuild

This is the root issue to eliminate.

---

## 4. Target Architecture

### Core Model

```
Full Mailbox (300k+)
        ↓
Background / Controlled Recompute
        ↓
Persisted Artifacts (Supabase)
        ↓
UI Pages (bounded reads only)
```

### Key Concept

We do NOT:
- query mailbox → compute → render (at request time)

We DO:
- compute → store → render

---

## Fast Path Requirements

A valid page-open fast path must:

- return sender workspace data without scanning raw indexed rows
- operate only on persisted artifacts (sender stats + workspace page seed)
- support first page of sender list (e.g., top N senders)
- degrade gracefully if data is incomplete (show partial, not fallback)

The system must NOT:

- reject fast path due to dataset breadth alone
- fallback to `loadIndexedGmailMessagesForTenant(limit=100000)` on page open
- block UI while attempting full workspace rebuild

If fast path cannot fully resolve:
- return partial artifact data
- trigger deferred background refresh
- never escalate to full mailbox scan synchronously

## 5. Persisted Artifact Inventory

### 5.1 Sender Stats / Profile Store (`gmail_sender_stats`)
- category_distribution
- pattern_mix
- operator_profile_*
- message_count, unread_count
- last_activity
- protection + verification signals

### 5.2 Sender Workspace Page Seed
- paginated sender list per cluster/scope
- includes:
  - sender ids
  - rank
  - summary metrics
  - preview references

### 5.3 Mailbox Intelligence Snapshot
- inbox health
- pressure metrics
- timeline aggregates
- top opportunities
- category distributions

### 5.4 Cluster Summary Artifact
- cleanup group summaries
- sender counts
- supporting message counts
- dominant categories

### 5.5 Proof / Preview Index
- lightweight message references per sender
- category-based grouping
- snippet + metadata
- pagination references

### 5.6 Management Snapshot
- execution queue
- pending approvals
- destination state counts

---

## 6. Per-Page Read Path

### Sender Overview (Review Page)
- primary:
  - sender workspace page seed
  - sender stats
- secondary:
  - preview index (lazy / paginated)
- never:
  - raw indexed-row scan

---

### Mailbox Intelligence
- mailbox intelligence snapshot only
- no recompute on open

---

### Cleanup Groups (Clusters)
- cluster summary artifact
- no live mailbox-intelligence rebuild

---

### Management
- management snapshot
- execution queues
- no sender recompute

---

### Decision Mode
- sender workspace seed
- sender stats
- preview index (bounded)

---

## 7. Allowed vs Forbidden Work

### Allowed heavy operations
- initial ingestion / backfill
- smart sync
- manual regeneration
- scheduled recompute jobs
- migrations / backfills

### Forbidden
- page open
- navigation
- expanding sender rows
- loading previews
- tab switching

---

## 8. Sender Card Data Contract

Each sender must have:

### Identity
- sender
- domain
- last activity
- message_count
- unread_count

### Category Truth
- category_distribution
- dominant_category
- category_profile_mode

### Pattern Truth
- dominant_pattern
- pattern_mix

### Operator Profile
- operator_profile_family
- operator_profile_mode
- operator_profile_confidence
- operator_profile_summary
- operator_profile_reasons

### Risk Signals
- protected_hint
- requires_verification
- verification_reasons
- sender_signal

### Proof Support
- preview message references
- category-grouped counts
- pagination refs

### Ranking
- impact score
- unread pressure
- contribution rank

---

## 9. Backfill Strategy (300k Dataset)

### Requirements
- Must process full dataset
- Must NOT block UI
- Must be resumable

### Approach
- batch recompute
- windowed processing
- background job execution
- incremental updates after sync

---

## 10. Observability / Logging

Logs must clearly distinguish:

- artifact read
- cached read
- recompute trigger
- fallback path

Must include:
- duration
- rows scanned
- source (snapshot vs rebuild)

---

## 11. Acceptance Criteria

The system is considered fixed when:

- Sender Overview cold open:
  - NO `loadIndexedGmailMessagesForTenant(limit=100000)`
  - < 2s render from artifacts

- Mailbox Intelligence:
  - loads instantly from snapshot

- No page:
  - triggers full mailbox scan on open

- Logs show:
  - artifact reads only
  - no heavy fallback on navigation

- Full mailbox still used:
  - via background recompute

---

## 12. Out of Scope

- UI redesign
- sender card layout changes
- Decision Mode redesign
- preview performance (separate pass)
- category logic changes

---

## 13. Phased Implementation Plan

### Phase A: Artifact Foundation (Completed)
- create artifact schema
- create publication/version model
- create artifact projector/store scaffolding
- no request-path changes

### Phase B: Sender Overview Stabilization (Completed)
- eliminate 100k fallback from Sender Overview
- enforce artifact-only reads for `sender_workspace`
- introduce safe partial behavior (no mailbox scan fallback)

### Phase C: Intelligence + Cluster Stabilization (Completed)
- convert Mailbox Intelligence to snapshot reads
- convert Cleanup Groups to cluster summary artifact
- convert pressure trend to bucket reads
- remove request-time derived workspace rebuilds

### Phase D: Decision + Execution Stabilization (Completed)
- convert confirmation preview to preview index
- convert archive-scope resolution to artifact-backed logic
- preserve exact message-id behavior without mailbox scans

### Phase E: Runtime Stabilization (Completed)
- remove synchronous runtime discovery rebuilds
- enforce artifact-only runtime assembly
- background refresh becomes enqueue-only and non-blocking

---

### Phase F: Validation, Observability, and Lockdown (Completed)
- add repeatable acceptance scripts
- formalize rollout documentation
- define log-based success signals
- confirm no request-time mailbox scans across all pages
- lock architecture rules to prevent regressions

---

### Phase G: Full-Mailbox Artifact Coverage (Completed)

**Goal:** Move from partial (100k-window) artifact coverage to full mailbox coverage (~300k+ messages).

#### Requirements
- process entire indexed mailbox, not capped subsets
- eliminate dependence on 100k build window
- guarantee artifact completeness for all senders and clusters

#### Implementation
- extend artifact projector to stream full mailbox by sender
- implement checkpointed/resumable processing
- ensure full coverage for:
  - sender stats
  - sender workspace seeds
  - cluster summaries
  - preview index
  - intelligence snapshots

#### Constraints
- must run as background job only
- must not block UI
- must not introduce request-time scans

---

### Phase G.5: Artifact Integrity Verification (New – Immediate Follow-Up)

**Goal:** Ensure the newly built full-mailbox artifacts are correct, complete, and trustworthy before moving forward.

#### Requirements
- validate artifact counts against source mailbox:
  - sender counts
  - message counts
  - preview index coverage
- verify no silent data loss:
  - missing senders
  - missing clusters
  - missing preview messages
- verify cross-artifact consistency:
  - sender stats vs seed rows
  - cluster summaries vs seed headers
  - preview index vs cluster membership
- verify UI-visible correctness:
  - sender overview accuracy
  - pressure trend correctness
  - category distributions

#### Constraints
- no request-path changes
- no UI redesign
- read-only validation + diagnostics only
- must not trigger full rebuild unless explicitly requested

---

### Phase G.6: Pressure Trend Bucket Expansion + Window Correctness (Completed)

**Goal:** Ensure Mailbox Intelligence pressure trend is correct and fully artifact-backed for all supported time windows.

#### Problem
- Current artifact model stores a single all-history pressure series.
- Alternate windows (`last_year`, `last_quarter`, `last_month`, `last_week`, `last_day`) are derived by filtering this series.
- This produces incorrect grouping and bar counts and can leave the chart in a perpetual loading/empty state.

#### Requirements
- Publish window-specific bucket families with correct aggregation grain:
  - `all_indexed` → quarterly/year-scale (as currently defined)
  - `last_year` → monthly buckets (~12–13)
  - `last_quarter` → weekly buckets (~12–13)
  - `last_month` → daily buckets (~28–31)
  - `last_week` → daily buckets (7)
  - `last_day` → hourly buckets (24)
- Each bucket family must be precomputed and persisted in `gmail_mailbox_intelligence_buckets`.
- Bucket rows must include:
  - `bucket_kind` (e.g., year/month/week/day/hour)
  - `bucket_start_at`, `bucket_end_at`
  - `bucket_value` and payload needed for UI rendering

#### Read Path
- The request path must select the correct bucket family per window.
- Do NOT filter a single all-history series to emulate other windows.
- Maintain artifact-only reads and bounded queries.

#### Constraints
- no request-time mailbox scans
- no changes to Sender Overview, Cleanup Groups, or Decision Mode
- no UI redesign (data correctness only)
- preserve A–G request-time guarantees

#### Acceptance Criteria
- Each window returns the correct number of bars and correct aggregation grain
- Switching windows updates data immediately (no stuck loading state)
- No `loadIndexedGmailMessagesForTenant(...)` appears in logs
- No `loadDerivedWorkspaceState(...)` or `loadMailboxContext(...)` calls are introduced
- Existing Phase F acceptance harness continues to pass unchanged

---

### Phase G.7: Pressure Trend Render / Consumption Verification (New – Immediate Follow-Up)

**Goal:** Prove that the pressure-trend UI is actually rendering the correct published bucket families end-to-end, not merely that the backend stores them correctly.

#### Problem
- G.6 fixed artifact bucket production and request-path selection.
- However, if the UI still shows an empty/loading chart while request logs are healthy, then the remaining issue is likely in chart consumption, response mapping, hydration, or render-state handling.
- This must be verified and fixed before moving on to incremental artifact updates.

#### Requirements
- verify end-to-end behavior for all supported windows:
  - `all_indexed`
  - `last_year`
  - `last_quarter`
  - `last_month`
  - `last_week`
  - `last_day`
- prove that the browser-visible chart receives non-empty series for each window
- verify chart rendering path for:
  - initial Mailbox Intelligence load
  - subsequent window switching
  - route/query-param changes
  - client hydration and chart-state transitions
- identify whether the remaining defect is in:
  - backend response shape
  - page-to-component mapping
  - client-side state updates
  - chart component rendering logic
  - loading/empty-state guards

#### Constraints
- keep A–G request-time guarantees intact
- no reintroduction of request-time mailbox scans
- no broad UI redesign
- fix only the pressure-trend consumption/render path and any minimal supporting plumbing required

#### Acceptance Criteria
- each supported window visibly renders bars in the UI
- no perpetual loading state remains for valid published bucket families
- browser-visible bar counts match the selected bucket family
- request logs remain artifact-only
- existing acceptance harness continues to pass unchanged

---
---

### Phase H: Incremental Artifact Update System

**Goal:** Ensure all new incoming data is automatically reflected in artifacts.

#### Behavior
- new emails trigger:
  - sender-level updates
  - preview index updates
  - cluster summary adjustments
- system computes only affected deltas
- publishes new artifact version without full rebuild

#### Requirements
- change detection per sender
- partial recompute pipeline
- safe publish (versioned)

---

### Phase I: Artifact Freshness + Sync Integration

**Goal:** Integrate artifact updates into Smart Sync and ingestion pipeline.

#### Behavior
- after sync completes:
  - compute affected senders
  - update artifacts incrementally
- fallback to full rebuild if:
  - data drift is too large
  - integrity is uncertain

---

### Phase J: Performance Hardening + Scaling

**Goal:** Ensure system stability at scale (300k+ and beyond).

#### Requirements
- artifact reads < 2s for all major pages
- bounded Supabase queries only
- no request-time scan regressions
- load-test full dataset

---

### Phase K: Final Architecture Lock

**Goal:** Make this the permanent engine pattern.

#### Enforce:
- no new feature may introduce request-time full dataset scans
- all new workspaces must follow:
  - ingest → derive → persist → serve
- document as platform standard

---

## Final Note

This system must support:

- full mailbox data (300k+ messages)
- continuous updates from new incoming data
- zero request-time dependency on raw mailbox scans

This is the foundational engine for all future workspaces:
- email
- ads
- finance
- crypto
- social

We are not solving Gmail.

We are building the platform.