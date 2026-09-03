# ACE-048 Framework-First Decision Workspace Phase 4 Slice 3 — Review Packet

Date: 2026-09-02
Status: `VERIFIER ACCEPT / HUMAN REVIEW ACCEPTED / RECOVERY BACKED / GITHUB PRESERVED / CLOSED`
Execution mode: `transitional_self_verification`
Problem class: `runtime behavior — authenticated endpoint access and request/decision binding`
Verification Confidence: `HIGH`

## Executive summary

### What changed

The approval-family runtime now proves the signed-in user, same-origin mutation request, owned agent, and tenant before privileged work. Approval and execution history is bound to the same agent and exact request, the latest decision controls executability, repeat decisions are idempotent or fail closed, and actor/tenant/request provenance is retained.

### What Oliver gets

The accepted Gmail Approval Queue looks and behaves the same for its owner, while anonymous and cross-account callers can no longer use a supplied agent ID to read or change another agent's runtime state. The legacy queue is owner-scoped instead of global.

### Why it matters

This closes the minimum authorization and decision-integrity gap needed before additional providers or company workflows can safely reuse the framework. It does not claim atomic provider execution or add a receipt ledger.

## Exact source packet

The source diff equals the locked 13-file allowlist:

1. `web/src/lib/runtime/runtimeRequestAccess.ts`
2. `web/src/lib/runtime/runtimeApprovalIntegrity.ts`
3. `web/src/lib/runtime/types.ts`
4. `web/src/app/api/agents/playground/route.ts`
5. `web/src/app/api/runtime/plan/route.ts`
6. `web/src/app/api/runtime/mode/route.ts`
7. `web/src/app/api/runtime/approve/route.ts`
8. `web/src/app/api/runtime/auto-approve/route.ts`
9. `web/src/app/api/runtime/execute/route.ts`
10. `web/src/app/api/runtime/confidence/route.ts`
11. `web/src/app/api/runtime/eligibility/route.ts`
12. `web/src/app/approvals/page.tsx`
13. `web/scripts/runtime-endpoint-integrity-fixtures.mjs`

No route, provider helper, action adapter/model, Operations page, package manifest, schema, migration, data, artifact, index, publication, polling, cache, or lifecycle file changed.

## Implementation and correction loop

- Implementation introduced the shared request-principal/owned-agent access seam and pure approval-integrity helpers, then applied them to the exact endpoint/page allowlist.
- Targeted verification first exposed a fixture-loader dependency on `next/server`; root-cause translation removed that unnecessary dependency from the pure access helper without changing route behavior.
- Final audit then found POST body parsing preceded the explicit authentication/same-origin gate. Root-cause translation split principal resolution from owned-agent resolution so authentication and origin checks now occur before body parsing, while the admin client remains unavailable until owned-agent and tenant proof succeeds.
- Re-verification passed after both bounded corrections. No other source files were required.

## Verification results

- New endpoint-integrity fixtures: `PASS`.
- TypeScript `tsc --noEmit`: `PASS`.
- Exact-file ESLint: `PASS`, zero findings.
- Existing Decision Workspace contract, presentation, read-model, and action-model fixtures: `PASS`.
- Existing Gmail review-unit, cleanup-group, window-projection, and optional-evidence fixtures: `PASS`.
- `git diff --check`: `PASS`.
- `web/package.json`: byte-identical to `HEAD`.
- Locked source allowlist: exactly `13 / 13`; no fourteenth source file.
- Seven frozen Gmail/presentation/runtime hashes: byte-identical.
- Static generated-chrome fixtures: Gmail, customer service, real estate, crypto, four-source paid media, bookkeeping, tax, and multi-role purchasing/shipping all pass; safe fallback remains `Decision health`; page-load model calls and added request families remain zero.

## Runtime/UI proof

Canonical owner route: `http://127.0.0.1:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/approvals`
Owner-scoped legacy route: `http://127.0.0.1:3000/approvals`

Ready-state satisfied: `YES`
Ready-state signals used: canonical URL; Approval Queue heading; Pending, Approved, Executed, and Rejected sections; explicit empty state where applicable; no loader, error, or overlay; stable counts after settle.
Settle strategy: authenticated saved Playwright state, exact-route reload, bounded wait, post-settle DOM snapshot, then screenshot/request/console capture.
Artifacts captured post-settle: `YES`

Post-settle artifacts:

- Operations DOM/state: `web/.playwright-cli/page-2026-09-02T13-14-47-656Z.yml`
- Operations visible count/header proof: `web/.playwright-cli/element-2026-09-02T13-15-27-496Z.png`
- Legacy DOM/state: `web/.playwright-cli/page-2026-09-02T13-16-00-511Z.yml`
- Legacy visible owner-scope/count proof: `web/.playwright-cli/page-2026-09-02T13-16-13-892Z.png`

