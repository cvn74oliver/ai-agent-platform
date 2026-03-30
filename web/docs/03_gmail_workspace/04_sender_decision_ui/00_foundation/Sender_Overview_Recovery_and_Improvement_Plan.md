## ⚠️ STATUS NOTE — Partially Superseded by Unified Sender Surface

This document may still contain useful implementation detail, but it predates the unified sender-surface architecture.

Current canonical source:
- `03_gmail_workspace/03_decision_system/sender_surface_unification_spec.md`

## ACTIVE RECOVERY STATUS NOTE

Current Sender Overview recovery status:
- the review page itself is stable again
- the broad fast-store experiment was rolled back
- in-rail timeframe clicks no longer trigger the earlier full-page instability
- page shell, header shell, and sender-list shell now stay mounted during local rail interaction
- the current unresolved problem is narrower: unseen timeframe clicks in the rail still fall back to a technical placeholder instead of a real product recovery state

Current active recovery priority:
- fix rail-only unseen-scope fallback behavior with a hyper-focused pass
- do **not** reopen broad fast-mode architecture, runtime/service rewrites, or page-wide substitutions in that pass

Until that corrective rail fallback pass is complete, treat this document’s earlier phase ordering as temporarily superseded by the active recovery priority below.


If this document conflicts with the unified sender-surface model, the unified model wins.

Current planning boundary:
- Shared Analysis Rail architecture, tab structure, and chart-system evolution are now governed by:
  - `04_sender_decision_ui/01_analysis_rail/SENDER_ANALYSIS_RAIL_SPEC.md`
  - `04_sender_decision_ui/01_analysis_rail/Shared_Rail_Analysis_spec.md`
  - `04_sender_decision_ui/01_analysis_rail/SHARED_ANALYSIS_RAIL_IMPLEMENTATION_PLAN.md`
- Sender Distribution behavior is now governed by:
  - `04_sender_decision_ui/02_distribution_chart/SENDER_DISTRIBUTION_CHART_SPEC.md`
  - `04_sender_decision_ui/02_distribution_chart/sender_distribution_chart_spec_Phase_2.md`

Therefore, this document should now focus primarily on:
- sender-card usability
- preview reliability
- cold-load performance
- operator-profile usefulness
- proof quality

It should no longer act as the primary source of truth for analysis-rail architecture.

Key architecture update:
- Sender Overview and Decision Mode are no longer separate systems
- They are now two modes of one shared sender card system
- Decision Mode is entered in-place (overlay/focus), not through a disconnected screen transition


# Sender Overview Recovery and Improvement Plan

## Purpose

This document is the working source of truth for fixing the Sender Overview experience inside Operations Review.

The goal is to turn Sender Overview into a surface that is:
	•	fast enough to trust
	•	visually readable
	•	operationally clear
	•	grounded in accurate mailbox data
	•	useful for real sender-by-sender decisions

This document exists so progress does not get lost between long Codex passes. Each phase should be handled as a narrow sniper pass. We are not trying to fix everything at once.

⸻

## 1. Current State Summary

A lot has improved already:
	•	passive heavy-path blowups were contained
	•	first-open reliability is much better
	•	page contrast and hierarchy are far better than before
	•	canonical sender category truth was separated from pattern truth
	•	operator profile v1 now exists in persisted sender stats
	•	pages are loading again and the system is usable

Additional status update:
- the analysis/chart layer is now being split into a dedicated Shared Analysis Rail track
- that rail work should not be planned from this document anymore
- this document remains the anchor for sender-row/card, proof, preview, and performance recovery

But Sender Overview is still not in “great condition.”

The main problem now is no longer catastrophic system instability.
The main problem is that the Sender Overview product experience is still too confusing, too noisy, and too slow in the wrong places.

⸻

## 2. What Still Feels Broken

A. Sender Overview is still too hard to understand

The page still feels like a diagnostic console instead of an operator workflow.

Problems:
	•	too many chips, bubbles, and labels
	•	too many truth layers shown at once
	•	repeated meaning in different places
	•	too much robotic language
	•	hard to tell what matters most
	•	hard to know what action to take next

