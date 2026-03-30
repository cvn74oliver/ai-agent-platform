## Historical context note

This file is carrying the **active Gmail Workspace stabilization sequence**, and future Codex threads need enough context to understand what was already built before the current G-series sniper passes.

### What was completed before the current follow-up work

#### Phase A — Artifact schema + publication scaffolding
Completed earlier.
This introduced the artifact publication/job tables, sender workspace seed tables, mailbox intelligence artifact tables, preview index tables, and the first artifact store/projector/flag scaffolding.

#### Phase B — Sender Overview request-path stabilization
Completed earlier.
`sender_workspace` was moved off request-time mailbox-wide scan fallbacks and onto artifact-backed reads for the stabilized path.

#### Phase C — Mailbox Intelligence / Cleanup Groups / Pressure Trend request-path stabilization
Completed earlier.
`mailbox_intelligence`, `cleanup_group_intelligence`, and `mailbox_pressure_trend` were moved onto artifact-backed request paths instead of request-time mailbox scans.

#### Phase D — Confirmation preview / archive-scope stabilization
Completed earlier.
Confirmation preview and archive-scope resolution were moved onto artifact-backed preview/index reads so request paths no longer depended on mailbox-wide scan fallbacks.

#### Phase E — Runtime shell stabilization
Completed earlier.
Request-time runtime loading stopped doing synchronous cleanup discovery rebuilds and shifted to published-artifact or safe-partial runtime behavior.

#### Phase F — Acceptance harness + rollout proof
Completed earlier.
Repeatable acceptance scripts, rollout docs, and proof bundle support were added so stabilized request paths could be validated consistently.

### Early Phase G foundation that was also completed before the current sniper passes

#### Phase G.1–G.5 — Full-mailbox artifact production foundation
Completed earlier.
This is the work that replaced the old 100k-capped artifact production path with full-mailbox background/projector builds, coverage proof, and full-corpus artifact publication.

#### Phase G.6 — Pressure-trend artifact bucket model fix
Completed earlier.
Window-specific pressure-trend artifact bucket families were added so supported windows could use the correct published bucket family instead of filtering one all-history series.

### Why this context matters now

The current phases below are **follow-up browser-truth/debug/sniper passes** layered on top of that already-completed stabilization foundation.

Important rules for future Codex threads:
- Do **not** assume the project started at G.7.
- Do **not** delete future phases (`H`, `I`, `J`, `K`) when adding new follow-up work.
- Treat the work below as incremental repair/hardening on top of the already-completed artifact/request-path foundation.
- When troubleshooting, remember the current defects are mostly in:
  - browser/runtime snapshot reconciliation
  - UI source-of-truth split
  - queue/read contract parity
  - hydration timing / fallback behavior

This note exists to preserve troubleshooting continuity now that implementation is spanning multiple Codex threads.

---

### Phase G.7: Pressure Trend Render / Consumption Verification (Completed)

**Goal:** Prove that the pressure-trend UI is actually rendering the correct published bucket families end-to-end, not merely that the backend stores them correctly.

#### Problem
- G.6 fixed artifact bucket production and request-path selection.
- However, if the UI still shows an empty/loading chart while request logs are healthy, then the remaining issue is likely in chart consumption, response mapping, hydration, or render-state handling.
- This must be verified and fixed before moving on to incremental artifact updates.

#### Requirements
- verify end-to-end behavior for all supported windows:
  - `all_indexed`
  - `last_year`
  - `last_quarter`
  - `last_month`
  - `last_week`
  - `last_day`
- prove that the browser-visible chart receives non-empty series for each window
- verify chart rendering path for:
  - initial Mailbox Intelligence load
  - subsequent window switching
  - route/query-param changes
  - client hydration and chart-state transitions
- identify whether the remaining defect is in:
  - backend response shape
  - page-to-component mapping
  - client-side state updates
  - chart component rendering logic
  - loading/empty-state guards

#### Constraints
- keep A–G request-time guarantees intact
- no reintroduction of request-time mailbox scans
- no broad UI redesign
- fix only the pressure-trend consumption/render path and any minimal supporting plumbing required

#### Acceptance Criteria
- each supported window visibly renders bars in the UI
- no perpetual loading state remains for valid published bucket families
- browser-visible bar counts match the selected bucket family
- request logs remain artifact-only
- existing acceptance harness continues to pass unchanged

---

### Phase G.8: Sender Overview First-Paint Bounded Read Correction (Completed)

**Goal:** Ensure Sender Overview first paint uses a truly bounded artifact read and no longer requests an oversized sender page on initial load.

#### Problem
- The core artifact architecture is now correct, but Sender Overview first paint can still request an excessively large sender page.
- Logs have shown first-load behavior like:
  - `requested_page_size: 1000`
  - `returned_sender_count: 1000`
  - `duration_ms: 22106`
- This means the request path is artifact-backed but still too heavy for acceptable first paint.

