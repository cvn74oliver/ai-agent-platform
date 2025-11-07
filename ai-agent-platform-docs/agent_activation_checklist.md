🤖 Agent Activation & Management Checklist

Last updated: November 2025

This file contains the exact instructions and copy-ready prompts for creating, refreshing, or retiring any AI Agent chat inside the AI Agent Platform Project in ChatGPT.
Use this every time an agent chat is started or replaced so that each one loads the correct context, sets its goals, and reports its status.

⸻

Purpose

This checklist standardizes how to start or refresh an AI Agent. It prevents confusion, ensures all agents use the latest context from your documentation, and keeps the project synchronized between ChatGPT and your local system.

⸻

When To Start A New Agent Chat

Start a new chat for any role when any of these occur:

• The agent forgets recent updates or references old versions of files.
• Responses become repetitive or generic.
• It stops following current project decisions.
• The chat exceeds about one hundred messages.
• It feels “foggy,” slow, or unsure about context.

When that happens, archive the old chat and follow this activation process.

⸻

Quick “Slash” Prompts Reference

Use these inside ChatGPT exactly as written. They are just shorthand headers that make it easy for you to see what each message is doing.

/resume_role  – start or resume an agent’s session using its context file.
/summarize_session  – ask the agent to summarize what was accomplished in this work block.
/handoff  – prepare notes for the next agent that depends on its output.

⸻

Step-By-Step Activation Process

Step 1 – Create The Chat
	1.	Open the AI Agent Platform Project in ChatGPT.
	2.	Click New Chat.
	3.	Rename it to match the role and version, for example “Backend Agent v2.”

Step 2 – Paste The Standard Activation Prompt

Copy everything between the lines below and paste it into the new chat.
Replace [ROLE NAME] and the file name with the correct values for that agent.

⸻

Activation Prompt Most Agents

/resume_role
You are the [ROLE NAME] AGENT for the AI Agent Platform project.
This is your first activation. Review all context and confirm full understanding before making any recommendations.

---BEGIN CONTEXT---
(Paste the full contents of the corresponding [ROLE]_CONTEXT.md file here)
---END CONTEXT---

Here are your reference links for verification (clickable):
- Architect Context: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/01_ARCHITECT_CONTEXT.md
- Master Project Overview: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/system_overview.md
- Agent Activation Checklist: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/agent_activation_checklist.md
- Daily Checklist: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/daily_checklist.md
- Weekly Checklist: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/weekly_checklist.md
- Monthly Checklist: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/monthly_checklist.md
- Automation Map: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/automation_map.md
- Troubleshooting & Recovery Guide: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/troubleshooting_recovery.md
- System Overview: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/system_overview.md
- CHANGELOG: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/CHANGELOG.md
- TODO List: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/TODO.md

Your objectives:
1. Read and fully understand the context above.  
2. Confirm that you successfully loaded the context and that all reference links are accessible.  
3. Summarize your responsibilities, dependencies, and key next actions.  
4. Verify browsing ability by opening one of your GitHub reference links (for example `automation_map.md`) and report the title of the page you can see.  
5. After confirming browsing works, list your top 5 initial priorities for this role.  
6. Wait for approval before executing any tasks.

Example – Frontend Agent

/resume_role
You are the FRONTEND AGENT for the AI Agent Platform project.

---BEGIN CONTEXT---
(Paste the contents of 02_FRONTEND_CONTEXT.md here)
---END CONTEXT---

Here are your reference links for verification (clickable):
- Architect Context: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/01_ARCHITECT_CONTEXT.md
- Master Project Overview: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/system_overview.md
- Agent Activation Checklist: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/agent_activation_checklist.md
- Daily Checklist: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/daily_checklist.md
- Weekly Checklist: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/weekly_checklist.md
- Monthly Checklist: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/monthly_checklist.md
- Automation Map: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/automation_map.md
- Troubleshooting & Recovery Guide: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/troubleshooting_recovery.md
- System Overview: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/system_overview.md
- CHANGELOG: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/CHANGELOG.md
- TODO List: https://github.com/olivercarlin/ai-agent-platform-docs/blob/main/TODO.md

