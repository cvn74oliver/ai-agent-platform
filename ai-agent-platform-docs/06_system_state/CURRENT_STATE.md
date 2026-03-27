# CURRENT_STATE — AI Agent Platform

Last updated: 2026-03-27  
Project Manager: v10 (finalized — preparing transition to v11)

---

---

## 🚀 March 27 — Gmail Rebuild B Completed (Semantic Focus Performance)

- Rebuild B is now completed and published on:
  - `full-mailbox-20260327004328180`
- Accepted Gmail Phase 1 artifact baseline now moves forward to:
  - `full-mailbox-20260327004328180`
- Scope completed:
  - seed-row semantic membership persistence
  - `last_activity_at` seed-row persistence
  - full-build + incremental projector parity
  - focused semantic artifact page read path
  - safe fallback to `full_cluster_materialization` for unsupported or older artifacts
  - no UI, taxonomy, cleanup-group, or `semantic_rollup` redesign
- Migration status:
  - `20260327101500_gmail_sender_workspace_semantic_focus_seed_rows.sql` applied to hosted Supabase
- Rebuild B validation:
  - `protected-trusted-senders` remains `1838` senders
  - focused lanes now read from `focused_semantic_page`
  - focused counts remain correct:
    - `commerce_transactional / invoices_receipts = 167`
    - `commerce_transactional / commerce_shipping_updates = 206`
    - `account_notification / general_updates = 229`
    - `account_notification / remainder = 299`
  - cold focused loads now land around `2.3s–2.7s`
  - previous corrected fallback baseline for the same large protected focused path was ~`20s–26s`
  - focused stats and preview loads are now page-scoped:
    - `seed_row_count: 12`
    - `stats_count: 12`
    - `preview_row_count: 60`

---

## 🚀 March 27 — Gmail Rebuild A Completed (Structural Preview Seeding)

- Rebuild A is now completed and published on:
  - `full-mailbox-20260326221425010`
- Accepted Gmail Phase 1 artifact baseline now moves forward to:
  - `full-mailbox-20260326221425010`
- Scope completed:
  - bounded structural preview seeding for `no_inbox_rows` senders only
  - full-build + incremental projector parity
  - no schema, taxonomy, cleanup-group, or UI changes
- Validated sender outcomes:
  - `oliver@curativemushrooms.com` now has `preview_ready: true`, `preview_message_ids: 5`, `cleanup_group_message_count: 8003`
  - `support@curativemushrooms.com` now has `preview_ready: true`, `preview_message_ids: 5`, `cleanup_group_message_count: 4631`
  - `consumer@e.mail.realtor.com` remained healthy
  - `seaworld@m.seaworldparks.com` remained healthy
- Validated cluster outcomes:
  - `protected-trusted-senders`: `9/9` structural `no_inbox_rows` senders now preview-ready
  - `historical-out-of-inbox-senders`: `34/34` structural `no_inbox_rows` senders now preview-ready
- Count-truth remained correct:
  - structural `no_inbox_rows` senders keep rollup-backed message totals
  - bounded preview evidence does not collapse `cleanup_group_message_count`
- Rebuild B is now complete:
  - semantic-focus cold-load performance is artifact-backed and page-scoped on rebuilt artifacts

---

## 🚀 March 26 — Gmail Phase 1 Artifact Baseline Freeze

- Accepted Gmail Phase 1 artifact baseline was temporarily locked to:
  - `full-mailbox-20260325230627555`
- That March 26 freeze was superseded on March 27 by Rebuild A:
  - `full-mailbox-20260326221425010`
- The March 26 publication restore was the pre-Rebuild-A operating baseline.
- March 26 semantic-refinement variants were informative, but are not adopted as the Gmail Phase 1 freeze candidate.
  - rejected diagnostic variant: `full-mailbox-20260326012615971`
  - reason: reduced `offer_campaign` inflation, but regressed total marketing subtype coverage inside `subscription-senders`
- Operational rule:
  - March 26 UI work validated against `full-mailbox-20260325230627555` until Rebuild A landed
  - future Gmail artifact work must not treat `full-mailbox-20260326012615971` as the accepted baseline
  - before any future Gmail rebuild, the current resolver code must be reconciled with the accepted baseline decision

---

## 🚀 March 26 — Sender Overview UI (Phase 1B) Progress + Active Issues

**Status:** Sender Overview hierarchy and subtype interaction implemented; moving into runtime reliability fixes and UX polish.

### What is Working
- Semantic family → subtype hierarchy is live and expandable in Sender Overview.
- Denominator correctness implemented:
  - parent rows = % of full group
  - child rows = % of parent + % of group (secondary)
- Subtype → sender list linkage implemented:
  - clicking a subtype triggers a focused sender-workspace request
  - sender list updates based on semantic focus
- Backend empty-result bug fixed:
  - no more `safe_partial` empty results when subtype focus is active
- Baseline artifact (`full-mailbox-20260327004328180`) is actively driving UI truth

---

### ⚠️ Active Issues (UI / Runtime Layer)

1. **Subtype Count Mismatch (Expected, Not Fully Resolved)**
   - Top hierarchy uses persisted artifact counts
   - Bottom sender list uses runtime materialization
   - Counts may diverge (e.g., 303 vs 52)
   - Current UI surfaces this difference instead of hiding it

2. **Focused Load Performance (Resolved For Rebuilt Artifacts)**
   - Rebuild B now persists sender-level semantic membership on seed rows
   - Focused subtype queries now use `focused_semantic_page` on rebuilt artifacts
   - Cold load latency for the protected sample lanes now lands around ~2.3s–2.7s
   - Warm load performance remains good

3. **Decision Card Preview Reliability (Partially Resolved)**
   - Structural preview seeding for `no_inbox_rows` senders is now fixed in:
     - `full-mailbox-20260326221425010`
   - High-volume structural senders like `oliver@curativemushrooms.com` and `support@curativemushrooms.com` now have seeded preview evidence
   - Any remaining Decision Card preview issues are now runtime/rendering-quality issues, not missing artifact evidence for this sender class

4. **Sender Workspace Truth Split (Architectural)**
   - Artifact layer = frozen group-level truth
   - Runtime layer = reconstructed sender-level truth
   - UI layer merges both and exposes divergence

---

### 🎯 Immediate Next Steps (Phase 1B Continuation)

1. **Decision Card Preview Follow-up (Narrow)**
   - Browser-verify rebuilt structural preview evidence in Decision Mode
   - Keep any remaining work bounded to runtime rendering / evidence exploration, not artifact seeding

2. **Sender Overview Row-Level UX Polish**
   - Improve readability of sender rows
   - Ensure semantic hierarchy and sender cards feel connected

3. **Subtype Focus Usability Improvements**
   - Maintain current focus behavior
   - Improve clarity of active focus state

4. **Defer Further Performance Optimization**
   - Do NOT widen beyond the new focused semantic page path yet
   - Revisit only if another focused request shape still falls back materially

---

### 🧭 Strategic Note

Sender Overview has now crossed from:
- data visualization

into:
- operational decision surface

Remaining work is focused on:
- reliability (preview evidence)
- usability (sender interaction)
- clarity (UI polish)

Not on further artifact expansion.

---
## 🚀 March 24 — Gmail Workspace Final Architecture Lock

- Gmail Workspace data access is now locked as the platform’s canonical engine pattern.
- Permanent rules now documented in [gmail_workspace_canonical_engine_pattern.md](/Users/olivercarlin/Documents/ai-agent-platform/ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_workspace_canonical_engine_pattern.md):
  - request-time flows read published artifacts only
  - no request-time mailbox scans or request-time repair scans
  - sync completion drives async artifact refresh
  - incremental refresh is preferred when eligible
  - full rebuild is fallback-only and must preserve parity
  - browser/runtime surfaces reconcile to artifact-backed truth
- Final proof anchors:
  - proven incremental baseline: `incremental-20260324032902895`
  - published full-build artifact: `full-mailbox-20260324073149125`
  - direct parity proof: `cluster_diff_count: 0`, `sender_diff_count: 0`
  - unchanged acceptance harness: `ok: true`
- Gmail Workspace is now the reference implementation future workspaces must reuse via:
  - ingest
  - derive
  - persist
  - publish
  - serve

## 🚀 March 25 — Cleanup Groups Stable, Semantic Layer Mid-Transition

- Cleanup-group coverage is now complete:
  - live model uses 8 cleanup groups
  - sender assignment coverage is 100%
- Grouping is considered stable at the artifact-backed architecture layer:
  - no request-time rebuild path was reintroduced
  - current review/intelligence surfaces still reconcile to published artifact-backed truth plus compatibility enrichment
- Sender semantic architecture is now upgraded at the type and rollup layers:
  - sender-level semantic meaning now uses `semantic_family` and `semantic_pattern`
  - uncertainty is layered separately through `resolution`, `confidence`, and `provenance`
  - umbrella/decomposition metadata now exists so broad categories can be split later instead of becoming permanent dumping grounds
- Cluster/overview analytics now read from semantic rollups instead of legacy fallback-heavy family/pattern sources.
- Current system stance:
  - architecture = stable
  - cleanup-group coverage = stable
  - 8-group grouping model = stable for now
  - semantic presentation layer = not fully stable yet
- Rebuild policy has changed:
  - do not trigger repeated rebuilds while taxonomy and cleanup-group semantics are still being refined
  - lock the plan first, then perform one final rebuild later

## 🚀 March 24 — Sender Surface Unification (Phase L)

- Sender Overview and Decision Mode are now defined as TWO MODES of a single sender card system:
  - Overview Mode = exploration (many senders, scrollable)
  - Decision Mode = execution (one sender, focused)
- Decision Mode is entered in-place (overlay/focus), not via navigation to a separate screen.
- Context is preserved across transitions:
  - same cleanup group
  - same scroll position on exit
- Entry paths:
  - Guided: "Start Guided Review" begins sequential decisions
  - Direct: clicking a sender opens Decision Mode for that sender
- Single card system:
  - same data, layout, and truth layers in both modes
  - Decision Mode adds actions, progress, and auto-advance only
- Protected/Trusted senders are now modeled as a first-class cleanup group (no separate explanation page required).
- UX rule locked:
  - "If a sender is in focus, a decision must be available."

Strategic state update:
- Platform has transitioned from **data stabilization → unified product surface design**.
- Next focus: implement unified sender card + overlay Decision Mode across Sender Overview.

## 🚀 March 19 — Gmail Backfill + System Stabilization Milestone

- Full mailbox ingestion pipeline is now operational and validated at scale:
  - Indexed dataset exceeded 200,000+ messages successfully
  - Multi-slice backfill continuation confirmed working across sessions
  - Resume checkpoint system verified (no longer restarting from page 1)

- Smart Sync is now fully separated from historical backfill:
  - Runs strictly incremental
  - No longer hijacks or resumes full-history traversal
  - Confirmed via live runs (`incremental / incremental` mode only)

- Operator Backfill system is now correct and stable:
  - Dedicated checkpoint system implemented (`backfill_resume_*`)
  - Checkpoints persist across interruptions, limits, and restarts
  - Resume now continues above previous page index instead of restarting
  - 100k slice limit bug fixed (per-run counter reset properly)

- UI + runtime stability improvements:
  - Button lock issues resolved (stale reconnect + local state bugs fixed)
  - Runtime no longer auto-triggers competing jobs (no more preemption)
  - Mailbox index state now accurately reflects backend truth

- Supabase schema fully aligned:
  - All mailbox index and backfill checkpoint migrations applied
  - Missing column issues resolved (no more GET 500 failures)
  - Remote schema verified against local expectations

- System now supports bounded historical ingestion:
  - Default backfill target: 24 months
  - Optional extension: 36 months
  - Stop condition uses Gmail `internalDate` (post-commit boundary rule)
  - Prevents unnecessary deep historical ingestion

- Strategic state:
  - Gmail ingestion system is now considered **stable and production-ready (Phase 1 complete)**
  - Platform is transitioning from **infrastructure stabilization → product experience build phase**

## 🔥 System Stability

- Supabase resource usage is now stabilized under normal browsing.
- Passive runtime no longer triggers heavy mailbox work on page load.
- Normal page navigation no longer launches:
  - cleanup discovery rebuilds
  - mailbox-index sync
  - inbox-analysis 100k-row fallback scans
