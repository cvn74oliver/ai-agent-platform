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

> The Project Manager THINKS and DECIDES.
> Codex EXECUTES with precision.
> The Operator VALIDATES quickly and reports truth.

The operator should **NOT redesign, reinterpret, or solve product problems during testing**.
The system must minimize operator thinking and maximize execution clarity.

---

## Execution Flow (Always Follow This)

---

## 🔒 Execution Integrity Rule (NEW – CRITICAL)

Long-running processes (Gmail indexing, backfill, ingestion, etc.) are **sacred execution states**.

During these processes:
- DO NOT restart the dev server
- DO NOT trigger competing actions
- DO NOT switch execution strategies mid-run
- ALWAYS prefer resume over restart

If a process is interrupted:
→ Resume from checkpoint
→ Never restart from zero unless explicitly required

Violating this rule causes:
- lost progress
- corrupted operator trust
- wasted execution cycles

---

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
Operator ONLY reports (no thinking, no redesign):

```
1. What did you click?
2. What happened?
3. Expected vs actual (1 sentence)
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
5. NEVER modify behavior outside the defined trigger or flow

---

## Dashboard Philosophy (Critical)

The system is NOT a traditional dashboard.

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

Recency-weighted decisions matter more than historical noise.

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

## 🧠 Data Strategy Principle (NEW)

The system prioritizes **recent user behavior over historical data**.

This means:
- Recent senders and interactions carry more weight
- Older data is still useful but progressively deprioritized
- Historical backfill exists for completeness, not dominance

Future systems should:
- apply recency weighting
- decay outdated signals
- reinforce recent decisions

---

## 🎯 Sniper Method (Default UI Execution Mode)

All UI refinement tasks MUST follow the Sniper Method.

This is now the DEFAULT execution strategy for all UI work.

---

### Core Rule

> One surface. One problem. One outcome.

No exceptions. No bundling. No “while we’re here” changes.

---

### Sniper Method Requirements

Every Codex task MUST:

1. **Target ONE surface only**
   - Example: “Top row hero cards”
   - Never: “top row + signals + chart + CTAs”

2. **Target ONE problem only**
   - Example: “visual hierarchy of numbers”
   - Not: “visuals + spacing + semantics + interaction”

3. **Define exact before/after state**
   - What is wrong now
   - What it should look like after

4. **Explicitly define OUT OF SCOPE**
   - List everything that must NOT change
   - Prevent Codex from "helpfully" modifying other areas

5. **No guessing allowed**
   - If the correct solution is unclear:
     → STOP
     → PM + Operator alignment first
     → THEN execute

---

### Codex Instruction Requirements (Sniper Mode)

Every prompt MUST include:

- Scope Lock (exact UI elements)
- Not In Scope list
- Exact visual rules
- Exact constraints (what NOT to introduce)

Codex MUST NOT:
- expand scope
- reinterpret the product
- introduce new design patterns

---

### Validation Protocol (Sniper Mode)

Each task MUST include a **30–60 second test**:

Example format:

```
Check ONLY:
1. X
2. Y
3. Z

Ignore everything else
```

Operator should NOT review the whole page.

---

### Failure Handling

If a pass:
- regresses behavior
- introduces confusion
- fails to improve clarity

Then:
1. STOP
2. Return to Plan Mode
3. Rewrite with tighter scope

---

### Success Criteria

A sniper pass is successful when:

- The targeted issue is clearly improved
- No unrelated changes occurred
- No new ambiguity is introduced
- The result matches the plan exactly

---

### Relationship to Existing System

Sniper Method integrates with:

Plan → Approve → Sniper Pass → Targeted Test → Iterate

---

### Strategic Outcome

This method:
- eliminates repeated regression loops
- prevents expectation mismatch
- reduces operator frustration
- accelerates convergence to correct UI

---
---

## Plan Mode Future Improvement (Quality Gate)

All plans must pass a strict approval criteria before moving to execution.

A plan is ONLY approved if:

1. **Visual meaning is obvious at a glance**
   - The operator can understand what each element represents without explanation

2. **No element can be misinterpreted**
   - No ambiguous visuals
   - No mixed visual semantics (progress vs scope vs pressure)

3. **Exactly one dominant progress signal exists**
   - The page must clearly communicate a single “how far are we” metric
   - No competing progress indicators

4. **No UI element is decorative without purpose**
   - Every visual must convey meaning
   - If removed, the system should lose insight (not just styling)

5. **All CTAs are clearly actionable**
   - The next action must be obvious
   - Buttons must look clickable
   - No passive-looking actions

---

This becomes the **Plan Approval Quality Gate**.

If any of the above fail:

→ The plan must be revised before implementation

---
---

## Logging Rule

Codex MUST update logs ONLY when:
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

---

## 🚀 System Evolution Note (Forward Guidance)

The system is evolving from:
- data ingestion → intelligence → decision → execution

Into:
- guided decision flows
- behavioral learning loops
- automated maintenance systems

All future features must support:
- speed of decision-making
- clarity of action
- reduction of user cognitive load

If a feature adds complexity without increasing clarity:
→ it should not be built
