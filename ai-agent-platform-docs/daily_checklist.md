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
./automation/update_memory.sh
./automation/sync_docs_to_github.sh
	5.	Open ChatGPT → Project Manager Agent → send:
/update_master
Load the current 00_MASTER_PROJECT.md snapshot below and generate today’s top 3 priorities per role.
(Paste or link the latest master project file here)
	6.	Review the Project Manager’s Daily Plan and confirm priorities before starting work.

⸻


✏️ Replace your current 🧠 During Work Blocks section with the one below:

⸻

🧠 During Work Blocks
	1.	Start every new task with the Project Manager Agent.
	    •	Explain what you’re working on or what problem you need to solve.
	    •	The PM Agent will decide which specialist agent should handle it and usually give you a “handoff message” to copy.
	2.	Go to the assigned specialist Agent (Architect, Frontend, Backend, etc.).
	    •	Paste the PM’s handoff message or a short one-sentence task summary (the “short kernel”).
    	•	Then use the appropriate command (/resume_role, /handoff, or /summarize_session) to keep its context aligned.
	3.	Open the relevant Agent chat
    	•	Choose the agent responsible for the task (Architect, Frontend, Backend, Workflow, etc.).
	    •	Example: if you’re fixing an API route → talk to the Backend Agent.
	4.	Reconnect it with the current task
    	•	Paste one of the following to give it quick context before working:
    	•	A short task summary — e.g.,
"We’re refining the onboarding flow so users answer clearer questions when creating a new agent."
    	•	A context link — a GitHub link or file path relevant to what you’re editing.
Example:
https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/web/src/app/agents/new/page.tsx
	    •	If it’s been a while since you talked to that agent, run:

/resume_role

This refreshes its understanding of its context file.
(Note: earlier versions of this checklist called that “the short kernel.” It just means a one-sentence task reminder or the snippet that tells the agent what it’s about to work on.)

	5.	Run the right command for your situation
    	•	/resume_role → re-loads context if it’s been inactive.
    	•	/handoff → when you’re passing a task between agents.
    	•	/summarize_session → after work is finished, to generate a clean summary of what was done.
	6.	When the agent finishes its task
    	•	Test or review the result locally in VS Code (e.g., run npm run dev, check the output).
    	•	Copy any relevant results from the chat:
    	•	Code blocks
	    •	Step-by-step explanations
	    •	Key notes or bug fixes
    	•	The agent’s /summarize_session output
	7.	Update the documentation
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

	8.	Run automations
	    •	After updating docs, run:

./automation/update_memory.sh
./automation/sync_docs_to_github.sh


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
For each agent that worked today, run:

/summarize_session Summarize what we accomplished today.

Paste each response into its corresponding *_CONTEXT.md under a new heading:

## Session Log – Work Summary (Nov 7 2025)
(Paste the agent’s summary here)

	2.	Notify the Project Manager Agent:

All active agents have submitted their summaries for today.
Please update TODO.md and CHANGELOG.md accordingly.

	3.	Review the PM Agent’s update text → copy and paste it into the appropriate files locally.
	4.	Run:

./automation/update_memory.sh
./automation/sync_docs_to_github.sh

to merge all updates, create a backup, and push changes to GitHub.

	5.	Verify that:
    	•	00_MASTER_PROJECT.md has updated session summaries.
	    •	CHANGELOG.md includes today’s notes.
    	•	All backups completed successfully.

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