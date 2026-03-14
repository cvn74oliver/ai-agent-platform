
CODEX Phase Execution Plan

Purpose

This document defines how Codex must execute large system rebuilds in controlled phases.

The AI Agent Platform is a complex architecture with multiple interconnected systems.
Attempting to rebuild or refactor everything at once creates instability, confusion, and regression risk.

To prevent this, all major development tasks must follow a phased execution model.

Each phase focuses on a specific layer of the product, with clear goals and validation before continuing.

Codex must not skip phases and must not expand scope beyond the defined phase.

⸻

Core Execution Principles

1. One Phase At A Time

Codex must complete one phase fully before beginning the next.

A phase is considered complete only when:
	•	The defined scope is implemented
	•	The system compiles successfully
	•	TypeScript checks pass
	•	Lint checks pass
	•	Manual runtime validation succeeds
	•	Documentation is updated

Only after validation should the next phase begin.

⸻

2. No Scope Expansion

Codex must only implement the scope defined for the current phase.

If unrelated issues are discovered:
	•	Document them
	•	Add them to TODO.md
	•	Do NOT attempt to fix them during the current phase

This prevents destabilizing the system.

⸻

3. Documentation Is Authoritative

All rebuild work must follow the documents in:

ai-agent-platform-docs/

Particularly:

01_workspace_architecture
03_gmail_workspace
08_codex_instructions

If documentation conflicts with existing code:

Documentation takes priority.

⸻

4. Phase Completion Updates

After each phase Codex must update:

CHANGELOG.md
CURRENT_STATE.md
TODO.md
system_overview.md

This ensures future sessions understand the system state.

⸻

Phase Structure

Each phase must contain:

Goal
Scope
Implementation Targets
Validation Requirements
Out-of-Scope Items


⸻

Current Rebuild Plan

This rebuild focuses on the Gmail Sender-First Workspace Architecture.

The system will be rebuilt in four controlled phases.

⸻

Phase 1 — Performance Foundation

Goal

Fix the core performance problems that currently make testing slow and unstable.

The system must feel fast and responsive before further UX improvements.

⸻

Scope

Focus only on:
	•	Mailbox Intelligence loading
	•	Cluster loading
	•	Sender Decision workspace loading
	•	Runtime API performance

⸻

Required Improvements

Data Caching

The following must be cached:
	•	Mailbox Intelligence analytics
	•	Sender cluster analysis
	•	Sender statistics
	•	Cleanup group discovery

Cache lifetime:

10 – 30 minutes

Invalidate cache when:
	•	Gmail index changes
	•	mailbox indexing finishes
	•	new cluster discovery runs

⸻

API Performance

Target:

Initial load < 3 seconds
Navigation between pages < 1 second

Current rebuild issue:

Pages take 30-60 seconds to load repeatedly.

This must be fixed before UX improvements.

⸻

Server-Side Preloading

Codex should implement:
	•	server prefetch
	•	route-level data caching
	•	memoized runtime loaders

⸻

Client Optimizations

Sender pages must use:
	•	virtualization
	•	incremental loading
	•	pagination caching

⸻

Validation

Before Phase 1 is complete:
	•	Mailbox Intelligence loads under 3 seconds
	•	Clusters load under 1 second after first load
	•	Sender decisions navigation is instant

⸻

Phase 2 — Product Flow Correction

Goal

Fix the workflow logic of the Gmail cleanup experience.

The system must follow a clear sender-first flow.

⸻

Correct Product Flow
	1.	Intro / Health
	2.	Mailbox Intelligence
	3.	Cleanup Groups
	4.	Sender Decisions
	5.	Confirmation
	6.	Rules / Automation
	7.	Monitoring

⸻

Major Fixes

Sender-First Clustering

Clusters must represent:

groups of senders

NOT:

groups of messages

Message grouping happens inside senders, not before.

⸻

Remove Batch Mental Model

The system must never present:

message batches
review units
message-first decisions

Everything revolves around senders.

⸻

Simplify Workflow

The staged workspace must become:

senders
confirmation
rules
monitoring

Exceptions stage will be temporarily removed until a clear purpose is defined.

⸻

Validation

User must be able to:
	•	choose a sender cluster
	•	review senders
	•	make sender decisions
	•	confirm decisions
	•	generate automation rules

without confusion.

⸻

Phase 3 — Analytics & Visualization

Goal

Restore visual analytics that were lost during the rebuild.

Analytics must help users understand their mailbox quickly.

⸻

Required Visualizations

Mailbox Intelligence

Charts required:
	•	message volume timeline
	•	sender distribution
	•	inbox health gauge
	•	category breakdown
	•	top senders chart

Purpose:

Provide a 10,000-foot overview of the mailbox.

⸻

Sender Dashboard

Charts required:
	•	sender message volume
	•	sender activity timeline
	•	sender comparison charts
	•	filterable sender analytics

Purpose:

Help users make decisions about senders.

⸻

Interaction Requirements

Analytics must support:
	•	filtering
	•	sorting
	•	time ranges
	•	drill-downs

Charts should behave similarly to Hyros-style dashboards.

⸻

Phase 4 — AI Learning Layer

Goal

Complete the AI automation and learning system.

User decisions must become long-term AI memory.

⸻

Memory Storage

Decisions must persist in:

agent_events
rag_documents

Memory types:
	•	sender policy
	•	rule intent
	•	decision frequency
	•	domain patterns

⸻

Monitoring System

Monitoring must display:

learned policies
automation recommendations
domain memory
AI suggestions


⸻

Final Vision

Eventually the system should:
	•	learn user preferences
	•	suggest automation
	•	auto-clean future inbox activity

with minimal supervision.

⸻

Codex Execution Rules

When executing a phase Codex must:
	1.	Read all relevant documentation
	2.	Implement only the current phase
	3.	Avoid modifying unrelated code
	4.	Run lint / typecheck
	5.	Update system documentation

⸻

Validation Checklist

Before closing a phase:

Build succeeds
TypeScript passes
Lint passes
Manual UI test passes
Docs updated


⸻

Why This Phase Plan Exists

Large rebuilds fail when:
	•	scope expands
	•	code drifts from product vision
	•	multiple layers change simultaneously

This phase plan prevents that.

⸻

Summary

The Gmail rebuild will proceed through:

Phase 1 — Performance Foundation
Phase 2 — Product Flow Correction
Phase 3 — Analytics & Visualization
Phase 4 — AI Learning Layer

Each phase must be completed and validated before moving forward.