#### Requirements
- identify exactly why Sender Overview initial load requests `page_size=1000`
- reduce first-paint Sender Overview reads to a small bounded default page size appropriate for fast render
- preserve the existing artifact-backed sender workspace path
- add a defensive server-side clamp so oversized first-page requests cannot silently return 1000 sender rows unless explicitly intended for a separate non-default workflow
- preserve current expand/collapse, sorting, filtering, and sender-detail behavior after first paint

#### Constraints
- no reintroduction of request-time mailbox scans
- no `loadIndexedGmailMessagesForTenant(...)`
- no `loadDerivedWorkspaceState(...)`
- no `loadMailboxContext(...)`
- no broad UI redesign
- no changes to Mailbox Intelligence, Cleanup Groups, or Decision Mode in this phase

#### Acceptance Criteria
- Sender Overview first paint no longer requests 1000 sender rows by default
- first-paint page size is explicitly bounded and documented
- cold-open duration materially improves from the prior ~22s oversized artifact read
- request logs remain artifact-only
- existing acceptance harness continues to pass unchanged

---

### Phase G.9: Sender Overview Cluster Consistency + Total Truth Correction (Attempted — Browser Verification Failed)

**Goal:** Ensure Sender Overview and Decision Mode use consistent cluster selection and correct total sender counts across all surfaces.

#### Problem
- Sender Overview and Cleanup Groups can show inconsistent sender counts for the same cluster.
- Default selected cluster (e.g., Subscription senders) may resolve to an empty or incorrect state.
- Decision Mode can inherit incorrect or zeroed data when entered from a misresolved cluster.
- Logs indicate bounded artifact reads are correct, but total-count sources and cluster resolution paths are not aligned.

#### Requirements
- fix default selected-cluster resolution so Sender Overview lands on a valid populated cluster state
- ensure Sender Overview uses the correct source of truth for total sender counts (cluster summary/header, not bounded seed-row count)
- ensure Cleanup Groups → Sender Overview → Decision Mode all agree on:
  - selected cluster
  - sender counts
  - cluster identity
- preserve bounded first-paint reads and artifact-only request paths

#### Constraints
- no reintroduction of request-time mailbox scans
- no `loadIndexedGmailMessagesForTenant(...)`
- no `loadDerivedWorkspaceState(...)`
- no `loadMailboxContext(...)`
- no broad UI redesign
- no changes to Mailbox Intelligence or Pressure Trend in this phase

#### Acceptance Criteria
- default Sender Overview load shows a valid populated cluster (no zeroed Subscription group)
- Sender Overview sender totals match Cleanup Groups totals for the same cluster
- Decision Mode entered from a cluster shows consistent sender counts and data
- no mismatch like `1,238 vs 1,000` remains
- request logs remain artifact-only
- existing acceptance harness continues to pass unchanged
- browser-visible Review and Decision metrics must match the same cluster totals shown in Cleanup Groups; harness-only proof is not sufficient

---

### Phase G.10: Browser-Truth Cluster Metrics Correction (New – Immediate Follow-Up)

**Goal:** Fix the remaining browser-visible cluster metric mismatches so Cleanup Groups, Sender Overview, and Decision Mode display the same sender/message truth for the same selected cluster.

#### Problem
- Browser verification still shows cluster metrics drifting across surfaces even after G.9.
- Known observed failures:
  - `Subscription senders` can show `134,978` in Sender Overview where the cluster’s sender count should be about `1,061`.
  - `Dormant low-attention senders` can still show `1,000` in Sender Overview while Cleanup Groups shows `1,238`.
- This means the request path is still mixing cluster message totals, sender totals, queue-size ceilings, or bounded loaded-row counts in the wrong UI fields.
- Harness-only acceptance was not enough; this phase must be browser-truth verified.

#### Requirements
- identify the exact field/source mix-up causing Sender Overview to show message totals in sender-count slots
- identify the exact field/source mix-up causing large clusters to show `1000` instead of their real sender total
- ensure Cleanup Groups, Sender Overview, and Decision Mode all use the same artifact-backed cluster truth for:
  - sender count
  - message count
  - covered / still-to-review totals
  - selected cluster identity
- preserve bounded first-paint reads and artifact-only request paths
- add browser-truth acceptance so this cannot pass again on harness-only evidence

#### Constraints
- no reintroduction of request-time mailbox scans
- no `loadIndexedGmailMessagesForTenant(...)`
- no `loadDerivedWorkspaceState(...)`
- no `loadMailboxContext(...)`
- no broad UI redesign
- no changes to Mailbox Intelligence or Pressure Trend in this phase

#### Acceptance Criteria
- `Subscription senders` shows the correct sender total in Sender Overview (sender count, not message count)
- `Dormant low-attention senders` shows the same sender total in Cleanup Groups and Sender Overview
- Decision Mode entered from those same clusters shows matching totals
- browser-visible screenshots / clickthrough proof match the reported counts
- request logs remain artifact-only
- existing acceptance harness continues to pass unchanged

