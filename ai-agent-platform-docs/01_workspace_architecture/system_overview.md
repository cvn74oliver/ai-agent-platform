# 🧩 AI Agent Platform – System Overview
_Last Updated: March 16, 2026_

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

### Gmail Cleanup Runtime Note (March 15, 2026)

Current Gmail cleanup architecture:
- Gmail cleanup now behaves as one sender-first guided product backed by sender-first cached intelligence, not a message-first analysis pipeline hidden behind sender-first copy.
- Active Phase 1 user-facing flow now reads:
  - `/operations` (route-safe handoff only)
  - `Mailbox Intelligence`
  - `Cleanup Groups`
  - `Sender Decisions`
  - `Confirmation`
- Direct route placeholders remain available for:
  - `Exceptions / Verification`
  - `Rules / Automation`
  - `Monitoring`
  but these are intentionally deferred to later phases.
- Cleanup groups are now sender clusters:
  - each sender maps to one deterministic cleanup group
  - message batches are no longer the grouping primitive
- Shared derived workspace caching now powers:
  - `mailbox_intelligence`
  - `sender_workspace`
  - `confirmation_preview`
- Phase 1 cache invalidation for the active Gmail cleanup workflow now keys off the cleanup snapshot itself:
  - `runtime_cleanup_plan.generated_at`
  - not broader mailbox-profile freshness during normal navigation
- Interactive runtime boot is now “stable snapshot first”:
  - the latest cached runtime snapshot is served immediately on interactive Phase 1 routes
  - runtime refresh is no longer triggered just because the local cache aged past a short TTL
  - post-boot refresh now depends on missing snapshot, zero-cluster recovery, or real indexed snapshot change
- Mailbox Intelligence and Cleanup Groups now prefer exact warm cached intelligence payloads before issuing new requests.
- Mailbox Intelligence and Cleanup Groups now reuse the same cached intelligence payload client-side, preventing repeated mailbox recomputation during navigation.
- Mailbox Intelligence cold-load behavior is now more defensive:
  - indexed mailbox row paging is concurrent and shared on the cold server path instead of strictly sequential
  - mailbox-context / derived-workspace server caches now key off the indexed mailbox snapshot (counts/date span) rather than cleanup-plan timestamp churn alone
  - the Intelligence page can render a runtime-backed mission boot state before the full mailbox-intelligence payload is ready
- Mailbox Intelligence is now intentionally high-level only:
  - sender-specific analytics have moved into Sender Decisions
  - cleanup groups are previewed there, but the full cleanup-group selection surface remains on the Cleanup Groups page
  - low-value technical scope details such as `loaded preview rows` are now demoted on the high-level surfaces so Mailbox Intelligence reads like a mission dashboard instead of a debug view
- Mailbox Intelligence now behaves more explicitly like mission control:
  - current status, inbox health, progress, next recommended action, top risk, started work, resume work, and approval queue lead the page
  - sender counts outrank raw mailbox/message counts
  - the page now previews only the single top recommended cleanup group as a handoff into Cleanup Groups rather than acting like a second cluster-selection surface
  - the Intelligence page no longer shows its scope ladder or older telemetry-heavy lower dashboard sections
  - the lower half is now reduced to one `Inbox Health Outlook` explanation layer plus a compact Cleanup Groups handoff
  - the only remaining supporting visual is a compact pressure-trend chart so the page feels like mission control, not a sender drill-down analytics surface
- Cleanup Groups is now more clearly the full sender-group selection surface:
  - Mailbox Intelligence previews only the top recommended group plus a direct CTA into Cleanup Groups
  - Cleanup Group cards can expose lightweight sender context / cautions without turning into the full Sender Decisions workspace
- Sender Decisions is now more clearly the drill-down workspace:
  - cluster-specific briefing at the top
  - sender analytics stay on this page
  - sender profile / caution context is more prominent directly on the sender cards
- Confirmation wording now reads as a cleaner Phase 1 review surface:
  - `Archive` = executes now after approval
  - `Keep`, `Quarantine`, `Unsubscribe`, and `Custom Rule` = saved-later Phase 1 preferences only
- Gmail cleanup client caching now includes:
  - in-memory reuse
  - sessionStorage mirror for same-session returns
  - 10-minute TTL keyed by cleanup snapshot + view state
- `Mailbox Intelligence` is now the real high-level cleanup dashboard:
  - whole mailbox context
  - cleanup-candidate context
  - protected/safe context
  - cleanup-group preview / handoff
- `/operations/review` is now a sender-first workspace where the active Stage 1 execution path is:
  - `stage=senders`
  - `stage=confirmation`
- Later-stage routes remain stable placeholders so navigation does not break while the Phase 1 foundation is stabilized.
- The product now explicitly teaches the narrowing hierarchy:
  - whole mailbox
  - cleanup candidate universe
  - cleanup group
  - sender set
  - loaded preview rows
