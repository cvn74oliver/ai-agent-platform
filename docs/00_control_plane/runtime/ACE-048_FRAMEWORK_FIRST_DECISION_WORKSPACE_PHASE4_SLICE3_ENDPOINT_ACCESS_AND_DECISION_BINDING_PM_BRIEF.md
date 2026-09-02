# ACE-048 Framework-First Decision Workspace Phase 4 Slice 3 — Endpoint Access and Decision Binding PM Brief

Date: 2026-09-02
Status: `HUMAN ACCEPTED / RECOVERY BACKED / GITHUB PRESERVED / CLOSED 2026-09-02`
Governing event: `ACE-048`
Feature domain: `Decision Workspace approval-family runtime endpoints`
Mode: `PLAN MODE required; execute only after explicit approval`
Reasoning level: `HIGH — bounded multi-file security correction with frozen provider behavior`
Execution mode: `transitional_self_verification`
Problem class: `runtime behavior — authentication, ownership, request/decision binding, and provenance`

## Executive summary

### What is changing

The existing approval-family endpoints will stop trusting caller-supplied agent IDs. Every request will prove the signed-in user owns the agent before any privileged read or write, and decisions/execution checks will be tied to that same agent and request.

### What Oliver will get

The Gmail experience remains visually and operationally familiar, but anonymous or cross-account callers can no longer read or manipulate another agent's approval state. The correction also gives future business workflows a reliable actor-and-tenant boundary.

### Why it matters

This is the minimum safe foundation beneath the accepted approval UI. It removes the live authorization gap before Automata adds more providers, while keeping the harder atomic-execution and receipt-ledger redesign separate and honest.

## Objective

Create one shared authenticated runtime access seam and apply it to the complete current approval-family endpoint set and legacy approvals surface. Bind request, decision, mode, confidence, and execution lookup/write operations to the authenticated owner, exact agent, and tenant; resolve the latest same-agent decision; retain actor/tenant provenance; and preserve all current provider operation bodies, request families, UI controls, routes, caches, polling, and accepted Gmail behavior.

## Exact routes and surfaces

- `/agents/[id]/operations/approvals`
- `/agents/[id]/playground`
- `/approvals`
- `POST /api/agents/playground`
- `POST /api/runtime/plan`
- `POST /api/runtime/mode`
- `POST /api/runtime/approve`
- `POST /api/runtime/auto-approve`
- `POST /api/runtime/execute`
- `GET /api/runtime/confidence`
- `GET /api/runtime/eligibility`

No route may be renamed, aliased, removed, or added.

## Exact locked source allowlist — 13 files

1. `web/src/lib/runtime/runtimeRequestAccess.ts` — new shared server-only authentication, same-origin mutation, explicit owned-agent, and tenant resolution seam.
2. `web/src/lib/runtime/runtimeApprovalIntegrity.ts` — new pure request/decision identity and latest-decision validation helpers; no provider SDK, fetch, cache, timer, or UI code.
3. `web/src/lib/runtime/types.ts` — add optional backward-compatible actor, tenant, request-event, and decision-event provenance fields only.
4. `web/src/app/api/agents/playground/route.ts` — require the shared access proof before existing rehydrate/chat runtime work; preserve the existing request and runtime behavior after authorization.
5. `web/src/app/api/runtime/plan/route.ts` — require owner access and retain authenticated actor/tenant provenance on new approval requests.
6. `web/src/app/api/runtime/mode/route.ts` — require owner access and retain actor/tenant provenance on mode updates.
7. `web/src/app/api/runtime/approve/route.ts` — authenticate, prove same-agent request existence before insert, enforce same-agent current-decision semantics, and retain actor/tenant/request provenance.
8. `web/src/app/api/runtime/auto-approve/route.ts` — apply identical owner/request/current-decision binding before the existing eligibility rule.
9. `web/src/app/api/runtime/execute/route.ts` — authenticate, bind every lookup to the owned agent/request, require the latest same-agent decision to be approved, and retain actor/tenant/request/decision provenance; provider operation bodies remain frozen.
10. `web/src/app/api/runtime/confidence/route.ts` — require owner access before returning agent-scoped confidence.
11. `web/src/app/api/runtime/eligibility/route.ts` — require owner access before returning agent-scoped mode/eligibility.
12. `web/src/app/approvals/page.tsx` — replace the global service-role read with authenticated owner-scoped reads; retain the page and client handlers.
13. `web/scripts/runtime-endpoint-integrity-fixtures.mjs` — new deterministic access/binding fixtures and static guards.

No fourteenth source file is authorized. `package.json` must not change; run the fixture script directly through the established TypeScript loader. If implementation needs a migration, schema/RPC change, provider helper, Decision Workspace adapter/model change, Operations page change, new route, middleware/proxy, cache/lifecycle owner, or any other source file, stop and return to PM.

## Baseline hashes

