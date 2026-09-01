# ACE-048 Human Review Return — Three-Packet Correction PM Brief

Date: 2026-08-31
Status: `APPROVED / SOURCE-ONLY EXECUTION COMPLETED / REVIEW PACKET ACTIVE`
Execution mode: `transitional_self_verification`
Governing event: `ACE-048`
Problem class: mixed, decomposed into source/index truth, runtime projection identity, and UI presentation policy

## Executive summary

### What is changing

1. Smart Sync recovery will bridge to the last indexed continuity point instead of stopping after a fixed recent window.
2. Narrowed review-unit charts will resolve their projection parent from the published manifest identity instead of a presentation route identity.
3. Cleanup Groups will keep exact groups and counts, but ordinary tiny choices will move out of the primary grid while risk- or action-distinct tiny groups remain available under Special handling.

### What the operator will get

- Pressure Trend that reflects continuous indexed history rather than a silent May/June hole.
- Sender Distribution, Time Context, sender rows, pagination, and Decision Mode that work for simple and composite child groups across all timeframe controls.
- A less cluttered Cleanup Groups chooser without deleting, merging, or falsifying semantic membership.

### Why it matters

The user sees accurate observation history, one consistent workflow universe, and a manageable decision surface. Data stays exact; only its presentation becomes more useful.

## Human Review findings accepted as governing truth

- Yearly Pressure Trend visibly contains zero May and June 2026 buckets between April and resumed July activity.
- Multiple child choices have only one or two decision subjects and make the chooser unnecessarily dense.
- `All Indexed` remains populated for affected review units, while narrowed Sender Distribution and Time Context can fail with `review_unit_projection_unavailable`.
- The earlier verifier proof covered one simple family child and did not exercise the broader review-unit identity surface.

No prior Accepted Fix is reopened. The August 28 linked-chart Recovery Contract remains historical truth for the accepted surface, but it is not authority to ignore this broader Human Review return.

## Read-only diagnosis

### Packet 1 — indexed-source continuity

Observed source rows:

- March 2026: `5,047`
- April 2026: `1,841`
- May 2026: `0`
- June 2026: `0`
- July 2026: `4,657`
- August 2026: `2,343`

The published Pressure Trend faithfully reflects those indexed rows. This is not a chart-rendering defect and must not be hidden with fabricated bars.

Locked mechanism:

- Smart Sync requested incremental work but selected a fresh-head full recovery.
- Recent-health evaluation covers `14` days.
- Fresh-head recovery stops at a fixed `45`-day cutoff.
- The August run terminated `recent_window_reached`, advancing current state after reaching July without bridging back to the prior indexed endpoint in April.
- The result is a stranded May/June continuity hole that a later 14-day health check cannot detect.

### Packet 2 — small-group presentation

The published artifact contains `60` exact review units across `7` parent groups. A conservative rule of fewer than `5` subjects and less than `1%` of the parent would affect only `7` units containing `17` total memberships before exception handling. A broader fewer-than-`10` and less-than-`2%` rule would affect `10` units containing `35` memberships.

Recommendation:

- Preserve every review-unit identity, membership, count, route, and audit record.
- Use fewer than `5` subjects **and** less than `1%` of the parent as the ordinary tiny-choice threshold.
- Do not combine or hide tiny groups that have distinct risk, compliance, security, protected/trusted, or materially different action semantics.
- Move exception units into an expandable `Special handling` section.
- Move ordinary threshold-matched units into an expandable `More specific groups` section; they remain individually selectable.
- Cap the immediately visible primary choices at the strongest `8` decision-value options per parent. Overflow remains available under `More specific groups`.

This is presentation prioritization, not data removal or taxonomy mutation.

### Packet 3 — narrowed-window projection identity

Live browser comparison:

- Simple unit `family:editorial_newsletter`: `1Y` returns `200`, `39` active subjects, populated distribution and workflow rows.
- Composite unit `Recurring promotions and newsletters`: `1Y` returns two `503` responses with `review_unit_projection_unavailable`; the selected control remains visibly highlighted.

The authenticated projection RPC succeeds for both units only with parent identity:

`semantic-parent:subscription-senders:family:marketing_promotional`

It correctly fails with presentation/legacy identities:

- `semantic.marketing_subscriptions`
- `subscription-senders`

The live UI request carries the presentation identity as `canonical_cluster_id`, while the exact manifest parent is present only as a source identity. The compatibility fallback can reconstruct smaller units, masking the mismatch, but it is not a reliable authority for larger composite units.

Locked mechanism: persisted projection reads are not resolving `parent_id` from the exact published review-unit manifest before calling the bounded projection RPC.

## Approved-scope write packets

Oliver recorded `ACCEPT` for this plan. The source-only packets were executed in the approved order; live provider/data repair remains separately gated.

### Write packet A — narrowed projection identity

Objective: restore all narrowed linked surfaces without data mutation.

Locked files:

- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/scripts/gmail-review-unit-window-projection-contract-fixtures.mjs`
- `web/scripts/review-unit-window-projection-contract-fixtures.mjs`

Exact correction:

- Resolve the projection `parent_id` from the exact published manifest/review-unit identity.
- Keep route/presentation cluster identity for navigation and copy only.
- Use the same resolved manifest identity for Sender Distribution, Time Context, workspace rows, pagination, and Decision Mode.
- Fail closed on missing or ambiguous manifest identity; do not silently fall back to presentation identity.
- Retain the bounded legacy fallback only for genuinely older artifacts that do not publish projection manifests.

Regression protections:

- Simple family, composite/remainder, protected exception, ordinary tiny child, and one representative unit per parent.
- `All Indexed`, `1Y`, `1M`, `1W`, Time Context bucket selection, Decision Mode open/close/return.
- Cross-surface active-subject and activity-volume parity.

### Write packet B — gap-aware index continuity

Objective: prevent Smart Sync recovery from creating a silent hole between prior indexed history and the recovered fresh head.

Locked files:

- `web/src/lib/integrations/gmail/gmailMailboxIndexer.ts`
- a narrowly scoped index-continuity fixture under `web/scripts/`

Exact correction:

- Derive a recovery bridge boundary from persisted index continuity, not a fixed `45`-day age alone.
- During fresh-head recovery, paginate backward until the prior indexed boundary is crossed with a bounded overlap.
- Preserve caps, checkpoints, yield behavior, single-flight protections, and explicit terminal reasons.
- Do not advance authoritative continuity/history state until the bridge boundary has been proven.
- Persist enough run evidence to distinguish `bridge_completed`, `bridge_yielded`, and `bridge_failed` from `recent_window_reached`.
- A failed or capped bridge must remain resumable and must not claim current continuous coverage.

Runtime load declaration:

- Heavy endpoints: Gmail history/list and message-detail reads already used by mailbox indexing.
- Request families: Smart Sync mailbox-index orchestration and its existing artifact handoff.
- Polling: no new UI polling or recurring request family.
- Expected steady-state route requests: unchanged.
- Recovery work: bounded pages/messages per run with persisted continuation when the bridge exceeds one run.
- Lifecycle edges: Smart Sync -> index continuity -> artifact eligibility. No change to stale-build reclaim.

Existing-data repair is a separate gate after code verification:

- one bounded provider-backed bridge repair for May/June,
- then one candidate artifact generated from the repaired index,
- preview and linked-surface verification,
- publication only after a separate explicit approval.

No provider access, sync, reindex, repair, rebuild, or publication is authorized by accepting this implementation plan alone.

### Write packet C — cleanup-choice prioritization

Objective: reduce chooser clutter while preserving exact data.

Locked files:

- `web/src/app/agents/[id]/operations/clusters/page.tsx`
- `web/scripts/gmail-cleanup-group-assignment-fixtures.mjs`

Exact correction:

- Classify review units into primary, more-specific, and special-handling presentation tiers.
- Apply the ordinary threshold only when subject count is below `5` **and** parent share is below `1%`.
- Preserve distinct-action/risk exceptions in Special handling.
- Show at most `8` primary choices immediately; keep overflow expandable and selectable.
- Preserve exact-partition totals and every underlying review-unit route.

Regression protections:

- Primary + More specific + Special handling still reconcile exactly to the parent membership.
- No decision subject moves between review units.
- Deep links to collapsed units remain valid.
- Small parents are not emptied or made misleading by a global threshold.
- Copy remains framework-first (`decision subjects`, `activity`, `special handling`) rather than Gmail-only logic.

## Recommended execution order

1. Packet A — restore the shared narrowed-window runtime path.
2. Packet B — correct future index continuity behavior with fixture proof only.
3. Packet C — simplify Cleanup Groups presentation without changing membership.
4. Static/build and diagnostic correction proof.
5. Separate decision gate for bounded May/June live repair and one unpublished candidate.
6. Accepted-fix verification: post-settle Playwright cold load, switch loops, final UI, request traces, console/server logs, and linked-surface parity.
7. Human Review decision.
8. Only after Human `ACCEPT`: Recovery Contract, milestone backup, commit/integration, and GitHub push as separately authorized.

## Verification contract

Accepted defect surfaces:

- Mailbox Intelligence yearly Pressure Trend with May/June continuity after the separately approved repair.
- Cleanup Groups parents containing ordinary tiny units and risk/action exceptions.
- Sender Distribution and Time Context for simple and composite review units across `All Indexed`, `1Y`, `1M`, and `1W`.
- sender workflow totals/rows/pagination and Decision Mode for the same selected unit/window.

Ready state:

- exact canonical route open and authenticated;
- requested unit and timeframe visibly selected;
- no loading/fallback-only copy;
- linked counts and rows settled;
- no unresolved API failure for the accepted surface.

Required proof:

- before/after screenshots, DOM/state captures, and aligned request traces;
- cold load, switch loop, and final settled state;
- State Transition Matrix per timeframe/identity class;
- zero visible contradiction, zero interfering guard churn, and explicit console/server-log review;
- HIGH verification confidence before closeout.

## Constraints and exclusions

- No Gmail/provider access during implementation packets.
- No database mutation, migration, Smart Sync, reindex, repair, rebuild, artifact publication, rollback, deployment, main movement, GitHub push, branch deletion, or worktree retirement.
- No fabricated chart data and no removal of exact review-unit truth.
- No change to accepted activity-volume Time Context semantics or distinct-subject workflow filtering.
- No Management-page work in this correction flow.

## Approval gate

Historical plan decision: `ACCEPT` — source-only execution authorized and completed.

- `ACCEPT` — recorded; the three implementation packets were authorized and completed. Live repair remains a later separate gate.
- `REJECT` — return the plan for correction.
- `BLOCKED` — identify the missing evidence or dependency.
- `RETURN_TO_PM` — materially rescope the work before implementation.

Checkpoint Status: continuity checkpoint created. This brief remains the approved execution contract. Current evidence and the next decision are recorded in `ACE-048_HUMAN_REVIEW_RETURN_CORRECTION_REVIEW_PACKET.md`.
