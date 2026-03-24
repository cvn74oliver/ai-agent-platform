# Gmail Workspace Data Access Stabilization Proof Bundle

## Final Sequence Summary

This proof bundle summarizes the completed A-K stabilization sequence for Gmail Workspace data access.

Validated operating rule:

- request-time page-open/runtime flows use published artifacts only
- request-time flows do not synchronously rebuild mailbox intelligence, cleanup discovery, or mailbox-wide truth
- ingestion/sync drives background artifact refresh asynchronously
- incremental refresh is preferred when eligible and full rebuild is fallback-only
- browser/runtime surfaces reconcile to artifact-backed truth
- optional runtime background refresh remains flag-gated and disabled by default

## Fixture

- tenant: `085c8ef7-2fd7-4842-8499-cd605e894a77`
- scope: `all_indexed`
- agent: `d256b48e-5acf-4b3d-af22-003d52e7e582`
- proven incremental baseline: `incremental-20260324032902895`
- published full-build artifact used for final acceptance: `full-mailbox-20260324073149125`

## Pass-By-Pass Proof Summary

### Pass A

- Added additive artifact schema and publication/job scaffolding.
- Added artifact store/projector scaffolding and artifact flags.
- Kept all request-time behavior unchanged.

Key proof points:

- artifact tables exist in Supabase
- `gmail_sender_stats.first_seen` exists
- shadow publication scaffolding exists with read flags still off

### Pass A Rollout

- Applied Pass A migrations to the real Supabase project.
- Published a real shadow artifact version for `all_indexed`.

Key proof points:

- `gmail_artifact_publications` has a published version
- artifact seed/header/snapshot/summary/preview tables have live rows
- no request-time behavior changed during rollout

### Pass B

- Converted `sender_workspace` to artifact-only reads for `all_indexed`.
- Missing artifact behavior fails safe and never scans the mailbox.

Key proof points:

- Sender Overview cold open no longer logs `loadIndexedGmailMessagesForTenant(limit=100000)`
- request path no longer traverses `loadDerivedWorkspaceState(...)` or `loadMailboxContext(...)` for the stabilized scope

### Pass C

- Converted Mailbox Intelligence, Cleanup Groups, and mailbox pressure trend to artifact-only reads.
- Missing artifact behavior returns safe partial artifact-derived responses.

Key proof points:

- Mailbox Intelligence cold open shows artifact log signatures only
- Cleanup Groups cold open shows artifact log signatures only
- no 100k scan log appears in either cold-open path

### Pass D

- Converted `confirmation_preview` and archive-scope resolution to preview-index reads only.
- Published execution-complete preview refs for exact archive-scope resolution.

Key proof points:

- published execution-capable preview artifact version: `shadow-rollout-preview-exec-20260322123030100`
- `gmail_preview_index` contains `89,323` rows for that published version
- confirmation preview and archive-scope resolution no longer use raw mailbox-row reads

### Pass E

- Removed synchronous runtime cleanup discovery rebuilds from request-time runtime loading.
- Runtime shell now serves published artifacts or safe partial artifact-derived state only at this historical stage; later phases tighten the final architecture lock to published artifacts only.

Key proof points:

- runtime shell/page-open logs no longer show synchronous `discoverGmailCleanupClustersForTenant(...)`
- request-time runtime loading does not log `loadIndexedGmailMessagesForTenant(limit=100000)`
- runtime background refresh remains flag-gated and disabled by default

### Pass F

- Added a repeatable acceptance harness and rollout/acceptance documentation.
- Added a machine-readable proof-output option for repeatable acceptance runs.

Key proof points:

- `npm run accept:gmail-workspace-data-access` exercises the stabilized request/runtime surface directly
- the harness asserts required artifact log signatures and forbidden mailbox-scan/rebuild signatures
- the harness can emit a JSON proof bundle via `PROOF_OUTPUT=...`

### Phase G

