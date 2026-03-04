# 🧩 AI Agent Platform – System Overview
_Last Updated: March 3, 2026_

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

### 🆕 Execution Architecture (Codex-Driven Development)

As of March 2026, development operates under a Codex-driven execution model.

Separation of Responsibilities:
- ChatGPT (Architect / PM / Specialist Roles)
  • Designs architecture
  • Defines constraints
  • Controls feature boundaries
  • Prevents regression or silent contract drift

- Codex
  • Writes and edits code
  • Executes terminal commands
  • Runs compile/debug loops
  • Performs multi-file refactors
  • Confirms working state

This separation ensures:
- Architecture-first development
- Reduced hallucination risk
- Controlled rate-limit usage
- Clear feature-domain isolation

---

### 🧠 Hybrid Execution Model (Important Clarification)

Not every change requires Codex.

The system now operates under a **Hybrid Model**:

• Single-file edits, documentation updates, and lightweight logic adjustments  
  → Can be handled directly in ChatGPT (Project Manager / Specialist role).  

• Multi-file refactors, compile loops, terminal-dependent changes, schema migrations, or risky structural edits  
  → Must be delegated to Codex.

Purpose:
- Reduce unnecessary execution overhead.
- Avoid bureaucratic slowdowns.
- Preserve architectural safety for high-impact changes.

Decision Rule:
If the task affects more than one file OR requires running terminal commands → use Codex.
Otherwise → direct edit is acceptable.

---

---

## 🧰 Software & Services Used

Below is the full list of all major systems, APIs, and platforms that power the **AI Agent Platform** — along with their purpose and how they connect together.

| System / Service | Type | Purpose / Description | Connection |
|------------------|-------|------------------------|-------------|
| **Next.js** | Frontend Framework | React-based framework running locally (`npm run dev`) and deployed to Vercel for production. | Serves the web app at `localhost:3000` (dev) and on Vercel (live). |
| **Node.js + npm** | Runtime & Package Manager | Executes the Next.js app and installs all dependencies. | Installed locally on MacBook. |
| **Supabase** | Backend-as-a-Service (Database + Auth + Storage) | Provides PostgreSQL database, user authentication, row-level security, and storage for files and logs. | Connected through `src/lib/supabase.ts`. Schema changes may be executed via Supabase Dashboard OR Supabase CLI (if linked locally). |
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
| **RAG Background Worker (Custom API)** | Backend Job Processor | Processes `rag_jobs`, crawls URLs, generates embeddings, writes `rag_documents`, updates job status. | Triggered automatically by `/api/rag/schedule` (run_now=true) or manually via `/api/rag/run`. |

---

## 🧭 Notes
- All keys and credentials live securely in `.env.local` (never published).  
- The only public-facing repo is `/ai-agent-platform-docs` (contains `.md` documentation only).  
- You can add new integrations here as your platform evolves (e.g., analytics, logging, or voice providers).

---

## 🔗 System Relationships (Simple View)

ChatGPT Agents  
     ⇄  
Docs (.md files in /web/docs)  
     ⇄  
Local Automation Scripts  
     ⇄  
GitHub Docs Mirror  
     ⇄  
Next.js Frontend (localhost / Vercel)  
     ⇄  
Supabase (DB + Auth + RLS)  
     ⇄  
OpenAI API (Chat + Embeddings)  
     ⇄  
RAG Worker (rag_jobs → rag_documents)  
     ⇄  
Firecrawl / External Crawlers

---

## ⚙️ How the System Works (High Level)
1. **Local Environment**
   - You develop locally in `web/` using Next.js + Supabase + OpenAI APIs.
   - Run locally with `npm run dev` → available at `http://localhost:3000`.

