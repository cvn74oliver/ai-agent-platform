# ACE-048 Windowed Review-Unit Artifact Contract — PM Brief

Status: `STAGE D-R APPROVED AND ACTIVE`

Runtime artifact status: `updated; authoritative task-scoped runtime context`

Authoritative runtime context: `YES` for the bounded chart and linked-surface planning expansion only

Governing ACE: `ACE-048`

Execution mode: `transitional_self_verification`

Reasoning tier: `high`

Problem class: `artifact / publication truth` primary, with a bounded `runtime behavior` Pressure Trend seam

Execution readiness: `target-locked and execution-ready; Oliver approved immediate same-flow implementation on 2026-08-27`

## Executive summary

### What is changing

Automata will keep a decision group’s stable semantic identity and full membership for taxonomy/reconciliation, while each selected time window creates the current active working set: only unit members with qualifying activity in that window appear in rows, pagination, Decision Mode, and Sender Distribution.

### What Oliver will get

All Indexed, preset windows, and Custom will reconcile visibly. The interface will show the fixed size of the selected decision group separately from the smaller active-in-window working set. A one-day window will not retain inactive members as empty rank slots, and every linked workflow surface will use the same active set.

### Why it matters

The current candidate can prove exact All Indexed membership but cannot truthfully derive preset or Custom activity from two preview rows per entity. A platform-level projection contract prevents mixed universes, Gmail-only workarounds, fabricated dates, broad runtime scans, and future adapters having to rebuild this logic independently.

## Objective

Create a platform-generic artifact contract in which any Automata decision subject—senders, positions, transactions, documents, accounts, issues, deadlines, or future entity types—can expose:

- immutable review-unit membership for one artifact version;
- exact activity projections for All Indexed, preset, and Custom windows;
- one projection identity shared by active-window overview totals, entity rows, pagination, Decision Mode, distribution, time context, and trends;
- bounded indexed reads with no runtime artifact generation or source-wide scan.

The separate Pressure Trend correction must reject an empty or invalid initial seed so the existing one-attempt-per-semantic-key request can load the materialized bucket family.

## Semantic decision — membership and activity are separate axes

### Stable review-unit membership

`review_unit_id` identifies an immutable decision group inside one artifact version.

- Membership does not change when a user selects 1M, another preset, or Custom.
- Accepted Cleanup Groups child IDs, labels, presentation groups, parent totals, and membership remain frozen.
- `unit_entity_total` always means the full unique entity count assigned to the review unit.

### Windowed projection

A window selects activity belonging to members of the fixed unit. It is not another review unit.

Projection identity consists of:

- tenant/workspace identity;
- workflow blueprint and decision-subject identity;
- artifact version;
- parent scope and stable `review_unit_id`;
- canonical window specification and timezone;
- artifact coverage start/end.

The projection owns:

- `active_entity_total`: unique unit members with qualifying activity in the window;
- `activity_total`: exact domain measure in the window;
- one aggregate for every fixed unit member, including explicit zero activity for audit/reconciliation; the visible active working set excludes zero-activity members for non-All-Indexed workflow windows;
- exact time buckets for Time Context or the adapter’s equivalent trend surface.

### Visible behavior

- All Indexed: the working set is the full fixed unit membership; `unit_entity_total` remains the chooser/reconciliation count.
- Preset/Custom: rows, pagination, Decision Mode, and Sender Distribution use the exact active working set: fixed unit members whose projection `activity_count > 0` in the selected window.
- Zero-activity members remain materialized in projection truth for completeness, but they do not render as workflow rows or empty Sender Distribution rank slots in a narrowed window.
- Time Context/trends measure activity by members of the fixed unit over the selected window.
- A window with no qualifying activity is a valid ready-empty workflow: zero rows, zero ranked entities, zero Decision Mode queue, and no fallback to All Indexed or another artifact.
- The UI must label fixed membership and active-in-window truth separately; one number must never silently impersonate the other.

## Feature domain and scope

In scope after plan approval:

- Domain-neutral review-unit window/projection types, identity, aggregation contract, and validator.
- A Gmail adapter that maps sender keys, indexed-message timestamps, and Gmail measures into the generic contract.
- Additive projection manifests and multi-resolution activity-bucket storage.
- Exact bounded projection reads for All Indexed, preset, and Custom windows.
- Review-page reconciliation across fixed-membership context plus active-window sender rows, pagination, Decision Mode, Sender Distribution, and Time Context.
- Pressure Trend empty-seed rejection and coverage provenance.
- Fixtures, static/build proof, candidate-only generation validation, and authenticated post-settle browser proof.

Out of scope unless separately approved:

- changing accepted Cleanup Groups taxonomy, child IDs, labels, membership, counts, presentation groups, or navigation lifecycle;
- modifying the existing unpublished candidate in place;
- publication, main promotion, push, deployment, Smart Sync, Gmail reindex, or raw source-wide runtime reads;
- replacing Automata’s generic workflow-blueprint engine with Gmail concepts;
- Dashboard work or unrelated Operations repair.

## Platform-generic artifact model

### Manifest

One versioned projection manifest per review unit records:

- workspace/workflow/decision-subject identity;
- parent scope, stable review-unit ID, artifact version;
- exact fixed entity count and membership hash;
- exact all-indexed activity total;
- authoritative coverage start/end;
- supported window and bucket families;
- adapter ID/schema version and validation status.

### Activity buckets

Materialize domain-neutral per-entity activity aggregates, not raw events, using adapter-supplied measures.

Required initial resolutions:

- `all_indexed` entity totals for instant fixed-unit reconciliation;
- daily entity buckets for exact date-boundary handling;
- monthly entity buckets for bounded long-range Custom aggregation;
- unit-level daily/monthly/quarterly/yearly rollups for chart rendering.

The generic row carries an additive `activity_count` plus adapter-owned `measure_payload`. Gmail supplies sender/message semantics; other adapters supply their own entity and measure vocabulary.

### Exact Custom projection

Custom uses half-open `[start, end)` bounds normalized in the requested timezone and clamped to artifact coverage. The indexed reader aggregates:

- daily buckets for partial boundary months;
- monthly buckets for complete interior months;
- exact entity union and additive measures across both.

The read is constrained by tenant, workspace, workflow, artifact version, parent scope, review unit, and bucket range before aggregation. It returns at most the review-unit hard maximum of entity aggregates plus the bounded chart series; it never transfers or scans raw source events at runtime.

### Read contract

Use a security-invoker, RLS-respecting database function or an equivalently proven bounded indexed query. No `SECURITY DEFINER` privilege expansion is permitted.

The projection response includes:

- stable unit identity and fixed total;
- normalized requested/effective window and coverage limit explanation;
- active entity total and activity total;
- ordered all-member aggregates with explicit zero activity where applicable;
- bounded chart series;
- artifact version, membership hash, projection hash, and source/provenance.

Page preview/detail reads fetch only the visible page of the current working-set keys. Activity is joined by the same stable subject identity. The projection’s complete membership aggregates remain the audit source, while the active working set is deterministically derived from nonzero window activity without initiating a competing query universe.

## Indexed read patterns and load contract

Required indexes begin with the complete identity prefix and add range/order fields:

- manifest: tenant + workspace + workflow + artifact + parent + review unit;
- activity: tenant + workspace + workflow + artifact + parent + review unit + resolution + bucket start + entity;
- all-member projection page: the same identity prefix plus deterministic activity rank/entity tie-break, with zero-activity members retained.

Load ceilings:

- Cold review-unit/window key: one projection read plus at most one visible-page detail read.
- New preset or Custom key: one projection read plus at most one visible-page detail read.
- Cached return: zero heavy reads.
- Pressure Trend: at most one bucket-family request per new semantic key; zero steady repeats.
- No polling for projection readiness during ordinary navigation.
- No artifact build, publication mutation, Smart Sync, source scan, or Supabase-wide query from a normal read.
- Database statement timeout, returned-row ceiling, and request single-flight must fail closed with a structured reason; they must not retry automatically.

Expected steady-state accepted route load: zero projection, workspace, distribution, Pressure Trend, build, sync, or mailbox-index requests after settle.

## Candidate generation and lifecycle safety

Generation is explicit and candidate-only:

1. Create a new immutable candidate version; never mutate `full-mailbox-20260823022932121` in place.
2. Produce fixed membership, projection manifests, entity aggregates, and chart rollups from the same source snapshot.
3. Write to the candidate slice only.
4. Validate exact invariants before `candidate_ready`.
5. Restore and preserve the prior publication pointer throughout.

Failure behavior:

- Any missing manifest, orphan activity entity, count mismatch, coverage inversion, `1970`/epoch admission, unsupported bucket family, partial write, or projection-hash mismatch fails the candidate.
- A failed candidate remains unpublished and inspectable.
- The active publication and prior immutable candidates remain unchanged.
- Runtime must not mix a projection from one artifact version with membership, rows, distribution, or trends from another.
- Retry requires a fresh explicit candidate-generation command or an approved replace-before-finalize replay of the unpromoted candidate slice; no automatic runtime retry.

## Count and parity invariants

For every parent/review unit/artifact version:

1. Manifest fixed count = unique materialized membership count.
2. Every activity entity belongs to the same review unit and artifact version.
3. No activity entity belongs to two children where the parent contract is an exact partition.
4. Sum of all entity All Indexed activity totals = unit All Indexed activity total.
5. Sum of window member activity = window projection activity total = distribution activity total.
6. All Indexed: fixed unit membership = overview working total = row/pagination total = Decision Mode queue total = distribution entity count.
7. Preset/Custom: unique active entities = overview working total = row/pagination total = Decision Mode queue total = distribution entity count; this total is always less than or equal to fixed membership.
8. Time Context bucket sum = projection activity total for additive measures.
9. Parent/child/root fixed membership reconciliation remains unchanged from the accepted candidate.
10. Empty window projection is ready with fixed membership still reported as context, but zero active entities, zero workflow rows, zero Decision Mode queue, zero ranked distribution entities, zero activity, and no stale bars.
11. Requested/effective date bounds and visible latest date equal artifact coverage truth; current wall-clock time never invents coverage.

## Migration and rebuild implications

Migration required: `YES`, additive and generic.

Planned migration creation:

`supabase migration new add_workspace_review_unit_window_projection`

