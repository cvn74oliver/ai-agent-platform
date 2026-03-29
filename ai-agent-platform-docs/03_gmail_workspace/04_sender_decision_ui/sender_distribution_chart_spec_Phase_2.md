

# Sender Distribution Chart Spec — Phase 2

## Purpose
Define Phase 2 of the Shared Analysis Rail for Sender Overview by adding a second analysis mode: **Sender Distribution**.

This mode should let operators understand **who is driving activity inside the selected cleanup group** without adding another full-width chart below Time Context.

It must plug into the same shared rail foundation established in Phase 1.

---

## Relationship to Phase 1

Phase 1 establishes:
- the shared analysis rail container
- the interactive chart frame
- hover quick read behavior
- click-to-lock selected state
- dynamic supporting context below the chart

Phase 2 reuses that same rail and adds a second operator-selected analysis lens:
- `Time Context`
- `Sender Distribution`

No carousel behavior should be used.
Operators should switch modes using explicit **tabs / segmented controls**.

---

## Core Product Goal

Sender Distribution should answer:

- Who is contributing the most activity in this cleanup group?
- Is this group dominated by a few senders or spread across many?
- Which senders should the operator inspect first?
- How does sender concentration change depending on the selected scope/window?

This chart should make the page feel more like an analytical decision surface, not just a sender list.

---

## Product Principles

### 1. One rail, two lenses
- Do not stack Time Context and Sender Distribution as separate full-width sections.
- Keep one shared analysis frame.
- Only one chart mode is visible at a time.

### 2. Operator control, not passive browsing
- Use explicit mode switching.
- Do not use arrows, sliding carousel treatment, or decorative “next chart” behavior.

### 3. Reuse the proven interaction model
Sender Distribution should inherit the same interaction model as the upgraded Time Context rail:
- hover quick read
- click-to-lock selection
- dynamic supporting context below

### 4. Start with the most operationally useful view
The chart should help the operator decide where to look next in Review Senders.
It should not try to become a full BI dashboard in v1.

---

## Phase 2 Scope

### In Scope
- Add `Sender Distribution` as the second analysis mode in the shared rail
- Define chart structure and interaction model
- Reuse the same supporting context block pattern
- Keep data artifact-backed
- Keep mode switching clear and lightweight

### Out of Scope
- No new backend contracts in this spec unless separately approved
- No Decision Mode changes
- No Cleanup Groups redesign
- No sender workflow redesign
- No advanced chart filtering system
- No metric-switching matrix in v1
- No third chart mode yet

---

## Chart Model

### Default meaning
Each bar represents **one sender** inside the currently selected cleanup group.

### Default metric
Use:
- **supporting message count in scope**

This should be the primary ranking metric in Phase 2 because it best aligns with how the page currently frames contribution and review priority.

### Sorting
Default sort:
- descending by supporting message count

Potential later sorts (not part of this spec unless separately approved):
- unread count
- recent activity
- managed state

### Visible density
The chart should show a bounded visible set in the rail view so it remains legible.
The supporting context and hover model should carry the detail, not tiny unreadable labels.

---

## Shared Rail Structure

```text
[ Analysis Rail Header ]
    [ Time Context ] [ Sender Distribution ]

[ Full Width Chart Area ]

[ Dynamic Supporting Context Block ]
```

### Mode behavior
- `Time Context` remains one mode
- `Sender Distribution` becomes the second mode
- Switching modes preserves the rail container and swaps only the chart + mode-specific supporting context

---

## Interaction Model

### Default state
- Default selected mode is determined by page logic; if the user switches to Sender Distribution, that mode should stay active until changed again within the session/page state model chosen in implementation.
- No sender is locked by default.
- The supporting context block should show a sensible baseline read from the currently highest-contributing visible sender unless implementation chooses a “no sender selected” neutral baseline. Codex should decide which is clearer, but it must be explicit and non-confusing.

