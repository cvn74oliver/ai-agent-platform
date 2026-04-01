

# Cleanup Groups Rebuild Phased Execution Plan

## Purpose
This document resets the Cleanup Groups effort from the restored, last-known-good baseline and turns it into a phased execution plan that is narrow enough for Codex to succeed.

This plan exists to prevent another round of cosmetic relabeling, flat pseudo-progress, or broad implementation passes that regress working behavior.

The goal is not to keep renaming the same parent groups. The goal is to produce a **real first-step workflow win** where the operator lands in materially narrower, more actionable review scopes than the current flat parent-level experience.

---

## Current Reset Baseline

### Accepted baseline state
The current baseline is the **post-canonical-presentation / pre-unit-first** restored state.

This means the following are already accepted and should be treated as locked unless a future phase explicitly reopens them:

- canonical cleanup-group publish is live
- canonical identity resolution is live
- canonical surface labels are live
- fixed Cleanup Groups section order is live
- alias normalization is live
- `retail-commerce-senders` remains redirect-only
- parent groups are directly openable again after rollback

### What is working now
At baseline, the system is back to this state:

- Cleanup Groups root loads normally
- canonical sections render correctly:
  1. `Semantic parents`
  2. `Structural lanes`
  3. `Secondary`
  4. `Context`
- canonical labels are visible:
  - `Marketing subscriptions`
  - `Backlog`
  - `Unresolved`
  - `Protected trust`
  - `Account updates`
  - `Historical`
- review routes open again without the rejected chooser-only blocker
- legacy aliases still normalize correctly
- retail stays retired and redirect-only

### What is still not solved
The front-end still does **not** feel structurally rebuilt.

The naming is better, but the practical first-step workflow is still too flat:

- large parent groups still dominate the operator experience
- the first click can still land in a broad sender universe
- the current sub-filters often feel like secondary narrowing inside the same old parent rather than a truly restructured cleanup surface
- from the operator’s perspective, this can still feel like “the same groups with new names”

That unresolved gap is the real focus of this plan.

---

## Core Problem Statement
We have already improved **identity correctness**.
We have **not yet** delivered a convincing **workflow decomposition win**.

The problem is no longer:

- wrong parent naming
- wrong canonical identity
- wrong route normalization
- hidden legacy labels defining the UI

The problem now is:

> the system still does not make the first user action feel materially narrower and more actionable than before.

If the first meaningful click still exposes the same broad sender universe, then the work is still functionally flat even if the labels, cards, sections, and helper copy look more organized.

---

## What Counts As Success
A future Cleanup Groups rebuild phase only counts as successful if it creates **real structural actionability**.

### Real structural win
A real structural win means:

- the first click from Cleanup Groups leads to a materially narrower sender universe
- the narrowed universe is meaningfully easier to review than the top-level parent
- the narrowed scope is backed by real data truth, not UI-only grouping
- parent and subgroup counts reconcile clearly
- the new first-step workflow feels different because the scope is different, not just because the labels are different

### Cosmetic relabeling failure
The following do **not** count as success:

- changing names while leaving the same practical first-step sender universe
- wrapping the same broad parent in more cards, badges, or containers
- showing subtypes/subgroups only as decorative detail while the parent remains the real first-step workflow
- presenting old filter groups as if they are brand new decomposition wins
- claiming progress because the UI looks more sophisticated even though the user still starts in the same broad scope

---

## Anti-Cheating Rules
These rules are here to keep the project honest and to stop false wins.

### Rule 1 — No relabel-only wins
No phase may claim success if it primarily changes:

- labels
- section names
- card titles
- badges
- CTA wording
- explanatory copy

while the same broad sender universe remains the effective first-step workflow.

### Rule 2 — First click must narrow for decomposed groups
If a parent is said to be “decomposed,” then the first meaningful click must narrow the sender universe.

If the first click still opens the broad parent list, the group is **not** decomposed in any meaningful sense.

