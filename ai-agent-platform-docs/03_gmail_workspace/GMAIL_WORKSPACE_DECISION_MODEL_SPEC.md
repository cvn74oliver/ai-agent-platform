

# Gmail Workspace Decision Model Specification

## Purpose
The Gmail Workspace Decision Model defines how the system decides:

- which senders are likely archive candidates
- which senders are likely high-trust / protected
- which senders require human verification
- which cleanup clusters should be prioritized first
- how recommendation confidence is calculated

This model is the decision intelligence layer that powers:

- the Recommendation Engine
- Sender Decision suggestions
- cluster prioritization
- inbox health improvements
- future automation readiness

It must remain:

- sender-first
- explainable
- confidence-driven
- safe for phased automation

This document works with:

- `GMAIL_WORKSPACE_RECOMMENDATION_ENGINE_SPEC.md`
- `GMAIL_WORKSPACE_HEALTH_ENGINE.md`
- `GMAIL_WORKSPACE_INBOX_HEALTH_ALGORITHM_MODEL.md`
- `GMAIL_WORKSPACE_DECISION_STORAGE_SPEC.md`
- `GMAIL_WORKSPACE_INTELLIGENCE_SYSTEM_INDEX.md`

---

# Core Role

The Decision Model translates mailbox and sender signals into **actionable sender-level recommendations**.

At a high level, it answers five questions:

1. Is this sender likely safe to archive?
2. Is this sender likely high-value and should be protected?
3. Is this sender ambiguous and needs human verification?
4. Which cluster creates the highest cleanup value right now?
5. How confident is the system in each recommendation?

This model is not the UI and not the executor.
It is the **reasoning layer** beneath them.

---

# Decision Objects

The primary decision object is always:

```text
Sender
```

Messages are supporting evidence only.

Each sender should be modeled with a decision profile that includes:

- canonical sender id
- sender email / domain
- cluster membership
- trust score
- noise score
- activity score
- protection score
- archive likelihood
- verification need score
- recommendation confidence

---

# Decision Categories

The model should be able to recommend one of five primary outcomes:

## 1. Archive Candidate
The sender appears low-risk and high-noise.

## 2. Keep / Protect
The sender appears high-value or relationship-relevant.

## 3. Quarantine Candidate
The sender appears low-value but confidence is not yet high enough for full automation.

## 4. Unsubscribe Candidate
The sender appears recurring, promotional, and likely removable.

## 5. Requires Verification
The sender has conflicting signals or protected evidence requiring human judgment.

---

# Core Scoring Dimensions

The model uses multiple scoring dimensions.

## 1. Sender Trust Score
Measures how likely the sender is important to the user.

Signals may include:

- replies sent to sender
- reply rate from sender
- stars / important flags
- keep decisions
- domain familiarity
- recurring meaningful interactions
- historical protection

Output:

```text
0–100 trust score
```

Interpretation:

- 80–100 = strongly trusted
- 50–79 = moderate trust
- 0–49 = weak trust

---

## 2. Noise Score
Measures how likely the sender contributes to inbox clutter.

Signals may include:

- high frequency with low engagement
- promotional wording
- subscription cadence
- bulk patterns
- no meaningful interaction history
- automated/system-like sending behavior

Output:

```text
0–100 noise score
```

Interpretation:

- 80–100 = very noisy
- 50–79 = likely noisy
- 0–49 = not strongly noisy

---

## 3. Activity Value Score
Measures whether the sender contributes meaningful attention value.

Signals may include:

- opened messages
- clicked messages
- replies
- recent interaction recency
- repeated manual review

Output:

```text
0–100 activity value score
```

This helps distinguish a high-volume sender that still matters from one that is just noise.

---

## 4. Protection Score
Measures how strongly the sender should be excluded from aggressive cleanup.

Signals may include:

- starred messages
- important flags
- user keep decisions
- prior protected evidence
- relationship depth

Output:

```text
0–100 protection score
```

High protection should override aggressive archive recommendations.

---

## 5. Verification Need Score
Measures how likely the sender should be routed to human review.

Signals may include:

- mixed trust and noise signals
- protected evidence plus promotional behavior
- recent important interactions with otherwise noisy pattern
- uncertain classification

Output:

```text
0–100 verification need score
```

Interpretation:

- 80–100 = must verify
- 50–79 = likely verify
- 0–49 = low verification need

---

# Derived Recommendation Scores

The core scores above combine into action likelihoods.

## Archive Likelihood
Example conceptual formula:

```text
ArchiveLikelihood =
  NoiseScore * 0.40
+ (100 - TrustScore) * 0.25
+ (100 - ProtectionScore) * 0.20
+ (100 - ActivityValueScore) * 0.15
```

High Archive Likelihood suggests the sender is a strong archive candidate.

---

## Keep Likelihood
Example conceptual formula:

```text
KeepLikelihood =
  TrustScore * 0.40
+ ProtectionScore * 0.30
+ ActivityValueScore * 0.20
+ (100 - NoiseScore) * 0.10
```

High Keep Likelihood suggests the sender should be preserved/protected.

---

## Unsubscribe Likelihood
Example conceptual formula:

```text
UnsubscribeLikelihood =
  NoiseScore * 0.35
+ SubscriptionSignal * 0.30
+ LowEngagementSignal * 0.20
+ RecurrenceSignal * 0.15
```

This should only surface when the sender appears truly subscription-like.

---

## Quarantine Likelihood
Example conceptual formula:

```text
QuarantineLikelihood =
  NoiseScore * 0.35
+ UncertaintySignal * 0.25
+ MediumTrustPenalty * 0.20
+ MediumProtectionPenalty * 0.20
```

Quarantine is useful when archive feels too strong but the sender still looks low-value.

---

# Decision Selection Logic

The model should choose a recommended decision using a conservative priority order.

## Priority Rule

1. If ProtectionScore is very high → prefer Keep / Protect
2. If VerificationNeedScore is very high → prefer Requires Verification
3. If ArchiveLikelihood is very high and confidence is high → suggest Archive
4. If UnsubscribeLikelihood is very high and confidence is high → suggest Unsubscribe
5. If QuarantineLikelihood is moderately high but uncertainty remains → suggest Quarantine
6. Otherwise → no strong recommendation / human review

This ensures the system remains safe.

---

# Confidence Model

Every recommendation must include a confidence score.

## Confidence Inputs

Confidence should consider:

- strength of top recommendation score
- gap between top and second-best recommendation
- ingestion completeness
- consistency of sender history
- prior confirmed user decisions
- trust graph certainty

Example output:

```text
Archive Recommendation
Confidence: 91
Reason: High noise, zero replies, no stars, recurring promotional cadence
```

## Confidence Thresholds

Suggested thresholds:

- 85–100 = High confidence
- 65–84 = Medium confidence
- 0–64 = Low confidence

Low confidence recommendations should either be hidden or routed to verification.

---

# Cluster Prioritization Model

The Decision Model also ranks clusters.

## Cluster Priority Factors

- sender count
- total message volume
- noise density
- archive opportunity
- protected risk
- operator momentum
- expected health gain

Example conceptual formula:

```text
ClusterPriority =
  CleanupOpportunity * 0.30
+ ExpectedHealthGain * 0.25
+ SenderVolume * 0.20
+ OperatorMomentum * 0.15
- ProtectedRisk * 0.10
```

This powers:

- recommended next cluster
- mission queue ranking
- resume prioritization

---

# Human Verification Routing

The model must deliberately route ambiguous senders into verification rather than over-automating.

Examples of verification-worthy senders:

- promotional sender with some starred messages
- high volume sender with occasional replies
- sender with mixed personal and automated content
- noisy domain with one protected thread

Verification routing is one of the most important safety functions in the model.

---

# Learning Loop

The Decision Model must improve through confirmed user behavior.

Signals from the learning loop include:

- accepted archive recommendations
- rejected archive recommendations
- repeated keep decisions
- reversed decisions
- custom rule creation
- unsubscribe confirmations

These signals should update:

- trust weighting
- noise weighting
- cluster ranking
- future confidence estimates

Important rule:

Learning must remain explainable and not become opaque.

---

# Explainability Requirements

Every surfaced recommendation should be explainable in plain language.

The UI should be able to say things like:

- "Recommended Archive because this sender sent 87 low-engagement promotional emails over 3 months."
- "Recommended Keep because this sender has repeated replies and protected messages."
- "Recommended Verification because this sender shows both promotional behavior and important interactions."

The Decision Model must therefore preserve its reasoning signals, not just final scores.

---

# Safety Rules

The Decision Model must follow these safety rules:

1. High protection should override aggressive archive suggestions.
2. Low-confidence recommendations should not look authoritative.
3. Phase 1 immediate Gmail execution remains archive-only.
4. Stored decisions must be reversible.
5. Ambiguous senders should go to verification rather than destructive action.

---

# Performance Requirements

The Decision Model must be fast enough for interactive UX.

Targets:

- sender-level recommendation retrieval under 100ms from warm derived data
- cluster prioritization under 150ms from warm derived data
- recommendation confidence calculation under 100ms from warm derived data

The model must operate on:

- sender-derived indexes
- trust graph summaries
- cached analytics
- decision history summaries

It must not scan raw mailbox history during interactive requests.

---

# Phase Roadmap

## Phase 1

- deterministic sender scoring
- conservative archive suggestions
- basic cluster prioritization
- verification routing for ambiguous senders

## Phase 2

- decision storage integration
- stronger unsubscribe / quarantine modeling
- editable rule-aware decision refinement

## Phase 3

- sender trust graph integration
- behavioral signals integration
- predictive recommendation improvement

## Phase 4

- reinforcement learning from decision outcomes
- adaptive weighting by user behavior
- highly personalized recommendation tuning

---

# Product Vision

The Decision Model should make the Gmail Workspace feel like it understands:

- who matters
- who does not
- what is safe to clean up
- what requires human judgment
- what action will improve inbox health most

This is the reasoning layer that makes the product feel truly intelligent.

---

# Summary

The Gmail Workspace Decision Model is the explainable AI scoring system that drives:

- sender recommendations
- verification routing
- cluster prioritization
- confidence scoring
- inbox health improvement recommendations

It is the core decision intelligence layer beneath the recommendation engine and health engine.