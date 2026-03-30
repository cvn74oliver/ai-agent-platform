# Sender Overview — Middle Structure Spec

## Purpose

This spec defines the **middle structure** of Sender Overview for Gmail Workspace.

It exists to make the surface read like a guided story instead of an internal analysis dump.

The page must help the operator move smoothly from:

```text
What this group is
→ how to think about it
→ what is inside it
→ how stable that read is
→ when it was active
→ what to review next
```

This spec intentionally focuses on the rows **after the hero** and **before deep sender review**.

The goal is:
- stronger guidance
- better visual communication
- less confusion
- less scrolling waste
- clearer handoff into sender review

---

## Source of Truth Rule

This file is the authoritative structure spec for Sender Overview middle layout.

Location:
`ai-agent-platform-docs/03_gmail_workspace/04_sender_decision_ui/SENDER_OVERVIEW_MIDDLE_STRUCTURE_SPEC.md`

Any implementation pass for Sender Overview middle layout must read this file first.

---

## Page Story (Non-Negotiable)

The Sender Overview page must tell a clean story in this order:

### 1. What this group is
This is already handled by the hero.

### 2. How to think about this group before acting
A short bridge that explains the review mindset.

### 3. What is actually inside this group
A compact visual read of semantic composition and sender concentration.

### 4. How stable that descriptive read is
A lightweight confidence / stability aid, not a dominant analysis block.

### 5. When the group was most active
A time-context layer that shows whether this is current, historical, or mixed.

### 6. What to review next
A clear handoff into sender review.

If any row does not move the operator forward in that story, it should be removed, compressed, or redesigned.

---

## High-Level Structure

### Keep
- Hero row

### Redesign now
- Structural Context / What to Watch row
- Descriptive Semantic Mix row
- Supporting Message Weight / Top Contributors row
- How Reliable This Read Is block

### Redesign later
- Time Context line/chart
- Sender review workflow lower section
- Pagination / deeper sender browsing

---

## Wireframe (Target Layout)

```text
[ HERO — KEEP AS IS ]

[ HOW TO REVIEW THIS GROUP ]     [ REVIEW APPROACH ]
[ why this group exists ]        [ how to evaluate senders here ]

[ DESCRIPTIVE SEMANTIC MIX ]     [ SENDER CONCENTRATION ]
[ ranked semantic bars ]         [ ranked top-contributor chart ]

[ READ STABILITY — COMPACT STRIP ]

[ TIME CONTEXT — FUTURE PRESSURE-TREND STYLE ROW ]

[ REVIEW SENDERS — EXISTING LOWER WORKFLOW, LATER PASS ]
```

This is the intended middle-structure hierarchy.

---

# Row-by-Row Specification

## Row 1 — Hero

### Status
Keep.

### Reason
The hero already does the correct job:
- names the cleanup group
- explains sender count / scope
- reinforces the sender review goal
- mirrors Mailbox Intelligence structure well

### Instruction
No major redesign in the first middle-structure pass.

---

## Row 2 — Replace current “Structural Context / What to Watch” with one clean bridge row

### Problem with current row
The current row mixes:
- structural explanation
- caution language
- review warnings
- repeated “protected traffic visible” phrasing
- stacked blocks that consume a lot of space but do not clearly tell the user what to do

This makes the page feel more confusing instead of more guided.

### New row title
**How to review this group**

### Layout
Two cards, side by side.

#### Left card
### Why this group exists
Purpose:
Explain structural meaning in plain English.

Target copy style:
> This is a structural cleanup group.
> It exists to keep important or protected traffic visible while you review senders one by one.

Rules:
- no internal artifact language
- no “grouping rules outrank semantic interpretation” phrasing on the visible surface
- no jargon
- keep this short

#### Right card
### Review approach
Purpose:
Tell the operator how to act.

Target copy style:
> Review senders carefully.
> Some senders may mix invoices, updates, and promotional traffic, so use the sender card to inspect evidence before deciding.

Rules:
- action-oriented
- plain language
- no vague caution labels
- no duplicate safety-note cards

### Remove from this row
Remove or fully replace the following concepts as dominant cards:
- What to Watch
- Review the Right Cautions
- High Caution
- duplicate safety-note blocks
- stacked mini-cards that repeat the same warning in different words

### Visual style
- two medium cards
- equal width
- compact height
- one icon or visual accent per card is okay
- no large charts here
- no gradients or decorative bars that imply progress

