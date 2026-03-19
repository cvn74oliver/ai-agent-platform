

# Gmail Workspace Health Engine

## Purpose
The Gmail Workspace Health Engine is the **live orchestration layer** that turns mailbox analytics, decision storage, and inbox health scoring into an actionable operator experience.

Its job is not just to measure the inbox, but to continuously answer:

- What is the current state of the mailbox?
- What matters most right now?
- What should the operator do next?
- What can the system already infer safely?
- How is inbox health changing over time?

This engine is what makes the Mailbox Intelligence dashboard feel like a **mission control system** instead of a static report.

It sits on top of:

- `GMAIL_WORKSPACE_INBOX_HEALTH_SPEC.md`
- `GMAIL_WORKSPACE_INBOX_HEALTH_ALGORITHM_MODEL.md`
- `GMAIL_WORKSPACE_DECISION_STORAGE_SPEC.md`
- `GMAIL_WORKSPACE_DECISION_UI_FLOW.md`
- `GMAIL_WORKSPACE_ANALYTICS_SPEC.md`
- `GMAIL_WORKSPACE_INBOX_INGESTION_SPEC.md`

---

# Core Role

The Health Engine converts raw mailbox state into four outputs:

1. **Health Score**
2. **Mission Queue**
3. **Priority Recommendations**
4. **Confidence Signals**

Together these outputs guide the user through mailbox cleanup while laying the foundation for future automation.

---

# Engine Responsibilities

## 1. Compute Inbox Health
The engine reads the Inbox Health Algorithm model and produces the current health score, status label, and score breakdown.

Example:

```text
Inbox Health: 58 / 100
Status: Needs Attention
Main Drivers:
- 520 subscription senders unresolved
- 50 protected senders need verification
- 2 pending archive approvals
```

---

## 2. Generate Mission Queue
The engine converts current mailbox conditions into a dynamic queue of tasks.

Examples:

- Review Subscription Senders
- Verify Protected Senders
- Approve Archive Work
- Resume Dormant Sender Cluster
- Finish Current Cluster Before Starting New One

These tasks should be ranked by user impact, effort, and expected health improvement.

---

## 3. Recommend Next Best Action
The engine determines the single highest-value action the operator should take next.

Examples:

```text
Next Recommended Action
Review Subscription Senders
Expected Health Gain: +8
Effort: Medium
```

This recommendation should be visible on Mailbox Intelligence and should update dynamically.

---

## 4. Track Progress Over Time
The engine should maintain historical health movement so the dashboard can show:

- current score
- prior score
- change over time
- whether health is improving or degrading

Examples:

```text
Health Trend
58 → 64 over last 7 days
+6 improvement
```

---

# Health Engine Inputs

The engine consumes data from five major sources.

## 1. Inbox Health Algorithm
Provides:

- deterministic health score
- component scores
- cluster priority signals
- predictive deterioration signals

## 2. Decision Storage Layer
Provides:

- archive decisions
- keep preferences
- quarantine decisions
- unsubscribe intent
- custom rule intent
- confirmed vs draft decisions

## 3. Ingestion / Sender Index Layer
Provides:

- sender universe
- sender message counts
- sender protected counts
- sender last activity
- sender timelines
- ingestion completeness

## 4. Approval / Execution Layer
Provides:

- pending approvals
- completed approvals
- archive execution status
- failed actions

## 5. Operator Activity
Provides:

- clusters started
- clusters partially completed
- last touched cluster
- unfinished work

---

# Health Engine Outputs

## Output A — Health Summary
Visible on Mailbox Intelligence.

Suggested content:

- inbox health score
- health label
- confidence level
- partial history warning if ingestion is incomplete

## Output B — Mission Queue
Shows the most relevant tasks the user should work on.

Suggested content:

- task title
- sender count
- estimated impact
- current status

## Output C — Resume Queue
Shows unfinished work.

Suggested content:

- last active cluster
- remaining senders
- current stage
- resume CTA

## Output D — Recommended Action
Single top recommendation.

Suggested content:

- recommended cluster
- why it matters
- estimated health gain
- one-click open action

---

# Mission Generation Model

The Health Engine should generate missions using a weighted priority model.

## Mission Priority Factors

### 1. Health Impact
How much the task can improve inbox health.

### 2. Sender Volume
How many senders/messages are affected.

### 3. Operator Momentum
Whether the user already started that work.

### 4. Risk Level
Whether protected/high-value senders are involved.

### 5. Effort Estimate
How hard the task is likely to be.

A task with high impact and low effort should rank highly.

---

# Resume System

The Resume System is part of the Health Engine.

It should identify:

- last started cluster
- partially completed clusters
- pending confirmation states
- pending approval review

Rules:

