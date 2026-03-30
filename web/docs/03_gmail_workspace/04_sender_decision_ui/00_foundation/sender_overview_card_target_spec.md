

# Sender Overview Card Target Spec

## ⚠️ ARCHITECTURE UPDATE (Phase L — Unified Sender Surface)

This document now defines a **single sender card system used in two modes**:

- Overview Mode (exploration, comparison, context)
- Decision Mode (focused execution, one sender at a time)

The card structure, data, and truth layers are identical in both modes.
Only interaction state changes.

Decision Mode is NOT a separate UI or separate card.
It is a promoted / focused state of the same sender card.

Transition into Decision Mode happens in-place (overlay or focus shift), not by navigating to a different screen.

This document must be interpreted with that constraint.

## Purpose

This document defines the exact target layout and visual hierarchy for Sender Overview sender cards inside the Gmail workspace. It is the UI and structure source of truth for Codex when working on the sender workflow surface. Codex should not invent alternative card structures when implementing this area; it should build toward this target in narrow phases.

This document is separate from the broader recovery plan:
- `Sender_Overview_Recovery_and_Improvement_Plan.md` = phased recovery / troubleshooting / sequencing
- `sender_overview_card_target_spec.md` = exact card target / layout blueprint

---

## Core Design Principles

### 1. One primary takeaway per sender
The card must answer the operator’s first question immediately:
- what this sender is
- what kind of attention it needs
- what to inspect next

### 2. Proof should appear near the top
Visible recent evidence must sit close to the main takeaway. Proof is more valuable than long explanation.

### 3. Supporting truth layers must stay secondary
These layers must stay separate, but they must not compete equally with the primary takeaway:
- canonical Gmail category truth
- pattern truth
- operator interpretation
- recent visible evidence

### 4. Plain English beats classifier jargon
The card should use operator language, not internal model language.
Prefer:
- `Account notifications`
- `Commerce / shipping`
- `Check recent proof before archiving`

Avoid surfacing phrases like:
- `refines category truth`
- `signal bucket`
- `eligible`
- `category profile mode`
- `dominant category confidence`
unless they are translated into plain English and clearly useful.

### 5. Fewer chips, more meaning
A small number of meaningful labels is better than a cloud of bubbles. Badges should be reserved for:
- primary sender type
- caution state
- destination / managed state if truly necessary

### 6. The card is a workflow surface, not a debugging console
The sender row should guide action. It should not feel like an internal classifier dump.

### 7. Same card, different mode
The sender card must not diverge between Overview Mode and Decision Mode.

- Overview Mode = multi-card, exploratory surface
- Decision Mode = single-card, focused surface

The data and layout remain the same.
Decision Mode only adds interaction (actions, progress, flow).

---

## Truth Layers We Must Preserve

These truth layers must remain separate in both layout and semantics:

### 1. Canonical category truth
Sender-global Gmail category distribution from persisted sender stats.
Examples:
- Updates
- Promotions
- Social
- Forums
- Primary
- Uncategorized

### 2. Pattern truth
Heuristic pattern interpretation from subject/history.
Examples:
- General updates
- Commerce / shipping updates
- Alerts / security
- Human correspondence

### 3. Operator interpretation
Actionable sender-type interpretation derived from sender-global truth.
Examples:
- Account notifications
- Marketing / promotional
- Commerce / transactional
- Security alerts
- Social / community

### 4. Recent visible evidence
The local preview slice currently visible in the sender row.
Examples:
- three recent Updates previews
- one Promotions preview and two Updates previews

Important rule:
These layers may disagree. That is acceptable. The layout must make disagreement understandable, not hide it.

---

## Collapsed Sender Row Spec

NOTE:
This is the Overview Mode representation of the sender card.
Clicking a sender must promote this into Decision Mode (overlay), not expand into a different card system.

The collapsed row should have only four visual layers.

### 1. Identity row
This row identifies the sender.

Left side:
- sender name or sender email
- domain
- last activity date or recency

Right side:
- compact metrics string
  - example: `1,074 msgs · 1,067 unread`
- one state marker only if truly useful
  - `Managed`
  - `Eligible`

### 2. Primary sender-type line
This is the main takeaway line.

It should contain:
- one plain-English sender type
- one short risk or next-step hint only if useful

Examples:
- `Account notifications with protected context`
- `Commerce / shipping sender`
- `Marketing / promotional sender`
- `Security alert sender`
- `Social / community sender`
- `Insufficient data`

Important:
This should feel like a human-readable interpretation, not a label stack.

### 3. Proof summary line
This line gives a compact truth check with no chip cloud.

