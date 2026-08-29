# ACE-048 Worktree Lineage Ledger

Status: preserved and classified; accepted source consolidated on local `main`; remote publication and retirement pending
Governing change: ACE-048 Cleanup Taxonomy and Worktree Consolidation
Execution mode: `transitional_self_verification`
Destination: local `main` consolidated; remote publication only after residual verification and Human Review

## Preservation rules

- No checkout is deleted during ACE-048.
- No generated Playwright output, saved authentication state, secrets, or `.codex/worktrees/` metadata is committed.
- Recovery branches preserve source lineages; they do not confer integration or publication authority.
- Shared hot files are integrated seam-by-seam in a clean candidate worktree. No blind merge is permitted.
- The active artifact pointer and current published artifact remain unchanged until the separately approved rebuild and promotion gates.

## Inventory

| Checkout / branch | Starting HEAD | Dirty source identity | Classification | Preservation / integration disposition |
| --- | --- | --- | --- | --- |
| Root preserved checkout | `22148cef9fc15e82730f19ef2f35eb3829763931` | Governed pre-consolidation hybrid with ACE-048 runtime corrections, transferred Marketing child rendering, Pressure Trend/runtime safeguards, and the all-parent execution brief | Required rollback baseline | Preserved on `codex/ace-048-main-preconsolidation`. Local `main` has since consolidated through `7866368c97a6ca8d241a9541f6f83570df2017f4`; `origin/main` remains unchanged at `64632b3faa0736cdf15534b4465cdef8a404a4e8`. |
| `codex/ace-048-marketing-integration` worktree | `9ddad214263113c964ba90c3ba2a6c967c956277` | Preserved five-file Marketing integration candidate | Partly duplicate; resolved through later generic review-unit integration | Keep as lineage evidence until Oliver separately approves retirement. Do not replay this branch wholesale over the accepted candidate. |
| Detached `33ad` worktree | `cce016bcf2ccc30d712ac65f104a111e056b3caf` | Broad runtime/artifact candidate: artifact store, workspace contract, mailbox-index/inbox-analysis routes, runtime context/state, Review lifecycle, and docs | Unique lifecycle seams; required for manual comparison | Preserved on `codex/archive/ace-048-33ad-runtime-candidate` at `6e10e27`. Authentication state and generated output were excluded; only validated lifecycle/read seams informed the candidate. |
| Detached `7865` worktree | `cce016bcf2ccc30d712ac65f104a111e056b3caf` | Three-file intermediate runtime candidate plus a distinct control-plane snapshot | Code duplicate; documentation unique | Preserved as `codex/archive/ace-048-7865-intermediate` at `99cbac6`. Integrate the shared code at most once; retain its documentation only as lineage evidence. |
| Detached `a985` worktree | `cce016bcf2ccc30d712ac65f104a111e056b3caf` | Same three-file product code as `7865`, plus a different control-plane snapshot | Code duplicate; documentation unique | Preserved as `codex/archive/ace-048-a985-intermediate` at `e50f527`. Integrate the shared code at most once; retain its documentation only as lineage evidence. |
| Detached `95b7` worktree | `cce016bcf2ccc30d712ac65f104a111e056b3caf` | Claude-transition and control-plane documentation lineage; no product source changes | Unique but superseded for current execution | Preserved on `codex/archive/ace-048-95b7-claude-handoff` at `65e3ed9`. Do not integrate successor-transition framing into the active Codex execution unless separately approved. |
| Prior clean integration checkpoint | `96a9be5f881d17618cb3edd2159bb47cdf685b64` | Manual seam integration of all-parent review-unit identity, lifecycle correction, generic chooser, bounded runtime reads, and Pressure Trend coverage bounds | Required preserved checkpoint | Preserved on `codex/ace-048-cleanup-consolidation`. Superseded for promotion by the later Human-accepted observation-contract candidate, but retained for rollback and ancestry evidence. |
| Human-accepted integration candidate | Candidate ancestry preserved through `54e237f4b6e72cc0279e34ad931637073d669162`; final compatibility correction committed on local `main` at `7866368c97a6ca8d241a9541f6f83570df2017f4` | Cleanup taxonomy, review-unit membership, unified workflow-window behavior, Sender Distribution, Time Context, Pressure Trend parity, and accepted control-plane closeout | Integrated locally; branch retained as lineage | `codex/ace-048-observation-contract-plan` remains at the preserved candidate checkpoint and was not force-moved. Local `main` contains the consolidated result; remote publication remains gated. |

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

