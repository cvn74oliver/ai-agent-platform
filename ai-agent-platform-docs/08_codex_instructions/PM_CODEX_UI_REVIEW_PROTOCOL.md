# PM → Codex → UI Review Protocol

## Purpose

This document defines the **standard operating procedure (SOP)** for how Oliver (UI tester), the Project Manager agent, and Codex collaborate when implementing and validating features in the AI Agent Platform.

The goal is to:

- Remove long, repetitive UI review explanations
- Keep Codex tasks tightly scoped
- Allow the Project Manager to perform the architectural thinking
- Let Oliver perform **fast, focused UI validation only**

This protocol drastically reduces testing time and prevents the "15‑minute review loop" problem.

---

# Roles

## Oliver — UI Tester

Responsibilities:

1. Run the Codex instruction provided by the Project Manager.
2. Paste the PM Review Packet returned by Codex.
3. Perform **only the exact UI checks requested**.
4. Provide:

- pass / fail
- screenshots
- terminal output if relevant

Oliver **does not need to re‑analyze the product design**.

The Project Manager performs that role.

---

## Project Manager — Product Architect

Responsibilities:

1. Interpret screenshots and UI state
2. Compare behavior to the documented specs
3. Identify architectural or UX problems
4. Decide what Codex must fix next
5. Generate the **next Codex instruction**

The PM **owns product quality and architecture decisions**.

---

### PM Sniper Instruction Requirement

For every Codex execution task, the PM MUST:

- Define a **single surface**
- Define a **single problem being solved**
- Provide a **Scope Lock block**
- Provide a **Not In Scope block**
- Provide a **30–60 second Test Checklist**

If any of these are missing:
→ the task is considered incomplete and should not be executed

---

## Codex — Implementation Engine

Responsibilities:

- Implement exactly what the PM specifies
- Stay inside the scope defined
- Produce a PM Review Packet
- Run lint and type checks

Codex should **not redesign the product**.

---

# Standard Iteration Cycle (Plan-First Execution)

Every iteration now follows a **Plan-First structure**.

---

### Step 1 — PM Creates Codex Plan Task

The PM sends a **Plan Mode instruction** to Codex.

This instruction must:
- define the surface (one only)
- reference relevant specs
- enforce constraints
- request a structured plan (NOT implementation)

---

### Step 2 — Codex Produces Plan (NO CODE)

Codex returns a structured plan including:

- Hero / UI structure changes
- What will be removed
- What will be simplified
- What will be unified
- What remains unchanged
- Risk check (ambiguities, conflicts)

Codex must NOT:
- write code
- partially implement

---

### Step 3 — PM Reviews Plan (Quality Gate)

The PM evaluates the plan using the **Plan Approval Quality Gate**:

A plan is only approved if:

1. Visual meaning is obvious at a glance
2. No element can be misinterpreted
3. Exactly one dominant progress signal exists
4. No UI element is decorative without purpose
5. All CTAs are clearly actionable

If any condition fails:
→ PM revises the plan
→ Codex updates the plan

---

### Step 4 — PM Approves Plan → Execution Instruction

Once approved, the PM sends an **implementation instruction**.

This instruction must:
- reference the approved plan
- restrict scope
- forbid new design decisions

---

#### Scope Lock + Test Instruction Block (MANDATORY)

Every implementation instruction MUST include:

### 🎯 Scope Lock (What IS being fixed)
- Explicit list of ONLY the elements being changed in this pass

### 🚫 Not In Scope (What is NOT being fixed)
- Explicit list of commonly confused items that are intentionally excluded

### 🧪 Test Checklist (30–60 seconds)
- 3–6 checks maximum
- Each check must map directly to a scoped change
- No broad page review

This block is required to prevent misaligned testing and unnecessary iteration loops.

---

### Step 5 — Codex Executes

Codex implements:
- exactly the approved plan
- no additional interpretation

Codex returns a **PM REVIEW PACKET**.

---

### PM Review Packet Requirement (MANDATORY)

Codex MUST return a **PM REVIEW PACKET** for every implementation.

The packet must include:

1. What changed (scoped only)
2. Confirmation that scope was respected
3. Confirmation that no unrelated areas were modified
4. Any risks or edge cases

If the PM REVIEW PACKET is missing:
→ the task is considered incomplete

---

### Step 6 — Oliver Runs UI Test

Oliver performs **only the requested checks**. Oliver must follow the Scope Lock and Test Checklist strictly and ignore any UI outside the defined scope.

Example:

- cold load
- warm load
- one interaction

Returns:
- PASS / FAIL
- screenshot

---

### Step 7 — PM Reviews Result

PM compares:
- UI output vs specs
- UI output vs approved plan

PM determines:
- pass
- or next correction pass

---

### Step 8 — Repeat or Close

- If correct → move forward
- If incorrect → return to Plan Mode (NOT blind execution)

---

# Rules For Efficient Iterations

## Rule 0 — Plan First (MANDATORY)

All non-trivial tasks must start in Plan Mode.

No UI implementation should occur without:
- an explicit plan
- PM approval

