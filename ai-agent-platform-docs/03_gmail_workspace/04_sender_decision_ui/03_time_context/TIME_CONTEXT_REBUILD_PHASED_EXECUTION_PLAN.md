

# Time Context Rebuild — Phased Execution Plan (Current)

## Purpose

This document is the **execution roadmap** for the Time Context lane inside Sender Overview.

It exists to keep PM and Codex aligned on:
- where the lane is right now
- what truth is already locked
- what is still broken
- what order the remaining work must follow
- what each future pass is and is not allowed to do

This file is the **phase / sequencing document**.

Use `TIME_CONTEXT_SPEC.md` as the **behavioral source of truth** for:
- scope semantics
- bucket rules
- cross-scope truth
- accepted visible surfaces
- fail conditions

---

## Relationship To The Time Context Spec

These two files now work together and must not drift apart.

### `TIME_CONTEXT_SPEC.md`
Use for:
- product truth
- implementation truth
- regression truth
- PASS / FAIL truth

### `TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
Use for:
- execution order
- phase boundaries
- sniper pass design
- lane sequencing
- what must be fixed first vs later

Rule:
- if these documents conflict, the spec defines behavior and this plan must be updated to match it.

---

## Current Situation (Locked)

We are no longer in an open-ended “improve the chart” phase.

We are in a **controlled rebuild lane** because prior passes created repeated regressions across:
- scope semantics
- visible bucket coverage
- chart/workflow parity
- sender-distribution/time-context congruency
- runtime stability
- verification quality

The lane now has two distinct truths:

### 1. Behavioral truth is locked in the spec
The Time Context system is now explicitly defined and should no longer be inferred from code, prior thread memory, or partial UI behavior.

### 2. Execution must now be sniper-phased
Future work must be split into tightly bounded phases so Codex does not mix:
- runtime recovery
- chart grammar
- scope semantics
- workflow narrowing
- cross-surface parity
- performance hardening

---

## Current Locked Product Decisions

These decisions are now explicit and should govern all future work unless intentionally superseded.

### 1. One Month
- `1M` means **rolling 30 days**
- not calendar month
- not “current month to date”

### 2. One Quarter
- `1Q` means **rolling 90 days**
- bucket unit = **weekly buckets**
- not daily buckets
- not calendar quarter

### 3. One Year
- `1Y` means **rolling 365 days**
- grouped into calendar months
- must include current month
- missing months must remain visible as zero-value months

### 4. All Indexed
- full available sender-time dataset
- grouped by calendar month

### 5. Time Context truth model
A sender must appear in **every bucket where it had ≥1 qualifying message**.

No single-assignment / latest-activity bucket logic is allowed.

---

## Regression Floor (Must Not Break)

No future Time Context pass is allowed to regress:
- cleanup-group loading
- Sender Distribution behavior
- canonical cleanup-group hydration
- workflow scope truth
- Decision Mode handoff integrity
- local clear/reset behavior already accepted elsewhere in Sender Overview
- runtime stability on the review route
- accepted artifact/runtime recovery behavior

If a Time Context pass improves chart math but breaks any of the above, the pass is FAIL.

---

## Current Known Problem Areas

The active lane is not one bug. It is a sequence of tightly related defects.

### A. Scope semantics drift
Historically, scopes have changed meaning across passes.
Examples:
- `1M` acting like current month instead of rolling 30 days
- `1W` collapsing to fewer visible buckets
- `1D` collapsing to a partial-hour window
- `1Y` missing April / current month

### B. Visible bucket grammar drift
Even when backend truth improved, visible charts have still failed by:
- hiding expected buckets
- collapsing empty periods
- showing `no visible data` when data exists
- failing to preserve required zero-bucket visibility

### C. Cross-surface truth drift
Time Context has repeatedly diverged from:
- Sender Distribution
- workflow sender list
- top summary cards

