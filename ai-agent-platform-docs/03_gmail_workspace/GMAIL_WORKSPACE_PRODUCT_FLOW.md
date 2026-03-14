

# Gmail Workspace Product Flow

This document defines the **intended user workflow** for the Gmail Workspace inside the AI Agent Platform.

The purpose of this document is to ensure that both developers and AI agents (Codex) understand the **exact user experience, system behavior, and decision flow** for inbox cleanup.

The Gmail Workspace is not just an email viewer — it is an **AI‑assisted decision system** that helps users convert an overwhelming inbox into structured automation rules.

The workflow follows a **sender‑first model**, not a message‑first model.

Why this matters:

Most inbox tools force users to review individual messages.

Our system instead teaches the user that:

```
Mailbox → Senders → Sender Categories → Sender Decisions → Automation
```

Once users make decisions about senders, the system can automatically manage thousands of messages without manual review.

---

# Core Workflow Overview

The Gmail Workspace is organized into a **guided workflow** consisting of the following steps:

```
1. Mailbox Intelligence
2. Sender Analysis
3. Sender Decisions
4. Exceptions & Verification
5. Automation Rules
6. Continuous Monitoring
```

Each step moves the user from a high‑level understanding of their mailbox toward fully automated inbox management.

---

# Step 1 — Mailbox Intelligence (10,000‑Foot View)

Purpose:
Give the user a **bird's‑eye view of their entire mailbox** before any cleanup begins.

This step answers questions such as:

• How many emails exist in the mailbox?
• How many unique senders exist?
• What types of emails dominate the inbox?
• When does email activity spike?

Key analytics include:

• Sender volume distribution
• Email activity timeline
• Category breakdown (Promotions, Updates, etc.)
• Human vs automated email ratio
• Top senders by volume

Users can click analytics to **drill down into subsets of senders**.

This page helps the user mentally convert their inbox from:

"200,000 random emails"

into

"1,500 senders sending those emails"

This mental shift is critical for making inbox cleanup manageable.

---

# Step 2 — Sender Analysis

Purpose:
Identify and categorize **all senders** inside the selected cleanup universe.

The system groups senders into clusters such as:

• Newsletters
• Promotions
• Social notifications
• Automated system emails
• Transactional receipts
• Human conversations

Each sender displays:

• Total messages sent
• Recent activity
• Pattern classification
• Human vs machine likelihood
• Example message previews

Users can expand senders to preview multiple example emails before making decisions.

This step transforms the inbox into **a list of people and systems sending messages**.

---

# Step 3 — Sender Decisions

Purpose:
Allow users to make decisions **about senders**, not individual emails.

Possible sender actions:

• Always keep
• Keep but deprioritize
• Quarantine
• Archive automatically
• Unsubscribe / block

Users can also create **category‑specific decisions** for senders that send multiple email types.

Example:

```
Sender: Amazon

Receipts → Keep
Promotions → Archive
Shipping notifications → Keep
```

Most inbox cleanup decisions happen at this stage.

---

# Step 4 — Exceptions & Verification

Purpose:
Confirm the automation decisions before applying them.

The system shows:

• Messages that will remain in the inbox
• Messages that will be archived
• Messages that will be quarantined

Users can drill down by sender and verify sample messages before confirming.

This step acts as a **safety confirmation layer**.

---

# Step 5 — Automation Rules

Purpose:
Convert the user's decisions into **persistent automation rules**.

Examples:

```
Archive newsletters older than 14 days
Always keep emails from specific senders
Quarantine low‑priority promotions
```

Once rules are created, the AI system automatically manages future emails.

---

# Step 6 — Continuous Monitoring (AI Automation Layer)

Purpose:
Allow the AI agent to continuously monitor inbox activity and propose improvements.

Examples:

• New senders detected
• Changes in sender behavior
• New promotional campaigns

The system can suggest:

• "Archive similar emails automatically"
• "This sender behaves like one you previously archived"

Over time, the agent learns the user's preferences and reduces manual work.

---

# Sender‑First Architecture

The Gmail workspace uses a **sender‑first architecture**.

Instead of processing thousands of emails individually, the system organizes inbox cleanup around the entities that produce those emails.

Hierarchy:

```
Mailbox
  ↓
Senders
  ↓
Sender Categories
  ↓
Messages
```

This dramatically simplifies inbox cleanup.

Example:

```
200,000 emails
1,500 senders
```

The user reviews 1,500 senders instead of 200,000 messages.

---

# AI Learning Loop

Every decision feeds the AI memory engine:

```
Observation → Preference → Policy → Automation
```

Example:

```
Observation
Sender: Zillow
Volume: 795 messages

Preference
User archives Zillow promotions

Policy
Archive promotional senders

Automation
Future Zillow emails auto‑archived
```

Over time the system becomes increasingly autonomous.

---

# Design Principles

The Gmail Workspace follows five design principles:

1. Sender‑first decision making
2. Guided workflow
3. Progressive disclosure of complexity
4. Automation through user preference learning
5. AI‑assisted recommendations

The end goal is a system where:

• Users make decisions once
• The system remembers them
• The inbox cleans itself automatically

---

# Relationship to Other Workspaces

This architecture is not specific to Gmail.

The same pattern applies to other workspaces:

| Workspace | Entity Type |
|-----------|-------------|
| Gmail | Senders |
| Ads | Campaigns |
| CRM | Contacts |
| Crypto | Assets |
| Accounting | Transactions |

Each workspace follows the same pattern:

```
Universe → Entities → Decisions → Automation
```

The Gmail workspace is the **reference implementation** for the entire AI Agent Platform.
