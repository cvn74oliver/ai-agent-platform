# ARTIFACT_REBUILD_PLAN

## Purpose

This is the authoritative rebuild-planning document for Gmail artifacts.

Rules:
- Define rebuild scope here before any rebuild is executed.
- Keep rebuilds deliberate, narrow, and bundled only when the issues share the same artifact stage.
- Do not use `/web/docs` as the source of truth.

Current accepted Gmail Phase 1 baseline:
- `full-mailbox-20260327004328180`

---

## Rebuild A - Structural Preview Seeding Fix

### Status

- `implemented`
- `rebuilt`
- `validated`
- `published_version: full-mailbox-20260326221425010`

### Execution Result

- Rebuild A completed successfully and published:
  - `full-mailbox-20260326221425010`
- Sender validation:
  - `oliver@curativemushrooms.com` now preview-ready with `5` seeded preview message ids and truthful `cleanup_group_message_count: 8003`
  - `support@curativemushrooms.com` now preview-ready with `5` seeded preview message ids and truthful `cleanup_group_message_count: 4631`
  - `consumer@e.mail.realtor.com` remained healthy
  - `seaworld@m.seaworldparks.com` remained healthy
- Cluster validation:
  - `protected-trusted-senders`: `9/9` structural `no_inbox_rows` senders preview-ready
  - `historical-out-of-inbox-senders`: `34/34` structural `no_inbox_rows` senders preview-ready
- Guardrail result:
  - bounded preview seeding did not collapse structural sender totals
  - the downstream archive-scope seam was corrected before rebuild execution

### Problem

Some structural senders can have very large indexed totals but zero previewable evidence.

Confirmed class:
- structural senders with `cleanup_exclusion_reason = no_inbox_rows`

Observed examples:
- `oliver@curativemushrooms.com`
- `support@curativemushrooms.com`

Current bad outcome:
- `total_message_count` is large
- `preview_ready = false`
- `preview_message_ids = []`
- Decision Mode has no previewable evidence

### Root Cause

Artifact counts and structural assignment use:
- `scopedRows`

Preview seeding currently uses:
- `scopedInboxRows`

That mismatch means a sender can be structurally present in the artifact with thousands of indexed rows, but still seed zero preview evidence if `scopedInboxRows.length === 0`.

### Scope

Rebuild A is limited to preview seeding for structural `no_inbox_rows` senders.

Do not include:
- taxonomy changes
- cleanup-group changes
- UI changes
- schema changes
- semantic subtype persistence
- broader runtime performance work

### Bounded Preview-Selection Policy

This policy applies in both:
- full projector
- incremental projector

Trigger condition:
- sender is structurally assigned
- `scopedInboxRows.length === 0`
- candidate pool comes from `scopedRows`

Selection policy:
1. Sort candidates by recency descending using message timestamp.
2. Require a valid `message_id`.
3. Prefer rows with visible evidence fields when present.
   - prefer non-empty subject
   - if the source row exposes snippet-like preview text, prefer non-empty preview text
4. Exclude rows that are clearly empty when that can be determined from available fields.
5. If exclusions would empty the pool, fall back to the most recent valid-message-id rows.
6. Cap seeded preview candidates at `5` messages per sender.

Bounded-growth rule:
- Do not write unbounded preview-index rows for this structural fallback path.
- The fallback preview-index footprint for each affected sender is capped at `5`.

### Important Product Boundary

The bounded seed cap is an **artifact seeding limit**, not the final user-facing evidence exploration limit.

Meaning:
- Rebuild A guarantees a minimum evidence sample for affected structural senders.
- It does **not** mean Decision Mode should permanently limit users to only `5` messages.
- Deeper evidence exploration (for example, "load more" or semantic-group-specific evidence browsing) is a separate later lane and is **not** part of Rebuild A.

Seed-row rule:
- `preview_message_ids` must be written from the same bounded selected set.
- `preview_ready` becomes `true` when the bounded selected set is non-empty.

Count-truth guardrail:
- The bounded preview cap must not redefine sender totals.
- `total_message_count` remains rollup-backed.
- `cleanup_candidate_message_count` remains rollup-backed.
- `cleanup_group_message_count` must remain truthful for the sender and must not silently collapse to the bounded preview-row count.

Important supporting validation:
- Any downstream path that currently assumes `preview_index_row_count === cleanup_group_message_count` for these structural senders must be verified before rebuild execution.
- If that assumption blocks bounded structural preview seeding, the minimal supporting correction belongs inside Rebuild A because it is directly caused by the bounded preview policy.

### Required Code Areas

- [gmailArtifactFullMailboxProjector.ts](/Users/olivercarlin/Documents/ai-agent-platform/web/src/lib/integrations/gmail/gmailArtifactFullMailboxProjector.ts)
  - full-build sender projection
  - bounded structural preview candidate selection
  - seed finalize for `preview_message_ids` and `preview_ready`
- [gmailArtifactFullMailboxProjector.ts](/Users/olivercarlin/Documents/ai-agent-platform/web/src/lib/integrations/gmail/gmailArtifactFullMailboxProjector.ts)
  - `projectGmailSenderArtifactSlice(...)` incremental parity path
- [gmailArtifactIncrementalUpdater.ts](/Users/olivercarlin/Documents/ai-agent-platform/web/src/lib/integrations/gmail/gmailArtifactIncrementalUpdater.ts)
  - parity validation for the incremental path

Read-only dependency/input:
- [inboxAnalysis.ts](/Users/olivercarlin/Documents/ai-agent-platform/web/src/lib/integrations/gmail/inboxAnalysis.ts)
  - structural `no_inbox_rows` / protected / historical assignment signals