- Sender workspace controls are now server-backed:
  - search
  - filter
  - sort
  - direction
  - filtered pagination metadata
- Direct review reliability is stronger:
  - missing/stale `cluster_id` now resolves to a recommended cleanup group automatically
  - direct entry waits for that recommended-cluster resolution instead of starting sender-workspace work for a fallback cluster first
  - Sender Decisions no longer depends on manual refresh to escape an empty direct-entry route
- Sender Decisions interaction hardening now includes:
  - debounced sender search
  - stable search-input focus during debounced query changes
  - request abort / last-request-wins behavior
  - stale-ready sender data retained on same-cluster filter/search/page changes instead of blanking the workspace
- Sender Decisions now owns sender-specific operational analytics:
  - sender category distribution
  - sender activity timeline
  - cluster contribution
  - chart clicks drive the sender list directly
- Sender workspace base derivation is now cached per cleanup snapshot + cluster:
  - selected-cluster sender derivation
  - sender-index signal loading
  - filter/sort/page slices reuse that cached base state
- Fast sender-page loading now avoids the broad indexed-message scan:
  - `sender_page` signal loading uses `gmail_sender_stats` as the fast path
  - the heavy `gmail_messages` scan remains reserved for deeper sender-detail paths
- Sender evidence is loaded for visible sender rows only, not every sender in the selected cleanup group.
- Messages are treated as evidence only until Confirmation, where exact current-message impact is shown.
- Archive remains the only live Gmail executor in this pass.
- `Keep`, `Quarantine`, `Unsubscribe`, and `Custom Rule` are explicit stored-later Phase 1 decisions / future automation intents only.
- Phase 1 workflow drafts now persist more durably for sender decisions:
  - session-scoped draft key
  - cluster-level fallback draft key
  - snapshot-version metadata to avoid replaying obviously stale drafts across snapshot changes
- Draft restore is now hydration-safe:
  - stored drafts are read before local write-back is allowed
  - navigation/reload/pagination returns are less likely to lose Phase 1 sender decisions
- Cleanup-discovery refresh is now more conservative during navigation:
  - normal rehydrate flows do not rebuild just because the stale TTL expired
  - navigation refresh now keys off actual indexed snapshot changes instead of sync timestamp movement alone
  - the server runtime state service now uses the same material-advance rule, so background sync timestamp changes alone do not hijack interactive routes
- Confirmation now supports Phase 1-safe editing:
  - change stored sender decision
  - clear stored decision
  - jump back into Sender Decisions for that sender
- Gmail cleanup now has the first Decision Destinations foundation layer after Confirmation:
  - approving Confirmation decisions commits durable sender destination states directly
  - destination states currently include:
    - `KEEP`
    - `ARCHIVE`
    - `QUARANTINE`
    - `UNSUBSCRIBE`
    - `CUSTOM_RULE`
  - sender profiles are now scaffolded in Gmail memory with:
    - sender identity
    - trust signals snapshot
    - current destination state
    - destination history
    - execution state
    - execution warning
    - last action timestamp
  - archive decisions now attempt direct Gmail archive execution immediately after the destination-state commit
  - execution truth is now separate from destination truth:
    - destination commit does not automatically imply archive execution success
    - archive can now surface as `succeeded`, `failed`, `deferred`, or `not_applicable`
    - `succeeded` is only allowed once inbox-label removal is actually confirmed against Gmail
  - archive destination profiles now retain the targeted archive message ids needed for truthful restore
  - `/operations/management` now supports a real archive restore path:
    - restore re-adds the `INBOX` label to the stored archive scope
    - restore must be verified before the archive destination state is cleared
    - if restore cannot be confirmed, the destination state remains active with a truthful warning state
  - the post-confirmation management scaffold now exists at `/operations/management`
  - the Gmail cleanup left rail now promotes `Management` as the post-confirmation destination surface and demotes approval/history pages into legacy audit status
  - this is still a structural layer only:
    - no full rule engine
    - no unsubscribe executor
    - no monitoring workflow activation
- Gmail cleanup learning is now wired end-to-end:
  - sender decisions persisted to `agent_events`
  - rule intents persisted to `agent_events`
  - active Gmail memory mirrored into `rag_documents`
  - Monitoring retrieves event memory + semantic Gmail memory and surfaces recommendations

### Gmail Operations Runtime Note (Historical - March 13, 2026)

Current Gmail Operations hardening status:
- Inbox Overview is now intentionally operational-first:
  - refresh health
  - indexed mailbox status
  - pending approvals
  - high-level operator counts
  - CTA guidance into deeper analysis
- Mailbox Intelligence is now the analytics-first layer:
  - it explicitly represents the **Cleanup Candidate Universe**, not the whole mailbox
  - it explains the cleanup goal in operator language before the user enters Cleanup Groups or Batch Review
  - it bridges Whole Mailbox -> Cleanup Candidate Universe -> Cleanup Groups -> Batch Review
