# ✅ TODO — AI Agent Platform (Web)

_Last updated: 2026-02-13_

## Agent Session Health
- Project Manager — healthy (v6, Feb 13 2026)
- Architect — healthy
- Backend — healthy
- Frontend — healthy
- Workflow — healthy
- LLM Trainer — healthy
- Avatar & Voice — healthy
- Prompt Engineer — healthy

## 🔥 Current Focus (This Week)
1) **RAG Reliability + UX**
   - [x] Make **Sync New/Changed** incremental for exact URLs (no duplicate seed rows)
   - [x] Clarify wildcard behavior in UI (“wildcards require scanning to discover new URLs”)
   - [x] Add **job status + processed count** in Agent Summary (poll rag_jobs + rag_documents)
   - [x] Prevent accidental double-run (disable “Run Sync Worker” while a job is running)
   - [x] Improve progress UX (basic status panel + polling added; refine later for % estimation)
   - [ ] Persist last RAG job metadata in UI after page refresh (re-hydrate from rag_jobs + auto-load latest job on mount)
   - [ ] Decide: keep “Run Sync Worker” as dev-only or remove once dedicated background worker (cron/queue) is live

2) **Dashboard Analytics (High-Level “At a Glance”)**
   - [ ] Confirm /api/dashboard/metrics is stable + matches dashboard UI cards
   - [ ] Add small charts (7d / 30d usage, sessions, tokens, cost)
   - [ ] Add “Top Agents” list (sessions, tokens, cost, minutes saved)
   - [ ] Add “RAG Health” panel (latest jobs, errors by domain, last run timestamps)
   - [ ] Add cost breakdown per agent (7d / 30d) using agent_sessions totals

3) **Playground UX + Logging**
   - [x] Ensure agent_sessions row is created per playground call (and agent_events per call)
   - [ ] Improve session naming (short, human-friendly auto-title)
   - [x] Ensure RAG answers can return exact URLs when present in retrieved context
   - [ ] Add “Show sources used” toggle (for debugging trust)
   - [ ] Add lightweight session history panel (last 5 sessions per agent)

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

---

## 🧱 Known Issues / Risks
- Support center (support.curativemushrooms.com) often returns **HTTP 403** during crawl → expected unless we add auth/crawler headers.
- In dev, “run_now” fire-and-forget fetch may time out (HeadersTimeout / AbortError). Job can still be queued and run separately.
- Wildcard crawl patterns (/*) inherently require scanning to discover new pages → “delta” cannot magically detect changes without scanning.
- RAG progress tracking currently approximates progress via rag_documents count (not true total-discovered URL count for wildcards).
- Progress bar for wildcard crawls cannot be exact without a pre-discovery phase; current implementation shows processed count + status only.

---

## 🗺️ Next Targets (After This Week)
- Dedicated RAG background worker (separate process / queue-driven, no manual trigger required)
- Background worker hardening (retry logic, rate limiting, domain-level error reporting)
- Agent org-tree visualization (roles / hierarchy)
- Better agent naming model (short role-like titles, editable)
- Automations framework MVP (run an agent workflow end-to-end)
- “Aha moment” avatar + face card (image + persona, later voice/video)

Project Manager Agent – healthy (v6 activated Feb 2026)
