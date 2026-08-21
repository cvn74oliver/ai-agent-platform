# Codex to Claude Handoff — Automata

Status: AUTHORITATIVE SUCCESSOR HANDOFF — audit-ready, not implementation-ready
Prepared under: `ACE-048 — Automata Revival — Security and Rebaseline`
Date: 2026-08-21

## Executive summary

**What is changing:** Claude Code becomes Automata's future primary implementation environment after the current cleanup, reconciliation, and stabilization boundary. This is a planned successor transition, not an immediate replacement of the active recovery authority.

**What Claude gets:** a preserved repository lineage, a single agent-neutral control plane, an explicit first read-only audit, and bounded next decisions instead of relying on chat history.

**Why it matters:** the system can move to a new implementation environment without losing the Gmail safety work, valuable cleanup semantics, or the evidence needed to make the next change safely.

## Product and architecture

Automata's product goal is no-code specialized AI teams and company automation: a visual builder, agent training/fine-tuning, and governed data logging. Gmail is the current sender-first test domain, not evidence that the general visual builder, model-training lifecycle, or broader company hierarchy is already implemented.

The intended Gmail architecture is: bounded Gmail ingestion/index → single-flight semantic projection → versioned candidate artifacts → semantic/count/identity validation → CAS publication pointer → Operations reads compact immutable published artifacts. Runtime/raw mailbox reconstruction, repeated exact counts, unbounded fanout, and request-time lifecycle mutation are prohibited safety shapes.

The current review experience is a sender-first, dating-app-like review surface. Canonical semantic/cluster taxonomy and sender-distribution intent live in the cleanup lineage. The active `cleanup-taxonomy-rebuild` branch is authoritative for the sender-distribution feature family only; main remains the destination for later unrelated evolution. Integrate by manual semantic union, never by a blind merge, cherry-pick, or blanket ours/theirs resolution. Load the authoritative taxonomy and architecture documents through the control-plane routing map rather than treating this summary as a replacement for them.

## Control plane and active authority

Authority order is Oliver → authoritative control plane → PM Brief/scope → Verifier → Human Review → Executor. The control plane and repository are authority; model memory is not.

`ACE-048` remains the sole active revival/recovery authority. `ACE-049` is queued/inactive. The candidate runtime path is source ACCEPT/HIGH and build-proven, but runtime verification is BLOCKED/HIGH before route navigation because ordinary historical reads may mutate publication/job lifecycle state. It is not an Accepted Fix, no Recovery Contract is due, and its seven-file delta must not transfer to main until a mutation-safe runtime verification strategy is accepted.

For every materially new flow, load `AGENTS.md`, the full required control plane, this handoff, and the relevant scoped brief. For the first Claude session, use the separate assignment below and make no changes.

## Git, branches, and worktrees

At this handoff checkpoint:

| Surface | Live commit / state | Meaning |
| --- | --- | --- |
| `main` | `2ffcae1fdf35ca246a94fc2172bba795f74bd809` | Clean main baseline before these pending handoff documents. |
| `cleanup-taxonomy-rebuild` | `c690dffed054486e7758be344b680ce418a08ee2` | Preserved cleanup lineage with exact three verified local corrections. |
| `codex/ace-048-runtime-isolation-candidate` | `2597caf8a55da22aa4801958e156c2d665641c74` | Seven accepted/build-proven candidate files; runtime remains blocked. |
| `codex/archive/ace-048-intermediate-lifecycle` | `59f6c7a778084ccad4aaa60985a989d807e36af1` | Exact two superseded intermediate source files; archival and non-authoritative. |

Configured `origin` redirects to canonical `https://github.com/cvn74oliver/automata.git`; reconcile the actual configured URL and live refs during the first audit before changing remotes.

The seven governed candidate paths are: `web/src/lib/integrations/gmail/gmailArtifactStore.ts`, `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`, `web/src/app/api/integrations/gmail/inbox-analysis/route.ts`, `web/src/lib/runtime/gmailCleanupWorkspace.ts`, `web/src/lib/runtime/runtimeStateService.ts`, `web/src/components/runtime/OperationsRuntimeContext.tsx`, and `web/src/app/agents/[id]/operations/review/page.tsx`. The archival branch preserves only superseded intermediate bytes for `gmailArtifactStore.ts` and runtime `gmailCleanupWorkspace.ts`; it is evidence, never transfer authority.

Retained worktrees: detached `33ad`, `7865`, `a985`, active CPA `95b7`, and main. A second retirement attempt was refused by destructive-action safety because deleting `33ad` could discard superseded control-plane variants and duplicated local proof. Do not delete any retained worktree without explicit Oliver authority after a uniqueness/parity check. Earlier redundant worktrees `56ab`, `9ae2`, `ad0d`, and a cleanup checkout were removed after redundancy proof; their branches were preserved. `ad0d`'s ignored raw proof/auth files were removed with that worktree and are not Git-recoverable; their outcome/path summaries remain in control-plane history and auth contents were never read.

## What Codex completed

- A full repository, history, and worktree audit; preservation-first lineage handling; and control-plane reconciliation.
- Current-tree auth-artifact containment: tracked browser auth-state files removed/ignored and three exact exposed sessions revoked. Git-history exposure remains open; no history rewrite is authorized.
- Gmail reconnect and bounded Smart Sync/index recovery from `237,628` to `244,628` rows.
- Source/load-safety diagnosis and bounded candidate work, main commits, preservation branches, and ignored-proof cleanup.
- Main history includes the security removal, Gmail lifecycle stabilization, and control-plane reconciliation. These facts do not imply the pending candidate runtime work is accepted.

