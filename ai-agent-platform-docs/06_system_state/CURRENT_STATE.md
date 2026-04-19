# CURRENT_STATE — AI Agent Platform

Last updated: 2026-04-16
Project Manager: Codex Operating System active (`Oliver -> Project Manager -> Codex`)

---

## 🚀 April 16 — ACE-047 Time Context Rebuild Active

### Current governing state

- `ACE-047` is now the active governing Time Context lane.
- Time Context is now under a controlled phased rebuild.
- Time Context execution is now spec-driven:
  - behavioral truth = `TIME_CONTEXT_SPEC.md`
  - execution sequencing = `TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
- No further Time Context implementation may proceed outside the defined phased rebuild.
- Active phase:
  - Phase 2 — Scope Semantics Lock
- Phase 1 — Runtime Safety / Churn Containment is accepted and complete.
- Runtime surface is stable.
- No request churn.
- Safe to proceed with Time Context post-settle semantic verification.
- Runtime READY blocker is resolved on the canonical protected-trust review route.
- Runtime snapshot attachment is no longer the active blocker for Phase 2 verification.
- Phase 2 remains active; the next step is final post-settle verification, not new implementation.
- Historical continuity remains preserved:
  - prior `ACE-046` runtime request-flood stabilization remains accepted historical truth
  - accepted runtime continuity, Smart Sync handoff, guardrail enforcement, and Time Context scoped-state rebuild remain preserved and must not be reopened without new canonical-route evidence
- The runtime continuity sub-layer under `ACE-046` is now accepted and complete for build-liveness reconciliation before build-pending continuity emission.
- `ACE-045` is now accepted and complete as the Operations Review hero/layout hierarchy cleanup.
- `ACE-044` remains accepted and complete as the Sender Distribution `All indexed` reconciliation cleanup.
- `ACE-043` remains accepted and complete as the coverage / backfill display contract cleanup.
- `ACE-042` remains accepted and complete as the Time Context render-authority and scope-unification contract.
- `ACE-040` remains accepted and complete as the Smart Sync continuity + UI stabilization contract.
- The current system state is:
  - Time Context phased rebuild lane is active
  - Phase 2 scope semantics lock is the active execution focus
  - accepted runtime continuity containment remains stable
  - stable runtime / Smart Sync continuity layer
  - stable Time Context render authority layer
  - stable coverage / backfill display contract layer
  - stable Sender Distribution `All indexed` reconciliation layer
  - stable Operations Review hero/layout hierarchy
  - stable Analysis Rail request-discipline historical baseline
  - stable runtime continuity build-liveness reconciliation layer
  - stable Smart Sync -> artifact rebuild handoff layer
  - stable runtime guardrail enforcement layer
  - stable runtime request-flood containment layer for build-pending and failed-artifact rehydrate paths
  - no further implementation may proceed outside the active defined rebuild phases

### Execution status

- `ACE-047` is now the active governing next lane.
- Phase 1 — Runtime Safety / Churn Containment is accepted and complete.
- Phase 2 — Scope Semantics Lock is explicitly active.
- Phase 1 accepted-fix closeout:
  - eliminated mailbox-index poll loop caused by stale `active_run` gating
  - runtime now polls only when `execution_state === 'running'`
  - cold load, scope switching, and idle now operate with zero unnecessary churn
- Recovery Contract: `CHANGELOG.md` -> `April 16, 2026 — Phase 1 Runtime Safety Fix`
- Runtime READY unblock accepted-fix closeout:
  - canonical protected-trust review route reaches READY within the locked protocol window
  - baseline runtime snapshot attaches without blocking on heavy selected-cluster bootstrap
  - `rehydrate_only` now returns enough same-scope baseline rail truth for route readiness while heavy rail hydration remains deferred
- Recovery Contract: `CHANGELOG.md` -> `April 16, 2026 — ACE-047 Runtime READY Unblock Accepted`
- `ACE-045` remains accepted and closed:
  - `Sender Review Goal` is restored inside the dark hero directly under the KPI cards
  - `Smart Sync continuity` remains outside the hero
  - `Page Truth Guide` remains outside the hero
  - Recovery Contract: `CHANGELOG.md` -> `April 9, 2026 — ACE-045 Operations Review Hero/Layout Cleanup Accepted`
- accepted `ACE-044`, `ACE-043`, `ACE-042`, and `ACE-040` remain stable historical fixed truth and must not be reopened without new canonical-route evidence
- `ACE-041` remains active unchanged as the control-plane execution-efficiency layer and does not govern product-lane scope.

### Next executable step

- Rerun Phase 2 final post-settle verification on the accepted route using the locked verification protocol.
- Objective:
  - prove post-settle `all_indexed` monthly chart truth on the accepted route
  - execute the locked scope loop only after READY is reached
  - confirm bucket counts, current-month visibility, and cross-scope parity under the post-settle protocol
- Scope:
  - Phase 2 verification only
  - canonical protected-trust review route
  - locked post-settle verification protocol
- Constraints:
  - preserve the accepted Phase 1 stable runtime surface
  - preserve the accepted runtime READY unblock
  - do not reopen runtime churn containment
  - do not implement new semantics during verification
  - do not move beyond the active rebuild phase
- Preserve accepted historical runtime stabilizations and scoped-state fixes while Phase 2 semantics work proceeds.

---

## 🚀 April 8 — ACE-043 Coverage / Backfill Display Contract Cleanup Accepted

### Current governing state

- `ACE-043` is now accepted and complete as the Analysis Rail coverage / backfill display contract cleanup on the Operations Review page.
- `ACE-042` remains accepted and complete as the Time Context render-authority and scope-unification contract on the Operations Review page.
- `ACE-040` remains accepted and complete as the stable Smart Sync continuity + UI stabilization contract.
- The current system state is:
  - stable runtime / Smart Sync continuity layer
  - stable Time Context render authority layer
  - stable coverage / backfill display contract layer
- `ACE-043` accepted scope:
  - removed visible `1970` / epoch fallback leakage
  - coverage now reflects the actual indexed / backfill window on the accepted shell
  - mailbox coverage display now aligns with mailbox-index truth
  - review-page display-contract interpretation now settles to final truth instead of staying stuck unavailable
- Keep separate follow-on lanes outside accepted `ACE-043`:
  - `all-indexed` Sender Distribution render inconsistency
  - hero/layout cleanup regression

### Execution status

- `ACE-043` is accepted and closed:
  - the accepted runtime continuity layer remains stable under `ACE-040`
  - the accepted Time Context render-authority layer remains stable under `ACE-042`
  - the shared mailbox coverage/backfill shell now settles onto real mailbox-index truth on the canonical review route
  - no visible `1970` remains on the accepted surface
  - Recovery Contract: `CHANGELOG.md` -> `April 8, 2026 — ACE-043 Coverage / Backfill Display Contract Cleanup Accepted`
- `ACE-040` remains accepted historical truth for runtime continuity and final ready-state UI stabilization.
- `ACE-042` is accepted and closed:
  - review-page render authority is unified
  - `All indexed -> 1D` and `1W -> 1D` settle to the same 24-hour chart contract
  - Smart Sync `1W` / `1M` drift validation passed with no flicker and no fallback/status swap
  - Recovery Contract: `CHANGELOG.md` -> `April 8, 2026 — ACE-042 Time Context Render Authority + Scope Unification Accepted`
- `ACE-041` remains active unchanged as the control-plane execution-efficiency layer and does not govern product-lane scope.

### Next executable step

- Hero/layout cleanup is now active under `ACE-045` on the Operations Review page.
- Preserve accepted `ACE-044` as the stable Sender Distribution `All indexed` reconciliation contract.
- Keep remaining lanes separated; do not reopen accepted distribution, coverage/backfill, runtime continuity, or Time Context contracts in the hero/layout pass.
- Do not reopen accepted `ACE-040`, `ACE-042`, `ACE-043`, or `ACE-044` unless new canonical-route evidence disproves those contracts.

---

## 🚀 April 7 — ACE-041 Execution Efficiency Optimization Layer Active

### Current governing state

- `ACE-041` is now active system behavior for control-plane execution efficiency.
- This is an operating-model optimization only:
  - no product behavior changed
  - no runtime behavior changed
  - no UI behavior changed
- Same-thread control-plane carry-forward is now allowed when:
  - governing ACE is unchanged
  - active phase is unchanged
  - accepted-fix status is unchanged
  - approved scope is unchanged
  - governing-truth status is unchanged
- Propagation cadence is now checkpoint-based:
  - accepted fix
  - governing-truth change
  - phase transition
  - thread closeout when material state exists
  - before a new thread that depends on pending truth
- Verification must follow the ladder:
  - diagnostic falsification
  - correction proof
  - accepted-fix closeout
- `MEDIUM` is now the default reasoning tier unless ambiguity, cross-layer risk, or architecture work justifies escalation.
- `PROJECT_MANAGER_CONTEXT.md` remains the canonical PM operating-model file only.
- Lane-specific execution truth must continue to live in:
  - `CURRENT_STATE.md`
  - `ACTIVE_CHANGE_EVENTS.md`

### Execution status

- `ACE-041` is propagated as active control-plane behavior.
- `AGENTS.md` already enforces the efficiency layer rules and required boundaries.
- `PROJECT_MANAGER_CONTEXT.md` already reflects:
  - same-thread carry-forward
  - propagation cadence
  - verification ladder
  - reasoning-tier optimization
  - PM context boundary rules
- `SYSTEM_MEMORY_MAP.md` remains consistent with PM context canonicalization and lane-truth routing.

## 🚀 April 8 — ACE-040 Smart Sync Continuity + UI Stabilization Accepted

### Current governing state

- `ACE-040` is now accepted and complete as the Smart Sync continuity + UI stabilization contract for the canonical Analysis Rail review route after `ACE-039`.
- `ACE-039` remains complete and accepted as the mailbox-index freshness / data-truth recovery contract.
- Smart Sync is now treated as a live continuity mechanism, not just a one-time recovery tool.
- Runtime snapshot / `cacheVersion` advancement is required only when a completed Smart Sync produces changed artifact/runtime truth that should update workflow truth.
- A no-op Smart Sync completion is not, by itself, continuity failure proof.
- Forced refresh must not attempt runtime regeneration while artifact publication remains:
  - `freshness_state = refresh_in_progress`
  - `build_status = building`
- During active artifact build, the system must keep the last stable runtime snapshot visible, expose build-pending status, and rotate `generated_at` / `cacheVersion` only after build-ready truth is published.
- Time Context rendering must remain deterministic by timeframe:
  - short ranges -> daily bars
  - medium ranges -> weekly bars
  - long ranges -> monthly bars
- `ACE-040` preserves the accepted invariant that the page must remain visibly populated through build-pending and ready-state swap:
  - no forced refresh crash during active build
  - no loading-only workspace at final settled ready state
  - no placeholder-only summary truth after the swap
- Keep adjacent Analysis Rail follow-up separate from the accepted `ACE-040` contract:
  - `1970` coverage display anomaly
  - `all-indexed` Sender Distribution render inconsistency

### Execution status

- `ACE-039` = complete:
  - accepted mailbox-index freshness / data-truth recovery
  - preserved as the fixed upstream source-layer contract
- `ACE-040` = complete:
  - accepted Smart Sync build-pending stable-snapshot contract
  - accepted automatic ready-state runtime swap
  - accepted UI stabilization across the swap, including downstream sender workspace / sender distribution completion
  - Recovery Contract: `CHANGELOG.md` -> `April 8, 2026 — ACE-040 Smart Sync Continuity + UI Stabilization Accepted`

### Next executable step

- `ACE-040` is accepted and closed.
- Subsequent Analysis Rail implementation moved through separate follow-on lanes, with Coverage / Backfill Display Contract Cleanup accepted under `ACE-043` and Sender Distribution `All indexed` reconciliation later accepted under `ACE-044`.
- Keep the `1970` coverage display anomaly and `all-indexed` Sender Distribution render inconsistency separate from the accepted `ACE-040` continuity contract.

## 🚀 April 6 — ACE-039 Mailbox-Index Freshness Recovery Accepted

### Current governing state

- `ACE-039` is now the accepted completed mailbox-index freshness recovery for current `1W` / `1M` Time Context failures.
- Current `1W` / `1M` failures must now be treated as a recent-period data-truth / source-of-truth recovery problem, not as a UI grammar-only problem.
- The chart remains the final pass surface, and the accepted fix now restores the upstream truth feeding that chart.
- The approved root cause is now classified as `stale index reuse`.
- The earliest proven failure boundary is the mailbox-index freshness / checkpoint layer.
- No future pass should try to "fix" `1W` / `1M` by hiding, compressing, or visually removing empty periods when the real expectation is that qualifying recent data should exist.
- `ACE-038` remains preserved as accepted historical context for the narrow fixed-slot UI grammar pass.
- `ACE-037` remains preserved as accepted historical context for compressed chart-only `1D` / `Custom`.

### Execution status

- Implementation is complete in:
  - `web/src/lib/integrations/gmail/gmailMailboxIndexer.ts`
  - `web/src/app/api/integrations/gmail/mailbox-index/route.ts`
- Live mailbox-index recovery verification confirmed:
  - false-healthy recent gaps are now detected and no longer qualify as usable cached truth
  - `smart_sync` recovery now upgrades to a fresh head-of-mailbox full run when recent truth is gapped
  - accepted recovery run settled as:
    - `requested_mode = incremental`
    - `effective_mode = full`
    - `started_from_checkpoint = false`
    - `terminal_reason = recent_window_reached`
  - mailbox-index state moved from:
    - `indexed_message_count = 234539`
    - `indexed_newest_message_at = 2026-04-06T07:59:04.000Z`
    - `last_sync_status = incremental_sync_complete`
    - `sync_health = healthy`
    - `usable_with_cached_index = true`
    to:
    - `indexed_message_count = 236627`
    - `indexed_newest_message_at = 2026-04-06T13:38:57.000Z`
    - `last_sync_status = full_scan_complete`
    - `sync_health = healthy`
    - `usable_with_cached_index = true`
    - `recent_window_health.false_healthy_state = false`
    - `recent_window_health.missing_recent_days = []`
  - raw indexed mailbox truth in `gmail_messages` now restored the previously missing recent span:
    - `2026-03-30: 0 -> 180`
    - `2026-03-31: 1 -> 241`
    - `2026-04-01: 1 -> 206`
    - `2026-04-02: 0 -> 175`
    - `2026-04-03: 0 -> 170`
  - derived sender truth in `gmail_sender_stats` now restored continuity across the same span:
    - `2026-03-30: 0 -> 7`
    - `2026-03-31: 1 -> 14`
    - `2026-04-01: 0 -> 17`
    - `2026-04-02: 0 -> 12`
    - `2026-04-03: 0 -> 12`
  - live runtime/UI verification on the canonical review route confirmed:
    - `1W` final settled state:
      - `workflow_scope = 7d`
      - `compressedMode = false`
      - `granularity = day`
      - `rawBucketCount = 7`
      - `renderBucketCount = 7`
      - visible buckets now populate every day from `Mar 31` through `Apr 6`
    - `1M` final settled state:
      - `workflow_scope = 30d`
      - `compressedMode = false`
      - `granularity = day`
      - `rawBucketCount = 30`
      - `renderBucketCount = 30`
      - visible buckets now continue through late March into early April with no unexplained zero run
    - corroborating `Custom` final settled state remained aligned:
      - `sender_overview_window = custom`
      - `sender_overview_start = 2026-03-08`
      - `sender_overview_end = 2026-03-27`
      - `customWorkspace.selected_cluster = 254 senders / 1143 messages`
      - `customOverview.summary = 254 active senders / 1143 supporting messages`
  - accepted proof artifacts captured screenshot, DOM/state, and request trace for:
    - `1W`
    - `1M`
    - `Custom`
  - no UI/chart code changed in this pass
  - no `409` guard churn interfered with the accepted flow
  - Recovery Contract: `CHANGELOG.md` -> `April 6, 2026 — ACE-039 Mailbox-Index Freshness Recovery Accepted`

### Next executable step

- `ACE-039` is accepted and closed.
- Preserve the mailbox-index freshness recovery contract as the governing stable fix for recent-period `1W` / `1M` truth.
- Do not reopen UI grammar-only fixes as the primary hypothesis for `1W` / `1M` unless new live evidence disproves mailbox-index freshness as the fixed source layer.
- Post-`ACE-039` stabilization, visualization parity, and Smart Sync continuity are now governed by `ACE-040`.

## 🚀 April 6 — ACE-038 Time Context Fixed-Slot UI Grammar Recovery Accepted

### Current governing state

- `ACE-038` is now preserved as accepted historical context for the narrow Time Context fixed-slot UI grammar recovery.
- `ACE-037` remains historically correct as the accepted narrow chart-only fix for `1D` / `Custom`.
- `ACE-038` now explicitly clarifies the product grammar split for accepted Time Context surfaces:
  - `1D` and `Custom` remain compressed compare-only/chart-only continuity surfaces
  - `1W` must preserve a fixed 7-day frame with 7 visible daily buckets, including visible zero slots
  - `1M` must preserve a fixed 30-day frame with 30 visible daily buckets, including visible zero slots
- This was a UI grammar clarification only.
- This pass did **not** approve runtime/data-path changes, sender-universe changes, or newsletter parent-universe reconstruction changes.
- Workflow-driving chip architecture remains unchanged in this pass:
  - `All indexed`
  - `1Y`
  - `1Q`
  - `1M`
  - `1W`

### Execution status

- Implementation is complete in:
  - `web/src/components/runtime/GmailCleanupComponents.tsx`
- Live runtime/UI verification on the exact canonical review route confirmed:
  - `1W` final settled state preserved `compressedMode = false`, `granularity = day`, `rawBucketCount = 7`, and `renderBucketCount = 7`
  - `1M` final settled state preserved `compressedMode = false`, `granularity = day`, `rawBucketCount = 30`, and `renderBucketCount = 30`
  - visible bars stay contained within each day slot on `1W` and `1M`
  - zero days remain visibly reserved on `1W` and `1M`
  - `1D` and `Custom` remain compressed and still disclose hidden inactive periods
  - no `409` guard churn was observed during the accepted flow
- `CURRENT_STATE.md`, `TODO.md`, `PROJECT_MANAGER_CONTEXT.md`, `ACTIVE_CHANGE_EVENTS.md`, and `CHANGELOG.md` now align on:
  - `ACE-038` as the accepted fixed-slot UI grammar recovery
  - `ACE-037` as the narrow accepted historical fix
  - the explicit continuity grammar split across accepted surfaces

### Next executable step

- `ACE-038` is accepted and closed.
- Preserve this pass as historical accepted context only.
- Future `1W` / `1M` recovery work is now governed by `ACE-039`.

## 🚀 April 6 — ACE-037 Time Context Chart-Only Continuity Recovery Accepted

### Current governing state

- `ACE-037` is now completed as the narrow Time Context chart-only continuity recovery pass.
- Time Context `1D` and `Custom` now render compressed active timelines so active periods flow continuously without reserved zero-gap slots.
- Raw bucket truth remains authoritative for hover, focus, and lower-card reads.
- This pass did **not** change:
  - backend aggregation
  - route/query behavior
  - Sender Distribution / workflow totals / sender rows logic
  - workflow-driving windows:
    - `All indexed`
    - `1Y`
    - `1Q`
    - `1M`
    - `1W`
  - interpolation / synthetic continuity

### Execution status

- Implementation is complete in:
  - `web/src/components/runtime/GmailCleanupComponents.tsx`
- Live runtime/UI verification on the exact canonical review route confirmed:
  - `1D` cold load settles with no reserved visible gaps between active periods
  - sparse `Custom` settles with no reserved visible gaps between active periods
  - inactive periods are disclosed explicitly in compressed mode
  - lower-card values remain tied to raw bucket truth
  - explicit empty-state behavior appears when a compressed custom window has no active periods
  - no `409` guard churn was observed during the accepted flow

### Next executable step

- `ACE-037` is accepted and closed.
- Keep the chart-only continuity contract stable for `1D` / `Custom`.
- Do not widen this continuity adapter into workflow-driving windows or interpolation without a new approved plan.

## 🚀 April 6 — ACE-036 Gmail Marketing Classification Coverage + Sender Distribution `1W` UI Consistency Recovery Accepted

### Current governing state

- `ACE-036` is now completed as the narrow Gmail marketing-classification and Sender Distribution `1W` UI consistency recovery pass.
- `semantic.marketing_subscriptions` now rescues broader-row promotional/newsletter senders when the broader sender evidence already resolves to `subscription-senders` and the sender does not look human.
- Sender Distribution workflow-scope chips remain workflow-driving and no longer depend on detached comparison rail-package readiness to restore truthful `workflow_scope`.
- This pass did **not** change:
  - artifact publication
  - Smart Sync ingestion
  - workflow-window logic
  - route shape

### Execution status

- Implementation is complete in:
  - `web/src/lib/integrations/gmail/inboxAnalysis.ts`
  - `web/src/app/agents/[id]/operations/review/page.tsx`
- Live classification verification confirmed:
  - published `30d` marketing artifact moved `subscription-senders` from `192` to `248`
  - published `30d` marketing artifact moved `needs-review-senders` from `177` to `121`
  - live recent marketing coverage now reports `missing_promotional_days = []`
- Live runtime/UI verification on the exact canonical marketing review route confirmed:
  - Sender Distribution `1W` is clickable
  - final route settles to `workflow_scope=7d`
  - final active tab remains `sender_distribution`
  - final `1W` chip is active (`ariaPressed = true`)
  - no `409` guard churn was observed during the accepted click flow

### Next executable step

- `ACE-036` is accepted and closed.
- Return the shared-analysis lane to the already-governing next step under `ACE-032` / `ACE-030`:
  - fresh `PLAN MODE` for `1D` Time Context correction and stability

## 🚀 April 6 — ACE-035 Gmail Artifact Integrity Incremental Refresh Recovery Accepted

### Current governing state

- `ACE-035` is now completed as the narrow Gmail artifact-integrity recovery pass.
- Incremental Gmail artifact refresh now rebuilds impacted preview rows, headers, cluster summaries, and mailbox intelligence from the same projected preview dataset.
- Incremental artifact validation now counts cleanup-candidate preview rows using the same cleanup-group reference rules the mailbox-intelligence snapshot builder uses:
  - direct cleanup-group cluster ids
  - projected rows that still reference cleanup groups through `cleanup_group_source_cluster_ids`
- Integrity checks remain active and unchanged in spirit:
  - partial artifacts are still rejected
  - inconsistent preview/header states are still rejected
  - inconsistent candidate-universe counts are still rejected

### Execution status

- Backend-only implementation is complete in:
  - `web/src/lib/integrations/gmail/gmailArtifactIncrementalUpdater.ts`
- Live artifact verification confirmed:
  - Smart Sync produced a real incremental mailbox delta (`rows_after: 234516`, `growth_delta: 3`, `processed_messages: 4`, `upserted_messages: 3`)
  - `30d` and `7d` incremental artifact rebuilds published successfully with continuous daily bucket coverage
  - a live bounded incremental artifact recheck published `all_indexed` successfully as `incremental-20260405231945344`
  - `all_indexed` moved from:
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
  - live bucket continuity passed:
    - `1W / 7d` = `7` daily buckets
    - `1M / 30d` = `30` daily buckets

### Next executable step

- Gmail artifact freshness / integrity recovery is now accepted.
- Return the shared-analysis lane to the already-governing next step under `ACE-032` / `ACE-030`:
  - fresh `PLAN MODE` for `1D` Time Context correction and stability

## 🚀 April 6 — ACE-034 Gmail Analysis Rail Smart Sync Freshness Recovery Accepted

### Current governing state

- `ACE-034` is now completed as the narrow Gmail Analysis Rail freshness recovery pass.
- Successful artifact publish now clears stale failed freshness metadata for the build/version that actually published.
- Smart Sync artifact refresh planning now manages recent-scope publication rows instead of skipping missing recent scopes:
  - `7d`
  - `30d`
  - `90d`
  - `180d`
  - `365d`
  - `all_indexed`
- `unavailable_scope` remains an integrity safeguard and is preserved.

### Execution status

- Backend-only implementation is complete in:
  - `web/src/lib/integrations/gmail/gmailArtifactStore.ts`
  - `web/src/app/api/integrations/gmail/mailbox-index/route.ts`
- Repo verification confirmed stale failed freshness metadata no longer survives a later successful publish.
- Live verification confirmed:
  - recent-scope publication rows are now created/queued for the required recent windows
  - live `7d` full rebuild published successfully
  - live `7d` selected-cluster rail state no longer fails through missing publication truth
  - an injected live `refresh_failed` state on `7d` is cleared by a later successful publish

### Next executable step

- Keep the separate `all_indexed` incremental artifact integrity failure isolated from `ACE-034`:
  - `Preview row 1919a35fe8973469 references missing header semantic.marketing_subscriptions. | Mailbox intelligence candidate message count no longer matches preview rows.`
- Do not reopen the accepted recent-scope publication fix while that separate integrity lane is diagnosed.

## 🚀 April 5 — ACE-033 Protected Files Enforcement System Active

### Current governing state

- `ACE-033` is now active as a system-integrity enforcement event in the control plane.
- Protected-file read-only boundaries are now accepted operating truth for Codex execution and propagation behavior.
- Protected files must not be modified unless Oliver explicitly places them in scope for the current pass.
- The protected-file boundary now governs system-rule and turnover-layer assets including:
  - `AGENTS.md`
  - `CODEX_PROMPT_TEMPLATES.md`
  - all `SKILL.md` files
  - architect / PM turnover protocol documents
- This enforcement change is behavioral and control-plane only; it does **not** change product code or runtime behavior.

### Execution status

- Control-plane propagation is now aligned in `CURRENT_STATE.md`, `TODO.md`, and `PROJECT_MANAGER_CONTEXT.md`.
- This pass does **not** modify protected files themselves.
- Codex must now stop and request explicit Oliver approval before any protected-file edit is attempted.

### Next executable step

- Keep future execution and propagation passes inside the protected-file boundary unless Oliver explicitly scopes a protected file for edit.

## 🚀 April 5 — ACE-032 Analysis Rail PM v2 Turnover Alignment Complete

### Current governing state

- `ACE-032` is now completed as a control-plane turnover and lane-reset event.
- `Analysis Rail PM v2` is now the active lane owner for the Shared Analysis Rail / Time Context lane.
- The approved `ACE-030` architecture remains valid:
  - `1D` and `Custom` are chart-only windows
  - `All indexed`, `1Y`, `1Q`, `1M`, `1W` remain the only workflow-driving chips
- The Analysis Rail lane is no longer cleared to continue directly in `EXECUTION MODE`.
- The lane is now reset to require:
  - fresh `PLAN MODE` re-entry
  - narrow `1D` Time Context correction and stability scope
  - full Runtime/UI Closeout Contract proof on subsequent execution passes

### Execution status

- Final control-plane alignment is complete across `CURRENT_STATE.md`, `TODO.md`, `PROJECT_MANAGER_CONTEXT.md`, `CHANGELOG.md`, and `ACTIVE_CHANGE_EVENTS.md`.
- This turnover pass did **not** change product code, runtime behavior, route behavior, or accepted product architecture.
- `ACE-032` records lane ownership and execution reset only.

### Next executable step

- Start a new Analysis Rail `PLAN MODE` thread under `Analysis Rail PM v2`.
- Scope that plan to:
  - `1D` Time Context correctness and stability
  - the smallest safe path back to the approved `ACE-030` Phase 1 architecture
  - strict preservation of Sender Distribution, route/query shape, and workflow-driving chip boundaries unless newly approved

---

## 🚀 April 5 — ACE-031 Verification Hardening Control-Plane Closeout Closed

### Current governing state

- `ACE-031` is now completed as a control-plane closeout alignment event.
- The hardened runtime/UI verification standard is now accepted control-plane truth.
- The authoritative execution-rule sources already contain the hardened verification rules; this pass aligned the control plane to that already-landed state.
- This closeout confirms the governing verification model now includes:
  - Codex self-verification as the default verification authority whenever reasonably possible
  - explicit runtime target and canonical route identity requirements before runtime/UI verification
  - blocked-verification pause-and-resume behavior when authentication or operator assist is required
  - artifact-backed runtime/UI closeout proof requirements for accepted visible state
  - explicit guard-churn reporting and classification in runtime/UI closeout proof
- This pass did **not** reopen or rewrite already-correct source rule files.

### Execution status

- Final control-plane alignment is complete across `CURRENT_STATE.md`, `TODO.md`, `PROJECT_MANAGER_CONTEXT.md`, `CHANGELOG.md`, and `ACTIVE_CHANGE_EVENTS.md`.
- `ACE-031` did not change product code, runtime behavior, route behavior, or source execution-rule documents.
- No pending `ACE-031` implementation or source-rule rewrite work remains.

### Next executable step

- `ACE-031` is closed.
- Continue from the turnover-reset shared-analysis lane tracked under `ACE-032`:
  - `PLAN MODE` for `1D` Time Context correction and stability under `Analysis Rail PM v2`

---

## 🚀 April 4 — ACE-029 Accepted-Fix Recovery Contract Hardening Closed

### Current governing state

- `ACE-029` is now completed as a docs/process control-plane hardening event.
- The Accepted-Fix Recovery Contract system is now active and enforced across:
  - `CHANGELOG.md`
  - `AGENTS.md`
  - `CODEX_PROMPT_TEMPLATES.md`
  - `system_overview.md`
  - `implementation_pass`
  - `change_propagation_pass`
  - `turnover_pack_builder`
  - `PROJECT_MANAGER_CONTEXT.md`
  - `Project Manager Activation & Turnover Protocol.md`
- `CHANGELOG.md` is the authoritative recovery ledger for accepted fixes.
- `CURRENT_STATE.md` and `TODO.md` remain active-truth and next-step continuity documents; they do not store full Recovery Contracts.
- Completed ACE entries must point to the corresponding `CHANGELOG.md` recovery contract when an accepted fix is closed.

### Execution status

- Final control-plane alignment is complete across `CURRENT_STATE.md`, `TODO.md`, `PROJECT_MANAGER_CONTEXT.md`, and `ACTIVE_CHANGE_EVENTS.md`.
- `ACE-029` did not change product code, product behavior, or active product-lane scope.
- No pending `ACE-029` implementation work remains.

### Next executable step

- `ACE-029` is closed.
- Continue from the separately governed product lanes already tracked in the control plane.

## 🚀 April 4 — ACE-030 Sender Overview `1D` / `Custom` Chart-Only Architecture Logged

### Current governing state

- The approved Sender Overview architecture is now explicit:
  - `1D` and `Custom` are approved as chart-only windows
  - existing accepted chips remain workflow-driving:
    - `All indexed`
    - `1Y`
    - `1Q`
    - `1M`
    - `1W`
- `Phase 1` is now the committed next execution step.
- `Phase 1` is limited to Time Context only.
- `Phase 1` does **not** approve:
  - Sender Distribution chart-window rendering for `1D` / `Custom`
  - `workflow_scope` expansion
  - `analysis_scope` expansion
  - route/query changes
- Sender Distribution `1D` / `Custom` chart-window rendering is explicitly deferred to a later phase.

### Execution status

- This was a docs-only control-plane alignment pass.
- No product code, route behavior, or query behavior changed in `ACE-030`.
- Control-plane ambiguity about the next shared-analysis step is now removed.
- The active shared-analysis execution phase is now:
  - `Phase 1 — Time Context chart-only window implementation`

### Next executable step

- Execute `Phase 1 — Time Context only` implementation for Sender Overview.
- Implement `1D` and `Custom` as chart-only windows in Time Context while keeping:
  - `All indexed`, `1Y`, `1Q`, `1M`, `1W` as the only workflow-driving chips
  - Sender Distribution unchanged in this phase
  - no `workflow_scope` or `analysis_scope` expansion
  - no route/query changes

## 🚀 April 4 — ACE-028 Sender Distribution Monthly `30d` Truth Fix Accepted

### Current governing state

- `ACE-027` is now completed and PM-verified as the narrow Sender Distribution scope-congruency pass.
- Sender Distribution now shows the accepted visible chip grammar:
  - `All indexed`
  - `1Y`
  - `1Q`
  - `1M`
  - `1W`
- Visible `2M` and `6M` are now removed from Sender Distribution UI only.
- `1D` and `Custom` were not part of the accepted Sender Distribution grammar in `ACE-027`; chart-only treatment is now approved separately under `ACE-030`.
- `ACE-028` is now completed and PM-verified as the narrow Sender Distribution monthly `30d` truth correction.
- Exact implementation scope for the accepted monthly truth fix:
  - `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts` only
- Exact accepted correction:
  - `loadGmailSenderDistributionForTenant(...)` now excludes `analysisScope === '30d'` from the persisted snapshot shortcut
  - Sender Distribution `1M` now falls through to the same truthful non-snapshot path already used by workspace truth
- This accepted monthly truth fix did **not** change:
  - Time Context
  - backend/API contracts
  - route/query shape
  - `OperationsAnalysisScope`
  - Decision Mode semantics
  - pagination
  - sender ordering logic
  - lower-card anchoring
  - `1W`, `1Q`, `1Y`, or `all_indexed`

### Execution status

- PM verification confirmed on the protected-trusted review route:
  - Sender Distribution `1M` now shows `48`
  - the workflow below shows `48`
  - Time Context `1M` remains correct
  - the primary monthly mismatch is resolved
- The accepted Sender Distribution monthly truth fix is narrow and backend-only.
- Separate performance follow-up item only:
  - `1Y` still has a significant workflow-load delay; `1Q` is slower than ideal but materially better; `1W` is near-instant. This is a separate future performance diagnosis item and not part of the accepted monthly `30d` Sender Distribution truth fix.

### Next executable step

- Shared-analysis next-step ambiguity is now resolved under `ACE-030`.
- Execute `Phase 1 — Time Context only` implementation for chart-only `1D` / `Custom`.
- Keep Sender Distribution `1D` / `Custom` rendering deferred to a later phase.

---

## 🚀 April 3 — ACE-026 Time Context Pass 1 Scope Congruency Accepted

### Current governing state

- `ACE-026` is now accepted and PM-verified as the Time Context-only Pass 1 scope-congruency implementation.
- The Time Context review rail now exposes the accepted visible scope grammar:
  - `All indexed`
  - `1Y`
  - `1Q`
  - `1M`
  - `1W`
- The accepted Pass 1 mapping is:
  - `all_indexed -> all_indexed`
  - `last_year -> 365d`
  - `last_quarter -> 90d`
  - `last_month -> 30d`
  - `last_week -> 7d`
- `1D` and `Custom` were intentionally hidden in the accepted Pass 1 state; chart-only handling is now approved separately under `ACE-030`.
- This accepted pass is limited to the Time Context chart-scope adapter and does **not** change:
  - Sender Distribution behavior
  - Decision Mode
  - backend/API contracts
  - route/query shape
  - `OperationsAnalysisScope`
  - lower-card anchoring behavior
- Accepted truth remains preserved for:
  - `all_indexed`
  - monthly `30d`
  - weekly `7d`
  - the broad Time Context chart contract

### Validation status

- PM verification confirmed:
  - Time Context chips now show `All indexed`, `1Y`, `1Q`, `1M`, `1W`
  - `1D` and `Custom` are not visible, which is correct for Pass 1
  - `1Y` loaded and clicked-bucket filtering behaved correctly
  - `1Q` loaded and clicked-bucket filtering behaved correctly
  - `1M` still behaves correctly
  - `1W` still behaves correctly
  - `All indexed` still behaves correctly
  - Sender Distribution behavior appears unchanged
- Separate observation only:
  - newly exposed `1Y` and `1Q` scopes still have significant load-time cost
  - PM observed roughly `61s` on `1Y`
  - PM observed roughly `19s` on `1Q`

### Next executable step

- This accepted pass is complete.
- The later Sender Distribution chip-congruency and monthly `30d` truth follow-up are now accepted separately.
- The next shared-analysis execution step is now committed under `ACE-030`:
  - `Phase 1 — Time Context only` implementation for chart-only `1D` / `Custom`
- Do not widen Phase 1 into Sender Distribution rendering, `workflow_scope` expansion, or `analysis_scope` expansion.

### Explicit boundary

- `ACE-026` is Time Context only and accepted.
- `1D` and `Custom` remain outside the accepted Pass 1 workflow-driving surface; the approved next step is chart-only treatment in Time Context under `ACE-030`.
- The observed `1Y` / `1Q` load-time cost is separate from this acceptance and must not be treated as a regression to the accepted Pass 1 functional behavior.
- This pass does not reopen Cleanup Groups, runtime redesign, Sender Distribution implementation, or any already accepted parity work.

## 🚀 April 3 — ACE-025 Weekly `1W` Time Context Truth Alignment Accepted

### Current governing state

- `ACE-025` is now accepted for the narrow weekly `workflow_scope=7d` Sender Overview / Time Context coherence fix only.
- Weekly `1W` is now internally coherent on the accepted protected-trusted review route.
- The visible weekly chart and the counted sender universe now match the same visible UTC-day window semantics.
- The accepted weekly broad baseline on the tested route is now:
  - one populated visible day bucket
  - matching visible sender/workflow totals
  - coherent bucket drilldown after click
- The earlier mixed-truth weekly regression is resolved in the accepted baseline.
- This pass does **not** change:
  - monthly `30d`
  - `all_indexed`
  - label transport
  - visuals
  - backend/API contracts outside the narrow weekly row-backed correction

### Validation status

- Targeted ESLint passed for:
  - `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
  - `web/src/app/agents/[id]/operations/review/page.tsx`
