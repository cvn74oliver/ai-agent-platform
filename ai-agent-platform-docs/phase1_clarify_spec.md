# Phase 1 Clarify Spec  
_Guided Setup → Clarification → Supabase Persistence_  
Last Updated: November 8, 2025  

---

## 🧠 Overview
This specification defines the architecture, schema, and API contract for implementing the “Ask for Clarification” feature within the Guided Setup flow of the AI Agent Platform.

---

## 🧩 Objective
Enable users to request clarifications during Guided Setup and persist their responses across sessions.  
This forms the foundation for Guided Setup reliability, ensuring answers are stored, retrieved, and versioned correctly.

---

## 📦 Supabase Schema

### Table: `public.prompts`

```sql
CREATE TABLE public.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent text NOT NULL,
  category text NOT NULL,
  version text NOT NULL DEFAULT '1.0.0',
  status text NOT NULL DEFAULT 'active',
  prompt_body text NOT NULL,
  clarifications_json jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_prompts_agent_cat_ver
  ON public.prompts(agent, category, version);
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY select_prompts_active
  ON public.prompts FOR SELECT USING (status = 'active');
CREATE POLICY modify_prompts_service
  ON public.prompts FOR ALL TO service_role USING (true) WITH CHECK (true);

----

Related Table

guided_setup_sessions.state_json
Stores per-session clarification responses, e.g.:
{
  "last_saved": "2025-11-08T16:05:00Z",
  "responses": [
    {
      "question": "Can you describe the primary goal of your agent?",
      "answer": "It should automate my customer service email replies."
    }
  ]
}

🧩 API Endpoint
Route

POST /api/guided-setup/clarify

Request Examples

{
  "session_id": "uuid",
  "prompt_id": "uuid"
}

{
  "session_id": "uuid",
  "prompt_id": "uuid",
  "clarification_response": {
    "question": "Can you describe the primary goal of your agent?",
    "answer": "It should automate my customer service email replies."
  }
}

Response Example
{
  "ok": true,
  "data": {
    "prompt": { "id": "uuid", "prompt_body": "..." },
    "clarifications": [ { "question": "...", "examples": [...] } ],
    "session_state": {
      "last_saved": "2025-11-08T16:05:00Z",
      "responses": [ { "question": "...", "answer": "..." } ]
    }
  },
  "error": null
}

Error Examples

    - ROMPT_NOT_FOUND – invalid or missing ID/version
    - INVALID_REQUEST – missing required parameters

🔍 Test Plan

| # | Test                                  | Expected Result                                   |
| - | ------------------------------------- | ------------------------------------------------- |
| 1 | Retrieve prompt by valid ID/version   | `{ ok:true, data.prompt.id == prompt_id }`        |
| 2 | Post clarification response → persist | `responses[]` updated; `last_saved` refreshed     |
| 3 | Simulate back-navigation              | Prompt reloads with previous answers              |
| 4 | Invalid prompt_id                     | `{ ok:false, error.code:"PROMPT_NOT_FOUND" }`     |
| 5 | Version bump (1.0.0→1.1.0)            | Latest active version returned if version omitted |

🧱 Implementation Status

| Component | Owner | Status |
|------------|--------|--------|
| Prompt schema + examples | Prompt Engineer Agent | ✅ Completed |
| Backend API & SQL | Backend Agent | ✅ Code delivered |
| Supabase Schema Snapshot | Oliver / PM | ✅ Exported 2025-11-09 |
| Frontend Clarify UI | Frontend UI Agent | ⏳ Next |
| QA / Integration Test | Project Manager | ⏳ Pending |

🧭 Notes

This spec is the canonical reference for all agents when developing or debugging the Guided Setup Clarify feature.
Any changes to schema or endpoint contracts must be recorded here and versioned (v1.0.0+).
