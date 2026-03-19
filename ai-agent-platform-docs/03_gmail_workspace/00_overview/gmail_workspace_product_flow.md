

# Gmail Workspace Product Flow Specification

## Purpose
This document defines the **exact product flow** for the Gmail Workspace inside the AI Agent Platform. The goal is to ensure Codex, engineers, and future contributors implement the Gmail cleanup experience as a **sender‑first guided workflow** rather than a message‑first triage system.

The Gmail Workspace should feel like a structured, intelligent assistant that helps users understand their inbox and make decisions at the **sender level**, while messages act only as supporting evidence.

This spec converts the conceptual product flow into **clear implementation expectations** for engineering.

---

# Core Design Principles

## 1. Sender‑First Architecture
The primary decision object is always **the sender**.

Users never make decisions directly on individual messages during the main workflow.

Messages only exist as **evidence inside sender inspection panels**.

Sender decisions create:

- Immediate actions (archive)
- Learned policies
- Future automation rules

---

## 2. Guided Workflow Model
The Gmail cleanup experience is a **guided workflow** with clear stages.

Users should never feel like they are in a generic inbox tool.

The experience should feel like:

AI analysis → sender discovery → sender decisions → confirmation → automation learning.

---

## 3. Progressive Scope Narrowing
The UI must always communicate how the dataset narrows as the user moves deeper into the workflow.

Every stage shows the **Scope Ladder**:

Whole Mailbox

→ Cleanup Candidate Universe

→ Cleanup Group

→ Sender Set

→ Loaded Preview Rows

Each step must explain:

- the count
- what the count represents
- why the scope narrowed

---

# Product Workflow Stages

## Stage 0 — Intro & Health
Route:

```
/operations
```

Purpose:

- mailbox health overview
- explanation of sender‑first cleanup
- onboarding for new users

This page should not contain heavy analytics.

Instead it provides:

- mailbox size
- indexed coverage
- connection status
- quick entry into Mailbox Intelligence

Primary action:

"Open Mailbox Intelligence"

---

# Stage 1 — Mailbox Intelligence
Route:

```
/operations/intelligence
```

This is the **true Gmail dashboard**.

It must present **three simultaneous views of the mailbox**.

## Whole Mailbox

Total indexed emails

Sender universe size

Human vs automated ratio

Activity timeline

Sender volume distribution

## Cleanup Candidate Universe

Subset of the mailbox likely to contain cleanup opportunities.

Metrics include:

- candidate sender count
- candidate message volume
- top cleanup contributors

## Protected / Safe Context

Senders automatically protected because they are likely personal.

Examples:

- contacts
- recent conversations
- low‑volume personal senders

---

## Required Visualizations

Mailbox Intelligence **must include visual analytics**:

Examples:

- sender volume histogram
- domain distribution chart
- automated vs human pie chart
- sender activity timeline

These visuals are essential for **human understanding of inbox structure**.

---

## Sender Table

The page must include a sortable sender table containing:

- sender email
- domain
- message count
- unread count
- last activity
- category hints

The table must support:

- sorting
- filtering
- search

---

## Primary Outcome

User proceeds to:

```
Cleanup Groups
```

---

# Stage 2 — Cleanup Groups

Route:

```
/operations/clusters
```

Cleanup groups represent **AI‑generated clusters of senders**.

Clusters are **based on sender behavior**, not message type.

Examples:

Promotional Senders

Retail Senders

Old Subscription Senders

Travel/Entertainment Senders

Dormant Senders

---

## Cluster Cards

Each cluster card displays:

- sender count
- total messages
- percentage of candidate universe
- short explanation

Example:

```
Retail Senders
245 senders
14,200 messages
Likely newsletters or promotions
```

Clicking a cluster moves to **Sender Decisions**.

---

# Stage 3 — Sender Decisions (Swipe Mode)

Route:

/operations/review
stage=senders

This is the **primary decision engine of the product**.

The user does NOT see a table by default.

Instead, the experience shifts into a **single-focus, high-speed decision flow** similar to a swipe-based interface (Tinder-like interaction model).

---

## Core Interaction Model

Only ONE sender is shown at a time.

The screen enters **Decision Mode**:
- background UI dims
- focus locks to the active sender
- user makes a fast decision
- next sender appears instantly

The goal is **speed, clarity, and momentum**, not analysis paralysis.

---

## Sender Profile Card

Each sender is presented as a **full profile card**:

### 1. Header (Identity)
- sender name
- sender email
- domain
- optional avatar/logo (if available)

