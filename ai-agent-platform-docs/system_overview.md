# 🧩 AI Agent Platform – System Overview
_Last Updated: March 11, 2026_

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


These AI agents reference the project’s authoritative `.md` files in `/ai-agent-platform-docs/`.  
`/web/docs/` is treated as generated mirror output, not source of truth.

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
  • Updates authoritative docs after major milestones (especially CHANGELOG.md, CURRENT_STATE.md, TODO.md, and system_overview.md)

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

Operational note:
- Multi-file implementation, compile/debug, runtime integration, schema, or tool-execution changes must stay in Codex.
- Single-file documentation edits, small copy tweaks, and tightly scoped one-file changes can be handled directly in ChatGPT through the VS Code / desktop editing path.
- Project Manager threads should explicitly declare which execution path is being used before work begins.

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
| **RAG Background Worker (Custom API)** | Backend Job Processor | Processes `rag_jobs`, crawls URLs, generates embeddings, writes `rag_documents`, updates job status. | Triggered automatically by `/api/rag/schedule` (run_now=true) or manually via `/api/rag/run`. |
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

ChatGPT Agents  
     ⇄  
Docs (.md files in /ai-agent-platform-docs)  
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
   - Playground runtime observability is active via structured `[playground][timing]` server logs, and runtime-state evidence/history loading now runs in parallel to reduce controller wait time.
   - Gmail Playground runtime UX is now action-consequence oriented: action-specific CTA labels and “What happens next” blocks clarify that review steps are read-only and mutation requires later separate approval/execution.
   - Playground/Approvals approval state now uses explicit scope semantics (`session` or `agent`), and Playground rehydrate can restore authoritative session chat snapshots from server events (`playground.session_snapshot`) instead of browser cache alone.
   - Runtime UI reconciliation now resolves candidate/cluster statuses from a canonical approval-id map so pending/rejected drift is reduced between Playground and Approvals.
   - Query-cluster current-step submissions and manual cluster submissions now share the same immediate optimistic cluster-status update path.
   - Clear conversation keeps prior-session unresolved approvals as informational context only (no ghost queue inflation).
   - Reviewed-batch deep context now has a dedicated detail surface (`/agents/[id]/playground/review`) with previous/next navigation across reviewed results.
   - Playground remains the high-level workflow controller (current step + queue + concise latest reviewed summary), while the detail page carries full reviewed-result evidence.
   - Result-specific Q&A is now supported via a dedicated chatbot scoped to the currently viewed reviewed batch.
   - Review-detail chat sessions are now isolated via a dedicated session origin namespace (`playground_review_detail`) so result-detail Q&A does not contaminate the main Playground workflow conversation.
   - Lifecycle suppression now uses reviewed-result history to demote stale sender/query recommendations and avoid re-promoting already reviewed/executed context as current steps.
   - Backend request-mode isolation is now explicit (`playground` vs `playground_review_detail`), allowing review-detail inference to run on a dedicated scoped prompt/load path instead of the full broad Playground prompt/runtime path.
   - Runtime evidence scoping is now session-aware for Playground/review-detail runtime views:
     - review/archive/review-result evidence is filtered to scoped approval ids when session scope is active.
     - this reduces stale cross-session sender/query leakage in current workflow context.
   - Operations Workspace split is now active:
     - `/agents/[id]/operations` is the primary operator workflow surface (overview/clusters/review/approvals/history).
     - Playground is now chat-first and acts as a handoff into Operations workspace for workflow actions.
     - Review-detail operator actions (customize + approval request workflow) now run on dedicated operations pages.
     - The operations shell uses a left-rail workflow navigator plus a right contextual AI side assistant panel.
   - Operations Workspace follow-up hardening:
     - Review-detail sender-level inline inspection is available from sender breakdown rows.
     - Exclusion reasoning is explicit in review message rows (sender/pattern/manual/keep-policy).
     - Operations approvals now execute inline approve/reject/execute actions using existing runtime APIs.
     - Operations history now provides richer action audit context (action, target, origin, outcome).
     - Operations pages consume a shared session-scoped runtime snapshot provider with cache + stale-while-revalidate to reduce repeated per-page rehydrate calls.
   - Operations workflow-correctness follow-up:
     - Cluster review routing is now cluster-id authoritative; opening a cluster no longer resolves to unrelated latest reviewed results.
     - Cluster inspection in Operations is direct/read-only; preview-review approval is no longer required just to inspect cluster evidence.
     - Review navigation now follows cluster queue order (`Previous cluster` / `Next cluster`) instead of reviewed-result-only traversal.
     - Pattern breakdown auto-compacts when only one pattern exists, reducing wasted workspace area.
     - Review detail now exposes interaction filters (`unread`, `starred/important`, `no interaction 90d`) and signal badges where metadata exists.
     - Opened-status unavailability is explicitly stated in review UI; engagement is framed as inferred from available Gmail metadata signals.
     - Review action bar now carries one explicit mutation request path (“Create archive approval request for selected messages”) with no-mutation-until-approve+execute consequence copy.
     - Approvals cards now consistently show request scope and outcome text (`Applies to`, `If approved`, `If approved/executed`, `If rejected`).
     - Operations shell now provides page-contextual assistant suggestions per workspace surface (overview/clusters/review/approvals/history).
     - Operations runtime snapshot caching now includes an in-memory cache layer + longer SWR window to further reduce navigation/remount rehydrate churn.
   - Operations trust + data-credibility follow-up:
     - left-rail visual overlap/cramping was corrected with cleaner nav spacing and active-state rendering.
     - cluster-review and approvals surfaces now explicitly communicate the sequence:
       - create request in review
       - approve/reject in approvals
       - execute approved action
     - review detail now exposes an explicit signal-honesty block (available vs inferred vs unavailable evidence signals).
     - interaction filters now disable when unsupported by current sample metadata instead of implying unavailable intelligence.
     - sender rows now include deeper sender analytics (sample share, estimated relationship, pattern mix, signal availability counts, sender classification, protected hints).
     - overview/review now include lightweight command-center charts (estimate-aware) for pattern/volume/scope decisions.

   - Operations data-depth hardening:
     - Gmail review/discovery runtime payloads now consistently carry richer per-message metadata when available:
       - thread_id, history_id, internal_date_ms
       - label_ids, category_labels, is_in_inbox
       - is_unread, is_important, is_starred
     - Operations Review now supports deeper bounded read-only evidence fetch for unreviewed clusters:
       - default depth: 30
       - optional deeper fetch: up to 60
       - fallback remains lightweight sample preview when deeper fetch is unavailable
     - Review evidence scope is now explicit and non-magical:
       - exact reviewed sample count
       - directional estimated cluster size
       - exact selected-for-request subset
       - visible evidence basis mode (executed review / expanded preview / fallback sample)
     - Signal coverage is now exposed as a first-class runtime truth surface:
       - actual signals (enabled when present)
       - inferred signals (enabled + explicitly labeled directional)
       - unavailable signals (explicitly declared, not implied)
     - Pending Approvals now surfaces execution-scope fields from approval args when available:
       - reviewed/candidate/selected/excluded counts
       - exact message-id scope labels
       - evidence basis + safety signals + protected exclusions
     - Overview now includes metadata scan-basis disclosure and operator question cues (start/largest/safest/mixed-risky).
   - Review trust hardening is active in runtime UX:
     - current-step consequence language explicitly distinguishes approval-request creation vs later execution.
     - sender preference controls now use operator-facing language:
       - Always keep newsletters from this sender
       - No preference
       - Lower priority (more likely archive candidate)
     - approval summaries include engagement-signal rationale (important/starred/reply-like/unread), confidence, and exclusions.
     - opened/open-tracking status is explicitly marked unavailable in this Gmail metadata flow; engagement is framed as inferred from available signals.
   - Current-step UX stabilization is active:
     - Current Step now explicitly separates lifecycle state, next user action, and read-only context.
     - lifecycle derivation is centralized in `playgroundWorkflowState.ts` (incremental canonical workflow-state extraction).
     - duplicated latest-review top-card surfaces were removed to reduce circular navigation feel.
     - current-review deep evidence remains canonical on the dedicated review-detail page.
   - Pre-approval customization (V1) is active for archive proposals:
     - operator can exclude senders and representative messages before submitting archive approval.
     - selected/excluded counts are shown before submit.
     - approval summaries reflect selected subset vs excluded items.
   - Operator scalability follow-up is active:
     - grouped archive selection is now available (pattern groups + sender groups + message controls).
     - a primary Decision Summary/Decision Diff panel now presents reviewed/selected/excluded scope, risk/confidence, and included/excluded examples.
     - sender preference is visually separated as **Future sender policy** so it does not appear as part of the immediate action decision.
     - shared approval cards now explicitly show **Total reviewed / Archive selected / Excluded-kept** fields.
   - Review-detail chatbot grounding was tightened:
     - scoped responses now emphasize observed evidence vs estimated signals and explicit ambiguity/confidence handling.

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
   - Each agent’s work, decisions, and summaries are saved to `/ai-agent-platform-docs/*.md` (authoritative).
   - `00_MASTER_PROJECT.md` = unified snapshot of all role contexts.
   - `CURRENT_STATE.md` = single source of truth for what is working now, known issues, golden-path verification, and immediate next steps.
   - The `update_memory.sh` script merges everything automatically.

