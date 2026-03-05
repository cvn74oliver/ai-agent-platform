# ✅ TODO — AI Agent Platform (Web)
_Last updated: 2026-03-05 (PM v7 Active • Runtime Slices #1–#3 Shipped • Hybrid Codex Model Confirmed)_

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

1) **Agent Runtime — Approval Queue MVP (Slice #1–#2) (DONE)**
   - [x] Added /api/runtime/plan (creates approval_request event)
   - [x] Added /api/runtime/approve (creates approval_decision event)
   - [x] Added /approvals page (server reads + client fetch approve/reject)
   - [x] Validated end-to-end locally (approval row appears; approve removes it)
   - [x] Golden Path passing after changes
   - [x] UUID validation returns 400 for invalid agent_id/approval_id
   - [x] Replaced inline script with `use client` approvals component

2) **Agent Runtime — Confidence Engine MVP (Slice #3) (DONE)**
   - [x] /api/runtime/approve logs confidence_update events per proposed tool.action
   - [x] /api/runtime/confidence endpoint returns aggregated action confidence
   - [x] Aggregation uses max payload.new_count (with safe fallback)

3) **Fast-win UI — Show confidence on /approvals (In Progress)**
   - [ ] Display per-action confidence (e.g., gmail.send_email: 1 / 10) alongside approval rows

4) **Agent Runtime — Slice #4 (Next)**
   - [ ] Add eligibility endpoint (graduation readiness) based on confidence thresholds
   - [ ] Add supervisor modes: training / guarded (no auto-execution yet)
   - [ ] Add optional plan_json expand/collapse viewer on approvals row

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

---

## 🧱 Known Issues / Risks
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

Project Manager Agent – v7 active • Runtime progressing • System integrity intact