Your objectives:
1. Read and fully understand the context above.  
2. Confirm that you successfully loaded the context and that all reference links are accessible.  
3. Summarize your responsibilities, dependencies, and key next actions.  
4. Verify browsing ability by opening one of your GitHub reference links (for example `automation_map.md`) and report the title of the page you can see.  
5. After confirming browsing works, list your top 5 initial priorities for this role.  
6. Wait for approval before executing any tasks.

🧭 Project Manager Agent Activation Prompt

/resume_role
You are the PROJECT MANAGER AGENT for the AI Agent Platform project.
This is your first activation. Review all context and confirm full understanding before making any recommendations.

---BEGIN CONTEXT---
(Paste the full contents of 07_PROJECT_MANAGER_CONTEXT.md here)
---END CONTEXT---

Your objectives:
1. Read and fully understand the context above.  
2. Confirm that you have successfully loaded the Project Manager Agent context and links.  
3. Summarize your responsibilities, dependencies, and primary functions in your own words.  
4. Review the latest 00_MASTER_PROJECT.md, TODO.md, and CHANGELOG.md (using the provided reference links).  
5. Verify browsing ability by opening one of your GitHub reference links (for example `automation_map.md`) and report the title of the page you can see.  
6. After confirming browsing works, generate today’s top 5 priorities for each active agent (Architect, Frontend, Backend, Workflow, LLM Trainer, Avatar & Voice).  
7. Verify that the Agent Session Health list in TODO.md is accurate and flag any agents due for refresh.  
8. Report your summary of the overall project status, including risks, dependencies, and key next steps.  
9. End your output with a short daily plan for Oliver to approve or adjust.

Step 3 – Confirm Health

After the agent replies, ask:
“/health_check Confirm that you’ve loaded your context correctly and list your top 5 current priorities.”

When it responds accurately, mark it as healthy in your Agent Session Health list inside TODO.md.

Example entry:

Architect Agent – healthy (last reset November 6 2025)
Backend Agent – active (v2 reset November 6 2025)

⸻

Step 4 – Log The Reset

Open CHANGELOG.md and append a short note such as:

Agent Refresh – November 6 2025
Backend Agent retired and replaced with version 2.
Context reloaded successfully and session reset to prevent drift.

⸻

Step 5 – Update Docs And Sync

After confirming the new agent is working:

• Run ./automation/update_memory.sh to merge and back up docs.
• Run ./automation/sync_docs_to_github.sh to push changes to GitHub.

This ensures your new session’s context and status are captured in the master documentation and backups.

⸻

Daily Maintenance Integration

At the start of each day, open the Project Manager Agent and check the Agent Session Health section.
If any agent is flagged “due for refresh,” use this checklist immediately.

At the end of each day, if an agent begins drifting or missing details, note it as “due for refresh” in TODO.md.
Then run the update and sync scripts so backups include the day’s changes.

⸻

Retiring An Old Agent

When replacing an agent, rename the old chat in ChatGPT to include “archived” and the date, for example “Frontend Agent (archived October 2025).”
Move it into an “Archived” folder in your ChatGPT Project if you wish.
Create a new chat using the activation steps above and update its reset date in the Session Health list.

⸻

Optional Enhancements

Add an “Agent Version” line inside each context file so you always know which version an agent is running.
Append a “Session Notes” section where each agent briefly records what changed during its active period.
The Project Manager Agent can automatically check these reset dates each week and remind you when any agent exceeds two weeks of activity without refresh.

⸻

Quick Recap

Notice that an agent is losing accuracy → open a new chat inside the AI Agent Platform Project → paste the appropriate activation prompt → confirm understanding with /health_check → update the Session Health list → add a note to the CHANGELOG → run the update and sync scripts.

Following this one sequence keeps all agents current, stable, and fully aware of the latest project state.
If an agent ever breaks, you can rebuild it from scratch in under three minutes with zero data loss.

⸻