Generated and path-locked, but unapplied:

`supabase/migrations/20260824132718_add_workspace_review_unit_window_projection.sql`

The command-generated migration path becomes the only authorized migration file and must be reported/locked before SQL editing. The runtime must not invent a timestamped migration filename.

The migration will add generic projection manifest/activity storage, exact-prefix/range indexes, tenant RLS, constraints, and a security-invoker bounded reader. It must declare least-privilege Data API grants explicitly after RLS/policies because new public-schema objects may not inherit API exposure. It will not alter or remove existing Gmail artifact tables or the accepted `review_unit_id` membership column.

Candidate rebuild required: `YES` for acceptance-quality proof.

- Estimate: one new unpublished candidate generation from the existing indexed source snapshot; no Gmail reindex or Smart Sync.
- A projection-only replay may be considered only if implementation proof establishes that the retained candidate inputs are complete, immutable, and sufficient for every required measure. It must create a new artifact version and pass the same invariants; it may not patch the existing candidate.
- Migration application and candidate generation require a later explicit Oliver gate after code/static verification.

## Narrow Pressure Trend seam

`pressureTrendSeedDecision` must reject a candidate seed when:

- its series is empty;
- effective coverage is absent, inverted, or begins at epoch/invalid time;
- its window/timezone/requested bounds do not match the current semantic key.

Rejection means “fetch the existing materialized pressure bucket family once,” not “retry.” Preserve the accepted `pressureTrendAttemptedKeyRef` one-attempt ownership and existing request-family load ceiling.

The UI must distinguish:

- active publication date/version;
- effective candidate-preview artifact version when a development override is active;
- actual artifact coverage end.

August coverage may be displayed only when the effective candidate artifact proves it. An April publication must not be described as the source of August data.

## Locked target files and seams

### Generic contract and storage

1. `web/src/lib/runtime/reviewUnitContract.ts` — add window/projection identities and generic validation interfaces without changing existing unit-ID generation.
2. `web/src/lib/runtime/reviewUnitWindowProjection.ts` — new domain-neutral projection aggregation, hashing, and invariant validator.
3. Command-generated `supabase/migrations/<generated>_add_workspace_review_unit_window_projection.sql` — the sole migration generated with `supabase migration new add_workspace_review_unit_window_projection`, then path-locked before editing; additive generic manifests, buckets, indexes, RLS, explicit least-privilege grants, and bounded security-invoker read.

### Gmail reference adapter and artifact generation

4. `web/src/lib/integrations/gmail/gmailReviewUnitWindowProjection.ts` — new adapter mapping Gmail sender/message evidence into the generic contract.
5. `web/src/lib/integrations/gmail/gmailArtifactFullMailboxProjector.ts` — emit candidate projection manifests/buckets from the same immutable build input.
6. `web/src/lib/integrations/gmail/gmailArtifactStore.ts` — candidate writes, exact-prefix bounded projection reads, and no mixed-version fallback.
7. `web/src/lib/integrations/gmail/gmailArtifactBuildRunner.ts` — validate projection completion before `candidate_ready`; preserve publication restoration.
8. `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts` — translate the generic projection into Gmail workspace/row/distribution/time-context data.

### Runtime/API/UI

9. `web/src/lib/runtime/gmailCleanupWorkspace.ts` — projection request/cache identity, single-flight ownership, fixed-membership parity, and separate active-entity measures.
10. `web/src/app/api/integrations/gmail/inbox-analysis/route.ts` — parse the projection action/window identity and return structured bounded failures.
11. `web/src/app/agents/[id]/operations/review/page.tsx` — preserve one fixed-membership authority for overview, rows, pagination, and Decision Mode while applying one observation authority to distribution measures and Time Context; explicit fixed-versus-active labels.
12. `web/src/app/agents/[id]/operations/intelligence/page.tsx` — narrow empty-seed rejection and provenance-safe Pressure Trend state.
13. `web/src/components/runtime/GmailCleanupComponents.tsx` — render separate fixed-membership and window-active truth plus coverage/provenance explanation.

### Fixtures

14. `web/scripts/review-unit-window-projection-contract-fixtures.mjs` — generic sender-independent crypto/tax/entity fixtures.
15. `web/scripts/gmail-review-unit-window-projection-contract-fixtures.mjs` — Gmail adapter parity, zero-activity audit retention plus active-working-set exclusion, empty window, coverage, and active-entity reconciliation.
16. `web/scripts/gmail-pressure-trend-contract-fixtures.mjs` — empty-seed/coverage regression cases.
17. `web/package.json` — exact fixture commands only.

No other implementation file is authorized by this plan. Scope expansion, a protected-file need, or a second migration requires PM return before editing.

## Staged implementation and gates

### Stage A — generic contract and fixtures

- Add generic projection types/validator plus crypto/tax fixtures.
- Add Gmail adapter fixtures proving unchanged stable unit IDs and membership.
- No database or runtime mutation.

### Stage B — additive storage and candidate generator code

- Author the migration but do not apply it.
- Implement candidate-only projection materialization and failure validation.
- Preserve publication pointer and existing candidate immutability.
- Test RLS allow/deny behavior and function execution under the intended authenticated tenant context; verify unauthenticated and cross-tenant access fail.
- Run database advisors when the available CLI supports them, inspect explicit Data API grants separately from RLS, and verify the local migration list.
- Run TypeScript, targeted lint, fixture suites, migration/static inspection, diff check, and production build.

