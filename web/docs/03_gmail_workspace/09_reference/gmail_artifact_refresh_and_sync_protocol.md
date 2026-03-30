

# Gmail Artifact Refresh and Sync Protocol

## Purpose

This document defines how Gmail mailbox data, artifacts, snapshots, and UI invalidation should work during the current build phase and in the intended production model.

It exists to answer four practical questions:
1. What happens right now when Smart Sync is pressed?
2. How should new Gmail data flow into the system?
3. When do artifacts and request-time views refresh?
4. What follow-on implementation threads are required to complete the protocol?

This document is the source-of-truth reference for the Gmail workspace sync/refresh loop until a more formal automation layer replaces the current manual controls.

---

## Executive Summary

### Recommended current operator model

For the current build phase, **Smart Sync should be the single operator button** for mailbox freshness.

When the operator presses **Smart Sync**, the intended contract is:
1. Run mailbox incremental sync.
2. Detect whether newly indexed mailbox data makes the current artifact stale.
3. Trigger the appropriate artifact refresh path automatically.
4. Publish the refreshed artifact when complete.
5. Invalidate or refresh the runtime/UI surfaces so charts, cleanup groups, sender overview, and decision flows read the newly published artifact.

### Recommended operating mode right now

Use **Option 1: Smart Sync automatically triggers artifact refresh and UI invalidation**.

Reason:
- It keeps the operator workflow simple.
- It reduces human error while testing.
- It matches the long-term production mental model.
- It avoids creating a two-button ritual where users have to remember a second refresh step after syncing.

---

## Current Build-Phase Reality

At the current stage of development, the system is moving toward the one-button model, but the path has recently required stabilization work.

### What Smart Sync is supposed to do now

When Smart Sync is pressed during the current build phase, it should:
- sync new Gmail mailbox activity into the mailbox index
- advance indexed coverage forward to the newest available mail history
- evaluate whether the currently published artifact is stale relative to the newly indexed mailbox state
- run the required artifact refresh path
- publish a newer artifact version
- make the newer artifact available to request-time readers and UI surfaces

### What “up to date” should mean during testing

After a successful Smart Sync:
- mailbox index coverage should extend through the newest available mail activity
- artifact freshness should no longer be stranded behind an orphaned build lock
- the latest published artifact should become the request-time truth
- artifact-backed charts and cleanup-group views should read from the refreshed artifact version

### Important note

Smart Sync is **not** intended to require a full mailbox rebuild every time.

The target behavior is:
- incremental mailbox sync as the normal path
- incremental artifact refresh whenever eligible
- full artifact rebuild only when required by contract, repair, schema migration, or invalidation conditions

---

## Canonical Data Flow

## 1. Mailbox ingestion layer

The Gmail mailbox index is the canonical raw-mailbox layer.

Responsibilities:
- store indexed Gmail message metadata
- maintain mailbox coverage state
- track full scan vs incremental sync state
- expose the latest known mailbox freshness window

This layer answers:
- what mail exists
- what time range is indexed
- whether new mail has arrived since the last artifact publication

## 2. Artifact layer

The artifact layer is the canonical precomputed analysis layer.

Responsibilities:
- transform indexed mailbox data into cleanup groups, rails, charts, summaries, and review-support structures
- publish stable request-time versions
- isolate runtime readers from expensive rebuild logic
- support incremental publication when the mailbox changes

This layer answers:
- what the current published Gmail workspace truth is
- which cleanup groups, charts, and summaries the UI should render
- what request-time readers should use without recomputing the whole world

## 3. Runtime/UI layer

The runtime/UI layer should consume the latest published artifact truth.

Responsibilities:
- render the current published artifact version
- invalidate stale local state when a newer artifact is published
- avoid mixing stale hydrated packages with newer artifact-backed surfaces
- present operator-facing pages using the freshest safe published version

This layer answers:
- what the operator sees now
- whether the charts and cleanup groups reflect the latest published artifact

---

## Current Recommended Protocol

## Smart Sync protocol

### Operator action
The operator presses **Smart Sync**.

### System sequence
1. Start mailbox incremental sync.
2. Pull in newly available Gmail changes.
3. Update mailbox index coverage and indexed row counts.
4. Compare mailbox freshness against the currently published artifact.
5. If no artifact refresh is needed, keep the published artifact and return success.
6. If artifact refresh is needed, automatically trigger the correct refresh path.
7. Publish the refreshed artifact version.
8. Mark runtime/UI surfaces as stale and reload them against the newest published artifact.

### Expected operator result
After Smart Sync finishes successfully:
- mailbox index is current
- artifact freshness is current
- charts and cleanup-group pages can read the latest published artifact
- the operator should not need to press a separate artifact-refresh button

---

## Artifact Refresh Decision Rules

The normal artifact refresh decision should follow this order:

### Incremental refresh
Use incremental artifact refresh when:
- mailbox sync produced a bounded delta
- no schema-breaking rebuild is required
- the existing artifact can be safely advanced from the newly indexed delta

### Full artifact rebuild
Use a full artifact rebuild when:
- no safe incremental path exists
- artifact schema changed
- projection logic changed in a way that invalidates prior artifact shape
- artifact state is missing, corrupted, or stale beyond safe repair
- recovery logic determines a full rebuild is the correct repair path

### Never use a full rebuild as the default for ordinary new mail
New daily or hourly email activity should normally flow through:
- mailbox incremental sync
- artifact incremental refresh
- publish new artifact version

---

## UI Invalidation Contract

When a newer artifact version is published, the UI/runtime layer must stop serving stale derived truth.