- Gmail Operations navigation and staged review language is now intentionally congruent:
  - Operations Overview
  - Mailbox Intelligence
  - Cleanup Groups
  - Batch Review
  - Pending Approvals
  - Executed Actions
  - History
- Batch Review now behaves as a clearer guided workspace inside the existing route:
  - Step 1: Batch Overview
  - Step 2: Sender Decisions
  - Step 3: Message Verification
  - Step 4: Approval / Rule Recommendation
- The top workflow strip now mirrors the product navigation language so operators do not have to translate between left-rail labels and page-level scope labels.
- `cleanup_group_intelligence` now uses server-side cache + inflight reuse keyed by tenant, scope, cleanup-group universe, and runtime snapshot version.
- Inbox Overview now background-prewarms Mailbox Intelligence so the normal Overview -> Intelligence operator path opens on a warm indexed-universe payload when possible.
- Current cold-path diagnosis for Mailbox Intelligence is explicit:
  - the first uncached request is still dominated by loading indexed cleanup-universe rows into memory (`indexed_rows_load_ms`)
  - once that row set is warm, the same intelligence payload returns in sub-second timings
- Gmail Operations now includes a dedicated Mailbox Intelligence step before Cleanup Groups and Batch Review:
  - route: `/operations/intelligence`
  - order: Inbox Overview -> Mailbox Intelligence -> Cleanup Groups -> Batch Review
  - purpose: give operators a true bird's-eye view of the cleanup candidate universe before entering any bounded review batch
- Mailbox Intelligence is indexed-only and analysis-only:
  - no mutation controls
  - no snippet fetching
  - no batch-slice bias
- Mailbox Intelligence analytics are computed from the union of current cleanup groups against indexed inbox rows in the selected analysis window, deduped by message id.
- Current Mailbox Intelligence visuals include:
  - top senders across the full cleanup universe
  - sender volume distribution
  - email activity timeline
  - category breakdown
  - human vs automation ratio
  - sender count ranking table
- Live review UI now visibly exposes the active batch more clearly for human review:
  - bottom Message Review shows hydrated subject + snippet rows for visible review messages
  - sender/message pagination now use a shared toolbar pattern with explicit visible ranges
  - analytics charts at the top are now larger and easier to read (top senders, category distribution, recency, unread/protected mix)
  - signal availability is phrased in operator language rather than internal/debug wording
- Background cleanup regenerate now distinguishes operator analysis refresh from hard mailbox rebuild:
  - if current indexed coverage already spans the selected analysis scope, cleanup discovery can reuse the current index instead of re-paying a heavy sync path first
  - background cleanup refresh now disables fallback full-rescan recovery while recomputing cleanup groups for the operator
- Cleanup discovery diagnostics now expose:
  - `index_sync_reused_existing_coverage`
  - alongside existing `index_sync_ms`, `indexed_rows_load_ms`, and related timing fields
- Live snippet hydration is now more fault-tolerant:
  - snippet fetch retries transient failures
  - token refresh is attempted on `401`
  - structured logs capture snippet failure categories, failed-id samples, and fallback usage
- Sender detail loading is now more targeted:
  - sender-detail requests are distinguished from visible sender-page requests
  - indexed row scans are limited to recent 180-day evidence with smaller row caps for detail opens
  - sender-index timing logs now include query mode for easier diagnosis
- Review evidence now supports visible-row Gmail snippet hydration:
  - snippets are fetched only for rows currently on screen or inside expanded sender previews
  - this keeps first paint light while giving operators subject + snippet context where decisions are actually made
- Sender detail UX is now split into:
  - immediate card open / sender preview access
  - deferred indexed sender-history enrichment when the operator asks for it
- Review analytics dashboard is now chart-based and uses real current-batch data for:
  - top senders
  - category distribution
  - unread/protection mix
  - recency distribution
  - sender mix (when inferred sender-type evidence exists)
  - archive impact summary
- Review page now explains signal coverage in operator language:
  - available signals
  - inferred signals
  - unavailable signals
- Sender/message pagination controls are now more congruent, and message-review page sizes now include `10 / 25 / 50 / 100 / 200`.
- Review workflow now presents `Cleanup Group -> Batch -> Message Page` as the operator mental model instead of raw cluster/review-unit internals.
- Review detail page is now structured as an Inbox Cleanup Control Center:
  - Analytics Dashboard
  - Batch Summary
  - Filters Panel
  - Sender Workbench
  - Message Review
  - Decision / approval builder
