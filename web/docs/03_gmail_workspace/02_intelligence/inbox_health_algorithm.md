# Gmail Workspace Inbox Health Algorithm Model

## Purpose
The Inbox Health Algorithm powers the Mailbox Intelligence dashboard. It converts raw mailbox data into a continuously updating health score that helps users understand:

- The current state of their inbox
- How far they are from an optimized inbox
- What actions will most improve their inbox

The algorithm must be deterministic, explainable, and fast enough to recompute frequently.

The goal is to remove the need for traditional training by letting users *see progress toward a clean inbox.*

---

# Core Health Model

Inbox Health is calculated using a weighted scoring system based on several mailbox dimensions.

```
InboxHealthScore = 
  SenderClarityScore
+ InboxNoiseScore
+ AttentionDistributionScore
+ CleanupProgressScore
+ SenderTrustScore
```

The score is normalized to **0–100**.

Interpretation:

| Score | Status |
|------|------|
| 90–100 | Healthy |
| 70–89 | Improving |
| 40–69 | Needs Attention |
| 0–39 | Overloaded |

---

# Component Scores

## 1. Sender Clarity Score
Measures how well the system understands sender intent.

Inputs:

- classified senders
- unclassified senders
- ambiguous senders

Formula:

```
SenderClarityScore = 
  (classifiedSenders / totalSenders) * 25
```

Max contribution: **25 points**.

---

## 2. Inbox Noise Score
Measures the proportion of unwanted senders.

Inputs:

- cleanup candidate senders
- trusted senders

Formula:

```
InboxNoiseScore = 
  (trustedSenders / totalSenders) * 25
```

Max contribution: **25 points**.

---

## 3. Attention Distribution Score
Evaluates how concentrated attention is among senders.

Indicators of unhealthy inboxes:

- extremely high volume from low-value senders
- large numbers of dormant senders

Formula:

```
AttentionDistributionScore =
  balancedAttentionRatio * 20
```

Where balancedAttentionRatio evaluates whether message volume is dominated by high-value senders.

Max contribution: **20 points**.

---

## 4. Cleanup Progress Score
Tracks how much cleanup the user has already completed.

Inputs:

- reviewed senders
- total cleanup candidate senders

Formula:

```
CleanupProgressScore =
  (reviewedSenders / cleanupCandidateSenders) * 20
```

Max contribution: **20 points**.

---

## 5. Sender Trust Score
Measures confidence in the sender decision model.

Factors:

- confirmed sender decisions
- verified protected senders
- rule coverage

Formula:

```
SenderTrustScore =
  (confirmedSenders / classifiedSenders) * 10
```

Max contribution: **10 points**.

---

# Inbox Health Lifecycle

Inbox health is dynamic and updates whenever:

- new emails arrive
- sender classifications change
- rules are created
- cleanup clusters are processed

Health can therefore **improve or degrade automatically.**

---

# Predictive Health Signals

The algorithm also produces predictive signals used by the dashboard.

Examples:

## Predicted Deterioration

Triggers when:

- message growth rate increases
- high-noise senders spike

Used for:

- proactive cleanup recommendations

---

## High Value Sender Detection

Signals:

- frequent interaction
- replies
- starred messages

These senders influence:

- protected sender detection
- trust score weighting

---

## Cluster Prioritization

Clusters are ranked using:

```
clusterPriority =
  senderVolume
+ unreadWeight
+ inactivityWeight
+ noiseProbability
```

This determines the **recommended cleanup order.**

---

# Dashboard Integration

The health score drives multiple UI elements.

## Health Progress Bar

Shows:

- current score
- target score

Example:

```
Current Health: 52
Target Health: 90
Progress: 58%
```

---

## Mission System

The dashboard generates tasks automatically.

Examples:

- Review 50 dormant senders
- Verify protected senders
- Complete subscription cleanup

---

# Self‑Optimizing Behavior

Over time the system learns from decisions.

Signals include:

- sender archive frequency
- unsubscribe confirmations
- keep decisions

These signals influence:

- cluster ranking
- noise prediction
- trust scoring

---

# Performance Constraints

Health scoring must remain extremely fast.

Requirements:

- recompute in under **100ms**
- operate on indexed sender tables
- avoid scanning full message history

---

# Phase Roadmap

## Phase 1

- deterministic scoring
- basic signals
- dashboard health bar

## Phase 2

- predictive deterioration
- sender value scoring

## Phase 3

- adaptive weighting
- reinforcement learning

---

# Expected Outcome

The Inbox Health Algorithm transforms the dashboard from a passive analytics screen into an **active inbox guidance system**.

Users always know:

- where they are
- what to fix
- what to do next
