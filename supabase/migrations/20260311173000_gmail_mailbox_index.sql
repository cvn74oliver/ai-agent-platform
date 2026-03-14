-- Gmail mailbox indexing layer (tenant-scoped)
-- Stores normalized Gmail metadata for mailbox-scale analytics and cluster discovery.

create table if not exists public.gmail_messages (
  tenant_id uuid not null,
  message_id text not null,
  thread_id text,
  sender text,
  subject text,
  internal_date_ms bigint,
  date timestamptz,
  label_ids text[] not null default '{}',
  category_labels text[] not null default '{}',
  is_in_inbox boolean not null default false,
  is_unread boolean not null default false,
  is_starred boolean not null default false,
  is_important boolean not null default false,
  indexed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, message_id)
);

create index if not exists gmail_messages_tenant_internal_date_idx
  on public.gmail_messages (tenant_id, internal_date_ms desc);

create index if not exists gmail_messages_tenant_inbox_date_idx
  on public.gmail_messages (tenant_id, is_in_inbox, internal_date_ms desc);

create index if not exists gmail_messages_tenant_sender_idx
  on public.gmail_messages (tenant_id, sender);

create index if not exists gmail_messages_tenant_unread_idx
  on public.gmail_messages (tenant_id, is_unread, internal_date_ms desc);

create index if not exists gmail_messages_label_ids_gin_idx
  on public.gmail_messages using gin (label_ids);

create index if not exists gmail_messages_category_labels_gin_idx
  on public.gmail_messages using gin (category_labels);

create table if not exists public.gmail_mailbox_index_state (
  tenant_id uuid primary key,
  last_history_id text,
  last_full_scan_at timestamptz,
  last_incremental_sync_at timestamptz,
  indexed_message_count integer not null default 0,
  mailbox_estimated_total integer,
  index_completion_pct numeric,
  last_index_duration_ms integer,
  last_sync_status text,
  last_sync_error text,
  updated_at timestamptz not null default now()
);

create table if not exists public.gmail_sender_stats (
  tenant_id uuid not null,
  sender text not null,
  message_count integer not null default 0,
  recent_count_30d integer not null default 0,
  machine_probability numeric not null default 0,
  human_probability numeric not null default 0,
  last_seen timestamptz,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, sender)
);

create index if not exists gmail_sender_stats_tenant_count_idx
  on public.gmail_sender_stats (tenant_id, message_count desc);

create index if not exists gmail_sender_stats_tenant_last_seen_idx
  on public.gmail_sender_stats (tenant_id, last_seen desc);

alter table public.gmail_messages enable row level security;
alter table public.gmail_mailbox_index_state enable row level security;
alter table public.gmail_sender_stats enable row level security;

drop policy if exists gmail_messages_tenant_select on public.gmail_messages;
create policy gmail_messages_tenant_select
on public.gmail_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_messages.tenant_id
  )
);

drop policy if exists gmail_messages_tenant_insert on public.gmail_messages;
create policy gmail_messages_tenant_insert
on public.gmail_messages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_messages.tenant_id
  )
);

drop policy if exists gmail_messages_tenant_update on public.gmail_messages;
create policy gmail_messages_tenant_update
on public.gmail_messages
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_messages.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_messages.tenant_id
  )
);

drop policy if exists gmail_messages_tenant_delete on public.gmail_messages;
create policy gmail_messages_tenant_delete
on public.gmail_messages
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_messages.tenant_id
  )
);

drop policy if exists gmail_mailbox_index_state_tenant_select on public.gmail_mailbox_index_state;
create policy gmail_mailbox_index_state_tenant_select
on public.gmail_mailbox_index_state
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_mailbox_index_state.tenant_id
  )
);

drop policy if exists gmail_mailbox_index_state_tenant_insert on public.gmail_mailbox_index_state;
create policy gmail_mailbox_index_state_tenant_insert
on public.gmail_mailbox_index_state
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_mailbox_index_state.tenant_id
  )
);

drop policy if exists gmail_mailbox_index_state_tenant_update on public.gmail_mailbox_index_state;
create policy gmail_mailbox_index_state_tenant_update
on public.gmail_mailbox_index_state
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_mailbox_index_state.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_mailbox_index_state.tenant_id
  )
);

drop policy if exists gmail_sender_stats_tenant_select on public.gmail_sender_stats;
create policy gmail_sender_stats_tenant_select
on public.gmail_sender_stats
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_stats.tenant_id
  )
);

drop policy if exists gmail_sender_stats_tenant_insert on public.gmail_sender_stats;
create policy gmail_sender_stats_tenant_insert
on public.gmail_sender_stats
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_stats.tenant_id
  )
);

drop policy if exists gmail_sender_stats_tenant_update on public.gmail_sender_stats;
create policy gmail_sender_stats_tenant_update
on public.gmail_sender_stats
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_stats.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_stats.tenant_id
  )
);

drop policy if exists gmail_sender_stats_tenant_delete on public.gmail_sender_stats;
create policy gmail_sender_stats_tenant_delete
on public.gmail_sender_stats
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_stats.tenant_id
  )
);
