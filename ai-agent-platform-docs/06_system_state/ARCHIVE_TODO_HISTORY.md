# Role: PM & Docs Agent

## Agent Session Health

Tracks the current operational status of each active agent.  
Update this section after each activation, health check, or refresh.

- Architect Agent – healthy (activated Nov 6 2025 v1)
- Frontend UI Agent – healthy (activated Nov 6 2025 v1)
- Backend Agent – healthy (activated Nov 6 2025 v1)
- Workflow Agent – healthy (activated Nov 6 2025 v1)
- LLM Trainer Agent – healthy (activated Nov 6 2025 v1)
- Avatar & Voice Agent – healthy (activated Nov 6 2025 v1)
- Project Manager Agent – healthy (activated Nov 6 2025 v1)
- Prompt Engineer Agent – healthy (activated Nov 8 2025 v1)


## Scope
Keeps project organized and tracks deliverables.

## Core Responsibilities
- Maintain CHANGELOG and TODO lists.
- Merge summaries from all roles into 00_MASTER_PROJECT.md.
- Prepare daily action plan and report progress.
- Identify dependencies between roles.

## Current Focus
- Review latest 00_MASTER_PROJECT.md snapshot.
- Create daily plan per role with 1–3 tasks each.

---

### 🗓️ November 6, 2025 – Synchronization Update

**Session Health**
All agents are active and healthy (activated Nov 6 2025 v1).  
No drift detected across any roles.

---

#### 🧩 Architect Agent
1. Audit `/src/app/api` routes → verify 1:1 mapping with Supabase tables.
2. Document any orphaned or duplicate endpoints.
3. Review `.env.local` dependency coherence.
4. Validate naming conventions in folders (`/agents/[id]/...`).
5. Produce updated **architecture snapshot diagram** for `system_overview.md`.

#### 🎨 Frontend UI Agent
1. Confirm `/agents/[id]` pages pull live data via Supabase.
2. Restore “Get Clarification” UI state persistence feature (linked to guided-setup clarify).
3. Standardize loading / error states across all routes.
4. Integrate `VoiceRecorder` & `ScenarioRecorder` with voice API endpoints.
5. Add responsive audit for dashboard and onboarding flows.

#### ⚙️ Backend API Agent
1. Cross-verify Supabase table names and RLS policies used by API routes.
2. Finalize `/api/workflows` endpoint CRUD + validation.
3. Extend `/api/fine-tune-status` with progress polling + logging.
4. Standardize all responses to `{ ok, data, error }` format.
5. Add structured server logging for latency + errors.

#### 🔁 Workflow Integration Agent
1. Define and migrate `workflows` table in Supabase (`id`, `name`, `steps_json`, `status`, `created_at`).
2. Finish `/api/workflows` CRUD integration.
3. Test Activepieces auth flow and token storage.
4. Build validation layer for step input/output mapping.
5. Expose visualization JSON → graph data for UI Agent.

#### 🧠 LLM Trainer & RAG Agent
1. Confirm `training_queue` table schema (`job_id`, `dataset_id`, `model`, `status`, `logs`).
2. Implement dataset → JSONL export.
3. Design cost-aware router in `/src/lib/llm.ts`.
4. Integrate Firecrawl embedding refresh schedule.
5. Document fine-tune job flow in `system_overview.md`.

#### 🗣️ Avatar & Voice Agent
1. Add `voice_consent` and `consent_date` fields to `agents` table.
2. Verify `/api/analyze-voice` and `/api/transcribe-audio` upload paths and Supabase Storage.
3. Integrate voice-clone API (test sample → cloned voice → TTS playback).
4. Build automation to generate short avatar intro videos.
5. Sync frontend consent checkbox and backend storage record.

---

### 📅 Daily Plan

**Morning**
- Run `update_memory.sh` to refresh docs and create backup.  
- PM Agent verifies all agent contexts successfully loaded.  
- Approve Architect & Backend Agents to begin API ↔ Schema audit.

**Mid-Day**
- Frontend Agent restores “Get Clarification” persistence logic.  
- Workflow Agent drafts Supabase schema for `workflows` table.

**Evening**
- LLM Trainer outlines dataset export and cost router logic.  
- Avatar & Voice Agent tests audio upload → transcription flow.  
- PM Agent compiles `/summarize_session` results and appends to `CHANGELOG.md`.

---

🧭 *Notes:*  
This update marks the official synchronization of all agent sessions and system documentation following the November activation cycle.  
Future updates will follow this appended format for ongoing daily tracking and changelog generation.

---

### 🧠 System-Wide Top 5 Priorities (AI Agent Platform)

1. **Stabilize Core Infrastructure**
   - Complete API ↔ Supabase schema mapping and ensure all role agents function end-to-end.

2. **Restore Full Guided Setup UX**
   - Rebuild “Get Clarification” persistence, answer saving, and back-button data retention.