Decision gate: Oliver must separately authorize migration application and one new unpublished candidate generation.

### Stage C — controlled migration and one candidate

- Reattest exact Supabase project and publication/candidate pointers.
- Apply only the named additive migration.
- Generate exactly one new unpublished candidate from existing indexed data.
- Prove terminal `candidate_ready`, complete projection invariants, and unchanged published pointer.

### Stage D — runtime integration and correction proof

- Wire the bounded projection read into the exact review route.
- Apply the separate Pressure Trend empty-seed correction.
- Run static/build proof before restarting the candidate runtime.
- Use the exact target route and saved authentication for post-settle browser verification.

### Stage E — verifier closeout and Human Review checkpoint two

- Complete accepted-route artifact bundles and the State Transition Matrix.
- Verify frozen Cleanup Groups chooser/child/Decision-return regression surfaces.
- Stop at `Status: Awaiting Decision` with `ACCEPT`, `REJECT`, `BLOCKED`, or `RETURN_TO_PM`.
- Publication, main promotion, push, deployment, and lineage retirement remain separate decisions.

### Stage D-R — Human Review correction plan (approved and active)

- Oliver decision — 2026-08-27: `APPROVED`. Immediate same-flow implementation is authorized only for this bounded runtime correction and its verification matrix.

- Preserve immutable `review_unit_id`, full membership aggregates, projection manifests, and candidate data unchanged.
- Derive one `active_working_set` from projection members whose `activity_count > 0` whenever a preset or Custom window is selected.
- Make overview workflow totals, sender rows, pagination, Decision Mode, and Sender Distribution consume that exact ordered active set; All Indexed continues to consume full membership.
- Label both truths plainly, for example `278 senders in this group` and `N active in this window`.
- Keep a ready-empty projection honest: `0` active, no phantom ranks/rows, and no fallback.
- Confirm Pressure Trend lower and upper bounds come from the active tenant/workspace artifact or indexed-coverage provenance; no shared hardcoded date is allowed.
- Add no migration, candidate rebuild, Supabase-wide scan, polling, Smart Sync, Gmail reindex, or publication mutation.
- Required correction proof: cold All Indexed, every preset (`1Y`, `1Q`, `1M`, `1W`, `1D`), Custom, ready-empty, switch back to All Indexed, Decision Mode open/close, cross-surface count parity, dynamic coverage bounds, request trace, and final visible screenshots.

### Stage D-R correction and proof checkpoint — 2026-08-27

- The runtime now separates immutable review-unit membership from the active workflow set. Narrowed windows use only persisted unit members with positive projection activity; All Indexed still uses full fixed membership.
- The canonical candidate child proves fixed membership `53` while active workflow truth changes to `39` (`1Y`), `23` (`1Q`), `22` (`1M`), `10` (`1W`), `0` (`1D` ready-empty), and `17` (Custom Aug 1–15). All Indexed restores `53`.
- Overview totals, rows, pagination, Sender Distribution, Time Context, and Decision Mode consume the same active ordered set. Decision Mode on `1W` shows `5 of 10`; closing returns to the same `10`-sender workspace.
- Pressure Trend All Indexed is dynamically bounded to the active candidate coverage (`2022-12-23` through `2026-08-15` in the rendered quarterly view) and no longer exposes a `1970` origin.
- Generic and Gmail projection fixtures, diff check, targeted ESLint with zero errors, and the `63/63` production build pass. Browser proof settled with zero console errors, no polling, no `409`, and no recurring heavy requests.
- Candidate `full-mailbox-20260825031402535` remains unpublished. No migration, rebuild, Smart Sync, Gmail reindex, publication, deployment, push, main movement, or lineage retirement occurred.
- Status: `Awaiting Decision`. Stage D-R is implemented and correction-proof complete but is not an Accepted Fix until the renewed decision gate records `ACCEPT`, `REJECT`, `BLOCKED`, or `RETURN_TO_PM`.

### Stage D-R2 — child transition and title correction (approved and active)

- Human Review retained the Stage D-R active-window result but returned the child-entry surface: `Start Here` children can be rejected as stale and sent back to Cleanup Groups, and successful child workspaces render the parent presentation title as H1.
- Problem class: mixed runtime behavior plus UI grammar/rendering, with both mechanisms target-locked.
- Runtime correction: when current trusted runtime mailbox intelligence exists, Cleanup Groups must derive child cards/IDs from that same snapshot; cached/latest-stable intelligence is absence fallback only. Review continues to fail closed for malformed/stale IDs and must never silently open the broad parent.
- UI correction: a valid selected published review unit owns the Sender Overview H1. The parent presentation group remains visible as supporting `Inside ...` context. Legacy/broad reads retain the parent title.
- Load contract: no new endpoint, poller, build, projection request, sync, scan, or recurring request. Normal settled request count is unchanged.
- Locked files: `web/src/app/agents/[id]/operations/clusters/page.tsx`, `web/src/app/agents/[id]/operations/review/page.tsx`, and narrow contract tests/fixtures only.
- Accepted proof: all `Start Here` children open and remain on their canonical Review route; representative older/protected children show child H1 plus correct parent context; back/forward and chooser return preserve identity; `1M` remains filtered and linked counts remain equal.
- Explicit exclusions: taxonomy, artifact membership, counts, window semantics, Sender Distribution/Pressure Trend algorithms, migration, rebuild, publication, Smart Sync, Gmail reindex, deployment, push, main movement, and lineage retirement.

