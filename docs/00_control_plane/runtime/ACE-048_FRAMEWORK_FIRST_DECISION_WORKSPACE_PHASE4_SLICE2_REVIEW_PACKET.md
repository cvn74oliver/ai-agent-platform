# ACE-048 Phase 4 Slice 2 — Approval Queue Truth Review Packet

Date: 2026-09-02
Status: `HUMAN ACCEPTED / RECOVERY-BACKED / GIT PUBLICATION PENDING`
Verifier verdict: `ACCEPT`
Verification confidence: `HIGH`
Execution mode: `transitional_self_verification`

## Executive summary

### What changed

The Approval Queue now shows the complete ordered action bundle that one approval can authorize. Each action carries its source, responsible role, workflow stage, effect/risk, scope, evidence, safety, capability, and reversibility instead of reducing a request to its first action.

### What Oliver gets

Gmail keeps the same route, counts, status sections, controls, and execution behavior, but the decision card is more truthful. The same framework contract also supports support, real estate, crypto, paid media, bookkeeping, tax, and multi-role purchasing/records/shipping approvals without leaking Gmail language.

### Why it matters

An operator can see the full consequence of an approval before acting. Ambiguous, unsupported, or unsafe bundles fail closed with no approval or execution control, while current valid Gmail requests retain their existing controls.

## Exact implementation scope

Only the four authorized source files changed:

1. `web/src/lib/runtime/decisionWorkspaceActionModel.ts`
2. `web/src/lib/integrations/gmail/gmailDecisionWorkspaceActionAdapter.ts`
3. `web/src/app/agents/[id]/operations/approvals/page.tsx`
4. `web/scripts/workspace-decision-action-model-fixtures.mjs`

The framework now owns stable approval/request/bundle/action/control slots and validation. The Gmail adapter owns deterministic Gmail action language and source/capability mapping. The page renders only the selected adapter's validated projection. The fixture family proves eight domains, full ordered bundles, explicit atomicity, source/role preservation, and fail-closed behavior.

No API route, provider helper, runtime service, cache, lifecycle owner, schema, database, artifact, index, publication, or route identity changed. No provider/data mutation occurred.

## Direct verification

- `npm run test:workspace-decision-action-model` — PASS; 8 domains; complete bundle behavior; multi-source/role identity; unsafe bundles fail closed; zero new requests or timers.
- `npm run test:workspace-decision-contract` — PASS.
- `npm run test:workspace-decision-presentation` — PASS.
- `npm run test:workspace-decision-read-model` — PASS.
- `npm run test:gmail-review-unit-contract` — PASS.
- `npm run test:gmail-cleanup-group-assignment` — PASS.
- `npm run test:gmail-optional-evidence-detail-contract` — PASS.
- `./node_modules/.bin/tsc --noEmit` — PASS.
- Targeted ESLint on the exact four source files — PASS with zero output.
- `git diff --check` — PASS.
- Exact source allowlist — PASS; four authorized web source files and no fifth source file.
- `submitDecision` plus `executeApproved` byte comparison — PASS; current and pre-implementation extraction both hash to `d72dc9efefe15607ade209d1f9cf09765c392d35b063cb6f80d3c5e99780b42c`.
- Frozen approve route, execute route, runtime service, runtime contexts, and operations layout hashes — unchanged.

One optimized `next build` attempt was terminated after more than three minutes with the process asleep at unchanged CPU time and no additional output. This is `Missing Proof Type: Blocked` by the established local Turbopack build-stall behavior. No retry was made without a new hypothesis. TypeScript, exact-file lint, fixtures, regressions, and live runtime proof supply the accepted slice evidence under `transitional_self_verification`.

## Authenticated post-settle Playwright proof

Skill used: `/Users/olivercarlin/.codex/skills/playwright/SKILL.md`.

Canonical paths:

- Before: `http://localhost:3001/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/approvals`
- After: `http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/approvals`

The before server used the verified pre-implementation recovery snapshot. The after server used the exact active worktree. Stable test credentials established one saved localhost authentication state, which was reused for both sessions and removed after proof.

Ready-state satisfied: `YES`
Ready-state signals used: canonical URL; Approval Queue heading; Pending/Approved/Executed/Rejected sections; pending cards and controls; no page loader, error, or overlay; stable `3 / 0 / 8 / 46` counts; mailbox index ready.
Settle strategy: cold navigation, authentication bootstrap, clean console/network buffers, canonical reload, ten-second post-load settle, DOM/screenshot/request capture.
Artifacts captured post-settle: `YES`

Artifacts:

- `output/playwright/ace048-phase4-slice2/before-approval-queue-dom.md`
- `output/playwright/ace048-phase4-slice2/after-approval-queue-dom.md`
- `output/playwright/ace048-phase4-slice2/before-approval-summary.png`
- `output/playwright/ace048-phase4-slice2/after-approval-summary.png`
- `output/playwright/ace048-phase4-slice2/before-first-request.png`
- `output/playwright/ace048-phase4-slice2/after-first-request.png`

Observed final truth:

- Before and after counts are identical: Pending `3`, Approved `0`, Executed `8`, Rejected `46`.
- Before, the first request was flattened into one `Request:` row and contained duplicated `If approved: If approved:` copy.
- After, the same request renders `1 proposed action` plus explicit source, role, stage, effect/risk, scope, evidence, safety, capability, and reversibility. The duplicate label is gone.
- Current valid pending Gmail cards retain the same Approve and Reject controls.
- The authenticated final runs had zero console errors, zero failed requests, and zero `409` churn. `mailbox-index` and Supabase auth were both `200`.
- No `/api/runtime/approve` or `/api/runtime/execute` request occurred. No action control was clicked.
- Server trace confirmed the existing `POST /api/agents/playground` rehydrate family returned `200` with `57` queue items and `3` pending; no new request family exists.
- The optional session-scoped route was not exercised because no canonical existing session identity was available; none was guessed or created.

Guard-churn classification: no guard churn observed. Existing read/auth requests were required and successful; no unexpected or interfering family remained after authentication.

## State Transition Matrix

| Mode / Path | Baseline visible state before action | Operator action performed | Settled visible state after action | Downstream gate/status/result after action | Remaining blocker | Separate from tested control? | Verdict |
|---|---|---|---|---|---|---|---|
| Canonical agent Approval Queue | Gmail queue, `3 / 0 / 8 / 46`, first-action-only card | No runtime action; compare pre-slice snapshot with implemented render | Same Gmail queue/counts/controls; complete structured action truth | Human decision controls remain available for valid pending requests | None | NA | PASS |
| Pending request | Valid Gmail archive card with Approve/Reject | Read-only render | Same controls; full source/role/risk/scope/safety truth | Approval remains a separate Human action | None | NA | PASS |
| Approved state | Deterministic fixture state | Read-only generated-chrome fixture | Execute control only when the complete bundle is valid | Existing execute handler identity preserved | No live approved item existed | YES | PASS |
| Executed state | 8 live executed requests plus fixture state | Read-only render | Executed cards show complete action truth and no invocation control | Historical status preserved | None | NA | PASS |
| Rejected state | 46 live rejected requests plus fixture state | Read-only render | Rejected cards show complete action truth and no invocation control | Historical status preserved | None | NA | PASS |
| Invalid/unsupported bundle | Unsafe and unsupported fixtures | Read-only finalization | Visible validation reason; no compatibility value or action control | Fails closed | No live invalid item existed | YES | PASS |
| Explicit multi-action bundle | Gmail and cross-domain ordered-bundle fixtures | Read-only generated-chrome fixture | Every action renders in order with source/workflow/role identity | One approval allowed only for declared atomic bundle | No live multi-action item existed | YES | PASS |
| Ambiguous multi-source bundle | Ambiguous atomicity fixture | Read-only finalization | Bundle remains visible for diagnosis with no controls | Requires separately valid declared approval relationship | None | NA | PASS |

## Exploratory discovery

Bounded probes asked, “What else breaks under realistic user behavior?” They covered duplicate IDs, empty bundles, unknown Gmail tools, partially invalid bundles, unsafe text, missing metadata, undeclared multi-source atomicity, multi-role purchasing/records/shipping, and multi-source paid media. All unsafe or ambiguous cases fail closed; valid domain fixtures retain their own vocabulary and source/role identity. No adjacent runtime or provider work was performed.

## Verifier decision and next authority boundary

Verifier decision: `ACCEPT`
Verification Confidence: `HIGH`
Directly verified: exact source scope, contracts, regressions, handlers, frozen seams, canonical authenticated UI, final visual truth, counts/status parity, controls, request/console state, and fail-closed fixtures.
Operator assist: none for product verification.
Human Review: `ACCEPT` recorded from Oliver on 2026-09-02.

Oliver returned `accept`, authorizing the accepted-fix Recovery Contract, Human-acceptance backup, exact-scope commit, and normal non-force GitHub push under the standing publication policy. No merge or deployment is authorized.

Checkpoint Status: `propagation required before closeout`; Human acceptance, the Recovery Contract, and the verified `2,434`-file acceptance snapshot are propagated, but exact-scope Git publication remains pending.
