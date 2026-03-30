create table if not exists public.gmail_preview_index (
  tenant_id uuid not null,
  analysis_scope text not null,
  cluster_id text not null,
  sender_key text not null,
  artifact_version text not null,
  preview_rank integer not null,
  message_id text not null,
  thread_id text,
  sender text,
  subject text,
  snippet text,
  internal_date_ms bigint,
  date timestamptz,
  label_ids text[] not null default '{}',
  category_labels text[] not null default '{}',
  is_in_inbox boolean not null default false,
  is_unread boolean not null default false,
  is_important boolean not null default false,
  is_starred boolean not null default false,
  protected_hint text,
  preview_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (
    tenant_id,
    analysis_scope,
    cluster_id,
    sender_key,
    artifact_version,
    preview_rank
  )
);

create unique index if not exists gmail_preview_index_message_lookup_idx
  on public.gmail_preview_index (
    tenant_id,
    analysis_scope,
    cluster_id,
    sender_key,
    artifact_version,
    message_id
  );

create index if not exists gmail_preview_index_cluster_lookup_idx
  on public.gmail_preview_index (
    tenant_id,
    analysis_scope,
    cluster_id,
    artifact_version,
    sender_key,
    preview_rank
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_preview_index_analysis_scope_check'
  ) then
    alter table public.gmail_preview_index
      add constraint gmail_preview_index_analysis_scope_check
      check (analysis_scope in ('7d', '30d', '60d', '90d', '180d', '365d', 'all_indexed'));
  end if;
end $$;

alter table public.gmail_preview_index enable row level security;

drop policy if exists gmail_preview_index_tenant_select on public.gmail_preview_index;
create policy gmail_preview_index_tenant_select
on public.gmail_preview_index
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_preview_index.tenant_id
  )
);

drop policy if exists gmail_preview_index_tenant_insert on public.gmail_preview_index;
create policy gmail_preview_index_tenant_insert
on public.gmail_preview_index
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_preview_index.tenant_id
  )
);

drop policy if exists gmail_preview_index_tenant_update on public.gmail_preview_index;
create policy gmail_preview_index_tenant_update
on public.gmail_preview_index
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_preview_index.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_preview_index.tenant_id
  )
);

drop policy if exists gmail_preview_index_tenant_delete on public.gmail_preview_index;
create policy gmail_preview_index_tenant_delete
on public.gmail_preview_index
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_preview_index.tenant_id
  )
);