## Pre-rebuild gate result (historical checkpoint)

- All unique source/document lineages are preserved; no generated proof, authentication state, environment file, or secret is staged.
- The candidate passes deterministic contract fixtures, Pressure Trend fixtures, non-incremental TypeScript, targeted lint, diff check, production build, and bounded authenticated Playwright correction proof.
- Local `main`, `origin/main`, the active publication pointer, the published April artifact, and live Supabase schema remain unchanged.
- Next decision: approve or decline the additive migration plus one candidate build from the existing indexed mailbox. This ledger does not authorize that operation.

## Human-accepted candidate checkpoint

- Cleanup Groups now expose bounded, plain-language review units with reconciled parent/child totals.
- Sender Distribution, Time Context, Pressure Trend, the sender workflow, and Decision Mode consume the same workflow-window truth for the accepted chart surfaces.
- Human Review accepted Cleanup Groups and the three analysis views after the final single-workflow-window correction.
- The active candidate working diff contains no generated Playwright output, saved authentication state, `.env` file, secret, or `.codex/worktrees/` metadata.
- The additive Supabase migration file is source lineage only in this preservation pass; this pass does not apply, reapply, or otherwise mutate live Supabase state.
- Decision Mode evidence-detail HTTP `412` behavior remains a separately bounded post-consolidation repair. It does not invalidate the accepted cleanup/chart source preservation, and it must not be silently folded into the merge pass.
- Local `main` contains the accepted consolidation. `origin/main`, GitHub, Vercel, the active artifact pointer, Gmail index state, and live Supabase state remain outside this preservation step.

## Live branch and checkout identity (August 29, 2026)

| Branch | HEAD | Checkout state / role |
| --- | --- | --- |
| `main` | Source through `7866368c97a6ca8d241a9541f6f83570df2017f4`; this documentation checkpoint advances HEAD | Consolidated local destination; `20` commits ahead of untouched `origin/main@64632b3faa0736cdf15534b4465cdef8a404a4e8`. |
| `codex/ace-048-main-preconsolidation` | `22148cef9fc15e82730f19ef2f35eb3829763931` | Preserved root rollback checkout. |
| `codex/ace-048-observation-contract-plan` | `54e237f4b6e72cc0279e34ad931637073d669162` | Preserved Human-accepted candidate checkpoint; retained without force-moving the branch. |
| `codex/ace-048-cleanup-consolidation` | `96a9be5f881d17618cb3edd2159bb47cdf685b64` | Earlier clean consolidation checkpoint. |
| `codex/ace-048-marketing-integration` | `9ddad214263113c964ba90c3ba2a6c967c956277` | Preserved Marketing-source lineage. |
| `codex/archive/ace-048-33ad-runtime-candidate` | `6e10e27abf2f3170b81001a92a38c27bbfdf481f` | Preserved unique runtime/artifact lifecycle lineage. |
| `codex/archive/ace-048-7865-intermediate` | `99cbac6c654a1404c9f2c8c4754b380377323977` | Preserved intermediate duplicate-code/document lineage. |
| `codex/archive/ace-048-a985-intermediate` | `e50f527bb624eaa94bcbd2cff00bc9536406fef3` | Preserved intermediate duplicate-code/document lineage. |
| `codex/archive/ace-048-95b7-claude-handoff` | `65e3ed96288029c61aae59c2b28e58635c5986e6` | Preserved superseded Claude-transition documentation lineage. |

The accepted candidate checkpoint and local-main consolidation identity are fixed above. The final documentation commit will advance local `main` once more without changing the preserved candidate branch or remote baseline.

## Retirement status

No branch or worktree is approved for retirement. Retirement requires proven integration of every unique seam plus Oliver approval.
