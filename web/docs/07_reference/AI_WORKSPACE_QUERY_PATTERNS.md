

# AI Workspace Query Patterns

## Purpose
This document defines the standard query patterns used across the AI Workspace platform. These patterns ensure that all agents, workflows, and RAG pipelines retrieve data consistently and efficiently across workspaces.

The goal is to make queries predictable, cacheable, and reusable so that agents can reason over the same data structures regardless of the specific workspace (Gmail, CRM, Ads, Crypto, etc.).

---

# Core Query Principles

1. **Workspace Scoped First**
All queries should begin with the workspace scope before expanding outward.

Example hierarchy:

```
User
 └ Workspace
    └ Workflow
       └ Entity
```

This prevents cross-workspace contamination of data.

---

2. **Entity-Based Queries (Not Raw Tables)**
Agents should query logical entities rather than database tables.

Examples:

Good:

```
query.workspace.senders()
query.workspace.messages()
query.workspace.rules()
```

Avoid:

```
SELECT * FROM gmail_messages
```

---

3. **Layered Context Expansion**
Queries should expand context progressively.

Example chain:

```
Mailbox
 → Senders
 → Sender Messages
 → Message Details
```

This mirrors the Gmail workspace workflow.

---

# Standard Query Types

## 1. Universe Queries
Used for high-level intelligence views.

Example:

```
query.workspace.universe()
```

Returns:

- total_messages
- total_senders
- activity_timeline
- sender_distribution
- category_breakdown

Used in:

Mailbox Intelligence dashboards.

---

## 2. Sender Queries

Retrieve sender level information.

```
query.workspace.senders({
  sort: "volume",
  limit: 100
})
```

Returns:

- sender
- sender_message_count
- unread_count
- machine_probability
- category_distribution

---

## 3. Sender Message Drilldown

Used when a user expands a sender.

```
query.workspace.sender_messages(sender_id)
```

Returns:

- message_id
- subject
- snippet
- received_at
- labels

---

## 4. Message Detail Query

```
query.workspace.message(message_id)
```

Returns:

- full_message
- metadata
- thread_context

Used in preview drawers.

---

## 5. Batch Queries

Batch queries represent bounded working sets.

Example:

```
query.workspace.batch(batch_id)
```

Returns:

- batch_message_count
- batch_sender_count
- batch_messages

Used in cleanup workflows.

---

# Agent Learning Queries

Agents also query historical decisions.

Example:

```
query.agent.memory(sender_id)
```

Returns:

- past_decisions
- rule_history
- user_preferences

This allows the agent to suggest actions automatically.

---

# RAG Retrieval Patterns

The RAG pipeline uses a two-step retrieval pattern.

Step 1 – semantic search

```
rag.search(query)
```

Step 2 – structured lookup

```
query.workspace.entity(entity_id)
```

This ensures the model reasons on real data instead of embeddings alone.

---

# Query Optimization Rules

Agents must follow these rules:

1. Prefer indexed datasets
2. Avoid full mailbox scans
3. Use pagination for large entities
4. Cache universe-level queries
5. Hydrate message snippets only when visible

---

# Example Gmail Cleanup Query Flow

```
Universe Query
   ↓
Sender Query
   ↓
Sender Drilldown
   ↓
Message Preview
   ↓
Rule Recommendation
```

---

# Future Expansion

These query patterns will also support:

- CRM Workspaces
- Ad Analytics Workspaces
- Finance Workspaces
- Crypto Monitoring Workspaces

Each workspace reuses the same query architecture.

---

# Key Design Goal

The AI Workspace platform should never require a user to understand database queries.

Instead:

```
User Action
 → Agent Query
 → Structured Result
 → Decision
```

This keeps the system simple for the user while remaining powerful internally.

---

End of document.