- Focused TypeScript grep produced no errors for:
  - `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
  - `web/src/app/agents/[id]/operations/review/page.tsx`
- The accepted weekly verification route is:
  - `/operations/review?workflow_scope=7d&cluster_id=structural.protected_trust`
- Accepted weekly proof now records the current coherent baseline:
  - fresh Time Context base view shows one populated visible UTC-day bucket (`Mar 29 = 2`)
  - the visible weekly workflow total on that route is `2`
  - clicking the populated visible bucket settles coherently to active senders `2` and workflow total `2`
- Separate non-blocking runtime note only:
  - transient loading jitter or a temporary empty hero state can still appear during route churn
  - that runtime jitter is not part of the accepted weekly `ACE-025` fix and does not reopen it

### Next executable step

- Return the active execution focus to Cleanup Groups Lane B — review entry behavior for decomposed parents.
- Keep auto-scroll / refocus as a separate polish-only follow-up outside the accepted weekly truth fix.
- Do not reopen weekly `1W` truth alignment unless a new parity regression is observed.

### Explicit boundary

- `ACE-025` is weekly-only and accepted.
- This pass does not reopen `ACE-023` or `ACE-024`.
- This pass does not widen into monthly truth, `all_indexed`, runtime redesign, transient route-churn loading jitter, transport redesign, or visual polish.

## 🚀 April 3 — ACE-024 Time Context Lower-Card Anchoring Accepted

### Current governing state

- `ACE-024` is now accepted as completed for the narrow review-page Time Context lower-card anchoring fix.
- `web/src/components/runtime/GmailCleanupComponents.tsx` now treats the selected Time Context bucket as the authoritative lower-card anchor whenever a bucket is active.
- Hover remains preview-only:
  - the quick-read tooltip can still change on hover
  - the lower Time Context cards and interpretation rows no longer switch away from the selected bucket
- Clearing narrowed state now returns the lower Time Context cards to the existing default-focus behavior.
- This pass does **not** change:
  - review-page selection flow
  - route/session behavior
  - workflow narrowing behavior
  - monthly truth logic
  - backend/API behavior
  - chart broadness or render source

### Validation status

- PM/browser validation is now accepted for the validated protected-trusted monthly route:
  - selected bucket stays anchored after click
  - lower-card content follows the selected bucket correctly
  - hover no longer steals the lower-card anchor once a bucket is selected
  - `Clear narrowed state` returns the lower card to the existing default-focus behavior
  - monthly filtering behavior remains correct after selection
- Targeted ESLint passed for:
  - `web/src/components/runtime/GmailCleanupComponents.tsx`

### Next executable step

- Open a new narrow PLAN MODE diagnosis pass for the weekly `1W` lower-card/workflow-scope inconsistency only.
- Keep auto-scroll / refocus as separate polish-only work.

### Explicit boundary

- `ACE-024` is accepted and closed.
- The separate weekly `1W` inconsistency remains open and must not be blended into this accepted fix.
- This pass was limited to the lower Time Context anchoring behavior inside `GmailCleanupComponents.tsx` plus required documentation propagation.
- This pass did not reopen `ACE-023` and did not widen into any other Time Context, workflow, runtime, or backend lane.

## 🚀 April 3 — ACE-023 Monthly `30d` Core Truth Correction Accepted

### Current governing state

- `ACE-023` is now accepted as completed for the monthly `30d` core truth correction.
- The system is operating from the stable rollback baseline restored on April 2, 2026.
- The monthly `30d` chart/filter truth mismatch is now fixed and PM-verified on protected-trusted:
  - `2026-03-06`: `9` in chart, `9` in filtered workflow
  - `2026-03-20`: `8` in chart, `8` in filtered workflow
  - `2026-03-30`: `3` in chart, `3` in filtered workflow
- `All Indexed` still matches after click and remains preserved by the accepted correction.
- The accepted correction remains narrowly scoped to monthly `30d` core truth alignment only.

### Phase status

- Phase 1 — Monthly Trust Diagnosis: completed
- Phase 2 — Monthly Trust Correction: completed
- Phase 3 — Parity Confirmation: completed
- Phase 4 — Scope Consistency: not active under `ACE-023`
- Phase 5 — Polish: not active under `ACE-023`

### Next executable step

- Open a separate narrow PLAN MODE diagnosis pass for possible `1W` lower-card workflow-scope inconsistency.
- Keep auto-scroll / refocus as separate polish work, not part of the accepted monthly truth correction.

### Explicit boundary

- `ACE-023` remains completed and accepted.
- Remaining follow-ups are explicitly separate from the accepted monthly `30d` correction:
  - lower-card anchoring after selection (`ACE-024`)
  - possible weekly `1W` lower-card workflow-scope mismatch
  - auto-scroll / refocus polish
- `ACE-019` remains completed historical context and `ACE-023` is now completed as well.

## Historical Milestone Log

Entries below preserve earlier pass-local implementation history. If any statement below conflicts with the governing state above or `ACTIVE_CHANGE_EVENTS.md`, treat the governing state above as authoritative.

## 🚀 April 2 — Time Context Review-Page Stabilization Rollback Implemented

### What changed

- The unstable April 2 Time Context review-page parity/source-selection regression chain was rolled back in:
  - `web/src/app/agents/[id]/operations/review/page.tsx`
  - `web/src/components/runtime/GmailCleanupComponents.tsx`
- The review page is now restored to the last stable broad-chart / stable-rail baseline before today’s forward Time Context parity/source-selection fixes:
  - bucket-active chart source selection no longer uses the detached-scope broad-overview preference path
  - top summary cards and workflow-panel feedback visuals no longer pulse or mutate around pending narrowing state
  - the Time Context rail no longer re-centers the whole chart read on the clicked bucket or applies the pending selected-bucket visual treatment

### Current implemented state

- The broad chart and Time Context rail are back on the stable pre-regression render contract.
- Clicking a Time Context bucket should no longer mutate the rest of the chart presentation or apply the regressed rail styling layer.
- The original protected-trusted parity mismatch is not considered resolved in the current branch.
- Targeted lint passed for:
  - `web/src/app/agents/[id]/operations/review/page.tsx`
  - `web/src/components/runtime/GmailCleanupComponents.tsx`

### Explicit boundary

- This pass is limited to review-page rollback/stabilization code plus required control-plane propagation.
- This pass does not change backend/API bucket-membership logic, runtime/rehydrate behavior, ACE-005 scope, or introduce any new forward parity fix.
- PM live validation is still required for:
  - protected-trusted / `30d` rail stability after click
  - protected-trusted / `1M` rail stability after click
- Self-serve localhost route proof remains blocked in the current session because the review route is still auth-gated before the protected-trusted rail becomes inspectable.

---

## 🚀 April 2 — Protected-Trusted Time Context Display-State Parity Correction Implemented

### What changed

- The residual protected-trusted `5 -> 9` Time Context parity failure was corrected as a review-page display-state fix, not a server bucket-membership fix.
- On bucket-applied state, the review page now drives narrowed sender totals from the applied bucket workspace total instead of the broad sender-key-derived `sharedWorkflowSubset.resolvedSenderCount` path.
- The Time Context lower-card workflow-universe total now reads from that same applied bucket workspace total.

### Current implemented state

- Protected-trusted bucket apply now keeps the authoritative `sender_count` / `total_senders` response aligned across:
  - top summary sender total
  - Time Context lower-card workflow-scope total
  - row coverage strip totals
- The chart remains broad and unchanged.
- The existing row workflow path remains intact.
- Targeted lint on `review/page.tsx` passed with no new warnings from this pass.

### Explicit boundary

- This pass is limited to review-page display-state composition.
- This pass does not reopen backend/API bucket-membership logic.
- This pass does not change rail visuals, runtime architecture, performance behavior, or ACE-005 scope.

---

## 🚀 April 2 — Protected-Trusted Time Context Parity Correction Implemented

### What changed

- The protected-trusted Time Context parity regression is now corrected in code on the review route.
- Bucket-selected workflow membership now resolves from the same row-backed bucket truth as the visible Time Context chart instead of sender-history inference from `first_seen` / `last_activity`.
- Selecting a Time Context bucket now resets `sender_page` back to the first narrowed page so a non-zero bucket cannot inherit an invalid broad-list page and render as an empty selected state.
- The broad-rail contract remains intact:
  - Time Context stays broad in the rail
  - only the workflow below narrows

### Current implemented state

- Protected-trusted bucket apply now uses the chart-aligned sender universe for:
  - narrowed workflow totals
  - top summary sender totals
  - Decision Mode authoritative sender order
- Later-page bucket selection now restores to a valid narrowed page instead of stranding the workflow on an out-of-range page from the broader sender list.
- Targeted lint on the changed review/runtime files passed with no new warnings from this pass.

### Explicit boundary

- This pass does not redesign rail visuals.
- This pass does not widen into ACE-005, runtime architecture, performance work, or Time Context grammar/polish work.
- Live protected-trusted browser revalidation remains the required final acceptance step outside this implementation pass.

---

## 🚀 April 2 — Review-Page Narrowing Feedback Layer Implemented

### What changed

- Sender Distribution clicks, Time Context bucket clicks, and review-page narrowing/reset controls now show immediate interaction feedback on the review page.
- The review page now uses one scoped pending-interaction model across:
  - rail highlight state
  - rail status pill
  - workflow header copy
  - top summary-card pulse/loading treatment
- The April 2 follow-up correction pass cleaned up the pending presentation:
  - rail targets now register immediately with a stronger but geometry-stable pending treatment
  - Sender Distribution and Time Context remain full-scope context surfaces while the workflow below narrows
  - stacked glow / multi-outline emphasis was removed so the workflow area stays the primary updating surface
  - rail status pills remain obvious, but no longer overpower the chart
  - the workflow area still reacts immediately with a visible updating banner, brighter loading shell, and stronger in-place loading state
- The remaining April 2 rail-context correction pass fixed the actual source of the last collapse regression on the validated `3000` review route:
  - Sender Distribution now renders from the broad rail sender dataset instead of the narrowed workflow sender subset
  - Time Context now prefers the broader coverage workspace for rail context instead of falling back to the narrowed workflow workspace when sender focus is active
  - browser proof on `3000` confirmed the rail stays broad after interaction:
    - Sender Distribution remained `850` ranked slots before and after sender click
    - Time Context remained `20` visible buckets after bucket click
- Pending completion no longer relies on route change alone.
- Pending now clears only after:
  - requested route/session state is present
  - the authoritative sender universe matches that requested narrowed state
  - relevant loading states are clear

### Current accepted state

- The feedback layer is visual/interaction-only and does not change data flow.
- Reset actions clear stale narrowed highlights immediately and show `Returning to broader scope…` while the broader sender universe restores.
- Time Context Lane B parity remains intact:
  - no new rehydrate path
  - no chart/workflow mismatch contract change
  - no backend/runtime redesign in this pass

### Explicit boundary

- This pass does not change narrowing contract, backend behavior, caching, or performance architecture.
- The only behavioral correction beyond pending presentation is the render-source fix that keeps the rails bound to their intended broad-context datasets/workspaces while the workflow below narrows.

---

## 🚀 April 2 — Time Context Lane B Closeout Accepted

### What changed

- Analysis Rail / Time Context Lane B is now accepted as closed for workflow-filtering/parity behavior on the validated scoped review route.
- The accepted closeout covers:
  - bucket-to-workflow parity
  - selected-bucket authority after hover/unhover
  - duplicate authoritative-context chip/key cleanup on the validated route
- The closeout does not include broader runtime simplification and does not require removal of the cold-boot review bootstrap request.

### Current accepted state

- Lane A remains accepted and unchanged.
- Lane B is now closed for Time Context filtering/parity behavior on the validated scoped review route.
- Cold-boot `POST /api/agents/playground` remains accepted as required review-route bootstrap behavior under the current architecture and is not a Lane B blocker.
- ACE-005 remains open as a separate runtime follow-up for any residual malformed inbox-analysis caller outside the narrowed review-route chain.

### Explicit boundary

- This closeout is for Time Context / Shared Analysis Rail workflow-filtering behavior only.
- It does not close the broader Time Context grammar lock.
- It does not close ACE-005.
- It does not imply broader runtime redesign or removal of review-route bootstrap behavior.

---

## 🚀 April 2 — Review-Path Runtime Hygiene Narrowed

### What changed

- The scoped review-path inbox-analysis callers remain guarded against empty actions before fetch.
- `/api/integrations/gmail/inbox-analysis` now distinguishes empty-body runtime noise from true missing actions:
  - `reason: "empty_request_body"` when no body is received or JSON yields `null`/`undefined`
  - `reason: "missing_action"` only when a valid object exists but `action` is missing/blank
  - `reason: "invalid_json"` when a non-empty body cannot be parsed
- Inbox-analysis diagnostics now also log `body_length` and `parse_status` alongside referer/origin/body keys so transport noise is separated cleanly from real caller mistakes.
- Review-path tracing now confirms the cold-boot `/api/agents/playground` request is the review-shell runtime bootstrap request, not Time Context bucket interaction.

### Current accepted state

- The accepted selected-bucket parity fix remains intact.
- Hover/unhover selected-bucket authority remains intact.
- Duplicate authoritative-context chip/key cleanup remains intact.
- Fresh-boot real review-route sessions can still emit malformed inbox-analysis POSTs even though current checked-in callers are guarded before fetch.
- Those malformed requests are now classified as empty-body transport/runtime noise instead of being folded into `missing_action`.
- The only current source-tree callers for `/api/integrations/gmail/inbox-analysis` remain the guarded runtime clients in `operationsWorkspace.ts` and `gmailCleanupWorkspace.ts`, so ACE-005 remains focused on identifying the emitting runtime path rather than relaxing the route contract.

### Explicit boundary

- Fresh review boot still emits one successful `rehydrate_only` `POST /api/agents/playground` request in live probing.
- That request is currently proven required under the present review-route architecture:
  - `OperationsRuntimeProvider` cold-boots by calling `fetchOperationsRuntimeSnapshot`
  - `review/page.tsx` blocks on `runtime.data` / `renderRuntimeData` before it can resolve clusters, cache version, and selected workflow context
- Bucket interaction is not implicated by the scoped callers.
- This pass only separates empty-body runtime noise from true missing-action requests; it does not identify or remove the emitting caller yet.

---

## 🚀 April 1 — Time Context Lane B Single-Universe Enforcement Propagated

### What changed

- Time Context bucket selection now resolves through one explicit authoritative sender universe instead of competing with adjacent workflow filters.
- Session-only bucket state can now combine deterministically with the active workflow scope and focused sender / drilldown state without creating dual workflow truth.
- Sender rows, workflow summary, pagination totals, Sender Distribution ordering/counts, and Decision Mode queue progression now read from the same resolved ordered sender set.
- Bucket highlighting remains visual-only for the chart itself:
  - the chart stays full-scope
  - aggregation does not collapse
- The implementation preserves the locked boundaries:
  - no new route param
  - no bucket-interaction `/api/agents/playground`
  - no page-wide rehydrate
  - no Cleanup Groups identity writes
- The April 2 correction pass tightened the selected-bucket authority path:
  - selected-bucket summary cards now read from the same resolved sender universe as the narrowed workflow
  - the Time Context truth panel now restores the selected bucket after hover instead of falling back to the default/peak read
  - Sender Distribution authoritative-context chips are now deduped with deterministic keys, removing duplicate `1W`/duplicate-key rendering noise
- The April 2 selected-bucket authority correction narrowed the remaining `5 -> 9` drift:
  - bucket filtering now resolves sender membership from the same sender-level Time Context semantics as the clicked chart bucket instead of a broader row-any-message bucket match
  - selected-bucket summary/count surfaces now prefer the currently narrowed bucket workspace over broader coverage fallbacks when bucket truth is active

### Current accepted state

- Lane A Time Context truth/grammar remains accepted and unchanged.
- Lane B contract enforcement is now implemented for:
  - session-only bucket selection
  - pre-bucket route snapshot restore on `Clear narrowed state`
  - one explicit resolved sender universe across active workflow filters
  - Decision Mode queue consumption of the already narrowed authoritative workflow order
  - selected-bucket authority across summary cards and the Time Context truth panel
  - hover preview separation from selected-bucket truth
  - deterministic authoritative-context chip rendering in Sender Distribution
- Cleanup Groups accepted behavior remains locked:
  - Marketing chooser behavior
  - direct-open parents
  - review-unit integrity

### Explicit boundary

- This pass implemented the Lane B contract-enforcement layer that is now accepted.
- Lane B closeout is now captured separately as accepted workflow-filtering/parity behavior.
- Residual empty `action:""` runtime noise remains separate under ACE-005.

---

## 🚀 April 1 — ACE-012 Hot-File Merge System Hardening Propagated

### What changed

- Added `07_reference/Shared_Hot_File_Merge_Protocol.md` as the authoritative operating-model reference for shared hot-file merge work.
- Tightened merge preflight from a one-sided changed-file view to merge-base, two-sided overlap classification.
- Added the hard rule that if classification = `hot_file_integration_required`, full git merge is prohibited and the work must route to a dedicated Codex integration pass.
- Locked the default merge bias rules:
  - UI files prefer `main` unless PM overrides
  - runtime logic prefers the active worktree lane
  - imports union unless the conflict is semantic
  - types/interfaces prefer the superset, not reduction
- Added the failure escalation rule: if Codex fails the same hot-file integration twice, stop and return to PM instead of retrying blindly.

### Current accepted state

- The system still uses the same two-track model:
  - docs / control-plane sync
  - shared hot-file integration
- Shared hot-file merge work now has one authoritative detailed protocol instead of relying on checklist fragments alone.
- PM handoff for shared hot-file integration now requires a preflight packet.
- `ACE-009`, `ACE-010`, and `ACE-011` remain completed historical context and were not reopened.

### Explicit boundary

- This pass hardens documentation, routing, and execution rules only.
- No runtime, UI, schema, API, or product behavior changed in this pass.

---

## 🚀 April 1 — ACE-009 + ACE-010 Worktree Sync And Hot-File Merge Protocol Propagated

### What changed

- The operating model now separates `control-plane / documentation sync` from `shared hot-file code integration`.
- `Docs-only sync` is now the official control-plane propagation path between `main` and active worktrees in both directions.
- The system now defines an explicit `conflict recovery` workflow for aborting unsafe full merges, restoring resolved docs, and finishing docs-only sync safely.
- Shared hot files now require preflight classification before merge attempts, and Codex owns the dedicated hot-file integration workflow instead of Oliver manually reconciling those files.
- `ACE-011` remains preserved as completed historical execution context and is not reopened by this pass.

### Current accepted state

- Worktree sync is now a two-track model:
  - docs / control-plane sync
  - shared hot-file integration
- PM and Codex should use docs-only sync when the task is operating-model or control-plane propagation.
- If a full merge exposes shared hot-file overlap during control-plane alignment, the merge should be aborted and rerouted:
  - complete docs-only sync first
  - run a separate Codex-assisted hot-file integration pass afterward
- Current shared hot files explicitly include:
  - `web/src/app/agents/[id]/operations/review/page.tsx`
  - `web/src/lib/integrations/gmail/gmailCleanupWorkspace.ts`
  - `web/src/lib/integrations/gmail/inboxAnalysis.ts`

### Explicit boundary

- This pass updates documentation and operating-model truth only.
- No runtime, UI, schema, or product behavior changed in this pass.

## 🚀 April 1 — ACE-008 Codex Prompt Standardization Propagated

### What changed

- PM -> Codex non-trivial execution prompts now standardize on `07_reference/CODEX_PROMPT_TEMPLATES.md`.
- Named-skill execution now requires both `Skill` and `Skill Location` in the prompt.
- Codex skill loading is now treated as explicit execution setup, not an implied behavior.
- Verified unchanged during this propagation pass:
  - `AGENTS.md`

### Current accepted state

- The active PM -> Codex communication model remains `Oliver -> Project Manager -> Codex`.
- Non-trivial Codex tasks should be issued through the template structure, not ad hoc execution prompts.
- Documentation-only propagation work should use the change-propagation template/workflow.
- Reduced prompts remain acceptable only for truly lightweight tasks; they do not override the skill-loading requirement when a skill is named.

### Explicit boundary

- This pass standardizes documentation and execution language only.
- No runtime, UI, schema, or product behavior changed in this pass.

## 🚀 April 1 — ACE-007 Context Migration Captured

### What changed

- ACE-007 now captures the active multi-thread work that had been living only in chat.
- Control Plane + `ACTIVE_CHANGE_EVENTS.md` are now the required continuity source for future work.
- The Codex Operating System remains the active project operating model:
  - Control Plane
  - Orientation
  - Routing
  - Skills
- Verified unchanged during this propagation pass:
  - `SYSTEM_MEMORY_MAP.md`
  - `AGENTS.md`
  - `Project Manager Activation & Turnover Protocol.md.`

### Current accepted state

- Cleanup Groups multi-phase rebuild is the live current work stream:
  - Lane A is accepted for root-surface behavior.
  - Lane B is partially closed with marketing unit-only entry, review-unit integrity, spillover as a first-class unit, unit-scoped hero truth, unit-scoped decision handoff, and invalid/missing/blank unit guards.
  - Lane B final closeout remains open.
  - Lane C has not started.
- Analysis Rail / Time Context / Charts is the parallel worktree stream:
  - Lane A Time Context rebuild is implemented.
  - Row-backed monthly aggregation, same-array truth enforcement, non-additive bucket truth, axis readability improvements, and ghost-slot rendering are part of current reality.
  - Lane B is accepted as closed for workflow-filtering/parity behavior on the validated scoped review route.
  - The broader Time Context grammar lock remains open as separate follow-up work.
  - ACE-005 runtime-noise investigation remains open and separate from the Lane B closeout.
- Current active boundaries remain explicit:
  - no new taxonomy work
  - no root-surface redesign
  - no artifact redesign
  - focus stays on correctness, propagation, and system stability

### Explicit boundary

- This pass migrates and aligns system context only; it does not implement new product or runtime behavior.
- Historical milestone entries below are preserved as lane-local snapshots. If any statement below conflicts with this section or `ACTIVE_CHANGE_EVENTS.md`, treat ACE-007 and the control plane as authoritative current reality.

## Historical Milestone Log

Entries below preserve earlier pass-local acceptances and closeouts. They remain useful for reconstruction, but they do not override the active ACE-007 continuity snapshot above.

## 🚀 March 31 — Shared Analysis Rail Time Context Truth-Reconciliation Pass Accepted

### What changed

- The scoped Time Context truth-reconciliation pass is now accepted for the validated Shared Analysis Rail routes.
- `All Indexed` Time Context now reads like a truthful monthly selected-cluster timeline instead of a tiny recent slice on the validated routes.
- `1M` and `1W` remain browser-valid in the validated cases.
- Focused-bucket truth now appears materially aligned with rendered bucket data in the validated cases.

### Current accepted state

- Accepted only for the scoped Time Context truth-reconciliation target.
- Validated routes include:
  - `structural.unresolved`
  - `structural.protected_trust`
  - `semantic.marketing_subscriptions`
- `All Indexed` monthly truth is materially reconciled on those validated routes.
- `1M` and `1W` remain browser-valid in the validated cases.
- No Lane B bucket-driven workflow narrowing behavior was mixed into this pass.
- No route-shape or API-shape widening was introduced in this pass.

### Explicit boundary

- The broader Time Context rebuild remains open.
- This acceptance does **not** close:
  - full Time Context grammar lock
  - filtering-contract lock
  - bucket-driven workflow narrowing
  - interactive chart/workflow parity proof
- Residual empty `action:""` inbox-analysis runtime noise remains open as a separate follow-up and was **not** closed by this pass.

## 🚀 March 31 — Cleanup Groups Lane B Review-Page Unit Truth Accepted

### What changed

- Accepted the narrow Marketing review-page unit-truth correction inside the current **Lane B** review-entry lane.
- Valid Marketing review-unit routes now render unit-scoped hero / top-summary truth instead of broad-parent truth.
- Decision handoff truth is now unit-scoped for valid Marketing review-unit routes.
- `spillover / exceptions` is now accepted as a first-class Marketing review unit at both:
  - review-entry behavior
  - top-summary / hero truth
- Marketing chooser-only parent entry remains preserved.
- Direct-open parents remain preserved.

### Explicit boundary

- This accepted pass did **not** change:
  - Cleanup Groups root-surface behavior
  - taxonomy
  - artifact publication
  - direct-open parent design
- No root-surface, taxonomy, or artifact redesign happened in this pass.
- Residual empty-action inbox-analysis runtime noise remains open as a separate follow-up and was **not** closed by this acceptance:
  - `{"action":"","status":400,"ok":false}`

### Current accepted state

- Cleanup Groups planning Phases 1–4 remain accepted and locked.
- Cleanup Groups Lane A remains implemented and accepted.
- Cleanup Groups Lane B remains active, but is not yet closed.
- The spillover review-unit integrity correction is accepted within Lane B.
- The Marketing review-page hero / handoff truth correction is accepted within Lane B.
- Marketing chooser-only parent entry remains preserved.
- Direct-open parents remain preserved.

## 🚀 March 31 — Cleanup Groups Lane B Spillover Review-Unit Integrity Accepted

### What changed

- Accepted the narrow Marketing review-unit integrity correction inside the current **Lane B** review-entry lane.
- Valid Marketing review units now render coherent selected-state and scoped workflow behavior.
- `spillover / exceptions` now functions as a first-class Marketing review unit:
  - explicit selected-state banner
  - coherent scoped workflow
  - matching sender count surfaced in the live review state
- Marketing chooser-only parent entry remains preserved.
- Direct-open parents remain preserved.

### Explicit boundary

- This accepted pass did **not** change:
  - Cleanup Groups root-surface behavior
  - taxonomy
  - artifact publication
  - direct-open parent design
- No new Cleanup Groups implementation lane started in this pass.

### Current accepted state

- Cleanup Groups planning Phases 1–4 remain accepted and locked.
- Cleanup Groups Lane A remains implemented and accepted.
- Cleanup Groups Lane B is active, but not yet closed.
- The spillover review-unit integrity correction is accepted within Lane B.
- The next unresolved implementation target remains the next explicitly scoped Lane B follow-up thread.

## 🚀 March 31 — Cleanup Groups Lane A Implemented And Accepted

### What changed

- Implemented the narrow **Lane A** contract for Cleanup Groups root behavior only.
- `semantic.marketing_subscriptions` now renders immediate unit-entry behavior at Cleanup Groups root.
- Marketing no longer exposes a broad-parent root review-entry path:
  - no root `Open group` path on the Marketing card
  - no Marketing broad-parent shortcut from root-level recommendation / intent shortcuts
- Marketing parent review entry is now guarded:
  - parent URL renders choose-unit state
  - invalid unit URL renders unavailable-unit state
  - broad-parent fallback is blocked
- Direct-open parents were preserved as honest direct-open parents:
  - `structural.backlog`
  - `structural.unresolved`
  - `structural.protected_trust`
  - `secondary.account_updates`
  - `context.historical`
- No chooser/interstitial was introduced for direct-open parent URL entry.

### Current accepted state

- Cleanup Groups planning Phases 1–4 are accepted and locked.
- Cleanup Groups Lane A is implemented and accepted.
- Marketing is the only root-decomposed parent.
- Direct-open parents remain visually and behaviorally direct-open.
- Lane B is active, with spillover review-unit integrity accepted but the lane not yet closed.

### Explicit boundary

- Lane A changed only Cleanup Groups root-entry behavior plus the locked Marketing parent-route guard.
- This lane did **not** begin Lane B.
- This lane did **not** reopen taxonomy, artifact generation, alias behavior, or generalized review-page redesign.
- The accepted Lane A caveat remains:
  - the unit-review hero counters were still placeholder `—` in the captured snapshot
  - root-entry and route-guard browser proof was sufficient for Lane A acceptance


## 🚧 March 31 — Cleanup Groups Unit-First Pass Rolled Back

### What changed

- Live UI validation found a regression in the latest Cleanup Groups unit-first enforcement pass.
- That pass was rolled back narrowly to the immediate pre-unit-first / post-canonical-presentation state.
- The rollback removed only the rejected unit-first interaction layer:
  - parent chooser-only enforcement
  - review-page `Review Unit Required` guard
  - `review_unit_reason_filter` request plumbing added for that pass
- The rollback preserved the already accepted behavior:
  - canonical publish remains live
  - canonical Cleanup Groups labels and fixed section structure remain in place
  - alias normalization remains intact
  - `retail-commerce-senders` remains redirect-only

### Current accepted state

- Cleanup Groups root is back on the last known-good canonical surface before the rejected unit-first pass.
- Direct parent-open review behavior is restored.
- `semantic.marketing_subscriptions` and `structural.protected_trust` review routes load normally again.
- `secondary.system_notifications` and `system-notification-senders` still normalize to `secondary.account_updates`.
- Future Cleanup Groups decomposition work is paused pending a phased re-plan.


### Explicit boundary

- This rollback lane restored stability only.
- It did **not** begin the next Cleanup Groups decomposition / redesign phase.

## 🚧 March 31 — Cleanup Groups Structural Rebuild Planning (New Baseline)

### What changed

- Cleanup Groups is now intentionally paused at the restored pre-unit-first / post-canonical-presentation baseline.
- A new planning phase has been initiated: **Cleanup Groups Rebuild Phased Execution Plan**.
- The system is no longer attempting incremental fixes to legacy group structures.
- The focus has shifted from:
  - fixing existing cleanup groups
  - renaming / relabeling / surface adjustments
  to:
  - defining a clean, artifact-driven **full inbox re-evaluation and structural decomposition plan**.

### Current reality (important)

- Cleanup Groups are still functionally the **same underlying sender groupings**:
  - `Marketing subscriptions ≈ 850`
  - `Backlog ≈ 993`
  - `Unresolved ≈ 1115`
  - `Protected trust ≈ 1840`
  - `Account updates ≈ ~30`
  - `Historical ≈ ~40`
- The canonical work completed so far:
  - fixed naming
  - fixed section structure
  - fixed identity + alias behavior
- BUT:
  - **no structural decomposition has actually happened yet**
  - the first-step workflow is still effectively “flat” for large groups

### Key insight (locked)

- The previous work was **identity + correctness work**, not **structural transformation**.
- What is missing is a true:
  - inbox-wide re-evaluation
  - artifact-backed regrouping
  - decomposition into smaller, actionable units

### Explicit boundary

- We are no longer iterating on the existing groups directly.
- We are designing a **new decomposition model first**, then implementing it in controlled phases.
- No new Cleanup Groups implementation work should proceed without the new phased plan.
- Planning Phases 1–4 are now complete, and Lane A is the only accepted implementation lane so far.

## 🚀 March 31 — Cleanup Groups Canonical Publish Live

### What changed

- The explicit canonical publish command now completes cleanly and writes its proof payload without crashing.
- The workspace/access acceptance harness now distinguishes between:
  - archive-capable published clusters, which must produce archive impact
  - `context.historical`, which is valid archive-no-op behavior when preview rows are out-of-inbox only
- Canonical cleanup-group publish was rerun successfully for:
  - `full-mailbox-20260330155423600`
- Post-publish validation passed:
  - live audit
  - workspace/access acceptance
  - canonical / alias route matrix
- No rollback was needed in the final lane.

### Current accepted state

- Canonical cleanup-group artifact publish is live.
- `published_version` is `full-mailbox-20260330155423600`.
- `secondary.account_updates` is the canonical live secondary identity.
- `secondary.system_notifications` and `system-notification-senders` normalize safely to `secondary.account_updates`.
- `retail-commerce-senders` remains redirect-only and does not reopen as a live group.

### Explicit boundary

- This lane fixed only:
  - the publish / rollback proof-writing crash
  - the `context.historical` workspace acceptance failure
- It did **not** reopen taxonomy, identity design, route design, redirect design, or artifact mechanics beyond those two fixes.

## 🚀 March 30 — Cleanup Groups Canonical Cutover Preparation Implemented

### What changed

- Canonical cleanup-group publish logic is now implemented for the approved artifact surfaces.
- Secondary canonical identity is now locked in code as `secondary.account_updates`.
- Legacy alias direction is now locked in code:
  - `system-notification-senders -> secondary.account_updates`
  - `secondary.system_notifications -> secondary.account_updates`
- `retail-commerce-senders` is now redirect-only in code and no longer survives as a live runtime group.
- Artifact-backed runtime reads now normalize canonical-first with alias compatibility.
- Incremental publish is now blocked until the first full canonical rebuild exists.
- The live audit now compares against the accepted shadow baseline and correctly blocks the still-old published artifact.

### Current accepted state

- Canonical publish logic is implemented in code.
- Alias inversion is complete.
- Retail redirect-only handling is live in code.
- Runtime identity alignment is in place across the shared artifact-backed read path.
- Live publish has not happened yet.
- The current published artifact is still pre-cutover by design.

### Explicit boundary

- This thread is complete for cutover-preparation implementation only.
- It did **not** execute the first full canonical rebuild.
- It did **not** publish a new artifact version.
- The next required lane is `Cleanup Groups — First Canonical Rebuild + Publish Validation`.
- Taxonomy, UI, alias design, and runtime architecture are not reopened in that follow-on.

## 🚀 March 30 — Cleanup Groups Canonical Candidate Validated / Publish-Ready

### What changed

- The first full canonical rebuild completed successfully as an unpublished candidate:
  - `full-mailbox-20260330155423600`
  - job `full-rebuild:085c8ef7-2fd7-4842-8499-cd605e894a77:all_indexed:full-mailbox-20260330155423600`
- Review-unit publication contract drift was corrected by preferring the non-transitional source id when evaluating canonical cleanup-group source behavior.
- Preview-index integrity mechanics were corrected:
  - canonical preview replacement now completes under statement timeout
  - post-build preview row count matches finalized derived preview row count
  - candidate validator now proves no non-canonical preview rows remain
- The stale incremental publication lock remains cleared and publication prechecks remain compare-and-set ready.
- No live publish happened in this lane.

### Current accepted state

- Candidate-ready: yes
- Publish-ready: yes
- Fresh candidate build proof:
  - `ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_cleanup_canonical_candidate_build_20260330_v7.json`
- Fresh candidate validation proof:
  - `ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_cleanup_canonical_candidate_validation_20260330_v6.json`
- Fresh publication-readiness proof:
  - `ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_cleanup_publication_readiness_20260330_v2.json`
- `published_version` is still intentionally pinned to `full-mailbox-20260329092447406` until explicit approval.

### Explicit boundary

- This lane proved publish readiness only.
- It did **not** flip `published_version`.
- The next step is the explicit publish command plus immediate post-flip live validation.

## 🚀 March 30 — Cleanup Groups Taxonomy Shadow Validation Passed

### What changed

- Cleanup taxonomy shadow rediscovery ran successfully against pinned artifact `full-mailbox-20260329092447406`.
- The approved artifact-driven taxonomy and assignment model validated cleanly:
  - sender coverage preserved at `4,879 / 4,879`
  - no duplicate parent membership
  - only `7` sender movements, all from retired `retail-commerce-senders`
- Review-unit decomposition validated across:
  - `semantic.marketing_subscriptions`
  - `structural.backlog`
  - `structural.protected_trust`
  - `structural.unresolved`
- Cross-surface projection and shadow publish gates both passed.

### Current accepted state

- The next-generation cleanup taxonomy is validated in shadow.
- The new assignment model is validated in shadow.
- `retail-commerce-senders` is confirmed removable in shadow with safe redistribution.
- No live artifact publish happened in this lane.
- No runtime cutover happened in this lane.

### Explicit boundary

- This thread is complete as a shadow validation lane only.
- The next step is a separate canonical publish / safe cutover thread.
- Taxonomy design is not reopened in that follow-on.
- UI work is not part of that follow-on.

## 🚀 March 30 — Cleanup Groups Rediscovery Lane Complete

### What changed

- Cleanup Groups rediscovery / artifact-driven restructure is now complete for the scoped roadmap.
- The canonical cleanup-group runtime model is live.
- Cleanup Groups UI now uses the canonical lane-first structure in production.
- Workflow integration is live across Intelligence, Review, memory persistence, destination execution, and Management reopen handling.
- Alias / canonical hardening is complete and the compatibility window remains intentionally open.
- The future canonical-publish artifact switch is prepared, but remains default-off and was not activated in this lane.

### Current accepted state

- Cleanup Groups Phases A through E are complete.
- Canonical runtime cleanup-group identity is now the live workflow contract.
- Lane-first Cleanup Groups UI is live.
- Workflow integration is live.
- No sender membership drift occurred during the migration lane.
- No hard URL normalization shipped as part of this lane.
- No artifact rebuild or canonical-publish activation shipped as part of this lane.

### Explicit boundary

- This migration lane is complete for the approved scope.
- Deferred as separate future slices:
  - Cleanup Groups card-compression / summary-first UI refinement
  - any later alias-retirement decision after the compatibility window
  - any later activation of the prepared canonical-publish artifact switch

## 🚀 March 30 — Cleanup Groups Rediscovery Phase C Complete

### What changed

- Cleanup Groups UI now renders from the canonical lane-first structure.
- The live page now uses the locked lane order:
  - `Action`
  - `Backlog`
  - `Coverage`
  - `Secondary`
  - `Context`
- The rollout-1 surfaced canonical set is now live:
  - `semantic.marketing_subscriptions`
  - `structural.backlog`
  - `structural.unresolved`
  - `structural.protected_trust`
  - `secondary.account_updates`
  - `context.historical`
- `Secondary` and `Context` are collapsed by default.
- Review units remain nested inside parent groups.
- The live audit harness now validates the canonical cleanup-group runtime contract and still verifies legacy/transitional compatibility.

### Current accepted state

- Cleanup Groups Phase C is complete.
- Cleanup Groups now uses the canonical lane-first structure in UI.
- Secondary/context default collapse is live.
- Canonical cleanup-group ids are now the surfaced UI contract.
- No sender membership drift occurred.
- No hard URL normalization shipped in this phase.

### Explicit boundary

- This lane shipped the Cleanup Groups UI migration only.
- It did **not** ship:
  - workflow integration across Intelligence / Review / Management
  - canonical persistence / management reopen integration
  - card-compression / expand-collapse refinement
  - new query systems
  - sender membership changes
- Phase D is workflow integration.
- Card-compression / detail-collapse refinement remains a future UI follow-on slice after workflow integration.

## 🚀 March 30 — Cleanup Groups Rediscovery Phase A Complete

### What changed

- Cleanup Groups now has a single canonical registry in `web/src/lib/runtime/gmailCleanupClusterIdentity.ts`.
- The registry now owns:
  - canonical ids
  - alias mappings
  - lane
  - group type
  - surfaced status
  - display priority
  - primary-entry eligibility
- The cleanup-cluster resolver now returns canonical descriptor metadata alongside the existing runtime-compatible identity fields.
- `web/src/lib/runtime/gmailCleanupWorkspace.ts` received only the minimal type-safe identity propagation support required for Phase A.

### Current accepted state

- Cleanup Groups Phase A is complete.
- Canonical registry ownership is centralized and no second registry was introduced.
- Alias layer support now exists for rollout-1 normalization.
- No sender membership drift occurred.
- No Cleanup Groups UI behavior changed yet.
- No workflow behavior changed yet.
- No URL behavior changed yet.

### Explicit boundary

- This lane established the canonical registry and alias layer only.
- It did **not** ship:
  - runtime canonical-write normalization
  - UI migration
  - workflow integration changes
  - review-unit rendering changes
  - artifact rebuild work
- Phase B is runtime identity normalization.

## 🚀 March 30 — Shared Analysis Rail Phase 1 Foundation Complete

### What changed

- Sender Overview now has a shared tabbed analysis rail shell with:
  - `Time Context`
  - `Sender Distribution`
- `review/page.tsx` now owns the shared workflow-subset contract as page-session normalized truth for:
  - chart context
  - workflow list integration
  - guided Decision Mode handoff
- `review/page.tsx` also remains the only owner of active rail tab state and no-rehydrate safeguards.
- `GmailCleanupComponents.tsx` stayed presentation-only.

### Current accepted state

- Shared Analysis Rail Phase 1 foundation is complete.
- The tabbed rail shell exists and is live.
- Sender Distribution is still placeholder-only by design in this phase.
- No backend/API/query changes were made in this lane.
- No page-wide rehydrate behavior was introduced.
- Current Time Context rendering and timeframe-chip behavior remain unchanged.
- Current workflow list, contributor/focused-sender behavior, guided Decision Mode behavior, and the existing contributor chart below the rail remain unchanged.

### Explicit boundary

- This lane established the rail foundation only.
- It did **not** ship:
  - Sender Distribution chart logic
  - distribution ranking behavior
  - timeframe-driven workflow behavior changes
  - backend or persistence work
- Phase 2 is the actual Sender Distribution chart implementation on top of this foundation.

## 🚀 March 30 — Subscription-Senders Sender Overview Load Stability Accepted

### What changed

- The accepted load-stability lane is now closed as fixed.
- `subscription-senders` first-entry Sender Overview loading is stable again.
- The final accepted fix combined three narrow behaviors:
  - preserve the warm timeframe-switch behavior that no longer re-triggers `/api/agents/playground`
  - reuse persisted scoped cleanup snapshots for default Sender Overview workspace loads on `60d` / `90d` / `365d`
  - restore the accepted `7d` fallback so `empty_with_index_potential` resolves through fresh read-only scoped discovery instead of terminating as `unavailable_scope`
- `7d` readonly scoped discovery was also tightened so it can recover from recent-truth mismatch without loading the entire indexed corpus.

### Current accepted state

- Pages load correctly again for this lane.
- Chart timeframes open correctly.
- The earlier terminal flood / runtime churn pattern is no longer reproducing in accepted validation.
- `7d` renders again instead of falling into broken unavailable / false-empty state.
- Broader scoped views remain healthy.
- This accepted lane does **not** require any Smart Sync, artifact-publication, cleanup-group restructure, or chart-redesign follow-up to stay valid.

### Runtime / browser proof now locked

- Final terminal proof showed:
  - `7d -> readonly_scoped_discovery`
  - `7d scope_resolution -> snapshot_ready`
  - `runtime_state_total_ms ~ 8.9s`
  - `preferred_cluster_review_bootstrap_ms ~ 5.7s`
- Final broader-scope proof for `subscription-senders` showed:
  - `60d ~1.5s`
  - `90d ~1.6s`
  - `365d ~2.1s`
  - scoped snapshot reuse remained applied
  - `rejected_candidate_count_mismatch` was gone on the accepted default overview path
- Final browser proof on `localhost:3000` showed:
  - `subscription-senders` cold first usable at about `4.7s`
  - `protected-trusted-senders` cold first usable at about `5.5s`
  - no `Failed to load sender workspace`
  - `7d` present as `ready` in runtime-selected cluster rail family for both lanes

### Explicit accepted boundary

- Accepted for this thread:
  - stable first-entry Sender Overview loading for `subscription-senders`
  - preserved `7d` rail recovery
  - preserved faster scoped timeframe switching behavior
  - removed broken runtime churn / regression patterns that were surfacing in this lane
- Explicitly non-blocking for this thread:
  - sparse daily-bar density when recent data is honestly sparse
  - any future presentation/product decision about zero-activity day rendering

## 🚀 March 29 — Sender Overview 7-Day Rail Bootstrap Recovery Accepted

### What changed

- The remaining `1W` Sender Overview failure was traced to selected-cluster rail bootstrap, not Smart Sync freshness and not artifact publication.
- Runtime was reusing a persisted scoped cleanup snapshot that was structurally valid but semantically invalid for current indexed coverage:
  - `visible_cluster_count === 0`
  - indexed coverage already supported non-zero `7d` cluster discovery
- Selected-cluster rail bootstrap now rejects persisted scoped snapshots when they are:
  - expired
  - behind current indexed coverage
  - empty despite indexed coverage showing non-zero cluster potential
- Rejected or missing unpublished scoped snapshots now fall through to read-only scoped discovery with no artifact-layer or persistence-side effects.

### Current accepted distinction

- For this tenant, `7d` should show daily bars right now.
- The prior `snapshot_outside_timeframe` / zero-cluster `1W` result was false-empty, not honest-empty.
- Honest `1W` comparison-only remains acceptable only when fresh scoped discovery truly excludes the selected cleanup group.
- Some live `7d` charts currently render only `2–3` visible day bars.
- That is accepted as non-blocking for this lane and is currently treated as likely honest daily activity visibility, not proof of a broken `7d` bootstrap.
- Whether the chart should render all seven calendar days including explicit zero-activity days remains a separate presentation/product question.
- The `24`-month historical cutoff remains expected bounded-backfill behavior and is unrelated to this fix.

### Thread status

- The `7d` Sender Overview rail lane is accepted as recovered.
- The fix remains isolated to selected-cluster rail bootstrap in `runtimeStateService`.
- Artifact publication, Smart Sync, mailbox-index recovery, and Slice 2 cleanup-group promotion work all remain out of scope for this closed lane.
- The later `subscription-senders` load-stability follow-up is now also accepted as closed in its own lane.

### Runtime validation proof

- Published artifact state remained unchanged:
  - `published_version = full-mailbox-20260329092447406`
- Live runtime proof after the fix showed `7d` resolving `ready` with `day` granularity and visible cluster count `7` for:
  - `subscription-senders`
  - `protected-trusted-senders`
  - `needs-review-senders`
  - `historical-out-of-inbox-senders`
- First-pass bootstrap evidence showed the stale empty `7d` snapshot rejected with:
  - `persisted_snapshot_rejected_reason = empty_with_index_potential`
- Runtime then fell through to:
  - `snapshot_source = readonly_scoped_discovery`

## 🚀 March 29 — Cleanup-Group Legacy Rollup Compatibility Restored

### What changed

- Narrow stabilization fix shipped for the live Gmail artifact-backed cleanup-group read path.
- Root cause was a backward-compatibility break between:
  - legacy published `semantic_rollup` payloads
  - new Slice 2 nested fields:
    - `surface`
    - `promotion`
    - `review_unit_plan`
- Runtime parsing could reconstruct a legacy rollup without those nested fields, then later mirror logic dereferenced `rollup.surface.tier` as if it were always present.
- Fixes now in place:
  - `gmailSemanticRollupContract.ts`
    - compatibility-normalizes legacy rollups before mirroring/validation
    - no longer throws when `semantic_rollup.surface` is absent
  - `gmailCleanupWorkspace.ts`
    - parses nested Slice 2 metadata when present
    - repairs legacy rollups when nested Slice 2 metadata is absent
    - builds cleanup-group mailbox intelligence from normalized parsed analytics instead of assuming mirrored surface fields already exist on the artifact row

### Why it mattered

- This was a live P0 regression:
  - `Sender Overview` cleanup-group loads could fail with `Failed to load sender workspace`
  - `/api/agents/playground` could 500 on the same semantic-rollup mirror path
  - safe-partial fallback could degrade valid artifact-backed groups to zeroed workspace truth
- The correct response was a narrow read-path compatibility repair, not broader Slice 2 rollout work.

### Validation status

- Targeted lint ran on the touched files:
  - `0` errors
  - `4` pre-existing warnings in `gmailCleanupWorkspace.ts`
- Live browser validation on `http://127.0.0.1:3000` succeeded for:
  - `subscription-senders`
  - `system-notification-senders`
  - `protected-trusted-senders`
  - `needs-review-senders`
  - `historical-out-of-inbox-senders`