- Batch summary now explains the relationship between cleanup-group total, active batch size, and current message page in plain language.
- Filters now sit directly above the sender workbench, and message review uses standard paginated list semantics instead of nested scroll behavior.
- Operations shell background regenerate copy now explicitly communicates that cleanup analysis is refreshing in the background while current cleanup groups stay visible.
- Large-cluster review now uses bounded review units with sender pagination/filtering to keep operator actions manageable.
- Large-cluster review units now include semantic operator buckets (recent/older promotions, social noise, commerce, recurring machine senders, one-off senders, mixed remainder) instead of generic sender dumps only.
- Sender filter controls now fully support type/protection filtering and report filtered coverage counts.
- Rule guidance is now inline near sender/decision controls (duplicate recap surface removed).
- Review-browser loaded-message cache is capped to preserve responsiveness during long multi-page review sessions.
- Regenerate clusters now runs as a background refresh flow in Operations shell/overview/clusters (current snapshot remains visible until new snapshot is ready).
- Runtime regenerate now supports snapshot-first background recompute (`force + rehydrate_only` serves current snapshot immediately while recompute runs asynchronously).
- Regenerate diagnostics now expose snapshot lifecycle fields (`snapshot_version_before/after`, recompute started/completed, total background duration).
- Review browser client calls now use in-flight request dedupe + short-lived cache keyed by cluster/unit/page/filter/sort/scope.
- Review evidence (`review_query_cluster`) now also uses in-flight reuse + short TTL cache for identical requests to reduce duplicate transition fetches.
- Review hydration now suppresses stale old-cluster render when requested cluster context is still loading.
- Query-cluster browse runtime now includes fast-path indexed retrieval for heavy cluster types and cache/in-flight dedupe to reduce repeated first-load recomputation.
- Fast-path candidate narrowing now also covers newsletter/noreply/shopping/social cluster families to reduce cold browse latency on those paths.
- Newsletter cold paths now attempt a promotions-category narrowed fast path before broader fallback matching.
- Review units now expose explicit large-cluster bounded modes (30d, 90d, older backlog, highest-volume senders, oldest unread, mixed) with clear per-unit totals.
- Incremental Gmail history-list failures now attempt bounded automatic recovery while preserving cached-index usability.
- Runtime diagnostics for review actions now include explicit scope/perf fields (`rows_scanned`, `cache_hit`, `fast_path_applied`, `duration_ms`) for PM verification.
- Review detail now uses explicit exact-count hierarchy (cluster total vs review-unit total vs current page rows), top analytics strip, and normal paginated message list (no nested scroll trap).
- Review-page inbox-analysis calls now carry explicit request-attribution metadata (`request_source`, `request_component`, `request_reason`, `request_phase`) so slow review requests can be tied back to specific UI surfaces/components.
- Initial review paint now defers non-critical sender intelligence and rule enrichment until the operator expands sender details or explicitly requests deeper sender analysis.
- Cleanup discovery logs now expose detailed timing subphases and runtime-state timing includes `cleanup_plan_detail_ms`, making long background regenerate paths diagnosable without Supabase inspection.
- Background cleanup refresh can skip a fresh mailbox index sync when a recent usable indexed state already exists, so repeated manual regenerate actions do less redundant index work.

---

## 🎯 Mailbox Intelligence — Command Dashboard Contract (Phase 1)

This defines how the **Mailbox Intelligence page MUST behave**.

### Core Goal (Non-Negotiable)
A "clean inbox" is NOT zero messages.
A clean inbox = **every sender has a decision**.

Primary metric:
- Sender Decision Coverage = decided_senders / total_indexed_senders

Message counts are **impact only**, never the definition of cleanliness.

---

### Required Story Flow (Top → Bottom)
The page MUST answer, within 3–5 seconds:

1. What is the size of my problem?
2. How clean is my inbox?
3. What is blocking progress?
4. What do I do next?
5. What happens if I do it?

---

### Required Sections (Locked Order)

1. Inbox Health (visual first)
2. Global Scale (senders + messages)
3. Cleanliness Goal (sender coverage)
4. Mission Control (AI briefing)
5. Pressure Trend (time-based signal)
6. Cleanup Groups Handoff (single next step only)

NO duplicate downstream dashboards.
NO Cleanup Groups exploration here.

---

### Visual Intelligence Rules

Every metric MUST have:
- a visual representation
- a clear denominator
- an explanation of meaning

If a visual does NOT add meaning → remove it.

Hover behavior MUST:
- add NEW information
- NEVER repeat visible text

---

### Interaction Rules

If the system tells the user to do something →
THERE MUST BE A BUTTON.

Examples:
- "Approve archive queue" → button required
- "Resume work" → strong CTA styling required
- "Open cleanup group" → direct action

No passive instructions.

---

### Pressure Trend Rules

- Must be FULL WIDTH
- Must be BAR-based (not thin lines)
- Hover must show:
  - exact period values
  - previous period values
  - delta
  - dominant sender group
  - recommended action

Numbers alone are NOT enough.

---

### Management Signals (Required Next Integration)
Mailbox Intelligence MUST eventually surface:
- archive count
- quarantine count
- unsubscribe count
- custom-rule count
- restore activity

These are the **true system outcomes**.

---

### Anti-Patterns (Strictly Disallowed)

