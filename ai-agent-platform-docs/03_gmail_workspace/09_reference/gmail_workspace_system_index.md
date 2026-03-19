

# Gmail Workspace Intelligence System Index

## Purpose
The **Gmail Workspace Intelligence System Index** defines how all intelligence systems inside the Gmail Workspace connect together.  

This file acts as the **top‑level map of the Gmail intelligence layer**, explaining how the following subsystems interact:

- Mailbox Intelligence Dashboard
- Sender Intelligence Engine
- Inbox Health Engine
- Inbox Health Algorithm
- Gmail Cleanup Decision Engine
- Gmail Decision Storage System
- Gmail Automation / Rule Engine
- Monitoring & Learning System

This document is **not an implementation spec**.  
Instead, it serves as the **architectural navigation layer** so developers and Codex understand how the intelligence components fit together.

---

# Core Intelligence Layers

The Gmail Workspace intelligence architecture is organized into **five primary layers**:

1. Mailbox Intelligence Layer
2. Sender Intelligence Layer
3. Decision Intelligence Layer
4. Learning & Adaptation Layer
5. Automation Layer

Each layer builds on the previous one.

---

# Layer 1 — Mailbox Intelligence

Defined in:

`GMAIL_WORKSPACE_ANALYTICS_SPEC.md`

Responsibilities:

• Analyze entire mailbox state  
• Provide dashboard insights  
• Surface cleanup opportunities  
• Identify sender clusters  
• Feed the Inbox Health Engine

Key outputs:

- sender_universe
- cleanup_candidates
- cluster_groups
- protected_senders
- mailbox_activity_timeline

Mailbox Intelligence **never makes decisions**.

It only **exposes signals**.

---

# Layer 2 — Sender Intelligence

Defined in:

`GMAIL_WORKSPACE_PRODUCT_FLOW_SPEC.md`

Responsibilities:

• Convert mailbox signals into **sender insights**  
• Classify sender behavior  
• Identify cleanup opportunities per sender

Sender signals include:

- message frequency
- open history
- reply behavior
- star/important usage
- domain patterns
- promotional indicators

This layer powers the **Sender Decisions workspace**.

---

# Layer 3 — Decision Intelligence

Defined in:

`GMAIL_WORKSPACE_DECISION_STORAGE_SPEC.md`

Responsibilities:

• Store sender decisions
• Track decision history
• Maintain decision state

Decision types:

- Archive
- Keep
- Quarantine
- Unsubscribe
- Custom Rule

Decisions exist in two states:

1. **Immediate actions** (executed now)
2. **Future intent** (automation rules)

This layer powers:

- Confirmation
- Approvals
- Decision persistence

---

# Layer 4 — Learning & Adaptation

Defined in:

`GMAIL_WORKSPACE_HEALTH_ENGINE.md`

and

`GMAIL_WORKSPACE_INBOX_HEALTH_ALGORITHM_MODEL.md`

Responsibilities:

• Analyze mailbox quality
• Learn from user behavior
• Generate recommendations

Learning signals include:

- sender decisions
- message interactions
- decision reversals
- rule edits

The learning engine produces:

- cleanup recommendations
- sender trust scores
- inbox health score

---

# Layer 5 — Automation

Defined in:

`GMAIL_WORKSPACE_DECISION_UI_FLOW.md`

Responsibilities:

• Convert stored decisions into rules
• Automate inbox management

Automation examples:

- auto archive promotional senders
- auto quarantine low value senders
- auto protect trusted senders

Automation only activates **after user confirmation**.

---

# Intelligence System Data Flow

The Gmail intelligence pipeline follows this flow:

Mailbox Index

→ Mailbox Intelligence

→ Sender Intelligence

→ User Decisions

→ Decision Storage

→ Learning Engine

→ Inbox Health Engine

→ Automation Suggestions

→ Automation Rules

This loop **continuously improves mailbox quality**.

---

# Inbox Health Engine

Defined in:

`GMAIL_WORKSPACE_INBOX_HEALTH_SPEC.md`

The health engine measures:

• inbox quality
• sender trust
• automation coverage
• cleanup completion

Health is represented as a **score from 0–100**.

Example interpretation:

| Score | Meaning |
|------|------|
| 0‑40 | Inbox unhealthy |
| 40‑70 | Needs cleanup |
| 70‑90 | Healthy |
| 90‑100 | Optimized |

The system updates this score after every decision.

---

# Sender Trust Graph

Defined in:

`GMAIL_WORKSPACE_HEALTH_ENGINE.md`

Senders develop a **trust score** based on:

• reply rate
• open rate
• decision history
• domain reputation

This graph powers:

- recommendation ranking
- cleanup prioritization

---

# Reinforcement Learning Loop

Defined in:

`GMAIL_WORKSPACE_INBOX_HEALTH_ALGORITHM_MODEL.md`

The system learns from user behavior.

Example:

User repeatedly archives promotional senders.

The system learns:

Promotional senders → likely archive.

The system then recommends:

"Archive these similar senders."

---

# Intelligence Subsystems Overview

| System | Purpose |
|------|------|
| Mailbox Intelligence | Analyze entire mailbox |
| Sender Intelligence | Analyze senders |
| Decision Storage | Persist decisions |
| Learning Engine | Learn from behavior |
| Inbox Health Engine | Measure mailbox quality |
| Automation Engine | Apply automation |

---

# Relationship to Existing Docs

This file connects the following specifications:

- `GMAIL_WORKSPACE_ANALYTICS_SPEC.md`
- `GMAIL_WORKSPACE_UX_SPEC.md`
- `GMAIL_WORKSPACE_DECISION_STORAGE_SPEC.md`
- `GMAIL_WORKSPACE_DECISION_UI_FLOW.md`
- `GMAIL_WORKSPACE_INBOX_HEALTH_SPEC.md`
- `GMAIL_WORKSPACE_INBOX_HEALTH_ALGORITHM_MODEL.md`
- `GMAIL_WORKSPACE_HEALTH_ENGINE.md`

Together these documents define the **complete Gmail Intelligence architecture**.

---

# Developer Guidance

When implementing new Gmail features:

1. Mailbox Intelligence must remain read‑only.
2. Sender Intelligence drives the decision UI.
3. Decisions must always persist in Decision Storage.
4. Learning Engine must consume all decision events.
5. Inbox Health Engine must update after each decision.
6. Automation must remain opt‑in.

Never bypass these layers.

---

# Codex Guidance

Codex agents must treat this document as the **entry point to the Gmail intelligence architecture**.

When modifying Gmail Workspace code:

1. Identify the correct intelligence layer.
2. Confirm the relevant spec document.
3. Verify changes do not break upstream or downstream layers.

The intelligence system must remain:

- sender‑first
- decision‑driven
- learning‑based
- automation‑assisted

---

End of Gmail Workspace Intelligence System Index.