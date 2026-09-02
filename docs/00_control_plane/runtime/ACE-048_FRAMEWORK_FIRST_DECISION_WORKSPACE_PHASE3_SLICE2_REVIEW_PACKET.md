# ACE-048 Framework-First Decision Workspace Phase 3 Slice 2 — Verifier Review Packet

Date: 2026-09-01
Status: `HUMAN-ACCEPTED / CLOSED`
Governing event: `ACE-048`
Execution mode: `transitional_self_verification`
Problem class: `runtime data-facade boundary with read lifecycle preservation`
Verification confidence: `HIGH`
Result classification: `Accepted Fix Proven`

## Executive summary

### What changed

Decision Intelligence now reads through the shared Decision Workspace contract and the selected Gmail adapter instead of importing Gmail cache, request, draft, and recommendation helpers directly in the page.

### What the operator gets

The accepted Gmail experience remains visibly the same: the same Inbox health title, counts, health score, recommendation, Pressure Trend windows, Review Groups handoff, return behavior, and Gmail-specific operational controls. Behind that stable screen, another approved workflow can provide its own deterministic health model, metric meanings, activity series, recommendation, lifecycle signals, and presentation vocabulary through the same framework boundary.

### Why it matters

The system can reuse the top-level decision briefing for support, investments, paid media, bookkeeping, tax, purchasing/shipping, and future workflows without turning Gmail language or Gmail request mechanics into framework truth. Missing or invalid domain metadata fails closed or falls back safely; no model call occurs during rendering.

## Authorized scope and outcome

The implementation stayed within the exact six-file source allowlist:

1. `web/src/lib/runtime/decisionWorkspaceReadModel.ts`
2. `web/src/components/runtime/DecisionWorkspaceReadContext.tsx`
3. `web/src/lib/integrations/gmail/gmailDecisionWorkspaceReadAdapter.ts`
4. `web/src/app/agents/[id]/operations/intelligence/page.tsx`
5. `web/src/components/runtime/GmailCleanupComponents.tsx`
6. `web/scripts/workspace-decision-read-model-fixtures.mjs`

No route, provider operation, provider data, database, artifact, index, publication, request family, polling behavior, commit, push, or deployment was changed.

The framework now owns validated semantic slots for:

- decision-health metrics and explicit definitions;
- score ranges and directionality;
- lifecycle/freshness/provenance signals;
- activity-series buckets, including explicit zero buckets;
- recommendations and workflow progress;
- deterministic presentation fallbacks and fail-closed validation.

The Gmail adapter retains ownership of Gmail projection, existing cache selection, request wrappers, pressure-window translation, management-summary behavior, draft progress, provider controls, and Gmail route/query compatibility. Transitional Gmail-shaped DTOs remain isolated and identified as provider-projected compatibility, not framework semantics.

## Preservation and rollback evidence

Pre-implementation backup: `VERIFIED`

`/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - Pre ACE-048 framework-first Decision Workspace Phase 3 Slice 2 Decision Intellig)`

- Source: `/Users/olivercarlin/.codex/worktrees/8642/ai-agent-platform`
- Files: `1,116`
- Git identity: detached `8f8e4d670cabdd21459c0b4b8e502d16e272afc0`
- Retention: normal project-scoped seven-day pruning
- `KEEP` preservation: `23` discovered archives preserved
- Backup-to-current comparison: exactly the six allowlisted source files differ
- Inherited dirty state: preserved; no whole-file Git restore or destructive cleanup used

Current source hashes:

| File | SHA-256 |
|---|---|
| `decisionWorkspaceReadModel.ts` | `3a65648cd8fae3cc58477fedcc57f07774a64fe3ab92493786beb7b618a8b09e` |
| `DecisionWorkspaceReadContext.tsx` | `4652253a0f45fbd8ef1d1451b57045fc512dfd60cdd8d7aeb841776d15c35095` |
| `gmailDecisionWorkspaceReadAdapter.ts` | `98b3dcd1a4925106ca825a19a992527d70116e286027b3c8f016989cc6d1555c` |
| `operations/intelligence/page.tsx` | `eaa07de637e54bd4bf35d108361419dfd630b67e43448c16d2e0fc5c0ad2151b` |
| `GmailCleanupComponents.tsx` | `dc47a8aa6283b38ddcec63394c5bdc917b7f4b34146eb0f7204b01c09c5b46a0` |
| `workspace-decision-read-model-fixtures.mjs` | `ee060d7feb4e7168c585894e7a0dea2e8803fd29ff58595fa4d5072613315cfa` |

