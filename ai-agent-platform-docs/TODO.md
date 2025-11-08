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