### Stage D-R2 correction and proof checkpoint — 2026-08-27

- All `13/13` Start Here child routes settle on their canonical Review identity without redirecting to Cleanup Groups. Representative older/protected children render the selected child label as H1 with the correct parent shown as `Inside ...` context.
- An actual chooser click opens `Deals and special offers` and settles at `262` active senders. The canonical newsletters child shows fixed membership `53`, narrows to `22` active senders on `1M`, preserves `22` across overview, pagination, Sender Distribution, and Decision Mode, and closes back to the same child/window with the overlay removed.
- Generic/Gmail/window fixtures PASS; targeted ESLint reports `0` errors / `19` warnings; `git diff --check` PASS. The settled request trace shows one bounded workspace and one bounded distribution family per changed key, query concurrency `1`, zero raw Gmail-message reads, zero `409`, and no recurring heavy polling.
- Human-visible proof bundle: `/private/tmp/ace048-d-r2-before-start-here-click.jpg`, `/private/tmp/ace048-d-r2-after-start-here-click.jpg`, `/private/tmp/ace048-d-r2-before-window.jpg`, `/private/tmp/ace048-d-r2-after-1m-parity.jpg`, `/private/tmp/ace048-d-r2-after-decision-mode.jpg`, and `/private/tmp/ace048-d-r2-after-close-return-v2.jpg`.
- Candidate `full-mailbox-20260825031402535` remains unpublished. No migration, rebuild, Smart Sync, Gmail reindex, publication, deployment, push, main movement, or lineage retirement occurred.
- Status: `Awaiting Decision`. Stage D-R2 is implemented and correction-proof complete but is not an Accepted Fix until Human Review records `ACCEPT`, `REJECT`, `BLOCKED`, or `RETURN_TO_PM`.

### Stage D-R3 — shared-observation Time Context correction (approved and active)

- Executive summary — what is changing: Time Context will use one active timeframe state, preserve each bar's canonical interval identity, and drive the same workflow that Sender Distribution, sender rows, and Decision Mode use. Bars will be labeled as unique decision subjects active in the interval, with supporting activity shown separately.
- What the operator will get: the selected timeframe chip visibly matches the rendered data; clicking a non-empty bar narrows the workflow to that exact period; counts remain understandable even when the same subject appears in more than one time bucket; and all three analytical lenses read the same observation authority.
- Why it matters: the operator can trust Time Context as another view of the same decision universe instead of a visually plausible but independently computed chart.
- Objective: correct Time Context state convergence, canonical interval-bound propagation, workflow-driving bar selection, and metric copy without changing taxonomy, immutable child membership, or artifact publication.
- Feature domain: domain-neutral observation projections. Gmail supplies sender/message vocabulary only; the engine contract is decision subjects plus timestamped observations and measures.
- Mode: `transitional_self_verification`. Reasoning level: `high`.
- Problem class: mixed runtime behavior and shared observation truth, with mechanisms target-locked.
- Locked files: `web/src/app/agents/[id]/operations/review/page.tsx`, `web/src/components/runtime/GmailCleanupComponents.tsx`, and narrow existing contract fixtures. Storage/projection files may be touched only if direct inspection proves the persisted contract itself is missing required interval identity.
- Shared-observation contract: for the same artifact, review unit, and timeframe, Time Context, Sender Distribution, sender rows, Decision Mode, and Pressure Trend projections derive from the same canonical subject-observation facts. A bucket count is distinct subjects active in that exact interval; supporting activity is a separate count; subjects may recur across buckets, so bucket counts are not additive across time.
- Runtime/load contract: no polling. A changed timeframe or bucket key may cause one bounded projection/workspace family plus at most one bounded detail family; settled steady state is zero recurring heavy reads. Navigation may not trigger build, sync, reindex, publication, or a Supabase-wide scan.
- Accepted defect surfaces: authenticated cold Time Context; All Indexed -> `1Y` -> `1W` -> `1D` -> All Indexed switch loop; a non-empty bar click; linked overview, rows, Sender Distribution, and Decision Mode parity; and Pressure Trend coverage/provenance consistency.
- Regression protections: Sender Distribution accepted behavior remains unchanged; immutable review-unit membership and chooser reconciliation remain unchanged; invalid/missing interval bounds fail safely without broad-parent fallback; ready-empty windows remain honest; no date or coverage bound is hardcoded per user.
- Verification expectations: targeted contract/static/build proof followed by post-settle Playwright screenshots, DOM/state evidence, request traces, console/overlay checks, guard-churn classification, final visible UI inspection, and a State Transition Matrix.
- Status: `APPROVED AND ACTIVE`.

### Stage D-R3 diagnostic checkpoint — 2026-08-27

