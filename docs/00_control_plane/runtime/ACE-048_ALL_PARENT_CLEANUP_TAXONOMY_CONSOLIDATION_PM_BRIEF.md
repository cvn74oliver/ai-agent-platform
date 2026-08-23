# ACE-048 All-Parent Cleanup Taxonomy Consolidation PM Brief

Status: FRAMEWORK-FIRST EXTRACTION VERIFIED — AWAITING SEPARATE REBUILD DECISION
Owner: Project Manager
Governing event: ACE-048
Mode: approved Plan -> Execution continuation
Execution mode: `transitional_self_verification`
Reasoning: HIGH

## Executive summary

- What is changing: consolidate the preserved cleanup-taxonomy and sender-distribution lineages into one main-derived candidate with one bounded child layer for every actionable cleanup parent.
- What Oliver will get: intuitive parent cards that open only exact, mutually exclusive child queues, with no broad-parent escape and exact counts across Cleanup Groups, sender rows, charts, Time Context, and Decision Mode.
- Why it matters: the active hybrid cannot be accepted, and the current April publication must remain safe while a replacement contract is built and verified without live mailbox or publication pressure.

## Objective

Implement a materialized review-unit membership contract, generic child-only Cleanup Groups runtime, stable review-unit routing, exact count validation, Decision Mode return-state correction, and later sender-distribution/Pressure Trend integration. Stop before any long semantic-artifact candidate build until Oliver gives a separate explicit approval.

## Framework-first boundary — added 2026-08-23

Oliver confirmed that Automata is an AI agent platform and Gmail is only the first reference adapter. The pre-rebuild audit found that the behavioral contract is reusable, but the current materializer still binds partition policy, entity fields, labels, IDs, and validation types directly to Gmail sender types. Therefore the live migration and candidate build remain blocked.

Required correction before rebuild:

- Extract a domain-neutral review-unit engine driven by a declarative workflow blueprint. The blueprint names the universe, workflow, current decision-subject type and vocabulary, evidence kinds, action catalog, ordered semantic dimensions, and target/hard-size policy.
- Keep exact partition, explicit remainder, deterministic identity, fail-closed oversize behavior, and count reconciliation in the generic engine.
- Keep Gmail-only concepts—sender, semantic family/subtype/pattern, protection/exclusion reasons, message volume, compatibility IDs, and Gmail table access—in a Gmail adapter.
- Define a small adapter/store interface so a workspace can use different decision subjects by workflow—for example crypto positions, assets, opportunities, or risk events; tax transactions, documents, accounts, issues, or deadlines—without copying Gmail code or inheriting Gmail vocabulary.
- Preserve the current April Marketing fixture and all pre-rebuild proof while adding generic-engine contract fixtures for non-Gmail crypto and tax blueprints plus Gmail-adapter compatibility fixtures.

Oliver approved this bounded framework-first extraction on 2026-08-23. Implementation and verification of the generic engine plus Gmail adapter are authorized. Migration application and artifact generation remain unauthorized until the extraction passes and returns to the separate rebuild gate.

The locked platform abstraction is workflow-specific decision subject, not one hardcoded entity noun per workspace. A workspace may publish multiple blueprints for distinct workflows. New domains require adapter/configuration plus background artifact generation from their data; they must not require application-framework rewrites or request-time data derivation.

Verification checkpoint — 2026-08-23:

- The domain-neutral engine now consumes a declarative workflow blueprint and owns deterministic partitioning, explicit remainder preservation, bounded sizing, exact membership, stable IDs, and validation.
- The Gmail adapter preserves the existing projector/updater API and the April compatibility fixture exactly: `857 = 347 + 218 + 160 + 76 + 56`.
- Non-Gmail fixtures prove crypto position review (`520 = 230 + 190 + 100`) and two decision subjects inside one tax workspace: transactions (`450 = 200 + 150 + 100`) and documents (`350 = 180 + 170`).
- TypeScript, targeted lint, diff validation, and the `63/63` production build pass. No runtime route, request family, database schema, artifact, publication pointer, sync state, or mailbox data changed.
- Framework-first condition is satisfied for the bounded extraction. Migration application and one candidate semantic build remain a separate explicit Oliver decision.

## Scope and feature domain

In scope:

