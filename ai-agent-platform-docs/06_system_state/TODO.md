# ✅ TODO — AI Agent Platform (Web)
_Last updated: 2026-03-25 (Cleanup-group coverage complete • Semantic model + rollups landed • Visualization truth follow-up required)_

- Project Manager — healthy (v8 active)
- Architect — healthy
- Backend — healthy
- Frontend — healthy
- Workflow — healthy
- LLM Trainer — healthy
- Avatar & Voice — healthy
- Prompt Engineer — healthy

## 🔥 Current Focus (This Week)

----

## 🚀 Phase L2.4 — Semantic Visualization + Cleanup Taxonomy Lock (CURRENT)

Goal:
- lock the semantic presentation and cleanup-group refinement plan before the next rebuild
- keep the current artifact-backed 8-group model stable while truth/presentation issues are resolved

### L2.4.1 — Sender Overview Semantic Visualization Truth
- [ ] Redesign the Sender Overview semantic row so percentages, counts, and bar widths use explicit and matching denominators
- [ ] Make visible-subset vs full-group semantics obvious anywhere top buckets are shown
- [ ] Ensure semantic cards communicate whether they show full-group share, relative comparison, or filtered/resolved-only subsets
- [ ] Remove any presentation that makes tiny shares look visually dominant

### L2.4.2 — Cleanup-Group Refinement Planning
- [ ] Review the current 8 cleanup groups using the new semantic rollups
- [ ] Decide which groups remain final, which need re-thresholding, and which are merge/split candidates
- [ ] Separate durable semantic buckets from umbrella buckets and internal fallback-only states at the group level
- [ ] Lock the cleanup-group refinement plan before any new artifact rebuild

### L2.4.3 — Final Rebuild Preparation
- [ ] Keep rebuilds paused while taxonomy, rollups, and cleanup-group semantics are still moving
- [ ] Complete semantic visualization redesign and cleanup-group refinement first
- [ ] Run one final rebuild only after the plan is locked
- [ ] Validate the rebuilt artifact against the 8-group source-of-truth expectations and semantic rollup outputs

## 🚀 Phase L — Sender Surface Unification (PRIMARY)

Goal:
- Implement ONE unified sender card system with TWO modes (Overview + Decision)
- Ensure in-place transition (overlay) with zero context loss

### L1 — Unified Sender Card Foundation
- [ ] Define shared data contract for sender card (identity, signals, categories, proof, impact)
- [ ] Ensure same card renders in both Overview and Decision modes (no duplicate components)

### L2 — Sender Overview (Overview Mode)
- [ ] Clean top section hierarchy (counts, mix, activity, explanation)
- [ ] Improve sender list rows (key signals + quick context)
- [ ] Add clear group explanation (what/why/expected action)

### L3 — Decision Mode (Overlay)
- [ ] Implement overlay/focus state for Decision Mode (no navigation)
- [ ] Add 4 decision actions on card (Keep All / Keep Some / Archive All / Not Sure)
- [ ] Add progress + auto-advance (Show 1 → decide → next)

### L4 — Transitions & Flow
- [ ] Click sender → open Decision Mode on that sender
- [ ] “Start Guided Review” → start from first sender
- [ ] Exit Decision Mode → return to same scroll position

### L5 — Protected / Trusted Senders Group
- [ ] Add Protected/Trusted cluster in Cleanup Groups
- [ ] Surface why senders are protected (signals)
- [ ] Allow override decisions within this group

### L6 — UX Polish
- [ ] Reduce clutter / competing sections on Sender Overview
- [ ] Ensure no context switching anywhere in flow
- [ ] Validate “slippery slide” from explore → decide → complete

## 🚨 Phase: Runtime Stabilization (Completed)

- [x] Disable passive discovery rebuilds
- [x] Disable passive mailbox-index sync
- [x] Block initial-paint heavy inbox-analysis routes
- [x] Add heavy-action safety layer
- [x] Optimize manual regeneration (skip sync)
- [x] Add discovery row cache
- [x] Move snapshot save off critical path
- [x] Optimize runtime wrapper (skip preload)
- [x] Restore Cleanup Groups safe initial render without reopening blocked initial-paint heavy fetches
- [x] Restore Decision Mode first-click reliability
- [x] Restore Sender Overview first-open recovery under containment
- [x] Restore Mailbox Intelligence first-open recovery under containment

Runtime-loading note:
- Cold first-open on Sender Overview and some Mailbox Intelligence seed-miss cases is still slower because recovery resolves through deferred safe fetches.
- Warm loads are fast again once runtime/cached state exists.
- Keep the current loading containment intact; treat any future cold-open optimization as a separate performance pass.

## 🎯 Next Phase: Product Work (Sender Overview Data Truth)

NOTE:
This work is now superseded by Phase L (Sender Surface Unification). Keep items below only if directly supporting Phase L.

- [ ] Improve usefulness of sender-global category mix
- [ ] Improve dominant-pattern usefulness
- [ ] Create more actionable sender breakdowns beyond broad labels like `Updates` / `Promotions`
- [ ] Keep the current loading containment intact while iterating on Sender Overview truth/presentation

- [ ] Resume Sender Decision UI work
- [ ] Improve sender category clarity
- [ ] Add category provenance UI
- [ ] Add exclusion reason visibility
- [ ] Improve decision confidence UX

```
- [ ] Unify Sender Overview and Decision Mode into one card system (see Phase L)
- 🚀 Sender Decision System Build (NEW — PRIMARY PRIORITY)
  - [ ] Build Sender Decision Mode (Tinder-style flow)
  - [ ] Implement single-sender review card system
  - [ ] Add 4 core decision actions:
        - Keep All
        - Keep Some
        - Archive All
        - Not Sure (Quarantine)
  - [ ] Implement instant decision progression (no page reload, next sender loads immediately)
  - [ ] Add sender profile intelligence panel:
        - sender identity (human vs machine)
        - email category breakdown
        - behavior patterns
        - example emails per category
  - [ ] Build "Keep Some" deep review mode:
        - category-level decision controls
        - expandable email previews
        - like / don’t like per category
  - [ ] Connect decisions to Management buckets:
        - Keep → no action
        - Archive → archive bucket
        - Keep Some → custom rules bucket
        - Not Sure → quarantine bucket
  - [ ] Add decision progress system:
        - % complete for sender review
        - remaining senders count
  - [ ] Add fast-flow UX:
        - keyboard shortcuts (later)
        - minimal friction decision flow
  - [ ] Ensure zero ambiguity in decision outcomes
  - [ ] Validate full flow from Sender Decisions → Management
```

- 🧠 Mailbox Intelligence (MAINTENANCE MODE)
  - [ ] Minor polish only if needed
  - [ ] No major rework (system considered complete)
  - [ ] Ensure compatibility with Sender Decision System