3. **Finalize Workflow Automation Layer**
   - Complete `/api/workflows`, Activepieces auth, and workflow visualization logic.

4. **Integrate Fine-Tuning and Voice Features**
   - Finalize `/api/fine-tune-status`, dataset export, voice-clone consent tracking, and avatar intro automation.

5. **Prepare End-to-End Demo**
   - Ensure all agents can run a guided setup → voice/LLM/automation cycle seamlessly for the first public presentation.

---

### 🧭 Project Manager Agent Top 5 Priorities

1. **Maintain Continuity**
   - Verify each agent session daily, flag drift, and update `TODO.md` and `CHANGELOG.md` automatically.

2. **Sync All Documentation**
   - Ensure `update_memory.sh` and `sync_docs_to_github.sh` run correctly and maintain consistent file versions.

3. **Report and Prioritize**
   - Generate daily summaries and system-wide progress updates (like this one) for Oliver’s review.

4. **Track Dependencies**
   - Identify where one agent’s progress blocks another (e.g., Backend ↔ Workflow, Frontend ↔ Avatar).

5. **Prepare for Next Expansion Phase**
   - Draft onboarding templates for new agents (e.g., Marketing, Prompt Engineer) and link them into the architecture when approved.

---

### 🧑‍💼 Oliver’s High-Level (Director) Top 5 Priorities

1. **Get the Platform to First End-to-End Showcase**
   - One complete working demonstration — guided setup → automation → avatar output.

2. **Clarify and Refine the Product Vision**
   - Decide what the “minimum lovable product” is: the smallest working version that’s impressive and clear.

3. **Plan Next Agent Expansion**
   - Define the purpose and timing for Marketing Agent, Prompt Engineer Agent, or possible Data Agent (analytics/reporting).

4. **Prepare Launch & Communication Plan**
   - How you’ll introduce this internally or publicly (docs, video, demo deck).

5. **Evaluate Long-Term Roadmap**
   - Determine whether this evolves into a commercial SaaS platform, a dev tool, or an internal R&D system.

---

🧩 *Notes:*
These new high-level layers (System, PM, and Director) give a 3-tier view of progress:
- **Agents** = “What’s being done”
- **Project Manager** = “How it’s being coordinated”
- **Director (Oliver)** = “Why and where it’s headed”
Future daily updates can append under this framework, allowing top-down clarity across every level.

---

### 🗓️ November 8, 2025 – Prompt Engineer Agent Activation

**Session Health**
Prompt Engineer Agent successfully activated and verified.  
All agents are now synchronized (8 active total).

---

#### ✍️ Prompt Engineer Agent
1. Rebuild “Get Clarification” flow and persistent state handling (Frontend ↔ Supabase ↔ Backend).
2. Define and implement the `prompts` Supabase table schema with version control and categories.
3. Create base prompt templates for each existing agent (Architect, Frontend, Backend, Workflow, LLM Trainer, Avatar & Voice, Project Manager).
4. Optimize guided setup and clarification prompt logic for accuracy, tone, and clarity.
5. Design prompt optimization workflow and dataset export structure for the LLM Trainer Agent.

---

### 📅 Daily Plan (Prompt Engineer Integration)

**Morning**
- Verify activation and run `/health_check` for Prompt Engineer Agent.  
- Update TODO.md and CHANGELOG.md entries (you’re doing this now).  
- PM Agent confirms all eight roles are synchronized.

**Mid-Day**
- Begin defining the `prompts` table schema in Supabase.  
- Meet with Frontend Agent logic (guided setup and clarification flow integration).

**Evening**
- Generate initial base prompt templates for all agents.  
- Run `update_memory.sh` → `sync_docs_to_github.sh` to finalize integration.

---

### 🧩 Prompt Engineer Agent – Phase 2 Approval (Implementation Planning)

✅ Health check confirmed Nov 8 2025.  
Authorized to proceed with:

- Supabase `prompts` table schema design  
- Clarification flow architecture (Frontend ↔ Backend ↔ Supabase)  
- Base prompt template creation for all agents  

Deliverables for next PM sync:
1. Schema draft (SQL + JSON structure)  
2. Clarification flow diagram (prompt flow + data handoff)  
3. Baseline prompt templates library

---

### 🗓️ November 8, 2025 – Phase 1 Kickoff (Vertical Slice)

**System Focus (Director View)**
Build the spine: Guided Setup → Get Clarification → Save to Supabase (one complete end-to-end path).

**Assignments**
- Prompt Engineer (lead): prompts table schema, JSON template, clarify API spec, persistence rules, test plan.
- Backend (next): implement `/api/guided-setup/clarify`, wire Supabase table, `{ ok, data, error }` responses.
- Frontend: connect “Get Clarification” UI to API; ensure state persists on back-navigation.

**Success Criteria**
- Start → Answer → Clarify → Back → Clarify persists → End (no data loss).
- Prompts versioned; API returns correct prompt + clarifications based on ids/version.

