# ACTIVE_CHANGE_EVENTS.md

## Purpose
This file tracks active architectural, product, workflow, UI, and operating-model decisions that have changed and still require propagation across code, documentation, and operating context.

## Rules
- Only include changes that are still live and not fully propagated.
- Each change event must be specific and scoped.
- When all related docs/code are updated, mark the event completed or move it to a completed section later.
- This file is a control-plane document, not a brainstorming document.
- Propagation status must be explicit.
- Completed change events must be moved out of the Active section and placed in the Completed section with their final propagation state preserved.




## Active Change Events

### [ACE-048] Post-merge publication recovery — 2026-08-31

Status: HUMAN ACCEPTED / RECOVERY CAPTURED / MAIN-INTEGRATED / AUTOMATIC PRODUCTION DEPLOYMENTS READY; ONE VERCEL ENVIRONMENT DEFECT ROUTED TO SEPARATE PM ADJUDICATION; FRAMEWORK THROUGH PHASE 4 SLICE 2 CLOSED
Problem class: mixed / unresolved for later Phase 4 work; remain in PM discovery until a fresh target lock; the accepted Approval Queue presentation/read surface is closed and endpoint/runtime hardening remains separate and unapproved
Execution mode: `transitional_self_verification`

- Initial post-merge Human Review found that accepted consolidated source was not yet the runtime truth on canonical localhost: Mailbox Intelligence stopped at the April artifact, Cleanup Groups used incomplete legacy child data, and child Sender Overview routes failed against that mixed version.
- Pre-merge Git reattestation proved local `main`, `origin/main`, and live main aligned at `49f863c055787ff0a0eb696a76d4609dd3d7568f`; the accepted Cleanup Groups and shared Sender Distribution/Time Context/Pressure Trend integration commits were present. The later authorized PR #3 merge advanced `main` through merge commit `c766da06709e3df266dfc9146395459910fadca7`. The preserved `cleanup-taxonomy-rebuild` branch remains superseded lineage and must not be merged wholesale.
- Pre-recovery Supabase reattestation locked that mechanism: published `all_indexed` was `full-mailbox-20260415024237593` with `4,923` senders and zero review-unit manifests, while candidate `full-mailbox-20260825031402535` was terminal `completed / candidate_ready` with `5,024` senders, `244,628` messages, `7` parents, `60` validated manifests, and projection coverage from `2022-12-02` through `2026-08-15`.
- The guarded publication transition resolved that mixed-version publication failure and made the August artifact active. The current Human Review return is a later, separate three-part correction surface inside the active August truth.
- Separate accepted UI direction: Mailbox Intelligence must not retain a competing mutable Operations Workspace analysis dropdown. The sidebar becomes read-only indexed provenance; Pressure Trend remains the page's sole mutable timeframe control.
- Oliver recorded `ACCEPT` on 2026-08-31 for the bounded recovery plan. Authoritative packet: `docs/00_control_plane/runtime/ACE-048_POST_MERGE_PUBLICATION_RECOVERY_PM_BRIEF.md`.
- A verified full `KEEP` backup exists before execution. No pruning occurred.
- Authorized sequence: restore compare-and-set promotion safety; correct Intelligence timeframe authority; preview the exact August candidate without publication; verify all linked surfaces; then perform one atomic publication transition only if preview passes. April remains the rollback version.
- Prohibited: Gmail access, Smart Sync, reindex, raw scan, rebuild, second candidate, migration, broad Supabase mutation, deployment, deletion, or wholesale legacy branch integration.
- Execution result: guarded publication changed only the canonical artifact pointer from `full-mailbox-20260415024237593` to `full-mailbox-20260825031402535`; the pointer is `published / fresh`, no build lock remains, and the job is terminal `published`.
- Verifier result: candidate preview and canonical port-`3000` final proof pass after settle for Mailbox Intelligence, seven-group Cleanup Groups, canonical child entry, Sender Distribution `1W`, and Time Context `1W`. Pressure Trend reaches Q3 2026; all linked surfaces use the August artifact. API failures, `409` guard churn, console errors, and duplicate-key warnings were zero.
- Static/contract proof: TypeScript, targeted ESLint, cleanup assignment, Pressure Trend, generic workspace review-unit, generic/Gmail window projection, and Gmail review-unit contract fixtures all pass.
- Human Review decision: `REJECT` / `RETURN_TO_PM` on 2026-08-31. The yearly Pressure Trend has visible empty May and June 2026 buckets before July resumes; multiple ordinary cleanup children contain only one or two subjects and require a framework-first presentation-policy decision; and non-`All Indexed` Sender Distribution / Time Context windows fail for additional chooser-generated review-unit identities while `All Indexed` remains populated. The prior proof covered one canonical family child and is insufficient as all-child regression proof.
- Active PM discovery is split into three bounded work packets: (1) indexed-source continuity, (2) small-group presentation policy, and (3) narrowed-window projection/runtime parity across representative review-unit identity classes. No Accepted Fix, Recovery Contract, source integration, push, rollback, sync, reindex, rebuild, or publication is authorized.
- Read-only diagnosis locks Packet 1: raw indexed rows are `5,047` in March, `1,841` in April, `0` in May, `0` in June, `4,657` in July, and `2,343` in August. The chart is faithful; Smart Sync selected a fresh-head full recovery, stopped at the fixed `45`-day `recent_window_reached` cutoff, and advanced current continuity after reaching July without bridging to the prior April endpoint.
- Read-only diagnosis locks Packet 2: the August artifact has `60` exact units. A conservative ordinary threshold of `<5` subjects **and** `<1%` of parent affects only `7` units / `17` memberships before exception handling. Exact identities stay immutable; ordinary tiny and overflow choices move under `More specific groups`, while risk/action-distinct exceptions remain selectable under `Special handling`; at most `8` primary choices show immediately.
- Authenticated browser/RPC diagnosis locks Packet 3: `family:editorial_newsletter` `1Y` returns `200` through compatibility fallback, while composite `Recurring promotions and newsletters` returns paired `503 review_unit_projection_unavailable`. Both persisted reads succeed with manifest parent `semantic-parent:subscription-senders:family:marketing_promotional` and fail with presentation/legacy parents `semantic.marketing_subscriptions` and `subscription-senders`. Manifest identity, not route identity, must drive every narrowed linked surface.
- Oliver approval packet: `docs/00_control_plane/runtime/ACE-048_HUMAN_REVIEW_RETURN_CORRECTION_PM_BRIEF.md`. Recommended order is projection identity, index continuity behavior, presentation prioritization, then a separately approved bounded live gap repair/candidate/publication flow.
- Oliver recorded `ACCEPT` for the three source-only packets. Execution resolved projection identity from the exact published manifest, added bounded/resumable continuity bridging before history advancement, and introduced primary/More specific/Special handling chooser tiers without changing unit membership.
- Targeted fixtures, TypeScript, diff check, and authenticated post-settle composite-child browser proof pass across `All Indexed`, `1Y`, `1M`, `1W`, Time Context, workflow rows, and Decision Mode return. All observed API responses were `200`; no failed request, console error, or `409` guard churn occurred.
- Review packet: `docs/00_control_plane/runtime/ACE-048_HUMAN_REVIEW_RETURN_CORRECTION_REVIEW_PACKET.md`. Result is `Partial Proof`: live May/June repair remains behind a separate provider/data-mutation gate, and the final fresh production build did not reach a terminal result in this environment. No Accepted Fix or Recovery Contract exists.
- Oliver recorded `ACCEPT` on the correction candidate and authorized one bounded provider-backed continuity bridge followed by exactly one unpublished candidate and linked-surface verification. Publication, Accepted Fix capture, commit, push, and deployment remain separate gates.
- A milestone incremental backup completed before live mutation with normal seven-day pruning and all `KEEP` archives preserved.
- The bounded continuity bridge completed once under run `d5565ffd-0f09-46ad-8717-ae17e1f70216`: `45` provider pages, `22,500` processed/upserted messages, `14,794` inserts, `7,706` updates, and index growth from `244,628` to `259,422` rows. It crossed the persisted prior boundary, terminated as `recovery_bridge_completed`, left no active run/checkpoint, and did not publish or build an artifact.
- Exactly one candidate completed as `full-mailbox-20260831062356983`, job `full-rebuild:085c8ef7-2fd7-4842-8499-cd605e894a77:all_indexed:full-mailbox-20260831062356983`, terminal `candidate_ready` before promotion. It processed `5,144` senders and `259,422` messages; automatic publication was false.
- Authenticated post-settle candidate verification on isolated port `3001` passes the exact returned surfaces. Pressure Trend visibly contains May `1,894` and June `1,940` supporting messages; Cleanup Groups preserves `67` exact review routes under primary, four More specific sections, and two Special handling sections; simple and composite review units pass cold load plus `All Indexed -> 1Y -> 1M -> 1W`, Time Context, workflow rows, and composite Decision Mode close/return with linked counts. All accepted API responses were `200`; no `409`, console error, or failed request occurred.
- Final live preflight confirmed the repaired index remains continuous through August. After Oliver directed Codex to resolve the remaining gaps and clarified that the candidate had not yet been published, a pre-publication incremental backup completed with project-scoped seven-day pruning and `KEEP` preservation.
- One guarded compare-and-set transition promoted `full-mailbox-20260831062356983` over expected predecessor `full-mailbox-20260825031402535`; publication is `published / fresh`, no build lock remains, and proof is recorded at `docs/00_control_plane/runtime/evidence/ACE-048_PUBLICATION_PROMOTE.json`.
- Authenticated canonical port-`3000` proof passes after settle. Pressure Trend renders 13 yearly buckets with May `1,894` and June `1,940`; composite Time Context renders 12 continuous monthly activity bars with May `67` messages / `22` senders and June `63` / `22`; `67` exact cleanup routes remain under primary, four More specific, and two Special handling sections; simple/composite window loops, workflow rows, and Decision Mode return remain populated. All accepted API responses were `200`; no `409`, failed API request, console error, page error, runtime overlay, or duplicate-key warning occurred.
- The terminal fresh production-build PASS remains `Missing Proof Type: Blocked` by the pre-existing build environment behavior documented in the review packet; no duplicate build ran without a new signal. Under `transitional_self_verification`, the direct accepted runtime proof is the closeout authority for this correction.
- Human Review decision: `ACCEPT` on 2026-08-31. Recovery Contract: `CHANGELOG.md` -> `August 31, 2026 — ACE-048 Published Continuity and Linked Analysis Truth Accepted`.
- The Human-acceptance milestone incremental backup completed at `/Users/olivercarlin/Documents/Backups/August 2026/2026-08-31/ai-agent-platform (incremental 31 August 2026 - ACE-048 published continuity, cleanup tiering, and linked chart Human acceptance)`; normal seven-day pruning remained project-scoped and every `KEEP` archive was preserved.
- Newly governing Human Review truth: the `1,999` value is the unique published `cleanup_candidate_universe.sender_count`, not subjects actively opened by a person. The visible `Senders in review` label is therefore misleading. The page name and framework-owned Mailbox/Inbox grammar also incorrectly elevate the Gmail reference adapter into platform terminology.
- Oliver accepted the narrow naming direction but immediately established broader governing truth before implementation: the full shared workflow must be provider-neutral, support multiple concurrent integrations, and keep Gmail/Facebook Ads/crypto/tax schemas and operations behind explicit provider adapters. The naming-only brief is superseded unexecuted; no partial rename is authorized.
- Oliver additionally established the platform's reusable product loop: source reporting plus agent/SOP analysis must produce visual, evidence-backed recommendations that a human can understand, decide, approve, and later measure. The framework therefore requires versioned SOP context, semantic metric/visualization definitions, provenance/freshness/quality, recommendation rationale/confidence/impact, immutable decision/action lifecycle, and explicit multi-source compatibility—not only adapter-driven nouns.
- Product-area boundary: Settings/Connections owns provider authentication and reusable connection/capability truth; Automations is the future guided design-time builder and publication authority for versioned SOP/workflow definitions; Agents/Operations is the runtime reporting, recommendation, human-decision, approval, execution, and outcome surface; Dashboard aggregates compatible cross-workflow truth. Operations references an immutable published workflow definition/version and does not duplicate builder ownership. No Automations builder implementation is authorized in the current Phase 1 plan.
- Read-only architecture audit confirms the generic review-unit blueprint/adapter and generic entity-activity projection already exist, with crypto and tax portability fixtures. The primary remaining leakage is shared page/navigation/assistant grammar, Gmail-shaped route DTOs/services, and fixed Gmail action semantics above that generic core.
- Authoritative plan: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_REFACTOR_PM_BRIEF.md`. It mandates a staged dependency inversion: Phase 1 generic decision-workspace vocabulary/capability/lifecycle contract; later separately gated presentation, runtime facade, capability-driven Decision Mode/Management, multi-source portability proof, and compatibility cleanup. The accepted Gmail data, review groups, charts, and workflow remain frozen regression truth.
- Oliver decision: `ACCEPT` for Phase 1 immediate same-flow implementation. Scope is contract/fixtures only; no visible UI, provider connection, live data, database, publication, builder, marketplace, learning pipeline, commit, push, or deployment mutation.
- Initial modular validation roadmap: customer service, investments, paid media, and finance. Future marketplace templates/connectors, AI/MCP-guided workflow creation, agent monitoring/correction feedback, and the company-owned proprietary brain are product requirements but not current implementation authority. The brain is a versioned application-layer knowledge/memory system, not an LLM or fine-tuned model; the earlier training UI's topic coverage, source provenance, quality labels, examples, gaps, and human corrections remain useful semantics under new vocabulary. Shared learning is private-by-default and requires explicit opt-in, aggregation/de-identification, privacy thresholds, provenance, evaluation, and rollback.
- Phase 1 source implementation is complete. `decisionWorkspaceContract.ts` now defines and validates published workflow/runtime identity, arbitrary source bindings, subjects/activity, semantic metric compatibility, entity links, evidence provenance, versioned recommendations, immutable human decisions, capability/approval/idempotency rules, contiguous execution lifecycle/provider receipts, review-unit sizing, and private proprietary-brain governance. The accepted generic review-unit engine consumes this canonical contract, and Gmail supplies its provider-specific adapter metadata without visible/runtime/data mutation.
- Cross-domain fixtures pass for Gmail, customer service, real-estate scouting, crypto portfolio management, four-source paid media, bookkeeping, and tax. Existing generic/Gmail review-unit, cleanup-assignment, and time-window projection fixtures, TypeScript, targeted lint, and `git diff --check` also pass. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE1_REVIEW_PACKET.md`.
- The Phase 1 verifier-checkpoint incremental backup completed with normal seven-day project-scoped pruning and `KEEP` preservation. Verifier decision is `ACCEPT` / `HIGH`.
- Human Review decision: `ACCEPT` on 2026-08-31. Recovery Contract: `CHANGELOG.md` -> `August 31, 2026 — ACE-048 Framework-First Decision Workspace Phase 1 Accepted`.
- The Phase 1 Human-acceptance milestone incremental completed at `/Users/olivercarlin/Documents/Backups/August 2026/2026-08-31/ai-agent-platform (incremental 31 August 2026 - ACE-048 framework-first decision workspace Phase 1 Human acceptance)` with normal seven-day project-scoped pruning and `KEEP` preservation.
- Phase 1 is closed. No commit, push, deployment, real provider, live data, database, artifact publication, UI migration, marketplace, Workflow Studio, or shared-learning implementation occurred. Phase 1 acceptance does not authorize Phase 2 implementation; the separately accepted Phase 2 target lock remains logged deferred execution until Oliver gives an explicit implementation decision.
- Phase 2 read-only discovery proved the authoritative shared render path, separated framework vocabulary from adapter domain language and provider-operational controls, validated the model across seven reference domains, and achieved `inferred_target_lock`. Oliver accepted the target-locked direction on 2026-08-31. Authoritative plan: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE2_PM_BRIEF.md`.
- Oliver additionally established that Gmail remains the reference application while arbitrary cross-agent workflows—including purchasing, spreadsheet maintenance, shipping/inventory tracking, and closed-loop outcome feedback—must use the shared framework wherever possible. Domain specialization should use versioned workflows, adapters, semantic metrics, capabilities, action catalogs, and bounded add-ons before platform forks or broad overhaul. Human decision quality and the tenant-owned proprietary brain are the durable outcome tests.
- The accepted Phase 2 plan is recorded as logged deferred execution. No UI/runtime implementation, route rename, provider/data mutation, later phase, commit, push, or deployment is authorized until Oliver separately approves implementation.
- Pre-execution PM audit found that the later general phrase `I accept everything` was interpreted inconsistently after the explicit decision surface had reserved source/UI authority for a separate bounded pass. The phrase is not treated as implementation authorization. Logged deferred execution remains authoritative until Oliver says `ACCEPT PHASE 2 IMPLEMENTATION` or gives an equally unambiguous source-execution instruction.
- The target-locked acceptance contract now explicitly requires presentation metadata to support multiple agent roles, workflows, providers, and sources without losing source/workflow/role/provenance identity. It also requires proprietary-brain improvement to remain versioned, inspectable, human-governed, provenance-backed, evaluated, and reversible. These are framework constraints only; Phase 2 does not authorize Workflow Studio, training UI, shared learning, multi-agent orchestration, uncontrolled self-modification, or silent cross-tenant learning.
- Oliver supplied the exact decision `ACCEPT PHASE 2 IMPLEMENTATION` on 2026-08-31 through the fresh bounded execution delegation. The locked 14-file/five-slice presentation implementation and its full verification loop are authorized after the pre-implementation milestone incremental backup. No route rename, runtime facade, behavior change, provider/data mutation, request/poll/cache/lifecycle change, unlisted source file, later phase, commit, push, or deployment is authorized.
- Oliver clarified that provider-neutral framework semantics may render domain-adaptive visible titles. Framework semantic slot IDs, meaning, accessibility, validation, and generic fallbacks remain stable, while versioned adapter/workflow presentation metadata may supply approved deterministic titles/subtitles such as `Inbox health`, `Portfolio health`, `Campaign health`, `Compliance health`, and `Service health`. Missing/unsafe metadata uses `Decision health` or fails closed. No page-load model call, live AI generation, new request, nondeterministic copy, Workflow Studio, or runtime/data behavior is authorized.
- The pre-implementation milestone incremental backup completed for the exact `8642` worktree at `/Users/olivercarlin/Documents/Backups/August 2026/2026-08-31/ai-agent-platform-worktree-8642 (incremental 31 August 2026 - Pre ACE-048 framework-first Decision Workspace Phase 2 presentation implementati)`. Normal seven-day pruning was limited to that refreshed backup source and every `KEEP` archive was preserved.
- Phase 2's five bounded presentation slices are implemented inside the locked source allowlist. The generic deterministic presentation schema/context, Gmail compatibility metadata, shared-shell/page consumers, provider-control capability gating, and cross-domain fixtures are complete. No route, API, provider/data, database, artifact/index/publication, request/poll/cache/lifecycle, Workflow Studio, learning, orchestration, commit, push, or deployment change occurred.
- Verifier decision is `ACCEPT` / `HIGH`. Static and regression checks pass. Authenticated post-settle Playwright proof on all six exact accepted paths preserves Gmail counts, groups, windows, rows, Decision Mode close/return, Management truth, and provider controls. Before/after API families remain identical with `19` API requests, zero failures, zero `409` churn, zero model calls, and zero console/page errors. The editorial requested path preserves its accepted baseline redirect to Review Groups. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE2_REVIEW_PACKET.md`.
- Oliver's first Human Review attempt on 2026-09-01 was blocked before product review by a missing-Supabase-environment runtime overlay. Exact process inspection proved port `3000` served the `8642` worktree while that worktree had no `.env.local`. The server was restarted from the same worktree with the established local environment loaded only in-process and Next bound only to `127.0.0.1:3000`. Fresh authenticated browser proof reaches settled `Inbox health` with accepted counts and zero console errors/warnings, overlay, or duplicate-key warning. This unblocks Human Review but is not acceptance.
- Oliver returned Human Review `ACCEPT` on 2026-09-01 after inspecting the recovered runtime and confirming the visible Gmail system remained correct. Phase 2 is closed. Recovery Contract: `CHANGELOG.md` -> `September 1, 2026 — ACE-048 Framework-First Decision Workspace Phase 2 Accepted`.
- The Phase 2 Human-acceptance milestone incremental completed and was verified at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - ACE-048 framework-first Decision Workspace Phase 2 Human acceptance)`; normal seven-day pruning remained scoped to the selected worktree backup family and `KEEP` preservation remained in force.
- Oliver explicitly authorized `ACCEPT PHASE 3 DISCOVERY` on 2026-09-01. The bounded read-only discovery and target-lock pass completed under `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_DISCOVERY_HANDOFF.md`. No runtime/data implementation is authorized; Gmail fetchers, schemas, APIs, counts, requests, provider controls, and accepted behavior remain frozen behind the adapter until execution is explicitly approved.
- Discovery proved the exact path from `operations/layout.tsx` through `OperationsWorkspaceShell`, `OperationsRuntimeProvider`, `fetchOperationsRuntimeSnapshot`, `/api/agents/playground`, `runtimeStateService`, `assembleGmailRuntimeState`, response DTOs, and page consumers. Review Groups is the safest first slice: its route has no direct fetch, is read-only with respect to providers, and still exercises meaningful groups, review units, semantic metrics, recommendation/progress context, provenance, and downstream route identity.
- The exact eight-file target lock, generic/adapter responsibility split, seven-domain plus purchasing/shipping model test, zero-new-request load declaration, Gmail regression boundary, rollback, and full post-settle Playwright proof are captured in `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_REVIEW_GROUPS_PM_BRIEF.md`. Runtime discovery was not repeated because accepted Phase 2 artifacts already lock the route's visible/request/console baseline and repo proof resolved the import/data seam.
- Oliver explicitly authorized `ACCEPT PHASE 3 SLICE 1 IMPLEMENTATION` on 2026-09-01. The pre-implementation worktree incremental completed with `968` files, project-scoped seven-day pruning, and `KEEP` preservation.
- The exact eight-file Review Groups read-facade slice is implemented. A generic validated envelope/context now supplies the route; Gmail compatibility mapping retains the existing runtime/cache/semantic/draft seams. No route, provider/data, database, artifact/index/publication, request, poll, cache, lifecycle, Decision Mode, Management, commit, push, or deployment change occurred.
- Eight-domain/static fixtures, all required Gmail regressions, TypeScript, targeted ESLint, and diff checks pass. Authenticated post-settle Playwright proof preserves `7` main groups, `3` optional/reference groups, `5,144` senders, the accepted `915 / 75,844` recommendation, `67` unit links, exact child/return identity, Gmail controls, existing request families, and zero browser errors or `409` churn. Verifier decision: `ACCEPT / HIGH`. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE1_REVIEW_PACKET.md`.
- Human Review decision: `ACCEPT` on 2026-09-01. Phase 3 Slice 1 is closed. Recovery Contract: `CHANGELOG.md` -> `September 1, 2026 — ACE-048 Framework-First Decision Workspace Phase 3 Slice 1 Accepted`.
- The Phase 3 Slice 1 Human-acceptance milestone incremental completed at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - ACE-048 framework-first Decision Workspace Phase 3 Slice 1 Human acceptance)` with `1,114` files; normal seven-day pruning remained scoped to the selected worktree backup family and `KEEP` preservation remained in force.
- No Phase 3 implementation authority exists beyond the now-accepted Slices 1-3; every subsequent facade surface remains separately discovered, target-locked, and gated.
- Oliver approved the next bounded Phase 3 discovery/target-lock pass on 2026-09-01. Repository tracing and accepted runtime artifacts select Decision Intelligence (`Inbox health`) as Slice 2. It is read-oriented and helper-mediated; Sender Overview remains a `14,706`-line high-interaction surface, Management owns direct provider actions, and legacy audit routes are not the primary framework surface.
- Slice 2 is `inferred_target_lock` / execution-ready. Authoritative discovery handoff: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE2_DISCOVERY_HANDOFF.md`. Authoritative six-file PM Brief: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE2_DECISION_INTELLIGENCE_PM_BRIEF.md`.
- Oliver replied `accept` directly to the explicit Phase 3 Slice 2 implementation gate on 2026-09-01. The locked six-file implementation and required verification loop are authorized, beginning with the governed pre-implementation worktree incremental.
- The required pre-implementation incremental is verified at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - Pre ACE-048 framework-first Decision Workspace Phase 3 Slice 2 Decision Intellig)` with `1,116` files, project-scoped seven-day pruning, and all `KEEP` archives preserved.
- The locked contract preserves the exact Intelligence route, Gmail values/charts/recommendations/links/provider controls, existing four read request families, cache/seed logic, bounded transient retry, one-request-per-pressure-key behavior, `15s` management-summary cache/single-flight, focus synchronization, and zero settled polling. Provider/data/database/artifact/index/publication mutation, route changes, commit, push, and deployment remain prohibited.
- The exact six-file Slice 2 implementation completed within the allowlist. A generic validated Decision Intelligence contract and adapter service now own semantic health, lifecycle, activity-series, recommendation, and workflow-progress read boundaries; the Gmail adapter retains provider projection and the Intelligence page retains the accepted lifecycle/effect sequencing through that service.
- Verification result: `ACCEPT / HIGH`. Eight-domain fail-closed fixtures, all named Gmail and generic regressions, TypeScript, targeted lint, source/diff assertions, and authenticated post-settle browser proof pass across cold load, `1Y`, `1M`, restored All indexed, Custom, focus refresh, exact Review Groups handoff, return, and six-second final hold. Accepted Gmail values remain `5,144 / ~259,422 / 1,999 / 17 / 5`, the focused recommendation remains `915 / 75,844`, request families are unchanged, failed requests/console errors/page errors/`409` churn are zero, and no settled polling occurred.
- Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE2_REVIEW_PACKET.md`. Human Review decision: `ACCEPT` on 2026-09-01. Phase 3 Slice 2 is closed.
- Recovery Contract: `CHANGELOG.md` -> `September 1, 2026 — ACE-048 Framework-First Decision Workspace Phase 3 Slice 2 Accepted`.
- The Human-acceptance milestone incremental is verified at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - ACE-048 framework-first Decision Workspace Phase 3 Slice 2 Human acceptance)` with `1,136` files, exact worktree source, normal project-scoped seven-day pruning, and `KEEP` exemption.
- The separately gated next recommendation was a bounded Phase 3 Slice 3 discovery/target-lock pass for the lifecycle-heavy Sender Overview read-facade boundary; Oliver's approval below activated that discovery only.
- Oliver replied `accept` to the explicit Phase 3 Slice 3 discovery decision on 2026-09-01. That decision authorized the now-completed bounded read-only Sender Overview discovery/target-lock pass only; it did not authorize source/UI/runtime implementation, new requests or polling, provider/data/database/artifact/index/publication mutation, route changes, commit, push, or deploy.
- Slice 3 discovery is complete at `inferred_target_lock`. The exact shared path is `operations/layout.tsx` -> existing presentation/read providers -> the `14,706`-line `/agents/[id]/operations/review` page -> existing Gmail cached/network `sender_workspace`, `sender_overview_window`, and `sender_distribution` helpers -> shared Time Context, Distribution, sender-row, and in-place Decision Mode surfaces. The page remains the sole lifecycle owner; the Gmail adapter remains the provider/cache/request translator; direct Gmail destination mutation is explicitly excluded and frozen.
- The stable framework slot remains `item_overview`; the generic read-model noun is `subject` with adapter-owned domain titles/nouns. The design contract preserves multiple sources, workflows, roles, provenance, freshness, quality, evidence, pagination, scope/window identity, and fail-closed metric compatibility across Gmail, support, real estate, crypto, paid media, bookkeeping, tax, and purchasing/shipping.
- Authoritative discovery handoff: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE3_SENDER_OVERVIEW_DISCOVERY_HANDOFF.md`. Authoritative execution-ready six-file brief: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE3_SENDER_OVERVIEW_PM_BRIEF.md`. Implementation requires the separate exact decision `ACCEPT PHASE 3 SLICE 3 IMPLEMENTATION`.
- Oliver replied `accept` directly to the explicit Phase 3 Slice 3 implementation gate on 2026-09-01. The exact six-file implementation and required verification loop are authorized; no seventh source file, route/request/cache/poll/lifecycle change, provider/data/database/artifact/index/publication mutation, later slice, commit, push, or deployment is authorized.
- The required pre-implementation incremental is verified at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - Pre ACE-048 framework-first Decision Workspace Phase 3 Slice 3 Sender Overview r)` with `1,138` files, exact worktree source, detached HEAD `8f8e4d670cabdd21459c0b4b8e502d16e272afc0`, `50` changed paths at backup time, normal project-scoped seven-day pruning, and all `23` discovered `KEEP` archives preserved.
- The exact six-file implementation is complete. The generic framework now defines validated Item Overview subject/activity/evidence/metric/provenance semantics and an adapter read service; the Gmail adapter wraps the existing workspace/window/distribution/authority/activity-series helpers; the shared review page retains current lifecycle ownership and provider-projected compatibility DTOs. No seventh source file, route, provider/data/database/artifact/index/publication state, request family, cache owner, poller, commit, push, or deployment changed.
- Verification result: `ACCEPT / HIGH`. Eight-domain/static fixtures, required generic/Gmail regressions, TypeScript, targeted lint, diff hygiene, and exact allowlist proof pass. Authenticated post-settle Playwright preserves Offer campaign All indexed plus `1Y` / `1M` / `1W` / `1D` / Custom, the composite promotional-cycle route, both Analysis Rail tabs, rows/pagination, Decision Mode evidence and full preview, exact close/return, and the accepted editorial-to-Review-Groups redirect. Browser errors, overlays, new request families, polling, provider mutations, and `409` churn are zero.
- Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE3_REVIEW_PACKET.md`. Oliver returned Human Review `ACCEPT` on 2026-09-01; Phase 3 Slice 3 is closed.
- Recovery Contract: `CHANGELOG.md` -> `September 1, 2026 — ACE-048 Framework-First Decision Workspace Phase 3 Slice 3 Accepted`.
- The Human-acceptance milestone incremental is verified at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - ACE-048 framework-first Decision Workspace Phase 3 Slice 3 Human acceptance)` with `1,574` files, exact linked-worktree source, detached HEAD `8f8e4d670cabdd21459c0b4b8e502d16e272afc0`, `51` changed paths at backup time, normal project-scoped seven-day pruning, and all `23` `KEEP` archives preserved.
- Oliver replied `accept` to the next-task recommendation on 2026-09-01. This authorizes a bounded read-only Phase 3 completion audit of remaining Decision Mode and Decision Management read boundaries only. Authoritative runtime artifact: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_COMPLETION_DISCOVERY_HANDOFF.md` (`created`; authoritative for the new task).
- Repository-first discovery completed without runtime contact. Decision Mode already consumes the accepted generic Item Overview/evidence services for its main read lifecycle; the remaining direct shared read seam is `fetchGmailDecisionManagementSummary`, called by both the review page and Decision Management. The existing helper's `15s` cache, per-key single-flight, GET request, bounded server reads, and all existing provider writes remain frozen.
- The exact six-file Slice 4 target lock is authoritative at `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE4_DECISION_MANAGEMENT_READ_FACADE_PM_BRIEF.md` (`created`; authoritative execution contract after separate approval). It introduces only a selected-adapter managed decision-state read service and eight-domain fail-closed fixtures; Gmail destination commit and Management push/restore/reopen remain explicit provider operations for separately planned Phase 4 capability/action work.
- Oliver replied `accept` directly to the explicit Slice 4 implementation gate on 2026-09-01. This authorizes only the exact six-file managed decision-state read-facade implementation and required verification loop; Phase 4 capability/action behavior, provider/data/database/artifact/index/publication mutation, action invocation, new request/poll/cache/lifecycle behavior, commit, push, and deployment remain unauthorized.
- The required pre-implementation incremental is verified at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-01/ai-agent-platform-worktree-8642 (incremental 1 September 2026 - Pre ACE-048 framework-first Decision Workspace Phase 3 Slice 4 managed decision-)` with `1,579` files, exact linked-worktree source, detached HEAD `8f8e4d670cabdd21459c0b4b8e502d16e272afc0`, `53` changed paths at backup time, normal project-scoped seven-day pruning, and all `23` `KEEP` archives preserved.
- Slice 4 implementation and the required verification loop completed inside the exact six-file source allowlist. The selected Decision Workspace adapter now owns the managed decision-state read seam; Gmail retains the accepted helper, `15s` cache, per-key single-flight, request family, provider actions, and lifecycle behavior. Static/generated fixtures, regressions, TypeScript, targeted lint, diff/allowlist checks, and the default production build pass. Exact-origin authenticated post-settle Playwright proof passes the `14`-row State Transition Matrix at verifier `ACCEPT / HIGH`, with accepted Management and Review truth, zero provider writes, zero settled polling, zero browser errors, and zero `409` churn. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE3_SLICE4_REVIEW_PACKET.md` (`created`; authoritative verifier/Human Review packet). A later optional production-server repeat was blocked before UI evaluation by the existing external Supabase connection and is recorded as non-admissible diagnostic evidence, not a product failure.
- Oliver clarified on 2026-09-01 that earlier general approval was not Human Review. That clarification remains preserved and prevents inferred acceptance.
- At Oliver's request, Codex re-exercised the minimal visible check with the authoritative Playwright skill. Management settled to `17 / 3 / 2 / 10 / 0 / 2`; Review settled to `108 / 1 / 107 / 1,030`; Decision Mode opened with evidence and closed back to the exact route; provider actions/writes, `409` responses, settled console errors/warnings, duplicate-key warnings, and runtime overlays were zero. Supplemental evidence: `output/playwright/ace-048-phase3-slice4-delegated-review/`.
- Oliver then returned explicit Human Review `Accept` on 2026-09-02. Slice 4 and Phase 3 are `HUMAN-ACCEPTED / CLOSED`.
- Recovery Contract: `CHANGELOG.md` -> `September 2, 2026 — ACE-048 Framework-First Decision Workspace Phase 3 Slice 4 Accepted`.
- The explicit Human-acceptance milestone incremental is verified at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-02/ai-agent-platform-worktree-8642 (incremental 2 September 2026 - ACE-048 Phase 3 Slice 4 explicit Human Review acceptance after delegated Playwri)` with `2,163` files, exact linked-worktree source, detached HEAD `8f8e4d670cabdd21459c0b4b8e502d16e272afc0`, `54` changed paths at backup time, normal project-scoped seven-day pruning, and all `KEEP` archives preserved.
- Oliver returned `ACCEPT PHASE 4 DISCOVERY` on 2026-09-02. This authorizes the bounded read-only capability/action discovery and target-lock pass captured in `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_DISCOVERY_HANDOFF.md` (`created`; authoritative runtime context). Phase 4 implementation, action invocation, provider/data/database/artifact/index/publication mutation, new requests/polling/lifecycle behavior, commit, push, and deployment remain unauthorized.
- Phase 4 discovery is complete. Repository tracing proved that the static framework/Gmail action contracts already own policy metadata, while the live shared pages still hard-code Decision Mode action presentation and Management action eligibility. Current Gmail destination, archive, restore, verification, reopen, approval separation, cache/reload, and lifecycle owners remain explicit and frozen.
- The exact target-locked first-slice brief is `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE1_ACTION_PRESENTATION_PM_BRIEF.md` (`created`; authoritative execution contract after separate authorization). It permits only deterministic adapter-selected action presentation and fail-closed state-derived availability through an exact eight-file allowlist, with zero new request, cache, polling, model-call, provider-action, or lifecycle behavior. Implementation awaits `ACCEPT PHASE 4 SLICE 1 IMPLEMENTATION`.
- Oliver separately requested that accepted work reach GitHub as needed. Read-only publication discovery is recorded in `docs/00_control_plane/runtime/ACE-048_GIT_PUBLICATION_SAFETY_AUDIT.md` (`created`; authoritative publication-safety context). The current detached worktree has `23` modified tracked files and `32` untracked entries; the named recovery branch is checked out in another independently dirty worktree over the same `HEAD`; local `main` and `origin/main` match two commits behind. No broad commit/push is authorized or safe until `ACCEPT GIT PUBLICATION PREPARATION` produces an exact staged-path/provenance packet.
- Oliver accepted the recommended sequence and explicitly established the standing policy that Human-accepted stable fixes, slices, phases, and meaningful milestones receive both a verified backup and exact-scope normal non-force GitHub publication. Root `AGENTS.md`, canonical PM context, `CHANGELOG.md`, and the active control-plane indexes were updated. Accepted work may not remain only in a dirty worktree, detached checkout, or local branch; secret/generated/auth/unrelated state must be excluded and live remote parity proved.
- This decision authorizes the current accepted-baseline publication preparation and push after the exact packet passes, followed by the exact eight-file Phase 4 Slice 1 implementation after the governed backup/publication checkpoint. It does not authorize force operations, deployment, provider/data mutation, approval/execution-facade integration, later Phase 4 slices, or lineage deletion.
- Accepted-baseline GitHub preservation PASS: exact `61`-path accepted-content commit `eef994f8a0a668164d68089ecffd4c5efe70b37f` plus publication-proof commit `1a04314c284a027cce6ebfde155cf6c35863855a` are published normally on `agent/ace-048-accepted-framework-baseline`; draft PR `https://github.com/cvn74oliver/automata/pull/3` targets `main`; local, remote-tracking, live remote, and PR head OID match `1a04314` with `0 / 0` divergence. `main` was not moved and no merge/deploy/force/lineage deletion occurred.
- Phase 4 Slice 1 Human acceptance and publication — 2026-09-02: Oliver accepted the recommended verifier-backed result after noting that Gmail should remain visually familiar and asking Codex to proceed if confident. The exact eight-source-file implementation remains `ACCEPT / HIGH`: pure action/availability metadata and the selected Gmail adapter own Decision Mode labels/order/compatibility values and Management action eligibility; shared pages retain lifecycle and invoke only the byte-identical existing handlers. Final proof preserves simple `108 / 1 / 107 / 1,030`, composite `43 / 0 / 43 / 132`, Management `17 / 3 / 2 / 10 / 0 / 2`, exact Decision controls, `3 / 0 / 15` Management controls, zero action POSTs, zero failed requests, zero `409` churn, zero settled polling, and zero console/page errors. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE1_REVIEW_PACKET.md`. Recovery Contract: `CHANGELOG.md` -> `September 2, 2026 — ACE-048 Framework-First Decision Workspace Phase 4 Slice 1 Accepted`. Verified acceptance snapshot: `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-02/ai-agent-platform-worktree-8642 (incremental 2 September 2026 - ACE-048 Phase 4 Slice 1 Human acceptance)` with `2,409` files, exact worktree/branch/HEAD identity, `15` changed paths, normal seven-day pruning, and `KEEP` preservation. Accepted-content commit `9e27a122118215c11a49ce7f8b6a567adcae1ee8` was pushed normally without force; local, remote-tracking, live remote, and draft PR #3 head matched it before this final docs-only proof commit. Merge, deployment, provider/data mutation, force operations, and later Phase 4 work remain unauthorized.
- Next Phase 4 discovery authority — 2026-09-02: Oliver approved a fresh bounded Project Manager task to discover and target-lock the next capability/action slice. The task is read-only and must return an operator-readable recommendation plus an exact execution-ready PM Brief or candidate-grounded blocker. Source/runtime implementation, provider action, approval/execution-facade integration, data/database/artifact/index/publication mutation, new request/poll/cache/lifecycle behavior, commit, push, merge, deployment, force operations, and lineage deletion remain unauthorized.
- Phase 4 Slice 2 Approval Queue truth discovery — 2026-09-02: repository-only tracing proved that `operations/approvals/page.tsx` is already under the accepted selected action adapter but still owns Gmail-specific queue vocabulary and projects only the first entry of `proposed_actions[]`; the frozen execute endpoint later iterates the complete bundle. The exact four-file target lock is `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE2_APPROVAL_QUEUE_TRUTH_PM_BRIEF.md` (`created`; authoritative runtime context and execution contract after separate authorization). The proposed slice is limited to complete ordered-bundle presentation, deterministic adapter vocabulary, source/workflow/role/provenance retention, and fail-closed controls; the existing handler bodies, endpoints, event history, provider operations, requests, cache, polling, and lifecycle remain frozen. Discovery also recorded separate candidate-grounded runtime-integrity issues in approval-decision/result scoping, latest-decision resolution, request existence, and guarded-mode visibility; those findings prohibit a generalized execution-safety claim but do not expand Slice 2. Implementation awaits `ACCEPT PHASE 4 SLICE 2 IMPLEMENTATION`; no source/runtime implementation, backup, commit, push, merge, deployment, provider/data mutation, or endpoint correction is authorized.
- Phase 4 Slice 2 implementation authority — 2026-09-02: Oliver returned the exact decision `ACCEPT PHASE 4 SLICE 2 IMPLEMENTATION`. This authorizes the governed pre-implementation recovery point and then only the four locked source files plus the required implementation/verification loop. A fifth source file, runtime endpoint correction, provider/data mutation, action invocation during proof, new request/cache/poll/lifecycle behavior, commit, push, merge, deployment, force operation, and lineage deletion remain unauthorized.
- Phase 4 Slice 2 implementation and verifier gate — 2026-09-02: the governed pre-implementation snapshot completed and the exact four-source-file Approval Queue truth projection is implemented. Eight-domain/full-bundle/fail-closed fixtures, Gmail regressions, TypeScript, exact-file lint, diff/allowlist checks, byte-identical approve/execute handlers, frozen runtime/API hashes, and authenticated canonical post-settle Playwright proof pass at `ACCEPT / HIGH`. Final UI truth preserves `3 / 0 / 8 / 46`, valid Gmail controls, and the existing read family with zero action POSTs, zero failed final-run requests, zero `409` churn, and zero console errors. One production build attempt is explicitly blocked by the established local Turbopack stall under `transitional_self_verification`. Review packet: `docs/00_control_plane/runtime/ACE-048_FRAMEWORK_FIRST_DECISION_WORKSPACE_PHASE4_SLICE2_REVIEW_PACKET.md`. Human Review remains pending; commit, push, merge, deployment, runtime hardening, provider/data mutation, force operation, and lineage deletion remain unauthorized until the applicable later gate.
- Phase 4 Slice 2 Human acceptance — 2026-09-02: Oliver returned explicit `accept` at the Human Review decision gate. Recovery Contract: `CHANGELOG.md` -> `September 2, 2026 — ACE-048 Framework-First Decision Workspace Phase 4 Slice 2 Accepted`. This authorizes the governed Human-acceptance backup and exact-scope normal non-force GitHub publication under the standing accepted-milestone policy. It does not authorize merge, deployment, endpoint/runtime hardening, provider/data mutation, force operation, later Phase 4 implementation, or lineage deletion.
- Phase 4 Slice 2 Human-acceptance recovery — 2026-09-02: the governed snapshot completed and was verified at `/Users/olivercarlin/Documents/Backups/September 2026/2026-09-02/ai-agent-platform-worktree-8642 (incremental 2 September 2026 - ACE-048 Phase 4 Slice 2 Human acceptance)` with `2,434` files, exact worktree/branch/pre-publication-HEAD identity, `11` accepted changed paths, normal seven-day project-scoped pruning, `KEEP` preservation, and standalone restore guidance. Exact-scope normal non-force Git publication is next.
- Phase 4 Slice 2 GitHub preservation — 2026-09-02: accepted-content commit `00f8c6e87ce49cc6884c1fea5520145bce785a13` containing the exact `11` accepted source/control-plane paths was pushed normally without force to `agent/ace-048-accepted-framework-baseline`. Local HEAD, remote-tracking, live remote, and open draft PR #3 head matched `00f8c6e` with `0 / 0` divergence before this final docs-only propagation. PR: `https://github.com/cvn74oliver/automata/pull/3`, base `main`. Merge, deployment, runtime endpoint hardening, provider/data mutation, force operation, later Phase 4 work, and lineage deletion remain unauthorized.
- PR #3 main integration — 2026-09-02: Oliver explicitly authorized GitHub's merge-commit method and accepted automatic Vercel consequences. GitHub marked PR #3 `MERGED` at `2026-09-02T08:19:00Z` and created `c766da06709e3df266dfc9146395459910fadca7` from base parent `49f863c055787ff0a0eb696a76d4609dd3d7568f` and accepted head parent `ccf2c27ef92511d7b611e8621d5840e00efad185`. Merge tree `c9f506cdadf3e004852c626b5627149020c27a5c` equals the accepted head tree; local `main`, `origin/main`, and live GitHub `main` matched after synchronization. The source branch and named recovery refs remain intact; no squash, rebase, force operation, branch deletion, or recovery-lineage deletion occurred.
- Automatic Vercel consequence — 2026-09-02: both `main@c766da0` deployments were production-targeted and reached `READY`: `ai-agent-platform` deployment `dpl_82RAGpjNHCbd1kKbqoWboDknKfcc` and `ai-agent-platform-e6cc` deployment `dpl_g24ouwbnDcHfC3iHyda3VTHDHhSc`. Both GitHub status contexts are `success`. Delayed runtime telemetry surfaced two `GET /api/runtime/gmail-memory` `500` errors on `dpl_82RAGpjNHCbd1kKbqoWboDknKfcc` at `08:30:25Z` and `08:30:28Z` because `supabaseKey is required`; the paired `e6cc` merge deployment and both `main@3817137` docs-closeout deployments showed no error/fatal logs in the observed window. The missing environment key and duplicate-project/canonical-project question are routed to separate PM adjudication. No direct Vercel deploy, promotion, rollback, domain, environment, or configuration mutation was performed or authorized.
- PM operating-procedure propagation — 2026-09-02: Oliver explicitly authorized the protected Project Manager Activation & Turnover Protocol edit. Completed one-time task archival is now restricted to fully propagated, decision-free, checkpoint-free, approval-free, blocker-free Automata tasks; standing long-term role tasks and every active, blocked, or awaiting-decision task remain open. Archival remains reversible, discoverable/restorable, and owned only by this project's PM; cross-project archival is prohibited by default.

Checkpoint Status: none. Slice 2 acceptance, PR #3 merge truth, automatic deployment results, delayed runtime-error evidence, and the project-scoped task-archival procedure are propagated. The Vercel environment defect is an explicit separate PM item; no unpropagated merge-closeout state remains.

### [ACE-048] Automata Revival — Security and Rebaseline

Date: 2026-08-15
Owner: Oliver / Project Manager
Status: Active
Propagation Owner: Control Plane Architect
Problem Class: mixed but decomposed — index freshness, stale semantic-artifact truth, Pressure Trend bounds, and unintegrated artifact-backed Cleanup Groups / sender-distribution lineage
Execution Mode: `transitional_self_verification`
Baseline Acceptance: `ACCEPT` — Oliver, 2026-08-15

Human Review RETURN and approved repair contract — 2026-08-21:
- Oliver's exact live route `http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/intelligence` rendered no cleanup groups after `Refresh cleanup analysis`; the page later became non-scrollable on the unscoped Decision Mode route.
- Read-only Supabase proof shows the last known-good published artifact `full-mailbox-20260415024237593` still exists with `13` cluster-summary rows and one Mailbox Intelligence snapshot. The later candidate `full-mailbox-20260815081528697` failed and was reclaimed as stale; that failed candidate must not invalidate the immutable published artifact.
- Main commit `866c549` introduced a publication-readiness selector that classifies `build_status=failed` / `freshness_state=refresh_failed` as globally unavailable even when a valid `published_version` remains. The same terminal-unavailable interpretation exists across runtime hydration and artifact-backed workspace reads. This is the locked mechanism for the blank Intelligence surface.
- The last known-good published artifact must remain renderable across Mailbox Intelligence, Cleanup Groups, Sender Overview, Sender Distribution, sender rows, Time Context, and Decision Mode. Candidate/refresh failure must be surfaced separately as freshness/refresh status and must never silently replace or hide published truth.
- No semantic rebuild is authorized in this repair. A future full Supabase semantic rebuild is a separate, multi-hour candidate-only operation: test and verify the code and artifact contract first, preserve the current publication, require explicit Oliver authorization, publish only after integrity/parity proof, and retain rollback.
- `Refresh cleanup analysis` must not be used as a recovery loop. Its all-indexed request family and polling must be bounded/single-flight, must not scan raw mailbox rows at request time, and must not create an unattended rebuild or repeated heavy backend fanout.
- Scroll freeze mechanism is independently locked: `mode=decision` can set `document.body.style.overflow='hidden'` before the page's no-selected-cluster early return, so no overlay renders to own/release the lock. Body scroll may be locked only while a visible Decision Mode overlay is actually mounted and must be restored on every exit/navigation path.
- Oliver approved the two-slice repair plan: (A) published-artifact fallback plus bounded refresh load, then (B) Decision Mode scroll-lock lifecycle. Each slice requires targeted correction proof; final acceptance requires post-settle Playwright and linked-surface parity, then an explicit guided Human Review.
- Git topology is preserved but not consolidated: current main is `64632b3`; cleanup authority remains on local/origin branch `cleanup-taxonomy-rebuild` at `c690dff`. The former dedicated cleanup checkout is absent. Cleanup is not an ancestor of main and was not fully merged; manual ports exist, but remaining semantic integration and sender-distribution acceptance are still open. No cleanup branch deletion is authorized.

Correction execution and bounded verifier proof — 2026-08-21:
- Implemented the approved published-fallback selector, load guard, cached-blank hydration recovery, and Decision Mode scroll ownership corrections on uncommitted main. No database, Gmail, publication, candidate, rebuild, merge, commit, push, or deployment mutation occurred.
- Published `full-mailbox-20260415024237593` is again usable while failed candidate state remains visible separately. A valid published fallback cannot enqueue background semantic refresh; the manual UI settles without repeated polling.
- Fresh authenticated Mailbox Intelligence and Cleanup Groups routes render the preserved semantic artifact. Cleanup Groups exposes four expanded lanes and one optional lane with `4,881` cleanup-scope senders; semantic card/count proof is recorded in the correction bundle.
- Unscoped Decision Mode remains scrollable. A valid protected Decision overlay locks the body only while mounted; a real backdrop close removes the overlay and restores scrolling.
- Verification: TypeScript PASS; targeted lint `0` errors / `19` pre-existing warnings; diff check PASS; isolated fresh Next/Turbopack build PASS (`63` routes); five-row browser State Transition Matrix PASS; Verification Confidence HIGH.
- Proof bundle: `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-main-cleanup-restore-correction/correction-proof.json` and numbered screenshots `01` through `07`. Artifact status: created/updated, ignored local correction proof, authoritative for this bounded correction stage.
- Open truth remains: published semantic data is older than the current `244,628`-row index; Pressure Trend remained loading; protected Sender Distribution and sender rows remain not ready. This pass is not overall Operations acceptance and has no Accepted Fix or Recovery Contract yet.
- Live integration disposition supersedes the stale path counts: `84` cleanup-changed paths, `45` byte-identical on main, `39` disposition paths (`8` cleanup-unopposed, `31` both-changed-differently). Historical `17` conflict / `5` auto-merge counts must be recomputed before integration execution.
- Human Review decision: `REJECT`. Oliver's exact authenticated Intelligence route returned to the blank cleanup state after ordinary click-through/navigation while the UI simultaneously showed background-refresh and `Syncing…` states. Temporary correction proof is superseded as acceptance evidence.
- `repeated_failure_visible_proof_mode` is active. Existing runtime diffs are prior-attempt diffs and may not be treated as the next correction. The next pass is read-only diagnosis followed by PM Root Cause Execution Translation, a bounded new correction, and visible navigation-loop re-verification. Integration, Accepted Fix, Recovery Contract, merge, rebuild, and database mutation remain blocked.
- Diagnosis/translation: a persisted zero-cluster client snapshot is admitted as ready runtime data even when indexed/published truth means zero groups are non-authoritative. The false cache is rendered immediately, while the bounded live read can repopulate about `20s` later. The new correction is locked to `OperationsRuntimeContext.tsx`: reject, evict, and never persist transient zero-cluster snapshots; retain any prior non-empty snapshot; otherwise show loading/error until valid published data arrives. No new polling or backend action.
- RETURN correction/proof: `OperationsRuntimeContext.tsx` now rejects, evicts, and never persists transient zero-cluster snapshots while retaining an already mounted non-empty snapshot. Exact authenticated correction proof PASS/HIGH: cold Intelligence showed honest loading rather than false terminal-empty copy, settled to the published semantic groups, Cleanup Groups remained populated, and the return to Intelligence was immediately ready and scrollable. TypeScript, targeted lint, diff check, and isolated Next/Turbopack build (`63/63`) pass. New visible proof is in `output/playwright/ace048-main-cleanup-restore-return/`; no database, Gmail, publication, rebuild, polling, merge, commit, push, or deployment mutation occurred.
- Status: `Awaiting Human Review Decision`. This correction proof does not create an Accepted Fix or Recovery Contract. Integration and full linked-surface closeout remain blocked until Oliver tests the same navigation loop in the existing Chrome session and returns `ACCEPT`, `REJECT`, `BLOCKED`, or `RETURN_TO_PM`.
- Human Review incident RETURN — 2026-08-21: Oliver's exact authenticated Intelligence route entered a catastrophic `/api/integrations/gmail/inbox-analysis` request waterfall with repeated `AuthSessionMissingError: Auth session missing!`; the page remained loading and the dev server consumed approximately `96%` CPU and `2.4 GB` memory. PID `57130` was terminated, port `3000` was verified closed, and no further request pressure can continue until an explicitly controlled restart.
- Locked mechanism: the `mailbox_pressure_trend` effect stores a fresh error object after a failed request while depending on that same resolved state object. The error update immediately retriggers the effect for the identical request key, producing an unbounded failure/request/render loop with no polling interval. This is a client request-ownership defect, not evidence of Supabase data corruption and not authorization for a semantic rebuild.
- Root Cause Execution Translation: modify only `web/src/app/agents/[id]/operations/intelligence/page.tsx`; add a key-owned `loading` state, suppress every non-idle same-key re-entry, and permit a new request only when the semantic request key changes or the route remounts. Authentication and other terminal failures remain visible for that key. Do not change the API route, Supabase, Gmail, artifacts, publication state, semantic groups, or worktree integration.
- Locked load contract: `mailbox_pressure_trend` may issue at most one request per new window/cache/cluster key; after an authentication failure the steady-state request count is zero. No interval polling, automatic retry, raw mailbox scan, artifact build, or database write is allowed. Restart remains blocked until static correction proof passes; runtime proof must include a bounded request trace and prove no auth waterfall.
- The prior RETURN correction proof is rejected as overall acceptance evidence. No Accepted Fix or Recovery Contract exists for this incident. Cleanup-lineage integration remains blocked.
- Correction execution/proof — 2026-08-21: the one-file Pressure Trend request-ownership correction is implemented in `web/src/app/agents/[id]/operations/intelligence/page.tsx`. It adds key-owned loading state and a once-per-semantic-key attempt guard; error/ready commits cannot retrigger the same key, while a real key change remains requestable once.
- Static proof PASS: non-incremental TypeScript, targeted ESLint with `0` errors / `0` warnings, `git diff --check`, and fresh Next production build with `63/63` routes.
- Exact authenticated route proof PASS/HIGH: cold All indexed issued exactly one deferred `mailbox_pressure_trend` request (`200`, `41,331 ms`, `57` yearly buckets); `All indexed -> 1M` issued exactly one additional interactive request (`200`, `34,448 ms`, `30` daily buckets); a final `20s` steady-state window retained exactly two total inbox-analysis POSTs. Zero retries, polling, `409`, console errors, warnings, raw mailbox reads, rebuild, or database mutation occurred.
- Human-visible proof: 1M settled to `Mar 14, 2026 - Apr 12, 2026`, daily bars, and `Pressure is steady`. The first All-indexed screenshot is route-ready but pre-Pressure-Trend-response and is explicitly diagnostic for that chart; it is not misrepresented as post-chart-settle proof.
- Proof bundle: `output/playwright/ace048-pressure-trend-auth-storm/correction-proof.json` plus `01-all-indexed-post-settle.png` and `02-1m-post-settle.png`. Artifact status: created/updated, ignored local verifier proof, authoritative for this bounded request-storm correction stage. The refreshed auth state remains separately ignored under `web/.playwright-cli` and was not read or copied into the proof bundle.
- Status: `Awaiting Human Review Decision` for the bounded request-storm correction. No Accepted Fix or Recovery Contract exists yet. The separate dev-only `AutomataLogo` SVG hydration mismatch remains open and was not part of this load-safety correction. Cleanup-lineage integration remains blocked until acceptance and the prior cleanup-group navigation surface is rechecked.

Human Review integration return and corrected governing truth — 2026-08-21:
- Oliver accepted that the same-key request storm is contained, but returned the broader Operations surface to PM after direct review. This is not an Accepted Fix for Pressure Trend, Cleanup Groups, Sender Distribution, or overall Operations.
- Smart Sync and semantic publication are separate lifecycles. The Gmail index is current through `2026-08-15` at `244,628` rows, while the public semantic artifact remains the April publication `full-mailbox-20260415024237593`. Therefore a 1M/Custom Pressure Trend capped at `2026-04-12` is stale-artifact truth, not proof that August Smart Sync failed.
- All-indexed Pressure Trend rendered `57` yearly buckets beginning in `1970` although historical proof places the first indexed message in December 2022. The accepted correction contract must reject epoch-zero/invalid lower bounds and trim leading empty buckets to the authoritative indexed span; exact persisted bucket origin remains to be proven before code execution.
- The current main Cleanup Groups screen is not the completed child-group design. It renders session-only derived review units and explicitly preserves the broad parent group; this does not satisfy the accepted first-click decomposition contract.
- The accepted Cleanup Groups contract remains: artifact-backed review-unit identity, first-click material narrowing, clear parent/child reconciliation, preferred `50–300` senders, hard maximum `400`, and browser proof. Marketing Lane A was accepted and Lane B was partially implemented, but Lane B never closed and Lane C never started.
- Historical candidate validation proves useful Marketing units existed, while Backlog, Protected/Trusted, and Unresolved still contained units above the `400` hard maximum. Those oversized units require further decomposition or explicit non-surfacing; they must not be presented as finished child groups.
- Branch topology correction: there is one preserved divergent feature branch, `cleanup-taxonomy-rebuild` at `c690dff`, plus `main`; there are not two independent surviving feature worktrees. Main is the integration destination and later runtime/artifact authority. The cleanup branch is mandatory feature-authority evidence for artifact-backed cleanup units, canonical identity/presentation, Marketing review entry, and sender-distribution behavior.
- Oliver approved a preservation-first integration program with Human Review checkpoints throughout. Before implementation, perform one bounded read-only inspection of the published artifact review-unit plans, then lock the current semantic-integration manifest and packet order. No raw Gmail scan, semantic rebuild, publication mutation, blind merge, or database write is authorized.

Published artifact review-unit-plan audit — 2026-08-21:
- The bounded read-only audit is complete. Published artifact `full-mailbox-20260415024237593` already contains schema-version-2 `semantic_rollup.review_unit_plan` metadata with stable `unit_id` values. A semantic rebuild is not required to recover the first child-entry packet.
- Marketing is execution-ready for bounded child entry: its `857`-sender parent reconciles exactly to five artifact-backed units of `347`, `218`, `160`, `76`, and `56` senders. Every unit is below the accepted `400` hard maximum.
- Backlog, Protected/Trusted, and Unresolved are not child-complete. Their current plans contain oversized units of `487`, `1,660`, and `1,110` senders respectively. Those units require a later decomposition contract or explicit non-surfacing decision; they are excluded from the first packet.
- The current main runtime parser/presentation contract lags the published schema. The cleanup branch contains the missing basis/source-kind/unit-role compatibility and the accepted Marketing unit-entry behavior, but its hot files must be manually integrated with later main runtime truth rather than copied or Git-merged wholesale.
- First integration packet is locked to Marketing published child entry only: artifact-backed five-unit chooser, no broad Marketing parent shortcut, stable route identity, exact count reconciliation, and a narrow Playwright-plus-Oliver Human Review gate. Sender Distribution and the three oversized parents remain later packets.

First isolated Marketing packet verifier return — 2026-08-21:
- The isolated candidate Cleanup Groups root passes the locked chooser contract: the Marketing parent reconciles visibly to the five published units `347 / 218 / 160 / 76 / 56`, exposes no broad-parent entry, and leaves the other parent controls intact.
- The exact Deals child route fails and is not eligible for Human Review. The focused semantic workspace request returns `347` total senders with a bounded page slice, but the rendered child workspace commits `0`, displays placeholder totals, and offers a forbidden broad `Review Full Group` escape.
- A separate broad-parent deferred workspace family then repeats and produces `cooldown_active` `409` guard churn. This is a client request-ownership/commit defect; it is not evidence that the published unit plan is wrong and does not authorize a rebuild, publication change, raw Gmail scan, or database mutation.
- Root Cause Execution Translation is restricted to the current review hot file. A valid published Marketing child must own the visible workspace lifecycle, commit the focused response, retain the published full-unit total, prevent broad-parent fallback, and reach zero steady repeated requests. The chooser/root implementation remains preserved.
- Before-correction visible proof: `output/playwright/ace048-marketing-integration/candidate/02-deals-child-failure.png`. Status remains verifier `REJECT`; no Accepted Fix or Recovery Contract exists and Human Review has not started.

Marketing child request-ownership correction proof — 2026-08-21:
- The bounded review-page correction is implemented in the isolated main-derived candidate. A valid published Marketing child now owns the visible lifecycle immediately; mutable effect identity cannot cancel the focused response or admit a broad-parent fallback.
- Exact Deals/Discounts proof PASS/HIGH after settle: `347` unit senders, `3` managed, `344` remaining, `39,036` focused supporting messages, `347` ranked Sender Distribution entries, and `12` visible rows on page `1 / 29`. The broad `Review Full Group` escape is absent.
- Load proof: exactly one focused `sender_workspace` plus one focused `sender_distribution` request, both `200`; zero `409`, polling, retries, console/page errors, or steady repeated heavy requests. The published artifact, Gmail index, Supabase data, and publication state were not mutated.
- Count reconciliation is now an explicit acceptance invariant for every integration packet: displayed parent counts must sum exactly to the global cleanup scope; every exposed child plan must sum exactly to its parent; chart totals, sender rows, pagination, and Decision Mode must identify the same active universe. Current root proof reconciles `4,881 = 857 + 1,003 + 1,118 + 1,844 + 59`, and Marketing reconciles `857 = 347 + 160 + 76 + 218 + 56`.
- Proof: `.codex/worktrees/ace048-marketing-integration/web/.playwright-cli/01-cleanup-groups-published-units-final.png` and `03-deals-child-corrected.png` — ignored/local candidate proof, non-authoritative until transferred and re-verified on main.
- Exact five-file transfer to current main is complete with byte parity; TypeScript, targeted zero-error lint, diff check, fresh `63/63` production build, root chooser, exact Deals overview, and Decision Mode entry pass.
- Main return-loop verifier `REJECT`: closing Decision Mode rewrites the explicit `subset_source=review_unit` / stable unit ID into legacy semantic-family/subtype query state. The visible `347` unit hero and distribution then disappear, so the active universe is no longer preserved across the required loop.
- First return-context correction was insufficient. Authenticated Chrome re-verification after the fresh production build again proved the exact visible failure: Decision Mode entered with stable `subset_source=review_unit` / `family:marketing_candidate_deals_discounts`, but Close rewrote to legacy semantic-family/subtype state and removed the `347`-sender unit workspace. Verifier verdict remains `REJECT / HIGH`; proof: `web/.playwright-cli/14-main-decision-chrome-final.png` and `15-main-deals-return-chrome-final.png`.
- Corrected root cause: the close handler resolves and stores the explicit published unit, but the later overview return-storage effect unconditionally treats any stored `semanticFocus` plus any subset route as a reason to replace that route with semantic-family/subtype state. That post-close effect, not the shared resolver, is the active identity-loss seam.
- Root Cause Execution Translation: change only the return-storage restoration condition in the current review hot file so a stored valid `review_unit` route cannot be replaced by semantic-focus fallback. Preserve legacy semantic restoration for non-review-unit contexts; add no requests, polling, backend work, artifact reads, or data mutation.
- First storage-condition re-verification remains `REJECT / HIGH`: Close now retains explicit `review_unit` identity plus the `347` hero/distribution, but the restoration effect also appends legacy semantic-family/subtype state and the visible sender workflow collapses to `0` loaded rows instead of page `1 / 29`. Visible proof: `web/.playwright-cli/18-main-deals-corrected-return.png`.
- Final Root Cause Execution Translation: inside that same return-storage effect, derive restored semantic focus as `null` whenever the authoritative stored route is `review_unit`; use that sanitized value for route construction, workflow scope, and restored focus state. Non-review-unit semantic restoration remains unchanged. Expected load delta remains zero.
- Second storage-effect re-verification remains `REJECT / HIGH`: the explicit unit, `347` hero, and `347` Sender Distribution remain after Close, but the shared review URL builder still emits legacy `semantic_family` / `semantic_subtype` alongside authoritative `subset_source=review_unit`. The contradictory route leaves the sender workflow at `0` rows instead of page `1 / 29`; visible proof: `web/.playwright-cli/21-main-decision-final.png` and the post-Close browser state captured in this governed flow.
- Corrected Root Cause Execution Translation: enforce route-identity exclusivity in the shared review URL builder. When `subsetSource === 'review_unit'` with a valid value, emit only the authoritative review-unit subset identity and suppress semantic-family/subtype query parameters. Preserve semantic-route emission for every non-review-unit path. Retain the existing storage-effect sanitization. Expected load delta remains zero requests, zero polling, and no backend/artifact/data mutation.
- Route-exclusivity correction proof is partial only. TypeScript, zero-error targeted lint, diff check, and fresh `63/63` production build pass. The authenticated root still reconciles `4,881`, the Deals unit settles to `347 / 3 / 344`, `39,036`, `347` ranked senders, and `12` rows on page `1 / 29`; Decision Mode enters with clean review-unit identity. Close now returns to a clean review-unit URL with no semantic-family/subtype parameters, but the sender workflow remains at `0` rows after the bounded settle window while hero and distribution truth stay `347`. Verifier verdict remains `REJECT / HIGH`; visible proof: `web/.playwright-cli/25-main-deals-final-return-reject.png`.
- Locked residual mechanism: the overview-mode transition effect unconditionally clears `semanticFocusWorkspaceState` whenever mode changes back to `overview`. The published review-unit request key remains unchanged across the in-place overlay, so the focused request effect does not rerun; a valid ready page is cleared into a permanent `0`-row presentation. This is a client state-lifecycle defect, not artifact corruption and not rebuild authority.
- Next Root Cause Execution Translation requires PM approval because the same shared review hot file has failed repeated return-loop corrections: preserve the ready focused review-unit workspace across Decision Mode overlay open/close when cluster and semantic request key are unchanged; reset only on a real cluster/request identity change. Preserve non-review-unit reset behavior, add no new request/retry/polling/backend work, and re-run the exact visible loop.
- Checkpoint: propagation complete; implementation is paused at the mandatory repeated-hot-file PM decision boundary. Human Review has not started; no Accepted Fix or Recovery Contract exists.

Cleanup Groups all-parent Human Review return — 2026-08-21:
- Oliver's direct review supersedes the earlier first-packet-only acceptance boundary and returns Cleanup Groups to PM. The current hybrid is not an acceptable finished design: Marketing exposes artifact-backed child units but no broad-parent entry, while Backlog, Needs Review, and Protected/Trusted still expose broad-parent entry without finished child-unit paths.
- Newly governing product truth: every visible cleanup parent must have an intuitive operator-facing parent name and a complete set of artifact-backed semantic or structural child units. The first meaningful action must enter a bounded child scope; oversized broad-parent entry is not the final workflow.
- Historical cleanup-lineage evidence supports true first-click narrowing, nested units, explicit overlap/partition rules, preferred `50–300` sender units, a `400` hard maximum, and exact parent/child reconciliation. Earlier documents left some structural parents eligible for direct-open classification; Oliver's 2026-08-21 Human Review resolves that ambiguity in favor of all-parent child decomposition.
- Marketing remains useful partial implementation evidence, not Cleanup Groups acceptance. Backlog, Needs Review/Unresolved, Protected/Trusted, Secondary, and Context must each receive an explicit parent-to-child contract, stable child identities, count reconciliation, entry behavior, and fallback/invalid-state rules before the Cleanup Groups surface can be accepted.
- Existing oversized published units (`487`, `1,110`, `1,660`) must not be relabeled as finished children. First determine read-only whether finer artifact-backed categories already exist in the preserved cleanup lineage or published artifact. If not, produce a separately approved candidate-only decomposition/rebuild plan; no semantic rebuild, Supabase mutation, publication change, or raw Gmail scan is authorized now.
- The unresolved Deals Decision Mode close defect remains a required bounded correction inside the Marketing packet, but the prior correction decision gate is superseded by this broader PM replan. No further hot-file execution begins until the revised all-parent sequence and proof matrix are captured.
- Mandatory acceptance invariant: visible parents sum exactly to the global cleanup universe; each parent's mutually exclusive children sum exactly to that parent; Sender Distribution, workflow totals, sender rows, pagination, Time Context, and Decision Mode must all identify the same selected child universe.
- Runtime artifact `docs/00_control_plane/runtime/ACE-048_MARKETING_PUBLISHED_CHILD_ENTRY_INTEGRATION_PM_BRIEF.md` is updated to `SUPERSEDED`; it remains historical/partial evidence and is no longer an authoritative standalone execution or closeout packet.

All-parent plan approval and execution activation — 2026-08-21:
- Oliver approved immediate implementation of the decision-complete `ACE-048 Cleanup Taxonomy and Worktree Consolidation` plan in the same governed flow.
- Authoritative runtime artifact: `docs/00_control_plane/runtime/ACE-048_ALL_PARENT_CLEANUP_TAXONOMY_CONSOLIDATION_PM_BRIEF.md` — CREATED and authoritative for pre-rebuild implementation.
- Locked product truth: every actionable parent is chooser-only; children are flat, intuitive, mutually exclusive, preferably `50–300`, never above `400`, and reconcile exactly to the parent; all parents reconcile to the global root; Historical/Context is informational with no review action.
- Locked data truth: materialize stable review-unit membership on sender workspace seed rows and use an indexed bounded lookup; preserve old-artifact compatibility; runtime navigation cannot derive a new taxonomy through live Supabase scans.
- Locked integration truth: preserve every dirty lineage, use main as destination, integrate hot files seam-by-seam in a main-derived candidate, and retain `cleanup-taxonomy-rebuild@c690dff` as mandatory feature-authority evidence.
- Current execution authorization stops before any live migration application, semantic candidate build, publication/pointer mutation, main promotion, push, deployment, or worktree/branch retirement. Those remain later explicit gates.
- Execution mode: `transitional_self_verification`; reasoning: HIGH; problem class locked as mixed artifact/publication, runtime behavior, UI rendering, and hot-file integration.
- Checkpoint Status: continuity checkpoint created; approved plan captured and immediate pre-rebuild execution active.

Pre-rebuild implementation and correction-proof checkpoint — 2026-08-21:
- Every dirty checkout/branch lineage is preserved on a named recovery ref; duplicate, superseded, unique, and required integration seams are recorded in `docs/00_control_plane/runtime/ACE-048_WORKTREE_LINEAGE_LEDGER.md`. No branch or worktree was deleted.
- A clean main-derived candidate implements the additive materialized review-unit membership contract, deterministic bounded partitioning and validators, generic actionable-parent child chooser, Context no-action behavior, exact child selection, stale-ID fail-safe, Decision Mode close/return retention, shared Sender Distribution child identity, and real Pressure Trend coverage bounds.
- The live additive migration is not applied. The current published artifact and active pointer are unchanged. No semantic build, Gmail reindex, Smart Sync, Supabase-wide scan, publication, local-main promotion, push, deployment, or retirement occurred.
- Correction proof PASS/HIGH: review-unit and Pressure Trend fixtures, non-incremental TypeScript, targeted lint, diff check, `63`-page production build, and authenticated post-settle Playwright on the canonical Deals child route. Deals reconciles `347` across hero, rows/pagination, and Sender Distribution; Decision Mode close preserves the exact unit and rows without a workspace refetch; stale IDs return safely to the chooser without broad-parent heavy requests.
- Published-April compatibility remains readable but intentionally does not expose oversized non-Marketing parents for review. Final all-parent taxonomy and latest-date chart acceptance require one separately approved candidate build and candidate-version verification.
- Status: Awaiting Decision. This flow is not closed. Oliver must explicitly approve or decline applying the additive migration and starting exactly one candidate artifact build from the existing indexed mailbox.
- Checkpoint Status: continuity checkpoint created; pre-rebuild work is propagated and paused at the approved decision boundary.

Framework-first rebuild prerequisite — 2026-08-23:
- Oliver reaffirmed platform architecture truth: Automata is the product; Gmail is the reference implementation and test adapter, not the framework boundary.
- Bounded code audit result: exact partitions, deterministic IDs, explicit remainders, bounded units, and count reconciliation are reusable concepts, but the current materializer directly owns Gmail sender fields, Gmail semantic dimensions, Gmail labels, Gmail compatibility IDs, and Gmail validation types.
- Root Cause Execution Translation: extract a domain-neutral review-unit engine with adapter-provided entity identity, ordered dimensions, labeling, stable-ID policy, and sizing policy; retain Gmail-only semantics and persistence in a Gmail adapter. Add generic-engine fixtures and preserve the existing Gmail fixture unchanged.
- Risk if skipped: future CRM, ads, finance, crypto, or other workspaces would need to copy Gmail code or inherit email-specific vocabulary, defeating the documented universal workspace architecture.
- No implementation, migration, build, publication, Smart Sync, reindex, push, main promotion, or deployment is authorized by this finding.
- Status: Awaiting Decision on the bounded framework-extraction correction. The long semantic build remains blocked until the framework-first condition passes.
- Checkpoint Status: continuity checkpoint created; newly discovered governing implementation truth is propagated before the next execution stage.
- Approval update: Oliver approved immediate bounded framework-first extraction on 2026-08-23. Authorized scope is generic engine, Gmail adapter, adapter/store contract, and generic plus Gmail compatibility fixtures only. The live migration and semantic build remain separately gated.
- Approved architecture refinement: the generic input is a declarative workspace workflow blueprint with a workflow-specific decision subject, not one hardcoded entity type per workspace. The blueprint owns universe/subject vocabulary, evidence kinds, action catalog, semantic dimension order, and sizing policy; the adapter maps domain records into that contract. Crypto and tax fixtures must prove portability before the Gmail candidate-build gate reopens.
- Extraction verification: PASS/HIGH. Crypto position, tax transaction, and tax document fixtures reconcile exactly; the same tax workspace proves multiple decision subjects; Gmail preserves the April `857` five-child fixture; fail-closed `>400`, TypeScript, targeted lint, diff check, and the `63/63` production build pass.
- Approval update: Oliver authorized the additive migration and exactly one unpublished semantic candidate build from the existing indexed mailbox on 2026-08-23. This does not authorize Smart Sync, Gmail reindex, publication/pointer movement, main promotion, push, deployment, or lineage retirement.
- Newly recovered lifecycle truth: the current main-derived runner publishes unconditionally, but preserved cleanup lineage at `0b5988d` contains the proven candidate-only completion path, publication restore checkpoint, and `candidate_ready` terminal job state. Restore and verify that bounded seam before applying the migration or starting the build; do not use the publishing full-coverage audit at this gate.
- Execution update: candidate-only lifecycle restoration passes TypeScript, targeted lint, all four reconciliation fixture suites, and the `63/63` production build. The exact additive migration is applied and verified; broad CLI push was not used because remote history contains two older migrations absent locally. Pre-build liveness shows no active mailbox-index run, `244,628` indexed messages, and the April published pointer unchanged at `full-mailbox-20260415024237593`.
- Candidate execution and reconciliation checkpoint: the one authorized unpublished build completed as `full-mailbox-20260823022932121` with job `full-rebuild:085c8ef7-2fd7-4842-8499-cd605e894a77:all_indexed:full-mailbox-20260823022932121`. The job is terminal `completed / candidate_ready`; the April pointer remains `full-mailbox-20260415024237593` and was not moved.
- The first post-build validator failure was false: `gmail_preview_index` used a Postgres planner estimate (`11,741`) as an exact count even though the candidate held `217,561` rows. Exact indexed pagination now counts preview membership, and candidate finalization replaces each artifact-version/cluster/sender slice instead of leaving obsolete source-cluster rows behind.
- Candidate-only reconciliation removed orphan Marketing source rows, normalized the retired retail parent into System Notifications or Needs Review, and re-finalized the same candidate without another mailbox scan or another artifact build. Final artifact totals are `7` parents, `5,024` unique sender seed rows, `5,024` rollups, `7` summaries, `1` snapshot, `104` pressure buckets, and `217,561` preview rows.
- Exact taxonomy validation PASS: the global root is `5,024`; every actionable parent has a flat child plan; every sender belongs to exactly one child; manifest counts equal persisted memberships; child unions equal parent counts; all parent counts equal the root; Context is informational with no action; and the largest child is `296`, below the hard maximum `400`.
- Final parent checkpoint: Protected/Trusted `1,867` across `21` children; Marketing `896` across `13`; Dormant Backlog `1,021` across `11`; Historical Context `59` with no review action; System Notifications `29` across `3`; Needs Review `1,143` across `10`; Social Platform `9` across `2`.
- Candidate runtime verification PASS/HIGH: fresh `63/63` production build, non-incremental TypeScript, targeted zero-error lint, diff check, generic/Gmail contract fixtures, authenticated post-settle Cleanup Groups root proof, and all `60/60` actionable child routes pass exact stable-unit identity, displayed count, pagination, and Decision Mode entry. The chooser -> child -> Decision Mode -> close -> child -> chooser lifecycle preserves the full selected universe and nonzero rows.
- Linked child proof: a `230`-sender unit remains `230` across overview, ranked Sender Distribution, Decision Mode (`1 of 230`), and close/return. The largest `296`-sender unit returns one exact workspace request and one paginated distribution request; focused workspace materialization reads `329` bounded rows, distribution reads `409 + 200`, query concurrency is `1`, and steady-state polling/retry/`409` churn is zero.
- Evidence: `output/playwright/ace048-candidate-runtime/` contains the post-settle chooser, all-child matrix, lifecycle matrix/screenshots, and largest-child load budget. These are ignored local proof artifacts and must not be committed.
- Status: Awaiting Decision — Cleanup Groups Human Review checkpoint one is ready. Oliver must review parent/child names, intuitiveness, and navigation before Sender Distribution / Pressure Trend integration or any publication decision.
- Checkpoint Status: continuity checkpoint created; candidate implementation and verifier proof are propagated. Publication, main promotion, push, deploy, and lineage retirement remain unauthorized.

Cleanup Groups Human Review correction activation — 2026-08-23:
- Oliver accepted the candidate's reconciled group memberships but returned the visible workflow for correction. Parent labels (`Action`, `Backlog`, `Coverage`, `Secondary`, `Context`), technical child terms (`cycle`, `spillover`, `dormant low-attention`), duplicated support copy, and unexplained percentage language are not acceptable for a non-technical operator.
- Newly governing platform truth: the engine owns exact partitioning, stable identity, bounded sizing, and reconciliation; a universal presentation layer owns four actionable workflow roles; each domain adapter owns the human noun and child vocabulary. Gmail senders, crypto positions, tax documents, medical cases, and other subjects must reuse the workflow roles without inheriting one another's terminology.
- Locked visible stages: `Start Here`; `Work Through Older Items`; `Review Carefully`; `Optional Specialized Groups`. `Reference Only` is collapsed, informational, non-actionable, and is not a fifth work stage.
- Human Review also proved an exact runtime defect on a Commerce Shipping Updates child route: hero and distribution resolved `75`, but sender rows remained `0` until the analysis window changed and returned. The previous all-child verification reused a warmed session and did not prove an independent cold load for every child.
- Root Cause Execution Translation: capture the first-load request/state transition on the exact canonical child route; correct the initial scoped-workspace lifecycle without adding polling or broad reads; add a Gmail presentation mapper that changes display copy only; deduplicate supporting copy; keep stable unit IDs, candidate membership, and candidate publication state unchanged.
- Runtime load contract: one scoped workspace request family on cold child entry, bounded page/distribution reads, zero recurring heavy requests after settle, and no navigation-triggered build, refresh, sync, reindex, publication, or Supabase-wide scan.
- Correction implementation: the Gmail presentation adapter now translates internal taxonomy into plain parent/child language while the platform presentation builder retains the domain-neutral four-stage workflow. Actionable parents expose child-only review; Reference Only has no review action; duplicated supporting copy is suppressed.
- Runtime correction: count-contradicting cached child workspaces are rejected, aborted in-flight analysis requests cannot be inherited by the replacement render, and stale request cleanup cannot delete a newer live request. Duplicate sender badge labels are de-duplicated before rendering.
- Correction proof: focused contract fixture PASS; non-incremental TypeScript PASS; targeted ESLint PASS with zero errors and only 13 pre-existing warnings in the oversized Review page. Authenticated post-settle Playwright proves a fresh 138-sender child loads 12 rows, Decision Mode opens with the same unit, Close returns to 12 rows, console errors/warnings are zero, and no `409` or recurring heavy request appears.
- Human Review return — 2026-08-24: Oliver accepted the overall workflow direction and reconciled candidate counts, but rejected the current checkpoint-one presentation as final. Duplicate visible child names describe distinct persisted units; recency/volume labels do not name the subject or meaning; the `Start Here` explanation does not state the actual decision value; and the protected `1,867`-sender presentation group is too large for one human pass.
- Framework-level Root Cause Execution Translation: preserve persisted review-unit IDs and exact membership; require unique visible choices within each presentation group; derive duplicate disambiguation from the next meaningful adapter-provided dimension; render subject-aware time/volume copy; and allow a domain adapter to arrange existing disjoint children into bounded presentation groups whose totals still reconcile exactly. No Gmail-only rule may enter the domain-neutral engine.
- Locked Gmail reference outcome: retain the existing candidate and split the protected presentation group into `273 + 359 + 711 + 524 = 1,867` using its existing child units. The split is presentation-only and must not trigger a rebuild, sync, reindex, publication change, or Supabase-wide scan.
- Correction implementation: the domain-neutral presentation contract rejects duplicate visible choices, reused/missing units, empty presentation partitions, unassigned units, and count mismatch. The Gmail adapter supplies path-aware labels and the four protected presentation contexts without changing stable unit identity or membership.
- Correction proof: exact fixtures reconcile all groups and the protected `273 + 359 + 711 + 524 = 1,867` split; crypto position and tax transaction/document fixtures remain PASS. TypeScript, targeted lint, Pressure Trend fixtures, Gmail review-unit fixtures, workspace fixtures, and diff check pass.
- Runtime/UI proof: the exact authenticated chooser cold-loads after settle with root `5,024`, seven main presentation groups, unique child labels, exact child sums, no broad-parent review action, and non-actionable Reference Only. Representative child routes with totals `28 / 205 / 170 / 239` retain stable review-unit identity and nonzero rows. The `28`-sender child cold-loads `13` rows, enters Decision Mode, closes to the same child, and retains `13` rows; console errors/warnings are zero and the request trace remains unchanged during a final `20s` hold.
- Proof artifacts: `web/.playwright-cli/ace048-framework-after-2026-08-24.png`; `web/.playwright-cli/ace048-framework-child-first-load-2026-08-24.png`; `web/.playwright-cli/ace048-framework-decision-mode-2026-08-24.png`; `web/.playwright-cli/ace048-framework-decision-return-2026-08-24.png`.
- Human Review decision — 2026-08-24: `ACCEPT`. Oliver confirmed the corrected flow is usable, the starting recommendation makes sense, and the framework-first behavior is safe to carry into other business models.
- Accepted Fix boundary: Cleanup Groups presentation grammar, exact presentation grouping, child-first navigation, cold child load, and Decision Mode close/return are accepted. Sender Distribution, Pressure Trend, full linked-surface parity, artifact promotion, main promotion, push, deploy, and lineage retirement remain separate gates.
- Recovery Contract: `CHANGELOG.md` -> `August 24, 2026 — ACE-048 Framework-First Cleanup Groups Presentation Accepted`.
- Status: `Cleanup Groups Accepted — Charts and Linked-Surface Reconciliation Next`. Rebuild, active-pointer promotion, main promotion, push, deploy, and lineage retirement remain unauthorized.
- Checkpoint Status: none; Human Review acceptance and Recovery Contract are propagated, and the next bounded work unit is explicitly identified.

Windowed review-unit artifact-contract planning expansion — 2026-08-24:
- Bounded read-only diagnosis proved two distinct mechanisms. Intelligence accepts an empty Pressure Trend seed as usable and therefore suppresses its existing one-key artifact-bucket request. On the review route, selecting `1M` maps to `analysis_scope=30d`, but the unpublished all-indexed candidate has no exact `30d` review-unit membership/projection. Limited preview evidence cannot reconstruct exact preset/Custom activity without violating bounded-read and mixed-universe guards.
- Oliver approved `RETURN_TO_PM` and the recommendation to expand the artifact contract correctly. This is newly governing truth and supersedes executor-ready chart correction until the plan is approved.
- Semantic contract: `review_unit_id` remains stable, immutable membership for one artifact version. All Indexed, preset, and Custom selections are observation projections over that fixed unit. Fixed membership continues to own ordered rows, pagination, Decision Mode, and distribution entity identity; each projection owns exact per-member activity, active-entity count, distribution measures, and time-context/trend truth. Zero-activity members remain explicit. Fixed membership and active-in-window counts must be separately labeled; a window never creates a child unit or changes its decision denominator.
- Platform boundary: the generic workflow-blueprint engine owns projection identity, validation, parity, and storage interfaces. Domain adapters supply entity keys, activity timestamps, measures, and vocabulary. Gmail is the first reference adapter, not the framework model.
- Authoritative runtime artifact: `docs/00_control_plane/runtime/ACE-048_WINDOWED_REVIEW_UNIT_ARTIFACT_CONTRACT_PM_BRIEF.md` — `created`, authoritative for this expanded planning scope, and `AWAITING OLIVER PLAN DECISION`.
- The plan requires one additive generic migration and, for acceptance-quality proof, one new immutable unpublished candidate generated from existing indexed data. Neither action is authorized yet. A projection-only replay is eligible only if implementation proof shows complete immutable inputs and still creates a new artifact version.
- Separate narrow seam: Pressure Trend seed admission must reject empty/invalid/epoch coverage while preserving the accepted one-attempt-per-semantic-key request owner and zero steady repeats.
- Frozen boundary: accepted Cleanup Groups presentation, stable child IDs, membership, counts, child-first navigation, cold-load behavior, and Decision Mode return must not change. Candidate `full-mailbox-20260823022932121`, active publication `full-mailbox-20260415024237593`, main, and every external environment remain untouched.
- Approval contract: `ACCEPT` authorizes plan Stages A/B only—generic contract/runtime implementation, exact fixtures, an unapplied migration file, and static/build proof. Migration application and one new unpublished candidate require a second explicit Oliver decision. `REJECT`, `BLOCKED`, and `RETURN_TO_PM` preserve the non-execution state.
- Oliver decision — 2026-08-24: `ACCEPT`. Immediate same-flow execution commitment selected for Stages A/B only.
- Stages A/B implementation result — 2026-08-24: platform-generic fixed-membership/window projection contracts, deterministic materialization and validation, crypto/tax fixtures, Gmail adapter and candidate-only generator integration, bounded storage/read seams, and the command-generated additive migration are implemented in the isolated ACE-048 worktree.
- Technical proof: generic fixture PASS, Gmail adapter fixture PASS, Pressure Trend contract fixture PASS, TypeScript PASS, targeted ESLint PASS with four unrelated pre-existing warnings, production build PASS, and diff check PASS. Local SQL execution/RLS proof is deferred because the installed PostgreSQL toolchain lacks a server binary; the migration is unapplied and no remote database was touched.
- Oliver decision — 2026-08-25: `APPROVED`. Stage C immediate same-flow execution is authorized for Supabase project `cjpjekhlvzwjwtszqpmy`: apply only additive migration `20260824132718_add_workspace_review_unit_window_projection.sql`, verify its schema/RLS contract, and generate exactly one unpublished candidate from the existing indexed mailbox.
- Stage C load/lifecycle contract: one candidate build identity; no navigation-triggered mutation; no Smart Sync or Gmail reindex; single-flight read-only status observation at approximately 15-second cadence while the build is live; terminal on `candidate_ready` or failure; active publication pointer must remain unchanged; no repeated build trigger or broad database scan outside the candidate projector's bounded existing workflow.
- Stage C result — 2026-08-25: additive migrations `20260825030532` and `20260825030928` are applied to project `cjpjekhlvzwjwtszqpmy`. One build trigger produced candidate `full-mailbox-20260825031402535`, terminal `completed / candidate_ready`; the active publication remains `full-mailbox-20260415024237593`, `building_version` is null, and mailbox indexing is idle.
- Reconciliation/guard proof: `5,024` root senders = `4,965` actionable manifested members + `59` Context senders; `60` manifests; largest unit `296`; exact manifest/seed and parent/root parity; no within-parent duplicates; coverage `2022-12-02` through `2026-08-15`; no epoch manifest. Authenticated same-tenant RPC, ready-empty behavior, cross-tenant denial, explicit grants, and final advisors pass for the new objects. A single transient preview-index upsert recovered through the existing bounded retry without a second build or mailbox scan.
- Oliver decision — 2026-08-25: `ACCEPT`. Stage D immediate same-flow execution is authorized only for the target-locked runtime/API/review files and Pressure Trend seam in `ACE-048_WINDOWED_REVIEW_UNIT_ARTIFACT_CONTRACT_PM_BRIEF.md`.
- Historical Stage D load/lifecycle contract: one bounded projection family per changed review-unit/window key, single-flight ownership, and zero recurring heavy requests after settle. Its fixed-membership-through-workflow semantic was rejected by Human Review on 2026-08-27 and is superseded by Stage D-R active-working-set behavior below.
- Stage D implementation/proof result — 2026-08-25: immutable review-unit membership now remains shared across sender rows, pagination, Decision Mode, Sender Distribution, and Time Context while preset/Custom windows project activity separately. Pressure Trend rejects empty/invalid/epoch seeds and begins at actual indexed coverage. Static/build/fixture proof passes; authenticated post-settle Playwright passes child cold load, `1M`, Custom, All Indexed restore, Decision Mode return, linked count parity, and Pressure Trend All Indexed/`1M`/Custom with zero console error, `409`, retry waterfall, polling loop, or steady recurring heavy request.
- Publication boundary: candidate `full-mailbox-20260825031402535` remains an unpublished development override; active publication `full-mailbox-20260415024237593` is unchanged. No Smart Sync, Gmail reindex, publication, deployment, push, local-main promotion, or lineage retirement occurred.
- Human Review REJECT — 2026-08-27: Oliver's exact-route screenshots show `278 RANKED SENDERS` for All Indexed, `1Y`, `1Q`, and `1D`. Narrowed windows change activity values but retain zero-activity fixed members as empty rank slots, so the prior Stage D fixed-denominator behavior is not accepted product truth.
- Newly governing contract: immutable review-unit membership remains authoritative for taxonomy, stable identity, and parent/child/root reconciliation. A preset or Custom window creates the active working set from members whose projection activity is nonzero. Overview workflow totals, sender rows, pagination, Decision Mode, and Sender Distribution must all consume that same active set; All Indexed consumes full membership. Projection audit truth continues to retain zero-activity members.
- Root Cause Execution Translation: do not rebuild or alter projection storage. Separate `projection_membership` from `active_working_set` in the target-locked runtime mapper; derive the latter from existing per-member `activity_count`, preserve deterministic ordering, propagate it across every linked workflow surface, and render an honest zero-active empty state. Show fixed group size and active-window size as distinct labels.
- Pressure Trend contract clarification: coverage bounds must be resolved dynamically from the active tenant/workspace artifact or indexed-coverage provenance. The August candidate currently proves December 2022 through August 15, 2026; those dates are evidence for that user/version, not constants.
- Expected load: no new endpoint family, polling, migration, candidate build, raw mailbox scan, or Supabase-wide query. One bounded projection family remains single-flight per changed semantic key, followed by bounded visible-page reads only.
- Oliver decision — 2026-08-27: `APPROVED`. Immediate same-flow Stage D-R implementation is authorized only for the target-locked active-working-set runtime correction and its static/browser verification matrix.
- Stage D-R implementation/proof result — 2026-08-27: the generic runtime resolves one active working set from positive projection activity and the Gmail workspace/store use that exact bounded identity set for overview, rows, pagination, Decision Mode, Sender Distribution, and Time Context. Fixed membership remains separately visible and authoritative for taxonomy/audit.
- Human Review RETURN — 2026-08-27: active-window count filtering is retained, but the child-entry experience is rejected. `Start Here` child actions can return to Cleanup Groups, while successful child workspaces keep the parent presentation title as H1 instead of the selected child label.
- Root Cause Execution Translation: eliminate split chooser/review identity by preferring the same current trusted runtime intelligence when it is available and using cached/latest-stable intelligence only as absence fallback. Preserve the canonical `cluster_id + review_unit_id` route. In Review, use the selected published child label as the page title and expose the presentation parent as supporting context; retain parent-title behavior for legacy/broad reads.
- Oliver decision — 2026-08-27: `APPROVED`. Stage D-R2 immediate same-flow execution is authorized only for the target-locked Cleanup Groups intelligence-resolution seam, Review hero title/context seam, and their tests/Playwright proof. No artifact rebuild, taxonomy, membership, counts, window semantics, chart logic, migration, publication, Smart Sync, reindex, deployment, push, main movement, or lineage retirement is authorized.
- Canonical candidate-child matrix: fixed `53`; All Indexed `53`; `1Y 39`; `1Q 23`; `1M 22`; `1W 10`; `1D 0` ready-empty; Custom Aug 1–15 `17`; restored All Indexed `53`. Decision Mode on `1W` shows `5 of 10` and returns to the same `10`-sender workspace. Pressure Trend begins at real Q4 2022 coverage and ends at Q3 2026, with no epoch origin.
- Proof/load result: generic and Gmail fixtures PASS, diff check PASS, targeted ESLint zero errors (pre-existing warnings only), production build `63/63` PASS, post-settle browser screenshots and linked-surface checks PASS, console errors zero, no polling, no `409`, and no recurring heavy request family after settle.
- Candidate and publication state are unchanged; no migration, rebuild, sync, reindex, deployment, push, main movement, or lineage retirement occurred.
- Stage D-R2 implementation/proof result — 2026-08-27: all `13/13` Start Here children settle on their canonical Review routes without chooser bounce; representative older/protected children render child H1 plus correct parent context; an actual chooser click opens `Deals and special offers` at `262` active senders. The canonical newsletters child retains fixed membership `53`, narrows to `22` active senders on `1M`, enters Decision Mode with `22`, and closes back to the same child/window with nonzero rows and no overlay.
- Stage D-R2 load/proof result: generic/Gmail/window fixtures PASS; targeted ESLint `0` errors / `19` warnings; diff check PASS. Settled runtime trace uses one bounded workspace plus one bounded distribution family per changed key, query concurrency `1`, zero raw Gmail-message reads, zero `409`, and no recurring heavy polling. Candidate and publication pointers are unchanged; no rebuild, sync, reindex, publication, deployment, push, main movement, or lineage retirement occurred.
- Human Review ACCEPT — 2026-08-27: Stage D-R2 child-entry/title/return behavior and the linked Sender Distribution window behavior are accepted. Recovery Contract: `CHANGELOG -> August 27, 2026 — ACE-048 Child Transition and Windowed Sender Distribution Accepted`.
- Stage D-R3 approved scope — 2026-08-27: converge Time Context timeframe state, retain canonical interval bounds through the presentation path, make a selected bar narrow the shared workflow, and label unique decision subjects separately from supporting activity. Time Context, Sender Distribution, and Pressure Trend must project from the same domain-neutral observation authority.
- Stage D-R3 load/lifecycle contract: one bounded projection/workspace family per changed timeframe or bucket key, at most one bounded detail family, zero recurring heavy requests after settle, no poller, and no navigation-triggered build, sync, reindex, publication, or broad scan.
- Stage D-R3 status: `APPROVED AND ACTIVE`. No taxonomy, membership, migration, candidate build, publication, Smart Sync, Gmail reindex, deployment, push, main movement, or lineage retirement is authorized.
- Checkpoint Status: continuity checkpoint created; the approved Stage D-R3 governing truth is propagated and immediate same-flow execution is active.
- Stage D-R3 implementation/diagnostic result — 2026-08-27: the selected published child now owns Time Context source selection, timeframe highlight state converges, and canonical bucket bounds survive the render path. Targeted contract fixtures and lint pass, and authenticated post-settle proof no longer shows the prior child-source/loading contradiction.
- Stage D-R3 newly discovered governing truth: `read_workspace_review_unit_window_projection` currently emits only bucket `activity_count`. The existing materialized per-entity bucket rows can support a distinct active-subject count, but the bounded read contract does not expose it. Live proof showed `343` displayed active subjects inside a `239`-subject child and `1,629` inside a `125`-subject `1Y` workflow, proving activity was mislabeled as subjects.
- Stage D-R3 Root Cause Execution Translation: create one additive `CREATE OR REPLACE FUNCTION` migration that returns `active_entity_count` from distinct materialized bucket entities while preserving `activity_count` as supporting activity; map both through the platform-generic projection contract; use the former for Time Context bar height/subject labels and the latter only for activity detail. Pressure Trend, Time Context, Sender Distribution, rows, and Decision Mode must be verified as projections of the same subject-observation authority.
- Stage D-R3 decision gate: the earlier approval explicitly excluded migrations. No migration will be authored/applied and no further behavior will be claimed until Oliver explicitly approves this additive contract correction. No rebuild, Smart Sync, Gmail reindex, publication, broad scan, deployment, push, main movement, or lineage retirement is requested.
- Checkpoint Status: propagation required before further Stage D-R3 execution; diagnosis and bounded correction contract are now propagated, and the pass is awaiting an explicit decision.
- Stage D-R3 additive-contract decision — 2026-08-28: Oliver recorded `ACCEPT`. Immediate same-flow execution is authorized for exactly one additive projection read-contract migration plus its target-locked generic adapter/Time Context wiring and verification. No semantic rebuild, Gmail reindex, Smart Sync, publication, broad scan, deployment, push, main movement, or lineage retirement is authorized.
- Checkpoint Status: continuity checkpoint created; the accepted correction contract is propagated and bounded Stage D-R3 execution may continue in the same governed flow.
- Stage D-R3 correction result — 2026-08-28: additive migration `20260828011458_ace048_add_active_entity_count_to_projection.sql` is applied as remote version `20260828012004`; the bounded RPC exposes distinct active subjects separately from supporting activity. The framework contract remains domain-neutral and retains crypto/tax portability fixtures.
- Stage D-R3 verifier result: `ACCEPT / HIGH`. The canonical selected Dec 2025 bucket reconciles `98` active subjects and `1,629` supporting activities across Time Context, Sender Overview, Sender Distribution, rows/pagination, and Decision Mode. Close preserves the route-backed bucket and `98`-subject universe, Clear restores the `1Y` universe to `125`, and the All Indexed / `1Y` / `1M` / `1W` / `1D` / `1Y` switch loop settles without fallback state, console error, recurring heavy requests, or `409` guard churn.
- Proof artifact bundle: `/private/tmp/ace048-time-context-proof/` (`01-before-bucket-1y.png` through `07-switch-loop-final-1y.png`, plus `verification.json`). All final verdict artifacts were captured after ready state.
- Stage D-R3 status: `VERIFIER ACCEPTED / HUMAN REVIEW PENDING`. Human Review is limited to metric clarity, bucket-driven narrowing, Decision Mode close/return, Clear period, and timeframe switch behavior. Publication, rebuild, sync, reindex, deployment, push, main movement, and lineage retirement remain blocked.
- Checkpoint Status: continuity checkpoint created; implementation and verifier proof are propagated, Human acceptance and any resulting Accepted Fix Recovery Contract remain pending.
- Stage D-R3 Human Review RETURN — 2026-08-28: unique-subject filtering and the separate `active_entity_count` measure remain valid, but unique-subject bar height is not the accepted primary Time Context visual. The accepted operator question is when and how much activity occurred. Repeated activity from the same subject across different intervals is meaningful evidence and must remain visible.
- Revised shared-observation contract: bar height, scale, peak/latest/delta, and primary bucket read use additive `activity_count`; each bucket also reports distinct `active_entity_count`; bar selection narrows the shared workflow to those distinct subject identities; the workflow and Sender Distribution remain unique-subject views. The same canonical subject-observation facts therefore support different honest aggregations rather than forcing numerical equality between unlike measures.
- Stage D-R3 Root Cause Execution Translation: do not alter storage, projection generation, immutable membership, or the existing RPC. Rewire the target-locked Time Context presentation to use the already available activity measure for the chart and the distinct-subject measure for filtering/context. Add plain-language explanation that one subject can contribute activity in multiple periods and that subject counts across bars are non-additive. Preserve the current bounded request/load contract.
- Oliver decision — 2026-08-28: `APPROVED`. Immediate same-flow execution is authorized for the bounded Time Context activity-volume presentation correction plus targeted/static/browser verification. No migration, semantic rebuild, Gmail reindex, Smart Sync, artifact publication, broad scan, deployment, push, main movement, or lineage retirement is authorized.
- Stage D-R3 activity-volume correction result — 2026-08-28: the target-locked Time Context chart, peak/latest/delta reads, accessible labels, hover copy, and focused-bucket truth use additive `activity_count`; distinct `active_entity_count` remains the filtering denominator and linked unique-subject truth. The framework fixture proves four activities from two decision subjects without Gmail-specific engine semantics.
- Stage D-R3 verifier result: `ACCEPT / HIGH`. The exact weekly child settles at `10` unique senders and `15` messages; Aug 12 visibly renders `5` messages from `4` senders, selects exactly `4` workflow rows, reconciles Sender Distribution and Decision Mode to `4`, preserves exact bucket identity through Close, and restores weekly truth after the `1M` / All Indexed / `1W` switch loop.
- Proof artifact bundle: `/private/tmp/ace048-time-context-activity-proof/` (`ace048-tc-activity-weekly-ready.png` through `ace048-tc-activity-weekly-final.png`, plus `runtime-state.json` and `request-trace.json`). All verdict screenshots were captured after ready state.
- Guard/load result: zero settled recurring requests, no poller, no `409` churn, and no navigation-triggered build/sync/reindex/publication/broad scan. One Decision Mode snippet-hydration `412` was non-interfering and is recorded as adjacent residual evidence.
- Stage D-R3 status: `ACTIVITY-VOLUME CORRECTION VERIFIED / AWAITING HUMAN REVIEW DECISION`.
- Checkpoint Status: continuity checkpoint created; implementation and verifier proof are propagated, while Human acceptance and any resulting Accepted Fix Recovery Contract remain pending.
- Stage D-R3 Human Review RETURN — dual-window authority — 2026-08-28: Oliver retained the activity-volume visualization and explanatory grammar but rejected the page-level workflow state. The Operations Workspace scope selector and Analysis Rail timeframe selector can diverge, leaving different controls, URL parameters, workflow totals, and loading states active simultaneously.
- Newly governing Stage D-R4 contract: one mutable workflow-window authority must own Overview, Time Context, Sender Distribution, rows, pagination, and Decision Mode. Indexed/artifact coverage may be shown as provenance but must not independently narrow the active Review workflow.
- Problem class: mixed runtime behavior plus shared route/state authority. Target lock resolved to `OperationsWorkspaceShell.tsx` and the review route's window-state canonicalization; execution readiness became `target-locked / execution-ready` after Oliver approved the one-authority plan.
- Stage D-R4 exclusions: no semantic rebuild, Gmail reindex, Smart Sync, artifact publication, Supabase-wide scan, migration, deployment, push, main movement, or lineage retirement.
- Stage D-R4 implementation: Review/Decision now expose the Analysis Rail as the sole mutable workflow-window authority; the Operations Workspace renders indexed coverage as read-only provenance. Legacy conflicting `workflow_scope` state is mapped only when no lower selection exists, then removed from review-unit URLs.
- Stage D-R4 verifier result: `ACCEPT / HIGH`. Post-settle authenticated Playwright proved legacy-conflict cold-load canonicalization, `1W -> 1M -> All Indexed -> 1W`, linked-surface count parity, and Decision Mode close/return identity. Targeted lint, TypeScript, and review-unit projection contracts passed.
- Load/guard result: one sender-workspace and one sender-distribution request per changed window key; no polling, repeated heavy requests, `409` churn, navigation-triggered mutation, rebuild, sync, reindex, publication, or broad scan. The existing Decision Mode evidence-snippet `412` is an adjacent residual, not a window-state contradiction.
- Stage D-R4 status: `DUAL-WINDOW CORRECTION VERIFIED / AWAITING HUMAN REVIEW DECISION`.
- Checkpoint Status: continuity checkpoint created; implementation and verifier proof are propagated, while Human acceptance and any resulting Accepted Fix Recovery Contract remain pending.
- Stage D-R4 Human Review ACCEPT — 2026-08-28: Oliver accepted Cleanup Groups plus the linked Sender Distribution, activity-volume Time Context, dynamic Pressure Trend, and single workflow-window surface as the completed analysis milestone.
- Recovery Contract: `CHANGELOG.md` -> `August 28, 2026 — ACE-048 Unified Analysis Window and Linked Chart Truth Accepted`.
- Consolidation checkpoint — 2026-08-29: local `main` intentionally integrates the accepted ACE-048 source through `7866368c97a6ca8d241a9541f6f83570df2017f4` and, after this documentation checkpoint, is `20` commits ahead of untouched `origin/main@64632b3faa0736cdf15534b4465cdef8a404a4e8`. Every recovery branch/worktree remains preserved; authentication state, generated browser output, environment/secrets, and nested-worktree metadata remain excluded.
- Verification result: contract fixtures, TypeScript, targeted lint, diff checks, and the `63`-route production build pass. Oliver completed the residual exact-route compatibility assist on 2026-08-30 and accepted the result; supplied captures show the published Editorial/content child at full `76` and narrowed `25` workflow senders with populated rows and window-aligned analysis state.
- Local-main consolidation Human Review status: `ACCEPTED` on 2026-08-30. Recovery Contract: `CHANGELOG.md` -> `August 30, 2026 — ACE-048 Local Main Consolidation Accepted`.
- Worktree-retirement result — 2026-08-30: after Oliver approved the exact recommendation, all seven obsolete ACE-048 checkouts were removed. The later clean Decision Mode preservation checkout `9e47@74eb4e7` was retired after its accepted patch was proven equivalent to local `main` and its verified `KEEP` archive/snapshot were confirmed present. Local `main` is now the sole Automata worktree. Every named recovery branch remains at its reattested HEAD. The only discarded dirty state was excluded generated Playwright/auth residue in `33ad`, `7865`, and `a985`; no unpreserved product/control-plane source was removed.
- Decision Mode optional-evidence accepted-fix capture — 2026-08-30: preservation branch `codex/ace-048-decision-mode-optional-evidence` starts from accepted consolidated baseline `7526afe49235265f0b257fbb3dd4a389c7ea129c` and carries only the seven locked implementation paths plus this required propagation. The platform contract expresses optional evidence-detail availability as full detail or subject-only degradation; Gmail owns connection/scope/reauthorization interpretation and operator guidance. Degraded results are not globally cached, no polling or automatic retry loop exists, and malformed requests, application authentication, tenant isolation, database/configuration failures, unexpected provider/network failures, and full-message-preview failures remain non-2xx.
- Human Review ACCEPT — 2026-08-30: Oliver accepted the direct authenticated root proof on `http://localhost:3001/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions&subset_source=review_unit&subset_value=family%3Amarketing_candidate_editorial_content`. Full `76` and narrowed `1M` `25` paths reached ready state; subject/date evidence remained usable through degraded settle; automatic repeat count was zero; explicit retry issued exactly one request; close/return preserved selection and nonzero rows; and no `412` or `409` churn remained.
- Recovery Contract: `CHANGELOG.md` -> `August 30, 2026 — ACE-048 Decision Mode Optional-Evidence Availability Accepted`.
- Local-main integration and normal-runtime verification — 2026-08-30: accepted preservation commit `74eb4e7` was integrated into local `main` as `79ab1a6`. Authenticated port-`3000` proof on the exact stable review-unit route passed full `76` and narrowed `1M` `25` sender universes with `12` loaded rows, subject-only evidence, zero settled automatic repeats, exactly one explicit-retry `200`, preserved close/return scope, no browser warnings/errors/runtime overlay, and no `412` or `409` churn.
- GitHub publication closeout — 2026-08-30: Oliver explicitly approved generated-output cleanup plus normal publication. A verified normal full backup was created first; `web/output/` and `web/web/output/` were moved to recoverable Trash and narrowly ignored; cleanup commit `d7e21ac` was created. A non-force push advanced GitHub `main`, the local remote URL was updated to canonical `https://github.com/cvn74oliver/automata.git`, and local `main`, `origin/main`, and live remote `refs/heads/main` were reverified identical with zero divergence. No force push, deployment, artifact publication, rebuild, Smart Sync, Gmail reindex/backfill, Supabase mutation, recovery-branch deletion, or product-data mutation occurred.
- Management discovery continuity — 2026-08-30: the clean detached `3226` worktree completed read-only discovery, its findings were reviewed, and the checkout was retired without discarding source. Management implementation remains unapproved; the next separate decision is whether to accept and propagate its provider-neutral contract/read-model plan.
- Next governing step: obtain Oliver's separate decision on the reviewed Management discovery direction, then either micro-propagate an approved PM Brief or revise the recommendation. Deployment and recovery-branch deletion remain separately gated.
- Checkpoint Status: none for GitHub publication and worktree hygiene. Backup, cleanup, non-force push, canonical-remote correction, remote parity proof, and discovery-worktree retirement are propagated.
- Shared backup checkpoint — 2026-08-30: `/Users/olivercarlin/Documents/Backups/backup-projects.sh` now serves Automata, Curative Mushrooms, and Curative Genetics from one documented interface and lists their registered Git worktrees separately. Normal project-scoped backups retain the established seven-day rolling policy; `KEEP` full archives remain exempt. Future archives verify readability and record SHA-256 plus Git recovery identity. A combined long-term `KEEP` set for Automata `main@c28a7ba` and accepted worktree `9e47@74eb4e7` was created and verified; the manifest is stored beside the 2026-08-30 backups.
- Backup artifact status: script `updated`; two pre-change script copies `created`; Automata main/worktree incremental snapshots and `KEEP` archives `created`; verification manifest `created` and authoritative for this backup run. Older non-`KEEP` Automata backups beyond seven days were pruned by the approved project-scoped retention policy; existing `KEEP` archives were not changed.
- Backup Checkpoint Status: none. The recurring cadence is propagated and does not change the next ACE-048 application work unit or authorize remote push/deployment.

Decision:
- Automata is now governed by the **Revival — Security and Rebaseline** program.
- All application implementation is blocked until the first revival execution packet is approved from this rebaselined control plane.
- The revival order is:
  1. accepted current-tree auth-artifact remediation — complete with Recovery Contract
  2. accepted Main Contracts A/B sender-distribution scope-truth correction — complete with Recovery Contract
  3. Gmail OAuth plus sync/index recovery — PASS; semantic artifact recovery/publication remains open
  4. load-safe semantic-artifact recovery/integration safety audit, controlled candidate-disposition plan, and approved PM Brief
  5. separate Dashboard baseline diagnosis, PM Brief, correction, and verification loop
  6. recompute the dual-worktree semantic manifest and author a staged integration PM Brief under cleanup sender-distribution feature authority
  7. preservation-first manual semantic integration on a main-derived integration worktree
  8. post-integration terminal-health and Playwright regression verification plus human acceptance before merge/commit/push
  9. privileged-route caller-authentication and ownership hardening
  10. upgrade Next.js from `16.0.10` to the approved patched security baseline
  11. adjudicate the canonical Vercel project and deployment path
  12. establish a reproducible local-to-live Supabase schema baseline
  13. finish one Gmail closed loop
  14. build the governed learning substrate
  15. build the executable workspace compiler / visual builder
  16. validate a second domain
  17. add broader multi-agent company hierarchy
- Sequence-change rationale: shared and hot files evolved in both refs; hardening them before cleanup integration would increase semantic conflict risk and could duplicate or overwrite security work.
- `main` is the eventual integration destination and authority for later unrelated main-line evolution. `cleanup-taxonomy-rebuild` is the sender-distribution feature authority; its substantial cleanup/taxonomy lineage is not obsolete, disposable, or merged by default.
- Gmail is the mature reference vertical. The generalized visual builder, governed model-training lifecycle, and multi-agent company hierarchy are not yet implemented.
- Revival product stages are strategic sequence labels. Lane phases are bounded execution states within an ACE; the two must not be conflated.

Newly governing audit truth:
- Public Git history contains four tracked Playwright Supabase auth-state artifacts.
- Three Supabase Auth sessions referenced by those artifacts have now been contained exactly; repository artifact and history exposure remain unresolved.
- Multiple service-role API routes lack caller authentication and ownership checks.
- Next.js `16.0.10` is below the current approved patched security baseline.
- Two Vercel projects deploy the same `main` commit and require canonical-project adjudication.
- Local Supabase migrations do not reproduce the live schema.
- The prior control plane is stale and contradictory: active/completed classification has drifted, TODO contains historical accumulation, and the required execution dashboard was absent.

Cleanup lineage preservation and integration posture:
- Freeze and preserve both `main` and `cleanup-taxonomy-rebuild` refs before integration analysis or mutation.
- First inventory all cleanup-only and materially differing work from the merge base.
- Behaviorally classify each seam using code, tests, runtime intent, and relevant documentation rather than file age, branch name, or blanket source preference.
- Blind full merge, blanket conflict resolution, broad overwrite, branch deletion, and cleanup-worktree deletion are prohibited.
- Integration must proceed through bounded packets, each with:
  - an explicit seam and behavior objective
  - compared source evidence from both refs
  - a declared target file set
  - regression boundaries
  - targeted verification before the next packet
- Individual cleanup items may later be classified superseded only after explicit comparison proves the newer governing behavior and preserves any still-valuable work.
- No sender-distribution supersession, omission, or deletion may be inferred merely because `main` is the integration destination.

Staged cleanup-lineage integration program — PLAN MODE only:
- Existing comparison findings are historical and stale after verified cleanup corrections:
  - `37` non-identical cleanup-lineage paths
  - `17` textual conflicts
  - shared hot files require dedicated semantic integration
- The integration sequence is mandatory:
  1. start and verify `main` before integration using terminal health plus Playwright CLI on approved exact runtime targets and routes
  2. start and verify `cleanup-taxonomy-rebuild` before integration using terminal health plus Playwright CLI on approved exact runtime targets and routes
  3. integrate preservation-first, seam-by-seam through bounded packets and semantic conflict resolution
  4. start and verify the integrated app using terminal health plus Playwright CLI, proving accepted surfaces remain functional
- Shared-file conflicts are semantic integrations. Blanket `ours` / `theirs` resolution is prohibited.
- The program must remain in PLAN MODE until PM approves a complete brief containing:
  - locked file/seam manifest
  - exact runtime targets and canonical routes for both pre-integration baselines and post-integration proof
  - rollback and ref-preservation posture
  - accepted proof surfaces and regression contract
  - packet order and stop conditions
- No merge or conflict resolution is authorized during discovery and target-lock planning.
- Privileged-route hardening must not run concurrently with cleanup integration.
- Git-history remediation remains a separate security action and must not be mixed into feature integration.

Pre-integration baseline gate — decisive FAIL, merge execution BLOCKED:
- Problem decomposition is now locked:
  - Cleanup: source / compiler
  - Main: runtime lifecycle / UI truth plus artifact / publication truth
  - Dashboard: separate client transport / error-state behavior
- Main baseline:
  - runtime target: `/Users/olivercarlin/Dev/ai-agent-platform/web` at `http://localhost:3000`
  - `npm run lint`: FAIL from broad pre-existing lint debt
  - fresh `npm run build`: PASS (`63/63` pages)
  - production start: PASS; exact server stopped cleanly and port closed
  - env-backed UI authentication: PASS using a newly created ignored current-session auth context; revoked historical states were not reused
  - dashboard authenticated but metrics remained loading with repeated `loadUserData failed: TypeError: Failed to fetch`
  - agents, intelligence, and clusters mounted
  - protected and Marketing review routes reached the technical rail-ready marker, but settled UI showed `Could not load sender distribution for this scope`
  - protected Time Context was usable; most scope/tab rows failed because Sender Distribution remained loading or unavailable
  - runtime artifact truth: `artifact_freshness_state=refresh_failed`, `artifact_build_status=failed`
  - observed request totals: playground `3`, mailbox-index `2` overall and `0` on protected cold open, inbox-analysis `9`, Gmail memory `2`, guarded `409 initial_paint_live_fetch_disabled` `2`
  - no mailbox-index polling on scope switch; idle `>=12s` produced zero repeated polling; no mutating control used
  - verdict: FAIL; confidence HIGH
- Cleanup initial baseline (superseded by the independently verified post-correction PASS recorded below):
  - runtime target: `/Users/olivercarlin/Dev/ai-agent-platform-cleanup-taxonomy-rebuild/web` at `http://localhost:3001`
  - lint: FAIL (`267` problems: `226` errors, `41` warnings)
  - fresh build: FAIL at `web/src/app/agents/[id]/operations/review/page.tsx:934` because an async function declares a bare union return type instead of a Promise union
  - production start: BLOCKED because fresh build failed; stale build artifact was not accepted
  - bounded current-source dev diagnostic authenticated using the new same-host session
  - dashboard remained loading; agents and intelligence mounted; clusters did not expose the expected heading within `45s`; later routes were not fabricated
  - verdict: FAIL; remaining route proof BLOCKED by build failure plus bounded clusters timeout
  - cleanup worktree remained source-clean
- Proof artifacts:
  - `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-cleanup-integration/main-pre/` — CREATED; authoritative non-secret main pre-integration visual/runtime baseline
  - `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-cleanup-integration/cleanup-pre/` — CREATED; authoritative non-secret cleanup pre-integration visual/runtime baseline
  - `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-cleanup-integration/main-pre/.playwright-cli/main-auth-state.json` — CREATED; ignored sensitive auth context for this active integration flow only
  - `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-cleanup-integration/cleanup-pre/.playwright-cli/cleanup-auth-state.json` — CREATED; ignored sensitive auth context for this active integration flow only
  - auth contexts must never be committed and must be deleted when the flow closes
- Playwright CLI wrapper dropped twice during credential fill; skill-authorized real-browser fallback used installed `playwright-core`. Tool instability is not classified as product failure.
- No source, database, deployment, merge, stage, commit, push, or cleanup-lineage mutation occurred.

Semantic archaeology — approved discovery truth, not implementation authorization:
- `84` cleanup paths total
- `47` byte-identical paths
- `37` disposition paths:
  - `8` cleanup-unopposed
  - `7` cleanup-only
  - `22` both-changed
- `17` textual conflicts
- `5` auto-merges requiring semantic review
- Classification: `hot_file_integration_required`.
- Full merge, cherry-pick, and blanket `ours` / `theirs` resolution remain prohibited.
- Accepted behavior missing from `main` includes:
  - `secondary.account_updates` / retail redirect retirement
  - candidate-only artifact builds plus CAS publish/rollback
  - shadow rediscovery
  - artifact-backed review-unit mechanics
  - Marketing unit-only UI
- Approved staged semantic-union order:
  1. safety / baseline
  2. identity / contracts
  3. candidate / publication mechanics
  4. artifact-backed reads
  5. tooling
  6. UI
  7. final verification / propagation

Root-cause diagnosis and PM execution translation — correction implementation not yet authorized:
- Cleanup mechanism — HIGH confidence:
  - complete read-only TypeScript pass found `8` errors, all in two cleanup-lineage files
  - `review/page.tsx`:
    - `collectWorkspaceSendersForSemanticFocus` is async but declares a bare union instead of `Promise<union>`
    - Promise wrapping alone is insufficient because two callers combine cancellation with an abort discriminant, preventing narrowing and masking six property errors
    - exact correction contract: define a named result union, return `Promise<Result>`, then split caller checks into `if (cancelled) return`, `if ('aborted' in result) return`, then discriminate `result.ok`
    - preserve pagination, deduplication, ordering, and cancellation behavior
  - `inboxAnalysis.ts`:
    - exhaustive `GmailCleanupExclusionReason` branches make the fallback reason type `never`
    - replace fallback logic with an exhaustive typed label map satisfying `Record<GmailCleanupExclusionReason, string>`
    - do not widen or suppress the type
  - targeted ESLint across all `23` branch-differing code/script paths found two cleanup-owned errors in `gmailArtifactStore.ts` at `applyPublicationExpectationClause`
    - replace explicit `any` annotations with a generic query constraint that preserves `eq` / `is` return types and downstream `select` / `maybeSingle`
  - the other `224` broad lint errors are pre-existing non-lineage debt and are outside this bounded correction
  - clusters timeout remains an unresolved runtime symptom, not compile latency and not yet a code-correction basis; retry fresh production proof after compile correction and diagnose only if it recurs
  - magic-link-only cleanup login is intentional history, not a defect; saved-state authentication works; preserve main password login during later integration
  - apply the bounded compiler correction to cleanup first, then rebuild/run cleanup before integration
  - recompute the `37` / `17` manifest after correction; original cleanup head `382c9d6` remains the immutable comparison reference
- Main mechanism — precise multi-part failure:
  1. HIGH runtime lifecycle:
     - review page sends `sender_distribution` with phase `initial_paint` even though the API intentionally returns `409 initial_paint_live_fetch_disabled`
     - client discards status/reason/retry metadata and string-matches unrelated transient messages, converting an intentional safety guard into a terminal visible error
  2. HIGH UI truth:
     - `data-sender-overview-rail-state` derives from Time Context even when Sender Distribution is selected
     - DOM reports ready while the visible active rail has failed
     - distribution/workflow ordered universes may derive from different artifact/live sources; parity detects missing keys but the page renders a terminal chart failure
  3. HIGH artifact integrity:
     - reader accepts any `published_version` despite `refresh_failed` / `build_status=failed` and may return partial seed rows as `ok`
     - publisher records row-count errors but can still publish
     - exact current data mismatch remains unknown pending bounded metadata inspection
  4. Separate HIGH dashboard defect:
     - dashboard queries Supabase directly in the browser across `agents`, `fine_tune_examples`, and `agent_sessions`
     - transport failures had no HTTP response; outstanding queries continue after navigation and log errors unconditionally
     - do not connect existing admin/global `/api/dashboard/metrics` without authenticating and tenant-scoping it first
- PM Root Cause Execution Translation:
  - preserve inbox-analysis status, reason, and retry metadata as a machine-readable result; prohibit human-string classification
  - cold paint uses artifact-only truth or one bounded deferred request after shell/runtime readiness; never send a request known to be rejected
  - disabled initial paint preserves seed/continuity and is non-terminal
  - active rail readiness derives from selected tab and current request key; Sender Distribution is ready only with a parity-complete current universe or explicit genuine-empty state
  - artifact distribution loader compares header `sender_count` with unique loaded seed rows and returns structured `artifact_incomplete`, never partial `ok`
  - define one bounded fallback; prohibit silent mixed universes
  - pre-publication integrity gate requires successful counts, header/seed parity, and required snapshot/header; preserve prior immutable publication on failure
  - load contract:
    - cold: maximum one workspace read plus one serialized/deferred distribution read; zero guard `409`
    - scope switch: maximum one of each per new cache key
    - no duplicate heavy key and no mailbox polling
  - dashboard correction remains separate: abortable queries, no cancelled-request logging, independent profile/metric error states; server consolidation only after auth/tenant scoping
- Primary correction files:
  - main `web/src/app/agents/[id]/operations/review/page.tsx`
  - main runtime `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
  - inbox-analysis route
  - integration `gmailCleanupWorkspace.ts`
  - `gmailArtifactStore.ts`
  - `gmailArtifactBuildRunner.ts`
  - `web/src/app/dashboard/page.tsx`
- Before any main artifact/publication implementation, run one bounded read-only Supabase metadata inspection using the authoritative Supabase skill:
  - inspect current publication/job state
  - inspect last error and liveness
  - compare header versus seed counts
  - no data write, build, publish, or rollback
- Reasoning: EXTRA-HIGH for main artifact/runtime correction; HIGH for cleanup compiler correction.
- Lint gate:
  - changed cleanup/main lineage files must have zero lint errors
  - repository-wide historical lint debt remains reported but outside scope unless Oliver authorizes a separate lint program
  - fresh production build/start plus browser console and visible behavior must still run without errors

Read-only Supabase seam lock — complete, no database mutation:
- Target: Supabase project `cjpjekhlvzwjwtszqpmy`, canonical agent `d256b48e-5acf-4b3d-af22-003d52e7e582`.
- Tenant resolution truth:
  - runtime correctly resolves `profiles.tenant_id` by joining `profiles.id = agents.user_id`
  - tenant identity is not `agents.user_id`
  - the first user-id-derived zero-row query was a diagnostic false assumption and is not a product defect
- Correct target counts:
  - publications: `6`
  - jobs: `341`
  - seed headers: `2,291`
  - seed rows: `581,774`
  - snapshots: `302`
  - cluster summaries: `2,291`
- Every active published artifact is internally consistent:
  - zero header-versus-row sender mismatches
  - zero message-count mismatches
  - zero headers without rows
  - cluster-summary parity
  - one snapshot per active publication
- `all_indexed` publication `full-mailbox-20260415024237593`:
  - `13` headers and summaries
  - `9,846` seed rows
  - exactly `4,923` distinct global senders
  - doubled row volume is overlapping structural plus semantic projection, not corruption
- Accepted selected-cluster universes are valid and non-overlapping:
  - `structural.protected_trust`: `1,844` distinct senders
  - `semantic.marketing_subscriptions`: `857` distinct senders
  - overlap: `0`
- Main visible failure mechanism is now locked:
  - UI compares selected-cluster distribution keys against the `4,923`-key global authoritative list
  - this manufactures `Sender distribution is incomplete for the current authoritative scope` despite valid selected-cluster data
  - root class: UI/runtime universe-identity mismatch, not publication corruption
- `all_indexed` later-refresh metadata remains failed:
  - `build_status=failed`
  - `freshness_state=refresh_failed`
  - a later full rebuild was reclaimed as stale on April 16
  - the earlier published version remains internally consistent and usable
- Separate lifecycle defect:
  - `7d` retains `building_version=full-mailbox-20260412003307051`
  - `build_status=building`, `freshness_state=refresh_in_progress`
  - corresponding job remains `running`, phase `projecting_sender_scope`, with no heartbeat since 2026-04-12 and zero processed counts
  - this build is definitively orphaned
  - sender-workspace header/page reads call `loadPublicationState` directly and do not invoke existing liveness reconciliation
  - a distribution-only `7d` read can therefore preserve stale running/building truth indefinitely
- No database values changed; no sensitive IDs, keys, or content were surfaced.

Locked main correction contract A — selected-universe and UI truth:
- Validate and order selected-cluster Sender Distribution against that selected cluster's authoritative sender keys or an explicitly filtered subset, never the `4,923` global universe.
- Check global/shared workflow parity only on surfaces that actually represent the global universe.
- Derive readiness and error markers from the selected active Sender Distribution tab and current request key, not the Time Context rail.
- Preserve valid published data when a later refresh failed; expose stale/refresh-failed metadata separately from data-integrity status.
- Preserve zero known-rejected initial-paint POSTs and the bounded request ceilings already defined.

Locked main correction contract B — lifecycle:
- Every read path that presents build/freshness truth, including sender-workspace header/page/focused/execution reads, reconciles liveness through one bounded single-flight seam before trusting `building` / `running`.
- Stale/dead build locks are reclaimable with CAS semantics; healthy/live work must not be mutated.
- Verification must prove transition behavior for the orphaned `7d` shape and final steady state.
- Do not manually write production data during diagnosis.
- No production database cleanup is authorized in this correction packet; correct code first, then request separate operational recovery authority only if still required.

Cleanup source/compiler correction — implemented and independently verified:
- Worktree: `/Users/olivercarlin/Dev/ai-agent-platform-cleanup-taxonomy-rebuild`.
- Reasoning: HIGH.
- Exactly `3` files changed with `30` insertions / `18` deletions:
  1. `web/src/app/agents/[id]/operations/review/page.tsx`
  2. `web/src/lib/integrations/gmail/inboxAnalysis.ts`
  3. `web/src/lib/integrations/gmail/gmailArtifactStore.ts`
- Implemented corrections:
  - named async result union plus separated cancellation / abort narrowing
  - exhaustive typed exclusion-label map
  - generic same-query-type CAS clause typing
- No behavior, database, auth, taxonomy, request, polling, publication, or CAS semantics were intentionally changed.
- Static and build proof:
  - `tsc --noEmit --incremental false`: PASS
  - targeted ESLint on the exact three changed files: PASS with `0` errors and `10` pre-existing warnings
  - fresh `npm run build`: PASS (`62` pages)
  - `git diff --check`: PASS
- Independent runtime verification:
  - verdict PASS; confidence HIGH; verifier decision ACCEPT for cleanup baseline repair only
  - exact production origin `http://localhost:3001`; ready in `221ms`; server stopped and port closed
  - saved auth persisted in a fresh context
  - all seven exact routes settled: login redirect/dashboard, agents, intelligence, clusters, protected review, Marketing review
  - prior clusters timeout did not recur; visible `Choose the next cleanup group`
  - Protected Review rendered protected trust, Sender Distribution, and sender list
  - Marketing rendered the intentional unit-only parent gate and `5` real published-unit links; no subset identity was invented or followed
  - no console, page, overlay, or duplicate-key errors; no `409` guard churn; no polling or overlapping heavy family
  - route-driven requests returned `200` / `ok`
  - no mutating control, build, publish, sync, rollback, mailbox cleanup, or manual database operation
  - Playwright CLI wrapper remained unstable after bounded retry; skill-authorized installed direct Playwright fallback completed equivalent browser proof
  - State Transition Matrix: N/A, navigation only
  - operator assist: none
- Proof bundle — ignored/local, not authoritative runtime context:
  - `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-cleanup-integration/cleanup-post-correction/`
  - key files: `verifier-report.md`, `verification-summary.json`, `production-server.log`, `clusters-post-settle.png`, `review-protected-post-settle.png`, `review-marketing-post-settle.png`, `cleanup-post-correction-trace.zip`
  - auth remained ignored, unread, and never printed
- Broad historical repository lint debt remains separate and non-blocking under the differential no-new-error policy; repository-wide lint is not claimed clean.
- Original cleanup head `382c9d6` remains the immutable archaeological reference.
- Current cleanup worktree state contains the three uncommitted correction paths above.
- Classification: cleanup baseline correction implemented and independently verified; not a new Accepted Fix and no Recovery Contract.

Main Contracts A/B correction — implemented, independently verified, and REJECTED:
- Reasoning: HIGH.
- Problem class: runtime behavior, narrowed to one scope-transition commit/readiness seam.
- Exactly three authorized runtime files are changed atop the prior `82` paths:
  1. `web/src/app/agents/[id]/operations/review/page.tsx`
  2. `web/src/lib/runtime/gmailCleanupWorkspace.ts`
  3. `web/src/lib/integrations/gmail/gmailArtifactStore.ts`
- Static proof: TypeScript PASS; targeted ESLint PASS with `0` errors and `13` old warnings; fresh build PASS; diff check PASS.
- Independent verifier decision: REJECT; confidence HIGH.
- Contract B: PASS.
  - direct current-source in-memory FakeSupabase harness only; no network or database use
  - `8` concurrent readers produced one liveness select
  - stale, missing, and terminal shapes produced one CAS plus upsert; live produced zero mutation; CAS loss produced no duplicate
- Contract A passing partial proof:
  - Protected cold All indexed: PASS; Sender Distribution ready from `sender_distribution`, `1,844` bars, Review senders, no visible error
  - Marketing cold All indexed: PASS on the exact parent route; no invented `subset_value`; ready with `857` bars and Review senders
  - Protected `1M -> 1Y`: PASS; `365d`, ready, `366` bars
  - Protected `1Y -> All`: PASS; ready, `1,844` bars
  - structured metadata fixture: PASS
  - incomplete cached sender-universe rejection and refetch: PASS
- Remaining accepted defect surface — Contract A FAIL:
  - Protected `All -> 1M` reached active URL/scope `30d` / `1M`
  - `sender_workspace` and `sender_distribution` both returned `200`
  - after approximately `120s` and `117` samples, the rail remained loading while visibly retaining the stale `1,844` All-indexed bars
  - ready-state was never satisfied
  - locked defect: the successful `30d` distribution response is not being committed or recognized for the active request key; stale prior-scope success remains visible under loading
- Accepted-flow load proof: four `sender_distribution` plus four `sender_workspace` POSTs, all `200`; cold phase deferred, later requests interactive; zero `initial_paint`, zero `409`, no polling or guard churn, and zero console/page/overlay errors.
- Auth persistence PASS. Playwright wrapper remained unstable after one bounded retry; installed direct Playwright fallback completed equivalent proof.
- Server stopped and port `3000` closed. Verifier made no source, database, control-plane, or Git mutation.
- Proof bundle — untracked/local and non-authoritative; do not commit:
  - `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-cleanup-integration/main-contracts-post-correction/`
  - primary files: `ui-verification-summary.json`, `protected-transition-all-to-1m-after.png`, `request-phase-probe.json`, `contract-b-harness-results.json`
  - auth contents remained unread
- Classification: partial proof only; no Accepted Fix and no Recovery Contract.

Contract A `All -> 1M` root cause — proven; Root Cause Execution Translation locked:
- Diagnosis confidence: HIGH.
- Request evidence: exactly one `sender_workspace` and one `sender_distribution` request started; both returned `200`. The authoritative `30d` distribution was empty in `1.811s`; the workspace returned an empty complete-key universe in `2.896s`. The UI retained stale `1,844` All-indexed bars under loading for `117` approximately one-second samples with no `409`, retry, polling, console, or page error.
- Proven mechanism:
  1. The distribution effect sets the `30d` request key to loading while retaining prior All-indexed data as a continuity seed.
  2. Concurrent workspace lifecycle resolution changes admitted workspace authority and derived expected-key/cache inputs by object identity while the semantic `senderDistributionRequestKey` remains unchanged.
  3. Those mutable same-key effect dependencies trigger React cleanup, cancelling the only generation.
  4. The replacement effect sees the same key plus loading and exits, incorrectly treating loading state as proof that a live owner exists.
  5. The valid `30d` response reaches the per-key client cache but the cancelled caller cannot commit it visibly.
  6. Later same-key renders continue returning from orphan loading; `1Y` succeeds because its distinct semantic key creates a generation that survives to commit.
- Primary invalidator: expected-key/workspace identity. Semantically stable cluster/runtime object identity is the only narrow additional possibility; the generalized ownership contract covers both.
- Proven-good seams that must be preserved: cache completeness, machine-readable metadata, per-key inflight deduplication, and Contract B store liveness.
- Root Cause Execution Translation — exact correction boundary:
  - only `web/src/app/agents/[id]/operations/review/page.tsx`
  - no correction edit to `web/src/lib/runtime/gmailCleanupWorkspace.ts`
  - no correction edit to `web/src/lib/integrations/gmail/gmailArtifactStore.ts`
- Required replacement logic:
  - semantic lifecycle identity is `agentId + senderDistributionRequestKey`
  - latest request plan, expected keys, cluster arrays, and cache inputs live in refs; mutable same-key rerenders do not own cancellation
  - active ownership is tracked by lifecycle key plus monotonically increasing generation
  - same-key loading suppresses work only while a live same-key owner exists
  - orphan same-key loading reattaches or calls through existing `fetchGmailSenderDistribution` per-cache-key inflight deduplication; it must not create a duplicate network request
  - completion commits only when active lifecycle key and generation still match; a superseded scope may populate cache but cannot overwrite visible state
  - cleanup invalidates only its owned generation
  - prior-scope data may seed loading continuity but cannot classify the new scope ready
  - no interval, retry, polling, expected-key request hashing, or broad dependency deletion without ownership
- Load invariants:
  - settled: `0` workspace / `0` distribution heavy requests
  - uncached cold or new scope/filter/window key: at most `1` workspace plus `1` distribution
  - cached revisit: `0` / `0`
  - same-key replay: one underlying request with attachment through existing deduplication
  - rapid `30d -> 365d`: no visible `30d` overwrite
  - accepted paths: zero `409` and zero polling
- Correction proof contract:
  - add no source test file; an optional deterministic temporary fixture may model expected-key/cache same-key churn and generation ownership, proving one network call, committed empty `30d`, and no orphan loading
  - focused runtime re-verification: exact Protected `All -> 1M`, then `1M -> 1Y`, `1Y -> All`, cold Protected, and cold Marketing only as cost-appropriate
  - capture post-settle artifacts, State Transition Matrix, and request traces
  - Contract B receives diff/invariant review only; do not rerun its full harness if store/runtime files are unchanged
  - do not repeat full diagnosis or Supabase inspection

Contract A ownership correction — partial improvement; second verification REJECTED:
- Verifier verdict: REJECT; confidence HIGH; execution mode `transitional_self_verification`; problem class runtime behavior.
- The first one-file ownership/generation correction resolved the prior stale/orphan-loading symptom: Protected `All -> 1M` no longer retained stale `1,844` bars and no longer remained stuck loading.
- It is partial improvement only, not an Accepted Fix and not a Recovery Contract trigger.
- Fresh main production runtime: `http://localhost:3000`; Playwright skill loaded; repo-env authentication refreshed and persisted only in ignored proof state.
- Protected cold All: PASS, settled ready with `1,844` authoritative bars.
- Protected `All -> 1M`: FAIL.
  - rail settled as `unavailable_scope` with zero bars and a visible incomplete-authority error instead of authoritative-empty ready state
  - `30d` `sender_workspace`: exactly one `200`, zero senders, `returned_sender_keys_complete=true`, phase `deferred`
  - `30d` `sender_distribution`: exactly one `200`, zero senders, phase `interactive`
  - `initial_paint=0`; `409=0`; no polling or retries; zero console/page/overlay/duplicate-key errors
- `1M -> 1Y`, `1Y -> All`, and Marketing cold were BLOCKED by the bounded stop after decisive failure; no result is fabricated.
- Contract B is unchanged and remains prior PASS; its full harness was correctly not rerun.
- Cleanup baseline remains PASS. Dashboard remains separate and blocked. Main and integration remain blocked.
- No database, data, schema, `7d` / `1W`, merge, rebase, cherry-pick, or history action occurred.
- Main HEAD remained `cce016b`; visible status path count was exactly `120`.
- Server stopped and port `3000` closed.
- Proof root — ignored/local, non-authoritative, and must not be committed:
  - `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-cleanup-integration/main-contracts-return-verification/.playwright-cli/return-proof/`
  - `verifier-report.md`, `verifier-diagnosis.json`, `verification-summary.json`, `protected-all-to-1m-before.png`, `protected-all-to-1m-after.png`, `protected-request-trace.json`
  - auth contents remain unread and must not be surfaced

Second Contract A root cause — authoritative-empty selector collapse; execution translation locked:
- Shared authoritative sender-key selection in `review/page.tsx:9129-9147` chooses only the first non-empty candidate, so an exact matching empty active-scope workspace is treated as absent and selection falls through to non-empty All-indexed shell/fallback keys.
- `review/page.tsx:9696-9713` correctly recognizes the empty distribution but computes missing ordered keys against those stale fallback keys.
- `review/page.tsx:10214-10220` maps the manufactured missing keys to incomplete-authority error; `review/page.tsx:10249-10258` maps that error to `unavailable_scope`.
- Root Cause Execution Translation — exact correction boundary remains only `web/src/app/agents/[id]/operations/review/page.tsx`:
  1. Preserve an exact matching active-scope workspace as authoritative even when its sender-key set is empty; never fall through merely because length is zero.
  2. Prior All-indexed data is loading continuity only while the `30d` workspace/distribution pair is in flight and must never become `30d` comparison authority.
  3. When exact `30d` workspace and distribution are both ready and empty, shared workflow universe, Sender Distribution, sender rows, and Decision Mode queue resolve to the same zero-sender universe; the rail is ready with visible empty-state copy.
  4. Preserve one workspace plus one distribution per uncached semantic key, no polling/retry/`409`, and cached return to All with no new distribution request.
  5. Do not edit runtime workspace/store, dashboard, database, cleanup worktree, or integration seams; do not exercise `7d` / `1W`.
  6. Re-verify the exact accepted matrix with post-settle screenshots, DOM captures, request traces, and State Transition Matrix.
- Classification: proven mechanism and exact bounded translation; no source change in diagnosis, no Accepted Fix, and no Recovery Contract.

Main Contracts A/B verifier candidate packet — historical gate state; accepted below:
- The ownership/generation correction and authoritative-empty selector correction together form the current candidate implementation.
- Verifier verdict: ACCEPT; confidence HIGH; `Missing Proof Type: none`.
- At this verifier gate, classification was candidate-only and Human Review remained the residual. The later acceptance closeout below supersedes that waiting state.
- Playwright skill carry-forward was followed against a fresh main production server at exact `http://localhost:3000`; fresh persisted authentication context remained ignored and its contents were not surfaced. Server stopped and port `3000` closed.
- Exact five-row State Transition Matrix: PASS.
  1. Protected cold All: ready, `1,844` authoritative bars, linked Review senders.
  2. Protected `All -> 1M` / `30d`: ready authoritative empty; zero bars; no error, loading, or `unavailable_scope`; workflow universe `0`, distribution `0`, sender rows `0`, Decision Mode queue `0`.
  3. Protected `1M -> 1Y` / `365d`: ready, `366` bars, linked senders.
  4. Protected `1Y -> All`: ready, `1,844` bars; cached return emitted zero new workspace/distribution requests.
  5. Marketing parent cold: exact parent route, no invented `subset_value`, ready, `857` bars, linked Review senders.
- Every row produced two stable ready samples plus a post-ready confirmation with no visible contradiction.
- Request/load proof:
  - cold All: one deferred workspace `200` plus one deferred distribution `200`
  - `30d`: one deferred workspace `200` plus one interactive distribution `200`
  - `365d`: one deferred workspace `200` plus one interactive distribution `200`
  - return All: zero workspace and zero distribution requests
  - Marketing cold: one deferred workspace `200` plus one deferred distribution `200`
  - `initial_paint=0`; `409=0`; polling false; maximum one request per uncached semantic key; no API POST failure, retry, console/page error, duplicate-key warning, or overlay
  - `21` aborted GET RSC/prefetch requests were harmless and did not interfere with an accepted surface
- Contract B hashes are unchanged and Contract B remains PASS; its full harness was correctly not rerun. Cleanup baseline remains PASS.
- Verifier required no operator assist and made no database, data, schema, auth-content, source, control-plane, or Git mutation.
- Main HEAD remained `cce016b`; visible status path count remained exactly `120`; proof is ignored.
- Proof root — ignored/local, non-authoritative, and must not be committed:
  - `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-cleanup-integration/main-contracts-return-verification/selector-correction/.playwright-cli/return-proof/`
  - `VERIFIER-REPORT.md`, `verification-summary.json`, `protected-all-to-1m-after.png`, `protected-1m-linked-parity-diagnosis.png`, `protected-request-trace.json`, `protected-trace.zip`, `marketing-cold-all-post-settle.png`
- Main overall integration baseline is not clear: the separate Dashboard baseline failure remains pending. Integration remains blocked. `7d` / `1W` and database action remain prohibited.
- Historical decision-gate status: Awaiting Decision; later resolved as `ACCEPT` below.
- Options presented at that gate:
  - `ACCEPT` — record Oliver's acceptance, create the required Recovery Contract, and propagate accepted-fix status through ACE-048
  - `REJECT` — return to diagnosis and bounded execution
  - `BLOCKED` — obtain additional proof or narrow operator assist
  - `RETURN_TO_PM` — rescope through Project Manager authority

Human acceptance closeout — Main Contracts A/B:
- Oliver explicitly accepted/authorized proceeding on 2026-08-15 through: “I am good with you proceeding how you think you need to proceed next” and “you have my full approval to proceed as you see fit.”
- Classification: Accepted Fix — scoped Contracts A/B sender-distribution correction only.
- Recovery Contract: `CHANGELOG.md` -> `August 15, 2026 — ACE-048 Main Contracts A/B Sender-Distribution Scope Truth Accepted`
- The five-row verifier matrix, bounded request contract, Contract B PASS, and cleanup PASS are accepted proof.
- This acceptance did not clear the separate Dashboard baseline, Gmail mailbox sync/index health, the overall main integration baseline, or integration itself. Gmail authentication and sync/index were subsequently recovered by the audit and authorized run below; artifact recovery remains open.

Newly governing sender-distribution source authority:
- `/Users/olivercarlin/Dev/ai-agent-platform-cleanup-taxonomy-rebuild` on branch `cleanup-taxonomy-rebuild` is authoritative for the sender-distribution feature family and its months of cleanup/taxonomy intent.
- Its immutable committed reference is `382c9d63d1812ca7489bd493856d00fc40096bf4` (`382c9d6`) plus exactly three independently verified local baseline correction paths:
  - `web/src/app/agents/[id]/operations/review/page.tsx`
  - `web/src/lib/integrations/gmail/gmailArtifactStore.ts`
  - `web/src/lib/integrations/gmail/inboxAnalysis.ts`
- `/Users/olivercarlin/Dev/ai-agent-platform` at `cce016b` remains the eventual integration destination and authority for later unrelated main-line evolution, subject to semantic union.
- Cleanup authority is feature-bounded: it does not make cleanup globally authoritative outside sender distribution.
- Main must not silently override cleanup sender-distribution semantics. Integration must preserve cleanup intent and manually reconcile later main changes around it.
- Both worktrees' authoritative control-plane files are required historical evidence for sender-distribution inventory and PM Brief authoring. The current root control plane remains the sole governing execution authority after this propagation; cleanup control-plane history is mandatory feature-intent input, not current global authority.
- Blind merge, cherry-pick, blanket conflict resolution, broad overwrite, or branch/worktree deletion remains prohibited.
- The prior `84` total / `47` identical / `37` disposition-path / `17` textual-conflict archaeology is now stale because the cleanup worktree contains verified local corrections. Recompute it before any integration packet or branch action.
- Before integration, preserve complete repository, Git-history, and Markdown understanding across both worktrees; verify Gmail integration authentication plus live sync/index health; then revise the manifest and PM Brief under this authority rule.

Pre-Smart-Sync Gmail health checkpoint — historical Partial Proof, 2026-08-15:
- Before operator action, `integration_connections` contained a Gmail connection with non-empty tokens and the required scopes, but access expiry was `2026-04-16`. Mailbox index truth was frozen at `237,628` total rows / `210,472` inbox rows, newest indexed message `2026-04-12`, `incremental_sync_auth_failed`, `invalid_grant` / `auth_failed`, no active run, and `requires_reconnect=true`. The completed 24-month historical backfill from `2026-03-19` remains intact.
- Oliver manually reconnected/resynced while the headed app was open. Reconnect persisted at `2026-08-15 07:49:43.103+00` with fresh access expiry `08:49:42.103+00`, non-empty access and refresh tokens, and all required Gmail scopes. No token value is recorded.
- A minimal direct read-only Gmail `users/me/profile` request using the saved connection returned HTTP `200`: `gmail_authorized=true`, `messages_total=614,856`, `threads_total=569,764`, and a present history ID. OAuth and Gmail API access are restored.
- Mailbox indexing did not restart: status, counts, timestamps, and April failure state remained unchanged; `active_run=null`; no row growth occurred. `GET /api/integrations/gmail/mailbox-index` still reports `requires_reconnect=true` because it derives from stale index-failure state.
- Source tracing confirms the separation: the OAuth callback only upserts the connection and redirects to `/settings?gmail=connected`; it does not start indexing. `OperationsRuntimeContext` exposes Smart Sync as a distinct `POST` with trigger `smart_sync`, and passive loads intentionally do not auto-start it. Settings reports Connected from row existence, which is insufficient health truth and contradicted the stale index before reconnect.
- Artifact state remains separate and stale: `all_indexed` is `refresh_failed`; `7d` is stale `refresh_in_progress`; older `30d` / `90d` / `180d` / `365d` publications are unchanged.
- Classification: **Gmail AUTH RECOVERED / MAILBOX SYNC NOT YET RESTORED**. Proof is partial; this is not an Accepted Fix or milestone closeout. No Recovery Contract is created.
- Local proof root: `/Users/olivercarlin/Dev/ai-agent-platform/output/playwright/ace048-cleanup-integration/gmail-health-audit/`. Key post-action screenshot `.playwright-cli/page-2026-08-15T07-51-43-583Z.png` and endpoint snapshot `.playwright-cli/page-2026-08-15T07-51-43-111Z.yml` are ignored/local, non-authoritative, and must not be committed. No auth content is recorded here.

Authorized Smart Sync recovery and Supabase-load safety intervention — 2026-08-15:
- Oliver clicked Smart Sync at `2026-08-15 08:03:39Z`. The requested incremental run became effectively full because the prior newest-message state was falsely healthy; this was deliberate fresh-head recovery.
- The bounded `45`-day sync completed at `08:15:26Z`: `14` pages x `500`, `7,000` inserted/upserted, zero existing/updated/deleted, index rows `237,628 -> 244,628`, newest seen `2026-08-15 07:49:35Z`, oldest boundary `2026-07-01 08:30:56Z`, terminal reason `recent_window_reached`, `active_run=null`, and no sync error/failure.
- Classification: **Gmail OAuth + mailbox sync/index recovery PASS**. Semantic artifact recovery/publication is not complete; no Accepted Fix, milestone, or Recovery Contract is claimed.
- Avoiding Supabase crashes is a hard architectural constraint. Prior repeated direct pulls over the large mailbox dataset crashed servers. The intended architecture is bounded final/index pull -> semantic artifact candidate/publication -> runtime reads compact published artifacts, not repeated raw mailbox scans. Semantic artifact correctness remains a central unfinished workstream.
- Load discovery:
  - initial Operations review load directly requested and returned `100,000` indexed rows with page size `1,000`, query concurrency `8`, in `15.4s`
  - while a sync is active, `OperationsRuntimeContext` polls `GET /api/integrations/gmail/mailbox-index` every `5s`; each GET performs exact total/inbox counts plus other index/recent/artifact reads
  - PM closed the Operations tab to stop the `5s` polling
  - completed full-effective sync planned six sequential full artifact rebuilds: `all_indexed`, `7d`, `30d`, `90d`, `180d`, `365d`
  - a historical `all_indexed` build processed `4,923` senders / `237,628` messages over about `32` minutes; six passes imply roughly `1.5M` streamed row reads plus writes/retries
- Candidate-only `all_indexed` build began. PM terminated exact local Next PID `58033` at a safe boundary after sync completion and before fanout; port `3000` is closed. This prevented an unattended six-scope workload without mutating database state during propagation.
- Published `all_indexed` artifact `full-mailbox-20260415024237593` remains public. Candidate `full-mailbox-20260815081528697` remains unpublished/building; its job was last observed running in `projecting_sender_scope` at `675` senders / `28,588` messages. No public swap occurred. It is expected to become liveness-reclaimable, but no reclaim or mutation is authorized here.
- The April-stale `7d` build was reclaimed failed before the new `all_indexed` candidate; prior scope publications otherwise remain in place.
- Supabase activity showed no PostgREST backlog; the local Next process was low CPU/memory before termination. These observations do not waive the hard load-safety constraint.
- Oliver authorizes PM and verification agents to use app controls as needed during declared testing. This does not authorize unbounded or heavy actions outside an explicit safety contract.
- A user-visible **Supabase & Artifact Safety Architect** task has been created to audit both worktrees read-only and produce a PM-Brief-ready safety plan.
- Proof is local/non-authoritative: the temporary operator screenshot at `/var/folders/1m/j6fk9rg15y388h2w15km4csm0000gn/T/TemporaryItems/NSIRD_screencaptureui_bHabGU/Screenshot 2026-08-15 at 3.03.47 PM.png` and the ignored Gmail audit root above. No authoritative runtime artifact was created.

Supabase & Artifact Safety Architect result — HIGH confidence; decision resolved as `ACCEPT` below:
- Architecture contract: bounded Gmail ingestion/index -> single-flight asynchronous semantic projector -> versioned candidate artifacts -> semantic/count/identity validation -> CAS publication pointer -> Operations reads compact immutable published artifacts. Request-time/runtime raw `gmail_messages` fallback is forbidden.
- Load amplification is confirmed: effective-full Smart Sync performs one full `244,628`-row stream for sender-stat recomputation before artifact refresh; six-scope automatic fanout can add `6 x 244,628` rows. Total raw-row reads are at least `1,712,396` before writes/retries. Separate request-time seams can reconstruct `100,000` raw rows, and `5s` mailbox-health polling performs expensive exact/recent queries.
- Orphan disposition contract:
  - keep public `full-mailbox-20260415024237593` unchanged
  - do not resume or publish partial `full-mailbox-20260815081528697`
  - only in a later separately approved database-mutation pass: prove no live worker, CAS-reclaim the matching stale lock, retain rows/checkpoints for forensics, mark version/job abandoned or failed, and leave the public pointer unchanged
  - resume is unsafe because the checkpoint lacks source, semantic, index, and configuration fingerprints and could mix old/new semantics in one version
- Required recovery order:
  1. isolate runtime reads from `gmail_messages` and split O(1) lifecycle status from expensive diagnostics
  2. install durable single-flight ownership/fingerprints; remove six-scope fanout and redundant sender-stat scan
  3. manually integrate cleanup semantic/candidate/CAS/rollback mechanics while preserving later-main lifecycle, UI, and request-ownership truth
  4. reclaim/abandon the orphan through a separately approved mutation pass
  5. build one new `all_indexed` candidate against the locked `244,628`-row index revision
  6. validate, CAS publish, and prove pointer-only rollback
  7. handle recent scopes later, one at a time or derived from one bounded pass
- Initial hard budgets:
  - Operations request-time raw `gmail_messages` rows `=0`; polling/status raw rows `=0`
  - artifact page default `12-50`, hard max `200`; first-paint artifact rows `<=1,000`; runtime artifact query concurrency `<2` per request family
  - raw build page size `<=1,000`, sequential; artifact writes `<=500`, sequential
  - one full build per tenant; global full-build concurrency `1` initially
  - one authorized full raw scan per index revision; sender stats produced within that stream
  - sync polling `10s +/-20%` jitter; artifact polling `15s` jitter against O(1) status; no idle/hidden polling
  - exact counts only at sync boundary, candidate validation, or explicit diagnostic; concurrency `1`; proposed statement timeout `5s`
  - maximum one automatic full candidate per sync; no six-scope loop
  - page operation: initial attempt plus two retries; job: one checkpointed resume; CAS publish: no blind retry
  - heartbeat `<30s` per checkpoint; reclaim after three missed heartbeats plus independent worker-liveness failure, target about `2m`
- Mandatory stop conditions: any runtime raw read; concurrent full build; second scope before terminal completion; page latency `>5s` or p95 `>3s` across three pages; retry exhaustion; count timeout; cursor/counter regression; stale lease; index-revision drift; semantic/hash/identity/protection/preview validation failure; CAS drift; or partial candidate exposure.
- No-truth-lie contract: index freshness and semantic-artifact freshness are separate. The index is current to August 15 at `244,628` rows while the public semantic artifact is from April 16; semantic analysis must not be called current. A building candidate is never visible as ready.
- Integration authority remains bounded: cleanup `382c9d6` plus exactly three verified local corrections governs sender-distribution/semantic intent, including candidate-only default, checkpoints, semantic schema/hash congruence, canonical identity, CAS publication, and pointer rollback. Preserve main's bounded sync recovery, liveness/CAS reclaim, current UI scope truth, focused paging, request ownership, and inflight deduplication. Wholesale hot-file merge remains prohibited.
- Result classification: PM-Brief-ready safety recovery plan; PLAN MODE only. No implementation approval, Accepted Fix, milestone, Recovery Contract, database mutation, runtime change, or authoritative runtime artifact.

Human decision and execution activation — 2026-08-15:
- Oliver explicitly decided `ACCEPT` on the PM-Brief-ready load-safe artifact recovery plan and instructed the flow to proceed.
- The prior `Status: Awaiting Decision` gate is closed. This is acceptance of the plan, not an Accepted Fix, milestone, or Recovery Contract trigger.
- Execution commitment: immediate execution in the same governed `ACE-048` flow.
- Active PLAN MODE slice: **Runtime Read Isolation + O(1) Lifecycle Status**.
- Slice problem class: runtime behavior, constrained by artifact/publication truth.
- Objective: accepted Operations surfaces perform zero request-time and poll-time reads from `gmail_messages`; lifecycle polling reads bounded O(1) state/publication/job records; missing artifacts fail closed or present explicit unavailable/stale truth without raw fallback.
- Load contract:
  - runtime raw rows `0`; poll raw rows `0`
  - artifact page default `12-50`, hard max `200`; first-paint artifact rows `<=1,000`
  - runtime artifact query concurrency `<2` per request family
  - sync poll `10s +/-20%` jitter and terminal; artifact poll `15s` jitter against O(1) status
  - hidden/idle polling off; exact counts never recurring
- Read-only preflight proved the original four candidate seams insufficient and locked this exact implementation set:
  - `web/src/lib/runtime/gmailCleanupWorkspace.ts`
  - `web/src/lib/runtime/runtimeStateService.ts`
  - `web/src/app/api/integrations/gmail/mailbox-index/route.ts`
  - `web/src/components/runtime/OperationsRuntimeContext.tsx`
  - `web/src/app/api/integrations/gmail/inbox-analysis/route.ts`
  - `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
  - `web/src/lib/integrations/gmail/gmailWorkspaceContracts.ts`
- Preflight basis: the server integration workspace contains request-time `gmail_messages` fallback seams; the inbox-analysis route dispatches the accepted Operations requests into them; the shared page contract currently permits `1,000`, above the accepted `200` maximum.
- Read-only validation dependencies only unless new proof returns to PM target-lock refinement:
  - `web/src/lib/integrations/gmail/inboxAnalysis.ts`
  - `web/src/lib/integrations/gmail/gmailMailboxIndexer.ts`
  - accepted Operations page files and artifact-store readers
- Semantic taxonomy, resolver/group logic, candidate/CAS mechanics, cleanup authority (`382c9d6` plus three corrections), the April public pointer, and the partial August candidate are protected from change in this slice.
- Task-scoped authoritative runtime artifact: `docs/00_control_plane/runtime/ACE-048_RUNTIME_READ_ISOLATION_PM_BRIEF.md` — UPDATED as the active correction packet for this slice.

First independent transfer-only verifier rejection and correction activation — 2026-08-15:
- Verifier task `01a00480-e47b-75b1-9509-00e3b751fe15`: `REJECT`, confidence HIGH. The candidate must not transfer to original main.
- Original main remains outside the candidate diff and its fresh production build passes on Next `16.0.10` with all `63` routes. Candidate work remains isolated at `/Users/olivercarlin/.codex/worktrees/9ae2/ai-agent-platform`.
- Source-proven candidate defects:
  1. accepted sender-workspace request time calls the whole-artifact sender-scope-rollup loader, which pages `1,000` rows until exhaustion and violates the aggregate first-paint budget
  2. compatibility semantic fallback loads all selected-cluster seed rows and per-sender stats, while its later gate counts clusters rather than actual rows queried
  3. Time Context identity is inconsistent: workspace can silently return all-indexed success while overview and distribution reject windowed shapes
  4. inbox-analysis hard-codes ready/fresh/published success metadata, and runtime readiness relies on count/timestamp movement instead of explicit publication freshness/build truth
- Required correction:
  - remove whole-artifact sender-scope enumeration; optional enrichment may query only the already-bounded current page's sender keys, hard-capped at `200` and included in the `<1,000` aggregate budget
  - remove runtime semantic recomputation; consume persisted published `semantic_rollup` truth or return machine-readable `artifact_unavailable` / `semantic_truth_unavailable`
  - use one truthful Time Context contract across workspace, distribution, and overview: bounded published projections with normalized identity, or the same honest unavailable result; never substitute all-indexed truth
  - derive route metadata from the actual publication, including status/reason/retry/freshness/build/published/building versions
  - readiness must treat missing/building/refresh-pending/refresh-in-progress as transitional; stale/failed/refresh-failed/full-rebuild-required as terminal unavailable; published fresh/refresh-skipped as usable. Counts/timestamps may supplement but never override explicit state
- Preserved verifier PASS boundaries: named artifact-only dispatches cannot reach `gmail_messages`; recurring mailbox status is bounded O(1); page clamps are `12/50/200`; polling remains `10s/15s` jittered, visibility-aware, single-flight, terminal, and without recurring exact counts; semantic taxonomy and publication/CAS/orphan state remain unchanged.
- At the first-rejection checkpoint, the seven-file target lock remained unchanged and `gmailArtifactStore.ts` stayed read-only pending PM adjudication. The second-verifier result below supersedes that target-lock boundary.
- Candidate diff remains isolated (`+947/-462` versus HEAD; `+864/-444` versus current main). The isolated `node:crypto` build blocker is not candidate-caused; original-main fresh-build PASS proves build proof remains obtainable after an accepted transfer.
- Classification: correction packet ACTIVE; no Accepted Fix, milestone, Recovery Contract, runtime transfer, database/artifact mutation, or Human Review gate.

Second independent source re-verifier rejection and final bounded correction activation — 2026-08-15:
- Verifier task `01a00480-e47b-75b1-9509-00e3b751fe15`: second `REJECT`, confidence HIGH. Candidate transfer remains prohibited.
- Previously corrected mechanisms remain PASS: whole sender-scope loader removed; persisted `semantic_rollup` only; route success metadata publication-derived; normal polling jittered/single-flight; recurring status bounded O(1).
- New source-proven blockers:
  1. `build_pending_poll` accepted hydration can still enter selected-cluster bootstrap in `runtimeStateService.ts` and call raw cleanup discovery, reaching up to `100,000` `gmail_messages` rows through `1,000`-row pages at concurrency `8`
  2. both readiness classifiers check missing `published_version` before explicit terminal freshness/build states, allowing stale/failed truth to be misclassified as transitional
  3. the `historical_out_of_inbox` recent-scope overview branch returns a bare `409` before the shared Time Context unavailable helper and loses normalized identity plus publication metadata
  4. actual read budgets cannot be enforced without bounded changes inside `gmailArtifactStore.ts`: selected-cluster rail queries run concurrently, header reads lack hard limits, and previews can load roughly `1,000` rows before later rejection
- PM target-lock refinement: expand from seven to exactly eight implementation files by adding `web/src/lib/integrations/gmail/gmailArtifactStore.ts`.
- `gmailArtifactStore.ts` authority is limited to read budgeting and concurrency: sequential rail-family reads; hard-limited rail/header queries (recommended `<=100` each); workspace headers `<=100`; previews `<3` per sender so a `200`-sender page remains `<600`; actual-returned-row accounting; fail closed before follow-on budget breach; exact filters and existing cache/inflight semantics preserved.
- Required correction:
  - propagate artifact-only accepted hydration through selected-cluster bootstrap so `build_pending_poll` and accepted snapshot/poll transitions return pending/unavailable lifecycle truth instead of invoking cleanup discovery; explicit manual diagnostics remain unchanged
  - classify terminal explicit states first, transitional build/refresh states second, and missing publication only after those checks; usable requires a published version with fresh or `refresh_skipped` truth
  - route the historical overview edge through the same `time_context_projection_unavailable` helper and publication-derived metadata as workspace/distribution
  - enforce actual artifact row budgets inside the now-authorized store seam without changing schema, indexes, data, publication, build, CAS, reclaim, or orphan mechanics
- Exact load invariants remain: request/poll `gmail_messages=0`; concurrency `1`; defaults `12/50`, max `200`; aggregate actual rows `<1,000`; recurring status O(1); polls `10s/15s` jittered, visibility-aware, single-flight, and terminal.
- Candidate remains isolated at `/Users/olivercarlin/.codex/worktrees/9ae2/ai-agent-platform`; original-main source remains untouched and its baseline build PASS remains governing proof.
- Classification: final bounded correction packet ACTIVE; no Accepted Fix, milestone, Recovery Contract, transfer, runtime/Playwright verification, or data/artifact mutation.

Third independent source-verifier rejection and final micro-correction activation — 2026-08-15:
- Third verifier decision: `REJECT`, confidence HIGH. Candidate transfer remains prohibited.
- All previously rejected functional mechanisms now PASS: accepted request/poll raw `gmail_messages=0`; raw fallback severed; explicit state precedence corrected; Time Context parity corrected; store queries capped and sequential; semantic reconstruction removed; publication-derived metadata; recurring O(1) status; poll/page caps preserved.
- Remaining source-proven defects are telemetry/concurrency truth only:
  1. `loadLatestCleanupDiscoverySnapshotsForScopes` uses `Promise.all` across as many as seven missing scopes. Each miss may perform an exact `agent_events` query plus a bounded `40`-row fallback, so cold bootstrap can reach concurrency `7`. The full accepted chain remains below the row ceiling (maximum `30` queries / `501` returned rows), but violates concurrency-one and reports incomplete aggregate telemetry.
  2. Execution-preview telemetry deduplicates sender-key and message-ID arrays before computing `actualReturnedRowCount`, undercounting rows actually returned by Supabase. The pre-query maximum remains safe at `901`, but the post-query guard and telemetry are not truthful.
- Final micro-correction touches exactly two files within the unchanged eight-file lock:
  - `web/src/lib/runtime/runtimeStateService.ts`
  - `web/src/lib/integrations/gmail/gmailArtifactStore.ts`
- `runtimeStateService.ts`: replace missing-scope `Promise.all` with deterministic sequential awaits; preserve cache and exact-then-`40` fallback resolution; accumulate actual query/returned-row counts without new queries; propagate telemetry through `resolveSelectedClusterRailBootstrapSnapshots` into `cleanupPlanDetailMs` and structured logs; full-chain artifact concurrency must report and remain `1`.
- `gmailArtifactStore.ts`: compute actual returned rows from the base read plus raw sender-preview and raw message-preview result lengths before deduplication; keep output-deduplicated counts separate; use pre-dedup actual count for telemetry and the post-query guard; preserve the `901` pre-query maximum, sequential reads, output dedupe, filters, cache, and publication/write mechanics.
- Any other implementation file is forbidden; the eight-file program lock remains unchanged and a ninth file still requires PM return.
- Classification: final micro-correction ACTIVE; no Accepted Fix, Recovery Contract, transfer, build, runtime/Playwright verification, or external mutation.

Independent Supabase & Artifact Safety transfer-only source gate — ACCEPT/HIGH, 2026-08-15:
- Verdict: `ACCEPT`; confidence HIGH. The exact eight-file candidate has cleared the source-only transfer gate.
- This is not an Accepted Fix and does not establish runtime acceptance. Artifact, database, and Gmail state were unchanged and unqueried during this gate.
- Proven load ceilings and telemetry truth:
  - cold bootstrap maximum `30` queries / `501` raw compact artifact rows
  - execution-preview maximum `901` raw rows
  - artifact query concurrency `1`
  - accepted request and polling families read zero `gmail_messages`
  - telemetry counts raw rows before deduplication and propagates query count, raw returned rows, cache hits, and cache misses
  - `runtime_artifact_query_concurrency=1` truthfully represents the full accepted chain
- All prior A-E source boundaries PASS: artifact-only runtime; persisted `semantic_rollup` required; terminal publication precedence; honest `time_context_projection_unavailable` parity; recurring O(1) status; `12/50/200` page limits; `10s/15s +/-20%` visibility-aware single-flight terminal polling; no mutation path.
- Transfer authorization is strictly semantic and hunk-preserving across exactly eight files. Whole-file overwrite is prohibited, especially for `web/src/lib/runtime/gmailCleanupWorkspace.ts` and `web/src/lib/integrations/gmail/gmailArtifactStore.ts`, because original main contains overlapping later edits that must survive.
- Required sequence: propagate this gate -> semantic hunk-preserving eight-file transfer into original main -> targeted static checks and fresh production build -> independent Playwright/runtime verification.
- No `7d` / `1W`, artifact build/publish/reclaim, database, Gmail, deployment, history, merge, commit, or push action is authorized by source acceptance.
- Classification: source gate ACCEPTED; transfer packet ACTIVE; runtime acceptance and Accepted Fix remain NO.

Semantic eight-file transfer and static/build correction proof — 2026-08-15:
- The exact eight locked files were transferred into current original main through semantic, hunk-preserving patches.
- No ninth file, whole-file overwrite, merge, cherry-pick, stage, commit, push, or history action occurred.
- All eight final hashes match the independently source-accepted candidate.
- Overlapping later-main work was preserved:
  - runtime `gmailCleanupWorkspace.ts`: prior main `+83/-18`; transfer added `+41/-2`
  - `gmailArtifactStore.ts`: prior main `+45/-2`; transfer added `+243/-77`
  - six runtime-loader overlaps were resolved additively, preserving main request/snapshot logic while adding accepted publication freshness/build/version metadata
  - artifact store preserved main cache, liveness, publication, CAS, and write behavior
- Resulting transfer total: `+1439/-1223`.
- Static/correction proof PASS:
  - non-incremental TypeScript
  - targeted ESLint with zero errors and the same six inherited warnings
  - deterministic full source guard
  - sequential-bootstrap and pre-dedup fixture guard
  - `git diff --check`
  - no staged or unmerged entries
- Fresh original-main production build PASS on Next `16.0.10`: compile, TypeScript, and static generation `63/63`; build artifact newer than source inputs.
- Preserved source contract: request/poll `gmail_messages=0`; bootstrap `<=30` queries / `501` rows; preview `<=901` rows; concurrency `1`; raw pre-dedup telemetry; `12/50/200`; `10s/15s` jittered visibility-aware single-flight terminal polling; O(1) status; fail closed; persisted `semantic_rollup`.
- No database, Gmail, artifact lifecycle/publication, CAS, reclaim, orphan, `7d` / `1W`, deployment, history, commit, or push action occurred.
- Classification: implementation transferred and static/build proof PASS; Accepted Fix NO; runtime acceptance NO; independent Playwright/runtime verification REQUIRED.

Independent post-transfer runtime verifier — REJECT/HIGH, 2026-08-15:
- Decisive surface: exact Protected cold All-indexed canonical route. Saved ignored authentication state PASS.
- Ready state was not reached after `120` samples / approximately `90s`.
- Final visible state: `unavailable_scope`, placeholder totals, zero sender rows, and Sender Distribution error while the UI simultaneously claimed refreshed publication truth was active. Linked-surface lifecycle truth is visibly contradictory.
- Initial inbox-analysis requests:
  - both heavy families started concurrently, while per-family concurrency remained `1`
  - each returned exactly one `409 artifact_building`
  - metadata was honest: `refresh_in_progress`, `building`, and both published/building versions
  - these were lifecycle responses, not `already_running` or cooldown churn
  - the corresponding two console errors map directly to those `409` responses
- Polling: mailbox-index intervals observed at approximately `14.2-19.6s`; two intervals exceeded the `15s +/-20%` ceiling.
- Runtime safety positives remain PASS: `request_time_gmail_messages_rows=0`; `runtime_artifact_query_concurrency=1`; no raw Gmail endpoint, `100,000`-row read, `5xx`, page error, overlay, or duplicate-key warning.
- Source-only ceilings `30/501`, `901`, and page `50/200` were not live-proven in this stopped runtime pass; page `12` was observed.
- Remaining matrix rows—scope switches, Marketing, fresh-context authentication, and exploratory discovery—were correctly stopped after the decisive failure.
- Proof root: `/Users/olivercarlin/.codex/worktrees/ad0d/ai-agent-platform/output/playwright/ace048-post-transfer-runtime-verification/.playwright-cli/runtime-proof/`.
- Server stopped; port `3000` closed; source/status/hashes remained invariant. Artifact, DB, and Gmail state were not mutated.
- Classification: runtime verifier `REJECT`, confidence HIGH; Accepted Fix NO; no Recovery Contract.

PM-accepted diagnosis, ninth-file rescope, and correction activation — 2026-08-15:
- Problem class locked: runtime behavior constrained by artifact/publication truth.
- Root mechanism proven at HIGH confidence:
  1. integration `gmailCleanupWorkspace.ts` rejects `refresh_in_progress` / `building` before reading an existing valid published version
  2. `review/page.tsx` coerces `build_pending` to ready when no continuity workspace snapshot is mounted
  3. workspace and distribution effects launch independently and concurrently
  4. the UI therefore combines refreshed/ready copy with unavailable totals, rows, and distribution
- Governing policy: during non-terminal refresh with a valid published version, read and display only the last published artifact, preserve stable totals/rows/distribution, and visibly label lifecycle `Processing`/building with both published and building identities. Never read/display the candidate and never call lifecycle ready. Terminal states and missing publication still fail closed.
- PM explicitly authorizes the diagnosis-proven ninth-file rescope. Exact correction target lock is two files:
  - `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
  - `web/src/app/agents/[id]/operations/review/page.tsx`
- No correction is justified in API routes, Operations context, runtime client, artifact store, or polling source. Any other file requires PM rescope.
- Loader correction: add a narrow stable-published-during-refresh allowance only for read-only workspace/distribution preflight and post-read checks; retain terminal precedence, persisted `semantic_rollup`, and all mutation/confirmation/execution/build/publication boundaries.
- Page correction: `runtimeContinuity.phase` is authoritative; no building-to-ready coercion. Sequence the exact request identity workspace then distribution. A cached matching workspace may permit distribution; workspace terminal/unavailable yields zero distribution requests and one shared lifecycle reason. Preserve owner/generation guards; add no retries, polling, general queue, or new request family.
- Expected cold heavy load: at most one workspace followed by one distribution; overall heavy concurrency `1`; recurring heavy requests `0`; `gmail_messages=0`; existing `30/501` and `12/50/200` bounds remain.
- Polling code is not in scope. The observed start intervals do not prove a defect because the timer is scheduled after completion. Correction proof must use fake timers/controlled jitter/request duration and live response-end-to-next-start timing; expected source contract is `12-18s` after completion, concurrency `1`, hidden cancel, terminal stop.
- Required deterministic fixtures: lifecycle table; published+building success metadata; terminal/missing fail closed; page `build_pending` remains building; deferred request orchestration; stale route ignored; poll timing.
- Required post-correction matrix: Protected cold All; Protected `All -> 30d -> All` with no `7d` / `1W`; Marketing cold All; fresh authentication; hidden/terminal poll after decisive pass; bounded rapid scope/cluster switch. Capture post-settle screenshot/DOM/trace per row. Natural building must show stable published data plus Processing; if it finishes naturally, deterministic fixtures prove the building edge.
- Historical activation result: the authorized two-file correction was implemented only in the isolated candidate. Runtime acceptance remains REJECT/HIGH; Accepted Fix NO; no Recovery Contract. The independent proof gate below now governs.

Independent transfer-only source gate — REJECT/HIGH for mis-targeted and incomplete proof, 2026-08-15:
- The exact two-file candidate remains materially aligned with the PM-approved correction contract. No source implementation failure or additional correction is currently proven.
- Source review PASS boundaries:
  - default, terminal, missing, and unknown publication states fail closed with terminal precedence
  - exactly four read-only stable-published-during-refresh opt-ins
  - candidate/stale identity guard and persisted `semantic_rollup` remain enforced
  - no mutation, build, raw-read, publication, or lifecycle safety weakening
  - `review/page.tsx` no longer coerces `build_pending` to ready
  - terminal state clears all linked stale data
  - normal cold source flow orders workspace before distribution
  - no new retry, poller, queue, or request family
- Transfer verdict is `REJECT`, confidence HIGH, because the Executor fixtures overclaimed actual-effect proof:
  1. polling proof string-matched source, simulated timing arithmetic, and hard-coded hidden/terminal results instead of executing the real `OperationsRuntimeContext` effect
  2. orchestration proof mapped a pure gate to request counts and hard-coded stale commits instead of executing the real distribution effect, deferred requests, dependencies, ownership/cache, and stale-response guards
- Rapid switching remains a bounded runtime risk: deferred overview workspace requests are not effect-aborted and single-flight ownership is cache-key scoped. The live peak across heavy request families and stale visible-install behavior must be measured.
- `Missing Proof Type: Obtainable`. This is proof mis-targeting/incompleteness, not evidence authorizing a source correction.
- Original main remains unchanged by this candidate correction. Candidate remains isolated at `/Users/olivercarlin/.codex/worktrees/33ad/ai-agent-platform` with exactly two new patch surfaces:
  - integration `gmailCleanupWorkspace.ts`: `+59/-6`, recorded patch identity prefix `c9252699`
  - `review/page.tsx`: `+255/-29`, recorded patch identity prefix `32fa8f5d`
- Historical planned gate: independent candidate-runtime correction proof against the isolated candidate. That gate has now run and returned the `REJECT/HIGH` recorded below; its prior PASS branch no longer authorizes transfer.
- Accepted Fix remains NO; runtime acceptance remains REJECT/HIGH; no Recovery Contract.

Independent candidate actual-effect verifier — REJECT/HIGH; read-triggered reclaim safety defect, 2026-08-15:
- Exact candidate: `/Users/olivercarlin/.codex/worktrees/33ad/ai-agent-platform`. Decisive surface: authenticated Protected cold All-indexed canonical route after settle.
- A normal ostensibly read-only `sender_workspace` request triggered hidden stale-build reclamation inside the application read path. Captured server telemetry recorded the proof-time transition:
  - `event=reclaimed_stale_build`
  - `building_version_after=null`
  - `freshness_state_after=refresh_failed`
  - `job_status_after=failed`
- These values describe the captured transition only. They do not assert current database state after the proof window.
- No write control was invoked and the verifier made no direct Supabase query or manual database change. The application read path itself mutated live publication/job state unexpectedly during a verifier-authorized read-only UI flow.
- The workspace family issued exactly one request and returned `503 artifact_unavailable`; distribution was correctly suppressed at zero requests.
- Linked UI defect: the page retained stale pre-reclaim `Processing` copy and obsolete published/building identities while totals were placeholders, sender rows were zero, and Sender Distribution failed.
- Runtime safety positives remain valuable and PASS for the observed Gate 1 window: workspace `1`; distribution `0`; accepted-heavy peak `1`; workspace page size `12`; artifact rows `50`; request-time `gmail_messages` rows `0`; artifact query concurrency `1`; no raw Gmail or `100,000`-row path; no `409` churn; one console error corresponding to the `503`; no page error, overlay, or duplicate-key warning.
- One mailbox-index request completed. Poll cadence/hidden/terminal behavior, cached path, scope loop, Marketing, and exploration were not run after the decisive Gate 1 failure.
- Proof root: `/Users/olivercarlin/.codex/worktrees/ad0d/ai-agent-platform/output/playwright/ace048-candidate-actual-effects/.playwright-cli/runtime-proof/`.
  - `protected-cold-all-after-full.png`
  - `protected-cold-all-after-rail.png`
  - `protected-cold-all.dom-state.json`
  - `protected-cold-all.request-trace.json`
  - `server.log`
  - `verifier-closeout.json`
  - `postflight-invariance.txt`
- Candidate and original-main tracked source/build/status/HEAD invariance passed. Server stopped and port `3000` closed.
- Classification: runtime verifier `REJECT`, confidence HIGH. Newly governing defects are unexpected read-triggered live publication/job mutation and stale linked lifecycle installation. This does not invalidate the two-file candidate wholesale; preserve it isolated and unaccepted. Transfer remains blocked.
- Historical post-verifier requirement, now completed below: PLAN MODE bounded read-only source diagnosis plus PM Root Cause Execution Translation. Required diagnosis was:
  1. trace the exact read function and call chain that performs liveness reconciliation/reclaim/mutation
  2. determine whether request-time status must be pure observation and reclaim moved behind an explicit governed maintenance/build command
  3. lock terminal precedence and the UI's post-response lifecycle refresh/install behavior after a read returns a transition
  4. return the exact source file and route lock before any correction
- No direct database inspection or mutation, repair/reclaim/build/publish/CAS, Gmail/Smart Sync, `7d` / `1W`, browser rerun, integration/transfer, merge, history, or deployment action is authorized.
- Accepted Fix remains NO; no Recovery Contract.

Source diagnosis and Root Cause Execution Translation — COMPLETE/HIGH; seven-file correction target locked, 2026-08-15:
- Exact hidden mutation chain:
  `sender_workspace` -> integration workspace loader -> bounded published artifact page loader -> `loadPublishedSenderWorkspaceArtifactHeaders` -> automatic `reconcileGmailArtifactBuildLiveness` when `building_version` exists -> reclaim CAS publication `UPDATE` + failure `UPSERT` to `gmail_artifact_jobs` + cache/telemetry update.
- Ordinary published reads can therefore write. The inherited read surface includes sender distribution, confirmation preflight, and whole/page/focused/key/execution artifact loaders.
- Separate mailbox-intelligence loading has opt-in `reconcileBuildLiveness`; request callers do not pass true and `runtimeStateService` explicitly passes false. Mailbox-index GET is observational. Explicit maintenance reconciliation already exists in post-Smart-Sync planning and `gmailArtifactIncrementalUpdater`, so published reads can be made pure without removing governed recovery.
- Hard policy:
  - request-time and poll-time readers are strictly observational with zero database writes
  - stale/dead build reclaim is reachable only behind explicit governed sync/refresh/recovery maintenance authority
  - a failed replacement candidate does not invalidate a separately usable published version
- Publication truth contract:
  - published + candidate building -> HTTP `200 building`; display only published artifact; retry/poll `15s`
  - published + failed/`refresh_failed` candidate, no building identity -> HTTP `200 degraded`; display matching published artifact; terminal/no retry; copy `Refresh failed — showing last published results.`
  - published + stale/`full_rebuild_required` -> `503 unavailable`; publication validity untrusted
  - missing published + building -> `409 artifact_building`; no data
  - missing published + terminal failure -> `503 unavailable`
  - published fresh/`refresh_skipped` -> `200 ready`
  - artifact identity mismatch against `published_version` -> `503 published_artifact_version_mismatch`
  - candidate/building rows never display; degraded is not ready; every envelope carries exact publication/lifecycle/version metadata
- Stale UI mechanism:
  - runtime rehydrate installed `build_pending` identities
  - terminal polling set local terminal state and returned without clearing/replacing `runtimeContinuity`
  - public client preserved lifecycle metadata only on failure and discarded it on success/cache paths
  - page mapped failure to unavailable but did not install returned lifecycle metadata
  - banner continued reading stale context
- Exact correction scope is locked to seven files:
  1. `web/src/lib/integrations/gmail/gmailArtifactStore.ts`
  2. `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
  3. `web/src/app/api/integrations/gmail/inbox-analysis/route.ts`
  4. `web/src/lib/runtime/gmailCleanupWorkspace.ts`
  5. `web/src/lib/runtime/runtimeStateService.ts`
  6. `web/src/components/runtime/OperationsRuntimeContext.tsx`
  7. `web/src/app/agents/[id]/operations/review/page.tsx`
- Preserve and amend the existing isolated two-file candidate; do not transfer it unchanged or overwrite its accepted hot-file behavior.
- Explicitly out of scope: mailbox-index route, `gmailArtifactIncrementalUpdater.ts`, schema, taxonomy/resolver, CAS publication, builders, database/data cleanup, and any eighth production file.
- Replacement logic:
  - remove liveness reconciliation from every published read loader while preserving the reclaim implementation and explicit maintenance callers
  - integration classification makes valid published + failed replacement candidate degraded usable only after identity validation; invalid/missing/mismatch truth remains fail closed
  - route emits exact `ready | building | degraded | unavailable` envelopes based on the publication actually used
  - public runtime client preserves lifecycle metadata on success and cache hits; data-only legacy cache must be version-bumped or rejected
  - runtime readiness adds `degraded_usable` based solely on a valid published artifact
  - Operations context clears persisted/in-memory `build_pending` on terminal poll without heavy refresh
  - page preserves workspace-first/distribution-second and installs lifecycle metadata only for the current `{requestKey, lifecycle identity, generation}`; degraded publication remains coherent across linked surfaces; invalid/missing/mismatch terminal truth clears linked data
- Load contract: before, a workspace read could add a hidden liveness read and up to two writes; after, request/poll writes `0`, raw Gmail `0`, workspace `1` then distribution `1`, heavy concurrency `1`, limits `12/50/200`, cold `<=30` queries / `<=501` rows, O(1) visible single-flight terminal polling, and no new request/retry/build/reclaim/publication family.
- Static correction proof must execute current modules: published page loader with a fluent fake asserting no update/upsert/delete/RPC; integration truth table/envelopes; public client fetch/cache lifecycle retention; runtime readiness and terminal context transition; page lifecycle reducer/owner guard; source callsite guard proving liveness reconciliation is reachable only from explicit maintenance modules.
- The callsite guard may be a verifier fixture/proof script only. If a committed test or an eighth production/source file is needed, implementation must stop and return to PM.
- Future actual-effect proof follows static correction proof: Protected cold All only for the natural state plus deterministic actual-function fixtures for published+building, published+failed, missing, invalid, building-to-failed terminal transition, and in-flight route change. Prove sequencing, linked parity, honest copy/identities, zero request writes, raw rows `0`, concurrency `1`, and terminal poll stop. Never mutate the database to manufacture lifecycle; no `7d` / `1W`.
- Classification: source-supported diagnosis/RCT COMPLETE at HIGH confidence. Problem class remains runtime behavior constrained by artifact/publication truth. Mode advances from PLAN to bounded correction execution only after byte-exact control-plane propagation. Accepted Fix NO; no Recovery Contract; transfer remains blocked.

Seven-file candidate implementation — LANDED; Executor static/correction proof PASS, 2026-08-15:
- Candidate: `/Users/olivercarlin/.codex/worktrees/33ad/ai-agent-platform`, detached HEAD `cce016b`.
- RETURN/stale-diff boundary:
  - pre-existing integration `gmailCleanupWorkspace.ts` baseline `+59/-6` and `review/page.tsx` baseline `+255/-29` belonged to the prior rejected attempt
  - Executor preflight treated those diffs as suspect and not as proof
  - the current pass preserved and amended them rather than transferring or overwriting them
- Exact current-pass seven-file implementation:
  1. `gmailArtifactStore.ts` `+1/-10`; SHA-256 `93ca4df4dae8191830a12c30199807c16bb3a690dbb96cfa04970144d0296375`
  2. integration `gmailCleanupWorkspace.ts` `+288/-85`; SHA-256 `4a81deee7eef7c7c3c5f5778ced2e15aa0e6bf3a2f0b0a38f80adff783ae8c52`
  3. `inbox-analysis/route.ts` `+34/-36`; SHA-256 `47caea42dc90dcb9206bfd2169dc27c586cd87d5e8e2d1bc8b857605e561b6ec`
  4. runtime `gmailCleanupWorkspace.ts` `+294/-63`; SHA-256 `88bd5329bd0ade01841b4c8a707cdc186a8335660b41b70ab16166f8d39a44bc`
  5. `runtimeStateService.ts` `+46/-20`; SHA-256 `ea5cfb0b1565d37f3a1301f56ebb3671b9349fe58dcfcfa69427619da77196ed`
  6. `OperationsRuntimeContext.tsx` `+116/-29`; SHA-256 `1ee095f3a5fc80be153f0ad405d14022bcba0d94b2de1045921a7d6ae76ab9f0`
  7. `review/page.tsx` `+354/-108`; SHA-256 `a8467bfbb3382a2c24a029664d17c6d50674f0fb5a9b55bbbfc1f3871853bc65`
- Current-pass total: `+1133/-351`. Candidate-versus-original total: `+1335/-274`. No eighth source or test file changed.
- Implemented behavior:
  - published reads are observational and do not automatically reconcile liveness
  - lifecycle contracts are `ready`, `building`, `degraded`, and fail-closed `unavailable`
  - building/degraded states serve only the matching published artifact
  - cache v2 preserves lifecycle/version metadata
  - runtime readiness supports `degraded_usable`
  - terminal polling clears persisted and in-memory `build_pending`
  - page ownership is keyed by `{requestKey, lifecycle identity, generation}`
  - a shared gate enforces workspace first, then distribution
  - exact degraded copy is `Refresh failed — showing last published results.`
- Preserved load contract: request/poll writes `0`; raw Gmail rows `0`; cold workspace `1` then distribution `1`; cached workspace `0` / distribution `1`; unavailable distribution `0`; heavy concurrency `1`; recurring heavy inbox-analysis `0`; bounds `12/50/200`; completion-aware visible single-flight terminal polling `12-18s`; no new request/retry/build/reclaim/publication family.
- Executor correction proof PASS:
  - actual-module fixture covered seven lifecycle cases; workspace/distribution building and degraded; published loader writes zero with maximum query concurrency one; public client network-then-cache fetch count one; four orchestration cases; stale-route ignore; polling hidden/terminal/inflight-one; reconciliation reachability opt-in/maintenance only
  - non-incremental TypeScript PASS
  - exact seven-file ESLint: zero errors, `19` warnings
  - `git diff --check` PASS
  - one fresh Next production build PASS with `63` pages
- Local/non-authoritative proof scripts:
  - `/tmp/ace048-seven-file.J9yiND/ace048-static-fixture.cjs`; SHA-256 `783aafb6cc5922aa9bd1c1b4a0d05f8595c549545ac23f33333ce5d28054bca4`
  - `/tmp/ace048-seven-file.J9yiND/register-typescript.cjs`; SHA-256 `7ddd9510cbd6d8dc1d5ddcd26ec83e2557d5ff5d7ea33c286d793ae3ae576032`
- No runtime server, browser, Playwright, Supabase, Gmail, database, or artifact action occurred.
- Candidate index and unmerged state are empty; candidate fingerprint `c63ee0b...`. Main locked source hashes and HEAD remain unchanged. Cleanup remains at `382c9d6` with fingerprint `dcffb597...`.
- Broader original/candidate status fingerprint changed externally from `06a9af0c...` to `c63ee0b...` only through unrelated control-plane/Playwright artifacts. Executor did not touch those surfaces. Independent verifier must re-preflight current status and all seven target hashes.
- Classification: material implementation landed and Executor static/correction proof PASS. This is not independent acceptance, runtime acceptance, or an Accepted Fix. Transfer remains blocked; no Recovery Contract.
- Active gate: independent source/correction verifier first, using HIGH reasoning, `verifier_native`, read-only actual-module/diff proof. Runtime/Playwright verification remains blocked until source verifier ACCEPT.

Independent source/correction verifier — REJECT/HIGH; three-file lifecycle ownership correction locked, 2026-08-15:
- Verifier verdict: `REJECT`, confidence HIGH. Playwright and transfer remain prohibited.
- Independently accepted source boundaries remain PASS and must not be reopened:
  - request/poll database writes `0`; raw Gmail rows `0`
  - cold workspace `1` then distribution `1`; cached workspace `0` then distribution `1`; unavailable workspace suppresses distribution
  - peak heavy concurrency `1`; bounds `12/50/200`; no new request/retry/build/reclaim/publication families
  - published loader writes zero; reconciliation reachable only from explicit maintenance authority
  - publication truth tables, taxonomy invariance, non-incremental TypeScript zero diagnostics, exact seven-file lint zero errors/`19` warnings, and diff check PASS
- Production build identity proof is missing because Executor cleaned `.next`; one verifier attempt was environment-blocked before compile because the candidate lacked a local dependency root. This is blocked proof only and is not causal to rejection. Do not repeat the build until the correction changes source and a known working dependency setup is available.
- P1 defect 1 — terminal unavailable linked-state clearing:
  - `OperationsRuntimeContext.tsx` `resolveTerminalOperationsRuntimeContinuity` maps stale, `full_rebuild_required`, missing, and other terminal unavailable truth to ambiguous `null`
  - polling then persists prior runtime data with null continuity and leaves `status.data` intact
  - because null also represents ordinary no-continuity, stale totals, rows, distribution, and Decision Mode may remain visible
  - source anchors are near candidate lines `888` and `1767`
- P1 defect 2 — lifecycle-stamped cache invalidation and ownership:
  - runtime `gmailCleanupWorkspace.ts` caches inbox-analysis envelopes for ten minutes under semantic request key without lifecycle identity and does not revalidate cache hits against current runtime publication/build identity
  - independent reproduction: network returned building; server truth changed to degraded; identical request reused cached building; changing cache version fetched degraded; total fetch count `2`
  - page distribution ready reuse checks request key + ready but omits lifecycle identity near line `9932`; effect dependencies omit lifecycle identity near `10111`
  - banner prioritizes cached workspace building over newer runtime degraded truth near `12086`
  - `{requestKey, lifecycle identity, generation}` therefore does not govern every reused or installed linked state
- Exact seven target hashes remained unchanged; main and cleanup remained unchanged; verifier modified no tracked/source file. Failed build left only ignored partial `web/.next` diagnostics and no `BUILD_ID`.
- PM Root Cause Execution Translation locks a micro-correction to exactly three files within the existing seven-file authority:
  1. `web/src/lib/runtime/gmailCleanupWorkspace.ts`
  2. `web/src/components/runtime/OperationsRuntimeContext.tsx`
  3. `web/src/app/agents/[id]/operations/review/page.tsx`
- Preserve the remaining four candidate files byte-identically. No other production or test file is authorized.
- Runtime client replacement:
  - admit/reuse cached lifecycle envelopes only when lifecycle identity exactly matches the caller's current runtime publication/build identity
  - thread lifecycle identity into the existing cache version/request identity; do not create a parallel cache
  - same semantic key building -> degraded/unavailable must miss or evict stale building and fetch/re-evaluate
  - preserve data and metadata together; continue rejecting legacy/data-only entries
- Operations context replacement:
  - represent terminal unavailable explicitly, never as ambiguous null
  - atomically clear persisted runtime data, `status.data`, and in-memory linked data/continuity for invalid, missing, stale, `full_rebuild_required`, and mismatch terminal truth
  - valid published + failed replacement remains `degraded_usable` and preserves published data
  - issue no heavy refresh, retry, or request; polling stops
- Page replacement:
  - include lifecycle identity in distribution ready reuse, owner identity, and effect dependencies
  - clear workspace, distribution, totals, rows, semantic focus, and Decision Mode when runtime terminal unavailable identity arrives
  - prevent cached workspace building metadata from overriding newer runtime degraded/unavailable truth
  - banner precedence favors newest runtime terminal/degraded truth over older cached workspace lifecycle
  - preserve workspace-first/distribution-second and add no request family
- Required correction proof: actual-module transitions for building -> degraded/stale/`full_rebuild_required`, same-key lifecycle changes, valid degraded preservation, atomic terminal clearing, stale cache miss/eviction, distribution dependency/reuse identity, banner precedence, and linked clearing; preserve prior truth/load fixtures; TypeScript, exact three-file lint plus seven-file regression lint, diff check, then one fresh build through a known working dependency setup. No start/browser.
- Classification: source/correction gate REJECT/HIGH. Read-purity/load root cause remains corrected. Exact three-file correction execution becomes active only after byte-exact propagation. Accepted Fix NO; runtime acceptance remains REJECT; transfer blocked; no Recovery Contract.

Three-file lifecycle cache/terminal-clearing correction — implemented; static/correction proof PASS; production build proof BLOCKED, 2026-08-21:
- Candidate: `/Users/olivercarlin/.codex/worktrees/33ad/ai-agent-platform`, detached `cce016b`; candidate fingerprint `e9fc350d28b88335b17bbcb36ff1f7fd74793cee9d262a76f6768fee566ca61d`.
- Exact current-pass source changes:
  1. runtime `gmailCleanupWorkspace.ts`: `88bd5329...` -> `0bab929d63144e95bc11c00c74a69e130d4b144a4607adec1cf4ec5c2c2196a5`
  2. `OperationsRuntimeContext.tsx`: `1ee095f3...` -> `1edac4904e43c661645dba6dd7f1e87af57c25aea1e5a40f734cde82cea514b8`
  3. `review/page.tsx`: `a8467bfb...` -> `99862dedec6bb8e5c0324101858c6651f51657da8c7c924c23624a65cdab5bf1`
- Locked-byte parity holds for artifact store `93ca4df4...`, integration workspace `4a81deee...`, inbox-analysis route `47caea42...`, and runtime state `ea5cfb0b...`. No other source/test file is authorized or reported changed.
- Implemented contract: lifecycle expectation identity governs cache admission and inflight ownership; changed identity evicts stale cache; explicit terminal unavailable clears memory/session/status/loaded identity; valid matching failed replacement remains degraded with published data; page lifecycle identity governs cache/effect/owner and terminal linked UI/Decision Mode clearing; newer degraded/unavailable truth outranks older cached building truth.
- Correction proof PASS: actual-module transitions/orchestration; unchanged hit, building -> degraded eviction/refetch once, terminal clearing, degraded preservation, stale-route ignore; request counts unresolved `0/0`, success `1/1`, cached `0/1`, terminal `0/0`; polling `12-18s`, inflight one, hidden cancel, terminal stop; raw Gmail zero, request writes zero, artifact query concurrency one, bounds `12/50/200`; non-incremental TypeScript zero; three-file lint zero errors/`13` existing warnings; seven-file lint zero errors/`19` existing warnings; diff check PASS.
- Local proof artifact: `/tmp/ace048-return.rrBRmq/ace048-return-fixture.cjs` — non-authoritative correction proof only.
- Production build proof: one and only one build attempt produced no output beyond `Creating an optimized production build` for six minutes, was terminated for cost control, exited `130`, and produced no `BUILD_ID`. Log `/tmp/ace048-return.rrBRmq/next-build.log` has SHA-256 prefix `e2c13e35`; partial `.next` is ignored/non-authoritative. No retry or managed build remains.
- Classification: **Partial Proof / Blocked Build Proof**. The build block is not source acceptance or rejection evidence. Source verifier remains REJECT pending an independent recheck; runtime acceptance remains REJECT; Playwright and transfer remain blocked. Original main and cleanup were untouched; Supabase was not accessed.
- Historical checkpoint next action: independent source verification and build-proof classification. It is superseded by the recorded source `ACCEPT/HIGH`; the active step is the separately scoped read-only/new-signal build-environment diagnosis. Do not start Playwright or transfer.

Independent source re-verification — REJECT/HIGH; response-lifecycle race locks two-file correction, 2026-08-21:
- The independent source/correction verifier rejected the candidate at HIGH confidence. Do not start Playwright or transfer.
- Proven P1 mechanism: the runtime client compares cached lifecycle envelopes with `expectedLifecycle`, but its successful network path normalizes, caches, and returns a response without comparing the response lifecycle with that expected lifecycle. Its linked-state reducer validates owner-to-owner identity but not result lifecycle against the request owner's expected lifecycle.
- Actual-module falsification: `resultOk=true`; returned lifecycle `building`; expected identity `degraded::pub-v1::no-building::refresh_failed::failed`; reduced status `building`; reduced installed data `true`; cached admission for that expected identity `false`. A degraded-owned request can therefore visibly install an older building response before the later cache read rejects it.
- Exact correction lock — no third file: `web/src/lib/runtime/gmailCleanupWorkspace.ts` (cache read around `2012`, network cache/return around `2113` and `2142-2147`, reducer around `1471`) and `web/src/app/agents/[id]/operations/review/page.tsx` (independent response-lifecycle versus request-owner validation at installation).
- Root Cause Execution Translation: compare every successful network response lifecycle with `expectedLifecycle` before cache write or return; fail closed with machine-readable expected/actual lifecycle on mismatch; independently validate page installation against request-owner lifecycle; add actual-module degraded-owner/building-response and terminal-owner/usable-response cases; reverify unchanged hits, one bounded transition refetch, and workspace-before-distribution/load counts.
- Preserved PASS boundaries: terminal-unavailable clearing, valid degraded preservation, polling, `12/50/200` bounds, read purity, matching-response load guards, seven-file boundary, and retained fixture. No new cache, request, polling, write, Gmail, or build path is authorized.
- Production build proof remains BLOCKED/HIGH and non-causal; no build retry is justified in this correction or its source recheck. A separately scoped new-signal build-environment diagnosis is the only later retry path.
- Classification: source/correction gate REJECT/HIGH; Accepted Fix NO; runtime acceptance REJECT; transfer blocked. After byte-exact propagation, execute only the two-file correction in the isolated candidate, then run static/correction proof and an independent source re-verifier before any runtime verification.

Two-file response-lifecycle correction — implemented; no-build static/correction proof PASS, 2026-08-21:
- Candidate remains isolated at `/Users/olivercarlin/.codex/worktrees/33ad/ai-agent-platform`, detached `cce016b`; index and unmerged entries are empty and path-status fingerprint remains `e9fc350d...`.
- Exact current-pass changes: runtime `gmailCleanupWorkspace.ts` `0bab...` -> `c78215364d399e28ddacbc88041659dae7ccd117a98053dcf93bebca90c4e7f6`; review `page.tsx` `99862...` -> `988922673dcd746f742ed1c9fb1ed218b0652576549216e7b22e9a4453ffc898`.
- The other five governed files, including `OperationsRuntimeContext.tsx`, remain byte-identical. No source test or third file changed.
- Implemented behavior: every network success is lifecycle-validated before cache/return; mismatch returns machine-readable `response_lifecycle_mismatch` with structured expected/actual lifecycle; request owner retains expected lifecycle; reducer rejects mismatch; page revalidates workspace, semantic focus, and distribution before install so a mismatched stale success cannot repopulate linked state.
- Static/correction proof PASS: degraded-owner/building-success and terminal-owner/usable-success both fail before cache/install; no mismatched cache; correct lifecycle performs exactly one refetch; unchanged matching cache hit passes; counts `0/0`, `1/1`, `0/1`, `0/0`; stale route ignored; writes/Gmail rows `0`; concurrency `1`; bounds `12/50/200`; lifecycle/polling preserved; TypeScript zero; two-file lint zero errors/`13` old warnings; seven-file lint zero errors/`19` old warnings; diff check PASS.
- No build was run. The prior blocked build remains separate, no `BUILD_ID` exists, and no retry is authorized. No DB, browser, server, Gmail, Supabase, transfer, stage, commit, or publication action occurred.
- Classification: Partial Proof. Accepted Fix NO; source/runtime acceptance remain REJECT pending independent read-only source recheck. Playwright and transfer remain blocked.
- Next deterministic action: independent read-only source/correction verifier re-preflights this exact candidate and two changed hashes, validates the actual-module lifecycle mismatch proof and preserved safety/load boundaries, and does not retry a build by default.

Independent source/correction recheck — ACCEPT/HIGH; build diagnosis is next, 2026-08-21:
- The independent verifier accepted the exact two-file response-lifecycle correction at HIGH confidence. No source findings remain and the verifier wrote no source changes.
- Verified contract: network lifecycle validation before cache/return emits structured `409 response_lifecycle_mismatch`; owner/reducer and separate page workspace, semantic-focus, and distribution guards prevent mismatched responses from installing linked state.
- Actual-module proof accepted: degraded-owner/building and terminal-owner/ready responses reject before cache/install; no mismatch cache; correct lifecycle refetches once; next matching hit passes. Terminal clear/degraded preservation, counts `0/0`, `1/1`, `0/1`, `0/0`, writes/Gmail `0`, concurrency `1`, bounds, polling, and scope behavior remain PASS.
- Candidate hashes remain runtime `c78215364d399e28ddacbc88041659dae7ccd117a98053dcf93bebca90c4e7f6` and review `988922673dcd746f742ed1c9fb1ed218b0652576549216e7b22e9a4453ffc898`; the five other governed files remain exact.
- Build proof remains `BLOCKED/HIGH` and non-causal. No retry is authorized. Accepted Fix NO; runtime acceptance remains REJECT/HIGH; Playwright and transfer remain blocked.
- Next governed stage: separately scoped, read-only/new-signal build-environment diagnosis. Inspect environment, process/toolchain state, partial `.next`, the blocked log, dependency-clone differences, and known successful main-build conditions. Only a specific causal new-signal hypothesis can later authorize one bounded recovery build through new propagation. No source edits in diagnosis.

Build-environment diagnosis — ENVIRONMENT MECHANISM FOUND/HIGH; one bounded recovery build active, 2026-08-21:
- The independent read-only diagnosis established that the candidate stall was environmental: Codex/macOS sandbox repeatedly denied Node PID `12779` local ephemeral IPC bind (`network-bind local:*:0`) throughout compile, while Next `16.0.10` worker-utils uses `server.listen(0)`.
- No source, compiler, TypeScript, OOM, or crash mechanism was found. The blocked build is stale for acceptance because it predates the source-accepted runtime `c78215364d399e28ddacbc88041659dae7ccd117a98053dcf93bebca90c4e7f6` and review `988922673dcd746f742ed1c9fb1ed218b0652576549216e7b22e9a4453ffc898` hashes.
- Diagnosis changed no files. Source correction remains ACCEPT/HIGH; Accepted Fix NO; runtime acceptance remains REJECT/HIGH.
- After byte-exact propagation, authorize one and only one recovery build outside the restrictive sandbox: frozen current hashes; clean candidate-local dependencies; verify six native binaries byte-identical to original main and record persistent provenance as non-causal metadata; preserve stale `.next` under `/tmp`; exact command `/opt/homebrew/bin/npm run build`; hard `180s` limit; abort at `60s` with no progress; no retry.
- Success requires exit `0`, non-empty fresh `BUILD_ID`, fresh manifests newer than governed inputs, and retained sanitized evidence. Abort/no retry on bind denial, source error, or no progress.
- Playwright, transfer, stage, commit, merge, push, deployment, DB/Gmail/Supabase/artifact mutation remain blocked until the recovery-build result is propagated. No source edit is authorized by this recovery-build packet.

Recovery-build precheck abort — environment preparation correction active, 2026-08-21:
- No build ran; attempt count remains `0`. No `.next`, dependency, or environment mutation occurred during precheck.
- Packet/head/seven source hashes/package manifests/index/unmerged/process/lock checks passed. The supplied `48e3e70e` fingerprint was wrong provenance. Canonical candidate default-porcelain fingerprint remains `e9fc350d28b88335b17bbcb36ff1f7fd74793cee9d262a76f6768fee566ca61d`; all-untracked and NUL forms are different algorithms and must not block this flow.
- Candidate `web/.env.local` is absent. Original-main ignored `web/.env.local` is the approved existing environment source.
- The recovery packet now authorizes a temporary byte-for-byte copy from original-main to candidate before the one bounded build, with names/presence-only validation, no reading/logging of values, no inclusion in evidence, and removal after sanitized evidence capture. Verify source existence and ignored status before the copy.
- The one-shot recovery build remains pending/authorized and unconsumed. All external-sandbox IPC, `180s`, `60s`, no-retry, and success/abort gates remain unchanged.

Recovery-build precheck abort #2 — non-causal provenance gate removed, 2026-08-21:
- Build attempt remains `0`; no build, `BUILD_ID`, build log, environment copy, `.next` move, source/docs/Git, or external mutation occurred. Evidence root: `/tmp/ace048-build-recovery.hr73F1`.
- Packet/head/status canonical `e9fc...` fingerprint, seven hashes, index/unmerged, package manifests, all `880` dependencies, dependency locality, process/lock, and original-main ignored environment presence passed. Six candidate native modules are byte-identical to original main.
- `com.apple.provenance` persists on candidate native modules: `xattr -d` reported success but the attribute remained; a byte-identical `cp -X` temporary probe also retained it.
- Provenance/security scan remains known secondary, non-causal metadata: it completed early, while the sustained stall was sandbox local-IPC denial. Do not mutate xattrs again.
- Replace the impossible native-module provenance gate with byte-identity verification of the six native binaries against original main and recorded non-causal provenance presence. All other recovery-build gates remain unchanged; one build remains pending and unconsumed.

Recovery build — PASS; bounded candidate runtime verification active, 2026-08-21:
- One attempt and zero retries: `/opt/homebrew/bin/npm run build` outside the restrictive sandbox exited `0` in `21.724s` with `BUILD_ID` `N3LRSG7T4OiDVM8b8_QNf`. Compile, TypeScript, page-data collection, and `63` static pages passed; required manifests are nonempty and newer than governed inputs.
- Evidence root: `/tmp/ace048-build-recovery.hr73F1`; build-log SHA-256 `efc8b2d043a84304ce7a85c796b058cf85f991e12daa53f083a0e8940a0aafe1`.
- Frozen seven hashes remain unchanged; candidate HEAD `cce016b`, status fingerprint `e9fc350d...`, index/unmerged empty. Stale `.next` was preserved, fresh `.next` retained, temporary environment removed, no secret values logged, and no process remains.
- Build proof PASS. This is not runtime acceptance, Accepted Fix, or transfer authorization. Source/correction remains ACCEPT/HIGH; runtime acceptance remains REJECT/HIGH.
- Next stage: independent bounded candidate runtime/Playwright verification before any transfer. Use the governed Protected canonical route `http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=structural.protected_trust` and the governed Marketing parent route recoverable from accepted packet/artifacts; do not guess IDs. No `7d`/`1W`, mutation, DB/Gmail/Supabase/artifact action, or transfer.

Candidate runtime verification — BLOCKED/HIGH; runtime safety adjudication required, 2026-08-21:
- Independent runtime verifier established saved ignored authentication and started/stopped the fresh-BUILD_ID production server cleanly, but did not open the accepted route. Protected cold All remains pending; no State Transition Matrix row ran, ready state is NO, and post-settle artifacts are NO.
- Navigation was blocked because historical reads on this surface caused stale-build reclaim and persistent publication-state mutation, conflicting with the no-mutation boundary and Supabase safety constraint. No workaround was attempted.
- No workspace, distribution, poll, raw Gmail, mutation, guard, or Supabase-inspection request was exercised. Source/build/worktree invariants remain unchanged; port is closed and environment absent.
- Evidence: `/Users/olivercarlin/.codex/worktrees/ad0d/ai-agent-platform/output/playwright/ace048-independent-candidate-runtime/.playwright-cli/runtime-proof/BLOCKED.md`, with `preflight-snapshot.txt` and `server.log` in the same root.
- Classification: Missing Proof Blocked; no product-runtime verdict. Source ACCEPT/HIGH and build PASS remain valid; runtime acceptance REJECT; Accepted Fix NO; transfer blocked.
- Continuation requires explicit operator authorization accepting persistent-mutation risk or a safely isolated runtime where reads cannot mutate publication/lifecycle state. Do not request that authority implicitly.
- Active next step shifts to Claude transition/stabilization handoff planning and Git/worktree reconciliation while preserving this runtime blocker. `ACE-049` remains queued/inactive until an ACE-048 stabilization/handoff checkpoint.

Original-main landing — PASS; Git preservation packet active, 2026-08-21:
- Accepted dirty main state was committed and pushed. `main`, `origin/main`, live refs, and `heads/main` all resolve to `05249103ab23b3d7cbf30cccfa5747fac90616d6`.
- Landing commits: `b6bdc9e93feeff3b480d5f0b42744f9ea87b000d` security auth-state removal; `866c549cf43fe12795180e9f1be859164997176f` Gmail Operations lifecycle stabilization; `05249103ab23b3d7cbf30cccfa5747fac90616d6` control-plane reconciliation.
- Main worktree/index/unmerged are clean; diff check PASS; nine runtime hashes unchanged; `output/playwright/` is ignored and `275` proof files remain local ignored. No build/runtime/DB/deploy/merge/rebase/history rewrite occurred.
- Push reported canonical remote redirect to `cvn74oliver/automata.git`; configured origin remains unchanged. Stale `gh` authentication did not block plain Git push.
- Candidate `33ad` remains detached `cce016b` with accepted seven-file correction/build PASS/runtime BLOCKED. Cleanup remains `382c9d6` with its exact three verified local corrections.
- Correction: read-only comparison against clean `0524910` proves candidate differs in exactly six governed source files: runtime `gmailCleanupWorkspace.ts`, `runtimeStateService.ts`, `OperationsRuntimeContext.tsx`, inbox-analysis route, integration `gmailCleanupWorkspace.ts`, and review `page.tsx`. Mailbox-index route and `gmailWorkspaceContracts.ts` are byte-identical to clean main and must not be copied or committed on the preservation branch.
- Next: Git preservation only. Reconstruct candidate from clean `0524910` main plus exact six-file candidate-vs-main delta; commit cleanup's exact three corrections on its existing branch; push explicit named branches/commits; prove branch/hash parity before retiring ambiguous generated worktrees. No semantic integration, cleanup merge, or runtime route action. `ACE-049` remains inactive.

Git preservation — PASS complete; worktree-retirement/handoff preparation active, 2026-08-21:
- Live main is `2ffcae1fdf35ca246a94fc2172bba795f74bd809`; local/tracking/live parity holds and main is clean.
- `cleanup-taxonomy-rebuild` is live `c690dffed054486e7758be344b680ce418a08ee2`, upstream-set and clean, preserving the exact three correction hashes.
- `codex/ace-048-runtime-isolation-candidate` is live `87632d46891ec6b33eff4278acbc253fc04da77a`, parent clean main `2ffcae1f`; its exact six candidate files match detached `33ad`; mailbox-index route and `gmailWorkspaceContracts.ts` match main; branch local/tracking/live parity holds.
- Temporary preservation worktree was removed after proof. No semantic merge/integration/build/runtime/DB/deploy/history rewrite occurred. Runtime remains BLOCKED/HIGH; Accepted Fix NO.
- Residual detached worktrees `33ad`, `56ab`, `7865`, `95b7`, `9ae2`, `a985`, and `ad0d` remain at old `cce016b`; cleanup is clean. First perform read-only uniqueness audit, then retire only after proving all material state is on main, preserved branches, control plane, or explicitly retained.
- Next phases: generated-worktree retirement audit/cleanup; formal Claude handoff plus root `CLAUDE.md` importing official `AGENTS.md`, agent-neutral control plane, and first read-only audit assignment; final branch/live/control-plane reconciliation and commit/push. `ACE-049` activates only if successor-readiness criteria are met.
- Semantic integration remains intentionally outside main on the two preserved branches because runtime mutation-safety proof is blocked and hot-file integration is not accepted.

Worktree-retirement audit — new preservation truth, 2026-08-21:
- Redundant worktrees `56ab`, `9ae2`, `ad0d`, and cleanup checkout were removed after redundancy proof; branches/refs remain and external `/tmp` was untouched. `ad0d` ignored raw proof/auth files left with its worktree and are not Git-recoverable; outcomes/path summaries remain in the control plane and auth was never read.
- Retained linked worktrees: `33ad`, `7865`, `95b7` active CPA, `a985`, and main.
- Candidate preservation branch `87632d` is incomplete: add governed accepted/build-proven `web/src/lib/integrations/gmail/gmailArtifactStore.ts` SHA `93ca4df4dae8191830a12c30199807c16bb3a690dbb96cfa04970144d0296375`. Candidate preservation is exact seven-file delta after this addition; `33ad` retires only after all seven hashes match.
- `7865` and `a985` share identical unique intermediate bytes: artifact store `ab7fddbb0a4038a14cb27e86f84358d8f93f5fb4945b1b597d1d60eaaa476138` and runtime workspace `ce2e1050a26879dc5d6c5c201647d27328b6db20040e9ea0c2e671a801772a3a`. Preserve these once on `codex/archive/ace-048-intermediate-lifecycle` from clean main, clearly superseded/intermediate and non-authoritative; then retire `7865`/`a985` only after parity.
- Next bounded preservation: add/push candidate artifact-store commit and prove seven hashes; create/push archival two-file branch and prove `a985` identity; remove only `33ad`, `7865`, `a985` after live parity. No branch deletion, semantic integration/build/runtime/DB/deploy/history rewrite. `95b7` remains until handoff docs complete.

Historical successor-handoff authoring — superseded by Codex continuation, 2026-08-21:
- Candidate preservation is live `2597caf8a55da22aa4801958e156c2d665641c74` with exact seven accepted/build-proven files. Archival superseded/intermediate branch is live `59f6c7a778084ccad4aaa60985a989d807e36af1` with exact two files. Main `2ffcae1f...` and cleanup `c690dffe...` remain live.
- Worktree deletion of `33ad` was rejected by destructive-action safety because it would discard superseded control-plane variants and duplicated local proof. `33ad`, `7865`, `a985`, and active CPA `95b7` remain; deletion needs explicit operator decision. Previously removed `56ab`, `9ae2`, `ad0d`, and cleanup checkout remain preserved by branches.
- Authoritative successor artifacts: root `CLAUDE.md`, `docs/00_control_plane/handoffs/CODEX_TO_CLAUDE_HANDOFF.md`, and `docs/00_control_plane/handoffs/CLAUDE_FIRST_ASSIGNMENT.md`.
- The exact eight successor documents are committed/pushed on main as `1caf3b20ff3694146845c1eba016cfae6323fbfd` (`docs: add Claude successor handoff`); local main, `origin/main`, and live remote main have parity, and main worktree/index/unmerged state is clean with diff-check PASS.
- Historical classification at this point was SUCCESSOR AUDIT READY / SUCCESSOR IMPLEMENTATION NOT READY. The successor audit was not activated.

Codex-continuation governing-truth propagation — active, 2026-08-21:
- Oliver deferred Claude turnover. Codex remains active Project Manager/stabilization lead and must finish the bounded ACE-048 revival/integration program before any cutover. The three Claude artifacts are prepared but dormant continuity assets, not an active assignment.
- Current live main is `64632b3faa0736cdf15534b4465cdef8a404a4e8`, clean and live-equal when last verified. Preserved refs are cleanup `c690dffed054486e7758be344b680ce418a08ee2`, candidate `2597caf8a55da22aa4801958e156c2d665641c74`, and archival `59f6c7a778084ccad4aaa60985a989d807e36af1`. Retained worktrees are main plus `33ad`, `7865`, `95b7`, and `a985`; no deletion is authorized.
- Active Codex sequence: consolidate control plane; recompute live semantic-integration manifest and execution-ready PM Brief; resolve mutation-safe runtime verification and semantic-artifact disposition; repair Dashboard separately; integrate cleanup semantics manually on a main-derived isolated worktree; run post-integration build/Playwright/load-safety/human acceptance; complete bounded security/platform stabilization and safe worktree retirement; then refresh/activate the Claude handoff only at an accepted checkpoint.
- Mailbox-cleanup cards/groups are a primary accepted integration surface. The execution-ready brief must lock canonical cleanup routes and prove, after settle in Playwright, parity across sender counts/membership, semantic artifact source, group/subgroup identity, Sender Distribution, workflow totals, sender rows, Time Context, and Decision Mode. Cleanup documentation controls sender-distribution/semantic-grouping intent; later main behavior is preserved through manual semantic union. Unresolved taxonomy/surface identity returns to Oliver for screenshot walkthrough, never implementation guesswork.
- After verifier-backed cleanup-group integration proof, enter `Status: Awaiting Decision` for an explicit Human Review decision. A second final explicit Human Review gate is required before stabilization closeout or Claude activation. Oliver performed no Human Review in this consolidation unless explicitly requested; silence or general proceed direction is not runtime/UI acceptance.
- “Finish everything” is limited to the current revival/stabilization/integration program and an accepted main baseline. It does not authorize building the generalized visual builder, governed learning substrate, second domain, or multi-agent hierarchy before turnover.
- Future intended model after stabilization: Claude executes and Codex independently verifies through separate claimed branches/worktrees and control-plane-mediated handoffs. `ACE-049` remains queued/inactive; no Accepted Fix, runtime acceptance, merge completion, or app-stability claim is created here.

Explicit non-claims:
- Current-tree remediation does not claim Git-history remediation, broader credential rotation, route hardening, framework upgrade, Vercel adjudication, schema reconciliation, cleanup-lineage integration, or product implementation.
- Prior accepted Recovery Contracts remain historical accepted-fix truth and are not reopened.
- `ACE-011` remains completed historical context and must not be reopened.

Verified containment delta — 2026-08-15:
- The three exposed Supabase Auth sessions referenced by the tracked Playwright storage-state files were confirmed present.
- Each exact session was refreshed only as required to revoke that same session locally.
- A follow-up `auth.sessions` query returned no rows for all three exact session IDs.
- No unrelated sessions were touched.
- No token, cookie, credential, or session value is recorded in this control-plane event.
- Classification: exact-session containment verified complete; broader repository security containment remains open.

Accepted current-tree auth-artifact remediation — 2026-08-15:
- Implementation and independent verification are complete for the bounded current-tree remediation.
- Root `.gitignore` now rejects:
  - nested or root `.playwright-cli` directories
  - `playwright/.auth` directories
  - JSON auth-state, `auth_state`, login-state, `login_state`, storage-state, and `storage_state` filenames
- Exactly these four tracked auth-state files were deleted from the current working tree:
  - `output/playwright/ace046-auth-state.json`
  - `output/playwright/ace047_env_login_state.json`
  - `output/playwright/phase2_postsettle_final/auth_state.json`
  - `web/.playwright-cli/ace046-auth-state.json`
- Ordinary browser evidence remains unignored, including screenshots, traces, reports, DOM captures, and request traces.
- A generic tracked-current scan found zero files containing the Supabase auth-cookie marker; no secret or token contents were printed.
- Verification result:
  - independent verifier: PASS
  - `Missing Proof Type: none`
  - `git diff --check`: PASS
- Main HEAD and index were not changed; no commit or push occurred.
- `cleanup-taxonomy-rebuild` remains clean and untouched.
- Git-history exposure remains OPEN because all four blobs remain recoverable from current HEAD.
- Oliver issued post-implementation `ACCEPT` on 2026-08-15.
- Classification: Accepted Fix — current-tree remediation only.
- Recovery Contract: `CHANGELOG.md` -> `August 15, 2026 — ACE-048 Current-Tree Auth-Artifact Remediation Accepted`

Next deterministic action:
- After byte-exact propagation, run exactly one external-sandbox recovery build defined in `docs/00_control_plane/runtime/ACE-048_RUNTIME_READ_ISOLATION_PM_BRIEF.md`.
- Freeze hashes; preserve stale `.next` to `/tmp`; use clean candidate-local dependencies; verify six native binaries byte-identical to original main and record persistent provenance as non-causal metadata; run `/opt/homebrew/bin/npm run build` with hard `180s` and no-progress `60s` abort. Do not start the server or browser or access the database.
- Accept only exit `0`, fresh non-empty `BUILD_ID`, fresh manifests, and sanitized evidence; abort/no retry otherwise. Accepted Fix and runtime acceptance remain NO; Playwright and transfer remain blocked.
- Dashboard repair follows this safety gate, not before it.
- Recompute the exact dual-worktree integration manifest against the corrected cleanup working tree, loading repository/history/Markdown evidence from both worktrees and applying cleanup sender-distribution feature authority.
- Author and approve a staged semantic-integration PM Brief before creating/using a main-derived integration worktree for manual reconciliation.
- Integration remains blocked until the load-safe semantic-artifact plan and controlled candidate disposition, Dashboard/main baseline gate, and revised manifest/PM Brief gates resolve.
- Do not reopen the completed read-only Supabase seam lock or authorize production database cleanup or `7d` / `1W` action.
- No integration branch, safety commit, merge, cherry-pick, conflict resolution, or cleanup-lineage mutation may begin until both baselines satisfy the approved gate or Oliver explicitly changes it.
- Git-history remediation remains open as a separately planned security decision.
- Privileged-route hardening remains queued and must not run concurrently with integration.
- No application implementation may start from the pre-revival TODO or prior lane labels.

Affected authoritative documents:
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `07_reference/SYSTEM_MEMORY_MAP.md`
- `11_product_strategy/PRODUCT_ROADMAP.md`
- `docs/00_control_plane/EXECUTION_DASHBOARD.md`

Propagation status:
- Revival baseline documents aligned and accepted by Oliver on 2026-08-15.
- Current-tree auth-artifact remediation is accepted and linked to its Recovery Contract.
- Main Contracts A/B is an Accepted Fix with its Recovery Contract linked; the earlier auth-remediation Recovery Contract remains separate and unchanged.
- Active phase: Runtime Read Isolation + O(1) Lifecycle Status — source/correction recheck ACCEPT/HIGH; environment mechanism found/HIGH; one bounded external-sandbox recovery build pending byte-exact propagation; Playwright and transfer blocked.
- Human plan decision: ACCEPT. This is not an Accepted Fix or Recovery Contract. Gmail OAuth plus sync/index recovery remains PASS; semantic artifact recovery/publication remains incomplete. Dashboard, revised manifest/PM Brief, integration, database/orphan mutation, build/publication, history, deployment, app restart, and `7d` / `1W` remain blocked.
- `SYSTEM_MEMORY_MAP.md` now routes sender-distribution work through cleanup's authoritative control-plane history as mandatory feature-intent input while preserving the current root control plane as governing.
- `ACE-048` remains Active because the revival program and its queued execution lanes remain open.

### [ACE-049] Agent-Neutral Successor Environment Transition — Claude Code

Date: 2026-08-21
Owner: Oliver / Project Manager
Status: Planned / queued — **not active**
Propagation Owner: Control Plane Architect
Problem Class: architecture / operating-model transition
Execution Mode: logged deferred execution
Reasoning Level: MEDIUM

Decision:

- Claude Code is approved to become Automata's primary implementation environment only **after** the current ACE-048 cleanup, reconciliation, and stabilization cycle reaches its explicitly declared acceptance/cutover gate.
- `ACE-048` remains the sole ACTIVE revival/recovery authority. This event is subordinate planning only; it cannot interrupt, replace, or broaden the current three-file lifecycle cache/terminal-clearing correction in candidate `33ad`.
- No new product-development lane may begin after stabilization. Successor preparation is the next priority, and activation requires a separate explicit cutover decision.
- The durable operating model is agent-neutral: `Oliver -> Automata Control Plane -> Codex / Claude / future agents -> isolated worktrees or branches -> Git -> verification -> authoritative state`.
- A future root `CLAUDE.md` must import or reference root `AGENTS.md` and add only Claude-specific entry/efficiency guidance. It must not create a parallel control plane, duplicate authority, or weaken root rules.
- Codex and Claude must never modify the same working directory concurrently. Claude defaults to one capable session; a targeted subagent or limited parallelism is allowed only for genuinely independent work.
- After cutover, Claude must autonomously implement, test, verify, commit, merge, push, and propagate control-plane truth. Codex is not a required reviewer or dependency after handoff.
- Claude's first post-cutover assignment is read-only institutional onboarding/reconciliation with no repository, runtime, database, Gmail, artifact, deployment, or Git mutation.

Cutover gate and successor-readiness contract:

- The current ACE-048 cleanup/reconciliation/stabilization slice must be accepted against its declared gates; this does not require claiming every future revival/product stage complete.
- The authoritative repository must be clean or its intended dirt explicitly classified; intended work must be pushed; ambiguous worktrees/branches must be eliminated or explicitly documented; and recorded tests/builds, control-plane reconciliation, unresolved issues, and live-state verification requirements must be available to the successor.
- A formal handoff, authored only after that gate, must cover product, architecture, repository, control plane, decisions, implementation, debt, assignments, worktree lifecycle, tests/deploy/environment, prohibitions/approvals, lessons/failure modes, paused work, next assignment, and live-state verification requirements.
- “Perfectly stable” means verified against declared gates. Residual risk must be quarantined and documented, never hidden.

Current constraints:

- Do not create `CLAUDE.md`, a formal handoff, or a parallel Claude control plane during this deferred planning pass.
- Do not modify the ACE-048 runtime packet or its candidate hashes.
- No Accepted Fix, Recovery Contract, source/runtime/database/Gmail/artifact/Git/deployment change, or cutover occurs through this event.

Next deterministic action:

- Complete the current ACE-048 three-file correction and its required verifier gates. Once the stabilization cutover gate is explicitly accepted, activate the successor-readiness checklist and create the formal handoff artifacts in a separately approved bounded pass.

Propagation status: planned successor direction captured; ACE-049 remains queued/inactive and creates no competing active authority.

---

## Pre-Revival Ledger — Preserved Historical and Adjudication Context

The entries below are preserved without deleting historical decisions or Recovery Contract references. Their original `Status` fields are legacy source text and **do not grant current execution authority**. `ACE-048` is the sole governing revival event. Any prior item that remains relevant must be re-adjudicated into an explicit `ACE-048` execution packet before work resumes.



### [ACE-046] Analysis Rail Remaining Stability + Time Truth Cleanup

Date: 2026-04-09  
Owner: PM  
Status: Active  
Propagation Owner: Codex

Decision:
- The remaining Analysis Rail issue package is now governed by a separate post-ACE-045 cleanup lane.
- This lane must proceed in the following ordered phases:
  - Phase 1 — Rail Stability / Request Discipline
    - eliminate overlapping Sender Distribution request churn
    - resolve `already_running` / cooldown contention
    - stabilize scope switching behavior (`All indexed`, `1Y`, `1Q`, `1M`, `1W`)
    - clarify/normalize the authoritative scoped request path for protected/trusted senders
  - Phase 2 — Time Truth / Coverage Congruence
    - accepted and complete as the scoped Time Context state-model rebuild on the review page
    - route params are the durable scoped authority
    - bucket focus is local-only
    - default overview gate is baseline-only
    - scoped transitions use one navigation path and one workspace coordinator
  - Phase 3 — Canonical Time Context Truth Model Implementation
    - build one canonical daily sender-time fact model
    - add exact bucket span metadata
    - unify live-route, workspace-snapshot, and artifact/bootstrap timeline derivation
    - render `all_indexed` as full-history monthly truth when canonical data exists
    - eliminate scope-local recomputation inside visible Time Context derivation
    - keep the invariant: same dates = same senders = same counts
- This lane must remain separate from:
  - accepted runtime continuity work
  - accepted Time Context render-authority work
  - accepted coverage/backfill display work
  - accepted Sender Distribution `All indexed` reconciliation work
  - accepted hero/layout cleanup
  - unrelated copy polish or broader shell redesign

Reason:
- The prior Analysis Rail hardening lanes are accepted and closed, but the remaining Time Context work still exposes cross-scope contradictions because multiple derivation paths can produce different visible stories for the same dates.
- The next work must be phased and preserved in order so it is not lost or merged into unrelated follow-on cleanup.
- PM review established that separate scoped universes are not acceptable product behavior for Time Context; one visible truth model must govern all scopes.

Affected product areas:
- Operations Review
- Shared Analysis Rail review surface

Affected code areas:
- `review/page.tsx`
- `gmailCleanupWorkspace.ts`
- `inboxAnalysis.ts`
- `gmailArtifactFullMailboxProjector.ts`
- `runtimeStateService.ts`
- related Shared Analysis Rail presentation components, only when required by the phased lane scope

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md` when a minimal operating-model clarification is required

-Notes:
  - Phase order is governing truth and must be preserved:
    - Phase 1 first
    - Phase 2 second
    - Phase 3 third
  - Newly accepted runtime stabilization sub-fix under this active lane:
    - build-pending and failed-artifact request-flood conditions on the canonical protected-trust review route are now resolved
    - runtime now maintains a bounded single-owner polling pattern across:
      - `/api/agents/playground`
      - `/api/integrations/gmail/mailbox-index`
      - `/api/integrations/gmail/inbox-analysis`
    - no repeated relaunch loops, no multi-owner polling, and no 409 churn under both:
      - `build_pending_showing_stable_snapshot`
      - failed-artifact steady-state rehydrate
    - this establishes a stable runtime baseline required for further Phase 3 work
    - Recovery Contract: `CHANGELOG.md` -> `April 13, 2026 — ACE-046 Runtime Request-Flood Stabilization (Build-Pending + Failed-Artifact) Accepted`
- Historical post-stabilization runtime blocker under this active lane:
  - the canonical protected-trust review route previously failed on a server-side `inbox-analysis` `500`
  - root cause was a missing helper import in `gmailCleanupWorkspace.ts` on the `buildSenderWorkspaceActivityTimelineFromRows(...)` call path
  - the narrow runtime repair removed the `ReferenceError` and restored the blocked server execution path
  - this runtime blocker is no longer the governing Phase 3 blocker, but remains important historical continuity for this lane until accepted-fix closeout propagation is fully aligned
- Newly discovered governing Phase 3 truth under this active lane:
  - the remaining blocker is no longer route survival; it is timeline derivation inconsistency across the Analysis Rail surfaces
  - root cause = timeline derivation inconsistency
  - problem class = source / index truth
  - required fix = canonical timeline contract (`ace046_phase3_timeline_v1`)
  - Phase 3 — Canonical Time Context Truth Model is blocked by:
    - timeline derivation inconsistency across:
      - Time Context
      - Sender Distribution
      - workflow narrowing
    - multiple competing timeline models:
      - sender_activity (single-bucket assignment — invalid)
      - message_pressure (row-based — valid but separate)
    - bucket click-through not using canonical interval bounds
    - inconsistent timezone / boundary handling
  - Time Context, Sender Distribution, Sender Overview workflow filtering, and Mailbox Intelligence / Pressure Trend currently expose multiple metric families and multiple derivation paths that can produce conflicting visible stories
  - Phase 3 must now be governed by one canonical timeline contract, not by chart-local or scope-local recomputation
  - the canonical model must explicitly separate:
    - sender activity truth
      - metric = distinct active senders in bucket
      - bucket membership = sender had at least one qualifying message in the bucket
    - message pressure truth
      - metric = supporting messages in bucket
      - bucket membership = qualifying messages received in the bucket
  - Pressure Trend / Mailbox Intelligence message bars must not be treated as sender-count proof surfaces
  - Time Context must visibly declare its metric family and bucket semantics so operator validation does not depend on implied interpretation
  - exact bucket-span metadata is now required for every visible timeline bucket, including:
    - bucket start
    - bucket end
    - grouping kind
    - metric family
    - exact click-through filter contract
  - same dates must reconcile across daily, weekly, monthly, yearly, and full-history views when the metric family is the same
  - rolling windows and calendar buckets must not be conflated:
    - rolling `7d` / `30d` are distinct from calendar month / quarter buckets
    - clicking a calendar bucket must filter to that bucket only, with no bleed from adjacent months/quarters
  - execution is blocked unless all Time Context derivation paths switch to the canonical model in the same pass
  - partial migration across live route, workspace snapshot, artifact/bootstrap seed, or chart-local bucket math is invalid
- Accepted runtime continuity sub-fix under this active lane:
  - build-liveness reconciliation before continuity emission is accepted and complete
  - runtime now uses reconciled `build_is_live` truth instead of raw publication-row `build_status` alone
  - stale/dead build rows are reclaimed before continuity evaluation
  - Recovery Contract: `CHANGELOG.md` -> `April 9, 2026 — ACE-046 Runtime Continuity Build-Liveness Reconciliation Accepted`
- Accepted runtime sub-fix under this active lane:
  - Smart Sync -> artifact rebuild handoff is accepted and complete
  - Smart Sync completion now triggers or observes the expected artifact rebuild handoff without manual refresh
  - generic cooldown / `flag_disabled` gating no longer suppresses the required handoff
- Accepted runtime enforcement sub-fix under this active lane:
  - runtime guardrail enforcement is accepted and complete
  - continuity execution matrix is now enforced during build-pending runtime continuity
  - lifecycle polling is bounded and same-edge refreshes coalesce instead of stacking
  - critical lifecycle edges bypass stale publication-cache reads while steady-state caching remains intact
  - guarded heavy-action consumers attach instead of relaunching overlapping runtime work
- Newly discovered governing Phase 2 interaction truth under this active lane:
  - current product behavior allows Time Context and Sender Distribution bar clicks to drive an unintended full narrowed render / workflow collapse behavior
  - corrected product truth is:
    - bar click = local chart focus only
    - chart retains surrounding context
    - in-focus details may update
    - workflow sender universe must not collapse from chart click alone
    - clearing narrowed state should not be required to recover from an unintended isolated render
  - this is a product-truth clarification for the next scoped correction pass, not a runtime/data-truth rewrite
  - likely hot files:
    - `web/src/app/agents/[id]/operations/review/page.tsx`
    - `web/src/components/runtime/GmailCleanupComponents.tsx`
- Accepted Phase 2 closeout under this active lane:
  - protected-trust `all_indexed` review truth remains preserved at canonical `1844`
  - sender workspace / sender distribution parity for that restored `all_indexed` baseline remains preserved
  - scoped Time Context page-state orchestration is now accepted on the review route
  - accepted live proof on the canonical protected-trust route confirms:
    - `7d`
    - `30d`
    - `90d`
    - `365d`
    - no render loop
    - no red overlay
    - no flicker on the accepted run
    - bucket isolation confirmed on scoped `30d`
  - Recovery Contract: `CHANGELOG.md` -> `April 11, 2026 — ACE-046 Phase 2 — Scoped Time Context State-Model Rebuild Accepted`
- Do not reopen accepted `ACE-040`, `ACE-042`, `ACE-043`, `ACE-044`, or `ACE-045` while this lane is active.
- Phase state:
  - Runtime continuity build-liveness reconciliation: ✅ accepted and complete
    - Recovery Contract: `CHANGELOG.md` -> `April 9, 2026 — ACE-046 Runtime Continuity Build-Liveness Reconciliation Accepted`
  - Phase 1 — Rail Stability / Request Discipline: ✅ accepted and complete
    - Recovery Contract: `CHANGELOG.md` -> `April 9, 2026 — ACE-046 Phase 1 — Rail Stability / Request Discipline Accepted`
  - Smart Sync -> artifact rebuild handoff: ✅ accepted and complete
  - Runtime guardrail enforcement layer: ✅ accepted and complete
    - Recovery Contract: `CHANGELOG.md` -> `April 10, 2026 — ACE-046 Runtime Guardrail Enforcement Layer Accepted`
  - Runtime request-flood stabilization (build-pending + failed-artifact): ✅ accepted and complete
    - Recovery Contract: `CHANGELOG.md` -> `April 13, 2026 — ACE-046 Runtime Request-Flood Stabilization (Build-Pending + Failed-Artifact) Accepted`
  - Phase 2 — Time Truth / Coverage Congruence: ✅ accepted and complete
    - Recovery Contract: `CHANGELOG.md` -> `April 11, 2026 — ACE-046 Phase 2 — Scoped Time Context State-Model Rebuild Accepted`
  - Phase 3 — Canonical Time Context Truth Model Implementation: preserved as historical continuity only; direct implementation is not the active lane while `ACE-047` Phase 2 governs execution

---

### [ACE-047] Time Context Rebuild

Date: 2026-04-16  
Owner: PM  
Status: Active  
Propagation Owner: Codex

Decision:
- Time Context is now governed as a spec-driven phased rebuild lane.
- Governing documents for this lane are now:
  - `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_SPEC.md`
  - `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
- Active phase:
  - Phase 2 — Scope Semantics Lock
- Phase 1 — Runtime Safety / Churn Containment is now complete and accepted.
- Phase 2 now governs the next executable work for this lane.
- Execution model:
  - phased rebuild
  - spec-driven
  - no implementation may proceed outside the active defined phase

Reason:
- PM review established that Time Context work must no longer proceed as ad hoc fixes.
- The authoritative spec and phased plan now govern Time Context behavior and sequencing.
- Runtime safety must be re-locked first so later Time Context validation is trustworthy and does not reintroduce request churn or Supabase-risking load.

Affected product areas:
- Operations Review
- Shared Analysis Rail review surface
- canonical protected-trust review route during runtime diagnosis

Affected code areas:
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/app/agents/[id]/operations/review/page.tsx`
- `web/src/lib/runtime/runtimeStateService.ts` for accepted runtime safety / READY unblock work only

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md` only if a new operating-model rule is required

Notes:
- Historical continuity:
  - prior `ACE-046` runtime request-flood stabilization remains accepted historical truth
  - prior `ACE-047` verification-discipline intent remains historical context only and no longer governs the immediate next step
- Phase 1 complete:
  - eliminated mailbox-index poll loop caused by stale `active_run` gating
  - runtime now polls only when `execution_state === 'running'`
  - cold load, scope switching, and idle now operate with zero unnecessary churn
- Recovery Contract: `CHANGELOG.md` -> `April 16, 2026 — Phase 1 Runtime Safety Fix`
- Accepted runtime READY unblock:
  - runtime READY blocker is resolved on the canonical protected-trust review route
  - canonical route now reaches READY within the locked protocol window
  - baseline runtime snapshot now attaches without blocking on heavy selected-cluster bootstrap
  - `rehydrate_only` returns a minimal same-scope baseline rail seed from already-loaded cleanup discovery data
  - heavy selected-cluster rail-family bootstrap, artifact bootstrap, and deep rail hydration remain deferred from the initial baseline attach path
  - this unblocks Phase 2 final post-settle verification
- Recovery Contract: `CHANGELOG.md` -> `April 16, 2026 — ACE-047 Runtime READY Unblock Accepted`
- Governing execution rule:
  - no further Time Context implementation may proceed outside the phased rebuild order
  - no implementation may proceed outside the currently active defined phase

---

### [ACE-001] Cleanup Groups — Marketing Unit-Only Entry Model

Date: 2026-04-01  
Owner: PM  
Status: Active  
Propagation Owner: Codex

Decision:
- Marketing cleanup group (`semantic.marketing_subscriptions`) is now strictly unit-entry only.
- Parent-level broad review is blocked.
- All entry must go through a valid review unit.
- Invalid, missing, and blank unit routes are explicitly blocked with no fallback.

Reason:
- Prevents ambiguity in review scope.
- Enforces the first-click workflow contract.
- Eliminates silent broad-parent fallback.

Affected product areas:
- Cleanup Groups
- Review Page (Marketing only)

Affected code areas:
- `review/page.tsx`

Docs requiring propagation:
- `03_gmail_workspace/04_sender_decision_ui/06_cleanup_groups/Cleanup_Groups_spec_phase_plan.md`
- `03_gmail_workspace/04_sender_decision_ui/06_cleanup_groups/CLEANUP_GROUP_REDISCOVERY_IMPLEMENTATION_PLAN.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`

Notes:
- Behavior is implemented but not fully reflected across all Cleanup Groups documentation.

---

### [ACE-002] Cleanup Groups — Marketing Review-Unit Truth Model (Hero + Handoff)

Date: 2026-04-01  
Owner: PM  
Status: Active  
Propagation Owner: Codex

Decision:
- Marketing review page hero and decision handoff now use unit-scoped truth only.
- Parent totals are no longer allowed in KPI positions.
- Unit counts must come from the full unit dataset, not the page slice.

Reason:
- Eliminates “what am I reviewing?” confusion.
- Aligns top-of-page truth with workflow truth.

Affected product areas:
- Cleanup Groups
- Review Page

Affected code areas:
- `review/page.tsx`

Docs requiring propagation:
- `03_gmail_workspace/04_sender_decision_ui/06_cleanup_groups/Cleanup_Groups_Discovery_Spec_(Artifact-Driven).md`
- `03_gmail_workspace/04_sender_decision_ui/04_workflow_integration/decision_ui_flow.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`

Notes:
- Docs still partially describe parent-scoped summaries.

---

### [ACE-003] Time Context — Row-Backed Monthly Truth (All Indexed Fix)

Date: 2026-04-01  
Owner: PM  
Status: Active  
Propagation Owner: Codex

Decision:
- `All Indexed` timeline is now built from real selected-cluster rows.
- Bucket counts = distinct senders active in that month.
- Message counts = real indexed messages in that month.

Reason:
- Previous implementation produced misleading data.
- Required for trust in the Shared Analysis Rail.

Affected product areas:
- Time Context
- Shared Analysis Rail

Affected code areas:
- `inboxAnalysis.ts`
- `gmailCleanupWorkspace.ts`
- `GmailCleanupComponents.tsx`

Docs requiring propagation:
- `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
- `03_gmail_workspace/04_sender_decision_ui/01_analysis_rail/Shared_Rail_Analysis_spec.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`

Notes:
- Docs still reference older timeline logic.

---

### [ACE-004] Time Context — Bucket Truth vs Workflow Scope Clarification

Date: 2026-04-01  
Owner: PM  
Status: Active  
Propagation Owner: Codex

Decision:
- Bucket bars = distinct active senders.
- Supporting messages = email volume.
- Bucket counts are non-additive.
- Workflow scope remains authoritative.

Reason:
- Prevents misinterpretation of chart data.

Affected product areas:
- Time Context
- Shared Analysis Rail

Affected code areas:
- `GmailCleanupComponents.tsx`

Docs requiring propagation:
- `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
- `03_gmail_workspace/04_sender_decision_ui/01_analysis_rail/Shared_Rail_Analysis_spec.md`
- `03_gmail_workspace/04_sender_decision_ui/02_distribution_chart/SENDER_DISTRIBUTION_CHART_SPEC.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`

Notes:
- Spec docs still mix additive vs non-additive logic.

---

### [ACE-005] Residual Runtime Issue — Empty Action Inbox Analysis Requests

Date: 2026-04-01  
Owner: PM  
Status: Active  
Propagation Owner: Codex

Decision:
- Empty `action:""` inbox-analysis requests are invalid and must be eliminated.

Reason:
- Indicates malformed request path.
- Creates runtime instability risk.

Affected product areas:
- Gmail Workspace runtime
- API layer

Affected code areas:
- `operationsWorkspace.ts`
- `gmailCleanupWorkspace.ts`
- `inbox-analysis` API route

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`

Notes:
- Not blocking feature acceptance, but must be resolved before system hardening.
- April 2 review-path runtime hygiene pass narrowed the scoped review route:
  - `operationsWorkspace.ts` and `gmailCleanupWorkspace.ts` already guard missing actions before fetch
  - fresh-boot review-route sessions can still emit malformed inbox-analysis POSTs even with those guards in place
  - the inbox-analysis API route now distinguishes:
    - `reason: "empty_request_body"` for empty-body / null-body transport noise
    - `reason: "missing_action"` only when a valid object exists but `action` is missing/blank
    - `reason: "invalid_json"` for non-empty unparsable bodies
  - diagnostics now log `body_length` and `parse_status` alongside referer/origin/body keys so empty-body transport noise is not misclassified as missing action
- April 2 live probing also confirmed the remaining review-path runtime noise is a cold boot request to `/api/agents/playground`:
  - source = `OperationsRuntimeProvider` bootstrap via `fetchOperationsRuntimeSnapshot`
  - bucket interaction was not implicated by the scoped callers
- The current review-route cold-boot `/api/agents/playground` request is now proven required under the present architecture:
  - `review/page.tsx` depends on runtime snapshot data before clusters/workflow context can resolve
  - removing the request in this lane would require a broader runtime-seeding redesign outside scope
- This event remains open until the emitting empty-body inbox-analysis runtime path is identified and removed.

---

## Completed Change Events

### [ACE-046-TURNOVER] Analysis Rail PM v3 → PM v4 Turnover Continuity Capture

Date: 2026-04-09  
Owner: PM  
Status: Active  
Propagation Owner: Codex

Decision:
- Capture turnover continuity ONLY (no product change).
- Explicitly state that ACE-046 Phase 2 is the active governing execution phase and must remain unchanged.

Reason:
- Preserve lane continuity across PM replacement and ensure no governing truth remains only in the retiring session.

Affected product areas:
- Operations Review
- Shared Analysis Rail

Affected code areas:
- none (docs-only)

Docs requiring propagation:
- CURRENT_STATE.md
- TODO.md
- ACTIVE_CHANGE_EVENTS.md

Notes:
- Confirm Phase 2 remains active next step
- Confirm Phase 3 remains queued
- Confirm no new governing product truth was introduced beyond what is already captured in ACE-046
- Confirm no scope expansion occurred

[ACE-045] Operations Review Hero/Layout Cleanup

Date: 2026-04-09
Owner: PM
Status: Complete
Propagation Owner: Codex
Propagation Status: Accepted fix propagated; Recovery Contract recorded

Decision:
- The Operations Review top fold now keeps the hero limited to cleanup-group identity, actions, KPI cards, and the `Sender Review Goal` section directly beneath the KPI cards.
- `Smart Sync continuity`, `Page Truth Guide`, and related support/status sections now remain outside the hero in the restored stacked full-width layout.
- This accepted fix remains separate from any future copy polish or broader shell redesign.

Reason:
- The prior top fold mixed support/status content into the hero and later regressed width grammar during the first cleanup attempt.
- The accepted corrective implementation restored the intended visual hierarchy without reopening any accepted data/runtime lanes.

Affected product areas:
- Operations Review
- Shared Analysis Rail review surface

Affected code areas:
- `review/page.tsx`

Docs updated:
- `06_system_state/CHANGELOG.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

Recovery Contract:
- `CHANGELOG.md` -> `April 9, 2026 — ACE-045 Operations Review Hero/Layout Cleanup Accepted`

[ACE-044] Analysis Rail — Sender Distribution `All indexed` Reconciliation Cleanup

Date: 2026-04-08
Owner: PM
Status: Complete
Propagation Owner: Codex
Propagation Status: Accepted fix propagated; Recovery Contract recorded
Recovery Contract: `CHANGELOG.md` -> `April 8, 2026 — ACE-044 Sender Distribution All indexed Reconciliation Cleanup Accepted`

Decision:
- Sender Distribution on the Operations Review page now renders authoritative full-population truth for `All indexed`.
- The accepted contract guarantees:
  - full-population Sender Distribution truth for `All indexed`
  - no false `distribution incomplete` render-block on the accepted surface
  - alignment between the distribution dataset and the authoritative workflow sender universe
  - preserved separation from coverage/backfill, Time Context, runtime continuity, and layout work

Reason:
- The accepted defect was a workspace reconciliation + review-page render-gating mismatch on the canonical Operations Review route.
- The prior `All indexed` rail could classify authoritative distribution data as incomplete because the rail payload and the workflow-driving sender universe were not derived from the same full sender population.

Affected product areas:
- Operations Review page
- Sender Distribution
- Shared Analysis Rail sender-universe reconciliation

Affected code areas:
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/app/agents/[id]/operations/review/page.tsx`

Docs requiring propagation:
- `06_system_state/CHANGELOG.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

Notes:
- `ACE-043` remains accepted and closed.
- `ACE-042` remains accepted and closed.
- `ACE-041` remains active unchanged as the control-plane execution-efficiency layer.
- `ACE-040` remains accepted and closed.
- Hero/layout cleanup is now active under `ACE-045` as the separate Analysis Rail lane.

---

[ACE-043] Analysis Rail — Coverage / Backfill Display Contract Cleanup

Date: 2026-04-08
Owner: PM
Status: Complete
Propagation Owner: Codex
Propagation Status: Accepted fix propagated; Recovery Contract recorded
Recovery Contract: `CHANGELOG.md` -> `April 8, 2026 — ACE-043 Coverage / Backfill Display Contract Cleanup Accepted`

Decision:
- Coverage / backfill display on the Operations Review page now settles onto valid mailbox-index truth instead of rendering epoch leakage or remaining stuck at mailbox-index unavailable state when same-tab truth is already available.
- The accepted contract now guarantees:
  - no visible `1970` / epoch fallback leakage
  - real bounded indexed coverage when valid truth exists
  - real historical cutoff truth when valid backfill truth exists
  - safe unavailable fallbacks only when truth is genuinely absent or invalid
  - visible separation between coverage and backfill concepts

Reason:
- The accepted defect was a source/display-contract problem on the shared mailbox shell, not a Time Context defect, Sender Distribution defect, or Smart Sync continuity defect.
- Acceptance required proof that the exact mailbox shell on the canonical review route visibly matched same-tab mailbox-index truth.

Affected product areas:
- Operations Review page
- Mailbox coverage / backfill display
- Shared Analysis Rail coverage truth presentation

Affected code areas:
- `web/src/lib/integrations/gmail/gmailMailboxIndexer.ts`
- `web/src/components/runtime/OperationsWorkspaceShell.tsx`
- `web/src/components/runtime/OperationsRuntimeContext.tsx`

Docs requiring propagation:
- `06_system_state/CHANGELOG.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

Notes:
- `ACE-040` remains accepted and closed.
- `ACE-042` remains accepted and closed.
- Sender Distribution `All indexed` reconciliation later landed and was accepted under `ACE-044` as the separate Analysis Rail lane.
- Stale epoch-span values may still exist in session storage as non-user-visible technical debt and are not part of the accepted visible defect surface for `ACE-043`.

---

[ACE-042] Analysis Rail — Time Context Render Authority + Scope Unification

Date: 2026-04-08
Owner: PM
Status: Complete
Propagation Owner: Codex
Propagation Status: Accepted fix propagated; Recovery Contract recorded
Recovery Contract: `CHANGELOG.md` -> `April 8, 2026 — ACE-042 Time Context Render Authority + Scope Unification Accepted`

Decision:
- Time Context on the Operations Review page now uses a single stable render authority.
- `1D` and `Custom` now resolve as explicit workflow windows independent of prior workflow-scope state.
- `1W` and `1M` now remain quantitative during Smart Sync and no longer oscillate into fallback/status mode.

Reason:
- The accepted defect was review-page render-authority instability, not runtime continuity.
- Acceptance required proof that:
  - `All indexed -> 1D` and `1W -> 1D` settle to the same correct 24-hour chart contract
  - Smart Sync on `1W` and `1M` does not trigger flicker or fallback/status displacement
  - the final rendered Time Context surface remains deterministic and stable under live row growth

Affected product areas:
- Operations Review page
- Time Context
- Shared Analysis Rail render orchestration

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`
- `web/src/components/runtime/GmailCleanupComponents.tsx`

Docs requiring propagation:
- `06_system_state/CHANGELOG.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

Notes:
- `ACE-040` remains the accepted Smart Sync continuity + UI stabilization contract and was not reopened.
- Keep separate follow-on lanes out of this accepted fix:
  - `1970` coverage display anomaly
  - `all-indexed` Sender Distribution render inconsistency
  - hero/layout cleanup regression on the review page

---

[ACE-040] Analysis Rail — Post-ACE-039 Smart Sync Continuity + UI Stabilization

Date: 2026-04-07
Owner: PM
Status: Complete
Propagation Owner: Codex
Propagation Status: Accepted fix propagated; Recovery Contract recorded
Recovery Contract: `CHANGELOG.md` -> `April 8, 2026 — ACE-040 Smart Sync Continuity + UI Stabilization Accepted`

Decision:
- Post-ACE-039 Smart Sync continuity is now fixed and accepted for the canonical Analysis Rail review route.
- Drift-producing Smart Sync no longer crashes forced refresh during active artifact build.
- During `refresh_in_progress / building`, forced refresh now serves the last stable snapshot with explicit build-pending continuity state.
- After publication becomes ready, the page swaps to the new runtime truth without clearing visible review content, and downstream sender workspace / sender distribution refreshes complete on the rotated version.

Reason:
- The accepted defect was the end-to-end Smart Sync continuity/UI contract, not just the runtime data contract.
- Acceptance required proof that:
  - the last stable snapshot remained visible while build was pending
  - the final ready-state UI remained populated after swap
  - transient `409` guard churn was non-final and non-user-visible in the accepted flow

Affected product areas:
- Review Page (Sender Overview)
- Smart Sync / mailbox-index continuity
- Shared Analysis Rail runtime continuity

Affected code areas:
- `web/src/app/api/agents/playground/route.ts`
- `web/src/lib/runtime/runtimeStateService.ts`
- `web/src/components/runtime/OperationsRuntimeContext.tsx`
- `web/src/app/agents/[id]/operations/review/page.tsx`

Docs requiring propagation:
- `06_system_state/CHANGELOG.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

Notes:
- `ACE-039` remains the accepted upstream data-truth recovery contract.
- `ACE-040` is now closed as the accepted Smart Sync continuity + UI stabilization contract on top of that recovered source truth.
- Keep separate adjacent issues out of this accepted fix:
  - `1970` coverage display anomaly
  - `all-indexed` Sender Distribution render inconsistency

---

[ACE-041] Control Plane — Execution Efficiency Optimization Layer

Date: 2026-04-07
Owner: Architect
Status: Active
Propagation Owner: Codex
Propagation Status: Control-plane aligned; efficiency model active

⸻

Decision:

The system introduces a non-breaking efficiency optimization layer across:
	•	AGENTS.md
	•	CODEX_PROMPT_TEMPLATES.md
	•	PROJECT_MANAGER_CONTEXT.md
	•	implementation_pass skill
	•	change_propagation_pass skill
	•	SYSTEM_MEMORY_MAP.md

This layer preserves all existing correctness, verification, and propagation guarantees while reducing unnecessary coordination overhead.

Core optimizations introduced:
	1.	Same-Thread Control Plane Carry-Forward
	•	full control-plane load required for new threads only
	•	same-thread execution may use:
	•	Control plane unchanged
	•	or a structured delta block
	2.	Propagation Cadence Optimization
	•	propagation remains mandatory
	•	no longer required after every micro-step
	•	required at defined checkpoints only:
	•	accepted fix
	•	governing truth change
	•	phase transition
	•	thread closeout
	•	pre-new-thread boundary
	3.	Verification Ladder
	•	diagnostic → correction → accepted-fix closeout
	•	full artifact proof is required only at accepted-fix stage
	•	early-stage over-verification is explicitly prohibited
	4.	Reasoning Tier Optimization
	•	MEDIUM becomes default
	•	HIGH / EXTRA-HIGH restricted to:
	•	ambiguity
	•	cross-layer issues
	•	architectural work
	5.	Problem-Class Lock
	•	required before heavy execution
	•	prevents cross-layer misdiagnosis and wasted cycles
	6.	PM Context Canonicalization
	•	PROJECT_MANAGER_CONTEXT.md is now:
	•	canonical operating-model file
	•	not a lane-state ledger
	•	lane truth must live in:
	•	CURRENT_STATE.md
	•	ACTIVE_CHANGE_EVENTS.md
	7.	Propagation Efficiency Controls
	•	no-op detection
	•	minimal write scope enforcement
	•	checkpoint-based propagation discipline

⸻

Reason:

The system reached a stable and fully functioning verification model but incurred excessive cost due to:
	•	repeated full control-plane reloads
	•	overuse of HIGH / EXTRA-HIGH reasoning
	•	full artifact verification too early in the cycle
	•	propagation after every micro-step
	•	duplicated context (especially in PM context)

This ACE reduces cost while preserving:
	•	control-plane authority
	•	governing-truth propagation
	•	accepted-fix recovery contracts
	•	final UI truth verification discipline

⸻

Affected system areas:
	•	Control Plane
	•	PM/Codex execution model
	•	verification workflow
	•	propagation workflow
	•	runtime/UI validation discipline
	•	cost model / token usage

⸻

Affected code / docs:
	•	AGENTS.md  ￼
	•	CODEX_PROMPT_TEMPLATES.md  ￼
	•	PROJECT_MANAGER_CONTEXT.md  ￼
	•	SYSTEM_MEMORY_MAP.md  ￼
	•	implementation_pass SKILL
	•	change_propagation_pass SKILL

⸻

Notes:
	•	This is a non-breaking system optimization
	•	No product behavior changed
	•	No verification guarantees weakened
	•	No propagation guarantees weakened

This ACE changes:
👉 when cost is paid, not
👉 what correctness is required

---

### [ACE-039] Time Context — Mailbox-Index Freshness Recovery

Date: 2026-04-06  
Owner: PM  
Status: Accepted  
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Current `1W` / `1M` Time Context failures were correctly treated as a recent-period data-truth / source-of-truth recovery problem, not a UI grammar-only or chart-styling problem.
- The accepted root cause was `stale index reuse`.
- The accepted source layer fixed was the mailbox-index freshness / checkpoint layer.
- Accepted recovery behavior is now:
  - detect false healthy recent-gap state
  - stop treating stale cached index truth as usable when recent truth is incomplete
  - upgrade `smart_sync` recent-gap recovery into a fresh head-of-mailbox full run
  - disable stale checkpoint resume during that recovery run
  - stop the recovery run at the recent-window boundary once the head window has been rebuilt

Reason:
- Baseline proof showed raw `gmail_messages`, `gmail_sender_stats`, `sender_workspace`, `browse_query_cluster`, and final Time Context charts all collapsed across the same late-March / early-April span.
- The previous mailbox-index state still reported `healthy` cached incremental truth while recent days were missing and checkpoint reuse remained available.
- The accepted recovery run completed as:
  - `requested_mode = incremental`
  - `effective_mode = full`
  - `started_from_checkpoint = false`
  - `terminal_reason = recent_window_reached`

Affected product areas:
- Shared Analysis Rail
- Time Context
- Sender Overview review surface
- Marketing / subscription review routes
- Mailbox index health and recovery

Affected code areas:
- `web/src/lib/integrations/gmail/gmailMailboxIndexer.ts`
- `web/src/app/api/integrations/gmail/mailbox-index/route.ts`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Acceptance proof:
- raw mailbox truth moved from:
  - `2026-03-30: 0`
  - `2026-03-31: 1`
  - `2026-04-01: 1`
  - `2026-04-02: 0`
  - `2026-04-03: 0`
  to:
  - `2026-03-30: 180`
  - `2026-03-31: 241`
  - `2026-04-01: 206`
  - `2026-04-02: 175`
  - `2026-04-03: 170`
- derived sender truth in `gmail_sender_stats.last_seen` moved from:
  - `2026-03-30: 0`
  - `2026-03-31: 1`
  - `2026-04-01: 0`
  - `2026-04-02: 0`
  - `2026-04-03: 0`
  to:
  - `2026-03-30: 7`
  - `2026-03-31: 14`
  - `2026-04-01: 17`
  - `2026-04-02: 12`
  - `2026-04-03: 12`
- live `1W` sender workspace now settles at:
  - `160 senders / 360 messages`
  - `7` non-zero daily buckets from `Mar 31` through `Apr 6`
- live `1M` sender workspace now settles at:
  - `277 senders / 1674 messages`
  - `30` non-zero daily buckets through late March into early April
- corroborating `Custom` remained aligned:
  - `customWorkspace.selected_cluster = 254 senders / 1143 messages`
  - `customOverview.summary = 254 active senders / 1143 supporting messages`
- final UI screenshots now visually show the restored daily activity rather than the prior zero-run drop-off.

Recovery Contract:
- `CHANGELOG.md` -> `April 6, 2026 — ACE-039 Mailbox-Index Freshness Recovery Accepted`

Notes:
- Preserve the original diagnostic result as historical continuity:
  - the issue was not primarily UI grammar
  - the visible chart was accurately exposing deeper missing recent truth
- `ACE-037` remains historically correct for compressed `1D` / `Custom` behavior.
- `ACE-038` remains preserved as accepted historical UI grammar context.

---

### [ACE-039-DIAG] Time Context — 1W / 1M Data-Truth Recovery Diagnosis (Historical)

Date: 2026-04-06  
Owner: PM  
Status: Historical  
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Current `1W` / `1M` Time Context failures must now be treated as a data-truth / source-of-truth recovery problem, not a UI grammar-only or chart-styling problem.
- The chart remains the final pass surface, but the implementation target is the upstream truth feeding the chart:
  - row-backed timeline inputs
  - artifact freshness / snapshot truth
  - recent-scope publication correctness
  - any related runtime/data-path issue that causes recent activity to disappear or collapse after mid/late March on the canonical marketing/subscription routes
- `1W` and `1M` must not be “fixed” by hiding, compressing, or visually removing empty periods when the underlying expectation is that qualifying recent data should exist.
- The diagnostic pass proved the source-truth problem first; future execution is now governed by the active mailbox-index freshness recovery event above.

Reason:
- PM validation now indicates the remaining issue is not primarily UI grammar.
- The visible chart is accurately exposing a deeper problem: recent expected activity is missing or dropping off in the underlying truth feeding `1W`, `1M`, and related custom ranges.
- Prior passes over-focused on chart rendering behavior and allowed incorrect outcomes to be treated as success even while the underlying recent-period truth remained suspect.

Affected product areas:
- Shared Analysis Rail
- Time Context
- Sender Overview review surface
- Marketing / subscription review routes
- Artifact-backed recent-scope analysis

Affected code areas:
- `web/src/lib/integrations/gmail/inboxAnalysis.ts`
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/lib/integrations/gmail/gmailArtifactStore.ts`
- `web/src/lib/integrations/gmail/gmailArtifactIncrementalUpdater.ts`
- `web/src/components/runtime/GmailCleanupComponents.tsx`
- `web/src/app/agents/[id]/operations/review/page.tsx`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- This historical diagnostic event supersedes any thread-local assumption that `1W` / `1M` should be solved by UI grammar alone.
- `ACE-037` remains historically correct for compressed `1D` / `Custom` behavior.
- `ACE-038` remains historically correct for the accepted fixed-slot `1W` / `1M` UI grammar clarification, but it is no longer sufficient to explain the current observed defect.
- The current open question is whether recent-period truth loss is coming from:
  - row selection / filtering
  - artifact publication freshness
  - snapshot eligibility / reuse
  - timeline-source divergence
  - another upstream runtime/data-path defect
- The diagnostic pass is now historical context only; the active next step is governed by the mailbox-index freshness recovery event above.

---

### [ACE-038] Time Context — Continuity Grammar Clarification

Date: 2026-04-06
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- `ACE-037` remains historically correct as the accepted narrow compressed-continuity fix for `1D` / `Custom`.
- `ACE-038` clarified the Time Context surface grammar explicitly:
  - `1D` and `Custom` remain compressed compare-only/chart-only continuity surfaces
  - `1W` must preserve a fixed 7-day frame with 7 visible daily buckets, including visible zero slots
  - `1M` must preserve a fixed 30-day frame with 30 visible daily buckets, including visible zero slots
- This is a UI grammar clarification only.
- This event does NOT approve runtime/data-path changes, sender-universe changes, or newsletter parent-universe reconstruction changes.

Reason:
- Live PM validation proved that the UI still visibly shows gap/broken continuity behavior on `1W` and `1M`.
- Prior control-plane state only recorded the accepted narrow `ACE-037` chart-only continuity fix for `1D` / `Custom`.
- The first ACE-038 propagation was directionally correct but too coarse because it implied one continuity behavior across all four accepted surfaces.
- PM validation then clarified that workflow-driving windows cannot use the same compressed grammar as compare-only windows.
- Future Codex threads must recover this truth from docs, not from PM memory.

Affected product areas:
- Shared Analysis Rail
- Time Context
- Sender Overview review surface

Affected code areas:
- `web/src/components/runtime/GmailCleanupComponents.tsx`

Verification:
- Repo proof:
  - `npm run lint -- src/components/runtime/GmailCleanupComponents.tsx` passed
  - `npx tsc --noEmit` still fails from unrelated pre-existing repo errors outside this pass
- Live proof on:
  - `http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions`
  - `1W` accepted defect surface proved:
    - `workflow_scope = 7d`
    - `compressedMode = false`
    - `granularity = day`
    - `rawBucketCount = 7`
    - `renderBucketCount = 7`
    - visible empty days remained reserved and bars stayed inside their day slots
  - `1M` accepted defect surface proved:
    - `workflow_scope = 30d`
    - `compressedMode = false`
    - `granularity = day`
    - `rawBucketCount = 30`
    - `renderBucketCount = 30`
    - visible empty days remained reserved and dense bars stayed visually separated
  - regression proof also confirmed:
    - `1D` remained compressed with `compressedMode = true`, `rawBucketCount = 24`, `renderBucketCount = 16`, `hiddenBucketCount = 8`
    - `Custom` remained compressed with `compressedMode = true`, `rawBucketCount = 20`, `renderBucketCount = 15`, `hiddenBucketCount = 5`
  - accepted artifact bundle captured screenshots, DOM/state, and request traces for:
    - final settled `1W`
    - final settled `1M`
    - regression `1D`
    - regression `Custom`
  - guard churn observed:
    - none

Recovery Contract:
- `CHANGELOG.md` -> `April 6, 2026 — ACE-038 Time Context Fixed-Slot UI Grammar Recovery Accepted`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- `ACE-037` remains historically correct for the narrow accepted `1D` / `Custom` fix.
- `ACE-038` preserved the accepted split grammar instead of one shared compressed/gap-free rule across all four surfaces.
- `ACE-038` is now accepted as the narrow fixed-slot UI grammar recovery for `1W` / `1M`.
- `ACE-038` is now preserved as historical accepted context; `ACE-039` governs future `1W` / `1M` recovery work.
- Control-plane propagation is now aligned across:
  - `06_system_state/CURRENT_STATE.md`
  - `06_system_state/TODO.md`
  - `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
  - `06_system_state/ACTIVE_CHANGE_EVENTS.md`
  - `06_system_state/CHANGELOG.md`
- No pending implementation work remains under this event.

### [ACE-037] Time Context Chart-Only Continuity Recovery

Date: 2026-04-06
Owner: PM
Status: Completed
Propagation Owner: Codex

Decision:
- Time Context chart-only windows `1D` and `Custom` now use compressed active-timeline rendering so visible bars flow continuously across active periods instead of reserving visual zero-gap slots.
- Raw bucket truth is preserved for hover, focus, and lower-card readouts.
- This pass remains narrow and does not change:
  - backend aggregation
  - route/query behavior
  - Sender Distribution / workflow totals logic
  - workflow-driving windows:
    - `All indexed`
    - `1Y`
    - `1Q`
    - `1M`
    - `1W`
  - interpolation / synthetic continuity

Reason:
- The final rendered Time Context UI was still visibly wrong in chart-only windows because literal zero buckets created broken continuity between active periods.
- Users need Time Context to communicate activity flow meaningfully without inventing data or widening workflow semantics.

Affected product areas:
- Gmail Workspace
- Shared Analysis Rail
- Time Context visualization

Affected code areas:
- `web/src/components/runtime/GmailCleanupComponents.tsx`

Verification:
- Repo proof:
  - `npm run lint -- src/components/runtime/GmailCleanupComponents.tsx` passed
  - `npx tsc --noEmit` still fails from unrelated pre-existing repo errors outside this pass
- Live proof on:
  - `http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions`
  - `1D` cold-load settled state proved:
    - `compressedMode = true`
    - `rawBucketCount = 24`
    - `renderBucketCount = 17`
    - `hiddenBucketCount = 7`
    - disclosure copy visible
  - sparse `Custom` settled state proved:
    - `compressedMode = true`
    - `rawBucketCount = 20`
    - `renderBucketCount = 15`
    - `hiddenBucketCount = 5`
    - focused visible bucket remained truthful at `Mar 20` with `63` active senders and `75` supporting messages
  - empty custom-window state proved:
    - `renderBucketCount = 0`
    - explicit empty-state title visible
  - accepted artifact bundle captured screenshots, DOM/state, and request traces for:
    - cold `1D`
    - sparse `Custom`
    - final settled `1D`
    - empty custom-window state
  - guard churn observed:
    - none

Recovery Contract:
- `CHANGELOG.md` -> `April 6, 2026 — ACE-037 Time Context Chart-Only Continuity Recovery Accepted`

### [ACE-036] Gmail Marketing Classification Coverage + Sender Distribution `1W` UI Consistency Recovery

Date: 2026-04-06
Owner: PM
Status: Completed
Propagation Owner: Codex

Decision:
- `semantic.marketing_subscriptions` now rescues broader-row promotional/newsletter senders when broader sender evidence already classifies the sender as `subscription-senders`, the sender does not look human, and promotional/newsletter evidence exists.
- Sender Distribution workflow-scope chips remain workflow-driving controls and must not be blocked by detached comparison rail-package readiness.
- This pass remains narrow and does not change:
  - artifact publication
  - Smart Sync ingestion
  - workflow-window logic
  - route shape

Reason:
- Recent Gmail inbox activity showed daily marketing activity, but the published `30d` marketing cluster still had avoidable gaps because thin-row promotional/newsletter senders were being stranded in `needs-review`.
- The Sender Distribution `1W` chip could also become inert because the route update path was still waiting on detached rail-package readiness even though the chip itself is a workflow-driving control.

Affected product areas:
- Gmail Workspace
- Sender classification
- Sender Distribution
- Analysis Rail monthly marketing coverage

Affected code areas:
- `web/src/lib/integrations/gmail/inboxAnalysis.ts`
- `web/src/app/agents/[id]/operations/review/page.tsx`

Verification:
- Repo proof:
  - fixture harness passed with new marketing broader-row rescue cases
  - targeted lint passed with no errors for the touched runtime/UI files and verification scripts
- Live proof:
  - published `30d` marketing artifact moved:
    - `subscription-senders: 192 -> 248`
    - `needs-review-senders: 177 -> 121`
  - live recent marketing coverage now reports:
    - `missing_promotional_days = []`
  - exact canonical runtime route verified:
    - `http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions`
  - accepted click flow proved final settled URL:
    - `http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?workflow_scope=7d&cluster_id=semantic.marketing_subscriptions`
  - final settled UI state proved:
    - active tab = `sender_distribution`
    - `1W` chip active
    - no `409` guard churn

Recovery Contract:
- `CHANGELOG.md` -> `April 6, 2026 — ACE-036 Gmail Marketing Classification Coverage + Sender Distribution \`1W\` UI Consistency Recovery Accepted`

### [ACE-035] Gmail Artifact Integrity — Incremental Refresh Consistency Recovery

Date: 2026-04-06
Owner: PM
Status: Completed
Propagation Owner: Codex

Decision:
- Incremental Gmail artifact refresh now rebuilds impacted preview rows, headers, cluster summaries, and mailbox intelligence from the same projected preview dataset before validation and persistence.
- Incremental Gmail artifact validation now counts cleanup-candidate preview rows using the same cleanup-group reference rules as the mailbox-intelligence snapshot builder:
  - direct cleanup-group cluster ids
  - projected rows that still reference cleanup groups through `cleanup_group_source_cluster_ids`
- Integrity checks remain active and continue rejecting inconsistent or partial artifacts; this pass does not weaken or remove any safeguard.

Reason:
- Incremental refresh could previously validate/persist a mixed dataset where projected headers and summaries no longer matched the preview rows being counted.
- After the preview/header fix, candidate-universe validation still used a narrower cleanup-candidate predicate than mailbox intelligence itself, so projected cleanup-candidate rows could be counted in the snapshot but excluded by validation.
- That left live incremental artifact refresh failing with:
  - `Preview row ... references missing header ...`
  - `Mailbox intelligence candidate message count no longer matches preview rows.`

Affected product areas:
- Gmail Workspace
- Mailbox Index + Artifact Pipeline
- Analysis Rail artifact integrity

Affected code areas:
- `web/src/lib/integrations/gmail/gmailArtifactIncrementalUpdater.ts`

Verification:
- Repo proof:
  - targeted lint passed for:
    - `src/lib/integrations/gmail/gmailArtifactIncrementalUpdater.ts`
    - `scripts/gmail-artifact-incremental-integrity-live-audit.mjs`
- Live proof:
  - Smart Sync produced a real incremental mailbox delta:
    - `rows_after = 234516`
    - `growth_delta = 3`
    - `processed_messages = 4`
    - `upserted_messages = 3`
  - bounded incremental artifact refresh then published successfully for:
    - `30d -> incremental-20260405231931612`
    - `7d -> incremental-20260405231940420`
    - `all_indexed -> incremental-20260405231945344`
  - live `all_indexed` recovered from:
    - `build_status = failed`
    - `freshness_state = refresh_failed`
    - `freshness_reason = Mailbox intelligence candidate message count no longer matches preview rows.`
    to:
    - `build_status = published`
    - `freshness_state = fresh`
    - `freshness_reason = published_artifact_current`
  - live logs no longer emitted:
    - `references missing header`
    - `candidate message count no longer matches preview rows`
  - live continuity proof passed:
    - `1W / 7d = 7` daily buckets
    - `1M / 30d = 30` daily buckets

Recovery Contract:
- `CHANGELOG.md` -> `April 6, 2026 — ACE-035 Gmail Artifact Integrity Incremental Refresh Recovery Accepted`

### [ACE-034] Gmail Analysis Rail — Smart Sync Freshness and Recent-Scope Publication Recovery

Date: 2026-04-06
Owner: PM
Status: Completed
Propagation Owner: Codex

Decision:
- Successful Gmail artifact publish now clears stale failed freshness metadata for the build/version that actually published.
- Smart Sync artifact refresh planning now manages recent publication scopes instead of only pre-existing publication rows:
  - `7d`
  - `30d`
  - `90d`
  - `180d`
  - `365d`
  - `all_indexed`
- `unavailable_scope` remains an integrity safeguard and is not removed or weakened.

Reason:
- A later successful full rebuild could previously publish a new artifact version while leaving `freshness_state=refresh_failed` on the publication row.
- Smart Sync could previously skip missing recent scopes entirely, leaving recent windows unpublished and resolving through `unavailable_scope` because truth was absent, not because the window was honestly empty.

Affected product areas:
- Gmail Workspace
- Mailbox Index + Artifact Pipeline
- Analysis Rail freshness

Affected code areas:
- `web/src/lib/integrations/gmail/gmailArtifactStore.ts`
- `web/src/app/api/integrations/gmail/mailbox-index/route.ts`

Verification:
- Repo proof:
  - simulated stale failed freshness metadata with `refresh_requested_at > refresh_started_at`
  - confirmed later publish advances `published_version`, sets `build_status=published`, and lands `freshness_state=fresh`
- Live proof:
  - confirmed recent-scope publication rows are now created/queued for `7d`, `30d`, `90d`, `180d`, and `365d`
  - confirmed live `7d` full rebuild published successfully
  - confirmed live `7d` rail state moved from `unavailable_scope` to artifact-backed truth (`outside_timeframe` for the audited selected cluster)
  - confirmed injected live `refresh_failed` freshness on `7d` is cleared by a later successful publish

Residual note:
- A separate pre-existing `all_indexed` incremental integrity failure was observed live:
  - `Preview row 1919a35fe8973469 references missing header semantic.marketing_subscriptions. | Mailbox intelligence candidate message count no longer matches preview rows.`
- That integrity issue remains out of scope for `ACE-034` and does not reopen this accepted recent-scope publication fix.

Recovery Contract:
- `CHANGELOG.md` -> `April 6, 2026 — ACE-034 Gmail Analysis Rail Smart Sync Freshness Recovery Accepted`

---

[ACE-033] Control Plane — Protected Files Enforcement System

Date: 2026-04-05
Owner: Architect
Status: Active
Propagation Owner: Codex

⸻

Decision:
	•	Introduced a Protected Files Enforcement System across the entire Codex operating system.
	•	Defined a class of architect-controlled files that are read-only unless explicitly scoped by Oliver.
	•	Enforced this rule across:
	•	AGENTS.md (system rule layer)
	•	Codex prompt templates (execution instruction layer)
	•	implementation_pass skill (execution layer)
	•	change_propagation_pass skill (propagation layer)
	•	turnover protocols (activation/continuity layer)

Protected files include:
	•	AGENTS.md
	•	CODEX_PROMPT_TEMPLATES.md
	•	all SKILL.md files
	•	Control Plane Architect Activation & Turnover Protocol
	•	Project Manager Activation & Turnover Protocol
	•	One Command Activation Message
	•	Agent Turnover Readiness Check

⸻

Reason:
	•	Codex propagation previously modified protected system-rule files unintentionally.
	•	This caused:
	•	system instability
	•	rule drift
	•	unnecessary rework
	•	The system required a hard enforcement boundary between:
	•	control-plane propagation
	•	system rule modification

⸻

Affected System Areas:
	•	Control Plane
	•	Codex execution discipline
	•	propagation behavior
	•	turnover safety
	•	system integrity enforcement

⸻

Affected Code / Docs:
	•	AGENTS.md
	•	CODEX_PROMPT_TEMPLATES.md
	•	implementation_pass SKILL
	•	change_propagation_pass SKILL
	•	Control Plane Architect Activation & Turnover Protocol
	•	One Command Activation Message for Agent Turnovers

⸻

Notes:
	•	This is a system-level enforcement change, not a product feature.
	•	This establishes a read-only boundary layer inside the Codex OS.
	•	Codex must now:
	•	STOP if a protected file needs modification
	•	request explicit approval before proceeding
	•	This rule applies to:
	•	execution passes
	•	propagation passes
	•	turnover passes

### [ACE-032] Analysis Rail — PM v1 → PM v2 Turnover Activation

Date: 2026-04-05
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Retire `Analysis Rail PM v1` and activate `Analysis Rail PM v2` as the active lane owner.
- Reset the Analysis Rail execution path before any further implementation following Phase 1 Time Context (`1D`) instability and verification-discipline gaps.
- Require the next Analysis Rail thread to start in `PLAN MODE` for `1D` Time Context correctness and stability.
- Preserve the already-approved `ACE-030` architecture while preventing immediate EXECUTION MODE continuation without a fresh plan.
- Require all subsequent Analysis Rail passes to follow the Runtime/UI Closeout Contract with artifact-backed proof.

Reason:
- Repeated regressions and incomplete verification cycles indicate an execution-discipline failure in this lane, not a need to widen product scope.
- Turnover is required to restore:
  - strict scope control (Sniper Method)
  - full artifact-backed verification
  - proper `PLAN MODE -> EXECUTION MODE` continuity

Affected product areas:
- Sender Overview
- Time Context (`1D` / `Custom`)
- Shared Analysis Rail

Affected code areas:
- None in this pass

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- This ACE is a docs-only lane-ownership transition and execution reset, not a product fix or implementation pass.
- `Analysis Rail PM v2` is now the governing lane owner in the control plane.
- Immediate next executable step after turnover:
  - `PLAN MODE` for `1D` Time Context correction and stability
- `ACE-030` remains the governing architecture approval for chart-only `1D` / `Custom`, but direct implementation is paused until that PLAN MODE pass is approved.

### [ACE-031] Control Plane — Verification Hardening Closeout Alignment

Date: 2026-04-05
Owner: Architect
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- The runtime/UI verification hardening work was already implemented in the authoritative execution-rule documents before this pass.
- This ACE was limited to **control-plane alignment and closeout capture**.
- The control plane now records the hardened verification standard as accepted system truth.
- Codex must NOT reopen or re-edit already-correct source rule files unless a specific mismatch is explicitly identified first.

Reason:
- The prior ACE-031 wording was too broad and caused unnecessary re-edit churn in already-correct source rule documents.
- The correct closeout action was to align control-plane continuity to the already-landed verification standard, not to re-implement the rules.

Affected system areas:
- Control Plane
- PM / Codex continuity
- Verification-governance tracking

Affected code areas:
- None in this pass

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- This was a docs-only closeout alignment pass.
- No product code, runtime behavior, route behavior, or source execution-rule documents changed in `ACE-031`.
- The hardened verification standard is now accepted control-plane truth and no pending `ACE-031` source-rule rewrite work remains.

### [ACE-030] Sender Overview — `1D` / `Custom` Chart-Only Architecture and Phase 1 Activation

Date: 2026-04-04
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Sender Overview now has an approved architecture for the previously deferred windows:
  - `1D` and `Custom` are approved as chart-only windows
  - existing accepted chips remain workflow-driving:
    - `All indexed`
    - `1Y`
    - `1Q`
    - `1M`
    - `1W`
- The next shared-analysis execution step is now committed:
  - `Phase 1 — Time Context only` implementation
- `Phase 1` is explicitly limited to:
  - Time Context only
  - chart-only `1D` / `Custom`
  - no Sender Distribution `1D` / `Custom` rendering
  - no `workflow_scope` expansion
  - no `analysis_scope` expansion
  - no route/query changes
- Sender Distribution `1D` / `Custom` chart-window rendering is explicitly deferred to a later phase.

Reason:
- The control plane still described the next shared-analysis step as undecided.
- The approved plan needed to be recoverable from docs alone before any new implementation thread could begin.
- The previously hidden/deferred language for `1D` / `Custom` no longer matched the approved architecture.

Affected product areas:
- Review Page
- Shared Analysis Rail
- Sender Overview
- Time Context
- Sender Distribution

Affected code areas:
- None in this pass

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- This was a docs-only approved-plan capture and phase-activation pass.
- No product code, route behavior, query behavior, or UI behavior changed in `ACE-030`.
- The blocker is removed because the control plane now explicitly records:
  - approved architecture = chart-only `1D` / `Custom`
  - next execution step = `Phase 1 — Time Context only` implementation
  - Sender Distribution `1D` / `Custom` rendering = deferred to a later phase
  - no `workflow_scope` or `analysis_scope` expansion in Phase 1

### [ACE-029] Control Plane — Accepted-Fix Recovery Contract Hardening

Date: 2026-04-04
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Accepted fixes must now be captured in a recovery-grade format, not only as milestone history or lane-state memory.
- `CHANGELOG.md` now serves as the authoritative Accepted-Fix Recovery Ledger for accepted fixes.
- Every accepted fix must include a Recovery Contract containing:
  - accepted invariant
  - source layer fixed
  - exact touched files/functions
  - canonical verification route
  - acceptance smoke / proof
  - replay steps
  - rollback guidance
- `ACTIVE_CHANGE_EVENTS.md` completed accepted-fix entries must point to the corresponding `CHANGELOG.md` recovery contract instead of trying to duplicate it.
- Accepted fixes are not considered fully propagated until the recovery contract exists and the completed ACE references it.

Reason:
- Recent regressions proved the control plane remembered that a fix was accepted, but not the fix in a deterministic replayable form.
- This caused repeated re-diagnosis of previously accepted behavior instead of fast recovery from authoritative system memory.
- The specific failure example is the weekly `1W` Time Context regression, where prior acceptance existed but recovery-grade replay information did not.

Affected product areas:
- Control Plane
- PM / Codex execution discipline
- propagation discipline
- turnover / continuity discipline

Affected code areas:
- `AGENTS.md`
- `ai-agent-platform-docs/07_reference/CODEX_PROMPT_TEMPLATES.md`
- `ai-agent-platform-docs/00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `ai-agent-platform-docs/06_system_state/CHANGELOG.md`
- `ai-agent-platform-docs/06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `ai-agent-platform-docs/01_workspace_architecture/system_overview.md`
- `/Users/olivercarlin/.codex/skills/implementation_pass/SKILL.md`
- `/Users/olivercarlin/.codex/skills/change_propagation_pass/SKILL.md`
- `/Users/olivercarlin/.codex/skills/turnover_pack_builder/SKILL.md`
- `ai-agent-platform-docs/00_core_context/Project Manager Activation & Turnover Protocol.md`

Docs requiring propagation:
- `06_system_state/CHANGELOG.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `01_workspace_architecture/system_overview.md`
- `07_reference/CODEX_PROMPT_TEMPLATES.md`
- `AGENTS.md`
- `00_core_context/Project Manager Activation & Turnover Protocol.md`
- `/Users/olivercarlin/.codex/skills/implementation_pass/SKILL.md`
- `/Users/olivercarlin/.codex/skills/change_propagation_pass/SKILL.md`
- `/Users/olivercarlin/.codex/skills/turnover_pack_builder/SKILL.md`

Notes:
- This was a docs/process hardening pass only.
- No product code, route behavior, or execution-lane product scope changed in this event.
- Final propagation state:
  - `CHANGELOG.md` is the authoritative recovery ledger for accepted fixes
  - `CURRENT_STATE.md` and `TODO.md` now reflect the enforced model without storing full Recovery Contracts
  - `PROJECT_MANAGER_CONTEXT.md`, `AGENTS.md`, `CODEX_PROMPT_TEMPLATES.md`, `system_overview.md`, the turnover protocol, and the named skills all enforce the same closeout rule
- No pending `ACE-029` implementation work remains.
- `ACE-029` establishes accepted-fix recovery capture rules; it does not itself require a separate Recovery Contract entry.

### [ACE-028] Sender Distribution — Monthly `30d` Truth Correction

Date: 2026-04-04
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated and PM-Verified

Decision:
- Sender Distribution monthly `1M` / `workflow_scope=30d` truth must reconcile with the workflow truth on the same protected-trusted review route.
- The accepted correction is to make `loadGmailSenderDistributionForTenant(...)` treat `30d` like `sender_workspace` already does for persisted snapshot eligibility.
- `analysisScope === '30d'` is now excluded from the Sender Distribution persisted snapshot shortcut so monthly Sender Distribution falls through to the truthful non-snapshot path.

Reason:
- PM verification isolated a narrow monthly divergence on the same route:
  - Sender Distribution `1M` showed `61`
  - the workflow below showed `48`
  - Time Context `1M` remained correct
- Diagnosis confirmed the divergence was a Sender Distribution snapshot-serving mismatch, not a workflow-truth, route/query, or Time Context issue.

Affected product areas:
- Review Page
- Shared Analysis Rail
- Sender Distribution

Affected code areas:
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- PM verification confirmed on the protected-trusted review route:
  - Sender Distribution `1M` now shows `48`
  - the workflow below shows `48`
  - Time Context `1M` remains correct
- This accepted fix remained narrowly bounded:
  - no route/query-shape changes
  - no API contract changes
  - no Time Context changes
  - no Decision Mode changes
  - no sender ordering or pagination changes
  - no changes to `1W`, `1Q`, `1Y`, or `all_indexed`
- Separate performance follow-up item only:
  - `1Y` still has a significant workflow-load delay; `1Q` is slower than ideal but materially better; `1W` is near-instant. This is a separate future performance diagnosis item and not part of the accepted monthly `30d` Sender Distribution truth fix.

---

### [ACE-027] Sender Distribution — Pass 2 Scope Congruency

Date: 2026-04-04
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated and PM-Verified

Decision:
- Sender Distribution scope-congruency Pass 2 is completed and accepted.
- Sender Distribution visible chips are now restricted to:
  - `All indexed`
  - `1Y`
  - `1Q`
  - `1M`
  - `1W`
- Visible `2M` and `6M` are removed from Sender Distribution UI only.
- `1D` and `Custom` were not part of the accepted Sender Distribution grammar in `ACE-027`; `ACE-030` later approved them as chart-only windows for Time Context while keeping Sender Distribution deferred.

Reason:
- Align Sender Distribution visible grammar to the accepted truthful overlap grammar without widening into a new chart-window model, route/query work, or backend/API contract changes.

Affected product areas:
- Review Page
- Shared Analysis Rail
- Sender Distribution

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- PM verification confirmed the accepted visible Sender Distribution grammar is now:
  - `All indexed`
  - `1Y`
  - `1Q`
  - `1M`
  - `1W`
- This accepted pass did not change:
  - Time Context
  - backend/API contracts
  - route/query shape
  - `OperationsAnalysisScope`
  - Decision Mode semantics
  - pagination
  - sender ordering logic
  - lower-card anchoring
- The narrow monthly `30d` Sender Distribution truth mismatch surfaced separately after this pass and is now closed under `ACE-028`.

### [ACE-026] Time Context — Pass 1 Scope Congruency

Date: 2026-04-03
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated and PM-Verified

Decision:
- Time Context scope grammar is now expanded in a narrow Pass 1 that is limited to Time Context only.
- The accepted visible Time Context scope strip is:
  - `All indexed`
  - `1Y`
  - `1Q`
  - `1M`
  - `1W`
- The accepted safe mapping is:
  - `all_indexed -> all_indexed`
  - `last_year -> 365d`
  - `last_quarter -> 90d`
  - `last_month -> 30d`
  - `last_week -> 7d`
- `1D` and `Custom` were intentionally hidden in the accepted Pass 1 state; `ACE-030` later approved them as chart-only windows while preserving the Pass 1 workflow-driving surface.

Reason:
- Time Context needed scope-grammar congruency progress toward the Mailbox Intelligence control structure without widening into Sender Distribution, route/query changes, or backend/API contract changes.
- The smallest safe step was a Time Context-local chart-scope adapter using only existing safe workflow scopes.

Affected product areas:
- Review Page
- Shared Analysis Rail
- Time Context

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`
- `web/src/components/runtime/GmailCleanupComponents.tsx`
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/lib/integrations/gmail/inboxAnalysis.ts`

Docs requiring propagation:
- `03_gmail_workspace/04_sender_decision_ui/01_analysis_rail/Shared_Rail_Analysis_spec.md`
- `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- PM verification confirmed:
  - Time Context chips now show `All indexed`, `1Y`, `1Q`, `1M`, `1W`
  - `1D` and `Custom` remain hidden, which is correct for Pass 1
  - `1Y` loaded and clicked-bucket filtering behaved correctly
  - `1Q` loaded and clicked-bucket filtering behaved correctly
  - `1M`, `1W`, and `All indexed` remained correct
  - Sender Distribution behavior appeared unchanged
- This accepted pass did not change:
  - Sender Distribution
  - Decision Mode
  - backend/API contracts
  - route/query shape
  - `OperationsAnalysisScope`
  - lower-card anchoring behavior
- Separate observation only:
  - PM observed significant load-time cost on the newly exposed scopes
  - roughly `61s` on `1Y`
  - roughly `19s` on `1Q`
  - this is not part of the accepted Pass 1 functional closeout
- The next execution step is now committed under `ACE-027`:
  - Sender Distribution scope-congruency Pass 2
- The separate narrow `1Y` / `1Q` performance diagnosis remains deferred.
- Those lanes must not be blended.

---

### [ACE-025] Time Context — Weekly `1W` Truth Alignment

Date: 2026-04-03
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated and PM-Verified

Decision:
- The weekly `workflow_scope=7d` Time Context chart and bucket-applied workflow totals must reconcile on the same row-backed sender truth.
- Persisted-snapshot weekly overview timelines may still be used for the broad page bootstrap, but the weekly chart timeline itself must be rebuilt from recent selected-cluster rows before render.
- When a weekly bucket is selected, the lower-card `Senders in current workflow scope` metric must settle from the narrowed workflow coverage workspace instead of the preserved broad chart workspace.

Reason:
- The remaining weekly mismatch was not monthly `30d` and not `all_indexed`.
- On `workflow_scope=7d`, the chart could show the correct row-backed bucket sender count while the lower-card/workflow scope still reflected the preserved broad weekly workspace during or after bucket application.

Affected product areas:
- Review Page
- Shared Analysis Rail
- Time Context

Affected code areas:
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/app/agents/[id]/operations/review/page.tsx`

Docs requiring propagation:
- `03_gmail_workspace/04_sender_decision_ui/01_analysis_rail/Shared_Rail_Analysis_spec.md`
- `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- Code is implemented, accepted, and fully propagated.
- Accepted weekly baseline on the tested route is now recorded as:
  - canonical route = `/operations/review?workflow_scope=7d&cluster_id=structural.protected_trust`
  - fresh Time Context base view shows one populated visible UTC-day bucket
  - visible weekly sender/workflow totals remain internally coherent
  - populated-bucket drilldown remains coherent after click
- Separate transient-state note only:
  - the immediate post-click frame can still show the prior workflow total before the narrowed weekly workspace settles
  - acceptance is based on the steady-state rendered result
- Separate non-blocking runtime note only:
  - transient loading jitter / temporary empty hero state can still appear during route churn
  - that runtime issue is outside `ACE-025` scope and does not reopen the accepted weekly fix
- `30d` and `all_indexed` remained preserved in this lane.
- Next active item after this closeout returns to Cleanup Groups Lane B — review entry behavior for decomposed parents.
- Weekly auto-scroll / refocus remains separate polish-only follow-up work and does not reopen `ACE-025`.
- Recovery Contract: `CHANGELOG.md` -> `April 3, 2026 — ACE-025 Weekly \`1W\` Truth Alignment Accepted`

---

### [ACE-024] Time Context — Lower-Card Anchoring on Selected Bucket

Date: 2026-04-03
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated and PM-Verified

Decision:
- When a Time Context bucket is selected on the review page, the lower Time Context cards must anchor to that selected bucket.
- Hover remains preview-only:
  - hover may change the quick-read tooltip
  - hover must not replace the lower-card truth while a bucket is selected
- Clearing narrowed state must return the lower cards to the existing default-focus behavior.

Reason:
- The lower Time Context cards were reading from hover/default-focus state instead of the selected bucket state.
- This created post-click confusion even when chart truth and workflow narrowing were correct.

Affected product areas:
- Review Page
- Shared Analysis Rail
- Time Context

Affected code areas:
- `web/src/components/runtime/GmailCleanupComponents.tsx`

Docs requiring propagation:
- `03_gmail_workspace/04_sender_decision_ui/01_analysis_rail/Shared_Rail_Analysis_spec.md`
- `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- PM/browser validation accepted the protected-trusted monthly route:
  - selected bucket stays anchored after click
  - lower-card content follows the selected bucket correctly
  - hover no longer steals the lower-card anchor once a bucket is selected
  - `Clear narrowed state` restores the default-focus behavior
  - monthly filtering behavior remains correct after selection
- This event is complete and must not be widened to include the separate weekly `1W` lower-card/workflow-scope inconsistency.
- The weekly `1W` inconsistency remains open as a separate next PLAN MODE thread.

---

### [ACE-023] Time Context — Monthly `30d` Trust Recovery Roadmap

Date: 2026-04-03
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated and PM-Verified

Decision:
- The monthly `30d` chart-driving truth must no longer diverge from the clicked-bucket workflow filter truth.
- The accepted correction is to keep monthly `30d` chart/filter parity on the same live row-backed semantics by excluding unbucketed `30d` reads from the persisted snapshot timeline shortcut.
- `time_context_bucket_label`, `1W`, and `All Indexed` behavior remain preserved by this correction.

Reason:
- The monthly mismatch came from a source-of-truth split:
  - the chart could read from a persisted snapshot timeline rebuilt from `allSenders` using sender `last_activity`
  - clicked-bucket filtering used live row-backed membership from `timelineRows`
- PM protected-trusted verification now confirms the corrected monthly parity:
  - `2026-03-06`: `9` in chart, `9` in filtered workflow
  - `2026-03-20`: `8` in chart, `8` in filtered workflow
  - `2026-03-30`: `3` in chart, `3` in filtered workflow
- `All Indexed` still matches after click.

Affected product areas:
- Review Page
- Time Context monthly chart
- Protected-trusted review flow
- Shared Analysis Rail monthly parity

Affected code areas:
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- This event is complete and should not be reopened for lower-card anchoring, weekly lower-card workflow-scope consistency, or auto-scroll polish.
- Any follow-up on those issues requires a new narrow diagnosis/plan pass.

---

### [ACE-019] Review Page — Protected-Trusted Time Context Stabilization Rollback

Date: 2026-04-02
Owner: PM
Status: Completed
Superseded By: ACE-023
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- The unstable April 2 Time Context review-page forward-fix chain was rolled back to the last stable review-page baseline.
- The detached-scope chart-source correction is no longer accepted as the current live-branch truth for this issue.
- The rollback restored the stable broad-chart / stable-rail baseline so the remaining monthly mismatch could be re-diagnosed from clean ground.

Reason:
- PM live review confirmed the branch had become worse:
  - the original mismatch still remained
  - clicking one bucket changed the rest of the chart behavior
  - rail presentation regressed materially
- The rollback was required to restore a trustworthy baseline before new diagnosis resumed.

Affected product areas:
- Review Page
- Time Context broad chart
- Time Context rail presentation
- Protected-trusted review flow

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`
- `web/src/components/runtime/GmailCleanupComponents.tsx`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- The rollback restored the last stable broad-chart / stable-rail contract instead of layering another forward parity fix.
- Follow-up PM validation after rollback showed the baseline was materially improved enough to isolate a narrower remaining problem:
  - `All Indexed` generally behaving correctly
  - `1W` generally behaving correctly at the workflow/filter level
  - `1M` / monthly `30d` remains the primary broken lane
- Ongoing Time Context trust recovery work now continues under `ACE-023`.

### [ACE-018] Review Page — Protected-Trusted Time Context Broad-Chart Source Selection Correction (Superseded Diagnosis)

Date: 2026-04-02
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- The remaining protected-trusted Time Context parity failure is a review-page broad-chart source-selection issue.
- When a Time Context bucket is active, the visible chart must prefer the latest broad normalized-scope overview/coverage workspace.
- The preserved click-time `broadSnapshot` must be used only as a fallback when current broad normalized-scope overview truth is unavailable.
- Workflow narrowing below the chart remains authoritative and unchanged.

Historical note:
- This completed pass is no longer the accepted final diagnosis for the detached `workflow_scope=30d` protected-trusted mismatch.
- `ACE-019` supersedes the normalized-scope overview preference as the current governing diagnosis for the remaining issue.

Reason:
- PM evidence showed the applied bucket request truth was already authoritative while the visible chart bar still disagreed for the same bucket label.
- The chart was preserving an older broad snapshot path ahead of fresher broad normalized-scope overview truth, which let the visible bar drift from the applied bucket request in protected-trusted.

Affected product areas:
- Review Page
- Time Context broad chart
- Protected-trusted review flow

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

What was propagated:
- Added a broad normalized-scope overview/coverage workspace preference in `review/page.tsx` for bucket-active chart truth.
- Moved the preserved click-time `broadSnapshot` behind that current broad workspace source as a fallback only.
- Left workflow narrowing, summary surfaces, and backend/API bucket-membership logic unchanged.
- Validated the changed page file with targeted ESLint.

### [ACE-017] Review Page — Protected-Trusted Time Context Display-State Parity Correction

Date: 2026-04-02
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- The residual protected-trusted `5 -> 9` Time Context parity failure is a review-page display/state issue, not a server bucket-membership issue.
- When a Time Context bucket is applied, narrowed sender totals shown on the review page must read from the applied bucket workspace total.
- The review page must not use broad sender-key-derived `sharedWorkflowSubset.resolvedSenderCount` as the source for bucket-applied summary sender totals.
- The Time Context lower-card workflow-scope total must use that same applied bucket workspace total.

Reason:
- PM evidence and route logging already showed the bucket request returned `5`, so the remaining drift lived in page-level display-state composition after apply.
- Summary and lower-card workflow-universe totals needed to align to the same authoritative applied bucket workspace truth as the narrowed workflow below.

Affected product areas:
- Review Page
- Time Context lower truth card
- Protected-trusted sender summary surfaces

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

What was propagated:
- Added an applied-bucket sender-total path in `review/page.tsx` backed by the authoritative bucket workspace total.
- Routed the top summary sender total through that path for bucket-applied state.
- Routed the Time Context lower-card workflow-scope total through that same path.
- Left the chart broad and left the existing row-workflow path unchanged.
- Validated the changed page file with targeted ESLint.

### [ACE-016] Time Context — Protected-Trusted Count Parity Correction

Date: 2026-04-02
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Protected-trusted Time Context bucket apply must use the same row-backed bucket-membership truth as the visible chart.
- Sender-history inference from `first_seen` / `last_activity` is not allowed to redefine narrowed workflow membership for this lane.
- Selecting a Time Context bucket must reset `sender_page` to the first narrowed page so a non-zero bucket cannot inherit an invalid broad-list page.
- The rail must remain broad while only the workflow below narrows.

Reason:
- The protected-trusted route regressed into chart/workflow count drift and occasional zero-row selected states.
- Bucket truth must stay explicit and identical across the clicked chart, narrowed workflow, top summaries, and Decision Mode queue.

Affected product areas:
- Time Context
- Review Page
- Decision Mode handoff

Affected code areas:
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/app/agents/[id]/operations/review/page.tsx`

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

What was propagated:
- Restored row-backed bucket sender resolution in `gmailCleanupWorkspace.ts` so narrowed workflow membership matches the visible chart bucket truth.
- Restored row-backed narrowed timeline derivation for bucket-selected workflow data instead of sender-history inference.
- Reset `sender_page` on Time Context bucket selection in `review/page.tsx` while preserving session-only bucket state and broad-rail behavior.
- Validated the changed files with targeted ESLint; remaining warnings in `gmailCleanupWorkspace.ts` are pre-existing unused helpers, not introduced by this pass.

### [ACE-015] Review Page — Narrowing Interaction Feedback Layer

Date: 2026-04-02
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Review-page narrowing interactions now use one scoped pending-feedback model.
- Immediate click feedback must be set before transition work begins.
- Pending completion must not rely on route change alone.
- Pending clears only after:
  - requested route/session state is present
  - the authoritative sender universe matches that requested narrowed state
  - relevant loading states are clear

Reason:
- The previous interaction model could feel like a dead click because the narrowed result appeared later with no immediate confirmation.
- The review page now needs explicit feedback that preserves the accepted Lane B data/authority contract without redesigning the page.

Affected product areas:
- Sender Distribution
- Time Context
- Review Page workflow header
- Review Page top summaries

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`
- `web/src/components/runtime/GmailCleanupComponents.tsx`

Docs requiring propagation:
- `03_gmail_workspace/04_sender_decision_ui/01_analysis_rail/Shared_Rail_Analysis_spec.md`
- `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

What was propagated:
- Added local pending-interaction state on the review page for narrowing/reset interactions.
- Added immediate pending highlight treatment for Sender Distribution and Time Context selections.
- Unified the loading story across the rail status pill, workflow header, and top summary cards.
- Locked completion to authoritative narrowed sender-universe application plus cleared loading state.
- Strengthened the visual dominance of the same feedback model without changing its logic:
  - clicked pending targets now use stronger but geometry-stable emphasis so the charts stay full-scope
  - removed pending bar resizing that made Sender Distribution / Time Context feel visually collapsed or over-compressed
  - removed stacked glow / multi-outline emphasis in the rails
  - rail status pills now use clear prominence without overpowering the chart
  - the workflow area still reacts immediately with a clear updating banner and stronger in-place loading treatment
- Applied the final rail-context correction required to preserve full-scope chart rendering:
  - Sender Distribution now binds to the broad rail sender dataset instead of the narrowed workflow sender subset
  - Time Context now prefers the broader coverage workspace for rail context while sender-focused workflow narrowing stays below
  - live browser proof was re-run on `3000` and confirmed:
    - Sender Distribution stayed at `850` slots before and after sender click
    - Time Context stayed at `20` buckets after bucket click

Notes:
- This pass is UX feedback only.
- It does not change backend behavior, narrowing contract, or introduce a new rehydrate path.
- The only non-visual correction in this event is the render-source fix that keeps the rails attached to their intended broad-context datasets/workspaces.

---

### [ACE-014] Time Context — Lane B Filtering/Parity Closeout Accepted

Date: 2026-04-02
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Analysis Rail / Time Context Lane B is accepted as closed for workflow-filtering/parity behavior on the validated scoped review route.
- The closeout covers:
  - bucket-to-workflow parity
  - selected-bucket authority after hover/unhover
  - duplicate authoritative-context chip/key cleanup on the validated route
- The closeout does not include broader runtime simplification or removal of the cold-boot review bootstrap request.

Reason:
- The validated scoped review route now has an accepted answer to “what sender set am I looking at right now?” and that accepted answer remains stable during bucket interaction.
- The remaining runtime-noise follow-up is separate and should not keep the Lane B filtering/parity milestone open.

Affected product areas:
- Shared Analysis Rail
- Time Context

Affected code areas:
- None in this pass; closeout is a control-plane milestone acceptance.

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `06_system_state/CHANGELOG.md`
- `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`

What was propagated:
- Marked Lane B closed in the control plane for Time Context filtering/parity behavior.
- Kept ACE-005 active and explicitly separate from the Lane B milestone.
- Recorded the milestone in `CHANGELOG.md`.
- Updated the Time Context phased plan so the closeout language no longer conflicts with the accepted milestone.

Notes:
- This closeout is for filtering/parity behavior only.
- The broader Time Context grammar lock remains open as separate work.
- ACE-005 remains active for any residual malformed inbox-analysis caller outside the narrowed review-route chain.
- Cold-boot review-route `/api/agents/playground` bootstrap behavior is currently accepted as required under the present architecture and is not a Lane B blocker.

---

### [ACE-013] Time Context — Lane B Single-Authoritative-Sender-Universe Enforcement

Date: 2026-04-01
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Time Context filtering now resolves through one explicit authoritative sender universe across active workflow filters.
- Session-only bucket selection no longer competes with peer workflow filters through hidden precedence rules.
- Sender rows, workflow summary, pagination totals, Sender Distribution ordering/counts, and Decision Mode queue progression now read from the same resolved ordered sender set.
- Bucket highlighting remains visual-only for the chart:
  - no chart collapse
  - no aggregation rewrite

Reason:
- Lane B needed an enforceable answer to “what sender set am I looking at right now?”
- Previous bucket behavior could still drift when different narrowing paths used different authority sources.

Affected product areas:
- Time Context
- Shared Analysis Rail
- Sender Overview
- Decision Mode

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`

Docs requiring propagation:
- `03_gmail_workspace/04_sender_decision_ui/03_time_context/TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
- `03_gmail_workspace/04_sender_decision_ui/01_analysis_rail/Shared_Rail_Analysis_spec.md`
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`

What was propagated:
- Recorded the one-authoritative-sender-universe rule in the Time Context phased plan.
- Updated the Shared Analysis Rail spec to require deterministic combined filtering through the shared workflow subset.
- Updated control-plane continuity docs so the implementation status and remaining browser-proof work are explicit.
- Applied the April 2 correction pass in the review page / rail components so selected-bucket summary surfaces, hover behavior, and Sender Distribution authoritative-context chips no longer drift away from the resolved workflow sender universe.
- Applied the April 2 selected-bucket authority correction so the remaining `5 -> 9` mismatch no longer mixes chart bucket semantics with row-any-message bucket membership:
  - bucket-filtered workflow membership now resolves from the same sender-level Time Context semantics as the clicked chart
  - selected-bucket count surfaces now prefer the active narrowed bucket workspace over broader coverage fallbacks

Notes:
- This event recorded the contract-enforcement implementation that later closed under `ACE-014`.
- This event does not close the separate empty `action:""` runtime-noise follow-up.
- Cold-boot review-route `/api/agents/playground` bootstrap behavior is tracked separately and is not part of the Lane B closeout.

---

### [ACE-012] Shared Hot-File Merge System Hardening

Date: 2026-04-01
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- The hot-file merge system is refined through one authoritative protocol document instead of relying on scattered checklist-only guidance.
- Merge preflight must use merge-base, two-sided overlap detection rather than a one-sided changed-file view.
- If classification = `hot_file_integration_required`, full git merge is prohibited and the work must route to a dedicated Codex integration pass.
- Default merge bias rules are now explicit:
  - UI files prefer `main` unless PM overrides
  - runtime logic prefers the active worktree lane
  - imports union unless the conflict is semantic
  - types/interfaces prefer the superset, not reduction
- If Codex fails the same hot-file integration twice, execution must stop and return to PM instead of retrying blindly.

Reason:
- The April 1 baseline established the operating model, but the system still needed one authoritative protocol and tighter enforcement for preflight, merge prohibition, and escalation.
- The goal is to keep Oliver out of manual shared-file triage by default while preserving a lightweight and repeatable workflow.

Affected system areas:
- Codex execution system
- PM routing and review workflow
- worktree sync operating model
- hot-file integration workflow

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/lib/integrations/gmail/inboxAnalysis.ts`
- future PM-designated shared hot files

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/CHANGELOG.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `00_core_context/Project Manager Activation & Turnover Protocol.md`
- `07_reference/Shared_Hot_File_Merge_Protocol.md`
- `07_reference/Git_GitHub_Worktrees_Backups_operating_Model.md`
- `07_reference/Simple_Worktrees_Setup_Checklist.md`
- `07_reference/OLIVER_OPERATING_CHECKLIST.md`
- `07_reference/CODEX_PROMPT_TEMPLATES.md`
- `07_reference/SYSTEM_MEMORY_MAP.md`
- `AGENTS.md`

What was propagated:
- Added `Shared_Hot_File_Merge_Protocol.md` as the authoritative human-readable merge workflow.
- Tightened merge preflight to require merge-base, two-sided overlap classification.
- Added the hard prohibition on full git merge for `hot_file_integration_required`.
- Recorded the default merge bias rules for UI, runtime logic, imports, and types/interfaces.
- Added the two-failure escalation rule that returns the decision to PM.

Notes:
- `ACE-009`, `ACE-010`, and `ACE-011` remain completed historical context and were not reopened by this pass.
- No runtime, UI, schema, or product behavior changed in this pass.

### [ACE-010] Shared Hot-File Merge Protocol + Codex-Assisted Integration

Date: 2026-04-01
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Shared hot files must be explicitly identified and treated as a separate integration class from docs/control-plane files.
- Codex should perform preflight detection of overlapping hot-file edits between `main` and active worktrees before any attempted merge.
- Hot shared code merges should be handled through a dedicated Codex-assisted integration pass instead of ad hoc manual comparison by Oliver.

Reason:
- Files such as `review/page.tsx`, `gmailCleanupWorkspace.ts`, and `inboxAnalysis.ts` produced high-friction manual merge conflicts.
- These files are shared runtime surfaces that multiple lanes may touch concurrently.
- The system needs a repeatable mechanism to detect, classify, and route these merges safely.

Affected system areas:
- Codex execution system
- Worktree operating model
- Runtime integration workflow
- PM review workflow

Affected code areas:
- `web/src/app/agents/[id]/operations/review/page.tsx`
- `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
- `web/src/lib/integrations/gmail/inboxAnalysis.ts`
- Any future files designated as shared hot files

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/CHANGELOG.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `07_reference/Git_GitHub_Worktrees_Backups_operating_Model.md`
- `07_reference/Simple_Worktrees_Setup_Checklist.md`
- `07_reference/OLIVER_OPERATING_CHECKLIST.md`
- `07_reference/CODEX_PROMPT_TEMPLATES.md`
- `AGENTS.md`

What was propagated:
- Defined `shared hot files` in the active operating model and prompt templates.
- Added merge preflight rules that classify overlap before any attempted full merge.
- Added a dedicated Codex-assisted hot-file integration workflow and explicitly removed Oliver as the default manual merge resolver.
- Locked the current shared hot-file list into the operating docs.

Notes:
- Human review may still be required for final product judgment, but Codex owns the comparison/proposal/integration workflow.
- `ACE-011` remains completed historical recovery context and is not reopened by this event.

---

### [ACE-009] Worktree Sync Automation + Conflict Recovery System

Date: 2026-04-01
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Worktree synchronization must no longer rely on manual human conflict resolution for control-plane and documentation files.
- The system must introduce a documented and automatable docs-only sync workflow between `main` and active worktrees.
- The system must introduce a documented conflict-recovery workflow for aborting unsafe full merges, restoring resolved docs, and completing docs-only sync safely.
- Control-plane sync and shared-code integration are now treated as separate operations.

Reason:
- Manual worktree sync created excessive operator overhead and unacceptable time cost.
- The current merge process exposed that control-plane/doc sync and hot shared code merges have different risk profiles.
- Future PM activation and turnover must not depend on repeating manual merge triage.

Affected system areas:
- Worktree operating model
- Control Plane
- PM activation / turnover workflow
- Codex execution system
- Local Git operating process

Affected code areas:
- Documentation / operating-model layer in this pass
- Optional future automation scripts / skills layer

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/CHANGELOG.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `01_workspace_architecture/system_overview.md`
- `07_reference/Git_GitHub_Worktrees_Backups_operating_Model.md`
- `07_reference/Simple_Worktrees_Setup_Checklist.md`
- `07_reference/OLIVER_OPERATING_CHECKLIST.md`
- `00_core_context/Project Manager Activation & Turnover Protocol.md`
- `07_reference/SYSTEM_MEMORY_MAP.md`
- `07_reference/CODEX_PROMPT_TEMPLATES.md`

What was propagated:
- Added formal `docs-only sync` procedures for `main -> worktree` and `worktree -> main`.
- Added formal `conflict recovery` steps for unsafe full merges.
- Added explicit rules for aborting a full merge and falling back to docs-only sync.
- Added PM/Codex-facing execution guidance so the recovery flow no longer depends on Oliver reconstructing it manually.

Notes:
- This event produced the official automation-ready documentation for the merge-recovery workflow.
- `ACE-011` remains the completed historical execution record for the recovery example itself.

---

### [ACE-011] Docs-Only Worktree Sync Recovery Executed

Date: 2026-04-01
Owner: PM
Status: Completed
Propagation Owner: Human + Git
Propagation Status: Fully Executed

Decision:
- The failed full merge between `main` and `cleanup-taxonomy-rebuild` was intentionally split into:
  - a docs/control-plane sync
  - deferred shared-code integration
- Resolved control-plane documents were preserved, the unsafe full merge was aborted, and docs-only sync was completed in both directions.

Reason:
- Full merge included shared hot-file conflicts that were not appropriate to resolve during control-plane alignment and PM activation prep.
- The immediate goal was to unify operating docs and control-plane truth without forcing risky code integration.

What was done:
- Backed up resolved doc merges from the interrupted main-repo merge.
- Aborted the unsafe full merge on `main`.
- Restored resolved control-plane docs into `main`.
- Pulled docs/proofs from `cleanup-taxonomy-rebuild` into `main` and committed/pushed a docs-only sync.
- Aborted the unsafe repo -> worktree full merge in `cleanup-taxonomy-rebuild`.
- Pulled updated control-plane / operating docs from `origin/main` into the cleanup worktree and committed/pushed a docs-only sync.

Files / areas affected:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/CHANGELOG.md`
- `07_reference/project_structure.txt`
- cleanup-group docs / proofs
- PM / Codex operating docs synced into both repo contexts

Notes:
- This event records what was already executed.
- Shared hot-file code integration remains intentionally deferred and should be handled under a separate active protocol.

---

### [ACE-008] Codex Prompt Standardization

Date: 2026-04-01
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- Non-trivial PM -> Codex execution prompts now use `07_reference/CODEX_PROMPT_TEMPLATES.md` as the standard source of truth.
- If a task references a Skill, the prompt must include both `Skill` and `Skill Location`.
- Codex must explicitly load the referenced skill file from the local Codex skills directory before execution.
- Ambiguous or unscoped PM -> Codex execution prompts are no longer valid for non-trivial work.

Reason:
- Reduce execution drift between PM intent and Codex behavior.
- Make skill usage explicit and enforceable.
- Keep the `Oliver -> Project Manager -> Codex` communication model consistent across the control plane.

Affected system areas:
- Control Plane
- Core Context
- PM -> Codex communication model
- Codex instruction layer
- Skills workflow

Affected code areas:
- Documentation and operating-model layer only in this pass.

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `00_core_context/agent_activation_checklist.md`
- `AGENTS.md`
- `06_system_state/CHANGELOG.md`

Notes:
- `07_reference/CODEX_PROMPT_TEMPLATES.md` is the reference source of truth for this standardization pass.
- Propagated in this pass:
  - `06_system_state/CURRENT_STATE.md`
  - `06_system_state/TODO.md`
  - `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
  - `00_core_context/agent_activation_checklist.md`
  - `06_system_state/CHANGELOG.md`
- Verified unchanged in this pass:
  - `AGENTS.md`

---

### [ACE-007] Context Migration — Multi-Thread Work Capture

Date: 2026-04-01
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- All active work, decisions, and system changes from the originating chat session are now migrated into the Control Plane.
- This entry replaced chat-held continuity across multiple threads and worktrees with explicit control-plane truth.
- Future work must reference the Control Plane + `ACTIVE_CHANGE_EVENTS.md` instead of prior chat history.

Reason:
- Chat-held continuity had exceeded sustainable session length and created drift risk.
- Critical Cleanup Groups and Analysis Rail decisions existed in chat but not in the authoritative docs.
- A clean Project Manager handoff required the current system state to be recoverable from docs alone.

Major work streams captured:
1. Cleanup Groups — Multi-Phase Rebuild
   - Phase 0-4 planning locked.
   - Lane A implemented and accepted for root-surface behavior.
   - Lane B partially closed with marketing unit-only entry, review-unit integrity, spillover as a first-class unit, unit-scoped hero truth, unit-scoped decision handoff, and invalid/missing/blank unit guards.
   - Lane B final closeout remains open and Lane C has not started.
2. Analysis Rail / Time Context / Charts
   - Lane A implemented with scope strip enforcement, exact bucket grammar, empty interval preservation, row-backed monthly aggregation, same-array truth, non-additive bucket truth, axis readability improvements, and ghost-slot rendering.
   - This migration event captured the then-open Lane B filtering/parity work that later closed under `ACE-014`.
   - Residual validation/reconciliation and the separate `ACE-005` runtime-noise follow-up remained open after the migration snapshot.

Affected systems:
- Gmail Workspace
- Sender Decision UI
- Cleanup Groups
- Analysis Rail
- Time Context
- Sender Distribution
- Decision Mode
- Runtime (inbox-analysis API)
- Artifact Engine (timeline dependency)
- Codex execution system
- Documentation system (control plane + orientation)

Affected code areas:
- `review/page.tsx`
- `clusters/page.tsx`
- `GmailCleanupComponents.tsx`
- `gmailCleanupWorkspace.ts`
- `inboxAnalysis.ts`
- runtime workspace + inbox-analysis API
- artifact / timeline generation logic

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `01_workspace_architecture/system_overview.md`
- `04_product_design/PM_ONBOARDING_BRIEF.md`
- `06_system_state/CHANGELOG.md`

Notes:
- This event is the authoritative migration point from chat -> system for the captured work streams.
- Propagated in this pass:
  - `06_system_state/CURRENT_STATE.md`
  - `06_system_state/TODO.md`
  - `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
  - `01_workspace_architecture/system_overview.md`
  - `04_product_design/PM_ONBOARDING_BRIEF.md`
  - `06_system_state/CHANGELOG.md`
- Verified unchanged in this pass:
  - `07_reference/SYSTEM_MEMORY_MAP.md`
  - `AGENTS.md`
  - `00_core_context/agent_activation_checklist.md`
- Incomplete product/runtime phases remain active work, but the context-migration event itself is fully propagated and closed.

### [ACE-006] Codex Operating System Implementation

Date: 2026-04-01
Owner: PM
Status: Completed
Propagation Owner: Codex
Propagation Status: Fully Propagated

Decision:
- The project now runs on a Codex Operating System.
- The operating model is now split into Control Plane, Orientation, Routing, and Skills layers.
- Control Plane files define active truth.
- `SYSTEM_MEMORY_MAP.md` is now a routing system, not a static index.
- `AGENTS.md` defines enforceable Codex behavior.
- PM activation now uses a 3-message model: Control Plane, Orientation, Execution Continuity.
- Skills under `.agents/skills/` define repeatable execution workflows.

Reason:
- Reduce drift.
- Reduce manual document coordination.
- Reduce turnover time.
- Eliminate memory-based workflow management.
- Make PM → Codex execution repeatable and enforceable.

Affected system areas:
- Control Plane
- Core Context
- Workspace Architecture
- Agent Runtime
- Gmail Workspace
- Product Design
- Codex Instruction Layer
- Data / Schema / Reference Layer
- Operating Model
- Skills Layer

Affected code areas:
- Documentation and operating-system layer only in this pass.

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `01_workspace_architecture/system_overview.md`
- `04_product_design/PM_ONBOARDING_BRIEF.md`
- `07_reference/SYSTEM_MEMORY_MAP.md`
- `AGENTS.md`
- `00_core_context/agent_activation_checklist.md`
- `06_system_state/CHANGELOG.md`

Notes:
- This is the first full-system propagation test of the new operating model.
- `SYSTEM_MEMORY_MAP.md`, `AGENTS.md`, and `agent_activation_checklist.md` may already be aligned, but they must be verified against the new operating model rather than assumed.
- First full-system propagation validation pass completed on 2026-04-01.
- Propagated in this pass:
  - `06_system_state/CURRENT_STATE.md`
  - `06_system_state/TODO.md`
  - `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
  - `01_workspace_architecture/system_overview.md`
  - `04_product_design/PM_ONBOARDING_BRIEF.md`
  - `06_system_state/CHANGELOG.md`
- Verified unchanged in this pass:
  - `07_reference/SYSTEM_MEMORY_MAP.md`
  - `AGENTS.md`
  - `00_core_context/agent_activation_checklist.md`
- This event is complete and should now be treated as closed historical context unless a new operating-model change is introduced.

### Historical Continuity Note — Former ACE-047 Verification Discipline

Original Date: 2026-04-12  
Owner: PM  
Status: Superseded by the active `ACE-047 Time Context Rebuild` lane on 2026-04-16  
Propagation Owner: Codex

Decision:
- This former ACE-047 captured the verification-discipline escalation that preceded the rebuild activation.
- Codex may not treat a pass as complete, tentatively acceptable, or ready for propagation unless the rendered chart truth is reconciled against the workflow truth on the same live route.
- For ACE-046 Time Context work, required visible verification must compare at minimum:
  - Workflow totals
  - Sender Distribution totals
  - Time Context bucket totals
  - the same calendar dates across adjacent scopes when those scopes overlap
- The governing invariant is now explicit verification truth, not inferred implementation confidence:
  - same dates = same senders = same counts
  - Workflow is the authoritative sender universe
  - visible Time Context charts must reconcile to that same universe
  - Sender Distribution must reconcile to that same universe
- Codex may not close out a pass by saying the remaining issue is acceptable within a different chart “universe,” “story,” or derivation path.
- If visible surfaces disagree, the pass remains open.
- Codex must continue within the active thread/mode unless a real control-plane boundary is hit:
  - accepted fix
  - governing truth change
  - propagation checkpoint
  - thread-closeout boundary
  - explicit PM-directed replan/new thread
- “Could not finish” or “partial improvement only” is not a valid stopping point by itself when the active execution scope is still bounded and the blocker remains diagnosable.

Reason:
- Repeated QA evidence showed Codex reporting passes as materially complete while the rendered surfaces still visibly contradicted each other.
- PM had to repeatedly catch obvious cross-scope contradictions that should have been rejected during Codex self-verification, including:
  - daily vs weekly mismatch on the same dates
  - weekly vs monthly mismatch on the same dates
  - yearly April totals contradicting monthly April totals
  - Time Context chart totals contradicting Workflow and Sender Distribution totals
  - `all_indexed` failing to render while narrower scopes were still being treated as partially acceptable
- This is now recognized as an operating-model verification breakdown, not just a product bug.
- The control plane must preserve that accepted implementation is blocked unless Codex proves rendered-surface reconciliation, not merely code-path intent.
- This content remains historical governing continuity, but it no longer defines the active lane identifier or active next step.

Affected product areas:
- Operations Review
- Shared Analysis Rail
- Time Context
- Sender Distribution
- PM / Codex verification workflow

Affected code areas:
- no code target in this ACE itself
- enforcement applies to future ACE-046 implementation and verification passes

Docs requiring propagation:
- `06_system_state/CURRENT_STATE.md`
- `06_system_state/TODO.md`
- `06_system_state/ACTIVE_CHANGE_EVENTS.md`
- `00_core_context/07_PROJECT_MANAGER_CONTEXT.md`
- `06_system_state/CHANGELOG.md` only when this enforcement event is later accepted/completed

Notes:
- This ACE does not replace `ACE-046`; it governs how `ACE-046` must be verified.
- Required PM/Codex proof for future Time Context closeout must include a reconciliation bundle on the same canonical route showing:
  - `1D`
  - `1W`
  - `1M`
  - `1Y`
  - `all_indexed` when applicable
  - explicit comparison between Workflow totals and visible chart totals
  - explicit comparison of overlapping dates across adjacent scopes
- Future verification language must reject phrases such as:
  - “correct in its own universe”
  - “acceptable enough to move on”
  - “partial fix with residual visible mismatch”
  when rendered surfaces still contradict each other.
- This ACE remains active until the control plane and execution discipline fully reflect this verification requirement.

---