---

### Phase G.11: Runtime Snapshot Invalidation + Cluster-Global Review Metrics (New – Immediate Follow-Up)

**Goal:** Eliminate browser-visible metric drift by ensuring Review and Decision Mode use fresh artifact-compatible snapshot data and cluster-global aggregates instead of bounded loaded-row math.

#### Problem
- Browser-visible mismatches are now traced to stale browser/runtime snapshot selection and page-local arithmetic.
- Known confirmed issues:
  - Review can keep an old `workspaceState.snapshot` for the same `clusterId` without checking artifact freshness/version.
  - runtime/session cache is keyed too loosely and can survive artifact publication changes.
  - `covered` and `still to review` are computed from `workspace.senders`, which may only contain the bounded preload, not the full cluster.
  - Decision Mode can treat the 12-row runtime preseed as final instead of forcing the correct full queue / aggregate path.

#### Requirements
- invalidate or bypass stale runtime/browser snapshots when artifact version changes
- stop preferring same-cluster stale snapshots without freshness/version compatibility
- make Review cluster metrics use cluster-global truth, not loaded sender rows
- make Decision Mode cluster metrics use cluster-global truth, not loaded sender rows
- ensure Cleanup Groups → Sender Overview → Decision Mode all stay consistent after artifact publication and browser navigation
- preserve bounded first paint and artifact-only request paths

#### Constraints
- no reintroduction of request-time mailbox scans
- no `loadIndexedGmailMessagesForTenant(...)`
- no `loadDerivedWorkspaceState(...)`
- no `loadMailboxContext(...)`
- no broad UI redesign
- no changes to Mailbox Intelligence or Pressure Trend in this phase

#### Acceptance Criteria
- browser-visible Subscription and Dormant cluster metrics are correct across all three surfaces
- artifact publication changes cannot leave stale cluster totals pinned in browser/runtime snapshot state
- `covered` and `still to review` are no longer derived from bounded loaded sender rows
- Decision Mode does not treat the 12-row runtime preseed as final cluster truth
- browser clickthrough proof matches reported counts
- request logs remain artifact-only
- existing acceptance harness continues to pass unchanged

---

### Phase G.12: Decision Mode Re-render Loop Hotfix (Attempted — Browser Verification Failed)

**Goal:** Remove the new browser-side re-render loop introduced after G.11 while preserving the corrected cluster-global counts, artifact freshness behavior, and artifact-only request guarantees.

#### Problem
- After G.11, browser-visible counts are finally correct across Cleanup Groups, Sender Overview, and Decision Mode.
- But Decision Mode can now enter an infinite render/update loop and freeze the screen.
- Observed browser symptom:
  - flashing between messages like `Refreshing scoped sender evidence in the background` and `Preparing the full decision queue for this cleanup group`
  - `Maximum update depth exceeded` error in `review/page.tsx`
- The error points to a client-side `setWorkspaceState(...)` path in the Review page effect chain, which suggests the new freshness/snapshot reconciliation logic is repeatedly re-writing state on every render.

#### Requirements
- identify and fix the exact re-render loop in Review / Decision Mode
- preserve the G.11 correctness fixes:
  - fresh artifact-compatible snapshot handling
  - cluster-global sender counts
  - correct covered / still-to-review totals
- preserve bounded first paint for Sender Overview
- preserve artifact-only request paths
- do not regress Subscription / Dormant browser-truth counts

#### Constraints
- no reintroduction of request-time mailbox scans
- no `loadIndexedGmailMessagesForTenant(...)`
- no `loadDerivedWorkspaceState(...)`
- no `loadMailboxContext(...)`
- no broad UI redesign
- no changes to Mailbox Intelligence or Pressure Trend in this phase
- keep this as a hotfix pass, not a new architecture pass

#### Acceptance Criteria
- Decision Mode no longer throws `Maximum update depth exceeded`
- Decision Mode no longer flashes between loading states in a render loop
- Cleanup Groups → Sender Overview → Decision Mode still shows the corrected browser-visible counts for Subscription and Dormant clusters
- browser-visible Decision Mode must remain stable under real interaction; harness-only proof is not sufficient
- request logs remain artifact-only
- existing acceptance harness continues to pass unchanged

---


### Phase G.13: Live Browser Decision Mode Stability Fix (New – Immediate Follow-Up)

**Goal:** Fix the remaining real-browser Decision Mode instability so the page stops vibrating/flashing under live use while preserving the corrected counts and artifact-only guarantees.

#### Problem
- G.12 did not fix the real browser issue.
- Decision Mode still visibly flashes/vibrates in live usage.
- Browser shows `Maximum update depth exceeded` in `review/page.tsx`.
- This indicates an unresolved client-side state/effect loop or async race condition not captured by harness tests.

#### Requirements
- reproduce the instability in live browser conditions
- trace ALL state updates affecting Decision Mode:
  - workspaceState
  - runtime snapshot
  - sender workspace fetch
  - decision queue fetch
