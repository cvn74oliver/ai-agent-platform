

# Time Context Rebuild Phased Execution Plan

## Purpose

This document is the **source of truth** for the Time Context rebuild lane inside Sender Overview.

It exists because the previous Time Context parity pass regressed core behavior. We are no longer treating Time Context as an ad hoc polish task. We are treating it as a phased rebuild with locked acceptance criteria.

This document is intentionally narrow and should help the PM and Codex stay aligned on:
- what the restored baseline is
- what is already working and must not be broken
- what Time Context must eventually do
- what does **not** count as success
- how implementation must be split into safe phases

---

## Current Baseline (Locked)

The current branch is the **rollback-restored baseline** after the broken Time Context parity pass was removed.

What is true right now:
- Sender Distribution is working again.
- Sender Distribution chart/workflow parity is restored on validated cases.
- Workflow-local controls such as `Clear narrowed state` and `Back to All indexed` are working in the accepted Sender Distribution lane.
- Time Context is back to its older contextual behavior and is **not yet** a reliable workflow-driving filter surface.
- `semantic.marketing_subscriptions` is loading normally again after the rollback stabilization fix.

This baseline is the regression floor.

Nothing in the future Time Context work is allowed to break:
- Cleanup group loading
- Sender Distribution behavior
- canonical cleanup-group hydration
- workflow scope truth
- Decision Mode handoff integrity

---

## Milestone Status — March 31, 2026

The scoped **Time Context truth-reconciliation pass** is now accepted for the validated Shared Analysis Rail routes.

What this milestone means:
- `All Indexed` monthly truth is now materially reconciled on the validated routes.
- `1M` and `1W` remain browser-valid in the validated cases.
- focused-bucket truth now reads as aligned with rendered bucket data in the validated cases.

What this milestone does **not** mean:
- the full Time Context rebuild is complete
- Time Context filtering / bucket-driven workflow narrowing is accepted
- chart/workflow parity under the future interactive narrowing contract is closed
- residual empty `action:""` inbox-analysis runtime noise is resolved

The broader rebuild remains open until:
- Time Context grammar is fully locked
- the filtering contract is locked
- bucket-driven workflow narrowing is implemented and browser-proven
- chart/workflow parity is proven under that interactive contract

---

## Clarification: What Time Context Is Supposed To Become

Time Context is not supposed to remain just a passive chart.

The intended end state is:
- Time Context is a **real analysis surface** inside the shared rail
- its scope strip matches the visual and interaction seriousness of the Mailbox Intelligence Pressure Trend controls
- its bucket rendering is coherent for the selected scope
- selecting a bucket actually narrows the workflow below
- chart and workflow come from the **same authoritative sender universe**
- the page remains stable and does not rehydrate or fall into partial/truth-conflicting states

That means the real product question is:

> How do we make Time Context behave like a trustworthy workflow-narrowing surface without reintroducing the regression that just forced rollback?

---

## What Is Already Working And Must Be Preserved

### Accepted Sender Distribution work
These are already accepted and must not be destabilized by Time Context work:
- full sender-distribution surface
- chart/workflow parity on validated cases
- sender-focused narrowing behavior
- workflow-local `Clear narrowed state`
- workflow-local `Back to All indexed`
- tiny-subset pagination truth

### Restored Time Context baseline
The rollback restored:
- no broken route-backed Time Context subset behavior
- no partial top-level Time Context truth competing with workflow truth
- no empty `action:""` inbox-analysis noise in validated flows
- no interaction-time `/api/agents/playground` rehydrate regression in validated flows

---

## What Is Broken / Still Missing

These are the real remaining Time Context gaps from the restored baseline:

1. **Bucket click does not yet drive workflow narrowing**
   - Selecting a period bucket does not behave like Sender Distribution selection.
   - The workflow below can remain broad while the chart appears focused.

2. **Bucket grammar is not yet fully trustworthy**
   - `1W` and `1M` need coherent spacing/coverage logic.
   - Empty days/weeks should not collapse the visual grammar into misleading merged blocks.

3. **Scope strip is not yet aligned with the intended framework**
   - It does not yet cleanly mirror the seriousness and ordering expectations inspired by the Pressure Trend surface.

4. **Time Context does not yet feel like a finished operator surface**
   - It still reads more like contextual information than a deliberate workflow-driving analysis mode.

---

## What Success Actually Looks Like

A successful Time Context rebuild does **not** mean:
- the chart looks prettier
- the bars are re-colored
- the labels are renamed
- the scope strip is cosmetically rearranged
- a bucket highlights visually but does not change the workflow

A successful Time Context rebuild **does** mean:
- the chart is visually coherent for each scope
- the chart and workflow are derived from the same authoritative sender universe
- a valid bucket click changes the workflow below in a real, inspectable way
- the user can clear the narrowed state locally without confusion
- no hidden rehydrate or partial-truth regression is reintroduced

---

## Anti-Cheating Rules

These rules exist so this lane cannot claim success with cosmetic changes only.

1. No milestone counts if Time Context still behaves as a passive chart.
2. No milestone counts if bucket selection highlights visually but does not narrow the workflow.
3. No milestone counts if chart counts and workflow counts are not explicitly reconcilable.
4. No milestone counts if `All Indexed` still communicates ambiguous top-level truth.
5. No milestone counts if `1W` / `1M` visually compress empty intervals in a way that makes the period feel incomplete.
6. No milestone counts if the implementation reintroduces:
   - empty `action:""` inbox-analysis requests
   - `/api/agents/playground` interaction-time rehydrate
   - semantic cleanup-group hydration instability

---

## Scope Constraints

This rebuild is intentionally narrow.

