🧯 Troubleshooting & Recovery Guide – AI Agent Platform

Last updated: February 2026

This file is your quick-reference manual for diagnosing and recovering from issues in the AI Agent Platform. It reflects the current architecture (Next.js 16 + Supabase + OpenAI + RAG worker).

⸻

🧠 General Philosophy

1. Stay calm – most issues are environment, keys, or background jobs.
2. Read the error message first – it almost always tells you what failed.
3. Restart npm run dev before deep debugging.
4. Never delete /web/docs or /web/backups – those are your recovery safety net.
5. Background jobs (RAG, fine-tuning) continue server-side even if you leave the page.

⸻

⚙️ Local Development Issues

npm run dev won’t start

Symptoms:
- “command not found: next”
- “module not found”
- Turbopack build error

Fix:
1. Confirm Node and npm are installed.
2. Delete node_modules.
3. Run npm install.
4. Delete .next.
5. Run npm run dev again.

Turbopack “cannot reassign const” error

Cause:
A variable declared with const was later reassigned (common during rapid RAG edits).

Fix:
Change const to let for variables that are reassigned (e.g., docs arrays in RAG routes).

Port 3000 already in use

Fix:
Close the conflicting process or reboot your machine, then rerun npm run dev.

Build errors after dependency updates

Fix:
Delete .next, restart npm run dev, and confirm all environment variables still exist.

⸻

🔐 Environment Variables & API Keys

Supabase connection errors

Cause:
Wrong URL or service role key in .env.local.

Fix:
Verify:
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

Match exactly with Supabase → Settings → API.

OpenAI key not working

Cause:
Expired, revoked, or missing key.

Fix:
Generate a new key at platform.openai.com/account/api-keys
Update OPENAI_API_KEY in .env.local.

Embedding failures

Cause:
Wrong embedding model or invalid key.

Fix:
Ensure:
EMBEDDING_MODEL=text-embedding-3-small
and key is valid.

Firecrawl / Activepieces / Make API failing

Fix:
- Confirm API keys exist in .env.local.
- Check provider status page.
- Watch for rate limits.

⸻

☁️ Deployment Issues

Vercel not updating

Fix:
1. Push to GitHub.
2. Trigger redeploy in Vercel.
3. Check build logs for missing environment variables.

Render backend not responding

Fix:
1. Check Render logs.
2. Confirm Supabase + OpenAI keys exist in Render.
3. Increase timeout or memory if scraping large wildcard domains.

⸻

🗃️ Supabase / Database Problems

RLS performance warnings

If Supabase Performance Advisor shows:
auth_rls_initplan

This means policies use auth.uid() per row.

Fix:
Replace:
auth.uid()

With:
(select auth.uid())

This improves performance but is not urgent in development.

Multiple permissive policy warnings

If Supabase warns about multiple permissive policies, consolidate overlapping policies for each role + action to reduce execution overhead.

Queries not saving

Fix:
- Confirm table and column names match.
- Confirm service role key hasn’t rotated.
- Check Supabase status page.

⸻

🧠 RAG (Retrieval) Issues

Sync New/Changed does nothing

Explanation:
In delta mode, if no new non-wildcard URLs are detected, 0 documents will queue.

This is correct behavior.

Wildcard domains (/*) still require scanning to discover new URLs.

Force Full Resync re-scrapes everything intentionally.

RAG job shows “pending” forever

Fix:
Click “Run Sync Worker” (dev only).
Check /api/rag/run logs.
Check rag_jobs table for status changes.

Progress counter always shows 0

Explanation:
Progress is inferred from rag_documents written for that job_id.
If job_id is missing or polling is not running, UI cannot show progress.

Verify:
- lastRagJobId exists
- rag_jobs row exists
- rag_documents rows are inserting with correct job_id

Agent cannot retrieve known blog URLs

Fix:
1. Confirm rag_documents rows exist with source_url populated.
2. Confirm embeddings exist.
3. Confirm retrieveRagContext is ranking results.
4. Ensure URL & LINK RULES are enforced in system prompt.

If needed:
Force Full Resync and re-run worker.

⸻

🤖 AI Agent / Playground Issues

Playground returns “Failed to get a reply”

Fix:
- Check OpenAI API response status.
- Confirm CHAT_MODEL is valid.
- Check terminal logs for OpenAI 4xx or 5xx errors.

Agent says it “doesn’t know link” even though RAG exists

Cause:
Either:
- Similarity threshold too high
- URL ranking not boosted
- Embeddings missing

Fix:
- Lower minSim threshold
- Confirm URL boost logic
- Confirm embeddings are stored

Agent losing memory

Explanation:
Chat sessions are stateless unless logged to agent_sessions.

This is expected behavior.

⸻

🧾 Git & GitHub Issues

Sync script fails

Run:
./automation/update_memory.sh
./automation/sync_docs_to_github.sh

If Git reports “not a repository”:
Reclone the docs repo.

Permission denied

Run:
gh auth login

Confirm Git config:
git config --global user.name
git config --global user.email

⸻

💾 Backup & Recovery

Restore documentation snapshot

Go to:
/web/backups

Extract docs_<date>.tgz back into /web/docs.

Lost local project

Reclone from GitHub.
Restore latest docs backup.
Reinstall dependencies.

All operational knowledge lives in /web/docs.

⸻

🧭 Quick “Something’s Wrong” Checklist

1. Read terminal error message.
2. Verify .env.local keys.
3. Restart npm run dev.
4. Check Supabase dashboard.
5. Check Vercel or Render logs.
6. Confirm rag_jobs + rag_documents rows exist.
7. Run:
   ./automation/update_memory.sh
   ./automation/sync_docs_to_github.sh

⸻

🧩 When All Else Fails

1. Run update_memory.sh to back up docs.
2. Copy /web/docs somewhere safe.
3. Delete node_modules and .next.
4. npm install
5. npm run dev
6. If issue persists, open a GitHub Issue documenting:
   - What changed
   - Exact error message
   - Which environment (local / Vercel / Render)

Your .md documentation + backups mean no architectural knowledge is ever lost.