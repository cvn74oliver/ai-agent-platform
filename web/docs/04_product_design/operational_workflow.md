# 🧭 AI Agent Platform – Operational Workflow Guide

**Last updated:** March 2026  
**Environment:** GPT‑5 Pro Plan

This document defines the correct operational structure for running the multi‑agent system.  
It clarifies roles, daily workflow, coordination rules, and documentation discipline.

---

## 📌 Single Source of Truth

Before starting any work, always review:

`ai-agent-platform-docs/CURRENT_STATE.md`

This file defines:

- What is currently working  
- Known issues and stability notes  
- Golden Path verification  
- Immediate priorities  

If documentation conflicts with memory, assumptions, or older files, **CURRENT_STATE.md overrides everything.**

---

## 🔐 Authoritative Documentation Rule

The **authoritative documentation lives in `/ai-agent-platform-docs/`.**

The following files are considered the **operational source of truth** for the system:

- `CURRENT_STATE.md`
- `CHANGELOG.md`
- `TODO.md`
- `system_overview.md`

Any documentation inside `/web/docs` is a **generated mirror only** and must **never be edited manually.**

After major milestones or architecture changes, the Project Manager Agent must instruct Codex to update the authoritative docs first.

---

## 1️⃣ Agent Role Overview (Simplified Execution Model)

The platform operates on a **two-agent execution loop (PM → Codex)** designed for speed, clarity, and zero ambiguity in implementation.

### Project Manager Agent (PM Agent)
- Central coordinator of the system
- Owns product thinking, UX direction, and architecture alignment
- Reviews UI against specs and identifies gaps proactively
- Writes Codex instructions
- Owns all documentation updates:
  - TODO.md
  - CHANGELOG.md
  - CURRENT_STATE.md
  - system_overview.md
- Owns product decision authority (UX, flow, prioritization, and system behavior)
- Interprets results and determines next steps

### Codex Execution Agent
- Executes all implementation work
- Follows strict instructions from PM Agent
- Performs:
  - UI implementation
  - Backend/API updates
  - Refactors and fixes
- Returns results via `PM REVIEW PACKET`
- Must never make product decisions or deviate from PM instructions

---

### Deprecated / Optional Agents

The following agents are **no longer part of the active workflow**:
- Architect Agent
- Frontend Agent
- Backend Agent
- Workflow Agent
- LLM Trainer Agent
- Avatar & Voice Agent
- Prompt Engineer Agent

These were part of the original system design but are now considered:
- unnecessary for current execution speed
- a source of fragmentation and overhead

If needed in the future, they can be reintroduced as **temporary specialists**, not persistent roles.

---

## 2️⃣ Daily Startup Procedure

1. Run automation scripts:

```
./automation/update_memory.sh
./automation/sync_docs_to_github.sh
```

These:
- Snapshot authoritative docs  
- Update `/web/docs` mirror  
- Sync documentation to GitHub  

2. Open Project Manager Agent and run:

```
/update_master
```

Provide:
- 00_MASTER_PROJECT.md  
- TODO.md  
- CHANGELOG.md  

3. Review the generated Daily Plan.

Approve, adjust, and assign tasks.

---

## 3️⃣ Communication Hierarchy

You ⇄ Project Manager Agent ⇄ Codex

- You define intent and provide feedback.
- PM Agent interprets, plans, and writes execution instructions.
- Codex executes.
- Results return as a PM REVIEW PACKET.
- No direct user → Codex architectural decisions (all strategy flows through PM)

---

## 3.5️⃣ Oliver → Codex → PM Loop (PM REVIEW PACKET)

For major implementation passes, use this loop:

1. Oliver sends scoped task to Codex (domain + files + constraints).
2. Codex implements and validates in the same thread.
3. Codex ends with a plain-text `PM REVIEW PACKET` handoff block.
4. Oliver copies that packet directly into the Project Manager thread.
5. PM uses the packet to review risk/scope and decide next action.

This keeps handoffs compact, avoids diff-heavy context bloat, and standardizes PM review quality.

---

## 4️⃣ Standard Task Flow

The platform is now organized around a **PM → Codex execution loop**.

Example workflow:

1. You → PM Agent  
   Define goal or desired improvement.

2. PM Agent:
   - reviews UI / system state
   - compares against specs
   - identifies exact gaps
   - writes precise Codex instruction

3. You → Codex  
   Paste PM instruction.

4. Codex executes and returns `PM REVIEW PACKET`

5. You → PM Agent  
   Provide:
   - screenshots
   - PM packet

6. PM Agent:
   - reviews against spec
   - identifies remaining gaps
   - issues next iteration

7. PM Agent (if complete):
    - Confirms feature meets spec
    - Triggers documentation updates
    - Marks task complete in TODO.md

Repeat until the feature is complete.

---

## 5️⃣ Logging Discipline

- All session summaries get pasted into the appropriate context file.
- PM Agent merges updates into master documentation.
- All major features must result in explicit CHANGELOG entries (no silent updates)
- Automations preserve backups automatically.

End of day requirements:

- Complete Daily Checklist
- Run both automation scripts
- Request PM session summary

---

## 5.5️⃣ UI Review Protocol (Critical)

UI review is no longer exploratory. It is structured.

