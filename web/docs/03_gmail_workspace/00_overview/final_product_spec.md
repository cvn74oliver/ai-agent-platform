

# Gmail Workspace — Final Product Specification

## Purpose
This document defines the final product behavior for the Gmail Workspace inside the AI Agent Platform. It is the authoritative reference for how the Gmail workspace should function, how users interact with it, and how Codex should implement it.

The Gmail Workspace is not simply an email cleanup tool. It is a **sender‑intelligence and automation training environment** where users teach an AI agent how they want their inbox handled.

The system must prioritize:
- simplicity
- sender‑centric decision making
- AI learning and automation
- clear step‑by‑step workflows


---


# Core Product Philosophy

## System Role & Platform Positioning

The Gmail Workspace serves two roles:

1. A practical inbox cleanup and automation system
2. The reference architecture for all future AI Workspaces

This workspace defines how the platform transforms large datasets into guided decision systems that train AI agents over time.

Future workspaces that will reuse this architecture include:

- CRM management
- Advertising optimization
- Crypto portfolio management
- Tax categorization
- Email marketing analysis

---

An inbox is **not a collection of messages**.

An inbox is a **collection of senders producing messages**.

Therefore the Gmail Workspace operates on the hierarchy:

Mailbox
→ Sender Universe
→ Sender Categories
→ Sender Decisions
→ Message Verification
→ Automation Rules
→ AI Monitoring

Messages are **evidence**, not the primary unit of decision.

Senders are the primary decision object.


---

# Full Mailbox Analysis Requirement

The system MUST analyze the **entire mailbox**, not just a one‑year window.

Reasons:

1. The system is based on a **sender model**, not a time model.
2. The number of senders will not dramatically increase by scanning older email.
3. Users expect the system to understand their *whole mailbox*, not just a slice.
4. Old messages can still inform sender patterns and automation rules.

Implementation guidance:

The system should:

• Index the entire mailbox history when possible
• Deduplicate by message ID
• Build sender profiles from all indexed history

Optional filters may still exist, such as:

- "No messages received from this sender in 12+ months"

But these should be **filters**, not analysis limitations.

## Historical Backfill Strategy (Updated)

The system uses a bounded historical backfill strategy:

- Default backfill target: last 24 months
- Optional extended backfill: last 36 months

Rules:

• Backfill runs newest → oldest
• Stops after a committed page crosses the cutoff date
• Uses Gmail `internalDate` as the source of truth
• Continues across slices using resume checkpoints

This ensures:

- high-quality recent data
- faster initial usability
- controlled processing time

Older data beyond the cutoff is not required for core decision accuracy.


---

# Primary Workflow

The Gmail Workspace must operate as a guided workflow.

The canonical flow is:

0. Introduction
1. Mailbox Intelligence
2. Choose Cleanup Group
3. Sender Overview (High-Level Table)
3.5 Sender Decision Mode (Focused UI)
4. Exceptions / Verification
5. Confirmation (optional/minimized)
6. Automation Rules
7. AI Monitoring
8. Continuous Maintenance (Smart Sync)


---

# Step 0 — Introduction

This page explains the goal of inbox cleanup.

Key message:

A clean inbox does NOT mean deleting everything.

The real goal is:

• keep important humans visible
• route noisy senders out of the inbox
• quarantine uncertain senders
• archive obvious junk
• preserve everything in All Mail

Users must understand that the system is helping them **train their inbox automation rules**, not manually sort every email.


---

# Step 1 — Mailbox Intelligence

This is the main analytics dashboard.

It shows a **10,000‑foot view** of the mailbox.

Data displayed:

• total mailbox size
• sender universe size
• message distribution by sender
• category breakdown
• human vs automation ratio
• email activity timeline

Charts must be interactive.

Clicking any chart should drill down into filtered sender sets.

Examples:

Clicking:

"Senders with 1 message"

should filter the sender table to those senders.


---

# Step 2 — Choose Cleanup Group

Cleanup Groups are **pre‑engineered clusters of senders**.

Examples:

• Unread clutter backlog
• Newsletters
• Automated senders
• Shopping / promotions

The user selects which cleanup group to review next.

This prevents users from being overwhelmed by the entire mailbox.


---

# Step 3 — Sender Decisions

NOTE: This step has two modes — a high-level table view and a focused "Decision Mode" (defined in Step 3.5).

This is the core workspace.

Users review **senders**, not messages.

Each sender row must display:

• sender address
• total messages from this sender
• unread count
• historical message volume
• last activity date
• example message snippets

Available decisions:

• Always Keep
• Archive
• Unsubscribe
• Quarantine
• Custom Rule

Expanding a sender shows message examples.

These examples are used for **context only**, not full message review.