0) Gmail Cleanup Sender-First Follow-up (NEW)
   - [x] Replace post-confirmation approval-queue handoff with direct sender destination-state commits
   - [x] Add durable sender destination profiles to Gmail cleanup memory
   - [x] Create a route-safe Decision Management Dashboard scaffold for destination summaries and recent decision activity
   - [x] Separate destination commit state from execution state in sender destination profiles
   - [x] Demote legacy approval/audit routes and promote Management into the primary Gmail cleanup navigation
   - [x] Add real archive execution verification before surfacing `succeeded`
   - [x] Add a real archive restore path from Decision Management
   - [ ] Decision Destinations follow-up:
     - verify approved Confirmation decisions persist into destination states across reload
     - confirm no new Pending Approval items are created by the Gmail Confirmation approve action
     - browser-verify the new archive execution truth states (`succeeded` / `failed` / `deferred` / `not_applicable`) and capture exact failure modes
     - browser-verify archive restore end to end against live Gmail inbox state
     - add sender-level restore / revert execution flows beyond the current archive restore + destination removal controls
     - add focused destination drill-down views for Keep / Archive / Quarantine / Unsubscribe / Custom Rule
     - connect future AI rule recommendations to the shared management layer
   - [x] Stabilize sender-first cleanup-group generation at the data layer
   - [x] Add shared cached derived workspace state for intelligence / sender workspace / confirmation
   - [x] Restore Mailbox Intelligence analytics visuals with interactive sender controls
   - [x] Reuse cached intelligence between Mailbox Intelligence and Cleanup Groups
   - [x] Add server-backed sender search/filter/sort/direction controls
   - [x] Move later-phase review stages to route-safe placeholders
   - [x] Tighten Phase 1 route cache invalidation to cleanup-snapshot changes only
   - [x] Add synchronous warm-cache reuse for Mailbox Intelligence / Cleanup Groups on normal navigation
   - [x] Add cached sender-workspace base-state reuse so sender search/filter/page interactions stop rebuilding the full sender derivation path
   - [x] Add debounced sender search plus last-request-wins fetch behavior for Sender Decisions
   - [x] Keep same-cluster sender data visible while new search/filter/page slices load
   - [x] Harden Phase 1 draft persistence so sender decisions survive leaving and returning to the same cleanup group
   - [x] Clarify Confirmation wording around archive-now vs stored-later Phase 1 decisions
   - [x] Auto-select the recommended cleanup group when Sender Decisions is opened without a valid cluster id
   - [x] Fix the draft hydration/write race so stored sender decisions actually restore on return
   - [x] Keep sender-search input focus stable while preserving debounce
   - [x] Move sender-specific analytics into Sender Decisions and keep Mailbox Intelligence high-level only
   - [x] Reduce sender-page signal loading cost by skipping the broad indexed message scan on the fast review path
   - [x] Stop navigation-only cleanup-discovery rebuilds caused by stale TTL or sync-timestamp-only changes
   - [x] Add Phase 1-safe decision editing controls inside Confirmation
   - [x] Serve the latest stable cached runtime snapshot first on interactive Phase 1 routes instead of auto-refreshing on short local TTL age
   - [x] Tighten runtime/discovery invalidation so only real indexed snapshot advancement can trigger interactive refresh paths
   - [x] Prevent Sender Decisions direct entry from kicking off fallback-cluster work before recommended cluster resolution finishes
   - [x] Reframe Mailbox Intelligence as the high-level mission/status dashboard instead of a second sender review page
   - [x] Tighten Mailbox Intelligence into a true mission-control surface where health / next action / progress / risk outrank lower-value stats
   - [x] Reduce Cleanup Groups duplication on Mailbox Intelligence to a lightweight preview plus explicit handoff
   - [x] Reduce Mailbox Intelligence cleanup-group preview to a single recommended handoff instead of a second selection surface
   - [x] Collapse the lower Mailbox Intelligence dashboard into one health-outlook block plus a minimal Cleanup Groups handoff
   - [x] Remove technical scope-ladder / telemetry-heavy clutter from Mailbox Intelligence so the page reads as one decisive control surface
   - [x] Reduce Mailbox Intelligence cold-load stalls by making indexed-row loading concurrent/shared and by reusing mailbox intelligence caches across cleanup-plan timestamp churn
   - [x] Render a runtime-backed Mailbox Intelligence mission boot panel while detailed intelligence hydrates
   - [x] Strengthen Sender Decisions as the primary sender analytics + evidence drill-down workspace
   - [x] Clarify Confirmation wording so archive-now and saved-later Phase 1 decisions read like deliberate operator choices
   - [x] Demote low-value technical scope wording such as `loaded preview rows` in the high-level surfaces
   - [ ] Phase 1 validation follow-up:
     - perform browser verification for direct `/operations/review?stage=senders` entry with no `cluster_id`
     - perform browser verification that Mailbox Intelligence and Cleanup Groups stay on the stable cached snapshot during normal navigation and do not regress into 15–40s recomputation
     - verify Phase 1 draft restore across navigation, reload, and pagination changes
     - verify sender analytics clicks drive the sender list without focus loss or full blackout reloads
     - verify Confirmation edit actions correctly round-trip back into Sender Decisions
     - verify Mailbox Intelligence now feels like the high-level mission dashboard while Cleanup Groups owns the full cluster-selection surface
     - verify the new Mailbox Intelligence mission panel answers the core operator questions quickly: inbox health, what matters now, what to do next, and what work is already in progress
     - verify the simplified Intelligence lower half no longer feels like a second analytics/status dashboard underneath the mission header
     - capture fresh cold-path timing for `mailbox_intelligence` after the concurrent indexed-row loader + mailbox-snapshot cache-key changes
     - verify Sender Decisions now reads as the primary drill-down workspace and Confirmation language feels operator-trustworthy
     - resolve the current `npm run build` Next 16 / Turbopack compile hang and capture a definitive production-build result
     - perform browser verification for Mailbox Intelligence, Cleanup Groups, Sender Decisions, Confirmation, and direct placeholder routes
   - [ ] Phase 2 planning follow-up:
     - design the dedicated Exceptions / Verification workspace once inline Phase 1 verification behavior is validated
     - define the real Rules / Automation editing surface and Monitoring recommendation UX
   - [x] Rebuild Gmail cleanup around sender-first guided workflow
   - [x] Make Mailbox Intelligence the true Gmail cleanup dashboard
   - [x] Replace mixed Batch Review UX with staged sender workspace
   - [x] Add explicit scope ladder (`whole mailbox -> cleanup candidate universe -> cleanup group -> sender set -> loaded preview rows`)
   - [x] Add Gmail cleanup memory write/read route
   - [x] Persist sender decisions + rule intents into `agent_events`
   - [x] Mirror active Gmail memory into `rag_documents`
   - [x] Connect Monitoring to event memory + semantic Gmail memory recommendations
   - [x] Resolve archive scope server-side from sender policies and chunk Gmail archive execution across >100 ids
   - [ ] Monitoring follow-up:
     - add stronger domain/similarity recommendation ranking and freshness controls
     - consider background recommendation generation on new-mail/index refresh events
   - [ ] Rules follow-up:
     - add richer rule-intent editing UI beyond policy-derived defaults
     - add explicit future-rule approval model if rules move beyond learned intent state
   - [ ] Execution follow-up:
     - decide when to ship real Gmail executors for unsubscribe/quarantine/custom-rule actions
   - [ ] Intelligence follow-up:
     - improve the remaining first-uncached mailbox-intelligence cold path further if indexed-row load still dominates after the new mailbox-context cache
     - consider persisted/materialized mailbox-intelligence aggregates
   - [ ] UI verification follow-up:
     - capture fresh localhost screenshots for Intro & Health, Mailbox Intelligence, Cleanup Groups, each Review stage, and Monitoring
   - [ ] Cleanup copy follow-up:
     - remove lingering historical `Batch Review` wording from older docs/pages that are now secondary utility surfaces only