- Implemented correction: the selected published review unit now owns the Time Context rail source, one timeframe state owns the highlighted control, and canonical interval bounds survive the presentation path. Generic/Gmail/window fixtures PASS and targeted lint has zero errors.
- Authenticated post-settle evidence: the canonical child route settled as `Promotions and subscriptions` with `239` All Indexed subjects; Time Context no longer displayed the prior unavailable/loading contradiction. Switching to `1Y` visibly selected `1Y` and narrowed the shared workflow to `125` subjects.
- Accepted failure evidence: the All Indexed monthly peak displayed `343` active subjects inside the `239`-subject child, and `1Y` displayed a `1,629`-subject bucket inside the `125`-subject workflow. These are activity totals, not distinct subjects.
- Mechanism: the materialized projection stores per-subject bucket rows, but `read_workspace_review_unit_window_projection` aggregates and returns only `activity_count`. The generic runtime therefore lacks an authoritative `active_entity_count` field for each interval.
- Required correction: one additive bounded read-contract migration must return `active_entity_count` separately from `activity_count`; the adapter and UI must preserve both meanings; Time Context bars use unique subjects and supporting activity remains an explicit secondary measure. No semantic rebuild, Gmail reindex, Smart Sync, publication, or broad scan is required.
- Decision result — 2026-08-28: Oliver recorded `ACCEPT`. Immediate same-flow execution is authorized for one additive bounded projection read-contract migration plus the target-locked generic adapter/Time Context wiring and verification. No semantic rebuild, Gmail reindex, Smart Sync, artifact publication, broad scan, deployment, push, main movement, or lineage retirement is authorized.

### Stage D-R3 Human Review return — activity-volume Time Context correction (verified; decision pending)

- What is changing: Time Context bars will show additive observation/activity volume over time. Each bucket will separately show how many distinct decision subjects produced that activity. Clicking a bucket continues to narrow the workflow to those distinct subjects.
- What the operator will get: repeated activity remains visible instead of being collapsed away. In Gmail vocabulary, a bar can truthfully say `5 messages from 4 senders`; the workflow below shows those `4` senders once each and preserves their individual message volumes.
- Why it matters: Time Context answers when and how much activity happened, while Sender Distribution answers which decision subjects are present and how their workload is distributed. Both lenses read one canonical fact set without pretending that unlike measures must have the same total.
- Objective: replace only the primary Time Context visual measure and its explanatory grammar while preserving the accepted timeframe state, canonical interval bounds, distinct-subject narrowing, immutable review-unit identity, and linked workflow behavior.
- Problem class: mixed metric semantics and UI grammar over shared observation truth; target-locked and execution-ready.
- Locked files: `web/src/components/runtime/GmailCleanupComponents.tsx` plus the narrow existing Time Context/projection contract fixture. `review/page.tsx` may be touched only if inspection proves it owns presentation mapping needed for the same contract.
- Metric contract: `activity_count` is the additive primary bar measure; `active_entity_count` is the distinct-subject secondary measure and filtering denominator. The same subject may contribute observations in multiple disjoint time buckets. Summing activity bars is valid for the visible window; summing distinct-subject counts across bars does not yield the unique workflow total.
- Interaction contract: bar selection uses canonical interval identity and materialized distinct subject membership. Sender Overview, sender rows, pagination, Sender Distribution, and Decision Mode remain unique-subject surfaces; rows show each selected subject once with its supporting activity volume.
- Framework contract: engine vocabulary remains decision subjects plus timestamped observations. Domain adapters provide operator language such as sender/message, asset/trade, client/transaction, or patient/encounter.
- Runtime/load contract: no new endpoint, poller, migration, candidate build, sync, reindex, publication, or broad scan. One bounded workspace/projection family may run for a changed timeframe/bucket key, followed by at most one bounded detail family; settled steady state is zero recurring heavy requests.
- Accepted defect surface: the exact weekly `Newsletters and editorial updates` child route where the workflow has `10` unique senders, daily subject appearances can exceed `10`, and Aug 12 carries `5` messages from `4` senders. The corrected chart must render activity volume, show both measures clearly, narrow to `4` unique senders on Aug 12, and restore the `10`-sender weekly workflow on Clear.
- Regression protections: Sender Distribution remains sender-distinct; existing distinct-subject projection and narrowing remain unchanged; timeframe highlighting and canonical interval bounds remain accepted; Pressure Trend continues to derive dynamically from the same canonical observation facts; no hardcoded dates or Gmail-specific engine semantics.
- Verification expectations: targeted contract/static checks, then authenticated post-settle Playwright on cold weekly load, Aug 12 hover/click, linked workflow/rows/Distribution/Decision Mode parity, Clear restore, timeframe switch loop, console/overlay inspection, request trace, guard-churn report, visible before/after artifacts, and a State Transition Matrix.
- Oliver decision — 2026-08-28: `APPROVED`. Immediate same-flow execution is authorized within this bounded correction.
- Implementation result — 2026-08-28: additive activity volume now owns the chart and primary bucket read; distinct subjects remain separately visible and continue to own workflow narrowing. The generic fixture proves four activities from two decision subjects.
- Verifier result: `ACCEPT / HIGH`. On the exact weekly accepted route, the settled workflow shows `10` unique senders and `15` messages; Aug 12 shows `5` messages from `4` senders and narrows Overview, rows, Sender Distribution, and Decision Mode to the same `4` subjects. Close preserves the bucket, and the timeframe switch loop restores the weekly state.
- Proof bundle: `/private/tmp/ace048-time-context-activity-proof/`. Ready-state, visible screenshots, DOM/state, and request evidence are captured post-settle.
- Residual evidence: one non-interfering Decision Mode snippet-hydration `412`; no `409` churn, no recurring settled requests, and no navigation-triggered mutation or heavy scan.
- Status: `VERIFIER ACCEPTED / AWAITING HUMAN REVIEW DECISION`. Accepted Fix capture and every publication/main/deployment action remain blocked.

