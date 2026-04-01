# Sender Overview — Validation & Corrections Tracker

## Purpose

This document tracks **active validation issues, required corrections, and resolved fixes** for the Sender Overview and Shared Analysis Rail system.

It is intentionally **sniper-focused** and exists to:
- prevent drift across threads
- give Codex precise correction targets
- separate blockers from follow-up improvements
- maintain a clean validation history

This is **not a spec document** and should not duplicate existing architecture docs.

---

## 1. Active Acceptance Blockers

Phase 2 is still **open for PM re-review**.

### B1 — Time Context full-context/parity regression
- `All Indexed` Time Context was deriving from a partial sender universe instead of the authoritative page/workflow sender universe
- chart/workflow parity was broken
- `1W` / `1M` bucket rendering became fragmented/incoherent
- semantic page hydration became unstable in local validation
- empty `action:""` inbox-analysis noise and `safe_partial` / `missing_selected_cluster_seed` stability signals must be re-checked during recovery

### Rollback Status
- The Time Context parity lane has been rolled back to the last-known-good pre-parity baseline in the current branch
- Route-backed Time Context narrowing and `1D` are no longer part of current branch behavior
- Do not begin the next forward Time Context phase until this blocker is re-planned from the restored baseline

---

## 2. Confirmed Follow-Up Fixes (Non-Blocking)

These remain valid next-pass improvements, but they are not the immediate blockers once the active count/scope regressions above are corrected.

### F1 — Load-speed optimization
- Load speed is better than before, especially on the previously broken recent-window paths
- But it is still not production-ready
- Broad groups often take around `6–11s`, and recent/small-group edge cases can still spike much higher

---

### F2 — Loading-state polish
- Loading states are improved and more intentional than before
- But slower recent-scope transitions still feel heavy and suspenseful

---

### F3 — Legacy sender concentration section
- Still present below rail
- Should be removed or demoted after Phase 2 acceptance

---

### F4 — Cleanup Groups card compression
- Cards are too long and reduce readability
- Needs future UI refinement pass

---

### F5 — Filter-state clarity
- Multi-layer state is much better now
- Still a good candidate for later UX polish once functional integrity is fully locked

### F6 — Time Context semantic-route validation cleanup
- Base-cluster parity, local clear/reset behavior, and zero-result `1D` behavior are working
- A final clean browser proof for semantic subtype route hydration is still worth capturing before this lane is considered fully closed

---

## 3. Resolved Items

### R1 — Full distribution chart implemented
- Replaced top-10 model with full sender population

### R2 — Horizontal chart grammar aligned with Time Context
- Visual model is now consistent

### R3 — Hover hit-target improved
- Bars are now reliably interactive on the visible chart body

### R4 — Ready timeframe loads working
- Validated live across ready scopes
- Chart now recomputes successfully instead of staying stuck

### R5 — False initial failure state corrected
- Protected-group entry no longer shows the red false sender-workspace failure banner during successful load

### R6 — Chart/workflow count parity corrected
- Validated cases now match on the same scope/filter universe

### R7 — Subtype/timeframe congruence corrected
- Narrowed semantic focus now survives ready timeframe changes and both surfaces stay aligned on validated cases

### R8 — Hover and bar hit-target behavior improved
- Visible bar interaction is now much more reliable during validation
- Hovering and selecting on dense charts is behaving far better than earlier passes

### R9 — Secondary / Context recent-scope parent-universe ceiling restored
- Recent-scope sender results for Secondary and Context groups are now intersected against the parent all-indexed sender universe
- Validated examples now stay within the selected-group ceiling:
  - `System notification senders`: `29` all indexed, `14` at `1M`, `1` at `1W`
  - `Historical / out-of-inbox senders`: `40` all indexed, `0` at `1M`, `0` at `1W`

### R10 — Secondary / Context chart/workflow parity restored
- For the same selected cleanup group and ready scope, Sender Distribution and the workflow now resolve to the same sender universe
- Validated live and direct-read parity:
  - `System notification senders`: `29/29`, `14/14`, `1/1`
  - `Historical / out-of-inbox senders`: `40/40`, `0/0`, `0/0`

### R11 — Zero-result recent scopes now settle quickly and clearly
- Genuinely empty recent scopes now resolve as explicit zero-result states instead of long suspense failures
- Validated on `Historical / out-of-inbox senders`:
  - `1M`: `0` senders, clear no-distribution + zero-workflow state
  - `1W`: `0` senders, clear no-distribution + zero-workflow state

### R12 — Larger-group non-regression revalidated after Secondary / Context fix
- The targeted Secondary / Context integrity guard did not regress the stronger working lanes
- Revalidated counts:
  - `Protected / trusted`: `1840` all indexed, `61` at `1M`, `3` at `1W`
  - `Subscription senders`: `850` all indexed, `224` at `1M`, `295` at `2M`

### R13 — Ready timeframe now stays preserved through semantic drilldown
- Clicking a category/subtype drilldown while already in a ready scope now layers on top of that active scope instead of silently resetting to All Indexed
- Validated live on `Marketing / promotional subscriptions`: `1M` stayed active through `Product marketing update`

### R14 — Workflow-local clear-state control now returns to the broader current scope
- A page-local `Clear narrowed state` control now lives beside the workflow summary so operators can clear drilldown state without scrolling back to the top rail
- Validated live: clearing `Product marketing update` returned the page from the focused 2-sender slice back to the broader `1M` view (`224` ranked senders)

### R15 — Tiny narrowed subsets no longer present bogus multi-page pagination
- Focused slices that only contain one page of results now suppress misleading multi-page controls
- Validated live: `Product marketing update` at `1M` rendered `2 ranked senders` with no `Previous` / `Next` controls and no fake `page 1 of 3` copy

### R16 — Empty inbox-analysis action noise not reproduced in fresh browser validation
- Fresh CDP browser validation showed no `/api/integrations/gmail/inbox-analysis` requests with `action: ""`
- Current requests in the validated drilldown flow were all explicit `sender_workspace` or `sender_distribution` actions

### R17 — Workflow-local timeframe reset added for ready-scope-only state
- The workflow section now exposes a local `Back to All indexed` control whenever a ready timeframe is active
- This lets operators return from timeframe-only filtered workflow state to the default broad view without scrolling back to the rail scope buttons

### R18 — Time Context parity lane rolled back to stable baseline
- The experimental parity pass introduced a full-context/parity regression and was intentionally removed from the current branch
- Current branch behavior is the last-known-good pre-parity Time Context baseline while recovery is validated

---

## Usage Guidelines

- Keep entries short (1–3 lines)
- Move items from blockers → resolved as they are fixed
- Do not restate full specs
- Do not add speculative ideas
- Only include issues observed in validation or confirmed by PM review

---

## Current Status

Phase 2 — **TIME CONTEXT RECOVERY / ROLLBACK BASELINE RESTORE IN PROGRESS**

The prior integrity blocker remains resolved in the current branch:
- strict recent-scope parent-universe ceiling restored
- chart/workflow parity restored
- zero-result recent scopes stabilized for the validated small-group case

Sender Distribution and workflow-state polish remain accepted and preserved.

The active blocker now sits entirely in the Time Context lane:
- rollback to stable baseline completed in current branch
- browser validation must prove baseline restoration on protected-trust and marketing-subscriptions
- next forward Time Context phase is blocked until that restored baseline is green