- Live browser-backed `POST /api/agents/playground` returned `200` during the stabilized intelligence mount.

### Current rule

- Legacy published Gmail artifacts must remain readable even when Slice 2 nested cleanup-group metadata is absent.
- Any new Slice 2 schema expansion must be parse-safe and optional before it is allowed to flow through live artifact-backed runtime paths.
- Forward Slice 2 regrouping work is paused until this stabilization baseline is accepted.

## 🚀 March 29 — Operations Runtime Pressure Incident Resolved + Current Guidance

### What changed

- Root cause summary:
  - the artifact-backed architecture remained broadly correct
  - pressure came from two combined hot-path problems:
    - unnecessary rehydrate triggers in `OperationsRuntimeContext`
      - warm cached remount could force rehydrate
      - focus / visibility could force rehydrate without a change-driven reason
    - timeout-prone preferred-cluster cleanup snapshot lookup behavior in `runtimeStateService`
  - combined effect:
    - repeated `/api/agents/playground` pressure
    - degraded selected-cluster bootstrap on preferred-cluster rehydrates
- Fixes now in place:
  - `OperationsRuntimeContext` trigger regression removed:
    - warm cached remount no longer forces rehydrate
    - focus / visibility no longer force rehydrate without a change-driven reason
  - preferred-cluster snapshot timeout path fixed in `runtimeStateService`:
    - cache-first scoped cleanup snapshot lookup
    - supporting `agent_events` cleanup-snapshot lookup indexes added
      - `20260329131500_agent_events_cleanup_snapshot_lookup_indexes.sql`
  - selected-cluster rail bootstrap optimization was already shipped and remains part of the stable path:
    - cache / versioned rail-family reuse for repeated preferred-cluster rehydrates

