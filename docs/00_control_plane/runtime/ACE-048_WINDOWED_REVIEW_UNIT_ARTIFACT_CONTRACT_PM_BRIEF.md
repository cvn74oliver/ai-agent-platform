# ACE-048 Windowed Review-Unit Artifact Contract — PM Brief

Status: `STAGE D ACTIVE — RUNTIME INTEGRATION + CORRECTION PROOF`

Runtime artifact status: `updated; authoritative task-scoped runtime context`

Authoritative runtime context: `YES` for the bounded chart and linked-surface planning expansion only

Governing ACE: `ACE-048`

Execution mode: `transitional_self_verification`

Reasoning tier: `high`

Problem class: `artifact / publication truth` primary, with a bounded `runtime behavior` Pressure Trend seam

Execution readiness: `target-locked; Stages A/B authorized by Oliver on 2026-08-24`

## Executive summary

### What is changing

Automata will separate a decision group’s stable membership from activity measured inside a selected time window. One stable review-unit identity will remain authoritative across rows, pagination, and Decision Mode, while a windowed projection supplies exact per-member activity, active-entity, distribution-measure, and trend truth.

### What Oliver will get

All Indexed, preset windows, and Custom will reconcile visibly. The interface will show both the fixed size of the selected decision group and how many of its entities were active in the chosen window, without changing child names, IDs, or accepted Cleanup Groups navigation.

### Why it matters

The current candidate can prove exact All Indexed membership but cannot truthfully derive preset or Custom activity from two preview rows per entity. A platform-level projection contract prevents mixed universes, Gmail-only workarounds, fabricated dates, broad runtime scans, and future adapters having to rebuild this logic independently.

## Objective

Create a platform-generic artifact contract in which any Automata decision subject—senders, positions, transactions, documents, accounts, issues, deadlines, or future entity types—can expose:

- immutable review-unit membership for one artifact version;
- exact activity projections for All Indexed, preset, and Custom windows;
- one projection identity shared by overview totals, entity rows, Decision Mode, distribution, time context, and trends;
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
- one aggregate for every fixed unit member, including explicit zero activity, used by distribution and activity annotations without replacing membership-owned rows, pagination, or Decision Mode;
- exact time buckets for Time Context or the adapter’s equivalent trend surface.

### Visible behavior

- All Indexed: `active_entity_total` may equal or be lower than `unit_entity_total`; both remain explicit.
- Preset/Custom: rows, pagination, and Decision Mode retain the fixed unit membership. Distribution retains exactly the same members and changes only their windowed activity measures; zero-activity members remain explicit.
- Time Context/trends measure activity by members of the fixed unit over the selected window.
- A window with no qualifying activity is a valid ready-empty projection. It must not fall back to All Indexed or another artifact.
- The UI must label fixed membership and active-in-window truth separately; one number must never silently impersonate the other.

## Feature domain and scope

In scope after plan approval:

- Domain-neutral review-unit window/projection types, identity, aggregation contract, and validator.
- A Gmail adapter that maps sender keys, indexed-message timestamps, and Gmail measures into the generic contract.
- Additive projection manifests and multi-resolution activity-bucket storage.
- Exact bounded projection reads for All Indexed, preset, and Custom windows.
- Review-page reconciliation across fixed-membership summary, sender rows, pagination, Decision Mode, all-member Sender Distribution, and Time Context.
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

Page preview/detail reads fetch only the visible page of fixed membership keys. Activity is joined by the same stable subject identity. Distribution derives from the all-member aggregate set—including zero-activity members—rather than initiating a competing universe.

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
6. Fixed unit membership = overview unit total = row/pagination total = Decision Mode queue total = distribution entity count.
7. Unique active entities = overview active total = distribution nonzero-activity count, and it is always less than or equal to fixed membership.
8. Time Context bucket sum = projection activity total for additive measures.
9. Parent/child/root fixed membership reconciliation remains unchanged from the accepted candidate.
10. Empty window projection is ready with the full fixed membership, zero active entities, zero activity, explicit zero distribution values, and no stale bars.
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
15. `web/scripts/gmail-review-unit-window-projection-contract-fixtures.mjs` — Gmail adapter parity, zero-activity member retention, empty window, coverage, and active-entity reconciliation.
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

## Accepted defect and proof surfaces

Canonical runtime origin: `http://localhost:3000`

Accepted review child: the exact `structural.protected_trust` review-unit route already locked in ACE-048 carry-forward.

Required review-route rows:

- cold All Indexed;
- All Indexed -> 1M;
- 1M -> Custom inside coverage;
- Custom end beyond coverage, visibly clamped/explained;
- Custom -> All Indexed cached return;
- Decision Mode open/close on All Indexed and one narrowed observation window, with the same fixed membership denominator;
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