3. **Public Docs (Reference Only)**
   - `/web/docs` is a generated mirror for local app/tooling consumption.
   - `/ai-agent-platform-docs` is the authoritative project documentation tree.
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

### 🧭 Project Manager Threading Protocol

For Project Manager operation, each thread should begin by declaring:
- PM version in use
- model
- reasoning effort
- feature domain
- execution path (Codex vs direct edit)
- authoritative docs update requirement after each major milestone (CHANGELOG.md, CURRENT_STATE.md, TODO.md, system_overview.md)

When a PM thread becomes long or spans too many implementation slices, handoff should occur to the next PM version rather than continuing indefinitely in the same thread.

Thread naming guidance:
- Use feature- or milestone-based names, not narrow temporary implementation names.
- Avoid naming a long-running thread after a single approval or bug-fix slice if the thread is actually covering a broader system area.

Current operating convention:
- Multi-file code work = Codex
- Single-file doc or constrained one-file edits = direct ChatGPT edit

## 📁 Key Folders
/ai-agent-platform
│
├─ /web
│  ├─ /src          # Next.js code
│  ├─ /automation   # Scripts for memory + GitHub sync
│  └─ /docs         # Generated docs mirror (not source-of-truth)
│
├─ /ai-agent-platform-docs   # Authoritative project docs
│
└─ /backups         # Automatic .tgz backups from update_memory.sh

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
| Daily | `/ai-agent-platform-docs/daily_checklist.md` | Morning–Evening flow |
| Weekly | `/ai-agent-platform-docs/weekly_checklist.md` | Friday wrap-up |
| Monthly | `/ai-agent-platform-docs/monthly_checklist.md` | Backup, security, planning |