### Rule 3 — No hidden overlap tricks
If subgroups are surfaced, the plan must explicitly explain:

- whether they partition the parent or overlap
- how subgroup counts reconcile to parent counts
- whether progress within a subgroup can be rolled up safely to parent progress

No subgroup design may hide overlap, double-count the same senders, or create fake progress.

### Rule 4 — Hard size guardrails stay active
Until explicitly revised in a future approved doc, subgroup sizing guardrails remain:

- preferred target range: `50–300` senders
- hard maximum: `400` senders

Any surfaced subgroup above `400` senders is a blocking failure, not an acceptable final design state.

### Rule 5 — Browser behavior outranks design intent
A change only counts if the browser proves it.

Screenshots of cards, docs, badges, and summaries do not outrank live workflow behavior.

### Rule 6 — Cleanup Groups scope only
This rebuild plan is only for the Cleanup Groups lane.

It must not reopen:

- canonical identity design
- taxonomy redesign
- artifact generation redesign
- alias redesign
- route redesign
- general review-page redesign outside what is required for Cleanup Groups actionability

---

## Clarification: What We Already Have vs What We Actually Need
One major source of confusion is that the system **already has** subtype/family breakdowns and optional filters inside the current review experience.

Those existing sub-breakdowns are useful, but they are **not yet the same thing** as a structurally rebuilt Cleanup Groups entry model.

### What we already have
We already have things like:

- subtype/family summary chips
- optional review-unit-like breakdowns in some places
- inside-group descriptive segmentation
- lower-level narrowing once the operator is already inside a parent group

### Why that is not enough
That does **not** automatically solve the Cleanup Groups problem, because the operator still often experiences this flow:

1. start at a broad parent
2. open the broad parent
3. only then see narrowing options

That still feels like a flat parent-first workflow.

### What the actual rebuild must do
The real rebuild must answer this question:

> what should the operator’s **first action** be from the Cleanup Groups root when a parent is too large to review cleanly as one flat block?

That is the real design problem now.

---

## Project Direction From Here
We are no longer trying to “fix a group” in isolation without context.
We are trying to define a system that can:

- reevaluate the whole cleanup surface correctly
- decide which parents may stay direct-open
- decide which parents require a bounded first-step entry
- do this in a way that can generalize to other future workspaces, not just Gmail

That means the next work must happen in phases.

---

## Phased Execution Plan

## Phase 0 — Baseline Lock And Source-of-Truth Reset

### Objective
Freeze the restored baseline so future work cannot drift or quietly redefine what “working” means.

### Deliverables
- this document approved as the new source of truth for Cleanup Groups rebuild planning
- restored baseline explicitly named as the comparison target
- success/failure vocabulary locked:
  - real structural win
  - cosmetic relabeling
  - anti-cheating rules
- the current state clearly split into:
  - already solved
  - still unsolved

### Acceptance
Phase 0 is complete only when:

- everyone agrees what state we are starting from
- everyone agrees what still feels broken
- everyone agrees what does and does not count as progress

---

## Phase 1 — Parent Classification Rules

### Objective
Decide which canonical parents are valid as direct-open groups and which are too large/flat to remain first-step workflows.

### Required output
For each canonical parent, classify it as one of the following:

- `direct_open_valid`
- `requires_structural_decomposition`
- `optional_secondary_path`
- `context_only`

### Current canonical parent set to classify
- `semantic.marketing_subscriptions`
- `structural.backlog`
- `structural.unresolved`
- `structural.protected_trust`
- `secondary.account_updates`
- `context.historical`

### Questions this phase must answer
For each parent:

1. Is the parent already small/coherent enough to remain direct-open?
2. If not, what is the right basis for first-step narrowing?
3. Is the narrowing basis actually backed by stable published/runtime data?
4. Would the resulting first-step scopes fall within the active size guardrails?
5. Would the resulting entry model feel meaningfully different in browser?

