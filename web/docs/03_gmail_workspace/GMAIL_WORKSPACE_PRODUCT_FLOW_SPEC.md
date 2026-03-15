

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

# Stage 3 — Sender Decisions

Route:

```
/operations/review
stage=senders
```

This is the **primary workspace**.

The user evaluates senders and assigns policies.

Each sender row displays:

- sender
- domain
- message count
- unread count
- last activity
- evidence preview

---

## Sender Evidence Drawer

Clicking a sender opens a drawer showing:

- message snippets
- subject lines
- timestamps

Messages remain **evidence only**.

---

## Sender Decision Options

Available decisions:

Keep

Archive

Quarantine

Unsubscribe

Custom Rule

Each decision writes a **sender policy** to the workflow draft.

---

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

# Stage 5 — Confirmation

Route:

```
/operations/review
stage=confirmation
```

This stage shows **exact action impact**.

Example output:

Archive

35 senders

12,400 messages

Keep

120 senders

4,200 messages

Quarantine

10 senders

200 messages

---

## Important Rule

This is the **first place where message counts become the primary numbers**.

Earlier steps focus on senders.

---

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