Format:
- `Profile: Updates · Promotions`
- `Visible now: Updates`

Rules:
- max two values plus optional `+N`
- text-first presentation
- no big boxed lane containers
- chips only for the category values if absolutely needed

### 4. Risk / action line
Show only when needed.

Allowed items:
- `Protected`
- `Verify first`
- `Needs review`

Do not show a large extra caution row when nothing meaningful is present.

---

## Expanded Sender Card Spec

NOTE:
This expanded card is the SAME component used in Decision Mode.

Decision Mode uses this exact layout, but:
- locks focus to a single sender
- enables decision actions
- adds progress context

The expanded sender card should have only three stacked zones.

A. Sender takeaway hero
A single strong, full-width hero card.

This section must answer:
- what this sender is
- why we think that
- what to inspect next
- whether there is meaningful risk

Contents:
- primary sender type
- short plain-English explanation
- short next-step hint
- caution state only if relevant

Example:
- **Account notification sender**
- Mostly Updates/Primary history with broad recurring account-type behavior.
- Next: inspect recent proof before making a broad archive decision.
- Risk: protected context is present.

Rules:
- keep this short
- no dense chip wall
- no duplicated restatements of the same idea

In Decision Mode:
- this section becomes the primary decision context
- must remain concise and immediately actionable

B. Visible proof
This must come directly under the hero.

This is the main inspection surface.

Contents:
- grouped visible evidence by visible category
- preview snippets/messages
- way to inspect more than one visible behavior when present
- load more previews if available

If the sender has both Updates and Promotions, the operator must be able to inspect both.

The visible proof section should feel more important than the supporting truth footer.

In Decision Mode:
- this section becomes the primary evidence surface for decision-making
- must support fast scanning without scrolling when possible

C. Supporting context footer
This must be compact and secondary.

It should contain only three compact items:
- Category truth
- Pattern truth
- Signal

Examples:
- `Category: Updates 908 · Promotions 162`
- `Pattern: General updates`
- `Signal: Unclear`

Rules:
- no same-weight mini-dashboard
- no separate boxed diagnostic cards competing with proof
- no giant machine/human score badge text
- this is supporting context, not the main story

In Decision Mode:
- this section remains secondary and must never compete with proof or primary takeaway

---

## Preferred Visual Elements

## 1. Segmented category-history bar
Use a segmented horizontal bar for sender-history category mix.

Purpose:
- quickly show distribution across sender-global Gmail categories
- faster to scan than only text
- better than a pie chart inside a compact sender card

Segments may include:
- Updates
- Promotions
- Social
- Forums
- Primary
- Uncategorized

This can appear in the expanded card only, not required in collapsed state.

## 2. Segmented visible-now bar
Use a smaller segmented horizontal bar for the current visible slice.

Purpose:
- quickly compare sender-history truth to current visible behavior
- surface when the visible slice differs from long-term profile

This should remain secondary to actual preview evidence, not replace it.

## 3. Grouped preview evidence list
This is required.

Use grouped visible evidence blocks with:
- category group heading
- message subjects/snippets
- expand/open preview actions
- load more when available

This is the strongest proof surface in the card.

## 4. Compact metrics row
Use one short metrics row rather than multiple stat bubbles.

Examples:
- `1,074 msgs · 1,067 unread`
- `324 msgs · 0 unread`

## 5. Optional future mini timeline
A compact row-level timeline of recent activity volume may be useful later, but it is not part of Phase 1.

Mark as future / optional.

## 6. Pie chart / donut guidance
Do **not** use pie/donut as the primary visualization inside the sender row.

Reason:
- harder to compare in narrow card widths
- worse for multi-category scanning
- more decorative than useful in compact operational UI

If pie/donut is ever used, it should be limited to higher-level summary modules, not the main sender row.

---

## Exact Card Sketch

## Collapsed row

- Sender identity
- Sender type
- Profile summary
- Visible-now summary
- Caution only if needed

Example sketch:

```text
Zillow <instant-updates@mail.zillow.com>      1,074 msgs · 1,067 unread
mail.zillow.com • last active 3/20/2026       Eligible

Account notifications with protected context
Profile: Updates · Promotions
Visible now: Updates
Protected • Verify first
```

Important:
- this should not become a chip wall
- the second line is the most important one
- the truth summaries should stay compact

## Expanded row

Example sketch:

```text
┌──────────────────────────────────────────────────────────────┐
│ Account notification sender                                 │
│ Mostly Updates/Primary history with recurring account-type  │
│ behavior.                                                   │
│ Next: inspect recent proof before making a broad decision.  │
│ Risk: protected context is present.                         │
├──────────────────────────────────────────────────────────────┤
│ Visible proof                                               │
│ Updates (3)                                                 │
│  • New Listing: 4725 Teal Duck Ct...                        │
│    preview text... [Open preview]                           │
│  • New Listing: 2913 Old Glory Rd...                        │
│    preview text... [Open preview]                           │
│ Promotions (1)                                              │
│  • Upgrade your alerts settings                             │
│    preview text... [Open preview]                           │
├──────────────────────────────────────────────────────────────┤
│ Category: Updates 908 · Promotions 162                      │
│ Pattern: General updates                                    │
│ Signal: Unclear                                             │
└──────────────────────────────────────────────────────────────┘
```

This is the intended reading order:
1. what this sender is
2. what proof supports it
3. what supporting truth context exists

---

## Plain-English Content Rules

Use language that helps the operator decide.

Prefer:
- `Account notifications`
- `Commerce / shipping`
- `Marketing / promotional`
- `Security alerts`
- `Social / community`
- `Check recent proof before archiving`
- `Protected context is present`
- `Not enough sender history yet`

Avoid or demote:
- `refines category truth`
- `signal bucket`
- `dominant category confidence`
- `category profile mode`
- `operator profile mode`
- `machine evidence score`
- `human evidence score`
- `verification markers still need review`

If a technical term must survive internally, it should not lead the operator-facing UI.

---

## Explicit Anti-Patterns

These should not reappear in Sender Overview:

- too many bubbles/chips
- stacked equal-weight `Profile / Operator / Visible` boxes
- giant caution block separate from the main takeaway
- separate next-step panel competing with proof
- proof buried below multiple interpretation cards
- repeated restatement of the same meaning in multiple panels
- diagnostic jargon presented as if it is self-explanatory
- equal visual weight for every truth layer
- showing only a tiny slice of proof without a clear way to inspect more when multiple categories exist

---

## Phase Breakdown

## Phase 0. Mode Unification (NEW)
Goal:
- unify Sender Overview and Decision Mode into a single card system

Scope:
- define Overview vs Decision Mode behavior
- define overlay / focus transition
- ensure no duplicate card systems exist

This phase must be completed before any layout or data work.

## Phase 1. Layout only
Goal:
- build the sender card in the correct visual structure
- no backend changes
- no loading changes
- no model changes

Scope:
- collapsed row structure
- expanded row structure
- section ordering
- reduction of chip/badge overload
- text simplification

## Phase 2. Data wiring
Goal:
- wire the existing fields into the exact zones of the new layout

Scope:
- map operator profile into sender takeaway
- map category truth into supporting footer
- map visible proof into grouped evidence area
- ensure caution states appear in the right place

## Phase 3. Truth validation
Goal:
- verify that the data populating the new card is accurate and coherent

Scope:
- inspect contradictory or confusing cases
- verify global truth vs visible slice behavior
- identify where the data model still needs improvement

## Phase 4. Richer visuals and deeper proof browsing
Goal:
- add optional richer visuals only after layout and data are stable

Possible scope:
- segmented bars
- better proof browsing across categories
- pagination/load-more clarity
- optional mini timelines

---

## Codex Working Rules

When using this document in Codex:
- treat it as the exact UI target for Sender Overview sender cards
- do not invent alternate card layouts
- do not mix layout, backend, runtime, and architecture work in the same pass unless explicitly asked
- preserve runtime containment and first-open safety unless a phase explicitly targets loading behavior
- prefer narrow sniper passes with obvious screenshot-visible results
- after each meaningful pass, report exact files changed, before/after behavior, and what remains out of scope

For the current moment:
- use this document as the build target for Sender Overview card work
- use `Sender_Overview_Recovery_and_Improvement_Plan.md` as the broader sequencing / roadmap anchor

---

## Relationship To Other Docs

Use this document alongside:
- `Sender_Overview_Recovery_and_Improvement_Plan.md`
- `workspace_ui_structure.md`
- `workspace_ux_spec.md`
- `sender_decision_mode_spec.md`
- `final_product_spec.md`
- `gmail_workspace_product_flow.md`

This document is the most specific card-level UI target.
The other docs provide workflow, system, and product context.

## Unified Interaction Model (Final)

User flow:

Cleanup Group → Sender Overview → Click Sender → Decision Mode (overlay) → Next → Next → Next → Management

Key rules:
- user must never lose context
- sender identity must persist across modes
- no navigation reset between overview and decision
- decision must always be available when a sender is in focus

This creates a continuous "slippery slide" from exploration → decision → completion.
