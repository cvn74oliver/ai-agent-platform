# AI Agent Platform — Codex Execution Protocol

**Purpose:** This document defines exactly how Oliver + Project Manager (PM) + Codex collaborate so Codex accelerates development **without** causing architectural drift.

Codex is powerful. This protocol is the guardrail.

---

## 1. ROLES

### ChatGPT / PM
- Architect + planner
- Risk controller
- Scope / feature-boundary manager
- Writes Codex tasks (structured)
- Verifies outputs + regression risk

### Codex
- Code writer + multi-file editor
- Terminal executor (when available)
- Debug loop runner (within scope)
- Refactor engine (only when explicitly requested)

**Rule:** Codex executes. PM designs. Oliver approves the domain.

---

## 2. FEATURE DOMAIN CONTROL (PLAIN ENGLISH VERSION)

A **Feature Domain** simply means:

→ The specific **PART OF THE PLATFORM** we are editing right now.

It does **NOT** mean:
- A separate AI model
- A special Codex configuration
- A hidden system layer
- A different OpenAI key

It ONLY means:

> “What area of the app are we modifying?”

That’s it.

### Official Feature Domains

These are the ONLY domains in this system:

1. **RAG Ingestion & Retrieval**
   - Drive scraping
   - Web crawling
   - Embedding generation
   - Chunking logic
   - `rag_documents`
   - `rag_jobs`
   - Retrieval queries

2. **Prompt Contract / Summary Rewrite Engine**
   - `onboarding_summary`
   - `recalculate-quality` route
   - Prompt Engineer logic
   - Preservation rules
   - Guardrails merging
   - Quality scoring

3. **Fine-Tuning System**
   - `fine_tune_examples`
   - Training orchestration
   - Dataset preview
   - Coverage logic
   - Feedback ingestion

4. **Agent Runtime (Production Inference)**
   - Live agent responses
   - Prompt assembly
   - RAG retrieval at runtime
   - Inference pipeline

5. **Workflow / Automation Engine**
   - Activepieces / Make integrations
   - Trigger logic
   - External tool calls
   - Webhooks

6. **Dashboard Intelligence Layer**
   - Usage stats
   - Analytics
   - Reporting
   - Training readiness panels

7. **Runtime Operations & External Integrations**
   - Gmail runtime tools (analyze_inbox, review_sender_cluster, archive_messages)
   - Approval / execution workflow
   - agent_events lifecycle (approval_request → approval_decision → execution_result)
   - External API integrations (Google, future tools)
   - Runtime action evidence + lifecycle tracking

These domains are **structural boundaries**.
They map directly to parts of the codebase.

---

## 3. HOW OLIVER USES FEATURE DOMAINS

Oliver’s workflow:

1. Decide which part of the platform we are editing.
2. Open the correct Codex chat session.
3. Name that session after the domain.
   - Example: `RAG — Drive PDF parsing`
   - Example: `Prompt Engine — Rewrite logic`
4. Attach ONLY the files related to that domain.
5. Do not mix domains inside one Codex thread.

---

## 4. HOW CODEX KNOWS WHAT IT IS ALLOWED TO TOUCH

Codex **does not** automatically understand your architecture.

Codex only sees:
- The files you attach (explicit @file list)
- The instructions you provide in the task

Codex does NOT:
- See the entire repo automatically
- Know which system layer it is in
- Infer architecture boundaries

**Hard Rule:** If a file is not attached, Codex must not modify it.

---

## 5. ONE THREAD = ONE DOMAIN

A single Codex chat session must only touch **one** of the six domains.

If we need another domain:
1. Stop.
2. Open a new Codex chat session.
3. Name it after the new domain.
4. Attach only those files.

This prevents architectural drift.

---

## 6. REASONING LEVEL REQUIREMENT

Every Codex task must include **exactly one** reasoning level:

- **LOW**
  - UI tweaks
  - Minor text changes
  - Small non-logic edits

- **MEDIUM**
  - Single route modifications
  - Isolated feature changes

- **HIGH**
  - Multi-file logic adjustments
  - Retrieval logic changes
  - Internal API changes

- **EXTRA-HIGH**
  - Schema changes
  - Architectural shifts
  - Cross-domain rewrites
  - Contract field logic modifications

**EXTRA-HIGH requires explicit confirmation before execution.**

---

## 7. TASK STRUCTURE REQUIREMENT

Every Codex task must include:

1) Reasoning Level
2) Feature Domain
3) Explicit file list using `@file` references
4) Objective block:
   - What is wrong
   - Desired outcome
   - Constraints (what must NOT be changed)
   - Performance considerations
   - Regression protections

