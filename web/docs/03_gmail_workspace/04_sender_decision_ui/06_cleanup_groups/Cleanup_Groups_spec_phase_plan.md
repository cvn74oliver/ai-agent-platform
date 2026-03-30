Cleanup Group Spec + Phase Plan

Purpose

Define the product role, UI rules, and phased evolution plan for Cleanup Groups inside the Gmail workspace, while explicitly preserving a workspace-agnostic framework that can be reused across any future domain (e.g. finance, marketing, operations).

Cleanup Groups is the first implementation of a generalized "decision grouping system" that will later apply to any workspace where entities must be reviewed, prioritized, and acted on.

⸻

Framework Principle (Critical)

Cleanup Groups is not a Gmail-specific feature.

It is the first implementation of a generalized grouping + prioritization system that must work across:
	•	email (senders)
	•	finance (assets, transactions)
	•	marketing (campaigns, creatives)
	•	operations (tasks, entities, workflows)

Therefore:
	•	group definitions must not depend on Gmail-only concepts
	•	lane structure must represent universal decision patterns, not email categories
	•	naming and structure should remain abstract enough to transfer
	•	artifact-driven grouping logic must be reusable across workspaces

Gmail is only the first dataset used to validate the framework.

⸻

Product Role

Cleanup Groups is not:
	•	a taxonomy editor
	•	a raw data dump
	•	a list of equally weighted clusters

Cleanup Groups is:
	•	a guided cluster-selection surface
	•	a prioritization layer
	•	a handoff point from Mailbox Intelligence into Sender Overview
	•	a framing layer that makes large bodies of sender data feel startable

⸻

Current Truth Model

Current Phase 1 system truth:
	•	Cleanup Groups sits on top of the current artifact-backed 8-group model
	•	Group membership is already assigned by existing artifact/runtime logic
	•	Phase 1 UI work must not change:
	•	taxonomy
	•	sender assignment
	•	schema
	•	rebuild logic

This means current Cleanup Groups work was originally presentation and recommendation, not structural regrouping.

However, with the introduction of large-scale indexed data and artifact/semantic signals, this constraint is no longer valid for future phases. Structural regrouping is now expected and required in later phases.

⸻

Current Group Types

These categories reflect early heuristic grouping and must not be treated as final or authoritative.

Cleanup Groups currently mixes three different kinds of operator lanes:

1. Opportunity lanes

Examples:
	•	subscription
	•	social
	•	retail / commerce
	•	system notifications

These are the groups most likely to produce immediate sender-cleanup progress.

2. Backlog lanes

Examples:
	•	dormant backlog

These represent accumulated older sender buildup and are best used when the operator wants backlog reduction.

3. Exception / coverage lanes

Examples:
	•	needs review
	•	protected / trusted
	•	historical / out-of-inbox

These are important for safety, exhaustiveness, and coverage, but should not usually be the default starting point.

⸻

Phase 1B Goal

Make Cleanup Groups:
	•	instantly understandable
	•	clearly prioritized
	•	easier to start
	•	visually grouped by job-to-be-done

Without changing the underlying 8-group artifact structure.

Note: This phase was intentionally limited to presentation improvements. It does not validate whether the groups themselves are correct.

⸻

Phase 1B UI Rules

Section structure

Cleanup Groups should render in three visual sections:
	1.	Start Here
	2.	Reduce Backlog
	3.	Exceptions & Coverage

Default card ordering

Default section ordering should be explicit, but not permanently hard-locked.

Important:
- This ordering is provisional and based on early data assumptions.
- It must be revalidated during artifact-driven rediscovery.

Recommended current order:

Start Here
	1.	social-platform-senders
	2.	retail-commerce-senders
	3.	system-notification-senders
	4.	subscription-senders

Reduce Backlog
	1.	dormant-backlog-senders

Exceptions & Coverage
	1.	needs-review-senders
	2.	protected-trusted-senders
	3.	historical-out-of-inbox-senders

Card anatomy

Each card should lead with:
	•	Workload
	•	Impact
	•	Why this group exists

Semantic/supporting detail should remain secondary and may live in expandable detail.

Important constraint:
- These UI rules were designed around early heuristic grouping.
- They must not constrain future structural redesign decisions.
- In later phases, UI may adapt to reflect newly discovered group structures.

Large-group startability

Large groups should feel startable before the user clicks through.
Use UI-only Start with: framing such as:
	•	Top senders
	•	Recent 30 days
	•	Unread only
	•	Highest-volume backlog

This framing is guidance only in Phase 1B, not a new filter system.

Recommendation rule

Cleanup Groups should not default to the largest unresolved group.

Recommendation priority:
	1.	Resume in-progress work
	2.	Small quick win
	3.	High-impact manageable opportunity
	4.	Backlog pass
	5.	Never default to coverage / exception lanes

Future constraint:
- Recommendation logic must evolve alongside group restructuring.
- It must not assume current group boundaries remain valid.

Implemented Cleanup Groups state

The current accepted Cleanup Groups UI now includes:
	•	a workspace-family hero that matches the structural grammar of Mailbox Intelligence and Sender Overview
	•	a four-signal row at the top of the hero:
	•	Cleanup groups in scope
	•	Groups with saved work
	•	Groups still to review
	•	Senders in cleanup scope
	•	a goal / progress module with:
	•	Cleanup selection goal
	•	group-started coverage counter
	•	real progress bar tied to groups with saved work / cleanup groups in scope
	•	bottom-row next-step guidance driven by the existing recommendation rule
	•	a compact support layer below the hero that remains secondary to the hero
	•	sectioned cleanup-group cards that stay actionable without carrying all comparison burden

