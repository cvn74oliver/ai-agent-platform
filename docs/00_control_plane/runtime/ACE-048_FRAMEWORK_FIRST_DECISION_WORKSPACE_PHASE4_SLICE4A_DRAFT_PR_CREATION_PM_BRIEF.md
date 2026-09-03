# ACE-048 Framework-First Decision Workspace — Phase 4 Slice 4A Draft PR Creation PM Brief

Date: 2026-09-03
Governing event: `ACE-048 — Automata Revival — Security and Rebaseline`
Problem class: `artifact / publication truth`
Execution mode: `transitional_self_verification`
Reasoning level: `HIGH`
Execution readiness: `target-locked / execution-ready`
Status: `AUTHORIZED / PENDING EXECUTOR`

## Executive summary

### What is changing

Create one draft GitHub pull request that places the already accepted endpoint-integrity and execution-ledger source into a reviewable comparison against `main`.

### What the operator will get

A single protected review surface for the accepted source baseline plus its exact five-path authority-propagation commit, with no merge, production deployment, database change, provider action, or live execution.

### Why it matters

The accepted source is already preserved on its branch and both automatic branch previews are healthy. A draft PR is the smallest safe next checkpoint before Oliver separately decides whether production should receive the ledger-enabled source.

## Objective

Create exactly one draft PR from the immutable post-propagation branch head to the exact current `main` base, verify its identity and non-production consequences independently, and stop at a separate merge-plus-automatic-Vercel-consequences decision gate.

## Accepted discovery result

- Local branch, upstream tracking ref, and live GitHub branch match at `9c68b15fe0131470c105526e1defbcfe0c681fd1`.
- `origin/main` and live GitHub `main` match at `98b513ffaf1f1490b90601fd55ec1e8d4ec6515c`.
- The worktree is clean.
- The branch is `0` commits behind and `22` commits ahead of `main`.
- Before authority propagation, GitHub reports an exact `45`-file comparison with `6,381` additions and `285` deletions. This is the accepted source baseline, not the final executor comparison.
- No product source changed after the accepted Stage C2 content commit `4db0a7086ce9e7a89cd0c0cdeec04a21a73f4384`; only Stage C2 closeout and control-plane documentation changed afterward.
- No PR currently exists for this branch.
- GitHub `main` is not branch-protected, so draft state and the separate merge gate are mandatory safeguards.
- Both automatic branch preview deployments for exact head `9c68b15` are `READY`:
  - canonical `ai-agent-platform`: `dpl_6V58yZuUPwteLrxhgHob4VVg3VDx`;
  - duplicate `ai-agent-platform-e6cc`: `dpl_JBTe2yPz5z5Ufm8CJSyskvivCjkJ`.
- Both production projects remain on `main@98b513f`:
  - canonical production: `dpl_9VFDctCf6hgEGrveED3iAdDWXumG`;
  - duplicate production: `dpl_921pTKPexxgqJaSg3kmVdVwjGYck`.
- Supabase project `cjpjekhlvzwjwtszqpmy` records migration `20260902141603_add_decision_workspace_execution_ledger` as applied.
- Both execution-ledger tables and all four required RPC functions exist.
- Live ledger state remains exactly `0` execution runs and `0` execution actions.
- Repository GitHub/Vercel build configuration does not automatically apply Supabase migrations.
- `POST /api/runtime/execute` is reached only from an explicit Execute control after an approved request; no page-load, background, polling, or automatic-retry caller was found.

## Corrected immutable target lock

### GitHub repository

- Repository: `cvn74oliver/automata`
- Head branch: `codex/ace-048-phase4-endpoint-integrity-discovery`
- Accepted source baseline: `9c68b15fe0131470c105526e1defbcfe0c681fd1`
- Required propagation delta: exactly the five documentation paths listed below, committed once on the same branch and pushed normally without force
- Final executor head: the resulting live branch head after that exact propagation commit; the propagation closeout report must record its full commit identity
- Base branch: `main`
- Base commit: `98b513ffaf1f1490b90601fd55ec1e8d4ec6515c`
- Final divergence and comparison: measured only after the propagation push and recorded in the propagation closeout report; the executor must use those freshly measured values
- Local worktree state: clean

Required propagation paths:

1. `ai-agent-platform-docs/06_system_state/ACTIVE_CHANGE_EVENTS.md`
2. `ai-agent-platform-docs/06_system_state/CURRENT_STATE.md`
3. `ai-agent-platform-docs/06_system_state/TODO.md`
4. `docs/00_control_plane/EXECUTION_DASHBOARD.md`
5. `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE4A_DRAFT_PR_CREATION_PM_BRIEF.md`

The post-push branch head and its freshly measured comparison are the executor's immutable target. The executor must not modify any file, create any commit, push any ref, rewrite either branch, or substitute another head/base identity.

### Draft PR contract

- Create exactly one PR.
- Required state: `DRAFT`.
- Required base/head: exact `main@98b513f` plus the post-propagation live head recorded by the propagation closeout report.
- Auto-merge must be absent.
- Recommended title: `ACE-048 Phase 4 endpoint integrity and execution ledger foundation`.
- The PR body must summarize:
  - the accepted Slice 3 endpoint-integrity correction;
  - the accepted Slice 4A ledger foundation and applied migration dependency;
  - the accepted Stage C1 and Stage C2 proof boundaries;
  - both successful exact-head preview deployments;
  - the explicit statement that merge, production deployment, live execution, provider/data action, concurrency/canary, retry/reconciliation, and artifact publication remain unauthorized.