### D. Runtime churn risk
The route has shown repeated heavy request churn / noisy runtime activity during testing.
Time Context work must not reintroduce:
- `/api/agents/playground` interaction-time rehydrate
- request loops
- heavy refresh churn
- runtime instability that risks Supabase health

### E. Verification-surface drift
Codex has repeatedly verified backend truth or partial UI truth without proving the actual bar charts / accepted visible surfaces.
That is no longer acceptable.

---

## What Success Means Now

This rebuild is successful only when all of the following are true:

1. Time Context scopes keep one stable meaning across passes
2. Chart bucket coverage matches the scope contract exactly
3. Empty intervals remain visible when required by the spec
4. Bucket click genuinely narrows workflow truth
5. Sender Distribution, workflow list, and top summary cards all reflect the same narrowed sender universe
6. No hidden runtime rehydrate / request loop is introduced
7. Codex verifies the actual chart surfaces, not just backend payloads

Anything less is partial progress, not acceptance.

---

## Execution Strategy (Critical)

We are now moving forward in **sniper-focused phases**.

Rules:
- one phase = one class of problem
- one execution pass = one bounded defect surface
- no mixed fixes
- no “while we are here” work
- no silent scope widening

Implementation may only move to the next phase when the current phase is green.

---

# Phase Map (Current)

## Phase 0 — Documentation Lock (COMPLETE AFTER THIS UPDATE)

### Objective
Bring the Time Context lane documents into alignment with current reality.

### Deliverables
- `TIME_CONTEXT_SPEC.md` defines behavioral truth
- this phased plan defines execution order
- PM and Codex no longer rely on old milestone language as active truth

### Acceptance
Complete when:
- both documents agree on scope semantics and success conditions
- future passes can route from docs instead of thread memory

---

## Phase 1 — Runtime Safety / Churn Containment

### Objective
Ensure Time Context interaction and route usage do not create runtime churn or dangerous heavy-request behavior.

### Why this is first
If runtime is unstable, every later Time Context validation becomes unreliable and expensive.

### In scope
- request-loop diagnosis
- interaction-time rehydrate detection
- heavy-route churn tied to review route / analysis switching
- proving that Time Context interaction does not destabilize runtime

### Out of scope
- chart semantics
- bucket grammar redesign
- workflow narrowing redesign
- visual polish

### Acceptance
This phase is green only when:
- no interaction-time `/api/agents/playground` rehydrate is triggered by Time Context interaction
- no repeated heavy refresh churn / loop is observed
- no Supabase-risking terminal flood is reintroduced by Time Context testing

### Notes
If runtime stability is already proven in the active branch at the moment of a pass, that proof must still be stated explicitly before moving forward.

---

## Phase 2 — Scope Semantics Lock

### Objective
Make every Time Context scope mean exactly one thing and never silently change across patches.

### Locked target semantics
- `1D` = last 24 hours, 24 hourly buckets
- `1W` = last 7 days, 7 daily buckets
- `1M` = rolling 30 days, 30 daily buckets
- `1Q` = rolling 90 days, weekly buckets
- `1Y` = rolling 365 days, calendar months
- `all_indexed` = full dataset, calendar months

### In scope
- scope definition alignment
- bucket-count contract by scope
- current-month inclusion rules
- empty-bucket visibility rules per scope

### Out of scope
- workflow click behavior
- performance optimization
- UI polish

### Acceptance
This phase is green only when:
- each scope has one stable meaning
- visible bucket count matches that meaning
- current month appears when required
- empty intervals remain visible when required
- no scope silently changes behavior between passes

---

## Phase 3 — Canonical Dataset / Boundary Contract Enforcement

### Objective
Ensure all Time Context views are fed by one canonical dataset and one boundary contract before bucketing.

### In scope
- same row universe across scopes
- same timezone boundary logic
- same lower/upper bound contract
- removal of scope-specific truth drift

### Out of scope
- visual redesign
- workflow interaction polish
- performance hardening beyond what is required to prove correctness

### Acceptance
This phase is green only when:
- same overlapping periods reconcile across scopes
- `1D == 1W` on the same day
- `1W == 1M` on the overlapping period
- `1M == 1Y` on the same current month

