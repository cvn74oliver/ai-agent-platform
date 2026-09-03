# ACE-048 Phase 4 Slice 4A Stage B — Migration Application Review Packet

Date: 2026-09-03
Governing event: `ACE-048`
Execution mode: `transitional_self_verification`
Problem class: runtime behavior — additive schema installation only
Verifier decision: `ACCEPT`
Verification confidence: HIGH
Status: HUMAN ACCEPTED / RECOVERY BACKED / GITHUB PRESERVED / CLOSED

Checkpoint Status: none — Human acceptance, the Recovery Contract, the verified `2,588`-file acceptance backup, and accepted-content GitHub preservation are recorded; no unpropagated Stage B state remains.

## Executive summary

### What changed

The accepted execution-ledger migration was installed once in the live Automata Supabase project. It added two empty protected ledger tables, three indexes, and four service-role-only database functions.

### What the operator gets

Automata now has the dormant database foundation needed to safely claim an approved run and later record each action's outcome and provenance. Nothing is using that foundation yet.

### Why it matters

This prepares the framework for accountable execution across Gmail and future provider/business workflows without changing what users see or causing any provider action today.

## Exact target and application evidence

- Project: `cjpjekhlvzwjwtszqpmy` (`agent_platform`), `ACTIVE_HEALTHY`, Postgres `17.6.1.084`.
- Branch/HEAD before application: `codex/ace-048-phase4-endpoint-integrity-discovery` at `4ab5253504a885986c66890eb5f4f163106ed4f4`.
- Migration: `20260902141603_add_decision_workspace_execution_ledger.sql`.
- SHA-256: `6bba05da4b65bce9a36d08694c8bd6b1cc0c310a6b3f1ae5f473cf8514437ab4` — exact accepted hash.
- Pre-application object check: both target tables absent; all four target functions absent.
- Pre-application migration list: all historical local/remote identities aligned; only `20260902141603` local/unapplied.
- Pre-application dry run: exactly one target, `20260902141603_add_decision_workspace_execution_ledger.sql`.
- Application command: one invocation of `supabase db push --linked --yes`.
- Application result: exit `0`; migration applied; `Finished supabase db push.`
- No second application attempt occurred.

## Recovery proof

- Pre-application snapshot: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-03/ai-agent-platform-worktree-8642 (incremental 3 September 2026 - Pre ACE-048 Phase 4 Slice 4A Stage B migration application)`.
- Backup note: same path with `.txt` suffix.
- Snapshot proof: `2,587` files; exact linked-worktree source; branch `codex/ace-048-phase4-endpoint-integrity-discovery`; HEAD `4ab5253504a885986c66890eb5f4f163106ed4f4`; `5` changed authorization/control-plane paths; normal seven-day project-scoped pruning; `KEEP` preservation; standalone restore guidance.
- Authoritative recovery procedure: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE4A_STAGEB_MIGRATION_APPLICATION_EXECUTION_PACKET.md`.
- Immediate rejection recovery remains logical quarantine: no consumer integration, no RPC invocation, no provider action, and empty tables. Destructive removal is not authorized.

## Direct post-application verification

### Migration identity

- `supabase migration list --linked` shows `20260902141603` in both Local and Remote columns.
- The first post-application dry-run verification experienced a non-mutating connection delay and was canceled. One bounded `--debug` retry supplied a new connection signal and completed successfully.
- Final `supabase db push --dry-run --linked --debug`: `Remote database is up to date.`

### Installed schema

- Tables present:
  - `public.decision_workspace_execution_runs` — RLS enabled; `0` rows.
  - `public.decision_workspace_execution_actions` — RLS enabled; `0` rows.
- Indexes present:
  - `decision_workspace_execution_runs_lookup_idx`
  - `decision_workspace_execution_runs_stale_idx`
  - `decision_workspace_execution_actions_run_status_idx`
- Functions present with accepted signatures:
  - `claim_decision_workspace_execution`
  - `record_decision_workspace_action_receipt`
  - `finalize_decision_workspace_execution`
  - `resolve_stale_decision_workspace_execution`
- All four functions are `SECURITY INVOKER`, not definer.
- All four functions have `search_path=public, pg_temp` and `statement_timeout=8s`.
- `anon` and `authenticated` have no execute privilege on any target function.
- `service_role` has execute privilege on all four target functions.
- `anon` and `authenticated` have no select/insert/update/delete privilege on either target table.
- `service_role` has select/insert/update/delete privilege on both target tables.
- No RLS policy exists by design because the objects are service-role-only and direct public/authenticated access is revoked.