1.5 **RAG Sync & Incremental Crawling**
   - `/api/rag/schedule` creates a `rag_jobs` row and seeds `rag_documents`.
   - Modes:
     - `delta` → skips exact duplicate non-wildcard URLs.
     - `full` → forces re-crawl of all configured seeds.
   - Wildcards (e.g., `/*`) must still be scanned in delta mode to discover new pages.
   - Jobs run server-side and continue even if the user leaves the page.
   - Progress is inferred by:
     - `rag_jobs.status`
     - Count of `rag_documents` written per `job_id`.

2. **Documentation Memory**
   - Each agent’s work, decisions, and summaries are saved to `/web/docs/*.md`.
   - `00_MASTER_PROJECT.md` = unified snapshot of all role contexts.
   - `CURRENT_STATE.md` = single source of truth for what is working now, known issues, golden-path verification, and immediate next steps.
   - The `update_memory.sh` script merges everything automatically.

3. **Public Docs (Reference Only)**
   - `/ai-agent-platform-docs` (GitHub repo) hosts public copies of `/web/docs/` for agents and collaborators to reference.
   - The `sync_docs_to_github.sh` script updates it with one command.
   ⚠️ Note: The sync script is intentionally non-destructive and must never delete documentation files. If required files (e.g., CURRENT_STATE.md) are missing locally, the sync aborts.

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
   - Every `update_memory.sh` run creates a compressed backup (`/backups/docs_<timestamp>.tgz`). Backups capture the current docs state at run time and should be verified before relying on them for restore.
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
| RAG Sync | Click Sync New/Changed or Force Full Resync | Creates rag_jobs + seeds rag_documents + background crawl + embedding generation |

### 🧠 Feature Domain Protocol

All development tasks must be scoped to a single Feature Domain:

1. RAG Ingestion & Retrieval  
2. Prompt Contract / Summary Rewrite Engine  
3. Fine-Tuning System  
4. Agent Runtime (Production Inference)  
5. Workflow / Automation Engine  
6. Dashboard Intelligence Layer  

Rules:
- Do not mix domains inside one Codex thread.
- Declare reasoning level (LOW / MEDIUM / HIGH / EXTRA-HIGH).
- Explicitly list files required for execution.
- Define constraints before code generation.
- Protect canonical Q&A-derived contract fields from silent modification.
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

## 🗄️ Supabase Schema Management

There are two ways schema changes can be made:

1. Supabase Dashboard (manual SQL in browser)  
2. Supabase CLI (local, via terminal)

The Supabase CLI is optional.

If installed and linked:
- Codex can generate migration SQL files.
- You can run `supabase db push` locally.
- Schema changes become version-controlled.

If not installed:
- Schema changes must be executed manually in the Supabase Dashboard.
- Codex can still generate the SQL — you paste it into the browser.

Installing Docker is ONLY required if using Supabase CLI locally.
It is NOT required for normal development.

---

## 🗓️ Checklists Overview
| Checklist | Location | Purpose |
|------------|-----------|----------|
| Daily | `/web/docs/daily_checklist.md` | Morning–Evening flow |
| Weekly | `/web/docs/weekly_checklist.md` | Friday wrap-up |
| Monthly | `/web/docs/monthly_checklist.md` | Backup, security, planning |

---

## 📊 Analytics & Sessions Architecture

Tables:
- `agent_sessions`
- `agent_events`

Flow:
Playground call →
- OpenAI chat response
- Token usage recorded
- `agent_sessions` row inserted
- `agent_events` row inserted

Dashboard Metrics:
- Total sessions
- Playground sessions
- Token usage
- Estimated cost
- Approx human minutes saved

Note:
If sessions show zero, ensure Playground is inserting `agent_sessions` rows correctly.

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

## RAG Architecture (Phase 3 – Incremental + Background Processing)

Core Tables:
- `rag_jobs`
- `rag_documents`
- `rag_chunks`

Flow:
Agent Summary  
→ `/api/rag/schedule`  
→ `rag_jobs` row (status = pending)  
→ seed `rag_documents` created  
→ background `/api/rag/run` worker  
→ crawl + chunk + embed  
→ update `rag_jobs.status` (completed / failed)

