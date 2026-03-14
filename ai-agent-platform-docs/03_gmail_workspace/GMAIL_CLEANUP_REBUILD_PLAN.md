Gmail Cleanup Rebuild: Product Spec, Phase Plan, and Performance Requirements

Purpose

This document is the working source of truth for the next rebuild passes of the Gmail Cleanup product inside the AI Agent Platform. It exists to prevent drift, reduce repeated explanation, and give Codex a stable reference for implementation.

This rebuild must now proceed in controlled phases. We are not testing or rebuilding the entire system at once. Each phase must have a narrow scope, explicit success criteria, and a clear review loop before moving to the next phase.

⸻

Core Product Principle

The Gmail Cleanup product is a sender-first system.

That means:
	•	The primary object is the sender.
	•	The secondary object is the sender cluster.
	•	Messages are evidence inside a sender or sender cluster, not the main review object.
	•	Counts of messages are supporting analytics, not the main navigational model.

Non-negotiable rule

The UX, product language, data contracts, and workflow should all reinforce the same direction:

Mailbox -> sender universe -> sender clusters -> senders -> message evidence -> decisions -> rules -> learned behavior

The system must not bounce the user back and forth between message-first and sender-first mental models.

⸻

Key Problems Found In Review

1. Product-model mismatch

The rebuild says “sender-first,” but still exposes too much message-first framing.

Examples:
	•	cluster explanations feel message-oriented instead of sender-oriented
	•	some summary metrics emphasize message volume without enough sender meaning
	•	the user can lose track of what the current object is

2. Workflow ambiguity

The overall flow is closer to the right direction, but several stages are unclear:
	•	what Exceptions / Verification is for
	•	what Custom Rule actually means
	•	what Quarantine means
	•	what happens now vs later
	•	how to move confidently from one stage to the next

3. Lack of visual analytics

The current rebuild lost too many charts and visual exploration tools.

The user needs visual understanding, not just raw numbers and tables.

4. Missing interactivity

There are places where UI elements look clickable but do nothing.
There are places where data should be sortable/filterable but is static.
There are places where a user cannot dig deeper into the meaning of the numbers.

5. Performance is too slow for testing and real use

Page transitions and data loads are too slow.
A page cannot take 40–60 seconds every time a user changes stages or revisits a page.
This makes the product frustrating and blocks meaningful QA.

6. Stage outcomes are not sufficiently explicit

The user needs stronger clarity on:
	•	what is being decided now
	•	what is just a suggestion
	•	what becomes a future rule
	•	what becomes a live archive action
	•	what is still undecided

⸻

Canonical Workflow

This is the intended workflow going forward.

1. Intro / Health

Purpose:
	•	lightweight entry handoff
	•	health snapshot
	•	indexing status
	•	cleanup readiness
	•	pending approvals snapshot

Primary object:
	•	mailbox status

This is not the main dashboard. It is a lightweight launch point.

2. Mailbox Intelligence

Purpose:
	•	understand the whole mailbox
	•	see sender distribution and category distribution
	•	identify cleanup opportunities
	•	understand protected vs reviewable areas

Primary object:
	•	sender universe

This is the main intelligence dashboard.

3. Sender Clusters

Purpose:
	•	choose which sender cluster to review next
	•	narrow the mailbox into one sender-oriented review slice

Primary object:
	•	sender cluster

These clusters must be sender-based, not message-based.

4. Sender Decisions

Purpose:
	•	review actual senders within the chosen cluster
	•	inspect evidence
	•	make sender-level decisions

Primary object:
	•	sender

This is the main operator workspace.

5. Protected & Mixed Senders

Purpose:
	•	isolate senders that need verification before action
	•	expose ambiguity and protection signals
	•	force a human check for risky or mixed senders

Primary object:
	•	ambiguous sender

This stage should replace or rename the current “Exceptions / Verification” framing.

6. Confirmation

Purpose:
	•	show exact current impact
	•	show what will archive now
	•	show what stays protected
	•	show what remains undecided
	•	show what becomes a future rule instead of an immediate action

Primary object:
	•	decision set

7. Future Rules

Purpose:
	•	convert non-archive decisions into future behavior
	•	allow review and editing of rule intent

Primary object:
	•	automation policy

8. Learned Behavior

Purpose:
	•	show what the system learned
	•	display policy memory, recommendations, and next actions

Primary object:
	•	learned memory + suggestions

⸻

Required Product Language Changes

These labels should be standardized.

Preferred labels
	•	Intro / Health
	•	Mailbox Intelligence
	•	Sender Clusters
	•	Sender Decisions
	•	Protected & Mixed Senders
	•	Confirmation
	•	Future Rules
	•	Learned Behavior

