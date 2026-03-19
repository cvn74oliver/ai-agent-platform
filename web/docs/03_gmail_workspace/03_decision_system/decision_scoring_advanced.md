

# Decision Engine Scoring Logic (Advanced)

## Purpose
This document defines the **intelligent scoring system** that powers the Sender Decision Engine.

While the UI is simple (4 buttons), the backend must:
- Pre-rank senders
- Predict likely decisions
- Reduce user effort over time
- Learn continuously from behavior

This system is NOT rule-based only — it is **adaptive + signal-driven + behavior-reinforced**.

---

## Core Principle

> The system should make the next decision **easier than the last one**.

We are not just classifying senders.
We are **training a personalized filtering system per user**.

---

## Scoring Model Overview

Each sender gets a **dynamic score profile** composed of:

### 1. Primary Classification Score
Determines likely decision:
- KEEP
- MIXED
- ARCHIVE
- UNSURE

### 2. Confidence Score
How confident the system is in that classification.

### 3. Effort Score
How complex the decision is expected to be.

### 4. Priority Score
Determines ordering in Decision Mode.

---

## 1. Primary Classification Signals

### A. Engagement Signals (Highest Weight)

- Open rate
- Click rate
- Reply rate
- Time spent reading

**Interpretation:**
- High engagement → KEEP
- Medium engagement → MIXED
- Low engagement → ARCHIVE

---

### B. Behavioral Recency

- Last opened timestamp
- Last interacted timestamp
- Frequency decay over time

**Key Insight:**
Recent behavior > historical behavior

---

### C. Volume Pressure

- Emails per week
- Emails per day
- Burst patterns

High volume + low engagement = **strong archive signal**

---

### D. Content Type Signals

- Promotions
- Updates
- Alerts
- Personal / human-like

Used to support:
- MIXED classification
- Category-level decisions

---

### E. Sender Type Detection

- Machine vs Human likelihood
- Domain patterns
- Reply behavior

---

## 2. Confidence Score

Confidence is based on:

- Data volume (number of emails)
- Consistency of behavior
- Signal agreement

### High Confidence:
- Strong consistent signals
- Clear pattern

### Low Confidence:
- Mixed signals
- Sparse data

---

## 3. Effort Score

Used to decide:
- How much UI explanation is needed
- Whether to prioritize early or later

### High Effort Senders:
- Mixed categories
- Inconsistent engagement
- Multiple email types

### Low Effort Senders:
- Clearly liked or disliked

---

## 4. Priority Ordering

Decision Mode order is NOT random.

### Priority Formula (simplified):

```
Priority = (Volume * Low Engagement Weight) + Uncertainty Weight
```

### Meaning:
- High volume junk → show early
- Easy wins → show early
- Complex edge cases → show later

---

## Pre-Sorting Strategy

Before user enters Decision Mode:

Senders are grouped into:

1. Easy Wins (clear KEEP / ARCHIVE)
2. Medium Decisions (likely MIXED)
3. Complex / Uncertain (UNSURE)

Decision Mode flows:
- Fast → Medium → Slow

---

## Learning System (Critical)

Every user action feeds back into the model.

### When user clicks:

#### KEEP ALL
- Increase weight for similar senders
- Boost engagement thresholds

#### ARCHIVE ALL
- Lower tolerance for similar patterns
- Increase archive confidence

#### MIXED
- Train category-level model
- Improve classification by email type

#### UNSURE
- Reduce confidence weighting
- Delay similar senders in future

---

## Reinforcement Loop

```
User Decision → Model Update → Future Ranking Improves
```

Over time:
- Fewer decisions needed
- Faster flow
- Higher accuracy

---

## Category-Level Learning (Phase 2)

For MIXED senders:

System learns:
- Which categories user prefers
- Which to suppress

Eventually enables:
- Auto-filtering rules
- Smart routing

---

## Auto-Suggestion System (Future)

Once confidence is high:

System can suggest:
- “Auto-archive this sender?”
- “Keep only updates?”
- “Block promotions?”

User can accept with 1 click.

---

## Edge Case Handling

### New Sender
- Default to UNSURE
- Minimal UI explanation

### Low Data Sender
- Lower confidence
- Push later in queue

### Conflicting Signals
- Route to MIXED
- Show category breakdown clearly

---

## Performance Requirements

- Scoring must be **fast (<50ms per sender)**
- Pre-computed wherever possible
- Cached for Decision Mode sessions

---

## Anti-Goals

The system should NOT:
- Over-explain decisions
- Force user to understand scoring
- Slow down decision flow

---

## Summary

This engine:
- Makes decisions easier
- Gets smarter with usage
- Powers the “Tinder-like” experience

> UI is simple. Intelligence is hidden.

That is the product advantage.