| File | SHA-256 |
|---|---|
| `api/agents/playground/route.ts` | `2ef1734103e6be6ce1dea928b45df3396c69c084842247ddb2d3ce3a635a9a11` |
| `api/runtime/plan/route.ts` | `7f6a357350d8aab439723c38425321e0f73484dc1ff892e4b82512b86715b295` |
| `api/runtime/mode/route.ts` | `e9fd3ba7a321ef52fb9b9f15af62802492db1f810d4bc28c3ad97e0d7df85b02` |
| `api/runtime/approve/route.ts` | `0da3c2d4d6629878d606875a28b1964e4a465f9451f8dd61af64707a47968b4b` |
| `api/runtime/auto-approve/route.ts` | `399c26d9a7b2352f36884fdaf4f9d7b10abd6147d54b345d017b133001bafde8` |
| `api/runtime/execute/route.ts` | `12cc37fc776af0b3ffcb9de3b90e4fcf2b9600e4a1c11d55faa575884e22208c` |
| `api/runtime/confidence/route.ts` | `11e295423b52f693606aa06ca82eb5a73281285f8546c4063f2089a1188b9c64` |
| `api/runtime/eligibility/route.ts` | `cedfffd972825c65c2a9c04f215797a628b89db968660764ca0bc93edcb7ad9d` |
| `app/approvals/page.tsx` | `eeaa260bb166be9faff5646dd3b9698cb5726659c169645c821a993392936e36` |

Frozen provider and accepted-presentation hashes:

| File | SHA-256 |
|---|---|
| `web/src/lib/integrations/gmail/inboxAnalysis.ts` | `57ab82fffd8a29570d34719616149f2732d670bb2b35424ca6df85d2ac78058c` |
| `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts` | `226c30e475783909b8a880971a05d62b9890ecae957071460015029eaa269f6b` |
| `web/src/app/agents/[id]/operations/approvals/page.tsx` | `fec9b3c769feb98b5e7f354f241a4cf146e843464dbeb07776aa704fa3ea4311` |
| `web/src/lib/runtime/stateLoaders.ts` | `27ce88c8aa54c386efb612e285507dad313e4e16b1412ec90154ca46af43eab1` |
| `web/src/lib/runtime/gmailRuntimeAssembler.ts` | `1a0b67612f201cc9d5500f6001548d231fa5a040460727def6c375829f5e3b70` |
| `web/src/lib/runtime/decisionWorkspaceActionModel.ts` | `09d097563c2d4cf4dbb6bfd90e0826871ff1378ce721635618e92c737f3cd2ae` |
| `web/src/lib/integrations/gmail/gmailDecisionWorkspaceActionAdapter.ts` | `95d8d13a3fd9eee6d824d5c37b02d44a98bf18e78ce9db83d664141a9663edb4` |

Every frozen hash must remain byte-identical.

## Required implementation behavior

1. Resolve the authenticated user with the existing request-scoped Supabase SSR client inside each request; anonymous or invalid sessions return `401` before privileged access.
2. For state-changing POSTs, require the request to be same-origin under the deployed/local origin contract before processing the body. Do not invent a cross-origin API mode.
3. Resolve the supplied agent only when `agents.id = agent_id` and `agents.user_id = authenticated user.id`. Use one non-enumerating access-denied response for nonexistent and foreign agents.
4. Resolve the authenticated user's `tenant_id` from `profiles`; fail closed when missing.
5. Only after steps 1-4 may the route create/use the existing admin client. Every privileged `agent_events` query must still include `.eq('agent_id', agentId)`; service-role access is not authorization.
6. Plan and mode events add backward-compatible actor/tenant provenance without changing the current request/response shape.
7. Approval first loads the matching same-agent request and validates payload identity. Missing, malformed, foreign, or mismatched requests produce no decision or confidence event.
8. Approval and auto-approval resolve the current same-agent decision. Repeating the identical decision is idempotent; conflicting later decisions fail closed. Do not rewrite historical events.
9. Execute loads the exact same-agent request and the latest same-agent decision event. Only a latest `approved` decision is executable; the existence of an older approval is insufficient.
10. Prior-execution checks are same-agent and exact-request scoped.
11. Execution result provenance includes authenticated actor, tenant, request event, and decision event identities using optional backward-compatible fields.
12. Keep all current action parsing and provider operation bodies byte-identical in behavior. This slice does not add an execution claim, retry, rollback, provider registry, provider adapter invocation, or generalized execution-safety claim.
13. The legacy `/approvals` page must use authenticated owner-scoped event reads; it may not render a global service-role queue.
14. Error responses must not expose whether a foreign agent/request exists, database internals, tokens, tenant identifiers, or provider credentials.

## Runtime load declaration

- Existing Operations read family: one `POST /api/agents/playground` per current load/refresh pattern; unchanged.
- Existing plan/mode/approve/auto-approve/execute families: one request per explicit current user action; unchanged.
- Existing confidence/eligibility GET families: unchanged.
- New request families: zero.
- New polling/timers/retries/caches/background jobs/model calls/provider calls: zero.
- Added server work: one authenticated-user validation, one explicit owned-agent lookup, and one tenant lookup per protected request; no mailbox or artifact scan.
- Expected steady-state provider calls: zero without the existing explicit execute action.
- Build-pending continuity, Smart Sync/artifact handoff, stale-build reclaim, Gmail destination commit/push/restore, Management cache, and provider execution bodies: unchanged.

