# ✅ TODO — AI Agent Platform (Web)
_Last updated: 2026-03-09 (PM v7 Closing • Runtime Gmail Assistant Operational • Playground Runtime Refactor Milestone Logged)_

- Project Manager — healthy (v7 active, Mar 4 2026)
- Architect — healthy
- Backend — healthy
- Frontend — healthy
- Workflow — healthy
- LLM Trainer — healthy
- Avatar & Voice — healthy
- Prompt Engineer — healthy

## 🔥 Current Focus (This Week)

---

1) Agent Runtime — Supervision Ladder (Slices #1–#6A) (COMPLETE)
   - [x] Plan → approve endpoints + approvals UI
   - [x] Confidence accumulation engine
   - [x] Supervisor mode + eligibility endpoint
   - [x] Guarded auto-approve
   - [x] Sandbox execution pipeline
   - [x] Execution logging + status UI

2) Integrations — Gmail OAuth + Draft Execution (COMPLETE)
   - [x] Tenant-level integration storage
   - [x] Gmail OAuth connect flow
   - [x] Runtime Gmail draft creation

3) Inbox Assistant — Operational Runtime (IN PROGRESS)
   - [x] Gmail inbox metadata analysis tool (gmail.analyze_inbox)
   - [x] Sender-cluster review tool (gmail.review_sender_cluster)
   - [x] Batch archive proposal system
   - [x] Approval → execute pipeline wired end‑to‑end
   - [x] Gmail archive execution implemented (remove INBOX label via Gmail API)
   - [x] Execution evidence returned to Playground
   - [x] Runtime suggestion lifecycle states (ready / pending / approved / executed)
   - [x] Playground state persistence/continuity across refresh and approvals round-trip
   - [ ] Open approvals link should open in new tab
   - [x] Refresh reconciliation so Playground detects executions and runtime state on return

4) Performance Improvements
   - [x] Reduce sequential runtime-state DB loading in Playground (`stateLoaders` now parallelizes evidence/history queries)
   - [x] Reduce cleanup-plan runtime-state latency (parallel cleanup-cluster discovery sampling)
   - [ ] Playground fast-path (skip RAG for simple prompts)
   - [ ] Retrieval caching
   - [ ] Reduce simple prompt latency

## 🧠 Codex Operating Model (Updated Mar 2026)
---
**Execution Philosophy (Hybrid Model):**
- Single-file edits → Project Manager may edit directly in chat (no Codex required).
- Multi-file logic changes → Use Codex with declared Feature Domain.
- Schema / Supabase structural changes → Use Codex only if Supabase CLI is connected.
- Refactors affecting multiple layers → Codex required.

**Feature Domain Discipline (Non-Negotiable):**
Each Codex thread must stay within ONE domain:
1) RAG Ingestion & Retrieval  
2) Prompt Contract / Summary Rewrite Engine  
3) Fine-Tuning System  
4) Agent Runtime (Production Inference)  
5) Workflow / Automation Engine  
6) Dashboard Intelligence Layer  

No cross-domain edits in a single Codex thread.

**Important Clarifications:**
- Docker is NOT required unless running Supabase locally.
- Supabase schema updates require Supabase CLI login (remote projects supported).
- Q&A-derived Prompt Contract fields remain canonical authority.
- RAG is supplemental evidence only.
- Fine-tune dataset generation is a separate domain.

This model reduces bureaucracy, avoids redundant Codex calls, and preserves system integrity.
---
1) **PM v7 Activation + Clean Handoff (PRIMARY PRIORITY)**
   - [x] RAG ingestion verified (Drive + URL, embeddings confirmed)
   - [x] Retrieval weighting hierarchy implemented (Drive boost, product intent tuning)
   - [x] Canonical merge protection in rewrite engine (no silent field shrinking)
   - [x] Strict JSON schema enforcement for evaluate + refine
   - [x] Rewrite gating by quality threshold (fast vs forced path separation)
   - [x] Circuit breaker for OpenAI abort/socket failures
   - [x] Create final v6 tag + snapshot commit
   - [x] Activate Project Manager v7 (fresh context thread)
   - [x] Enforce Feature Domain isolation in Codex tasks (no cross-domain mixing)
   - [x] Confirm v7 adopts Codex Execution Protocol as canonical

