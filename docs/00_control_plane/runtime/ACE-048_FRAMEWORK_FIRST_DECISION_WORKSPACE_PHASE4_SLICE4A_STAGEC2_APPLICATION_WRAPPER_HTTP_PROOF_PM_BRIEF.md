# ACE-048 Framework-First Decision Workspace — Phase 4 Slice 4A Stage C2 Application-Wrapper/HTTP Proof PM Brief

Date: 2026-09-03
Governing event: `ACE-048 — Automata Revival — Security and Rebaseline`
Problem class: `runtime behavior`
Execution mode: `transitional_self_verification`
Reasoning level: `HIGH`
Execution readiness: `target-locked / execution-ready`
Status: `AUTHORIZED / PENDING EXECUTOR`

## Executive summary

### What is changing

Add a test-only local HTTP harness that invokes the real application execute handler and real execution-ledger wrappers against an in-memory Supabase substitute. Reconcile one stale accepted Gmail hash in the older endpoint-integrity fixture.

### What the operator will get

A deterministic proof that authentication, same-origin protection, owned-agent and tenant access, approval/decision binding, sandbox execution, durable-claim sequencing, compatibility behavior, and replay/conflict protection work together without contacting Gmail, Supabase, or customer systems and without leaving persistent rows.

### Why it matters

Stage C1 proved the generic ledger contract in the live database. Stage C2 now proves that the application binds to that contract correctly before any real provider action, persistent application canary, source merge, or deployment is authorized.

## Objective

Prove the actual `POST /api/runtime/execute` handler plus the real Supabase execution-ledger wrapper sequence through localhost-only HTTP requests, while all backing identity, approval, event, and ledger state remains in memory and every external/provider request is prohibited.

## Discovery result and safety decision

The accepted one-action sandbox route performs one application POST, one authentication lookup, six access/approval/history reads, one claim RPC, two action-transition RPCs, and one finalization RPC. These are separate Supabase requests. A successful live request would durably create an execution run, an action row, and a bound `execution_result` compatibility event.

Supabase rollback preference applies to a single Data API request and cannot group the route's multiple `supabase-js` requests into one transaction. Applying rollback to each RPC separately would roll back the claim before later transitions could observe it. Therefore:

- live `POST /api/runtime/execute` and live RPC calls are prohibited in Stage C2;
- production-database zero persistence cannot be claimed from a live application request;
- the smallest safe application proof is a localhost HTTP harness using the real handler/wrappers with an in-memory Supabase substitute;
- a later persistent canary, provider action, source merge, and deployment each remain separate decisions.

The existing eight-domain execution-ledger fixture passed. The older endpoint-integrity fixture stops on a stale frozen hash for `web/src/lib/integrations/gmail/inboxAnalysis.ts`: expected `57ab82f...`, current accepted source `eead81b...`. The difference is the nine accepted Stage A receipt-propagation lines. This is fixture-baseline drift, not a product defect.

## Target lock

### Locked application sources under proof — read-only

1. `web/src/app/api/runtime/execute/route.ts` — SHA-256 `0a09f51dd531011b8c07a53746f1124e83a870dd6b35a4692655f0ccbfc84fdd`
2. `web/src/lib/runtime/runtimeRequestAccess.ts` — SHA-256 `3aa79942267d4466ff53bb9ed61b4ef92496374a515a0283e5256bd2b68956c4`
3. `web/src/lib/runtime/runtimeApprovalIntegrity.ts` — SHA-256 `07771f253a13ce98aaac55994d76375398025e9859f1c4a437a4252222b67f56`
4. `web/src/lib/runtime/runtimeExecutionLedger.ts` — SHA-256 `d222824dd769848086a47b832b91d4e5233d7acb60d6fb0b1740c71b993bafb5`
5. `web/src/lib/runtime/decisionWorkspaceExecutionModel.ts` — SHA-256 `2a9abd155f987a113f03a9203c04928f54fac73ebd182ff1923443fa473d62bb`
6. `web/src/lib/supabase.ts` — SHA-256 `c8d4c917949d2d7c8ebfa12e7d6acdc638672b0c05798d568c0ad082eab6b9c0`

These files must remain byte-identical. If any application/product source change is required, stop and return to PM.

### Exact implementation write allowlist