1) Agent Runtime — Supervision Ladder (Slices #1–#6A) (COMPLETE)
   - [x] Plan → approve endpoints + approvals UI
   - [x] Confidence accumulation engine
   - [x] Supervisor mode + eligibility endpoint
   - [x] Guarded auto-approve
   - [x] Sandbox execution pipeline
   - [x] Execution logging + status UI

2) Integrations — Gmail OAuth + Draft Execution (COMPLETE)
   - [x] Tenant-level integration storage
   - [x] Gmail OAuth connect flow
   - [x] Runtime Gmail draft creation

3) Inbox Assistant — Operational Runtime (IN PROGRESS)
   - [x] Gmail inbox metadata analysis tool (gmail.analyze_inbox)
   - [x] Sender-cluster review tool (gmail.review_sender_cluster)
   - [x] Batch archive proposal system
   - [x] Approval → execute pipeline wired end‑to‑end
   - [x] Gmail archive execution implemented (remove INBOX label via Gmail API)
   - [x] Execution evidence returned to Playground
   - [x] Runtime suggestion lifecycle states (ready / pending / approved / executed)
   - [x] Playground state persistence/continuity across refresh and approvals round-trip
   - [ ] Open approvals link should open in new tab
   - [x] Refresh reconciliation so Playground detects executions and runtime state on return
   - [x] Gmail mailbox indexing hardening (data layer only):
     - directional index coverage metrics in index state
     - retry/backoff + adaptive concurrency in mailbox indexer
     - tenant sender intelligence table (`gmail_sender_stats`) recomputed after each sync
     - mailbox-index health endpoint expanded with additive status/coverage fields
   - [x] Operations data-depth trust follow-up:
     - review-detail now consumes indexed sender intelligence (`sender_index_signals`)
     - future-rule recommendation advisory block added in review detail
     - mailbox-index zero-health bootstrap trigger added in operations runtime context
     - review pattern panel now compacts when low-information
   - [x] Indexed cluster recovery + deeper evidence windows:
     - fixed cached zero-cluster snapshot reuse path in rehydrate mode (`v3` snapshot invalidation + zero-cluster refresh rule)
     - zero-cluster/index-advanced refresh now bypasses normal cooldown gating
     - index-backed cleanup discovery now falls back to actionable cluster synthesis when strict query matching returns zero
     - added explicit cluster rejection diagnostics (source counts, rejection buckets, strict/fallback match counts)
     - cluster contract now includes exact indexed windows (30d / 90d / 180d / total) plus signal mix and first/last seen
     - sender index signals now include 90d / 180d and first_seen
     - mailbox-profile metadata scan basis now reflects total indexed rows (not only inbox subset)
     - operations approvals now use backend `runtime_approval_queue_items` so summary/actionable rows stay scoped and consistent
     - operations health now surfaces degraded-but-usable sync semantics (`sync_health`, `usable_with_cached_index`, `last_sync_error`)
     - incremental index sync now degrades (partial metadata failure tolerance) instead of hard-failing whole run
   - [x] Indexed discovery depth expansion + transparency:
     - fixed shallow index-read behavior by adding paginated indexed message loading (up to configured 50k cap)
     - sender stats recomputation now consumes paged indexed corpus
     - review sender-signal reads now paginate with safe bounded cap (prevents single-query truncation)
     - discovery window now promotes broader historical windows (30/90/180/365) when indexed depth supports it
     - recent mail is reviewable for clustering while mutation safety remains approval-gated
     - operations runtime now schedules cooldown-guarded background backfill when index depth is shallow
     - overview/clusters now expose discovery-depth fields (rows/window/indexed date span/depth label)
   - [ ] Environment parity follow-up (required for full index coverage):
     - apply/verify `gmail_mailbox_index_state` migration in active Supabase project
     - ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured where mailbox indexing runs
     - run an initial successful mailbox index sync for active tenant and confirm non-zero indexed coverage
   - [ ] Index depth expansion follow-up:
     - increase indexed coverage beyond current thousands-row baseline toward full mailbox scale for higher-confidence cleanup planning
     - add operator-facing backfill progress milestones (queued/running/last attempt outcome)
     - tune sender-signal pagination bounds for very large tenants (quality vs latency controls)
   - [ ] Operations scope-control follow-up:
     - optional per-user default analysis window preference
     - optional “scope changed since last generation” stale badge before regenerate
   - optional explicit cluster-generation reason cards (qualifying, safety-filtered, scope-limited, coverage-limited)
   - [ ] Scope-propagation observability follow-up:
     - add lightweight server-side metric rollup for `[playground][cleanup-scope]` mismatches (selected vs effective) to detect regressions quickly.
   - [x] Review UX follow-up:
     - review detail query-cluster evidence browser now uses server-backed pagination with scope/filter/sort/page-size/range telemetry.
   - [x] Bounded review-unit follow-up:
     - query-cluster review now splits into bounded sender/domain/pattern/recency/mixed units.
     - browser paging now runs on cached precomputed unit subsets (instead of full-cluster re-filter per request).
     - review unit size is capped for performance/operator usability (`5,000` rows max per unit).
   - [x] Operations usability hardening follow-up:
     - review-unit queue is now visible and paged in review detail (not only select dropdown).
     - sender cards are compact/collapsed by default and paginated.
     - local (non-server-backed) message review now uses explicit page navigation instead of long “load more” growth.
     - scope/regenerate note now reports concrete deltas (added/removed/count-shifted/indexed span change).
   - [x] Review performance + sync hardening follow-up:
     - query-cluster browse fast-path for large indexed cluster types (`unread_clutter`, `old_read_mail`, `age_cluster`, `sender_cluster`).
     - cluster-browse cache now has in-flight dedupe and perf diagnostics (`cache_hit`, `duration_ms`).
     - review fallback sample fetch now activates only when browser path errors.
     - incremental history-list failure path now attempts bounded auto-recovery scan (up to 10k) before staying degraded.
   - [x] Large-cluster review workflow hardening follow-up:
     - semantic sub-buckets now drive large-cluster review units (recent/older promotions, social noise, commerce, recurring machine senders, one-off senders, mixed remainder).
     - sender type/protection filters are now live and affect sender pagination/results directly.
     - review browser loaded-message cache now caps growth for better long-session responsiveness.
     - duplicate bottom rule-recap block removed; rule guidance stays inline near sender + decision actions.
   - [x] Workflow/performance correction follow-up:
     - regenerate clusters now runs as non-blocking background refresh in operations shell/overview/clusters.
     - browser request dedupe added on client (`cluster/unit/page/filter/sort/scope` keyed in-flight/cache reuse).
     - review evidence request dedupe added for `review_query_cluster` (in-flight reuse + short TTL cache).
     - stale-first review flash reduced by suppressing old snapshot rendering when requested cluster is not yet hydrated.
     - unified top filters bar added in review detail; sender/message pagination semantics clarified as independent controls.
     - fast-path candidate narrowing expanded for newsletter/noreply/shopping/social browse paths.
     - structured inbox-analysis action logs now include review/browse/sender-signal action metadata (`rows_scanned`, `duration_ms`, `cache_hit`, `fast_path_applied`).
   - [x] Surgical regenerate/exactness follow-up:
     - `force + rehydrate_only` refresh now serves previous snapshot immediately and queues cleanup discovery recompute in background.
     - explicit regenerate lifecycle logs added (`snapshot_version_before/after`, recompute timestamps, background duration).
     - review message list now uses normal pagination without inner scroll viewport.
     - top-of-review analytics strip added (sender concentration, pattern mix, recency split, protected vs reviewable).
     - interaction filter options now show availability/counts and disable unsupported/no-op paths.
   - [x] Review UX architecture correction follow-up:
     - review terminology now uses cleanup-group / batch / message-page framing instead of raw cluster/review-unit wording.
   - [x] Review attribution + initial-paint slimming follow-up:
     - inbox-analysis requests now log request-source/component/reason/phase for exact review-surface attribution.
     - initial review paint now loads only critical paginated browser data; sender intelligence is deferred until requested.
     - cleanup discovery/background regenerate now logs timing subphases and can skip redundant index sync when recent indexed state is already usable.
   - [x] Review evidence + sender-detail follow-up:
     - visible review rows now hydrate Gmail snippets on demand for both sender-preview rows and message-review rows.
   - sender cards now open immediately while indexed sender history loads lazily per sender / per visible sender page.
   - top-of-review analytics now includes real charts for sender/category/recency/attention mix plus archive impact.
   - sender and message pagination controls are now more congruent, and message page size now supports `10 / 25 / 50 / 100 / 200`.
   - review UI now states available vs inferred vs unavailable Gmail signals in plain operator language.
   - [x] Review UI visible milestone follow-up:
     - bottom Message Review now renders hydrated browser rows, so snippets appear in the main review table instead of only in sender-preview paths.
     - top analytics now use larger chart cards (ranked bars, donut charts, column chart) tied to the active batch.
     - sender/message pagination now share the same visible pagination-toolbar pattern and live range summaries.
     - live Chrome verification confirmed visible snippets, chart titles, pagination labels, and signal explanation in the rendered localhost review UI.
   - [x] Hot-path reliability follow-up:
     - background cleanup refresh can now reuse current indexed coverage when it already satisfies the selected analysis scope.
     - operator-triggered background refresh no longer permits fallback full-rescan recovery during cleanup discovery.
     - snippet hydration now retries transient Gmail failures and logs structured failure categories.
     - sender-index requests now distinguish sender-detail vs sender-page modes and use smaller recent-evidence row scans.
   - [x] Mailbox Intelligence workflow step:
     - added `/operations/intelligence` as the bird's-eye indexed cleanup-universe view before Cleanup Groups and Batch Review.
     - intelligence page now shows top senders, sender-volume distribution, activity timeline, category mix, human-vs-automation ratio, and sender ranking table from indexed cleanup data only.
     - overview CTA and operations rail now guide operators through Inbox Overview -> Mailbox Intelligence -> Cleanup Groups -> Batch Review.
   - [x] Inbox Overview vs Mailbox Intelligence role split:
     - Inbox Overview is now the lightweight operational shell (refresh state, indexed mailbox status, pending approvals, high-level counts, CTA guidance).
     - Mailbox Intelligence is now the primary analytics/drill-down layer and explicitly explains the cleanup candidate universe vs whole mailbox.
   - [x] Guided-flow IA clarification pass:
     - left rail, page titles, and workflow strip now use the same naming (`Operations Overview`, `Mailbox Intelligence`, `Cleanup Groups`, `Batch Review`).
     - Batch Review now uses a stronger staged progression (`Batch Overview`, `Sender Decisions`, `Message Verification`, `Approval / Rule Recommendation`).
     - Operations Overview now explicitly points operators to Mailbox Intelligence for deeper analytics instead of competing with it.
     - Step 2 sender preview now explicitly shares the same full-preview affordance as Step 3.
   - [x] Cleanup-universe cold-path reuse:
     - added server-side `cleanup_group_intelligence` cache + inflight reuse keyed by scope/universe/snapshot version.
     - Overview now background-prewarms Mailbox Intelligence so the normal operator path opens on the warm cached payload.
   - [ ] Mailbox Intelligence follow-up:
     - add richer per-cluster comparison cards so operators can see which cleanup groups contribute most to the cleanup universe before opening Cleanup Groups.
     - consider linking sender rows from Mailbox Intelligence directly into prefiltered Cleanup Groups or Review once the operator workflow is stable.
   - [ ] Cleanup-universe first-uncached load follow-up:
     - first uncached `cleanup_group_intelligence` build is still dominated by `indexed_rows_load_ms` (~40–44s) before the server-side cache is warm.
     - next optimization should target the first indexed-row load itself (persisted precompute, stronger row-cache reuse, or refresh-time materialization), not just downstream chart aggregation.
   - [ ] Background regenerate optimization follow-up:
     - capture post-patch live regenerate timings to verify whether `index_sync_reused_existing_coverage` removes the old `~306s` background path in normal operator refresh flows.
     - if regenerate is still dominated by index sync, decide whether sender-stats recomputation / index sync / indexed-row load should move to stronger incremental or persisted-precompute paths.
     - review detail layout now follows a single operator workflow (analytics -> batch summary -> filters -> sender workbench -> message review -> approval builder).
     - background regenerate copy now uses operator-facing cleanup-analysis refresh language while preserving current snapshot visibility.
   - [ ] Remaining latency follow-up:
     - persist precomputed review-unit manifests by `cluster_id + analysis_scope + snapshot_version` to further reduce cold newsletter-like first-loads.
     - add server timing breakdown inside `browse_query_cluster` for `db_count_ms` vs `db_rows_ms` vs `unit_build_ms`.
   - [ ] Review browser follow-up:
     - support explicit multi-page selection persistence/summary UX for very large clusters (current selected subset is based on loaded evidence pages).
     - consider server-backed snippet persistence or lightweight snippet cache table if on-demand visible-row hydration becomes a noticeable bottleneck at scale.
     - if live snippet hydration still shows intermittent Gmail failures after retry/refresh handling, consider persisted snippet caching for recently viewed message ids.
   - [ ] Performance hardening follow-up:
     - add server-side cache-hit telemetry rollup for `browse_query_cluster` (first-hit vs warm-hit latency by cluster type).
     - evaluate precomputed review-unit manifests persisted per scope/snapshot to reduce cold-start browse latency further.
   - [ ] Review-unit follow-up:
     - optional risk/priority sort presets for review units (largest impact / lowest risk / newest-first queue order).
   - [ ] Mailbox sync reliability follow-up:
     - surface last auto-recovery attempt timestamp/reason in index health UI for degraded incremental states.
     - add explicit recovery-state enum in mailbox-index API contract (idle/retrying/recovered/cooldown) for clearer operator telemetry.