---

## 📊 Analytics & Sessions Architecture

Tables:
- `agent_sessions`
- `agent_events`

Flow:
Playground call → OpenAI chat response → token usage recorded → `agent_sessions` row inserted → `agent_events` row inserted

Dashboard Metrics:
- Total sessions
- Playground sessions
- Token usage
- Estimated cost
- Approx human minutes saved

Note:
If sessions show zero, ensure Playground is inserting `agent_sessions` rows correctly.

Additional runtime session note:
- `agent_sessions` / `agent_events` are now also serving as the operational history source for runtime proposal state, approval state, execution evidence, and suggestion lifecycle reconstruction in Playground.
- This event history is now part of the runtime control plane, not just analytics.

---

## 🧭 Long-Term Planning (Optional)
For quarterly strategy, add a file under `/ai-agent-platform-docs/planning/`:
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

Confidence must be tracked per agent **per tool action** and **per workflow/SOP**. Auto-approval is granted only within that specific scoped boundary (agent + action, or agent + workflow version) and must not generalize to other actions or workflows.

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

### 6) Current Gmail Runtime Maturity (March 2026)
The Gmail runtime pilot has now progressed beyond pure planning and approval UI scaffolding.

Implemented in the current system:
- Inbox analysis runtime action (`gmail.analyze_inbox`)
- Sender-cluster review runtime action (`gmail.review_sender_cluster`)
- Archive runtime action (`gmail.archive_messages`)
- Approval queue integration for Gmail runtime actions
- Execute support for approved Gmail archive actions
- Runtime evidence surfaces in Playground for:
  - inbox analysis
  - reviewed batch evidence
  - archive execution evidence
- Generic runtime scaffolding now exists alongside Gmail-specific cards:
  - active work item
  - evidence blocks
  - suggestion sets

This means the platform is no longer only proving approval creation — it is now proving end-to-end approval + execute for at least one real Gmail write action.

### 7) Generic Runtime Scaffolding Standard
The Gmail pilot now doubles as the reference implementation for a platform-wide runtime pattern.

Generic runtime metadata currently established in Playground API:
- `runtime_active_work_item`
- `runtime_evidence_blocks`
- `runtime_suggestion_sets`

