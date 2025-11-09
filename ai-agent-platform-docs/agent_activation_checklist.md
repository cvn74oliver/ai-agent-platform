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

Before You Begin
1. Confirm that all documentation in /web/docs/ is up to date.
   • Run ./automation/update_memory.sh
   • Run ./automation/sync_docs_to_github.sh
2. Open the latest TODO.md to review current Agent Session Health.
3. Make sure you are inside the correct ChatGPT Project (AI Agent Platform).
4. If reactivating an existing agent (same role, new version), confirm its prior context file remains in use.
  - Append a new “Session Log – Activation (v# date)” heading inside that same context file.
  - Do not create a new context file unless the role or project scope has changed.

⸻

Step-By-Step Activation Process

Step 1 – Create The Chat
	1.	Open the AI Agent Platform Project in ChatGPT.
	2.	Click New Chat.
	3.	Rename it to match the role and version, for example “Backend Agent v2.”

⸻

Step 2 – Paste The Standard Activation Prompt

1. In ChatGPT, open the new chat you created in Step 1.  
2. 2. Copy the appropriate activation prompt from below:
   • For regular agents – use “Initial Activation Prompt – Most Agents.”
   • For the Project Manager – use “Initial Project Manager Agent Activation Prompt.”
3. Replace [ROLE NAME] and the file name with the correct values for that agent.  
4. Paste the completed prompt into the ChatGPT message box.

5. Send the message in ChatGPT.  
6. Wait for the agent’s confirmation message that it has loaded and summarized its context.  
7. Once confirmed, copy the full activation prompt you used (including the pasted context) and the agent’s entire response.  
8. Open that agent’s context file in /web/docs/ and paste both under a new heading like:

   ## Session Log – Activation (Nov 6 2025)  
   (Paste the activation prompt and the agent’s response here)
9. Save the file when finished.
10. If this is a reactivation (v2 or later), verify that the previous Closeout Summary is present at the bottom of the same context file.
    Add a one-line note above it:
    > Project Manager Agent v2 Activated – Phase 2 (Runtime Testing & Validation) – Nov 9 2025

⸻

Initial Activation Prompt – Most Agents:

/resume_role
You are the [ROLE NAME] AGENT for the AI Agent Platform project.
This is your first activation. Review all context carefully and confirm full understanding before making any recommendations.

---BEGIN CONTEXT---
(Paste the full contents of the corresponding [ROLE]_CONTEXT.md file here)
---END CONTEXT---

Your objectives:
1. Read and fully understand the context above.
2. Confirm that you have successfully loaded the context.
3. Summarize your responsibilities, dependencies, and key areas of focus.
4. Based on the context, generate your top 5 initial priorities for this role.
5. Wait for Oliver’s approval before executing or drafting any plans.

⸻

Reactivation Prompt Most Agents (for v2 and later)

/resume_role
You are the [ROLE NAME] AGENT for the AI Agent Platform project.
This is your [version number] activation. Review the latest context below to re-synchronize with current priorities.

---BEGIN CONTEXT---
(Paste the full contents of the corresponding [ROLE]_CONTEXT.md file here)
---END CONTEXT---

Your objectives:
1. Confirm you have reloaded and understood the updated context.
2. Summarize key changes or new directives you notice.
3. Update your top 5 priorities based on the current system state.
4. Wait for Oliver’s approval before proceeding.

⸻

🧩 Initial Prompt Engineer Agent Activation Prompt

/resume_role  
You are the PROMPT ENGINEER AGENT for the AI Agent Platform project.  
This is your first activation. Review all context carefully and confirm full understanding before making any recommendations.

---BEGIN CONTEXT---
(Paste the full contents of 08_PROMPT_ENGINEER_CONTEXT.md here)
---END CONTEXT---

Your objectives:
1. Read and fully understand the context above.  
2. Confirm that you have successfully loaded the Prompt Engineer Agent context.  
3. Summarize your responsibilities, dependencies, and primary areas of focus.  
4. Based on the context, generate your top 5 initial priorities for this role.  
5. Wait for Oliver’s approval before executing or drafting any prompt optimization or schema design plans.

⸻

🧩 Prompt Engineer Agent Reactivation Prompt (for v2 and later)

/resume_role  
You are the PROMPT ENGINEER AGENT for the AI Agent Platform project.  
This is your [version number] activation. Review the latest context below to re-synchronize with current priorities and schema updates.

---BEGIN CONTEXT---
(Paste the full contents of 08_PROMPT_ENGINEER_CONTEXT.md here)
---END CONTEXT---

Your objectives:
1. Confirm you have reloaded and understood the updated Prompt Engineer context.  
2. Summarize key changes or new directives compared to the previous version.  
3. Update your top 5 priorities based on the current guided setup and prompt schema state.  
4. Wait for Oliver’s approval before implementing new prompt flows or schema changes.

⸻

🧭 Initial Project Manager Agent Activation Prompt:

/resume_role
You are the PROJECT MANAGER AGENT for the AI Agent Platform project.
This is your first activation. Review all context and confirm full understanding before making any recommendations.

---BEGIN CONTEXT---
(Paste the full contents of 07_PROJECT_MANAGER_CONTEXT.md here)
---END CONTEXT---

Your objectives:
1. Read and fully understand the context above.  
2. Confirm that you have successfully loaded the Project Manager Agent context.  
3. Summarize your responsibilities, dependencies, and primary functions in your own words.  
4. Review the latest 00_MASTER_PROJECT.md, TODO.md, and CHANGELOG.md (you will be provided the current versions right after this message).  
5. Generate today’s top 5 priorities for each active agent (Architect, Frontend, Backend, Workflow, LLM Trainer, Avatar & Voice).  
6. Verify that the Agent Session Health list in TODO.md is accurate and flag any agents due for refresh.  
7. Summarize overall project status, including current progress, risks, and key dependencies.  
8. End your output with a concise daily plan for Oliver to review and approve before execution.

⸻

🧭 Project Manager Agent Reactivation Prompt (for v2 and later)

/resume_role
You are the PROJECT MANAGER AGENT for the AI Agent Platform project.
This is your [version number] activation. Review the latest context and re-synchronize with the current project state before generating any plans.

---BEGIN CONTEXT---
(Paste the full contents of 07_PROJECT_MANAGER_CONTEXT.md here)
---END CONTEXT---

Your objectives:
1. Confirm that you have reloaded and understood the updated Project Manager context.  
2. Note your version number (e.g., v2, v3) and today’s date for tracking.  
3. Review the latest 00_MASTER_PROJECT.md, TODO.md, and CHANGELOG.md (these will be provided next).  
4. Identify key changes or new directives compared with your previous version.  
5. Regenerate the top 5 current priorities for each active agent (Architect, Frontend, Backend, Workflow, LLM Trainer, Avatar & Voice).  
6. Update the Agent Session Health list based on the newest TODO.md.  
7. Provide a refreshed overall project summary, highlighting differences from the prior version.  
8. End your response with a short daily or weekly plan for Oliver to confirm before execution.

⸻

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

Step 6 – Provide Updated Files and Summary to the Project Manager Agent (PM Agents Only)

After syncing, open the Project Manager Agent chat and send the latest full project snapshot so it can synchronize with the current system state.

1. Paste or upload the following files in order:
   • 00_MASTER_PROJECT.md  
   • TODO.md  
   • CHANGELOG.md  
   • project_structure.txt  
   • system_overview.md
   • automation_map.md (include when activating or after any automation changes)
2. Record a Loom video explaining everything that you want this project manager to know and be like, and all the details about the project. Once you're done, download the video and its captions, and include them as attachments in your project, along with a text summary of everything the project manager needs to know about those attachments and what you need to say. (if needed)
3. Type “All files uploaded — proceed.” once finished.
4. Wait for the Project Manager Agent to analyze them and generate its coordination summary, agent priorities, and daily plan.

⸻

Step 7 – Archive and Version Tagging (After Activation)

1. In the CHANGELOG.md, append an entry noting the agent version, date, and phase start.  
2. In the TODO.md, update the Agent Session Health list with:
   - Agent Name  
   - Version Number  
   - Activation Date  
   - Current Phase (e.g., “Testing & Validation”)  
3. Verify the Project Manager Agent has recorded these updates in its daily log.  
4. Run the update and sync scripts once more to capture the new version tags.

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

Post-Activation Verification Checklist

After completing a new agent activation or reactivation, verify the following:

• The agent confirmed successful context load and summarized its responsibilities.
• The agent’s top 5 priorities have been reviewed and approved.
• Agent Session Health list in TODO.md is updated with the activation date and version number.
• Activation prompt and response were logged in the agent’s context file under a Session Log heading.
• CHANGELOG.md has a matching activation or refresh entry.
• update_memory.sh and sync_docs_to_github.sh have both been run successfully.
• The archived version of the previous chat (if applicable) is renamed and stored properly.
• The agent’s context file contains a Closeout Summary for the previous version and a new Activation Summary for the current one.
• The Project Manager Agent confirms in its next log that all active agents have matching version numbers and reset dates.

⸻

🧩 Agent Closeout Procedure

When an agent version is being retired or replaced:

1. Ask the agent for its **final inputs** for its context file.  
   • Prompt: “Before we archive you, please provide your final context update — anything that the next version should know or retain.”  
   • This ensures each agent hands off lessons learned, pending items, and unfinished ideas directly into its context log.

2. Copy the agent’s final message into its context file under:

🏁 [Agent Name] v[#] – Closeout Summary ([Date])

Include any reflections, final notes, or specific next-version recommendations.

3. Verify that the context file now contains:
• The Closeout Summary at the bottom  
• All prior session logs above it (activation prompt, responses, key work blocks)

4. In the **CHANGELOG.md**, add an entry similar to:
> `[Agent Name] v[#] closed and archived. Final context notes appended.`

5. Update the **TODO.md → Agent Session Health list** to mark the old version as archived (for example: `Frontend Agent – archived Nov 9 2025`).

6. Once the next version activates, confirm the new agent references the Closeout Summary in its initial response (proving continuity).

This guarantees that every agent version ends cleanly and that no important insight is lost between versions.

⸻

Phase-Transition Best Practice

When a major project phase changes (e.g., Build → Testing → Deployment):
1. Archive the current Project Manager Agent version with a Closeout Summary.
2. Activate the next version using the same context file and updated objectives.
3. Add a Phase Transition entry to CHANGELOG.md.
4. Sync documentation immediately after the first successful build or deploy of the new phase.