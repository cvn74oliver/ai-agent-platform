# ACE-048 Framework-First Decision Workspace Phase 4 Slice 4A Stage A Review Packet

Date: 2026-09-02
Status: `VERIFIER ACCEPT / HIGH — AWAITING HUMAN REVIEW DECISION`
Governing event: `ACE-048`
Execution mode: `transitional_self_verification`
Problem class: `runtime behavior plus additive schema contract`
Baseline HEAD: `b752c863c7dc4d634e6e21b061fd6f7d2a4cc1ef`

## Executive summary

### What changed

Automata now has an unapplied source-level foundation that reserves an approved execution once in its own database before any provider action, records every ordered action separately, and preserves successful, failed, partial, skipped, reverted, or indeterminate outcomes without pretending that multiple external providers share one transaction.

### What the operator will get

After the separately approved migration and runtime-proof stages, the same framework can govern Gmail, customer service, real estate, investments/crypto, paid media, bookkeeping, tax, shipping/purchasing, and future workflows while retaining exact tenant, workflow, role, source, connection, action, and provider-receipt identity. Gmail remains the first reference adapter and its accepted page remains unchanged.

### Why it matters

Concurrent clicks can no longer both receive provider-invocation authority once the migration is active. Partial archive results and ambiguous draft outcomes remain honest, durable states instead of being promoted to successful execution or silently retried.

## Implementation result

The Stage A implementation source diff equals the exact nine-file allowlist:

1. `supabase/migrations/20260902141603_add_decision_workspace_execution_ledger.sql`
2. `web/src/lib/runtime/decisionWorkspaceContract.ts`
3. `web/src/lib/runtime/decisionWorkspaceExecutionModel.ts`
4. `web/src/lib/runtime/runtimeExecutionLedger.ts`
5. `web/src/lib/integrations/gmail/gmailDecisionWorkspaceExecutionPolicy.ts`
6. `web/src/lib/runtime/types.ts`
7. `web/src/app/api/runtime/execute/route.ts`
8. `web/src/lib/integrations/gmail/inboxAnalysis.ts`
9. `web/scripts/runtime-execution-ledger-fixtures.mjs`

The migration adds only two execution-ledger tables, three indexes, RLS/grants, and the four locked RPCs. Claim creation and ordered action-row creation occur in one database transaction. Receipt and finalization writes require the exact tenant, actor, execution, and lease token. Stale resolution is explicit, never retries a provider write, and derives the strictest honest aggregate supported by durable action states.

The route retains the existing `POST /api/runtime/execute` family, validates the historical request/latest approved decision, obtains one durable claim before the first provider effect, records each route-level action attempt, skips later actions after a non-success, and emits the legacy successful `execution_result` only when every ordered action is durably successful.

The Gmail adapter retains exact accepted and failed archive IDs and counts. Mixed archive outcomes are `partial`; ambiguous draft transport/provider outcomes are `indeterminate / manual_required`; no draft auto-retry was added.

## Verification results

- New execution-ledger fixture: `PASS` across eight domains.
- Simultaneous identical claim simulation: exactly `1` invocation authority.
- Conflicting reordered fingerprint replay: invocation authority `false`.
- Single success, success-then-failure, partial archive, ambiguous draft, stale claim, skipped trailing action, paid-media partial, and three-role shipping/purchasing partial fixtures: `PASS`.
- Provider receipt secret rejection and bounded canonical receipt handling: `PASS`.
- Static SQL/RLS/grant/RPC/lease-token/destructive-DDL guards: `PASS`.
- Route ordering, no-direct-success-event, partial/indeterminate, and frozen Gmail seam guards: `PASS`.
- TypeScript `tsc --noEmit --incremental false`: `PASS`.
- Exact-file ESLint: `PASS` with zero errors. Eleven warnings are inherited untouched declarations in `inboxAnalysis.ts`; Stage A edits are at separate archive-result lines.
- Existing Decision Workspace contract, presentation, read-model, action-model, review-unit, generic window-projection, Gmail review-unit, Gmail window-projection, optional-evidence, and cleanup-group fixtures: `10 / 10 PASS`.
- `git diff --check`: `PASS`.
- Frozen `stateLoaders.ts` SHA-256: `27ce88c8aa54c386efb612e285507dad313e4e16b1412ec90154ca46af43eab1` — byte-identical.
- Frozen Operations Approval Queue page SHA-256: `fec9b3c769feb98b5e7f354f241a4cf146e843464dbeb07776aa704fa3ea4311` — byte-identical.
- New HTTP routes/request families/model calls/pollers/background jobs: `0`.

The load declaration was corrected to preserve exact inherited adapter truth: Gmail draft makes at most one draft-create request; Gmail archive retains its existing 100-ID chunks, maximum four concurrent chunks, and one existing 401 refresh retry per chunk. The ledger counts one ordered-action attempt and adds no provider fanout of its own.

## Read-only runtime/UI regression proof

Canonical route: `http://127.0.0.1:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/approvals`

Ready-state satisfied: `YES`

Ready-state signals used: exact canonical URL; `Approval Queue (actual approval step)` heading; Pending, Approved, Executed, and Rejected sections; visible `3 / 0 / 8 / 46` counts; actionable and empty-state content; no loader, error, or overlay.

Settle strategy: reused saved owner authentication; launched the exact worktree with the established environment on loopback; waited five seconds, observed the intermediate shell, continued for ten seconds until the decisive queue settled, saved the final DOM artifact, then held five additional seconds to confirm request stability.

Artifacts captured after settle: `YES`

