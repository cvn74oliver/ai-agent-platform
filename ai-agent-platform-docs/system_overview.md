# 🧩 AI Agent Platform – System Overview
_Last Updated: <month day, year>_

---

## 🧠 Purpose
This document explains how the **AI Agent Platform development system** works — for the human operator.
It summarizes all the moving parts, automation scripts, and daily routines in one place so you can re-orient yourself anytime.

---

## 🧱 Core Concept
The project is built around a **modular AI engineering team** running inside ChatGPT, powered by local documentation and automation.

Each AI "agent" (chat) acts as a specialized software engineer:
- Architect
- Frontend
- Backend
- Workflow Integrator
- LLM Trainer
- Avatar/Voice
- Project Manager (PM)

These AI agents reference the project’s `.md` files stored in `/web/docs/`, ensuring every chat has shared, persistent memory.

---

---

## 🧰 Software & Services Used

Below is the full list of all major systems, APIs, and platforms that power the **AI Agent Platform** — along with their purpose and how they connect together.

| System / Service | Type | Purpose / Description | Connection |
|------------------|-------|------------------------|-------------|
| **Next.js** | Frontend Framework | React-based framework running locally (`npm run dev`) and deployed to Vercel for production. | Serves the web app at `localhost:3000` (dev) and on Vercel (live). |
| **Node.js + npm** | Runtime & Package Manager | Executes the Next.js app and installs all dependencies. | Installed locally on MacBook. |
| **Supabase** | Backend-as-a-Service (Database + Auth + Storage) | Provides PostgreSQL database, user authentication, row-level security, and storage for files and logs. | Connected through `src/lib/supabase.ts`. |
| **Vercel** | Frontend Hosting | Hosts the deployed version of the Next.js frontend (production build). | Linked to GitHub main branch for auto-deploys. |
| **Render** | Backend Hosting | Handles long-running API routes or background jobs (if needed). | Deploys selected backend services and APIs. |
| **GitHub** | Version Control & Public Docs | Stores the source code (private repo) and the `/ai-agent-platform-docs` public documentation repo. | Sync handled via `sync_docs_to_github.sh`. |
| **ChatGPT (OpenAI)** | AI Development & Collaboration | Used as the “virtual dev team” (Architect, Frontend, Backend, etc.) and for generating/refining code, prompts, and strategies. | Uses `.md` context files for memory. |
| **OpenAI API** | Core LLM Engine | Powers agent creation, chat interactions, prompt engineering, fine-tuning, embeddings, and model routing. | Accessed in backend routes (e.g., `/api/generate-agent`, `/api/fine-tune`). |
| **Firecrawl API** | Data Ingestion / Crawling | Crawls and indexes external pages for RAG training and agent knowledge updates. | Called by `/api/crawl/route.ts`. |
| **Activepieces** | Workflow Builder | Default no-code automation builder that connects apps/services for each agent’s workflows. | Integrated via API for user workflow creation. |
| **Make.com API (Integromat)** | Custom Workflow Connector | Alternative workflow system used when Activepieces lacks a needed integration. | Invoked case-by-case from `/api/generate-workflow`. |
| **macOS Shortcuts** | Local Automation | Automates daily or end-of-day actions (e.g., syncing docs to GitHub). | Calls local shell scripts. |
| **Bash Scripts** | Automation Utilities | `update_memory.sh` merges docs and backups; `sync_docs_to_github.sh` pushes to GitHub. | Run locally or through macOS Shortcut. |
| **VS Code** | Code Editor | Used to write and manage all code, docs, and scripts. | Local development environment. |
| **zsh / Terminal** | Command-Line Interface | Executes local commands (`npm run dev`, automation scripts, git commands). | Default macOS shell environment. |

ChatGPT Agents  ⇄  Docs (.md)  ⇄  Local Scripts  ⇄  GitHub (Docs Repo)
│
▼
Next.js (local)
│
┌─────────────┴─────────────┐
▼                           ▼
Supabase (DB/Auth)          OpenAI API
│                           │
▼                           ▼
Render / Vercel Hosts       Firecrawl / Activepieces / Make

---

## 🧭 Notes
- All keys and credentials live securely in `.env.local` (never published).  
- The only public-facing repo is `/ai-agent-platform-docs` (contains `.md` documentation only).  
- You can add new integrations here as your platform evolves (e.g., analytics, logging, or voice providers).

---

## 🔗 System Relationships (Simple View)

---

## ⚙️ How the System Works (High Level)
1. **Local Environment**
   - You develop locally in `web/` using Next.js + Supabase + OpenAI APIs.
   - Run locally with `npm run dev` → available at `http://localhost:3000`.

2. **Documentation Memory**
   - Each agent’s work, decisions, and summaries are saved to `/web/docs/*.md`.
   - `00_MASTER_PROJECT.md` = unified snapshot of all role contexts.
   - The `update_memory.sh` script merges everything automatically.

