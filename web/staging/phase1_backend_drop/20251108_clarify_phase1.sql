-- UUID + crypto
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────────────────────────────────────
-- 1) prompts table (versioned, RLS)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  agent text not null,                            -- e.g. "Frontend", "Backend", "LLM_Trainer"
  category text not null,                         -- e.g. "guided_setup", "system_prompt", "clarification"
  version text not null default '1.0.0',          -- semver-like
  status text not null default 'active',          -- active | archived | draft
  prompt_body text not null,                      -- full prompt text
  clarifications_json jsonb default '[]'::jsonb,  -- array of { question, examples[], notes? }
  metadata jsonb default '{}'::jsonb,             -- optional metadata (tone, tags, etc.)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Update trigger for updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_prompts_updated_at on public.prompts;
create trigger trg_prompts_updated_at
before update on public.prompts
for each row execute function public.set_updated_at();

-- Indexes
create index if not exists idx_prompts_agent      on public.prompts(agent);
create index if not exists idx_prompts_category   on public.prompts(category);
create index if not exists idx_prompts_status     on public.prompts(status);
create index if not exists idx_prompts_agent_cat_ver
  on public.prompts(agent, category, version);

-- RLS
alter table public.prompts enable row level security;

-- Policies:
-- 1) Allow any authenticated user to read active prompts
drop policy if exists select_prompts_active on public.prompts;
create policy select_prompts_active
  on public.prompts
  for select
  using (status = 'active');

-- 2) Allow service_role to modify (note: service role bypasses RLS, but this keeps intent explicit)
drop policy if exists modify_prompts_service on public.prompts;
create policy modify_prompts_service
  on public.prompts
  for all
  to service_role
  using (true)
  with check (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- 2) guided_setup_sessions table (ensure JSON state exists)
-- ──────────────────────────────────────────────────────────────────────────────
-- If your project already has this table, we only add state_json if missing.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'guided_setup_sessions'
  ) then
    create table public.guided_setup_sessions (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null,
      state_json jsonb not null default jsonb_build_object(
        'responses', '[]'::jsonb,
        'last_saved', to_jsonb(now())
      ),
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );

    alter table public.guided_setup_sessions enable row level security;

    -- Basic example RLS: owner-only access (adjust if you use org/team scoping)
    drop policy if exists gss_select_own on public.guided_setup_sessions;
    create policy gss_select_own
      on public.guided_setup_sessions
      for select
      using (auth.uid() = user_id);

    drop policy if exists gss_update_own on public.guided_setup_sessions;
    create policy gss_update_own
      on public.guided_setup_sessions
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);

    -- updated_at trigger
    drop trigger if exists trg_gss_updated_at on public.guided_setup_sessions;
    create trigger trg_gss_updated_at
    before update on public.guided_setup_sessions
    for each row execute function public.set_updated_at();
  end if;

  -- If table exists but state_json is missing, add it.
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='guided_setup_sessions' and column_name='state_json'
  ) then
    alter table public.guided_setup_sessions
      add column state_json jsonb not null default jsonb_build_object(
        'responses', '[]'::jsonb,
        'last_saved', to_jsonb(now())
      );

    drop trigger if exists trg_gss_updated_at on public.guided_setup_sessions;
    create trigger trg_gss_updated_at
    before update on public.guided_setup_sessions
    for each row execute function public.set_updated_at();
  end if;
end $$;
