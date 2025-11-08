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