No schema changes expected in:
- [gmailArtifactStore.ts](/Users/olivercarlin/Documents/ai-agent-platform/web/src/lib/integrations/gmail/gmailArtifactStore.ts)

### Validation Targets

Required sender checks:
- `oliver@curativemushrooms.com`
- `support@curativemushrooms.com`
- `consumer@e.mail.realtor.com`
- `seaworld@m.seaworldparks.com`

Required cluster checks:
- `protected-trusted-senders`
- `historical-out-of-inbox-senders`

Required outcomes:
- affected structural `no_inbox_rows` senders no longer default to zero preview evidence when valid scoped rows exist
- full-build and incremental outputs stay aligned
- bounded preview selection does not distort sender totals
- no unrelated taxonomy, cleanup-group, or UI behavior changes are introduced

---

## Rebuild B - Semantic Focus Performance

### Status

- `implemented`
- `rebuilt`
- `validated`
- `published_version: full-mailbox-20260327004328180`

### Execution Result

- Hosted Supabase migration applied:
  - `20260327101500_gmail_sender_workspace_semantic_focus_seed_rows.sql`
- Rebuild B completed successfully and published:
  - `full-mailbox-20260327004328180`
- Focused semantic fast-path activation validated on rebuilt artifacts:
  - `read_shape: focused_semantic_page`
  - `protected-trusted-senders` cluster count preserved at `1838`
  - focused counts preserved:
    - `commerce_transactional / invoices_receipts = 167`
    - `commerce_transactional / commerce_shipping_updates = 206`
    - `account_notification / general_updates = 229`
    - `account_notification / remainder = 299`
- Cold focused-load improvement validated:
  - previous corrected fallback baseline: ~`20s–26s`
  - rebuilt fast path: ~`2.3s–2.7s`
- Focused page-scoped load behavior validated:
  - `seed_row_count: 12`
  - `stats_count: 12`
  - `preview_row_count: 60`

### What Landed

- Queryable sender-level semantic membership now persists on `gmail_sender_workspace_seed_rows`
- `last_activity_at` persists on seed rows for focused sorting
- Full-build and incremental projector paths share the same semantic persistence helper path
- Runtime uses `focused_semantic_page` for supported semantic-focus request shapes
- Older artifacts and unsupported request shapes still fall back safely to `full_cluster_materialization`

---

## Pressure Trend - Classification

### Classification

- `artifact_backed`
- `no_rebuild_needed`
- `not_in_rebuild_a`

### Why

Pressure Trend is already on an artifact-backed request path.

Authoritative references:
- [gmail_workspace_data_access_stabilization_spec.md](/Users/olivercarlin/Documents/ai-agent-platform/ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_workspace_data_access_stabilization_spec.md)
  - Phase C moved `mailbox_pressure_trend` to artifact-backed reads
  - Phase G.6 added window-specific artifact bucket families
  - Phase G.7 verified render/consumption
- [gmail_workspace_data_access_stabilization_proof_bundle.md](/Users/olivercarlin/Documents/ai-agent-platform/ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_workspace_data_access_stabilization_proof_bundle.md)
  - pressure trend was included in the artifact-only request-path stabilization proof

Current runtime/code path:
- [gmailPressureTrendArtifacts.ts](/Users/olivercarlin/Documents/ai-agent-platform/web/src/lib/integrations/gmail/gmailPressureTrendArtifacts.ts)
  - artifact bucket-family selection by window
- [gmailCleanupWorkspace.ts](/Users/olivercarlin/Documents/ai-agent-platform/web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts)
  - `loadGmailPressureTrendForTenant(...)` reads published mailbox intelligence artifacts
- [inbox-analysis/route.ts](/Users/olivercarlin/Documents/ai-agent-platform/web/src/app/api/integrations/gmail/inbox-analysis/route.ts)
  - `mailbox_pressure_trend` routes to the artifact-backed loader

Conclusion:
- Pressure Trend should stay out of Rebuild A.
- No rebuild work is currently required for Pressure Trend classification alone.
- Only reopen it if a separate render/consumption bug appears.

---

## Deferred / Not Bundled

Do not bundle into Rebuild A:
- cleanup-group redesign
- taxonomy changes
- richer Sender Overview artifact exposure
- semantic redistribution work
- Management changes
- UI redesign
- runtime-only performance work unrelated to structural preview seeding
- deeper Decision Mode evidence expansion UX (for example, "load more", progressive reveal, or semantic-group-specific evidence browsing)

---

## Future Lane - Decision Mode Evidence Expansion

### Classification

- `deferred`
- `separate_product_lane`
- `not_in_rebuild_a`

### Why

Rebuild A solves **minimum evidence availability** for structural `no_inbox_rows` senders.

It does **not** define the final user-facing evidence browsing model.

Future work may include:
- progressive reveal (`load more`)
- bounded runtime expansion beyond the seeded artifact sample
- semantic-group-specific evidence buckets inside Decision Mode

This lane must be designed separately so Rebuild A stays narrow and rebuild-safe.

---

## Execution Order

1. Lock this rebuild plan document.
2. Finish Rebuild A implementation and preflight seams.
3. Run one rebuild.
4. Validate Rebuild A targets.
5. Update authoritative state docs.
6. Continue product/runtime work in parallel.
7. Revisit Rebuild B only in a later dedicated design pass.
8. Revisit Decision Mode Evidence Expansion in a separate product lane.

---

## Key Rule

One clean rebuild is better than repeated narrow rebuild churn.

Do not expand Rebuild A after implementation begins.