### Acceptance
Phase 1 is complete only when every canonical parent has:

- an explicit classification
- a clear reason for that classification
- a declared first-click rule
- a declared proof rule for whether that first click is truly narrower

---

## Phase 2 — Decomposition Basis Spec

### Objective
Define the allowed decomposition source for every parent that requires structural decomposition.

### Important rule
We do **not** want UI-only pseudo-groups.

Any future subgroup surface must be derived from a real, stable source of truth such as:

- published review-unit plans
- stable artifact-backed semantic decomposition
- stable structural decomposition already present in accepted runtime data

### Questions this phase must answer
For every decomposed parent:

1. What is the decomposition basis?
   - subtype-first?
   - family-first?
   - protection-reason-first?
   - exclusion-reason-first?
   - some other accepted artifact-backed basis?
2. Is the decomposition basis already published and trustworthy?
3. Does it partition the parent or create overlap?
4. How do subgroup counts reconcile to parent counts?
5. Are subgroup sizes workable under the current guardrails?
6. What happens if the published decomposition is missing, stale, or too large?

### Acceptance
Phase 2 is complete only when each decomposed parent has:

- one declared authoritative decomposition basis
- one declared data source for that basis
- one declared count-reconciliation rule
- one declared fallback rule if the decomposition is missing or invalid

---

## Phase 3 — First-Click Workflow Contract

### Objective
Define exactly what the user’s first interaction should be for each decomposed parent.

### This is the most important phase
This is where we stop hand-waving and decide what the workflow actually is.

### For each decomposed parent, define:
- what the root surface shows
- what the primary CTA is
- whether the parent itself is still directly openable
- what the first click opens
- what sender universe the first click must narrow to
- what the review page should do if entered at the broad parent level
- what happens when a subgroup is invalid, missing, or oversized

### Key design principle
A decomposed parent is not a design success unless the first action narrows the session into a meaningfully smaller scope.

### Acceptance
Phase 3 is complete only when every decomposed parent has a fully specified first-click contract that can be tested in browser without ambiguity.

---

## Phase 4 — Acceptance Matrix And Browser Proof Design

### Objective
Turn the design rules into testable pass/fail browser criteria before any new implementation begins.

### Required proof areas
Every future implementation lane must prove the following:

#### Root surface proof
- Cleanup Groups root still loads normally
- canonical labels still render correctly
- fixed section order still holds
- alias normalization still holds
- retail redirect still holds

#### First-click narrowing proof
For each decomposed parent:
- first click goes somewhere meaningfully narrower
- the resulting sender universe is smaller and actionably different
- the new scope is not just the same broad list with different labels

#### Count proof
- parent and subgroup counts reconcile clearly
- no subgroup above the hard max is accepted silently
- overlap rules are explicit and visible in the acceptance logic

#### Review-entry proof
- review entry behavior matches the approved first-click contract
- no hidden fallback quietly reopens the broad parent and calls it success

### Acceptance
Phase 4 is complete only when the acceptance matrix is written tightly enough that Codex cannot confuse a cosmetic change for a structural win.

---

## Phase 5 — Implementation Lanes

### Objective
Only after Phases 0–4 are accepted do we split implementation into narrow Codex lanes.

### Planned lane structure
The likely lane split should be:

#### Lane A — Cleanup Groups root surface behavior
- root card behavior only
- subgroup surfacing only
- no review-page behavior changes unless strictly required

Status update:
- implemented and accepted on March 31, 2026
- delivered:
  - `semantic.marketing_subscriptions` root is now unit-entry only
  - Marketing no longer exposes a broad-parent root review entry path
  - Marketing parent URL now renders choose-unit / unavailable-unit state instead of broad parent review
  - direct-open parents remain honest direct-open parents at root and on parent URL entry

#### Lane B — Review-entry behavior for decomposed parents
- review entry only
- subgroup entry only
- no broader UI cleanup