- Repeating the same data in multiple places
- Showing percentages without denominators
- Mixing "index health" with "inbox health"
- Hover states that duplicate visible text
- Large empty visual areas
- Non-clickable next steps

---

### Codex UI Enforcement Rule (CRITICAL)

Every UI Codex prompt MUST include:

"Before changing UI, read:
- GMAIL_WORKSPACE_UI_STRUCTURE.md
- GMAIL_WORKSPACE_UX_SPEC.md
- GMAIL_WORKSPACE_VISUAL_INTELLIGENCE_SPEC.md
- Gmail Workspace Intelligent Dashboard spec

Do NOT introduce new UI patterns.
Only extend existing patterns.
If unclear, match existing layout and hierarchy exactly."

This prevents regression and UI drift.

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
	   - Gmail mailbox indexing hardening (data layer):
	     - mailbox index state now tracks directional coverage/health:
	       - `mailbox_estimated_total` (Gmail `resultSizeEstimate` baseline)
	       - `index_completion_pct` (bounded, directional)
	       - `last_index_duration_ms`
	     - indexer runtime now applies retry + exponential backoff with jitter for Gmail `429`/`5xx` responses.
	     - metadata fetch uses adaptive concurrency (start 20, degrade to 10 under sustained latency/retry pressure).
	     - sender analytics foundation added via `gmail_sender_stats`, recomputed from indexed `gmail_messages` after each successful sync.
	     - health endpoint (`GET /api/integrations/gmail/mailbox-index`) now returns additive indexing status/coverage fields for runtime monitoring.

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
     - Active-tenant index root-cause diagnostics now documented in workflow:
       - active agent resolves to tenant `085c8ef7-2fd7-4842-8499-cd605e894a77`
       - `gmail_messages` existed but had 0 rows for that tenant
       - `gmail_mailbox_index_state` was missing in schema cache in active environment
       - Gmail connection existed but refresh failed when `GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET` were absent
     - Operations runtime now performs a cooldown-guarded mailbox-index bootstrap when health reports zero indexed rows.
     - Review detail now consumes indexed sender evidence through `sender_index_signals` (indexed totals, 30/60-day counts, unread/important/starred/inbox mix, category/pattern mix, machine/human probabilities).
     - Cluster regeneration hardening from indexed data:
       - zero-cluster cached snapshots are no longer reused during `rehydrate_only` when indexed data has advanced or cached cluster count is zero.
       - cleanup snapshot schema advanced to `gmail.cleanup_profile_cache.v3` to invalidate stale empty-cluster cache payloads.
       - strict filter misses now emit explicit rejection diagnostics (source counts, rejection buckets, strict/fallback match counts).
       - fallback generation now guarantees a reviewable cluster when indexed inbox rows exist, preventing blank operational workflow surfaces.
     - Operations approvals source-of-truth alignment:
       - runtime payload now includes `runtime_approval_queue_items` derived from scoped approval lifecycle history.
       - Operations Approvals renders actionable cards from this scoped queue-item contract so summary counts and actionable rows reconcile from one source.
     - Review detail now includes advisory future-rule recommendations derived from indexed sender evidence.
     - Pattern Breakdown now compacts when only one low-information pattern exists to preserve decision-space for sender/message evidence.
     - Operator-control pass (March 12):
       - analysis window is now explicit and selectable in Operations (`7d/30d/60d/90d/180d/365d/all_indexed`)
       - regenerate-clusters action is visible in-Workspace (rail + Overview + Clusters)
       - selected scope now flows through runtime snapshot caching, cleanup discovery, and review evidence fetches
       - review page now states:
         - matching messages in scope
         - representative examples shown
         - discovery rows / inbox rows considered
         - analyzed date span + active analysis window
       - cluster/overview empty/limited states now provide clearer operator-facing reason text
     - Scope-authoritative recompute hardening (March 12):
       - fixed scope-refresh race where a just-selected scope could still trigger recompute using prior scope context.
       - scope changes now trigger recompute only after provider/query scope is updated.
       - runtime logs now emit `[playground][cleanup-scope]` with selected/effective/snapshot/review scope fields for PM verification.
       - active verification now shows aligned `365d` selection and `discovery_window_days: 365` in latest cleanup snapshot.
     - Indexed evidence browser + count-trust reconciliation (March 12):
       - query-cluster review now uses server-backed paginated browsing as primary evidence surface (filter/sort/page-size/prev-next/range).
       - review now differentiates total matching messages in selected scope vs loaded-across-pages evidence in current operator session.
       - overview/clusters/review now share canonical indexed coverage fields (`indexed_total_rows`, `indexed_inbox_rows`, `indexed_date_span_start/end`, `effective_discovery_window_days`, `discovery_rows_used`).
       - UI now explicitly warns when selected scope exceeds available indexed span so unchanged 180d/365d results are explained.
     - Bounded review-unit workflow hardening (March 13):
       - query-cluster review now splits giant clusters into bounded review units (sender/domain/pattern/recency/mixed).
       - each unit is capped at 5,000 recent rows to keep operator review manageable and predictable.
       - backend cache now stores precomputed unit row manifests, so page/filter/sort requests avoid repeated full-cluster re-filtering.
       - review detail now surfaces unit rationale + cluster share + protections + likely-safe-action before message paging.
     - Operations review usability hardening (March 13):
       - regeneration feedback now reports scope deltas (added/removed clusters, count shifts, indexed-span changes), so scope changes are visibly explainable.
       - sender breakdown is now compact-first and paginated; verbose sender analytics require explicit expansion.
       - review-unit list is now visibly browsable/paged (not only dropdown-based), with direct “Open unit” actions.
       - local read-only review lists now use explicit page navigation controls instead of long incremental load-more scrolling.
       - review flow copy is now explicitly stepwise (scope -> cluster -> unit -> paged inspection -> decision -> approval request).
     - Review UX hardening follow-up (March 12):
       - review evidence now emphasizes loaded-list count vs matching-in-scope count (less random-sample feel).
       - pattern filters collapse by default for multi-pattern clusters to reduce wasted page area.
       - sender-level rule guidance is inline at sender controls; cluster-level rule guidance is shown near decision/action creation.
       - archive approval context now carries explicit scope/depth metadata into approvals.
     - Incremental degraded-sync recovery follow-up (March 12):
       - when index health is `degraded_usable`, Operations runtime now runs cooldown-guarded background recovery retries.
       - UI copy now clarifies cached indexed data remains usable while recovery attempts run.
       - incremental history-list failures can now trigger cooldown-guarded full-rescan recovery fallback where safe.
   - Known unrelated typecheck blockers (outside Gmail scope) remain:
     - `web/src/app/agents/[id]/fine-tune/page.tsx` invalid module / unresolved symbols
     - `web/src/app/agents/[id]/summary/page.tsx` click handler type mismatch
     - `web/src/app/api/rag/run/route.ts` `resp` unknown-typing errors
     - Indexed cleanup discovery now includes fallback cluster synthesis so operations does not stall in analytics-only/no-cluster mode when strict query matching is sparse.
     - Runtime now avoids reusing fresh-but-empty cleanup snapshots when indexed rows exist:
       - snapshot cache version is advanced (`gmail.cleanup_profile_cache.v2`) and zero-cluster cached snapshots trigger a cooldown-safe recompute path.
     - Cluster discovery payload now carries indexed evidence windows and scope signals:
       - exact counts for 30d / 90d / 180d / total indexed
       - unread / important / starred / inbox counts
       - category mix and first/last seen timestamps
     - Sender index signals now include deeper windows (`90d`, `180d`) and `first_seen`.
     - Mailbox index health semantics now distinguish degraded-but-usable sync state:
       - `sync_health`, `usable_with_cached_index`, and `last_sync_error` are surfaced for operator trust.
     - Incremental index sync now records degraded status for partial metadata misses instead of hard-failing entire runs.
     - Discovery depth expansion hardening:
       - fixed shallow index-read behavior caused by single-query retrieval limits on indexed mailbox rows.
       - indexed message loading now paginates deterministically up to configured cap (50,000), enabling true historical discovery depth.
       - sender stats recomputation now uses paged indexed corpus reads (not shallow subset reads).
       - sender review signal loading now paginates with bounded cap for selected senders, improving decision-grade sender evidence.
       - discovery corpus selection now favors broader historical windows (`30/90/180/365`) when indexed depth supports it.
       - recent-mail age signals remain visible for diagnostics/safety, but no longer suppress reviewability of discovery corpus.
       - operations runtime context now triggers cooldown-guarded background full backfill when indexed depth is present but shallow.
       - Operations Overview + Clusters now expose explicit discovery-depth telemetry:
         - discovery rows used
         - inbox rows considered
         - discovery window days
         - indexed oldest/newest date range
         - shallow/moderate/deep evidence label
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