### Minimum invalidation contract
On publish of a newer artifact version:
- invalidate artifact-backed cached runtime surfaces
- invalidate stale cleanup-group and sender-overview packages
- invalidate chart packages tied to the prior published version
- force subsequent page reads to use the new published artifact version

### Required user-visible result
When the operator next opens or refreshes:
- Cleanup Groups
- Sender Overview
- Decision Mode support surfaces
- Analysis Rail
- sender distribution chart surfaces

the app should read the latest published artifact version rather than old hydrated packages.

---

## Production Target Model

In production, the system should move from manual sync to a mostly automatic cadence.

### Target production cadence
- mailbox incremental sync: frequent / near-real-time cadence
- artifact incremental refresh: automatically triggered when mailbox freshness crosses the stale threshold
- UI invalidation: immediate after new artifact publish

### Reasonable production target
A practical production target is:
- mailbox sync: near real-time or frequent scheduled cadence
- artifact refresh: event-driven or short-interval scheduled refresh
- full rebuild: exception path only

### Conceptual principle
The production app should behave like this:
- new email arrives
- mailbox index advances
- artifact refresh runs automatically when needed
- newer published artifact becomes request-time truth
- UI reads the new truth without operator babysitting

---

## Current Build-Phase Operator Guidance

Until full automation is completed, the operator workflow should be:

### Recommended manual workflow
1. Press **Smart Sync**.
2. Wait for sync + artifact refresh path to finish.
3. Refresh or reopen the relevant workspace page if needed.
4. Verify that the current published artifact/version-dependent views reflect the newest state.

### What should not be required
The operator should not have to remember:
- a second hidden “artifact refresh” ritual
- a separate rebuild button for ordinary freshness
- a manual full rebuild for routine incoming mail

---

## Known Risks / Failure Modes

### 1. Orphaned artifact build state
A stale `building_version` or `refresh_in_progress` can block new refresh attempts unless liveness reconciliation reclaims it safely.

### 2. Stale hydrated runtime packages
A newer artifact may publish successfully, but the review page or chart layer can still render older hydrated/current-scope packages if invalidation is incomplete.

### 3. Incremental sync without artifact advancement
Mailbox data can be current while charts and cleanup groups still reflect an older artifact if refresh logic does not trigger or publish correctly.

### 4. Request-time readers serving old artifact truth
If `published_version` does not advance, the UI will continue reading outdated analysis even though mailbox data exists.

### 5. One-week chart ambiguity
A 7-day chart can legitimately show no data if there is no activity in the current 7-day scoped truth. This must be distinguished from a true sync/refresh bug.

---

## Practical Interpretation Of One-Week Gaps

If the one-week view shows no data, there are two possibilities:

### Valid truth
There truly is no qualifying activity in the last 7 days for that cleanup group.

### Invalid stale state
The mailbox index or artifact publish is behind current mail activity, so the chart is reading older truth.

### Required debugging order
When a one-week view looks empty:
1. verify mailbox index coverage reaches the present
2. verify Smart Sync completed successfully
3. verify a fresh artifact version was published after the sync
4. verify the UI is reading that newer published artifact
5. only then decide whether the empty 7-day view is true data or a bug

---

## Implementation Principles

### 1. One-button operator workflow
The build should favor a single operator action wherever possible.

### 2. Incremental first
New mail should normally advance through incremental sync and incremental artifact refresh.

### 3. Full rebuild by exception
Full rebuilds are repair or migration paths, not routine refresh behavior.

### 4. Published artifact is request-time truth
The UI should always prefer the latest published artifact over stale in-memory or hydrated packages.

### 5. Framework-first design
This protocol is Gmail-first today, but the architecture should generalize to future workspaces where:
- the raw-ingestion layer differs
- the artifact layer differs
- the decision charts differ
- the operator workflow still depends on fresh published derived truth

---

## Immediate Follow-On Threads

These should be tracked as separate implementation lanes:

### 1. Fixed 7-day Sender Overview Rails thread
Purpose:
- determine whether the 7-day view is true no-data or stale artifact/UI truth
- ensure daily granularity behaves correctly when valid 7-day activity exists

### 2. Sender Distribution Chart data correction and UI build thread
Purpose:
- create the sender-ranking chart
- support ranking senders by volume across selected time windows
- establish transferable chart patterns for future workspaces

### 3. Chart-to-workspace filter handoff thread
Purpose:
- when an operator clicks a chart segment or timeframe bucket, automatically create the corresponding session-scoped filtered review/workspace lane below
- keep chart interaction tied directly to decision-making workflow

---

## Suggested Future Documentation Map

This document should remain the sync/refresh protocol reference.

Related future documents may include:
- sender_distribution_chart_spec.md
- chart_to_workspace_handoff_spec.md
- sender_overview_rail_interaction_spec.md
- production_sync_automation_spec.md

---

## Current Recommendation

For now, the project should proceed with this rule:

**Pressing Smart Sync should automatically trigger mailbox sync, artifact refresh decisioning, artifact publication, and UI invalidation.**

That is the correct build-phase and production-direction contract.

---

## Open Questions To Resolve Later

1. What exact stale threshold should trigger automatic artifact refresh in production?
2. What cadence should production incremental sync run on when event-driven push is unavailable?
3. Which runtime surfaces should hard-reload immediately versus soft-invalidate on next view?
4. When should the app escalate from incremental refresh to full rebuild automatically?
5. How should non-Gmail workspaces map their own ingestion/artifact/decision layers onto this same contract?