## Build, test, and runtime truth

Historical main build and Playwright evidence passed on accepted earlier surfaces. The cleanup baseline correction passed earlier. Broad repository lint debt remains historical and is not a repository-wide clean bill of health.

The preserved candidate's source/correction gate is ACCEPT/HIGH. Its recovery production build exited `0` in `21.724s` with BUILD_ID `N3LRSG7T4OiDVM8b8_QNf`. Runtime verification was blocked before opening the canonical route due to the no-mutation safety boundary; it has no product runtime verdict. Do not represent static/build proof as runtime acceptance.

## Supabase and Gmail safety boundaries

- Supabase project: `cjpjekhlvzwjwtszqpmy`.
- Preserve published April artifact `full-mailbox-20260415024237593`.
- August candidate `full-mailbox-20260815081528697` is unpublished and partial/building. Do not resume, reclaim, publish, or mutate it without a separately approved operational decision.
- The mailbox index is fresh through the Aug 15 recovery while the published semantic artifact remains stale. Never call semantic analysis current solely because index data is fresh.
- Never use raw mailbox reconstruction in Operations runtime, repeated polling/exact-count scans, or automatic six-scope rebuild fanout. A read path must be observational; governed maintenance/recovery is a distinct action.

## Open blockers and debt

1. Design and accept safely isolated, non-mutating runtime verification before transferring the seven-file candidate.
2. Refresh the historical 37-path/17-conflict cleanup integration manifest against the corrected branches, then design manual hot-file semantic integration. No merge is authorized.
3. Decide the artifact recovery disposition and any separately governed Supabase action.
4. Resolve Git-history exposure of prior auth blobs through a separately approved remediation.
5. Audit repository bloat/backups, historical lint debt, Vercel/project state, and canonical deployment ownership.
6. Decide whether retained worktrees may be deleted after live branch/control-plane parity is proved.

Vercel identifiers for later audit only: `prj_L3V4M23PH0qlNcI4AMxkFlpZNQcz` and `prj_VjufBbgLNl7D4rS4tUS4qjnvluE2`. Do not place secrets, auth-state contents, or credentials in handoff material.

## Operating lifecycle for Claude

Claim the assignment → create/claim an isolated branch and worktree → lock scope → implement only the brief → verify directly → commit/push intentionally → propagate authoritative control-plane truth → close/retire only when parity and evidence are clear. Never let Claude and Codex directly edit the same worktree concurrently. Preserve useful branches, avoid force/reset/history rewrite, and never use a blind full merge for hot-file lineage.

Default to one capable Claude session. Add a targeted subagent only where it materially improves a bounded task; limited parallel work is allowed only when tasks are genuinely independent and worktrees are separate.

## First and next assignments

The first post-cutover assignment is [`CLAUDE_FIRST_ASSIGNMENT.md`](CLAUDE_FIRST_ASSIGNMENT.md): a read-only institutional audit and reconciliation. It makes no repository, runtime, cloud, or deployment change.

After that audit, the recommended next development planning assignment is to design a safely isolated/non-mutating runtime-verification path and refresh the semantic integration manifest under cleanup sender-distribution authority. Do not merge, transfer the candidate, or begin semantic integration unless those gates are accepted.

## Successor readiness and required decisions

Classification: **SUCCESSOR AUDIT READY / SUCCESSOR IMPLEMENTATION NOT READY**.

Oliver must explicitly decide, after the audit, whether to authorize: (a) deletion of retained worktrees after parity proof; (b) a safe isolated runtime-verification approach or acceptance of the persistent-mutation risk; (c) a Supabase artifact-recovery operational action; and (d) a refreshed cleanup integration plan. `ACE-049` remains inactive until final branch/live/control-plane reconciliation and successor-readiness criteria are explicitly met.

## Lessons and recurring failure modes

- Static, fixture, source, or build success is not runtime/UI acceptance.
- Runtime readers must not mutate artifact publication/job state.
- Cache, response, owner, and UI lifecycle identities must agree; stale lifecycle data can visibly contradict linked surfaces.
- Preserve valuable divergent lineage before integrating it; ref-by-ref or file-by-file analysis beats wholesale merge.
- Supabase safety depends on bounded artifact reads and explicit maintenance paths, not raw fallback convenience.
- Do not infer live Git/worktree/cloud state from historical prose; verify it read-only at the start of each new flow.

## Source-of-truth map

- Root operating doctrine: [`AGENTS.md`](../../../AGENTS.md)
- Active change ledger: [`ACTIVE_CHANGE_EVENTS.md`](../../../ai-agent-platform-docs/06_system_state/ACTIVE_CHANGE_EVENTS.md)
- Current phase/state: [`CURRENT_STATE.md`](../../../ai-agent-platform-docs/06_system_state/CURRENT_STATE.md)
- Exact next actions: [`TODO.md`](../../../ai-agent-platform-docs/06_system_state/TODO.md)
- Progress index: [`EXECUTION_DASHBOARD.md`](../EXECUTION_DASHBOARD.md)
- Document routing: [`SYSTEM_MEMORY_MAP.md`](../../../ai-agent-platform-docs/07_reference/SYSTEM_MEMORY_MAP.md)
- Current bounded runtime context: [`ACE-048_RUNTIME_READ_ISOLATION_PM_BRIEF.md`](../runtime/ACE-048_RUNTIME_READ_ISOLATION_PM_BRIEF.md)

Read these authoritative sources directly. This handoff is an orientation and transfer artifact, not an alternative control plane.