## Targeted verification and correction loop

One initial TypeScript run found three bounded contract-integration defects: a management presentation type required a Gmail-only count, immutable activity data conflicted with mutable compatibility types, and one helper became unused after workflow progress moved behind the adapter. Root-cause translation: provider-projected compatibility fields must remain optional at the generic boundary, generic series must preserve immutability end to end, and page-local progress assembly must be removed when adapter-owned. Those exact seams were corrected and re-verified.

Final static verification:

- TypeScript `--noEmit`: `PASS`
- Targeted ESLint on all six source files: `PASS`, zero warnings
- `git diff --check`: `PASS`
- Intelligence page direct Gmail data/cache/request/draft imports: `0`
- New page-local `fetch`, interval, or poll definitions: `0`
- Allowlist-only backup diff: `PASS`

Regression fixtures all passed:

- generic Decision Workspace contract
- presentation metadata and safe fallback
- Decision Workspace read model
- generic and Gmail review-unit contracts
- generic and Gmail window-projection contracts
- Gmail cleanup assignment
- Gmail Pressure Trend
- Gmail optional-evidence detail
- Gmail mailbox-index continuity

The expanded generated-chrome fixture passed eight domains: Gmail, customer service, real estate, crypto/investments, multi-source paid media, bookkeeping, tax, and multi-role purchasing/shipping. It proved distinct approved domain titles and semantic definitions, multi-source and multi-role provenance, explicit zero-bucket retention, fail-closed invalid metadata/aggregation, zero render-time model calls, and zero new request definitions.

## Full post-settle browser proof

Canonical route:

`http://127.0.0.1:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/intelligence`

Authentication: established with the existing local test credential flow and saved Playwright state; secret values were not printed or copied.

Ready-state satisfied: `YES`

Ready-state signals used:

- exact canonical route and agent identity;
- `Inbox health` and `AI-guided next move` visible;
- chart bars visible;
- no loader;
- no Pressure Trend error;
- no runtime overlay.

Settle strategy: wait for the exact route, decisive headings, stable chart bars, and absence of loaders/errors before each capture; final return was held for six additional seconds to detect late polling or drift.

Artifacts captured post-settle: `YES`

Primary evidence:

- `output/playwright/ace-048-phase3-slice2/after-verification.json`
- `output/playwright/ace-048-phase3-slice2/after-handoff-return-trace.zip`
- `output/playwright/ace-048-phase3-slice2/after-01-cold.png`
- `output/playwright/ace-048-phase3-slice2/after-02-1y.png`
- `output/playwright/ace-048-phase3-slice2/after-03-1m.png`
- `output/playwright/ace-048-phase3-slice2/after-04-all-restored.png`
- `output/playwright/ace-048-phase3-slice2/after-05-custom.png`
- `output/playwright/ace-048-phase3-slice2/after-06-focus-return.png`
- `output/playwright/ace-048-phase3-slice2/after-07-group-handoff.png`
- `output/playwright/ace-048-phase3-slice2/after-08-final-return.png`
- `output/playwright/ace-048-phase3-slice2/after-09-final-hold.png`

The direct visual inspection of cold, Custom, focused Review Groups, and final return/hold screenshots found no loading shell, overlay, broken chart, clipped decision surface, stale mismatch, or visible contradiction.

### State Transition Matrix

