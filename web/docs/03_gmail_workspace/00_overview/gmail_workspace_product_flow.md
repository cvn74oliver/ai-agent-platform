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

## 4. Unified Sender Surface (Two Modes)
The system uses ONE sender card system with TWO modes:

- Overview Mode (exploration, comparison, context)
- Decision Mode (focused execution, one sender at a time)

The user must never lose context when moving between modes.
Transition into Decision Mode should happen in-place (overlay or focus shift), not via navigation to a disconnected screen.

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

Mailbox Intelligence must clearly communicate why some senders are not part of the cleanup candidate universe.
This must be reinforced again in Cleanup Groups via the Protected cluster.

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

Clicking a cluster moves to **Sender Overview** for that cleanup group.

---

Special cluster type must exist:

Protected / Trusted Senders

This cluster explains:
- why certain senders are excluded from cleanup candidates
- why they are protected (high engagement, personal, critical signals)

This removes the need for a separate explanation layer.

---

## Stage 3 — Sender Exploration & Decision (Unified Surface)
Route:
/operations/review

This is the core surface where users both:
- explore senders (Overview Mode)
- make decisions (Decision Mode)

This is NOT two separate systems.
This is ONE system with TWO modes.

The product must support two valid entry paths into sender decisions:
- Guided path: user clicks **Start Guided Review** and the system walks senders one by one
- Direct path: user clicks a specific sender and opens that sender in Decision Mode immediately

---

## Mode A — Overview Mode (Explore)

- multiple senders visible
- scrollable list
- expandable sender rows
- comparison across senders
- deep inspection of patterns and proof

User goal:
"Understand who these senders are"

Primary actions:
- scan senders
- expand sender rows
- click sender to enter Decision Mode
- optionally start guided review

---

## Mode B — Decision Mode (Execute)

- one sender in focus
- same sender data as overview
- decisions enabled
- progress visible
- next sender auto-advances

User goal:
"Make a decision quickly and move forward"

Entry paths:
- click sender from Overview Mode
- click "Start Guided Review"

Transition behavior:
- Decision Mode appears as an overlay or focus state
- user remains in same context (same cleanup group)
- no navigation reset

---

The user initially sees a scrollable sender list (Overview Mode).
Decision Mode is entered when a sender is selected or guided mode is started.

---

## Sender Profile Card

NOTE:
This card is the SAME component used in both Overview Mode and Decision Mode.
The only difference is interaction state and available actions.

The shared sender card must surface the same sender truth in both modes.
Overview Mode prioritizes comparison and scanning.
Decision Mode prioritizes action, progress, and evidence clarity.

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

These actions are only visible when the card is in Decision Mode.

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
- if the user entered by clicking a sender, Decision Mode starts on that exact sender
- if the user entered through guided review, Decision Mode starts on the first sender in the guided sequence

No confirmation step.

No intermediate friction.

This is a **rapid-fire decision loop**.

If the user entered from Overview Mode, they can exit Decision Mode and return to the same scroll position.

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

- No separate decision card system may be introduced
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

End of Gmail Workspace Product Flow Specification