1. Resume should prefer unfinished work before recommending a totally new cluster.
2. If multiple unfinished tasks exist, show a prioritized list.
3. The dashboard must not imply “continue later” unless the state is actually restorable.

---

# Confidence Model

The Health Engine should always expose how confident it is in its recommendations.

Examples of confidence factors:

- sender classification confidence
- ingestion completeness
- decision coverage
- protected sender certainty

Example display:

```text
Recommendation Confidence: High
Reason: Sender history complete, low ambiguity, strong prior decisions
```

If confidence is low, the system should ask for verification instead of sounding certain.

---

# Relationship to Mailbox Intelligence

Mailbox Intelligence is the **UI surface**.

The Health Engine is the **logic layer** behind it.

Mailbox Intelligence should therefore show:

- current health
- progress toward target health
- mission queue
- recommended next step
- unfinished work

It should not feel like a random analytics dump.

---

# Relationship to Sender Decisions

Sender Decisions is where the operator actually improves health.

The Health Engine should influence Sender Decisions by:

- highlighting why this cluster was chosen
- explaining expected impact
- surfacing protected/high-risk senders
- later exposing sender-specific analytics that support decisions

The Health Engine does not replace Sender Decisions; it directs attention into it.

---

# Three-Layer AI Decision Engine

The Health Engine should eventually be powered by a three-layer intelligence model.

This is the “10x smarter inbox cleaner” layer.

## Layer 1 — Sender Trust Graph

Purpose:

Build a structural trust model for senders.

Signals may include:

- reply history
- starred/important frequency
- repeated keep decisions
- relationship depth over time
- domain-level reputation
- cluster stability

This graph helps distinguish:

- high-value trusted senders
- low-value noise senders
- ambiguous senders needing review

Example use cases:

- protect likely trusted senders automatically from aggressive cleanup
- identify sender neighborhoods (e.g. related domains/platforms)
- boost confidence for recurring trusted senders

---

## Layer 2 — Behavioral Signals Engine

Purpose:

Measure how senders and clusters behave over time.

Signals may include:

- volume growth rate
- unread accumulation rate
- time since last meaningful interaction
- archive frequency
- subscription-like cadence
- social/notification cadence
- bursts / seasonal spikes

This layer helps detect:

- inbox deterioration before the user notices
- dormant senders that are safe to clean up
- sudden noise events
- priority clusters for review

Example use cases:

- “Retail Commerce noise rose 18% this week”
- “Dormant senders are now safe to process”
- “Protected volume is drifting upward; verify before archiving”

---

## Layer 3 — Reinforcement Learning From Decisions

Purpose:

Learn from the operator’s actual decisions over time.

Signals may include:

- repeated archive decisions on similar senders
- repeated keep decisions on trusted senders
- unsubscribe confirmations
- reversed decisions
- custom rule edits
- approval acceptance rates

This layer helps the system become progressively more aligned with the specific user.

Example use cases:

- prioritize clusters the user typically approves quickly
- reduce suggestion confidence for decision types the user often reverses
- recommend stronger automation for stable, repeated patterns

Important rule:

This learning layer must remain explainable.

The system should never present unexplained “AI magic.”

---

# AI Safety Constraints

The Health Engine must remain safe and conservative.

Rules:

1. Low-confidence suggestions should require review.
2. Protected/high-value senders should never be aggressively recommended without evidence.
3. Archive is the only Phase 1 immediate Gmail execution path.
4. AI recommendations must remain explainable in plain language.

---

# Performance Requirements

The Health Engine must be extremely lightweight at runtime.

Targets:

- health summary generation under 100ms on warm derived data
- mission generation under 150ms on warm derived data
- recommendation generation under 150ms on warm derived data

It must operate on:

- sender-derived tables
- cached aggregates
- decision summaries

It must not scan the raw mailbox during interactive requests.

---

# Phase Roadmap

## Phase 1

- deterministic health score
- mission queue basics
- resume queue basics
- single recommended action

## Phase 2

- decision storage integration
- confidence model
- decision management awareness
- better protected-sender reasoning

## Phase 3

- sender trust graph
- behavioral signal model
- predictive deterioration

## Phase 4

- reinforcement learning from confirmed decisions
- adaptive mission prioritization
- smarter automation candidate ranking

---

# Product Vision

The Health Engine should make the Gmail Workspace feel like:

```text
AI Inbox Mission Control
```

Every time the user opens the product, they should immediately understand:

- how healthy the inbox is
- what matters most right now
- what action will improve it most
- what they already started
- what the system is confident about

That is what removes the need for a separate training system.

---

# Summary

The Gmail Workspace Health Engine is the orchestration layer that turns:

- ingestion
- analytics
- decision storage
- inbox health scoring
- AI reasoning

into a single coherent mission-driven dashboard.

It is the bridge between raw mailbox intelligence and a truly intelligent inbox operator experience.