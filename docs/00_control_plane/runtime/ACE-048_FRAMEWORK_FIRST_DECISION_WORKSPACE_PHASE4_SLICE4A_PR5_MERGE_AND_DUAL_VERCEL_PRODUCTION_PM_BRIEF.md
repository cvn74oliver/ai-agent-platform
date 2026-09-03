# ACE-048 Framework-First Decision Workspace — Phase 4 Slice 4A PR #5 Merge and Dual-Vercel Production PM Brief

Date: 2026-09-04
Governing event: `ACE-048 — Automata Revival — Security and Rebaseline`
Problem class: `artifact / publication truth with automatic deployment/runtime consequence`
Execution mode: `transitional_self_verification`
Reasoning level: `HIGH`
Execution readiness: `target-locked / execution-ready after post-propagation verifier ACCEPT`
Status: `HUMAN AUTHORIZED / TARGET PROPAGATION AND RE-VERIFICATION PENDING`

## Executive summary

### What is changing

Merge the already verified provider-neutral endpoint-integrity and execution-ledger foundation into `main` and allow the two linked Vercel projects to deploy it automatically.

### What Oliver gets

The generalized framework foundation becomes available in production while Gmail remains the reference adapter and its accepted behavior stays protected.

### Why it matters

This completes the foundational publication step so forward application development can resume from a safer, provider-neutral execution base.

## Authority

Oliver issued exact `ACCEPT PR #5 MERGE + AUTOMATIC DUAL VERCEL PRODUCTION CONSEQUENCES` after independent verifier `ACCEPT / HIGH` on PR #5 at `72c05a8058b46eb421a7ec9dfc4e9372ef34a852`.

That decision authorizes the bounded sequence in this brief: pre-merge recovery, exact GitHub merge-commit integration, automatic production consequences in the two linked Vercel projects, and read-only post-merge verification. It does not authorize any excluded provider, data, database, manual-deployment, or live-execution action.

This brief is being added by a five-path documentation propagation commit. Because that commit necessarily changes the PR head, the merge executor must use the full post-propagation head identity reported by the propagation executor and independently accepted by the next verifier. The `72c05a8` verifier result does not by itself cover that final merge target.

## Objective

After fresh independent verifier `ACCEPT` on the exact post-propagation target, merge exactly PR #5 into unchanged `main@98b513ffaf1f1490b90601fd55ec1e8d4ec6515c` using GitHub's merge-commit method, preserve the source branch, observe both automatic Vercel production deployments to terminal state, and prove the final Git, deployment, Supabase, and production UI/runtime truth without invoking Execute or mutating provider/customer data.

## Feature domain and protected product contract

- Feature domain: provider-neutral Decision Workspace endpoint integrity and execution-ledger foundation.
- Gmail remains the reference adapter, not the framework identity.
- Preserve provider-neutral framework semantics, multi-source/workflow/agent-role provenance, human-governed approvals, deterministic presentation metadata, and accepted Gmail behavior.
- The merge introduces no new source beyond the independently accepted PR head.
- Existing routes, counts, labels, actions, request families, provider controls, polling behavior, and close/return behavior remain regression-protected.

## Immutable target-lock model

### Pre-propagation candidate

