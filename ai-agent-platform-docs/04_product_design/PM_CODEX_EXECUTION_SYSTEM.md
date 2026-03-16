# PM → Codex Execution System

## Purpose
This document defines the **standard operating system** between:
- Project Manager (ChatGPT)
- Codex (Execution Agent)
- Operator (Oliver)

The goal is to:
- Eliminate repetitive review cycles
- Increase speed of iteration
- Ensure Codex executes UI and system changes correctly on the first pass

---

## Core Principle

> The Project Manager THINKS.
> Codex EXECUTES.
> The Operator VALIDATES (quickly).

The operator should **NOT be responsible for redesigning the product during testing**.

---

## Execution Flow (Always Follow This)

### Step 1 — PM Defines Target
PM:
- Reads specs (especially Gmail Workspace + Visual Intelligence + Dashboard Spec)
- Reviews screenshots (if provided)
- Identifies EXACT problems
- Defines EXACT desired outcome

PM must:
- Think like product designer
- Think like UX strategist
- Think like system architect

---

### Step 2 — PM Sends Codex Instruction
Every UI prompt to Codex MUST include:

```
Before changing UI, read:
- GMAIL_WORKSPACE_UI_STRUCTURE.md
- GMAIL_WORKSPACE_UX_SPEC.md
- GMAIL_WORKSPACE_VISUAL_INTELLIGENCE_SPEC.md
- GMAIL_WORKSPACE_INTELLIGENT_DASHBOARD_SPEC.md
```

Then:
- Define scope (VERY narrow)
- Define what to change
- Define what NOT to change
- Define success criteria

---

### Step 3 — Codex Executes
Codex:
- Modifies ONLY scoped files
- Follows spec
- Returns PM review packet

---

### Step 4 — Operator UI Check (FAST)
Operator ONLY reports:

```
1. Did it load? (fast / slow)
2. What did you click?
3. What happened?
4. Pass or Fail
```

NO long explanations.
NO redesign thinking.

---

### Step 5 — PM Evaluates
PM:
- Uses screenshots + spec memory
- Identifies gaps
- Sends next precise Codex instruction

---

## UI Execution Rules (Critical)

Codex MUST:

1. NEVER guess UI
2. NEVER invent structure
3. ALWAYS follow spec hierarchy
4. ALWAYS prioritize:
   - clarity
   - guidance
   - decision-making

---

## Dashboard Philosophy (Critical)

The system is NOT a dashboard.

It is:

> **AI-Guided Decision System**

Each page must:

1. Explain current state
2. Explain problem
3. Explain next action
4. Show expected result
5. Provide clear action path

---

## Mailbox Intelligence Goal

The user goal is:

> **Every sender has a decision**

NOT zero inbox.

Health = decision coverage.

---

## Visual System Rules

Every major section must include:

- A visual representation
- A clear meaning
- A connection to action

Visuals must:
- Add insight (not decoration)
- Be interactive only if useful
- Drive decisions

---

## Common Failure Modes (Avoid)

1. Repeating visible data in hover
2. Adding visuals without meaning
3. Mixing message vs sender logic
4. No CTA for "Do Next"
5. Duplicate sections across pages

---

## Scope Discipline Rule

Each Codex task must fix ONLY:

- 1 system issue
OR
- 1 UI section

Never multiple areas at once.

---

## Logging Rule

Codex should update logs ONLY when:
- behavior changes
- architecture changes
- system state changes

Do NOT log minor UI tweaks.

---

## Outcome

If followed correctly:

- UI quality improves every iteration
- Operator time drops dramatically
- Codex stops regressing
- Product converges quickly

---

## Final Principle

> Build a system that THINKS for the user.
> Not a system that REPORTS to the user.

