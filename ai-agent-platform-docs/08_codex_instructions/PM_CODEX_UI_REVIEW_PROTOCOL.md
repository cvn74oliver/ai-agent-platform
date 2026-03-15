

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

## Codex — Implementation Engine

Responsibilities:

- Implement exactly what the PM specifies
- Stay inside the scope defined
- Produce a PM Review Packet
- Run lint and type checks

Codex should **not redesign the product**.

---

# Standard Iteration Cycle

Every iteration follows the same structure.

### Step 1 — PM Creates Codex Task

The PM sends a tightly scoped instruction to Codex.

Example scope:

- Mailbox Intelligence UI only
- Runtime caching only
- Sender Decisions analytics only

Never multiple subsystems at once.

---

### Step 2 — Codex Executes

Codex returns a **PM Review Packet** including:

- Phase
- Summary
- Files modified
- Validation steps
- Known limitations

Oliver pastes this packet into the PM chat.

---

### Step 3 — Oliver Runs UI Test

Oliver performs **only the requested checks**.

Example test scope:

Check only:

1. Cold load time
2. Warm load time
3. Whether filter works

Oliver then returns:

PASS / FAIL

plus screenshot evidence.

---

### Step 4 — PM Performs Review

The PM analyzes:

- UI screenshots
- system behavior
- product architecture alignment

The PM determines:

- what improved
- what regressed
- what must change

---

### Step 5 — Next Codex Instruction

The PM writes the next Codex message.

The cycle repeats.

---

# Rules For Efficient Iterations

## Rule 1 — Single Surface Fixes

Each Codex task must target **one surface only**.

Examples:

- Mailbox Intelligence
- Cleanup Groups
- Sender Decisions

Never all at once.

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

Keep the report under **5 lines if possible**.

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