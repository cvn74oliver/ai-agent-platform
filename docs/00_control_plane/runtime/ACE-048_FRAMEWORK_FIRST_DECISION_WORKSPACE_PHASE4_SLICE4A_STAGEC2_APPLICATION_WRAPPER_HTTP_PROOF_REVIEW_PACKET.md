# ACE-048 Phase 4 Slice 4A Stage C2 — Application-Wrapper / HTTP Proof Review Packet

Date: 2026-09-03
Governing event: `ACE-048`
Execution mode: `transitional_self_verification`
Problem class: runtime behavior — application execute-handler and ledger-wrapper binding proof
Accepted proof surface: real `POST /api/runtime/execute` handler and accepted ledger wrappers behind a localhost-only HTTP server and in-memory Supabase substitute
Verifier decision: `ACCEPT`
Verification confidence: `HIGH`
Final classification: `Accepted Fix Proven`
Status: HUMAN ACCEPTED / RECOVERY BACKED / GITHUB PRESERVED / CLOSED

## Executive summary

### What changed

A local-only fixture now invokes the real execute-route handler through an HTTP request/response boundary while substituting in-memory Supabase behavior at test-loader time. The existing endpoint-integrity fixture also records the accepted current Gmail analysis hash.

### What the operator gets

Executable proof that authentication, request origin, agent ownership, tenant identity, approval lineage, durable claim authority, action receipts, finalization, compatibility replay, durable replay, and conflicting replay behave correctly through the application wrapper.

### Why it matters

The framework's application-to-ledger safety seam is proven without invoking the live execute route, writing persistent rows, or contacting Gmail, another provider, a model, or customer data. The same execution model remains covered across eight business domains.

## Exact accepted files

- Modified `web/scripts/runtime-endpoint-integrity-fixtures.mjs` only to reconcile the accepted `inboxAnalysis.ts` SHA-256.
- Created `web/scripts/runtime-execute-http-fixture-loader.mjs`.
- Created `web/scripts/runtime-execute-http-fixture-supabase.mjs`.
- Created `web/scripts/runtime-execute-http-fixtures.mjs`.

Accepted candidate SHA-256 identities:

- endpoint-integrity fixture: `783611329f4c0d6252af646461fe6c932b87eed02d12eaf4d0dd84f4d491fce9`
- Stage C2 loader: `1d2c3a987f2885d9d9759ea599f07d07da05caac656b4ffb6a915cd429427c05`
- in-memory Supabase fixture: `ff2f73d747302647f24eee446b7fd10d7b1b65e87c2b5941d9d6a8911652c951`
- localhost HTTP fixture: `d14338f8696bbeb58aaa139e8d1fcd85a39a512d5a7a0b8a4e86d4ba06c2e1ac`

## Target and recovery identity

- Branch: `codex/ace-048-phase4-endpoint-integrity-discovery`.
- Pre-implementation HEAD/upstream: `ab3be8e97bf8f82fec05f29a3ea35557a47536a7`, divergence `0 / 0`.
- Pre-implementation snapshot: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-03/ai-agent-platform-worktree-8642 (incremental 3 September 2026 - Pre ACE-048 Phase 4 Slice 4A Stage C2 application-wrapper HTTP proof implementat)`; `2,591` files.
- Human-acceptance snapshot: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-03/ai-agent-platform-worktree-8642 (incremental 3 September 2026 - Human acceptance of ACE-048 Phase 4 Slice 4A Stage C2 application-wrapper HTTP p)`; `2,594` files; exact linked-worktree source, branch and baseline HEAD; `4` changed paths; normal seven-day project-scoped pruning; `KEEP` preservation; standalone linked-worktree restore guidance.
- The acceptance snapshot contains all four accepted candidate paths with the hashes listed above.
- This backup is a standalone incremental folder, not a tar archive. File enumeration and candidate hashes were read back successfully; its note identifies the latest readable/checksummed full archive and the correct linked-worktree restoration order.

## Implementation and verification loop

1. The first targeted run exposed one test-loader-only failure: standalone Node ESM did not resolve `next/server` to Next's `server.js` package subpath.
2. Root-cause translation locked the correction to one exact loader mapping; no product or package file changed.
3. Re-verification passed.
4. Guided exploratory review found two proof-quality gaps in the fixture: early denial used valid JSON, and matrix output lacked sufficient settled-state detail.
5. The same eight-request fixture was tightened so unauthenticated and wrong-origin paths use malformed JSON, directly proving both gates execute before body parsing. Exact receipt/finalization bindings and full row evidence were added.
6. Final verification and all regressions passed.

## State Transition Matrix

