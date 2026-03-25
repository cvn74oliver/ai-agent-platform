

# MANAGER AGENT DECISION MODEL

## Purpose

Define how a **Manager / Orchestrator Agent** makes decisions across multiple agents and workspaces in Automata.

This model ensures:
- decisions are traceable
- cross-agent intelligence is usable
- authority boundaries remain clear
- the system scales without losing control

---

## Core Principle

> A Manager Agent does not do the work — it **interprets, combines, and routes decisions**.

Worker agents execute.
Manager agents decide *between* them.

---

## Role of the Manager Agent

A Manager Agent operates above multiple agents or workspaces and is responsible for:

- aggregating signals from multiple agents
- identifying patterns across systems
- detecting conflicts or dependencies
- generating higher-level recommendations
- routing decisions back down to the correct agents

---

## Decision Inputs

A Manager Agent consumes structured outputs from worker agents.

Each input must include:

- source_agent_id
- signal_type
- confidence
- evidence
- recommended_action
- requires_approval

The Manager Agent never relies on:
- raw UI data
- hidden state
- implicit assumptions

---

## Decision Types

### 1. Independent Decisions

A decision that affects only one agent.

Example:
- Gmail agent flags spam cleanup

Manager role:
- pass-through or escalate

---

### 2. Coordinated Decisions

A decision requiring multiple agents.

Example:
- Ads agent + analytics agent → performance drop

Manager role:
- combine signals
- propose coordinated action

---

### 3. Conflict Decisions

Multiple agents disagree.

Example:
- Ads agent recommends increasing budget
- Finance agent flags spending risk

Manager role:
- surface conflict
- present both sides
- recommend resolution

---

### 4. Escalation Decisions

Requires human approval.

Example:
- high-risk action
- unclear evidence

Manager role:
- escalate with context

---

## Decision Flow

### Step 1 — Collect Signals

```text
Agent A
Agent B
Agent C
  ↓
Manager Agent
```

---

### Step 2 — Normalize Inputs

- ensure consistent structure
- filter invalid or low-quality signals

---

### Step 3 — Evaluate Context

- check relationships between signals
- detect overlaps or dependencies

---

### Step 4 — Determine Decision Type

- independent
- coordinated
- conflict
- escalation

---

### Step 5 — Produce Output

Manager Agent outputs:

- combined insight
- recommended action
- confidence level
- supporting evidence
- routing instructions

---

### Step 6 — Route Decision

```text
Manager Agent → Workspace → Worker Agent(s)
```

---

## Output Contract

Manager Agent outputs must include:

- decision_id
- source_agents
- decision_type
- confidence
- evidence_summary
- recommended_action
- affected_agents
- requires_approval

---

## Authority Model

### Default

> The human is the final authority.

Manager Agents:
- recommend
- coordinate
- escalate

---

### Optional Future Modes

- bounded autonomy (pre-approved actions)
- rule-based execution
- delegated authority within limits

---

## Conflict Handling Rules

When conflicts occur:

1. Do not hide disagreement
2. Present all relevant evidence
3. Show competing recommendations
4. Recommend a resolution
5. Escalate if needed

---

## Safety Rules

- no silent overrides
- no hidden decisions
- no cross-agent actions without trace
- no skipping approval when required

---

## Examples

### Example 1 — Marketing + Analytics

Inputs:
- Ads agent: "Performance dropping"
- Analytics agent: "Conversion down 15%"

Manager output:
- Combined insight: campaign underperforming
- Action: adjust targeting + pause low performers

---

### Example 2 — Finance Conflict

Inputs:
- Ads agent: "Increase spend"
- Finance agent: "Budget exceeded"

Manager output:
- Conflict detected
- Recommendation: hold spend, re-evaluate allocation

---

## What This Model Enables

- multi-agent coordination
- cross-domain intelligence
- scalable decision-making
- clear audit trails

---

## What This Model Prevents

- conflicting hidden actions
- agent chaos
- unclear ownership
- decision drift

---

## Summary

Manager Agents:
- do not replace worker agents
- do not execute tasks directly
- act as decision orchestrators

They sit above the system to:
- interpret
- coordinate
- guide

---

# END