---

## Phase 4 — Visible Chart Grammar Compliance

### Objective
Make the rendered charts obey the spec visually, not just mathematically.

### In scope
- visible bucket count correctness
- preserving required zero buckets
- ensuring `no visible data` only appears when dataset is genuinely empty
- fixing collapsed / missing visible bars
- current-month visual presence

### Out of scope
- workflow narrowing
- Decision Mode changes
- performance work

### Acceptance
This phase is green only when the accepted visible surfaces are correct:
- chart itself
- lower workflow list (broad vs narrowed truth context stated clearly)
- sender distribution
- top summary cards

This phase FAILS if backend parity passes but the actual chart is visibly wrong.

---

## Phase 5 — Workflow-Narrowing Contract

### Objective
Make Time Context a trustworthy workflow-driving surface instead of a passive chart.

### In scope
- bucket click behavior
- narrowed sender-universe application
- workflow transition from broad state to narrowed state
- clear/reset behavior
- ensuring visual selection corresponds to real workflow truth

### Out of scope
- visual polish beyond what is necessary for interaction clarity
- performance hardening

### Acceptance
This phase is green only when:
- bucket click registers immediately
- bucket click resolves into one authoritative narrowed sender universe
- workflow list matches the selected bucket exactly
- Sender Distribution matches the same narrowed sender universe exactly
- top summary cards match the same narrowed sender universe exactly
- clear/reset returns cleanly to the broader state

---

## Phase 6 — Cross-Surface Acceptance

### Objective
Prove that Time Context, Sender Distribution, workflow list, and top summary cards all stay aligned under the same truth.

### In scope
- accepted visible surface verification
- linked-surface parity proof
- proving no drift between surfaces

### Out of scope
- new features
- performance redesign

### Acceptance
This phase is green only when all linked surfaces reconcile on the accepted route for the tested scope / bucket.

---

## Phase 7 — Performance Hardening (Deferred Until Truth Is Green)

### Objective
Reduce the material load-time cost on broad scopes without re-breaking truth.

### In scope
- narrow diagnosis / fixes for expensive broad scopes such as `1Y` and `1Q`
- only after semantic and visible truth are accepted

### Out of scope
- redesigning scope semantics
- changing Time Context truth contract

### Acceptance
This phase is green only when performance improves without regressing:
- scope semantics
- bucket grammar
- workflow narrowing
- cross-surface truth
- runtime safety

---

# Execution Rules For Codex

## Non-negotiable rules
1. Do not mix phases.
2. Do not solve runtime churn and chart grammar in the same pass.
3. Do not solve workflow narrowing and performance in the same pass.
4. Do not verify backend truth only.
5. Do not use adjacent proof surfaces instead of the actual chart.
6. Do not call a phase complete if the visible chart still violates the spec.

## Required proof style
Every implementation pass must explicitly state:
- phase being worked
- accepted defect surface
- what is in scope
- what is out of scope
- exact PASS / FAIL result

---

# Browser-Proof Requirements (Going Forward)

Any future Time Context pass must prove the exact accepted visible surfaces.

## Required surfaces
- chart itself
- workflow list
- Sender Distribution
- top summary cards

## Required statements
Each proof packet must explicitly state:
- what the selected scope means
- how many visible buckets are expected
- whether empty intervals should remain visible
- whether the workflow is broad or narrowed
- whether Sender Distribution is broad or narrowed
- whether top summary cards are broad or narrowed
- whether any runtime churn occurred during the test

## Automatic fail conditions
The pass fails immediately if any tested route shows:
- missing expected buckets
- missing required current month
- collapsed visible coverage
- `no visible data` when data exists
- chart/workflow mismatch
- Time Context / Sender Distribution mismatch
- top-summary mismatch
- hidden runtime rehydrate / churn regression

---

# Immediate Next Direction

