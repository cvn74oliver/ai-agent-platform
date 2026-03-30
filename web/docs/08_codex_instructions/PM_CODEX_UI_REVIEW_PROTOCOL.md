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

# 🚨 CRITICAL GUARDRAIL — "DO NOT TOUCH RUNNING SYSTEMS"

## Rule 0C — Active Process Protection (MANDATORY)

When ANY long-running process is active (examples below), the system enters **PROTECTED MODE**.

### Examples of protected processes:
- Gmail full mailbox reindex
- Historical backfill
- Long-running ingestion jobs
- Any process expected to run > 2 minutes

---

## 🚫 During PROTECTED MODE, the following are FORBIDDEN:

- Restarting the dev server
- Running `npm run dev`
- Triggering rebuilds
- Changing environment variables
- Running migrations
- Touching Supabase schema
- Triggering parallel indexing jobs
- Executing unrelated Codex tasks that may affect runtime

---

## ✅ ONLY allowed actions during PROTECTED MODE:

- UI-only work (no backend impact)
- Documentation updates
- Planning tasks (Plan Mode only)
- Observing logs / status
- Taking screenshots

---

## 🔥 If a violation occurs:

Expected consequence:
- Index resets
- Checkpoints lost
- Hours of work wasted

This is considered a **critical workflow failure**.

---

## 🧠 PM Responsibility

Before issuing ANY Codex instruction, the PM MUST ask:

> "Is a long-running process currently active?"

If YES:
→ The task MUST be postponed OR rewritten as UI-only / documentation-only

---

## 🧪 Oliver Responsibility

If a long-running process is active:
- DO NOT run any Codex instruction unless PM explicitly confirms it is safe
- When unsure → ASK before executing

---

## 🧩 Codex Responsibility

If the instruction would:
- restart server
- affect runtime
- modify ingestion

Codex MUST:
- warn before execution
- OR refuse execution if unsafe

---

## 🧱 SYSTEM PRINCIPLE

> "Never sacrifice a running data process for an unrelated improvement."

---

## 🔁 WHY THIS EXISTS

This rule prevents:
- repeated full reindex restarts
- lost checkpoints
- multi-hour productivity loss
- emotional frustration and burnout

---

## 💡 SIMPLIFIED RULE

If something is currently **running and taking time**:

👉 **Do not touch anything that could affect it.**

---

## 🏁 PM v11 Turnover Addendum — UI Review Discipline (March 26, 2026)

### Current Phase Context

We are now in **Phase 1B — UI usability and runtime reliability**.

Implication:
- UI review must prioritize **real user interaction**, not static visuals
- Screenshots alone are NOT sufficient to validate correctness

---

### Updated UI Review Standard (CRITICAL)

A UI change is NOT complete when:
- it looks correct in screenshots

A UI change IS complete only when:
- user interaction works end-to-end
- no runtime errors occur
- data displayed matches expected behavior (or divergence is explained)

---

### Required UI Validation Layers

Every UI review must validate ALL three layers:

1. **Visual Layer**
   - layout
   - hierarchy
   - readability

2. **Interaction Layer**
   - clicks
   - transitions
   - loading behavior
   - state changes

3. **Data Truth Layer**
   - counts
   - sender lists
   - preview data
   - consistency between UI sections

---

### ⚠️ Known UI Truth Pattern (Phase 1B)

The system currently uses a **hybrid truth model**:

- Top UI (hierarchy) = artifact truth
- Bottom UI (sender list) = runtime truth

Rule:

- If values differ → UI must explain the difference
- UI must NEVER imply both values are identical if they are not

---

### 🚨 Common UI Review Failure Modes

1. **“Looks correct” approval without clicking through**
2. **Ignoring loading states (slow or stuck behavior)**
3. **Accepting mismatched data without explanation**
4. **Validating only first screen, not full flow**

---

### 🔍 Required Testing Behavior (PM + Operator)

For each UI change:

- Click through every interactive element
- Test at least:
  - one large dataset
  - one small dataset
  - one edge case (e.g., no results, protected sender)
- Observe:
  - load time
  - state transitions
  - error messages

---

### 🎯 Current UI Focus Areas

- Subtype hierarchy interaction
- Sender list filtering behavior
- Decision card loading and preview evidence
- Sender → decision flow continuity

---

### 🧠 Final UI Rule

> If the user cannot trust what they see, the UI is not complete.

---