1. `web/scripts/runtime-endpoint-integrity-fixtures.mjs`
   - change only the stale frozen `inboxAnalysis.ts` SHA-256 from `57ab82f...` to the accepted current `eead81b3e3f72e1eab6b2f7da709ab9c71f5d617c430ae18b1250d3f5e3feaae`;
   - no assertion weakening or other baseline refresh is authorized.
2. `web/scripts/runtime-execute-http-fixture-loader.mjs` — new test-only loader that reuses the existing TypeScript/path-loading behavior and redirects only `@/lib/supabase` to the test substitute.
3. `web/scripts/runtime-execute-http-fixture-supabase.mjs` — new deterministic in-memory Supabase/auth/query/RPC substitute with explicit state and call recording.
4. `web/scripts/runtime-execute-http-fixtures.mjs` — new localhost-only HTTP harness and assertion matrix invoking the real exported route handler.

No fifth implementation file is authorized. `web/package.json`, product source, migrations, UI, route paths, provider adapters, control-plane files, and existing runtime behavior are not implementation targets.

## Required implementation sequence

1. Reattest the clean branch, exact HEAD containing this authorization, upstream parity, and the locked source hashes.
2. Create and verify the normal project-scoped pre-implementation incremental backup with seven-day pruning and `KEEP` preservation.
3. Snapshot the four implementation paths before editing and distinguish new edits from inherited state.
4. Reconcile only the stale accepted Gmail hash in the existing endpoint fixture.
5. Add the isolated loader, in-memory Supabase substitute, and localhost HTTP harness.
6. Exercise the exact request/state matrix below.
7. Run targeted verification, diagnose any failure, translate root cause, correct only within the four-file allowlist, and re-verify.
8. Run bounded exploratory adversarial cases, final verification, and the independent verifier gate.
9. Return a PM review packet and pause at Human Review. Do not commit/push accepted implementation until Human Review authorizes the standard recovery/Git closeout.

## Required request and state matrix

Each row must record baseline state, HTTP request, settled response, exact in-memory query/RPC call sequence, provider/network count, mutation count, and verdict.

1. Unauthenticated request:
   - expected HTTP `401`;
   - zero privileged reads, ledger calls, provider calls, or state changes.
2. Authenticated wrong-origin request:
   - expected HTTP `403` after authentication and before privileged access;
   - zero ledger/provider calls or state changes.
3. Authenticated foreign-agent request:
   - expected HTTP `404`;
   - zero privileged admin, ledger, or provider calls.
4. Missing or rejected approval:
   - fail closed before claim;
   - zero ledger/provider calls.
5. Valid approved sandbox `noop`:
   - one successful HTTP response;
   - exact ordered sequence: claim, action `claimed -> executing`, action `executing -> succeeded`, finalization with bound compatibility payload;
   - returned execution identity/status/results match the synthetic in-memory state;
   - zero Gmail/provider/model calls.
6. Identical compatibility replay:
   - rejected by existing execution history;
   - zero second claim/action/finalization/provider authority.
7. Durable-claim replay with compatibility history intentionally unavailable in the fixture:
   - claim returns existing run with `invocation_authorized=false`;
   - expected HTTP `409`;
   - zero action/finalization/provider activity.
8. Conflicting durable replay:
   - expected HTTP `409` conflict;
   - zero provider activity and no additional authoritative run/action.

## Runtime load declaration

- Production request family: unchanged — one `POST /api/runtime/execute` per explicit operator action.
- Stage C2 fixture traffic: maximum eight localhost-only HTTP requests.
- External Supabase/Auth/Data API requests: `0`.
- Gmail or other provider/model/customer-system requests: `0`.
- Persistent database writes: `0`.
- Polling, timers, background jobs, cache invalidation, automatic retries, schedulers, Smart Sync, artifact handoff, and stale-build reclaim: none.
- Expected real one-action sandbox success shape, for documentation only: one client POST plus eleven Supabase operations — authentication, six access/approval/history reads, claim, two action transitions, and finalization.
- Compatibility event behavior: generated inside finalization; no extra application request.
- Lifecycle edge under proof: approved request -> one durable claim authority -> ordered action transitions -> final success compatibility binding; identical/conflicting replay receives no second execution authority.

## Accepted proof surfaces