Observed owner Operations counts remained Pending `3`, Approved `0`, Executed `8`, Rejected `46`. The full approval bundle and provider-specific Gmail controls remained present. The settled request trace contained the existing `POST /api/agents/playground`, Supabase user read, and Gmail mailbox-index reads only; every accepted-page request was `200`, action POSTs were zero, and `409` churn was zero. The accepted-page console contained zero errors and zero warnings.

The owner-scoped legacy queue rendered Total `73`, Pending `3`, Approved `14`, Executed `10`, Rejected `46`, and visibly said `Scope: approvals for your agents`. It used server-rendered owner-scoped reads, issued no browser request family, and had zero console errors/warnings after settle.

Plain unauthenticated confidence and eligibility GETs returned `401` with `Authentication required.` An unauthenticated invalid approval POST also returned `401` before body validation. Authenticated owner confidence returned `200`; foreign agent `0dd0513a-5671-4602-b309-692acc43db96` and nonexistent agent `11111111-1111-4111-8111-111111111111` both returned the same `404` body: `Agent not found or access denied.` The aggregate `agent_events` count remained `910` before and after all negative probes. Expected browser console reports from direct `404` fetch probes are diagnostic only and are not present in the accepted-page console capture.

## State Transition Matrix

| Mode / Path | Baseline visible state before action | Operator action performed | Settled visible state after action | Downstream gate/status/result after action | Remaining blocker | Separate? | Verdict |
|---|---|---|---|---|---|---|---|
| Unauthenticated confidence + eligibility GET | No authenticated session | Read-only GET on each exact endpoint | JSON denial; no sensitive payload | Both `401`; no privileged state returned | None | NA | PASS |
| Authenticated owner Operations Approval Queue | Valid saved owner session | Reload exact canonical route; no action control clicked | Full Gmail queue; `3 / 0 / 8 / 46`; no loader/error/overlay | Existing read families `200`; zero action POST; zero `409`; clean console | None | NA | PASS |
| Authenticated foreign/nonexistent agent | Valid owner session | Read-only confidence fetch with foreign and missing UUIDs | Identical non-enumerating JSON denial | Both `404`; event count `910 → 910` | None | NA | PASS |
| Owner-scoped legacy `/approvals` | Valid owner session | Reload legacy route; no action control clicked | Scope says `approvals for your agents`; `73 / 3 / 14 / 10 / 46` | Owner-scoped server render; no global service-role queue | None | NA | PASS |
| Missing request decision fixture | No matching approval-request row | Validate a decision target with a missing row | Binding resolves to `null` | Decision/confidence write path remains unavailable | None | NA | PASS |
| Latest rejected decision fixture | Same-agent historical decisions with latest rejected | Resolve the latest bound decision | Latest state remains `rejected` | Execute gate rejects non-approved latest state | None | NA | PASS |
| Cross-agent historical decision fixture | Approval-shaped event belongs to another agent | Validate against the owned agent identity | Binding resolves to `null` | Foreign history cannot authorize owner execution | None | NA | PASS |

## Load and safety report

- Request families: unchanged.
- Polling/cadence: unchanged; no new timer or poller.
- Expected steady-state accepted route load: unchanged current rehydrate/mailbox-index family.
- Build-pending continuity, build completion, Smart Sync handoff, and stale-build reclaim: unchanged.
- Provider/data/database/artifact/index/publication mutations during proof: `0`.
- Approval/reject/auto-approve/mode/execute/provider controls invoked during proof: `0`.
- Guard churn: none.
- Atomic/exactly-once execution claim: deliberately not made.

## Verifier decision

`ACCEPT` — implementation matches the target lock and the accepted Gmail surface remains intact. Human Review is still required before Recovery Contract capture, Human-acceptance backup, exact-scope commit, or normal push.

## Human Review decision

Oliver returned explicit `ACCEPT` on 2026-09-02 after being told that no additional hands-on testing was required and that the verifier had completed the browser, security, regression, and visual proof. This authorizes the Recovery Contract, Human-acceptance backup, exact accepted-packet commit, and normal GitHub push under the standing policy. It does not authorize merge or deployment.

The verified Human-acceptance snapshot contains `2,466` files at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-02/ai-agent-platform-worktree-8642 (incremental 2 September 2026 - ACE-048 Phase 4 Slice 3 Human acceptance)`. It records exact source/branch/HEAD identity, `21` changed paths, normal seven-day project-scoped pruning, `KEEP` preservation, and standalone restore guidance.

Accepted-content commit `22243c25bdd16098c2bd5eb97719f0a0ac95874e` was pushed normally without force to `codex/ace-048-phase4-endpoint-integrity-discovery`. Merge and deployment were not performed.

Checkpoint Status: `none`. Human acceptance, Recovery Contract, backup, exact-scope GitHub preservation, and control-plane closeout are recorded; no material unpropagated state remains.
