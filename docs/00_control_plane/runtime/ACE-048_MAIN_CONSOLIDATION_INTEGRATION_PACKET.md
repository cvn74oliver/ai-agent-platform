# ACE-048 Main Consolidation Integration Packet

Status: accepted source preserved; documentation closeout in progress; no `main` movement authorized
Governing change: ACE-048 Cleanup Taxonomy and Worktree Consolidation
Execution mode: `transitional_self_verification`
Problem class: Git/source-lineage integration of a Human-accepted mixed runtime and UI candidate

## Executive summary

### What is changing

The accepted Cleanup Groups, Sender Distribution, Time Context, and Pressure Trend implementation is being preserved as an intentional candidate branch with complete lineage and rollback records.

### What the operator will get

A single, reviewable candidate that can later be promoted to local `main` without losing the months of work preserved in the older worktrees.

### Why it matters

This separates source preservation from promotion. The accepted app remains recoverable while `main`, GitHub, Vercel, Supabase, Gmail, and the published artifact stay unchanged until their own approval gates.

## Locked identities

- Destination ref: local `main`
- Destination baseline: `64632b3faa0736cdf15534b4465cdef8a404a4e8`
- Remote baseline: `origin/main` at `64632b3faa0736cdf15534b4465cdef8a404a4e8`
- Promotion source branch: `codex/ace-048-observation-contract-plan`
- Accepted product-source commit: `a4144dee3fc0002b4667ff379e8e56805a1b8362`
- Promotion source commit: the clean branch HEAD reattested at the separate promotion gate
- Merge base with destination: `64632b3faa0736cdf15534b4465cdef8a404a4e8`
- Rollback branch: `codex/ace-048-main-preconsolidation` at `22148cef9fc15e82730f19ef2f35eb3829763931`
- Earlier consolidation checkpoint: `codex/ace-048-cleanup-consolidation` at `96a9be5f881d17618cb3edd2159bb47cdf685b64`

## Accepted candidate scope

- generic review-unit/window projection contract;
- additive active-entity projection source migration;
- Cleanup Groups and child-unit workflow identity;
- Sender Overview and Decision Mode shared workflow-window state;
- Sender Distribution unique-entity view;
- Time Context activity-volume view with distinct-entity explanation;
- Pressure Trend coverage bounds and shared observation source;
- single workflow-window control instead of conflicting page filters;
- accepted control-plane and Recovery Contract updates.

## Explicit exclusions

This packet does not authorize:

- merging, rebasing, cherry-picking, or fast-forwarding `main`;
- changing the root checkout branch;
- pushing any branch or commit;
- deploying or promoting a Vercel deployment;
- applying a Supabase migration;
- rebuilding or publishing a semantic artifact;
- starting Smart Sync, Gmail backfill, or a full mailbox reindex;
- deleting or retiring a worktree or branch;
- committing generated browser output, authentication state, secrets, environment files, or `.codex/worktrees/` metadata;
- repairing the separately observed Decision Mode evidence-detail HTTP `412` defect.

## Candidate preservation sequence

1. Inspect the entire accepted diff and confirm excluded paths are absent.
2. Run targeted static, contract, type, and build checks without changing runtime or external data.
3. Commit product source plus the unapplied migration source as one intentional code unit.
4. Commit control-plane closeout, lineage ledger, and this packet as one intentional documentation unit.
5. Record the resulting exact candidate commit and re-prove ancestry from `main`.
6. Stop and present the exact local-main promotion method for separate approval.

## Later promotion gate

Before local `main` can move, the promotion pass must prove:

- candidate worktree is clean;
- no unmerged paths exist;
- `main` and `origin/main` still equal the locked destination baseline, or the packet is refreshed for any drift;
- every unique preserved lineage is either reachable from the candidate, intentionally superseded, or explicitly retained as historical evidence;
- accepted test and browser artifacts correspond to the exact candidate commit;
- rollback refs remain available;
- the chosen Git operation is non-destructive and does not replay superseded hot-file variants.

After local `main` moves, the app must be started from `main` and the canonical accepted route must be reverified before any push, deployment, or worktree retirement decision.

## Rollback contract

If the later local-main promotion fails verification:

- do not push or deploy;
- leave the candidate and all recovery branches intact;
- restore the destination ref to the locked pre-promotion commit using an explicitly approved non-destructive method;
- record the failed promotion evidence before attempting a correction;
- do not delete any checkout while the failure is unresolved.

## Retirement gate

No branch or worktree is approved for deletion. Retirement requires:

- verified local-main integration;
- proof that no unique source or document lineage remains unreachable;
- accepted post-promotion runtime verification;
- explicit Oliver approval naming the exact branches/worktrees to retire.
