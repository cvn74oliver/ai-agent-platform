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


# Inbox Cleanliness Definition

The Gmail Workspace does **not** define a clean inbox as "zero emails."  
Instead, the system defines inbox cleanliness based on **sender decision coverage**.

A mailbox is considered **clean when every sender has a decision**.

A decision means the system knows how that sender should be handled:

| Sender State | Meaning |
|---|---|
| Keep | Sender is allowed and trusted |
| Archive | Messages should skip the inbox |
| Quarantine | Messages should be isolated for review |
| Unsubscribe | Sender should be removed from mailing lists |
| Custom Rule | Sender follows a defined automation rule |

Inbox health therefore measures:

```
Decided Senders / Total Senders
```

Message counts represent **impact**, not cleanliness.

For example, an inbox may contain thousands of messages and still be considered healthy if every sender has a defined decision.

Conversely, an inbox with only a few messages may still be considered degraded if many senders have not yet been reviewed.

### Health Scoring Logic

| Decision Coverage | Health State |
|---|---|
| 90–100% | Healthy |
| 70–89% | Stable |
| 40–69% | Warning |
| 20–39% | Degraded |
| 0–19% | Critical |

### Operator Goal

The operator's goal is therefore simple:

```
Review every sender once and assign a decision.
```

Once every sender has a decision, the inbox becomes self‑maintaining and the health score stabilizes.

The Intelligence Dashboard must reinforce this concept visually so the operator always understands:

- how many senders exist
- how many have been decided
- how many still require review

Without this context, the dashboard cannot effectively communicate progress or health.

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

### Visual-First Command Rule

The dashboard must be understandable at a glance **before** the operator reads paragraphs of copy.

Required priority order for every major dashboard surface:

1. Visual signal
2. Short label
3. Key number
4. Supporting explanation

If the operator must read dense text to understand what is happening, the visual system has failed.

The intended standard is:

> A first-time operator should be able to land on the page and understand the current state, the main blocker, and the next action without needing to read every card.

This rule exists because Mailbox Intelligence is the template for future workspaces across the platform, not just Gmail.

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

### Management Signals

The Inbox Health layer should also surface high‑level signals from the Management layer when they materially affect inbox state.

Examples:

- large archive queues awaiting approval
- quarantine volume spikes
- rule automation coverage
- unsubscribe backlog

These signals should appear as small visual indicators within the health layer rather than as separate dashboard sections.


The purpose is to ensure the operator can see **execution friction** without navigating away from the command dashboard.

### Hero Visual Contract (Hard Rule)

The hero layer must use a **strict and repeatable visual grammar**.

This rule is non-negotiable because the hero becomes the framework template for future workspaces.

Allowed hero visual types:

1. **Neutral scope meter**
   - used for scale or context
   - must NOT look like completion
   - examples: total senders indexed, total supporting messages

2. **True progress meter**
   - used only when progress toward a goal is being shown
   - examples: senders already decided, inbox cleanliness goal

3. **Health rail**
   - used only for inbox-health state
   - must remain separate from progress and scale visuals

### Hero Consistency Rule

All top-row metrics must share one coherent visual system.

The operator must not have to decode different meanings for:
- circles
- segmented rails
- gradients
- center markers
- empty bars
- full bars

If multiple hero metrics use different visual grammars, the dashboard is considered visually inconsistent.

### Visual Semantics Rule

A visual may NOT look like a completion bar unless it genuinely represents completion or progress.

Examples:
- A full-width filled rail implies completion.
- A partially filled rail implies measurable progress.
- A neutral scope indicator must not resemble a progress bar.

If a metric is about scope, density, or pressure, it must not visually read as “done” or “good.”

### Single Strong Progress Rule

The hero may contain multiple metrics, but it must have only **one dominant progress truth**:

```text
Every sender should have a decision.
```

That progress truth belongs to the **Inbox Cleanliness Goal**.

The cleanliness goal must:
- use one progress bar only
- use one denominator only
- visually outrank all other hero progress-like visuals
- clearly show:
  - decided senders
  - total indexed sender universe

No secondary hero element may visually compete with this progress signal.

### Management Signal Display Rule

Management signals inside the Inbox Health layer must behave like **signal displays**, not generic stat cards.

The count is the primary visual anchor.

Required structure:
- large visible count
- short label
- one-line explanation
- action path only when relevant

Examples:
- approvals waiting
- archive follow-up
- quarantine states
- rule intent coverage
- recent restores

### Management Signal Interaction Rule

If a management signal requires action, it must expose a clear action path.

Examples:
- approvals waiting → open Confirmation
- archive follow-up requiring investigation → open Management
- quarantine/rule coverage with no immediate action → may remain informational only

Repeated generic buttons such as `Open Management` under every signal should be avoided.

The signal should either:
- provide a relevant action, or
- remain a read-only signal

but not pretend every signal deserves the same navigation pattern.

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

These panels primarily explain the operational situation.

However, when a panel references an actionable step (for example approvals waiting or sender review ready), the UI should expose a **clear call‑to‑action button** that navigates directly to the relevant workflow surface.

Examples:

• "Resume Sender Review" → opens Sender Decisions
• "Approve Archive Queue" → opens Confirmation
• "Open Cleanup Groups" → opens Cleanup Groups

Guidance without an actionable path should be avoided.