### Why it mattered

- The incident looked like a Supabase capacity problem, but the main failure mode was trigger multiplication plus a timeout-prone hot lookup.
- One degraded preferred-cluster runtime lookup was enough to slow or fail selected-cluster bootstrap and make the whole system appear underprovisioned.
- The correct response was to keep the artifact-backed architecture, remove unnecessary rehydrate triggers, and harden the `agent_events` lookup path feeding selected-cluster review bootstrap.

### What to watch next

- Stay on the upgraded Supabase tier for now.
- Treat `/api/agents/playground` as a hot path.
- Treat `agent_events` cleanup snapshot lookup as a hot-path dependency.
- Future runtime changes must capture before / after timing for:
  - total rehydrate
  - `cleanup_plan_ms`
  - `selected_cluster_rail_family_load_ms`
  - `preferred_cluster_review_bootstrap_ms`
- Warm-path validation is mandatory:
  - validate repeated rehydrate behavior
  - do not rely on cold-load validation alone

### Current accepted product state

- Sender Overview timeframe behavior is currently accepted as correct.
- `subscription-senders` UI / productization validation is accepted.
- `subscription-senders` remains one cleanup group in the current artifact-backed model; no taxonomy split shipped.
- Cleanup-group restructuring into smaller artifact-defined groups remains open work.