- CPU spike behavior observed during the March runtime incident is now contained for ordinary browsing paths.
- Cleanup Groups and Decision Mode route reliability are restored under the current containment model.
- Sender Overview and Mailbox Intelligence now recover on first open without reintroducing unsafe passive initial-paint heavy requests.
- Sender Overview → Decision Mode now uses a unified interaction model (no context switching).

## ⚙️ Runtime Behavior

- Passive browsing now behaves as cache/runtime only:
  - cached runtime snapshot first
  - no passive heavy refresh escalation
  - no passive mailbox-index POST triggers
- Manual regeneration is now controlled and optimized:
  - explicit user action required
  - no inline mailbox sync
  - no inline sender-stats recompute
  - bounded discovery-row reuse on repeated runs
- Heavy actions are now:
  - guarded by single-flight protection
  - rate-limited by cooldowns
  - observable through structured logs
- Cold first-open on Review and Intelligence now resolves through safe deferred recovery when no usable runtime/cached seed exists:
  - runtime snapshot if available
  - cached snapshot if available
  - safe fallback content otherwise
  - deferred post-mount fetch only when needed
- Warm loads are fast again once runtime/cached state is present.
- Decision Mode entry no longer requires navigation; it is triggered from Sender Overview via overlay/focus transition.

## 🛠️ First-Open Recovery Status

- Regression root cause:
  - initial-paint containment was correct, but some operations pages lost a deterministic recovery path after blocked live first-open requests were removed
  - the affected pages were depending too heavily on runtime/cached seeds already being present
- Exact files changed for the recovery fix:
  - `web/src/lib/runtime/gmailCleanupWorkspace.ts`
  - `web/src/lib/runtime/operationsWorkspace.ts`
  - `web/src/app/agents/[id]/operations/clusters/page.tsx`
  - `web/src/app/agents/[id]/operations/review/page.tsx`
  - `web/src/app/agents/[id]/operations/intelligence/page.tsx`
- Behavior before:
  - Cleanup Groups could render blank
  - Decision Mode could require repeated clicking
  - Sender Overview could stall in warming state
  - Mailbox Intelligence could hang on first open
- Behavior after:
  - Cleanup Groups opens from safe runtime/cached state
  - Decision Mode opens on first click
  - Sender Overview first-open no longer stalls indefinitely
  - Mailbox Intelligence first-open no longer hangs
- Safety constraint preserved:
  - no unsafe passive initial-paint heavy path was reintroduced

## 🚧 Known Limitations

- Manual cleanup regeneration still costs roughly `~4s` on a cache-hit run, which is now acceptable but not free.
- Passive cached rehydrate is improved, but snapshot lookup/load is still the main remaining passive cost (`~2–3s` inside the request).
- Cross-tab duplicate requests are still possible because client-side TTL/single-flight protection is strongest within a tab/session rather than across every open browser process.
- Cold first-open on Sender Overview and some Mailbox Intelligence seed-miss cases is still noticeably slower than warm navigation because recovery now happens through deferred safe fetches.
- Sender Overview semantic visualization is currently the least stable layer:
  - semantic rollups underneath are improved
  - but the current semantic row presentation still has a trust regression around denominator/bar/label interpretation
  - treat the visualization layer as unstable until the semantic presentation pass is complete

## ✅ Golden Path Status

- Mailbox Intelligence now loads safely on normal navigation.
- Sender Overview now loads safely on normal navigation.
- Cleanup Groups now opens safely again on first navigation.
- Decision Mode now opens on first click again.
- No runaway Supabase / DB load is expected during ordinary browsing.
- Manual heavy operations remain available, but now require explicit action and stay inside guarded execution paths.
- Current strategic focus should stay on Sender Overview semantic truth, visualization honesty, and cleanup-group refinement, not more loading-behavior rewrites.

---

# 🟢 System Health

Build: Local development stable; Gmail ingestion, Smart Sync, and operator_backfill systems verified end-to-end. Production build still not fully validated due to Next 16 / Turbopack instability.
Golden Path: Passing  
Typecheck: Clean for current Gmail Phase 1 pass (`npx tsc --noEmit` passed)  
Golden Path Health Check:
- Automated validation script implemented (`web/scripts/golden-path.mjs`)
- Run from `/web` directory using:
  AGENT_ID="your-agent-id" npm run golden-path
- Script verifies the full operational pipeline:
    1. Training orchestrator responds
    2. Feedback logging works
    3. Recalculate quality (dry-run) succeeds
    4. Fine‑tune preview endpoint responds
    5. Playground query executes
    6. Usage logging endpoint records activity
- PASS indicates the platform core loop is operational.
- FAIL indicates infrastructure break (API route, env config, or server not running).

Agents: Healthy  
Documentation: Synced  

- March 17 Mailbox Intelligence dashboard alignment summary:
  - Mailbox Intelligence is now converging toward the "AI Intelligent Decision Dashboard" model:
    - command-first layout
    - sender-decision goal explicitly defined (clean inbox = all senders decided)
    - visual intelligence prioritized over raw metrics
  - Visual intelligence layer improvements (UI-only passes):
    - health rail + scale metrics integrated into a single hero layer
    - pressure trend upgraded to full-width bar-based visualization
    - hover behavior now reveals reasoning (driver, intervention, payoff) instead of repeating visible data
  - Remaining UI gaps identified and tracked for next phase:
    - metric bars lack clear denominators and semantic meaning
    - hover panels still under-informative (need multi-line actionable insight)
    - Mission Control lacks consistent CTA hierarchy (buttons for Do Next / Approval / Resume not standardized)
    - management-layer signals (archive, quarantine, rules) not yet surfaced in dashboard
    - double sidebar layout still impacting visual density
  - Strategic decision:
    - Mailbox Intelligence is considered "near-complete for Phase 1"
    - further refinement will be handled under a new Project Manager to avoid context degradation
  - Validation:
    - UI rendering stable
    - TypeScript + ESLint passing
    - cold/warm load acceptable after prior performance passes

---

Gmail Operations (latest pass):
- March 16 Archive execution verification + restore summary:
  - Archive execution is no longer limited to truth-safe `deferred` after a Gmail mutation request.
  - The archive path now:
    - commits destination state first
    - attempts Gmail inbox-label removal
    - verifies targeted Gmail messages directly
    - only marks archive `succeeded` when inbox removal is actually confirmed
  - Archive sender profiles now retain the targeted archive message ids needed for reversal.
  - `/operations/management` now supports a real archive restore path:
    - restore re-adds `INBOX` to the stored archive scope
    - restore is verified before archive state is cleared
    - if restore cannot be confirmed, the destination state stays active with truthful warning state
  - Non-archive destinations remain intentionally non-executing in Phase 1:
    - `KEEP` = `not_applicable`
    - `QUARANTINE` = `deferred`
    - `UNSUBSCRIBE` = `deferred`
    - `CUSTOM_RULE` = `deferred`
  - Validation:
    - targeted archive execution ESLint passed
    - `npx tsc --noEmit` passed
    - production build was intentionally not rerun in this pass

- March 16 Decision Destinations execution-truth summary:
  - Destination state and execution state are now modeled separately in Gmail sender destination profiles.
  - Sender destination profiles now store:
    - destination state
    - execution state
    - execution timestamp/source
    - execution warning
    - last action timestamp
  - Archive is now truth-first:
    - destination state still commits immediately on Confirmation approve
    - archive failures set execution state to `failed`
    - archive requests that were accepted by Gmail but not independently verified are marked `deferred`
    - archive is no longer reported as executed just because the mutation request returned successfully
  - Decision Management now shows execution truth directly:
    - destination state
    - execution state
    - last action timestamp
    - warnings needing follow-up
    - scaffold-level destination removal control
  - Left navigation now reflects the destination model more clearly:
    - `Management` is part of the primary Gmail cleanup workflow
    - `Pending Approvals`, `Executed Actions`, and `History` remain route-safe but are explicitly demoted to legacy/audit surfaces
  - Validation:
    - targeted destination/execution ESLint passed
    - `npx tsc --noEmit` passed
    - production build was intentionally not rerun in this pass

- March 16 Decision Destinations foundation summary:
  - Confirmation approval no longer creates a new Pending Approval request for Gmail cleanup decisions.
  - Approved senders now move directly into durable destination states:
    - `KEEP`
    - `ARCHIVE`
    - `QUARANTINE`
    - `UNSUBSCRIBE`
    - `CUSTOM_RULE`
  - Gmail cleanup memory now persists sender destination state in two layers:
    - sender-level history events in `agent_events`
    - current sender profile documents in `rag_documents`
  - Archive decisions now attempt direct Gmail archive execution immediately after destination-state commit:
    - no new Pending Approval request is created for the archive path
    - non-archive destinations remain durable post-confirmation states only in this pass
  - Sender profile scaffolding now stores:
    - sender identity
    - trust signals snapshot
    - current destination state
    - destination history
    - last action timestamp
  - A new route-safe Decision Management scaffold is available at `/operations/management`:
    - destination summaries
    - sender state overview
    - recent decision activity
    - deferred AI rule recommendation placeholder
  - The active Phase 1 workflow remains unchanged before approval:
    - Mailbox Intelligence
    - Cleanup Groups
    - Sender Decisions
    - Confirmation
  - Validation:
    - targeted destination-layer ESLint passed
    - `npx tsc --noEmit` passed
    - production build was intentionally not rerun in this pass

- March 15 Mailbox Intelligence cold-load performance summary:
  - Cold Mailbox Intelligence no longer depends on strictly sequential indexed-row paging.
  - The indexed `gmail_messages` loader now:
    - reuses in-flight row loads
    - loads pages concurrently on the cold path
    - emits explicit indexed-row load timing logs for future measurement
  - Mailbox Intelligence server caches are now keyed to the actual indexed mailbox snapshot rather than cleanup-plan timestamp churn:
    - raw mailbox context now reuses cache when indexed totals/date span are unchanged
    - derived workspace cache now reuses that mailbox snapshot plus cluster signature
  - Mailbox Intelligence client boot is more resilient:
    - latest stable Intelligence cache can render first if the exact cleanup-snapshot cache misses
    - `/operations/intelligence` now shows a runtime-backed mission boot panel instead of a blank full-page stall while detailed intelligence finishes loading
  - Validation:
    - targeted Gmail performance ESLint passed
    - `npx tsc --noEmit` passed
    - production build was intentionally not rerun in this pass

- March 15 Mailbox Intelligence simplification summary:
  - Mailbox Intelligence now reads as one coherent high-level control surface instead of a mission header stacked on top of an older analytics dashboard.
  - The top mission-control section remains intact:
    - sender-first inbox briefing
    - current status
    - next recommended action
    - top risk
    - inbox health
    - progress
    - approval queue
    - resume work
  - The lower half is now much simpler:
    - one `Inbox Health Outlook` block explains why health is in its current state, what matters most, what improves it fastest, and how pressure is moving
    - one compact pressure-trend visual remains as the supporting mission visual
    - Cleanup Groups is reduced to a minimal handoff preview with one recommended group, one optional alternate, and a CTA
  - Low-value technical hierarchy UI was removed from Mailbox Intelligence:
    - the scope ladder no longer renders on this page
    - the older telemetry-heavy metric/status blocks are gone from this surface
  - Validation:
    - targeted Mailbox Intelligence ESLint passed
    - `npx tsc --noEmit` passed
    - production build was intentionally not rerun in this pass

- March 15 Mailbox Intelligence mission-control summary:
  - Mailbox Intelligence is now more explicitly the high-level mission / status surface for Phase 1:
    - current status
    - inbox health
    - progress
    - next recommended action
    - top risk
    - started work / resume work
    - approval queue
  - Sender-first framing is stronger:
    - sender counts lead the page
    - whole-mailbox senders and inbox rows remain as supporting context only
    - raw message totals no longer dominate the first-view hierarchy
  - Cleanup Groups duplication is reduced again:
    - Intelligence now previews only the single top recommended sender group
    - the page more clearly positions Cleanup Groups as the full cluster-selection surface
  - High-level visuals remain, but are framed as inbox-health drivers instead of deeper sender-review analytics.
  - Validation:
    - targeted Mailbox Intelligence ESLint passed
    - `npx tsc --noEmit` passed
    - production build was intentionally not rerun in this pass

