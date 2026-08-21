# Claude First Assignment — Read-Only Institutional Audit

## Assignment

Perform a read-only reconciliation of Automata's repository, control plane, branches, worktrees, and handoff claims. Do not modify anything.

## Required reading

1. Read root `CLAUDE.md` and the imported root `AGENTS.md` completely.
2. This is a new governed flow: load the full authoritative control plane required by `AGENTS.md`, including `CURRENT_STATE.md`, `TODO.md`, `ACTIVE_CHANGE_EVENTS.md`, and `PROJECT_MANAGER_CONTEXT.md`.
3. Read [`CODEX_TO_CLAUDE_HANDOFF.md`](CODEX_TO_CLAUDE_HANDOFF.md) and the routing/architecture documents it identifies.
4. Inspect current assignments and relevant PM/runtime briefs before forming a recommendation.

## Read-only audit steps

1. Verify checked-out main, local/tracking/live refs, configured origin/redirect behavior, and the stated branch commits.
2. Audit the actual worktree list, each worktree's HEAD/status/index/unmerged state, and whether retained worktrees contain material state not preserved on a named branch or in authoritative docs.
3. Reconcile the source-of-truth documents, current `ACE-048` status, queued/inactive `ACE-049`, and handoff claims with live Git state.
4. Inspect repository and architecture documentation needed to explain the Gmail index, semantic artifacts, publication pointer, runtime-read safety contract, cleanup sender-distribution authority, and integration constraints.
5. Identify factual discrepancies, stale claims, missing proof, unsafe assumptions, and any decision that needs Oliver rather than an agent.

## Prohibitions

Do **not** edit files; stage, commit, push, merge, rebase, reset, delete branches/worktrees, deploy, start runtime routes, run browser verification, or perform Supabase, Gmail, Vercel, artifact, or database operations. Do not attempt to resolve any discrepancy. Do not inspect or surface secrets/auth state.

## Required report

Return a concise, evidence-linked report containing:

- your understanding of the product, architecture, authority model, and current ACE;
- verified Git refs/worktrees and discrepancies from the handoff, if any;
- risks and explicit operator decisions needed;
- the authoritative next step, with a readiness classification; and
- whether the handoff documents match live state.

Explicitly distinguish **successor audit readiness** from **successor implementation readiness**. The expected starting classification is audit-ready, not implementation-ready. Do not activate `ACE-049` or begin development.