Examples of confusion:
	•	“Profile,” “Operator insight,” and “Visible” are all present, but not naturally obvious
	•	“Dominant,” “high confidence,” “refines category,” “pattern truth,” “signal bucket,” “verify first,” etc. all compete for attention
	•	“Unclear,” “eligible,” “protected,” “verify first,” “medium confidence” do not read like plain operator language
	•	the page often explains the model instead of helping make a decision

B. The drill-down cards are not yet optimized for decision-making

The sender row should help answer:
	1.	what this sender is
	2.	why it landed in this cleanup group
	3.	what I should inspect next
	4.	what risk exists if I act on it

Right now the sender card still feels too verbose and too layered.

Problems:
	•	too much text before useful proof
	•	too much secondary metadata
	•	not enough priority order
	•	supporting layers are too loud relative to the main takeaway
	•	preview evidence is useful, but buried in too much surrounding interpretation

C. Data usefulness is still weak in important places

Even with the better truth model, top-level usefulness is still not where it needs to be.

Problems:
	•	broad labels like Updates and Promotions are still too vague to drive confident action by themselves
	•	Insufficient data dominates too many surfaces
	•	General updates still appears in pattern truth too often to be very helpful
	•	some surfaces still feel like they are telling us broad mailbox facts instead of operationally useful sender facts

What we need:
	•	better operator-facing interpretation
	•	better narrowing of broad Gmail categories
	•	better explanations of why a sender is best understood as commerce, account notice, security, social, etc.
	•	better distinction between global sender truth and recent visible slice

D. The “signal” story is still confusing

The old “likely automated / likely human” issue has not been fully resolved from a user understanding standpoint.

Problems:
	•	the math may be technically correct, but the presentation still confuses people
	•	“Unclear” or “uncertain” dominates and feels like the model knows nothing
	•	the operator does not understand whether this is useful or ignorable
	•	human/machine signal is still too prominent relative to its actual decision value

What we need:
	•	either demote this signal visually
	•	or reframe it as a secondary cautionary hint, not a primary identity layer

E. Message preview is not reliable enough

This is a major workflow problem.

Problems observed:
	•	preview can load very slowly
	•	sometimes appears stuck
	•	sometimes feels broken even if the rest of the row works

This is unacceptable for review flow because the preview is the concrete proof surface.

F. Cold Sender Overview still takes too long

Warm loads are much better. Cold loads are still too slow.

Current concern:
	•	cold first-open sender workspace still falls into a heavy deferred path
	•	logs show sender workspace can still take around 17–20 seconds in some runs
	•	fast-path rejection for subscription-senders is still happening

This makes the workflow feel unreliable, even if it eventually resolves.

G. Whole-mailbox truth is still not fully solved

This is a strategic issue, not a same-pass page fix.

Current concern:
	•	a lot of sender truth is still based on the current analyzed window
	•	there is frustration about using 100k rows instead of the full mailbox
	•	the product goal is eventually to use the whole mailbox, not a limited slice

Important note:
	•	this should not be solved by making page requests scan the full mailbox
	•	this needs a background/offline full-mailbox aggregate strategy

H. Some charts and top modules are still not strong enough

These are no longer the primary responsibility of this document.

Chart and top-module evolution is now primarily owned by the Shared Analysis Rail track. This document may still name usability problems that affect Sender Overview holistically, but it should not be treated as the canonical architecture plan for chart-system redesign.

Problems:
	•	some charts feel diagnostic rather than actionable
	•	activity timeline does not feel like a real timeline
	•	empty regions of some progress bars are still visually weak
	•	some top-level modules still surface broad facts that are not helping the operator make the next decision

⸻

## 3. Design Goal for Sender Overview

Sender Overview should feel like this:

The page should answer in order:

1. What is this cleanup group?

At a glance:
	•	what kind of senders are in it
	•	how much pressure it represents
	•	what makes it worth reviewing

2. What should I look at first?

The page should direct attention immediately to the starting sender list and help the operator sort by a meaningful lens.

3. For each sender, what is it?

The sender row should make it obvious:
	•	likely sender type
	•	why the system thinks that
	•	what evidence is visible right now
	•	whether caution is needed

4. What should I do next?