When the task involves **runtime automation or external integrations** (for example Gmail actions, workflow triggers, or external APIs), the objective must also explicitly include:
- Execution surface (API route or worker responsible)
- Expected event logging behavior (agent_events entries)
- UI state changes or evidence rendering expectations

Codex must not infer intent.

---

## 8. ARCHITECTURAL PROTECTION RULES

The following systems are canonical:
- Q&A-derived contract fields
- Guardrails
- Escalation policies
- Preservation merge logic

RAG is supplemental.
Fine-tune is separate.
Workflow logic is separate.

Codex must never:
- Shrink contract fields silently
- Remove escalation logic
- Delete guardrails
- Override preservation logic
- Refactor outside scope

---

## 9. SCHEMA MODIFICATION RULE

Schema changes require:
- EXTRA-HIGH reasoning level
- Explicit PM approval
- Update to:
  - `schema_comparison_checklist.md` (if present)
  - `CHANGELOG.md`
  - `CURRENT_STATE.md`

No schema drift.

---

## 10. RATE LIMIT DISCIPLINE

Codex usage consumes:
- 5-hour limit
- Weekly limit

PM must:
- Choose the lowest viable reasoning level
- Break big tasks into smaller sequential tasks
- Avoid unnecessary retries
- Warn before high-cost execution
- Prefer delegating large multi‑file edits to Codex rather than manual edits by Oliver

If a task risks heavy usage, say:

> “This is an EXTRA-HIGH reasoning task and may consume significant rate limit. Confirm before proceeding.”

---

## 11. FAILURE HANDLING

If Codex fails twice on the same issue:
1. Stop.
2. Summarize:
   - What failed
   - Where
   - Why
3. Return control to PM for clarification.
4. Do not continue blind retries.

---

## 12. EXECUTION STANDARD

Codex must:
- Write code
- Run required terminal commands (when available)
- Validate compile output
- Resolve type errors
- Confirm working state
- Report success cleanly

Avoid long manual back-and-forth debug cycles unless something is ambiguous.

---

## 13. CODEX SESSION HEADER (PASTE AT TOP OF EVERY NEW CODEX THREAD)

```text
Codex Execution Mode

You are operating under the AI Agent Platform Codex Execution Protocol.

Rules:
- Only modify explicitly attached files.
- Do not expand scope beyond the declared objective.
- Do not create new files unless authorized.
- Do not refactor outside the declared feature domain.
- Stop immediately if architecture intent is unclear.

Wait for structured task.
```

---

## 14. SIMPLE CODEX EXECUTION CHECKLIST (FOR OLIVER)

Before running a Codex task:

- [ ] Feature Domain declared
- [ ] Reasoning level declared
- [ ] Files explicitly listed with @ references
- [ ] Objective clearly stated
- [ ] No cross-domain drift

If any box is unchecked, do NOT proceed.

---

## 15. SUPABASE / DATABASE WORKFLOW (IMPORTANT CLARIFICATION)

### Does Codex “have access to Supabase”?
- Codex does **not** automatically have access to your Supabase Dashboard in Chrome.
- Codex can work with Supabase **through the terminal** if you provide:
  - the right files (migrations, schema SQL, etc.), and/or
  - the Supabase CLI setup details.

### Docker: do you need it?
**No, not always.**

You only need Docker if you want to run **local Supabase**:
- `supabase start`
- `supabase stop`
- `supabase status`
- local db reset / local services

If you only want to operate against **hosted Supabase** (remote project), Docker is NOT required.

### Hosted Supabase (no Docker required)
Use these patterns:
- `supabase login`
- `supabase link --project-ref <ref>`
- migrations / SQL applied to the remote DB (via CLI workflows)

Note: `supabase status` is primarily for local stack health and will fail without Docker.

### If we do schema work
Schema changes are EXTRA-HIGH and must:
- be explicitly approved
- be written as migrations (preferred)
- be logged in `CHANGELOG.md` + `CURRENT_STATE.md`

---

## 16. FINAL PRINCIPLE

Codex executes.
PM designs.
Oliver approves the domain.

This protocol overrides convenience shortcuts.

---

## 17. PROJECT MANAGER VERSION HANDOFF

Project Managers operate in versions (PM‑V1, PM‑V2 … PM‑V8) to avoid context drift.

When handing off between PM versions:

1. Update the following documents before switching sessions:
   - CHANGELOG.md
   - TODO.md
   - CURRENT_STATE.md
   - SYSTEM_OVERVIEW.md
   - OPERATIONAL_WORKFLOW.md
   - AUTOMATION_MAP.md

2. Ensure new architectural systems are documented, including:
   - Runtime action systems
   - External integrations
   - Approval / execution pipelines

3. The new PM must review these documents before issuing Codex tasks.

4. Codex tasks should **not resume until documentation handoff is complete**.

This prevents architecture loss between long development sessions.
