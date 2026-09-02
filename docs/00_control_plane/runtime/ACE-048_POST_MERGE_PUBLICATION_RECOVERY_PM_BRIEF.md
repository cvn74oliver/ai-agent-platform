# ACE-048 Post-Merge Publication Recovery PM Brief

Date: 2026-08-31
Status: HUMAN REVIEW REJECT / SUPERSEDED AS CLOSEOUT AUTHORITY
Governing ACE: ACE-048
Feature domain: Cleanup Groups and shared sender-analysis surfaces
Execution mode: `transitional_self_verification`
Reasoning level: HIGH — cross-layer publication/runtime recovery with a bounded UI authority correction

## Executive summary

### What is changing

Restore the accepted combined Cleanup Groups and analysis experience on canonical `main` by previewing and then safely publishing the already-validated August artifact. Remove the competing Mailbox Intelligence sidebar timeframe selector so Pressure Trend remains the only mutable timeframe control on that page.

### What the operator will get

- the accepted four-stage Cleanup Groups workflow populated by the complete child-unit set
- Pressure Trend coverage through the indexed August history instead of the April publication boundary
- Sender Overview, Sender Distribution, Time Context, sender rows, and Decision Mode reading the same review-unit projections
- one clear timeframe authority on Mailbox Intelligence

### Why it matters

The Git integration succeeded, but runtime still reads an April artifact that predates the accepted child projections. The resulting mixed source/artifact state makes accepted work appear lost and causes current child routes to fail closed.

## Objective

Recover the accepted ACE-048 runtime on canonical `main` without rebuilding or rescanning mailbox data and without wholesale-merging superseded cleanup lineage.

## Problem-class lock

- Primary: artifact / publication truth
- Secondary: UI timeframe-control authority
- Resolved: source integration loss is not the primary mechanism

## Authoritative identities

- Tenant: `085c8ef7-2fd7-4842-8499-cd605e894a77`
- Scope: `all_indexed`
- Current published version: `full-mailbox-20260415024237593`
- Target candidate version: `full-mailbox-20260825031402535`
- Target job: `full-rebuild:085c8ef7-2fd7-4842-8499-cd605e894a77:all_indexed:full-mailbox-20260825031402535`
- Expected current `building_version`: `null`
- Expected current index state timestamp: `2026-08-15 08:15:26.127+00`
- Expected current indexed messages: `244628`
- Candidate truth: `completed / candidate_ready`, `5,024` senders, `244,628` messages, `7` parents, `60` candidate-validated review-unit manifests, projection coverage `2022-12-02` through `2026-08-15`

## Scope

1. Propagate this post-merge regression and recovery contract.
2. Preserve a pre-change full `KEEP` backup.
3. Restore a narrow compare-and-set candidate-promotion path against exact expected publication fields.
4. Make Mailbox Intelligence treat the Operations Workspace scope as read-only indexed provenance; Pressure Trend owns the page's mutable timeframe.
5. Preview the exact August candidate through the existing development artifact override without publishing it.
6. Verify all accepted linked surfaces from canonical `main`.
7. Only after preview proof passes, atomically promote the candidate and verify the pointer plus final rendered UI.
8. Preserve the April artifact as the rollback target and roll back immediately if linked-surface parity or visible truth fails.

## Locked files

Implementation targets:

- `web/src/components/runtime/OperationsWorkspaceShell.tsx`
- `web/src/lib/integrations/gmail/gmailArtifactStore.ts`
- `web/scripts/gmail-artifact-publication-readiness.mjs`
- `web/scripts/gmail-artifact-publication-promote.mjs`
- `web/package.json`

Control-plane targets:

- `ai-agent-platform-docs/06_system_state/CURRENT_STATE.md`
- `ai-agent-platform-docs/06_system_state/TODO.md`
- `ai-agent-platform-docs/06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `ai-agent-platform-docs/06_system_state/CHANGELOG.md` only after accepted-fix proof
- `docs/00_control_plane/EXECUTION_DASHBOARD.md`
- this runtime brief

Read-only validation dependencies:

- `web/src/app/agents/[id]/operations/intelligence/page.tsx`
- `web/src/app/agents/[id]/operations/clusters/page.tsx`
- `web/src/app/agents/[id]/operations/review/page.tsx`
- review-unit projection tables and RPCs
- Gmail artifact publication/job/header/summary/snapshot tables

## Locked routes and accepted proof surfaces

- Mailbox Intelligence: `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/intelligence`
- Cleanup Groups: `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/clusters`
- Canonical Editorial/content child and representative children reached through the Cleanup Groups chooser
- Sender Overview full workflow and preset switch loop
- Sender Distribution
- Time Context and bucket narrowing
- Pressure Trend dynamic historical coverage
- Decision Mode open/close return

## Constraints and exclusions

- no Gmail API access
- no Smart Sync
- no mailbox reindex or raw mailbox scan
- no semantic rebuild or second candidate
- no migration
- no broad Supabase mutation
- no deployment
- no wholesale cherry-pick or merge of `cleanup-taxonomy-rebuild`
- no deletion of branches, worktrees, artifacts, jobs, or backups
- no automatic polling or new request family
- no publication until the non-published candidate preview passes

## Load and lifecycle contract

- Runtime reads remain artifact-only and bounded.
- Preview uses the existing development artifact-version override; it does not move publication state.
- Publication is one compare-and-set transition with exact old pointer, null build lock, index timestamp, and indexed-count expectations.
- No polling is introduced.
- Expected steady-state mutation count is zero before promotion and one bounded publication transition after preview acceptance.
- Candidate promotion must clear stale failed-refresh presentation while leaving immutable artifact rows intact.

## Regression protections

- Preserve the four universal workflow stages and informational Reference Only surface.
- Preserve stable child IDs, labels, membership, counts, chooser navigation, window semantics, and Decision Mode return.
- Preserve the distinct meanings of unique senders and supporting activity.
- Preserve one shared observation authority across Sender Distribution, Time Context, and Pressure Trend.
- Reject stale publication drift, a live build lock, missing candidate rows/manifests, failed candidate job state, or inconsistent index identity before mutation.
- Keep the April version available for compare-and-set rollback.

## Verification expectations

### Correction proof before publication

- TypeScript and targeted lint pass.
- Promotion/readiness scripts reject malformed or drifting inputs.
- Read-only candidate audit reconciles job, required artifact rows, 60/60 manifests, coverage, and indexed counts.
- Candidate-preview browser proof reaches ready state on all locked surfaces with no missing-child or distribution error.

### Accepted-fix closeout after publication

- exact published pointer equals the August candidate
- no active build lock
- publication freshness is current and job is published
- final screenshots, DOM/state capture, and request trace are post-settle
- Cleanup Groups exposes the accepted stages and child units
- Sender Overview, sender rows, Sender Distribution, Time Context, Decision Mode, and summary totals reconcile
- Pressure Trend ends at the available August history and contains no epoch origin
- Mailbox Intelligence has one mutable timeframe authority
- zero recurring heavy polling, raw mailbox reads, `409`, or interfering guard churn
- rollback is exercised only if the accepted surfaces fail

## Rollback contract

Compare-and-set the publication from `full-mailbox-20260825031402535` back to `full-mailbox-20260415024237593` using the post-promotion publication identity captured by the proof bundle. Do not delete either artifact or rebuild data. Re-verify the pointer and stop for PM diagnosis.

## Execution readiness

- Target lock: RESOLVED
- Data identity: REATTESTED READ-ONLY
- Pre-change backup: COMPLETE
- Plan decision: ACCEPTED by Oliver on 2026-08-31
- Implementation: AUTHORIZED within this brief only

## Verification result — 2026-08-31

Result: `Accepted Fix Proven` by the transitional verifier; Human Review decision remains required before closeout.

- Candidate preview proof: `web/output/playwright/ace-048-publication-recovery/candidate-preview-proof.json`
- Canonical final proof: `web/output/playwright/ace-048-publication-recovery/final-publication-proof.json`
- Publication proof: `/tmp/ace048-publication-promote.json`
- Post-publication data audit: `/tmp/ace048-post-publication-readiness.json`
- Final screenshots: `08-final-intelligence.png`, `09-final-cleanup-groups.png`, `10-final-review-cold-load.png`, `11-final-sender-distribution-1w.png`, and `12-final-time-context-1w.png` in `web/output/playwright/ace-048-publication-recovery/`

Ready-state satisfied: YES
Ready-state signals used: canonical authenticated route, decisive surface visible, no loading/fallback copy, selected `1W` control settled, authoritative chart content present
Settle strategy: route-specific wait, post-switch transition delay, decisive loaded-state wait, final screenshot after settle
Artifacts captured post-settle: YES
Verification Confidence: HIGH

### State Transition Matrix

| Mode / Path | Baseline visible state before action | Operator action performed | Settled visible state after action | Downstream gate/status/result | Remaining blocker | Separate blocker? | Verdict |
|---|---|---|---|---|---|---|---|
| Mailbox Intelligence cold load | April-era publication previously stopped Pressure Trend in April and exposed a competing dropdown | Open canonical Intelligence route after guarded August publication | `5,024` senders, `~244,628` supporting messages, read-only Indexed Coverage, Pressure Trend through Q3 2026 | Canonical publication is `published / fresh` | Human acceptance only | YES | PASS |
| Cleanup Groups cold load | Prior runtime showed incomplete/legacy group population | Open canonical Cleanup Groups route | `7` main groups, `3` optional/reference groups, all four guided sections and populated child choices | Chooser links resolve against August review-unit truth | Human acceptance only | YES | PASS |
| Canonical child cold load | Legacy child identity could redirect/fail against mismatched publication | Open chooser-generated `family:editorial_newsletter` route | `Newsletters and editorial updates`, `53` senders, populated workflow and analysis rail | Child-specific title and stable review-unit identity retained | Human acceptance only | YES | PASS |
| Sender Distribution `1W` | All-indexed child scope | Select Sender Distribution, then `1W` | `12 active senders` with ranked bars inside the same `53`-sender fixed review unit | Workflow/window route and chart settle together | Human acceptance only | YES | PASS |
| Time Context `1W` | Sender Distribution `1W` settled | Select Time Context while retaining `1W` | Activity-volume bars, distinct active-sender context, and focused bucket truth render | Same child/window truth remains linked to workflow | Human acceptance only | YES | PASS |

Request families observed: bounded artifact-backed Operations APIs only. API failures: `0`; `409` guard responses: `0`; console errors: `0`; duplicate-key warnings: `0`. No polling, Gmail access, Smart Sync, reindex, rebuild, migration, or deployment was triggered.

Verifier-checkpoint backup: `/Users/olivercarlin/Documents/Backups/August 2026/2026-08-31/ai-agent-platform (incremental 31 August 2026 - ACE-048 post-merge publication recovery verifier checkpoint before Human Review)`.

## Human Review result — 2026-08-31

Decision: `REJECT` / `RETURN_TO_PM`.

- Pressure Trend visibly preserves empty May and June 2026 buckets between April and resumed July activity; source/index continuity must be diagnosed rather than hidden in presentation.
- Multiple ordinary cleanup children contain only one or two subjects; a framework-first presentation threshold and semantic-risk exception policy must be decided without changing exact stored membership merely to improve appearance.
- Non-`All Indexed` Sender Distribution and Time Context windows fail for additional chooser-generated review-unit identity classes. The prior proof of one canonical family child was too narrow to establish all-child parity.

The prior candidate and final proof remain useful bounded evidence but do not establish an Accepted Fix. Active work returns to PM discovery and must produce three separately scoped correction packets before implementation resumes.

Status: RETURN_TO_PM

Decision options: `ACCEPT`, `REJECT`, `BLOCKED`, `RETURN_TO_PM`.

Superseding active correction plan: `docs/00_control_plane/runtime/ACE-048_HUMAN_REVIEW_RETURN_CORRECTION_PM_BRIEF.md`.