### 🧪 PM UI Review Protocol (Enforced)

UI testing must follow a tight loop:

1. Cold load
2. Warm load
3. Click only new/changed elements
4. Report ONLY:
   - pass/fail
   - what changed
   - what broke

Do NOT re-review entire system.
Do NOT repeat previous feedback.

PM is responsible for:
- interpreting screenshots
- mapping to spec
- generating next Codex instruction

Operator only provides:
- screenshots
- minimal behavior notes

This keeps iteration speed high.

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

## 🔄 Current Handoff State (March 19, 2026)

At handoff to the next Project Manager version, the system should be understood as follows:

### ✅ System Status (CRITICAL)
- Gmail ingestion pipeline is now **stable and production-grade**.
- Historical backfill is now:
  - resumable
  - checkpoint-safe
  - isolated from other sync paths
- Smart Sync is now:
  - strictly incremental
  - safe for daily maintenance
  - completely separated from historical traversal

### 🧠 Historical Backfill Model (NEW)
The system now uses a **bounded historical backfill architecture**:

- Default backfill target: **24 months (recent behavior focus)**
- Optional extended backfill: **36 months (admin-triggered only)**
- Backfill uses:
  - Gmail `internalDate` as the canonical boundary
  - post-page commit stop rule (never mid-page)