### 2. Summary (AI Description)
Short explanation of who the sender is:
- “Retail brand sending promotions”
- “Financial account notifications”
- “Social updates platform”

### 3. Key Signals
- Human vs Machine likelihood
- Message frequency
- Recency
- Inbox impact (volume contribution)

### 4. Content Breakdown
Grouped categories of emails:
- Promotions
- Updates
- Alerts
- Social
- Other detected clusters

Each category is expandable to show:
- example subject lines
- snippets
- timestamps

Messages remain **evidence only**, never primary objects.

---

## Decision Actions (Only 4)

The user has exactly four choices:

1. **Keep All**
   → All emails from this sender remain in inbox

2. **Keep Some**
   → Sender moves to **Custom Rules (Management)**

3. **Archive All**
   → Sender moves to **Archive bucket (Management)**

4. **Not Sure**
   → Sender moves to **Quarantine (Management)**

---

## Decision Flow Behavior

After user clicks a decision:
- decision is saved instantly
- sender exits the queue
- next sender card appears immediately

No confirmation step.

No intermediate friction.

This is a **rapid-fire decision loop**.

---

## Completion State

When all senders in a group are processed:

- user exits Decision Mode
- system shows summary:
  - total senders processed
  - breakdown by decision type

User proceeds to Management stage.

---

## Important Constraints

- No bulk table editing in this stage
- No multi-select
- No scrolling through multiple senders
- No message-level decisions here

This stage is strictly:
→ **one sender → one decision → next sender**

---

## UX Goal

The user should be able to process:
- dozens to hundreds of senders in minutes

The experience must feel:
- fast
- satisfying
- progress-driven

# Stage 4 — Exceptions / Verification

Route:

```
/operations/review
stage=exceptions
```

Purpose:

Handle senders that may require extra verification.

Examples:

- mixed message types
- protected sender candidates
- ambiguous classification

Users confirm or override decisions before proceeding.

---

# Stage 5 — Management (Decision Execution)

Route:

/operations/review
stage=management

This replaces the old confirmation-first model.

Management is where **decisions become actionable workflows**.

---

## Buckets

Senders are grouped into four buckets based on decisions:

### Keep
- no action required
- already in inbox
- no Gmail mutation

---

### Archive
- all messages from sender will be archived
- grouped by sender
- shows message count impact

Primary action:
→ “Push Archive to Gmail”

---

### Custom Rules (Keep Some)
- user must refine which categories to keep vs archive

Flow:
- sender card reappears (focused mode)
- categories displayed
- user selects:
  - keep
  - archive

Primary action:
→ “Apply Custom Rules”

---

### Quarantine (Not Sure)
- no immediate action
- user can revisit later
- optional conversion into Archive or Custom Rules

---

## Execution Controls

For actionable buckets (Archive + Custom Rules):

- status indicator:
  - pending
  - applied
- action button:
  - “Push to Gmail”
- undo support:
  - revert last action

---

## Important Rules

- Gmail mutations happen ONLY here
- Sender Decisions stage does NOT mutate Gmail
- All actions are reversible

---

## UX Goal

Management should feel like:
- a control center
- not a review burden

The heavy thinking is already done in Stage 3.

# Stage 6 — Rules & Automation

Route:

```
/operations/review
stage=rules
```

This stage converts sender decisions into automation rules.

Examples:

Always archive from example.com

Always keep messages from john@company.com

Auto‑unsubscribe promotional senders

Users can:

- approve rules
- modify rules
- disable rules

---

# Stage 7 — Monitoring

Route:

```
/operations/review
stage=monitoring
```

Monitoring displays the **AI learning system**.

It shows:

- learned sender policies
- automation recommendations
- policy change history

Monitoring acts as the **AI supervision interface**.

---

# Performance Requirements

Page load time must remain under:

```
< 2 seconds
```

Techniques required:

- caching intelligence results
- pagination for sender tables
- background loading for message previews

Mailbox intelligence should be cached per agent session.

---

# Key Engineering Constraints

Messages must never be the primary decision unit.

Clusters must be **sender‑based**.

Archive is the only live Gmail mutation.

Other decisions create policy memory.

Sender decisions must persist into:

```
agent_events
```

And mirrored into:

```
rag_documents
```

---

# Success Criteria

The Gmail Workspace is successful when:

Users can understand their inbox within minutes.

Cleanup actions operate at the sender level.

The system learns from user behavior.

Future inbox cleanup becomes mostly automated.

---

End of Gmail Workspace Product Flow Specification
# Gmail Workspace Product Flow Specification (Merged)

