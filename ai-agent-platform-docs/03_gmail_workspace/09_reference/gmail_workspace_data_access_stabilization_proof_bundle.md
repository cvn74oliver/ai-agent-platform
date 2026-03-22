# Gmail Workspace Data Access Stabilization Proof Bundle

## Final Sequence Summary

This proof bundle summarizes the completed A-F stabilization sequence for Gmail Workspace data access.

Validated operating rule:

- request-time page-open/runtime flows use published artifacts or safe partial artifact-derived state only
- request-time flows do not synchronously rebuild mailbox intelligence or cleanup discovery
- optional runtime background refresh remains flag-gated and disabled by default

## Fixture

- tenant: `085c8ef7-2fd7-4842-8499-cd605e894a77`
- scope: `all_indexed`
- agent: `d256b48e-5acf-4b3d-af22-003d52e7e582`
- published artifact version used for final acceptance: `shadow-rollout-preview-exec-20260322123030100`

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
- Runtime shell now serves published artifacts or safe partial artifact-derived state only.

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

## Final Acceptance Targets

The final acceptance harness verifies:

- Sender Overview cold open has no `loadIndexedGmailMessagesForTenant(limit=100000)`
- Mailbox Intelligence cold open has no 100k scan
- Cleanup Groups cold open has no 100k scan
- confirmation preview and archive-scope resolution have no raw mailbox scan path
- runtime shell/page-open has no synchronous `discoverGmailCleanupClustersForTenant(...)`

## Remaining Operating Constraint

The stabilization guarantee is request-time safety, not autonomous republishing. If artifacts are stale or missing, runtime requests serve published artifacts or safe partial artifact-derived state and may only enqueue background refresh when the dedicated flag is enabled.