Modes:
- `delta`
  - Skips exact duplicate non-wildcard URLs
  - Optionally skips wildcard re-crawl
  - Designed for incremental updates
- `full`
  - Forces re-crawl of all configured seeds

Progress Model:
- `rag_jobs.status`
- `rag_documents` count per `job_id`
- `updated_at` timestamp

Important:
- Jobs continue even if the user leaves the page.
- Wildcards require scanning to discover new pages.
- External domains may block crawler (403).
- Embeddings are stored using `text-embedding-3-small`.

Retrieval Weighting Hierarchy (Current Logic):

1. Q&A-Derived Contract Fields (Highest Authority)
   - Manual "Improve Quality with Q&A" sessions.
   - Canonical behavioral contract.
   - Must never be overridden by RAG content.

2. Google Drive RAG Documents (Structured Knowledge)
   - SOPs, guides, internal doctrine.
   - Boosted when book/manual intent is detected.

3. Crawled URL Content (Supplemental Context)
   - Product pages, help articles, marketing copy.
   - Penalized when user intent indicates internal book/manual reference.

RAG content is supplemental to the contract — never authoritative over it.
---

## Agent Runtime + Tool System v1

This section defines the production inference control loop and tool-governance model for Agent Runtime.

### 1) Plan -> Approve -> Execute Loop
- Agents must generate an explicit execution plan before running any tools.
- The plan must list: objective, intended tool actions, expected outputs, and risk level per action.
- No tool execution is allowed until the plan is approved through the runtime approval path.
- After approval, execution proceeds only for approved actions; any scope change requires re-plan and re-approval.

### 2) Tool Registry Concept
The Tool Registry is the canonical control plane for all runtime tool usage.

Registry requirements:
- `tools`: named tool definitions available to runtime agents.
- `tool actions`: granular operations per tool (read/list/create/update/delete/execute variants).
- `authentication`: required auth method and credential policy for each tool/action.
- `risk levels`: policy classification per action (for example: low, medium, high) used for gating and approvals.

Behavioral rules:
- Agents may invoke only registered tools and registered actions.
- Unregistered tools/actions are blocked by default.
- Authentication and risk policy must be resolved from registry metadata at execution time.

### 3) Approval Queue Model
Approval is maturity-based and follows a controlled progression:
- `new hire`: all non-trivial actions require explicit human approval.
- `confidence`: repeated correct behavior earns scoped auto-approval for low-risk actions.
- `graduation`: agent can auto-execute approved low-risk patterns, while medium/high-risk actions remain gated.

Queue requirements:
- Every pending action enters an approval queue with plan context, tool/action, risk level, and rationale.
- Approvers can approve, reject, or request revision.
- Rejections and revisions feed back into agent confidence scoring.

### 4) Audit Logging Requirements
All runtime decisions and tool operations must be fully auditable.

Minimum log fields:
- timestamp
- agent identifier
- session/run identifier
- plan version
- tool + action
- authentication context (policy reference, not raw secrets)
- risk level
- approval decision (approved/rejected/revised), approver, and decision timestamp
- execution result (success/failure) and error summary

Audit principles:
- Logs must preserve end-to-end traceability from plan creation through final execution result.
- Logs must be immutable or append-only in practice.
- Logs must support operational review, incident analysis, and compliance reporting.

### 5) MVP Pilot Example: Gmail Inbox Assistant
Pilot objective: validate Agent Runtime tool governance on a constrained, high-utility workflow.

Pilot workflow:
- Scan inbox.
- Classify email categories (important, routine, junk/spam-like).
- Label/archive junk messages.
- Flag important emails for user attention.
- Enforce approval gating before any destructive or user-visible state change.

MVP gating policy:
- Read/classify steps can run under low-risk policy.
- Label/archive and other state-changing actions require approval unless agent maturity policy explicitly allows them.
- Any uncertain classification escalates to approval queue instead of auto-action.