### Lessons learned

- Do not assume a pressure incident is “just scale” before checking timeout-prone hot queries and trigger multipliers.
- One degraded runtime lookup can make the whole system appear underprovisioned.
- Runtime validation must include repeated rehydrate behavior, not only first-load behavior.

## 🚀 March 28 — Subscription-Senders Semantic Improvement Phase 3 Completed

- Exact artifact baseline used for the accepted Phase 3 pass:
  - `full-mailbox-20260327004328180`
- Scope completed:
  - surgical resolver-only pass in `gmailSenderProfile.ts`
  - production logic changes limited to:
    - `resolveSemanticPatternSelection(...)`
    - `resolveMarketingPromotionalSubtype(...)`
  - verification packet added for target-pool accounting and guardrail proof
- Locked before/after metrics:
  - resolved marketing subtype senders: `472 -> 481`
  - resolved marketing subtype coverage: `59% -> 60%`
  - unresolved promotional remainder: `327 -> 318`
  - `offer_campaign`: `252 -> 252`
  - `product_marketing_update`: `174 -> 179`
  - `editorial_newsletter`: `46 -> 50`
  - pattern clear share: `3% -> 5%`
  - headline family persistence: `provisional -> provisional`
  - headline pattern persistence: `provisional -> provisional`
- Target-pool outcome:
  - execution-start target pool: `123`
  - stayed unresolved: `114`
  - resolved to `product_marketing_update`: `5`
  - resolved to `editorial_newsletter`: `4`
  - resolved to `offer_campaign`: `0`
  - excluded by stronger concrete non-marketing evidence: `18`
  - resolved outside the target pool: `0`
