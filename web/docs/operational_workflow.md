Absolutely — here’s the same Operational Workflow Guide rewritten in pure Markdown formatting that will paste perfectly into your /web/docs/operational_workflow.md file with zero table issues.
Just copy everything below the line and paste it directly into your MD file.

⸻

🧭 AI Agent Platform – Operational Workflow Guide

Last updated: December 2025

This document explains how to operate your multi-agent system in ChatGPT (GPT-5 Pro Plan).
It covers when to talk to the Project Manager Agent versus the specialist agents, and the correct daily workflow for running and logging work.

📌 Single Source of Truth

Before starting any work, always review:

`ai-agent-platform-docs/CURRENT_STATE.md`

This file defines:
• What is working right now
• Known issues and stability notes
• The Golden Path verification
• Immediate next priorities

If there is ever a conflict between memory, assumptions, or older documentation, **CURRENT_STATE.md wins**.

⸻

1. Overview of Team Roles

Project Manager Agent (PM Agent)
	•	Central coordinator.
	•	Maintains priorities, tracks health, merges updates, manages TODO, CHANGELOG, and master project file.
	•	Always your starting point for daily planning, progress review, task assignment, and coordination.

Architect Agent
	•	Oversees structure, dependencies, and repo organization.
	•	Handles architecture decisions, folder/file structure, backend ↔ frontend consistency.

Frontend Agent
	•	Handles user interface and visual logic (Next.js, Tailwind, components).
	•	Responsible for UI issues, design changes, React/Next component fixes.

Backend Agent
	•	Handles server logic, API routes, Supabase schema, integrations.
	•	Responsible for database logic, API endpoints, Supabase functions.

Workflow Agent
	•	Manages automations and external integrations (Activepieces, Make.com).
	•	Used for automations, event triggers, API bridges.

LLM Trainer Agent
	•	Manages fine-tuning and data prep for OpenAI models.
	•	Handles model training or prompt data updates.

Avatar & Voice Agent
	•	Handles voice/visual assets, TTS/STT, avatars, and media.
	•	Responsible for audio, voice cloning, avatars, animations.

⸻

2. Where to Start Each Day
	1.	Run automation scripts:

./automation/update_memory.sh  
./automation/sync_docs_to_github.sh

This creates a snapshot of the authoritative docs, generates the local `/web/docs` mirror, and safely syncs documentation to GitHub (non-destructive).

	2.	Open the Project Manager Agent chat and send:

/update_master  
Here’s the current snapshot.  
(Paste or link 00_MASTER_PROJECT.md, TODO.md, CHANGELOG.md)


	3.	Review the Daily Plan that the PM Agent outputs.
Approve or adjust the plan and decide which tasks you’ll handle personally or delegate to the other agents.

⸻

3. How Workflows Are Structured

Communication Hierarchy

You  ⇄  Project Manager Agent  ⇄  Specialist Agents

	•	You tell the PM Agent what needs to happen (feature, bug fix, idea).
	•	The PM Agent decides which specialist agent is responsible.
	•	You then hand off that task to the agent using the PM’s summary or by directly pasting the relevant request.
	•	This keeps the PM Agent as the single source of truth.

⸻

Typical Task Flow Example

Scenario: You want to fix the onboarding question flow for new AI agent creation.
	1.	You → PM Agent:
“We need to refine the question flow during agent creation.”
	2.	PM Agent → You:
It replies:
“This involves Frontend and Backend. Please handoff to Frontend first for UI flow, then Backend for validation logic.”
	3.	You → Frontend Agent:
Paste the PM’s summary:

/handoff Frontend Agent – update the question flow UI as described by PM Agent.  
Here’s the current issue...


	4.	Frontend Agent:
Writes or revises code.
You test it locally.
When done, ask it:

/summarize_session Summarize what was done today.


	5.	You → PM Agent:
“Frontend completed the question flow update. Here’s the summary.”
The PM Agent logs it, updates TODO and CHANGELOG, and confirms overall status.
	6.	End of Day:
Run update_memory.sh and sync_docs_to_github.sh.

⸻

4. When to Talk to Each Agent

Project Manager Agent
	•	Planning new work
	•	Reviewing progress
	•	Coordination between agents
	•	Summaries and reporting

Architect Agent
	•	Architecture or folder structure decisions
	•	Repo organization, dependencies, or code standards

Frontend Agent
	•	UI bugs, design tweaks, React component logic

Backend Agent
	•	API routes, Supabase schema, backend logic

Workflow Agent
	•	Automations and Make.com/Activepieces workflows

LLM Trainer Agent
	•	Fine-tuning, model data prep, or prompt optimization

Avatar & Voice Agent
	•	Audio, avatars, and voice integrations

If unsure who to contact — always start with the Project Manager Agent.

⸻

5. Logging and Continuity
	•	Every activation or session summary from agents gets pasted into its context file.
	•	The Project Manager Agent merges those logs into 00_MASTER_PROJECT.md.
	•	update_memory.sh and sync_docs_to_github.sh preserve backups automatically.

At the end of each day:
	1.	Check off your Daily Checklist.
	2.	Run both automation scripts.
	3.	Ask the PM Agent to /summarize_session — it will output a daily project summary.

⸻

6. Rules of Thumb
	•	Always start with the PM Agent. Keeps the master docs aligned.
	•	Specialists never coordinate directly without PM. Prevents data drift.
	•	After each work session, summarize. Keeps logs consistent.
	•	At the end of the day, run automations. Updates backups and GitHub.
	•	If in doubt, ask the PM Agent. It’s your control tower.
	•	Never edit documentation inside `/web/docs` directly — it is a generated mirror. Always edit the authoritative `ai-agent-platform-docs` repo.

⸻

7. Daily Loop Summary

Morning:
   → Run automations
   → PM Agent gives plan

During the day:
   → Work with assigned specialist agents
   → Test and confirm changes
   → Send results back to PM Agent

End of day:
   → Run automations again
   → PM Agent summarizes progress
   → Complete Daily Checklist


⸻

8. In Practice
	•	You manage what gets done.
	•	Project Manager Agent manages who does it and records it.
	•	Specialist Agents handle how it gets done (code, troubleshooting, or design).
	•	Automations keep all files and GitHub perfectly in sync.

⸻

Once you paste this into /web/docs/operational_workflow.md, your operational guide will be properly formatted and ready for daily use.
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