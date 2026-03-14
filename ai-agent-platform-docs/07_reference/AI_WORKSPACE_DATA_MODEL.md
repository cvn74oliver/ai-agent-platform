

# AI Workspace Data Model

## Purpose

This document defines the **core data structures** that power the AI Workspace platform.  
It describes how information is stored so that:

- Agents can learn from user decisions
- Workspaces remain isolated but interoperable
- Automations can run continuously
- The system can evolve into a fully autonomous AI workforce

The data model is intentionally **generic and reusable** so it works for any workspace:

- Gmail cleanup
- Crypto investing
- Advertising optimization
- Customer support
- Financial analysis
- CRM workflows
- etc.

Every workspace is simply **a different interpretation of the same underlying model**.

---

# Core Data Layers

The platform stores intelligence across **four layers**.

```
GLOBAL PLATFORM
    ↓
USER GLOBAL MEMORY
    ↓
WORKSPACE MEMORY
    ↓
EVENT HISTORY
```

Each layer serves a different purpose.

---

# 1. Global Platform Intelligence

This layer contains **non‑private training knowledge** that improves the system for all users.

Examples:

- Email classification heuristics
- Sender automation detection
- Workflow optimization patterns
- Automation recommendations
- system prompts
- training examples

### Storage

```
global_intelligence
```

Example fields:

```
id
category
pattern
confidence
training_examples
created_at
updated_at
```

This data **never contains private user information**.

---

# 2. User Global Memory

Each user has a **cross‑workspace intelligence layer**.

This allows different agents to learn shared preferences.

Example:

If a user always archives promotional email:

```
gmail_agent learns → promotional emails → archive
```

Other agents may benefit:

```
marketing_agent → learns user dislikes promotions
```

### Storage

```
user_global_memory
```

Example fields

```
user_id
preference_key
preference_value
confidence
source_workspace
created_at
updated_at
```

Example entries

```
email_preference: archive_promotions
risk_tolerance: moderate
notification_style: summary_only
```

---

# 3. Workspace Memory

Each workspace has its own intelligence.

Example:

```
Workspace: Gmail Cleanup
```

The agent stores:

- sender decisions
- rule preferences
- category decisions
- automation outcomes

### Storage

```
workspace_memory
```

Example schema

```
workspace_id
entity_type
entity_key
decision
confidence
source_event
created_at
updated_at
```

Example records

```
entity_type: sender
entity_key: mike@mikedillard.com
decision: always_keep
confidence: 0.97
```

or

```
entity_type: sender
entity_key: noreply@shopping-site.com
decision: auto_archive
confidence: 0.92
```

This is what allows the system to **learn over time**.

---

# 4. Event History

Event history records **everything that happens**.

Agents use this to:

- retrain
- improve automation
- audit decisions
- replay workflows

### Storage

```
workspace_events
```

Example schema

```
event_id
workspace_id
event_type
event_payload
created_at
```

Example events

```
sender_archived
sender_kept
rule_created
automation_executed
email_processed
cluster_generated
```

Agents learn from this data.

---

# Gmail Workspace Example

To understand how this works in practice:

### Step 1 — Intelligence Scan

Mailbox Intelligence analyzes:

```
200,000 messages
1,500 senders
```

This produces:

```
cleanup_groups
```

Example:

```
newsletter_group
shopping_group
automation_group
personal_group
```

---

### Step 2 — Sender Decisions

User decisions create workspace memory.

Example:

```
sender: mike@mikedillard.com
decision: keep
```

or

```
sender: noreply@shopping-site.com
decision: auto_archive
```

These become memory entries.

---

### Step 3 — Automation Rules

The system proposes rules.

Example

```
IF sender = shopping-site.com
THEN archive automatically
```

When approved:

```
workspace_rules
```

---

### Step 4 — Continuous Learning

Future emails trigger events.

Example

```
email_received
→ rule_evaluated
→ rule_applied
```

The agent records the outcome.

Over time the system becomes autonomous.

---

# Workspace Rules

Rules control automation.

### Storage

```
workspace_rules
```

Example schema

```
rule_id
workspace_id
rule_type
rule_condition
rule_action
confidence
created_at
```

Example rule

```
rule_type: email_sender_rule
condition: sender_domain = "shopping-site.com"
action: archive
```

---

# Entities

Every workspace operates on **entities**.

Example entities

```
sender
email
transaction
crypto_asset
customer
campaign
```

Example schema

```
workspace_entities
```

```
entity_id
workspace_id
entity_type
entity_key
metadata
created_at
updated_at
```

Example

```
entity_type: sender
entity_key: mike@mikedillard.com
```

---

# Analytics Snapshots

Analytics queries are expensive.

To improve performance we store snapshots.

Example table

```
workspace_analytics_snapshots
```

Fields

```
snapshot_id
workspace_id
snapshot_type
payload
generated_at
```

Examples

```
mailbox_intelligence_snapshot
cleanup_group_snapshot
sender_ranking_snapshot
```

---

# RAG Knowledge

Agents store documents used by the RAG pipeline.

Example table

```
workspace_documents
```

Fields

```
document_id
workspace_id
content
embedding
source
created_at
```

Used by:

```
LLM retrieval
assistant explanations
decision reasoning
```

---

# Automation Jobs

Automations run continuously.

Example table

```
workspace_jobs
```

Fields

```
job_id
workspace_id
job_type
schedule
status
last_run
next_run
```

Examples

```
gmail_cleanup_scan
crypto_portfolio_check
ad_spend_monitor
```

---

# Agent Decisions

Agents store recommendations before execution.

Example table

```
workspace_recommendations
```

Fields

```
recommendation_id
workspace_id
recommendation_type
payload
confidence
status
created_at
```

Example

```
recommendation_type: archive_sender
sender: newsletter@brand.com
confidence: 0.91
```

User approves → becomes rule.

---

# Data Model Summary

The AI Workspace system is powered by five major structures:

```
global_intelligence
user_global_memory
workspace_memory
workspace_events
workspace_rules
workspace_entities
workspace_analytics_snapshots
workspace_documents
workspace_jobs
workspace_recommendations
```

Together these form the **AI brain** of the system.

---

# Why This Model Matters

This architecture enables:

- Continuous agent learning
- Cross‑workspace intelligence
- Autonomous automations
- explainable AI decisions
- scalable workspace creation

This is what allows the platform to evolve into a **true AI workforce operating system**.