- Checkpoints:
  - persist across slices (`requested_limit_reached`)
  - only cleared on true completion (`historical_window_reached` or exhaustion)

This ensures:
- no more full re-index loops
- no wasted reprocessing
- controlled data scope aligned with product value

### 🎯 Product Direction Shift
The platform is now transitioning from:

**Infrastructure + ingestion + stability phase → COMPLETE**

Into:

**Core product experience phase → STARTING NOW**

Next primary focus:

### 👉 Sender Decision System (NEXT MAJOR BUILD)

This includes:
- Tinder-style decision UI
- Sender-level classification workflow
- Decision buckets:
  - Keep
  - Mixed (custom rules)
  - Archive
  - Quarantine
- High-speed operator interaction model
- Decision-to-execution pipeline into Management layer

### ⚙️ Runtime Maturity State
- Plan → Approve → Execute loop is working
- Gmail archive execution is live
- Approval queue system is functioning
- Runtime state + evidence model is stable

### 🚀 What Comes Next
The next Project Manager (v11) must:

1. Treat ingestion + indexing as **solved infrastructure**
2. Focus ONLY on:
   - Decision Mode UI
   - Sender classification UX
   - Management execution flow
3. Enforce strict adherence to:
   - UI specs
   - decision system specs
   - product flow specs

### ❌ What NOT to Do
- Do NOT revisit indexing unless a regression is proven
- Do NOT expand ingestion scope
- Do NOT mix Smart Sync with backfill logic
- Do NOT redesign dashboard again

### 🧭 Mental Model for PM v11

System is now:

- Stable
- Indexed
- Structured
- Ready for productization

Your job is no longer to "fix the engine"

👉 Your job is to **build the user experience on top of it**

---

This marks the end of PM v10 responsibility.

## Gmail Operations Review Architecture - March 13, 2026

The Gmail Operations review surface now follows a simplified operator workflow while preserving the existing bounded backend model:

- Backend model remains:
  - cleanup group
  - bounded batch
  - paginated message page
- UI model now presents this as a 3-step operator workflow:
  1. Batch Overview
  2. Sender Decisions
  3. Message Verification + Approval

This is intentionally a presentation/interaction-layer simplification:

- No schema change
- No broad runtime contract rewrite
- No mutation semantic change

Visible review architecture now emphasizes:

- top-of-page decision-support charts for the active batch
- clear batch/page count hierarchy
- sender controls grouped with sender filtering
- message verification grouped directly with approval building
- plain-English signal honesty about what Gmail does and does not provide

Evidence model:

- Indexed mailbox metadata remains the primary planning/discovery basis.
- Visible review messages use hydrated snippets fetched for the current visible rows.
- Sender preview and bottom Message Review now share the same snippet-oriented evidence approach.

---

## Gmail Operations Guided Review Architecture - March 13, 2026

The Gmail Operations review surface now uses a true 3-step interaction model on top of the same bounded backend primitives.

Underlying backend model remains unchanged:

- Cleanup Group
- Batch
- Page

The operator-facing workflow now maps that model into:

1. Step 1 - Batch Overview
2. Step 2 - Sender Decisions
3. Step 3 - Message Verification + Approval

Architecture intent:

- preserve bounded backend performance safeguards
- remove internal/runtime terminology from the primary operator flow
- make sender decisions happen before message verification
- make approval happen only after visible verification
- make rule recommendation appear only after the operator has made real decisions

Step ownership:

- Step 1 owns:
  - cleanup-group context
  - batch explanation
  - readable charts
  - opportunity/risk framing
- Step 2 owns:
  - sender filtering
  - sender sorting
  - sender inclusion/exclusion
  - future sender policy
- Step 3 owns:
  - message verification for the current sender/message scope
  - readable full message preview
  - approval request building
  - future rule recommendation based on actual choices

Gmail signal exposure contract in the UI:

- Actual Gmail/native metadata exposed:
  - sender
  - subject
  - snippet
  - date
  - unread
  - starred
  - important
  - category/label hints when available
- Derived/inferred guidance exposed:
  - machine-like vs human-like cues
  - sender risk framing
  - archive suitability framing
- Explicitly unavailable:
  - open history
  - click history
  - precise engagement timeline

---

## Gmail Review Metric Architecture - March 13, 2026

The Gmail Operations review UI now uses an explicit metric hierarchy to avoid sender-ranking drift across sections.

Authoritative sender-ranking metric:

- `Batch message volume`

This metric now drives:

- Step 1 top sender chart
- Step 2 default sender ordering
- sender card primary volume label

Secondary sender metrics remain available, but only when explicitly labeled:

