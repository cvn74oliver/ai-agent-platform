# ACE-048 Framework-First Decision Workspace Phase 4 Slice 4A — Atomic Execution Claim and Receipt Foundation PM Brief

Date: 2026-09-02
Status: `STAGE A HUMAN ACCEPTED / RECOVERY BACKED / GITHUB PRESERVED / CLOSED`
Governing event: `ACE-048`
Feature domain: `Decision Workspace approved-action execution integrity`
Mode: `PLAN MODE required; execute Stage A only after explicit approval`
Reasoning level: `EXTRA-HIGH — cross-layer database claim, provider-effect, and ambiguous-outcome boundary`
Execution mode: `transitional_self_verification`
Problem class: `runtime behavior plus additive schema contract — atomic database claim, per-action receipts, partial/indeterminate truth, and fail-closed replay`
Target-lock source: `inferred_target_lock after repository trace plus command-generated Supabase migration identity`

## Executive summary

### What is changing

Automata will reserve each approved execution exactly once in its own database before contacting any provider, then record a separate durable outcome for every action in the approved bundle. A partial or uncertain provider outcome will remain visibly and operationally distinct from a completed execution.

### What Oliver will get

Gmail remains the first reference adapter and keeps its accepted presentation and controls. Underneath it, the execution record becomes a provider-neutral framework that can safely support customer service, real estate, investments/crypto, paid media, bookkeeping, tax, shipping/purchasing, and other future workflows without pretending that unrelated external providers participate in one transaction.

### Why it matters

The current check-before-act loop can let simultaneous requests pass the same check, and it writes one success event only after the complete bundle finishes. The new foundation prevents duplicate claims, preserves exact source/workflow/role/action provenance, and records partial or indeterminate truth instead of reporting success when only part of the external work is known to have completed.

## Governing framework contract

The framework owns stable execution identities, database claim semantics, lifecycle states, idempotency keys, transition validation, aggregate outcome rules, receipt requirements, tenant isolation, and safe generic fallbacks.

Workflow definitions own the ordered action bundle, prerequisites, approval policy, fail-fast/continue policy, and versioned workflow identity.

Provider adapters own provider-specific invocation semantics, receipt extraction, verification, safe-retry classification, reconciliation, and reversal/compensation capability. Gmail is the first reference adapter, not the framework vocabulary.

Presentation metadata may be AI-proposed during guided workflow/adapter setup, but it must be human-reviewable, versioned with the published definition, deterministic at render time, and reversible. No model call may generate or rewrite labels during execution or page load.

Multi-agent and multi-source workflows must retain tenant, workflow definition/version, runtime, agent role, source, connection, subject, action, request, decision, and provider receipt identity. The framework must never claim cross-provider atomicity. Its atomic guarantee is limited to the local database claim; external effects are represented action by action and may aggregate to `partial` or `indeterminate`.

The proprietary brain remains tenant-owned, versioned, inspectable, provenance-backed, evaluated, human-governed, and reversible. This slice does not implement training UI, shared learning, Workflow Studio, or uncontrolled self-modification.

## Objective

Add the minimum provider-neutral execution ledger needed to atomically claim one approved request, create one stable action record per ordered proposed action, record exact per-action receipts and lifecycle outcomes, fail closed on concurrent or ambiguous replay, and retain the existing successful `execution_result` compatibility event only when every action is durably `succeeded`. Preserve all accepted Gmail UI, routes, counts, read families, provider controls, request cadence, and close/return behavior.

## Exact route and surfaces

- Mutation route: `POST /api/runtime/execute`
- Read-only regression surface: `/agents/[id]/operations/approvals`
- Downstream compatibility readers of successful `execution_result` events

No route may be renamed, aliased, removed, or added.

## Exact locked Stage A allowlist — 9 files