- March 15 Phase 1 UX structure polish summary:
  - Mailbox Intelligence is now more intentionally the high-level mission dashboard:
    - sender-first summary cards lead the page
    - high-level sender volume/timeline context remains
    - low-value `loaded_preview_rows` emphasis is removed from this stage
    - Cleanup Groups is previewed lightly instead of duplicated heavily
  - Cleanup Groups is now more clearly the full sender-group selection surface:
    - Intelligence previews only the top two groups plus a direct CTA into Cleanup Groups
    - cluster cards now expose lightweight expandable sender context and review cautions
  - Sender Decisions is now more clearly the drill-down workspace:
    - cluster-specific hero + briefing
    - saved-decision progress summary
    - quick sender-centric filter chips
    - clearer sender-profile badges and explanation copy
  - Confirmation wording is more operator-facing:
    - `Archive now after approval`
    - keep / quarantine / unsubscribe / custom rule framed as saved Phase 1 preferences for later
    - stored-later copy now says Gmail does not change yet for those actions
  - Navigation wording now reinforces the same hierarchy:
    - Mailbox Intelligence = mission / status / high-level summary
    - Cleanup Groups = full sender-group selection surface
    - Sender Decisions = sender analytics and evidence drill-down
    - Confirmation = archive-now plus saved-later review
  - Validation:
    - targeted Gmail ESLint passed
    - `npx tsc --noEmit` passed
    - full-repo `npm run lint` still fails on unrelated legacy lint debt outside the Gmail workspace
    - production build was intentionally not rerun in this pass

- March 15 Phase 1 runtime stabilization summary:
  - Interactive Phase 1 routes now serve the latest stable cached runtime snapshot immediately instead of auto-refreshing just because the local snapshot aged past a short TTL.
  - Cached runtime refresh is now materially driven:
    - no cached runtime snapshot
    - zero-cluster cleanup plan with indexed mail available
    - or true indexed snapshot advancement
  - “Indexed snapshot advancement” is now based on actual indexed mailbox changes:
    - indexed total rows
    - indexed inbox rows
    - indexed date-span start/end
    not raw sync timestamp movement alone.
  - Cleanup discovery refresh on the server now follows the same stricter rule, which reduces surprise recomputation during normal navigation.
  - Sender Decisions direct entry is more stable:
    - the route now waits for deterministic recommended-cluster resolution instead of beginning sender-workspace fetches for a fallback cluster first
    - this reduces cold-load churn and helps avoid the earlier hanging loading state
  - Net effect:
    - Mailbox Intelligence, Cleanup Groups, and Sender Decisions are more likely to stay on a stable UI-safe snapshot while background refresh work remains separate
  - Validation:
    - targeted Gmail/runtime ESLint passed
    - `npx tsc --noEmit` passed
    - full-repo `npm run lint` still fails on unrelated legacy lint debt outside the Gmail workspace
    - production build was intentionally not rerun in this pass

- March 15 Phase 1 UX validation fix summary:
  - Sender Decisions direct-entry reliability is improved:
    - `/operations/review?stage=senders` now auto-selects a recommended cleanup group when `cluster_id` is missing or stale
    - recommendation prefers the most recently active draft-backed cluster for the current snapshot, otherwise falls back to the first sender cluster
    - the page now shows a loading handoff instead of an empty “no cleanup group selected” state
  - Phase 1 draft persistence restore now behaves correctly:
    - selected cleanup-group drafts hydrate before write-back is allowed
    - this fixes the empty-draft overwrite race that could erase sender decisions on return
    - local Phase 1 decisions now restore more reliably across navigation, reload, and pagination changes
  - Sender Decisions search now keeps focus while remaining debounced.
  - Sender Decisions analytics now own sender-specific operational charts:
    - sender category distribution
    - sender activity timeline
    - cluster contribution
    - chart actions now drive the visible sender list directly
  - Mailbox Intelligence is now high-level only:
    - sender-specific analytics moved out
    - cleanup groups are previewed there, but the full selection surface remains on the Cleanup Groups page
  - Sender workspace performance is further reduced on cold review loads:
    - `sender_page` signal loading now avoids the broad indexed `gmail_messages` scan and uses `gmail_sender_stats` as the fast path
    - sender search can now match category/pattern/verification text without widening the server query scope
  - Navigation-triggered discovery rebuilds are tighter:
    - stale snapshot TTL alone no longer forces cleanup-discovery refresh during normal rehydrate flows
    - runtime refresh now keys off actual indexed snapshot differences, not just sync timestamp movement
  - Confirmation now allows Phase 1-safe editing:
    - change decision type
    - clear a decision
    - jump back into Sender Decisions for that sender
    - archive still remains the only live Gmail executor
  - Validation:
    - targeted Gmail/runtime ESLint passed
    - `npx tsc --noEmit` passed
    - full-repo `npm run lint` still fails on unrelated legacy lint debt outside the Gmail workspace
    - production build was not relied on in this pass because the separate Next 16 / Turbopack build hang remains unresolved

- March 15 Phase 1 follow-up summary:
  - Gmail cleanup cache invalidation for the active Phase 1 routes is now tied to the cleanup snapshot (`runtime_cleanup_plan.generated_at`) instead of broader mailbox-profile freshness.
  - Mailbox Intelligence and Cleanup Groups now prefer exact cached intelligence payloads synchronously before firing new requests.
  - Client Gmail cleanup API caching is now stronger:
    - 10-minute TTL
    - memory cache
    - sessionStorage mirror for same-session warm returns
  - Server Gmail cleanup runtime now has a dedicated mailbox-context cache:
    - indexed mailbox coverage + scoped indexed rows are reused independently of cleanup-cluster derivation
    - derived-workspace cache keys are order-stable across cluster arrays
  - Sender Decisions now has a dedicated cached sender-workspace base state:
    - selected-cluster sender derivation and sender-index signal loading run once per cleanup snapshot + cluster
    - search / filter / sort / pagination now operate on cached derived sender state instead of rebuilding the full sender base
  - Sender Decisions interaction behavior is improved:
    - sender search is debounced
    - sender-workspace requests now support abort / last-request-wins behavior
    - same-cluster interactions keep stale-ready sender data on screen while the next filtered slice loads
  - Phase 1 draft persistence is more durable:
    - drafts now store snapshot version metadata
    - session-scoped draft keys remain primary
    - cluster-level fallback draft keys restore decisions when the operator returns through a slightly different session path
  - Confirmation wording is clearer:
    - archive executes only after approval
    - keep / quarantine / unsubscribe / custom rule are stored-later Phase 1 decisions
    - undecided senders remain untouched
  - Validation:
    - targeted Gmail-surface ESLint passed
    - `npx tsc --noEmit` passed
    - `npm run build` hung again during Next 16 / Turbopack compile and was terminated after diagnostics

- March 15 Phase 1 sender-first foundation stabilization summary:
  - Gmail cleanup is now enforced as sender-first at the cluster-generation layer, not just in UI copy.
  - Cleanup groups now assign each sender to one deterministic sender cluster.
  - Shared cached derived workspace state now powers:
    - `mailbox_intelligence`
    - `sender_workspace`
    - `confirmation_preview`
  - Mailbox Intelligence and Cleanup Groups now reuse the same cached intelligence payload client-side.
  - Sender Decisions now has working server-backed:
    - search
    - filter
    - sort
    - direction
    - filtered pagination metadata
  - Sender evidence is now loaded only for visible sender rows, reducing unnecessary payload on large groups.
  - `/operations/review` now treats only these as active Phase 1 stages:
    - `senders`
    - `confirmation`
  - Direct visits to:
    - `stage=exceptions`
    - `stage=rules`
    - `stage=monitoring`
    now render route-safe Phase 2+ placeholders instead of pretending those later-phase systems are complete.
  - Mailbox Intelligence visuals are restored as lightweight cached analytics:
    - top cleanup senders
    - sender volume distribution
    - category breakdown
    - activity timeline
    - cleanup-group contribution cards
    - searchable/sortable sender ranking table
  - Runtime cleanup snapshot version was bumped so old message-first cleanup snapshots are invalidated.
  - Validation:
    - targeted Gmail-surface ESLint passed
    - full-repo `npx tsc --noEmit` passed
    - full-repo `npm run lint` still fails on unrelated legacy files outside Gmail operations scope
    - `npm run build` was started but did not complete within the observed terminal window, so clean build status is not yet claimed

- March 14 architecture correction summary:
  - Gmail cleanup is now implemented as one sender-first guided product.
  - Primary flow now reads:
    - `Intro & Health`
    - `Mailbox Intelligence`
    - `Cleanup Groups`
    - `Sender Decisions`
    - `Exceptions / Verification`
    - `Confirmation`
    - `Rules / Automation`
    - `Monitoring`
  - `Mailbox Intelligence` is now the true Gmail cleanup dashboard:
    - whole mailbox context
    - cleanup-candidate context
    - protected/safe context
    - cleanup-group contribution cards
    - sender ranking table
  - `/operations/review` is now a staged sender-first workspace:
    - `stage=senders`
    - `stage=exceptions`
    - `stage=confirmation`
    - `stage=rules`
    - `stage=monitoring`
  - Exact current-message impact is now shown in Confirmation, not in sender-review cards.
  - Archive is the only live Gmail mutation in this pass.
  - `Keep`, `Quarantine`, `Unsubscribe`, and `Custom Rule` are learned policies / future automation intents only.
  - Gmail cleanup memory is now explicitly wired:
    - sender policies stored in `agent_events`
    - rule intents stored in `agent_events`
    - active memory mirrored into `rag_documents`
    - Monitoring now reads event memory + semantic Gmail memory to generate recommendations
  - Validation:
    - targeted lint passed for rebuild files
    - full-project `tsc --noEmit` still fails only on unrelated pre-existing files (`fine-tune`, `summary`, `api/rag/run`)

- Gmail Operations naming is now congruent across navigation and page structure:
  - Operations Overview
  - Mailbox Intelligence
  - Cleanup Groups
  - Batch Review
  - Pending Approvals
  - Executed Actions
  - History
- Operations Overview now clearly reads as the operational shell only:
  - health/status
  - indexed mailbox state
  - pending approvals
  - next-step guidance
  - detailed analytics explicitly live in Mailbox Intelligence
- Mailbox Intelligence now clearly reads as the analytics-first layer:
  - it explains the cleanup goal in operator language
  - it explicitly represents the Cleanup Candidate Universe rather than the whole mailbox
  - it bridges into Cleanup Groups and then Batch Review
- Cleanup Groups now clearly reads as the post-intelligence selection step.
- Batch Review now presents a stronger guided flow inside the existing route:
  - Step 1: Batch Overview
  - Step 2: Sender Decisions
  - Step 3: Message Verification
  - Step 4: Approval / Rule Recommendation
- The top workflow strip now mirrors the product navigation labels instead of using a separate internal vocabulary.
- Step 2 sender preview guidance is clearer:
  - preview affordance is explicitly named
  - sender preview tells operators to use the same full preview path as Step 3 when snippet text is not enough
- Inbox Overview is now intentionally operational-first:
  - keeps refresh state, indexed mailbox health, pending approvals, and “what next” guidance
  - no longer acts like the primary analytics page
  - background-prewarms Mailbox Intelligence for the current cleanup-group universe
- Mailbox Intelligence is now explicitly the analytics-first cleanup layer:
  - it is labeled as the **Cleanup Candidate Universe**, not the whole mailbox
  - it explains the cleanup goal in plain English
  - it bridges Whole Mailbox -> Cleanup Candidate Universe -> Cleanup Groups -> Batch Review
- `cleanup_group_intelligence` now uses server-side cache + inflight reuse keyed by:
  - tenant
  - analysis scope
  - cleanup-group universe
  - runtime snapshot/cache version
- Cold-path diagnosis is now explicit:
  - the dominant first-load cost is `indexed_rows_load_ms` when the indexed cleanup-universe rows are first loaded into memory
  - aggregation/build work is comparatively small
- Latest captured evidence for `cleanup_group_intelligence`:
  - pre-patch cold loads: roughly `41.8s` to `42.7s` server-side
  - pre-patch warm loads: roughly `444ms` to `478ms` server-side
  - post-patch normal operator flow after Overview prewarm: roughly `418ms` to `539ms` server-side
  - post-patch first uncached background prewarm can still pay the heavy first indexed-row load (~`42s`) before subsequent requests are warm