Without turning this into Decision Mode yet, Sender Overview should still naturally tee up the next move.

⸻

## 4. Ideal Sender Card Structure

This is the target card model.

### Collapsed sender row

The collapsed row should be short, skimmable, and useful.

#### Row contents
	•	Sender name / email
	•	Last activity
	•	Total messages
	•	Unread count
	•	small action/risk badges only if truly important
	•	one clear operator read
	•	one profile lane
	•	one visible lane

#### Collapsed row layout
	•	Identity
	•	sender
	•	domain
	•	last activity
	•	Operator read
	•	one clear operator family
	•	confidence if meaningful
	•	Profile
	•	sender-global Gmail category truth
	•	Visible
	•	preview-slice categories currently visible
	•	Minimal caution indicators
	•	protected
	•	verify first
	•	high impact
	•	optional, very limited

#### Important rule

The collapsed row should not feel like a debugging panel.

It should not be covered in many chips.
It should read more like:
	•	who this is
	•	what it probably is
	•	what’s visible right now

### Expanded sender card

The expanded card should answer “what this sender is” first, then show proof.

#### Section 1. Primary takeaway

A short sentence in plain English.

Examples:
	•	“This looks like a commerce/tracking sender.”
	•	“This appears to be a broad account-notification sender.”
	•	“This is probably a social/community notification sender.”
	•	“This sender is mixed enough that recent visible evidence matters more.”

#### Section 2. Operator insight
	•	family
	•	confidence
	•	1–2 short reasons
	•	one short cross-check note

This is the actionable interpretation layer.

#### Section 3. Category truth

A compact summary of sender-global Gmail category truth.

Example:
	•	Updates 908
	•	Promotions 162

No essay here.

#### Section 4. Pattern truth

A compact heuristic description, clearly marked as heuristic.

Example:
	•	Commerce / shipping updates
	•	Alerts / security
	•	General updates

Pattern truth must be visibly secondary.

#### Section 5. Caution / decision risk

Only show what matters:
	•	protected evidence present
	•	verify first
	•	unclear history
	•	etc.

This should be concise and operator-centered, not verbose.

#### Section 6. Preview slice evidence

This is the proof surface and should stay strong.

It should show:
	•	grouped recent examples
	•	ability to open preview
	•	eventually ability to load more examples
	•	clear distinction that this is the local visible slice

#### Section 7. Optional next-step hint

One simple line:
	•	“Best next step: inspect more recent messages.”
	•	“Best next step: verify protected context before acting.”
	•	“Best next step: compare recent evidence against the operator read.”

⸻

## 5. Principles We Need To Follow

### Principle 1: Truth layers must stay separate

Do not collapse these into one label:
	•	canonical category truth
	•	pattern truth
	•	operator interpretation
	•	recent visible evidence

They each matter, but they must not have equal visual weight.

### Principle 2: One layer must lead

For Sender Overview, the primary lead should be:
	•	operator interpretation first
	•	supported by category truth
	•	checked against recent visible evidence

### Principle 3: Proof beats explanation

If space is limited, show better proof, not more explanatory text.

### Principle 4: Secondary diagnostics must be demoted

Signal bucket, confidence nuance, source metadata, and fallback semantics should not compete with the main takeaway.

### Principle 5: Request-time reads must stay cheap

We should not solve usefulness by reintroducing dangerous live mailbox scans.

### Principle 6: Whole-mailbox truth should come from persisted aggregates

Not from page-time recomputation.

⸻

## 6. Proposed Phase Plan

### Phase 0 — Recovery boundary clarification

**Goal:** keep Sender Overview recovery work narrowly focused and prevent overlap with the Shared Analysis Rail track.

**Scope**
- clarify ownership boundaries between:
  - sender-row/card usability
  - preview reliability
  - cold-load performance
  - operator-profile usefulness
  - shared analysis rail architecture
- ensure this document is not used to drive rail-tab or chart-architecture implementation

**Deliverables**
- explicit ownership boundary in docs
- updated phase ordering that keeps this document focused on sender workflow recovery

**Success criteria**
- no overlap/conflict with Shared Analysis Rail planning docs
- sender-card / preview / performance work remains clearly scoped here
- rail/chart architecture is treated as a separate track

