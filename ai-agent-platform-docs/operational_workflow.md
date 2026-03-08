# 🧭 AI Agent Platform – Operational Workflow Guide

**Last updated:** December 2025  
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

## 1️⃣ Agent Role Overview

### Project Manager Agent (PM Agent)
- Central coordinator  
- Owns priorities and master logs  
- Maintains TODO.md, CHANGELOG.md, and master project file  
- Always the starting point for planning and coordination  

### Architect Agent
- Oversees structure and technical architecture  
- Handles repo organization and system integrity  

### Frontend Agent
- UI and visual logic (Next.js, Tailwind, components)  
- Responsible for user interface behavior and layout  

### Backend Agent
- API routes and Supabase schema  
- Server logic and data integrity  

### Workflow Agent
- External integrations (Activepieces, Make.com)  
- Automation orchestration  

### LLM Trainer Agent
- Fine‑tuning logic and prompt optimization  
- Model training pipeline management  

### Avatar & Voice Agent
- TTS/STT, avatars, media systems  
- Audio and visual integrations  

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

You ⇄ Project Manager Agent ⇄ Specialist Agents

- You define objectives.
- PM Agent assigns responsibility.
- Specialists execute.
- Results are returned to PM Agent for logging.

Specialists do **not** coordinate independently.

---

## 4️⃣ Standard Task Flow

Example: Updating onboarding question flow

1. You → PM Agent  
   “We need to refine onboarding question flow.”

2. PM Agent assigns:
   - Frontend (UI flow)
   - Backend (validation logic)

3. You → Frontend Agent  
   Provide PM summary and issue details.

4. Frontend completes work.  
   You test locally.

5. Request session summary:

```
/summarize_session
```

6. Return summary to PM Agent for logging.

7. End of day → Run automation scripts again.

---

## 5️⃣ Logging Discipline

- All session summaries get pasted into the appropriate context file.
- PM Agent merges updates into master documentation.
- Automations preserve backups automatically.

End of day requirements:

- Complete Daily Checklist
- Run both automation scripts
- Request PM session summary

---

## 6️⃣ Operational Rules

- Always start with PM Agent.
- Specialists execute — PM coordinates.
- Summarize every session.
- Run automations at end of day.
- Never manually edit `/web/docs` (generated mirror).
- Always edit authoritative repo files.

---

## 7️⃣ Daily Loop Summary

### Morning
- Run automations
- Get PM daily plan

### During the Day
- Work with assigned specialist agents
- Test changes
- Return summaries to PM

### End of Day
- Run automations
- PM summarizes progress
- Complete Daily Checklist

---

## 8️⃣ System Philosophy

- You decide what gets built.
- PM Agent ensures alignment and documentation.
- Specialist Agents implement solutions.
- Automations maintain consistency and backups.

---

This file defines how the platform is operated daily.  
Any deviation from this workflow risks documentation drift or system inconsistency.