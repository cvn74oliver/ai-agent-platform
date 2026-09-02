# ACE-048 Framework-First Decision Workspace Phase 4 Endpoint-Integrity Discovery Handoff

Date: 2026-09-02
Status: `DISCOVERY COMPLETED / FIRST CORRECTION TARGET-LOCKED / IMPLEMENTATION AWAITING EXPLICIT DECISION`
Governing event: `ACE-048`
Mode: `PLAN MODE — repository-first read-only discovery with bounded read-only production and Supabase checks`
Problem class: `runtime behavior — authorization, request/decision binding, execution lifecycle, and provider receipt integrity`
Reasoning level: `EXTRA-HIGH — cross-layer security and provider-mutation boundary`

## Executive summary

### What is changing

Nothing in the app or provider is changed by this discovery. The next recommended implementation establishes the access-control and decision-binding floor for the existing runtime endpoints before any provider-execution generalization.

### What Oliver will get

Only the signed-in owner of an agent will be able to read or change that agent's runtime approval state. Approval and execution will be bound to the same agent and the exact request, and execution will use the latest server-authoritative decision rather than the existence of any historical approval.

### Why it matters

The accepted UI now explains approvals well, but the legacy server endpoints still trust caller-supplied IDs while using a service-role database client. That means the UI is safer than the endpoint beneath it. The security floor must be corrected before Automata can safely add support, finance, investing, advertising, purchasing, shipping, or other provider actions.

## Authority and boundaries

Oliver issued `ACCEPT PHASE 4 ENDPOINT-INTEGRITY DISCOVERY` on 2026-09-02.

This authorized read-only repository tracing and bounded read-only production/database inspection. It did not authorize source/runtime implementation, approval or execution calls, provider/data/database/artifact/index/publication mutation, schema changes, new requests or polling, commit, push, merge, or deployment.

No approval, rejection, auto-approval, mode change, execution, provider operation, or data mutation was invoked during discovery.

## Exact current path

```text
/agents/[id]/operations/approvals
  -> OperationsRuntimeContext
  -> POST /api/agents/playground (rehydrate existing runtime state)
  -> runtimeStateService -> stateLoaders -> agent_events
  -> Gmail Decision Workspace adapter -> complete ordered approval bundle
  -> existing submitDecision / executeApproved handlers
     -> POST /api/runtime/approve
        -> INSERT approval_decision
        -> lookup approval_request only after the decision is stored
        -> INSERT confidence_update events
     -> POST /api/runtime/execute
        -> read latest runtime mode for supplied agent_id
        -> read approval_request for supplied agent_id + approval_id
        -> count any approved decision for approval_id (currently not agent-scoped)
        -> count any execution_result for approval_id (currently not agent-scoped)
        -> parse every proposed action
        -> resolve agent owner -> tenant -> Gmail connection
        -> invoke current Gmail/sandbox operation inline
        -> INSERT execution_result only after the whole bundle succeeds
```

Separate legacy surface:

```text
/approvals
  -> server component uses getSupabaseAdmin()
  -> reads global approval_request / approval_decision / confidence / mode / execution events
  -> client controls call approve / auto-approve / execute
```

Request-producing and prerequisite endpoints:

```text
/agents/[id]/playground -> POST /api/runtime/plan -> INSERT approval_request
/api/runtime/mode       -> INSERT runtime_mode_update
/api/runtime/auto-approve -> INSERT approval_decision
/api/runtime/confidence and /eligibility -> read confidence/mode state
```

## Proven findings

1. The approval, auto-approval, execution, plan, mode, confidence, and eligibility endpoints use `getSupabaseAdmin()` and do not authenticate the caller or prove ownership of the supplied `agent_id`.
2. The live `agent_events` table has owner RLS policies, but the service-role client bypasses RLS. Official Supabase guidance confirms that service-role authorization bypasses RLS.
3. The production confidence and eligibility endpoints returned HTTP `200` without cookies for the known agent ID, confirming the access-control gap is live rather than theoretical.
4. The live `agents` policy set contains broad public-read policies in addition to owner policies, so merely switching one lookup to a request-scoped client is not a sufficient ownership proof; the endpoint must explicitly bind `agents.id` to the authenticated `user.id`.
5. `/api/runtime/approve` stores `approval_decision` before proving that the matching request exists.
6. `/api/runtime/execute` scopes the request lookup to `agent_id`, but its approval-decision and prior-execution checks are not agent-scoped.
7. Execution accepts any earlier approved event instead of resolving the latest decision. The current data happens not to contain an approved-then-rejected sequence, but the code permits it.
8. The current runtime event payloads do not retain the authenticated decision/execution actor or tenant binding required by the accepted framework contract.
9. The live event store has only its primary key and general agent/event indexes. It has no unique approval-decision constraint, execution claim, idempotency key, per-action receipt ledger, or lifecycle-transition constraint.
10. Execution performs provider operations before recording the final result. Concurrent execute requests can both pass the check-before-act guard. A multi-action failure after an earlier action succeeds can leave partial provider effects without a durable complete receipt.
11. Gmail archive processing can report partial message failures internally, but the legacy runtime archive result reduces that to requested/archived counts and accepted IDs; failed IDs and the partial-failure flag are not retained in the final runtime result.
12. Current production data shows no detected exploitation or corruption: `73` request events, `70` decision events, and `10` execution events had zero orphan decisions, orphan executions, duplicate decisions, duplicate executions, cross-agent approval IDs, or latest-rejected/earlier-approved cases. This is a preventive correction, not a data-repair task.