| Mode / Path | Baseline state before request | Operator action | Settled state after request | Downstream gate/status/result | Remaining blocker | Separate? | Verdict |
|---|---|---|---|---|---|---|---|
| Unauthenticated | No authenticated principal; malformed JSON body | Localhost POST | HTTP `401`; only `auth.getUser` observed | Body parsing, ownership, privileged reads, and RPCs did not run | None | NA | PASS |
| Wrong origin | Authenticated principal; foreign origin; malformed JSON body | Localhost POST | HTTP `403`; only `auth.getUser` observed | Body parsing, ownership, privileged reads, and RPCs did not run | None | NA | PASS |
| Foreign agent | Authenticated same-origin request; unowned agent identifier | Localhost POST | HTTP `404` after owned-agent query | Tenant lookup, admin reads, and RPCs did not run | None | NA | PASS |
| Rejected approval | Owned agent; guarded mode; exact request; latest decision rejected | Localhost POST | HTTP `400` after decision lookup | Claim authority was not requested; RPC count `0` | None | NA | PASS |
| Successful sandbox action | Bound approved sandbox `noop`; no compatibility row or durable claim | Localhost POST | HTTP `200`; `claimed -> executing -> succeeded -> finalized`; `executed=true` | Exact `11`-operation upstream sequence and bound compatibility payload | None | NA | PASS |
| Compatibility replay | Exact bound `execution_result` already exists | Repeat localhost POST | HTTP `400` `Already executed` | Reads stop before claim; RPC count `0` | None | NA | PASS |
| Durable-claim replay | No compatibility row; identical durable claim already succeeded | Repeat localhost POST | HTTP `409`; existing execution identity returned | One claim RPC; no receipt, provider, or second invocation | None | NA | PASS |
| Conflicting fingerprint | Durable execution key exists with a different action fingerprint | Localhost POST | HTTP `409` conflict | One claim RPC; no receipt, provider, or invocation authority | True concurrent-session race proof remains separately gated | YES | PASS |

## Successful request sequence

1. `auth.getUser`
2. request-client owned-agent lookup
3. request-client actor-to-tenant lookup
4. admin runtime-mode lookup
5. admin approval-request lookup
6. admin latest approval-decision lookup
7. admin compatibility execution-history lookup
8. `claim_decision_workspace_execution`
9. `record_decision_workspace_action_receipt`: `claimed -> executing`
10. `record_decision_workspace_action_receipt`: `executing -> succeeded`
11. `finalize_decision_workspace_execution` with exact approval/request/decision compatibility binding

## Verification evidence

- New Stage C2 HTTP fixture: PASS; exactly `8` localhost requests and all eight matrix rows PASS.
- Existing execution-ledger fixture: PASS across Gmail, customer service, real estate, investments/crypto, paid media, bookkeeping, tax, and shipping/purchasing.
- Existing endpoint-integrity fixture: PASS after the one exact accepted-hash reconciliation.
- TypeScript `npx tsc --noEmit`: PASS.
- Exact ESLint on all four accepted scripts: PASS.
- `git diff --check`: PASS.
- Exact allowlist review: PASS.
- Accepted Gmail hash delta: `22243c2..HEAD` is exactly nine additions carrying `accepted_message_ids`, `failed_message_ids`, and `partial_failure` through three archive/restore seams; it is not a new Stage C2 product change.
- All six locked product-source hashes match the PM Brief exactly.
- Read-only live ledger before implementation, after implementation, at verifier review, and before acceptance closeout: `0` runs / `0` actions.
- Independent verifier: `ACCEPT / HIGH`.
- Human Review: Oliver returned exact `ACCEPT PHASE 4 SLICE 4A STAGE C2` on 2026-09-03.

## Load and prohibited-operation report

- Fixture HTTP requests: `8`, all loopback-only.
- Successful-path upstream operations: `11` against the in-memory substitute.
- In-memory success-path mutations: `4`.
- External Supabase/Auth/Data API requests from the fixture: `0`.
- Provider requests: `0`.
- Model requests: `0`.
- Customer-data requests: `0`.
- Persistent database writes: `0`.
- Live execute-route invocations: `0`.
- Live ledger RPC invocations: `0`.
- Polling, timers, retries, background jobs, cache invalidation, lifecycle changes: `0`.
- Product source, route, UI, request, adapter, migration, schema, provider/data, artifact/index/publication changes: `0`.
- Merge, deployment, Vercel, branch deletion, destructive cleanup, or force push: `0`.
- Playwright was intentionally omitted because Stage C2 has no rendered UI acceptance surface; the localhost HTTP handler fixture is the direct accepted proof mechanism.

## Recovery Contract reference and next boundary

Recovery Contract: `CHANGELOG.md` -> `September 3, 2026 — ACE-048 Phase 4 Slice 4A Stage C2 Application-Wrapper HTTP Proof Accepted`.

The next separately gated decision is Project Manager discovery and target locking for publication readiness of the ledger-enabled application source. This closeout does not authorize merge, deployment, Vercel consequences, true concurrent-session proof, live execute-route/RPC invocation, provider/model/customer action, persistent data, retry/reconciliation, migration, or artifact/index publication.

Accepted-content Git identity: `4db0a7086ce9e7a89cd0c0cdeec04a21a73f4384`.

Checkpoint Status: `none` — Human acceptance, Recovery Contract, verified acceptance backup, accepted-content identity, and Git closeout are recorded; no unpropagated Stage C2 state remains.
