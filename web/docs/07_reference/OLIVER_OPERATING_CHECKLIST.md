# Oliver Operating Checklist

## Purpose
This checklist defines exactly how Oliver operates within the AI Agent Platform system.

It ensures:
- no manual document management
- no memory-based coordination
- no system drift
- consistent execution flow

---

# 🔁 CORE OPERATING LOOP

## Step 1 — Discuss & Decide

Talk with Project Manager (PM).

Goal:
- clarify direction
- define changes
- confirm what needs to happen

---

## Step 2 — Check: Did System Truth Change?

Ask:

👉 “Did this change system behavior, architecture, workflow, or docs?”

If NO:
- proceed normally

If YES:
- PM MUST update `ACTIVE_CHANGE_EVENTS.md`

---

## Step 3 — Confirm Change Event Exists

Before execution:

👉 Ensure change is logged in:
- `ACTIVE_CHANGE_EVENTS.md`

If not:
- STOP
- tell PM to log it

---

## Step 4 — Choose Skill

PM must select ONE:

- implementation_pass → build something
- change_propagation_pass → update docs
- turnover_pack_builder → prepare handoff

---

## Step 5 — Run Codex

PM sends structured Codex instruction using selected Skill.

Codex must:
- execute
- update docs
- propagate changes
- return PM REVIEW PACKET

---

## Step 6 — Review Output

Oliver checks:
- does it match intent?
- does it follow scope?
- are docs updated?

Approve or refine.

---

# 🚨 CRITICAL RULES

## Rule 1 — No Change Without Logging
If it's not in `ACTIVE_CHANGE_EVENTS.md`, it does not exist.

## Rule 2 — No Manual Doc Updates
Oliver does NOT manually update:
- CURRENT_STATE.md
- TODO.md
- system_overview.md
- any system doc

Codex handles this.

## Rule 3 — No Memory-Based Coordination
Do NOT rely on:
- chat history
- memory
- assumptions

Always rely on:
- control plane
- routing system

## Rule 4 — No Direct Codex Jump
PM must:
- define scope
- choose Skill
- THEN call Codex

---

# 🧠 WHAT OLIVER DOES

Oliver:
- defines direction
- approves decisions
- reviews output

Oliver does NOT:
- manage documents
- track propagation manually
- coordinate files

---

# 🔁 FAILURE RECOVERY

If system feels off:

1. Check `CURRENT_STATE.md`
2. Check `TODO.md`
3. Check `ACTIVE_CHANGE_EVENTS.md`

If mismatch:
👉 run `change_propagation_pass`

---

# 🎯 SIMPLE RULE

Talk → Log → Skill → Codex → Review

That is the entire system.