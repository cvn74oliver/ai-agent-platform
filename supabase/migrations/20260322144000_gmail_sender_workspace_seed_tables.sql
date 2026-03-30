alter table public.gmail_sender_stats
  add column if not exists first_seen timestamptz;

create table if not exists public.gmail_sender_workspace_seed_headers (
  tenant_id uuid not null,
  analysis_scope text not null,
  cluster_id text not null,
  artifact_version text not null,
  cluster_type text not null,
  title text not null,
  query text not null,
  why_selected text,
  risk_note text,
  safety_note text,
  message_count integer not null default 0,
  sender_count integer not null default 0,
  share_pct integer not null default 0,
  pagination jsonb not null default '{}'::jsonb,
  analytics jsonb not null default '{}'::jsonb,
  source text not null default 'shadow_artifact',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, analysis_scope, cluster_id, artifact_version)
);

create index if not exists gmail_sender_workspace_seed_headers_lookup_idx
  on public.gmail_sender_workspace_seed_headers (tenant_id, analysis_scope, artifact_version, cluster_id);

create table if not exists public.gmail_sender_workspace_seed_rows (
  tenant_id uuid not null,
  analysis_scope text not null,
  cluster_id text not null,
  sender_key text not null,
  artifact_version text not null,
  default_rank integer not null,
  sender text not null,
  sender_domain text,
  cleanup_group_message_count integer not null default 0,
  unread_count integer not null default 0,
  protected_hint text,
  requires_verification boolean not null default false,
  verification_reasons text[] not null default '{}',
  preview_message_ids text[] not null default '{}',
  preview_ready boolean not null default false,
  seed_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, analysis_scope, cluster_id, sender_key, artifact_version)
);

create index if not exists gmail_sender_workspace_seed_rows_rank_idx
  on public.gmail_sender_workspace_seed_rows (
    tenant_id,
    analysis_scope,
    cluster_id,
    artifact_version,
    default_rank
  );

create index if not exists gmail_sender_workspace_seed_rows_sender_idx
  on public.gmail_sender_workspace_seed_rows (
    tenant_id,
    analysis_scope,
    artifact_version,
    sender_key
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_sender_workspace_seed_headers_analysis_scope_check'
  ) then
    alter table public.gmail_sender_workspace_seed_headers
      add constraint gmail_sender_workspace_seed_headers_analysis_scope_check
      check (analysis_scope in ('7d', '30d', '60d', '90d', '180d', '365d', 'all_indexed'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_sender_workspace_seed_headers_share_pct_check'
  ) then
    alter table public.gmail_sender_workspace_seed_headers
      add constraint gmail_sender_workspace_seed_headers_share_pct_check
      check (share_pct between 0 and 100);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_sender_workspace_seed_rows_analysis_scope_check'
  ) then
    alter table public.gmail_sender_workspace_seed_rows
      add constraint gmail_sender_workspace_seed_rows_analysis_scope_check
      check (analysis_scope in ('7d', '30d', '60d', '90d', '180d', '365d', 'all_indexed'));
  end if;
end $$;

alter table public.gmail_sender_workspace_seed_headers enable row level security;
alter table public.gmail_sender_workspace_seed_rows enable row level security;

drop policy if exists gmail_sender_workspace_seed_headers_tenant_select on public.gmail_sender_workspace_seed_headers;
create policy gmail_sender_workspace_seed_headers_tenant_select
on public.gmail_sender_workspace_seed_headers
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_workspace_seed_headers.tenant_id
  )
);

drop policy if exists gmail_sender_workspace_seed_headers_tenant_insert on public.gmail_sender_workspace_seed_headers;
create policy gmail_sender_workspace_seed_headers_tenant_insert
on public.gmail_sender_workspace_seed_headers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_workspace_seed_headers.tenant_id
  )
);

drop policy if exists gmail_sender_workspace_seed_headers_tenant_update on public.gmail_sender_workspace_seed_headers;
create policy gmail_sender_workspace_seed_headers_tenant_update
on public.gmail_sender_workspace_seed_headers
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_workspace_seed_headers.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_workspace_seed_headers.tenant_id
  )
);

drop policy if exists gmail_sender_workspace_seed_headers_tenant_delete on public.gmail_sender_workspace_seed_headers;
create policy gmail_sender_workspace_seed_headers_tenant_delete
on public.gmail_sender_workspace_seed_headers
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_workspace_seed_headers.tenant_id
  )
);

drop policy if exists gmail_sender_workspace_seed_rows_tenant_select on public.gmail_sender_workspace_seed_rows;
create policy gmail_sender_workspace_seed_rows_tenant_select
on public.gmail_sender_workspace_seed_rows
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_workspace_seed_rows.tenant_id
  )
);

drop policy if exists gmail_sender_workspace_seed_rows_tenant_insert on public.gmail_sender_workspace_seed_rows;
create policy gmail_sender_workspace_seed_rows_tenant_insert
on public.gmail_sender_workspace_seed_rows
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_workspace_seed_rows.tenant_id
  )
);

drop policy if exists gmail_sender_workspace_seed_rows_tenant_update on public.gmail_sender_workspace_seed_rows;
create policy gmail_sender_workspace_seed_rows_tenant_update
on public.gmail_sender_workspace_seed_rows
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_workspace_seed_rows.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_workspace_seed_rows.tenant_id
  )
);

drop policy if exists gmail_sender_workspace_seed_rows_tenant_delete on public.gmail_sender_workspace_seed_rows;
create policy gmail_sender_workspace_seed_rows_tenant_delete
on public.gmail_sender_workspace_seed_rows
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_workspace_seed_rows.tenant_id
  )
);