Oliver provides ONLY:
- screenshots
- what was clicked
- whether it worked or not

PM Agent is responsible for:
- identifying all UX gaps
- comparing against specs
- deciding what needs to change

Oliver should NOT act as product designer or debugger during UI review. His role is purely observational and validation-based.

PM owns product judgment.

This dramatically speeds up iteration.

---

## 6️⃣ Operational Rules

- Always start with the Project Manager Agent.
- Specialist agents execute tasks; they do not coordinate strategy.
- The Operations Workspace is the primary execution interface.
- Every major task must produce a session summary.
- Authoritative documentation must be updated after milestones.
- `/web/docs` is a generated mirror and must never be edited manually.
- Avoid undocumented architectural changes.
- The system runs on PM + Codex only (no multi-agent routing).
- PM must proactively compare UI against specs before issuing feedback.
- Every Codex UI task must include the "READ BEFORE UI" spec block.
- Avoid broad tasks; prefer tight, single-purpose passes.
- Never restart the dev server during long-running jobs (indexing, backfill, ingestion)
- Resume operations instead of restarting whenever possible
- Long-running processes are stateful and must be protected

---

## 7️⃣ Daily Loop Summary

### Morning
- Run automations
- Get PM daily plan

### During the Day
- Execute PM → Codex iteration loop
- Test changes
- Return summaries to PM

### End of Day
- Run automations
- PM summarizes progress
- Complete Daily Checklist

---

## 8️⃣ System Philosophy

- You define direction and priorities
- PM Agent enforces product truth and system alignment
- Codex executes with precision
- The system prioritizes speed, clarity, and correctness over complexity

---

This file defines how the platform is operated daily.  
Any deviation from this workflow risks documentation drift or system inconsistency.

---

## 🔄 Agent Version Lifecycle

ChatGPT agents accumulate context over time. When a session becomes very long or performance degrades, the Project Manager Agent should be retired and replaced with a new version.

When rotating PM Agents:

1. Ensure the authoritative docs are fully updated.
2. Provide a **handoff prompt** summarizing:
   - current architecture
   - system status
   - next milestones
3. Activate the next PM Agent using the Agent Activation Checklist.

This ensures continuity while preventing context saturation.

Before retiring a PM Agent:
- Ensure workflow model (PM + Codex loop) is documented
- Ensure UI Review Protocol is included
- Ensure all major product specs are up to date
- Ensure no long-running processes are active before agent rotation

This prevents regression when a new PM takes over.

---

## 🚨 Critical Execution Safeguard (NEW)

The system must protect long-running operations at all times.

These include:
- Gmail full reindex
- Historical backfill
- Smart Sync ingestion

Rules:
- Never restart the dev server during these operations
- Never trigger competing jobs while one is active
- Always prefer resume over restart
- Treat these processes as stateful and non-recoverable if interrupted

Failure to follow these rules results in:
- lost progress
- corrupted state
- significant time loss

This rule overrides all convenience-based decisions during development.

---

## 🏁 PM v11 Turnover Addendum — Operational Workflow State (March 26, 2026)

### Current Execution Phase

The system has transitioned from:
- architecture + data construction

to:
- **product usability and runtime reliability (Phase 1B)**

This is a critical shift in how the PM → Codex loop should operate.

---

### Updated Execution Priority Model

From this point forward, the execution order is:

1. **Fix runtime interaction issues**
   - sender list behavior
   - decision card reliability
   - preview loading

2. **Fix UI truth and readability**
   - hierarchy clarity
   - labeling
   - user understanding

3. **ONLY THEN consider artifact changes**
   - and only if a blocking issue is proven at the artifact layer

---

### What Has Changed In Workflow Behavior

Previously:
- heavy focus on artifact rebuilding
- multiple rebuild loops
- mixed debugging across layers

Now:
- artifact baseline is frozen (`full-mailbox-20260325230627555`)
- most issues are **runtime or UI-layer issues**, not artifact issues

PM must assume:

```text
If something looks wrong → it is NOT automatically an artifact problem
```

---

### New Execution Rule (Critical)

Before sending any Codex task, PM must classify the issue as one of:

- Artifact-layer problem
- Runtime/data-access problem
- UI/presentation problem

Only then:
- write the instruction
- keep scope isolated to that layer

This prevents multi-layer debugging loops.

---

### Interaction-First Validation Rule

A feature is NOT complete when:
- data looks correct

A feature is complete only when:
- user can interact with it end-to-end
- no blockers appear during real use

Example:
- subtype hierarchy was “correct” before
- but clicking revealed empty results and backend failures

This rule is now mandatory.

---

### Current Known Runtime Risks

- Subtype focus uses full-cluster materialization (~10–15s cold load)
- Preview selection is inconsistent for high-volume senders
- Sender-level truth is partially runtime-derived

These are **known and accepted for Phase 1B**, not immediate rebuild triggers.

---

### Immediate Focus For Next PM

1. Decision-card preview reliability
2. Sender list + subtype interaction trust
3. Sender Overview clarity and usability

DO NOT:
- re-open artifact design
- chase perfect subtype coverage
- optimize performance prematurely

---

### Final Operational Directive

> Build a system that works for a user before making it perfect for the machine.

This is now the governing rule for all PM decisions moving forward.

---
