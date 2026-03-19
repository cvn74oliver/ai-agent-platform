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