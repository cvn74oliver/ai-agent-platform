# Sender Intelligence System — Build Plan
## (Authoritative Forward Plan for Semantic Engine Completion)

---

# 1. System Goal

The Sender Intelligence System must:

- Categorize **any inbox**, not just this mailbox
- Avoid **null / meaningless categories**
- Avoid **dominant bucket collapse**
- Produce **human-understandable, actionable insights**
- Be **consistent across users**
- Be **adaptive to different inbox compositions**
- Support **future expansion without redesign**

This is not just classification.

This is an **adaptive semantic intelligence system**.

---

# 2. Core Problem Statement

From all previous phases, we have learned:

- Fallback ≠ meaning
- Grouping without semantics = garbage
- Semantics without structure = collapse
- Visualization without truth = mistrust

The system previously failed because it:

- mixed meaning and uncertainty
- forced fallback into primary categories
- allowed dominant buckets to consume the system
- built UI on unstable semantics

---

# 3. Target System Architecture

The system must operate in three layers:

## Layer 1 — Sender Semantics (Ground Truth)

Each sender must have:

- semantic_family (required)
- semantic_pattern (required)
- resolution (clear / mixed / thin_history)
- confidence (high / medium / low)
- provenance (where the interpretation came from)
- decomposition metadata:
  - umbrella
  - subtype_key
  - subtype_label
  - decomposition_status
  - decomposition_path

Rules:
- Meaning must always exist
- Uncertainty must never replace meaning
- Broad categories must be decomposable

---

## Layer 2 — Grouping Engine (Structure)

Cleanup groups must be:

- mutually exclusive
- collectively exhaustive

Groups include:

- protected-trusted-senders
- subscription-senders
- dormant-backlog-senders
- historical-out-of-inbox-senders
- needs-review-senders
- system-notification-senders
- retail-commerce-senders
- social-platform-senders

Rules:
- Every sender must belong to exactly one group
- Structural groups (protected, historical, needs-review) are NOT semantic groups
- Behavioral groups must be semantically meaningful

---

## Layer 3 — Presentation Layer (User Experience)

The system must present an intelligence dashboard for the selected cleanup group and its senders. It is allowed to be rich and informative, but it must stay downstream of truth.

- meaningful semantic breakdowns
- clear uncertainty signals
- decomposable insights
- trustworthy visualizations
- an intelligent overview for the currently selected cleanup group
- meaningful drill-down from group-level meaning into sender-level meaning
- semantic explanation that helps the operator understand what is inside the group before acting

The UI must never:
- show fallback states as primary meaning
- hide uncertainty
- misrepresent scale or proportion

Clarification:
- `do not create a second dashboard` does NOT mean `remove intelligence from Sender Overview`
- it means `do not create a second competing command surface that fights Mailbox Intelligence for ownership of the product story`
- Sender Overview is supposed to be an intelligent dashboard for the selected cleanup group
- its job is to explain that one group clearly, truthfully, and usefully

---

# 4. Anti-Dominant Bucket Rule (CRITICAL)

# 4.5 Current Mission (Plain English)

What we are trying to do right now:

1. Fix cleanup-group artifacts so all senders are grouped meaningfully.
2. Fix sender-overview artifacts so the selected group is explained with useful categories.
3. Make those two systems use the same semantic logic.
4. Stop putting most senders into one giant bucket like `promotions`, `general updates`, or `I don't know`.
5. Delay rebuild until the taxonomy, rollups, and decomposition rules are locked.

This means the current mission is NOT:
- redesigning the whole Sender Overview page
- simplifying away intelligence
- experimenting with broad UI restructuring

The current mission IS:
- truth-model alignment
- better semantic buckets
- better decomposition of dominant buckets
- congruent cleanup-group and sender-overview artifacts
- one final rebuild after the system logic is locked

The system must actively prevent semantic collapse.

If any category exceeds a dominance threshold (e.g. 60–70%):

→ The system must:
- mark it as an umbrella category
- trigger decomposition logic
- attempt to subdivide into meaningful subtypes

Example:

Instead of:
- Marketing = 80%

The system should move toward:
- Newsletters
- Promotions
- Product updates
- Community messages

This is a core system behavior, not a UI enhancement.

---

# 5. Phase Plan (Execution Roadmap)

## Phase L2.4A — Sender Intelligence Truth Audit
Purpose:
- verify what is structurally correct
- verify what is semantically weak
- separate:
  - data assignment problems
  - semantic taxonomy problems
  - rollup problems
  - presentation problems

Scope:
- cleanup-group truth
- sender-overview artifact truth
- semantic rollup truth
- denominator truth
- no UI redesign
- no rebuild

Exit criteria:
- we know exactly which problems are:
  - data assignment problems
  - semantic taxonomy problems
  - rollup problems
  - presentation problems

