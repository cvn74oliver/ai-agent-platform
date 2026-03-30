create table if not exists public.gmail_artifact_publications (
  tenant_id uuid not null,
  analysis_scope text not null,
  published_version text,
  published_at timestamptz,
  building_version text,
  build_status text not null default 'idle',
  last_error text,
  last_error_at timestamptz,
  last_index_state_updated_at timestamptz,
  last_indexed_message_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, analysis_scope)
);

create index if not exists gmail_artifact_publications_build_status_idx
  on public.gmail_artifact_publications (build_status, updated_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_artifact_publications_analysis_scope_check'
  ) then
    alter table public.gmail_artifact_publications
      add constraint gmail_artifact_publications_analysis_scope_check
      check (analysis_scope in ('7d', '30d', '60d', '90d', '180d', '365d', 'all_indexed'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_artifact_publications_build_status_check'
  ) then
    alter table public.gmail_artifact_publications
      add constraint gmail_artifact_publications_build_status_check
      check (build_status in ('idle', 'building', 'published', 'failed'));
  end if;
end $$;

create table if not exists public.gmail_artifact_jobs (
  job_id text primary key,
  tenant_id uuid not null,
  analysis_scope text not null,
  artifact_version text not null,
  job_type text not null default 'shadow_publish',
  status text not null default 'pending',
  phase text,
  sender_checkpoint text,
  message_checkpoint text,
  cluster_checkpoint text,
  processed_sender_count integer not null default 0,
  processed_message_count integer not null default 0,
  processed_cluster_count integer not null default 0,
  heartbeat_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  last_error text,
  last_error_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gmail_artifact_jobs_tenant_scope_status_idx
  on public.gmail_artifact_jobs (tenant_id, analysis_scope, status, updated_at desc);

create index if not exists gmail_artifact_jobs_tenant_version_idx
  on public.gmail_artifact_jobs (tenant_id, analysis_scope, artifact_version);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_artifact_jobs_analysis_scope_check'
  ) then
    alter table public.gmail_artifact_jobs
      add constraint gmail_artifact_jobs_analysis_scope_check
      check (analysis_scope in ('7d', '30d', '60d', '90d', '180d', '365d', 'all_indexed'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_artifact_jobs_job_type_check'
  ) then
    alter table public.gmail_artifact_jobs
      add constraint gmail_artifact_jobs_job_type_check
      check (job_type in ('shadow_publish', 'full_rebuild', 'incremental_refresh'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_artifact_jobs_status_check'
  ) then
    alter table public.gmail_artifact_jobs
      add constraint gmail_artifact_jobs_status_check
      check (status in ('pending', 'running', 'completed', 'failed', 'cancelled'));
  end if;
end $$;

alter table public.gmail_artifact_publications enable row level security;
alter table public.gmail_artifact_jobs enable row level security;

drop policy if exists gmail_artifact_publications_tenant_select on public.gmail_artifact_publications;
create policy gmail_artifact_publications_tenant_select
on public.gmail_artifact_publications
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_artifact_publications.tenant_id
  )
);

drop policy if exists gmail_artifact_publications_tenant_insert on public.gmail_artifact_publications;
create policy gmail_artifact_publications_tenant_insert
on public.gmail_artifact_publications
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_artifact_publications.tenant_id
  )
);

drop policy if exists gmail_artifact_publications_tenant_update on public.gmail_artifact_publications;
create policy gmail_artifact_publications_tenant_update
on public.gmail_artifact_publications
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_artifact_publications.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_artifact_publications.tenant_id
  )
);

drop policy if exists gmail_artifact_publications_tenant_delete on public.gmail_artifact_publications;
create policy gmail_artifact_publications_tenant_delete
on public.gmail_artifact_publications
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_artifact_publications.tenant_id
  )
);

drop policy if exists gmail_artifact_jobs_tenant_select on public.gmail_artifact_jobs;
create policy gmail_artifact_jobs_tenant_select
on public.gmail_artifact_jobs
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_artifact_jobs.tenant_id
  )
);

drop policy if exists gmail_artifact_jobs_tenant_insert on public.gmail_artifact_jobs;
create policy gmail_artifact_jobs_tenant_insert
on public.gmail_artifact_jobs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_artifact_jobs.tenant_id
  )
);

drop policy if exists gmail_artifact_jobs_tenant_update on public.gmail_artifact_jobs;
create policy gmail_artifact_jobs_tenant_update
on public.gmail_artifact_jobs
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_artifact_jobs.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_artifact_jobs.tenant_id
  )
);

drop policy if exists gmail_artifact_jobs_tenant_delete on public.gmail_artifact_jobs;
create policy gmail_artifact_jobs_tenant_delete
on public.gmail_artifact_jobs
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_artifact_jobs.tenant_id
  )
);