- Review sender preview fallback copy is clearer:
  - if Gmail does not return preview text for a sender-row email, the UI now explicitly tells the operator to use full preview instead of implying broken/missing content
- New top-level `Mailbox Intelligence` step now sits between Inbox Overview and Cleanup Groups:
  - route: `/operations/intelligence`
  - purpose: show the full cleanup candidate universe before any bounded batch review starts
  - data source: indexed mailbox rows only (no snippet fetches, no mutation controls)
- Mailbox Intelligence now renders indexed cleanup-universe analytics:
  - top senders across all current cleanup groups
  - sender volume distribution
  - activity timeline
  - category breakdown
  - human vs automation ratio (inferred, explicitly labeled)
  - sender count ranking table
- Intelligence metrics are computed from the union of current cleanup groups across the selected analysis window, deduped by message id, so the page represents the full cleanup universe rather than a 1,000-row review batch.
- Workflow order is now explicitly:
  - Inbox Overview
  - Mailbox Intelligence
  - Cleanup Groups
  - Batch Review
- Live authenticated Chrome screenshot captured for the new intelligence page:
  - `/tmp/gmail-intelligence-auth-fullpage.png`
- Live review UI milestone now visibly landed in Chrome on localhost:
  - bottom Message Review now shows subject + snippet content for hydrated visible rows
  - top analytics are now more legible chart cards (ranked bars, donut charts, column chart)
  - sender/message pagination now use the same visible control pattern with clear range + page-size state
  - signal availability is now explained in plain English (`Gmail tells us directly` / `We infer carefully` / `Gmail does not provide here`)
- Browser-verified live review evidence captured from the active local Chrome tab:
  - `Senders per page` + `Showing senders 1-10 on page 1/5`
  - `Messages per page` + `Showing 1–50 of 1000 messages in this batch`
  - visible chart titles: `Top senders`, `Category distribution`, `Recency distribution`, `Unread / protected mix`
  - visible signal explanation and bottom message snippets copied from the rendered page
- Background regenerate now has stronger index-reuse behavior for cleanup discovery:
  - if the indexed mailbox already covers the selected analysis scope and recent index state is usable, background cleanup refresh can reuse current indexed coverage instead of paying for another heavy sync first
  - operator-triggered background refresh now blocks fallback full-rescan recovery during cleanup analysis recompute
- Cleanup discovery diagnostics now expose whether current indexed coverage was reused:
  - `index_sync_reused_existing_coverage`
- Live snippet hydration is more robust:
  - visible-row snippet requests now retry transient Gmail failures
  - token refresh is attempted on `401`
  - snippet failure logs now include failure buckets and failed id samples
- Sender-detail indexed-history loading is more targeted:
  - request mode now distinguishes single-sender detail vs visible sender-page history
  - indexed row scans are limited to recent 180-day evidence with tighter row caps for sender-detail opens
  - sender-index logs now include `query_mode`
- Latest captured local baseline log evidence before this pass showed:
  - `browse_query_cluster` warm server duration around `399–561ms`
  - `sender_index_signals` single-sender duration around `1364ms`
  - `load_message_snippets` `47` rows around `2310–2507ms`, including one `1/47` success run
  - `cleanup-regenerate-background` around `306744ms` dominated by `index_sync_ms`
- Review page now hydrates Gmail snippets only for visible rows:
  - sender-level “View this sender’s emails” rows
  - main message-review rows
- Snippet loading is deferred and scoped:
  - uses a dedicated inbox-analysis action for visible message ids only
  - avoids broad backend redesign or initial-paint bloat
  - missing snippet states are explicit (`Loading snippet…` / `Snippet unavailable`)
- Sender detail responsiveness improved:
  - expanding a sender card no longer waits on full indexed-history enrichment
  - deeper sender intelligence is loaded lazily per sender or for the current sender page
  - sender preview rows can open independently of indexed-history detail loads
- Review page now has a stronger analytics dashboard at the top using real current-batch data:
  - top senders
  - category distribution
  - unread/protection mix
  - recency distribution
  - sender mix when inferred sender-type evidence is available
  - archive impact summary
- Review UI now includes a compact operator-facing signal availability summary:
  - available vs inferred vs unavailable signals are explained in plain language
- Pagination ergonomics improved:
  - sender workbench now exposes sender page-size control + page indicator
  - message review page-size now supports `10 / 25 / 50 / 100 / 200`
  - sender and message pagination now behave more congruently
- Review logs now include:
  - snippet hydration source/timing
  - review chart data source
  - sender detail expand path attribution
- Review UI now presents the cleanup workflow as `Cleanup Group -> Batch -> Message Page` instead of exposing internal cluster/review-unit language.
- Review detail is now organized into a clearer operator sequence:
  - Analytics Dashboard
  - Batch Summary
  - Filters Panel
  - Sender Workbench
  - Message Review
  - Decision Builder / Approval Request Builder
- Batch summary now states the current working scope in plain language (batch number, batch size, cleanup-group size, current message page, remaining emails outside batch).
- Filters are now positioned directly above the sender workbench so their effect is easier to understand immediately.
- Review analytics are now promoted to the top of the page and include sender/category/attention/impact summaries for the selected batch.
- Operations shell regenerate messaging now uses operator-facing “refresh cleanup analysis in the background” language while keeping current cleanup groups visible.
- Regenerate now serves current snapshot immediately and runs cleanup recompute in background when a fresh snapshot exists, preventing long foreground lockups.
- Runtime/operations logs now include explicit snapshot regenerate lifecycle fields (`snapshot_version_before/after`, recompute timestamps, total background ms).
- Review inbox-analysis diagnostics now log action-level telemetry (`review_query_cluster`, `browse_query_cluster`, `sender_index_signals`) with scope, pagination, rows scanned, cache flags, and duration.
- `review_query_cluster` requests now reuse in-flight promises and short TTL cache entries for identical calls to reduce duplicate fetch churn during review transitions.
- Newsletter browse cold path now attempts a promotions-category narrowed fast path before broader fallback matching.
- Review page now uses explicit count hierarchy (cluster total vs review unit total vs page rows) with exact-in-scope wording.
- Review detail now exposes explicit bounded unit modes for large clusters (30d, 90d, older backlog, highest-volume senders, oldest unread, mixed remainder) with per-unit totals.
- Review analytics are promoted to a top strip; sender workbench and message pagination are clearer and less forensic.
- Message review list now uses normal pagination without inner-scroll trap.
- Interaction filters now surface availability/counts and disable unavailable options to avoid no-op controls.
- Review workflow is now bounded and operator-guided with sender pagination + sender filters + explicit message-page controls.
- Large-cluster review now generates semantic sub-buckets (recent/older promotions, social noise, commerce updates, recurring machine senders, one-off low-value senders, mixed remainder) so operators can process 40k+ clusters in bounded units.
- Sender type/protection filters are now fully wired and reflected in filtered sender counts/coverage feedback.
- Future-rule guidance is now inline at sender/decision points (duplicate recap block removed).
- Browser-loaded message cache is capped to keep long review sessions responsive.
- Regenerate clusters now runs as a background refresh path in Operations shell/overview/clusters, keeping current snapshot visible while refresh completes.
- Review browser fetch path now uses client-side in-flight dedupe + short-lived response caching keyed by cluster/unit/page/filter/sort/scope.
- Review transitions now suppress stale-first cluster flashes when requested cluster context has not yet hydrated into current snapshot.
- Query-cluster browser now uses fast-path indexed filtering for large cluster types (`unread_clutter`, `old_read_mail`, `age_cluster`, `sender_cluster`) plus in-flight/cache dedupe.
- Fast-path candidate narrowing now also covers newsletter/noreply/shopping/social cluster types to reduce expensive full-corpus browse paths.
- Browser diagnostics now expose cache/perf fields (`cache_hit`, `fast_path_applied`, `duration_ms`) for runtime verification.
- Incremental history-list failures now trigger automatic bounded recovery scans; cached indexed rows remain usable during degraded windows.
- Review-page inbox-analysis requests now carry explicit attribution fields (`request_source`, `request_component`, `request_reason`, `request_phase`) so PM can map slow calls to exact review surfaces from terminal logs.
- Initial review paint is slimmer: only the paginated cluster browser is required for first usable paint, while sender-intelligence enrichment is deferred until the operator expands sender details or explicitly requests it.
- Runtime cleanup discovery now exposes per-subphase timing (`index_state_load_ms`, `index_sync_ms`, `indexed_rows_load_ms`, `coverage_load_ms`, `discovery_build_ms`, `total_ms`) and runtime-state logs now include `cleanup_plan_detail_ms` for long regenerate diagnosis.
- Background regenerate can now skip a fresh mailbox index sync when recent usable indexed state already exists, reducing repeated full recompute work during force-background refreshes.

Execution Model:
- Hybrid (ChatGPT direct edits + Codex multi-file execution)
- Codex required only for multi-file, terminal, or schema-impacting tasks
- Single-file edits may be handled directly by Project Manager
- Domain isolation enforced (see Codex Execution Protocol)

Recalculate Quality:
- Fast path enabled (no rewrite if score ≥ TARGET_QUALITY_SCORE = 8)
- Rewrite gating verified (no unnecessary OpenAI refine calls)
- Force Full Rewrite available
- Dry Run supported (no persistence)
- Strict JSON schema enforced
- Circuit breaker active for OpenAI aborts
- Rewrite retry guarded against under-detailed outputs
- Canonical merge protection (no silent field shrink)

RAG Retrieval:
- Embedding + cosine similarity active
- URL boost logic (context-aware)
- Drive-first weighting for book-content queries
- Product-page penalty for non-shopping intent
- Canonical hierarchy enforced:
  Q&A training data > Drive knowledge > Crawled URLs
- Drive chunk retrieval validated against real PDF previews (875 embedded chunks confirmed active)

RAG Sync:
- Delta + Full modes implemented
- Wildcard detection supported
- Job-based ingestion (rag_jobs)
- Supabase polling status updates
- Manual worker trigger retained for dev

Drive ingestion verified:
- 875 embedded Drive chunks
- 541 embedded URL chunks
- Avg chunk size ≈ 1400–1500 chars
- Retrieval validation confirmed via Playground

Dashboard Metrics:
- Session logging (agent_sessions)
- Event logging (agent_events)
- Token usage tracking
- Approx cost + human-time proxy

---

# 🔧 Fully Operational Systems

## Agent Summary
- Recalculate Quality (fast)
- Force Full Rewrite
- Improve with Q&A
- Field-level Clarify threads (persistent)
- Fine-Tune Preview (grouped canonical topics)
- RAG Sync + Job status display
- Non-blocking sync (safe navigation)

## Playground
- RAG retrieval active
- Correct URL retrieval confirmed
- Strict URL safety (no fabrication)
- Usage metrics captured
- Runtime orchestration refactor complete:
  - `route.ts` is now a thinner controller/surface.
  - Runtime loading/discovery/assembly moved to runtime services/modules.
  - Prompt assembly and RAG retrieval stacks moved out of route.
  - OpenAI chat invocation + response/error handling moved out of route into a dedicated chat service.
  - Analytics/session logging moved out of route into a dedicated analytics service.
- Runtime latency hardening (March 9, 2026):
  - Live timing logs confirm `runtime_state_ms` as the dominant phase.
  - Runtime evidence/history loaders now run in parallel in `stateLoaders.ts` (`Promise.all`).
  - API contract and runtime behavior remain unchanged.
- Runtime continuity + performance hardening (March 9, 2026):
  - Session-aware Playground restore is stable across refresh and approvals return flow.
  - Initial mount flicker (dashboard → empty chat → dashboard) has been eliminated.
  - Runtime sub-phase timing is now logged via `[playground][runtime-state-timing]`.
  - Dominant `cleanup_plan_ms` path was optimized by parallel cleanup-cluster discovery sampling.
  - Live post-patch rehydrate timing is now roughly ~2–3 seconds (down from ~8–10 seconds).
- Runtime UI baseline finalized (March 9, 2026):
  - Action-first “Current step” control center anchors runtime decisions.
  - Runtime details/evidence are now organized as a lighter drawer with operator-first ordering.
  - Query cleanup clusters render as compact rows (top 3 by default) with nested query/safety/risk/sample details.
  - Conversation remains the secondary work area below runtime controls.
  - Approvals queue keeps actionable items emphasized and compresses approved/executed rows for scanability.
  - Workflow progress currently represents current workflow-step progress, not total inbox cleanup progress.
