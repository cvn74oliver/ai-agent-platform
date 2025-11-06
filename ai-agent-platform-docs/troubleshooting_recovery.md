🧯 Troubleshooting & Recovery Guide – AI Agent Platform

Last updated: November 2025

This file is your quick-reference manual for fixing common issues with the AI Agent Platform. It describes typical symptoms, what they mean, and how to recover quickly.

⸻

🧠 General Philosophy
	1.	Stay calm – most issues come from environment or credentials.
	2.	Always read the error message first – it almost always tells you the cause.
	3.	Restart npm run dev before you start debugging.
	4.	Never delete /web/docs or /web/backups; those folders are your safety net.

⸻

⚙️ Local Development Issues

npm run dev won’t start

Symptoms: “command not found: next” or “module not found.”
Fix: Verify Node and npm are installed, delete the node_modules folder, reinstall dependencies with npm install, then run npm run dev.

Port already in use (usually 3000)

Fix: Close any other app using that port (for example, by rebooting or killing the process) and rerun npm run dev.

Build errors after dependency updates

Fix: Delete the .next folder, rebuild, and restart the local server.

⸻

🔐 Environment Variables & API Keys

Supabase connection errors

Cause: Wrong URL or service role key in .env.local.
Fix: Check that NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY match the keys shown in the Supabase dashboard under Settings → API.

OpenAI key not working

Cause: Expired or revoked key.
Fix: Generate a new key at platform.openai.com/account/api-keys￼ and update .env.local.

Firecrawl / Activepieces / Make API failing

Fix: Verify that your API keys are valid and saved in .env.local.
If timeouts continue, confirm the APIs are online via their status pages.

⸻

☁️ Deployment Issues

Site not updating on Vercel

Fix: Push the latest code to GitHub, then trigger a redeploy from the Vercel dashboard.
If the deployment fails, review Vercel’s build logs for missing environment variables.

Backend API on Render not responding

Fix:
	1.	Open the Render dashboard and check your service logs.
	2.	Increase instance memory or timeout if needed.
	3.	Confirm all required environment variables (Supabase, OpenAI, etc.) are added to Render.

⸻

🧾 Git & GitHub Issues

Sync script fails

If you see rsync or Git errors, confirm that both the local and remote docs repos exist.
Re-run ./automation/sync_docs_to_github.sh.
If Git reports “not a repository,” reclone your public ai-agent-platform-docs repo.

Permission denied when pushing

If GitHub rejects a push, log in again using:
gh auth login (requires GitHub CLI)
and confirm your Git configuration has your correct name and email.

⸻

🗃️ Supabase / Database Problems

Queries not saving or auth failing

Fix:
	1.	Check that Supabase’s status page shows no outage.
	2.	Verify table and column names in your API routes match the database schema.
	3.	Make sure your service role key in .env.local has not been rotated or revoked.

⸻

🤖 AI Agent / Chat Issues

Voice analysis or transcription fails

Fix:
	•	Ensure your microphone has browser permission.
	•	Verify MEDIA_VOICE_API_KEY is active and correct.
	•	Check console logs for /api/analyze-voice or /api/transcribe-audio errors.

Fine-tuning process stuck

Fix:
	•	Check the /api/fine-tune-status route directly to confirm job progress.
	•	Verify the training dataset exists in Supabase Storage.
	•	Ensure your OpenAI account still has fine-tune quota.

Agents losing memory or ChatGPT context

Explanation: ChatGPT sessions expire naturally.
Fix: Start a new chat and paste the latest version of that role’s .md context between
---BEGIN CONTEXT--- and ---END CONTEXT---.

⸻

💾 Backup & Recovery

Restore a previous docs snapshot

Go to /web/backups, find the correct docs_<date>.tgz file, and extract it back into /web/docs to restore the project documentation to that point in time.

Lost local project files

If your project folder is corrupted or deleted, reclone it from GitHub and copy the most recent /web/docs backup back into place. All other configuration can be rebuilt from those docs.

⸻

🧭 Quick “Something’s Wrong” Checklist
	1.	Read the terminal error message.
	2.	Verify all environment variables in .env.local.
	3.	Restart npm run dev.
	4.	Check Supabase and Vercel dashboards for outages.
	5.	Run ./automation/update_memory.sh to rebuild docs.
	6.	Run ./automation/sync_docs_to_github.sh to ensure your docs are backed up.

⸻

🧩 When All Else Fails
	1.	Run update_memory.sh to back up all current docs.
	2.	Copy /web/docs somewhere safe.
	3.	Delete node_modules and .next, reinstall dependencies, and rerun npm run dev.
	4.	If the problem persists, open a new GitHub Issue describing what changed just before the failure.

Your backups and .md documentation mean no data is ever truly lost.