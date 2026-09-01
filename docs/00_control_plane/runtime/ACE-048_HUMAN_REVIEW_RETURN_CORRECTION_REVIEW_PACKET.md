# ACE-048 Human Review Return Correction — Review Packet

Date: 2026-08-31
Status: `HUMAN ACCEPTED / RECOVERY CAPTURED`
Execution mode: `transitional_self_verification`
Governing event: `ACE-048`
Authoritative plan: `ACE-048_HUMAN_REVIEW_RETURN_CORRECTION_PM_BRIEF.md`

## Executive summary

### What changed

- Smart Sync completed one bounded continuity bridge from the recent recovered range back through the prior indexed boundary.
- Exactly one new candidate artifact was generated from the repaired index, proven in isolation, and then published through the guarded compare-and-set path after Oliver authorized resolving the remaining live gaps.
- The candidate keeps every exact cleanup group while placing secondary choices under `More specific groups` and risk/action exceptions under `Special handling`.
- Narrowed Sender Distribution, Time Context, workflow rows, pagination, and Decision Mode resolve the exact review-unit manifest for simple and composite identities.

### What the operator gets

- The yearly Pressure Trend includes May and June instead of showing an unexplained gap.
- Cleanup Groups are easier to scan without deleting or merging accurate groups.
- Normal timeframe controls work for both simple and composite child groups, with matching sender and activity totals across linked surfaces.

### Why it matters

The repaired publication now presents one consistent dataset through three lenses: activity over time, sender distribution, and the sender workflow. Oliver accepted that visible result on 2026-08-31. The prior August artifact remains the rollback predecessor; any Git commit/push decision remains separate.

## Scope and impact

Problem class: mixed, resolved into source/index continuity, artifact projection identity, and UI presentation policy.

Files changed:

- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/lib/integrations/gmail/gmailMailboxIndexer.ts`
- `web/src/app/agents/[id]/operations/clusters/page.tsx`
- `web/src/app/agents/[id]/operations/review/page.tsx`
- `web/scripts/gmail-review-unit-window-projection-contract-fixtures.mjs`
- `web/scripts/gmail-mailbox-index-continuity-fixtures.mjs`
- `web/scripts/gmail-cleanup-group-assignment-fixtures.mjs`
- `web/package.json`

Control-plane artifacts updated:

- `ai-agent-platform-docs/06_system_state/CURRENT_STATE.md`
- `ai-agent-platform-docs/06_system_state/TODO.md`
- `ai-agent-platform-docs/06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `docs/00_control_plane/EXECUTION_DASHBOARD.md`
- this review packet and its bounded evidence files

Affected systems: mailbox-index continuity, candidate artifact generation, Cleanup Groups presentation, Sender Overview, Sender Distribution, Time Context, sender workflow rows, pagination, and Decision Mode return state.

## RETURN stale-diff guard

- Pre-existing diff status: present at the start of this correction flow.
- Were existing diffs part of a previously failed attempt?: yes. The merged/runtime state had already been rejected by Human Review and was treated as suspect, not as proof.
- New edits made in this pass: the eight files listed above.
- Current-pass behavior differs materially from the rejected state: exact manifest resolution replaces route-identity projection lookup; persisted bounded bridging replaces a fixed recent cutoff; tiered presentation replaces a flat dense chooser; active projected members replace fixed-member readiness comparison.
- Generated screenshots and saved authentication state are verification artifacts, not product source.

## Live continuity and candidate evidence

### Backup

- Pre-live incremental: `/Users/olivercarlin/Documents/Backups/August 2026/2026-08-31/ai-agent-platform (incremental 31 August 2026 - Pre ACE-048 live continuity bridge after accepted source correction)`
- Normal seven-day pruning ran only for eligible project backups; `KEEP` archives were preserved.
- Human-acceptance milestone: `/Users/olivercarlin/Documents/Backups/August 2026/2026-08-31/ai-agent-platform (incremental 31 August 2026 - ACE-048 published continuity, cleanup tiering, and linked chart Human acceptance)`.

### Continuity bridge

