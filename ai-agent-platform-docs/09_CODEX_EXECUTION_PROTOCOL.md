## 2. FEATURE DOMAIN CONTROL (PLAIN ENGLISH VERSION)

A “Feature Domain” simply means:

→ The specific PART OF THE PLATFORM we are editing right now.

It does NOT mean:
- A separate AI model
- A special Codex configuration
- A hidden system layer
- A different OpenAI key

It ONLY means:
“What area of the app are we modifying?”

That’s it.

### 🔹 Official Feature Domains (Defined Clearly)

These are the ONLY domains in this system:

1. RAG Ingestion & Retrieval  
   - Drive scraping  
   - Web crawling  
   - Embedding generation  
   - Chunking logic  
   - rag_documents  
   - rag_jobs  
   - Retrieval queries  

2. Prompt Contract / Summary Rewrite Engine  
   - onboarding_summary  
   - recalculate-quality route  
   - Prompt Engineer logic  
   - Preservation rules  
   - Guardrails merging  
   - Quality scoring  

3. Fine-Tuning System  
   - fine_tune_examples  
   - Training orchestration  
   - Dataset preview  
   - Coverage logic  
   - Feedback ingestion  

4. Agent Runtime (Production Inference)  
   - Live agent responses  
   - Prompt assembly  
   - RAG retrieval at runtime  
   - Inference pipeline  

5. Workflow / Automation Engine  
   - Activepieces / Make integrations  
   - Trigger logic  
   - External tool calls  
   - Webhooks  

6. Dashboard Intelligence Layer  
   - Usage stats  
   - Analytics  
   - Reporting  
   - Training readiness panels  

These domains are structural boundaries.

They are not theoretical.
They map directly to parts of the codebase.

────────────────────────────────────────────────────────────

### 🔹 How Oliver Uses Feature Domains (Simple Process)

Oliver’s workflow should look like this:

1. Decide which part of the platform we are editing.
2. Open the correct Codex chat session.
3. Name that chat session after the domain.
   Examples:
   - “RAG — Embedding Fix”
   - “Prompt Engine — Rewrite Logic”
   - “Fine-Tune — Coverage System”
4. Attach ONLY the files related to that domain.
5. Do not mix domains inside one chat thread.

That is all “Feature Domain Control” means.

────────────────────────────────────────────────────────────

### 🔹 How Codex Knows What It Is Allowed To Touch

Codex does NOT automatically understand the architecture.

Codex only sees:
- The files attached using @ references
- The instructions given in the task

Codex does NOT:
- See the entire repository automatically
- Know which system layer it is in
- Infer architecture boundaries

That is why:
We explicitly list the files in every task.

If a file is not attached, Codex must not modify it.

────────────────────────────────────────────────────────────

### 🔹 One Thread = One Domain Rule

A single Codex chat session must only touch ONE of the six domains above.

If we need to edit another domain:

1. Stop.
2. Open a new Codex chat session.
3. Name it after the new domain.
4. Attach only those files.

No cross-domain mixing.

This prevents architectural drift.

────────────────────────────────────────────────────────────

### 🔹 If Oliver Is Unsure

If unsure at any time, Oliver asks:

“What domain are we in right now?”

The PM must answer clearly using one of the six official domains.

That is the only decision required.

────────────────────────────────────────────────────────────

## 3. REASONING LEVEL REQUIREMENT

Every Codex task must include EXACTLY ONE reasoning level:

LOW
- UI tweaks
- Minor text changes
- Small non-logic edits

MEDIUM
- Single route modifications
- Isolated feature changes

HIGH
- Multi-file logic adjustments
- Retrieval logic changes
- Internal API changes

EXTRA-HIGH
- Schema changes
- Architectural shifts
- Cross-domain rewrites
- Contract field logic modifications

EXTRA-HIGH requires explicit confirmation before execution.

────────────────────────────────────────────────────────────

## 4. TASK STRUCTURE REQUIREMENT

Every Codex task must include:

1. Reasoning Level
2. Feature Domain
3. Explicit file list using @file references
4. Objective block:
   - What is wrong
   - Desired outcome
   - Constraints
   - Performance considerations
   - Regression protections


Codex must not infer intent.

────────────────────────────────────────────────────────────

### 🔹 IMPORTANT: Codex Does NOT “Know the Platform”

Codex does not understand your app unless you tell it.

It does not:
- Know which files belong to RAG
- Know which files belong to fine-tune
- Know which files belong to runtime
- Know your schema protection rules
- Know your preservation logic

It only sees what you attach.

