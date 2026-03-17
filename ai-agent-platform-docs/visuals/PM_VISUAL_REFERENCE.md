

<!--
PROJECT MANAGER VISUAL ORIENTATION PROMPT

Before proceeding with any task:
1. Carefully review this entire document.
2. Study each screenshot and its description.
3. Map UI surfaces to system concepts (Mailbox Intelligence, Cleanup Groups, Sender Decisions, etc.).
4. Use this as your PRIMARY visual reference when making product, UX, or flow decisions.

IMPORTANT:
- This document represents the REAL system UI.
- Do NOT rely only on written specs—anchor decisions to these visuals.
- Always maintain alignment between UI, system behavior, and specs.
-->

# PM Visual Reference (System UI Walkthrough)

## ⚠️ Visual Rendering Note

This document includes embedded UI screenshots.

If images do NOT render in your environment:
- Rely on the section titles + descriptions
- Treat this document as a structural UI map
- Ask for clarification if a visual reference is required

This document provides a **visual map of the entire AI Agent Platform UI**.

Purpose:
- Give new Project Managers instant visual context
- Eliminate the need for repeated screenshot explanations
- Anchor all product discussions to real UI surfaces

---

## 1. Dashboard (System Overview)

![Dashboard](./Dashboard.png)
> If image does not render: This screen shows the main system dashboard with analytics cards and navigation sidebar.

**What this is:**
- High-level analytics + system entry point
- Eventually becomes CEO-level command center

---

## 2. Agents (Agent Management Layer)

![Agents](./Agents.png)
> If image does not render: This screen displays all agents and management controls for the team and hierarchy system.

**What this is:**
- View and manage all agents
- Foundation for team / hierarchy system

---

## 3. Agent Summary (Single Agent View)

![Agent Summary](./Agent Summary.png)
> If image does not render: This screen provides a snapshot of a single agent's performance and configuration.

**What this is:**
- Snapshot of one agent
- Performance + configuration visibility

---

## 4. Agent Playground (Testing Environment)

![Agent Playground](./Agent Playground.png)
> If image does not render: This screen is the real-time testing environment for agents during development and debugging.

**What this is:**
- Real-time testing interface
- Used during development + debugging

---

## 5. New Agent Prompt (Agent Creation)

![New Agent Prompt](./New Agent Prompt.png)
> If image does not render: This screen is the entry point for creating new agents, leading to the voice-driven builder.

**What this is:**
- Entry point for creating agents
- Will evolve into voice-driven builder

---

## 6. Automations Tab

![Automations Tab](./Automations Tab.png)
> If image does not render: This screen shows the workflow and automation layer, integrating with external tools.

**What this is:**
- Workflow / automation layer
- Integrates with external tools (Make, ActivePieces, etc.)

---

## 7. Settings Tab

![Settings Tab](./Settings Tab.png)
> If image does not render: This screen contains system, agent, and workspace-level configuration settings.

**What this is:**
- System configuration
- Agent + workspace-level settings

---

# OPERATIONS WORKSPACE (CORE PRODUCT)

This is the **most important part of the system right now**.

---

## 8. Mailbox Intelligence (Command Center)

![Mailbox Intelligence](./Mailbox Intelligence.png)
> If image does not render: This screen is the command center for Gmail, showing system state and next actions.

**What this is:**
- The brain of the Gmail system
- Answers:
  - What is happening?
  - What should I do next?
  - Why?

---

## 9. Cleanup Groups (Action Layer)

![Cleanup Groups](./Cleanup Groups.png)
> If image does not render: This screen presents sender clusters for user action, not just a dashboard.

**What this is:**
- Where users take action on sender clusters
- NOT a dashboard — a decision surface

---

## 10. Sender Decisions (Decision Engine)

![Sender Decisions](./Sender Decisions.png)
> If image does not render: This screen is the core mechanic where every sender receives a system decision.

**What this is:**
- Core system mechanic
- Every sender must receive a decision

---

## 11. Confirmation (Execution Layer)

![Confirmation](./Confirmation.png)
> If image does not render: This screen finalizes decisions, transitioning from intent to execution.

**What this is:**
- Where decisions are finalized
- Transitions from intent → execution

---

## 12. Management (Post-Execution Control)

![Management](./Management.png)
> If image does not render: This screen is the system of record for managing archive, keep, rules, and overrides.

**What this is:**
- System of record
- Where users manage:
  - Archive
  - Keep
  - Rules
  - Overrides

---

## 13. Pending Approvals (Execution Queue)

![Pending Approvals](./Pending Approvals.png)
> If image does not render: This screen is the execution queue where actions wait for user approval.

**What this is:**
- Bottleneck surface
- Where execution waits for approval

---

## 14. Executed Actions (Audit Trail)

![Executed Actions](./Executed Actions.png)
> If image does not render: This screen shows all actions executed by the system for transparency and trust.

**What this is:**
- What the system has done
- Trust + transparency layer

---

## 15. Review Timeline (History Layer)

![Review Timeline](./Review Timeline.png)
> If image does not render: This screen tracks historical decisions for system learning and auditing.

**What this is:**
- Historical decision tracking
- System learning + auditing

---

# TRAINING + LLM SYSTEM

---

## 16. Fine-Tune Dataset Preview (Training Data)

![Fine Tune Dataset Preview 1](./Fine Tune Dataset Preview p1.png)
> If image does not render: This screen shows part 1 of the fine-tune dataset used for LLM improvement.
![Fine Tune Dataset Preview 2](./Fine Tune Dataset Preview p2.png)
> If image does not render: This screen shows part 2 of the fine-tune dataset used for LLM improvement.

**What this is:**
- Dataset used for LLM improvement
- Shows how system learns over time

---

## 17. Agent Next Training Suggestion

![Agent Next Training Suggestion](./Agent Next Training Suggestion Prompt.png)
> If image does not render: This screen suggests agent intelligence improvements, bridging usage and training.

**What this is:**
- Suggests improvements to agent intelligence
- Bridges real usage → training loop

---

# HOW TO USE THIS DOCUMENT

New Project Manager should:

1. Review this entire document once (top → bottom)
2. Focus on understanding FLOW, not just screens
3. Map:
   - UI → Spec → Behavior
4. Pay special attention to:
   - Mailbox Intelligence (command layer)
   - Cleanup Groups (action layer)
   - Sender Decisions (core system mechanic)
   - Management (system of record)

Goal:
- Achieve instant visual + conceptual understanding of the system
- Be able to reason about product decisions WITHOUT needing re-explanation