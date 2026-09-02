# ACE-048 Git Publication Safety Audit

Date: 2026-09-02
Status: `AUDIT COMPLETE / PUBLICATION PREPARATION AND NORMAL NON-FORCE PUSH AUTHORIZED`
Governing event: `ACE-048`
Mode: read-only Git provenance and publication discovery

## Executive summary

### What is changing

Nothing has been committed or pushed in this audit. The current detached worktree and the named publication-recovery worktree both contain different uncommitted ACE-048 changes over the same commit.

### What Oliver will get

A safe publication sequence that preserves all accepted framework work, excludes secrets/generated browser state, and uses normal non-force Git history. Publication will proceed only from an exact reviewed path set and branch target.

### Why it matters

The work is valuable and should reach GitHub, but pushing a mixed detached snapshot could omit accepted files, duplicate stale lineage, or publish generated/authentication material. The dirty state must be resolved deliberately rather than hidden.

## Reattested identity

- Canonical remote: `https://github.com/cvn74oliver/automata.git`
- Current detached worktree: `/Users/olivercarlin/.codex/worktrees/8642/ai-agent-platform`
- Current detached `HEAD`: `8f8e4d670cabdd21459c0b4b8e502d16e272afc0`
- Named recovery branch: `codex/ace-048-publication-recovery` at the same commit
- Named branch worktree: `/Users/olivercarlin/Dev/ai-agent-platform`
- Local `main`: `49f863c055787ff0a0eb696a76d4609dd3d7568f`
- `origin/main`: `49f863c055787ff0a0eb696a76d4609dd3d7568f`
- Current `HEAD` versus `main`: `0 behind / 2 ahead`
- Force push required: `NO`

## Dirty-state evidence

Detached Phase 1-4 working tree:

- `23` modified tracked files;
- `32` untracked entries;
- tracked diff: `2,482` insertions and `1,250` deletions across `23` files;
- includes Human-accepted Phase 1-3 framework source, fixtures, review/control-plane artifacts, and the active Phase 4 discovery/target-lock documents.

Named `codex/ace-048-publication-recovery` working tree:

- independently dirty over the same `HEAD`;
- currently contains a smaller/older subset of the accepted source and documentation state;
- cannot be used as a clean branch target or assumed equivalent to the detached worktree.

The two directories must not be merged by copying whole trees or by treating either dirty status as authoritative without a scoped comparison.

## Publication blocker

The exact commit set is not yet target-locked. The current detached worktree contains accepted product work and active Phase 4 planning state, while the named recovery branch is already checked out elsewhere with a different dirty subset. A direct `git add -A`, commit, checkout, merge, or push would violate exact provenance and secret/generated-output safeguards.

No push occurred in this audit.

## Recommended publication packet

After Phase 4 discovery is accepted as the current planning checkpoint:

1. create and verify the normal project/worktree incremental backup with seven-day pruning and `KEEP` preservation;
2. inventory the detached worktree by accepted milestone and classify every changed/untracked path as product source, fixture, authoritative control-plane artifact, proof artifact, generated output, authentication/session state, environment/secrets, or unrelated state;
3. compare the named recovery worktree's dirty subset against the detached accepted state and preserve any unique legitimate path before branch movement;
4. create a new bounded publication branch from the current detached `HEAD` rather than stealing the already-checked-out dirty branch;
5. stage only the reviewed accepted path set; exclude environment files, saved browser/auth state, generated Playwright output, temporary evidence, build output, dependencies, and secrets;
6. run secret/generated-output inspection, `git diff --cached --check`, exact staged-path review, all accepted framework fixtures, targeted TypeScript/lint, and the required runtime regression proof appropriate to the staged source;
7. commit the exact accepted Phase 1-3 implementation plus Phase 4 discovery/target-lock state with an auditable message;
8. reattest live remote `main`, prove non-force integration, integrate through a clean/main-safe path, and push normally;
9. prove local publication commit, `origin/main`, and live GitHub `refs/heads/main` identity after push;
10. do not deploy, mutate providers/data, or delete recovery branches/worktrees as part of Git publication.

## Authorization update

Oliver accepted the recommended sequence on 2026-09-02 and established a standing policy that accepted stable milestones receive both verified backups and exact-scope normal non-force GitHub publication. This authorizes the backup, exact-path provenance classification, new publication branch, staged-path/secret verification, commit, and normal non-force push after the packet identifies the exact commit, branch, destination, exclusions, test result, and fresh remote divergence.

Preparation is now governed by `docs/00_control_plane/runtime/ACE-048_ACCEPTED_FRAMEWORK_BASELINE_GITHUB_PUBLICATION_PACKET.md`. The combined backup is verified, the current detached worktree is the authoritative accepted superset, and named-worktree-only `.DS_Store`/legacy residue is excluded. The packet's numbered allowlist is authoritative and must pass exact staged-path comparison before commit.

Publication result: exact commit `eef994f8a0a668164d68089ecffd4c5efe70b37f` is published normally on `agent/ace-048-accepted-framework-baseline`; draft PR `https://github.com/cvn74oliver/automata/pull/3` targets `main`; local, remote-tracking, and PR head identity match at `0 / 0` divergence. `main` remains unchanged pending the repository review/merge path.

Checkpoint Status: continuity checkpoint created. The dirty state is classified as a real publication backlog, not a reason to perform a blind broad commit. Publication is authorized only through the exact packet; no merge, branch deletion, force operation, deployment, provider action, or data mutation is authorized.
