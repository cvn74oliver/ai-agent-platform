# Gmail Workspace Data Access Stabilization Rollout

## Guarantee

The stabilized Gmail Workspace read architecture guarantees:

- no synchronous rebuilds on request-time page open
- request-time Gmail Workspace flows read the current published artifact only
- ingestion/sync drives background artifact refresh asynchronously
- optional runtime background refresh remains flag-gated and is not enabled by default

This rollout does not change cleanup truth semantics. It changes when and how mailbox-derived computation is performed:

- request-time readers consume published artifacts only for stabilized flows
- mailbox-wide recompute remains background-only and side-by-side
- request paths never escalate to `loadIndexedGmailMessagesForTenant(limit=100000)` as a recovery path

## Rollout Order

1. Pass A

- apply additive artifact schema
- add artifact publication scaffolding, store/projector scaffolding, and flags
- keep all artifact read flags off

2. Pass A rollout

- apply migrations to the real Supabase project
- publish a real shadow artifact version for `tenant_id=085c8ef7-2fd7-4842-8499-cd605e894a77`, `analysis_scope=all_indexed`
- confirm artifact rows exist before any read-path cutover

3. Pass B

- cut `sender_workspace` to artifact-only reads for `all_indexed`
- missing artifact behavior stays safe partial or last published artifact only

4. Pass C

- cut `mailbox_intelligence`, `cleanup_group_intelligence`, and `mailbox_pressure_trend` to artifact-only reads

5. Pass D

- cut `confirmation_preview` and archive-scope resolution to preview-index reads only
- preserve exact message-id behavior without live mailbox-row reads

6. Pass E

- remove synchronous runtime cleanup discovery rebuilds from request-time runtime loading
- runtime shell serves published artifacts or safe partial artifact-derived state only at this stage; later phases tighten the final lock to published artifacts only
- background refresh remains flag-gated through `GMAIL_ARTIFACT_RUNTIME_BACKGROUND_REFRESH_ENABLED`

7. Pass F

- add repeatable acceptance tooling
- document rollout, acceptance, and proof expectations
- produce a final proof bundle for the stabilized sequence

8. Phase G

- run `npm run build:gmail-full-mailbox-artifacts` from [web](/Users/olivercarlin/Documents/ai-agent-platform/web)
- allow the background projector to stream the full indexed mailbox by sender into an isolated `building_version`
- if a long-running build is interrupted, resume with `GMAIL_FULL_BUILD_RESUME_JOB_ID=<job_id> npm run build:gmail-full-mailbox-artifacts`
- publish only after full-corpus projection, finalize, and row-count proof succeed
- keep request-time readers on the previous `published_version` until the new full-mailbox version is published

## Required Preconditions

- no active long-running mailbox indexing, backfill, or manual regeneration run when schema or artifact writer contracts are being changed
- `gmail_artifact_publications.published_version` exists for the served tenant/scope before enabling any artifact read path
- artifact read flags stay scoped to the intended tenant/scope while validating the rollout

## Runtime Safety Notes

- Request-time Gmail Workspace flows are safe only if they serve published artifacts.
- Runtime background refresh is intentionally optional and disabled by default.
- A request-time refresh intent may enqueue background work if the flag is enabled, but it must not await or perform synchronous discovery rebuilds.

## Final Locked Operating Model

Phase K locks Gmail Workspace as the canonical engine pattern for future workspaces.

Permanent rules:

- request-time flows read the current `published_version` only
- sync completion records freshness and triggers async artifact refresh
- incremental refresh is preferred when eligible
- full rebuild is fallback-only and must preserve parity with the proven incremental truth
- browser/runtime surfaces must consume artifact-backed cluster truth, not ad hoc mailbox-derived state
- last safe published artifact remains served during `stale`, `refresh_pending`, `refresh_in_progress`, `refresh_failed`, `refresh_skipped`, and `full_rebuild_required`

Canonical references:

- [gmail_workspace_canonical_engine_pattern.md](/Users/olivercarlin/Documents/ai-agent-platform/ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_workspace_canonical_engine_pattern.md)
- [gmail_workspace_data_access_stabilization_proof_bundle.md](/Users/olivercarlin/Documents/ai-agent-platform/ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_workspace_data_access_stabilization_proof_bundle.md)

## Current Validation Fixture

- tenant: `085c8ef7-2fd7-4842-8499-cd605e894a77`
- scope: `all_indexed`
- agent: `d256b48e-5acf-4b3d-af22-003d52e7e582`
- proven incremental baseline: `incremental-20260324032902895`
- published full-build artifact version: `full-mailbox-20260324073149125`
- parity proof: `cluster_diff_count: 0`, `sender_diff_count: 0`
- unchanged acceptance harness: `ok: true` on `full-mailbox-20260324073149125`
- final stabilization proof bundle: [gmail_workspace_data_access_stabilization_proof_bundle.md](/Users/olivercarlin/Documents/ai-agent-platform/ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_workspace_data_access_stabilization_proof_bundle.md)

## Rollback Guidance

- keep the additive artifact schema in place
- keep `runtime_background_refresh` disabled by default
- if a regression is found, disable the relevant artifact read gate or scope allowlist
- do not restore request-time mailbox scans as an emergency fallback
- continue serving the last published artifact or safe partial state until a corrected artifact version is published
