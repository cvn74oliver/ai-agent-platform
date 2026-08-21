# ACE-048 Git Preservation — Candidate and Cleanup Lineage Packet

Status: EXECUTION-READY — byte-exact control-plane propagation required before Executor start
Governing event: `ACE-048 — Automata Revival — Security and Rebaseline`
Feature domain: Git/worktree preservation; no semantic integration
Accepted Fix: NO
Runtime acceptance: REJECT/HIGH
`ACE-049`: queued/inactive

## Original-main landing evidence

`main`, `origin/main`, live refs, and `heads/main` resolve to `05249103ab23b3d7cbf30cccfa5747fac90616d6`.

- `b6bdc9e93feeff3b480d5f0b42744f9ea87b000d` — security auth-state removal
- `866c549cf43fe12795180e9f1be859164997176f` — Gmail Operations lifecycle stabilization
- `05249103ab23b3d7cbf30cccfa5747fac90616d6` — control-plane reconciliation

Main worktree/index/unmerged are clean; diff check passed; nine runtime hashes unchanged. `output/playwright/` is ignored and `275` proof files remain local ignored. Push succeeded through a redirect to canonical `cvn74oliver/automata.git`; do not alter configured origin in this packet.

## Preservation objective

Preserve valuable unmerged states without duplicating common main/security/docs truth and without semantic integration.

1. Reconstruct candidate from clean `0524910` main plus the exact six-file candidate-vs-main delta; create and push an explicit named branch/commit. Include only runtime `gmailCleanupWorkspace.ts`, `runtimeStateService.ts`, `OperationsRuntimeContext.tsx`, inbox-analysis route, integration `gmailCleanupWorkspace.ts`, and review `page.tsx`.
2. Commit cleanup's exact three verified local corrections on its existing branch; create/push explicit preservation state.
3. Prove branch/hash parity for both preserved lineages.
4. Retire ambiguous generated worktrees only after parity proof.

## Boundaries

- Mailbox-index route and `gmailWorkspaceContracts.ts` are byte-identical to clean main; do not copy or commit them on the candidate preservation branch.
- Candidate `33ad` remains detached `cce016b` with accepted seven-file correction/build PASS/runtime BLOCKED.
- Cleanup remains `382c9d6` plus exactly three verified local corrections.
- No semantic merge/integration, cleanup merge, runtime route, build, DB/Gmail/Supabase/artifact action, deployment, rebase, history rewrite, or source semantic change.
- Do not retire any worktree before explicit branch/hash parity proof.

## Required reporting

Report exact named branches, commit hashes, six-file delta parity, cleanup three-file parity, push status, and generated-worktree retirement eligibility. Preserve the runtime safety blocker; this packet does not authorize runtime continuation, transfer, Accepted Fix, or Recovery Contract.