### Hover
Hovering a sender bar should show a quick read panel with:
- sender name
- message count
- % of group
- rank position
- short interpretation

Example interpretations:
- “This sender is one of the largest contributors in this group.”
- “This sender contributes a small share relative to the top contributor.”
- “This group is concentrated near the top.”
- “Contribution is spread more evenly across senders.”

### Click
Clicking a sender bar should:
- lock that sender as the active selection in the rail
- update the supporting context block below
- keep hover on other bars as temporary preview only

### Deselect
- Clicking the locked sender again clears the locked state
- A small explicit `Clear selection` action should also exist inside the supporting context area

---

## Supporting Context Block

The supporting context block below Sender Distribution should answer:

### 1. What you are looking at
- which sender is selected
- where they rank
- how much of the group they represent

### 2. Why it matters
- whether the group is top-heavy or distributed
- whether this sender is materially shaping the group
- whether this sender is representative or an outlier

### 3. What to do next
- if this sender is dominant: start with this sender
- if the chart is distributed: review the top few senders, not just one
- connect naturally to the existing Review Senders workflow below

### Example narrative structure
- **What happened:** “This sender is the largest contributor in the group.”
- **Why it matters:** “A large share of this group’s activity is concentrated here.”
- **What to do:** “Start with this sender, then compare it to the next few contributors below.”

The language should remain operator-guided and product-oriented, not analytical jargon.

---

## Time Window / Scope Behavior

Sender Distribution should remain aligned to the current page scope.

### Default behavior
- Use the current cleanup group and active analysis scope
- Do not become a disconnected standalone chart

### Future direction
If the analysis rail later gains shared timeframe controls, Sender Distribution should respond to those controls consistently.
That shared-control design is not required in Phase 2 unless separately approved.

---

## Visual Rules

- Keep the chart full-width inside the shared rail
- Match the visual seriousness of Time Context
- No decorative carousel treatment
- Hover must add meaning, not repeat labels
- Supporting context must feel secondary to the chart, but stronger than ordinary body copy
- Use clean rank visibility without turning the chart into a cluttered spreadsheet
- Do not overload bars with too many labels at once

---

## Data Requirements

Phase 2 should prefer existing artifact-backed data.

Needed inputs conceptually:
- sender identity
- supporting message count
- group-relative contribution
- rank order

If exact implementation needs a contract decision, Codex should evaluate whether current Sender Overview data already supports this cleanly or whether a later narrowly scoped contract expansion is needed. That question should be treated as an implementation-planning concern, not assumed silently.

---

## Risks / Considerations

### 1. Density risk
Too many sender bars can become visually noisy.
The rail should show enough to reveal shape without becoming unreadable.

### 2. Misleading precision risk
Percentages must remain clearly tied to the selected cleanup group scope.

### 3. Overlap risk with Review Senders
Sender Distribution should guide Review Senders, not duplicate the entire lower list.

### 4. Scope creep risk
Do not let Phase 2 turn into a full sorting/filtering dashboard. The first version should stay focused.

---

## Recommended Implementation Sequence

### Phase 2A
- Add Sender Distribution as second analysis rail mode
- Use default ranking by supporting message count
- Add hover quick read
- Add click-to-lock selection
- Add dynamic supporting context

### Phase 2B (later, optional)
- Improve timeframe coordination with Time Context
- Add deeper sender exploration behavior if needed
- Evaluate whether sender click should deep-link to lower workflow state

---

## Success Criteria

Sender Distribution is successful if:
- operators can visually tell whether the group is concentrated or distributed
- they can quickly identify the biggest contributors
- hover gives useful detail without clutter
- click selection updates the supporting narrative below
- the chart feels like part of one coherent analysis rail, not an unrelated extra section

---

## Summary

Phase 2 extends the shared analysis rail from:
- **when activity happened**

to:
- **who is driving activity**

Together, the two modes give operators:
- time-based understanding
- sender-based understanding

inside one unified analytical surface.