## Responsibility boundary

| Layer | Owns | Must not own |
|---|---|---|
| Framework | actor, tenant, workflow/runtime, subject, request, decision, action, approval, idempotency, lifecycle, receipt, rollback, and outcome semantics | provider credentials or provider-specific mutation code |
| Workflow definition | allowed action bundle, ordering/atomicity, responsible roles, required approval, policy/SOP version, prerequisites | live authentication or silent runtime mutation |
| Domain/provider adapter | deterministic mapping from declared action to provider capability, source/connection, provider-specific receipt and reversal vocabulary | caller authentication, cross-tenant authority, or fabricated provider success |
| Endpoint access layer | authenticate the request, require same-origin state changes, bind user -> owned agent -> tenant, and provide explicit privileged access only after that proof | workflow vocabulary or provider behavior |
| Approval lifecycle | prove request existence and identity, preserve one server-authoritative current decision, retain actor/time/reason | provider execution |
| Execution lifecycle | atomically claim an approved action bundle, preserve per-action results and ambiguous/partial failure, enforce idempotency and retry policy | UI-only optimistic truth |
| Provider operation | execute only a declared provider capability and return exact provider receipt/verification/reversal truth | deciding whether the human authorized it |

## Reference-domain test

| Domain | Required integrity invariant |
|---|---|
| Gmail | owner-bound agent/request; exact archived/drafted scope; no duplicate draft/archive; Gmail receipt and partial failure retained |
| Customer service | refund or account action is bound to the customer/case, responsible role, signed-in approver, and provider receipt |
| Real estate | offer authority is property/account specific, high-risk, immutable, and separately reversible/withdrawable |
| Crypto/investments | venue/account ownership, latest explicit approval, idempotent order identity, immutable trade receipt, no cross-venue collapse |
| Multi-source paid media | each Meta/Google/TikTok action retains its own connection and receipt; one bundle is allowed only when the workflow declares it |
| Bookkeeping | ledger/company/period identity and actor are mandatory; journal receipt and reversal reference remain inspectable |
| Tax | taxpayer/entity/year/form identity, elevated approval, submission receipt, amendment path, and no silent retry |
| Purchasing / spreadsheet / inventory / shipping | every stage retains its agent role, source, prerequisite, actor, receipt, and handoff; one approval cannot silently authorize undeclared downstream work |

The same access and binding rules hold across all domains. Provider-specific retry, receipt, reconciliation, and reversal rules cannot be reduced to one Gmail-shaped implementation.

## Recommendation

Use two bounded corrections rather than one broad execution rewrite:

1. **Phase 4 Slice 3 — Endpoint Access and Decision Binding** (target-locked now): close unauthenticated/cross-agent access, bind every current approval-family request to the signed-in owner and tenant, validate the request before decision insertion, use the latest same-agent decision, and retain actor/tenant provenance. Keep every current provider function and UI handler unchanged.
2. **Later Phase 4 execution-ledger slice** (not execution-ready yet): add an atomic execution claim, per-action idempotency and receipts, partial/indeterminate failure, explicit retry/reconciliation, rollback references, and provider adapter execution mapping. This will require a separately generated migration and a new target lock; it must not be smuggled into Slice 3.

This ordering immediately removes the live authorization exposure without pretending the current check-before-act provider loop is a complete generic execution engine.

## Exact target lock

The first correction is execution-ready under:

`docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE3_ENDPOINT_ACCESS_AND_DECISION_BINDING_PM_BRIEF.md`

The later atomic execution-ledger work remains a precise candidate-grounded blocker because no execution ledger/table/RPC currently exists and Supabase migration identity must be generated through the approved migration workflow only after separate planning authority.

## Checkpoint

Checkpoint Status: `continuity checkpoint created`.

- Unpropagated state after this artifact: none; the target lock is propagated with this discovery closeout.
- Classification: approved discovery result and deferred implementation plan.
- Implementation may not begin until Oliver returns the exact separate decision gate.