## ⚠️ Known Unrelated Typecheck Blockers (outside Gmail operations scope)

- [ ] `web/src/app/agents/[id]/fine-tune/page.tsx`
  - file is currently invalid/not module-safe with unresolved symbols (`agent`, `nextSuggestion`, `setShowLlmTrainingModal`, etc.)
  - blocks full-project `tsc --noEmit`
  - does **not** block Gmail Operations runtime functionality
- [ ] `web/src/app/agents/[id]/summary/page.tsx`
  - `onClick` handler type mismatch near line ~1783 (function signature incompatible with `MouseEventHandler`)
  - blocks full-project typecheck, unrelated to Gmail operations pass
- [ ] `web/src/app/api/rag/run/route.ts`
  - `resp` typed as `unknown` around lines ~511 and ~522
  - blocks full-project typecheck, unrelated to Gmail operations pass

4) Performance Improvements
   - [x] Reduce sequential runtime-state DB loading in Playground (`stateLoaders` now parallelizes evidence/history queries)
   - [x] Reduce cleanup-plan runtime-state latency (parallel cleanup-cluster discovery sampling)
   - [ ] Playground fast-path (skip RAG for simple prompts)
   - [ ] Retrieval caching
   - [ ] Reduce simple prompt latency
   - [ ] Optional next step: mailbox-index incremental performance tuning (delta sender stats + batched partial recompute) if needed at larger tenant scales