- Run: `d5565ffd-0f09-46ad-8717-ae17e1f70216`
- Prior indexed boundary: `2026-04-12T07:05:14Z`
- Recovery cutoff: `2026-04-10T00:00:00Z`
- Work: `45` provider pages; `22,500` processed/upserted messages; `14,794` inserts; `7,706` updates.
- Result: indexed rows increased from `244,628` to `259,422`; inbox rows are `232,151`.
- Terminal reason: `recovery_bridge_completed`; no active run/checkpoint remained.
- Load behavior: one bounded single-flight bridge; no poller, retry loop, guard churn, build, or publication during the bridge.

### Candidate build and guarded publication

- Artifact: `full-mailbox-20260831062356983`
- Job: `full-rebuild:085c8ef7-2fd7-4842-8499-cd605e894a77:all_indexed:full-mailbox-20260831062356983`
- Candidate terminal phase before publication: `completed / candidate_ready`
- Processed: `5,144` senders, `259,422` messages, `7` clusters.
- Automatic publication: `false`.
- Published pointer before guarded promotion: `full-mailbox-20260825031402535`.
- Published pointer after guarded promotion: `full-mailbox-20260831062356983`, `published / fresh`, at `2026-08-31T08:03:39.987+00:00`.
- Evidence: `docs/00_control_plane/runtime/evidence/ACE-048_UNPUBLISHED_CANDIDATE_BUILD.json`.
- Publication evidence: `docs/00_control_plane/runtime/evidence/ACE-048_PUBLICATION_PROMOTE.json`.

Final live preflight before publication found no missing recent days and confirmed continuous monthly indexed counts: March `5,047`, April `4,649`, May `4,577`, June `4,644`, July `4,918`, August `4,847`.

## Direct verification

Static and contract checks:

- `npm run test:gmail-mailbox-index-continuity` — PASS.
- `npm run test:gmail-pressure-trend-contract` — PASS.
- `npm run test:gmail-cleanup-group-assignment` — PASS; primary limit `8`, ordinary tiny threshold `<5` and `<1%`, exact membership preserved.
- `npm run test:gmail-review-unit-window-projection-contract` — PASS.
- `npm run test:gmail-review-unit-contract` — PASS.
- `npm run test:gmail-optional-evidence-detail-contract` — PASS.
- `./node_modules/.bin/tsc --noEmit` — PASS.

Production build status:

- A final fresh Turbopack build became idle without terminal output and was stopped at the bounded diagnostic limit.
- A bounded Webpack alternate exposed the existing `node:crypto` `UnhandledSchemeError` path through `gmailSemanticRollupContract.ts`; it did not identify a correction-specific regression.
- Missing Proof Type: Blocked for a terminal production-build PASS in this environment. The build was not repeated without a new signal.

## Runtime/UI verification

Candidate origin: `http://localhost:3001`, using only the explicit unpublished artifact override. The normal port-`3000` runtime and published pointer were left unchanged. The temporary candidate server was stopped after proof.

Canonical composite route:

`http://localhost:3001/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions&subset_source=review_unit&subset_value=review-unit%3Asemantic_parent_subscription_senders_family_marketing_promotional%3Asubtype-marketing_promotional_remainder%3Apattern-promotional_cycle&sender_overview_window=last_month`

Canonical simple route:

`http://localhost:3001/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions&subset_source=review_unit&subset_value=family%3Aoffer_campaign&sender_overview_window=last_month`

Playwright used fresh repo-backed authentication saved at `web/output/playwright/ace-048-publication-recovery/auth.local.json`.

Ready-state satisfied: YES.
Ready-state signals used: exact canonical identity in URL; requested timeframe selected; hero/workflow totals settled; chart metric panel present; sender actions present; no loading/fallback copy; accepted API responses `200`.
Settle strategy: bounded navigation/load wait plus response-aligned DOM/state capture after every cold load and switch.
Artifacts captured post-settle: YES.

Primary proof artifacts:

- `web/output/playwright/ace-048-live-candidate/pressure-trend-may-2026.png`
- `web/output/playwright/ace-048-live-candidate/pressure-trend-jun-2026.png`
- `web/output/playwright/ace-048-live-candidate/cleanup-groups-ready.png`
- `web/output/playwright/ace-048-live-candidate/cleanup-groups-tier-expanded.png`
- `web/output/playwright/ace-048-live-candidate/composite-1m-cold-sender-distribution.png`
- `web/output/playwright/ace-048-live-candidate/composite-1m-time-context.png`
- `web/output/playwright/ace-048-live-candidate/composite-1w-decision-mode.png`
- `web/output/playwright/ace-048-live-candidate/composite-1w-return.png`
- `web/output/playwright/ace-048-live-candidate/simple-1m-cold-sender-distribution.png`
- `web/output/playwright/ace-048-live-candidate/simple-1m-time-context.png`
- `web/output/playwright/ace-048-live-candidate/simple-1w-sender-distribution.png`
- `web/output/playwright/ace-048-live-candidate/candidate-verification.json`
- `web/output/playwright/ace-048-live-candidate/cleanup-tier-verification.json`

Request/guard review: all accepted API responses were `200`; no `409`, failed API request, console error, or page error occurred. One aborted RSC navigation request occurred during the Decision Mode route change and was the expected cancellation of the page being left, not an API failure.

## Canonical post-publication verification

Published origin: `http://localhost:3000` with no artifact override. The canonical runtime was restarted once because its prior exact Next.js process was listening but unresponsive; only that exact process was stopped, and the accepted server remains running on port `3000`.

Publication and runtime proof:

- `docs/00_control_plane/runtime/evidence/ACE-048_PUBLICATION_PROMOTE.json`
- `web/output/playwright/ace-048-final-publication/candidate-verification.json`
- `web/output/playwright/ace-048-final-publication/cleanup-tier-verification.json`
- `web/output/playwright/ace-048-final-publication/time-context-gap-verification.json`
- `web/output/playwright/ace-048-final-publication/pressure-trend-may-2026.png`
- `web/output/playwright/ace-048-final-publication/pressure-trend-jun-2026.png`
- `web/output/playwright/ace-048-final-publication/composite-1y-sender-distribution-before-time-context.png`
- `web/output/playwright/ace-048-final-publication/composite-1y-time-context-may-2026.png`
- `web/output/playwright/ace-048-final-publication/composite-1y-time-context-jun-2026.png`
- `web/output/playwright/ace-048-final-publication/cleanup-groups-tier-expanded.png`

Published visible truth:

- Yearly Pressure Trend renders `13` monthly buckets. May is `1,894` supporting messages and June is `1,940`; both selected-period cards match and no zero gap is visible.
- Composite Time Context `1Y` renders `12` continuous monthly activity bars. May is `67` supporting messages from `22` active senders; June is `63` supporting messages from `22` active senders.
- Cleanup Groups retains `67` exact review links, four `More specific groups` sections, and two `Special handling` sections.
- Composite and simple review units pass cold load, `All Indexed -> 1Y -> 1M -> 1W`, Time Context, populated sender workflow rows, and composite Decision Mode close/return with the same totals proven in candidate isolation.
- All accepted API responses were `200`; no `409` guard churn, failed API request, browser console error, page error, runtime overlay, or duplicate-key warning occurred. Two aborted RSC navigation requests were expected page-transition cancellation and did not affect the accepted final UI.

Ready-state satisfied: YES.
Ready-state signals used: canonical port-`3000` route; active published pointer; selected analysis tab and timeframe; settled hero/workflow totals; metric panel and chart bars present; no loading/fallback copy; accepted API responses `200`.
Settle strategy: bounded route navigation and DOM/data-state waits followed by post-settle screenshots and request review.
Artifacts captured post-settle: YES.
Browser console inspected: YES.
Runtime overlay present: NO.
Duplicate key warnings present: NO.
Runtime errors found: NONE.

## State Transition Matrix