- identify exact loop trigger (effect + dependency + state write)
- implement minimal fix to stop re-render loop

#### Constraints
- no backend changes
- no artifact system changes
- no request-path changes
- no UI redesign
- preserve all G.11 data correctness

#### Acceptance Criteria
- no `Maximum update depth exceeded` error
- no flashing or oscillation in Decision Mode
- counts remain correct for Subscription and Dormant clusters
- request logs remain artifact-only
- browser clickthrough proof required

---

### Phase G.14: Decision Mode Effect Split + Stable Queue Readiness Fix (New – Immediate Follow-Up)

**Goal:** Eliminate the remaining Decision Mode render/update loop by separating snapshot reconciliation from queue readiness and stabilizing the request key and state updates.

#### Problem
- The current implementation conflates “snapshot matches request identity” with “Decision Mode queue is ready”.
- A snapshot can match the request yet fail Decision Mode readiness (e.g., not `page_size=5000` or missing `sender_keys_complete`).
- The same effect both reconciles snapshots and orchestrates fetches, allowing cycles between `loading` and `ready`.
- Runtime silent refreshes rebuild dependencies and can restart the loop.
- Fallback to overview-shaped snapshots can satisfy render while failing readiness, producing oscillation.

#### Requirements
- split passive snapshot reconciliation from active queue-fetch orchestration
- drive Decision Mode fetches from a stable request key:
  - `clusterId + analysisScope + mode + cacheVersion`
- do not write non-satisfying snapshots into `workspaceState` as if they are valid Decision Mode queue snapshots
- add equality guards so `setWorkspaceState(...)` is a no-op when there is no material change
- prevent overview-shaped runtime fallback snapshots from restarting or satisfying the Decision Mode queue path unless explicitly marked as seed-only
- preserve bounded first paint for Sender Overview
- preserve artifact-only request paths

#### Constraints
- no reintroduction of request-time mailbox scans
- no `loadIndexedGmailMessagesForTenant(...)`
- no `loadDerivedWorkspaceState(...)`
- no `loadMailboxContext(...)`
- no backend or artifact-production changes in this phase
- no broad UI redesign

#### Acceptance Criteria
- live browser Decision Mode no longer flashes/vibrates
- no `Maximum update depth exceeded` error
- Subscription and Dormant clusters retain correct counts across Cleanup Groups → Sender Overview → Decision Mode
- request logs remain artifact-only
- existing acceptance harness continues to pass unchanged
- browser clickthrough proof confirms stability during queue preparation

---

## G.15 Subphase Execution Order & Status

The G.15 series has been executed in a practical (non-numeric) order. Use this mapping for future work:

- G.15.1 — Decision queue contract parity → ✅ Completed
- G.15.2 / G.15.2b — Header hydration split → ✅ Completed
- G.15.5 — First-entry coverage hydration → ✅ Completed
- G.15.6 — Coverage application / state synchronization → ✅ Completed
- G.15.4 — Latency reduction → 🔄 In progress / current active pass
- G.15.3 — Full browser reconciliation proof → ⏭ Next (after latency pass completes)

Notes:
- Do not rely on numeric ordering for G.15.x phases.
- Always follow this execution order unless explicitly updated.
- G.15.3 should only run after performance stabilizes so browser truth can be verified cleanly.

---

### Phase G.15: Decision Queue Completion Failure + Overview Header Seed Regression (New – Immediate Follow-Up)

**Goal:** Restore usable Decision Mode queue completion and restore Sender Overview top-summary hydration while preserving the G.14 render-loop fix, corrected counts, and artifact-only request guarantees.

#### Problem
- G.14 stopped the browser render loop, but introduced two new browser-visible regressions:
  - Decision Mode can end in `Failed to prepare the full decision queue for this cleanup group.`
  - Sender Overview top summary cards can stay blank / `—` while lower page sections already show correct full-group totals.
- Terminal logs show the decision-mode `sender_workspace` request still completes successfully with artifact-backed data, which strongly suggests the failure is in client-side queue completion / snapshot acceptance logic rather than backend artifact production.
- This means G.14 likely over-tightened the readiness path or rejected valid queue responses after the request completes.

#### Requirements
- trace why the artifact-backed Decision Mode queue request can return `200` while the page still lands in the `failed to prepare` error state
- identify whether the failure is caused by:
  - client-side snapshot rejection after fetch success
  - overly strict readiness predicates
  - queue result shape mismatch
  - stale async response ordering
  - incorrect error promotion in Review page state
- restore Sender Overview top summary hydration so the header uses valid seed/header totals while the lower workflow surface is already populated
- preserve the G.14 loop fix: no re-render oscillation and no `Maximum update depth exceeded`
- preserve corrected cluster totals for Subscription and Dormant
- preserve artifact-only request behavior

