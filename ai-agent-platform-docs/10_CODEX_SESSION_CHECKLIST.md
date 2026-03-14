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
- Runtime Operations & External Integrations
- Workflow / Automation Engine
- Dashboard Intelligence Layer

Never mix domains inside one Codex session.

Runtime Operations includes:
- Gmail runtime tools (analyze_inbox, review_sender_cluster, archive_messages)
- Approval → decision → execution lifecycle
- agent_events evidence tracking
- External API integrations (Google, future tools)

This domain was introduced after the original architecture and must be treated as separate from Agent Runtime.

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

## ✅ STEP 3A — Terminal + Supabase (Only If Needed)

**Codex can only run terminal commands if it has terminal access in that session.**
- If the session does not include terminal execution, Codex must provide commands and **ask the Project Manager/Oliver to run them**.

### Do we need Docker?
- **NO** for hosted Supabase-only work (remote DB). You can still create/apply migrations to the hosted database via Supabase CLI/SQL.
- **YES** only if you want **local Supabase** (containers) for offline testing, `supabase start`, and local DB diff workflows.

### Schema changes (EXTRA-HIGH)
If a task touches schema/RLS/migrations:
- Reasoning Level must be **EXTRA-HIGH**
- Must include a **rollback plan** and **explicit approval** before execution.

### Hosted Supabase schema workflow (no Docker)
When changing schema against hosted Supabase:
- Create a migration file (SQL)
- Apply it to the hosted DB (or provide the exact SQL to run in the Supabase SQL editor)
- Verify with a post-check query

**Never** silently change schema as a “side quest.”

---

## ✅ STEP 4 — State the Objective Clearly

Every Codex task must include:

- What is wrong
- What the desired outcome is
- What must NOT change
- Any performance constraints
- Any regression protection rules
- Execution surface (API route / worker / integration layer) when runtime tools are involved

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

## ✅ STEP 6 — Documentation Synchronization + Session Closing (MANDATORY)

After every major milestone, before thread close:
- Update authoritative docs in `ai-agent-platform-docs/` first.
- Do **not** use `/web/docs` as source-of-truth edit target.
- Preserve existing content and perform targeted edits only.
- Prepare a short handoff note for the next thread.

File-specific safety rules:
- `CHANGELOG.md` → append-only; never rewrite/delete historical entries.
- `CURRENT_STATE.md` → update targeted sections only.
- `system_overview.md` → architecture deltas only.
- `operational_workflow.md` → process/workflow changes only.
- `automation_map.md` → automation/system-sync changes only.
- `TODO.md` → keep open items unless completed, replaced with a more specific task, or explicitly removed with rationale.

Session close is not complete until these documentation checks are done.

PM REVIEW PACKET requirement:
- Before closing any major Codex session, Codex must return a final `PM REVIEW PACKET` block (as defined in `09_CODEX_EXECUTION_PROTOCOL.md`).
- The packet is mandatory handoff output for Oliver → Project Manager copy/paste.

PM REVIEW PACKET GENERATION (MANDATORY)

Before finalizing any major Codex pass:

Run:

`npm --prefix web run review-packet`

Use the output of this command to populate the final PM REVIEW PACKET section of the Codex response.

Rules:
- The packet must follow the 10-section PM REVIEW PACKET structure defined in the Codex Execution Protocol.
- Raw diffs should not be pasted unless explicitly requested.
- The packet must be understandable in plain text without color formatting.

Purpose:
This guarantees that Oliver can copy/paste Codex responses directly into the Project Manager chat without sending full files or diffs.

---

## 🛑 HARD STOP CONDITIONS

Immediately halt execution if:

- A schema migration is implied unexpectedly
- RLS policies are affected
- Multiple domains become involved
- Prompt guardrails are being removed
- Escalation logic is being weakened
- Core contract fields are being reduced
- A schema change is requested but there is no rollback plan

Return to Project Manager for review.

---

## 🧭 Project Manager Version Handoff Safety

When a Project Manager version changes (ex: PM‑V7 → PM‑V8), the following files MUST be updated before any new Codex task begins:

- CHANGELOG.md
- TODO.md
- CURRENT_STATE.md
- SYSTEM_OVERVIEW.md
- OPERATIONAL_WORKFLOW.md
- AUTOMATION_MAP.md
- PROJECT_MANAGER_CONTEXT.md

This ensures the next PM inherits the correct architectural state and prevents Codex from executing against outdated assumptions.

Codex sessions must not begin until documentation handoff is complete.

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
- Confirm no schema changes occurred (unless explicitly approved and logged)
- Confirm authoritative documentation synchronization is complete (`ai-agent-platform-docs/` first)
- Confirm `/web/docs` was not edited as source of truth
- Confirm final response includes a complete `PM REVIEW PACKET`

Then:
→ Return to Project Manager
→ Update authoritative documentation safely
→ Prepare handoff note for next thread
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
Feature Domain: <CHOOSE ONE — RAG | Prompt Contract | FineTune | Agent Runtime | Runtime Ops | Workflow | Dashboard>
Reasoning Level: <LOW | MEDIUM | HIGH | EXTRA-HIGH>
Terminal Access: <YES | NO> (If NO, Codex must output exact commands for Oliver to run.)

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

## ⚠️ Multi‑File Edit Rule

If a change requires edits across multiple files:

→ Use Codex
→ Do NOT perform manual edits

If a change touches only a single file and is clearly scoped:

→ The Project Manager may edit via the VS Code Builder integration.

This rule prevents partial edits and architecture drift.
