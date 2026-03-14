# AI Workspace Architecture

## Purpose

This document defines the **core architecture for every AI workspace** in the platform.

The Gmail workspace is the **reference implementation**, but the architecture is designed to support many domains including:

- Email
- CRM
- Ads management
- Crypto investing
- Finance & taxes
- Marketing automation
- Operations monitoring

Every workspace follows the same structural pattern so the system can scale while remaining **simple, consistent, and trainable by the AI agent.**

---

# Core Design Principle

Each workspace follows the same lifecycle:

1. **Observe**
2. **Understand**
3. **Decide**
4. **Act**
5. **Learn**
6. **Automate**

This mirrors how a **human operator runs a department**, and it allows the AI agent to gradually take over more of the workflow.

---

# Universal Workspace Structure

Every workspace is organized into the following layers:

```
Universe
Entities
Observations
Decisions
Policies
Actions
Reporting
Automation
```

Each layer represents a level of abstraction used by both the UI and the AI agent.

---

# 1. Universe Layer

The **Universe** represents the full dataset for the workspace.

Examples:

| Workspace | Universe |
|-----------|----------|
| Gmail | Entire mailbox |
| Ads | All campaigns |
| CRM | All contacts |
| Crypto | Entire portfolio |
| Finance | All transactions |

The universe is **read-only analysis territory**.  
No actions occur here.

Purpose:

- Provide **full situational awareness**
- Allow **high-level analytics**
- Enable **drill-down exploration**

Example from Gmail:

```
Mailbox Intelligence
```

This page shows:

- sender volume
- message distribution
- category breakdown
- automation vs human senders
- timeline activity

This layer answers:

> "What does the system look like at a high level?"

---

# 2. Entity Layer

Entities are the **actors or units inside the universe**.

Examples:

| Workspace | Entity |
|----------|--------|
| Gmail | Sender |
| CRM | Contact |
| Ads | Campaign |
| Crypto | Asset |
| Finance | Merchant |

Entities are what users actually make **decisions about**.

Example Gmail entity:

```
Sender
```

The inbox becomes easier to understand when it shifts from:

```
200,000 emails
```

to

```
1,500 senders
```

This dramatically reduces cognitive load.

---

# 3. Observation Layer

Observations represent **facts gathered about entities**.

Examples for Gmail senders:

- number of emails
- unread counts
- last activity
- categories
- machine vs human likelihood
- historical volume

Observations are **not decisions**.

They are **evidence** used to make decisions.

---

# 4. Decision Layer

Decisions represent **user intent**.

Examples:

| Decision | Meaning |
|--------|---------|
| Always keep | Important sender |
| Archive automatically | Low value sender |
| Route to folder | Contextual sender |
| Review later | Uncertain sender |

These decisions are stored and fed into the AI agent.

Decisions eventually become **rules and automations**.

---

# 5. Policy Layer

Policies translate **decisions into reusable logic**.

Examples:

```
Archive all newsletters from Sender X older than 7 days
```

```
Always keep emails from Person Y
```

```
Route receipts to Finance folder
```

Policies allow the system to act automatically.

---

# 6. Action Layer

Actions execute policies.

Examples:

- archive emails
- unsubscribe from lists
- apply labels
- route to folders
- trigger workflows

Actions are where the **system actually modifies data**.

---

# 7. Reporting Layer

Reporting summarizes system behavior.

Examples:

- emails archived
- senders filtered
- automation success
- changes since last run

Reports provide **confidence and transparency**.

---

# 8. Automation Layer

Automation is where the AI agent becomes proactive.

The system learns from past decisions.

Examples:

```
User archives 90% of Zillow emails
```

Future recommendation:

```
Automatically archive Zillow emails older than 3 days?
```

Eventually:

```
Zillow emails auto-archived automatically.
```

Automation transforms the system from a **tool** into an **assistant.**

---

# Guided Workspace Workflow

Every workspace follows a guided workflow.

```
Step 0 – Introduction
Step 1 – Universe Intelligence
Step 2 – Entity Selection
Step 3 – Entity Decisions
Step 4 – Verification
Step 5 – Automation Rules
Step 6 – Continuous Monitoring
```

Example (Gmail):

```
Mailbox Intelligence
↓
Cleanup Groups
↓
Sender Decisions
↓
Message Verification
↓
Automation Rules
↓
Ongoing Inbox Management
```

---

# AI Agent Learning Loop

The agent continuously improves using a feedback cycle.

```
User Action
↓
Decision Recorded
↓
Pattern Detection
↓
Recommendation
↓
Automation
```

Over time the agent begins making correct decisions automatically.

Eventually the user mostly **confirms suggestions** instead of making manual choices.

---

# Why This Architecture Matters

This architecture ensures every workspace:

- feels familiar
- follows the same logic
- trains the AI agent
- scales to any domain

Instead of building many tools, we are building:

```
A universal AI operations system.
```

Gmail is simply the **first fully realized example**.

Future workspaces will reuse the same framework.

---

# Summary

The AI workspace architecture is built around a simple principle:

```
Understand the universe
↓
Identify the entities
↓
Observe their behavior
↓
Make decisions
↓
Turn decisions into policies
↓
Automate the system
```

This structure allows the platform to grow while keeping the experience **guided, understandable, and AI-driven.**
