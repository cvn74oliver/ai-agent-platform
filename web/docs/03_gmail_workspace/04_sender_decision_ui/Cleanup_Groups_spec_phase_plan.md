Cleanup Group Spec + Phase Plan

Purpose

Define the product role, UI rules, and phased evolution plan for Cleanup Groups inside the Gmail workspace.

Cleanup Groups is the operator’s selection surface between Mailbox Intelligence and Sender Overview. It should help users choose the right sender cluster to review next, without overwhelming them or forcing them into the largest unresolved group by default.

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

This means current Cleanup Groups work is presentation and recommendation, not structural regrouping.

⸻

Current Group Types

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

⸻

Phase 1B UI Rules

Section structure

Cleanup Groups should render in three visual sections:
	1.	Start Here
	2.	Reduce Backlog
	3.	Exceptions & Coverage

Default card ordering

Default section ordering should be explicit, but not permanently hard-locked.

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

Later phases may revisit the cleanup-group structure itself.

That future work should evaluate:
	•	whether some groups are too large to remain motivating
	•	whether some groups should be subdivided using richer artifact truth
	•	whether the current 8-group model still best serves operator workflow
	•	whether needs-review should be decomposed into more coherent sub-lanes
	•	whether protected and similar lanes should remain broad safety surfaces or be broken into bounded review units

This later work should happen after Phase 1 presentation improvements are validated.

⸻

Future Structural Questions

Questions to answer in later phases:
	•	Should large groups be capped or re-segmented to feel more achievable?
	•	What is the ideal sender count range for a cleanup group to feel manageable?
	•	Which groups should remain broad for safety/coverage reasons?
	•	Which groups should be split based on artifact-stage evidence?
	•	Can sender-overview bounded entry paths reduce the need for top-level group splitting?

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

Future:
	artifact-informed evaluation of whether groups should be restructured, subdivided, or re-thresholded

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

⸻

Summary

Cleanup Groups has now completed its current UI clarity + hero/progress phase:
	1.	First: guidance, clarity, recommendation logic, startability, and handoff congruency were improved on top of current artifact truth
	2.	Second: a true hero + progress layer was added so the page can frame the next decision before the operator evaluates individual cards
	3.	Later: evaluate whether deeper analytics, richer decision support, or the artifact-driven group structure itself should be refined in a separate future phase

That keeps current work focused while preserving a clear path to a more artifact-native cleanup-group system later.

⸻

Current Status

The current Cleanup Groups hero / clarity / progress phase is complete and approved.

Any future Cleanup Groups work should happen in a separate next-phase thread and may explore:
	•	deeper analytics
	•	artifact / taxonomy refinement
	•	richer decision support

That future lane should not silently widen from product planning into implementation without a separate approval step.