1. `supabase/migrations/20260902141603_add_decision_workspace_execution_ledger.sql` — command-generated additive schema/RPC migration; currently empty and not applied.
2. `web/src/lib/runtime/decisionWorkspaceContract.ts` — extend the provider-neutral execution lifecycle/status and receipt identity contract without adding provider vocabulary.
3. `web/src/lib/runtime/decisionWorkspaceExecutionModel.ts` — new pure framework model for stable bundle/action keys, status transitions, aggregate outcome, lease expiry, retry/reconciliation classification, and fail-closed validation.
4. `web/src/lib/runtime/runtimeExecutionLedger.ts` — new server-only persistence seam for claim, action transition/receipt recording, stale-claim resolution, and finalization through the named RPCs.
5. `web/src/lib/integrations/gmail/gmailDecisionWorkspaceExecutionPolicy.ts` — new Gmail-specific receipt normalization and definitive/partial/indeterminate classification; no generic framework labels and no provider registry.
6. `web/src/lib/runtime/types.ts` — add backward-compatible execution outcome, receipt, partial, indeterminate, and failed-ID result types.
7. `web/src/app/api/runtime/execute/route.ts` — claim before provider invocation, record each action outcome, stop safely on non-success, and emit the legacy success event only after complete success.
8. `web/src/lib/integrations/gmail/inboxAnalysis.ts` — preserve accepted and failed Gmail message IDs plus the existing partial-failure signal through the archive wrapper.
9. `web/scripts/runtime-execution-ledger-fixtures.mjs` — new deterministic schema/model/route/static fixtures across the reference domains and concurrent/partial/indeterminate cases.

No tenth implementation file is authorized. If Stage A requires an Operations component, action-presentation adapter/model, state loader, legacy approvals page, route, provider registry, background worker, scheduler, polling owner, cache owner, or any other source file, stop and return to PM for explicit rescope.

Control-plane propagation and review artifacts are governed documentation outputs and are not implementation files in this allowlist.

## Baseline hashes and frozen seams

| File | SHA-256 |
|---|---|
| `web/src/lib/runtime/decisionWorkspaceContract.ts` | `9a190b3f9fafa59e8b236edbdfdabf4b83f07c607b2a99ce0fee51724c13e786` |
| `web/src/lib/runtime/types.ts` | `b3b1c408570fa223f4e39108b666e10c255d38548396ec49b9410d94c975f287` |
| `web/src/app/api/runtime/execute/route.ts` | `f559332d7b16f492b0250f22885e3f2e840334c5f2804351269fbf4642498f19` |
| `web/src/lib/integrations/gmail/inboxAnalysis.ts` | `57ab82fffd8a29570d34719616149f2732d670bb2b35424ca6df85d2ac78058c` |

Frozen accepted-Gmail/read seams:

| File | SHA-256 |
|---|---|
| `web/src/lib/runtime/stateLoaders.ts` | `27ce88c8aa54c386efb612e285507dad313e4e16b1412ec90154ca46af43eab1` |
| `web/src/app/agents/[id]/operations/approvals/page.tsx` | `fec9b3c769feb98b5e7f354f241a4cf146e843464dbeb07776aa704fa3ea4311` |

Every frozen seam must remain byte-identical in Stage A. Existing route names, read requests, queue counts, status sections, controls, presentation metadata, Gmail action labels, Management behavior, and Decision Mode close/return remain unchanged.

## Exact additive database contract

The generated migration must add only these objects:

1. `public.decision_workspace_execution_runs`
   - immutable tenant, agent, actor, approval, request-event, decision-event, bundle-key, ordered-action fingerprint, optional published workflow/runtime/subject context, current aggregate status, lease token/expiry, reconciliation state, timestamps, and JSON transition history;
   - unique `(tenant_id, agent_id, request_event_id)` and unique `(tenant_id, execution_key)` constraints;
   - statuses limited to `claimed`, `executing`, `succeeded`, `failed`, `partial`, `indeterminate`, and `reverted`.
2. `public.decision_workspace_execution_actions`
   - execution-run foreign key, tenant, zero-based action index, stable action idempotency key, provider type, source ID, connection ID, agent-role ID, tool, action, capability/effect/reversibility metadata, current status, attempt count, provider receipt JSON, rollback reference, error code, reconciliation state, timestamps, and JSON transition history;
   - unique `(execution_run_id, action_index)` and unique `(tenant_id, idempotency_key)` constraints;
   - statuses limited to `claimed`, `executing`, `succeeded`, `failed`, `partial`, `indeterminate`, `skipped`, and `reverted`.
3. `public.claim_decision_workspace_execution(...) returns jsonb`
   - validates actor/profile tenant, owned agent, exact same-agent request event, exact same-agent latest approved decision, bundle fingerprint, and ordered action definitions inside one database transaction;
   - inserts the run and all action rows atomically or returns the existing identical claim;
   - a mismatched replay fails closed and concurrent callers cannot both receive invocation authority.
4. `public.record_decision_workspace_action_receipt(...) returns jsonb`
   - enforces expected-current-state transition, same tenant/run/action identity, one attempt increment, durable receipt/error/rollback/reconciliation data, and server-side timestamp/transition append.
5. `public.finalize_decision_workspace_execution(...) returns jsonb`
   - derives the run status from every ordered action row; it cannot accept a caller-supplied success claim.
