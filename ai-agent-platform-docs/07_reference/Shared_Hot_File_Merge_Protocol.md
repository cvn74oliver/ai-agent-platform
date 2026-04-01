# Shared Hot-File Merge Protocol

Last updated: 2026-04-01

## Purpose

This document is the authoritative operating-model reference for shared hot-file merge work.

It defines:
- the current shared hot-file registry
- how merge preflight must be classified
- when full git merge is prohibited
- the default merge bias rules Codex should apply during integration
- the fallback path for docs-only sync
- the escalation rule when Codex cannot safely complete integration

Use this document when the task involves:
- shared hot-file overlap between `main` and a worktree
- merge preflight for worktree sync
- docs-only sync fallback after an unsafe full merge
- PM packaging of a dedicated hot-file integration pass

---

## Current Shared Hot Files

The current shared hot-file registry is:
- `web/src/app/agents/[id]/operations/review/page.tsx`
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/lib/integrations/gmail/inboxAnalysis.ts`

PM owns changes to this registry.
Do not add or remove files from the list implicitly during execution.

---

## Merge Classes

All worktree sync and merge work must be classified into one of four classes:

### 1. `docs_only_sync`

Use when only approved control-plane, operating-model, or proof files need to move.

### 2. `standard_merge_allowed`

Use when code may merge normally because no shared hot file is changed on both sides.

### 3. `hot_file_integration_required`

Use when at least one registered shared hot file is changed on both sides.

### 4. `stop_and_rescope`

Use when overlap extends beyond the declared lane or unexpectedly touches multiple subsystems.

---

## Merge Preflight

Preflight must compare both sides from the merge base.
Do not classify from a one-sided diff only.

Minimum preflight packet:
- target branch
- source branch
- merge-base commit
- target-side changed files
- source-side changed files
- overlapping files
- overlapping hot files
- resulting classification

Example command flow:

```bash
git fetch origin
git merge-base origin/main HEAD
git diff --name-only "$(git merge-base origin/main HEAD)" origin/main
git diff --name-only "$(git merge-base origin/main HEAD)" HEAD
```

Classification rule:
- if overlap includes a registered shared hot file, classification must be `hot_file_integration_required`

Hard rule:
- if classification = `hot_file_integration_required`
- full git merge is prohibited
- route the work into a dedicated Codex integration pass

---

## Default Merge Bias Rules

Unless PM explicitly overrides them in the pass:

- UI files prefer `main`
- Runtime logic prefers the active worktree lane
- Imports should union both sides unless the conflict is semantic
- Types and interfaces should prefer the superset, not reduction

These are default integration biases, not permission to widen scope.
If applying them would change product intent or architecture, stop and return to PM.

---

## Docs-Only Sync Fallback

Use docs-only sync when:
- the task is control-plane or documentation alignment only
- an unsafe full merge was started by mistake while the real need was doc alignment

Fallback workflow:
1. Preserve any resolved docs that should survive.
2. Abort the unsafe full merge.
3. Restore only approved docs/control-plane paths from the source branch.
4. Review the docs-only diff.
5. Commit and push the docs-only sync.
6. Open or continue a separate hot-file integration pass if shared hot files remain unresolved.

`ACE-011` remains the historical recovery example for this path.

---

## Dedicated Codex Integration Pass

When classification is `hot_file_integration_required`, PM must issue a dedicated Codex pass.

Required packet contents:
- target branch
- source branch
- merge-base commit
- overlapping hot files
- any non-hot companion files explicitly allowed in scope
- preserve-from-main notes
- preserve-from-worktree notes
- validation surfaces
- related ACEs or specs

Codex should:
1. Load the control plane and this protocol doc.
2. Restate the exact integration scope.
3. Compare merge base vs target vs source intentionally.
4. Integrate outside a blind full-merge flow.
5. Validate the affected surfaces.
6. Return a PM REVIEW PACKET that explains what was preserved, changed, and still needs review.

Oliver is not the default manual merge resolver for this class of work.

---

## Failure Escalation

If Codex fails the same hot-file integration twice:
- stop
- return to PM for decision
- do not retry blindly

At that point PM decides whether to:
- narrow scope
- override the default merge bias
- split the pass further
- defer the integration

---

## Role Split

Oliver:
- defines direction
- approves the result
- does not manually reconcile shared hot-file conflicts by default

PM:
- owns classification
- owns the hot-file registry
- defines preserve-from-main and preserve-from-worktree priorities
- reviews Codex integration output

Codex:
- executes preflight when assigned
- performs docs-only sync and hot-file integration as separate operations
- follows the hard prohibition on full merge for shared hot-file overlap
