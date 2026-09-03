# ACE-048 Phase 4 Slice 4A Stage C1 — Rollback-Only RPC Proof Review Packet

Date: 2026-09-03
Governing event: `ACE-048`
Execution mode: `transitional_self_verification`
Problem class: runtime behavior — live database RPC contract proof
Accepted defect/proof surface: exact installed execution-ledger RPC contract on Supabase project `cjpjekhlvzwjwtszqpmy`
Verifier decision: `ACCEPT`
Verification confidence: `HIGH`
Final classification: `Accepted Fix Proven`
Status: HUMAN ACCEPTED / RECOVERY BACKED / GITHUB PRESERVED / CLOSED

## Executive summary

### What changed

No product or persistent database state changed. A fixed synthetic sandbox scenario exercised the four installed execution-ledger functions once inside one explicit transaction, and the entire transaction was rolled back.

### What the operator gets

Direct live proof that the framework grants execution authority once, denies authority on identical replay, records per-action outcomes, reports partial and indeterminate results honestly, rejects a mismatched tenant, binds the success compatibility event to its approval lineage, and leaves zero test data behind.

### Why it matters

The provider-neutral safety contract now has live database proof before any application route or real provider is connected. Gmail and all provider/customer workflows remained untouched.

## Target and recovery identity

- Live project: `cjpjekhlvzwjwtszqpmy` (`agent_platform`), `ACTIVE_HEALTHY`.
- Migration: `20260902141603_add_decision_workspace_execution_ledger.sql`.
- Migration SHA-256: `6bba05da4b65bce9a36d08694c8bd6b1cc0c310a6b3f1ae5f473cf8514437ab4`.
- Function-definition MD5 identities:
  - claim: `cc6bba34de6a72c2b80fcaad765624ba`
  - receipt: `a8230d9fa3b35237c62a9d38d8131fb2`
  - finalize: `a5ad7ee5e2cc1c0defda6971e5718104`
  - stale resolution: `5958ddf88bc7a3842aeafc3ce44d5305`
