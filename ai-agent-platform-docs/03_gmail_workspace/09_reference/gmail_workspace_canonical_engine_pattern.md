# Gmail Workspace Canonical Engine Pattern

Phase K locks Gmail Workspace as the canonical data-access pattern for this platform.

This is the permanent rule set for Gmail Workspace and the reference implementation future workspaces must follow.

## Non-Negotiable Rules

- Request-time Gmail Workspace flows must read the current `published_version` only.
- Request-time page opens must never repair missing/stale data by scanning the mailbox.
- Ingestion and Smart Sync drive artifact refresh asynchronously after sync completion.
- Incremental refresh is the default path when eligibility checks pass.
- Full rebuild is fallback-only and must preserve parity with the proven incremental truth for the same mailbox state.
- Browser/runtime state may cache or defer artifact-backed truth, but it must never replace artifact-backed truth with ad hoc mailbox-derived state.
- Side-by-side publication is mandatory: build a new version, validate it, then flip the published pointer.
- While refresh is pending, in progress, failed, skipped, or marked full-rebuild-required, request paths must continue serving the last safe published artifact.

## Canonical Read/Write Model

### 1. Ingest / Index

- Gmail sync writes normalized mailbox rows into the indexed mailbox store.
- Incremental sync emits an `artifact_refresh_hint` describing changed messages and affected sender keys.
- Sync completion records mailbox index state and then schedules artifact refresh work in the background.

### 2. Decide Refresh Strategy

Incremental refresh is allowed only when all of the following are true:

- a published baseline exists
- the sync completed in incremental mode
- no fallback full scan was used
- sync did not finish as `incremental_sync_degraded`
- a refresh hint exists
- the hint contains changed messages and affected sender keys
- the delta stays within the implemented thresholds:
  - `changed_messages <= 2000`
  - `affected_sender_keys <= 500`

Full rebuild is required when any of the following are true:

- no published baseline exists
- sync mode was non-incremental
- operator backfill completed
- fallback full scan was used
- integrity is uncertain
- incremental sync degraded
- refresh hint is missing
- incremental delta exceeds thresholds

### 3. Build Artifacts Side-by-Side

- Incremental refresh recomputes only affected senders/clusters and merges them into a new version.
- Full rebuild streams the indexed mailbox by sender into a new `building_version`.
- Full rebuild uses stable artifact reference time and published-seed precedence so unchanged senders preserve parity with the proven incremental truth.
- Long-running full rebuilds checkpoint:
  - sender-stream progress
  - finalize stage progress
  - completed finalize write stages

### 4. Validate and Publish

- New artifact versions are published only after finalize/consistency checks complete.
- `published_version` remains unchanged during build, retry, and recovery.
- If a full rebuild fails after finalize, the runner retries on the same job/version and resumes from stored checkpoints.

### 5. Serve at Request Time

For stabilized Gmail Workspace routes:

- `cleanup_group_intelligence`
- `sender_workspace`
- `mailbox_intelligence`
- `confirmation_preview`
- archive-scope resolution
- runtime/rehydrate cleanup state

request-time behavior is:

- read the current published artifact family
- use bounded/keyset reads only
- return artifact-backed truth to browser/runtime
- never trigger mailbox-wide recompute on request

## Freshness State Model

The persisted freshness states are:

- `fresh`
- `stale`
- `refresh_pending`
- `refresh_in_progress`
- `refresh_failed`
- `refresh_skipped`
- `full_rebuild_required`

Operational meaning:

- `fresh`: published artifact matches the indexed state that should be served
- `stale`: sync completed and a refresh is required, but published truth is still the last safe version
- `refresh_pending`: a refresh decision was made and background work should start
- `refresh_in_progress`: a build is actively producing a new side-by-side version
- `refresh_failed`: the newest refresh attempt failed; keep serving the prior published version
- `refresh_skipped`: no eligible delta or a competing build prevented starting a new refresh
- `full_rebuild_required`: incremental refresh is not safe/eligible; fallback rebuild is required

## Browser / Runtime Consumption Rules

- Sender Overview, Cleanup Groups, Decision Mode, and runtime shell must read artifact-backed cluster truth, not recomputed mailbox truth.
- Browser/runtime snapshots may be reused only when they are compatible with the current artifact version/freshness context.
- Cluster-global totals must come from artifact summaries/snapshots, not from bounded loaded rows such as `workspace.senders.length`.
- Decision Mode queue state must preserve parity with the same artifact-backed cluster truth used by Sender Overview and Cleanup Groups.

## Allowed Patterns

- Add new artifact families that are built asynchronously and published side-by-side.
- Add bounded request-time readers over published artifacts.
- Add new incremental recompute slices that are keyed by changed entities.
- Add freshness/observability fields that improve operational clarity without changing request-time truth sources.
- Reuse Gmail Workspace as the reference pattern for future workspaces:
  - ingest
  - derive
  - persist
  - publish
  - serve

## Forbidden Patterns

- Reintroducing `loadIndexedGmailMessagesForTenant(...)` into request-time Gmail Workspace flows.
- Reintroducing `loadDerivedWorkspaceState(...)` into request-time Gmail Workspace flows.
- Reintroducing `loadMailboxContext(...)` into request-time Gmail Workspace flows.
- Any request-time mailbox-wide scan or request-time “repair” scan.
- Triggering sync, sender-stats recompute, cleanup discovery rebuild, or full artifact rebuild because a page was opened.
- Reading cluster-global totals from bounded page rows, runtime preload counts, or other partial client state.
- Publishing a partially-written `building_version`.
- Replacing artifact truth with browser-only arithmetic when artifact summary/snapshot truth exists.
- Treating full rebuild as a different truth model from incremental publication.

## Common Regression Patterns To Avoid

- Adding a “temporary fallback” that loads raw mailbox rows on request.
- Treating stale runtime cache as authoritative after artifact publication changes.
- Computing `managed already`, `still to review`, `covered senders`, or queue totals from only the loaded sender page.
- Using large `OFFSET` request paths where keyset/bounded artifact reads already exist.
- Expanding runtime bootstrap to synchronously regenerate cleanup state during ordinary navigation.

## Reuse Guidance For Future Workspaces

Future workspaces should copy the Gmail Workspace pattern, not invent a new request-time derivation model.

Required shape:

1. Ingest source data into an indexed store.
2. Derive view-model artifacts in background jobs.
3. Publish immutable versioned artifacts side-by-side.
4. Serve only published artifacts at request time.
5. Drive updates from ingestion/sync events, not page loads.
6. Persist freshness and build state explicitly.
7. Keep browser/runtime reconciliation pinned to artifact-backed truth.

## Final Stabilization Proof Summary

The Gmail Workspace stabilization sequence established:

- request-time scan removal across stabilized Gmail Workspace flows
- full-mailbox artifact production as the source of truth
- browser reconciliation across Cleanup Groups, Sender Overview, and Decision Mode
- incremental artifact refresh after sync completion
- explicit freshness states and sync integration
- full-build parity with the proven incremental baseline
- full-build retry/resume/recovery hardening
- unchanged acceptance harness coverage with artifact-only log proof

Current final proof anchors:

- proven incremental baseline: `incremental-20260324032902895`
- final published full-build artifact: `full-mailbox-20260324073149125`
- direct parity proof: `cluster_diff_count: 0`, `sender_diff_count: 0`
- unchanged acceptance harness: `ok: true` on `full-mailbox-20260324073149125`