6. `public.resolve_stale_decision_workspace_execution(...) returns jsonb`
   - on a later explicit request only, converts an expired `claimed`/`executing` run to `indeterminate` unless durable receipts prove a stricter terminal outcome; it never auto-retries a provider write.

All tables must enable RLS. `anon` and `authenticated` receive no direct mutation grants. RPC execution is revoked from `public`, `anon`, and `authenticated` and granted only to `service_role`. Functions use a fixed safe `search_path`, validate all identities again despite service-role use, and expose no provider secrets or raw tokens. The migration must not alter `agent_events`, integration credentials, Gmail data, artifacts, indexes unrelated to the new ledger, or publication pointers.

## Stable identity and outcome rules

- Bundle execution key: deterministic versioned digest of tenant ID, agent ID, and request-event ID. Decision-event ID is bound and validated but does not permit the same request to execute twice after a later decision.
- Action idempotency key: deterministic versioned digest of the bundle key, zero-based action index, tool, action, and canonicalized argument fingerprint.
- The stored ordered-action fingerprint must match the exact approved request. Reordering, inserting, deleting, or changing an action is a conflicting replay.
- Claim authority is consumed before the first provider call. A duplicate identical request returns the durable current run; it does not invoke the provider again.
- Lease expiry is not retry authority. Because process death cannot prove whether an external request crossed the provider boundary, a stale in-flight write becomes `indeterminate` and requires reconciliation.
- A bundle is `succeeded` only when every action is durably `succeeded`; `failed`, `partial`, or `indeterminate` must never produce `executed: true` or a successful compatibility event.
- When one action does not succeed, later unstarted actions are marked `skipped` under the current fail-fast compatibility policy. Earlier successful actions remain successful; the aggregate becomes `partial` when at least one external effect succeeded.
- Provider receipts contain only bounded operational identifiers and counts needed for audit/reconciliation. Credentials, access tokens, message bodies, customer content, and uncontrolled payload dumps are prohibited.
- Legacy successful `execution_result` events remain the downstream compatibility truth only for fully successful bundles. No failure/partial/indeterminate event may be misread by existing successful-result loaders.

## Gmail reference-adapter policy

- `archive_messages` must retain requested IDs, accepted IDs, failed IDs, requested/accepted/failed counts, and `partial_failure`; a mixed result is `partial`, never success.
- An archive retry is not implemented in Slice 4A. A later provider-reconciliation slice may retry only the unresolved IDs after provider verification and explicit policy authorization.
- `draft_email` success records the Gmail draft ID and message ID as the bounded provider receipt.
- A draft transport interruption, timeout, invalid/missing success receipt after a request may have left the process, or comparable ambiguous outcome is `indeterminate`; it must not be automatically retried because a duplicate draft could be created.
- Definitive pre-provider validation/connection failures are `failed`. The policy helper must distinguish pre-effect failure from ambiguous post-dispatch outcome.
- Gmail review/analyze operations retain their current behavior but receive bounded success/failure receipts through the same generic action lifecycle.
- The framework must not expose Gmail nouns, endpoints, labels, or retry rules to non-Gmail adapters.

## Cross-domain fixture matrix

The same generic execution model must validate at least these deterministic fixtures:

| Domain | Example bundle | Required identity/outcome proof |
|---|---|---|
| Gmail | archive messages; draft reply | source/connection retained; partial IDs preserved; ambiguous draft is not retried |
| Customer service | update case then send response | case system and messaging source receipts remain separate |
| Real estate | update lead then schedule follow-up | property/lead workflow identity retained; no provider-atomic claim |
| Investments/crypto | prepare trade then update portfolio record | irreversible/high-risk capability remains adapter-governed and receipt-backed |
| Multi-source paid media | pause campaigns across two ad networks | one local bundle claim, separate provider receipts, aggregate may be partial |
| Bookkeeping | classify transaction then attach reconciliation evidence | accounting source and evidence provenance retained |
| Tax | prepare filing action then record compliance checkpoint | compliance workflow/version and human approval remain inspectable |
| Shipping/purchasing | purchase discounted item, update spreadsheet, track shipment | purchasing, spreadsheet, and shipping roles/sources remain distinct; partial completion is honest |

Fixtures must also cover empty/invalid metadata, duplicate concurrent claims, reordered bundle mismatch, stale lease, failure before effect, success then later failure, provider partial result, ambiguous transport result, skipped remaining actions, receipt-secret rejection, and no silent cross-tenant reuse.