## Verification contract

### Static and deterministic proof

- New fixtures cover unauthenticated, expired-session, foreign-agent, missing-agent, missing-tenant, wrong-origin, owner-success, request-agent mismatch, missing request, same-decision replay, conflicting decision, cross-agent historical approval, latest rejected decision, and prior execution under a different agent.
- Static guards prove every locked endpoint invokes the shared access seam before `getSupabaseAdmin()` or privileged event work.
- Static guards prove every approval/decision/execution query includes the exact agent binding.
- Static guards prove the provider and accepted-presentation frozen hashes remain unchanged.
- TypeScript, exact-file ESLint, existing Decision Workspace contract/action/read/presentation fixtures, Gmail review-unit/group/window/optional-evidence regressions, and `git diff --check` pass.
- Exact source diff equals the 13-file allowlist.

### Runtime proof

Use Playwright for the exact authenticated routes and plain read-only HTTP checks for unauthenticated GETs. Verification must not click approve, reject, auto-approve, mode, execute, Gmail destination, or any provider-action control.

Required proof:

1. unauthenticated confidence and eligibility checks now return `401`, with no sensitive body;
2. an authenticated owner can load the canonical Operations Approval Queue post-settle with the accepted counts, full bundle presentation, and controls unchanged;
3. the legacy `/approvals` route no longer exposes a global queue and is limited to the authenticated owner's records;
4. a foreign/nonexistent agent probe returns the same non-enumerating denial and produces zero events;
5. route request trace shows the same current read families, zero action POSTs, zero failed authenticated owner reads, zero `409` churn, and zero console/page errors;
6. no provider, data, database schema, artifact, index, or publication mutation occurs during verifier proof.

Ready-state requires canonical URL, Approval Queue heading, all four status sections or explicit empty states, stable counts, no loader/error/overlay, and stable request count after settle. Capture post-settle screenshot, DOM/state, request trace, and console state for the canonical Operations route and owner-scoped legacy route.

### State Transition Matrix

The verifier must report one row each for:

- unauthenticated GET;
- authenticated owner Operations route;
- authenticated foreign-agent denial fixture/probe;
- owner-scoped legacy approvals route;
- missing request decision fixture;
- latest rejected decision fixture;
- cross-agent historical decision fixture.

Each row includes baseline state, action, settled state, downstream result, remaining blocker, whether separate, and PASS/FAIL/BLOCKED.

## Acceptance criteria

- Anonymous requests cannot read or change approval-family runtime state.
- An authenticated user cannot read or change another user's agent runtime state by supplying its UUID.
- Approval never writes before the exact owned request is proven.
- Execute uses the latest same-agent decision and exact same-agent prior-execution history.
- Actor and tenant provenance are retained without breaking historical payload readers.
- The canonical Gmail Approval Queue looks and behaves the same for its owner.
- Current routes, request bodies, response success shapes, counts, controls, provider operations, caches, polling, and lifecycle refreshes remain unchanged.
- No schema/migration, provider helper, action adapter/model, Operations page, data, artifact, index, or publication state changes.
- The pass makes no claim of atomic/exactly-once provider execution; that remains separately blocked and target-gated.

## Explicit exclusions and later blocker

Not authorized in Slice 3:

- atomic execution claim/lease;
- execution ledger/table/RPC or migration;
- per-action durable receipts and lifecycle transitions;
- provider retry/reconciliation/rollback;
- Gmail partial-failure payload changes;
- provider registry/generalized adapter execution;
- Workflow Studio, proprietary-brain UI, shared learning, marketplace, or multi-agent orchestration;
- route rename/addition, new request/poll/cache/timer/background behavior;
- provider/data/database/artifact/index/publication mutation during verification;
- commit, push, merge, deployment, force operation, or lineage deletion before later accepted-milestone gates.

The later execution-ledger slice remains blocked from exact target lock until its Supabase migration is generated through the approved migration workflow and its provider-specific ambiguous-failure/retry semantics are separately planned.

## Rollback

Rollback is source-only across the 13-file allowlist: restore the ten existing endpoint/page/type files to their baseline hashes and remove the two new runtime helpers plus fixture. No database, provider, artifact, publication, or data rollback is required because this slice contains no schema or live-data change.

## Decision gate

Oliver returned `ACCEPT PHASE 4 SLICE 3 ENDPOINT ACCESS IMPLEMENTATION` and later explicit Human Review `ACCEPT` on 2026-09-02. The exact 13-file implementation passed the required verification loop, its Recovery Contract and Human-acceptance backup were captured, and accepted-content commit `22243c25bdd16098c2bd5eb97719f0a0ac95874e` was pushed normally without force. Merge, deployment, and later atomic execution/receipt-ledger work remain separate gates.