- Guardrails held:
  - weak-history stayed unresolved:
    - `183` before
    - `0` resolved after
  - mixed stayed unresolved:
    - `21` before
    - `0` resolved after
  - already-resolved subtype preservation held:
    - already-resolved before: `472`
    - preserved resolved after: `472`
    - same-subtype preservation: `472`
    - downgraded / churned: `0`
  - offer anti-regression held:
    - target-pool offer gains: `0 / 9`
    - combined product + editorial gains: `9`
- Strategic consequence:
  - this Phase 3 implementation thread is complete and accepted
  - headline persistence is still allowed to remain `provisional` because the remaining blocker stayed outside the targeted pool and outside current scope
  - the correct next step is a new planning thread for subscription semantic rebuild/publication planning
  - that next thread should be limited to:
    - rebuild/publication planning
    - post-rebuild validation against the locked baseline
    - deciding whether a new split-readiness evaluation is needed after publication
  - it should explicitly not be:
    - a taxonomy-split implementation thread
    - a UI thread
    - another broad semantic tuning thread

---

## 🚀 March 28 — Subscription-Senders Split-Readiness Evaluation Completed

- Exact artifact baseline used for the accepted evaluation:
  - `full-mailbox-20260327004328180`
- Evaluation outcome:
  - `subscription-senders` is **not** split-ready yet
  - semantic blockers remain primary
  - operator evidence is still too thin to strengthen a split case
  - the approved next step is a separate `subscription-senders` semantic-improvement planning thread
