# Gmail Workspace — Inbox Health Engine Specification

## Purpose
The Inbox Health Engine defines how the system evaluates the *state of a user's mailbox* and communicates progress toward a clean, optimized inbox.

This replaces traditional “training” by turning the dashboard into a **live mission system** that shows:

- Current inbox condition
- What actions remain
- How close the user is to a healthy mailbox
- What the AI recommends next

The goal is to make the system feel like a **guided mission with measurable progress**, not a tutorial.

---

# Core Principles

1. **Health is measurable**
   The system must compute a numeric health score.

2. **Health must be explainable**
   Users should understand *why* the score is what it is.

3. **Health must improve through actions**
   Every sender decision should improve the score.

4. **Health should guide behavior**
   The dashboard should always show the most impactful next action.

---

# Inbox Health Score

The Inbox Health Score is a **0–100 score** representing how optimized the inbox is.

Example tiers:

| Score | Status | Meaning |
|------|------|------|
| 0–30 | Critical | Inbox overloaded or unmanaged |
| 30–60 | Poor | Significant cleanup needed |
| 60–80 | Improving | Most issues addressed |
| 80–95 | Healthy | Inbox mostly optimized |
| 95–100 | Optimal | Fully controlled sender ecosystem |

The health score is displayed prominently on the **Mailbox Intelligence dashboard**.

---

# Health Score Components

Health is derived from multiple factors.

Example weighted model:

## 1. Sender Control (40%)

Measures how many senders have defined policies.

Metrics:

- % of senders classified
- % of senders with rules
- % of senders left undecided

Example:

```
Sender Control Score =
(send ers_with_decisions / total_senders) * 100
```

---

## 2. Inbox Noise Reduction (25%)

Measures how much non‑essential mail has been reduced.

Signals:

- archived senders
- unsubscribed senders
- quarantined senders

---

## 3. High‑Value Sender Protection (20%)

Ensures important communications remain protected.

Signals:

- protected messages
- starred messages
- important sender interactions

---

## 4. Automation Coverage (15%)

Measures how much future mail will be automatically handled.

Signals:

- rule coverage
- automated filtering
- unsubscribe automation

---

# Health Dashboard Elements

The Mailbox Intelligence page should display:

## 1. Health Score Card

Example:

```
Inbox Health
72 / 100
Improving
```

## 2. Progress Indicator

Shows movement toward optimal inbox.

Example:

```
Progress: 72%
Goal: 95%+
```

## 3. Key Metrics

Examples:

- Senders analyzed
- Senders classified
- Pending cleanup clusters
- Rules created

---

# Mission System (Dynamic Tasks)

The dashboard should generate **mission‑style actions**.

Example tasks:

- Review 520 subscription senders
- Confirm 50 protected senders
- Finish pending cleanup cluster
- Approve 1 archive action

These tasks update dynamically based on system state.

---

# Resume System

The dashboard must remember unfinished work.

Examples:

```
Resume Previous Task
Subscription Senders
520 remaining
```

If multiple tasks exist, the system should present a list.

---

# Recommended Action Engine

The system should always recommend the highest‑impact action.

Example:

```
Next Recommended Action
Review Retail Commerce Senders
Impact: High
```

Recommendation ranking is based on:

- sender volume
- message frequency
- automation potential

---

# Inbox Health Feedback Loop

Every decision feeds back into the health engine.

Example flow:

```
User archives sender
→ Sender control increases
→ Inbox noise decreases
→ Health score improves
```

This creates a visible progress loop.

---

# Visual Analytics Integration

The health engine should integrate with charts:

Examples:

- Sender volume chart
- Automation coverage chart
- Inbox activity timeline

Charts should support hover and filtering.

---

# Long‑Term Health Monitoring

After the inbox is optimized, the dashboard becomes a **monitoring system**.

Examples:

- new senders detected
- rule conflicts
- inbox noise increases

The health score should update continuously.

---

# Future Extensions

Planned improvements:

- predictive inbox health
- anomaly detection
- automated rule suggestions

These belong to later Gmail workspace phases.

---

# Relationship to Other Documents

Related specs:

- `GMAIL_WORKSPACE_ANALYTICS_SPEC.md`
- `GMAIL_WORKSPACE_UX_SPEC.md`
- `GMAIL_WORKSPACE_DECISION_STORAGE_SPEC.md`

The Inbox Health Engine drives the **Mailbox Intelligence dashboard** behavior.

---

# Implementation Phase

Inbox Health Engine is implemented incrementally:

Phase 1

- Basic health score
- progress indicator
- mission tasks

Phase 2

- automation coverage
- predictive recommendations

Phase 3

- full AI optimization layer

---

End of Specification