- All four functions remained `SECURITY INVOKER`, fixed to `search_path=public, pg_temp` and `statement_timeout=8s`, executable by `service_role`, and denied to `anon` / `authenticated`.
- Pre-execution backup: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-03/ai-agent-platform-worktree-8642 (incremental 3 September 2026 - Pre ACE-048 Phase 4 Slice 4A Stage C1 rollback-only RPC proof)`.
- Backup proof: `2,589` files; clean linked worktree; branch `codex/ace-048-phase4-endpoint-integrity-discovery`; HEAD `0c665f795381596db8e6bd60dd2347c9cbd1f34e`; seven-day project-scoped pruning confirmed; `KEEP` preservation and standalone restore guidance recorded.

## Preflight

- Git branch, HEAD, upstream, and live remote were aligned at `0 / 0`; the worktree was clean.
- The migration and all six frozen runtime/source references matched the accepted hashes.
- Migration-history count was exactly `1`.
- Ledger baseline was `0` runs and `0` actions.
- Fixed synthetic agent and event identities were absent.
- One private actor/tenant context was available; identity values were not emitted or recorded in this packet.
- Service-role table permissions were sufficient for the transaction.
- Non-internal triggers across the four touched tables: `0`.
- Publication memberships across the four touched tables: `0`.
- The eight-domain static fixture passed before execution, including one simultaneous claim authority, no conflicting-replay authority, `partial`, `indeterminate`, and frozen Gmail UI assertions.

## Execution proof

- Ephemeral artifact: `/private/tmp/ace048_stagec1_rollback_rpc_proof.sql`.
- Artifact status: `created`; ephemeral execution evidence only; not authoritative runtime context and not tracked by Git.
- Artifact SHA-256: `b22a6a51bf374d69393b0eef5bc481129b9f8dea446daf662a613293a32bf277`.
- Transaction controls: one `BEGIN`, one `SET LOCAL ROLE service_role`, one `ROLLBACK`; the prohibited alternative transaction-finalization statement did not appear.
- RPC calls: exactly `15` — five claims, seven action receipts, two finalizations, and one stale resolver.
- The single execution returned `ACE048_STAGEC1_ASSERTION_SUCCESS`, `assertion_success=true`, and `rollback_executed=true`.
- In-transaction assertions proved three transient runs, four transient actions, one transient synthetic agent, six request/decision events, and one compatibility event before rollback.
- No SQL error, retry, connection ambiguity, cleanup statement, or second execution occurred.

## Independent post-rollback proof

- Ledger runs: `0`.
- Ledger actions: `0`.
- Synthetic agent: `0`.
- Synthetic request/decision events: `0`.
- Synthetic execution keys: `0`.
- Synthetic idempotency keys: `0`.
- `rollback_zero_persistence=true`.
- The eight-domain static fixture passed again with the same lifecycle and frozen-Gmail assertions.
- All frozen source hashes remained byte-identical and the repository was clean before documentation propagation.

## State Transition Matrix

| Mode / Path | Baseline visible/state before action | Operator action performed | Settled in-transaction state after action | Downstream gate/status/result | Remaining blocker | Separate? | Verdict |
|---|---|---|---|---|---|---|---|
| Succeeded claim and finalization | Approved synthetic request; no run | Claim, record `claimed -> executing -> succeeded`, finalize with bound compatibility payload | One succeeded run; one succeeded action; attempt count `1`; exact provenance and three-step transition histories | `succeeded` / `not_required`; exactly one bound compatibility event | None | NA | PASS |
| Identical replay / no second authority | First claim owns the durable request identity | Repeat the identical claim before action execution | Same execution and lease identities; `existing=true`; `invocation_authorized=false` | No second invocation authority and no duplicate run/action | True concurrent-session race remains outside Stage C1 | YES | PASS |
| Partial aggregation | Approved two-action synthetic request; no run | Succeed action `0`, fail action `1`, then finalize without compatibility payload | One succeeded and one failed action, each attempted once | Run `partial`; reconciliation `pending`; no compatibility-success event | None | NA | PASS |
| Stale lease resolution | Claimed action advanced to executing under an active lease | Expire the test-only lease and invoke stale resolver | Active action changed to `indeterminate`; error `stale_execution_claim`; reconciliation `manual_required` | Run `indeterminate`; changed `true`; manual reconciliation required | Automatic retry/reconciliation is a later separately gated slice | YES | PASS |
| Cross-tenant rejection | Valid private actor/agent/request lineage under the selected tenant | Attempt claim with a fixed mismatched tenant inside an exception-captured sub-block | Function rejected with the expected authorization error; no cross-tenant run created | Tenant boundary held | None | NA | PASS |
| Transaction rollback / zero persistence | Live baseline `0` runs, `0` actions, no fixed synthetic identities | Execute terminal rollback, then query independently | All transient rows absent | Runs `0`; actions `0`; agent/events/keys `0`; zero-persistence `true` | None | NA | PASS |

## Regression, load, and prohibited-operation report

- Database requests: read-only preflight, one rollback-only MCP SQL execution, and one independent read-only postflight.
- HTTP requests: `0`.
- Polling: none.
- Provider/model calls: `0`.
- Customer-data writes: `0`.
- Persistent database writes: `0`.
- Background jobs, cache invalidation, scheduler, mailbox scan, Smart Sync, artifact handoff, and stale-build reclaim: none.
- Source/UI/route/request/lifecycle/migration changes: `0`.
- Merge/deployment/provider/artifact/index-publication operations: `0`.
- Playwright was not used because Stage C1 exercised no UI or application HTTP surface; direct database assertions were the strongest applicable proof.
- Accepted Gmail counts, routes, actions, batching, provider controls, requests, polling, and close/return behavior remained untouched.

## Verifier decision and decision gate

The exact accepted proof surfaces passed directly, the final database state equals the preflight zero baseline, the static framework regression remained green, and no prohibited operation occurred.

Verifier decision: `ACCEPT`

Verification Confidence: `HIGH`

Final classification: `Accepted Fix Proven`

Checkpoint Status: `none` — Human acceptance, Recovery Contract, verified acceptance backup, and accepted-content Git preservation are recorded; no unpropagated Stage C1 state remains.

Status: Decision recorded — `ACCEPT`

Decision options:

- `ACCEPT` — accept Stage C1 and authorize the separately governed acceptance/recovery/Git-preservation closeout.
- `REJECT` — return with the exact failed expectation for diagnosis and correction.
- `BLOCKED` — request additional proof or a narrowly defined dependency.
- `RETURN_TO_PM` — rescope before any further execution.

## Human Review decision

Oliver returned exact `ACCEPT PHASE 4 SLICE 4A STAGE C1` on 2026-09-03. This accepts the verifier-proven rollback-only RPC result and authorizes the standing acceptance/recovery/Git-preservation closeout. It does not authorize true concurrent-session proof, application wrapper/HTTP activation, provider/customer-data action, persistent test data, merge, or deployment.

Human-acceptance snapshot: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-03/ai-agent-platform-worktree-8642 (incremental 3 September 2026 - ACE-048 Phase 4 Slice 4A Stage C1 Human acceptance)`; `2,590` files, exact linked-worktree/branch/baseline identity, `5` accepted changed paths, normal seven-day project-scoped pruning, `KEEP` preservation, and standalone restore guidance.

Recovery Contract: `CHANGELOG.md` -> `September 3, 2026 — ACE-048 Phase 4 Slice 4A Stage C1 Rollback-Only RPC Proof Accepted`.

Accepted-content Git identity: commit `edc4be2`, pushed normally without force to `codex/ace-048-phase4-endpoint-integrity-discovery`.
