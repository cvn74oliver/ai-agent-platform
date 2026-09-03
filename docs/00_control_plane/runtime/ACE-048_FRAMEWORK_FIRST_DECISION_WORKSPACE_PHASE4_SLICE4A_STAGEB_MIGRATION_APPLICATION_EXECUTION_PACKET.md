# ACE-048 Phase 4 Slice 4A Stage B — Migration Application Execution Packet

Date: 2026-09-03
Governing event: `ACE-048`
Execution mode: `transitional_self_verification`
Problem class: runtime behavior — additive schema installation only
Reasoning level: HIGH — one bounded live production-schema mutation with exact identity and recovery gates
Status: HUMAN ACCEPTED / RECOVERY BACKED / GITHUB PRESERVED / CLOSED

## Operator summary

### What is changing

Install the already accepted execution-ledger schema in the linked Supabase project. The migration adds two empty ledger tables, three indexes, row-level-security and grants, and four service-role-only database functions.

### What the operator will get

A dormant, provider-neutral database foundation that can later claim an approved execution once and preserve per-action results, provenance, lease identity, and honest partial or indeterminate outcomes.

### Why it matters

This is the safety layer required before Automata can later execute approved work without silently duplicating a run or losing what happened. It supports Gmail as the reference adapter while retaining source, workflow, provider, agent-role, tenant, and action identity for future business workflows.

## Objective

Apply exactly `supabase/migrations/20260902141603_add_decision_workspace_execution_ledger.sql` to linked project `cjpjekhlvzwjwtszqpmy`, then prove the migration was recorded exactly once and the installed schema matches the accepted Stage A contract without invoking it.

## Target lock

- Project: `cjpjekhlvzwjwtszqpmy` (`agent_platform`)
- Migration: `20260902141603_add_decision_workspace_execution_ledger.sql`
- Accepted SHA-256: `6bba05da4b65bce9a36d08694c8bd6b1cc0c310a6b3f1ae5f473cf8514437ab4`
- Application command: `supabase db push --linked --yes`
- Required pre-application dry run: exactly `20260902141603_add_decision_workspace_execution_ledger.sql` and no other pending migration
- Locked repository/control-plane files for this pass:
  - `supabase/migrations/20260902141603_add_decision_workspace_execution_ledger.sql` (read/apply target; no source edit)
  - this execution packet
  - `ai-agent-platform-docs/06_system_state/CURRENT_STATE.md`
  - `ai-agent-platform-docs/06_system_state/TODO.md`
  - `ai-agent-platform-docs/06_system_state/ACTIVE_CHANGE_EVENTS.md`
  - `docs/00_control_plane/EXECUTION_DASHBOARD.md`

## Scope

1. Record Oliver's exact `ACCEPT PHASE 4 SLICE 4A STAGE B MIGRATION APPLICATION` decision.
2. Create and verify the normal project-scoped pre-application incremental backup with seven-day pruning and `KEEP` preservation.
3. Reattest the clean branch/HEAD, linked project reference, migration hash, migration-history alignment, absent target objects, and exact one-migration dry run.
4. Apply the migration once through the linked Supabase CLI workflow.
5. Perform read-only post-application catalog, migration-history, grant, RLS, function-security, zero-row, advisor, and no-pending-migration verification.
6. Return a verifier packet and explicit Human Review decision gate before accepted-fix capture, commit, or publication.

## Load declaration

- Heavy endpoints affected: none.
- Request families affected: none.
- Polling: none.
- Expected poll cadence: none.
- Expected steady-state request count: unchanged.
- Build-pending continuity: unaffected.
- Build-completion continuity exit: unaffected.
- Smart Sync to artifact handoff: unaffected.
- Stale-build reclaim: unaffected.
- Provider fanout: unchanged; no Gmail or other provider request is authorized.

## Constraints and exclusions

- No ledger RPC invocation or test-row insertion.
- No Gmail/provider action and no customer-data mutation.
- No source/UI/route/request/cache/polling/background lifecycle change.
- No artifact, mailbox index, publication, Vercel, or deployment mutation.
- No `migration repair`, applied/reverted marking, `--include-all`, seed/role inclusion, `db pull`, direct dashboard SQL application, or direct MCP migration application.
- No automatic retry after an ambiguous application result.
- No destructive down migration, table/function drop, or data deletion.
- No commit, push, PR mutation, merge, or deployment before Human Review acceptance.