### In scope
- Time Context inside the Shared Analysis Rail
- Time Context scope-strip behavior
- Time Context bucket rendering grammar
- Time Context to workflow narrowing behavior
- local clear/reset behavior required to support that narrowing
- documentation and validation for this lane

### Out of scope
- Sender Distribution redesign
- Cleanup Groups redesign
- taxonomy changes
- Decision Mode redesign
- lower legacy sender-contribution cleanup
- generalized performance architecture redesign
- backend artifact redesign unless separately approved later

---

## Phase 0 — Baseline Lock

### Objective
Freeze the rollback-restored state so future work cannot quietly redefine what “working” means.

### Deliverables
- this document approved as the Time Context rebuild source of truth
- rollback-restored baseline explicitly named as the comparison target
- acceptance language aligned with the validation tracker

### Acceptance
The phase is complete only when:
- PM agrees what the current baseline is
- PM agrees what is broken vs what is merely unfinished
- PM agrees that forward work starts from the restored baseline, not from the failed parity pass

---

## Phase 1 — Visual Grammar Lock

### Objective
Define the visual/time-bucket rules before touching workflow-driving behavior again.

### Questions this phase must answer
- What is the exact scope order shown in Time Context?
- Which scopes must exist now, and which are deferred?
- How should `1W` render when some days have zero activity?
- How should `1M` render when some weeks or days are sparse?
- What does the chart count represent at each scope?
- Which Pressure Trend conventions are inspirational vs mandatory?

### Required output
A written spec that explicitly defines:
- scope strip order
- bucket unit for each scope
- whether empty intervals remain visually reserved
- what “coherent period coverage” means for each scope
- what the chart count means in plain language

### Acceptance
This phase is complete only when a reviewer can answer:
- what each bar means
- what the denominator is
- what happens when there are empty intervals
- what the user should expect when changing scopes

---

## Phase 2 — Functional Parity Contract

### Objective
Lock the behavior contract for bucket-driven workflow narrowing before implementation resumes.

### Questions this phase must answer
- When should a Time Context bucket be clickable?
- What exact route/session state should change when a bucket is selected?
- What should remain broad context vs what should become narrowed workflow truth?
- How should `Clear narrowed state` behave for Time Context?
- How should `Back to All indexed` behave after Time Context narrowing?
- How do we prove chart/workflow parity in each validated case?

### Required output
A behavior contract that states:
- authoritative sender universe source
- bucket selection behavior
- workflow narrowing behavior
- local clear/reset behavior
- non-ready / comparison-only behavior
- what is not allowed to happen again

### Acceptance
This phase is complete only when the contract makes it impossible to misunderstand:
- whether Time Context is passive or workflow-driving
- what counts the chart is showing
- what changes in the workflow after a click

---

## Phase 3 — Narrow Implementation Lanes

Implementation must be split into separate, approval-gated lanes.

### Lane A — Scope strip and chart grammar only
Focus:
- scope strip ordering
- bucket unit grammar
- empty-interval rendering rules

Status as of 2026-03-31:
- scoped Time Context truth reconciliation is accepted for the validated routes
- `All Indexed` monthly truth is materially reconciled in those validated cases
- `1M` and `1W` remain browser-valid in those validated cases
- Lane A is still only the pre-selection truth/grammar lane and does not close the broader rebuild

Must not include:
- workflow-driving bucket clicks
- new subset routing
- new forward filtering behavior

### Lane B — Workflow-driving bucket selection
Focus:
- bucket click contract
- workflow narrowing
- chart/workflow parity
- clear/reset symmetry

Must not include:
- new visual redesign ideas
- new metric layers
- generalized performance changes

### Lane C — polish only after behavior is stable
Focus:
- copy refinement
- hover/supporting-context cleanup
- any final visual cleanup

Must not begin until Lanes A and B are browser-green.

---

## Browser-Proof Acceptance Matrix

Any forward implementation pass must include browser proof for:

### Protected / trusted
- `All Indexed`
- `1M`
- `1W`

### Marketing subscriptions
- normal page hydration
- at least one valid narrowed Time Context case once bucket filtering is reintroduced

### Required proof statements
Each validation packet must explicitly state:
- what the chart counts represent in that scope
- whether the workflow below is broad or narrowed
- whether chart and workflow come from the same sender universe
- whether any `/api/agents/playground` request happened during interaction
- whether any empty `action:""` inbox-analysis request happened during interaction

### Failure conditions
The pass fails immediately if any validated case shows:
- ambiguous top-level truth
- chart/workflow mismatch
- broken semantic hydration
- hidden rehydrate
- empty-action noise
- visually incoherent bucket coverage relative to the defined grammar

---

## Proposed Next Document Work

After this phased plan is accepted, the next document to create should be a dedicated spec for **Time Context visual grammar + behavioral contract**.

Suggested filename:
`TIME_CONTEXT_SCOPE_AND_FILTER_SPEC.md`

That document should lock:
- exact scope strip order
- exact bucket semantics by scope
- exact click/filter contract
- exact clear/reset contract
- exact browser-proof acceptance checklist

This plan document should remain the parent roadmap; the spec should become the implementation source for the first forward lane.

---

## Current Direction From Here

We are no longer “just fixing the chart.”

We are defining a reusable framework-level rule for how an analysis chart becomes a trustworthy workflow-narrowing surface.

That matters beyond Gmail because the same logic can later generalize to:
- support inboxes
- finance/accounting workspaces
- operations queues
- any entity/time-driven workflow surface

So the immediate mission is:
1. lock the baseline
2. lock the Time Context grammar
3. lock the Time Context filtering contract
4. only then re-enter implementation in narrow lanes

That is how this becomes a win instead of another regression.