The immediate mission is now:
1. keep the docs locked
2. use the spec as behavioral truth
3. execute only one phase at a time
4. force Codex to verify the actual bar charts and linked visible surfaces

We are no longer allowing Time Context work to proceed as a broad “fix whatever looks wrong” lane.

It is now a tightly governed rebuild with explicit sniper phases.

---

# Summary

Time Context is no longer an ad hoc chart polish problem.

It is a controlled rebuild lane with:
- locked product truth
- locked scope semantics
- locked regression floor
- locked execution sequencing

Future success depends on this rule:

> first lock what Time Context means,
> then lock what each phase is allowed to do,
> then verify the real visible surfaces,
> and only then accept the pass.
# Time Context Rebuild — Phased Execution Plan (Current)

## Purpose

This document is the **execution roadmap** for the Time Context lane inside Sender Overview.

It exists to keep PM and Codex aligned on:
- where the lane is right now
- what truth is already locked
- what is still broken
- what order the remaining work must follow
- what each future pass is and is not allowed to do

This file is the **phase / sequencing document**.

Use `TIME_CONTEXT_SPEC.md` as the **behavioral source of truth** for:
- scope semantics
- bucket rules
- cross-scope truth
- accepted visible surfaces
- fail conditions

---

## Relationship To The Time Context Spec

These two files now work together and must not drift apart.

### `TIME_CONTEXT_SPEC.md`
Use for:
- product truth
- implementation truth
- regression truth
- PASS / FAIL truth

### `TIME_CONTEXT_REBUILD_PHASED_EXECUTION_PLAN.md`
Use for:
- execution order
- phase boundaries
- sniper pass design
- lane sequencing
- what must be fixed first vs later

Rule:
- if these documents conflict, the spec defines behavior and this plan must be updated to match it.

---

## Current Situation (Locked)

We are no longer in an open-ended “improve the chart” phase.

We are in a **controlled rebuild lane** because prior passes created repeated regressions across:
- scope semantics
- visible bucket coverage
- chart/workflow parity
- sender-distribution/time-context congruency
- runtime stability
- verification quality
- route readiness / settle reliability

The lane now has three distinct truths:

### 1. Behavioral truth is locked in the spec
The Time Context system is now explicitly defined and should no longer be inferred from code, prior thread memory, or partial UI behavior.

### 2. Execution must now be sniper-phased
Future work must be split into tightly bounded phases so Codex does not mix:
- runtime recovery
- route readiness
- chart grammar
- scope semantics
- workflow narrowing
- cross-surface parity
- performance hardening

### 3. Verification must happen only on a READY route
A Time Context verdict is only valid after the canonical route has reached a real settled state.
Pre-settle loading, shell, bootstrap, and fallback states are diagnostic only.

---

## Current Locked Product Decisions

These decisions are now explicit and should govern all future work unless intentionally superseded.

### 1. One Month
- `1M` means **rolling 30 days**
- not calendar month
- not “current month to date”

### 2. One Quarter
- `1Q` means **rolling 90 days**
- bucket unit = **weekly buckets**
- visible contract = **13 fixed weekly buckets**
- edge weeks may be clipped to preserve the rolling 90-day meaning
- not daily buckets
- not calendar quarter

### 3. One Year
- `1Y` means **rolling 365 days**
- grouped into calendar months
- must include current month
- missing months must remain visible as zero-value months

### 4. All Indexed
- full available sender-time dataset
- grouped by calendar month

### 5. Time Context truth model
A sender must appear in **every bucket where it had ≥1 qualifying message**.

No single-assignment / latest-activity bucket logic is allowed.

---

## Regression Floor (Must Not Break)

No future Time Context pass is allowed to regress:
- cleanup-group loading
- Sender Distribution behavior
- canonical cleanup-group hydration
- workflow scope truth
- Decision Mode handoff integrity
- local clear/reset behavior already accepted elsewhere in Sender Overview
- runtime stability on the review route
- accepted artifact/runtime recovery behavior
- accepted route READY behavior once achieved