That is why every task MUST:
- Declare the Feature Domain
- Declare the Reasoning Level
- List explicit @file references

Without that structure, Codex will guess.
Guessing causes drift.

────────────────────────────────────────────────────────────

Codex must NOT:
- Modify files not explicitly declared in the task file list.
- Create new files unless explicitly authorized in the task.
- Expand refactors beyond the declared file scope.

### 🔹 SIMPLE CODEX EXECUTION CHECKLIST (FOR OLIVER)

Before running a Codex task, Oliver should confirm:

□ Feature Domain declared  
□ Reasoning level declared  
□ Files explicitly listed with @ references  
□ Objective clearly stated  
□ No cross-domain drift  

If those five boxes are checked, it is safe to execute.

If they are not, do NOT proceed.

────────────────────────────────────────────────────────────

## 5. ARCHITECTURAL PROTECTION RULES

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
- Refactor without scope declaration

────────────────────────────────────────────────────────────

## 6. SCHEMA MODIFICATION RULE

Database schema changes require:

- EXTRA-HIGH reasoning level
- Explicit PM approval
- Update to:
  - schema_comparison_checklist.md
  - CHANGELOG.md
  - CURRENT_STATE.md

No schema drift allowed.

────────────────────────────────────────────────────────────

## 7. RATE LIMIT DISCIPLINE

Codex usage consumes:
- 5-hour limit
- Weekly limit

PM must:
- Choose lowest viable reasoning level
- Break large tasks into sequential smaller tasks
- Avoid unnecessary retries
- Warn before high-cost execution

If a task risks heavy usage:

"This is an EXTRA-HIGH reasoning task and may consume significant rate limit. Confirm before proceeding."

────────────────────────────────────────────────────────────

## 8. FAILURE HANDLING PROTOCOL

If Codex fails twice on the same issue:

1. Stop execution.
2. Summarize:
   - What failed
   - Where
   - Why
3. Return control to PM.
4. Do not continue blind retries.

────────────────────────────────────────────────────────────

## 9. EXECUTION STANDARD

Codex must:

- Write code
- Run required terminal commands
- Validate compile output
- Resolve type errors
- Confirm working state
- Report success cleanly

Avoid manual copy/paste debug loops unless ambiguity exists.

────────────────────────────────────────────────────────────

## 10. THREAD DISCIPLINE

Codex threads are scoped.

Never:
- Continue unrelated feature work in same thread
- Perform exploratory refactors outside declared objective
- Expand scope without PM instruction

────────────────────────────────────────────────────────────

## 11. OBSERVABILITY FIRST

We operate in:

- Architecture-first mode
- Integrity-first mode
- Observability-first mode

We are no longer in “make it work” mode.

────────────────────────────────────────────────────────────

## 12. FINAL PRINCIPLE

Codex executes.
PM designs.

Codex is a tool.
Architecture remains human-controlled.

This protocol overrides any convenience shortcuts.

────────────────────────────────────────────────────────────

## 13. CODEX SESSION ACTIVATION STANDARD

Codex does NOT require a long personality prompt like Project Manager agents.

Codex is a scoped execution engine.

Each Codex session must begin with a lightweight execution header.

### 🔹 Codex Session Header (Paste at Top of Every New Codex Thread)

```
Codex Execution Mode

You are operating under the AI Agent Platform Codex Execution Protocol.

Rules:
- Only modify explicitly attached files.
- Do not expand scope beyond declared objective.
- Do not create new files unless authorized.
- Do not refactor outside the declared feature domain.
- Stop immediately if architecture intent is unclear.

Wait for structured task.
```

This header ensures:
- Scope discipline
- File boundary enforcement
- No architectural drift

It replaces the need for a long activation prompt.

────────────────────────────────────────────────────────────

## 14. CODEX SESSION START CHECKLIST (FOR OLIVER)

Before executing a Codex task:

□ Feature Domain selected  
□ New Codex thread created  
□ Thread named after domain (e.g., “RAG — Embedding Fix”)  
□ Codex Session Header pasted  
□ Files attached using @ references  
□ Reasoning level declared  
□ Objective clearly defined  

If any box is unchecked, do NOT execute.

────────────────────────────────────────────────────────────

## 15. IMPORTANT CLARIFICATION

Codex does NOT:
- Persist architectural memory
- Know the repository structure automatically
- Understand domain boundaries unless declared
- Enforce preservation rules unless instructed

Architecture control remains human-owned.

Codex executes.
PM designs.
Oliver approves domain.

────────────────────────────────────────────────────────────