#### Constraints
- no reintroduction of request-time mailbox scans
- no `loadIndexedGmailMessagesForTenant(...)`
- no `loadDerivedWorkspaceState(...)`
- no `loadMailboxContext(...)`
- no backend or artifact-production redesign in this phase unless the trace proves the returned queue payload itself is wrong
- no broad UI redesign

#### Acceptance Criteria
- Decision Mode no longer lands in `Failed to prepare the full decision queue for this cleanup group.` for the known Subscription and Dormant flows
- Sender Overview top summary header hydrates with the same cluster totals already visible lower on the page
- Cleanup Groups → Sender Overview → Decision Mode retains correct counts for Subscription and Dormant
- no render-loop regression returns
- request logs remain artifact-only
- browser clickthrough proof is required

---

### Phase G.15.1: Decision Queue Contract Parity Fix (New – Sniper Pass)

**Goal:** Fix the Decision Mode `Failed to prepare the full decision queue for this cleanup group.` regression by restoring end-to-end contract parity for the decision queue request and returned workspace payload.

#### Problem
- Browser/terminal evidence now shows the queue request is accepted at `page_size=5000`, but the returned artifact-backed sender workspace still comes back with `pagination.page_size=1000`.
- The client then rejects that response as not satisfying Decision Mode readiness and promotes it to the visible `Failed to prepare...` error.
- This is a narrow contract mismatch, not a mailbox-scan or artifact-production failure.

#### Requirements
- trace and fix the exact contract mismatch between:
  - accepted queue request size
  - backend sender-workspace clamp
  - returned workspace pagination shape
  - Decision Mode readiness predicate
- ensure the returned decision queue payload satisfies the Decision Mode queue contract for the known Subscription and Dormant flows
- keep the fix narrow and do not mix it with overview-header hydration work
- add request/log proof that the returned queue payload now matches the intended queue contract

#### Constraints
- no reintroduction of request-time mailbox scans
- no `loadIndexedGmailMessagesForTenant(...)`
- no `loadDerivedWorkspaceState(...)`
- no `loadMailboxContext(...)`
- no broad UI redesign
- no unrelated Sender Overview header work in this pass

#### Acceptance Criteria
- Decision Mode no longer lands in `Failed to prepare the full decision queue for this cleanup group.` for Subscription and Dormant
- request logs show queue request and returned payload are contract-consistent
- counts remain correct for Subscription and Dormant
- no render-loop regression returns
- request logs remain artifact-only
- browser clickthrough proof is required

---

### Phase G.15.2: Sender Overview Header Hydration Source Split (New – Sniper Pass)

**Goal:** Restore Sender Overview top-summary hydration so known cluster totals render immediately from valid overview/header truth even while coverage-specific fields continue loading.

#### Problem
- Browser truth now shows the lower Sender Overview surfaces can render correct totals while the top summary cards remain blank / `—`.
- This indicates the top header is still reading from an overly strict or wrong snapshot source, while lower sections already accept valid overview/header truth.
- This is separate from the Decision Mode queue contract failure and should be fixed independently.

#### Requirements
- trace the exact source used by each top-summary field:
  - sender count
  - message/supporting-message count
  - covered count
  - still-to-review count
- split header hydration so:
  - sender/message totals can render from valid overview/header truth immediately
  - covered / remaining stay gated on cluster-global sender-key truth only where truly required
- keep lower workflow sections unchanged unless a minimal alignment fix is needed
- add browser proof showing top header and lower page now agree for the same cluster

#### Constraints
- no reintroduction of request-time mailbox scans
- no `loadIndexedGmailMessagesForTenant(...)`
- no `loadDerivedWorkspaceState(...)`
- no `loadMailboxContext(...)`
- no broad UI redesign
- no Decision Mode contract work in this pass except compile-only adjustments if required

#### Acceptance Criteria
- Sender Overview top summary cards no longer stay blank when lower sections already show valid totals
- top summary sender/message totals match lower sections for Subscription and Dormant
- covered / still-to-review remain correct and do not regress to bounded-row math
- request logs remain artifact-only
- browser clickthrough proof is required

---

### Phase G.15.3: Browser Reconciliation Proof Pass (New – Sniper Pass)

**Goal:** Verify that G.15.1 and G.15.2 together restore stable browser-visible behavior across Cleanup Groups → Sender Overview → Decision Mode.

#### Requirements
- run browser clickthrough proof for:
  - Subscription
  - Dormant
- verify:
  - Cleanup Groups totals
  - Sender Overview top summary totals
  - Sender Overview lower workflow totals
  - Decision Mode queue completion
  - Decision Mode visible totals
- confirm no re-render loop and no queue-failure regression
- confirm request paths remain artifact-only

#### Acceptance Criteria
- browser-visible counts are consistent across all three surfaces for Subscription and Dormant
- Decision Mode queue completes for the tested clusters
- top summary and lower workflow totals agree in Sender Overview
- no `Maximum update depth exceeded`
- no `Failed to prepare the full decision queue for this cleanup group.`
- unchanged acceptance harness still passes