Labels to reduce or remove
	•	Cleanup candidate universe
	•	Loaded preview rows as a primary concept
	•	Exceptions / Verification
	•	Rules / Automation
	•	Monitoring
	•	batch review
	•	message batch language where sender-first language should be used

Definitions that must be surfaced in UI

Quarantine
A temporary low-priority hold behavior for a sender. It should clearly explain whether this means:
	•	remove from inbox now but keep accessible elsewhere, or
	•	hold for later review without unsubscribe, or
	•	some future-only policy

The system must define it explicitly.

Custom Rule
Cannot remain a vague placeholder.
It must either:
	•	open a rule builder, or
	•	open a guided rule template flow, or
	•	be temporarily disabled until implemented properly

⸻

UX Structure Rules

Rule 1: Sender-first consistency

Every page must make clear what object is being reviewed:
	•	mailbox
	•	sender universe
	•	sender cluster
	•	sender
	•	decision set
	•	future rule
	•	learned behavior

Rule 2: Messages are evidence

Messages should appear as:
	•	evidence rows
	•	snippets
	•	previews
	•	category breakdowns
	•	engagement indicators

They should not replace the sender as the main decision object.

Rule 3: Every decision must feel explicit

For every sender decision, the user must understand:
	•	what happens now
	•	what happens later
	•	whether it is reversible
	•	whether it is live or just a future policy

Rule 4: Every stage must justify itself

If a stage exists, it must answer:
	•	why am I here?
	•	what am I supposed to do on this page?
	•	what happens if I do nothing?
	•	where do I go next?

⸻

Performance Requirements

Performance is now a first-class requirement, not a later polish item.

Core principle

The product must feel responsive enough that testing and operational use are practical.

Page-load expectations

Intro / Health
	•	target: under 2 seconds on warm load
	•	acceptable cold load: under 4 seconds

Mailbox Intelligence
	•	target: under 3 seconds on warm load
	•	acceptable cold load: under 6 seconds
	•	no repeated 40–60 second reloads when revisiting the page

Sender Clusters
	•	target: under 2 seconds on warm load
	•	acceptable cold load: under 5 seconds

Sender Decisions
	•	target: under 3 seconds on warm load
	•	acceptable cold load: under 6 seconds
	•	evidence expansion should be incremental, not full-page blocking

Protected & Mixed Senders
	•	target: under 2 seconds on warm load
	•	acceptable cold load: under 5 seconds

Confirmation
	•	target: under 2 seconds on warm load
	•	acceptable cold load: under 5 seconds

Future Rules
	•	target: under 2 seconds on warm load
	•	acceptable cold load: under 4 seconds

Learned Behavior
	•	target: under 2 seconds on warm load
	•	acceptable cold load: under 4 seconds

Required performance behavior
	1.	Expensive computations must be cached by session and cluster where possible.
	2.	Revisiting a page in the same review flow should reuse computed data unless the user explicitly refreshes.
	3.	Large analytics should preload strategically in the background.
	4.	Evidence expansion should not trigger full recomputation of the whole stage.
	5.	Stage navigation should not feel like reloading the whole application.
	6.	The system should distinguish clearly between:
	•	cold data generation
	•	warm cached revisit
	•	background refresh
	7.	If a refresh is happening, the user should see cached state first whenever possible.

UI expectation for refresh

The UI should communicate one of these states:
	•	loading initial data
	•	showing cached data
	•	refreshing in background
	•	refresh complete
	•	refresh failed, using previous snapshot

The user should not be left wondering why each click takes so long.

⸻

Visual Analytics Requirements

Visuals are required. The current rebuild is too text-heavy.

Mailbox Intelligence must include visual analytics

At minimum, it should eventually support:
	•	sender distribution chart
	•	category distribution chart
	•	protected vs cleanup-ready chart
	•	top sender volume chart
	•	cleanup opportunity chart
	•	possibly a time-based chart for recent traffic patterns

Sender Clusters should include cluster comparison visuals

At minimum:
	•	sender-count comparison
	•	message-volume comparison
	•	risk / ambiguity comparison
	•	protected-signal comparison

Sender Decisions may include compact visuals

Examples:
	•	category mix per sender
	•	engagement / protection signal badges or mini-bars
	•	recent activity indicators
	•	message-type breakdowns inside the sender card or drawer

Confirmation should include visual summaries

Examples:
	•	archive now
	•	future rules
	•	protected senders
	•	unresolved senders

Visuals should support understanding, not become decorative clutter.

⸻

Sorting, Filtering, and Exploration Requirements

Mailbox Intelligence

Must support meaningful exploration such as:
	•	sender volume sorting
	•	category filtering
	•	protected / unprotected filtering
	•	cluster filtering
	•	recent activity filtering

Sender Clusters

Must support:
	•	sorting clusters by sender count
	•	sorting by message impact
	•	sorting by risk / ambiguity
	•	filtering by cluster type

