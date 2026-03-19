🤖 Agent Activation & Management Checklist

Last updated: March 19, 2026

This file contains the exact instructions and copy-ready prompts for creating, refreshing, or retiring any AI Agent chat inside the AI Agent Platform Project in ChatGPT.
Use this every time an agent chat is started or replaced so that each one loads the correct context, sets its goals, and reports its status.

⸻

Purpose

This checklist standardizes how to start or refresh an AI Agent. It prevents confusion, ensures all agents use the latest context from your documentation, and keeps the project synchronized between ChatGPT and your local system.

**Current Workflow Reality (March 2026):**
The AI Agent Platform now runs primarily on a **Project Manager → Codex** execution model.
The older multi-agent specialist model (Architect, Frontend, Backend, Workflow, LLM Trainer, Avatar/Voice, Prompt Engineer) is no longer part of the normal operating workflow.
This checklist should therefore prioritize:
- clean Project Manager activation
- clean PM → Codex handoff continuity
- fast recovery of current system state

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

Codex vs Single‑File Edit Policy

Operational rule for this project:

• Multi‑file edits → handled by Codex sessions.
• Single‑file edits → handled through the VS Code Builder + ChatGPT integration.

The Project Manager Agent must enforce this rule when delegating engineering tasks. If a task touches multiple files, schemas, APIs, or system contracts, it must be routed to Codex using the Codex Execution Protocol.

This prevents fragmented edits and keeps architectural changes synchronized.

⸻

⸻

Before You Begin
Confirm that all authoritative documentation in ai-agent-platform-docs/ is up to date.
   • Verify `CURRENT_STATE.md` exists and reflects the current working system.
   • Run ./automation/update_memory.sh
   • Run ./automation/sync_docs_to_github.sh (non-destructive)
   • Run ./automation/generate_project_tree.sh (from /web) so project_structure.txt is current
   • If git push fails due to missing upstream branch, run: git push --set-upstream origin main
   • /web/docs is a generated mirror, not the source of truth.
   • Activation attachments should always come from ai-agent-platform-docs/.   
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

Step 2 – Single Message Activation (Required)

```md
1. Open the new chat created in Step 1.
2. Copy the appropriate activation prompt for the role.
3. Replace placeholders like version numbers and dates.
4. Attach the required documentation files for that role.
5. Do NOT paste large context files directly into the message if they are attached as files.
6. For normal agent activations, activation should remain a **single-message event**.
7. For Project Manager activation only, use the standardized three-message activation flow.

8. These 3 messages must be sent in sequence and must feel like ONE continuous handoff:
   - Message 1 = core docs + activation + verbal turnover
   - Message 2 = visual orientation (how the system actually works)
   - Message 3 = Codex continuity + next-step recommendation for Oliver

9. The goal is continuity, not interruption:
   - Each message must clearly tell the agent what is coming next
   - The agent should NOT act early
   - The final message completes onboarding and transitions control back to Oliver
```

---

### 🔁 Turnover Snapshot Block (Required for Version Upgrades)

When replacing an existing agent version (v2, v3, etc.), the previous agent MUST provide a Turnover Snapshot in the activation message for the new agent. This functions as a direct leadership handoff so the new version understands exactly where the prior session ended.

This block must:
• Be concise and mechanical
• Use bullet points only
• Describe current phase, system status, and outstanding risks
• Avoid narrative language or brainstorming

For Project Manager reactivation, the Turnover Snapshot may be sent as the **second message immediately after activation** if file attachments are already at the message limit.
This is the preferred PM handoff style because it mimics a real leadership turnover: documents first, verbal handoff second.

Structure example:

🧭 TURNOVER SNAPSHOT FROM PREVIOUS SESSION (v# → v#)

Current Phase:
- [Short phase label]

System Status:
- [Bullet summary of working components]
- [Recent stabilizations]

Outstanding Risks:
- [Only unresolved or deferred items]

Immediate Objective For New Version:
1. Confirm synchronization
2. Verify documentation alignment
3. Regenerate priorities
4. Await directive

Important:
• For most agents, the Turnover Snapshot remains part of the single activation message.
• For the Project Manager only, the Turnover Snapshot belongs in Message 2 of the standardized 3-message activation flow.
• Do NOT force Project Manager activation into a single-message event.

---

### Project Manager Turnover Protocol

When a Project Manager Agent version is being retired, it must prepare a short handoff briefing for the next version.

This briefing must include:

• Current phase of the project
• Systems that were recently modified
• What Codex or other agents completed most recently
• Known risks or unresolved questions
• The recommended next decision for Oliver

The goal is to simulate a real leadership turnover between project managers.

The turnover briefing must:

• Be concise
• Avoid brainstorming or speculation
• Reflect only verified system state

This briefing becomes the Turnover Snapshot used in the activation message.

---

Important:
• Most agent activations should still be done in ONE message only.
• The Project Manager is the exception and must use the standardized 3-message activation flow.
• For the Project Manager, the first message is the activation message, the second is visual/turnover orientation, and the third is the execution directive.

---

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
The corresponding context file is attached with this activation message. Do not assume additional context beyond the attached documentation.
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
4. Review the latest 00_MASTER_PROJECT.md, TODO.md, CHANGELOG.md, and CURRENT_STATE.md (you will be provided the current versions right after this message).  
5. Generate today’s top 5 priorities for each active agent (Architect, Frontend, Backend, Workflow, LLM Trainer, Avatar & Voice).  
6. Verify that the Agent Session Health list in TODO.md is accurate and flag any agents due for refresh.  
7. Summarize overall project status, including current progress, risks, and key dependencies.  
8. Confirm you understand and will enforce the Codex Execution Protocol and Feature Domain workflow when delegating tasks.
9. End your output with a concise daily plan for Oliver to review and approve before execution.

⸻

🧭 Project Manager Agent Reactivation Prompt (for v2 and later)

```md
/resume_role
You are the PROJECT MANAGER AGENT for the AI Agent Platform project.
This is your [version number] activation. Re-synchronize with the current project state, assume leadership continuity from the prior PM, and do not ask Oliver to restate information already documented.

---BEGIN CONTEXT---
The Project Manager context file (07_PROJECT_MANAGER_CONTEXT.md) and supporting handoff files are attached to this activation.
Treat the attached documentation as the source of truth.
---END CONTEXT---

Your objectives:
1. Confirm that you have loaded and understood the updated Project Manager context.
2. State your version number and today’s date for tracking.
3. Review the attached core handoff files and summarize the current system in your own words.
4. Confirm the active workflow model is:
   - Oliver → Project Manager → Codex
   - NOT the older persistent multi-agent specialist model.
5. Summarize:
   - current project phase
   - what was stabilized most recently
   - what still needs refinement
   - the immediate next recommended step
6. Confirm that you will enforce:
   - Codex Execution Protocol
   - UI spec-first workflow
   - PM → Codex execution loop
7. End with a concise “I am ready to take over” briefing for Oliver.
```

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
• If you updated project_structure.txt, re-run ./automation/sync_docs_to_github.sh again to mirror the refreshed tree into /web/docs.

⚠️ Safety note: `sync_docs_to_github.sh` must never delete documentation files. If it aborts due to missing files (e.g., CURRENT_STATE.md), restore docs before re-running.

This ensures your new session’s context and status are captured in the master documentation and backups.

⸻

Step 6 – Project Manager Activation (3-Message Smooth Handoff)

When activating or refreshing the Project Manager Agent, use the following three-message activation package.

This must feel like a real leadership turnover, not 3 separate prompts.

⸻

🚨 Core Rule

The new Project Manager:

MUST NOT:
	•	Ask Oliver to restate anything
	•	Start planning early
	•	Jump into Codex immediately
	•	Treat Gmail as the whole product

MUST:
	•	Understand this is an AI Workspace Framework
	•	Understand Gmail is just one workspace
	•	Continue from the previous PM seamlessly
	•	Wait until ALL 3 messages are complete before acting

⸻

🧠 Message 1 — Core Docs + Verbal Turnover

Purpose
	•	Load full system context
	•	Establish authority
	•	Deliver HUMAN-style turnover

End this message with:
👉 “Next, I’m going to send you visuals so you can see how everything works in practice.”

Attach:
1. 07_PROJECT_MANAGER_CONTEXT.md
2. PM_ONBOARDING_BRIEF.md
3. CURRENT_STATE.md
4. TODO.md
5. CHANGELOG.md
6. system_overview.md
7. SYSTEM_MEMORY_MAP.md
8. 09_CODEX_EXECUTION_PROTOCOL.md
9. 10_CODEX_SESSION_CHECKLIST.md
10. PM_CODEX_UI_REVIEW_PROTOCOL.md

⸻

👁 Message 2 — Visual Orientation

Purpose
	•	Show the system visually
	•	Prevent UI misunderstanding
	•	Anchor decision-making

End this message with:
👉 “Next, I’m going to show you where execution stopped and what you’ll be picking up.”

Attach:
1. PM_VISUAL_REFERENCE.md
2. Up to 9 key UI screenshots

Recommended screenshot order:
1. Mailbox Intelligence
2. Cleanup Groups
3. Sender Decisions
4. Management
5. Pending Approvals
6. Dashboard
7. Agent Playground
8. Agent Summary
9. Settings Tab

⸻

✋ Message 3 — Execution Continuity + Oliver Briefing

Purpose
	•	Show where Codex left off
	•	Define the next decision point
	•	Transition control back to Oliver

   Attach (optional):
- 03_gmail_workspace/00_overview/gmail_workspace_product_flow.md
- 03_gmail_workspace/04_sender_decision_ui/decision_mode_full_build_spec.md
- 03_gmail_workspace/05_management_execution/management_execution_engine.md
- Any 1–2 additional highly relevant current-phase spec files if needed

Include:
- Last Codex prompt
- Last Codex response summary
- Current Codex thread guidance
- Current recommended next work area

⸻

🚨 IMPORTANT FINAL RULE

The PM MUST:
	1.	Explain what the next task should be
	2.	Explain WHY that’s the next task
	3.	Explain HOW they would approach Codex
	4.	STOP and wait for Oliver

❌ NOT:
	•	Immediately write a Codex prompt
	•	Skip alignment with Oliver

⸻

🧭 Smooth Flow Model

This should feel like:

Message 1 → “Here’s the system + turnover”
Message 2 → “Here’s how it actually looks”
Message 3 → “Here’s where we are + what we should do next”

👉 Then: conversation begins with Oliver

----

### Standard PM Activation Template

#### Message 1 — Activation Prompt

```md
/resume_role
You are the PROJECT MANAGER AGENT for the AI Agent Platform project.
This is your [version number] activation. Re-synchronize with the current project state, assume leadership continuity from the prior PM, and do not ask Oliver to restate information already documented.

The attached files in this first message are the source of truth for:
- current system state
- project direction
- PM authority
- onboarding / handoff rules
- Codex execution protocol
- UI review workflow
- memory navigation

Important:
- A second and third message will immediately follow this one.
- Message 2 contains the visual orientation package and screenshot walkthrough.
- Message 3 contains Codex continuity, the outgoing PM handoff on execution state, and the immediate-next-step briefing requirement.
- You must treat all 3 messages together as your full activation handoff.

Your objectives:
1. Confirm that you loaded and understood the attached context.
2. State your version number and today’s date.
3. Summarize the current state of the project in your own words.
4. Confirm the active execution model is Oliver → Project Manager → Codex.
5. Confirm you understand this is an AI Workspace Framework and Gmail is one workspace implementation, not the whole product.
6. Identify what was stabilized most recently.
7. Confirm you will wait for the visual and execution continuity messages before forming your final recommendation.
8. End by acknowledging that you are ready for Message 2.

Message 2 — Visual Orientation Prompt

Please use the attached PM_VISUAL_REFERENCE and screenshots as the visual orientation layer for your activation.
Study them before making product or UX judgments.

This is the second part of your onboarding handoff.
These visuals show how the current system actually works in practice.

You are not finished onboarding yet.
A third and final message will immediately follow with Codex continuity, current execution state, and the immediate-next-step briefing requirement.

For now, absorb the visuals and wait for Message 3 before forming your final recommendation.

Message 3 — Codex Continuity + Oliver Briefing Prompt

🚀 FINAL ONBOARDING MESSAGE — EXECUTION CONTINUITY

You are now receiving the final part of your onboarding package.

This message gives you:
- the most recent Codex continuity
- where the prior PM left off
- what work area you are expected to assess next

Do NOT jump straight to a Codex prompt.

Instead:
1. Brief Oliver on what you believe the immediate next task should be
2. Explain why that is the correct next move
3. Explain how you would frame the next Codex instruction
4. Then stop and wait for Oliver’s approval before drafting the actual Codex prompt

This concludes your onboarding package. After this response, you are being turned over to Oliver for live collaboration.

---

🧠 LAST CODEX DIRECTIVE
[PASTE LAST PM → CODEX MESSAGE]

⚙️ LAST CODEX RESPONSE
[PASTE LAST CODEX RESPONSE SUMMARY]

📎 LAST CODEX THREAD CONTEXT
- Continue on: [PASTE CURRENT CODEX THREAD NAME]
- Reason: [DIRECT CONTINUATION / SAME FEATURE / SAME UI PASS]

🧵 CODEX THREAD CONTINUITY
- Continue in the SAME thread if the task is a direct continuation of the current feature/workstream
- Start a NEW thread only if:
  - the work moves to a different feature domain
  - the current thread has become unstable, confusing, or overly long
  - architecture context would become mixed across unrelated tasks

🎯 CURRENT TARGET
[PASTE CURRENT TARGET / CURRENT WORK AREA]

📌 YOUR OBJECTIVE
Brief Oliver on the next recommended move and STOP.

---

## 8. Replace Phase-Transition Best Practice
Replace that whole section with:

```md
Phase-Transition Best Practice

1. Archive the current Project Manager Agent version with a Closeout Summary.
2. Update the authoritative handoff files before switching sessions:
   - CHANGELOG.md
   - CURRENT_STATE.md
   - TODO.md
   - system_overview.md
   - 07_PROJECT_MANAGER_CONTEXT.md
   - SYSTEM_MEMORY_MAP.md
3. Refresh the PM activation package using the latest authoritative docs.
4. Send Message 1 (core docs + activation + verbal turnover context).
5. Send Message 2 (visual orientation + screenshot walkthrough).
6. Send Message 3 (Codex continuity + immediate-next-step briefing).
7. Confirm the new PM correctly identifies:
   - the current phase
   - what was stabilized most recently
   - the immediate next recommended move
8. Only after that, turn the PM over to Oliver for live discussion and next-step approval.

---

### Activation Rule

Activation is not complete until:
1. all 3 messages have been sent
2. the new PM acknowledges the system/framework correctly
3. the new PM identifies the immediate next recommended task
4. the new PM turns back to Oliver ready for discussion before Codex execution begins

---

---

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

Add a short note reminding future agents to proactively roll versions when chats become long or code-heavy. Reference the context/token guidance in CURRENT_STATE.md.

You may also add a reminder that Playground conversations are not persistent across page refreshes. Agents should treat each activation as stateless unless session storage is implemented in the application layer.

⸻

Quick Recap

Notice drift or a phase transition → open a new chat inside the AI Agent Platform Project → prepare the Project Manager activation package → send Message 1 (core docs + activation + verbal turnover) → send Message 2 (visual orientation + screenshot walkthrough) → send Message 3 (Codex continuity + immediate-next-step briefing) → confirm the PM understands the current phase and next move → turn the PM back over to Oliver for live discussion → then update Session Health, CHANGELOG, and run the update/sync scripts.

For non-PM agents:
- activation = single message

For Project Manager:
- activation = 3-message smooth handoff
- Message 1 = core docs + activation + verbal turnover
- Message 2 = visuals + screenshot walkthrough
- Message 3 = Codex continuity + next-step briefing for Oliver
- the PM should not jump straight to Codex; it should first align with Oliver on the next move

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

**PM Note:**
For Project Manager retirement, the Closeout Summary should be especially short, mechanical, and leadership-oriented.
It should read like a real outgoing PM briefing the incoming PM.

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

1. Archive the current PM
2. Update:
   - CHANGELOG.md
   - CURRENT_STATE.md
   - TODO.md
   - system_overview.md
   - PM context
   - SYSTEM_MEMORY_MAP.md
3. Send Message 1
4. Send Message 2
5. Send Message 3
6. Confirm PM understands:
   - current phase
   - what was stabilized
   - next move
7. THEN turn over to Oliver

---

## ✅ Project Manager Activation Package

Use the standardized three-message PM activation package defined in Step 6 above.

Do not duplicate older or version-specific activation packages below this point. Keep Step 6 as the single canonical PM activation reference.
```