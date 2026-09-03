# ACE-048 Phase 4 Slice 4A Stage C1 — Rollback-Only RPC Proof PM Brief

Date: 2026-09-03
Governing event: `ACE-048`
Feature domain: provider-neutral Decision Workspace execution ledger
Problem class: runtime behavior — live database RPC contract proof
Planning mode: PLAN completed and explicitly approved
Execution mode: `transitional_self_verification`
Reasoning level: HIGH — bounded live database function exercise with transaction and rollback guarantees
Execution readiness: `target-locked / execution-ready`
Status: AUTHORIZED / PRE-IMPLEMENTATION PROPAGATION

## Operator summary

### What is changing

Temporarily exercise all four installed execution-ledger functions with synthetic sandbox identities inside one explicit database transaction, then roll the entire transaction back.

### What the operator will get

Direct proof that the framework can claim work once, prevent duplicate authority, record per-action outcomes, represent partial and indeterminate results honestly, reject cross-tenant use, and preserve compatibility-event binding without touching Gmail or any provider.

### Why it matters

This validates the generic execution-safety foundation before it is connected to application routes or real business workflows. The same safety contract is intended to support email, purchasing, shipping, support, investments, paid media, bookkeeping, tax, and future multi-agent or multi-source workflows.

## Objective

Invoke and verify the four installed execution-ledger RPC contracts only inside one explicit rollback-only transaction on Supabase project `cjpjekhlvzwjwtszqpmy`, then independently prove that all synthetic and ledger state returned to the exact pre-execution zero-persistence baseline.

## Target lock

- Live project: `cjpjekhlvzwjwtszqpmy` (`agent_platform`).
- Governing migration: `supabase/migrations/20260902141603_add_decision_workspace_execution_ledger.sql`.
- Migration SHA-256: `6bba05da4b65bce9a36d08694c8bd6b1cc0c310a6b3f1ae5f473cf8514437ab4`.
- Exact RPCs:
  - `claim_decision_workspace_execution`
  - `record_decision_workspace_action_receipt`
  - `finalize_decision_workspace_execution`
  - `resolve_stale_decision_workspace_execution`
- Accepted live definition MD5 identities:
  - claim: `cc6bba34de6a72c2b80fcaad765624ba`
  - receipt: `a8230d9fa3b35237c62a9d38d8131fb2`
  - finalize: `a5ad7ee5e2cc1c0defda6971e5718104`
  - stale resolution: `5958ddf88bc7a3842aeafc3ce44d5305`
- Ephemeral execution artifact only: `/private/tmp/ace048_stagec1_rollback_rpc_proof.sql`.
- Implementation repository writes: zero.

### Frozen read references

- `supabase/migrations/20260902141603_add_decision_workspace_execution_ledger.sql`
- `web/src/lib/runtime/runtimeExecutionLedger.ts` — accepted SHA-256 prefix `d222824`
- `web/src/lib/runtime/decisionWorkspaceExecutionModel.ts` — accepted SHA-256 prefix `2a9abd1`
- `web/src/lib/runtime/runtimeRequestAccess.ts` — accepted SHA-256 prefix `3aa7994`
- `web/src/lib/runtime/runtimeApprovalIntegrity.ts` — accepted SHA-256 prefix `07771f2`
- accepted POST execute route — accepted SHA-256 prefix `0a09f51`
- `web/scripts/runtime-execution-ledger-fixtures.mjs` — accepted SHA-256 prefix `dc90397`

If any identity differs, any additional repository source is required, or the execution path cannot remain one rollback-only transaction, stop and return to PM.

## Scope and execution sequence

1. Create and verify the normal project-scoped pre-implementation incremental backup with seven-day pruning and `KEEP` preservation.
2. Reattest clean Git branch/head, exact live project, migration identity, four function identities/security settings, zero ledger rows, fixture-table permissions, no non-internal triggers, and no publication membership.
3. Generate the exact ephemeral SQL artifact under `/private/tmp`; require `BEGIN`, `SET LOCAL ROLE service_role`, and terminal `ROLLBACK`, and prohibit `COMMIT` anywhere.
4. Inside the transaction, privately select one existing actor/tenant only for foreign-key and authorization context; do not expose identity values in the operator report.
5. Preflight fixed synthetic agent/request/decision/action identities as absent.
6. Insert one synthetic owned agent and three synthetic approval-request/latest-approved-decision pairs using only sandbox `decision_only` actions.
7. Exercise and assert:
   - one succeeded sandbox no-op claim, receipt, finalization, and bound compatibility event;
   - identical replay returns the same run and grants no second invocation authority;
   - one two-action run aggregates one success plus one failure to `partial` and emits no compatibility-success event;
   - one active action is forced to a test-only expired lease and resolves to `indeterminate` / `manual_required`;
   - one mismatched-tenant claim is rejected inside an exception-captured sub-block.
