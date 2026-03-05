# CURRENT_STATE — AI Agent Platform

Last updated: 2026-03-04  
Project Manager: v7 (active — synchronized under Codex Hybrid Execution Model)

---

# 🟢 System Health

Build: Clean  
Golden Path: Passing  
Golden Path Health Check:
- Automated validation script implemented (`web/scripts/golden-path.mjs`)
- Run from `/web` directory using:
  AGENT_ID="your-agent-id" npm run golden-path
- Script verifies the full operational pipeline:
    1. Training orchestrator responds
    2. Feedback logging works
    3. Recalculate quality (dry-run) succeeds
    4. Fine‑tune preview endpoint responds
    5. Playground query executes
    6. Usage logging endpoint records activity
- PASS indicates the platform core loop is operational.
- FAIL indicates infrastructure break (API route, env config, or server not running).

Agents: Healthy  
Documentation: Synced  

Execution Model:
- Hybrid (ChatGPT direct edits + Codex multi-file execution)
- Codex required only for multi-file, terminal, or schema-impacting tasks
- Single-file edits may be handled directly by Project Manager
- Domain isolation enforced (see Codex Execution Protocol)

Recalculate Quality:
- Fast path enabled (no rewrite if score ≥ TARGET_QUALITY_SCORE = 8)
- Rewrite gating verified (no unnecessary OpenAI refine calls)
- Force Full Rewrite available
- Dry Run supported (no persistence)
- Strict JSON schema enforced
- Circuit breaker active for OpenAI aborts
- Rewrite retry guarded against under-detailed outputs
- Canonical merge protection (no silent field shrink)

RAG Retrieval:
- Embedding + cosine similarity active
- URL boost logic (context-aware)
- Drive-first weighting for book-content queries
- Product-page penalty for non-shopping intent
- Canonical hierarchy enforced:
  Q&A training data > Drive knowledge > Crawled URLs
- Drive chunk retrieval validated against real PDF previews (875 embedded chunks confirmed active)

RAG Sync:
- Delta + Full modes implemented
- Wildcard detection supported
- Job-based ingestion (rag_jobs)
- Supabase polling status updates
- Manual worker trigger retained for dev

Drive ingestion verified:
- 875 embedded Drive chunks
- 541 embedded URL chunks
- Avg chunk size ≈ 1400–1500 chars
- Retrieval validation confirmed via Playground

Dashboard Metrics:
- Session logging (agent_sessions)
- Event logging (agent_events)
- Token usage tracking
- Approx cost + human-time proxy

---

# 🔧 Fully Operational Systems

## Agent Summary
- Recalculate Quality (fast)
- Force Full Rewrite
- Improve with Q&A
- Field-level Clarify threads (persistent)
- Fine-Tune Preview (grouped canonical topics)
- RAG Sync + Job status display
- Non-blocking sync (safe navigation)

## Playground
- RAG retrieval active
- Correct URL retrieval confirmed
- Strict URL safety (no fabrication)
- Usage metrics captured

## LLM Training
- Save & Next
- Save & Finish
- Evidence pack integration
- Non-destructive prompt merge
- Quality score persistence
- fine_tune_examples logging

## Backend Stability
- evaluateQuality stable
- finalRefine stable
- Strict JSON schemas enforced
- Evidence compaction active
- Embedding normalization hardened
- Cosine similarity retrieval validated
- Core contract fields protected from shrink (>30%)
- Strict merge preservation validated during forced rewrite (no contract loss observed)

## Agent Runtime (Slice #1 — Approval Queue MVP)
- `/api/runtime/plan` endpoint implemented (generates execution plan and logs `approval_request` events).
- `/api/runtime/approve` endpoint implemented (logs `approval_decision` events).
- `/approvals` dashboard page implemented:
  - Server-side admin reads from `agent_events`.
  - Computes pending approvals (request without decision).
  - Approve/Reject actions call runtime API via `fetch`.
- Schema-free MVP implemented using existing `agent_events` table.
- End‑to‑end validation completed locally (plan → approval → row removal).

---

# 🚀 Current Strategic Focus

Phase 3 — Controlled Expansion

1. RAG → Prompt Rewrite Integration
   - Drive knowledge influences rewrites
   - Q&A contract remains canonical
   - RAG used as evidence layer, not override

2. Fine-Tune Alignment
   - Drive = knowledge base
   - Q&A = behavioral authority
   - Separation of knowledge vs behavior weighting maintained

3. Project Manager v7 Transition
   - Finalize logs
   - Snapshot v6 state
   - Activate v7 under Codex execution protocol

4. Hybrid Execution Governance
   - Codex reserved for multi-file or system-level changes
   - Direct PM edits allowed for single-file adjustments
   - Supabase schema edits default to Dashboard unless migration required
   - Domain isolation enforced for all Codex threads

5. Agent Runtime Expansion
   - Approval Queue MVP completed (Slice #1).
   - Next slice will add:
     - UUID validation returning 400 errors.
     - Replace inline approval script with `use client` component.
     - Introduce confidence tracking (per agent + tool action + workflow).

---

# 🧪 Golden Path (Must Always Pass)

Automated check available via `npm run golden-path` (preferred quick verification).

1. Next training suggestion works.
2. Save & Next works.
3. Save & Finish triggers rewrite.
4. Preview shows canonical grouping.
5. Quality score updates correctly.
6. RAG Sync schedules job.
7. RAG Worker processes documents.
8. Playground retrieves correct Drive content.
9. Usage logging records activity.

If any fail → immediate fix.

---

# ⚠ Acceptable Limitations

- Wildcard domains require discovery scans.
- No precise progress % (document-count proxy used).
- Worker is single-process (no distributed queue yet).
- OpenAI timeouts possible under heavy refine (guarded).

---

# 🧠 Strategic Position

The system is out of debugging mode and in stabilized infrastructure state.

Operational pillars:
- Prompt Engineering Loop
- RAG Retrieval Engine
- Training Canonicalization
- Job-Based Knowledge Sync
- Usage Analytics Foundation

v6 stabilized.  
Platform stabilized under PM v7 and runtime supervision loop (Slice #1) now operational.

---

# 🔒 Version Snapshot

v6 is formally archived.

v7 is now active under:
- Codex Hybrid Execution Model
- Domain isolation discipline
- Canonical contract protection rules

All future structural changes must be logged in CHANGELOG.md and reflected here.

---

# 🧪 Operational Safety Tools

Golden Path Script:
- Location: `web/scripts/golden-path.mjs`
- Command: `npm run golden-path`
- Purpose: rapid system health verification before and after structural changes.

Recommended Usage:
- Run before starting development sessions.
- Run after major changes (RAG, prompt pipeline, schema edits).
- Run before activating a new Project Manager agent version.