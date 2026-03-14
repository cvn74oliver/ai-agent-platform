# Gmail Workspace Engineering Specification

This document translates the **GMAIL_WORKSPACE_FINAL_PRODUCT_SPEC.md** into concrete engineering instructions for the AI Agent Platform.

The goal is to ensure Codex and future engineers can implement the Gmail Workspace **without ambiguity**.

---

# 1. Core Architecture Principle

The Gmail Workspace is built on a **sender‑first architecture**.

Messages are treated as **evidence**, not the primary object of decision making.

Hierarchy:

```
Mailbox
  → Sender Universe
      → Sender Categories
          → Sender Decisions
              → Message Verification
                  → Automation Rules
                      → AI Monitoring
```

Every screen, API, and data model must follow this hierarchy.

---

# 2. Full Mailbox Analysis

The system must analyze the **entire mailbox**, not a limited time window.

Reasoning:

- Sender‑based analysis requires the full history.
- Older senders still influence automation decisions.
- Unique sender count is relatively stable even with older messages.

Filtering can still apply for:

- inactivity (>12 months)
- archived-only senders

But analysis begins with **full mailbox ingestion**.

---

# 3. Workspace Page Structure

The Gmail Workspace consists of the following pages.

## 0. Introduction Page

Purpose:

Explain the inbox cleanup model to the user.

Key concept:

Inbox cleanup is **not deleting messages**.

Goal:

- keep important senders visible
- route noisy senders out of the inbox
- archive junk automatically

Route:

```
/operations/intro
```

---

## 1. Mailbox Intelligence

Purpose:

Provide a **10,000‑foot view** of the entire mailbox.

Route:

```
/operations/intelligence
```

Data Sources:

- indexed mailbox rows
- sender statistics
- category labels

Charts:

1. Sender Volume Distribution
2. Email Activity Timeline
3. Category Breakdown
4. Human vs Automation Ratio

Interactive behavior:

Clicking charts filters the **Sender Ranking Table**.

Table Columns:

- sender
- message_count
- unread_count
- category
- first_seen
- last_seen

Pagination:

Default: 25

---

## 2. Choose Cleanup Group

Purpose:

Present predefined cleanup clusters.

Route:

```
/operations/clusters
```

Examples:

- Unread Clutter
- Newsletters
- Promotions
- Automated No‑Reply
- Shopping

Cluster selection moves the user into **Batch Review**.

---

## 3. Sender Decisions

Purpose:

Allow users to classify senders.

Route:

```
/operations/review
```

Sender Workbench:

Display **all senders in the selected cleanup group**.

Columns:

- sender
- batch_message_count
- total_sender_messages
- unread_in_batch
- last_activity
- category

Preview:

Each sender shows **5–8 message snippets**.

User Decisions:

- Always Keep
- Archive
- Unsubscribe
- Quarantine
- Custom Rules

Pagination:

Default: 10 senders per page.

---

## 4. Exceptions / Verification

Purpose:

Handle edge cases before automation is applied.

Examples:

- mixed‑content senders
- transactional senders
- partial archive decisions

The UI highlights senders requiring manual confirmation.

---

## 5. Confirmation

Purpose:

Show the user exactly what will happen.

Display grouped decisions:

```
Archive Senders
Keep Senders
Unsubscribe Senders
Quarantined Senders
```

Each group shows:

- sender count
- message count

Users can drill down to verify messages.

---

## 6. Automation Rules

Purpose:

Generate Gmail automation rules from decisions.

Example rules:

- auto archive newsletters
- keep important contacts in inbox
- quarantine promotional senders

Rules are presented before activation.

---

## 7. AI Monitoring

Purpose:

Allow the agent to monitor incoming mail and apply learned behavior.

Agent Responsibilities:

- detect new senders
- suggest rules
- auto‑archive known patterns

Agent decisions must always require **user confirmation** before permanent rule creation.

---

# 4. API Endpoints

## Sender Universe

```
GET /api/gmail/senders
```

Returns sender summary statistics.

---

## Cluster Detection

```
GET /api/gmail/clusters
```

Returns cleanup candidate groups.

---

## Sender Preview

```
POST /api/gmail/sender_preview
```

Returns snippets for a sender.

Request:

```
{
  sender: string,
  limit: number
}
```

---

## Message Preview

```
POST /api/gmail/message_preview
```

Returns full message preview.

---

# 5. Agent Learning Hooks

Every user decision must be logged for the LLM training system.

Event types:

```
sender_archived
sender_kept
sender_unsubscribed
sender_quarantined
rule_created
rule_rejected
```

Stored in:

```
workspace_agent_memory
```

Fields:

- user_id
- workspace
- action
- sender
- timestamp

---

# 6. Performance Requirements

Mailbox Intelligence cold load must be optimized to avoid reprocessing indexed rows.

Strategies:

- cached intelligence snapshots
- indexed row reuse
- background prewarming

Target:

```
cold load < 5 seconds
warm load < 500ms
```

---

# 7. Engineering Constraints

Codex must follow these rules:

1. Never introduce message‑first workflows.
2. Sender is always the primary decision entity.
3. Messages only appear as preview evidence.
4. All flows must support agent learning events.
5. UI must maintain the hierarchy defined in section 1.

---

# 8. Future Expansion

The Gmail Workspace architecture becomes the template for:

- CRM workspace
- Crypto workspace
- Ads workspace
- Customer service workspace
- Financial workspace

The **sender model becomes the "entity model"** used across all workspaces.

Example:

```
Gmail → Sender
CRM → Contact
Ads → Campaign
Crypto → Asset
```

This ensures the AI workspace architecture remains consistent.

