

# Agent Memory and Decision Engine

## Purpose

This document defines how AI agents inside the AI Workspace Platform **observe user activity, learn preferences, form policies, and eventually automate decisions**.

It describes the architecture that allows every workspace (Gmail, Ads, Crypto, Finance, Marketing, etc.) to evolve from:

User‑driven actions → AI recommendations → AI automation.

This document works together with:

- `AI_WORKSPACE_ARCHITECTURE.md`
- `GMAIL_WORKSPACE_SPEC.md`


---

# Core Learning Model

The system follows a continuous intelligence cycle:

Observe → Understand → Decide → Act → Learn → Automate

This cycle repeats every time the user interacts with a workspace.


---

# Intelligence Layers

The platform operates with **two complementary intelligence layers**.

## 1. Workspace Intelligence

Workspace intelligence analyzes data inside a workspace.

Examples:

- Gmail inbox analytics
- Ad performance metrics
- Crypto portfolio performance
- Marketing campaign statistics

Workspace intelligence answers:

"What is happening right now?"

Examples:

- Which senders dominate an inbox
- Which ads produce revenue
- Which crypto assets are gaining

Workspace intelligence produces **observations**, not decisions.


---

## 2. Agent Intelligence

Agent intelligence learns from the **user’s decisions**.

It answers:

"What does this user prefer to do in situations like this?"

Examples:

- Always archive newsletters
- Always keep emails from real humans
- Pause ads with low ROAS
- Increase spend on profitable campaigns

Over time the agent builds a **decision memory**.


---

# Memory Architecture

Agent learning is built around four core objects:

1. Observations
2. Preferences
3. Policies
4. Automations


---

# 1. Observations

Observations are facts detected by workspace intelligence.

Examples:

Gmail:

- Sender frequency
- Unread message count
- Email category

Ads:

- Cost per conversion
- Campaign performance

Crypto:

- Price movement
- Portfolio allocation

Observations are **data**, not decisions.


---

# 2. Preferences

Preferences represent **explicit user decisions**.

Examples:

Gmail:

- "Keep emails from Mike Dillard"
- "Archive Zillow emails"

Ads:

- "Increase budget for profitable campaigns"

Crypto:

- "Avoid selling long‑term holdings"

Preferences are stored permanently and form the first layer of memory.


---

# 3. Policies

Policies are generalized rules derived from preferences.

Example:

If the user archives multiple promotional senders, the system learns:

"Archive promotional senders by default"

Policies allow the system to move from:

Single decision → pattern recognition.


---

# 4. Automations

Automations occur when policies become reliable enough that the system can act automatically.

Examples:

Gmail:

- Automatically archive low‑value newsletters

Ads:

- Automatically pause underperforming ads

Crypto:

- Automatically rebalance portfolios

Automation always includes a **reporting loop** so the user remains in control.


---

# Decision Memory Pipeline

Every decision follows this pipeline:

Observation → Preference → Policy → Automation


Example (Gmail cleanup):

Observation:

"User archived emails from Sender X"

Preference stored:

"User prefers to archive Sender X"

Policy derived:

"Archive promotional senders"

Automation created:

"Future emails from Sender X automatically archived"


---

# RAG Integration

Agent memory is stored in a **Retrieval‑Augmented Generation (RAG) system**.

This allows the LLM to retrieve past decisions and context.

Memory objects stored in RAG:

- preferences
- policies
- past actions
- automation outcomes

When the user opens a workspace, the LLM retrieves:

- relevant policies
- past decisions
- automation history

This allows the system to generate **context‑aware recommendations**.


---

# Recommendation Engine

The agent continuously generates suggestions based on:

- current observations
- stored policies
- previous user behavior

Examples:

Gmail:

"You archived similar senders before. Archive these as well?"

Ads:

"Campaign performance matches a pattern where you normally increase budget."

Crypto:

"This asset matches your typical long‑term hold pattern."


---

# Human Approval Layer

Automation never begins without trust signals.

The system moves through three stages:

1. Manual decisions
2. Suggested actions
3. Automatic execution

This prevents unsafe automation.


---

# Reporting Layer

Every automated action is reported back to the user.

Examples:

Daily briefing:

"23 promotional emails archived automatically"

Weekly briefing:

"Ad budget increased on two high‑performing campaigns"

This ensures the user always understands what the system is doing.


---

# Long‑Term Agent Evolution

Over time the agent builds a behavioral model of the user.

Eventually the system reaches a state where:

- most actions are automated
- the user only confirms edge cases

The goal is for the system to behave like an experienced department head who understands the user's preferences.


---

# Key Principle

The system should eventually feel like it runs itself.

The user sets preferences once.

The AI observes behavior.

The agent learns.

Automation increases.

Human intervention decreases.


---

# Relationship to Workspaces

Every workspace uses the same learning engine.

Examples:

Gmail Workspace:

Observation → sender patterns

Ads Workspace:

Observation → campaign performance

Crypto Workspace:

Observation → portfolio movements

All workspaces feed the **same decision engine**.


---

# Summary

This document defines how the AI platform learns.

Key ideas:

- Workspace intelligence observes data
- Agent intelligence learns decisions
- Preferences evolve into policies
- Policies evolve into automation

This architecture allows every workspace to evolve from manual tools into **self‑optimizing AI systems**.
