# ACE-048 Marketing Published Child-Entry Integration PM Brief

Status: SUPERSEDED BY ALL-PARENT HUMAN REVIEW RETURN — DO NOT EXECUTE AS A STANDALONE CLOSEOUT
Owner: Project Manager
Governing event: ACE-048
Mode: PLAN-approved same-flow execution
Execution mode: `transitional_self_verification`
Reasoning: HIGH

## Executive summary

- What is changing: restore the preserved artifact-backed Marketing child groups from the cleanup lineage without replacing later main runtime work.
- What Oliver will get: the 857-sender Marketing parent opens into five real, bounded review units instead of a broad session-only approximation.
- Why it matters: this is the first safe integration packet that proves the old semantic cleanup design and the newer main runtime can coexist before sender-distribution integration continues.

## Supersession note — 2026-08-21

Oliver's direct Human Review established that the mixed surface produced by this first packet is not an acceptable finished Cleanup Groups design. Marketing remains valid partial implementation evidence, but every visible parent now requires an intuitive artifact-backed child-unit contract and exact reconciliation. The active next step is the all-parent read-only inventory and revised packet/proof matrix recorded under `ACE-048`; this brief must not be used to claim Cleanup Groups acceptance or to start another isolated hot-file correction.

## Objective

Manually integrate the published Marketing review-unit contract into current main. Preserve stable artifact identity, exact parent/child reconciliation, unit-only entry, unit-scoped Sender Overview and Decision Mode, and all later main lifecycle/load corrections.

## Feature domain

Gmail Operations Cleanup Groups and Marketing sender-review entry only.

## Problem class

Artifact-contract compatibility plus bounded runtime/UI behavior. The published data is valid; the active defect is that current main parses and presents an older review-unit contract. Problem class is locked and execution-ready.

## Governing evidence

- Published artifact: `full-mailbox-20260415024237593`.
- Marketing parent: `semantic.marketing_subscriptions`, `857` senders.
- Stable published units: `347`, `218`, `160`, `76`, and `56` senders; exact sum `857`.
- Preferred size: `50–300`; hard maximum: `400`. All five Marketing units are admissible.
- Cleanup authority: `cleanup-taxonomy-rebuild@c690dff`.
- Main is the integration destination and later runtime/lifecycle authority.

## Locked files

Only these runtime files may change in the isolated candidate:

1. `web/src/lib/runtime/gmailCleanupWorkspace.ts`
2. `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
3. `web/src/lib/runtime/cleanupGroupPresentation.ts`
4. `web/src/app/agents/[id]/operations/clusters/page.tsx`
5. `web/src/app/agents/[id]/operations/review/page.tsx`

No whole-file replacement is allowed. Each change must be a semantic union against the current main version.

## Required behavior

- Parse the published schema-version-2 review-unit basis and unit source/role values without discarding them.
- Cleanup Groups renders the five stable Marketing units from `semantic_rollup.review_unit_plan`, with their published labels and counts.
- The five visible child counts reconcile exactly to the `857` parent count.
- The full displayed parent set reconciles exactly to the global cleanup scope. Every future exposed child plan must also reconcile exactly to its parent before it can be called complete.
- Marketing exposes no broad-parent review shortcut. Parent entry is chooser-only; invalid, missing, or oversized unit identity fails closed to the chooser.
- A valid unit route preserves its stable `subset_source=review_unit` and published `subset_value` identity.
- The selected unit drives unit-scoped Sender Overview, sender rows, coverage, and Decision Mode handoff. The broad parent remains intact as the parent artifact but does not masquerade as the active unit.
- Other cleanup parents keep their current behavior in this packet. Oversized Backlog, Protected/Trusted, and Unresolved units are not surfaced as accepted children.

## Runtime load declaration

- Heavy endpoint family: `/api/integrations/gmail/inbox-analysis` artifact-backed sender-workspace reads already used by Operations.
- New endpoint families: none.
- Polling: none.
- Expected steady-state request count after settle: zero.
- A cold selected Marketing unit may perform the existing bounded sender-workspace reads needed for its semantic focus. Page size remains capped at `200`; requests must be single-flight by semantic key and self-terminate at the reported page count.
- No raw Gmail-table scan, Smart Sync, semantic rebuild, candidate build, artifact publication, stale-build reclaim, or database write.
- Lifecycle edges affected: route selection and bounded unit hydration only. Build-pending continuity, Smart Sync handoff, build completion, and stale-build reclaim are unchanged.

## Constraints and prohibitions

- No Supabase mutation, Gmail sync, full reindex, artifact rebuild, publication, migration, deployment, commit, push, blind merge, cherry-pick, history rewrite, branch deletion, or worktree deletion.
- Do not widen to Sender Distribution corrections, Pressure Trend, or the three oversized parents.
- Preserve all current main request-ownership, publication-fallback, cache-admission, scope-transition, and lifecycle fixes.
- Existing main diffs are pre-existing governed work, not evidence that this packet is correct.

## Accepted proof surfaces

Canonical root:

`http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/clusters`

Primary child route:

`http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions&subset_source=review_unit&subset_value=family%3Amarketing_candidate_deals_discounts`

Required proof:

- Cold Cleanup Groups settles with five Marketing child cards and exact `857` reconciliation.
- No broad Marketing parent shortcut is present.
- Each of the five links preserves a unique stable published unit ID and admissible count.
- The primary Deals/Discounts child settles to `347` unit senders with unit-scoped visible truth.
- Decision Mode opened from that child retains the same unit identity and queue scope.
- Return to Cleanup Groups preserves the parent/child presentation.
- No loading shell, terminal fallback, body-scroll lock, console/page error, request waterfall, polling, raw scan, or guard churn interferes with the accepted flow.

## Verification expectations

1. TypeScript and targeted lint on the five locked files.
2. Fresh production build.
3. Playwright authenticated cold root, child click-through, Decision Mode handoff, and return loop.
4. Human-visible before/after screenshots, DOM/state, aligned request trace, and row-by-row State Transition Matrix.
5. Verifier must prove route-specific ready state before verdict and report load/request families.
6. After verifier acceptance, pause at `Status: Awaiting Decision` for narrow Oliver Human Review. Do not begin Sender Distribution integration before Oliver's decision.

## Regression protections

- Published fallback remains usable when a candidate fails.
- Zero-cluster transient cache rejection remains intact.
- Pressure Trend stays one-attempt-per-semantic-key with zero steady requests.
- Non-Marketing cleanup groups do not gain false child-complete status.
- Counts, route identity, Sender Distribution, sender rows, pagination, coverage, and Decision Mode must not mix parent and child universes; all linked surfaces must reconcile to the same active universe.

## Rollback

Discard only the isolated five-file candidate changes. The current main working tree, published artifact, Supabase data, and preserved cleanup branch remain unchanged.

## Execution readiness

Target lock: READY.
Approved scope: READY.
Problem class: LOCKED.
Human Review checkpoint: REQUIRED after Playwright verifier acceptance.