| Mode / Path | Baseline visible state before action | Operator action performed | Settled visible state after action | Downstream gate/status/result after action | Remaining blocker | Separate from tested control? | Verdict |
|---|---|---|---|---|---|---|---|
| Intelligence cold load / All indexed | Authenticated exact route opened | Load canonical URL | `5,144` senders, `~259,422` messages, `1,999` candidates, `17` decisions, health `5/100`, `16` chart buckets, recommendation and four Gmail controls visible | Ready; four expected initial request-family calls returned `200` | None | NA | PASS |
| Pressure Trend / `1Y` | All indexed ready | Select `1Y` | Same decision totals and guidance; URL `pressure_window=last_year`; `13` monthly buckets | One pressure-trend request, `200`; no loader/error | None | NA | PASS |
| Pressure Trend / `1M` | `1Y` ready | Select `1M` | Same decision totals and guidance; URL `pressure_window=last_month`; `30` daily buckets | One pressure-trend request, `200`; no loader/error | None | NA | PASS |
| Pressure Trend / restore All indexed | `1M` ready | Select `All indexed` | Same totals; URL `pressure_window=all_indexed`; `16` quarterly buckets | Cache reuse; zero requests | None | NA | PASS |
| Pressure Trend / Custom | All indexed ready | Enter `2026-05-01` through `2026-06-30` and apply | Same totals; Custom selected; `5` weekly buckets and adjusted indexed-history explanation visible | One pressure-trend request, `200`; no loader/error | None | NA | PASS |
| Focus refresh / Intelligence | Custom ready | Return to All indexed and trigger focus refresh | Same totals, health, recommendation, controls, and `16` buckets | One expected management-summary `GET 200`; no pressure fanout | None | NA | PASS |
| Recommendation handoff / Review Groups | Intelligence ready with recommended group link | Open recommended group | Exact clusters route focused on `semantic.marketing_subscriptions`; `Promotions and subscriptions`, `915` senders, and `75,844` emails visible | Review Groups ready; zero transition requests; Gmail controls retained | None | NA | PASS |
| Return to Intelligence and final hold | Focused Review Groups ready | Navigate back to Intelligence and hold six seconds | Exact canonical Intelligence route; All indexed, same totals, health, recommendation, controls, and `16` buckets | Zero return/hold requests; no late polling or visible drift | None | NA | PASS |

## Request, lifecycle, and browser integrity

- Request families observed: existing Gmail management summary, agent playground, mailbox index, and inbox-analysis Pressure Trend only.
- Window changes issued one Pressure Trend request for each uncached key; cached All indexed restoration and final return issued none.
- Focus refresh issued one expected management-summary request.
- Polling: none observed; final six-second hold produced zero requests.
- Failed requests: `0`
- `409` guard churn: `0`
- Console errors: `0`
- Duplicate-key warnings: `0`
- Page errors: `0`
- Runtime overlays: `0`
- Provider controls remained explicitly Gmail-specific and unchanged.
- Shared data truth did not change; linked totals and focused recommendation identity remained consistent across Intelligence and Review Groups.

## Verification tooling disclosure

The required Playwright skill was loaded successfully. The preferred wrapper was attempted first, but its named session did not persist. After the bounded retry budget produced no new signal, verification continued with the installed Playwright library. Two subsequent automation assertions used stale copy assumptions (`Review Groups` and the old internal group label); these were verifier-tool expectations, not product defects. A focused route/heading probe supplied the new signal, and the exact handoff/return rows were then completed and merged with the already persisted first six rows. The final evidence is post-settle and complete.

## Verifier decision

`ACCEPT`

Verification Confidence: `HIGH`

Missing Proof Type: `none`

The six-file Slice 2 candidate satisfied the target-locked PM Brief and passed verifier review. The later Human Review acceptance below closes Slice 2; neither verdict authorizes Slice 3, Phase 4, commit, push, deployment, provider mutation, or publication.

## Human Review decision

Status: `ACCEPTED / CLOSED`

Oliver reviewed the page on 2026-09-01, reported no visible regression, and explicitly approved continuation. This records Human Review `ACCEPT` for Phase 3 Slice 2 only.

Recovery Contract: `CHANGELOG.md` -> `September 1, 2026 — ACE-048 Framework-First Decision Workspace Phase 3 Slice 2 Accepted`.

Human-acceptance milestone backup: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - ACE-048 framework-first Decision Workspace Phase 3 Slice 2 Human acceptance)`; verified `1,136` files, exact worktree source, detached HEAD `8f8e4d670cabdd21459c0b4b8e502d16e272afc0`, normal seven-day project-scoped pruning, and `KEEP` exemption.

Checkpoint Status: `none`

- Implementation, verifier proof, Human acceptance, milestone backup, Recovery Contract, and closeout are propagated.
- No later Phase 3 slice, Phase 4 work, commit, push, deployment, provider mutation, or publication is authorized by this acceptance.