## 🧠 Codex Operating Model (Updated Mar 2026)
---
**Execution Philosophy (Hybrid Model):**
- Single-file edits → Project Manager may edit directly in chat (no Codex required).
- Multi-file logic changes → Use Codex with declared Feature Domain.
- Schema / Supabase structural changes → Use Codex only if Supabase CLI is connected.
- Refactors affecting multiple layers → Codex required.

**Feature Domain Discipline (Non-Negotiable):**
Each Codex thread must stay within ONE domain:
1) RAG Ingestion & Retrieval  
2) Prompt Contract / Summary Rewrite Engine  
3) Fine-Tuning System  
4) Agent Runtime (Production Inference)  
5) Workflow / Automation Engine  
6) Dashboard Intelligence Layer  

No cross-domain edits in a single Codex thread.

**Important Clarifications:**
- Docker is NOT required unless running Supabase locally.
- Supabase schema updates require Supabase CLI login (remote projects supported).
- Q&A-derived Prompt Contract fields remain canonical authority.
- RAG is supplemental evidence only.
- Fine-tune dataset generation is a separate domain.

This model reduces bureaucracy, avoids redundant Codex calls, and preserves system integrity.
---
### 🔒 UI Execution Guardrail (NEW — REQUIRED)
Every Codex UI prompt MUST include:

"Before changing UI, read:
- GMAIL_WORKSPACE_UI_STRUCTURE.md
- GMAIL_WORKSPACE_UX_SPEC.md
- gmail-workspace-visual-intelligence-spec.md
- gmail-workspace-intelligent-dashboard-spec.md"

Rules:
- No UI work without reading specs
- No visual elements without meaning
- No duplicate data representation
- Every UI element must answer a user question or guide action
1) **PM v8 Activation + Clean Handoff (PRIMARY PRIORITY)**
   - [x] RAG ingestion verified (Drive + URL, embeddings confirmed)
   - [x] Retrieval weighting hierarchy implemented (Drive boost, product intent tuning)
   - [x] Canonical merge protection in rewrite engine (no silent field shrinking)
   - [x] Strict JSON schema enforcement for evaluate + refine
   - [x] Rewrite gating by quality threshold (fast vs forced path separation)
   - [x] Circuit breaker for OpenAI abort/socket failures
   - [x] Create final v6 tag + snapshot commit
   - [x] Activate Project Manager v8 (fresh context thread)
   - [x] Enforce Feature Domain isolation in Codex tasks (no cross-domain mixing)
   - [x] Confirm v8 adopts Codex Execution Protocol as canonical

2) **Observability + Confidence Layer (Post-v7)**
   - [ ] Add rewrite influence log (which fields were expanded vs preserved)
   - [ ] Add optional debug mode to display RAG chunk influence during rewrite
   - [ ] Add rewrite diff viewer (before vs after comparison)
   - [ ] Add retrieval inspection panel in Playground
   - [ ] Add quality score trend tracking

3) **Fine-Tune Weighting Formalization**
   - [ ] Confirm final weighting hierarchy:
         Q&A refinement (canonical contract)
         → Manual fine-tune examples
         → RAG (Drive prioritized over URL)
         → Crawl-only evidence
   - [ ] Document weighting model inside SYSTEM_OVERVIEW.md
   - [ ] Add automated regression guard for guardrails/escalation policy
---

## ✅ Completed / Major Milestones
- [x] Agent Summary page upgraded: dynamic textarea expansion for long blocks (mission/guardrails/etc.)
- [x] Quality pipeline stabilized:
  - “Recalculate” = fast path
  - “Force Full Rewrite” = expensive path
  - Added guardrails to prevent both buttons behaving like full rewrite
- [x] Fine-tune dataset preview, next training suggestion, and Q&A improvement flow working
- [x] RAG ingestion pipeline working end-to-end (schedule → run → documents ingested)
- [x] Playground RAG retrieval fixed to correctly surface **exact blog URLs** when present
- [x] Agent Runtime Slice #1 shipped: plan → approve endpoints + approvals UI (schema-free via agent_events)
- [x] Tool/Workflow governance spec updated: granular confidence tracked per agent per tool action and per workflow/SOP
- [x] Gmail Inbox Assistant end‑to‑end operational
  - Inbox analysis → sender cluster review → approval → archive execution
- [x] First real Gmail inbox archive executed successfully via runtime pipeline
- [x] Runtime suggestion lifecycle tracking implemented (approval_request → decision → execution_result)
- [x] Archive execution evidence surfaced in Playground UI
- [x] Gmail OAuth scope upgraded to include gmail.modify for write operations
- [x] Playground runtime controller refactor milestone:
  - Runtime lifecycle logic extracted into `suggestionLifecycle.ts`
  - Runtime evidence/history loaders extracted into `stateLoaders.ts`
  - Gmail runtime progression extracted into `gmailRuntimeAssembler.ts`
  - Runtime orchestration service extracted into `runtimeStateService.ts`
  - Prompt assembly extracted into `playgroundPromptBuilder.ts`
  - RAG retrieval stack extracted into `playgroundRagService.ts`
- [x] Playground thin-controller pass:
  - OpenAI chat invocation + response/error handling extracted into `playgroundChatService.ts`
- [x] Playground thin-controller pass:
  - Analytics/session logging extracted into `playgroundAnalyticsService.ts`
- [x] Playground/Approvals UI polish pass:
  - Action-first “Current step” runtime panel
  - Runtime details/evidence drawer with operator-first ordering
  - Query cleanup clusters: compact rows, top-3 default visibility, nested safety/query details
  - Conversation preserved as secondary work area under runtime controls
  - Compact approvals decision card layout with pending emphasis and compressed approved/executed rows
- [x] Mailbox Intelligence / Profiling pass (read-only, pre-cleanup strategy layer):
  - Added additive `runtime_mailbox_profile` metadata in Playground runtime API
  - Default 30-day Gmail-native profile window (60-day compatible contract)
  - Added sender recurrence + subject-pattern bounded sampling
  - Added profile-driven protection candidates, cleanup candidates, and rule opportunities
  - Wired minimal Playground runtime-details profile card (no backend contract break)
- [x] Mailbox profiling freshness/caching hardening:
  - Added cleanup discovery/profile snapshot caching in `agent_events`
  - Added freshness states (`fresh` / `cached` / `stale`) with last-generated visibility
  - Prevented repeated Gmail profiling calls on routine rehydrate while cache is fresh
  - Added explicit mailbox profile refresh affordance in Playground runtime details
- [x] Operator cleanup strategy layer (profile-driven):
  - Added additive `runtime_cleanup_strategy` contract
  - Strategy sections: protect first / best first cleanup waves / rule opportunities / avoid-review zones
  - Wired into Playground prompt guidance for structured operator recommendations
  - Added compact strategy UI card in Playground runtime details
- [x] Trust + cleanup-promotion guardrails:
  - Added trust snapshot block (sample size / profile window / metadata basis / confidence)
  - Blocked cleanup action-promotion when 30-day mailbox profile is absent
  - Kept analysis/review guidance active without promoting cleanup approvals on sample-only basis
  - Replaced hardcoded Playground examples with agent-aware examples