- DOM/state: `web/.playwright-cli/ace048-slice4a-stagea-postsettle.yml`
- Decisive visible queue/count screenshot: `web/.playwright-cli/element-2026-09-02T15-05-05-010Z.png`
- Full-page visual context: `web/.playwright-cli/page-2026-09-02T14-59-34-449Z.png`
- Trace: `web/.playwright-cli/traces/trace-1788361449059.trace`
- Request trace: `web/.playwright-cli/traces/trace-1788361449059.network`
- Console: `web/.playwright-cli/console-2026-09-02T15-04-09-208Z.log`

The final request trace contains only the accepted owner-session refresh, `POST /api/agents/playground`, Supabase user read, and `GET /api/integrations/gmail/mailbox-index`, all `200`. Approval, reject, mode, auto-approve, execute, and provider-action POSTs are `0`; failed requests and `409` churn are `0`. The browser console contains zero errors and zero warnings. The final screenshot was directly inspected and visibly contains the accepted queue heading and exact `3 / 0 / 8 / 46` counts with no overlay.

The first browser launch without the established environment reproduced the known missing-worktree-env Supabase overlay. That pre-settle diagnostic artifact is excluded from acceptance evidence. The final run used the existing environment in-process; no key was copied, printed, committed, or exposed.

Browser console inspected: `YES`
Runtime overlay present in final proof: `NO`
Duplicate key warnings present: `NO`
Runtime errors found: `NONE`
Verification Confidence: `HIGH`

## State Transition Matrix

| Mode / Path | Baseline visible/state before action | Operator/action performed | Settled state after action | Downstream gate/status/result | Remaining blocker | Separate? | Verdict |
|---|---|---|---|---|---|---|---|
| Concurrent identical claim | No durable run | Submit two identical claim candidates simultaneously | One created claim; second resolves to existing claim | Exactly one invocation authority | Live RPC application/proof is Stage B/C | YES | PASS |
| Conflicting fingerprint replay | Canonical request claim exists | Replay same request identity with reordered action bundle | Existing fingerprint differs | Conflict; invocation authority false | Live RPC application/proof is Stage B/C | YES | PASS |
| Single-action success | One claimed action | Transition `claimed -> executing -> succeeded` with receipt | Action and aggregate are `succeeded` | Compatibility success is eligible | None in Stage A | NA | PASS |
| Success then definitive failure | Three claimed actions | First succeeds; second definitively fails | `succeeded / failed / skipped` | Aggregate `partial`; no success event | None in Stage A | NA | PASS |
| Gmail archive partial | Claimed archive action | Classify one accepted and one failed message ID | Exact accepted/failed IDs retained; action `partial` | Aggregate `partial`; reconciliation pending; not executed | None in Stage A | NA | PASS |
| Gmail draft ambiguous | Claimed draft action | Classify transport/ambiguous provider result | Action `indeterminate` | Manual reconciliation; no retry; not executed | None in Stage A | NA | PASS |
| Stale in-flight claim | Expired `claimed/executing` lease | Later explicit stale-resolution call | Active actions become `indeterminate`, unless terminal receipts prove stricter truth | No provider retry; manual reconciliation when indeterminate | Live RPC application/proof is Stage B/C | YES | PASS |
| Multi-source paid media | Two claimed network actions | First network succeeds; second fails | Provider outcomes remain separate | Local aggregate `partial`; no false provider atomicity | None in Stage A | NA | PASS |
| Shipping/purchasing three-role bundle | Purchasing, spreadsheet, and shipping actions claimed with distinct roles/sources | Purchase succeeds; spreadsheet fails | Purchasing `succeeded`, spreadsheet `failed`, shipping `skipped` | Aggregate `partial`; provenance retained | None in Stage A | NA | PASS |
| Authenticated Gmail Approval Queue | Saved owner session; exact canonical route | Read-only cold load; no control clicked | Queue settles with `3 / 0 / 8 / 46`; no loader/error/overlay | Existing read family all `200`; zero action POST; clean console | None | NA | PASS |

## Safety and mutation report

- Migration application: `0`; generated migration remains unapplied.
- Live ledger/RPC calls: `0`.
- Gmail/provider actions: `0`.
- Live provider/data/database/schema/artifact/index/publication mutations: `0`.
- Approval/reject/execute/mode/provider controls clicked: `0`.
- Route renames/additions: `0`.
- Commit/push/merge/deployment operations: `0`.

## Verifier decision

Decision: `ACCEPT`

Stage A is proven against its authorized source/static/regression/read-only UI contract. Live migration syntax/application, database concurrency, RPC grants/advisors, and bounded runtime integration are intentionally not Stage A claims; they remain the separately authorized Stage B and Stage C proof surfaces.

Missing Proof Type: `NONE within Stage A scope`

## Decision gate

Status: `HUMAN ACCEPTED — 2026-09-03 / RECOVERY BACKED / GITHUB PRESERVED / CLOSED`

Oliver returned exact `ACCEPT PHASE 4 SLICE 4A STAGE A`. The Stage A source/migration candidate is Human-accepted, its Recovery Contract is recorded, the governed `2,584`-file Human-acceptance snapshot is verified, and accepted-content commit `a4fdbc0` is GitHub-preserved. Migration application, provider action, and deployment remain unauthorized.

- `ACCEPT PHASE 4 SLICE 4A STAGE A` — accept the verified source/migration candidate and authorize the governed acceptance capture/preservation step; Stage B migration application still requires its own explicit decision.
- `REJECT` — return the exact concern for bounded correction and re-verification.

Checkpoint Status: `none`

- Unpropagated state after this packet: none.
- Classification: Stage A accepted-fix state, backup evidence, and Git preservation are fully propagated.
- Stage A is closed. Stage B remains inactive until PM presents and Oliver accepts a separate migration-application/recovery decision surface.
