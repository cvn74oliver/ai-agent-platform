# Gmail Workspace Data Access Stabilization Acceptance

## What This Acceptance Pass Proves

The acceptance harness proves the stabilized Gmail Workspace sequence meets these guarantees for the validated fixture:

- Sender Overview cold open does not trigger `loadIndexedGmailMessagesForTenant(limit=100000)`
- Mailbox Intelligence cold open does not trigger a 100k indexed-row scan
- Cleanup Groups cold open does not trigger a 100k indexed-row scan
- `confirmation_preview` and archive-scope resolution do not use raw mailbox-row reads
- runtime shell request-time loading does not synchronously call `discoverGmailCleanupClustersForTenant(...)`
- runtime refresh remains artifact-backed and background-refresh-gated when `GMAIL_ARTIFACT_RUNTIME_BACKGROUND_REFRESH_ENABLED` is off

## Command

Run from [web](/Users/olivercarlin/Documents/ai-agent-platform/web):

```bash
npm run accept:gmail-workspace-data-access
```

To also write a machine-readable proof bundle:

```bash
PROOF_OUTPUT=../ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_workspace_data_access_stabilization_proof_bundle.json npm run accept:gmail-workspace-data-access
```

Optional fixture overrides:

```bash
GMAIL_ACCEPT_TENANT_ID=085c8ef7-2fd7-4842-8499-cd605e894a77 \
GMAIL_ACCEPT_ANALYSIS_SCOPE=all_indexed \
GMAIL_ACCEPT_AGENT_ID=d256b48e-5acf-4b3d-af22-003d52e7e582 \
npm run accept:gmail-workspace-data-access
```

This harness is intentionally locked to `analysis_scope=all_indexed`.

## Phase G Full-Mailbox Coverage Proof

Run the full-mailbox build proof from [web](/Users/olivercarlin/Documents/ai-agent-platform/web):

```bash
npm run build:gmail-full-mailbox-artifacts
```

To write the current machine-readable full-mailbox proof bundle:

```bash
PROOF_OUTPUT=../ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_workspace_full_mailbox_coverage_proof.json npm run build:gmail-full-mailbox-artifacts
```

The current validated proof bundle is:

- [gmail_workspace_full_mailbox_coverage_proof.json](/Users/olivercarlin/Documents/ai-agent-platform/ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_workspace_full_mailbox_coverage_proof.json)

Phase G is considered successful only when that proof shows:

- `processed_message_count = indexed_corpus_size`
- a newly published `published_version`
- non-zero row counts for sender workspace seeds, cluster summaries, mailbox intelligence snapshot/buckets, and preview index
- no `loadIndexedGmailMessagesForTenant(limit=100000)` in build logs

## Expected Success Signatures

Required request-path/runtime-path log fragments:

- Sender Overview:
  - `[integrations/gmail/sender-workspace-artifact]`
  - `"mode":"published_artifact"`
- Mailbox Intelligence:
  - `[integrations/gmail/mailbox-intelligence-artifact]`
  - `"mode":"published_artifact"`
- Cleanup Groups:
  - `[integrations/gmail/cleanup-group-intelligence]`
  - `"artifact_mode":"published_artifact"`
- Confirmation preview:
  - `[integrations/gmail/confirmation-preview-artifact]`
  - `"mode":"published_artifact"`
- Archive-scope resolution:
  - `[integrations/gmail/archive-scope-artifact]`
  - `"mode":"published_artifact"`
- Runtime shell:
  - `[playground][cleanup-runtime-artifact]`
  - `"artifact_mode":"published_artifact"`
- Runtime refresh flag-gating:
  - `[playground][cleanup-runtime-artifact]`
  - `"background_refresh_mode":"flag_disabled"`

Expected result invariants:

- Sender Overview returns `source = "gmail_index_cache"`
- Mailbox Intelligence returns `source = "gmail_index_cache"`
- Cleanup Groups returns `source = "gmail_index_cache"`
- `confirmation_preview.exact_archive_impact.message_count > 0`
- archive-scope `selectedCount` matches confirmation preview `exact_archive_impact.message_count`
- excluding one selected message id decreases archive-scope `selectedCount` by exactly `1`
- runtime shell returns cleanup clusters without synchronous rebuild
- manual runtime refresh reports `snapshotSaveMode = "background_enqueue_disabled"` when runtime background refresh is off

## Forbidden Signatures

The following log fragments must be absent from the acceptance run:

- `loadIndexedGmailMessagesForTenant(limit=100000)`
- `[integrations/gmail/mailbox-indexer/indexed-rows]`
- `[playground/cleanup-discovery]`
- `discoverGmailCleanupClustersForTenant(`
- `loadDerivedWorkspaceState(`
- `loadMailboxContext(`

## Default Flag Expectations

The acceptance harness asserts:

- `GMAIL_ARTIFACT_RUNTIME_BACKGROUND_REFRESH_ENABLED` is effectively off by default

It does not enable any artifact or runtime behavior flags itself.

## Interpretation

If the harness passes, the stabilized Gmail Workspace request-time surface for the validated fixture is operating under the intended contract:

- published artifact reads only
- safe partial artifact-derived behavior instead of request-time mailbox scans
- no synchronous runtime cleanup discovery rebuilds on page open
- background refresh remains optional and explicitly gated
