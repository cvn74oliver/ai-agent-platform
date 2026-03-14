

# AI Workspace LLM Memory Model

This document defines how AI agents inside the AI Agent Platform learn, remember, and improve over time. It describes the architecture used to capture user decisions, store them, and feed them back into the system using Retrieval-Augmented Generation (RAG).

The goal is simple:

> The system should become smarter every time the user interacts with it.

Eventually, the AI should be able to anticipate what the user wants and automate decisions with minimal intervention.

---

# Core Philosophy

Every workspace is powered by an agent that continuously learns from four sources:

1. User Decisions
2. System Observations
3. Historical Data
4. Explicit User Instructions

These inputs are stored and structured so they can be retrieved later by the LLM.

This is what turns the platform from a **tool** into an **intelligent system**.

---

# The AI Learning Loop

All agents follow the same learning lifecycle:

Observe → Analyze → Decide → Execute → Learn

## Observe

The system watches user behavior and system events.

Examples:

• Email archived
• Sender marked as trusted
• Crypto position opened
• Ad campaign paused
• Invoice categorized

These events are captured and stored as structured memory entries.

## Analyze

The agent evaluates patterns in the observed data.

Examples:

• "User archives most Zillow emails"
• "User keeps emails from Mike Dillard"
• "User frequently pauses ads with CPA above $50"

## Decide

The system generates recommendations based on patterns.

Example:

"You usually archive promotional emails from this sender. Apply the same rule?"

## Execute

After confirmation, the system performs the action automatically.

Examples:

• create email rule
• archive sender
• adjust ad bid
• rebalance crypto portfolio

## Learn

The final decision is stored so the system improves next time.

---

# Memory Types

The platform stores several different kinds of memory.

## 1. Decision Memory

Stores explicit user decisions.

Examples:

• "Archive Zillow emails"
• "Always keep Mike Dillard"
• "Ignore newsletters"

Structure example:

```
{
  "workspace": "gmail",
  "entity_type": "sender",
  "entity": "zillow.com",
  "decision": "archive",
  "confidence": "confirmed",
  "timestamp": "2026-03-14"
}
```

---

## 2. Pattern Memory

Stores observed behavioral patterns.

Examples:

• "User archives 90% of promotional senders"
• "User reads newsletters from marketing experts"

These are generated automatically from decision history.

---

## 3. System Knowledge

Stores workspace-specific knowledge about how systems behave.

Examples:

• Gmail label rules
• Facebook Ads metrics
• Crypto exchange APIs

This knowledge is shared across users.

---

## 4. User Preference Memory

Stores explicit preferences.

Examples:

• risk tolerance
• preferred email categories
• investment time horizon

---

# RAG (Retrieval Augmented Generation)

The LLM does not rely on raw prompts alone.

Before generating a response, the system retrieves relevant memory.

The prompt pipeline becomes:

User Request

→ Retrieve relevant memory

→ Inject context into prompt

→ Generate response

This allows the system to behave as if it "remembers" previous interactions.

Example prompt context:

```
User typically archives promotional emails.
User keeps marketing newsletters from known experts.
Sender: zillow.com
Previous decision: archived 17 times
```

The LLM then generates the recommendation:

"You normally archive Zillow emails. Apply the same rule?"

---

# Workspace Memory Isolation

Each workspace maintains its own memory context.

Examples:

Gmail workspace memory
Crypto workspace memory
Ads workspace memory
CRM workspace memory

However, a **global user profile** can influence all of them.

Example:

If the user prefers aggressive automation, all agents may increase automatic suggestions.

---

# Memory Storage Layers

The platform uses three storage layers.

## Short-Term Context

Stored in active session state.

Used for:

• ongoing workflows
• current task context

## Structured Database Memory

Stored in relational tables.

Examples:

• sender decisions
• rule configurations
• agent actions

## Vector Memory (Embeddings)

Stored in a vector database.

Used for:

• semantic search
• historical reasoning
• cross-workspace memory retrieval

---

# Example: Gmail Agent Learning

User archives multiple senders.

The system records:

• archived sender
• sender category
• message pattern

Next time the agent detects a similar sender, it recommends:

"Archive similar promotional senders automatically?"

After enough confirmation, the system can automate the rule entirely.

---

# Cross-Workspace Intelligence

Because all workspaces share the same architecture, patterns can transfer.

Example:

User prefers automation.

The Gmail agent, Ads agent, and Crypto agent can all increase automatic suggestions.

This is what turns the system into a **true AI assistant across domains**.

---

# Future Evolution

Over time the system should evolve from:

User-driven

→ AI-assisted

→ AI-autonomous

Eventually the user experience becomes:

"The system already handled it."

The user only intervenes when the AI encounters something new.

---

# Design Principles

1. Decisions become memory.
2. Memory improves future decisions.
3. Agents operate within structured workflows.
4. Humans remain the final authority.

The goal is not replacing the user.

The goal is giving the user a **team of intelligent agents that learn how they think**.