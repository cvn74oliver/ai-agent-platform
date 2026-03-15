

# Gmail Workspace Product Flow V2

## Purpose

This document defines the corrected **product flow** for the Gmail Workspace after review of the first sender-first rebuild.

Version 1 established the broad direction, but testing showed that the workflow still felt too slow, too ambiguous, and not consistently sender-first in practice.

This Version 2 flow is the new implementation reference for future rebuild passes.

It should be treated as the canonical Gmail cleanup journey until replaced by a later approved version.

---

# Keep Or Replace Product Flow V1

## Decision

Keep both files for now.

- `GMAIL_WORKSPACE_PRODUCT_FLOW.md` remains the historical first-pass product flow.
- `GMAIL_WORKSPACE_PRODUCT_FLOW_V2.md` becomes the **active implementation flow**.

## Rule

Codex should treat **V2 as authoritative** whenever the two documents differ.

The original file should not be deleted yet because it still captures useful design history and may help explain why certain earlier implementation decisions were made.

A cleanup pass can archive or consolidate V1 later after the V2 implementation has stabilized.

---

# Core Flow Principle

The Gmail Workspace is a **sender-first review system**.

That means the flow must always reinforce this hierarchy:

```text
Mailbox
→ Sender Universe
→ Sender Clusters
→ Senders
→ Message Evidence
→ Decisions
→ Future Rules
→ Learned Behavior
```

Messages are not the main review object.
Messages are evidence inside a sender context.

Clusters must be **sender clusters**, not message clusters.

---

# Product Story

The user journey should feel like this:

1. Understand the mailbox
2. Choose a sender cluster to work on
3. Review senders inside that cluster
4. Resolve ambiguous or protected senders
5. Confirm current impact
6. Approve future rules
7. Review what the system learned

This keeps the product simple:

**Understand → Decide → Teach**

---

# Canonical Workflow Stages

## Stage 1 — Intro / Health

### Purpose
A lightweight entry page that answers:
- Is the mailbox connected?
- Is the index ready?
- Are there pending cleanup approvals?
- Is there an active review session already in progress?

### What this page is not
It is **not** the main mailbox analytics dashboard.

### Primary object
Mailbox status

### Required content
- mailbox connection status
- indexing status
- mailbox health summary
- pending approvals summary
- quick links into the active cleanup flow

### Notes
This stage should feel like a launch point, not a work surface.

---

## Stage 2 — Mailbox Intelligence

### Purpose
This is the main high-level analytics dashboard.

It should help the user answer:
- What kinds of senders dominate my mailbox?
- What cleanup opportunities exist?
- What is protected vs safe to review?
- What clusters of senders are available to work on?

### Primary object
Sender universe

### Required behavior
- show whole mailbox context
- show sender-based analytics
- show cleanup opportunities
- show protected signals
- allow interactive exploration
- allow the user to drill into a cluster or sender slice

### Visual requirements
This page should include charts and visual summaries.
It must not be a mostly static numbers page.

### Required outputs
The user should leave this page understanding:
- how many senders exist
- what kinds of senders dominate the inbox
- which cluster to review next

---

## Stage 3 — Sender Clusters

### Purpose
This page lets the user choose which **sender cluster** to work on.

### Primary object
Sender cluster

### Important rule
Clusters must be built from senders, not messages.

Examples of sender clusters:
- Retail / shopping senders
- Newsletter senders
- Social senders
- Travel senders
- Inactive senders
- High-volume automation senders
- Mixed commercial senders

### Required behavior
Each cluster should explain:
- why it exists
- how many senders are inside it
- how many messages those senders account for
- how safe or risky it is
- why it may be worth reviewing

### What should not happen
Clicking a cluster should not feel like a vague page jump.
The chosen cluster should become the active working cluster clearly and immediately.

---

## Stage 4 — Sender Decisions

### Purpose
This is the main operator workspace.

The user reviews senders inside the selected cluster and makes sender-level decisions.

### Primary object
Sender

### Required sender data
For each sender, the user should be able to see:
- sender identity
- message count
- unread count
- last activity
- category hints
- engagement/protection signals
- representative message evidence

### Required actions
The user must be able to choose one of the following:
- Keep
- Archive
- Quarantine
- Unsubscribe
- Custom Rule
- Undecided

### Required UX capabilities
This page must support:
- filtering
- sorting
- sender search
- evidence expansion
- fast pagination or infinite loading

### Required guidance
The UI must explain why senders appear in the order shown.

### Important rule
Messages should appear as evidence only.
The system must never fall back into a message-first review model on this page.

---

## Stage 5 — Protected & Mixed Senders

### Purpose
This stage replaces the vague “Exceptions / Verification” concept.

It is used only for senders that need extra confirmation because they are:
- mixed behavior senders
- potentially protected senders
- senders with conflicting signals
- senders where the selected action may be risky

### Primary object
Ambiguous sender