- Accepted evaluation findings:
  - `subscription-senders` contains `853` senders and `69,089` cleanup-group messages in the published artifact
  - `marketing_promotional` still dominates the lane at `799 / 853` senders (`94%`)
  - published artifact resolved marketing subtype coverage remains only `244 / 799` (`31%`)
  - the published unresolved promotional remainder (`555` senders) is still larger than the strongest candidate internal seam (`offer_campaign` at `151` senders)
  - published headline subtype persistence remains `provisional`, not split-ready
  - current persisted operator evidence is still thin:
    - `16` destination profiles total for the current agent
    - only `3` intersect `subscription-senders`
    - no reviewed senders yet land in `offer_campaign`, `product_marketing_update`, or `editorial_newsletter`
- Explicit non-changes for this evaluation:
  - no resolver change
  - no schema change
  - no rebuild
  - no sender reassignment
  - no UI change
  - no lane promotion
- Strategic consequence:
  - this split-readiness evaluation thread is complete and accepted
  - future work should remain separated into:
    - semantic-improvement implementation first
    - rebuild / publication planning only after the accepted semantic pass

---

## 🚀 March 28 — Cleanup Groups Role Correction + `needs-review-senders` Reframe Completed

- Current accepted Gmail Phase 1 artifact used for this shipped pass:
  - `full-mailbox-20260327004328180`
