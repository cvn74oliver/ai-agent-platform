

# Gmail Workspace Analytics Specification

## Purpose
This document defines the analytics system used inside the Gmail Workspace. The analytics layer exists to help users **understand their mailbox at both a high level and a decision level**.

The analytics are divided into two levels:

1. **Mailbox Intelligence Analytics (High-Level Dashboard)**
2. **Sender Intelligence Analytics (Decision Dashboard)**

The goal is to keep analytics **visual, interactive, and decision‑oriented**, rather than overwhelming users with raw numbers.

---

# 1. Mailbox Intelligence Analytics (High-Level)

## Purpose
The Mailbox Intelligence dashboard provides the **"10,000‑foot overview"** of the user’s mailbox.

This page answers:

- How healthy is the mailbox?
- What types of senders exist?
- What work still needs to be done?
- What clusters should the user clean up next?

This page should feel like an **AI briefing from the system**.

---

## Core Metrics

### Mailbox Health Score
A single composite score showing the overall mailbox state.

Example:

Mailbox Health: **72% Clean**

Score inputs may include:

- Inbox size
- Unread volume
- Promotional sender dominance
- Sender diversity
- Pending cleanup actions

---

### Mailbox Size

Displays:

- Total indexed messages
- Total unique senders
- Inbox message count

Example:

```
Indexed Messages: 84,230
Unique Senders: 3,142
Inbox Messages: 41,902
```

---

### Sender Distribution Chart

**Pie Chart** showing categories of senders.

Example categories:

- Retail
- Travel
- Financial
- Social
- Subscriptions
- Human Contacts

This provides **immediate visual understanding of inbox composition**.

---

### Message Volume Timeline

**Line graph** showing message volume over time.

Selectable ranges:

- Last 7 days
- Last 30 days
- Last 90 days
- Last year

Purpose:

Identify spikes and trends in incoming mail.

---

### Top Senders Chart

**Horizontal bar chart** showing the top senders by message volume.

Example:

```
Amazon: 2,341
SeaWorld: 1,003
United Airlines: 821
Substack: 760
```

Each bar should be clickable to drill into that sender.

---

### Cleanup Opportunity Chart

Displays clusters detected by AI.

Examples:

- Retail Promotions
- Travel Companies
- Subscriptions
- Social Platforms

Each cluster shows:

- number of senders
- total messages
- estimated cleanup impact

---

# 2. Sender Intelligence Analytics (Decision Dashboard)

## Purpose
This dashboard appears when users are making cleanup decisions.

It answers:

- Which senders dominate my inbox?
- Which senders should I keep?
- Which senders should be archived or filtered?

This page should behave like a **data analysis workspace**.

---

## Sender Volume Chart

A **sortable bar chart** showing senders ranked by message count.

Each bar displays:

- Sender name
- Total messages
- Last activity

Clicking a sender reveals message previews.

---

## Sender Activity Timeline

Line graph showing message frequency from the selected sender.

Selectable filters:

- daily
- weekly
- monthly

Purpose:

Determine whether a sender is active or historical.

---

## Sender Type Breakdown

Pie chart showing message types from the selected sender.

Examples:

- Promotions
- Notifications
- Receipts
- Conversations

This helps users create **granular rules**.

---

## Decision Impact Preview

When users select actions (keep, archive, unsubscribe, etc.),
analytics update in real time.

Displays:

```
Senders selected: 14
Messages affected: 6,221
Inbox reduction: 11%
```

---

# 3. Cluster Analytics

Clusters are **sender‑based**, not message‑based.

Two cluster types exist:

## AI Smart Clusters

Clusters based on sender category.

Examples:

- Retail Promotions
- Travel Companies
- Social Platforms
- Subscription Services

Purpose:

Help users remove **entire categories of senders quickly**.

---

## Analytical Clusters

Clusters based on behavior patterns.

Examples:

- High‑volume senders
- Unread senders
- Low‑interaction senders

Purpose:

Expose patterns users may not recognize.

---

# 4. Monitoring Analytics

Monitoring tracks **what the system has learned**.

Metrics displayed:

- Sender policies created
- Automation rules generated
- Decisions made
- Recommendations pending

---

## Recommendations Chart

Displays automation suggestions derived from user behavior.

Example:

```
Suggested Rules:

Always archive promotional senders
Always keep personal contacts
Quarantine subscription newsletters
```

---

# 5. Performance Requirements

Analytics must feel **instant**.

Maximum load times:

Mailbox Intelligence: **< 2 seconds**
Sender Dashboard: **< 1 second after cache warm**
Charts: **render instantly from cached data**

---

## Caching Strategy

Analytics should use:

- sender statistics cache
- mailbox summary cache
- cluster analysis cache

Caches refresh only when:

- new indexing runs
- cleanup actions complete

---

# 6. Visualization Standards

Analytics should use **clear, consistent visual formats**.

Primary chart types:

- pie charts
- bar charts
- line graphs

Avoid:

- raw tables without context
- analytics that cannot be interacted with

---

# 7. Design Principles

Analytics must always be:

1. Visual
2. Interactive
3. Decision‑oriented
4. Fast

The goal is to make the Gmail Workspace feel like a

"**command center for inbox control**" rather than a spreadsheet of email data.