This row is a bridge, not an analysis dashboard.

---

## Row 3 — What’s inside this group

### Purpose
This row should answer:
> What kinds of senders and content are most visible inside this group?

### Layout
Strict 50 / 50 split.

---

### Left side — Descriptive Semantic Mix

#### Purpose
Show semantic composition clearly and compactly.

#### Current problem
The current Descriptive Semantic Mix area takes too much width and uses too much space for the value it provides.

#### Required chart type
Use a **ranked horizontal bar chart**.

Not:
- giant full-width block
- oversized progress-style rails
- decorative visuals without comparison value

#### Required visual rules
- one row per semantic family
- each row has:
  - color chip or colored bar fill
  - semantic family label
  - percentage
  - optional count or support count if space allows
- bars sorted from largest to smallest
- top visible categories only
- compact vertical spacing

#### Color direction
Use consistent family-level colors that are easy to visually differentiate.

Suggested direction:
- Commerce / shipping → teal or cyan
- Account / service updates → blue
- Marketing / promotional → purple
- Security → amber or orange
- Human correspondence → green
- Unknown / mixed / thin history → gray

Colors must be:
- consistent across this page
- readable in dark mode
- not neon or decorative for decoration’s sake

#### Width rule
This chart must end at roughly half-width.
It must NOT stretch across the full page.

---

### Right side — Sender Concentration

#### Purpose
Show whether this group is dominated by a few senders or spread across many.

#### Current problem
The current Supporting Message Weight presentation is not useful when many top senders show tiny percentages like 2% / 2% / 2% with mini progress bars.

#### Required chart type
Use a **ranked horizontal bar chart** for top contributors.

Do NOT use:
- tiny progress bars
- six nearly identical low-percentage bars that communicate no shape

#### Required behavior
- default visible set: top 10 senders
- later expandable toward top 30
- bars sorted descending
- each row should show:
  - sender label
  - share / percent
  - optional support count if space allows

#### Visual rule
This chart should visually communicate concentration shape:
- steep dropoff = concentrated group
- flat field = distributed group

That is the core insight the chart must provide.

#### Width rule
This chart occupies the right 50% of the row.

---

## Row 4 — Read Stability (compact only)

### Purpose
Give the operator a lightweight sense of whether the descriptive semantic read is clear or mixed.

### Current problem
The current “How Reliable This Read Is” block is confusing.
The operator should not need to decode:
- unclear multi-color meter meaning
- “80% low confidence” style wording
- “main evidence source” language
- internal model logic

### Decision
Keep a much smaller version only.

### New row title
**How stable this read is**

### Allowed content
Only show:
- Clear pattern
- Mixed pattern
- Limited history

Example structure:
- 29 clear pattern
- 45 mixed pattern
- 26 limited history

### Required visual type
Use a **compact segmented bar** or **three-pill summary strip**.

#### Option A (preferred)
Segmented bar with three clearly labeled segments:
- clear pattern
- mixed pattern
- limited history

#### Option B
Three adjacent metric pills with counts.

### Remove from this row
Do not include:
- “main evidence source” percentages
- unexplained confidence breakdowns
- vague color legend the user has to decode
- large blocks of explanatory copy

### Role in page hierarchy
This is a supporting strip, not a centerpiece.
It should be visually quieter than Row 3.

---

## Row 5 — Time Context (future redesign lane)

### Purpose
Answer:
> When was this group most active, and is it recent or historical?

### Direction
This should eventually move toward the Pressure Trend interaction model.

### Future visual target
- compact bar/timeline chart
- hover reveals period detail
- click pins summary below
- selected period gives:
  - message volume
  - comparison period
  - short interpretation

### Important
Do NOT fully redesign this row in the first Codex pass.

For the first middle-structure pass:
- preserve current function if needed
- only note it as a future redesign target

---

## Row 6 — Review Senders (later pass)

### Purpose
Handoff from interpretation into action.

### Direction
This section should eventually become the strongest operational handoff on the page.

It should say:
> Here is where you start reviewing senders.

### Important observations
- current sender cards are too tall
- too much dead space
- too much scrolling
- detail belongs in Decision Mode, not in oversized overview cards

### Future card-density rules
When this row is redesigned later:
- cards should be significantly thinner
- target roughly 1.5–2 inches tall visually
- dense enough to show many senders per viewport
- enough information to choose where to click
- not enough detail to replace Decision Mode

