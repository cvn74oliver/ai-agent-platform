

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

### Phase A: Eliminate 100k Fallback
- fix sender workspace fast path
- enforce artifact-only first open

### Phase B: Complete Artifact Coverage
- ensure all pages have required artifacts
- fill gaps

### Phase C: Background Recompute Stability
- optimize recompute jobs
- ensure full dataset coverage

### Phase D: Performance Validation
- test with full dataset
- confirm Supabase stability

---

## Final Note

This is not a patch.

This is a permanent shift to:
- snapshot-first architecture
- artifact-driven UI
- full-dataset intelligence without runtime cost