Metric truth rules now implemented:
	•	Groups with saved work uses active saved-work truth only
	•	Groups still to review = total groups minus groups with saved work
	•	Senders in cleanup scope must reflect the full sender universe represented by the cleanup groups on the page for the current snapshot, not a narrower review-stage subset

⸻

Phase 1B Out of Scope
	•	No taxonomy changes
	•	No artifact rebuilds
	•	No sender reassignment
	•	No schema changes
	•	No new query/filter behavior
	•	No cluster splitting

⸻

Later Structural Direction

The next phase must explicitly reevaluate the cleanup-group structure itself using artifact and semantic data.

This is not optional.

The original grouping system was created using limited data and heuristic assumptions. We now have:
	•	significantly larger indexed coverage
	•	artifact-backed summaries
	•	semantic grouping signals

Therefore, the system must transition from:
	heuristic grouping → artifact-driven grouping

This includes:
	•	revalidating all existing groups
	•	identifying missing groups
	•	removing or collapsing weak groups
	•	promoting new semantic parents where justified
	•	redefining structural lanes if needed

The goal is not to refine the current groups.
The goal is to discover the correct groups from current truth.

This phase must explicitly produce a new canonical grouping model, not just adjustments to the existing one.

⸻

Future Structural Questions

Questions to answer in later phases:
	•	Should large groups be capped or re-segmented to feel more achievable?
	•	What is the ideal sender count range for a cleanup group to feel manageable?
	•	Which groups should remain broad for safety/coverage reasons?
	•	Which groups should be split based on artifact-stage evidence?
	•	Can sender-overview bounded entry paths reduce the need for top-level group splitting?
	•	Which current groups are misleading or harmful to operator decision-making due to scale or lack of coherence?

⸻

Recommended Future Phase Structure

Phase 1B

Completed:
	UI clarity, recommendation logic, startability framing, expandable-detail demotion, and corrected handoff alignment

Phase 1C

Completed:
	Hero congruency, hero trust/progress grammar, count-first signal row, truthful group-started coverage, and corrected full-scope cleanup sender metric

Phase 2

Future:
	deeper analytics, richer decision support, and careful card-burden redistribution without widening into taxonomy work by default

Phase 3

Artifact-driven rediscovery and restructuring of cleanup groups:
	•	full reevaluation of all current groups
	•	introduction of semantic parents based on real evidence
	•	redefinition of structural lanes where needed
	•	removal or demotion of weak or misleading groups

Deliverable:
- Full disposition matrix (keep / rename / split / demote / collapse / remove)
- Proposed canonical parent set
- Proposed lane structure
- Alias mapping plan

Phase 4

Future:
	if approved, taxonomy / artifact redesign and rebuild lane

⸻

Success Criteria

Cleanup Groups is working well when:
	•	operators can understand what each group is for in seconds
	•	they know where to start
	•	large groups do not feel impossible
	•	coverage lanes remain visible without dominating the recommendation system
	•	Mailbox Intelligence and Cleanup Groups point to the same next-step logic
	•	the top of the page helps the operator understand the decision landscape before they start comparing cards
	•	the hero uses trustworthy group-level progress language rather than recommendation-widget language
	•	the cards do not carry more analytical burden than they need once hero / analytics context is present
	•	the grouping system reflects current artifact truth rather than legacy assumptions
	•	the structure can be reused across non-Gmail workspaces without redesign

⸻

Summary

Cleanup Groups has now completed its UI clarity and progress phase, but the system is still operating on an early-stage grouping model.

The next critical milestone is transitioning to an artifact-driven grouping system:
	1.	The current UI layer remains intact as a framework
	2.	The underlying group structure will be rediscovered and redefined using real data
	3.	Future work will align grouping, workflow, and decision execution under a unified framework that applies beyond Gmail

This ensures that we are not refining an outdated model, but evolving toward the correct one.

⸻

Current Status

The current Cleanup Groups hero / clarity / progress phase is complete and approved.

Any future Cleanup Groups work should happen in a separate next-phase thread and may explore:
	•	deeper analytics
	•	artifact / taxonomy refinement
	•	richer decision support

That future lane should not silently widen from product planning into implementation without a separate approval step.

Note:
- The current system should be treated as a temporary baseline.
- It exists to support the next phase of rediscovery, not to define the final grouping model.

⸻

Implementation Philosophy

This system must follow these rules moving forward:

1. Framework first, dataset second
	•	Gmail is an example, not the definition
	•	the grouping system must generalize to other workspaces

2. Discovery over preservation
	•	no group survives by default
	•	all groups must justify themselves with artifact evidence

3. Operator-first design
	•	groups must make decisions faster and clearer
	•	if a group does not improve workflow, it should not exist

4. Evidence-based grouping
	•	grouping must be explainable from data signals
	•	not from historical naming or intuition

5. Progressive evolution
	•	UI framework can remain stable
	•	group structure must be allowed to evolve as data improves

⸻

Next Step (Execution Alignment)

Before any implementation begins:
- All cleanup-group documents must be aligned to artifact-driven rediscovery
- A dedicated implementation plan must be created (separate from this spec)
- A new Codex thread must be started with a clean premise

Do not continue implementation from previous threads that assumed the current grouping structure was correct.

This reset is required to prevent drift and ensure correct system evolution.
