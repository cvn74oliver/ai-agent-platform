🔁 Daily Checklist – AI Agent Platform

Last updated: November 2025

⸻

🕘 Morning Startup
	1.	Open Terminal → navigate to project root:
cd web
	2.	Run local dev server:
npm run dev
	3.	Open http://localhost:3000￼ to verify the app loads.
	4.	Run automation scripts to refresh documentation snapshots:
```bash
./automation/update_memory.sh
./automation/sync_docs_to_github.sh
```
	5. Open ChatGPT → Project Manager Agent → send:
   /update_master  
   Load the current 00_MASTER_PROJECT.md snapshot below and generate today’s top 3 priorities per role.  
   (Paste or link the latest master project file here)  

   ✅ Reminder: If significant updates were made yesterday, also share TODO.md and CHANGELOG.md so the PM Agent works from the latest information.
	6.	Review the Project Manager’s Daily Plan and confirm priorities before starting work.

⸻

🧠 During Work Blocks
	1.	Start every new task with the Project Manager Agent.
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
	4.	When the agent finishes its task
    	•	Test or review the result locally in VS Code (e.g., run npm run dev, check the output).
    	•	Copy any relevant results from the chat:
    	•	Code blocks
	    •	Step-by-step explanations
	    •	Key notes or bug fixes
    	•	The agent’s /summarize_session output
	5.	Update the documentation
    	•	Open the appropriate files in /web/docs/ and paste information where it belongs:
    	•	*_CONTEXT.md → paste the agent’s /summarize_session response at the bottom under:

## Session Log – Work Summary (Nov 7 2025)
(Paste the summary and any relevant code notes here)


	    •	TODO.md → update task status or add new next steps.
Example:
Frontend Agent – Onboarding flow fixed (verified Nov 7 2025)
    	•	CHANGELOG.md → optional, for notable completions.
Example:
Nov 7 2025 – Backend Agent resolved Supabase auth bug.

	6.	Run automations
	    •	After updating docs, run:

```bash
./automation/update_memory.sh
./automation/sync_docs_to_github.sh
```
	    •	This merges all context updates into 00_MASTER_PROJECT.md, creates a backup, and pushes to GitHub.

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
Please update TODO.md and CHANGELOG.md accordingly.

	3.	Review the PM Agent’s update text → copy and paste it into the appropriate files locally.
	4.	Run:

```bash
./automation/update_memory.sh
./automation/sync_docs_to_github.sh
```

    to merge all updates, create a backup, and push changes to GitHub.

	5.	Verify that:
    	•	00_MASTER_PROJECT.md has updated session summaries.
	    •	CHANGELOG.md includes today’s notes.
    	•	All backups completed successfully.

📝 Note:
Skip /summarize_session for any agents that didn’t actively work today. Their context will remain unchanged until their next task.

✅ Once everything is merged and pushed, confirm that GitHub reflects the latest commit timestamp before closing the day.
⸻

✅ Daily Completion Check
	•	Project Manager Agent produced and confirmed daily plan
	•	All active agents submitted /summarize_session summaries
	•	Summaries added to context files (*_CONTEXT.md)
	•	Project Manager updates logged into TODO and CHANGELOG
	•	Automation scripts run successfully
	•	GitHub repo synced and backed up

⸻

💡 Tip
If no agent worked today, skip the /summarize_session step and simply run:
./automation/update_memory.sh
./automation/sync_docs_to_github.sh
to keep your documentation and backups up to date.
➡️ After completing the daily checklist for the final workday of the week, proceed to the Weekly Checklist.