Design intent:
- Gmail is the first live adapter, not the permanent special case.
- Future tools (tax, marketing, CRM, file ops, etc.) should map into the same generic runtime scaffolding shape.
- Tool-specific cards may still exist, but the generic structures are the long-term contract that should unify runtime behavior across the platform.

Guiding rule:
Build tool adapters that feed the generic runtime structures instead of rebuilding custom runtime UI from scratch for each integration.

### 7A) Playground Runtime Controller Refactor (March 2026)

Playground runtime orchestration has been extracted out of `route.ts` into dedicated runtime modules:
- `suggestionLifecycle.ts`
- `stateLoaders.ts`
- `gmailRuntimeAssembler.ts`
- `runtimeStateService.ts`
- `playgroundPromptBuilder.ts`
- `playgroundRagService.ts`
- `playgroundChatService.ts`
- `playgroundAnalyticsService.ts`

Current route ownership is now primarily:
- request/response surface handling
- explicit `gmail.analyze_inbox` proposal trigger logic
- chat service invocation
- analytics service invocation

`rehydrate_only` behavior and runtime output shape were preserved through this refactor milestone.

### 8) Current Runtime UX Status (Updated March 9, 2026)
The Gmail pilot continuity/performance hardening pass addressed the most disruptive state issues:

- Playground session/chat/runtime state is now durable across refresh and approvals return flow.
- Initial mount flicker (dashboard → empty chat → dashboard) has been fixed.
- Runtime rehydrate latency has been reduced materially via runtime-state bottleneck optimization.
- Runtime sub-phase timing is now traceable through structured logs:
  - `[playground][runtime-state-timing]`
  - `[playground][timing]`

Remaining UX gap:
- Approvals still open in the same tab by default; continuity is preserved, but a new-tab flow may still be preferable for operators.

Implication:
Runtime execution and operator continuity are now stable enough to shift focus from reliability fixes back to UX/polish improvements.

March 9, 2026 UI status update:
- Playground runtime now uses an action-first top “Current Step” control center with one primary CTA and compact lifecycle status strip.
- Runtime details/evidence are organized as a lighter drawer with operator-first ordering:
  - Inbox analysis
  - Mailbox profile (30-day intelligence snapshot)
  - Recommended batch
  - Query cleanup clusters
  - Sender review proposal
- Query cleanup clusters are compact by default (top 3 first) with nested query/safety/risk/sample details.
- Conversation remains the secondary work area under runtime controls.
- Approvals queue presentation shifted from dense table format to compact decision cards with pending/actionable emphasis and compressed approved/executed rows.
- Known limitation: workflow progress currently reflects current workflow-step progress, not total inbox cleanup progress.
- Planned enhancement: define and implement a true Inbox Cleanup Progress metric after product definition is finalized.

March 11, 2026 runtime reconciliation follow-up:
- Query cleanup details now reconcile pending display with canonical queue summary, including first-step sender-review submissions initiated from Current Step.
- Return-from-approvals refresh path now treats authoritative queue summary as source of truth before re-showing pending/approved state.
- Clear-conversation carryover context remains session-informational only and no longer carries local pending/approved counts that can ghost-inflate queue display.
- Clear conversation semantics are now explicitly chat-only:
  - clearing chat does not unmount/hide the Runtime Operations Dashboard
  - clearing chat does not reset/erase approval lifecycle visibility
- Cleared-session transcript suppression now blocks stale message repaint for that session while still allowing runtime queue/evidence rehydrate.
- Approval presentation clarity pass (March 11):
  - Playground Current Step and Approvals cards now render a plain-English decision summary (action, scope, selection basis, breakdown, sample relationship, safety, effect).
  - Preview-to-batch relationship is explicitly labeled as representative sampling vs full selected/estimated scope.
  - Larger approval sets are framed as grouped decisions with representative samples rather than implying full manual item-by-item inspection.
- Approval decision-surface professionalization (March 11):
  - Decision cards now emphasize operator-grade facts at a glance: action, scope, source, why selected, risk, reversibility, exclusions, and approval effect.
  - Representative examples are now shown as compact rows (subject/sender/date) instead of prose-only summaries.
  - Compact approvals sections retain collapsible detail to support high-volume queue scanning without losing safety context.
