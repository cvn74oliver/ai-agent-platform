### Phase G.7: Pressure Trend Render / Consumption Verification (Completed)

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

### Phase G.8: Sender Overview First-Paint Bounded Read Correction (Completed)

**Goal:** Ensure Sender Overview first paint uses a truly bounded artifact read and no longer requests an oversized sender page on initial load.

#### Problem
- The core artifact architecture is now correct, but Sender Overview first paint can still request an excessively large sender page.
- Logs have shown first-load behavior like:
  - `requested_page_size: 1000`
  - `returned_sender_count: 1000`
  - `duration_ms: 22106`
- This means the request path is artifact-backed but still too heavy for acceptable first paint.

#### Requirements
- identify exactly why Sender Overview initial load requests `page_size=1000`
- reduce first-paint Sender Overview reads to a small bounded default page size appropriate for fast render
- preserve the existing artifact-backed sender workspace path
- add a defensive server-side clamp so oversized first-page requests cannot silently return 1000 sender rows unless explicitly intended for a separate non-default workflow
- preserve current expand/collapse, sorting, filtering, and sender-detail behavior after first paint

#### Constraints
- no reintroduction of request-time mailbox scans
- no `loadIndexedGmailMessagesForTenant(...)`
- no `loadDerivedWorkspaceState(...)`
- no `loadMailboxContext(...)`
- no broad UI redesign
- no changes to Mailbox Intelligence, Cleanup Groups, or Decision Mode in this phase

#### Acceptance Criteria
- Sender Overview first paint no longer requests 1000 sender rows by default
- first-paint page size is explicitly bounded and documented
- cold-open duration materially improves from the prior ~22s oversized artifact read
- request logs remain artifact-only
- existing acceptance harness continues to pass unchanged

---

### Phase G.9: Sender Overview Cluster Consistency + Total Truth Correction (New – Immediate Follow-Up)

**Goal:** Ensure Sender Overview and Decision Mode use consistent cluster selection and correct total sender counts across all surfaces.

#### Problem
- Sender Overview and Cleanup Groups can show inconsistent sender counts for the same cluster.
- Default selected cluster (e.g., Subscription senders) may resolve to an empty or incorrect state.
- Decision Mode can inherit incorrect or zeroed data when entered from a misresolved cluster.
- Logs indicate bounded artifact reads are correct, but total-count sources and cluster resolution paths are not aligned.

#### Requirements
- fix default selected-cluster resolution so Sender Overview lands on a valid populated cluster state
- ensure Sender Overview uses the correct source of truth for total sender counts (cluster summary/header, not bounded seed-row count)
- ensure Cleanup Groups → Sender Overview → Decision Mode all agree on:
  - selected cluster
  - sender counts
  - cluster identity
- preserve bounded first-paint reads and artifact-only request paths

#### Constraints
- no reintroduction of request-time mailbox scans
- no `loadIndexedGmailMessagesForTenant(...)`
- no `loadDerivedWorkspaceState(...)`
- no `loadMailboxContext(...)`
- no broad UI redesign
- no changes to Mailbox Intelligence or Pressure Trend in this phase

#### Acceptance Criteria
- default Sender Overview load shows a valid populated cluster (no zeroed Subscription group)
- Sender Overview sender totals match Cleanup Groups totals for the same cluster
- Decision Mode entered from a cluster shows consistent sender counts and data
- no mismatch like `1,238 vs 1,000` remains
- request logs remain artifact-only
- existing acceptance harness continues to pass unchanged

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