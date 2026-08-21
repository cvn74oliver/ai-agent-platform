# ACE-048 Final Successor-Handoff Closeout Packet

Status: EXECUTION-READY FOR DOCUMENT TRANSFER ONLY
Governing event: `ACE-048 — Automata Revival — Security and Rebaseline`
Feature domain: successor handoff, Git/worktree preservation, and final reconciliation
Execution mode: `transitional_self_verification`
Reasoning: MEDIUM
Accepted Fix: NO
Runtime acceptance: BLOCKED/HIGH; no product runtime verdict
`ACE-049`: queued/inactive

## Objective

Land the eight bounded successor/control-plane documents, commit and push them through the normal main workflow, then run Claude's first read-only institutional audit. This packet authorizes no source, runtime, cloud, Git-history, or worktree-retirement action.

## Authoritative status

- Main live baseline: `2ffcae1fdf35ca246a94fc2172bba795f74bd809`.
- Cleanup lineage: `c690dffed054486e7758be344b680ce418a08ee2`, with sender-distribution semantics authoritative for that feature family.
- Preserved candidate: `2597caf8a55da22aa4801958e156c2d665641c74`, exact seven accepted/build-proven candidate files. Source ACCEPT/HIGH and build PASS do not authorize transfer; runtime verification is BLOCKED/HIGH before navigation because ordinary reads may persistently mutate publication/job state.
- Preserved archival intermediate: `59f6c7a778084ccad4aaa60985a989d807e36af1`, exact two superseded files and non-authoritative.
- Retained `33ad`, `7865`, `a985`, and CPA `95b7` must not be deleted. A retirement attempt was rejected because `33ad` could still contain superseded control-plane variants and duplicated local proof. Any removal requires explicit Oliver decision after parity/uniqueness proof.
- Git-history auth-blob exposure remains OPEN. Current-tree containment is historical accepted truth only; no rewrite is authorized.

## Locked document scope

Only the following eight files are the current pass:

1. `ai-agent-platform-docs/06_system_state/ACTIVE_CHANGE_EVENTS.md`
2. `ai-agent-platform-docs/06_system_state/CURRENT_STATE.md`
3. `ai-agent-platform-docs/06_system_state/TODO.md`
4. `docs/00_control_plane/EXECUTION_DASHBOARD.md`
5. `docs/00_control_plane/runtime/ACE-048_RUNTIME_READ_ISOLATION_PM_BRIEF.md`
6. `CLAUDE.md`
7. `docs/00_control_plane/handoffs/CODEX_TO_CLAUDE_HANDOFF.md`
8. `docs/00_control_plane/handoffs/CLAUDE_FIRST_ASSIGNMENT.md`

Protected doctrine is not edited. `CLAUDE.md` imports root `AGENTS.md`; it does not duplicate it or establish a parallel control plane.

## Transfer and reconciliation contract

1. Transfer these eight documents byte-exactly into original main only after a preflight confirms the expected old document hashes and no overlap requiring reconciliation.
2. Preserve unrelated dirty state and index state. Do not use broad copies, destructive Git operations, or whole-worktree replacement.
3. Run document diff scope, `git diff --check`, SHA-256 parity, index/unmerged checks, and protected-file invariant checks.
4. Commit and push only after the normal owner-authorized Git workflow confirms the transfer is correct.
5. Then assign Claude the separate read-only audit. It must independently verify live refs, worktrees, handoff claims, and control-plane coherence before any development proposal.

## Non-negotiable boundaries

- No candidate transfer, semantic integration, merge, build, browser route, runtime start, DB/Supabase/Gmail/Vercel/artifact operation, deployment, history rewrite, branch deletion, or worktree deletion in this packet.
- No direct concurrent editing of a worktree by Codex and Claude (or another agent). Use claimed isolated branch/worktree/assignment ownership.
- Do not activate `ACE-049` until the read-only audit, final live reconciliation, and successor-readiness decisions are complete.
- Candidate runtime safety remains a blocker: published artifact reads must not reclaim, publish, or otherwise mutate lifecycle state. The August partial candidate remains untouched.

## Acceptance surfaces

- Exact eight-file document scope and protected-file exclusion.
- Handoff accurately distinguishes audit-ready from implementation-ready and states the explicit operator decisions still needed.
- Root Claude entrypoint imports `AGENTS.md`, sends the first session to a read-only audit, preserves agent-neutral authority, and prevents concurrent shared-worktree editing.
- Formal handoff includes active authority, lineage/ref/worktree state, runtime proof limits, safety constraints, blockers, and source-of-truth routing without secrets.
- First assignment is self-contained and prohibits all mutations/runtime/cloud operations.

## Next sequence

1. Documentation Propagation Executor transfers, commits, and pushes these eight documents.
2. Claude performs the first read-only institutional audit and reports discrepancies/risks/authoritative next step.
3. Oliver decides on retained-worktree deletion, a mutation-safe runtime-verification design, artifact recovery governance, and a refreshed cleanup semantic-integration plan.
4. Only then may a separately scoped PM Brief seek to advance `ACE-048` or activate `ACE-049`.

## Artifact status

- `CLAUDE.md`: created, authoritative Claude entrypoint.
- `CODEX_TO_CLAUDE_HANDOFF.md`: created, authoritative successor continuity/handoff artifact.
- `CLAUDE_FIRST_ASSIGNMENT.md`: created, authoritative first-session read-only assignment.
- Local proof/auth output remains ignored and non-authoritative; no secret/auth content is part of this packet.

Checkpoint Status: propagation required before closeout. This packet stays open until the eight documents are byte-exactly transferred to original main and committed/pushed through the governed workflow.