- Scope completed:
  - Cleanup Groups lane-role language is now explicit and consistent:
    - `Primary action lane`
    - `Backlog lane`
    - `Safety / coverage lane`
  - Existing Cleanup Groups section structure remains intact:
    - `Start Here`
    - `Reduce Backlog`
    - `Exceptions & Coverage`
  - Section summaries, card support copy, and Mailbox Intelligence handoff wording now reflect the locked lane-role model.
  - Sender Overview entry framing now uses the existing bridge-copy seam to explain whether the operator is entering:
    - a default cleanup lane
    - a backlog recovery lane
    - a safety / coverage review
  - `needs-review-senders` is now explicitly framed as low-evidence safety / coverage, not as a default action lane or a coherent semantic bucket.
- Explicit non-changes for this pass:
  - no taxonomy split
  - no artifact change
  - no schema change
  - no sender reassignment
  - no recommendation-logic or ordering change
  - no rebuild
- Validation:
  - targeted ESLint passed for the touched Cleanup Groups / Mailbox Intelligence / Sender Overview files
- Strategic consequence:
  - the Cleanup Groups Phase A+B role-correction pass is now complete and accepted
  - future work on subscription semantic-improvement, taxonomy redesign gates, and rebuild planning should start in separate next-phase threads

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

- Supabase pressure is currently mitigated on the upgraded tier and latest runtime fixes.
- `/api/agents/playground` remains a hot path.
- `agent_events` cleanup snapshot lookup remains a hot-path dependency.
- Passive runtime no longer triggers heavy mailbox work on page load.
- Warm cached remounts and focus / visibility transitions no longer force rehydrate without a change-driven reason.
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
- Preferred-cluster bootstrap now uses cache-first scoped snapshot lookup, with cache / versioned rail-family reuse on repeated preferred-cluster rehydrates.
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
- Preferred-cluster bootstrap is materially better after the cache-first scoped snapshot lookup fix, but `agent_events` cleanup snapshot lookup is still a hot-path dependency that must be measured on every runtime change.
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
- No currently known trigger multiplier or timeout-prone preferred-cluster snapshot path remains on the validated warm path.
- Manual heavy operations remain available, but now require explicit action and stay inside guarded execution paths.
- Current strategic focus should stay on Sender Overview semantic truth, visualization honesty, and cleanup-group refinement, while treating future runtime hot-path changes as measurement-first work.

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

---

## Gmail Artifact Refresh Recovery State - March 29, 2026

Current mailbox-index to artifact-refresh state:

- Smart Sync is working.
- Mailbox index is current for the validated tenant:
  - `indexed_total_rows=234341`
  - `last_rows_before=234339`
  - `last_rows_after=234341`
  - `last_upserted_messages=2`
  - `last_deleted_messages=0`
- Artifact publication is no longer stranded behind the old orphaned `building_version` lock.

Current artifact liveness contract:

- `published_version`
  - last fully published artifact version served by artifact-backed readers
- `building_version`
  - candidate artifact version currently being written; not treated as live on its own
- `refresh_in_progress`
  - a refresh attempt has started and publication has moved into build mode
- `refresh_skipped_existing_build_in_progress`
  - planner decision used only when the shared liveness gate confirms a truly live build
- `refresh_completed_at=null`
  - means the current refresh attempt has not yet recorded a terminal result; this is no longer accepted as proof that work is still alive

Current build-liveness behavior:

- All artifact skip/start decisions now flow through `reconcileGmailArtifactBuildLiveness(...)`.
- Raw `building_version` alone is no longer the lock signal for:
  - mailbox-index refresh planning
  - incremental artifact refresh skips
  - stale-build reclaim decisions
- Reclaim is idempotent and safe under concurrent requests because publication updates are compare-and-set scoped to the expected stale `building_version` and `refresh_job_id`.

Current validated publication state:

- `published_version=full-mailbox-20260329092447406`
- `published_at=2026-03-29T10:03:51.301+00:00`
- `building_version=null`
- `build_status=published`
- `freshness_state=fresh`
- `freshness_reason=published_artifact_current`
- linked job:
  - `job_id=full-rebuild:085c8ef7-2fd7-4842-8499-cd605e894a77:all_indexed:full-mailbox-20260329092447406`
  - `status=completed`
  - `phase=published`

Current validation status:

- Deterministic stale-build proof confirms the same sync-completion flow now reclaims a stale build and re-plans refresh instead of skipping forever.
- Live full-mailbox publication proof confirms artifact publication advances beyond the stale pinned version:
  - before: `full-mailbox-20260328080841849`
  - after: `full-mailbox-20260329092447406`
- Runtime acceptance proof confirms artifact-backed readers now resolve the newer published artifact version instead of remaining pinned to the stale one.

---

## Cleanup Groups Canonical Cutover Mechanics State - March 30, 2026

Current scope state:

- This lane implemented cutover mechanics and validation plumbing only.
- This lane did not redesign:
  - taxonomy
  - assignment logic
  - UI
  - workflow behavior
  - alias compatibility

Current candidate-build state:

- `runGmailFullMailboxArtifactBuild(...)` now supports candidate-only completion and defaults to non-publishing behavior unless `publishResult=true` is explicitly requested by code.
- The candidate build path now:
  - creates a side-by-side full artifact version
  - stores the prebuild publication state in the resumable checkpoint
  - restores that publication state after build completion
  - leaves `published_version` unchanged
  - marks the build job `completed` with `phase=candidate_ready`
- Mailbox-index-triggered full rebuilds are explicitly pinned to candidate-only mode for this pre-cutover state.

Current validation-command state:

- Frozen shadow proof command remains available and pinned to:
  - `full-mailbox-20260329092447406`
- New unpublished candidate validation command is available and reads the requested artifact version directly without going through `published_version`.
- Live audit remains published-version-only and still validates runtime/live behavior against the currently published artifact only.

Current publication-control state:

- Explicit publish and explicit rollback paths now exist as compare-and-set publication repoint commands.
- Both paths require the caller to supply:
  - expected current `published_version`
  - expected `last_index_state_updated_at`
  - expected `last_indexed_message_count`
- Both paths refuse to proceed when publication state drifts before the repoint.
- Failed candidate rows are retained; rollback only repoints publication and does not delete candidate data.

Current readiness state:

- Candidate-ready: yes
- Publish-ready: yes

Current publish-ready proof bundle:

- Fresh candidate build proof:
  - `full-mailbox-20260330155423600`
  - `ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_cleanup_canonical_candidate_build_20260330_v7.json`
- Fresh unpublished candidate validation packet:
  - `ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_cleanup_canonical_candidate_validation_20260330_v6.json`
  - `safe_to_publish=true`
- Fresh publication-readiness packet:
  - `ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_cleanup_publication_readiness_20260330_v2.json`
  - `compare_and_set_ready=true`

Pointer-flip boundary remains:

- `published_version` has not been flipped yet.
- Explicit publish approval is still required before running the compare-and-set publish command.
