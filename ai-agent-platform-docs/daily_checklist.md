# 🔁 Daily Checklist – AI Agent Platform

## 🕘 Morning Startup
1. Open Terminal → `cd web`
2. Run local dev server → `npm run dev`
3. Open `http://localhost:3000` to verify it loads.
4. Run `./automation/update_memory.sh` to refresh master docs snapshot.
5. Open ChatGPT → Project Manager Agent → ask:
   “Review 00_MASTER_PROJECT.md and generate today’s top 3 priorities per role.”

## 🧠 During Work Blocks
1. When switching tasks, open the relevant Agent chat.
2. Paste the short kernel or link to its GitHub doc.
3. Run your command (`/resume_role`, `/summarize_session`, etc.).
4. Copy results → update the correct `*_CONTEXT.md` and/or `TODO.md`.

## 🕔 End-of-Day Wrap-Up
1. For each active Agent chat, run `/summarize_session`.
2. Paste each summary into its `*_CONTEXT.md`.
3. Run `./automation/update_memory.sh` (merges all docs).
4. Commit and push docs to GitHub (public update):
   ```bash
   ./automation/sync_docs_to_github.sh