---


### Phase G.15.4: Sender Overview / Decision Mode Latency Reduction (New – Immediate Follow-Up)

**Goal:** Reduce the browser-visible load time for Sender Overview and Decision Mode now that the cluster counts and top-summary hydration are finally behaving correctly.

#### Problem
- The current browser truth is materially better: cluster totals and top-summary values are now appearing correctly in the main in-app clickthrough path.
- However, the pages still take far too long to become usable.
- Known observed latency from live runs:
  - Sender Overview runtime/bootstrap requests commonly take around `8s–13s`.
  - Decision Mode queue fetch for a populated cluster can take around `22s–24s` even when it succeeds.
  - The current Decision queue path requests `requested_page_size=5000`, returns a full queue, and blocks the page on that large payload.
- This means correctness is improving, but usability is still not acceptable.

#### Requirements
- trace exact browser-visible latency for:
  - runtime bootstrap / playground rehydrate path
  - Sender Overview first usable paint
  - Decision Mode first usable paint
  - Decision queue fetch / hydration
- identify the dominant latency contributors separately:
  - runtime artifact bootstrap
  - sender workspace artifact read
  - decision queue payload size / hydration cost
  - preview/snippet hydration spillover
  - client-side render/hydration cost
- reduce time-to-usable-state for Sender Overview and Decision Mode without regressing the current corrected totals.
- keep the fix focused on latency and payload/hydration efficiency, not another broad UI rewrite.

#### Constraints
- no reintroduction of request-time mailbox scans
- no `loadIndexedGmailMessagesForTenant(...)`
- no `loadDerivedWorkspaceState(...)`
- no `loadMailboxContext(...)`
- preserve the corrected browser-visible totals already working in G.15.1 / G.15.2 / G.15.2b
- preserve artifact-only request behavior
- preserve the Decision Mode queue contract correctness established in G.15.1

#### Acceptance Criteria
- Sender Overview reaches a usable state materially faster than the current `8s–13s` runtime/bootstrap experience
- Decision Mode reaches a usable state materially faster than the current ~`22s–24s` full-queue load for the known Subscription flow
- Cleanup Groups → Sender Overview → Decision Mode still shows correct counts for Subscription and Dormant
- no render-loop regression returns
- no queue-failure regression returns
- request logs remain artifact-only
- browser clickthrough proof is required

---


### Phase G.15.5: Sender Overview First-Entry Coverage Hydration Parity (New – Immediate Follow-Up)

**Goal:** Make Sender Overview top-summary coverage fields (`Managed already`, `Still to review`, and `Covered senders`) hydrate correctly on first entry from Cleanup Groups, without requiring a prior Decision Mode visit.

#### Problem
- Current browser truth is improved: sender totals and message totals now appear correctly in Sender Overview.
- However, on first entry to Sender Overview from Cleanup Groups, the top coverage fields can still remain blank / `—` even though:
  - lower Sender Overview sections already show valid cluster totals
  - the same cluster can later show correct managed/remaining values after a Decision Mode visit
- This means first-entry top coverage hydration is still weaker than the rest of the page and is not yet using the best same-cluster truth available at the right time.

#### Requirements
- trace the exact source now used on first entry for:
  - `Managed already`
  - `Still to review`
  - `Covered senders`
- fix first-entry hydration so those top coverage fields populate correctly for known Subscription and Dormant flows without requiring a Decision Mode round trip
- preserve the already-correct top sender/message totals
- preserve lower Sender Overview workflow sections
- preserve Decision Mode queue parity and stability
- preserve bounded first paint and artifact-only request behavior

#### Constraints
- no reintroduction of request-time mailbox scans
- no `loadIndexedGmailMessagesForTenant(...)`
- no `loadDerivedWorkspaceState(...)`
- no `loadMailboxContext(...)`
- no broad UI redesign
- no new Decision Mode queue work unless a minimal compile-only alignment is required

#### Acceptance Criteria
- Subscription first-entry Sender Overview shows non-blank correct values for:
  - `Managed already`
  - `Still to review`
  - `Covered senders`
- Dormant first-entry Sender Overview shows non-blank correct values for the same fields
- top summary coverage values match the same cluster truth seen in lower workflow state / Decision Mode
- no regression to bounded-row math
- request logs remain artifact-only
- browser clickthrough proof is required

---

### Phase G.15.6: Sender Overview Coverage Application / State Synchronization Fix (New – Immediate Follow-Up)

**Goal:** Fix the remaining first-entry Sender Overview top-coverage bug where correct coverage data is fetched but is not applied to the UI immediately unless Decision Mode is visited first.

#### Problem
- Current evidence shows the first-entry deferred overview backfill is now firing correctly and returning cluster sender keys:
  - `include_cluster_sender_keys:true`
  - `returned_sender_keys_complete:true`
