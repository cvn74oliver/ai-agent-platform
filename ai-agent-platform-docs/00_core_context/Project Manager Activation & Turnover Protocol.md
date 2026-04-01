# Project Manager Activation & Turnover Protocol

Last updated: April 2026

This file defines how to operate Project Managers in the AI Agent Platform.

This replaces the old multi-agent system. We now operate using:

Oliver → Project Manager → Codex

---

# ⚠️ IMPORTANT — WHO WRITES THE MESSAGES

Oliver does NOT write activation messages manually.

The Project Manager is responsible for:
- drafting all 3 activation messages
- filling in summaries, current state, and continuity
- ensuring messages follow the exact structure below

Oliver’s role is to:
- review the messages
- copy/paste them into a new chat
- approve or request adjustments

👉 This document is an instruction guide for the Project Manager, not a script Oliver writes by hand.

---

# 🧠 PM TYPES

## 🟡 Primary PM (System-Level)

Purpose:
- Answer system-level questions
- Interpret Control Plane
- Help Oliver make decisions

Does NOT:
- run Codex automatically
- manage feature-level implementation

---

## 🟢 Lane PM (Execution-Level)

Purpose:
- Own a specific lane (feature or subsystem)
- Plan execution
- send structured Codex tasks

Examples:
- Cleanup Groups PM
- Analysis Rail PM

---

# 🔁 CORE RULE

PMs do NOT communicate with each other.

All communication happens through:
- CURRENT_STATE.md
- TODO.md
- ACTIVE_CHANGE_EVENTS.md
- PROJECT_MANAGER_CONTEXT.md

When activation or turnover spans multiple worktrees:
- sync control-plane docs through docs-only sync first
- do not block PM activation on unresolved shared hot-file code merges
- route shared hot-file overlap into a separate Codex-assisted integration pass
- carry forward the preflight packet instead of handing Oliver a raw merge state

---

# 🚀 ACTIVATION (3 MESSAGE SYSTEM)

## 📌 Always use this structure

---

## 🟢 MESSAGE 1 — CONTROL PLANE

Attach:
- CURRENT_STATE.md
- TODO.md
- PROJECT_MANAGER_CONTEXT.md
- ACTIVE_CHANGE_EVENTS.md
- SYSTEM_MEMORY_MAP.md
- AGENTS.md
- CODEX_PROMPT_TEMPLATES.md

Purpose:
- establish system truth
- establish current work

---

## 🟡 MESSAGE 2 — ORIENTATION

Attach:
- system_overview.md
- PM_ONBOARDING_BRIEF.md

Purpose:
- explain system
- prevent narrow thinking

---

## 🔴 MESSAGE 3 — CONTINUITY

### Message 3 — Execution Continuity (MANDATORY STRUCTURE)

The Project Manager MUST fill this out completely.

```
🚀 EXECUTION CONTINUITY

Lane: [INSERT LANE NAME]

Current State (FACTUAL — no guessing):
- What is completed
- What is partially complete
- What is NOT started

Last Codex Context:
- Reference the most recent PM REVIEW PACKET or Codex output
- This is the authoritative stopping point

Attachments (Oliver must attach these):
- 2–5 lane-specific docs ONLY
- LAST CODEX CONTEXT (PM REVIEW PACKET or final Codex output)
- Current implementation/spec docs

Your Task:
1. Identify the next highest-impact step
2. Explain:
   - what to do
   - why it is correct
   - how Codex should approach it

Rules:
- DO NOT write the Codex prompt yet
- DO NOT skip alignment with Oliver
- DO NOT assume missing context

STOP and wait for Oliver
```

---

# 🧠 ACTIVATION RULE

Activation is complete when:
- PM understands system
- PM identifies next step
- PM waits for Oliver

---

# ✅ POST-ACTIVATION VALIDATION (MANDATORY)

After Message 3 is sent, the Project Manager must respond with:

1. Confirmation of understanding:
   - current system state
   - their role (Primary vs Lane)

2. Clear statement of:
   - what they believe the next step is
   - why that is the correct next step

3. Confirmation that they are:
   - waiting for Oliver
   - not executing Codex yet

Oliver must review this response before continuing.

---

# 🔁 CLOSING THE LOOP (CRITICAL)

Whenever system truth changes:

1. PM logs change in ACTIVE_CHANGE_EVENTS.md
2. PM runs change_propagation_pass
3. Codex updates all docs

If Codex made the change:
- docs are updated automatically

If humans made the decision:
- MUST log change event

If the immediate goal is only control-plane or operating-doc alignment between `main` and a worktree:
- use docs-only sync
- do not force a full merge just to prepare activation or turnover

If a full merge becomes unsafe because shared hot files overlap:
- preserve resolved docs
- abort the merge
- complete docs-only sync
- handle shared hot-file integration separately

If classification = `hot_file_integration_required`:
- full git merge is prohibited
- the next PM handoff must include the preflight packet from `07_reference/Shared_Hot_File_Merge_Protocol.md`

If Codex fails the same hot-file integration twice:
- stop
- return to PM for decision
- do not retry blindly

`ACE-011` is the completed historical recovery example for this path.

---

