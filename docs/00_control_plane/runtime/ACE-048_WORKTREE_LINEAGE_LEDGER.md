# ACE-048 Worktree Lineage Ledger

Status: preserved and classified; integration candidate at pre-rebuild gate
Governing change: ACE-048 Cleanup Taxonomy and Worktree Consolidation
Execution mode: `transitional_self_verification`
Destination: local `main`, only after integration verification and Human Review

## Preservation rules

- No checkout is deleted during ACE-048.
- No generated Playwright output, saved authentication state, secrets, or `.codex/worktrees/` metadata is committed.
- Recovery branches preserve source lineages; they do not confer integration or publication authority.
- Shared hot files are integrated seam-by-seam in a clean candidate worktree. No blind merge is permitted.
- The active artifact pointer and current published artifact remain unchanged until the separately approved rebuild and promotion gates.

## Inventory

| Checkout / branch | Starting HEAD | Dirty source identity | Classification | Preservation / integration disposition |
| --- | --- | --- | --- | --- |
| Root `main` checkout | `64632b3faa0736cdf15534b4465cdef8a404a4e8` | Current governed hybrid, ACE-048 runtime corrections, Marketing child rendering already transferred, Pressure Trend/runtime safeguards, and all-parent execution brief | Required integration baseline | Preserved on `codex/ace-048-main-preconsolidation` at `22148ce`; used as the parent of the clean integration candidate. Local and origin `main` remain unchanged. |
| `codex/ace-048-marketing-integration` worktree | `81106dd5f9dbbbc503d12044921b2bc1024fedea` | Five-file Marketing integration candidate | Partly duplicate; Review variant remains unique | Preserve the dirty branch. Four of five source files already match the root checkout exactly; compare the Review-page delta manually before deciding whether any seam remains required. |
| Detached `33ad` worktree | `cce016bcf2ccc30d712ac65f104a111e056b3caf` | Broad runtime/artifact candidate: artifact store, workspace contract, mailbox-index/inbox-analysis routes, runtime context/state, Review lifecycle, and docs | Unique lifecycle seams; required for manual comparison | Preserved on `codex/archive/ace-048-33ad-runtime-candidate` at `6e10e27`. Authentication state and generated output were excluded; only validated lifecycle/read seams informed the candidate. |
| Detached `7865` worktree | `cce016bcf2ccc30d712ac65f104a111e056b3caf` | Three-file intermediate runtime candidate plus a distinct control-plane snapshot | Code duplicate; documentation unique | Preserved as `codex/archive/ace-048-7865-intermediate` at `99cbac6`. Integrate the shared code at most once; retain its documentation only as lineage evidence. |
| Detached `a985` worktree | `cce016bcf2ccc30d712ac65f104a111e056b3caf` | Same three-file product code as `7865`, plus a different control-plane snapshot | Code duplicate; documentation unique | Preserved as `codex/archive/ace-048-a985-intermediate` at `e50f527`. Integrate the shared code at most once; retain its documentation only as lineage evidence. |
| Detached `95b7` worktree | `cce016bcf2ccc30d712ac65f104a111e056b3caf` | Claude-transition and control-plane documentation lineage; no product source changes | Unique but superseded for current execution | Preserved on `codex/archive/ace-048-95b7-claude-handoff` at `65e3ed9`. Do not integrate successor-transition framing into the active Codex execution unless separately approved. |
| Clean integration candidate | `22148ce` | Manual seam integration of all-parent review-unit identity, lifecycle correction, generic chooser, bounded runtime reads, and Pressure Trend coverage bounds | Required current candidate | `codex/ace-048-cleanup-consolidation`; static/build/authenticated correction proof passes. Stop before migration application or candidate build. |

## Exact comparison evidence

- Detached `7865` and `a985` have identical `web/src` trees and the same stable source patch ID: `eb3cfa41cf24302bf1b7c00876c55233dca57f14`.
- Their control-plane snapshots are not identical: `ACTIVE_CHANGE_EVENTS.md`, `CURRENT_STATE.md`, `TODO.md`, and `EXECUTION_DASHBOARD.md` differ. Both documentation lineages are therefore preserved even though their product code is a duplicate.
- Detached `33ad` stable source patch ID: `5cf588a194bdacaa2ae599d3ccb0c7c887eb263a`.
- Marketing worktree stable source patch ID: `81485e2def03dea15d97b677168071cdb5d9479d`.
- Root governed source patch ID at inventory time: `b5e7d878d32511ac8cc39f5248d9cb6d75d2ee40`.
- Marketing-vs-root exact file comparison at inventory time:
  - identical: Cleanup Groups page
  - identical: integration Gmail cleanup workspace
  - identical: cleanup-group presentation builder
  - identical: runtime Gmail cleanup workspace
  - different: Review page
- Sender Distribution and Pressure Trend implementation lineage is already reachable from the governed main baseline. It is preserved and was integrated by adapting its shared-identity seams; replaying the old branch wholesale would duplicate or regress current behavior.

## Excluded state

The following are explicitly excluded from recovery commits and integration:

- `output/playwright/**`
- `web/.playwright-cli/**auth-state*.json`
- tracked or untracked saved browser authentication JSON
- `.codex/worktrees/**`
- secrets and environment files

## Candidate integration order

1. Preserve the root governed hybrid on its recovery branch.
2. Preserve unique detached lineages and one representative of exact duplicates.
3. Create `codex/ace-048-cleanup-consolidation` in a clean worktree from the governed root recovery commit.
4. Implement the additive published review-unit contract and Decision Mode lifecycle correction.
5. Validate the fixed April artifact offline without publication.
6. Add the generic child-only chooser and development-only candidate-version inspection path.
7. Stop at the pre-rebuild approval gate before any several-hour candidate build.
8. Integrate Sender Distribution and Pressure Trend seams only after review-unit identity is stable. **Completed in the isolated candidate; full candidate-version parity proof remains gated on the separately approved build.**

## Pre-rebuild gate result

- All unique source/document lineages are preserved; no generated proof, authentication state, environment file, or secret is staged.
- The candidate passes deterministic contract fixtures, Pressure Trend fixtures, non-incremental TypeScript, targeted lint, diff check, production build, and bounded authenticated Playwright correction proof.
- Local `main`, `origin/main`, the active publication pointer, the published April artifact, and live Supabase schema remain unchanged.
- Next decision: approve or decline the additive migration plus one candidate build from the existing indexed mailbox. This ledger does not authorize that operation.

## Retirement status

No branch or worktree is approved for retirement. Retirement requires proven integration of every unique seam plus Oliver approval.