- However, the top coverage fields in Sender Overview can still stay blank on first entry until the user visits Decision Mode and comes back.
- That means the main remaining bug is no longer data absence; it is a client-side state application / overwrite / source-precedence problem.
- The likely failure modes are:
  - correct deferred coverage data is written but then overwritten by weaker runtime or cached state
  - the correct state is present but the top coverage cards still read from the wrong state branch
  - equality guards or snapshot selection logic prevent the coverage update from rendering immediately

#### Requirements
- trace exactly what happens after the first-entry deferred Sender Overview coverage fetch resolves
- identify:
  - where the returned coverage truth is written
  - which state the top coverage cards actually read
  - what later state updates occur afterward
  - whether the correct state is overwritten, ignored, or shadowed
- fix the browser-side application / synchronization bug so first-entry Sender Overview immediately reflects the returned coverage truth without requiring a Decision Mode round trip
- preserve the already-correct sender/message totals in the top header
- preserve lower Sender Overview workflow sections
- preserve Decision Mode queue parity and stability
- preserve artifact-only request behavior

#### Constraints
- no reintroduction of request-time mailbox scans
- no `loadIndexedGmailMessagesForTenant(...)`
- no `loadDerivedWorkspaceState(...)`
- no `loadMailboxContext(...)`
- no backend or artifact-production redesign in this phase
- no broad UI redesign
- no new Decision Mode queue work unless a minimal compile-only alignment is required

#### Acceptance Criteria
- on first entry to Sender Overview from Cleanup Groups, Subscription shows non-blank correct values for:
  - `Managed already`
  - `Still to review`
  - `Covered senders`
- Dormant first-entry Sender Overview shows non-blank correct values for the same fields
- the page no longer requires a Decision Mode round trip for those top coverage values to appear
- top summary coverage values match the same cluster truth seen later in Decision Mode
- request logs remain artifact-only
- browser clickthrough proof is required

---

### Phase H: Incremental Artifact Update System

**Goal:** Ensure all new incoming data is automatically reflected in artifacts.

#### Behavior
- new emails trigger:
  - sender-level updates
  - preview index updates
  - cluster summary adjustments
- system computes only affected deltas
- publishes new artifact version without full rebuild

#### Requirements
- change detection per sender
- partial recompute pipeline
- safe publish (versioned)

---

### Phase I: Artifact Freshness + Sync Integration

**Goal:** Integrate artifact updates into Smart Sync and ingestion pipeline.

#### Behavior
- after sync completes:
  - compute affected senders
  - update artifacts incrementally
- fallback to full rebuild if:
  - data drift is too large
  - integrity is uncertain

---

### Phase J: Performance Hardening + Scaling

**Goal:** Ensure system stability at scale (300k+ and beyond).

#### Requirements
- artifact reads < 2s for all major pages
- bounded Supabase queries only
- no request-time scan regressions
- load-test full dataset

---


### Phase J.1: Full Build Parity Fix (Completed)

**Goal:** Ensure the full rebuild / fallback artifact path produces exactly the same cluster truth as the proven incremental artifact path.

#### Problem
- Phase J improved performance and hardening, but the fallback full-build publication still showed cluster-parity drift compared to the proven incremental baseline.
- Known example from live proof:
  - Dormant expected baseline: `1,240 senders / 45,248 messages`
  - Full-build output drifted to: `1,244 senders / 45,375 messages`
- Because of that, the live published pointer was intentionally restored to the last proven-correct incremental artifact version.
- This means the main remaining correctness risk before final architecture lock is the fallback full-build path, not the incremental path.

#### Requirements
- trace full-build artifact production end to end and compare it directly to incremental output for the same mailbox state
- identify the exact divergence source, including possibilities such as:
  - sender classification mismatch
  - cluster assignment mismatch
  - preview index inclusion/exclusion mismatch
  - duplicate inclusion
  - missing exclusion
  - aggregation logic difference between full-build and incremental paths
- ensure full rebuild uses the same logical rules as incremental publication for:
  - sender counts
  - message counts
  - preview inclusion
  - cluster summaries
  - mailbox intelligence aggregates
- preserve the performance hardening completed in Phase J
- preserve all artifact-only request guarantees

#### Constraints
- no reintroduction of request-time mailbox scans
- no UI redesign
- no request-path changes unless a directly required compile-only alignment is needed
- no regression to proven incremental correctness

#### Acceptance Criteria
- full rebuild produces the exact same cluster truth as incremental publication for the same mailbox state
- no drift remains in sender counts or message counts for the verified clusters
- Subscription and Dormant match the proven incremental baseline across:
  - Cleanup Groups
  - Sender Overview
  - Decision Mode
- request logs remain artifact-only
- unchanged acceptance harness still passes
- proof includes direct incremental-vs-full-build parity verification

---

### Phase J.2: Full Rebuild Operational Hardening

**Goal:** Make the fallback full-rebuild path operationally dependable enough for final architecture lock now that parity is fixed.