- Mailbox Intelligence / Profiling pass (March 9, 2026):
  - New additive `runtime_mailbox_profile` metadata is generated in runtime cleanup discovery.
  - Profiling uses Gmail-native query estimates over a 30-day recent window (60-day compatible shape).
  - Bounded metadata sampling adds sender-frequency and recurring-subject signals.
  - Profile now feeds protection candidates, cleanup candidates, and rule-opportunity recommendations.
  - Query cleanup cluster discovery now uses profiled sender recurrence instead of relying only on tiny inbox samples.
- Mailbox profiling freshness/caching stabilization (March 10, 2026):
  - Cleanup discovery/profile snapshots are cached via `agent_events` (`runtime_cleanup_discovery_snapshot`).
  - Routine rehydrate paths now reuse fresh cached profile snapshots instead of re-running Gmail discovery every time.
  - Default profile cache TTL is 30 minutes; stale fallback + cooldown guard reduce repeated expensive refresh attempts.
  - Explicit profile refresh is available from Playground runtime details.
  - Freshness is surfaced as `fresh` / `cached` / `stale` with last generated timestamp.
- Mailbox indexing data-layer hardening (March 11, 2026):
  - Added directional index-health fields in `gmail_mailbox_index_state`:
    - `mailbox_estimated_total` (Gmail `resultSizeEstimate` baseline)
    - `index_completion_pct` (bounded `0–100`, directional)
    - `last_index_duration_ms`
  - Added `gmail_sender_stats` for tenant-scoped sender intelligence:
    - `message_count`, `recent_count_30d`, `machine_probability`, `human_probability`, `last_seen`
  - Indexer now includes retry/backoff (+ jitter) for Gmail `429` and `5xx` responses.
  - Metadata fetch pipeline now uses simple adaptive concurrency (`20` default, degrades to `10` under retry/latency pressure).
  - Sender stats are recomputed from indexed `gmail_messages` after each successful sync (correctness-first, no complex delta math).
  - `GET /api/integrations/gmail/mailbox-index` now returns additive health/status fields:
    - `indexed_message_count`, `mailbox_estimated_total`, `index_completion_pct`,
      `last_full_scan_at`, `last_incremental_sync_at`, `last_sync_status`, `last_index_duration_ms`.
  - No UI changes in this pass.
- Operator cleanup strategy layer (March 10, 2026):
  - New additive `runtime_cleanup_strategy` is derived from `runtime_mailbox_profile`.
  - Strategy sections: Protect first, Best first cleanup waves, Rule opportunities, Avoid/review carefully.
  - Playground prompt now uses this strategy ordering for clearer, decisive inbox guidance.
  - Playground runtime details now surfaces a compact strategy card for one-glance operator planning.
- Trust + gating hardening (March 10, 2026):
  - Runtime dashboard now surfaces a compact trust snapshot (sample size, profile window, metadata scan basis, confidence).
  - Cleanup action suggestions are not promoted unless a 30-day mailbox profile is present.
  - With sample-only evidence, assistant guidance remains in analysis/review mode (no cleanup-approval push).
  - Agent-aware Playground examples now replace hardcoded domain-specific copy.
- Trust + UX clarity refinement (March 10, 2026):
  - Current Step and review cards now include explicit “What happens next” blocks.
  - Runtime CTA copy is action-specific: `Analyze inbox sample`, `Review sender sample`, `Preview matching emails`.
  - Review steps are explicitly labeled as read-only with no inbox mutation in the current step.
  - Evidence-basis labels now distinguish quick preview sample vs pattern scan basis/profile window/confidence.
  - Query-estimate overlap uncertainty is surfaced when Gmail estimate signals converge.
- Consistency hardening (March 10, 2026):
  - Playground and Approvals now share explicit queue scope semantics:
    - session-scoped queue when `session_id` exists
    - agent-scoped queue fallback when no active session is available
  - Approvals queue UI now displays explicit scope context.
  - Runtime approval queue summary now carries scope metadata and enforces strict session filtering in session mode.
  - Server-authored chat restore added for Playground sessions:
    - `playground.session_snapshot` events are written per session
    - rehydrate responses can return `session_messages` for authoritative session restore
  - `review_query_cluster` approvals are now executable from Approvals.
  - Sessionless dedupe now only reuses other sessionless requests, preventing cross-session dedupe drift.
