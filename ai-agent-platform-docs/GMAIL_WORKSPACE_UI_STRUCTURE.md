

# Gmail Workspace UI Structure

## Purpose

This document defines the **exact UI structure and screen layout** for the Gmail Workspace inside the AI Agent Platform.

The goal is to create a **simple, guided, and repeatable workflow** that allows a user to clean up a large mailbox without feeling overwhelmed.

The UI follows a **step‑by‑step workflow model** rather than a single long page.

This structure will also serve as the **template for future AI Workspaces** in the platform.

---

# Core UI Philosophy

The Gmail workspace is designed around **senders first**, not individual messages.

Why:

An inbox is fundamentally a collection of **senders communicating with the user**.  
Most cleanup decisions happen at the **sender level**, not the individual email level.

Example:

Bad model:

200,000 emails → review messages individually

Correct model:

200,000 emails → 1,500 senders → make sender decisions → verify messages

---

# Global Workspace Layout

Every Gmail workspace screen shares the same frame:

Top Navigation (Workflow Progress)
Left Rail (Workspace Navigation)
Main Workspace Area
AI Assistant Panel (optional)

```
Top Workflow Path
---------------------------------------------------------
Mailbox Intelligence → Cleanup Groups → Batch Review

Left Rail
---------------------------------------------------------
Operations Overview
Mailbox Intelligence
Cleanup Groups
Batch Review
Approvals
```

The **top workflow path** shows the user where they are in the cleanup journey.

The **left rail** provides navigation.

---

# Step 1 — Mailbox Intelligence Page

Route:

```
/operations/intelligence
```

Purpose:

Provide a **10,000‑foot overview of the mailbox** before the user begins cleanup.

This is the **main analytics dashboard**.

---

## Page Layout

```
--------------------------------------------------
Mailbox Intelligence
--------------------------------------------------

Goal Explanation Card

Charts Section

Sender Ranking Table

Cleanup Groups Shortcut
```

---

## Goal Explanation Card

Explain the philosophy of inbox cleanup.

Example:

```
Inbox Cleanup Goal

A clean inbox does NOT mean deleting everything.

The goal is to:

• Keep important people visible
• Auto‑route useful noise out of the inbox
• Archive obvious newsletters
• Preserve everything in All Mail
```

---

## Charts Section

Charts should appear at the **top of the page**.

Charts include:

1. Top Senders by Volume
2. Email Activity Timeline
3. Sender Volume Distribution
4. Category Breakdown
5. Human vs Automation Ratio

Charts should support:

• hover details  
• drill‑down filtering  
• clickable exploration

Example:

Click "Promotions" → sender table filters to promotion senders.

---

## Sender Ranking Table

Displays the **entire sender universe**.

Columns:

Sender  
Total Messages  
Unread  
First Seen  
Last Seen  
Automation Probability  
Category  

Pagination required.

This table supports **drill‑down into cleanup groups or senders**.

---

# Step 2 — Cleanup Groups Page

Route:

```
/operations/clusters
```

Purpose:

Show the **AI‑generated cleanup groups**.

Examples:

Unread clutter backlog  
Newsletters  
Shopping  
No‑reply automation  
Promotions  
Social

Each group represents a **collection of senders that behave similarly**.

---

## Page Layout

```
--------------------------------------------------
Cleanup Groups
--------------------------------------------------

Explanation Card

Cleanup Group Cards
```

---

## Cleanup Group Card

Each card shows:

Group Name  
Total Messages  
Sender Count  
Description

Example:

```
Unread Clutter Backlog

43,000 messages
1,500 senders

Large set of unread promotional or automated mail.
```

CTA:

```
Open Review
```

---

# Step 3 — Batch Review Workspace

Route:

```
/operations/review
```

This workspace is broken into **four guided steps**.

```
Step 1 — Batch Overview
Step 2 — Sender Decisions
Step 3 — Message Verification
Step 4 — Approval / Rule Creation
```

---

# Step 1 — Batch Overview

Purpose:

Help the user understand **what this batch represents**.

Layout:

```
Batch Overview

Charts
Summary Cards
Next Step Prompt
```

Charts:

Top senders in this batch  
Recency distribution  
Category mix  
Human vs automation ratio

Summary cards:

Batch Size  
Sender Count  
Unread Ratio  
Automation Ratio

---

# Step 2 — Sender Decisions

This is the **primary decision workspace**.

Users make decisions at the **sender level**.

Layout:

```
Sender Workbench

Sender Table
Sender Preview Panel
Sender Action Controls
```

Sender table columns:

Sender  
Batch Messages  
Total Inbox Messages  
Unread  
Category  
Automation Probability

Actions:

Keep Sender  
Archive Sender  
Quarantine Sender  
Unsubscribe  
Custom Rules

---

## Sender Preview Panel

Displays example emails from that sender.

Show:

5 email examples by default  
expand to 10  

Include:

Subject  
Snippet  
Date

Preview button:

```
Open Full Email
```

---

# Step 3 — Message Verification

Purpose:

Allow the user to **confirm the messages affected by sender decisions**.

Messages grouped by sender.

Example:

```
Sender: Zillow
Messages to archive: 1,204

Preview messages
Load more
```

Pagination required.

---

# Step 4 — Approval and Rule Creation

Purpose:

Convert decisions into **automation rules**.

Layout:

```
Actions Summary

Senders Archived
Senders Quarantined
Senders Unsubscribed

Automation Rules
```

Example rules:

Archive Zillow promotional emails  
Quarantine retail newsletters  
Always keep emails from Mike Dillard

Final action:

```
Apply Cleanup
```

---

# AI Automation Integration

Every user decision becomes **training data for the agent**.

Stored signals:

Sender preferences  
Category preferences  
Automation tolerance  
Quarantine patterns

Future inbox sessions can automatically recommend:

Archive suggestions  
Sender grouping  
Automation rules

The goal is to evolve toward **fully automated inbox management**.

---

# Future Enhancements

Planned improvements:

• Sender‑level clustering  
• Predictive cleanup recommendations  
• LLM explanation layer  
• Automated rule proposals  
• inbox health score

---

# Summary

The Gmail Workspace UI follows this hierarchy:

```
Mailbox
↓
Senders
↓
Sender Decisions
↓
Message Verification
↓
Automation
```

This structure removes inbox overwhelm and turns email cleanup into a **guided AI workflow**.