- Gmail Operations Cleanup Groups, Sender Overview, Decision Mode, Sender Distribution, Time Context, and Pressure Trend.
- Artifact projection/store/parser contracts for published review units and sender workspace seed rows.
- One additive Supabase migration for nullable review-unit membership plus an indexed bounded lookup.
- Main, `cleanup-taxonomy-rebuild@c690dff`, the main-derived Marketing candidate, and every retained dirty Codex checkout as preservation/integration evidence.
- Incremental ACE-048 control-plane propagation and a lineage ledger.

Out of scope before a later explicit gate:

- Smart Sync, Gmail full reindex, raw mailbox scan, semantic-artifact candidate execution, artifact publication/pointer promotion, Vercel deployment, GitHub push, branch/worktree deletion, and credential rotation.
- Root `AGENTS.md`, `CODEX_PROMPT_TEMPLATES.md`, any `SKILL.md`, or reference-only protected duplicates.

## Locked product contract

- Every actionable parent is chooser-only. No actionable parent exposes `Open full group` or another broad-parent review route.
- Child units are flat and one level deep, intuitive, mutually exclusive, preferably `50–300` senders, and never above `400`.
- Every sender in an actionable parent belongs to exactly one child. Unknown data is retained in an explicit remainder child.
- Every actionable parent's child counts equal that parent exactly; all visible parent counts, including Context, equal the global cleanup universe exactly.
- Historical/Context is informational, collapsed, and has no review action.
- The active publication remains immutable until candidate-only data and browser proof pass and Oliver separately approves promotion.
- The April Marketing compatibility fixture remains `857 = 347 + 218 + 160 + 76 + 56`.

## Locked artifact and database contract

- Add nullable `review_unit_id text` to `public.gmail_sender_workspace_seed_rows`.
- Add a composite lookup index on `(tenant_id, analysis_scope, cluster_id, artifact_version, review_unit_id, default_rank)`.
- Existing RLS and tenant policies remain unchanged; no new table, grant, view, function, or `SECURITY DEFINER` code is allowed.
- Add `focused_review_unit_page=true` to published seed-header capabilities when materialized membership is complete.
- Persist flat leaf metadata in `semantic_rollup.review_unit_plan`: stable ID, intuitive label, exact sender count/share, source/basis, ordered decomposition path, leaf publication state, and exact-partition status.
- Runtime review-unit pages filter indexed seed rows by `review_unit_id`; composite membership is not reconstructed from a single semantic-family predicate.
- Old artifacts without the new capability continue through the existing semantic-focus compatibility path and never gain false child-complete status.

## Deterministic decomposition

Use only dimensions that create at least two non-empty groups. Preserve null/unknown values as explicit remainder values.

- `subtype-first`: subtype/remainder -> semantic pattern -> recency -> volume.
- `family-first`: family -> subtype/remainder -> semantic pattern -> recency -> volume.
- `protection-reason-first`: protection reason -> family -> subtype/remainder -> semantic pattern -> recency -> volume.
- `exclusion-reason-first`: exclusion reason -> family -> subtype/remainder -> semantic pattern -> recency -> volume.
- Secondary semantic parents use `family-first`.
- Recency bands: `0–30d`, `31–90d`, `91–365d`, `>365d`, `unknown` relative to the artifact cutoff.
- Volume bands: `1`, `2–5`, `6–20`, `>20` supporting messages.
- Unit IDs derive deterministically from parent ID plus normalized decomposition path.
- No hash, ordinal, alphabetical, or other non-semantic sharding. If a leaf still exceeds `400`, candidate generation fails closed and requires taxonomy enrichment.

## Runtime behavior

- Cleanup Groups renders one generic published child chooser for every actionable parent and never hides an oversized leaf or falls back to the parent.
- Historical/Context renders explanatory count truth with no child or parent CTA.
- Public selection remains `subset_source=review_unit&subset_value=<stable-unit-id>`.
- Missing, stale, malformed, mismatched, or unpublished unit IDs fail closed to the parent chooser.
- A valid review-unit ID owns Sender Overview, sender rows, pagination, Sender Distribution, Time Context, and Decision Mode identity.
- Closing Decision Mode preserves the ready child workspace when route identity is unchanged; real parent/unit/request-key changes still reset it.
- Development may load a specific candidate artifact version only through an authenticated, development-only override rejected in production.
- Pressure Trend all-indexed range begins at actual indexed coverage, and latest date is bounded by real indexed/artifact coverage; no fabricated future coverage.

## Runtime load declaration

