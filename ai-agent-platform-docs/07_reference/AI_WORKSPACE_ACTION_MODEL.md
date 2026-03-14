

# AI Workspace Action Model

## Purpose

The **AI Workspace Action Model** defines how user decisions inside any workspace (Gmail cleanup, CRM automation, crypto investing, ads optimization, etc.) are translated into structured actions that the system can:

1. Execute immediately
2. Learn from
3. Store in memory
4. Reuse as future automation
5. Suggest proactively

The Action Model is the bridge between:

**User Decisions → Agent Intelligence → Automation**

Every interaction inside a workspace must resolve to a normalized action event so the AI system can learn and evolve.

---

# Core Concept

Every meaningful user interaction becomes an **Action Event**.

Examples:

User action | Stored Action
--- | ---
Archive sender | `archive_sender`
Keep sender | `keep_sender`
Quarantine sender | `quarantine_sender`
Unsubscribe sender | `unsubscribe_sender`
Approve automation | `approve_rule`
Reject automation | `reject_rule`
Delete email | `delete_message`
Mark message important | `mark_important`
Undo action | `revert_action`

These events are stored in the **Action Memory Layer** and become training data for the agent.

---

# Action Event Structure

Every action must be normalized into the following structure.

```
ActionEvent {

  action_id
  workspace_id
  agent_id

  action_type
  action_scope

  entity_type
  entity_id

  user_id

  context

  created_at

}
```

---

# Action Types

## Sender Actions

These are the most important actions in Gmail cleanup.

```
archive_sender
keep_sender
quarantine_sender
unsubscribe_sender
prioritize_sender
snooze_sender
```

These decisions teach the agent how the user evaluates senders.

---

## Message Actions

Used when a sender decision is not sufficient.

```
archive_message
delete_message
keep_message
mark_important
```

These refine the model for **message-level exceptions**.

---

## Rule Actions

Actions that create automation.

```
approve_rule
reject_rule
modify_rule
pause_rule
resume_rule
```

Rules are derived from observed patterns.

Example:

"User archived Zillow newsletters 14 times"

Agent suggests rule.

---

## System Actions

These are triggered by the agent.

```
auto_archive_sender
auto_quarantine_sender
auto_label_sender
agent_recommendation
```

These are always linked to **confidence scores**.

---

# Action Scope

Actions operate at different levels.

```
mailbox
cluster
batch
sender
message
```

Example:

```
action_type: archive_sender
entity_type: sender
entity_id: "news@zillow.com"
action_scope: sender
```

---

# Context Object

The **context** field captures the environment where the action occurred.

Example:

```
context: {

  workspace: "gmail",

  cluster: "newsletter_cluster",

  batch_size: 1000,

  message_count_for_sender: 231,

  user_confidence: "high"

}
```

Context allows the AI to understand *why* the user made the decision.

---

# Action Learning Pipeline

Action events are fed into the AI learning system.

Pipeline:

```
User Action
   ↓
Action Event
   ↓
Workspace Memory
   ↓
Pattern Detection
   ↓
Rule Suggestion
   ↓
Automation
```

Example:

User archives sender 10 times.

System detects pattern.

Agent suggests:

"Auto archive this sender going forward?"

---

# Rule Suggestion Engine

The Action Model powers the **rule recommendation system**.

Example logic:

```
if sender_archived_count > 5
and sender_never_opened

suggest_rule: auto_archive_sender
```

Rules must always require **explicit approval** before activation.

---

# Action Confidence Tracking

Each rule recommendation carries a confidence score.

Example:

```
confidence = actions_supporting_rule / total_messages
```

Example output:

```
Rule Suggestion
Auto archive Zillow newsletters
Confidence: 92%
```

---

# Undo / Correction Model

Every action must be reversible.

Undo event example:

```
revert_action {

  original_action_id

}
```

This prevents the agent from learning incorrect behavior.

---

# Cross Workspace Learning

Actions can optionally feed into higher layers.

```
Workspace Memory
      ↓
User Global Memory
      ↓
Platform Intelligence
```

Example:

User consistently prioritizes messages from founders and executives.

Agent learns:

"User values direct human communication over automated messages."

This knowledge may influence other agents.

---

# Privacy Model

User actions are private by default.

Only **aggregated anonymous patterns** can feed global models.

Examples of shareable patterns:

```
users archive newsletters 80% of the time
users keep receipts 95% of the time
```

Actual sender names and message data never leave the workspace.

---

# Why This Model Matters

Without an action model:

The system is a **tool**.

With an action model:

The system becomes an **AI employee** that learns from decisions.

The Action Model is what allows the platform to evolve from:

```
Manual Workflows
      ↓
Assisted Workflows
      ↓
Autonomous Workflows
```

---

# Relationship to Other Docs

This document works with:

- `AI_WORKSPACE_EVENT_MODEL.md`
- `AI_WORKSPACE_DATA_MODEL.md`
- `AI_WORKSPACE_RAG_PIPELINE.md`
- `AI_WORKSPACE_LLM_MEMORY_MODEL.md`

Together these define how the platform:

- observes actions
- stores memory
- trains agents
- automates future work

---

# Key Principle

**Every user decision must become structured intelligence.**

That is how the system learns.

That is how the system becomes autonomous.