## Runtime load declaration

- Existing mutation family: one `POST /api/runtime/execute` per explicit operator action; unchanged.
- New HTTP routes/request families: zero.
- Polling/timers/background jobs/model calls: zero.
- Provider calls: a newly claimed Gmail draft action makes at most one draft-create request. A Gmail archive action preserves the inherited bounded batch behavior: one `batchModify` request per 100 message IDs, at most four chunks concurrently, with the existing single 401 token-refresh retry per chunk. Duplicate/replay requests that reach the durable claim perform zero provider calls.
- Ledger `attempt_count` records one route-level ordered-action attempt, not the number of bounded provider HTTP chunks inside an adapter action.
- Database work per new execution: one atomic claim RPC, one receipt-transition RPC per attempted action, and one finalization RPC. No mailbox/artifact scan is added.
- Current fail-fast bundle ordering remains; no parallel provider fanout is introduced.
- Steady-state Operations read family, cache, refresh behavior, and settled polling: unchanged.
- Build-pending continuity, Smart Sync/artifact handoff, stale artifact reclaim, publication, and Management cache: unchanged.

## Stage boundaries and authority

### Stage A — source and migration authoring

Requires exact decision: `ACCEPT PHASE 4 SLICE 4A STAGE A IMPLEMENTATION`.

Stage A may populate the generated migration and edit only the nine locked files, then run deterministic fixtures, TypeScript, exact lint, static SQL/allowlist/frozen-hash checks, existing framework/Gmail regressions, and read-only post-settle Gmail UI regression proof. It must not apply the migration, invoke any provider action, write live execution/data rows, or create a commit/push.

### Stage B — named migration application

Requires a later separate decision after Stage A verifier acceptance and exact migration review. It may apply only `20260902141603_add_decision_workspace_execution_ledger.sql` to Supabase project `cjpjekhlvzwjwtszqpmy`, then verify tables, constraints, grants, RLS, function definitions, migration history, and advisors. It does not authorize provider action or production execution.

### Stage C — bounded runtime integration proof

Requires a later separate decision after Stage B verification. Its exact fixture/agent, data writes, cleanup/recovery plan, and whether any sandbox-only execution may occur must be target-locked first. No live Gmail archive, draft, provider mutation, or customer-data action is implied.

Human acceptance, Recovery Contract, milestone backup, exact-scope commit/push, merge, and deployment remain later gates governed by the standing accepted-work policy.

## Stage A verification contract

### Static and deterministic proof

- Migration text proves only the named additive objects, tenant constraints, grants, RLS, safe search paths, and four RPCs; destructive DDL and unrelated object changes are absent.
- Pure model fixtures prove stable digests, canonical argument ordering, legal/illegal transitions, stale-to-indeterminate handling, aggregate status, bounded receipts, fail-closed unknown provider metadata, and all eight business domains.
- Concurrency fixtures prove two simultaneous identical claims produce one invocation authority; conflicting fingerprints produce no authority.
- Route static guards prove claim occurs before the first provider call and a provider call occurs only for newly granted invocation authority.
- Route fixtures inject provider outcomes and prove one receipt per attempted action, skipped trailing actions, and no successful compatibility event/`executed: true` for failed, partial, or indeterminate outcomes.
- Gmail fixtures prove accepted and failed archive IDs survive the wrapper and ambiguous draft outcomes do not retry.
- Existing Decision Workspace contract/action/read/presentation fixtures and all required Gmail review-unit/group/window/optional-evidence regressions pass.
- TypeScript, exact-file ESLint, `git diff --check`, exact nine-file implementation allowlist, and frozen accepted-Gmail hashes pass.

### Read-only runtime/UI regression proof

Use Playwright against the exact authenticated canonical Operations Approval Queue route already carried by the runtime context. Do not click approve, reject, execute, mode, Gmail destination, or any provider-action control.

Ready-state requires the canonical URL, Approval Queue heading, all four accepted status sections or explicit empty states, stable `3 / 0 / 8 / 46` counts, no loader/error/overlay, and stable request count after settle. Capture a post-settle screenshot, DOM/state, request trace, console state, and final visual inspection. The accepted Gmail page and request family must remain unchanged.

### State Transition Matrix

The verifier must report one row each for:

- concurrent identical claim;
- conflicting fingerprint replay;
- single-action success;
- first action success followed by definitive failure;
- Gmail archive partial result;
- Gmail draft ambiguous result;
- stale in-flight claim;
- multi-source paid-media partial bundle;
- shipping/purchasing three-role partial bundle;
- authenticated Gmail Approval Queue cold load and settled read-only regression.