- Heavy families: artifact projector/publication, `/api/integrations/gmail/inbox-analysis`, sender workspace seed reads, and mailbox-index status.
- Chooser ready state: one initial workspace request and zero recurring heavy requests.
- Child selection: one scoped request family for a changed unit key, bounded seed page and preview rows, zero steady repeats.
- Build readiness polling: single-flight, visible-tab only, about `15s`, terminal on published/failed/idle/dead-build reclamation.
- Mailbox-index polling: single-flight about `10s` only while a live index job exists.
- Navigation triggers no Smart Sync, artifact build, cleanup refresh, publication, raw scan, or Supabase-wide query.
- No live artifact build or database migration application is authorized in the current pre-rebuild implementation pass.

## Locked implementation surfaces

Primary application/database files:

1. `supabase/migrations/<generated>_gmail_sender_workspace_review_unit_membership.sql`
2. `web/src/lib/integrations/gmail/gmailArtifactStore.ts`
3. `web/src/lib/integrations/gmail/gmailArtifactFullMailboxProjector.ts`
4. `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
5. `web/src/lib/runtime/gmailCleanupWorkspace.ts`
6. `web/src/lib/runtime/cleanupGroupPresentation.ts`
7. `web/src/app/agents/[id]/operations/clusters/page.tsx`
8. `web/src/app/agents/[id]/operations/review/page.tsx`
9. `web/src/components/runtime/OperationsRuntimeContext.tsx`
10. the existing inbox-analysis API route only where request parsing/candidate preview identity requires it

Tests/validators may be added beside these modules. Whole-file replacement, broad refactor, or copying a hot file from another lineage is prohibited.

## Required execution sequence

1. Preserve and classify all dirty lineages without committing secrets or generated browser output.
2. Create a clean main-derived integration worktree; main remains the destination but is not advanced before acceptance.
3. Correct the unchanged-key Decision Mode close/overview workspace lifecycle.
4. Add the nullable membership migration, artifact types/projector, exact-partition validator, and old-artifact compatibility.
5. Add generic child-only rendering, review-unit lookup, and development-only candidate preview.
6. Validate the April fixture offline; do not rebuild or publish.
7. Integrate sender-distribution and Pressure Trend seams only after review-unit identity is stable.
8. Run static/build and bounded Playwright correction proof.
9. Stop at the pre-rebuild decision gate. Candidate generation requires a new explicit Oliver approval.

## Accepted proof surfaces

Canonical root:

`http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/clusters`

Canonical review identity:

`http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=<parent>&subset_source=review_unit&subset_value=<stable-unit-id>`

Required proof includes cold root, every actionable parent, every rendered child, chooser/child/Decision/close/overview/chooser transition, child switching, Context non-actionability, exact cross-surface parity, Pressure Trend All/1M/Custom bounds, post-settle screenshots, DOM/state, aligned request traces, console/overlay inspection, guard-churn classification, and a row-per-path State Transition Matrix.

## Verification and regression expectations

- Unit/fixture tests prove exact one-child membership, empty intersections, child-union equals parent, parent-union equals root, stable IDs/labels, explicit remainders, hard-max failure, old-artifact compatibility, and invalid-unit fail-closed behavior.
- Data validation proves manifest counts equal seed-row counts and all runtime reads use the bounded review-unit index.
- TypeScript, targeted lint, diff check, and fresh production build must pass before Playwright.
- Playwright uses saved authentication or the required bootstrap and evaluates only post-settle visible truth.
- Preserve published fallback, transient-empty rejection, one-attempt-per-semantic-key Pressure Trend behavior, request ownership, body scroll restoration, and accepted sender-distribution scope truth.
- A visible contradiction overrides machine-readable evidence.

## Rollback and promotion

- Rollback is the unchanged active publication plus preserved pre-integration branches.
- Candidate artifact rows, when later authorized, remain non-active and are previewed by explicit version before pointer promotion.
- Artifact promotion, local-main promotion, GitHub push, deployment, and branch/worktree retirement are separate explicit gates after verifier and Human Review acceptance.

## Execution readiness

- Problem class: LOCKED — mixed artifact/publication, runtime, UI, and integration truth.
- Product decisions: LOCKED.
- Route identity: LOCKED.
- Primary file set: TARGET-LOCKED; additional tests/validators may be added only within this feature domain.
- Pre-rebuild implementation: READY.
- Long candidate build/publication: NOT AUTHORIZED.
- Human Review: REQUIRED after verifier proof; no acceptance may be inferred.
