# Gmail Workspace — Intelligence Dashboard Specification

## Purpose
The **Mailbox Intelligence Dashboard** is the command center for the Gmail Workspace. It sits above all operational pages and acts as the **narrative layer of the system**. Its job is to immediately explain the state of the inbox, the current cleanup posture, the primary bottleneck, and the next recommended action.

This page must guide the operator through the system rather than merely display metrics.

The dashboard should answer, within a few seconds of viewing:

1. **What is the health of the inbox?**
2. **What is slowing cleanup down?**
3. **What should the operator do next?**
4. **What impact will that action have?**

The dashboard must tell a **clear operational story**, not simply present raw data.

---

# Core Design Principles

## 1. Story First, Metrics Second
The dashboard should read like a briefing rather than a report.

Every section should answer a question:

| Question | Dashboard Section |
|--------|--------|
| What is happening right now? | Inbox Health |
| Why is it happening? | Primary Driver |
| What should I do next? | AI‑Guided Next Move |
| What happens if I do it? | Expected Improvement |

Metrics support the story — they do not replace it.

## 2. Visual First, Numbers Second
Every major metric must have a visual companion. Raw numbers alone are not acceptable on this dashboard.

For each key metric, the UI should present:

Metric → Visual Representation → Meaning

Examples:

| Metric | Visual | Purpose |
|------|------|------|
| Total Senders Indexed | Sender Universe Bar | Shows total cleanup surface |
| Supporting Messages | Message Impact Meter | Shows inbox pressure potential |
| Senders Under Review | Active Review Gauge | Shows current work state |
| Senders Already Decided | Decision Coverage Bar | Shows cleanup progress |

The user should understand the scale of the inbox **without reading numbers first**.

Numbers explain the visuals, not the other way around.

---

# Dashboard Structure

The Intelligence Dashboard is composed of five layers.

```
Inbox Health Layer
Mission Control Layer
Pressure Trend Layer
Cleanup Opportunity Layer
Operational Handoff Layer
```

Each layer must visually narrow the operator's focus. The layout should follow a funnel pattern:

GLOBAL SCALE → HEALTH STATE → BOTTLENECK → ACTION → EXECUTION PATH

If a section introduces new data without moving the operator closer to a decision, that section should be removed or simplified.

Each layer progressively narrows the user's focus toward the next action.

---

# Layer 1 — Inbox Health

This is the **primary visual anchor** of the dashboard.

It communicates overall inbox state in one glance.

### Required Elements

- Inbox Health Score (0–100)
- Health Severity Indicator
- Health Rail Visualization
- Primary Driver
- Recommended Intervention
- Expected Improvement

### Health Bands

| Score | Status |
|-----|-----|
| 80‑100 | Healthy |
| 60‑79 | Stable |
| 40‑59 | Warning |
| 20‑39 | Degraded |
| 0‑19 | Critical |

### Hover Intelligence

Hovering over health elements must reveal **reasoning**, not duplicated text.

Hover should explain:

- Why the current state exists
- Why the recommended intervention is preferred
- What assumptions drive the expected improvement

Example hover:

"Protected senders reduce over‑cleaning risk but slow cleanup until ambiguous senders are reviewed."

---

# Layer 2 — Mission Control

Mission Control is the **operational briefing panel**.

It must guide the operator through a simple mental flow:

```
Current Status → Main Bottleneck → Do Next → Expected Payoff
```

### Mission Control Blocks

1. Current Status
2. Main Bottleneck
3. Do Next
4. Expected Payoff
5. Work Already In Motion
6. Approval Checkpoint

### Interaction Rules

These panels are **explanatory only**, not action controls.

The only actionable item should be the **Do Next CTA**.

Example:

```
Do Next
Open Subscription Senders
```

---

# Layer 3 — Inbox Pressure Trend

This section explains whether cleanup is **gaining or losing ground**.

It must visually show how inbox pressure evolves over time.