Each row includes baseline state, action, settled state, downstream status/result, remaining blocker, whether separate, and PASS/FAIL/BLOCKED.

## Acceptance criteria

- Exactly one caller receives provider-invocation authority for an approved request under concurrent execution attempts.
- Every ordered action has one stable identity and a durable terminal or explicitly indeterminate/skipped state.
- Partial and ambiguous provider outcomes are never promoted to `executed`.
- Gmail archive retains failed message IDs and exact accepted/failed counts.
- Gmail draft ambiguity is fail-closed with no automatic retry.
- Successful historical and new `execution_result` consumers remain compatible; only a fully successful bundle emits the compatibility success event.
- Tenant, actor, agent, request, decision, workflow/runtime when available, role, source, connection, action, and receipt provenance remain inspectable.
- Multi-source/provider bundles make no false atomicity guarantee.
- No live AI label generation, provider registry, Workflow Studio, training UI, shared learning, marketplace, or multi-agent orchestration is introduced.
- Existing Gmail routes, counts, presentation, controls, read requests, caches, polling, lifecycle, and close/return behavior remain unchanged.
- Stage A performs zero live schema, provider, Gmail data, customer data, artifact, index, or publication mutation.

## Explicit exclusions

- applying the generated migration or changing live Supabase schema/data;
- automatic provider retries, retry worker, polling, scheduler, lease heartbeat, background reconciliation, or repair queue;
- provider registry or generalized provider invocation refactor;
- live Gmail draft/archive or any external provider action during proof;
- Workflow Studio, proprietary-brain UI, shared learning, marketplace, or multi-agent orchestration;
- dynamic AI copy generation at page load or execution time;
- Operations queue redesign or new partial-status UI;
- route/request/cache/polling/refresh changes;
- commit, push, PR mutation, merge, deployment, force operation, or lineage deletion.

## Rollback

Before Stage B, rollback is source-only: restore the four existing files to their baseline hashes and remove the four new source/fixture files plus the generated unapplied migration. No provider, data, or schema rollback is required because Stage A authorizes no live mutation.

Stage B must define a separately reviewed additive-schema rollback before application. Destructive down-migration execution is not implied.

## Generated target and recovery evidence

- Generated migration: `supabase/migrations/20260902141603_add_decision_workspace_execution_ledger.sql` (`created`, zero bytes at target lock, authoritative migration identity, not applied).
- Pre-target-generation recovery point: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-02/ai-agent-platform-worktree-8642 (incremental 2 September 2026 - Pre ACE-048 Phase 4 Slice 4A atomic execution ledger target generation)`.
- Backup proof: `2,466` files; linked worktree; branch `codex/ace-048-phase4-endpoint-integrity-discovery`; HEAD `b752c863c7dc4d634e6e21b061fd6f7d2a4cc1ef`; zero changed paths at capture; normal project-scoped seven-day pruning; `KEEP` preservation; standalone restore guidance.

## Decision gate

Stage A source/SQL implementation and its static, regression, and read-only UI verification are complete at verifier `ACCEPT / HIGH`. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE4A_STAGEA_REVIEW_PACKET.md`.

Status: `HUMAN ACCEPTED — 2026-09-03`

- `ACCEPT PHASE 4 SLICE 4A STAGE A` — accept the verified Stage A source/migration candidate and authorize its governed acceptance capture/preservation; Stage B migration application remains a separate explicit decision.
- `REJECT` — return the exact concern for bounded correction and re-verification.
- `RETURN_TO_PM` — revise scope or architecture before implementation.

Decision recorded: Oliver returned exact `ACCEPT PHASE 4 SLICE 4A STAGE A`. This authorizes governed acceptance capture/preservation only; Stage B migration application remains separately gated.

Human-acceptance snapshot: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-03/ai-agent-platform-worktree-8642 (incremental 3 September 2026 - ACE-048 Phase 4 Slice 4A Stage A Human acceptance)`; `2,584` files and `16` accepted changed paths at pre-publication baseline `b752c863c7dc4d634e6e21b061fd6f7d2a4cc1ef`.

Accepted-content Git identity: `a4fdbc0` on `codex/ace-048-phase4-endpoint-integrity-discovery`, pushed normally without force.

Checkpoint Status: `none` — Stage A accepted-fix truth, Recovery Contract, Human-acceptance backup, and exact-scope GitHub preservation are propagated. Stage B is not active and requires a separate PM readiness/application decision surface.
