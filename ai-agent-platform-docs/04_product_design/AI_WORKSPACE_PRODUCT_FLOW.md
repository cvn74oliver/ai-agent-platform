

# AI Workspace Product Flow

## Purpose of This Document

This document defines the **universal workflow pattern used by every AI Workspace** inside the platform.  

It explains how a workspace moves from:

Insight → Decision → Automation → Learning

Codex must treat this document as the **product interaction blueprint** for all workspaces including:

- Gmail Workspace
- Ads Workspace
- Crypto Workspace
- Tax Workspace
- CRM Workspace

Each workspace implements the same core product flow but applies it to a different data domain.

---

# Core AI Workspace Flow

Every workspace follows the same 4-stage loop.

1. Insight
2. Decision
3. Automation
4. Learning

This loop continuously repeats and improves over time.

---

# Stage 1 — Insight

The system first analyzes the data universe.

Example (Gmail):

Mailbox → Sender Universe → Activity Timeline → Category Distribution

Example (Ads):

Campaigns → Spend Distribution → Conversion Sources

Example (Crypto):

Wallets → Asset Allocation → Performance

The goal of Insight is:

• show the **big picture**  
• help the user understand the system  
• highlight important patterns  

Insight is always **analytics-first and read-only**.

No decisions are made yet.

---

# Stage 2 — Decision

After understanding the system, the user begins making structured decisions.

Example (Gmail):

Decide how each **sender** should be handled.

Options might include:

• Always keep
• Archive automatically
• Unsubscribe
• Quarantine
• Custom rules

Example (Ads):

Decide campaign actions:

• Increase budget
• Pause campaign
• Adjust targeting

Example (Crypto):

Decide portfolio actions:

• Buy
• Sell
• Hold
• Rebalance

The Decision stage converts **human intent into structured actions**.

---

# Stage 3 — Automation

After decisions are made, the system converts them into automation rules.

Example (Gmail):

Rules might include:

IF sender = newsletter → archive

IF sender = important_contact → always inbox

Example (Ads):

IF CPA > threshold → reduce budget

Example (Crypto):

IF allocation > target → rebalance

Automation is executed by the **AI Agent Runtime**.

---

# Stage 4 — Learning

Every decision made by the user is stored in the system memory.

This allows the agent to improve over time.

Examples:

• Sender preferences
• Rule confirmations
• Manual overrides
• Pattern corrections

These are stored inside the **LLM Memory Model** and retrieved using the **RAG pipeline**.

Future suggestions become smarter because the system learns the user's preferences.

---

# Continuous AI Loop

The workspace therefore becomes a continuous loop:

Insight
→ Decision
→ Automation
→ Learning
→ Insight (updated)

Each pass through the loop improves the system.

Over time the agent can perform most work automatically.

The user only confirms suggestions.

---

# Gmail Workspace Implementation

The Gmail workspace implements this flow using the following product steps.

Step 1 — Mailbox Intelligence

Understand the inbox:

• sender distribution
• activity timeline
• category breakdown

Step 2 — Cleanup Groups

Choose a cleanup target:

• newsletters
• promotions
• automated senders

Step 3 — Sender Decisions

Classify senders.

Step 4 — Message Verification

Confirm representative messages.

Step 5 — Apply Rules

Create automation.

Step 6 — Monitor

Agent continues learning.

---

# Why This Architecture Matters

Most existing products stop at:

Insight → Action

Example tools:

• Clean Email
• Superhuman
• Gmail filters

Our system continues further:

Insight → Decision → Automation → Learning

This turns a simple tool into an **AI-powered operating system for workflows**.

---

# Universal Workspace Pattern

Every workspace must implement the same pattern.

Insight Page
Decision Page
Automation Page
Learning Loop

The Gmail workspace is the **reference implementation** for the architecture.

Future workspaces must follow the same design principles.

---

# Implementation Rules

Codex must ensure:

• every workspace follows the Insight → Decision → Automation → Learning loop
• analytics views exist before decision views
• decision views modify automation rules
• automation rules feed the learning system

The learning system must influence future insight pages.

This closes the intelligence loop.

---

# End of Document