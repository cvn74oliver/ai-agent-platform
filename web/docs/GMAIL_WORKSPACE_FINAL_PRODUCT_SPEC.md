

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


---

# Primary Workflow

The Gmail Workspace must operate as a guided workflow.

The canonical flow is:

0. Introduction
1. Mailbox Intelligence
2. Choose Cleanup Group
3. Sender Decisions
4. Exceptions / Verification
5. Confirmation
6. Automation Rules
7. AI Monitoring


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


---

# Step 7 — AI Monitoring

The AI agent continuously monitors new email.

It learns from past user decisions.

Examples of future suggestions:

"You usually archive newsletters from this sender. Archive automatically?"

"This sender looks similar to others you unsubscribe from."

The goal is to reach a state where:

The system automatically manages the inbox with minimal user input.


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

# End of Specification