### Phase 1 — Sender workflow usability cleanup

**Goal:** make the sender row understandable and usable without changing backend logic.

**Scope**
	•	review/page.tsx only, or as narrow as possible
	•	no containment changes
	•	no backend recompute changes

**Deliverables**
	•	simplify collapsed row
	•	reduce chip/badge overload
	•	make operator read primary
	•	demote category/pattern/signal to supporting roles
	•	reduce robotic text
	•	strengthen proof-first expanded layout
	•	make caution states plain English

**Success criteria**
	•	operator can explain what a sender is in 5 seconds
	•	operator can explain why it is in the group
	•	operator can tell what to inspect next

⸻

### Phase 2 — Message preview reliability and speed

**Goal:** make preview dependable enough to trust.

**Scope**
	•	diagnose load_message_preview
	•	fix slow or stuck preview path
	•	keep containment intact

**Deliverables**
	•	root cause of slow preview
	•	fix for stuck or extremely slow preview
	•	measured before/after timings
	•	verify preview works consistently from sender rows

**Success criteria**
	•	preview opens reliably
	•	preview no longer feels broken
	•	preview latency is in a normal interactive range

⸻

### Phase 3 — Sender Overview cold-load performance

**Goal:** reduce first-open sender workspace delay.

**Scope**
	•	sender workspace first-open only
	•	no passive dangerous initial-paint live fetch reintroduction
	•	improve the seed/fallback path

**Deliverables**
	•	diagnose why sender fast path is rejected
	•	improve sender workspace first usable state
	•	reduce cold sender overview wait time
	•	keep warm-load behavior fast

**Success criteria**
	•	cold open is materially faster
	•	warm opens remain fast
	•	no passive heavy-path regression

⸻

### Phase 4 — Operator profile usefulness pass

**Goal:** make operator interpretation more actionable and human-readable.

**Scope**
	•	use existing operator_profile_*
	•	do not redesign backend model yet unless clearly needed

**Deliverables**
	•	improve operator summary language
	•	improve family naming if needed
	•	improve reasons shown to user
	•	reduce abstract phrasing like “refines category truth” unless clearly helpful

**Success criteria**
	•	operator read feels useful, not academic
	•	broad categories like Updates get meaningfully narrowed
	•	summaries feel plain English

⸻

### Phase 5 — Holistic page usefulness check (non-rail)

**Goal:** improve any remaining non-rail page elements that still weaken decision-making.

**Scope**
- only non-rail, non-chart supporting elements
- no shared rail redesign
- no tab architecture work

**Deliverables**
- identify any leftover page modules or copy that still distract from action
- simplify or demote weak supporting surfaces outside the Shared Analysis Rail

**Success criteria**
- the page feels coherent around the sender workflow
- supporting non-rail elements do not compete with the main decision path

⸻

### Phase 6 — Whole-mailbox sender truth strategy

**Goal:** stop living in tension between page-time cost and full-mailbox truth.

**Scope**
	•	backend architecture plan
	•	no request-time full-mailbox scan
	•	a persisted background aggregate approach

**Deliverables**
	•	plan for full-mailbox sender-stats recompute
	•	batching/windowing strategy
	•	persisted full-history aggregate model
	•	request-time cheap reads only

**Success criteria**
	•	we can eventually use whole-mailbox truth
	•	request-time surfaces stay fast
	•	Supabase does not get hammered by page interactions

⸻

### Phase 7 — Final cleanup and polish

**Goal:** close the loop and make the page feel complete.

**Deliverables**
	•	tighten remaining confusing labels
	•	final contrast or spacing touchups if needed
	•	remove duplicated copy
	•	remove leftover fallback/debug-like phrasing

**Success criteria**
	•	nothing feels obviously broken
	•	the page feels intentional
	•	the workflow feels like a real product surface

⸻

## 7. Immediate Priorities

If we are choosing what to do next from this document, the recommended order is:
	1.	Phase 1 — Sender workflow usability cleanup
	2.	Phase 2 — Message preview reliability
	3.	Phase 3 — Sender Overview cold-load performance
	4.	Phase 4 — Operator profile usefulness
	5.	Phase 5 — Holistic page usefulness check (non-rail)
	6.	Phase 6 — Whole-mailbox truth strategy
	7.	Phase 7 — Final polish

