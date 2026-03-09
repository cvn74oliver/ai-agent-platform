# CURRENT_STATE — AI Agent Platform

Last updated: 2026-03-09  
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
- Runtime orchestration refactor complete:
  - `route.ts` is now a thinner controller/surface.
  - Runtime loading/discovery/assembly moved to runtime services/modules.
  - Prompt assembly and RAG retrieval stacks moved out of route.
  - OpenAI chat invocation + response/error handling moved out of route into a dedicated chat service.
  - Analytics/session logging moved out of route into a dedicated analytics service.
- Runtime latency hardening (March 9, 2026):
  - Live timing logs confirm `runtime_state_ms` as the dominant phase.
  - Runtime evidence/history loaders now run in parallel in `stateLoaders.ts` (`Promise.all`).
  - API contract and runtime behavior remain unchanged.
- Runtime continuity + performance hardening (March 9, 2026):
  - Session-aware Playground restore is stable across refresh and approvals return flow.
  - Initial mount flicker (dashboard → empty chat → dashboard) has been eliminated.
  - Runtime sub-phase timing is now logged via `[playground][runtime-state-timing]`.
  - Dominant `cleanup_plan_ms` path was optimized by parallel cleanup-cluster discovery sampling.
  - Live post-patch rehydrate timing is now roughly ~2–3 seconds (down from ~8–10 seconds).

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

## Agent Runtime Execution (Slices 6A–7)

- Runtime supervision ladder now operational:
  - Plan → Approve → Confidence → Eligibility → Execute.
- Sandbox execution pipeline implemented:
  - `/api/runtime/execute` executes sandbox actions safely.
- Execution logging implemented:
  - `execution_result` events stored in `agent_events`.
- UI now displays runtime supervision state:
  - mode
  - confidence
  - approval status
  - execution status.

## Integrations — Gmail

- Tenant-scoped OAuth integration implemented.
- Gmail connection stored in `integration_connections`.
- OAuth flow:
  - `/api/integrations/gmail/start`
  - `/api/integrations/gmail/callback`
- Runtime tool support added:
  - `gmail.draft_email`
- Agent execution can now create Gmail drafts (never sends).
- Inbox analysis runtime tool implemented:
  - `gmail.analyze_inbox`
  - Reads inbox metadata sample and derives sender clusters.
- Sender cluster review tool implemented:
  - `gmail.review_sender_cluster`
  - Retrieves sample messages for a specific sender.
- Inbox archive runtime tool implemented:
  - `gmail.archive_messages`
  - Removes the `INBOX` label using Gmail `batchModify`.
  - Messages remain in **All Mail** (standard Gmail archive behavior).
- Gmail OAuth scope expanded to support modification:
  - `gmail.modify` permission now requested during OAuth flow.
  - Required for archive operations.

---

### Runtime Capability Milestone (March 5, 2026)

The platform successfully completed the first **end‑to‑end autonomous workflow milestone**.

Operational chain verified:

Plan → Approve → Confidence → Eligibility → Auto‑Approve → Execute → External Tool Action

Working runtime example:

- Agent proposes Gmail action (`gmail.draft_email`).
- Supervisor approves or auto‑approves based on confidence threshold.
- Execution endpoint validates runtime mode (`guarded`).
- System executes Gmail draft creation through OAuth integration.
- Execution result stored in `agent_events`.

Confirmed output:

- Gmail draft created in connected inbox.
- Execution recorded in `execution_result` event.
- UI status correctly transitions:
  `pending → approved → executed`.

This marks the **first real external tool execution by the AI Agent Platform runtime**.

### Runtime Inbox Assistant Milestone (March 8, 2026)

The platform successfully executed its first **automated inbox management action**.

Verified runtime chain:

Analyze Inbox → Review Sender Cluster → Propose Action → Approve → Execute → Gmail Archive

Working runtime example:

- Agent analyzed Gmail inbox metadata.
- System detected high‑volume sender clusters.
- Runtime assistant recommended archive candidates.
- Approval request generated and approved through `/approvals`.
- `/api/runtime/execute` performed `gmail.archive_messages`.
- Gmail `batchModify` removed the `INBOX` label.

Verified result:

- Target emails disappeared from Inbox.
- Messages remained accessible in **All Mail**.
- Execution recorded in `execution_result` event.
- Playground UI reflected execution evidence.

This represents the **first real autonomous inbox management workflow executed by the runtime system**.

### Runtime Playground Refactor Milestone (March 9, 2026)

Playground runtime architecture has been modularized without changing behavior.

Extracted modules now own the previously in-route runtime internals:
- `src/lib/runtime/suggestionLifecycle.ts`
- `src/lib/runtime/stateLoaders.ts`
- `src/lib/runtime/gmailRuntimeAssembler.ts`
- `src/lib/runtime/runtimeStateService.ts`
- `src/lib/runtime/playgroundPromptBuilder.ts`
- `src/lib/runtime/playgroundRagService.ts`

Current route ownership remains:
- response shaping
- explicit `gmail.analyze_inbox` proposal trigger logic
- chat service invocation
- analytics service invocation

`rehydrate_only` behavior remains preserved.

Reference:
- `ai-agent-platform-docs/playground-runtime-architecture.md`

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

Current runtime supervision ladder:

Plan → Approve → Confidence → Eligibility → Auto‑Approve → Execute

Completed slices:

Slice #1 — Approval Queue MVP
Slice #2 — UUID validation + approvals UI client component
Slice #3 — Confidence tracking per tool/action
Slice #4 — Runtime mode + eligibility endpoint
Slice #5 — Guarded auto‑approval
Slice 6A — Sandbox execution engine
Slice #7 — Gmail draft execution integration
Slice #8 — Gmail inbox analysis runtime tool
Slice #9 — Sender cluster review runtime tool
Slice #10 — Gmail archive execution tool
Slice #11 — Runtime suggestion lifecycle tracking (ready → pending → approved → executed)

Next capability in development:

Inbox Assistant

- Gmail inbox analysis
- Batch archive recommendations
- Conversational approval workflow
- Runtime assistant agent for operational automation

Current status (March 8, 2026):
- Inbox Assistant MVP is operational.
- Inbox analysis, sender review, and archive execution are implemented.
- Runtime UI suggestions are lifecycle‑aware (ready / pending / approved / executed).
- Remaining improvements focus on UX polish, persistence, and broader batch operations.

This will introduce the **first dedicated Runtime Assistant Agent** responsible for inbox management and workflow assistance.

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
Platform stabilized under PM v7.

The **runtime supervision system (Slices 1–7)** is now operational and has successfully executed its first real external action (Gmail draft creation).

The platform has transitioned from infrastructure stabilization into **early autonomous workflow capability**.

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