---

## Phase L2.4B — Semantic / Cleanup Taxonomy Refinement Plan
Purpose:
- refine sender semantic taxonomy and cleanup-group taxonomy together
- ensure grouping and sender-level artifacts are driven by the same meaning system

Scope:
- sender semantic families
- sender semantic patterns
- cleanup-group criteria
- fallback policy
- dominant-bucket decomposition rules
- no rebuild

Exit criteria:
- one approved taxonomy plan for:
  - sender-level meaning
  - group-level meaning
  - fallback handling
  - anti-dominant-bucket decomposition

---

## Phase L2.4C — Rollup / Artifact Logic Plan
Purpose:
- define how artifact rollups should be generated from the refined taxonomy
- ensure cleanup groups and sender overview artifacts stay congruent

Scope:
- cluster/group rollups
- sender-overview rollups
- decomposition rollups
- trust / provenance rollups
- no rebuild

Exit criteria:
- one approved rollup plan that explains:
  - what is computed
  - from what source
  - at what level
  - how it remains truthful and mailbox-agnostic

---

## Phase L2.4D — Presentation Contract Plan
Purpose:
- define only the minimum presentation rules required to display truthful data
- this is NOT a redesign pass

Scope:
- denominator honesty
- chart meaning
- dominant-lane presentation
- decomposition presentation
- trust display
- no page-wide redesign during this phase
- no rebuild

Exit criteria:
- a sniper-scoped UI contract
- no competing dashboard logic
- no broad layout exploration

---

## Phase L2.4E — Focused Implementation Passes
Purpose:
- implement approved truth-model, taxonomy, rollup, and presentation changes in controlled order

Rules:
- no freeform redesign
- no rebuild during exploratory implementation
- each pass must prove exactly what changed and what did not

---

## Phase L2.4F — Single Final Rebuild + Validation
Purpose:
- run one rebuild only after the model is locked
- validate cleanup groups and sender overview together

Validation must prove:
- 100% coverage still holds
- cleanup groups remain mutually exclusive / collectively exhaustive
- sender-overview artifacts match taxonomy
- dominant buckets are valid or decomposed
- no fallback category is presented as primary intelligence
- request-time artifact behavior remains unchanged

---

# 6. Rebuild Strategy

Rebuilds are:

- NOT debugging tools
- NOT experimentation loops

Rebuilds are:
→ final materialization step

Rules:

- Only rebuild after plan is locked
- Only rebuild once per major milestone
- Never rebuild to “see what happens”

Rebuild policy for this project:
- plan first
- align taxonomy first
- align rollups first
- align cleanup groups and sender overview together
- rebuild last

A rebuild is only allowed once:
- taxonomy is locked
- rollups are correct
- cleanup groups are correct
- presentation contract is defined

---

# 7. Future-Proofing Requirements

The system must support:

- different inbox types
- different industries
- different email patterns
- different data densities

This requires:

- mailbox-agnostic taxonomy
- extensible subtype system
- flexible decomposition paths
- separation of meaning vs provenance

---

# 8. Non-Negotiables

The system must NEVER:

- allow null semantic meaning
- present fallback states as primary intelligence
- allow dominant bucket collapse without decomposition
- rely on client-side aggregation for truth
- reintroduce request-time mailbox scans
- distort percentages or visual scale
- redesign major surfaces before truth-model alignment is complete
- let cleanup-group artifacts and sender-overview artifacts drift apart
- use rebuilds as trial-and-error loops

---

# 9. Biggest Risks

## Risk 1 — Overfitting to this mailbox
Solution:
- validate across multiple group types

## Risk 2 — False semantic confidence
Solution:
- explicit resolution + confidence layer

## Risk 3 — One-shot rebuild blindness
Solution:
- plan fully before rebuild

---

# 10. Guiding Principle

We are not building:

> a prettier sender overview

We are building:

> an adaptive sender-intelligence truth system

UI is downstream of truth.
Cleanup groups, sender semantics, rollups, and decomposition rules must be aligned BEFORE presentation and BEFORE rebuild.

Sender Overview is still intended to function as an intelligent dashboard for the selected cleanup group. The rule is not `less intelligence`; the rule is `truth first, then intelligence presentation`.

---

# 11. Immediate Reset Direction

Current priority:

1. STOP broad sender-overview redesign work
2. RETURN to truth-model alignment
2.5 KEEP Sender Overview positioned as the intelligent dashboard for the selected cleanup group
3. TREAT cleanup-group artifacts and sender-overview artifacts as ONE system
4. DEFINE taxonomy, rollup, and decomposition rules FIRST
5. DO ONE rebuild only after everything is locked

This means:
- next Codex work must be planning, not redesign
- no more UI passes until truth model is stable

---

# END OF BUILD PLAN