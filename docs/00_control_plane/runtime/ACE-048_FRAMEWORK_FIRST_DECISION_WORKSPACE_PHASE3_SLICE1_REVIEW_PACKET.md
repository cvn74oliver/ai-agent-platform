# ACE-048 Framework-First Decision Workspace Phase 3 Slice 1 — Review Packet

Date: 2026-09-01
Status: `HUMAN ACCEPTED / CLOSED`
Governing event: `ACE-048`
Execution mode: `transitional_self_verification`
Problem class: `runtime data-facade boundary with a locked UI consumer`
Accepted defect surface: exact Review Groups route and accepted child transition/return

## Executive summary

### What changed

Review Groups now consumes a generic, validated decision-workspace read model. The existing Gmail runtime snapshot, cache selection, semantic grouping, draft progress, and route identities are translated by a Gmail compatibility adapter behind the shared runtime provider.

### What the operator gets

The same accepted Gmail Review Groups experience, counts, ordering, recommendation, links, provider controls, and return behavior, with a reusable read boundary that other company workflows can supply without teaching the page Gmail data structures.

### Why it matters

This is the first bounded runtime/data-facade slice. It proves the framework can carry domain-specific subjects, activities, sources, roles, metrics, provenance, freshness, quality, groups, units, and recommendations without changing provider operations or the accepted Gmail workflow.

## Verifier decision

`ACCEPT / HIGH`

- Ready-state satisfied: `YES`
- Ready-state signals used: exact canonical route and agent ID; Review Groups hero; all five group-section headings; group cards and review-unit links; no Review Groups loader; authenticated Gmail index state; provider controls visible.
- Settle strategy: heading/decisive-surface waits followed by bounded 3.5–4.5 second post-ready settle.
- Artifacts captured post-settle: `YES`
- Verification Confidence: `HIGH`
- Missing Proof Type: `none`

## Implementation scope

The locked eight-file source allowlist was preserved:

1. `web/src/lib/runtime/decisionWorkspaceReadModel.ts` — generic schema, DTOs, adapter interface, strict validation, and fail-closed finalization.
2. `web/src/components/runtime/DecisionWorkspaceReadContext.tsx` — selected-adapter context over the existing runtime provider; no fetch, polling, mutation, or model call.
3. `web/src/lib/integrations/gmail/gmailDecisionWorkspaceReadAdapter.ts` — Gmail compatibility projection over the existing runtime/cache/semantic/draft helpers.
4. `web/src/app/agents/[id]/operations/layout.tsx` — serializable `gmail` adapter identity.
5. `web/src/components/runtime/OperationsWorkspaceShell.tsx` — generic read provider mounted inside the existing runtime boundary.
6. `web/src/app/agents/[id]/operations/clusters/page.tsx` — generic Review Groups consumer with zero Gmail data/cache/semantic/draft imports.
7. `web/scripts/workspace-decision-read-model-fixtures.mjs` — eight-domain/static contract and Gmail parity fixtures.
8. `web/package.json` — targeted fixture command only.

No route, API, provider/data, database, artifact/index/publication, request, polling, cache, lifecycle, Decision Mode, Management, Workflow Studio, learning, orchestration, commit, push, or deployment change occurred.

## Validation evidence

All required checks passed:

- `npm run test:workspace-decision-contract`
- `npm run test:workspace-decision-presentation`
- `npm run test:workspace-decision-read-model`
- `npm run test:workspace-review-unit-contract`
- `npm run test:gmail-cleanup-group-assignment`
- `npm run test:review-unit-window-projection-contract`
- `npm run test:gmail-review-unit-window-projection-contract`
- `npm run test:gmail-optional-evidence-detail-contract`
- `npm run test:gmail-mailbox-index-continuity`
- TypeScript `--noEmit`
- targeted ESLint on the seven code/script allowlist files
- `git diff --check`

The new fixture validates Gmail, customer service, real estate, crypto, four-source paid media, bookkeeping, tax, and purchasing/shipping through one envelope. It preserves three purchasing/shipping roles and three sources, rejects incompatible paid-media metric aggregation, fails closed on invalid workflow/source/provenance/freshness/quality/metric/group/unit/count/child-total truth, and proves zero model calls plus zero new request definitions.

## Gmail parity

- Main groups: `7`
- Optional/reference groups: `3`
- Subjects in scope: `5,144 senders`
- Recommended group: `915 senders / 75,844 emails`
- Review-unit links: `67`
- Accepted link identity: `cluster_id=semantic.marketing_subscriptions`, `subset_source=review_unit`, `subset_value=family:offer_campaign`
- Exact accepted child route with `sender_overview_window=last_month`: settled with `Deals and special offers`, parent context, workflow-window metrics, rows, chart, and decision controls visible.
- Return: clicked `Review Groups`; canonical route restored with `7 / 3 / 5,144` unchanged.
- Provider controls: Gmail `Smart Sync`, `Continue Backfill`, and `Run full mailbox reindex` remain shell-owned and provider-specific.

## Request, console, and load proof

The final four-state browser sequence observed only existing families, all successful:

- `POST /api/agents/playground` — `1 x 200`
- `POST /api/integrations/gmail/inbox-analysis` — `2 x 200`
- `GET /api/integrations/gmail/mailbox-index` — `2 x 200`
- `GET /api/runtime/gmail-memory?...view=decision_management` — `1 x 200`

The accepted Phase 2 packet contains the same four API families with zero failures. Aggregate counts differ because that packet exercised six routes and its then-fresh browser caches, while this packet exercises the required four-state Slice 1 matrix; source inspection and fixtures prove the facade defines no request or model call. Final browser state: zero errors, zero warnings, zero `409` churn, and no overlay or duplicate-key warning.

## Human-visible artifacts

Accepted before baseline:

- `output/playwright/ace-048-phase2-presentation/after-clusters.png`
- `output/playwright/ace-048-phase2-presentation/after-verification.json`
- `output/playwright/ace-048-phase2-presentation/after-trace.zip`

Post-settle after artifacts:

- `output/playwright/ace-048-phase3-slice1-review-groups/after-cold-load.png`
- `output/playwright/ace-048-phase3-slice1-review-groups/after-focused.png`
- `output/playwright/ace-048-phase3-slice1-review-groups/after-exact-child.png`
- `output/playwright/ace-048-phase3-slice1-review-groups/after-return.png`
- `.playwright-cli/traces/trace-1788218638128.trace`
- `.playwright-cli/traces/trace-1788218638128.network`

Cold-load and return screenshots are byte-identical (`98c8d0a5b3b781ac5f62377217d4f0fa69c937338ddd6cbd650ef73b0357da27`). Final visual inspection found no clipping, overlay, broken grouping, missing cards, contradictory counts, or changed Gmail vocabulary on the accepted surface.

## State Transition Matrix

| Mode / Path | Baseline visible state before action | Operator action performed | Settled visible state after action | Downstream gate/status/result | Remaining blocker | Separate blocker? | Verdict |
|---|---|---|---|---|---|---|---|
| Review Groups cold load | Accepted Phase 2 Review Groups baseline | Open exact canonical Review Groups route | Six accepted headings, `7` main, `3` optional/reference, `5,144` senders, `915 / 75,844` recommendation, `67` unit links | Ready; Gmail controls and accepted group truth visible | None | NA | PASS |
| Focused Review Groups | Cold-load route settled | Open `focus_cluster=semantic.marketing_subscriptions#cleanup-group-cards` | Promotions and subscriptions card focused and still recommended; `7 / 5,144` unchanged | Focus identity retained; no loader | None | NA | PASS |
| Recommended smaller-group link | Focused card settled | Click `Deals and special offers` | Sender Overview opens with exact parent/unit identity; exact `last_month` compatibility route also settles with workflow-window truth | Accepted child universe, chart, rows, and controls visible | None | NA | PASS |
| Return to Review Groups | Exact child route settled | Click `Review Groups` | Canonical Review Groups route returns with `7 / 3 / 5,144` unchanged | Return screenshot byte-identical to cold load | None | NA | PASS |

## Exploratory discovery

Question: `What else breaks under realistic Review Groups navigation?`

Bounded probes covered hash/focus navigation, actual smaller-group click, exact explicit-window child loading, and shell-based return. No stale focus, missing unit, route/query drift, count contradiction, console error, guard churn, or return-state regression was found. Discovery stopped after the bounded accepted surface produced no new finding.

## Dirty-state and rollback accounting

- Pre-existing diff status: `present`.
- Were existing diffs part of a previously failed attempt?: `no`; the four modified target files carried accepted Phase 2 work, while unrelated dirty state was inherited and preserved.
- New edits in this pass: exactly the eight locked source files above.
- Rollback: restore the four modified files and remove the four new files using the pre-implementation snapshot; no provider/data rollback is needed.
- Pre-implementation backup: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - Pre ACE-048 Phase 3 Slice 1 Review Groups read facade implementation)`; `968` files, project-scoped seven-day pruning confirmed, `KEEP` preservation retained.

## Human Review gate

Decision: `ACCEPT` — Oliver inspected the accepted screenshot on 2026-09-01, reported no visible issue, and accepted the completed Slice 1 work.

- Recovery Contract: `ai-agent-platform-docs/06_system_state/CHANGELOG.md` -> `September 1, 2026 — ACE-048 Framework-First Decision Workspace Phase 3 Slice 1 Accepted`.
- Human-acceptance backup: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - ACE-048 framework-first Decision Workspace Phase 3 Slice 1 Human acceptance)`.
- Backup verification: `1,114` files; source is the exact linked worktree at detached HEAD `8f8e4d670cabdd21459c0b4b8e502d16e272afc0`; normal seven-day project-scoped pruning completed; `KEEP` preservation remained in force.
- Phase 3 Slice 1 is closed. No later Phase 3 discovery or implementation authority is inferred from this acceptance.

Checkpoint Status: `none` — implementation, verifier acceptance, Human acceptance, Recovery Contract, and milestone backup are propagated; no material unpropagated state or deferred execution remains.