- Reconciliation stabilization pass (March 10, 2026):
  - Playground now applies a canonical approval-id resolver before rendering candidate/cluster statuses.
  - Rejected approvals clear pending status across queue chips and cluster/candidate rendering once fresh summary lands.
  - Approval submit now updates pending queue state immediately (poll remains fallback verification).
  - Approvals table now updates queue counts and section placement immediately after approve/reject/execute.
  - Clear conversation retains explicit unresolved-approval visibility for the cleared session.
  - `rehydrate_only` path now prioritizes cached/stale cleanup profile snapshots and avoids refresh recomputation unless forced.
  - Follow-up: top Current-Step query-cluster submit now mutates the same immediate cluster-pending state path as manual cluster selection.
  - Follow-up: cleared-session carryover no longer contributes to queue bubble counts, preventing ghost pending after clear/reset.
  - Follow-up (March 11): query cleanup cluster pending header now reconciles with canonical queue pending for first-step sender-review submits.
  - Follow-up (March 11): return-from-approvals runtime refresh now suppresses stale local pending/approved queue state until authoritative summary rehydrates.
  - Follow-up (March 11): clear conversation no longer carries pending/approved count snapshots in cleared-session context (session-id only informational carryover).
  - Follow-up (March 11): clear conversation now behaves as chat-only reset; Runtime Operations Dashboard and approval/workflow state remain mounted and authoritative.
  - Follow-up (March 11): cleared-session message restore suppression prevents old chat transcript repaint while allowing runtime queue/evidence rehydrate.
  - Follow-up (March 11): approval decision summary card added in both Playground Current Step and Approvals cards with explicit action/scope/selection/safety/effect fields.
  - Follow-up (March 11): preview-to-batch relationship is now explicit (representative sample vs total selected/estimated scope), including scalable language for larger approval batches.
  - Follow-up (March 11): approval presentation upgraded to stronger decision-card hierarchy (Action, Scope, Source, Why selected, Risk, Reversible, Safety signals, Exclusions, What happens if approved).
  - Follow-up (March 11): representative examples now render as compact subject/sender/date rows (instead of prose-only summaries) in both Playground and Approvals.
  - Follow-up (March 11): shared `ApprovalDecisionCard` component now drives both Playground and Approvals surfaces for one consistent approval visual language.
  - Follow-up (March 11): hero-row emphasis + collapsible supporting details reduce “debug panel” density and improve large-batch scanability.
  - Final polish (March 11): affected-count/scope is now visually dominant in the hero area, including compact cards.
  - Final polish (March 11): representative examples now use a tighter table-like subject/sender/date scan layout with optional snippet only when present.
  - Workflow correction (March 11): executing a review step now surfaces a dedicated primary **Review Results** state before advancing to next-step approvals.
  - Workflow correction (March 11): current review evidence is isolated from historical evidence, with historical review/archive cards explicitly demoted and labeled.
  - Workflow correction (March 11): Review Results now includes operator summary + cluster makeup + recommended next action + future prevention guidance.
  - Trust correction (March 11): affected counts in approval cards now use structured summary fields with explicit estimate labeling where applicable.
  - Workflow architecture refinement (March 11): reviewed-batch deep context moved to a dedicated detail surface (`/agents/[id]/playground/review`) with prev/next navigation across reviewed results.
  - Workflow architecture refinement (March 11): Playground now keeps reviewed-result depth concise and action-oriented, with a direct CTA into full result detail instead of duplicating full evidence inline.
  - Workflow architecture refinement (March 11): result-scoped chatbot added on review-detail page so Q&A is anchored to one reviewed batch/cluster at a time.
  - Stale-state cleanup (March 11): current-step promotion now suppresses duplicate re-promotion of the currently reviewed sender/query cluster.
  - Follow-up separation (March 11): review-detail chatbot now runs in a distinct session origin namespace (`playground_review_detail`) so result-chat traffic cannot contaminate the main Playground workflow thread.
  - Follow-up lifecycle cleanup (March 11): stale sender/query recommendations are suppressed using reviewed-result history, not only current-item id matching.
  - Follow-up lifecycle cleanup (March 11): batch suggestions are now result-bound and only surfaced when matching the currently viewed reviewed sender-result context; stale cross-result suggestion residue is demoted.
  - Follow-up scope reduction (March 11): lower runtime-details historical evidence was compacted into timeline summaries so Playground remains workflow-first.
  - Final isolation hardening (March 11): added explicit `request_mode` support (`playground` vs `playground_review_detail`) so backend prompt/load behavior is mode-aware, not only session-origin aware.
  - Final isolation hardening (March 11): review-detail mode now uses a dedicated result-scoped system prompt path and no longer uses the full broad Playground workflow prompt guidance.
  - Final isolation hardening (March 11): review-detail mode skips full runtime-state assembly and loads only reviewed-result data needed for detail/rehydrate.
  - Runtime review trust hardening (March 11):
    - Current-step consequence copy now explicitly states approval-request creation vs inbox mutation timing.
    - Sender preference controls (`Keep Sender` / `Neutral` / `Deprioritize Sender`) are now available in review-result context.
    - Review-result summaries now include engagement signals (important/starred/reply-like/unread), evidence mode, confidence, and future-prevention context.
    - Archive approval summaries now include engagement-backed rationale/exclusions rather than pattern-only framing.
  - Runtime UX stabilization follow-up (March 11):
    - Current Step now explicitly separates lifecycle state, next action, and read-only evidence context.
    - Top-level duplicate latest-review cards were removed to reduce self-referential navigation and visual redundancy.
    - Runtime-details current-review duplication was reduced to a compact pointer toward the canonical review-detail page.
    - Main UI recommendation area now surfaces sender preference effect text (Keep/Neutral/Deprioritize) alongside recommendation output.
    - Main UI now surfaces explicit archive trust summary language (evidence mode, confidence, and protected/excluded signals).
  - Operator trust + explicit choice stabilization (March 11):
    - Current Step lifecycle derivation is now centralized via `playgroundWorkflowState.ts` and consumed by Playground UI blocks (lifecycle state, next action, read-only context).
    - Sender preference controls now use operator-facing wording:
      - Always keep newsletters from this sender
      - No preference
      - Lower priority (more likely archive candidate)
    - Added lightweight pre-approval customization for archive requests:
      - exclude senders and representative messages before submitting approval
      - selected/excluded counts shown before submit
      - approval payload carries subset metadata (`selection_customization`).
    - Added explicit trust caveat that opened/open-tracking status is unavailable in this Gmail metadata flow; engagement is inferred from unread/important/starred/reply-like signals.
    - Approval summaries now surface subset scope (selected vs candidates vs excluded) for archive requests.
  - Operator usability/scalability follow-up (March 11):
    - Added grouped archive customization for larger batches (pattern groups + sender groups + message-level controls).
    - Added a primary Decision Summary/Decision Diff panel in Playground archive flow (reviewed/selected/excluded + risk/confidence + included/excluded examples).
    - Sender preference was moved into a clearly separate **Future sender policy** area so it is not mistaken for the immediate archive decision.
    - `ApprovalDecisionCard` now explicitly displays **Total reviewed / Archive selected / Excluded-kept** scope totals.
  - Review-detail grounding follow-up (March 11):
    - Scoped chat contract now requires observed-vs-estimated framing and explicit out-of-scope handling before broader workflow advice.
    - Scoped prompts/context now explicitly include the opened-signal availability caveat to reduce overconfident engagement claims.
  - Runtime lifecycle scope hardening (March 11):
    - Session-scoped Playground runtime now filters review/archive evidence to scoped approval ids to reduce stale cross-session sender/query leakage.
    - Review-detail rehydrate path now applies the same session-scope evidence filtering when a workflow session id is present.
  - Operations Workspace architecture split (March 11):
    - Added dedicated operator workspace routes:
      - `/agents/[id]/operations` (Inbox Overview)
      - `/agents/[id]/operations/clusters` (Review Clusters)
      - `/agents/[id]/operations/review` (Review Result Detail)
      - `/agents/[id]/operations/approvals` (Pending Approvals scope view)
      - `/agents/[id]/operations/history` (Executed/Timeline history)
    - Added shared operations shell with left-rail workflow navigation and right-side contextual AI assistant panel.
    - Playground is now chat-first by default and acts as a handoff surface into Operations workspace.
    - Legacy dense runtime dashboard remains available only behind debug query (`show_legacy_runtime=1`) in non-production.
    - Review-detail workspace now includes explicit previous/next reviewed-result navigation for operator continuity.
    - Operations assistant request mode is now context-aware (`playground` vs `playground_review_detail`) for tighter result-page scoping.
  - Operations Workspace clarity + trust hardening (March 11):
    - Left-rail navigation refined into grouped product sections with clearer hierarchy and active-state clarity.
    - Review Detail now includes sender-level inline sample inspection (`View this sender’s emails`) with exclusion reasoning.
    - Exclusion logic is now explicit across message rows and sender samples:
      - excluded manually
      - excluded by sender setting
      - excluded by pattern setting
      - excluded by keep-sender policy
    - Selection hierarchy is now documented in-page (sender filters → pattern filters → message overrides → final decision summary).
    - Operations Approvals page now supports inline approve/reject/execute actions via runtime APIs (no longer a thin handoff-only wrapper).
    - Operations History page now shows richer audit context (action/target/origin/outcome).
    - Operations pages now share a session-scoped runtime snapshot context with cache + stale-while-revalidate to reduce repeated per-page rehydrate calls.
  - Operations workflow-correctness follow-up (March 11):
    - Cluster review routing is now `cluster_id` authoritative; opening a cluster no longer falls back to unrelated latest reviewed results.
    - Review inspection no longer requires preview approval in Operations; inspection is direct/read-only, while mutation stays approval-gated.
    - Review page navigation is now cluster-queue-first (`Previous cluster` / `Next cluster`) rather than reviewed-result-only stepping.
    - Pattern Breakdown now auto-compacts when only one pattern exists (chip-style include/exclude control).
    - Review detail now exposes interaction filters/signals where available:
      - unread-only
      - starred/important
      - inferred no-interaction-90d
      - thread participation badge when labels indicate sent participation
    - Review action bar now uses consequence-first wording:
      - create archive approval request
      - no inbox mutation until approve + execute
    - Approvals cards now explicitly separate request scope + consequences (`Applies to`, `If approved`, `If approved/executed`, `If rejected`).
    - Operations shell now includes page-contextual assistant prompt suggestions (overview/clusters/review/approvals/history).
    - Runtime snapshot provider now adds an in-memory cache layer + longer SWR window to further reduce remount/navigation rehydrate churn.
  - Operations trust + signal-honesty follow-up (March 11):
    - Left-rail visual overlap/cramping corrected with adjusted nav item spacing/line-height and cleaner active-card layout.
    - Cluster Review Detail + Pending Approvals now both show explicit “request -> approve/reject -> execute” sequence copy to remove double-approval ambiguity.
    - Review detail now includes explicit evidence signal taxonomy:
      - available signals
      - inferred/directional signals
      - unavailable signals
    - Interaction filters now degrade honestly (auto-disabled when metadata isn’t available in the current sample scope).
    - Sender-level analytics expanded with sample share, estimated relationship, pattern mix, signal counts, sender classification, and protected-hint matching.
    - Added first-pass visual analytics:
      - Overview: top cluster volume, pattern mix, low-value vs protected split
      - Review detail: pattern distribution, sender contribution, selected vs excluded split
    - Naming alignment tightened to cluster-first operator flow (Cluster Review Detail as active workflow surface; reviewed-result artifacts remain historical/audit context).
  - Operations data-depth + signal-coverage hardening (March 11):
    - Gmail runtime review/discovery message contract now consistently carries richer metadata fields when available:
      - `thread_id`, `history_id`, `internal_date_ms`
      - `label_ids`, `category_labels`, `is_in_inbox`
      - `is_unread`, `is_important`, `is_starred`
    - Cluster Review Detail now supports expanded read-only evidence loading for unreviewed clusters:
      - default bounded fetch depth: 30
      - operator-triggered deeper bounded fetch: up to 60
      - fallback remains lightweight preview when deeper read-only fetch is unavailable
    - Evidence scope is now explicit:
      - sample reviewed (exact)
      - estimated cluster size (directional)
      - selected-for-request subset (exact)
      - evidence basis mode (executed review vs expanded preview vs fallback sample)
    - Signal coverage section now reports real coverage counts and classification:
      - actual (enabled): unread/starred/important/labels/category/inbox-state/date when present
      - inferred (enabled + labeled): no-interaction-90d, thread-participation hints, estimate-driven sizing
      - unavailable (explicit): opened/click tracking and full behavior timeline
    - Sender analytics upgraded from basic summary to decision-support metrics:
      - sample share, selected share, excluded share
      - sender domain + pattern mix
      - unread/starred/important known-count coverage
      - thread-participation hint counts
      - protected/high-priority overlap hints
    - Pending Approvals now surfaces exact execution-scope details when action args include them:
      - reviewed/candidate/selected/excluded counts
      - exact selected message-id scope label
      - evidence basis + safety signals + protected exclusions
    - Overview now includes operator-question guidance and data-basis disclosure:
      - where to start / largest / safest / most mixed-risky
      - metadata scan-basis surfaced where available
      - charts explicitly framed as directional estimates unless exact counts are available
        - Documentation governance reinforcement (March 11, 2026):
    - Authoritative project docs remain the source of truth in ai-agent-platform-docs/, not /web/docs.
    - After each major milestone, Codex should update CHANGELOG.md, CURRENT_STATE.md, TODO.md, and system_overview.md before handoff.
    - Operations Workspace data-depth pass is now reflected across runtime contract, review detail, approvals, and overview surfaces.
    - Active-tenant mailbox-index root-cause diagnostics are now explicit:
      - Active agent `d256b48e-5acf-4b3d-af22-003d52e7e582` resolves via profile to tenant `085c8ef7-2fd7-4842-8499-cd605e894a77`.
      - `gmail_messages` table exists but had 0 rows for active tenant.
      - `gmail_mailbox_index_state` missing in schema cache for active tenant environment.
  - Operations operator-control + scope transparency pass (March 12):
    - analysis-window controls are now explicit in workspace runtime (`7d`, `30d`, `60d`, `90d`, `180d`, `365d`, `all_indexed`)
    - selected analysis scope now propagates through:
      - overview runtime snapshot reads
      - indexed cleanup cluster generation/recompute
      - query-cluster review evidence fetches
    - cluster regeneration is now operator-triggerable from:
      - workspace rail
      - Overview
      - Clusters
    - review detail now explicitly discloses:
      - analysis window in use
      - matching messages in scope
      - representative examples shown
      - discovery rows and inbox rows considered
      - analyzed date span
    - scope-aware runtime snapshot caching now prevents cross-scope stale reuse.
      - `gmail_sender_stats` table exists but had 0 rows for active tenant.
      - Gmail integration connection exists, but refresh path failed in terminal diagnostics due missing `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` for token refresh.
    - Operations runtime now applies a cooldown-guarded mailbox-index bootstrap when index health is zero to avoid indefinite sample-only mode.
    - Review Detail now loads indexed sender intelligence (`sender_index_signals`) and surfaces:
      - indexed sender totals + 30/60-day counts
      - indexed unread/important/starred/inbox counts
      - indexed category + pattern mix
      - machine/human probabilities
    - Review Detail now includes advisory future-rule recommendations from indexed sender evidence.
    - Pattern Breakdown now compacts when only a single low-information pattern exists.
  - Scope-authoritative recompute + review UX hardening (March 12, 2026):
    - Root cause addressed: scope change refresh race (refresh fired before provider scope re-bind) could recompute with prior scope.
    - Scope refresh now runs only after scope prop changes, preventing `365d` selection from silently reusing `90d` refresh context.
    - Runtime now emits dedicated `[playground][cleanup-scope]` logs with:
      - `selected_analysis_scope`
      - `effective_discovery_window_days`
      - `snapshot_scope`
      - `review_scope`
      - `cleanup_cluster_count`
    - Review detail evidence language now emphasizes deterministic loaded-vs-matching scope counts (not random-sample framing).
    - Pattern controls now collapse by default for multi-pattern clusters to reduce screen waste.
    - Sender-level rule guidance is now inline with sender controls; cluster-level rule guidance is surfaced near decision/action area.
    - Archive approval payloads now include explicit analysis/depth context (`analysis_scope`, `matching_messages_in_scope`, loaded subset metadata).
    - Operations approvals now surface analysis-window context in archive message-scope labels when available.
    - Degraded incremental mailbox sync now triggers cooldown-guarded background recovery attempts while keeping cached indexed discovery usable.
  - Indexed evidence browser + count/date-span truth reconciliation (March 12, 2026):
    - Review detail query clusters now use server-backed paginated message browsing as the primary evidence surface.
    - Review browser controls now expose:
      - filter (`all`, `unread`, `starred_or_important`, `no_recent_interaction_90d`)
      - sort (`newest` / `oldest`)
      - page size + previous/next + range telemetry
      - total matching messages in selected scope
    - Review now tracks and discloses loaded-across-pages message counts separately from total in-scope matches.
    - Overview/Clusters/Review now align on the same canonical indexed fields:
      - `indexed_total_rows`
      - `indexed_inbox_rows`
      - `indexed_date_span_start`
      - `indexed_date_span_end`
      - `effective_discovery_window_days`
      - `discovery_rows_used`
    - Scope honesty messaging now explicitly explains when selected window exceeds available indexed span (e.g., 365d selected but current indexed span is narrower).
    - Incremental history-list failures now support cooldown-guarded full-scan recovery fallback where safe (not only explicit history-too-old cases).
  - Indexed cluster recovery + evidence depth upgrade (March 12, 2026):
    - Fixed zero-cluster cache reuse path:
      - cleanup snapshot cache version advanced to `gmail.cleanup_profile_cache.v3`
      - `rehydrate_only` now refreshes when a fresh cached snapshot has `0` clusters but indexed mailbox rows exist.
      - zero-cluster/index-advanced refresh conditions now bypass normal refresh cooldown gating.
      - runtime timing logs now include snapshot cluster count and indexed row count for diagnosis.
    - Indexed cleanup discovery now includes fallback cluster synthesis when strict query-spec matching returns zero clusters.
    - Cluster discovery now emits explicit rejection diagnostics:
      - source counts (`indexed_total_rows`, `inbox_rows`, `recent_window_rows`, `safety_eligible_rows`)
      - rejection buckets (`not_in_inbox`, `starred_or_important`, `category_primary`, `younger_than_7d`, `no_cluster_pattern_match`)
      - strict/fallback match counts + exploratory fallback flag
      - surfaced in logs and empty-state UI diagnostic summaries.
    - Runtime cleanup clusters now carry indexed window evidence when available:
      - `count_last_30d`, `count_last_90d`, `count_last_180d`, `count_total_indexed`
      - unread/important/starred/inbox counts
      - category mix + first/last seen timestamps
    - Mailbox profile scan basis now reflects total indexed rows (not only inbox subset) to reduce sample-style ambiguity.
    - Sender index signals now include deeper windows (`90d`, `180d`) and `first_seen` for review decisions.
    - Runtime timing logs now include cleanup cluster count for stale/empty-state diagnosis.
    - Operations Approvals now consumes backend-scoped `runtime_approval_queue_items`, so summary counts and actionable rows resolve from the same scoped approval-history source.
    - Mailbox index health now distinguishes degraded-but-usable state:
      - API returns `sync_health`, `usable_with_cached_index`, and `last_sync_error`.
      - Operations Overview now explains when incremental sync is degraded but indexed cache remains usable.
    - Incremental mailbox sync now tolerates isolated metadata fetch misses and records `incremental_sync_degraded` instead of failing the entire sync run.
  - Indexed discovery depth expansion + transparency (March 12, 2026):
    - Root cause fixed: index-backed discovery/sender reads were effectively shallow due single-query retrieval behavior against capped REST row windows.
    - Indexed row loading is now paginated up to configured cap (50,000), so discovery/review analytics can consume the real indexed corpus instead of ~1000-row slices.
    - Sender stats recomputation now uses paged indexed reads, improving sender-level evidence quality.
    - Sender index signal fetches for review now paginate within safe bounds (instead of single-query truncation), improving per-sender 30/60/90/180-day confidence.
    - Discovery now selects broader historical windows (`30/90/180/365`) from indexed inbox depth when available.
    - Safety gating is now clearer:
      - recent mail remains reviewable in discovery clusters
      - mutation safety still enforced by approval + execute flow and explicit exclusions.
    - Operations now auto-schedules cooldown-guarded background full backfill when index exists but remains shallow.
    - Operations Overview / Clusters now expose discovery depth explicitly:
      - discovery rows used
      - inbox rows considered
      - discovery window used
      - indexed oldest/newest date range
      - depth label (shallow/moderate/deep historical evidence)
  - Bounded review-unit workflow + query-browser performance hardening (March 13, 2026):
    - Query-cluster review is now unitized into bounded actionable slices:
      - sender slices
      - domain slices
      - pattern slices
      - recency slices
      - mixed remainder fallback
    - Each review unit is capped to the most recent 5,000 rows to keep operator review bounded and prevent giant-cluster UI overload.
    - Query-cluster browser cache now stores precomputed review-unit manifests (row subsets) so page/filter/sort requests avoid full-cluster re-filtering loops.
    - Review detail now treats paginated unit rows as the primary working surface and explicitly separates:
      - cluster total in scope
      - current review-unit size
      - loaded rows on current page / across visited pages
    - `browse_query_cluster` now supports `review_unit_id` so unit switching remains in-place and stateful.
  - Gmail Operations usability hardening (March 13, 2026):
    - Scope regeneration feedback now exposes deltas directly in workspace shell:
      - cluster count before/after
      - added/removed clusters
      - count-shifted clusters
      - indexed span change summary
    - Review unit selection now has a visible paged unit queue (`Open unit`) to reduce hidden-control ambiguity.
    - Sender breakdown now defaults to compact cards with explicit expansion for deep sender metadata.
    - Sender cards are now paginated to prevent long repetitive scroll walls on high-sender clusters.
    - Non-server-backed message lists now use explicit paging controls (page size + prev/next + range) instead of incremental “load more” scrolling.
    - Review guidance now follows explicit operator sequence (scope -> cluster -> review unit -> paged inspection -> decision -> approval request).

