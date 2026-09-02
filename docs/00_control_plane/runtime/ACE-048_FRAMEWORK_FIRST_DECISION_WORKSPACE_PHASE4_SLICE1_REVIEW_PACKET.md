# ACE-048 Framework-First Decision Workspace Phase 4 Slice 1 — Verifier Review Packet

Date: 2026-09-02
Status: `HUMAN-ACCEPTED / CLOSEOUT PUBLICATION IN PROGRESS`
Verifier verdict: `ACCEPT`
Verification Confidence: `HIGH`
Execution mode: `transitional_self_verification`
Problem class: `UI grammar / rendering with read-only capability availability`

## Executive summary

### What changed

Decision Mode and Decision Management now receive their visible actions and eligibility from the selected workflow/provider adapter instead of defining Gmail action choices inside the shared pages.

### What the operator gets

Gmail looks and behaves the same, while the shared framework can safely present different approved actions for support, real estate, investments, paid media, bookkeeping, tax, and multi-role purchasing/shipping workflows.

### Why it matters

The framework can now describe what a human may choose without confusing that presentation with provider execution. Unsupported, unsafe, or unbound action metadata fails closed.

## Exact implementation

Source changes are limited to the locked eight-file allowlist:

1. `web/src/lib/runtime/decisionWorkspaceActionModel.ts`
2. `web/src/lib/integrations/gmail/gmailDecisionWorkspaceActionAdapter.ts`
3. `web/src/components/runtime/DecisionWorkspaceActionContext.tsx`
4. `web/src/app/agents/[id]/operations/layout.tsx`
5. `web/src/app/agents/[id]/operations/review/page.tsx`
6. `web/src/app/agents/[id]/operations/management/page.tsx`
7. `web/scripts/workspace-decision-action-model-fixtures.mjs`
8. `web/package.json`

The existing `commitDecision`, `pushArchive`, `restoreArchive`, and `reopenSender` bodies are byte-identical to the published baseline. No API route, provider helper, data/schema file, cache, poller, lifecycle owner, or route identity changed.

## Verification result

- New eight-domain action-model fixtures: PASS, including four-source paid media and three-role purchasing/records/shipping.
- Existing framework, presentation, read-model, review-unit, window-projection, Gmail assignment/trend/index/optional-evidence fixtures: PASS.
- TypeScript: PASS.
- Targeted lint: `0` errors; `14` inherited Review-page warnings only.
- `git diff --check`: PASS.
- Exact source allowlist: PASS; no ninth source file.
- Static new-request/timer/model/provider guard: PASS.
- Final clean authenticated Playwright: PASS on exact simple Review, composite Review, and Management paths.
- Final request/console truth: zero action POSTs, zero failed requests, zero `409` churn, zero settled polling, zero console/page errors, no runtime overlay.
- Direct final rendered UI inspection: PASS / HIGH.

## Preserved Gmail truth

| Surface | Settled truth |
|---|---|
| Simple Review | `108` senders, `1` managed, `107` remaining, `1,030` messages |
| Composite Review | `43` senders, `0` managed, `43` remaining, `132` messages |
| Decision Mode | `Keep All`, `Keep Some`, `Archive All`, `Not Sure` in accepted order |
| Management | `17` managed, `3` archive ready, `2` Custom Rules, `10` quarantined, `0` applied, `2` Keep |
| Management controls in ALL | `3` Push, `0` Restore, `15` Reopen |

Both Decision Mode Close paths restored their exact canonical Review identity. The `ALL -> ARCHIVE -> CUSTOM_RULE -> QUARANTINE -> KEEP -> ALL` Management loop preserved route and action eligibility. A 16-second idle hold added no Management GET and invoked no action.

## Proof artifacts

- Verification summary: `output/playwright/ace-048-phase4-slice1/verification-summary.json`
- State Transition Matrix: `output/playwright/ace-048-phase4-slice1/state-transition-matrix.json`
- Sanitized request trace: `output/playwright/ace-048-phase4-slice1/sanitized-request-trace.json`
- Readable Decision Mode action proof: `output/playwright/ace-048-phase4-slice1/15-decision-mode-actions-detail.png`
- Readable Management action proof: `output/playwright/ace-048-phase4-slice1/14-management-provider-controls-detail.png`
- Full post-settle screenshots: `output/playwright/ace-048-phase4-slice1/01-...png` through `13-...png`

The first diagnostic browser state exposed the server/client function-serialization boundary. Root-cause translation moved adapter resolution into the client provider behind a serializable adapter ID; targeted re-verification and the full final loop then passed. An expired saved authentication state was separately refreshed through the documented env-backed Playwright bootstrap before final evidence capture.

The optional webpack fallback remains blocked by the repository's pre-existing `node:crypto` client-import incompatibility, and the first Turbopack production-build attempt stalled without a compiler error. This slice passed TypeScript and the supported Turbopack dev-route compilation on every accepted route; the build-tool conditions were not introduced by these changes.

## Human Review decision

Recorded decision: `ACCEPT` — Oliver accepted the recommended verifier-backed result on 2026-09-02. Recovery Contract capture and the verified `2,409`-file Human-acceptance snapshot are complete; exact-scope normal non-force GitHub publication is the remaining closeout step.

- `ACCEPT` — record Human acceptance, create the Recovery Contract and milestone backup, propagate closeout, then exact-scope commit and normal non-force GitHub push under the standing policy.
- `REJECT` — return to bounded correction with the exact visible or behavioral finding.
- `BLOCKED` — request a specific additional proof or operator-assisted check.
- `RETURN_TO_PM` — rescope if the desired behavior exceeds this deterministic presentation/availability slice.

No acceptance is inferred from prior implementation authorization.

Checkpoint Status: propagation required before closeout. Human acceptance, the Recovery Contract, and the verified Human-acceptance backup are captured; exact-scope publication, live remote/PR parity proof, and final closed-state propagation remain pending. Merge, deployment, provider/data mutation, later Phase 4 work, force operations, and lineage deletion remain unauthorized.