- [x] Stronger bounded mailbox profiling basis:
  - Raised metadata scan basis from 60 -> 120 messages
  - Raised id scan basis from 120 -> 240 ids
  - Preserved cache TTL and bounded-scan design (no full-mailbox scan)
- [x] Gmail Playground trust + UX clarity refinement:
  - Tightened query specificity for newsletters/no-reply/shopping/social cleanup clusters
  - Added explicit estimate-overlap uncertainty surfacing for Gmail heuristic counts
  - Replaced vague runtime CTA copy with action-specific labels
  - Added “What happens next” consequence blocks on current-step and review cards
  - Standardized read-only language: review only, no inbox changes yet
- [x] Playground consistency hardening (session + approvals scope):
  - Playground → Approvals now carries explicit scope (`session` or `agent`) with visible queue scope labeling.
  - Session-scoped approval summaries now reconcile from the same scoped approval model in both surfaces.
  - Server-authored Playground chat rehydrate added via `playground.session_snapshot` + `session_messages`.
  - `review_query_cluster` approvals are executable from Approvals.
  - Runtime dedupe scope tightened to prevent sessionless requests from reusing session-scoped pending approvals.
- [x] Runtime reconciliation stabilization pass:
  - Immediate in-place approvals queue updates after approve/reject/execute
  - Canonical approval-id resolver applied to Playground candidate/cluster rendering
  - Clear-conversation unresolved approval carry-over visibility for prior session
  - Rehydrate-only cleanup discovery refresh deferral (cached/stale snapshot first)
- [x] Runtime reconciliation follow-up (March 11):
  - Query cleanup cluster pending display now reconciles with canonical queue pending for first-step sender-review submissions.
  - Runtime-refresh return path suppresses stale local pending/approved queue state until authoritative summary rehydrates.
  - Clear-conversation cleared-session context now carries only session identity (no pending/approved ghost-count carryover).
- [x] Clear-conversation semantics correction (March 11):
  - Clear now resets chat transcript/input only, without unmounting runtime dashboard or resetting approval/workflow surfaces.
  - Cleared-session message restore suppression prevents old transcript repaint while preserving authoritative runtime queue/evidence rehydrate.
- [x] Approval-summary clarity pass (March 11):
  - Added plain-English approval summary block to Playground Current Step and Approvals cards.
  - Added explicit representative-preview vs selected-scope wording for review/archive approvals.
  - Added scalable group-approval language (grouped/batch framing with representative examples and safety/exclusion statements).
- [x] Approval decision-surface professionalization (March 11):
  - Upgraded approval UI to high-signal decision cards (Action/Scope/Source/Why/Risk/Reversible/Exclusions/Effect).
  - Added structured representative example rows (subject + sender + date) for faster operator confidence.
  - Preserved runtime/approval semantics; this pass is presentation + supporting data shaping only.
- [x] Shared approval decision-card refinement (March 11):
  - Extracted shared `ApprovalDecisionCard` component and applied it to both Playground and Approvals.
  - Added stronger hero-row emphasis for action/scope/source/risk/reversible facts.
  - Demoted secondary explanatory text into collapsible supporting details for better scanability and reduced density.
- [x] Approval decision-card final polish (March 11):
  - Elevated affected count/scope prominence in hero area (archive/review actions).
  - Improved compact-card legibility so action/scope/source/risk remain visible without expansion.
  - Tightened representative examples into a table-like preview scan pattern (subject/sender/date + optional snippet).
- [x] Review-results workflow correction (March 11):
  - Added dedicated post-review “Review Results” primary state before next-step approval prompting.
  - Separated current review evidence from historical evidence in runtime details chronology.
  - Added cluster makeup + objective + recommended next action + future-prevention recommendation in review-results summary.
  - Replaced brittle affected-count parsing with structured count fields + explicit estimate labeling.
- [x] Reviewed-result detail surface extraction (March 11):
  - Added dedicated reviewed-batch detail page with richer operator context and evidence.
  - Added previous/next navigation across reviewed results.
  - Added result-scoped chatbot for reviewed-batch Q&A.
  - Kept Playground focused on high-level workflow + concise latest-review summary + CTA into full detail.
- [x] Review/Playground separation follow-up (March 11):
  - Added `session_origin` namespace support so review-detail chat traffic is isolated from main Playground workflow chat.
  - Suppressed stale sender/query review recommendations using reviewed-result lifecycle history.
  - Bound batch suggestions to the currently viewed reviewed-result context and demoted stale cross-result residue.
  - Further reduced Playground runtime-detail duplication by compacting historical evidence into timeline summaries.
- [x] Review-detail behavior isolation hardening (March 11):
  - Added explicit `request_mode` contract to distinguish main Playground vs review-detail inference behavior.
  - Added dedicated review-detail system prompt path (result-scoped guidance only).
  - Reduced review-detail backend load path to reviewed-result-focused data instead of full broad runtime-state assembly.
- [x] Runtime review trust hardening follow-up (March 11):
  - Current-step consequence copy now explicitly distinguishes approval-request creation vs mutation execution.
  - Added sender preference controls (`Keep Sender` / `Neutral` / `Deprioritize Sender`) in review-result context.
  - Added engagement-backed archive rationale shaping in approval summaries (signals + confidence + exclusions).
- [x] Runtime review UX stabilization follow-up (March 11):
  - Current Step now explicitly separates lifecycle state, next action, and read-only context.
  - Removed remaining duplicate latest-review top-card surface to reduce circular/self-referential navigation.
  - Demoted duplicated current-review details in Runtime details to canonical review-detail pointer.
  - Added explicit sender-preference effect text near recommendation output.
  - Added explicit archive trust summary wording in main UI (evidence mode, confidence, protected/excluded signals).
- [x] Operator trust + explicit choice follow-up (March 11):
  - Added canonical workflow-state helper (`playgroundWorkflowState.ts`) and wired Current Step lifecycle rendering to it.
  - Replaced internal sender-preference wording with operator-facing consequence labels.
  - Added lightweight pre-approval archive customization (exclude sender / exclude message subset) with selected/excluded counts.
  - Added explicit “opened status not available” trust copy in Playground/review-detail evidence context.
  - Extended archive approval summary to show subset scope (selected vs candidates vs excluded).
- [x] Operator usability/scalability follow-up (March 11):
  - Added grouped archive selection controls (pattern groups + sender groups) for faster large-batch customization.
  - Added a primary Decision Diff panel with reviewed/selected/excluded counts and included/excluded examples.
  - Separated sender preference into a distinct **Future sender policy** section.
  - Updated shared `ApprovalDecisionCard` to show Total reviewed / Archive selected / Excluded-kept scope totals.
- [x] Review-detail chat grounding follow-up (March 11):
  - Scoped chat now enforces observed-vs-estimated framing and explicit out-of-scope handling.
- [x] Session-scope stale-evidence suppression follow-up (March 11):
  - Session-scoped runtime evidence/review-results/archive evidence now filtered by scoped approval ids.
  - Review-detail rehydrate now applies scoped evidence filtering when session scope is provided.
- [x] Operations Workspace UI architecture split (March 11):
  - Added dedicated `/agents/[id]/operations/*` workflow surfaces (overview, clusters, review, approvals, history).
  - Added shared operations shell with left-rail operator navigation and right-side contextual AI assistant.
  - Added review-detail result navigation (`Previous result` / `Next result`) for multi-result operator traversal.
  - Shifted Playground to chat-first handoff mode (runtime operations moved to Operations workspace by default).