If a task skips Plan Mode and results in drift:
→ return to Plan Mode immediately

---

## Rule 0A — Scoped Testing Only

UI validation must ONLY cover what is listed in the Scope Lock.

If something was not part of the scoped change:
→ it must not be treated as a failure

If confusion arises:
→ return to PM for clarification instead of expanding the test scope

---

## Rule 1 — Single Surface Fixes

Each Codex task must target **one surface only**.

Examples:

- Mailbox Intelligence
- Cleanup Groups
- Sender Decisions

Never all at once.

If scope becomes unclear, stop and return to Plan Mode before continuing.

---

## Rule 2 — No Multi‑Subsystem Changes

Avoid changes across:

- runtime
- UI
- ingestion
- analytics

in the same task.

That slows testing.

---

## Rule 3 — UI Tests Must Be Narrow

Each UI test should take **under 2 minutes**.

Example:

Test only:

1. page load speed
2. chart filter click

Not the entire system.

If a test exceeds 2 minutes or requires checking multiple sections, the scope definition is incorrect and must be rewritten.

---

## Rule 4 — Screenshots Over Explanation

Screenshots are preferred over long written explanations.

The PM will interpret them.

---

## Rule 5 — PM Owns Product Vision

Oliver provides observations.

The PM determines:

- what is correct
- what is wrong
- what Codex must change

---

# Expected UI Test Output Format

Oliver should respond with:

```
PASS or FAIL

Cold Load Time:

Warm Load Time:

What was clicked:

Screenshot attached

Terminal output attached (if relevant)
```

Nothing else required.

---

# When To Stop Testing

If any of these occur:

- crash
- blank page
- console error

Testing can stop immediately.

Report the issue.

---

# Future Improvements

Later versions of this protocol may include:

- automated UI validation
- screenshot diff detection
- AI‑assisted product review

But for now this **human‑in‑the‑loop system is the fastest method**.

---

# Location

This document lives in:

`ai-agent-platform-docs/08_codex_instructions/`

Future project managers must follow this protocol when working with Codex.

---

# Quick UI Test Checklist (2‑Minute Protocol)

This is the **fast execution checklist** Oliver should use during every UI validation.  
It mirrors the protocol above but reduces the process to a quick repeatable routine.

Oliver should keep this checklist open while testing.

---

## Step 1 — Open Target Page

Navigate to the page specified by the Project Manager.

Example:

- `/operations/intelligence`
- `/operations/clusters`
- `/operations/review?stage=senders`

Do **not test other pages** unless explicitly requested.

---

## Step 2 — Measure Cold Load

Reload the page once.

Record:

- approximate load time
- whether page shows blank loading state

Example output:

```
Cold Load Time: ~3 seconds
```

---

## Step 3 — Measure Warm Load

Refresh the page again.

Record:

```
Warm Load Time: instant
```

---

## Step 4 — Click Requested Interactions

Only click what the PM asked for.

Examples:

- click chart filter
- click "Resume sender review"
- open cleanup group

Do not explore unrelated UI.

---

## Step 5 — Check for Errors

Look for:

- console errors
- blank UI
- broken filters
- unexpected reloads

If any appear, testing can stop.

---

## Step 6 — Report Result

Use the following format:

```
PASS or FAIL

Cold Load Time:

Warm Load Time:

What was clicked:

Screenshot attached

Terminal output attached (if relevant)
```

---

Note:
- Only report on scoped checks
- Do not include unrelated UI feedback

---

## Target Testing Time

Each test cycle should take:

**30–90 seconds maximum**.

If testing takes longer, the scope is too large and must be narrowed in the next Codex instruction.

---

## Why This Exists

This checklist prevents:

- 15‑minute UI reviews
- repeated explanations
- scope creep

The Project Manager performs the **thinking and product evaluation**.

Oliver performs **fast validation only**.

---

# Plan Mode Integration Summary

This protocol now operates under a **Plan → Approve → Execute → Validate** model.

Key principles:

- The Project Manager owns thinking and design decisions
- Codex executes approved plans only
- Oliver validates behavior quickly

Plan Mode ensures:

- no UI drift
- no ambiguous visuals
- fewer iteration cycles
- consistent design across all workspaces

This system is required for scaling the platform across:

- Gmail
- Tax
- Ads
- CRM
- Future AI workspaces

Plan Mode is now the **default entry point** for all complex tasks.

---

# Scoped Validation Integration

This protocol now enforces:

Plan defines → WHAT is built  
Scope Lock defines → WHAT is tested

Together they ensure:

- no wasted validation effort
- no frustration from out-of-scope checks
- faster convergence to correct UI

Scoped validation is now REQUIRED for all implementation passes.

---

# Sniper Method Integration

This protocol now operates under strict sniper execution:

- One surface per pass
- One problem per pass
- One measurable outcome per pass

This ensures:

- no repeated regressions
- no scope confusion
- faster iteration cycles

If a task attempts to modify multiple areas:
→ it must be rejected and rewritten as separate sniper passes

---