- Published the full-mailbox artifact model as the Gmail Workspace source of truth.
- Removed the remaining browser/runtime mismatches across Cleanup Groups, Sender Overview, and Decision Mode.
- Bounded first paint and first-entry coverage truth were preserved under artifact-only reads.

Key proof points:

- Sender Overview, Cleanup Groups, and Decision Mode agree on Subscription and Dormant cluster truth
- request logs remain artifact-only during cold and warm clickthroughs
- no request-time recovery scan path was reintroduced while fixing browser reconciliation

### Phase H

- Added incremental artifact refresh after sync completion.
- New/updated/deleted indexed messages now drive targeted recompute of affected senders and impacted clusters only.

Key proof points:

- incremental publishes log `affected_sender_keys`, `impacted_cluster_ids`, `recomputed_sender_count`, and `recomputed_cluster_count`
- request-time readers continue serving the last published artifact while incremental publication runs side-by-side

### Phase I

- Added explicit artifact freshness states and sync-to-refresh integration.
- The system now records refresh intent, refresh strategy, and safe fallback behavior without requiring page loads to repair stale artifacts.

Key proof points:

- freshness states persist as `fresh`, `stale`, `refresh_pending`, `refresh_in_progress`, `refresh_failed`, `refresh_skipped`, and `full_rebuild_required`
- real sync proof showed `fresh -> stale -> refresh_pending -> refresh_in_progress -> fresh`

### Phase J

- Hardened major read paths and bounded the remaining scale-sensitive artifact queries.
- Measured and documented incremental publication and full-build fallback costs.

Key proof points:

- major request-time flows remained artifact-only while Mailbox Intelligence, Cleanup Groups, Sender Overview, and Decision Mode got materially faster
- no large request-time mailbox scan or unsafe offset-based recovery path was reintroduced

### Phase J.1

- Fixed full-build parity so fallback rebuilds now produce the same cluster truth as the proven incremental baseline.

Key proof points:

- direct parity compare returned `cluster_diff_count: 0`
- direct parity compare returned `sender_diff_count: 0`
- published full-build artifact matched Subscription and Dormant browser truth

### Phase J.2

- Hardened full-build retry/resume/recovery behavior and added explicit phase/progress observability.

Key proof points:

- long-running rebuilds now checkpoint sender-stream progress and finalize-stage progress
- retryable failures can resume the same `job_id` / `artifact_version` instead of replaying the entire build

### Phase K

- Locked Gmail Workspace as the canonical engine pattern for future workspaces.
- Documented allowed vs forbidden patterns, final freshness model, read/write/update architecture, and reuse guidance.

Key proof points:

- [gmail_workspace_canonical_engine_pattern.md](/Users/olivercarlin/Documents/ai-agent-platform/ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_workspace_canonical_engine_pattern.md) captures the permanent rules
- the final architecture lock keeps request-time scans forbidden and artifact-backed truth mandatory

## Final Acceptance Targets

The final acceptance harness verifies:

- Sender Overview cold open has no `loadIndexedGmailMessagesForTenant(limit=100000)`
- Mailbox Intelligence cold open has no 100k scan
- Cleanup Groups cold open has no 100k scan
- confirmation preview and archive-scope resolution have no raw mailbox scan path
- runtime shell/page-open has no synchronous `discoverGmailCleanupClustersForTenant(...)`

Final browser reconciliation proof verifies:

- Cleanup Groups, Sender Overview, and Decision Mode agree on Subscription counts
- Cleanup Groups, Sender Overview, and Decision Mode agree on Dormant counts
- Sender Overview first-entry coverage remains correct without a Decision Mode repair round trip
- Decision Mode reaches a real sender card for both verified clusters

## Remaining Operating Constraint

The stabilization guarantee is request-time safety, not request-time repair. If artifacts are stale, pending, in progress, failed, skipped, or marked full-rebuild-required, runtime requests continue serving the last safe published artifact and may only enqueue background refresh when the dedicated flag is enabled.