#### Problem
- Phase J.1 fixed full-build parity, so fallback rebuilds now produce the same cluster truth as the proven incremental baseline.
- However, the full rebuild path is still operationally heavy and fragile compared to incremental publication.
- Known remaining concerns from live proof:
  - successful full rebuild took roughly `1,645,484ms`
  - transient Supabase / upstream failures (for example `520`) still required retry recovery
  - fallback rebuild is much slower and more operationally sensitive than incremental publication
- This means the remaining risk before final architecture lock is no longer correctness drift, but fallback rebuild resilience, runtime, and failure recovery.

#### Requirements
- profile the full rebuild path again now that parity is fixed and isolate the dominant remaining expensive stages
- harden the fallback rebuild path against transient upstream failures, including retry / resume / recovery behavior where appropriate
- reduce avoidable rebuild overhead where possible without regressing parity
- improve observability so long-running rebuilds clearly expose:
  - current phase
  - progress / counters
  - retry / recovery behavior
  - final publish outcome
- preserve all artifact-only request guarantees
- preserve proven incremental correctness and proven full-build parity

#### Constraints
- no reintroduction of request-time mailbox scans
- no UI redesign
- no request-path regressions
- no regression to Phase J.1 parity
- no regression to performance hardening already completed on artifact read paths

#### Acceptance Criteria
- full rebuild parity remains correct relative to the incremental baseline
- fallback rebuild is measurably more operationally resilient than before this pass
- the rebuild path has clear progress / retry / completion observability
- request logs remain artifact-only
- unchanged acceptance harness still passes
- proof includes full-rebuild timing + retry/recovery evidence on the hardened path

---

### Phase K: Final Architecture Lock (Completed)

**Goal:** Make this the permanent engine pattern.

#### Canonical Authority

The authoritative Phase K reference is:

- [gmail_workspace_canonical_engine_pattern.md](/Users/olivercarlin/Documents/ai-agent-platform/ai-agent-platform-docs/03_gmail_workspace/09_reference/gmail_workspace_canonical_engine_pattern.md)

#### Architecture Rules Locked In

- no request-time full-dataset mailbox scans
- request-time Gmail Workspace flows read published artifacts only
- sync completion drives artifact refresh asynchronously
- incremental refresh is preferred when eligible
- full rebuild is fallback-only and must preserve parity with proven incremental truth
- browser/runtime surfaces must consume artifact-backed truth, not ad hoc mailbox-derived state
- side-by-side publication is mandatory
- last safe published artifact remains served during pending/in-progress/failed refresh states

#### Allowed Patterns

- bounded/keyset request-time reads over published artifact families
- asynchronous background recompute after ingestion/sync
- additive artifact families with explicit publication/freshness state
- future workspaces reusing the same:
  - ingest → derive → persist → publish → serve

#### Forbidden Patterns

- reintroducing `loadIndexedGmailMessagesForTenant(...)` into request-time Gmail Workspace flows
- reintroducing `loadDerivedWorkspaceState(...)` into request-time Gmail Workspace flows
- reintroducing `loadMailboxContext(...)` into request-time Gmail Workspace flows
- any request-time mailbox-wide repair/recompute scan
- using bounded loaded rows or runtime preload counts as cluster-global truth
- publishing partially-written artifact versions
- diverging full-build truth from incremental publication truth

#### Final Proof Lock

Phase K locks the stabilized sequence with:

- artifact-only request paths
- full-mailbox artifact truth
- browser reconciliation across Cleanup Groups → Sender Overview → Decision Mode
- incremental refresh after sync completion
- explicit freshness states
- full-build parity
- full-build retry/resume/recovery hardening
- unchanged acceptance harness proof on published full-build artifact `full-mailbox-20260324073149125`

### March 29, 2026 — Legacy Semantic-Rollup Nested-Field Compatibility Guard

Goal:
- Preserve live readability of older published Gmail artifacts while Slice 2 cleanup-group metadata expands.

Locked compatibility rule:
- `semantic_rollup.surface`
- `semantic_rollup.promotion`
- `semantic_rollup.review_unit_plan`

must be treated as optional on published artifact read paths until all live artifacts are guaranteed to carry them.

Required behavior:
- request-time artifact/runtime readers must not throw when those nested blocks are absent
- legacy rollups must repair to safe compatibility defaults before mirrored field access
- new nested Slice 2 metadata must still be preserved and parsed when present
- safe-partial fallback must not zero valid legacy cleanup groups merely because new presentation metadata is missing

Explicit non-goal:
- this guard is a stabilization layer only
- it does not authorize broader Slice 2 promotion/regrouping rollout before compatibility validation is complete

---

## Final Note

This system must support:

- full mailbox data (300k+ messages)
- continuous updates from new incoming data
- zero request-time dependency on raw mailbox scans

This is the foundational engine for all future workspaces:
- email
- ads
- finance
- crypto
- social

We are not solving Gmail.

We are building the platform.