## Purpose
This document defines the **exact product flow** for the Gmail Workspace inside the AI Agent Platform. It unifies:
- High-level workflow (Mailbox → Senders → Decisions → Automation)
- Detailed UI/UX behavior (sender-first, swipe decision mode)

The goal is to ensure the system is implemented as a **sender-first decision engine**, not a message-first inbox.

---

# Core Design Principles

## 1. Sender‑First Architecture
The primary decision object is always **the sender**.

Messages are:
- supporting evidence only
- never the primary decision unit

Decisions create:
- immediate actions (archive)
- learned policies
- future automation

---

## 2. Guided Workflow Model
The product is a **structured workflow**, not a tool:

AI analysis → sender discovery → sender decisions → management → automation → monitoring

---

## 3. Progressive Scope Narrowing
Always show scope reduction:

Mailbox → Candidate Universe → Cluster → Sender → Message Evidence

Each stage must explain:
- counts
- meaning
- why scope narrowed

---

## 4. Speed Over Complexity
The system prioritizes:
- fast decisions
- low friction
- momentum

Not:
- deep manual inspection

---

# Full Product Workflow

## Stage 0 — Operations / Entry
Route: /operations

Purpose:
- system status
- mailbox connection
- entry point

Primary action:
"Open Mailbox Intelligence"

---

## Stage 1 — Mailbox Intelligence (Bird’s-Eye View)
Route: /operations/intelligence

Purpose:
Convert inbox from:
"200,000 emails"
→
"X senders"

### Views

#### Whole Mailbox
- total messages
- sender count
- timeline
- human vs machine ratio

#### Cleanup Candidate Universe
- likely cleanup senders
- volume impact

#### Protected Context
- personal senders
- safe senders

### Visuals
- sender distribution
- activity timeline
- category breakdown
- domain distribution

### Outcome
User selects a cleanup group

---

## Stage 2 — Cleanup Groups (Clusters)
Route: /operations/clusters

Clusters = behavioral groupings of senders

Examples:
- promotions
- retail
- dormant
- subscriptions

Each card shows:
- sender count
- message volume
- % of inbox
- explanation

Outcome:
User selects cluster → enters Sender Decisions

---

## Stage 3 — Sender Decisions (Swipe Mode)
Route: /operations/review?stage=senders

This is the **core engine**.

### Interaction Model
- ONE sender at a time
- full-screen focus
- instant transitions

### Sender Profile Card

#### Identity
- name
- email
- domain
- avatar/logo

#### AI Summary
- what sender is

#### Signals
- human vs machine
- frequency
- recency
- impact

#### Content Breakdown
Grouped categories:
- promotions
- updates
- alerts

Expandable with examples

---

### Decision Buttons (ONLY 4)

1. Keep All
2. Keep Some
3. Archive All
4. Not Sure

---

### Decision Mapping

| Decision | Result |
|--------|-------|
| Keep All | stays in inbox |
| Keep Some | goes to Custom Rules |
| Archive All | goes to Archive |
| Not Sure | goes to Quarantine |

---

### Behavior
- instant save
- no confirmation
- next sender immediately

Goal:
Process hundreds of senders quickly

---

## Stage 4 — Management (Execution)
Route: /operations/review?stage=management

This is where decisions become actions.

### Buckets

#### Keep
- no action

#### Archive
- bulk archive
- push to Gmail

#### Custom Rules (Keep Some)
- user selects categories to keep/archive

#### Quarantine
- revisit later

---

### Execution Controls
- push to Gmail
- undo support
- status indicators

---

### Rule
Gmail mutations ONLY happen here

---

## Stage 5 — Rules & Automation
Route: /operations/review?stage=rules

Convert decisions into rules:

Examples:
- always archive
- always keep
- category filtering

---

## Stage 6 — Monitoring
Route: /operations/review?stage=monitoring

AI learning layer:
- behavior tracking
- recommendations
- policy evolution

---

# AI Learning Loop

Observation → Preference → Policy → Automation

The system improves continuously.

---

# Performance Requirements
- page load < 2s
- cached intelligence
- background loading

---

# Key Constraints
- sender-first only
- no message-first workflows
- decisions stored in:
  - agent_events
  - rag_documents

---

# Success Criteria

The system succeeds when:
- users understand inbox quickly
- decisions are sender-based
- automation takes over

---

# Final Summary

This merged flow ensures:
- clear mental model (from second document)
- precise UI/UX execution (from first document)

The product is now defined as:

"A sender-first, AI-driven inbox decision system with a guided, high-speed workflow."