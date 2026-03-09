🔁 Daily Checklist – AI Agent Platform

🏗️ Current Phase: [Phase 2 – Runtime Testing & Validation]

Last updated: March 9, 2026

📌 Single Source of Truth
Before starting any work, open and review:

ai-agent-platform-docs/CURRENT_STATE.md

This file confirms:
• What is working right now
• Known issues and stability notes
• The golden-path verification steps
• Immediate next priorities

⸻

🕘 Morning Startup
	1.	Open Terminal → navigate to project root:
cd web
	2.	Run local dev server:
npm run dev
	3.	Open http://localhost:3000 to verify the app loads.
	4.	Run the Golden Path test (from CURRENT_STATE.md):
	   • Open an existing agent
	   • Next training suggestion → Save & Next
	   • Save & Finish → confirm rewrite + quality update

	   🚨 If this fails, stop and fix regressions before continuing.
	5. Run automation scripts to refresh documentation snapshots (from /web directory):
```bash
./automation/update_memory.sh
./automation/sync_docs_to_github.sh
```

💡 Safety note:
`sync_docs_to_github.sh` is intentionally non-destructive. If it aborts, confirm that `CURRENT_STATE.md` exists locally before retrying.

	6. Open ChatGPT → Project Manager Agent → send:
   /update_master  
   Load the current 00_MASTER_PROJECT.md snapshot below and generate today’s top 3 priorities per role.  
   (Paste or link the latest master project file here)  

   ✅ Reminder: If significant updates were made yesterday, also share TODO.md and CHANGELOG.md so the PM Agent works from the latest information.
	7.	Review the Project Manager’s Daily Plan and confirm priorities before starting work.
	8. Verify Agent Health & Version Consistency:
  		 • Open TODO.md → confirm all agents’ version numbers and reset dates match current context files.
 		  • If any agent shows “due for refresh” or “archived,” follow the Agent Activation Checklist before starting work.

⸻

🧠 During Work Blocks
	1.	Start every new task with the Project Manager Agent.
		-  💡 If this task belongs to a new project phase (e.g., Build → Testing), make sure the Project Manager Agent logs this transition in CHANGELOG.md and updates TODO.md with the new phase header.
	    •	Explain what you’re working on or what problem you need to solve.
	    •	The PM Agent will decide which specialist agent should handle it and usually give you a “handoff message” to copy.
    2. Work with the assigned specialist Agent (Architect, Frontend, Backend, etc.).
       • Paste the Project Manager Agent’s handoff message or a short one-sentence task summary (the “short kernel”).  
     Example: “We’re refining the onboarding flow so users answer clearer questions when creating a new agent.”  
     • If helpful, include a relevant GitHub link or file path (for example):  
     https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/web/src/app/agents/new/page.tsx  
      • If the chat has been idle or context was lost, run `/resume_role` first to reload its role context.  
      • The `/handoff` tag tells the agent this task came directly from the Project Manager and is ready for implementation.

	3.	Run the right command for your situation
    	•	/resume_role → re-loads context if it’s been inactive.
    	•	/handoff → when you’re passing a task between agents.
    	•	/summarize_session → after work is finished, to generate a clean summary of what was done.
                 💡 Note: You can run /summarize_session immediately after completing a short task, or wait until the end of the day if you’re doing multiple tasks with the same agent.
		-	⚙️ When switching between agents on the same issue:
				• Run /handoff in the current chat before moving to the next agent.
				• Paste the full /handoff message at the top of the new agent’s chat.
				• This keeps the cross-agent context consistent and ensures version tagging continuity.
    • After any RAG schedule or schema-related changes, verify:
        - rag_jobs row created successfully
        - rag_documents rows inserted
        - Job status transitions from pending → completed (or failed)
        - No repeating 404s in terminal
	4.	When the agent finishes its task
    	•	Test or review the result locally in VS Code (e.g., run npm run dev, check the output).
    	•	Copy any relevant results from the chat:
    	•	Code blocks
	    •	Step-by-step explanations
	    •	Key notes or bug fixes
    	•	The agent’s /summarize_session output
	5.	Update the documentation (authoritative docs only)
    	•	Open the appropriate files in /ai-agent-platform-docs/ and paste information where it belongs.
    	•	Do not edit /web/docs directly; it is a generated mirror, not the source of truth.
    	•	Use these rules:
    	•	*_CONTEXT.md → paste the agent’s /summarize_session response at the bottom under:
```
## Session Log – Work Summary (Mar 9 2026)
(Paste the summary and any relevant code notes here)
```
    	•	TODO.md → update task status or add new next steps.
      Example:
      Frontend Agent – Onboarding flow fixed (verified Mar 9 2026)
    	•	CHANGELOG.md → append milestone/completion notes; do not delete old entries.
      Example:
      Mar 9 2026 – Playground runtime controller refactor milestone recorded.
    	•	CURRENT_STATE.md → update only the targeted sections that changed.
    	•	system_overview.md → update only when architecture/boundaries changed.
    	•	operational_workflow.md / automation_map.md → update only if workflow or automation behavior actually changed.

	6.	Run automations
	    •	After updating docs, run:

```bash
./automation/update_memory.sh
./automation/sync_docs_to_github.sh
```

💡 After any schema or routes work that changes project structure:
```bash
bash web/automation/generate_project_tree.sh
```

    • This regenerates project structure documentation after route/schema changes.

⸻

✅ Quick Summary

Short kernel = a one-sentence reminder or snippet describing what you’re doing.
Outputs = the agent’s work results (code, explanations, or /summarize_session text).
Where to paste them:
	•	Agent context file → for detailed work summaries.
	•	TODO.md → for tracking progress.
	•	CHANGELOG.md → for milestone entries.

⸻

🕔 End-of-Day Wrap-Up
    1.	Summaries for active agents only:
    • For each agent that worked today, run:

/summarize_session Summarize what we accomplished today.

Paste each response into its corresponding *_CONTEXT.md under a new heading:

## Session Log – Work Summary (Nov 7 2025)
(Paste the agent’s summary here)

	2.	Notify the Project Manager Agent:

All active agents have submitted their summaries for today.
Please update the authoritative docs accordingly: CHANGELOG.md, TODO.md, CURRENT_STATE.md, and system_overview.md if architecture changed.

	3.	Review the PM Agent’s update text → apply it only to the appropriate files in /ai-agent-platform-docs/ locally.
	4.	Run:

```bash
./automation/update_memory.sh
./automation/sync_docs_to_github.sh
```

    to merge all updates, create a backup, and push changes to GitHub.

	5.	Verify that:
    	•	Authoritative docs in ai-agent-platform-docs/ reflect today’s updates before sync.
	    •	CHANGELOG.md includes today’s notes.
    	•	All backups completed successfully.

	6. 6. If any agent version is being closed or replaced:
		• Ask the agent for its final context update (Closeout Summary).
		• Paste its final message into the corresponding *_CONTEXT.md file under:
			### 🏁 [Agent Name] v[#] – Closeout Summary ([Date])
		• Update TODO.md and CHANGELOG.md to record the archive date.

	7. Context / token window check (recommended):
		• If today’s chat involved heavy debugging, many file pastes, or feels long, plan a clean rollover to the next agent version.
		• Ensure CURRENT_STATE.md, TODO.md, and CHANGELOG.md are up to date before activating the next version.

📝 Note:
Skip /summarize_session for any agents that didn’t actively work today. Their context will remain unchanged until their next task.

✅ Once everything is merged and pushed, confirm that GitHub reflects the latest commit timestamp before closing the day.
⸻

✅ Daily Completion Check
	•	Project Manager Agent produced and confirmed daily plan
	•	All active agents submitted /summarize_session summaries
	•	Summaries added to context files (*_CONTEXT.md)
	•	Project Manager updates logged into authoritative docs (TODO, CHANGELOG, CURRENT_STATE, and system_overview when needed)
	•	/web/docs was not edited manually as source of truth
	•	Automation scripts run successfully
	•	GitHub repo synced and backed up

⸻

💡 Tip
If no agent worked today, skip the /summarize_session step and simply run the sync scripts (from the /web directory) after confirming your authoritative docs are already current:
./automation/update_memory.sh
./automation/sync_docs_to_github.sh
to keep your documentation and backups up to date.
➡️ After completing the daily checklist for the final workday of the week, proceed to the Weekly Checklist.