- Repository: `cvn74oliver/automata`
- Pull request: [PR #5](https://github.com/cvn74oliver/automata/pull/5)
- Head branch: `codex/ace-048-phase4-endpoint-integrity-discovery`
- Independently accepted pre-propagation head: `72c05a8058b46eb421a7ec9dfc4e9372ef34a852`
- Locked base: `main@98b513ffaf1f1490b90601fd55ec1e8d4ec6515c`
- Accepted pre-propagation comparison: `0 behind / 24 ahead`, `46` files, `6,564` additions, `287` deletions
- Accepted pre-propagation previews:
  - canonical `ai-agent-platform`: `dpl_5SXoAPVnR2t79umHurJz9BzyfGFk`
  - duplicate `ai-agent-platform-e6cc`: `dpl_AbP6Hzyr6FWoeJHZ5CmQJSVsrR3g`

### Final merge target

- Final head: the resulting live branch head after the exact five-path merge-authority propagation commit.
- The propagation executor packet is the authoritative carry-forward identity because a Git commit cannot contain its own hash.
- Base must remain exactly `main@98b513ffaf1f1490b90601fd55ec1e8d4ec6515c`.
- Before merge, local HEAD, upstream, live head branch, PR head, and both exact-head preview metadata must identify the same final head.
- Before merge, `origin/main` and live GitHub `main` must remain the locked base.
- PR #5 must remain the sole PR for the head branch, `OPEN+DRAFT`, unmerged, `autoMergeRequest=null`, and `MERGEABLE/CLEAN` as applicable.
- Both exact-post-propagation preview deployments and both GitHub Vercel contexts must be `READY/success`.
- Production must remain unchanged on `main@98b513f` until the merge.
- Any base, head, PR, comparison, preview, production, migration, or ledger drift stops execution before merge.

## Exact merge scope

- Use GitHub's merge-commit method only.
- Do not squash or rebase.
- Supply the exact independently accepted post-propagation head as the expected head identity.
- Convert PR #5 from draft to ready only immediately before the merge and only after every pre-merge lock passes.
- Preserve the source branch; do not delete it.
- Do not edit any local file, stage, create a commit, push, force, reset, rewrite history, or change the checked-out branch.
- A single bounded post-merge fetch of `main` is allowed solely to align and attest `origin/main`; it must not alter the checked-out branch or worktree.
- Confirm the merge commit has exactly two ordered parents: locked base first and accepted head second.
- Confirm the merge commit tree is byte-identical to the accepted head tree.
- Observe the automatic Vercel consequences; do not trigger a manual deployment.

## Pre-merge recovery contract

Before converting or merging the PR, the merge executor must:

1. Run `/Users/olivercarlin/Documents/Backups/backup-projects.sh` for a project-scoped incremental backup.
2. Use normal seven-day project-scoped pruning and preserve every `KEEP` archive.
3. Record the clean worktree, checked-out branch, exact final head, locked base, PR number/state, and restore guidance.
4. Verify archive/readback evidence required by the shared workflow.
5. Stop before merge if the backup cannot run or cannot be verified.

The backup is a recovery prerequisite, not authority to delete, prune beyond policy, reset, or restore any working state.

## Pre-merge verification gate

A fresh independent read-only verifier must return `ACCEPT / HIGH` for the post-propagation target before the merge executor begins. The verifier must confirm:

- the propagation delta contains exactly the four active control-plane files plus this PM Brief;
- the five documents are consistent and preserve the authority boundary;
- worktree clean and exact local/upstream/live head equality;
- locked base unchanged locally and live;
- sole PR #5 is `OPEN+DRAFT`, unmerged, auto-merge absent, and mergeable/clean;
- fresh divergence, file count, additions, and deletions;
- both exact-head automatic previews are non-production `READY/success`, with no alias error;
- both existing production deployments remain unchanged on `main@98b513f`;
- migration `20260902141603`, both ledger tables, all four expected RPCs, and ledger `0 runs / 0 actions` remain intact;
- verifier mutation/prohibition counts are zero.

If the verifier returns `REJECT` or `BLOCKED`, do not merge. Return to PM.

## Automatic deployment lifecycle contract

Expected lifecycle:

`GitHub merge commit` → `automatic canonical production build` + `automatic duplicate-project production build` → `both READY/success` → `post-settle verification`

Rules:

- Do not manually deploy, retry, redeploy, promote, roll back, change aliases/domains, change environment variables/secrets, or change Vercel configuration.
- Observe deployment and GitHub status transitions through bounded read-only polling only.
- If either automatic deployment fails, is canceled, develops an alias error, targets the wrong commit/environment, or does not settle within the bounded observation window, stop and report the exact state. Do not repair or retry without new authority.
- No new application request family, background job, or polling behavior is introduced by the merge. Only verifier-side Vercel status observation is expected.
- Expected application steady-state request shape remains unchanged from the accepted Gmail baseline.
- Build-pending continuity, build completion/continuity exit, Smart Sync handoff, stale-build reclaim, provider execution, cache behavior, and scheduler behavior remain unchanged.
- Once deployed, the ledger-enabled execute route is available but dormant. Do not click Execute, call `POST /api/runtime/execute`, or invoke a live ledger RPC.

## Post-merge Git and GitHub verification

Independently prove:

- PR #5 is `MERGED`, not merely closed;
- exact merge commit identity and timestamp;
- ordered parents are accepted base then accepted head;
- merge tree equals the accepted head tree byte-for-byte;
- live `main`, `origin/main` after the bounded fetch, and GitHub PR merge identity match;
- source branch still exists at the accepted head;
- no force push, branch deletion, squash, rebase, reset, or unrelated ref mutation occurred;
- the worktree remains clean and the checked-out branch is unchanged.

## Post-merge Vercel verification

Identify the two automatic production deployments created from the exact merge commit:

- canonical project `ai-agent-platform` (`prj_L3V4M23PH0qlNcI4AMxkFlpZNQcz`);
- duplicate project `ai-agent-platform-e6cc` (`prj_VjufBbgLNl7D4rS4tUS4qjnvluE2`).

For each deployment, prove:

- source commit is the exact merge commit on `main`;
- target is `production`;
- terminal state is `READY`;
- applicable GitHub status context is `success`;
- `aliasError=null`;
- expected aliases remain intact;
- bounded deployment logs and runtime-error scans show no new deployment-scoped `5xx`, runtime exception, missing environment key, or startup failure.

Any new deployment-scoped runtime error blocks closeout even if the build status is `READY`.

## Supabase and live-ledger verification

Load `/Users/olivercarlin/.codex/skills/supabase/SKILL.md` before Supabase inspection. Use read-only evidence only to prove:

- project `cjpjekhlvzwjwtszqpmy` remains the target;
- migration `20260902141603_add_decision_workspace_execution_ledger` remains applied;
- `decision_workspace_execution_runs` and `decision_workspace_execution_actions` remain present;
- exactly the four expected ledger RPCs remain present;
- live ledger remains exactly `0` runs / `0` actions.

Do not apply or repair migrations, mutate schema/data, insert cleanup rows, or invoke the RPCs.

## Production UI/runtime accepted proof

### Canonical target

- Origin: `https://www.orinexlabs.com`
- Agent: `d256b48e-5acf-4b3d-af22-003d52e7e582`

### Required routes

1. `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/approvals`
2. `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/management`
3. `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions&subset_source=review_unit&subset_value=family%3Aoffer_campaign&sender_overview_window=last_month`
4. `/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions&subset_source=review_unit&subset_value=review-unit%3Asemantic_parent_subscription_senders_family_marketing_promotional%3Asubtype-marketing_promotional_remainder%3Apattern-promotional_cycle&sender_overview_window=last_month`

Load `/Users/olivercarlin/.codex/skills/playwright/SKILL.md` before this verification. Reuse saved authentication or environment-backed credentials first. Request only the narrow authentication bootstrap if unavoidable, persist/reuse that state, and resume the same verification flow.

### Ready-state contract per route

- exact canonical URL and required identifiers retained after navigation;
- target content and decisive Gmail presentation/approval/action surface visible;
- no skeleton, loading indicator, initialization state, or fallback-only copy;
- no runtime overlay;
- no page or console error;
- route-specific accepted content is settled before evidence capture;
- no action control is invoked.

### Required artifact proof

For each route, capture after settle:

- screenshot with decisive surface in frame and stable artifact path;
- DOM/state snapshot tied to the same settled state;
- request trace tied to the same settled state;
- console/page-error state;
- observed request families and settled request count.

Produce a four-row State Transition Matrix with one cold-load row per route and these columns:

| Mode / Path | Baseline visible state before action | Operator action performed | Settled visible state after action | Downstream gate/status/result after action | Remaining blocker | Separate blocker? | Verdict |
|---|---|---|---|---|---|---|---|

The operator action for each row is cold-load navigation only. Do not invoke Execute, approve/reject a request, open provider mutation, or change data.

### Regression and load protections

- Preserve accepted Gmail counts, labels, routes, actions, request families, provider controls, and close/return behavior.
- Verify Approvals and Management remain consistent with their accepted surfaces.
- Verify both exact review routes retain selected-unit identity, expected presentation, and linked-surface parity.
- If live data legitimately changed, distinguish data drift from rendering/runtime failure using direct evidence; do not guess or require stale historical counts to match.
- Report every observed request family as required, harmless background, or unexpected/interfering.
- Require no settled polling loop, request storm, repeated heavy overlap, failed request, or interfering `409` churn.
- Final visible UI truth overrides machine-readable proof if they conflict.
- Verification Confidence must be `HIGH` for closeout.

## Failure and rollback boundaries

- If any immutable lock drifts before merge, stop without converting or merging the PR.
- If backup verification fails, stop before merge.
- If merge succeeds but a deployment, runtime, UI, Git, or Supabase check fails, do not force-push, reset, revert, redeploy, retry, promote, change Vercel configuration, invoke providers, mutate Supabase, or delete branches.
- Report the exact failure and return to PM for a separately authorized recovery plan.
- The immediate recovery posture is containment and evidence preservation, not automatic rollback.
- A Recovery Contract is authored only after successful independent verification and Human accepted closeout; do not create one during target propagation or merge execution.

## Explicit exclusions

This authority does not permit:

- source, migration, test, or unrelated documentation edits;
- local staging, commits, pushes, branch switching, history rewriting, reset, or source-branch deletion during merge execution;
- squash or rebase merge;
- manual Vercel deploy/redeploy/retry/promotion/rollback or project/domain/environment/secret/configuration change;
- migration create/apply/repair/revert or schema/data mutation;
- live execute-route or execution-ledger RPC invocation;
- provider, model, customer, Gmail, or other business-data action;
- canary or true concurrent-session proof;
- automatic retry or reconciliation activation;
- new application polling, request, cache, scheduler, or background lifecycle behavior;
- Smart Sync, reindex, artifact/index build/publication/promotion/rollback, or pointer change;
- unrelated workflow, multi-agent orchestration, shared-learning, marketplace, or proprietary-brain implementation.

## Required execution sequence

1. Receive the propagation executor's exact final head, comparison, and preview identities.
2. Obtain fresh independent verifier `ACCEPT / HIGH` on the exact five-file propagation and immutable merge target.
3. Reattest all locks immediately before mutation.
4. Create and verify the governed incremental recovery backup.
5. Reattest the locks again after backup.
6. Convert PR #5 to ready and immediately merge it using GitHub merge-commit semantics with the exact expected head.
7. Preserve the source branch.
8. Observe both automatic production deployments through bounded read-only polling.
9. Complete Git/GitHub, Vercel/log, Supabase/ledger, and Playwright production verification.
10. Hand a complete merge/deployment/runtime packet to a fresh independent verifier.
11. On verifier `ACCEPT`, return to PM for Human accepted closeout and required final propagation, Recovery Contract, accepted backup/Git closeout, and task archival.

## Independent post-merge verifier decision

The fresh verifier must return exactly one:

- `ACCEPT` — every Git, deployment, Supabase, runtime, UI, and prohibition contract passes at `HIGH` confidence;
- `REJECT` — implementation or visible truth is incorrect;
- `BLOCKED` — required proof cannot currently be obtained after bounded continuation and any narrow authentication assist.

Partial proof is not completion. Human Review does not replace independent verification.

## Closeout and propagation requirement

After successful merge verification and Human acceptance, final propagation must record:

- exact merge commit, ordered parents, and tree equality;
- final local/tracking/live Git parity and preserved source branch;
- both automatic production deployment IDs, aliases, status contexts, and runtime-log result;
- four-route production proof and State Transition Matrix artifact locations;
- Supabase migration/table/RPC presence and ledger `0 / 0` baseline;
- prohibited-operation counts;
- Human acceptance;
- authoritative Recovery Contract in `CHANGELOG.md` with ACE reference;
- dashboard and TODO closeout;
- accepted recovery backup and Git preservation evidence.

No milestone closeout or one-time task archival may occur before this propagation is complete.

## Checkpoint classification

`Checkpoint Status: continuity checkpoint created`

- Pending state: post-propagation immutable head and previews require fresh independent verification before merge.
- Classification: approved plan and artifact/publication authority.
- Same-flow continuation is allowed only if ACE, phase, scope, base, PR, head, production, and ledger truth remain unchanged.
- After verifier `ACCEPT`, immediate same-flow merge execution is authorized under Oliver's recorded exact decision.