### Advisor review

- Security advisor: `10` total notices; `2` target-specific `INFO` notices report RLS enabled with no policy on the two service-role-only tables. This is the intended deny-by-default contract, not an exposure.
- Performance advisor: `159` total notices; `3` target-specific `INFO` notices report the three new indexes unused. This is expected because both tables contain zero rows and no target function was invoked.
- Target-specific warning/error findings: `0`.
- Unrelated existing advisor debt was not modified or reclassified by this pass.

### Current Supabase compatibility review

- The current Supabase migration documentation continues to identify linked `db push` plus migration-history comparison as the supported deployment path used here.
- Current breaking-change review found no blocker for this public-schema migration. The announced Data API change for automatic exposure is consistent with this migration's explicit deny-by-default grants and service-role-only functions.

## Regression and prohibited-operation proof

- Ledger RPC invocations: `0`.
- Ledger rows created: `0`.
- Gmail/provider actions: `0`.
- Customer/provider data mutations: `0`.
- New request families, polling, cache, retry worker, scheduler, or background lifecycle behavior: `0`.
- Source/UI/route behavior changes: `0`.
- Artifact/index/publication mutations: `0`.
- Migration-history repair or direct history marking: `0`.
- `--include-all`, seed, role, direct SQL application, or MCP application: `0`.
- Commit, push, PR mutation, merge, or deployment: `0`.
- Playwright: not used because this pass changed no rendered/deployed UI and activated no runtime consumer; catalog/history proof is the decisive surface.

## State Transition Matrix

| Mode / Path | Baseline before action | Action | Settled state after action | Downstream result | Remaining blocker | Separate blocker? | Verdict |
|---|---|---|---|---|---|---|---|
| Linked migration history | Target local only; all older versions aligned | Apply exact linked migration once | Target present locally and remotely | Final dry run reports up to date | Human acceptance only | YES | PASS |
| Ledger schema | Two tables/four functions absent | Apply accepted additive DDL | Two RLS tables, three indexes, four protected functions present | Tables remain empty; no consumer activated | Human acceptance only | YES | PASS |
| Provider/runtime behavior | Existing accepted Gmail/provider path | No provider/runtime action authorized or invoked | Existing path untouched | Zero provider requests and zero ledger calls | Later live RPC/provider proof is separately gated | YES | PASS |

## Pre-closeout checklist

1. Confirm exact project, branch/HEAD, migration identity, and accepted hash — PASS.
2. Confirm pre-application object absence and exact one-migration dry run — PASS.
3. Confirm the migration was applied once and recorded once — PASS.
4. Confirm exact tables/indexes/functions/security and zero rows — PASS.
5. Confirm advisor posture and prohibited-operation counts — PASS.

## Decision gate

The decision gate below was the required non-terminal Human Review boundary. Oliver's explicit decision and the completed acceptance-capture result are recorded after the options for auditability.

- `ACCEPT` — accept the verified Stage B migration application and authorize the standing acceptance-capture workflow: Recovery Contract, Human-acceptance backup, exact-scope commit, and normal non-force GitHub push.
- `REJECT` — keep the schema quarantined and return the exact concern for PM adjudication; do not drop objects automatically.
- `BLOCKED` — identify the additional proof required before acceptance.
- `RETURN_TO_PM` — revise the recovery or next-stage contract.

Status: Decision recorded — `ACCEPT`

Decision recorded: Oliver returned explicit `accept` on 2026-09-03. Recovery Contract: `CHANGELOG.md` -> `September 3, 2026 — ACE-048 Framework-First Decision Workspace Phase 4 Slice 4A Stage B Migration Application Accepted`. The standing accepted-milestone backup and exact-scope GitHub preservation workflow completed.

Human-acceptance snapshot: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-03/ai-agent-platform-worktree-8642 (incremental 3 September 2026 - ACE-048 Phase 4 Slice 4A Stage B Human acceptance)`; `2,588` files, exact linked-worktree/branch/baseline identity, `7` accepted changed paths, normal seven-day project-scoped pruning, `KEEP` preservation, and standalone restore guidance.

Accepted-content Git identity: commit `000fdcb`, pushed normally without force to `codex/ace-048-phase4-endpoint-integrity-discovery`.
