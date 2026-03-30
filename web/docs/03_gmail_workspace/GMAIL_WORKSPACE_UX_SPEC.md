# Gmail Workspace UX Specification

## Purpose

This document defines the **user experience (UX) structure** for the Gmail Workspace inside the AI Agent Platform. The goal is to create a system that is:

- Sender‑first
- Visually understandable
- Guided and educational
- Fast to navigate
- Consistent across all pages

Users should feel like the system is **helping them understand their inbox**, not forcing them to analyze raw numbers.

The UX must always support three things:

1. Understanding the mailbox
2. Making decisions about senders
3. Training the AI agent for future automation

---

# Core UX Philosophy

The Gmail workspace is divided into **two analytical layers**:

## 1. Mailbox Intelligence (Macro Layer)

The **main dashboard** that explains the mailbox at a high level.

This page answers:

- Is my inbox healthy?
- What types of senders dominate my inbox?
- What clusters should I review first?
- What approvals or automation decisions are pending?

Think of this page as the **"1000‑foot view" of the inbox**.

It should be simple, visual, and informative.

Users should understand their mailbox in **under 10 seconds**.

---

## 2. Sender Decision Workspace (Micro Layer)

This is where the **actual work happens**.

Here the user reviews senders, understands their behavior, and makes decisions.

This workspace requires **much deeper analytics** to help users confidently decide what to do.

Users must be able to:

- Explore sender behavior
- Filter senders
- Sort by message volume
- Review message evidence
- Apply policies

This is the **AI training layer**.

Every decision here becomes **memory for the system**.

---

# UX Architecture

The Gmail Workspace UX follows this hierarchy:

Mailbox Intelligence
↓
Cleanup Groups
↓
Sender Decision Workspace
↓
Confirmation
↓
Automation Rules
↓
Monitoring

Each stage progressively narrows the scope.

Mailbox
→ Sender clusters
→ Individual senders
→ Sender rules

---

# Page Specifications

---

# 1. Mailbox Intelligence (Main Dashboard)

Purpose:

Provide **high‑level understanding of the mailbox**.

Users should learn:

- Inbox health
- Sender patterns
- Message volume
- Suggested cleanup clusters

This page should be **visual-first, not table-first**.

---

## Mission Panel (Dynamic Progress System)

The Mailbox Intelligence page must include a **Mission Panel** inspired by task‑driven systems such as Finaloop’s "Mission" tab.

This panel acts as the **AI agent briefing system** for the user. Every time the user lands on the dashboard, the system should immediately communicate:

- Where the user left off
- What tasks are still pending
- What progress has been made
- What the next best action is

The goal is to make the dashboard feel like a **guided mission system**, not a static analytics page.

### Mission Panel Capabilities

The Mission Panel must dynamically update based on mailbox activity and user decisions.

It should show:

- Current inbox cleanup progress
- Pending cleanup tasks
- Suggested next cluster to review
- Pending approvals
- Recommended automation improvements

Example:

Mission Status

Inbox Cleanup Progress: 42%

Next Recommended Action:
Review "Retail Promotions" sender cluster

Pending Items:
• 5 sender policies awaiting confirmation
• 2 automation rules awaiting approval
• 1 unfinished cleanup session

The system should always allow the user to **resume exactly where they left off**.

---

### Inbox Progress Meter

The dashboard should visually display inbox cleanup progress.

Example metrics:

- Total senders analyzed
- Sender policies created
- Messages archived
- Automation coverage

Example visual:

Inbox Health Progress Bar

0% → Unmanaged Inbox
50% → Partially Optimized
100% → Fully Automated Inbox

This gives the user a **clear sense of progression**, similar to leveling systems in games.

---

### Resume Where You Left Off

If a user exits the system mid‑workflow, the Mission Panel must show:

"Resume Previous Task"

Example:

Resume Sender Review
Cluster: Travel Companies
Last Reviewed Sender: Delta Airlines

This should take the user directly back to the **exact sender page and stage** they were previously working on.

---

### Inbox Goal System

Instead of traditional training content, the dashboard should communicate **goals**.

Users should see:

Current Inbox State
→ Target Inbox State

Example:

Current Status
Inbox: 48,200 messages
Active Senders: 1,430
Automation Coverage: 12%

Target Goal
Inbox Messages Reduced
High‑volume senders automated
Automation coverage above 70%

This reframes training as **progress toward an optimized inbox**, rather than reading instructions.

---

### AI Agent Briefing

The dashboard should feel like an **AI assistant briefing the user**.

Example message:

"Your inbox has 1,430 active senders. The top 25 senders generate 62% of your email volume. Reviewing the 'Retail Promotions' cluster could reduce inbox noise by 18%."

The system should guide users toward **high‑impact actions first**.

---

### UX Design Principle for the Mission Panel

The Mission Panel should behave like a **dynamic command center**.

Each visit to the dashboard should answer three questions immediately:

1. Where am I in the cleanup process?
2. What should I do next?
3. How much progress have I made?

This creates a UX experience that feels **goal‑oriented, interactive, and continuously improving**, rather than static reporting.

---

## Mailbox Health Panel

Displays:

- Total mailbox size
- Inbox size
- Archived messages
- Protected senders

Example status:

Healthy Inbox
Moderate Clutter
Severe Sender Overload

---