**Daily Plan**
Morning: Handoff to Prompt Engineer + confirm delivery scope.  
Mid-Day: Review deliverables; prepare backend handoff.  
Evening: If accepted, open Backend task and schedule Frontend hookup for tomorrow.

---

### 🗓️ November 8, 2025 – Backend Handoff Sent
- [x] Received Prompt Engineer A–D deliverables (schema, JSON, API, tests)
- [x] Sent /handoff + full A–D to Backend Agent for implementation
Next: Await Backend code + API endpoint for Phase 1 tests, then hand off to Frontend.

---

### 🗓️ November 8, 2025 – Backend Execution Start (Phase 1 Clarify API)
- [x] Backend Agent confirmed scope and assumptions.
- [ ] Awaiting 01_prompts.sql, route.ts, and test blueprint deliverables.
Next Action: Review and validate code once delivered; prepare Frontend handoff.

---

### 🗓️ November 9, 2025 – Supabase Schema Snapshot Logged
- [x] Exported full schema from Supabase via `pg_dump` (remote connection).
- [x] Verified schema export contains SQL definitions.
- [x] Confirmed file caching issue in VS Code resolved by reloading.
- [ ] Compare schema snapshot with backend migration (`20251108_clarify_phase1.sql`) for overlap.
- [ ] Generate Phase 1 safe migration script for Supabase.
- [ ] Document migration verification results for next PM review.

---

### 🗓️ November 9 2025 – Schema Comparison Checklist Created
- [x] Added `/web/docs/operational_workflow/schema_comparison_checklist.md`
- [x] Verified formatting and Markdown table rendering.
- [ ] Apply checklist during next migration comparison.

### 🗓️ November 9, 2025 – Post-Build Action Plan
- [x] Achieve clean build across all agents (completed)
- [ ] Run Clarify API 5-test validation suite (Phase 1)
- [ ] Test Guided Setup → Clarify → Supabase persistence cycle
- [ ] Verify Automations page Suspense wrapper in dev mode
- [ ] Perform daily agent health check (all 6 active agents)
- [ ] Review `CHANGELOG.md` updates and sync with master project files

---

### 🗓️ November 9, 2025 – Post-Build Verification Phase

**Objective:**  
Now that the full build compiles successfully, proceed with live testing and agent health verification.

**Tasks:**
- [ ] Run Clarify API end-to-end tests (5-case validation suite).  
- [ ] Verify Guided Setup flow saves and reloads state in Supabase correctly.  
- [ ] Confirm Automations page runs cleanly in dev mode (`npm run dev`).  
- [ ] Conduct full `/api/guided-setup/clarify` and `/api/guided-setup/answer` integration tests.  
- [ ] Ensure Suspense wrapper works without hydration mismatches.  
- [ ] Sync all changes to GitHub and archive `/staging/phase1_backend_drop`.  
- [ ] Begin planning Phase 2 deliverables (runtime dashboards + workflow orchestration).

**Agent Health Check:**
- [x] Architect Agent  
- [x] Backend Agent  
- [x] Frontend Agent  
- [x] Workflow Agent  
- [x] LLM Trainer Agent  
- [x] Avatar & Voice Agent  
- [x] Prompt Engineer Agent  
- [x] Project Manager Agent  

✅ *All active and operational post-build.*

### 🧠 Next Tasks – Post Clarify Modal Integration (Nov 13)

1. **Thread Persistence**
   - Store each Clarify conversation per onboarding field in Supabase `onboarding_summary` or a `clarify_threads` JSON field.
2. **Auto Mic Activation**
   - When modal opens, auto-start the `VoiceRecorder`.
3. **UI Polish**
   - Add scroll-to-bottom for long threads.
   - Improve modal transitions and colors.
4. **Refactor Prep**
   - Plan for Frontend Agent to handle modal animation pass.
5. **Testing**
   - Verify voice flow end-to-end in live environment.

   ### 🧠 Next Tasks – Clarify UX Enhancements (Post-Persistence)

1. **Field-level Indicators**
   - Show a small badge or icon next to onboarding_summary fields that have entries in `clarify_threads[key]` (e.g., 💬 or “(2 clarifications)”).

2. **Auto-Scroll Clarify Threads**
   - In `ClarifyModal.tsx`, scroll the messages container to the bottom whenever a new message is added or when the modal opens with an existing thread.

3. **Voice-First Polish**
   - (Optional) When Clarify modal opens, focus voice recording as the primary action.
   - Keep the text input as a secondary option.

4. **Guided Setup / Edit Agent Unification (Planning)**
   - Evaluate whether Guided Setup and Edit Agent Clarify flows should share a common “clarify engine” or remain separate endpoints.
   - Document a potential shared abstraction layer for prompt engineering and logging.

5. **Analytics Prep**
   - Start thinking about logging patterns (event types, counts, per-field clarify usage) for a future “Agent Insights / Analytics” phase.