## LLM Training
- Save & Next
- Save & Finish
- Evidence pack integration
- Non-destructive prompt merge
- Quality score persistence
- fine_tune_examples logging

## Backend Stability
- evaluateQuality stable
- finalRefine stable
- Strict JSON schemas enforced
- Evidence compaction active
- Embedding normalization hardened
- Cosine similarity retrieval validated
- Core contract fields protected from shrink (>30%)
- Strict merge preservation validated during forced rewrite (no contract loss observed)

## Agent Runtime (Slice #1 — Approval Queue MVP)
- `/api/runtime/plan` endpoint implemented (generates execution plan and logs `approval_request` events).
- `/api/runtime/approve` endpoint implemented (logs `approval_decision` events).
- `/approvals` dashboard page implemented:
  - Server-side admin reads from `agent_events`.
  - Computes pending approvals (request without decision).
  - Approve/Reject actions call runtime API via `fetch`.
- Schema-free MVP implemented using existing `agent_events` table.
- End‑to‑end validation completed locally (plan → approval → row removal).

## Agent Runtime Execution (Slices 6A–7)

- Runtime supervision ladder now operational:
  - Plan → Approve → Confidence → Eligibility → Execute.
- Sandbox execution pipeline implemented:
  - `/api/runtime/execute` executes sandbox actions safely.
- Execution logging implemented:
  - `execution_result` events stored in `agent_events`.
- UI now displays runtime supervision state:
  - mode
  - confidence
  - approval status
  - execution status.

## Integrations — Gmail

- Tenant-scoped OAuth integration implemented.
- Gmail connection stored in `integration_connections`.
- OAuth flow:
  - `/api/integrations/gmail/start`
  - `/api/integrations/gmail/callback`
- Runtime tool support added:
  - `gmail.draft_email`
- Agent execution can now create Gmail drafts (never sends).
- Inbox analysis runtime tool implemented:
  - `gmail.analyze_inbox`
  - Reads inbox metadata sample and derives sender clusters.
- Mailbox profiling implemented for strategic cleanup planning:
  - Gmail-native categories/labels/states + age-window estimates
  - bounded sender/subject recurrence sampling
  - additive runtime profile metadata for Playground strategy guidance
- Sender cluster review tool implemented:
  - `gmail.review_sender_cluster`
  - Retrieves sample messages for a specific sender.
- Inbox archive runtime tool implemented:
  - `gmail.archive_messages`
  - Removes the `INBOX` label using Gmail `batchModify`.
  - Messages remain in **All Mail** (standard Gmail archive behavior).
- Gmail OAuth scope expanded to support modification:
  - `gmail.modify` permission now requested during OAuth flow.
  - Required for archive operations.

Current limitation:
- Sender preference controls are currently local/UI-scoped and apply strongest to reviewed-sender/archive recommendation suppression. Query-cluster sender-subset splitting is still heuristic and not yet a full deterministic per-sender partition engine.

---

### Runtime Capability Milestone (March 5, 2026)

The platform successfully completed the first **end‑to‑end autonomous workflow milestone**.

Operational chain verified:

Plan → Approve → Confidence → Eligibility → Auto‑Approve → Execute → External Tool Action

Working runtime example:

- Agent proposes Gmail action (`gmail.draft_email`).
- Supervisor approves or auto‑approves based on confidence threshold.
- Execution endpoint validates runtime mode (`guarded`).
- System executes Gmail draft creation through OAuth integration.
- Execution result stored in `agent_events`.

Confirmed output:

- Gmail draft created in connected inbox.
- Execution recorded in `execution_result` event.
- UI status correctly transitions:
  `pending → approved → executed`.

This marks the **first real external tool execution by the AI Agent Platform runtime**.

### Runtime Inbox Assistant Milestone (March 8, 2026)

The platform successfully executed its first **automated inbox management action**.

Verified runtime chain:

Analyze Inbox → Review Sender Cluster → Propose Action → Approve → Execute → Gmail Archive

Working runtime example:

- Agent analyzed Gmail inbox metadata.
- System detected high‑volume sender clusters.
- Runtime assistant recommended archive candidates.
- Approval request generated and approved through `/approvals`.
- `/api/runtime/execute` performed `gmail.archive_messages`.
- Gmail `batchModify` removed the `INBOX` label.

Verified result:

- Target emails disappeared from Inbox.
- Messages remained accessible in **All Mail**.
- Execution recorded in `execution_result` event.
- Playground UI reflected execution evidence.

This represents the **first real autonomous inbox management workflow executed by the runtime system**.

### Runtime Playground Refactor Milestone (March 9, 2026)

Playground runtime architecture has been modularized without changing behavior.

Extracted modules now own the previously in-route runtime internals:
- `src/lib/runtime/suggestionLifecycle.ts`
- `src/lib/runtime/stateLoaders.ts`
- `src/lib/runtime/gmailRuntimeAssembler.ts`
- `src/lib/runtime/runtimeStateService.ts`
- `src/lib/runtime/playgroundPromptBuilder.ts`
- `src/lib/runtime/playgroundRagService.ts`

Current route ownership remains:
- response shaping
- explicit `gmail.analyze_inbox` proposal trigger logic
- chat service invocation
- analytics service invocation

`rehydrate_only` behavior remains preserved.

Reference:
- `ai-agent-platform-docs/playground-runtime-architecture.md`

---

## 🔄 Phase Transition — Decision System Build (Next Phase)

- Gmail ingestion and cleanup infrastructure is now complete and stable.
- The next major system focus is the **Sender Decision Experience (Decision Mode UI)**:
  - Tinder-style rapid decision interface
  - Sender-level classification flow (Keep / Some / None / Unsure)
  - Management system integration (archive, rules, quarantine)
  - Gamified review loop and reinforcement signals

- This marks a transition from:
  - backend-heavy stabilization work
  - → frontend product experience + user workflow optimization

- A new Project Manager (v11) will take ownership of this phase to:
  - maintain clean context
  - operate from finalized documentation
  - execute high-speed UI/product build cycles with Codex

---

# 🚀 Current Strategic Focus

Phase 3 — Controlled Expansion

1. RAG → Prompt Rewrite Integration
   - Drive knowledge influences rewrites
   - Q&A contract remains canonical
   - RAG used as evidence layer, not override

2. Fine-Tune Alignment
   - Drive = knowledge base
   - Q&A = behavioral authority
   - Separation of knowledge vs behavior weighting maintained

3. Project Manager v8 Continuity
   - Maintain authoritative docs as the source of truth
   - Keep Codex aligned to CURRENT_STATE.md, CHANGELOG.md, TODO.md, and system_overview.md after each milestone
   - Preserve clean handoff readiness for future PM transitions
   - PM v8 introduced a new Codex interaction model:
     - Project Manager performs primary product/design review using screenshots
     - User provides minimal UI test signals (load time + click behavior)
     - Codex receives tightly scoped execution instructions
   - New UI reliability rule introduced:
     - Every Codex UI prompt must include:
       "Before changing UI, read the following:" + relevant spec excerpts
     - This prevents UI regression and keeps Codex aligned with design intent
## Mailbox Intelligence — Product Direction Lock

- Mailbox Intelligence is now defined as:
  "AI Intelligent Decision Dashboard"

- Core responsibilities:
  - define the goal (clean inbox = all senders decided)
  - show current state (health, scale, progress)
  - identify bottleneck (what is blocking progress)
  - guide next action (clear CTA-driven workflow)
  - show expected payoff (what improves if user acts)

- Design constraints:
  - must remain command-first, not analytics-heavy
  - must not duplicate Cleanup Groups surface
  - must prioritize sender-level logic over message-level metrics
  - every major metric must have:
    - clear denominator
    - visual representation
    - actionable meaning

- Deferred to next PM:
  - management-layer signals integration
  - advanced hover intelligence (multi-line actionable insights)
  - unified chart system (shared visual components)
  - sidebar layout consolidation

# 🧪 Operational Safety Tools

4. Hybrid Execution Governance
   - Codex reserved for multi-file or system-level changes
   - Direct PM edits allowed for single-file adjustments
   - Supabase schema edits default to Dashboard unless migration required
   - Domain isolation enforced for all Codex threads

5. Agent Runtime Expansion

Current runtime supervision ladder:

Plan → Approve → Confidence → Eligibility → Auto‑Approve → Execute

Completed slices:

Slice #1 — Approval Queue MVP
Slice #2 — UUID validation + approvals UI client component
Slice #3 — Confidence tracking per tool/action
Slice #4 — Runtime mode + eligibility endpoint
Slice #5 — Guarded auto‑approval
Slice 6A — Sandbox execution engine
Slice #7 — Gmail draft execution integration
Slice #8 — Gmail inbox analysis runtime tool
Slice #9 — Sender cluster review runtime tool
Slice #10 — Gmail archive execution tool
Slice #11 — Runtime suggestion lifecycle tracking (ready → pending → approved → executed)

Next capability in development:

Inbox Assistant

- Gmail inbox analysis
- Batch archive recommendations
- Conversational approval workflow
- Runtime assistant agent for operational automation

Current status (March 8, 2026):
- Inbox Assistant MVP is operational.
- Inbox analysis, sender review, and archive execution are implemented.
- Runtime UI suggestions are lifecycle‑aware (ready / pending / approved / executed).
- Remaining improvements focus on UX polish, persistence, and broader batch operations.

This will introduce the **first dedicated Runtime Assistant Agent** responsible for inbox management and workflow assistance.

---

# 🧪 Golden Path (Must Always Pass)

Automated check available via `npm run golden-path` (preferred quick verification).

1. Next training suggestion works.
2. Save & Next works.
3. Save & Finish triggers rewrite.
4. Preview shows canonical grouping.
5. Quality score updates correctly.
6. RAG Sync schedules job.
7. RAG Worker processes documents.
8. Playground retrieves correct Drive content.
9. Usage logging records activity.

If any fail → immediate fix.

---

# ⚠ Acceptable Limitations