Status update:
- active on March 31, 2026
- accepted in the current lane so far:
  - valid Marketing review units now render coherent selected-state and scoped workflow behavior
  - Marketing review-page hero / top-summary truth is now unit-scoped on valid Marketing review-unit routes
  - decision handoff truth is now unit-scoped on valid Marketing review-unit routes
  - `spillover / exceptions` now functions as a first-class Marketing review unit at review-entry and top-summary truth
  - chooser-only parent entry remains preserved for Marketing
  - direct-open parents remain preserved
- this accepted pass did not change:
  - root surface behavior
  - taxonomy
  - artifact publication
  - direct-open parent design
- separate unresolved follow-up:
  - residual empty-action inbox-analysis runtime noise remains open and was not closed by this pass
  - `{"action":"","status":400,"ok":false}`
- Lane B is not closed yet

#### Lane C — Validation and polish
- only after lanes A and B are proven in browser
- no speculative redesign

Status update:
- not started yet

### Acceptance
Each lane must:

- be narrow
- preserve the restored baseline behaviors
- include explicit browser validation
- avoid widening into unrelated runtime or taxonomy work

---

## Parent-Level Working Hypotheses
These are starting hypotheses only. They are **not yet approved rules**.

### Marketing subscriptions
Likely candidate for decomposition because the parent is large and already has meaningful subtype structure.

Potential future direction:
- top-level parent remains visible
- first-step workflow may need bounded entry via a trusted subgroup basis

### Backlog
Likely candidate for decomposition if first-step review still feels too broad and mixed.

### Unresolved
Likely candidate for decomposition because it can be broad, mixed, and cognitively expensive.

### Protected trust
May or may not need decomposition. It is large, but it also has a distinct safety-oriented purpose, so we need to decide whether decomposition actually helps or just creates misleading pseudo-precision.

### Account updates
May remain direct-open if it is already small/coherent enough.

### Historical
Likely remains direct-open/contextual unless there is a very strong reason to do otherwise.

These are only hypotheses. Phase 1 must decide them formally.

---

## What We Need From Ourselves Before Codex Continues
Before we push Codex into more implementation, we need to answer these questions clearly:

1. Which parents truly need structural decomposition?
2. For each one, what exact basis should drive that decomposition?
3. What exact sender universe should the first click expose?
4. How do we prove that universe is actually narrower?
5. How do we stop ourselves from accepting renamed filters as if they were rebuilt groups?

If we do not answer those questions first, we will keep repeating the same cycle.

---

## Immediate Next Step
Planning Phases 1–4 are now accepted.

Lane A is now implemented and accepted.

Lane B is now active, but not yet closed.

The immediate next step after this closeout is therefore:

- keep Lane B limited to review-entry behavior for the approved decomposed parent contract
- treat the spillover review-unit integrity fix and the review-page hero / handoff unit-truth correction as accepted inside that lane
- do not reopen taxonomy, artifact logic, root-surface behavior, or broader UI redesign as part of that lane
- keep residual empty-action inbox-analysis runtime noise separate from Lane B acceptance and track it as its own unresolved follow-up
- identify the next unresolved Lane B implementation target in a new, explicitly scoped thread before starting more work

---

## Guardrail Reminder For Future Codex Work
Any future Codex prompt for Cleanup Groups must be:

- tied to this document
- limited to one phase or one lane at a time
- explicit about what is already accepted and must not regress
- explicit about what does and does not count as success
- backed by browser proof, not just code-path inspection

---

## Status
- canonical publish: accepted and live
- canonical surface presentation: accepted and live
- rollback from rejected unit-first pass: accepted and complete
- Cleanup Groups planning Phases 1–4: accepted and locked
- Cleanup Groups Lane A: implemented and accepted
- Cleanup Groups Lane B: active, with spillover review-unit integrity and review-page unit-truth correction accepted
- Cleanup Groups rebuild planning: **active**
- Cleanup Groups structural actionability win: **not yet complete**