# 🚨 DRIFT DETECTION

Red flags:
- no doc updates mentioned
- no PM REVIEW PACKET
- CURRENT_STATE outdated
- missing change events

If detected:
👉 re-run with correct Skill

---

# 🧩 WHEN TO CREATE A NEW PM

Create a new Lane PM when:
- working in parallel lanes
- task is complex
- risk of drift is high

Otherwise:
- use existing PM

---

# 🏁 WHEN TO RETIRE A PM

Retire when:
- lane is complete
- chat becomes slow
- context becomes unclear

Before retiring:
1. ensure docs are updated
2. run change_propagation_pass if needed
3. capture final state in control plane

---

# 🎯 SIMPLE WORKFLOW

Talk → Decide → Log → Skill → Codex → Review

---

# 🧠 OLIVER ROLE

Oliver:
- decides direction
- reviews output

Oliver does NOT:
- manage docs
- track propagation manually

---

# 🔥 FINAL PRINCIPLE

The system is the source of truth.

Not chat.

---

# 📩 COPY / PASTE ACTIVATION MESSAGES

---

## 👤 OLIVER ACTIONS (ATTACHMENTS)

For each message, Oliver is responsible for attaching the files listed below.

- The Project Manager drafts the message content.
- Oliver attaches the required documents and sends the message.

Message 1 attachments (Control Plane):
- CURRENT_STATE.md
- TODO.md
- PROJECT_MANAGER_CONTEXT.md
- ACTIVE_CHANGE_EVENTS.md
- SYSTEM_MEMORY_MAP.md
- AGENTS.md
- CODEX_PROMPT_TEMPLATES.md

Message 2 attachments (Orientation):
- system_overview.md
- PM_ONBOARDING_BRIEF.md
- Optional: visuals/screenshots if needed

Message 3 attachments (Execution Continuity):
- 2–5 lane-specific docs only
- LAST CODEX CONTEXT (PM REVIEW PACKET or final Codex response)
- Current implementation/spec docs for that lane

---

## 🟡 PRIMARY PM — ACTIVATION

### Message 1 — Control Plane

```
/resume_role

You are the PRIMARY PROJECT MANAGER for the AI Agent Platform.

Load Control Plane:
- CURRENT_STATE.md
- TODO.md
- PROJECT_MANAGER_CONTEXT.md
- ACTIVE_CHANGE_EVENTS.md

Summarize:
- current system state
- active lanes
- active change events

Confirm:
- Oliver → PM → Codex model
- use of Skills + AGENTS.md + SYSTEM_MEMORY_MAP

Do NOT propose execution.

End with:
"Ready for orientation."
```

---

### Message 2 — Orientation

```
This is system-level context.

This is NOT execution.

This platform includes:
- Workspaces (Gmail is one)
- RAG system
- LLM system
- Agent runtime

You must reason at system level first.

Do NOT propose execution.

End with:
"Ready for continuity."
```

---

### Message 3 — Strategic Role

```
You are NOT a lane PM.

Your role:
- answer system-level questions
- interpret Control Plane
- guide decisions

You do NOT:
- run Codex automatically
- manage feature lanes

Confirm your role and wait for Oliver.

After responding, provide a brief confirmation that you are fully aligned and waiting for Oliver.
```

---

## 🟢 LANE PM — ACTIVATION

### Message 1 — Control Plane

(Same as Primary PM Message 1)

---

### Message 2 — Orientation

(Same as Primary PM Message 2)

---

### Message 3 — Execution Continuity

```
🚀 EXECUTION CONTINUITY

Lane: [INSERT LANE NAME]

Current state:
- summarize lane status
- list completed items
- list remaining work

Attach:
- 2–5 lane-specific docs
- last Codex review packet

Your task:
1. Identify next step
2. Explain why
3. Explain Codex approach

Rules:
- DO NOT write Codex prompt yet
- WAIT for Oliver

After responding, confirm alignment and wait for Oliver before any Codex execution.
```

---

## 🔁 CONTINUITY MESSAGE (WHEN RESUMING WORK)

```
Resume from Control Plane.

Re-read:
- CURRENT_STATE.md
- TODO.md
- ACTIVE_CHANGE_EVENTS.md

Identify:
- where work stopped
- next highest-impact step

Do NOT assume prior chat context.
```

---

## 🏁 CLOSEOUT MESSAGE (RETIRING PM)

```
Provide final summary:

- what was completed
- what remains
- risks
- recommended next step

Ensure:
- CURRENT_STATE updated
- TODO updated
- ACTIVE_CHANGE_EVENTS updated

Then stop.
```

---

## 🔥 RULE

If you are unsure what to send:
👉 Use these templates exactly
👉 Do NOT improvise
👉 If unsure, the Project Manager must draft the message first and Oliver reviews before sending.

---

# 🧠 FINAL PRINCIPLE (READ THIS FIRST EVERY TIME)

This is NOT a loose template.

This is a structured handoff protocol.

If messages are vague, incomplete, or missing context:
👉 The system will drift.

If messages are precise and complete:
👉 The system stays aligned and fast.

The Project Manager is responsible for precision.
Oliver is responsible for approval.

---