- [x] Operations Workspace clarity + native approvals follow-up (March 11):
  - Refined left-rail layout/grouping/active hierarchy for product-level navigation clarity.
  - Added sender-level inline message inspection in Review Detail.
  - Added explicit exclusion reason rendering (sender/pattern/manual/keep-policy) in message/sender contexts.
  - Added explicit selection-hierarchy guidance in Review Detail.
  - Reworked reviewed-result action copy to avoid redundant “review request” confusion.
  - Enabled inline approve/reject/execute in `/operations/approvals` via existing runtime APIs.
  - Added richer action audit context in `/operations/history`.
  - Added shared operations runtime snapshot context with cache + stale-while-revalidate to reduce redundant rehydrate calls.
- [x] Operations workflow-correctness + operator-clarity hardening (March 11):
  - Fixed cluster routing so `Open review` always opens requested `cluster_id` context (no unrelated latest-result fallback).
  - Removed review-approval requirement for inspection in Operations review flow (inspection is read-only by default).
  - Switched review navigation model to cluster queue traversal (`Previous cluster` / `Next cluster`).
  - Added compact pattern-breakdown mode when only one pattern is present.
  - Added message interaction filters/badges (unread, starred/important, inferred no-interaction-90d, thread participation).
  - Simplified review action bar to one mutation path (`Create archive approval request`) with explicit no-mutation-until-approve+execute copy.
  - Improved approvals card consequence clarity (`Applies to`, `If approved`, `If approved/executed`, `If rejected`).
  - Added page-contextual assistant suggested prompts in Operations side panel.
  - Added in-memory runtime snapshot cache layer + longer SWR window to reduce navigation/remount rehydrate chatter.
- [x] Operations operator-trust + credibility follow-up (March 11):
  - Fixed left-rail visual overlap/cramped rendering and aligned nav naming to cluster-first workflow language.
  - Added explicit request/approval/execute sequence guidance in both Cluster Review Detail and Pending Approvals.
  - Added signal-honesty block in review detail (available vs inferred vs unavailable signals).
  - Hardened interaction filters to disable gracefully when unsupported by current sample metadata.
  - Expanded sender analytics (sample share, estimated scope relationship, pattern mix, signal counts, classification, protected hints).
  - Added first-pass command-center analytics charts in Overview and Review Detail (all estimate-aware).
- [x] Operations data-depth + signal-coverage hardening (March 11):
  - Expanded Gmail review/discovery metadata contract (thread/history/internal date + labels/category/inbox-state + unread/important/starred).
  - Added read-only review evidence fetch actions in `/api/integrations/gmail/inbox-analysis` for query/sender cluster review loading.
  - Increased bounded review sample depth to 60 and wired review page deep-evidence loading (default 30, optional 60).
  - Added explicit evidence-basis mode (executed review vs expanded preview vs fallback sample) and sample-vs-estimate scope framing.
  - Added stricter signal-availability coverage reporting and filter gating by actual metadata presence.
  - Added sender decision-support metrics (selected/excluded shares, sender domain, thread-hint counts, protected overlap).
  - Added approval-scope detail rendering in Pending Approvals (selected/excluded/reviewed counts, message-id scope, evidence basis, safety exclusions).
  - Added operator-question guidance + metadata scan-basis disclosure in Overview.

---

