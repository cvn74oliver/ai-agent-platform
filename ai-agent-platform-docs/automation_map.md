⚙️ Automation Map – AI Agent Platform

Last updated: November 2025

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
• Copies /web/docs into the public ai-agent-platform-docs GitHub repo.
• Commits and pushes changes with an auto-generated message.
	3.	macOS Shortcut – “Sync Docs”
• One-click or Siri command that runs both scripts together.
• Shows success notification on completion.
	4.	Project Manager Agent (PM Agent)
• Reads 00_MASTER_PROJECT.md every morning.
• Generates daily priorities per role and updates TODO.md.
• At end of week: summarizes progress and appends to CHANGELOG.md.
• Tracks “Agent Session Health” and flags any agent older than two weeks for reset.
• Can trigger agent activation workflow automatically if drift detected.
	5.	Role Agents (Architect, Frontend, Backend, etc.)
• Auto-reference their context files when resumed with /resume_role.
• Produce daily /summarize_session outputs used by PM Agent for roll-ups.
• Their summaries are merged and backed up by update_memory.sh.
	6.	Supabase / Vercel / Render Integrations
• External automation: deploys automatically from GitHub main branch.
• Supabase maintains live database/auth; Vercel builds and hosts frontend; Render handles long-running jobs.
	7.	GitHub Public Docs Repo
• Holds synced .md documentation for AI reference.
• Auto-updates when sync_docs_to_github.sh runs.
• Provides permanent public links used inside ChatGPT prompts.
	8.	Backups System
• Each run of update_memory.sh stores a .tgz archive of /docs.
• Older backups can be manually pruned monthly.
• Restoration instructions live in troubleshooting_recovery.md.

⸻

🧩 Semi-Automated Processes

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

⸻

🧾 At-a-Glance Summary

Automated
– update_memory.sh
– sync_docs_to_github.sh
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