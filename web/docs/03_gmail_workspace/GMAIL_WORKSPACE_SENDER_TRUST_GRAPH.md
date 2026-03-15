# Gmail Workspace Sender Trust Graph

## Purpose
The **Sender Trust Graph** is the core intelligence model that helps the Gmail Workspace understand which senders are trustworthy, which are noisy, which are ambiguous, and how sender relationships evolve over time.

It is not just a sender score.

It is a **graph-based trust system** that maps:

- sender importance
- sender behavior
- relationship depth
- domain-level patterns
- similarity across senders
- trust evolution over time

This graph powers:

- protected sender reasoning
- archive safety
- verification routing
- cluster formation
- recommendation confidence
- future automation thresholds

This document works together with:

- `GMAIL_WORKSPACE_HEALTH_ENGINE.md`
- `GMAIL_WORKSPACE_INBOX_HEALTH_ALGORITHM_MODEL.md`
- `GMAIL_WORKSPACE_RECOMMENDATION_ENGINE_SPEC.md`
- `GMAIL_WORKSPACE_DECISION_MODEL_SPEC.md`
- `GMAIL_WORKSPACE_AUTONOMOUS_INBOX_EVOLUTION_LOOP.md`
- `GMAIL_WORKSPACE_INTELLIGENCE_SYSTEM_INDEX.md`

---

# Core Role

The Sender Trust Graph answers the following questions:

1. Which senders are likely high-trust and should be protected?
2. Which senders are likely low-trust and safe to clean up?
3. Which senders sit in ambiguous territory and need verification?
4. Which senders are structurally related and should influence each other’s classification?
5. How is sender trust changing over time?

The graph should be treated as a **living intelligence model**, not a static label system.

---

# Core Graph Concept

Each sender is a node in the graph.

Each node can connect to:

- other senders
- domains
- interaction patterns
- decision history
- behavior profiles

Example conceptual model:

```text
Sender Node
  ├── Domain Reputation
  ├── Interaction Signals
  ├── Message Behavior Signals
  ├── Historical Decisions
  ├── Similar Sender Neighbors
  └── Trust State Over Time
```

This allows the system to reason about senders with more nuance than a single rule or score.

---

# Sender Node Structure

Each sender node should carry a structured trust profile.

## Required sender node fields

- canonical sender id
- sender email
- sender display name
- root domain
- cluster memberships
- trust score
- noise score
- protection score
- verification score
- activity value score
- decision history summary
- last interaction timestamp
- last trust update timestamp

Optional later fields:

- domain family grouping
- transactional confidence
- promotional confidence
- social confidence
- system notification confidence

---

# Trust Dimensions

The trust graph should use multiple dimensions, not a single binary trusted/untrusted flag.

## 1. Relationship Trust
Measures whether the sender appears important to the user.

Signals:

- reply history
- repeated manual opens
- starred/important frequency
- user keep decisions
- protection history
- sustained long-term interaction

Output:

```text
0–100 relationship trust
```

---

## 2. Noise Propensity
Measures how likely the sender contributes to clutter.

Signals:

- low-engagement high-frequency mail
- subscription cadence
- promotional markers
- bulk mailing behavior
- no reply history

Output:

```text
0–100 noise propensity
```

---

## 3. Automation Safety
Measures how safe it is to automate decisions involving this sender.

Signals:

- confidence consistency
- decision stability
- prior approval outcomes
- protected evidence absence
- graph neighborhood consistency

Output:

```text
0–100 automation safety
```

This is critical for future autonomous handling.

---

## 4. Ambiguity Score
Measures how mixed or contradictory the sender’s signals are.

Signals:

- occasional important interaction plus promotional behavior
- one protected thread inside a noisy sender pattern
- transactional + marketing mixed messages
- unstable behavior over time

Output:

```text
0–100 ambiguity score
```

High ambiguity should push the sender toward verification.

---

# Edge Types in the Graph

The graph should support different relationship types.

## 1. Domain Edges
Connect senders from the same domain or closely related domains.

Examples:

- `noreply@company.com`
- `marketing@company.com`
- `support@company.com`

These edges help the system detect domain-level trust and noise patterns.

---

## 2. Behavioral Similarity Edges
Connect senders with similar behavior patterns.

Examples:

- same promotional cadence
- same system notification pattern
- same unsubscribe structure
- same dormant pattern

These edges help cluster similar senders.

---

## 3. Decision Similarity Edges
Connect senders that users repeatedly decide on in the same way.

Examples:

- repeatedly archived promotional senders
- repeatedly kept personal senders
- repeatedly verified ambiguous senders

These edges strengthen future recommendation confidence.

---

## 4. Temporal Drift Edges
Track how a sender’s behavior changes over time.

Examples:

- sender used to be trusted but became noisy
- sender used to be dormant but became high-frequency
- sender used to be low-risk but now shows promotional bursts

These edges allow the graph to model behavioral drift.

---

# Trust States

Every sender should map into one of several trust states.

Suggested trust states:

- Strongly Trusted
- Moderately Trusted
- Neutral / Unknown
- Likely Noisy
- Strongly Noisy
- Ambiguous / Needs Verification

These are presentation states derived from the deeper scores.

---

# Sender Trust Evolution

Trust is not static.

The Sender Trust Graph must support **trust evolution over time**.

Examples:

## Positive trust evolution
A sender receives:

- more replies
- repeated keep decisions
- more important flags

Trust should rise.

## Negative trust evolution
A sender suddenly:

- increases mailing frequency
- shifts to promotions
- loses engagement

Trust should fall, ambiguity or noise should rise.

This makes the graph adaptive.

---

# Graph Inputs

The graph should ingest signals from several systems.

## 1. Mailbox Intelligence
Provides:

- sender volume
- protected counts
- activity history
- cluster relationships

## 2. Decision Storage
Provides:

- keep decisions
- archive approvals
- quarantine intent
- unsubscribe intent
- custom rule decisions

## 3. Health Engine
Provides:

- health impact context
- cluster priority context
- mission importance signals

## 4. Recommendation Engine
Provides:

- confidence feedback
- accepted/rejected recommendation outcomes

## 5. Ingestion Layer
Provides:

- long-term sender history
- frequency changes
- domain patterns

---

# Trust Graph Outputs

The Sender Trust Graph should produce outputs for multiple systems.

## Output A — Sender Trust Score
Used in Sender Decisions, Decision Model, and Health Engine.

## Output B — Protection Confidence
Used to prevent unsafe archive suggestions.

## Output C — Noise Confidence
Used to rank archive / unsubscribe candidates.

## Output D — Ambiguity Routing
Used to decide whether a sender must be verified.

## Output E — Neighborhood Signals
Used to strengthen cluster generation and recommendation confidence.

---

# Use Cases

## Use Case 1 — Protect trusted senders
If a sender has:

- repeated replies
- important flags
- prior keep decisions

then the trust graph should raise protection confidence and prevent aggressive cleanup.

---

## Use Case 2 — Promote similar noisy senders
If a set of senders from related domains are repeatedly archived, the graph should boost archive confidence for similar neighbors.

---

## Use Case 3 — Detect behavioral drift
If a previously trusted sender starts behaving like a noisy sender, the graph should increase ambiguity and request verification rather than immediately demoting it.

---

## Use Case 4 — Improve cluster formation
If several related senders show similar noise and trust patterns, they should strengthen cluster formation and prioritization.

---

# Trust Graph Influence on the Decision Model

The Sender Trust Graph must directly influence the Decision Model.

Examples:

- high relationship trust → raises Keep likelihood
- high noise propensity → raises Archive likelihood
- high ambiguity → raises Verification routing
- high automation safety → raises future rule confidence

This is one of the key ways the system becomes smarter than simple heuristics.

---

# Trust Graph Influence on the Recommendation Engine

The Recommendation Engine should use graph outputs to decide:

- which clusters are safest to recommend first
- which senders deserve strong archive recommendations
- which senders must be routed to human review
- which future automation proposals are likely safe

Without the trust graph, recommendations remain shallow.

---

# Trust Graph Influence on the Health Engine

The Health Engine should use trust graph outputs to improve health scoring.

Examples:

- more trusted senders preserved → healthier inbox
- more noisy senders unresolved → worse health
- more ambiguous senders pending review → lower confidence in health score

This creates a more realistic health model.

---

# Learning Loop

The Sender Trust Graph must learn from confirmed outcomes.

Learning signals include:

- accepted archive recommendations
- rejected archive recommendations
- repeated keep behavior
- decision reversals
- unsubscribe confirmations
- custom rule stabilization

These signals should update:

- trust weights
- neighborhood similarity
- ambiguity handling
- automation safety confidence

Important rule:

Learning must remain explainable and auditable.

---

# Safety Rules

The Sender Trust Graph must follow these safety constraints:

1. High protection evidence must override aggressive cleanup suggestions.
2. Ambiguous senders should be verified rather than auto-cleaned.
3. Trust graph certainty must not be overstated when history is partial.
4. Domain-level similarity should assist reasoning, not replace sender-level evidence.
5. Any automation thresholds derived from the graph must remain conservative.

---

# Performance Requirements

The Sender Trust Graph must be cheap enough to support interactive recommendations.

Targets:

- sender trust retrieval under 50ms from warm data
- neighborhood lookup under 100ms from warm data
- trust update propagation under 200ms on incremental refresh

The graph must operate on:

- sender-derived indexes
- cached aggregates
- summarized decision histories

It must not scan raw mailbox history during interactive requests.

---

# Phase Roadmap

## Phase 1

- basic sender trust score
- protection / noise / ambiguity summaries
- conservative use inside decision suggestions

## Phase 2

- domain edges
- decision similarity edges
- stronger verification routing

## Phase 3

- behavioral similarity modeling
- temporal drift modeling
- stronger cluster influence

## Phase 4

- advanced graph learning from long-term confirmed outcomes
- automation threshold tuning
- autonomous inbox evolution support

---

# Product Vision

The Sender Trust Graph should make the Gmail Workspace feel like it truly understands:

- who the user cares about
- who is clutter
- who changed behavior
- who is safe to automate
- who still needs human judgment

This is one of the key intelligence layers that turns the product from an inbox cleaner into an inbox operating system.

---

# Summary

The Gmail Workspace Sender Trust Graph is the graph-based trust intelligence layer that models:

- sender reputation
- relationship depth
- noise propensity
- ambiguity
- automation safety
- trust evolution over time

It powers safer recommendations, better cluster formation, stronger protection logic, and future autonomous inbox optimization.