## 🧱 Known Issues / Risks
- Open approvals still navigates in the same tab (continuity preserved, but UX may still prefer new-tab behavior).
- Runtime suggestion status may require manual refresh to reconcile execution events.
- Playground workflow progress currently reflects current workflow-step progress, not total inbox cleanup progress.
- Pre-approval customization is currently V1 (sender/message exclusion only for archive subset); broader keep/archive partition tooling is deferred.
- Grouped pre-approval customization currently supports sender/pattern/message controls, but does not yet provide saved reusable batch policies.
- Gmail opened/replied engagement signals are still limited by available metadata in current integration mode; unread/starred/important/recency signals are used as the current trust basis.
- Interaction filters are intentionally conservative in sparse-signal clusters; disabled states can still occur frequently until richer Gmail engagement metadata is available.
- Runtime mailbox profile is estimate-based by design (Gmail query estimates + bounded sample), not exhaustive full-mailbox classification.
- Mailbox profile cache currently refreshes on demand/reactive triggers; no scheduled background refresh cadence yet.
- Operations approvals now support inline approve/reject/execute; legacy `/approvals` remains available as broader admin/global queue surface.
- Review Detail selection model still depends on single-page controls; dedicated multi-step wizard/state-machine extraction remains deferred.
- Cleanup strategy quality depends on profile coverage and remains estimate-based rather than full-mailbox deterministic classification.
- Gmail query estimate overlap can still occur in some inboxes; current handling is explicit uncertainty framing plus bounded review-first workflow.
- Cleanup-action promotion is intentionally profile-gated; operational throughput may feel slower until profile availability is stable for all sessions.
- Bounded evidence depth is improved (up to 60 in review fetches) but still intentionally not full-mailbox evidence; very large clusters remain estimate-first.
- Support center (support.curativemushrooms.com) often returns **HTTP 403** during crawl → expected unless we add auth/crawler headers.
- In dev, “run_now” fire-and-forget fetch may time out (HeadersTimeout / AbortError). Job can still be queued and run separately.
- Wildcard crawl patterns (/*) inherently require scanning to discover new pages → “delta” cannot magically detect changes without scanning.
- RAG progress tracking currently approximates progress via rag_documents count (not true total-discovered URL count for wildcards).
- Progress bar for wildcard crawls cannot be exact without a pre-discovery phase; current implementation shows processed count + status only.
- Prompt rewrite engine does not yet surface which retrieved RAG chunks influenced rewritten blocks (observability gap).
- Prompt rewrite engine currently relies on truncated RAG evidence pack (top-N chunks) to control token usage; full-document semantic influence is achieved via embeddings, not raw inclusion.

---

## 🗺️ Next Targets (After This Week)
- Dedicated RAG background worker (separate process / queue-driven, no manual trigger required)
- Background worker hardening (retry logic, rate limiting, domain-level error reporting)
- Agent org-tree visualization (roles / hierarchy)
- Better agent naming model (short role-like titles, editable)
- Automations framework MVP (run an agent workflow end-to-end)
- “Aha moment” avatar + face card (image + persona, later voice/video)
- Define and implement true Inbox Cleanup Progress metric (cleaned definition + denominator + session vs cumulative)
- Add configurable profiling window toggle (30/60 day) in Playground runtime controls once UX contract is finalized
- Add optional policy-based auto-refresh schedule for mailbox profile snapshots (without forcing rehydrate-time recomputation)
- Improve Gmail cluster estimate differentiation further (confidence/range modeling when resultSizeEstimate overlap persists)
- Add thread/message-list expansion path beyond 60 bounded review rows (progressive fetch/pagination with explicit cost controls)
- Add richer sender/domain rollups (domain-level risk buckets, sender-family grouping, and cross-cluster recurrence views)
- Add server-backed pagination/filtering for reviewed-result detail history once reviewed-result volume grows.
- Add a migration/cleanup path for legacy approvals without `session_id` so older pending items can be surfaced or archived with clear operator intent
- Add richer server-side approval summary payload with explicit rejected/executed approval ids (not counts only) for stronger deterministic client reconciliation.
- Implement deterministic sender-subset partitioning for query-cluster newsletter flows (keep/deprioritize at per-sender granularity instead of top-sender heuristic).
- Add server-side “queue_version” / monotonic revision for approvals so Playground can skip redundant rehydrate polling when no queue change occurred.
- Consider extracting Current-Step lifecycle rendering into a small dedicated presenter component once workflow semantics stabilize (keep architecture unchanged for now).

Project Manager Agent – v8 review complete • Inbox Assistant operational • TODO aligned for handoff continuity

---

## Gmail Operations follow-up after 3-step review milestone

Completed:

- [x] Simplify Gmail Operations review into a 3-step workflow:
  - Batch Overview
  - Sender Decisions
  - Message Verification + Approval
- [x] Set sender and message pagination defaults to `10`
- [x] Make both pagination control sets visibly consistent
- [x] Use hydrated snippets in the bottom Message Review list
- [x] Promote review analytics into a clearer top-of-page decision-support section
- [x] Add plain-English Gmail signal availability guidance
- [x] Validate visible review behavior against the live localhost browser session

Still next:

- [ ] Reduce remaining review density for very large cleanup groups without reintroducing a long mixed page
- [ ] Continue reducing deferred sender-detail latency
- [ ] Continue lowering visible-row snippet hydration latency while preserving reliable fallback behavior
- [ ] Improve screenshot capture/automation stability for Chrome validation in macOS multi-display setups

---

## Gmail Operations guided review follow-up - March 13, 2026

Completed:

- [x] Convert Gmail review into a real 3-step guided workflow:
  - Step 1: Batch Overview
  - Step 2: Sender Decisions
  - Step 3: Message Verification + Approval
- [x] Move future rule recommendation to Step 3 so it is based on actual operator choices
- [x] Add full readable message preview drawer for verification
- [x] Default both sender and message pagination to `10`
- [x] Add sender page-size options `10 / 25 / 50 / 100`
- [x] Add message page-size options `10 / 25 / 50 / 100`
- [x] Add sender sort options for practical cleanup review
- [x] Fix bottom Message Review to use hydrated snippets consistently
- [x] Add plain-English Gmail signal audit/explainer to the review page
- [x] Capture browser proof screenshots for all three steps plus preview/rule state

Still next:

- [ ] Continue improving chart density/readability so Step 1 feels more like a true cleanup dashboard
- [ ] Reduce remaining sender-detail enrichment lag on large sender pages
- [ ] Add even clearer batch-switching affordances for very large cleanup groups
- [ ] Tighten verification scoping so Step 3 makes archive scope feel even more obvious

---

## Gmail review trust + sender-context follow-up - March 13, 2026

Completed:

- [x] Unify Step 1 and Step 2 sender ranking on one canonical metric:
  - Batch message volume
- [x] Add explicit sender sort labels that describe the real metric in use
- [x] Add batch/historical scope clarification around sender counts
- [x] Expand sender preview from single-row feel to multiple bounded examples
  - 5 examples by default
  - up to 8 examples when expanded
- [x] Clarify recency-chart intent when the current batch is intentionally scoped to recent unread
- [x] Verify sender ranking alignment and multi-example sender preview in the live browser

Still next:

- [ ] Reduce cases where sender preview rows still fall back to “Preview text unavailable from Gmail for this message.”
- [ ] Continue reducing deferred sender-intelligence latency on expand-details
- [ ] Add clearer decision-language for archive-now vs keep-accessible vs always-important states without broad execution redesign

---

## Gmail Operations Scope Hierarchy - March 13, 2026

Completed:

- [x] Add a persistent scope chain across Intelligence, Cleanup Groups, and Batch Review
- [x] Explicitly label Mailbox Intelligence as the Cleanup Candidate Universe rather than the whole mailbox
- [x] Add a plain-English inbox-cleanup goal section at the top of Mailbox Intelligence
- [x] Bridge counts between:
  - whole mailbox
  - cleanup candidate universe
  - cleanup group
  - batch
  - sender
  - message
- [x] Make intelligence drill-downs clickable and stateful
- [x] Add pagination to the sender ranking table on Mailbox Intelligence
- [x] Show broader-scope sender counts in Step 2 Sender Decisions
- [x] Give Step 2 sender preview the same `Open preview` affordance as Step 3
- [x] Add sender-focused deep-link behavior so preview URLs land on Step 2
- [x] Validate all hierarchy changes in the live browser with screenshots

Still next:

- [ ] Add even richer drill-down navigation from intelligence charts directly into pre-filtered cleanup groups
- [ ] Reduce the remaining density in Step 2 without losing the new scope bridge

---

## Gmail Operations Architecture Correction - March 13, 2026

Completed:

- [x] Reframe `Operations Overview` into an operational shell instead of a competing analytics page
- [x] Keep `Mailbox Intelligence` as the primary analytics-first surface
- [x] Align naming across left rail, page headers, and workflow path
- [x] Replace the heavier Batch Review scope strip with a lighter compact workflow path
- [x] Keep one clear in-page staged control for Batch Review
- [x] Improve Step 2 sender-preview trust with clearer full-preview parity language
- [x] Add clearer active drill-down explanation and table-focus behavior on Mailbox Intelligence
- [x] Stabilize `cleanup_group_intelligence` cache reuse in the normal Overview -> Intelligence -> Groups -> Review route flow

Still next:

- [ ] Remove the remaining true cold first-build cost for a never-warmed cleanup-candidate universe
- [ ] Continue tightening Step 2 density without losing the staged guidance
- [ ] Add even clearer route-level explanation if the product fully collapses Overview into Intelligence in a future pass

---

## Build Stabilization Follow-Up - March 14, 2026

Completed:

- [x] Audit the reported Vercel runtime `module-not-found` failures.
- [x] Confirm the reported runtime modules exist locally at the exact imported paths and casing.
- [x] Confirm the reported failures are caused by missing tracked source files rather than bad imports.
- [x] Extend the audit to all `@/lib/runtime/*` imports and identify the additional locally present but untracked runtime modules.

Still next:

- [ ] Ensure the deploy branch includes every locally present runtime module referenced by source before the next Vercel build.
- [ ] Re-run `npm run build` from a clean stabilization branch or workspace that does not include unrelated in-progress product rebuild changes.
- [ ] Keep this thread scoped to build integrity only; do not continue sender-first product redesign work here.

---

## 🔁 PM v9 Handoff Preparation (NEW)

- [ ] Mailbox Intelligence considered "good enough" (clear story + usable visuals)
- [ ] Decision Management dashboard productized (not raw data dump)
- [ ] Sender Decisions UX stabilized (no refresh issues, clear states)
- [ ] Confirmation + execution flows verified end-to-end
- [ ] Archive execution + restore verified with real Gmail behavior
- [ ] Visual Intelligence spec applied consistently across all pages
- [ ] Codex UI guardrail enforced in prompts
- [ ] Process standardized via PMCodexUIReviewProtocol.md

Handoff Criteria:
- Dashboard communicates value without explanation
- UI decisions no longer require repeated rework
- System feels guided, not analytical

Next Phase (PM v9):
- Sender Decision System (PRIMARY BUILD)
- Management execution UX refinement
- Decision → Execution → Feedback loop stabilization
- Gamification + reward system integration
- AI learning layer (post-decision intelligence)
- Cross-page UX consistency pass