## Pre-application gates

All gates must pass immediately before application:

1. The accepted implementation source/migration baseline remains clean at closeout head `4ab5253504a885986c66890eb5f4f163106ed4f4`; the only current repository changes are the five allowlisted authorization/control-plane paths created for this application pass.
2. Linked project ref equals `cjpjekhlvzwjwtszqpmy`.
3. Target migration hash equals the accepted SHA-256.
4. `supabase migration list --linked` shows the reconciled local/remote history aligned through the last applied migration.
5. `supabase db push --dry-run --linked` lists exactly the target migration and nothing older.
6. The two tables and four functions are absent before application.
7. The pre-application incremental backup is verified.
8. Current Supabase changelog/breaking-change review exposes no blocker for this bounded public-schema migration.

Any mismatch stops application and returns to PM. The executor must not repair, broaden, or guess.

## Additive-schema recovery procedure

This procedure is reviewed separately from Stage A and applies before any live provider execution or ledger use.

### Application failure or ambiguous CLI result

1. Stop without retrying.
2. Read migration history and the exact target-object catalog.
3. If the migration is not recorded and all target objects are absent, classify the live schema as unchanged.
4. If the migration is recorded and all target objects match, classify the application as applied and do not rerun it.
5. If history and catalog disagree or only part of the target exists, classify the result as blocked, preserve evidence, and return to PM for a separately approved repair. Do not use `migration repair` or direct SQL automatically.

### Successful application followed by rejection

The immediate safe rollback is logical quarantine: do not merge/deploy a consumer, do not invoke the four functions, and keep the two new tables empty. Because the schema is additive and dormant, existing product behavior remains on the pre-Stage-B path.

Physical removal is destructive and is not authorized here. If later required, it must be a new exact migration with separate approval, backup, dependency/data preflight, and verification. No live ledger rows may be deleted or dropped implicitly.

### Recovery assets

- The accepted migration file and its Git history remain the authoritative forward definition.
- The pre-application incremental preserves the exact repository/control-plane state.
- Live recovery depends on the read-only history/catalog adjudication above; the repository backup is not represented as a database backup.

## Accepted proof surfaces

- Exact linked project identity.
- Exact target migration hash.
- Pre-application migration list and one-migration dry run.
- Post-application migration list showing `20260902141603` locally and remotely.
- Post-application dry run reporting no pending migrations.
- Exactly two target tables with RLS enabled.
- Exactly three target indexes.
- `anon` and `authenticated` have no target-table or target-function privileges; `service_role` has the intended privileges.
- Exactly four target functions are `SECURITY INVOKER` with accepted `search_path` and statement timeout settings.
- Both target tables contain zero rows.
- Security and performance advisor results are checked and target-object findings are reported distinctly from unrelated pre-existing findings.
- No ledger RPC, provider action, customer-data mutation, request/polling behavior, or UI behavior occurs.

## Verification and regression protections

- Verification is schema/catalog only and read-only after the one authorized migration application.
- The migration must be recorded exactly once; a second application attempt is prohibited without new evidence.
- Existing Gmail counts, routes, UI, provider controls, requests, polling, batching, and retry behavior are frozen and untouched.
- Playwright is not applicable because this pass changes no UI route or rendered behavior and no deployed consumer is activated.
- A verifier result may be `ACCEPT`, `REJECT`, or `BLOCKED`; Human Review follows only after the exact proof bundle is complete.

## Authorization

Oliver returned the exact decision `ACCEPT PHASE 4 SLICE 4A STAGE B MIGRATION APPLICATION` on 2026-09-03. This authorizes only the bounded application and verification contract above. Live ledger/RPC proof, provider execution, source integration, commit/push, merge, and deployment remain separate gates.

## Execution result

The pre-application incremental and all eight gates passed. The linked CLI applied only migration `20260902141603` once. Post-application migration history, no-pending dry run, exact catalog/security configuration, zero-row state, and advisors passed at verifier `ACCEPT / HIGH`. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE4A_STAGEB_REVIEW_PACKET.md`. Oliver returned explicit Human Review `accept`; the Recovery Contract and `2,588`-file acceptance backup are recorded. Accepted content commit `000fdcb` was pushed normally without force to `codex/ace-048-phase4-endpoint-integrity-discovery`; Stage B is closed.
