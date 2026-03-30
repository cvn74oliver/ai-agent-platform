create table if not exists public.gmail_cluster_summaries (
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
  dominant_sender text,
  dominant_pattern text,
  protected_message_count integer not null default 0,
  uncertain_sender_count integer not null default 0,
  summary_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, analysis_scope, cluster_id, artifact_version)
);

create index if not exists gmail_cluster_summaries_lookup_idx
  on public.gmail_cluster_summaries (tenant_id, analysis_scope, artifact_version, cluster_id);

create table if not exists public.gmail_mailbox_intelligence_snapshots (
  tenant_id uuid not null,
  analysis_scope text not null,
  artifact_version text not null,
  snapshot_payload jsonb not null default '{}'::jsonb,
  source text not null default 'shadow_artifact',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, analysis_scope, artifact_version)
);

create index if not exists gmail_mailbox_intelligence_snapshots_lookup_idx
  on public.gmail_mailbox_intelligence_snapshots (tenant_id, analysis_scope, artifact_version);

create table if not exists public.gmail_mailbox_intelligence_buckets (
  tenant_id uuid not null,
  analysis_scope text not null,
  artifact_version text not null,
  bucket_kind text not null,
  bucket_key text not null,
  bucket_start_at timestamptz not null,
  bucket_end_at timestamptz,
  bucket_value integer not null default 0,
  bucket_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (
    tenant_id,
    analysis_scope,
    artifact_version,
    bucket_kind,
    bucket_key,
    bucket_start_at
  )
);

create index if not exists gmail_mailbox_intelligence_buckets_lookup_idx
  on public.gmail_mailbox_intelligence_buckets (
    tenant_id,
    analysis_scope,
    artifact_version,
    bucket_kind,
    bucket_key,
    bucket_start_at
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_cluster_summaries_analysis_scope_check'
  ) then
    alter table public.gmail_cluster_summaries
      add constraint gmail_cluster_summaries_analysis_scope_check
      check (analysis_scope in ('7d', '30d', '60d', '90d', '180d', '365d', 'all_indexed'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_cluster_summaries_share_pct_check'
  ) then
    alter table public.gmail_cluster_summaries
      add constraint gmail_cluster_summaries_share_pct_check
      check (share_pct between 0 and 100);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_mailbox_intelligence_snapshots_analysis_scope_check'
  ) then
    alter table public.gmail_mailbox_intelligence_snapshots
      add constraint gmail_mailbox_intelligence_snapshots_analysis_scope_check
      check (analysis_scope in ('7d', '30d', '60d', '90d', '180d', '365d', 'all_indexed'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_mailbox_intelligence_buckets_analysis_scope_check'
  ) then
    alter table public.gmail_mailbox_intelligence_buckets
      add constraint gmail_mailbox_intelligence_buckets_analysis_scope_check
      check (analysis_scope in ('7d', '30d', '60d', '90d', '180d', '365d', 'all_indexed'));
  end if;
end $$;

alter table public.gmail_cluster_summaries enable row level security;
alter table public.gmail_mailbox_intelligence_snapshots enable row level security;
alter table public.gmail_mailbox_intelligence_buckets enable row level security;

drop policy if exists gmail_cluster_summaries_tenant_select on public.gmail_cluster_summaries;
create policy gmail_cluster_summaries_tenant_select
on public.gmail_cluster_summaries
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_cluster_summaries.tenant_id
  )
);

drop policy if exists gmail_cluster_summaries_tenant_insert on public.gmail_cluster_summaries;
create policy gmail_cluster_summaries_tenant_insert
on public.gmail_cluster_summaries
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_cluster_summaries.tenant_id
  )
);

drop policy if exists gmail_cluster_summaries_tenant_update on public.gmail_cluster_summaries;
create policy gmail_cluster_summaries_tenant_update
on public.gmail_cluster_summaries
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_cluster_summaries.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_cluster_summaries.tenant_id
  )
);

drop policy if exists gmail_cluster_summaries_tenant_delete on public.gmail_cluster_summaries;
create policy gmail_cluster_summaries_tenant_delete
on public.gmail_cluster_summaries
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_cluster_summaries.tenant_id
  )
);

drop policy if exists gmail_mailbox_intelligence_snapshots_tenant_select on public.gmail_mailbox_intelligence_snapshots;
create policy gmail_mailbox_intelligence_snapshots_tenant_select
on public.gmail_mailbox_intelligence_snapshots
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_mailbox_intelligence_snapshots.tenant_id
  )
);

drop policy if exists gmail_mailbox_intelligence_snapshots_tenant_insert on public.gmail_mailbox_intelligence_snapshots;
create policy gmail_mailbox_intelligence_snapshots_tenant_insert
on public.gmail_mailbox_intelligence_snapshots
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_mailbox_intelligence_snapshots.tenant_id
  )
);

drop policy if exists gmail_mailbox_intelligence_snapshots_tenant_update on public.gmail_mailbox_intelligence_snapshots;
create policy gmail_mailbox_intelligence_snapshots_tenant_update
on public.gmail_mailbox_intelligence_snapshots
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_mailbox_intelligence_snapshots.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_mailbox_intelligence_snapshots.tenant_id
  )
);

drop policy if exists gmail_mailbox_intelligence_snapshots_tenant_delete on public.gmail_mailbox_intelligence_snapshots;
create policy gmail_mailbox_intelligence_snapshots_tenant_delete
on public.gmail_mailbox_intelligence_snapshots
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_mailbox_intelligence_snapshots.tenant_id
  )
);

drop policy if exists gmail_mailbox_intelligence_buckets_tenant_select on public.gmail_mailbox_intelligence_buckets;
create policy gmail_mailbox_intelligence_buckets_tenant_select
on public.gmail_mailbox_intelligence_buckets
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_mailbox_intelligence_buckets.tenant_id
  )
);

drop policy if exists gmail_mailbox_intelligence_buckets_tenant_insert on public.gmail_mailbox_intelligence_buckets;
create policy gmail_mailbox_intelligence_buckets_tenant_insert
on public.gmail_mailbox_intelligence_buckets
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_mailbox_intelligence_buckets.tenant_id
  )
);

drop policy if exists gmail_mailbox_intelligence_buckets_tenant_update on public.gmail_mailbox_intelligence_buckets;
create policy gmail_mailbox_intelligence_buckets_tenant_update
on public.gmail_mailbox_intelligence_buckets
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_mailbox_intelligence_buckets.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_mailbox_intelligence_buckets.tenant_id
  )
);

drop policy if exists gmail_mailbox_intelligence_buckets_tenant_delete on public.gmail_mailbox_intelligence_buckets;
create policy gmail_mailbox_intelligence_buckets_tenant_delete
on public.gmail_mailbox_intelligence_buckets
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_mailbox_intelligence_buckets.tenant_id
  )
);
