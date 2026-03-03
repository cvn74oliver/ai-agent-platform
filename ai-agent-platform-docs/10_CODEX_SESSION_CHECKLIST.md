# 🧠 Codex Session Checklist
(AI Agent Platform — Controlled Execution Protocol)

This checklist must be followed every time a new Codex session is started.

Codex is powerful.
This protects the system from drift, overreach, and architectural damage.

---

## ✅ STEP 1 — Identify the Feature Domain (MANDATORY)

Before starting work, explicitly declare:

Feature Domain:
- RAG Ingestion & Retrieval
- Prompt Contract / Summary Rewrite Engine
- Fine-Tuning System
- Agent Runtime (Production Inference)
- Workflow / Automation Engine
- Dashboard Intelligence Layer

Never mix domains inside one Codex session.

If work crosses domains:
→ STOP  
→ Open a new Codex session  
→ Declare new Feature Domain  

---

## ✅ STEP 2 — Declare Reasoning Level

Choose exactly ONE:

- LOW → UI tweak, styling, small change
- MEDIUM → Single file logic change
- HIGH → Multi-file coordinated change
- EXTRA-HIGH → Schema / architecture change

Default to the LOWEST viable reasoning level.

If EXTRA-HIGH is required:
→ Explicitly confirm before execution.

---

## ✅ STEP 3 — Attach Only Required Files

Codex does NOT see the entire repo automatically.

You must attach:
- Only the files relevant to this task
- Nothing outside the current Feature Domain

If more than 3 files:
→ List them clearly
→ Confirm why each is required

Never assume Codex "knows the architecture."

---

## ✅ STEP 4 — State the Objective Clearly

Every Codex task must include:

- What is wrong
- What the desired outcome is
- What must NOT change
- Any performance constraints
- Any regression protection rules

If constraints are unclear:
→ STOP and clarify before execution.

---

## ✅ STEP 5 — Execute in Contained Mode

Codex must:

- Write code
- Run compile checks
- Fix errors internally
- Confirm working state
- Stop if ambiguity is detected

If Codex fails twice on the same issue:
→ Stop
→ Summarize
→ Return control to Project Manager

---

## 🛑 HARD STOP CONDITIONS

Immediately halt execution if:

- A schema migration is implied unexpectedly
- RLS policies are affected
- Multiple domains become involved
- Prompt guardrails are being removed
- Escalation logic is being weakened
- Core contract fields are being reduced

Return to Project Manager for review.

---

## 🎯 Your Role (Oliver)

Your responsibilities are simple:

1. Choose the Feature Domain.
2. Start the correct Codex chat session.
3. Name the chat session using this format:

   DOMAIN — Short Task Description

   Example:
   RAG — Fix Drive Chunk Deduplication
   FineTune — Improve Coverage Scoring
   Dashboard — Add Training Readiness Graph

4. Attach only the files relevant to that domain.
5. Approve reasoning level if HIGH or above.
6. Stop execution if anything feels unclear.
7. Remember: there is no activation ritual. Your first message is the first scoped task.

You do NOT need to:
- Manage architecture mid-task
- Debug line-by-line
- Rewrite Codex responses manually

If something feels off:
→ Pause  
→ Return to Project Manager  

---

## 🔐 Architectural Protection Rules

Always preserve:

- Q&A-derived contract fields (canonical)
- Guardrails and escalation policy
- Product definitions
- Compliance boundaries

RAG is supplemental.
Fine-tune is behavioral.
Prompt contract is canonical.

Never allow silent shrinkage of core blocks.

---

## 🚀 When Session Is Complete

Before closing a Codex session:

- Confirm feature domain remained contained
- Confirm compile passes
- Confirm no schema changes occurred (unless planned)
- Confirm logs will be updated if architecture changed

Then:
→ Return to Project Manager
→ Update documentation
→ Close session

---

Codex executes.
Project Manager designs.
You approve domain scope.

That separation protects the platform.

---

## 🆕 NEW CODEX SESSION START TEMPLATE (COPY‑PASTE THIS EVERY TIME)

When starting a brand new Codex session, name it correctly and immediately send your first scoped task. There is no pre-activation step.

---

### 1️⃣ Name the Session

Use this format:

`DOMAIN — Short Task Description`

Examples:
- `RAG — Fix Drive Chunk Deduplication`
- `FineTune — Improve Coverage Scoring`
- `Dashboard — Add Training Readiness Graph`
- `Runtime — Fix Streaming Token Bug`

This keeps domains isolated and prevents architectural drift.

---

### 2️⃣ First Message = First Task

There is **no separate activation message** for Codex.

The first message you send in a new session *is the first task*.

Always structure that first task like this:

```
Feature Domain: <CHOOSE ONE>
Reasoning Level: <LOW | MEDIUM | HIGH | EXTRA-HIGH>

Files:
@path/to/file1
@path/to/file2

Objective:
- What is wrong
- What the desired outcome is
- What must NOT change
- Any performance constraints
- Any regression protection rules

Confirm your plan before editing.
```

Do NOT send a separate “activation” prompt.
Do NOT paste unrelated context files.
Do NOT assume Codex sees the full repo.

Every message that asks Codex to modify code is a scoped task.

---