### Stage D-R4 — dual-window authority deconfliction (Human-accepted)

- What is changing: the Review page must expose one mutable workflow timeframe, not independent left-rail and Analysis Rail filters that can contradict each other.
- What the operator will get: one obvious timeframe choice whose selected state, URL, totals, Time Context, Sender Distribution, rows, pagination, and Decision Mode always move together. Indexed/artifact coverage remains understandable provenance rather than a second workflow filter.
- Why it matters: users cannot trust a chart or sender queue when two controls can silently select different datasets.
- Objective: make the Analysis Rail the only mutable Review/Decision workflow-window owner, render upper indexed coverage as read-only provenance, and canonicalize legacy conflicting route state without losing the chosen lower window.
- Feature domain: platform-generic decision-subject workflows and time-window projections. Gmail supplies only presentation vocabulary.
- Mode: `transitional_self_verification`. Reasoning level: `high`.
- Problem class: mixed runtime behavior and shared route/state authority; `target-locked / correction verified`.
- Locked targets: the Review/Decision branch in `OperationsWorkspaceShell.tsx` and review-route workflow-window canonicalization in `operations/review/page.tsx`.
- Runtime/load contract: each changed workflow-window key may issue one bounded sender-workspace request and one sender-distribution request. Time Context derives from the same scoped facts. No polling, rebuild, Smart Sync, reindex, publication, migration, broad scan, or repeated refresh loop is allowed.
- Regression protections: retain Stage D-R3 activity-volume bars, distinct-subject bucket narrowing, immutable review-unit membership, child title/route identity, dynamic indexed coverage, and zero settled heavy polling.
- Implementation result — 2026-08-28: Review and Decision surfaces now show read-only upper indexed coverage and one lower mutable Workflow window. Legacy `workflow_scope` is used only as a compatibility input when no lower selection exists and is then removed from review-unit URLs.
- Verifier result: `ACCEPT / HIGH`. Authenticated post-settle Playwright proved conflict cold-load canonicalization, `1W -> 1M -> All Indexed -> 1W`, Overview/Distribution/Time Context/row parity, and Decision Mode close/return preservation. Targeted lint, TypeScript, and review-unit projection contracts passed.
- Proof artifacts: `.playwright-cli/ace048-dual-filter-*` in the ACE-048 integration worktree, with the original Oliver screenshots retained as before-state evidence.
- Guard/load result: one sender-workspace and one sender-distribution request per changed key; no polling, repeated heavy requests, `409` churn, or navigation-triggered mutation. A separate evidence-snippet `412` remains outside this correction.
- Human Review decision — 2026-08-28: `ACCEPT`. Oliver accepted Cleanup Groups, Sender Distribution, activity-volume Time Context with distinct-subject narrowing, dynamic Pressure Trend coverage, and the single workflow-window behavior as the completed analysis milestone.
- Recovery Contract: `CHANGELOG.md` -> `August 28, 2026 — ACE-048 Unified Analysis Window and Linked Chart Truth Accepted`.
- Execution readiness: ACCEPTED FIX CAPTURED. The next distinct work unit is Git/worktree consolidation preflight. Commit, merge, local-main promotion, worktree/branch retirement, push, deployment, publication, rebuild, sync, and reindex remain separately gated.

## Accepted defect and proof surfaces

Canonical runtime origin: `http://localhost:3000`

Accepted review child: the exact `structural.protected_trust` review-unit route already locked in ACE-048 carry-forward.

Required review-route rows:

- cold All Indexed;
- All Indexed -> 1M;
- 1M -> Custom inside coverage;
- Custom end beyond coverage, visibly clamped/explained;
- Custom -> All Indexed cached return;
- Decision Mode open/close on All Indexed and one narrowed observation window, with the narrowed window using the active-entity denominator while retaining the same stable review-unit identity;
- valid ready-empty window;
- fresh context cold load with no warm-cache dependence.

Every row must prove:

- stable `review_unit_id` unchanged;
- fixed unit total, active entity total, activity total;
- fixed row/pagination/Decision/distribution membership parity plus separately reconciled active and activity measures;
- Time Context/trend sum and visible range;
- final settled UI, DOM/state, aligned request trace, console/overlay status, and guard-churn classification.

Required Pressure Trend rows:

- cold All Indexed begins at real artifact coverage, never 1970;
- 1M one-key switch;
- Custom in coverage;
- Custom beyond coverage with truthful latest selectable/effective date;
- switch loop back to cached All Indexed;
- empty initial seed causes one bounded fetch and zero steady repeats.