3. **Public Docs (Reference Only)**
   - `/ai-agent-platform-docs` (GitHub repo) hosts public copies of `/web/docs/` for agents and collaborators to reference.
   - The `sync_docs_to_github.sh` script updates it with one command.

4. **Automation Scripts**
   - `automation/update_memory.sh` → backs up and merges docs.
   - `automation/sync_docs_to_github.sh` → pushes docs to GitHub.
   - Future scripts (optional): deploy builds, auto-run backups.

5. **AI Agent Workflows**
   - Each ChatGPT chat uses a short "kernel" (summary of its `.md` file).
   - When you open a chat, you paste the kernel or link the GitHub doc.
   - Agents produce results → you paste them into the appropriate `.md` file.
   - Run `update_memory.sh` at the end of each session.

6. **Daily, Weekly, Monthly Checklists**
   - `daily_checklist.md` → what to do each morning, during work, and end-of-day.
   - `weekly_checklist.md` → Friday wrap-up and progress summary.
   - `monthly_checklist.md` → backups, key rotations, and planning & cleanup.
   - Optional: quarterly planning template (`planning/Q1_2026_Plan.md`).

7. **Memory & Backup**
   - Every `update_memory.sh` run creates a compressed backup (`/backups/docs_<timestamp>.tgz`).
   - You can restore or review any previous snapshot if needed.

---

## 🧭 The ChatGPT Workflow
| Phase | What You Do | What Happens |
|--------|--------------|--------------|
| Start of Day | Run memory update + ask PM Agent for top 3 priorities | Refreshes project brain + creates daily plan |
| During Work | Use the relevant Agent chat | Agents generate code ideas, improvements, or task lists |
| End of Day | Summarize sessions + run both scripts | Saves progress, merges docs, and pushes updates |
| Weekly | Friday check-ins + changelog review | Ensures team direction and documentation accuracy |
| Monthly | Backups + API key rotation + planning | Keeps system secure and future-ready |

---

## 📁 Key Folders
/ai-agent-platform
│
├─ /web
│   ├─ /src          # Next.js code
│   ├─ /automation   # Scripts for memory + GitHub sync
│   └─ /docs         # Persistent AI memory + checklists
│
├─ /ai-agent-platform-docs (public GitHub mirror of /web/docs)
│
└─ /backups          # Automatic .tgz backups from update_memory.sh

---

## 🧰 Essential Commands
| Command | Purpose |
|----------|----------|
| `npm run dev` | Run local dev server on localhost:3000 |
| `./automation/update_memory.sh` | Merge docs + backup snapshot |
| `./automation/sync_docs_to_github.sh` | Push docs to GitHub |
| `git add . && git commit -m "..." && git push` | (If you want to push your main code repo) |

---

## 🔒 Security Notes
- Never publish `.env.local` or source code with secrets to GitHub.
- The public docs repo should only contain `.md` documentation.
- Regularly rotate API keys (monthly checklist).
- Always verify Supabase RLS rules are active.

---

## 🗓️ Checklists Overview
| Checklist | Location | Purpose |
|------------|-----------|----------|
| Daily | `/web/docs/daily_checklist.md` | Morning–Evening flow |
| Weekly | `/web/docs/weekly_checklist.md` | Friday wrap-up |
| Monthly | `/web/docs/monthly_checklist.md` | Backup, security, planning |

---

## 🧭 Long-Term Planning (Optional)
For quarterly strategy, add a file under `/web/docs/planning/`:
Q1_2026_Plan.md
Q2_2026_Plan.md
Each file tracks:
- Big goals (3–5 per quarter)
- KPIs / success metrics
- Key risks and mitigations

---

## 💡 Recovery Guide
If you ever lose context:
1. Pull latest public docs from GitHub.
2. Open a new ChatGPT session for the role.
3. Paste that role’s `.md` content (or link to it) between:
—BEGIN CONTEXT—
(file contents)
—END CONTEXT—
4. Ask the agent to summarize and resume work.

---

✅ Fully Automated
	•	update_memory.sh → merges and backs up docs
	•	sync_docs_to_github.sh → pushes updates to GitHub
	•	macOS Shortcut → runs both scripts
	•	Backups created automatically with timestamps

⚙️ Semi-Automated (AI + Human)
	•	Project Manager Agent reads 00_MASTER_PROJECT.md, updates TODO.md
	•	Weekly summary auto-updates CHANGELOG.md
	•	AI roles (Architect, Frontend, etc.) work inside ChatGPT, you only start/resume them
	•	Fine-tuning readiness checks and data logging

🧍 Manual (You)
	•	Run daily, weekly, monthly checklists
	•	Review and approve major AI decisions
	•	Kick off or restart chats when sessions expire
	•	Occasionally glance at CHANGELOG.md if something breaks

---

## 📜 Summary
This system turns ChatGPT into a structured, multi-agent development team that never forgets context, stays version-controlled, and keeps human oversight simple.

When in doubt, **run your checklists** and **update memory** — those two things keep everything working flawlessly.