# Step 3.5 — Sender Decision Mode (Focused UI)

This is the **primary decision engine of the product**.

Instead of showing a table of senders, the system switches into a **single-sender focus mode** (similar to a swipe-style interface).

Purpose:
- eliminate overwhelm
- increase speed of decisions
- create momentum and engagement

UI behavior:

• One sender is shown at a time
• Background is dimmed to remove distractions
• A “profile-style” card is displayed

Each sender profile includes:

• sender name + email
• optional avatar/logo (when available)
• AI-generated summary (who this sender is)
• classification signals:
  - human vs machine
  - category (promotion, transactional, alert, etc.)
• message volume and frequency
• expandable sections showing example emails by category

Primary decision buttons (only 4):

1. Keep All
2. Keep Some
3. Archive All
4. Not Sure

Behavior:

• After selecting a decision → next sender appears immediately
• No confirmation step between senders
• Progress indicator shows completion percentage

AI Assist (recommended):

The system may optionally display:

“Suggested: Archive All (92% confidence)”

This does NOT replace user control. It only accelerates decisions.

Outcome mapping:

• Keep All → no action (remains in inbox)
• Keep Some → goes to Custom Rules queue (Step 5 / Management)
• Archive All → goes to Archive queue
• Not Sure → goes to Quarantine queue

This mode should feel:
- fast
- lightweight
- almost addictive


---

# Step 4 — Exceptions / Verification

Some senders require deeper inspection.

Examples:

• mixed content senders
• senders with both receipts and promotions

Users can drill into categories such as:

• transactional
• promotions
• alerts

This step ensures users don't accidentally archive something important.


---

# Step 5 — Confirmation

NOTE:
The Confirmation step may be skipped or minimized in future versions for speed, since most decisions are already made at the sender level. This step exists primarily for safety and review.

Before executing changes, the system shows a final confirmation page.

This page summarizes:

• senders to archive
• senders to keep
• senders to unsubscribe
• senders quarantined

It must also display message impact such as:

"Archiving 14,532 messages from 78 senders"

Users can expand senders to review message lists before confirming.


---

# Step 6 — Automation Rules

After confirmation the system generates rules.

Examples:

IF sender = Zillow
THEN archive immediately

IF sender = Mike Dillard
THEN always keep in inbox

IF sender category = promotion
THEN archive after 7 days

These rules power ongoing inbox automation.

## Rule Execution Feedback

After rules are applied, the system must show:

• “X senders processed successfully”
• “Y messages archived”
• “Z rules created”

Include undo capability for a limited time window.


---

# Step 7 — AI Monitoring

The AI agent continuously monitors new email.

It learns from past user decisions.

Examples of future suggestions:

"You usually archive newsletters from this sender. Archive automatically?"

"This sender looks similar to others you unsubscribe from."

The goal is to reach a state where:

The system automatically manages the inbox with minimal user input.


# Step 8 — Continuous Maintenance (Smart Sync)

After initial cleanup, the system enters maintenance mode.

Behavior:

• New senders are automatically detected
• Existing rules are applied automatically
• Users are only notified when decisions are needed

User experience:

Dashboard shows:

• “You have 3 new senders to review”

Clicking this re-enters Sender Decision Mode for only new senders.

No need to reprocess the entire inbox.

## Maintenance Model Clarification

Smart Sync operates only on incremental changes:

• New senders
• New messages
• Label/category changes

It does NOT perform historical traversal.

Historical traversal is handled exclusively by:

• Continue Backfill (operator-driven)

This separation ensures:

- predictable performance
- no accidental full reindexing
- stable automation behavior


---

# AI Learning Model

Every decision the user makes becomes training data.

The system stores:

• sender decisions
• category decisions
• rule approvals
• exceptions

The agent uses this memory to generate future recommendations.


---

# Product Principle

The Gmail Workspace is the **reference workspace architecture**.

Other workspaces (CRM, Ads, Crypto, Taxes, etc.) should reuse the same structure:

Intelligence → Decision → Verification → Automation → Monitoring


---


# Engagement & Momentum Layer

The system should include lightweight behavioral reinforcement to keep users engaged.

Examples:

• “You’re on a roll 🔥 — 12 senders processed”
• “Inbox clarity improving +18%”
• “You’ve cleaned 5,000 messages so far”

Design rules:

• subtle, not gamified excessively
• no interruptions to workflow
• reinforces progress and momentum

Goal:

Encourage completion of sender decisions and reduce drop-off.


# Product Insight

The Gmail Workspace is not an email tool.

It is a **decision engine that trains an automation system**.

All UI, flows, and features must support:

• fast decisions
• low cognitive load
• high confidence outcomes
• continuous automation learning

This principle overrides traditional inbox UI design patterns.


# End of Specification