8. Assert exact receipts, attempts, transitions, aggregate states, lease behavior, provenance bindings, and `invocation_authorized` values.
9. Emit one unambiguous assertion-success marker, execute `ROLLBACK`, then use an independent read-only query to prove unchanged ledger counts and zero surviving synthetic agent/events.
10. Produce the exact verifier/review packet and State Transition Matrix. Do not perform acceptance capture until Oliver returns an explicit Human Review decision.

## Load declaration

- Database requests: one MCP SQL execution plus independent read-only preflight/postflight checks.
- In-transaction RPC calls: maximum `15`.
- Transient maximum rows: `3` execution runs, `4` execution actions, `1` synthetic agent, `6` request/decision events, and `1` compatibility event; all must roll back.
- HTTP routes: none.
- Provider/model calls: none.
- Polling: none.
- Expected poll cadence: none.
- Background jobs, cache invalidation, scheduler, mailbox scan, Smart Sync, artifact handoff, or stale-build reclaim: none.
- Existing application request count and provider fanout: unchanged.

## Constraints and exclusions

- No `COMMIT` statement.
- No persistent ledger, agent, request, decision, compatibility-event, provider, or customer-data write.
- No Gmail or other provider action.
- No true concurrent-session claim proof.
- No `supabase-js` wrapper proof and no POST `/api/runtime/execute` proof.
- No source, UI, route, request, polling, cache, retry-worker, or lifecycle implementation change.
- No migration create/apply/revert/repair or schema alteration.
- No commit or push of the ephemeral SQL artifact.
- No merge, deployment, Vercel change, artifact/index publication, or task archival.
- Current wrapper/route integration on the branch is read-only context; activation remains separately gated because it is not on `main` or deployed.

## Recovery contract for this execution

- `COMMIT` must not appear anywhere in the execution artifact.
- Any SQL error or failed assertion must abort the transaction; no retry is allowed without read-only postflight adjudication and a new signal.
- Connection loss must be treated as ambiguous until independent postflight proves zero persistence.
- The required recovery action is transaction rollback or server-side disconnect rollback, followed by independent zero-persistence proof.
- If any synthetic or ledger row survives, stop and return to PM. Do not issue cleanup `DELETE` statements without separate approval.

## Accepted proof surfaces

- Exact project, migration, role/grant, function-signature, security, configuration, and MD5 identity preflight.
- Exact pre-execution ledger and synthetic-identity counts.
- Assertion-success marker from the single transaction.
- Success, identical replay, partial, stale-to-indeterminate, cross-tenant rejection, compatibility-event binding, and rollback behavior.
- Independent post-rollback proof that ledger counts equal the preflight baseline of zero and no synthetic agent/events remain.
- Existing eight-domain static ledger fixture remains passing.
- Prohibited-operation counts: zero provider calls, customer writes, HTTP requests, background work, source edits, migrations, commits of the SQL artifact, merges, and deployments.

## State Transition Matrix requirement

The verifier must report one row for each of:

1. succeeded claim and finalization;
2. identical replay/no second authority;
3. partial aggregation;
4. stale lease to indeterminate/manual-required;
5. cross-tenant rejection;
6. transaction rollback and zero persistence.

Each row must state baseline, action, settled in-transaction result, downstream result, remaining blocker, whether separate, and PASS/FAIL/BLOCKED.

## Verification and regression protections

- Run the existing static ledger fixture before and after the live transaction; require all eight domains and lifecycle assertions to pass.
- Verify the strongest direct database evidence; Playwright is not applicable because no UI or application HTTP route is exercised.
- The accepted Gmail UI, counts, routes, actions, batching, provider controls, requests, polling, and close/return behavior remain untouched.
- Verification failure must return through diagnosis, mechanism-level root-cause translation, bounded correction, and re-verification; the verifier must not silently repair live data.
- Final classification must be `Accepted Fix Proven`, `Partial Proof`, or `Blocked Proof`; only the first may enter Human Review.

## Authorization

Oliver issued exact `ACCEPT PHASE 4 SLICE 4A STAGE C1 ROLLBACK-ONLY RPC PROOF` on 2026-09-03. This authorizes the governed backup and the exact rollback-only execution and verification contract above. It does not authorize application-source activation, provider execution, persistent test data, merge, or deployment.