## Allowed operation

The sole allowed mutation is creation of the exact draft GitHub PR described above.

No local repository change is authorized. If an existing PR appears during preflight, the executor must stop and return to PM rather than creating, editing, reopening, or superseding it.

## Required execution sequence

1. Recover the post-propagation full head identity, divergence, file count, additions, deletions, and preview identities/statuses from the propagation closeout report.
2. Reattest clean local/upstream/live equality at that exact head and freshly measure the same base/head comparison.
3. Reattest that no PR exists for the locked head branch.
4. Reattest both post-propagation exact-head Vercel previews are `READY` and both production deployments remain on `main@98b513f`.
5. Reattest migration `20260902141603`, the two ledger tables, the four RPCs, and live ledger `0 / 0` using read-only evidence only.
6. Create exactly one draft PR with the locked title/body contract and no auto-merge.
7. Hand the resulting PR packet to an independent verifier.
8. After verifier `ACCEPT`, return to PM with a separate explicit merge-plus-automatic-Vercel-consequences decision gate. Do not merge.

## Independent verification contract

The verifier must confirm:

- PR state is `DRAFT`;
- repository is `cvn74oliver/automata`;
- base is `main@98b513ffaf1f1490b90601fd55ec1e8d4ec6515c`;
- head is `codex/ace-048-phase4-endpoint-integrity-discovery` at the exact post-propagation commit recorded in the propagation closeout report;
- the base/head divergence, file count, additions, and deletions exactly match the post-push reattestation rather than the obsolete pre-propagation 45-file snapshot;
- auto-merge is absent and the PR is not merged;
- both exact-head Vercel status contexts remain successful;
- both production projects remain on `main@98b513f` and no production deployment was created by this pass;
- migration/RPC/table presence remains intact and live ledger remains `0 / 0`;
- no provider, customer-data, execute-route, ledger-RPC, migration, canary, concurrency, retry/reconciliation, or artifact publication action occurred;
- local worktree and branch refs were not mutated.

Verifier decision must be `ACCEPT`, `REJECT`, or `BLOCKED`. Only `ACCEPT` may return the merge decision surface to PM.

Playwright is intentionally not required because the accepted surface is GitHub/Vercel/Supabase artifact and publication identity, not rendered UI behavior. GitHub, Vercel, Supabase, and local Git evidence are the authoritative proof sources.

## Automatic consequences and later gate

- The accepted source-baseline push generated two non-production preview deployments. The authority-propagation push may generate a new preview pair; both exact-post-propagation-head contexts must settle successfully before executor handoff. PR creation must then reuse that head and must not activate production.
- A later merge to `main` will automatically trigger production deployments in both linked Vercel projects.
- The canonical project owns `orinexlabs.com` and `www.orinexlabs.com`; the duplicate project also creates its own production deployment.
- Once a merge deploys, the ledger-enabled execute route becomes available in production, although provider execution remains dormant until a user explicitly invokes Execute on an approved request.
- Merge does not itself apply Supabase migrations; the required migration is already live.

The exact later decision must explicitly authorize both the merge and its automatic Vercel production consequences. Draft-PR acceptance alone must never be interpreted as that authority.

## Explicit exclusions

This brief prohibits:

- file edits or generated source changes;
- staging;
- commits;
- pushes or force operations;
- branch creation, deletion, rewriting, or synchronization;
- PR merge, ready-for-review conversion, auto-merge, or PR closure;
- direct or automatic production deployment initiated by the executor;
- Vercel project, domain, environment, secret, deployment, promotion, rollback, or configuration changes;
- migration create/apply/repair/revert or schema change;
- live `POST /api/runtime/execute` invocation;
- live execution-ledger RPC invocation;
- provider, model, customer, Gmail, or database-data action;
- persistent test rows or cleanup/deletion;
- canary or true concurrent-session proof;
- retry, reconciliation, polling, cache, scheduler, or background-lifecycle activation;
- artifact/index build, publication, promotion, rollback, or pointer change;
- task/thread archival before propagation and verifier completion.

## Stop conditions

Stop and return to PM if:

- the executor's live head, divergence, file count, additions/deletions, or preview identities/statuses differ from the post-push propagation closeout report;
- any base identity, worktree state, migration dependency, ledger count, production deployment, or other Vercel state drifts;
- any existing PR is discovered for the head branch;
- draft state or no-auto-merge cannot be guaranteed;
- PR creation would require a local edit, stage, commit, push, branch change, merge, deployment, migration, provider/data action, or live execution;
- GitHub authentication or repository authority is unavailable;
- verification discovers new governing truth.

## Authorization

Oliver issued exact `ACCEPT PHASE 4 SLICE 4A DRAFT PR CREATION` and then exact corrected target decision `ACCEPT DRAFT PR WITH PROPAGATION COMMIT` on 2026-09-03. These decisions authorize this exact five-path propagation commit and, after its post-push head/comparison/preview lock is reported, one fresh bounded executor to create and verify the draft PR only. They do not authorize any excluded operation or the later merge/deployment gate.