If a Time Context pass improves chart math but breaks any of the above, the pass is FAIL.

---

## Current Known Problem Areas

The active lane is not one bug. It is a sequence of tightly related defects.

### A. Scope semantics drift
Historically, scopes have changed meaning across passes.
Examples:
- `1M` acting like current month instead of rolling 30 days
- `1W` collapsing to fewer visible buckets
- `1D` collapsing to a partial-hour window
- `1Y` missing April / current month

### B. Visible bucket grammar drift
Even when backend truth improved, visible charts have still failed by:
- hiding expected buckets
- collapsing empty periods
- showing `no visible data` when data exists
- failing to preserve required zero-bucket visibility

### C. Cross-surface truth drift
Time Context has repeatedly diverged from:
- Sender Distribution
- workflow sender list
- top summary cards

### D. Runtime churn risk
The route has shown repeated heavy request churn / noisy runtime activity during testing.
Time Context work must not reintroduce:
- `/api/agents/playground` interaction-time rehydrate
- request loops
- heavy refresh churn
- runtime instability that risks Supabase health

### E. Verification-surface drift
Codex has repeatedly verified backend truth or partial UI truth without proving the actual bar charts / accepted visible surfaces.
That is no longer acceptable.

### F. Route readiness / verification timing
A recurring failure mode has been evaluating Time Context before the route actually reached READY.
This created false failures and wasted passes.

Examples:
- shell/loading states mistaken for semantic failures
- fallback copy observed before baseline runtime data was attached
- verdicts issued before the selected cleanup group, Time Context tab, and rail were actually ready

---

## What Success Means Now

This rebuild is successful only when all of the following are true:

1. Time Context scopes keep one stable meaning across passes
2. Chart bucket coverage matches the scope contract exactly
3. Empty intervals remain visible when required by the spec
4. Bucket click genuinely narrows workflow truth
5. Sender Distribution, workflow list, and top summary cards all reflect the same narrowed sender universe
6. No hidden runtime rehydrate / request loop is introduced
7. Codex verifies the actual chart surfaces, not just backend payloads
8. All verification is performed only after the route reaches READY; pre-settle observations are diagnostic only and cannot be used for PASS / FAIL decisions

Anything less is partial progress, not acceptance.

---

## Execution Strategy (Critical)

We are now moving forward in **sniper-focused phases**.

Rules:
- one phase = one class of problem
- one execution pass = one bounded defect surface
- no mixed fixes
- no “while we are here” work
- no silent scope widening

Implementation may only move to the next phase when the current phase is green.

---

# Phase Map (Current)

## Phase 0 — Documentation Lock (COMPLETE)

### Objective
Bring the Time Context lane documents into alignment with current reality.

### Deliverables
- `TIME_CONTEXT_SPEC.md` defines behavioral truth
- this phased plan defines execution order
- PM and Codex no longer rely on old milestone language as active truth

### Acceptance
Complete when:
- both documents agree on scope semantics and success conditions
- future passes can route from docs instead of thread memory

---

## Phase 1 — Runtime Safety / Churn Containment (COMPLETE)

### Objective
Ensure Time Context interaction and route usage do not create runtime churn or dangerous heavy-request behavior.

### Why this was first
If runtime is unstable, every later Time Context validation becomes unreliable and expensive.

### In scope
- request-loop diagnosis
- interaction-time rehydrate detection
- heavy-route churn tied to review route / analysis switching
- proving that Time Context interaction does not destabilize runtime

### Out of scope
- chart semantics
- bucket grammar redesign
- workflow narrowing redesign
- visual polish

### Acceptance
This phase was green only when:
- no interaction-time `/api/agents/playground` rehydrate was triggered by Time Context interaction
- no repeated heavy refresh churn / loop remained
- no Supabase-risking terminal flood was reintroduced by Time Context testing

### Current status
Accepted and closed.

---

## Phase 1.5 — Route Readiness / Verification Stability (COMPLETE)

### Objective
Ensure the canonical review route reliably reaches a true READY state before any Time Context verification is performed.

