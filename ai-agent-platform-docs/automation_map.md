⚙️ Automation Map – AI Agent Platform

Last updated: March 2026

This document lists every automated process in the AI Agent Platform, what triggers it, what it updates, and who oversees it.
It provides a quick visual guide to what runs hands-off versus what you still control manually.

⸻

🧠 Purpose

The Automation Map helps you see exactly how the platform maintains itself.
It’s the master reference for understanding which scripts, agents, and systems keep the documentation, backups, and workflows in sync.

⸻

🔁 Core Automation Loop
	1.	update_memory.sh
• Triggered manually once a day or by the macOS Shortcut.
• Merges all .md context files into 00_MASTER_PROJECT.md.
• Creates a compressed backup in /web/backups.
• Marks timestamp of last sync in terminal output.
	2.	sync_docs_to_github.sh
• Triggered automatically after update_memory.sh via the Shortcut or run manually.
• Syncs authoritative documentation from the ai-agent-platform-docs repo into /web/docs as a generated mirror.
• Non-destructive by design; aborts if required files (e.g., CURRENT_STATE.md) are missing.
• Commits and pushes changes to the public docs repo with an auto-generated message.
   2a. RAG Knowledge Sync (Delta / Full)
   • Triggered from Agent Summary page via “Sync New/Changed” (delta) or “Force Full Resync”.
   • Creates a rag_jobs row in Supabase (status = pending).
   • Seeds rag_documents rows for drive sources and crawl domains.
   • In delta mode, avoids duplicating existing exact URLs.
   • Wildcards (/*) are only reprocessed in full mode unless explicitly included.
   • Automatically triggers /api/rag/run (fire-and-forget) so the job continues even if the user leaves the page.
	3.	macOS Shortcut – “Sync Docs”
• One-click or Siri command that runs both scripts together.
• Shows success notification on completion.
	4.	Project Manager Agent (PM Agent)
• Reads 00_MASTER_PROJECT.md every morning.
• Generates daily priorities per role and updates TODO.md.
• At end of week: summarizes progress and appends to CHANGELOG.md.
• Tracks “Agent Session Health” and flags any agent older than two weeks for reset.
• Can trigger agent activation workflow automatically if drift detected.
• Anchors all decisions to CURRENT_STATE.md as the single source of truth.
	5.	Role Agents (Architect, Frontend, Backend, etc.)
• Auto-reference their context files when resumed with /resume_role.
• Produce daily /summarize_session outputs used by PM Agent for roll-ups.
• Their summaries are merged and backed up by update_memory.sh.
   5a. Playground Session Logging
   • Every Playground interaction creates an agent_sessions row.
   • Token usage, cost estimate, and approximate human minutes are recorded.
   • agent_events rows log each interaction for analytics.
   • Dashboard aggregates these metrics for 7-day and 30-day windows.

   5b. Gmail Runtime Actions (Execution Layer)
   • Triggered when an approval request is executed from the Approvals dashboard.
   • Supported actions currently include:
     – gmail.analyze_inbox (collects metadata sample of inbox)
     – gmail.review_sender_cluster (reviews a sender-specific message batch)
     – gmail.archive_messages (removes INBOX label from selected messages)
   • Execution results are written to agent_events with event_type = execution_result.
   • The Playground reads these results to render evidence cards and update candidate lifecycle status (ready → pending_approval → approved → executed).
	6.	Supabase / Vercel / Render Integrations
• External automation: deploys automatically from GitHub main branch.
• Supabase maintains live database/auth; Vercel builds and hosts frontend; Render handles long-running jobs.
	7.	GitHub Public Docs Repo
• Holds synced .md documentation for AI reference.
• Auto-updates when sync_docs_to_github.sh runs.
• Provides permanent public links used inside ChatGPT prompts.
	8.	Backups System
• Each run of update_memory.sh stores a .tgz archive of the current documentation snapshot.
• Older backups can be manually pruned monthly.
• Restoration instructions live in troubleshooting_recovery.md.

⸻

🧩 Semi-Automated Processes

• RAG Job Progress Polling: Summary page polls rag_jobs and rag_documents to show status, processed count, and last update timestamp.
• Agent Activation: the PM Agent flags drifts, but you confirm and run the activation checklist manually.
• Key Rotation: reminder generated monthly; you replace keys in .env.local.
• Quarterly Planning: PM Agent drafts next-quarter goals; you approve.
• Dependency Updates: npm updates are manual but prompted monthly.

⸻

🧍 Manual Oversight Points
	1.	Run your daily, weekly, and monthly checklists.
	2.	Approve or decline major AI or system changes.
	3.	Refresh or archive ChatGPT agent sessions when prompted.
	4.	Replace expired API keys.
	5.	Verify backups or GitHub sync occasionally.
	6. Never edit generated docs in /web/docs directly; always edit the authoritative ai-agent-platform-docs repo.

⸻

🧾 At-a-Glance Summary

Automated
– update_memory.sh
– sync_docs_to_github.sh
– RAG job auto-trigger (/api/rag/run)
– Playground analytics logging (agent_sessions + agent_events)
– macOS Shortcut “Sync Docs”
– PM Agent daily/weekly summaries
– GitHub public docs updates
– Backup creation

Semi-Automated
– PM Agent’s drift detection and activation alerts
– Key rotation reminders
– Quarterly planning drafts

Manual
– Checklists execution
– ChatGPT session creation or refresh
– API key replacement
– Decision approvals

⸻

✅ End Result

Together these automations ensure:
• Your documentation and backups stay current without manual merging.
• Your GitHub docs remain in sync for AI agents to reference.
• Your PM Agent orchestrates priorities and changelogs automatically.
• You only intervene for high-level approvals or when creating a new agent session.