### Required behavior
For every sender shown here, the system must explain:
- why it was escalated to this stage
- what mixed or protected signal triggered the escalation
- what the current proposed action is
- what the user should verify

### Important rule
If there are no meaningful ambiguous senders, this stage should either:
- collapse into a lightweight empty success state, or
- be skipped entirely

It must never feel empty and purposeless.

---

## Stage 6 — Confirmation

### Purpose
This stage shows the exact current impact of the chosen sender decisions.

### Primary object
Decision set

### Required questions it must answer
- What will archive now?
- What stays in the inbox?
- What is undecided?
- What becomes a future-only rule instead of an immediate action?
- How many senders and messages are affected by each outcome?

### Required behavior
The user must be able to inspect the grouped outcomes and trust the totals.

### Important rule
This page is where exact message-impact totals become primary.
Earlier pages should remain sender-first.

---

## Stage 7 — Future Rules

### Purpose
This stage converts sender decisions into future automation behavior.

### Primary object
Automation policy

### Required behavior
The system should present proposed future behaviors such as:
- always keep from sender X
- archive future mail from sender Y
- quarantine future mail from sender Z
- unsubscribe where supported
- apply custom rule where defined

### Important rule
This page must distinguish clearly between:
- actions happening now
- behaviors being learned for future use

### Requirement
“Custom Rule” cannot remain vague.
If it exists in the UI, it must lead to:
- a rule builder,
- a rule template,
- or a clearly marked placeholder state that explains it is not yet implemented

---

## Stage 8 — Learned Behavior

### Purpose
This is the AI learning and recommendation layer.

### Primary object
Learned memory and recommendations

### Required behavior
The page should show:
- learned sender policies
- rule intents
- recommendation queue
- recent decisions made
- what the agent has inferred from prior behavior
- what the user may want to review next

### Notes
This page should feel like a briefing or intelligence summary, not a confusing side dashboard.

---

# Stage Ownership By Product Layer

To avoid duplication, the stages should be thought of in three higher-level layers.

## Layer A — Understand
- Intro / Health
- Mailbox Intelligence
- Sender Clusters

## Layer B — Decide
- Sender Decisions
- Protected & Mixed Senders
- Confirmation

## Layer C — Teach
- Future Rules
- Learned Behavior

This gives the Gmail Workspace a clean narrative:

```text
Understand the mailbox
→ Decide what to do with senders
→ Teach the system future behavior
```

---

# Required UX Corrections Based On Review

## 1. Make the stage names clearer
The earlier rebuild used labels that were too vague or too system-internal.
This V2 flow should use the stage names defined here.

## 2. Make decisions propagate visibly
If the user marks a sender Keep / Archive / Quarantine / Unsubscribe / Custom Rule, that must visibly affect the later stages in a trustworthy way.

## 3. Make each page answer “what do I do here?”
Every stage needs a clear purpose statement and a clear next action.

## 4. Do not leave fake interactivity in the UI
If a visual control looks clickable, it must work.
If it does not work yet, remove or restyle it until implemented.

## 5. Restore visual intelligence where appropriate
Mailbox Intelligence and Sender Clusters especially need charts and visual analytics.

---

# Required Data Model Alignment

The product flow should align to these object relationships:

```text
Mailbox
└── Sender Universe
    └── Sender Clusters
        └── Senders
            └── Message Evidence
                └── Decisions
                    └── Future Rules
                        └── Learned Behavior
```

This hierarchy must stay consistent in:
- copy
- navigation
- metrics
- charts
- backend contracts
- rule memory

---

# What Product Flow V2 Fixes From V1

V2 exists because testing exposed several problems in the first rebuilt flow.

V2 explicitly corrects:
- vague or confusing stage naming
- unclear purpose of Exceptions / Verification
- sender-first inconsistency
- lack of separation between current action and future rule behavior
- weak guidance on how stages connect
- duplication risk between dashboard and cluster views

---

# Implementation Priority

This document defines the target flow, but not every stage needs to be fully polished immediately.

The recommended implementation order remains:

## Phase 1
- flow coherence
- sender-first consistency
- stage clarity
- performance and caching
- remove misleading or fake UI

## Phase 2
- charts and analytics restoration
- sorting and filtering depth
- better visual exploration

## Phase 3
- stronger decision precision
- custom rule builder
- quarantine clarity
- richer future rule editing

## Phase 4
- learned behavior polish
- recommendation quality
- final end-to-end refinement

---

# Codex Rule

When Codex reads this file, it should treat this document as the **authoritative Gmail Workspace flow reference**.

If earlier Gmail flow documents conflict with this one, this file wins.

---

# Summary

The Gmail Workspace should now be built around this story:

```text
Intro / Health
→ Mailbox Intelligence
→ Sender Clusters
→ Sender Decisions
→ Protected & Mixed Senders
→ Confirmation
→ Future Rules
→ Learned Behavior
```

This flow keeps the product sender-first, guided, understandable, and aligned with how the AI memory model should work.