- `Highest unread in batch`
- `Highest historical indexed volume`
- `Most recent sender activity`
- `Most protected / risky first`

Sender preview architecture:

- Query-cluster browser responses now include a bounded batch-wide sender breakdown.
- Each sender breakdown entry includes:
  - exact current-batch volume
  - batch unread / starred / important / inbox counts
  - batch first/last seen
  - dominant pattern summary
  - bounded preview messages
- The review page uses this sender breakdown instead of reconstructing sender order from partially loaded visible rows.

Result:

- Step 1 and Step 2 now reconcile to the same current-batch sender ranking.
- Expanded sender preview can show multiple examples from the current batch without requiring a separate deep review fetch for every sender.

---

## Gmail Operations Scope Hierarchy - March 13, 2026

The Gmail Operations workflow now has an explicit information architecture above the existing 3-step review flow.

Navigation order:

- Inbox Overview
- Mailbox Intelligence
- Cleanup Groups
- Batch Review

Scope hierarchy:

- Whole Mailbox
- Cleanup Candidate Universe
- Cleanup Group
- Batch
- Sender
- Message

Implementation notes:

- Mailbox Intelligence now explicitly represents the Cleanup Candidate Universe derived from indexed cleanup-candidate rows, not the whole mailbox.
- A shared scope strip component is reused across Intelligence, Cleanup Groups, and Review so the operator can see where current counts sit in the hierarchy.
- Intelligence drill-downs can now filter the analytics view by sender, distribution bucket, category, or activity window without leaving the page.
- Review Step 2 now bridges sender counts across:
  - current batch
  - cleanup group
  - cleanup candidate universe
- Sender preview rows in Step 2 now expose the same message-preview affordance used in Step 3, so sender inspection is no longer a dead-end.

Result:

- The operator can tell whether they are looking at the whole mailbox or only cleanup candidates.
- The relationship between `45,781 -> 43,000 -> 1,000 -> sender/message` is now explained in the UI rather than left implicit.
- The existing 3-step review flow remains intact, but it now sits cleanly under the larger mailbox-to-message hierarchy.

---

## Gmail Operations Architecture Correction - March 13, 2026

Current intended product flow:

1. Operations Overview
2. Mailbox Intelligence
3. Cleanup Groups
4. Batch Review
5. Pending Approvals / Executed Actions / History

Current role of each surface:

- `Operations Overview`
  - operational shell
  - health/status/next step only
  - intentionally no longer the main analytics surface
- `Mailbox Intelligence`
  - bird’s-eye analytics layer
  - primary entry into the Cleanup Candidate Universe
  - drill-down source for sender and category analysis
- `Cleanup Groups`
  - group-selection layer between analysis and review
- `Batch Review`
  - guided review workspace
  - contains local stages without replacing the broader flow

Current navigation architecture:

- Global navigation:
  - left rail
  - compact workflow path on page
- Local navigation inside Batch Review:
  - stage nav for:
    - Batch Overview
    - Sender Decisions
    - Message Verification
    - Approval / Rule Recommendation

Rationale:

- The operator should not see two competing analytics surfaces.
- The operator should understand the journey as:
  - understand the cleanup universe
  - choose a cleanup group
  - review a safer batch
  - verify exact messages
  - send the decision into approvals

Current intelligence performance model:

- `cleanup_group_intelligence` remains expensive for a true first cold build because indexed candidate rows must be loaded and aggregated.
- User-visible route flow now reuses warmed intelligence payloads via a stable cache version derived from:
  - cleanup plan generation timestamp
  - mailbox profile freshness generation timestamp
- Result:
  - normal Overview -> Intelligence -> Groups -> Review flow avoids repeatedly paying the original `~42s` cold path
  - remaining optimization work is now concentrated on the true first uncached build rather than repeat navigations

---

## Runtime Module Deployment Integrity Note - March 14, 2026

The Gmail/playground runtime split now depends on a larger `web/src/lib/runtime/` module set than the tracked `HEAD` tree currently contains.

Current build-stabilization finding:

- Source files such as `gmailRuntimeAssembler.ts`, `playgroundPromptBuilder.ts`, `playgroundResponseBuilder.ts`, `playgroundRagService.ts`, `playgroundChatService.ts`, `playgroundAnalyticsService.ts`, `playgroundAgentConfigService.ts`, and `suggestionLifecycle.ts` are present locally at the expected alias-resolved paths.
- Additional runtime support files such as `operationsWorkspace.ts`, `operationsAnalytics.ts`, `approvalSummary.ts`, `gmailCleanupMemory.ts`, `gmailCleanupWorkspace.ts`, and `playgroundWorkflowState.ts` are also locally present and referenced by source.
- The current production-build risk is not pathing logic. It is that the runtime module split is only partially represented in the tracked tree.

Implication:

- Any deploy branch that includes imports of these runtime modules must ship the corresponding files together, or Vercel will fail during module resolution before the app reaches higher-level validation.
