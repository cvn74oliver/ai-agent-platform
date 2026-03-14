

# AI Workspace Table Schemas

This document defines the **core database tables** for the AI Workspace platform.  
It translates the architecture documents into concrete data models so the system
can be implemented consistently across:

- Agents
- Workspaces
- Memory
- RAG pipelines
- Workflows
- Event systems
- Gmail cleanup workspace
- Decision learning and automation

The goal is to make every AI workspace **stateful, trainable, and auditable**.

---

# 1. Core Workspace Tables

## workspaces
Represents a top‑level AI workspace.

Columns:
- id (uuid, pk)
- name (text)
- owner_user_id (uuid)
- created_at (timestamp)
- updated_at (timestamp)

## workspace_users
Users with access to a workspace.

Columns:
- id (uuid, pk)
- workspace_id (uuid, fk → workspaces)
- user_id (uuid)
- role (text) — owner / admin / member
- created_at (timestamp)

## workspace_permissions
Optional granular permission overrides.

Columns:
- id (uuid, pk)
- workspace_id (uuid)
- user_id (uuid)
- permission_key (text)
- permission_value (boolean)

---

# 2. Agent System Tables

## agents
Represents a running AI agent inside a workspace.

Columns:
- id (uuid, pk)
- workspace_id (uuid)
- name (text)
- description (text)
- agent_type (text)
- created_at (timestamp)

## agent_runs
Tracks every execution of an agent.

Columns:
- id (uuid, pk)
- agent_id (uuid)
- run_type (text)
- run_status (text)
- started_at (timestamp)
- finished_at (timestamp)

## agent_memory
Persistent memory for an agent.

Columns:
- id (uuid, pk)
- agent_id (uuid)
- memory_type (text)
- memory_key (text)
- memory_value (jsonb)
- created_at (timestamp)

## agent_training_examples
Examples used to train the agent's behavior.

Columns:
- id (uuid, pk)
- agent_id (uuid)
- input_context (jsonb)
- user_decision (jsonb)
- created_at (timestamp)

---

# 3. Global Intelligence Layer

These tables allow knowledge sharing across workspaces.

## global_user_intelligence
Aggregated behavioral patterns.

Columns:
- id (uuid, pk)
- user_id (uuid)
- intelligence_type (text)
- intelligence_data (jsonb)
- updated_at (timestamp)

## cross_workspace_patterns
Reusable learned automation patterns.

Columns:
- id (uuid, pk)
- pattern_type (text)
- pattern_definition (jsonb)
- confidence_score (float)

---

# 4. RAG System Tables

Used for document retrieval and AI context.

## rag_documents
Raw uploaded or indexed documents.

Columns:
- id (uuid, pk)
- workspace_id (uuid)
- source_type (text)
- document_text (text)
- created_at (timestamp)

## rag_chunks
Chunked sections of documents.

Columns:
- id (uuid, pk)
- document_id (uuid)
- chunk_text (text)
- chunk_index (integer)

## rag_embeddings
Vector embeddings for chunks.

Columns:
- id (uuid, pk)
- chunk_id (uuid)
- embedding (vector)
- created_at (timestamp)

---

# 5. Workflow Engine Tables

## workflow_definitions
Definition of reusable workflows.

Columns:
- id (uuid, pk)
- workspace_id (uuid)
- workflow_name (text)
- workflow_definition (jsonb)
- created_at (timestamp)

## workflow_runs
Instance of a workflow execution.

Columns:
- id (uuid, pk)
- workflow_id (uuid)
- status (text)
- started_at (timestamp)
- finished_at (timestamp)

## workflow_steps
Individual steps inside a workflow.

Columns:
- id (uuid, pk)
- workflow_run_id (uuid)
- step_name (text)
- step_status (text)
- result_data (jsonb)

---

# 6. Event System

## workspace_events
System events that occur in a workspace.

Columns:
- id (uuid, pk)
- workspace_id (uuid)
- event_type (text)
- event_data (jsonb)
- created_at (timestamp)

## agent_events
Agent-specific events.

Columns:
- id (uuid, pk)
- agent_id (uuid)
- event_type (text)
- event_data (jsonb)

## decision_events
User decisions used to train automation.

Columns:
- id (uuid, pk)
- workspace_id (uuid)
- decision_type (text)
- decision_payload (jsonb)
- created_at (timestamp)

---

# 7. Gmail Workspace Tables

## gmail_accounts
Connected Gmail accounts.

Columns:
- id (uuid, pk)
- workspace_id (uuid)
- email_address (text)
- connected_at (timestamp)

## gmail_messages
Indexed Gmail messages.

Columns:
- id (uuid, pk)
- account_id (uuid)
- message_id (text)
- sender (text)
- subject (text)
- snippet (text)
- received_at (timestamp)
- label_ids (jsonb)

## gmail_senders
Unique senders identified from Gmail.

Columns:
- id (uuid, pk)
- account_id (uuid)
- sender_email (text)
- sender_name (text)

## gmail_sender_profiles
Aggregated stats for senders.

Columns:
- id (uuid, pk)
- sender_id (uuid)
- message_count (integer)
- unread_count (integer)
- last_seen (timestamp)

## gmail_cleanup_groups
High‑level clusters used for cleanup.

Columns:
- id (uuid, pk)
- workspace_id (uuid)
- cluster_type (text)
- cluster_query (text)
- message_count (integer)

## gmail_batches
Subsets of messages reviewed in cleanup.

Columns:
- id (uuid, pk)
- cleanup_group_id (uuid)
- batch_index (integer)
- message_count (integer)

## gmail_sender_decisions
User decisions about senders.

Columns:
- id (uuid, pk)
- sender_id (uuid)
- decision_type (text) — keep / archive / quarantine
- decision_reason (text)
- decided_at (timestamp)

## gmail_message_actions
Actions applied to individual messages.

Columns:
- id (uuid, pk)
- message_id (uuid)
- action_type (text)
- action_source (text)
- created_at (timestamp)

## gmail_rules
Automation rules generated from decisions.

Columns:
- id (uuid, pk)
- workspace_id (uuid)
- rule_type (text)
- rule_definition (jsonb)
- created_at (timestamp)

## gmail_deleted_messages
Tracks deletions so the AI learns user preferences.

Columns:
- id (uuid, pk)
- message_id (uuid)
- sender (text)
- deleted_at (timestamp)
- decision_source (text)

---

# 8. Learning and Automation Tables

## user_decision_history
Stores historical decisions made by users.

Columns:
- id (uuid, pk)
- workspace_id (uuid)
- decision_context (jsonb)
- decision_result (jsonb)
- created_at (timestamp)

## automation_recommendations
AI-generated suggestions.

Columns:
- id (uuid, pk)
- workspace_id (uuid)
- recommendation_type (text)
- recommendation_data (jsonb)
- confidence_score (float)

## automation_acceptance_log
Tracks whether users accepted AI recommendations.

Columns:
- id (uuid, pk)
- recommendation_id (uuid)
- accepted (boolean)
- responded_at (timestamp)

---

# Design Philosophy

The schema is designed so that:

- **Every decision is trackable**
- **Agents can learn from user behavior**
- **Workspaces remain isolated but can share patterns**
- **RAG systems provide context to agents**
- **Workflows can automate actions**
- **Events provide a complete audit trail**

This architecture allows the AI Workspace platform to evolve from a tool into a **self‑learning automation system**.