2) **Observability + Confidence Layer (Post-v7)**
   - [ ] Add rewrite influence log (which fields were expanded vs preserved)
   - [ ] Add optional debug mode to display RAG chunk influence during rewrite
   - [ ] Add rewrite diff viewer (before vs after comparison)
   - [ ] Add retrieval inspection panel in Playground
   - [ ] Add quality score trend tracking

3) **Fine-Tune Weighting Formalization**
   - [ ] Confirm final weighting hierarchy:
         Q&A refinement (canonical contract)
         → Manual fine-tune examples
         → RAG (Drive prioritized over URL)
         → Crawl-only evidence
   - [ ] Document weighting model inside SYSTEM_OVERVIEW.md
   - [ ] Add automated regression guard for guardrails/escalation policy
---

## ✅ Completed / Major Milestones
- [x] Agent Summary page upgraded: dynamic textarea expansion for long blocks (mission/guardrails/etc.)
- [x] Quality pipeline stabilized:
  - “Recalculate” = fast path
  - “Force Full Rewrite” = expensive path
  - Added guardrails to prevent both buttons behaving like full rewrite
- [x] Fine-tune dataset preview, next training suggestion, and Q&A improvement flow working
- [x] RAG ingestion pipeline working end-to-end (schedule → run → documents ingested)
- [x] Playground RAG retrieval fixed to correctly surface **exact blog URLs** when present
- [x] Agent Runtime Slice #1 shipped: plan → approve endpoints + approvals UI (schema-free via agent_events)
- [x] Tool/Workflow governance spec updated: granular confidence tracked per agent per tool action and per workflow/SOP
- [x] Gmail Inbox Assistant end‑to‑end operational
  - Inbox analysis → sender cluster review → approval → archive execution
- [x] First real Gmail inbox archive executed successfully via runtime pipeline
- [x] Runtime suggestion lifecycle tracking implemented (approval_request → decision → execution_result)
- [x] Archive execution evidence surfaced in Playground UI
- [x] Gmail OAuth scope upgraded to include gmail.modify for write operations
- [x] Playground runtime controller refactor milestone:
  - Runtime lifecycle logic extracted into `suggestionLifecycle.ts`
  - Runtime evidence/history loaders extracted into `stateLoaders.ts`
  - Gmail runtime progression extracted into `gmailRuntimeAssembler.ts`
  - Runtime orchestration service extracted into `runtimeStateService.ts`
  - Prompt assembly extracted into `playgroundPromptBuilder.ts`
  - RAG retrieval stack extracted into `playgroundRagService.ts`
- [x] Playground thin-controller pass:
  - OpenAI chat invocation + response/error handling extracted into `playgroundChatService.ts`
- [x] Playground thin-controller pass:
  - Analytics/session logging extracted into `playgroundAnalyticsService.ts`

---

## 🧱 Known Issues / Risks
- Open approvals still navigates in the same tab (continuity preserved, but UX may still prefer new-tab behavior).
- Runtime suggestion status may require manual refresh to reconcile execution events.
- Inbox sampling limited to ~25 messages during testing to control API usage.
- Support center (support.curativemushrooms.com) often returns **HTTP 403** during crawl → expected unless we add auth/crawler headers.
- In dev, “run_now” fire-and-forget fetch may time out (HeadersTimeout / AbortError). Job can still be queued and run separately.
- Wildcard crawl patterns (/*) inherently require scanning to discover new pages → “delta” cannot magically detect changes without scanning.
- RAG progress tracking currently approximates progress via rag_documents count (not true total-discovered URL count for wildcards).
- Progress bar for wildcard crawls cannot be exact without a pre-discovery phase; current implementation shows processed count + status only.
- Prompt rewrite engine does not yet surface which retrieved RAG chunks influenced rewritten blocks (observability gap).
- Prompt rewrite engine currently relies on truncated RAG evidence pack (top-N chunks) to control token usage; full-document semantic influence is achieved via embeddings, not raw inclusion.

---

## 🗺️ Next Targets (After This Week)
- Dedicated RAG background worker (separate process / queue-driven, no manual trigger required)
- Background worker hardening (retry logic, rate limiting, domain-level error reporting)
- Agent org-tree visualization (roles / hierarchy)
- Better agent naming model (short role-like titles, editable)
- Automations framework MVP (run an agent workflow end-to-end)
- “Aha moment” avatar + face card (image + persona, later voice/video)

Project Manager Agent – v7 closing handoff complete • Inbox Assistant operational • Ready for PM v8 activation