Required artifacts:

- before-action and after-settle screenshots for each affected path;
- DOM/state capture tied to each screenshot;
- request trace tied to the same final state;
- exact route and action;
- State Transition Matrix with one row per path/control;
- explicit request-family/load and `409` classification.

## Regression protections

- Freeze accepted Cleanup Groups stage labels, child labels, stable IDs, membership, parent/child/root counts, chooser behavior, cold load, and Decision Mode return.
- Preserve old published artifacts and fail closed when projection capability is absent; never invent scoped truth from preview rows.
- Preserve one-attempt-per-key Pressure Trend behavior and all existing accepted request-ownership guards.
- No mixed artifact versions across membership, projections, rows, distribution, or trends.
- No normal-read build, publication, Smart Sync, reindex, raw source scan, or polling.
- A visible contradiction or stale/fabricated date fails verification even when machine-readable counts pass.

## Risks and mitigations

- Storage growth: multi-resolution aggregates add rows. Bound generation by accepted unit hard maximum, supported resolutions, artifact version, and explicit row-count estimates before build.
- Long Custom windows: use indexed monthly interiors plus daily boundary buckets and database-side aggregation; return at most the bounded unit plus chart series.
- Hot review-page integration: stage behind contract fixtures and candidate data, preserve exact request identity, and verify one correction at a time.
- Migration history drift: reattest the linked project and apply only the named migration after a separate decision; do not broad-push migrations.
- Candidate failure: retain failure evidence, keep publication unchanged, and prohibit mixed-version fallback.
- Generic-contract drift: crypto and tax fixtures must pass alongside Gmail; domain vocabulary stays in adapters.

## Rollback

- Before migration application: revert only the exact Stage A/B files; no runtime or data rollback is needed.
- After migration but before publication: leave additive generic tables unused or remove them only through a separately approved rollback migration; never delete data ad hoc.
- Runtime rollback: disable projection capability consumption and return to the last published artifact behavior; unsupported candidate windows fail closed rather than falling back across versions.
- Candidate rollback: retain/reject the unpublished candidate and leave the active publication pointer unchanged.
- Pressure Trend rollback: revert only empty-seed admission logic while preserving the accepted one-attempt request owner.

## Approval requested

`ACCEPT` approves Stages A and B only: implementation, unapplied migration authoring, fixtures, and static/build proof. It does not authorize migration application, candidate generation, publication, main promotion, push, deployment, Smart Sync, or Gmail reindex.

`REJECT` returns the contract for correction.

`BLOCKED` identifies a missing dependency or proof requirement.

`RETURN_TO_PM` requests a different semantic or rollout direction.

Stages A/B result: implemented in the isolated ACE-048 worktree. Generic, Gmail-adapter, and Pressure Trend fixtures pass; TypeScript, targeted lint, production build, and diff checks pass. Local SQL function/RLS execution proof is deferred to Stage C because the local PostgreSQL client installation has no server binary. No remote database, candidate, or publication state changed.

Oliver decision — 2026-08-25: `APPROVED`. Apply only migration `20260824132718_add_workspace_review_unit_window_projection.sql` to project `cjpjekhlvzwjwtszqpmy`, verify its schema/RLS contract, and generate exactly one unpublished candidate from existing indexed data. Publication, Smart Sync, Gmail reindex, deployment, push, local-main promotion, and lineage retirement remain unauthorized.

Stage C authorization state before execution: `APPROVED — CONTROLLED MIGRATION + ONE UNPUBLISHED CANDIDATE`.

## Stage C result — 2026-08-25

- Applied the additive projection migration and a corrective RLS initplan optimization migration to exact project `cjpjekhlvzwjwtszqpmy`; no broad migration push was used.
- Triggered exactly one candidate build from the existing idle `244,628`-message mailbox index. Candidate `full-mailbox-20260825031402535` reached `completed / candidate_ready`; no Smart Sync or Gmail reindex ran.
- The active publication pointer remains `full-mailbox-20260415024237593`; `building_version` and mailbox `active_run_id` are null.
- Reconciled `5,024` unique/root senders across `7` parents: `4,965` actionable members in `60` exact manifests plus `59` informational Context senders. Manifest/seed and parent/root parity failures are zero, duplicate within-parent memberships are zero, and the largest child is `296`.
- Projection coverage is `2022-12-02` through `2026-08-15`; the new contract contains no epoch manifest. Authenticated same-tenant RPC reads, All Indexed, Custom, ready-empty, cross-tenant denial, grants, and final database advisors pass for the new projection objects.
- One transient preview-index upsert recovered through the existing bounded retry; it did not trigger a second build or mailbox scan.

Stage C did not produce runtime/UI acceptance and does not authorize publication. Stage D remains a separately approved runtime/UI integration and correction-proof step.

Oliver Stage D decision — 2026-08-25: `ACCEPT`. Immediate same-flow execution is authorized only for the target-locked runtime/API/review files and Pressure Trend seam above. Publication, Smart Sync, Gmail reindex, deployment, push, local-main promotion, and lineage retirement remain unauthorized.

Status: `STAGE D ACTIVE — RUNTIME INTEGRATION + CORRECTION PROOF`