The only actionable item should be the **Do Next CTA**.

Example:

```
Do Next
Open Subscription Senders
```

### CTA Hierarchy Rule

Mission Control must have a clear action hierarchy.

Required:
- one obvious primary action
- supportive secondary status panels
- no repeated competing buttons

The `Do Next` block must visually dominate the Mission Control row.

Primary action treatment should be:
- high-contrast
- unmistakably clickable
- visually stronger than supporting cards

Secondary actions such as:
- resume sender review
- approval checkpoint follow-up
- cleanup group handoff

may be visible, but they must not compete with the primary action.

If multiple buttons in the same section appear equally important, the hierarchy has failed.

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


### Time Range Controls

The pressure trend should support time-range filtering **only when the underlying data actually supports it**.

Allowed ranges when implemented:
- Last 24 hours
- Last 7 days
- Last 30 days
- Last 6 months
- Last 12 months
- Custom range

The chart must dynamically adjust its bar grouping based on the selected range.

Examples:
- 24h range → hourly bars
- 30d range → daily bars
- 12m range → monthly bars

### Interaction Honesty Rule

The UI must never present controls that look interactive if they do not actually work.

Therefore:
- working time filters may appear as clickable controls
- non-working future filters must not appear as normal selectable chips
- if only one range is currently supported, the UI should show a clear **active trend window indicator** instead of fake controls

No fake interaction is allowed on the Intelligence Dashboard.

### Pressure Insight Rule

Hover and selected-period behavior must provide **new insight**, not just swap repeated numbers.

The pressure experience should distribute information clearly:
- one place for current period value
- one place for previous period comparison
- one place for change between periods
- one place for dominant driver
- one place for best next move

If the same value is repeated across the tooltip, label pills, and lower cards without adding new meaning, the chart is considered informationally redundant.

The selected period should teach the operator:
- whether cleanup gained or lost ground
- why that happened
- what kind of sender pressure mattered most
- which action would have changed the outcome

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

### Metric Visual Meaning Requirement

Every visual meter associated with a global metric must clearly communicate **what the percentage represents**.

For example:

- **Sender Universe Bar** must show: indexed senders vs total discovered senders.
- **Message Impact Meter** must show: visible‑window messages vs total indexed message context.
- **Decision Coverage Meter** must show: decided senders vs senders currently under review.
- **Active Review Indicator** must show: senders currently in the review queue vs total cleanup candidate senders.

A visual without an explained denominator ("100% of what?") is considered a design failure.

Codex must ensure that every percentage‑based visual has:

• a clear denominator
• a label describing the comparison
• hover text that explains the ratio

### Visual Representation Requirement

These metrics must also appear visually in the hero layer.

Examples:

- Sender Universe Bar (total indexed senders)
- Message Impact Meter (total supporting messages)
- Decision Coverage Meter (decided senders vs total)
- Active Review Indicator (senders currently under review)


The operator must understand the **scale of the system instantly**.

### Metric-Specific Dashboard Contract

The Mailbox Intelligence dashboard must treat these four hero metrics differently.

#### 1. Total Senders Indexed
Purpose:
- show the indexed sender universe size
- establish cleanup scale

Allowed visual behavior:
- neutral scope meter only
- must NOT look like progress or completion

#### 2. Total Supporting Messages
Purpose:
- show inbox pressure / supporting-message context
- represent load, not success

Allowed visual behavior:
- neutral load or density meter only
- must NOT look like a “good when full” progress bar

#### 3. Senders Currently Under Review
Purpose:
- show how much of the cleanup candidate universe is currently surfaced for active work

Allowed visual behavior:
- proportional active-work meter
- denominator must be visible or immediately understandable

#### 4. Senders Already Decided
Purpose:
- show real cleanup progress

Allowed visual behavior:
- true progress meter
- denominator must be the indexed sender universe unless otherwise explicitly labeled

This metric is the only top-row metric that should feel like clear completion progress.

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

# Mailbox Intelligence Page Contract (Implementation Lock)

This section exists to remove ambiguity during implementation.

## Non-Negotiable Rules

1. The page must be **visual-first**.
2. The hero must use a coherent and repeatable visual grammar.
3. The cleanliness goal must be the strongest progress signal on the page.
4. Management signals must read like signals, not generic mini-cards.
5. Mission Control must have one obvious primary action.
6. Pressure Trend must provide real insight, not decorative number swapping.
7. No UI element may look interactive unless it truly works.

## Failure Conditions

The page should be considered failed if any of the following occur:

- the user cannot tell what the top-row visuals mean at a glance
- multiple hero visuals compete as “progress” indicators
- management signals look like generic stat cards instead of operational alerts
- hover only repeats visible numbers
- multiple CTAs compete with the main next action
- fake time filters or fake controls are shown
- the dashboard resembles Cleanup Groups, Sender Decisions, or Management instead of summarizing and directing

## Framework Rule

Mailbox Intelligence is not a one-off Gmail page.
It is the framework template for future workspaces across the AI Agent Platform.

Therefore every visual and interaction pattern defined here must be:
- understandable
- reusable
- duplicatable across other workspace types

Examples of future workspaces include:
- tax
- crypto investing
- customer service
- email marketing
- Facebook ads
- Google ads

If a dashboard pattern is too confusing, too text-heavy, or too Gmail-specific to generalize, it should not be used as the framework standard.

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