- Exact route handler export reached through localhost HTTP request/response conversion.
- Authentication before body parsing and privileged work.
- Same-origin enforcement.
- Owned-agent and actor-to-tenant resolution.
- Exact approval request and latest-decision binding.
- Deterministic execution/action keys produced from the approved request.
- Exact wrapper RPC names and parameter bindings.
- Sandbox metadata remains provider-neutral and `effect='decision_only'`.
- Successful ordered claim/receipt/finalization sequence.
- Bound compatibility payload only on complete success.
- Replay and conflict paths grant no second invocation authority.
- Zero external/provider calls and zero persistent state.
- Existing eight-domain framework fixture remains green.
- Existing endpoint-integrity fixture is restored without weakening assertions.

## Verification expectations

- Run the new Stage C2 HTTP fixture.
- Run `runtime-execution-ledger-fixtures.mjs`; require all eight domains and safety cases to pass.
- Run the corrected `runtime-endpoint-integrity-fixtures.mjs`; require all access/binding/frozen-source checks to pass.
- Run TypeScript checking, exact lint for touched scripts, `git diff --check`, and exact allowlist verification.
- Rehash all six locked application sources and require exact equality with this brief.
- Use read-only live pre/post checks only to confirm the already accepted ledger baseline remains zero; do not call the route or an RPC.
- Require a row-by-row request/state transition matrix in the review packet.
- Playwright is intentionally not required: there is no rendered UI acceptance surface, and the localhost handler harness directly proves the server-side HTTP contract. Playwright must not be used to contact a live execute route.
- Independent verifier decision must be `ACCEPT`, `REJECT`, or `BLOCKED`; only `ACCEPT` may reach Human Review.

## Regression protections

- All six locked product files remain byte-identical.
- Existing Gmail counts, groups, charts, windows, rows, actions, provider controls, batching, retry behavior, requests, polling, and close/return behavior remain unchanged.
- Domain fixtures continue to cover Gmail, customer service, real estate, investments/crypto, paid media, bookkeeping, tax, and shipping/purchasing.
- Presentation metadata remains multi-provider, multi-source, multi-workflow, and multi-agent-role capable; no Gmail vocabulary is added to the generic execution model.
- No assertion may be removed, softened, skipped, or replaced by a narrative claim.
- No test identity or receipt may contain real customer/provider credentials or data.

## Risks and stop conditions

Possible implementation failures are loader resolution, Next server-module import behavior outside Next runtime, incomplete Supabase-query emulation, or a fixture that accidentally permits network access.

Stop and return to PM if:

- any application/product source or fifth implementation file is required;
- the real handler cannot be invoked without changing production code;
- a fixture attempts an external request;
- live database, provider, customer, migration, merge, or deployment state would be touched;
- the proof would rely only on source-text matching rather than executing the handler and wrappers;
- the existing accepted Gmail hash mismatch cannot be proven to be only the accepted nine-line receipt change;
- verification exposes newly changed governing truth.

## Recovery contract for this implementation

The implementation is test-only and locally reversible before Human Review:

1. stop the fixture process;
2. restore the one endpoint-integrity hash line from the pre-implementation snapshot;
3. remove only the three new Stage C2 fixture files;
4. re-run the existing endpoint and ledger fixtures;
5. verify the worktree has no unexpected paths and all locked product hashes remain unchanged.

No database/provider recovery is expected because all external access and persistence are prohibited. Any unexpected external request or persistent change is a hard failure requiring PM adjudication, not automatic cleanup.

## Explicit exclusions and later gates

This authorization does not include:

- live `POST /api/runtime/execute` invocation;
- live execution-ledger RPC invocation;
- persistent ledger, agent, approval, decision, compatibility-event, provider, or customer-data rows;
- Gmail/provider/model execution;
- product source, route, UI, request, polling, cache, retry, lifecycle, or adapter changes;
- migration create/apply/repair/revert or schema change;
- true concurrent-session proof;
- persistent canary or cleanup/deletion work;
- merge, deployment, Vercel change, artifact/index publication, or branch/task archival.

The branch remains ahead of `origin/main`; publication of the ledger-enabled application source is a later separately gated decision.

## Authorization

Oliver issued exact `ACCEPT PHASE 4 SLICE 4A STAGE C2 APPLICATION-WRAPPER/HTTP PROOF IMPLEMENTATION` on 2026-09-03. This authorizes the bounded implementation and verification contract above only after this approved plan is propagated and the executor reattests the exact target lock. It does not authorize any excluded operation.