The review surface should be optimized for fast scanning.
If the cards still feel too tall after a density pass, a more list-like presentation is preferred over preserving oversized cards.
Decision Mode remains the place for deep detail; Sender Overview should prioritize scan speed and click confidence.

### Future additions
Later lane may include:
- sender workflow pagination (default view should target 10 rows per page, not 12)
- denser card list with materially shorter cards
- stronger queue summary
- explicit “start here” guidance
- optional compact sender-table / list mode if cards still waste too much space

### Important
Do NOT fully redesign the sender review workflow in the first pass.

---

# Visual System Rules

## General rule
Every analytical row should use a visual aid alongside text and numbers.

Humans read structure and comparisons better when supported by visuals.

### Preferred visual forms
- ranked horizontal bars
- compact segmented bars
- trend bars
- color-coded category distinctions
- small visual anchors that support interpretation

### Avoid
- giant empty cards
- full-width blocks for low-density content
- decorative bars that do not add meaning
- circles / donuts unless they clearly outperform bars for the specific comparison
- progress bars where there is no real progress concept

### Visual density rule
Rows should feel compact and readable.
The page should not waste vertical real estate on explanation-heavy blocks.

---

# Copy Rules

## Required style
- plain English
- short sentences
- action-guiding
- avoid internal system language
- avoid artifact jargon
- avoid abstract “confidence about confidence” phrasing

## Operator-first rule
The operator should be able to answer these questions quickly:
- What is this group?
- How should I review it?
- What is most visible inside it?
- How stable is that read?
- When was it active?
- Where do I start?

If the row does not help answer one of those questions, it should be simplified or removed.

---

# What should be removed or strongly reduced

The following current elements should not remain as dominant structures in the first pass:
- What to Watch as a large standalone caution system
- Review the Right Cautions block
- duplicate safety-note language
- oversized confidence block with hard-to-read color logic
- low-information top-contributor mini-progress bars

These either need to be removed, rewritten, or compressed into supporting language.

---

# First Codex Pass Scope

## This is the first implementation pass only

### Allowed in first pass
- keep Hero as-is
- redesign Row 2 into the new two-card bridge row
- restructure Row 3 into a strict 50 / 50 analysis row
- convert Supporting Message Weight into a proper concentration chart
- shrink / simplify Row 4 into a compact read-stability strip

### Not allowed in first pass
- full Time Context redesign
- sender workflow redesign
- pagination implementation
- Decision Mode redesign
- artifact rebuild work
- semantic evidence mapping
- deeper evidence expansion UX

---

# First Pass Success Criteria

The first Codex pass is successful if:
- the page tells a cleaner story after the hero
- the bridge row is understandable immediately
- the semantic mix no longer wastes full-width space
- the concentration chart is visually meaningful
- the read-stability section is smaller and easier to understand
- the middle of the page feels guided instead of confusing

Note:
A successful first pass does not need to solve the full sender-distribution problem or sender-workflow density problem. Those are tracked as later lanes and should not be forced into the early middle-structure passes.

---

# Future Lanes (Tracked but Deferred)

## Future Lane A
Time Context redesign toward Pressure Trend interaction model.

## Future Lane B
Review Senders section redesign with denser cards.

## Future Lane C
Sender workflow pagination.

## Future Lane D
Expanded sender distribution view.

Purpose:
Give the operator a high-level visual way to compare all senders in the group, not just the top contributors.

Desired direction:
- full-width row or major panel
- ranked sender-distribution chart
- sortable / switchable time window
- hoverable sender detail
- able to reveal long-tail distribution across the whole group

Important:
This is different from `Sender concentration`.
`Sender concentration` shows the most influential visible contributors.
This future lane should show the broader shape of the full sender population.

## Future Lane E
Decision Mode evidence expansion / semantic-group-specific evidence browsing.

---

# Codex Implementation Notes

When implementing the first pass:
- stay close to this spec
- do not invent new page sections
- do not widen scope
- prioritize clarity over novelty
- prefer compact, visually legible charts over clever but hard-to-read designs

If a detail is ambiguous, choose the option that makes the page easier to understand in under 5 seconds.

## Direction for upcoming passes

The next likely UI lanes after the current middle-structure passes are:
1. sender workflow density reduction
2. sender workflow pagination
3. expanded sender distribution view

These should be treated as separate sniper passes, not bundled casually into middle-structure cleanup.