Sender Decisions

Must support:
	•	sender search
	•	sort by message count
	•	sort by unread count
	•	sort by last activity
	•	sort by ambiguity / protected signals
	•	filter by category
	•	filter by decision state
	•	filter by engagement state

The user must be able to work intelligently, not only by paging linearly through a giant list.

⸻

Phase Plan

This rebuild now proceeds in controlled phases.

Phase 1 — Product Model + Flow + Speed Foundation

Goal

Make the workflow coherent, sender-first, and fast enough to test.

In scope
	•	lock stage names and stage purpose
	•	remove or rename misleading language
	•	ensure sender-first object model is consistent across pages
	•	make page revisits and stage transitions materially faster
	•	add caching / snapshot reuse expectations where needed
	•	make non-working controls either work or disappear
	•	make stage outcomes understandable

Out of scope
	•	full final visual analytics suite
	•	advanced custom rule builder
	•	full AI assistant polish
	•	end-to-end archive approval perfection
	•	deep automation editor

Phase 1 success criteria
	•	the product feels sender-first everywhere
	•	stage names make sense
	•	the user can move through the flow without confusion about what each page is for
	•	page revisits no longer take 40–60 seconds under normal warm flow
	•	broken or fake controls are removed or fixed
	•	confirmation clearly separates immediate action from future intent

Phase 2 — Deep Analytics + Visual Exploration

Goal

Bring back the intelligence layer with useful visuals and interactive exploration.

In scope
	•	charts on Mailbox Intelligence
	•	better cluster comparison visuals
	•	better sender analytics and drilldowns
	•	filtering and sorting improvements
	•	stronger evidence exploration

Phase 2 success criteria
	•	the user can visually understand mailbox structure
	•	the user can drill into senders and clusters intelligently
	•	the experience feels analytical, not just tabular

Phase 3 — Decision Precision + Rule Authoring

Goal

Make sender decisions, custom rules, and future automation explicit and editable.

In scope
	•	real custom rule flow
	•	quarantine definition and implementation clarity
	•	editable future rule proposals
	•	stronger protected/mixed verification logic
	•	better confirmation detail

Phase 3 success criteria
	•	custom rule is real, not placeholder
	•	quarantine is clearly understood
	•	the user can edit future behavior before approval
	•	protected / mixed review is meaningful

Phase 4 — Learning, Monitoring, and Final End-to-End Polish

Goal

Finalize learned behavior, recommendation quality, and full-system confidence.

In scope
	•	learned behavior dashboard polish
	•	recommendation refinement
	•	memory-backed suggestion quality
	•	final end-to-end QA across the whole workflow
	•	assistant and guided help polish

Phase 4 success criteria
	•	the entire product can be tested end-to-end confidently
	•	learned recommendations are understandable and useful
	•	the system feels complete rather than stitched together

⸻

What We Should Test In Phase 1

We will not test the whole system yet.

Phase 1 testing should focus on:
	1.	Does the workflow now read logically?
	2.	Are the stage names and descriptions understandable?
	3.	Does the app stay sender-first consistently?
	4.	Are transitions between stages fast enough to use?
	5.	Do key controls behave honestly?
	6.	Does Confirmation clearly explain what happens now vs later?
	7.	Does Protected & Mixed Senders feel meaningful, or should it stay hidden until needed?

⸻

Immediate Recommendations For Codex Before Any Further Broad Rebuild
	1.	Treat this document as the implementation reference for the next pass.
	2.	Do not widen scope beyond the current phase.
	3.	Prioritize coherence and speed before advanced polish.
	4.	Prefer removing misleading UI over leaving confusing placeholders.
	5.	Keep the object model sender-first at every layer.
	6.	If a stage is not yet meaningful, temporarily simplify it instead of pretending it works.
	7.	Update the authoritative docs after each major milestone.

⸻

Open Questions To Resolve In Later Discussion
	1.	Should Sender Decisions include simple rule editing inline, or should all advanced behavior wait for Future Rules?
	2.	What exactly should Quarantine do in the Gmail model?
	3.	Should Protected & Mixed Senders be a mandatory stage or a conditional stage?
	4.	What charts are absolutely required in Phase 2 vs optional later?
	5.	How much sender detail should appear directly on the card vs in an expandable drawer?
	6.	What defines a “healthy inbox” in product language?

⸻

Current Recommendation

Proceed with Phase 1 only next.

Do not ask Codex for another broad exploratory rebuild.
Ask for a disciplined pass focused on:
	•	sender-first flow coherence
	•	naming cleanup
	•	stage-purpose clarity
	•	speed / caching / warm-load behavior
	•	removal or repair of fake interactivity
	•	meaningful confirmation language

This document should be refined after each review cycle and treated as an active planning artifact, not a one-time memo.