Reason:
- Shared Analysis Rail now owns chart/tab architecture and chart-driven workflow evolution
- the biggest remaining Sender Overview pain inside this document is sender workflow clarity
- next biggest pain is preview reliability
- then cold-load speed
- then operator-read usefulness
- whole-mailbox truth remains strategically important, but should not derail focused recovery work
## 10A. Relationship To Shared Analysis Rail

This document and the Shared Analysis Rail documents now work together as follows:

- Shared Analysis Rail docs own:
  - tabbed chart architecture
  - Sender Distribution
  - Time Context
  - shared workflow-subset contract
  - chart-to-workflow interaction model

- This document owns:
  - sender-card readability
  - preview proof quality
  - preview speed/reliability
  - sender-overview cold-load experience
  - operator-profile usefulness
  - non-rail supporting page polish

Important rule:
- if a future pass involves tabs, charts, shared workflow subset behavior, or chart-driven subset changes, it should be planned from the Shared Analysis Rail docs, not from this document.

⸻

## 8. Exact Problems to Watch For During Future Reviews

When reviewing future passes, check for these specifically:

### Usability
	•	Can I tell what this sender is in one glance?
	•	Can I tell why it is in this group?
	•	Do I know what to inspect next?

### Visual noise
	•	Are there too many chips?
	•	Are labels repeated?
	•	Is the same meaning shown in multiple places?

### Truth clarity
	•	Is operator insight clearly separate from category truth?
	•	Is category truth clearly separate from visible evidence?
	•	Is pattern truth clearly secondary?

### Proof quality
	•	Can I see enough recent examples?
	•	Can I load message preview reliably?
	•	Do examples support the interpretation?

### Performance
	•	How long does first-open take?
	•	How long does preview take?
	•	Are warm loads fast?
	•	Are any heavy deferred paths reappearing?

### Strategic truth
	•	Are we still trapped in the 100k window?
	•	Are we moving toward persisted whole-mailbox truth?
	•	Are we avoiding request-time rescans?

⸻

## 9. What Success Looks Like

We are done when Sender Overview feels like this:
	•	I open the page and quickly understand the cleanup group.
	•	I can sort the sender list meaningfully.
	•	I click a sender and immediately understand what it probably is.
	•	I can see the proof.
	•	I can see the risk.
	•	I know what I would do next.
	•	The page does not feel broken.
	•	The page does not feel like a debugging console.
	•	The data feels trustworthy enough to act on.
	•	The system remains stable and fast enough.

⸻

## 10. Phase One Task Definition

### Phase 1 objective

Make the sender row understandable.

### Phase 1 target

Take the existing sender drill-down card and make it feel like an operator workflow card instead of a dense diagnostic panel.

### Phase 1 should include
	•	simplify collapsed row hierarchy
	•	simplify expanded row hierarchy
	•	reduce chip/badge count
	•	make operator takeaway primary
	•	make supporting truths compact
	•	use simpler language
	•	keep preview evidence as the proof surface

### Phase 1 should not include
	•	backend changes
	•	preview performance fixes
	•	full-mailbox architecture work
	•	decision mode redesign
	•	loading containment changes

⸻

## 11. Codex Working Instructions

When using this document in Codex:
- treat it as the current planning anchor for Sender Overview
- execute only one phase or one narrowly defined sub-pass at a time
- do not mix backend, loading, UI, and architecture work in the same pass unless the phase explicitly requires it
- preserve runtime containment and first-open safety unless a phase explicitly targets loading behavior
- do not use this document as authority for shared analysis rail architecture, tab behavior, or chart-system design
- prefer small, verifiable sniper passes with before/after behavior, exact files changed, and explicit scope verification
- after each meaningful pass, update the authoritative project docs if the change affects current state, roadmap, or system behavior

For the current moment, Phase 0 remains the active priority unless this document is explicitly updated.

I think this is the right anchor document. It captures both what is broken and how to tackle it in order, without trying to fix everything in one shot.