| Mode / path | Baseline visible state before action | Operator action | Settled visible state after action | Downstream gate/status/result | Remaining blocker | Separate? | Verdict |
|---|---|---|---|---|---|---|---|
| Yearly Pressure Trend / May | Candidate yearly chart settled | Select May | May 2026 shows `1,894` supporting messages | Selected-period card matches `1,894`; no zero gap | None | NA | PASS |
| Yearly Pressure Trend / June | May selected | Select June | June 2026 shows `1,940` supporting messages | Selected-period card matches `1,940`; yearly chart has 13 visible monthly buckets | None | NA | PASS |
| Cleanup Groups tiers | Candidate chooser settled | Expand secondary sections | `67` exact review links remain; four More specific and two Special handling sections are present | Exact routes remain selectable; no membership was merged or deleted | None | NA | PASS |
| Composite / 1M cold | Canonical composite route requested | Open route | `43` senders, `132` activities, `0` managed, `43` remaining; 12 actions | Hero, distribution, workflow, and rows share the same active universe | None | NA | PASS |
| Composite / Time Context | Composite 1M settled | Select Time Context | Metric meaning visible; `43` workflow-scope senders; chart available | Same child/window remains active | None | NA | PASS |
| Composite / switch loop | 1M cold settled | All Indexed -> 1Y -> 1M -> 1W | `215/3,787` -> `94/898` -> `43/132` -> `20/40`; 12 actions remain | Linked workflow and distribution stay populated | None | NA | PASS |
| Composite / Decision Mode return | Composite 1W settled | Open sender, then close | Exact child and `last_week` preserved; `20` senders, `40` activities, 12 actions | Analysis and workflow state restored | None | NA | PASS |
| Simple / 1M cold | Canonical simple route requested | Open route | `108` senders, `1,030` activities, `1` managed, `107` remaining | Hero, distribution, workflow, and rows agree | None | NA | PASS |
| Simple / Time Context | Simple 1M settled | Select Time Context | Metric meaning visible; `108` workflow-scope senders; chart available | Same child/window remains active | None | NA | PASS |
| Simple / switch loop | 1M cold settled | All Indexed -> 1Y -> 1M -> 1W | `267/39,867` -> `175/11,970` -> `108/1,030` -> `84/219`; 12 actions remain | Linked workflow and distribution stay populated | None | NA | PASS |
| Published Pressure Trend / May | Canonical port-`3000` yearly chart settled | Select May | May 2026 renders a visible bar with `1,894` supporting messages | Selected-period card matches `1,894`; no zero gap | None | NA | PASS |
| Published Pressure Trend / June | May selected | Select June | June 2026 renders a visible bar with `1,940` supporting messages | Selected-period card matches `1,940`; 13 yearly buckets remain visible | None | NA | PASS |
| Published composite / Time Context 1Y | Sender Distribution 1Y settled on canonical route | Select Time Context, then hover May and June | Twelve continuous monthly bars render; May `67/22`, June `63/22` | Same review unit and `last_year` workflow remain active; no loading/unavailable state | None | NA | PASS |
| Published Cleanup Groups tiers | Canonical chooser settled | Expand secondary sections | `67` exact links, four More specific sections, two Special handling sections | Every exact unit remains selectable | None | NA | PASS |

Verification Confidence: HIGH for the exact three returned Human Review surfaces on the active canonical publication.

## Result and acceptance

Result: `Accepted Fix Proven`.

The correction is directly proven on the active publication, including repaired historical continuity and linked simple/composite child workflows. Under `transitional_self_verification`, the terminal production-build proof remains explicitly classified as `Missing Proof Type: Blocked` by pre-existing environment behavior; the exact changed runtime surfaces have direct static, contract, data, network, and post-settle browser proof.

Oliver returned `ACCEPT` on 2026-08-31. Recovery Contract: `ai-agent-platform-docs/06_system_state/CHANGELOG.md` -> `August 31, 2026 — ACE-048 Published Continuity and Linked Analysis Truth Accepted`. The milestone incremental backup completed with normal seven-day project-scoped pruning and `KEEP` preservation.

No Git commit, integration, push, deployment, further publication, Smart Sync, reindex, or rebuild is authorized by this acceptance record.

Checkpoint Status: none. Human acceptance, Recovery Contract capture, and milestone backup are complete for this correction. The framework-first Intelligence naming/metric UX observation is a separate bounded planning item.