- Wildcard domains require discovery scans.
- No precise progress % (document-count proxy used).
- Worker is single-process (no distributed queue yet).
- OpenAI timeouts possible under heavy refine (guarded).
- Playground workflow progress is step-level for the active cleanup flow; total inbox cleanup progress is not implemented yet.
- Mailbox profile coverage is estimate-based (Gmail `resultSizeEstimate` + bounded samples), not an exhaustive full-mailbox classification pass.
- Gmail `resultSizeEstimate` can still produce overlapping counts across related query clusters; UI and assistant now frame these as directional estimates.
- Profile freshness is currently session/runtime-event driven; it is not yet policy-scheduled on a background cadence.
- Cleanup strategy recommendations inherit mailbox-profile estimate limits; they are planning guidance, not exhaustive mailbox truth.
- Bounded mailbox profiling basis is stronger than initial slice (120 metadata messages / 240 id scan), but still intentionally not full-mailbox scanning.

---

# 🧠 Strategic Position

The system is out of debugging mode and in stabilized infrastructure state.

Operational pillars:
- Prompt Engineering Loop
- RAG Retrieval Engine
- Training Canonicalization
- Job-Based Knowledge Sync
- Usage Analytics Foundation

v6 stabilized.  
Platform stabilized under PM v8.

The **runtime supervision system (Slices 1–7)** is now operational and has successfully executed its first real external action (Gmail draft creation).

The platform has transitioned from infrastructure stabilization into **early autonomous workflow capability**.

---

# 🔒 Version Snapshot

v6 is formally archived.

v8 is now active under:
- Codex Hybrid Execution Model
- Domain isolation discipline
- Canonical contract protection rules

All future structural changes must be logged in CHANGELOG.md and reflected here.

---

# 🧪 Operational Safety Tools

Golden Path Script:
- Location: `web/scripts/golden-path.mjs`
- Command: `npm run golden-path`
- Purpose: rapid system health verification before and after structural changes.

Recommended Usage:
- Run before starting development sessions.
- Run after major changes (RAG, prompt pipeline, schema edits).
- Run before activating a new Project Manager agent version.

---

## Gmail Operations Review State - March 13, 2026

Current Gmail Operations review workflow is now organized around three operator-facing stages:

1. Batch Overview
2. Sender Decisions
3. Message Verification + Approval

Current visible behavior:

- Review defaults:
  - sender page size: `10`
  - message page size: `10`
- Both sender and message sections now expose:
  - explicit page-size controls
  - explicit visible-range text
  - consistent pagination language
- Main Message Review uses hydrated snippet rows, matching the sender-preview evidence model.
- Review analytics are batch-scoped and visible at the top of the page:
  - top sender concentration
  - category distribution
  - recency distribution
  - unread/protected mix
- Gmail signal availability is now explained in plain operator language instead of internal/debug wording.

Current live validation state:

- Review page browser proof captured from localhost Chrome session.
- 3-step headings confirmed in rendered page text:
  - Step 1 / Batch Overview
  - Step 2 / Sender Decisions
  - Step 3 / Message Verification + Approval
- Bottom Message Review snippets confirmed present in live rendered page text.
- Sender page-size and message page-size controls confirmed present with default `10`.

Current latency picture from fresh local logs:

- `browse_query_cluster`
  - warm server: `345ms`, `440ms`
  - warm browser: `995ms`, `1158ms`
  - current default `page_size: 10`
- `load_message_snippets`
  - `3` visible rows: `1035ms` server / `1681ms` browser
  - `7` visible rows: `901ms` server / `1662ms` browser

Remaining limitation:

- The 3-step workflow is visibly improved, but the page is still dense for very large cleanup groups and sender detail expansion still depends on deferred enrichment timing.

---

## Gmail Operations Guided Review State - March 13, 2026

The Gmail Operations review page now behaves as a guided inbox cleanup workflow instead of a technical review console.

Current workflow:

1. Step 1 - Batch Overview
2. Step 2 - Sender Decisions
3. Step 3 - Message Verification + Approval

Current visible behavior:

- Step 1 answers:
  - what cleanup group is being reviewed
  - why the current batch exists
  - how large the cleanup group is
  - how large the current batch is
  - what the main cleanup opportunity/risk looks like
- Step 1 charts are tied to the active batch and include:
  - top sender concentration
  - category distribution
  - recency distribution
  - unread/protected mix
- Step 2 is the sender-only workbench:
  - sender page size defaults to `10`
  - sender page-size options are `10 / 25 / 50 / 100`
  - sender sorting options are:
    - highest sender volume
    - most unread
    - most recent
    - highest risk
    - alphabetic
  - sender policy and batch inclusion decisions are separated conceptually
- Step 3 is the verification and approval stage:
  - message page size defaults to `10`
  - message page-size options are `10 / 25 / 50 / 100`
  - visible messages are limited to the operator's current verification scope
  - bottom Message Review uses hydrated snippets
  - full message preview is available in a readable drawer
  - future rule recommendation now appears only here, after verification

Current Gmail field honesty in the UI:

- Actual fields surfaced:
  - sender
  - subject
  - snippet
  - date / age
  - unread
  - starred
  - important
  - Gmail categories / labels where available
- Derived/inferred signals surfaced:
  - machine-like vs human-like sender guidance
  - sender risk framing
  - likely cleanup suitability
- Not currently available as true Gmail-native signals:
  - open history
  - click history
  - exact engagement timeline

Live validation state:

- Browser-verified localhost screenshots captured for:
  - Step 1: `/tmp/cdp-step1.png`
  - Step 2: `/tmp/cdp-step2.png`
  - Step 3: `/tmp/cdp-step3.png`
  - full message preview: `/tmp/cdp-preview-open.png`
  - rule recommendation state: `/tmp/cdp-rule-state.png`

Current remaining limitation:

- Sender detail expansion is improved but still depends on deferred sender-intelligence loading.

---

## Gmail Review Trust State - March 13, 2026

Current sender-metric model is now explicitly unified:

- Authoritative sender-ranking metric:
  - `Batch message volume`
- This same metric now drives:
  - Step 1 top sender chart
  - Step 2 default sender sort
  - sender header batch-volume labels

Current scope labeling across the page:

- Cleanup group:
  - full candidate universe for the selected cleanup group
- Batch:
  - exact current working slice under review
- Page:
  - currently visible rows
- Historical indexed sender evidence:
  - only shown when explicitly labeled as indexed/history

Current sender preview behavior:

- Expanded sender preview now shows:
  - 5 recent examples by default
  - expandable bounded preview up to 8 examples
- Preview rows currently include:
  - subject
  - date
  - snippet when Gmail returns preview text
  - deterministic fallback copy when Gmail snippet is unavailable for that row

Current live browser verification:

- Step 1 chart and Step 2 sender workbench order align on the same top senders:
  - `mike@mikedillard.com`
  - `psb@deltateamtactical.com`
  - `consumer@e.mail.realtor.com`
  - `noreply@skool.com`
  - `info@grantcardone.com`
- Sender preview currently shows multiple examples from the current batch instead of only one row.

---

## Gmail Operations Scope Hierarchy - March 13, 2026

Current Gmail Operations navigation hierarchy is now explicit instead of implied:

- Whole Mailbox
- Cleanup Candidate Universe
- Cleanup Group
- Batch
- Sender
- Message

Current scope behavior by page:

- Mailbox Intelligence:
  - explicitly represents the Cleanup Candidate Universe
  - not the whole mailbox
  - shows how the candidate universe relates to the indexed whole mailbox
- Cleanup Groups:
  - sits one level below the candidate universe
  - inherits the scope strip so the operator can see where group counts come from
- Batch Review:
  - keeps the 3-step workflow
  - now sits under the broader hierarchy rather than replacing it

Current operator-facing count bridge:

- Mailbox Intelligence explains candidate-universe totals in mailbox context
- Batch Review explains:
  - how the current batch relates to the cleanup group
  - how the cleanup group relates to the cleanup candidate universe
- Sender rows explain:
  - messages in the current batch
  - messages in the cleanup group
  - messages in the cleanup candidate universe

Current live browser proof:

- Mailbox Intelligence goal / level explanation:
  - `/tmp/mailbox-intelligence-goal.png`
- Intelligence drill-down:
  - `/tmp/mailbox-intelligence-drilldown.png`
- Review scope strip:
  - `/tmp/review-scope-chain.png`
- Sender scope bridge:
  - `/tmp/review-step2-sender-row.png`
- Sender preview parity with Step 3:
  - `/tmp/review-step2-sender-preview.png`

---

## Gmail Operations IA Correction - March 13, 2026

Current top-level product story:

- `Operations Overview`
  - lightweight operational shell only
  - confirms health, mailbox index state, pending approvals, and next step
  - no longer serves as the main analytics destination
- `Mailbox Intelligence`
  - primary analytics-first entry into Gmail cleanup
  - explicitly represents the Cleanup Candidate Universe
  - owns the bird’s-eye explanation and drill-down behavior
- `Cleanup Groups`
  - explicit selection step after Mailbox Intelligence
- `Batch Review`
  - guided staged workspace underneath the broader hierarchy

Current navigation model:

- Left rail labels, page headers, and workflow path now use the same vocabulary:
  - Operations Overview
  - Mailbox Intelligence
  - Cleanup Groups
  - Batch Review
  - Pending Approvals
  - Executed Actions
  - History

Current Batch Review navigation:

- Global context:
  - compact workflow path back to Overview, Intelligence, and Cleanup Groups
- Local stage control:
  - Step 1: Batch Overview
  - Step 2: Sender Decisions
  - Step 3: Message Verification
  - Step 4: Approval / Rule Recommendation

Current Step 2 preview behavior:

- Sender preview rows now explicitly state they use the same full preview path as Step 3.
- Sender preview buttons now use `Open full preview` language.
- When Gmail does not return preview text, the UI now more clearly tells the operator to use the full preview instead of implying the preview is broken.

Current Mailbox Intelligence interaction clarity:

- An active drill-down now remains visibly summarized near the sender ranking table.
- The affected table auto-scrolls into view when a chart drill-down becomes active.
- The table shows whether the user is seeing:
  - full Cleanup Candidate Universe
  - or a currently active drill-down slice

Current `cleanup_group_intelligence` reuse behavior:

- Stable cache versioning now keys reuse to:
  - cleanup plan generation time
  - mailbox profile freshness generation time
- Normal route flow now reuses the warmed intelligence payload instead of repeatedly paying the old `~42s` cold compute in the user-visible navigation path.
- Latest warmed-flow evidence from local logs:
  - Overview prewarm server duration: `1ms`
  - Intelligence initial-load server duration: `0ms`
  - Cleanup Groups scope-chain server duration: `0ms`
  - Review scope-chain server duration: `1ms`

---

## Build Stabilization State - March 14, 2026

Current runtime-module build state:

- The reported Vercel failures for `@/lib/runtime/*` are not caused by alias configuration, case sensitivity, or renamed files.
- The reported modules already exist locally at the exact imported paths under `web/src/lib/runtime/`.
- The actual failure mode is deployment integrity:
  - the runtime split files exist in the working tree
  - they are currently absent from the tracked `HEAD` tree
  - a Vercel build from the tracked tree cannot resolve them

Additional runtime modules currently sharing this same risk profile:

- `approvalSummary.ts`
- `gmailCleanupMemory.ts`
- `gmailCleanupWorkspace.ts`
- `operationsAnalytics.ts`
- `operationsWorkspace.ts`
- `playgroundWorkflowState.ts`

Current validation snapshot:

- Full-repo `eslint` and `tsc` remain noisy in this local workspace because of unrelated in-progress files outside the stabilization scope.
- Local `next build` no longer reproduced the original missing-module crash in the current tree, but this thread did not produce a fully clean end-to-end build result from the dirty workspace.

---

# 🔄 Handoff Note (PM v8 → Next PM)

The system is stable, and the Gmail Phase 1 workflow is functionally complete.

Key transition state:
- Mailbox Intelligence is visually and structurally close to target, but requires one final polish pass under a fresh context window.
- Management layer is now functionally correct (destination + execution truth + restore), but needs visual intelligence layering.
- Sender Decisions + Confirmation flows are stable and no longer require structural changes.

Next Project Manager should focus on:
1. Final Mailbox Intelligence polish (visual + semantic clarity)
2. Management dashboard visual intelligence layer
3. Shared chart/visual system implementation
4. UI consistency + interaction standardization

Do NOT re-architect Phase 1 flow.
Do NOT regress sender-first model.
Do NOT reintroduce message-first logic.

This is a polish + intelligence layering phase, not a rebuild phase.