## Inbox Composition Chart

Pie or stacked bar chart showing:

- Human senders
- Marketing senders
- Transactional senders
- Automated systems

Goal:

Users instantly see **what dominates their inbox**.

---

## Sender Volume Distribution

Bar chart showing:

Top senders by message volume.

Example:

Amazon – 1,200 messages
SeaWorld – 900 messages
LinkedIn – 750 messages

Users should immediately see:

"Which senders are responsible for most of my inbox"

---

## Activity Timeline

Line chart displaying:

Message volume over time.

Filters:

Day
Week
Month
Year

Goal:

Identify spikes and patterns.

---

## Recommended Cleanup Groups

AI‑generated clusters of senders based on two complementary clustering models:

### Smart AI Sender Clusters

These clusters group senders by **behavioral or category similarity**.

Examples:

Retail Promotions
Travel Companies
Social Platforms
Subscriptions
Financial Services

These help users understand **what types of senders dominate their inbox**.

---

### Analytical Sender Clusters

These clusters group senders by **behavioral impact or engagement level**.

Examples:

Top Volume Senders
Unread Senders
Interactive Senders
Dormant Senders

These help users understand **which senders require action first**.

---

Both cluster systems must coexist because they answer **different analytical questions**:

Smart Clusters → What types of senders exist?
Analytical Clusters → Which senders matter most right now?

The UX should allow users to **toggle between these cluster views** when selecting a cleanup group.

Clicking a group takes the user to **Cleanup Groups**.

---

## Pending Approvals

Shows actions waiting for approval.

Examples:

Archive 3,400 messages
Unsubscribe from 12 senders
Create 5 new rules

---

# 2. Cleanup Groups

Purpose:

Allow the user to select the **next cleanup group of senders** to review.

Groups are always **sender clusters**.

Never message clusters.

The page should first answer:

- what this page helps decide
- what progress already exists
- what the next recommended move is

Each group card then shows:

- workload
- impact
- why this group exists
- optional startability guidance
- collapsed supporting detail

Clicking a group enters the **Sender Decision Workspace**.

Cleanup Groups should use:

- a strong workspace-family hero
- three visual sections
- recommendation logic that does not default to the largest group

The three sections are:

1. Start Here
2. Reduce Backlog
3. Exceptions & Coverage

---

# 3. Sender Decision Workspace

This is the **most important UX surface**.

This page must include **strong analytics and filtering tools**.

Users should feel like they are inside a **Sender Intelligence Dashboard**.

---

## Sender Analytics Panel

Charts that help decision making.

### Sender Volume Chart

Bar chart showing:

Messages per sender.

Example:

Amazon – 1200
LinkedIn – 700
SeaWorld – 900

Users instantly see **high impact senders**.

---

### Sender Activity Timeline

Shows when messages arrive.

Filters:

Day
Week
Month
Year

---

### Sender Type Breakdown

Chart showing:

Marketing
Transactional
Human
Automated

---

## Sender Table

Each row represents **one sender**.

Columns:

Sender
Domain
Message Count
Unread Count
Last Seen
Category

Users must be able to:

Sort
Filter
Search

---

## Sender Evidence Drawer

Clicking a sender opens message examples.

Displays:

Subjects
Snippets
Full message preview

Messages are **evidence only**, not the decision object.

---

## Sender Decision Controls

Available actions:

Keep
Archive
Unsubscribe
Quarantine
Custom Rule

Each decision trains the AI system.

---

# 4. Confirmation

Purpose:

Show exactly what will happen.

This is the **first place message counts become primary**.

Displays:

Senders affected
Messages affected
Protected senders excluded

Users approve or modify the final decision set.

---

# 5. Automation Rules

Purpose:

Convert decisions into **future behavior**.

Examples:

Always archive SeaWorld
Always keep messages from Bank
Always unsubscribe from Retail Promotions

Users can:

Approve
Modify
Reject

---

# 6. Monitoring

Purpose:

Show how the AI system is learning.

Displays:

Learned sender policies
Automation suggestions
Inbox health trends

Monitoring answers:

What did the AI learn?
What automation is recommended?
What improvements remain?

---

# Performance Requirements

The Gmail workspace must **never block the user**.

### Page Load Targets

Mailbox Intelligence
< 2 seconds

Cleanup Groups
< 1 second

Sender Workspace
< 2 seconds

Evidence Drawer
< 500 ms

---

### Caching Requirements

Data must be cached for:

Mailbox analytics
Sender analytics
Cluster calculations

Revisiting a page should **not re-run heavy analysis**.

---

# UX Design Principles

## Visual First

Humans understand charts faster than tables.

Charts should always precede tables.

---

## Sender First

The system always prioritizes **senders over messages**.

Messages exist only as evidence.

---

## Progressive Disclosure

Users should never be overwhelmed.

Start simple.

Allow deeper exploration when needed.

---

## Guided Learning

Users should learn:

What a clean inbox is
Why decisions matter
How automation improves their mailbox

The system should **teach while guiding**.

---

# Final UX Goal

The Gmail Workspace should feel like:

"A control center for understanding and training your inbox."

Users should move from:

Confusion
→ Understanding
→ Decision
→ Automation

Eventually the system should run **almost entirely automatically**.

The user becomes a **supervisor of AI decisions**, not a manual inbox cleaner.