### Why this existed
Recent passes revealed that some apparent Time Context failures were actually pre-settle route states, not real semantic failures.

Time Context verification is invalid until:
- baseline runtime snapshot is attached
- selected cleanup group is visible
- Time Context rail is mounted
- rail state is `ready`

### In scope
- runtime snapshot attach timing
- `/api/agents/playground` rehydrate completion
- baseline cleanup-group hydration
- READY gate timing and verification protocol

### Out of scope
- Time Context semantics
- bucket grammar
- workflow narrowing
- Sender Distribution behavior

### Acceptance
This phase was complete only when:
- canonical route consistently reached READY within the verification window
- selected cleanup group was visible
- Time Context tab was visible
- rail state was `ready`
- no verification was performed on pre-settle state

### Current status
Accepted and closed.

---

## Phase 2 — Scope Semantics Lock (ACTIVE)

### Objective
Make every Time Context scope mean exactly one thing and never silently change across patches.

### Phase gate
This phase MUST NOT be evaluated unless Phase 1.5 READY conditions are satisfied.
Any failure observed before READY is invalid verification and must be treated as a blocked-proof condition, not a semantic failure.

### Locked target semantics
- `1D` = last 24 hours, 24 hourly buckets
- `1W` = last 7 days, 7 daily buckets
- `1M` = rolling 30 days, 30 daily buckets
- `1Q` = rolling 90 days, 13 fixed weekly buckets
- `1Y` = rolling 365 days, 12 calendar months including current month
- `all_indexed` = full dataset, calendar months

### In scope
- scope definition alignment
- bucket-count contract by scope
- current-month inclusion rules
- empty-bucket visibility rules per scope
- `all_indexed` scope viability on the accepted route

### Out of scope
- workflow click behavior
- performance optimization
- UI polish

### Current reality
Recent scopes have materially improved under post-settle verification, but `all_indexed` has remained the residual blocker in accepted-surface proof.
So Phase 2 is still active and cannot close until `all_indexed` also satisfies the same contract.

### Acceptance
This phase is green only when:
- each scope has one stable meaning
- visible bucket count matches that meaning
- current month appears when required
- empty intervals remain visible when required
- no scope silently changes behavior between passes
- `all_indexed` renders monthly chart truth on the accepted route after READY

---

## Phase 3 — Canonical Dataset / Boundary Contract Enforcement

### Objective
Ensure all Time Context views are fed by one canonical dataset and one boundary contract before bucketing.

### In scope
- same row universe across scopes
- same timezone boundary logic
- same lower/upper bound contract
- removal of scope-specific truth drift

### Out of scope
- visual redesign
- workflow interaction polish
- performance hardening beyond what is required to prove correctness

### Acceptance
This phase is green only when:
- same overlapping periods reconcile across scopes
- `1D == 1W` on the same day
- `1W == 1M` on the overlapping period
- `1M == 1Y` on the same current month
- `1Y` current month reconciles with `all_indexed` current month when covered history includes that month

---

## Phase 4 — Visible Chart Grammar Compliance

### Objective
Make the rendered charts obey the spec visually, not just mathematically.

### In scope
- visible bucket count correctness
- preserving required zero buckets
- ensuring `no visible data` only appears when dataset is genuinely empty
- fixing collapsed / missing visible bars
- current-month visual presence

### Out of scope
- workflow narrowing
- Decision Mode changes
- performance work

### Acceptance
This phase is green only when the accepted visible surfaces are correct:
- chart itself
- lower workflow list (broad vs narrowed truth context stated clearly)
- sender distribution
- top summary cards

This phase FAILS if backend parity passes but the actual chart is visibly wrong.

---

## Phase 5 — Workflow-Narrowing Contract

### Objective
Make Time Context a trustworthy workflow-driving surface instead of a passive chart.

### In scope
- bucket click behavior
- narrowed sender-universe application
- workflow transition from broad state to narrowed state
- clear/reset behavior
- ensuring visual selection corresponds to real workflow truth