### Chart Requirements

The pressure chart must communicate **momentum**, not just historical data.

Required behavior:

- Full‑width layout (must visually dominate its row)
- Bar‑based pressure visualization (not thin line charts)
- Clear peak month indicator
- Current month indicator
- Visible trend direction (rising / falling / stable)

Hover must reveal:

- Pressure value for the period
- Actual previous period value (not "vs prior period" text only)
- Change between periods
- Estimated sender-count change
- Dominant sender category that period
- Recommended intervention that would have reduced pressure

Example hover output:

```
Aug 2025
Pressure: 4,710 messages
Previous: 3,246
Change: +1,464
Likely Driver: Dormant low‑attention senders
Action That Would Help Most: Open Subscription Senders
```

---

# Layer 4 — Cleanup Opportunity

This section highlights **where the most meaningful cleanup opportunity exists**.

It should not replicate the Cleanup Groups page.

Instead it should summarize:

- Which group represents the biggest opportunity
- Why acting on it matters
- Estimated improvement

### Visual Behavior

- Horizontal opportunity bars
- Largest opportunity emphasized

Hover reveals:

- why the group matters
- operational change
- expected improvement
- safety context

Important: This layer summarizes opportunity but must NOT replicate the Cleanup Groups interface.

Mailbox Intelligence explains *where to go next*.
Cleanup Groups is where the operator actually explores those clusters.

If the dashboard begins to resemble the Cleanup Groups page, the hierarchy has been violated.

---

# Layer 5 — Operational Handoff

This section transitions the operator into the workflow.

The handoff must answer:

"Which group should I open next?"

### Required Elements

Recommended Next Group

Alternative Next Group

Expected Improvement

CTA

```
Open Full Cleanup Groups
```

---

# Required Global Metrics

The dashboard must always provide the following context somewhere near the top:

- Total senders indexed
- Total supporting messages
- Senders currently under review
- Senders already decided

Without these values the story lacks scale.

### Visual Representation Requirement

These metrics must also appear visually in the hero layer.

Examples:

- Sender Universe Bar (total indexed senders)
- Message Impact Meter (total supporting messages)
- Decision Coverage Meter (decided senders vs total)
- Active Review Indicator (senders currently under review)

The operator must understand the **scale of the system instantly**.

---

# What The Dashboard Must NOT Do

The dashboard must **not** duplicate operational pages.

It should NOT:

- replicate the full Cleanup Groups UI
- replicate Sender Decisions
- replicate Management dashboards

Instead it should **summarize and direct**.

---

# Relationship To Other Pages

| Page | Role |
|----|----|
| Mailbox Intelligence | Command Dashboard |
| Cleanup Groups | Group Selection Surface |
| Sender Decisions | Decision Surface |
| Confirmation | Execution Checkpoint |
| Management | Post‑Decision Control |

The dashboard orchestrates these pages.

---

# Desired User Experience

The operator should be able to glance at the dashboard and immediately know:

- whether the inbox is healthy
- what is slowing cleanup
- which sender group to open
- how much improvement to expect

If the operator must read multiple panels to understand what to do, the dashboard has failed.

---

# Codex Implementation Guardrail

When Codex modifies any UI related to Mailbox Intelligence, it must first read:

- gmail-workspace-visual-intelligence-spec.md
- GMAIL_WORKSPACE_INTELLIGENCE_DASHBOARD_SPEC.md

Codex must treat these documents as the source of truth for:

- visual hierarchy
- dashboard storytelling
- chart requirements
- hover behavior

If a UI change contradicts this specification, the specification overrides the code.

This rule exists to prevent visual regressions and inconsistent dashboard behavior during iterative development.

---

# Future Extensions

Planned future additions:

- AI rule recommendation layer
- automated cleanup simulations
- sender‑risk heatmaps
- cleanup velocity projections

These will appear beneath Mission Control once implemented.