- Shared decision-card refinement (March 11):
  - Playground and Approvals now render the same shared `ApprovalDecisionCard` component for consistent decision UX.
  - Hero-row facts (action/scope/source/risk/reversible) are visually dominant, while supporting rationale is demoted into collapsible details.
- Final decision-card polish (March 11):
  - Affected count/scope is now explicitly emphasized in the hero row for faster approval confidence.
  - Compact history cards preserve decision-legible facts at a glance (action/scope/source/risk) while staying dense.
  - Representative examples now follow a table-like subject/sender/date scan structure with snippet only when useful.
- Review-results workflow correction (March 11):
  - After review execution, Playground now enters a dedicated Review Results primary state before promoting next approvals.
  - Runtime details now separate current review evidence from historical review/archive evidence with explicit chronology labels.
  - Review Results includes operator-level cluster makeup, ambiguity/homogeneity indicators, recommended next action, and future-prevention recommendation framing.
  - Approval hero counts now read from structured summary fields with explicit estimate markers where counts are query-estimate based.

Mailbox Intelligence / Profiling status (March 9, 2026):
- Cleanup planning now includes a read-only profile layer before broad cleanup waves.
- `discoverGmailCleanupClustersForTenant(...)` now computes additive `mailbox_profile` metadata:
  - Gmail-native category/state/age-window estimates (30-day default window; 60-day compatible)
  - bounded sender-frequency and recurring-subject sampling
  - protection candidates, cleanup candidates, and rule opportunities
- Playground receives this as additive `runtime_mailbox_profile` metadata.
- The profile is estimate-oriented (query `resultSizeEstimate` + bounded samples), and remains approval-gated for downstream actions.

Mailbox profile freshness/caching (March 10, 2026):
- Runtime state service now applies a lightweight snapshot cache for cleanup discovery/profile data.
- Snapshot persistence:
  - `agent_events.event_type = runtime_cleanup_discovery_snapshot`
  - payload includes cleanup discovery data, profile window, generated/expiry timestamps.
- Freshness behavior:
  - `fresh`: new Gmail profile/discovery run completed this request.
  - `cached`: served from non-stale snapshot (no Gmail re-profile call).
  - `stale`: stale snapshot fallback used when refresh is deferred/failed.
- Default TTL: 30 minutes.
- Stale-refresh cooldown prevents repeated expensive Gmail refresh attempts during frequent rehydrate triggers.
- Playground runtime details expose last generated time, profile window, and freshness status + explicit refresh control.

Operator cleanup strategy layer (March 10, 2026):
- `gmailRuntimeAssembler` now derives additive `runtime_cleanup_strategy` from `runtime_mailbox_profile`.
- Strategy format is intentionally operator-first and fast to scan:
  - Protect first
  - Best first cleanup waves
  - Rule opportunities
  - Avoid / review carefully
- `playgroundPromptBuilder` consumes this strategy to enforce structured recommendation ordering.
- `page.tsx` surfaces strategy in a compact runtime-details card (no broad layout redesign).
- Strategy remains estimate-aware and approval-gated; no mutation behavior or bulk execution scope was expanded.

Trust + cleanup-promotion guardrails (March 10, 2026):
- Playground runtime now includes a compact trust snapshot block showing:
  - quick sample reviewed
  - mailbox profile window
  - metadata scan basis
  - recommendation confidence
- Cleanup action suggestions are de-emphasized when a 30-day mailbox profile is missing.
- Prompt guidance now avoids cleanup-approval tone when only tiny sample evidence exists without profile context.
- Playground examples are now agent-aware instead of hardcoded to one business domain.

Profiling basis update (March 10, 2026):
- Bounded metadata profiling basis increased:
  - metadata scan basis: 120 messages
  - id scan basis: 240 ids
- This improves profile representativeness while preserving bounded/cached behavior (still no full-mailbox scan).

## 🔄 Current Handoff State (March 8, 2026)
At handoff to the next Project Manager version, the system should be understood as follows:

- Gmail runtime pilot proves the plan -> approve -> execute pattern with a real archive action.
- Generic runtime scaffolding has been introduced and should now become the default pattern for all future tool domains.
- The next major system step is not more Gmail-only specialization; it is hardening persistence, continuity, and generalized runtime contracts so other tools can inherit the same framework cleanly.
- PM turnover discipline is now part of the operating model: versioned PM threads, explicit execution-path selection, and documentation-first handoff updates.

This document should now be read as describing both the original AI dev-team architecture and the emerging runtime operations architecture that will power real agent actions across the platform.