### Out of scope
- visual polish beyond what is necessary for interaction clarity
- performance hardening

### Acceptance
This phase is green only when:
- bucket click registers immediately
- bucket click resolves into one authoritative narrowed sender universe
- workflow list matches the selected bucket exactly
- Sender Distribution matches the same narrowed sender universe exactly
- top summary cards match the same narrowed sender universe exactly
- clear/reset returns cleanly to the broader state

---

## Phase 6 — Cross-Surface Acceptance

### Objective
Prove that Time Context, Sender Distribution, workflow list, and top summary cards all stay aligned under the same truth.

### In scope
- accepted visible surface verification
- linked-surface parity proof
- proving no drift between surfaces

### Out of scope
- new features
- performance redesign

### Acceptance
This phase is green only when all linked surfaces reconcile on the accepted route for the tested scope / bucket.

---

## Phase 7 — Performance Hardening (Deferred Until Truth Is Green)

### Objective
Reduce the material load-time cost on broad scopes without re-breaking truth.

### In scope
- narrow diagnosis / fixes for expensive broad scopes such as `1Y` and `1Q`
- only after semantic and visible truth are accepted

### Out of scope
- redesigning scope semantics
- changing Time Context truth contract

### Acceptance
This phase is green only when performance improves without regressing:
- scope semantics
- bucket grammar
- workflow narrowing
- cross-surface truth
- runtime safety
- route readiness

---

# Execution Rules For Codex

## Non-negotiable rules
1. Do not mix phases.
2. Do not solve runtime churn and chart grammar in the same pass.
3. Do not solve route-readiness work and semantics work in the same pass.
4. Do not solve workflow narrowing and performance in the same pass.
5. Do not verify backend truth only.
6. Do not use adjacent proof surfaces instead of the actual chart.
7. Do not call a phase complete if the visible chart still violates the spec.
8. Do not issue PASS / FAIL verdicts from pre-settle state.

## Required proof style
Every implementation or verification pass must explicitly state:
- phase being worked
- accepted defect surface
- what is in scope
- what is out of scope
- exact PASS / FAIL / BLOCKED result
- whether READY was achieved before verification

---

# Browser-Proof Requirements (Going Forward)

Any future Time Context pass must prove the exact accepted visible surfaces.

## Required surfaces
- chart itself
- workflow list
- Sender Distribution
- top summary cards

## Required statements
Each proof packet must explicitly state:
- what the selected scope means
- how many visible buckets are expected
- whether empty intervals should remain visible
- whether the workflow is broad or narrowed
- whether Sender Distribution is broad or narrowed
- whether top summary cards are broad or narrowed
- whether any runtime churn occurred during the test
- whether READY was achieved before any verdict was issued

## Automatic fail conditions
The pass fails immediately if any tested route shows:
- missing expected buckets
- missing required current month
- collapsed visible coverage
- `no visible data` when data exists after READY
- chart/workflow mismatch
- Time Context / Sender Distribution mismatch
- top-summary mismatch
- hidden runtime rehydrate / churn regression
- any PASS / FAIL decision made from pre-settle state

---

# Immediate Next Direction

The immediate mission is now:
1. keep the docs locked
2. use the spec as behavioral truth
3. execute only one phase at a time
4. force Codex to verify the actual bar charts and linked visible surfaces
5. treat READY as a required verification gate, not a best-effort wait

We are no longer allowing Time Context work to proceed as a broad “fix whatever looks wrong” lane.

It is now a tightly governed rebuild with explicit sniper phases.

---

# Summary

Time Context is no longer an ad hoc chart polish problem.

It is a controlled rebuild lane with:
- locked product truth
- locked scope semantics
- locked regression floor
- locked execution sequencing
- locked route-readiness verification discipline

Future success depends on this rule:

> first lock what Time Context means,
> then lock what each phase is allowed to do,
> then verify the real visible surfaces only after READY,
> and only then accept the pass.
