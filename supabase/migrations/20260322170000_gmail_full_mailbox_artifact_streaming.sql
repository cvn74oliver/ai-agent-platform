create or replace function public.gmail_normalize_sender(value text)
returns text
language sql
immutable
as $$
  select
    case
      when value is null then null
      else lower(trim(coalesce(substring(trim(value) from '<([^>]+)>'), trim(value))))
    end
$$;

alter table public.gmail_messages
  add column if not exists sender_key text
  generated always as (coalesce(public.gmail_normalize_sender(sender), '')) stored;

create index if not exists gmail_messages_tenant_sender_key_date_idx
  on public.gmail_messages (tenant_id, sender_key, internal_date_ms desc, message_id desc);

create index if not exists gmail_messages_tenant_inbox_sender_key_date_idx
  on public.gmail_messages (tenant_id, is_in_inbox, sender_key, internal_date_ms desc, message_id desc);

create or replace function public.gmail_stream_indexed_mailbox_rows(
  p_tenant_id uuid,
  p_after_sender_key text default null,
  p_after_internal_date_ms bigint default null,
  p_after_message_id text default null,
  p_batch_size integer default 1000
)
returns table (
  tenant_id uuid,
  message_id text,
  thread_id text,
  sender text,
  sender_key text,
  subject text,
  internal_date_ms bigint,
  date text,
  label_ids text[],
  category_labels text[],
  is_in_inbox boolean,
  is_unread boolean,
  is_starred boolean,
  is_important boolean,
  indexed_at timestamptz,
  updated_at timestamptz
)
language sql
stable
as $$
  select
    gm.tenant_id,
    gm.message_id,
    gm.thread_id,
    gm.sender,
    gm.sender_key,
    gm.subject,
    gm.internal_date_ms,
    gm.date,
    gm.label_ids,
    gm.category_labels,
    gm.is_in_inbox,
    gm.is_unread,
    gm.is_starred,
    gm.is_important,
    gm.indexed_at,
    gm.updated_at
  from public.gmail_messages gm
  where gm.tenant_id = p_tenant_id
    and (
      p_after_sender_key is null
      or gm.sender_key > p_after_sender_key
      or (
        gm.sender_key = p_after_sender_key
        and (
          coalesce(gm.internal_date_ms, -1) < coalesce(p_after_internal_date_ms, 9223372036854775807)
          or (
            coalesce(gm.internal_date_ms, -1) = coalesce(p_after_internal_date_ms, 9223372036854775807)
            and gm.message_id < coalesce(p_after_message_id, repeat('z', 64))
          )
        )
      )
    )
  order by gm.sender_key asc, gm.internal_date_ms desc nulls last, gm.message_id desc
  limit least(greatest(coalesce(p_batch_size, 1000), 1), 5000)
$$;

create table if not exists public.gmail_sender_scope_rollups (
  tenant_id uuid not null,
  analysis_scope text not null,
  artifact_version text not null,
  sender_key text not null,
  sender text not null,
  total_message_count integer not null default 0,
  cleanup_candidate_message_count integer not null default 0,
  protected_message_count integer not null default 0,
  likely_human_message_count integer not null default 0,
  unread_count integer not null default 0,
  first_seen timestamptz,
  last_seen timestamptz,
  category_summary text not null default 'General updates',
  sender_signal text not null default 'uncertain',
  cleanup_exclusion_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, analysis_scope, artifact_version, sender_key)
);

create index if not exists gmail_sender_scope_rollups_lookup_idx
  on public.gmail_sender_scope_rollups (
    tenant_id,
    analysis_scope,
    artifact_version,
    cleanup_candidate_message_count desc,
    total_message_count desc,
    sender_key
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_sender_scope_rollups_analysis_scope_check'
  ) then
    alter table public.gmail_sender_scope_rollups
      add constraint gmail_sender_scope_rollups_analysis_scope_check
      check (analysis_scope in ('7d', '30d', '60d', '90d', '180d', '365d', 'all_indexed'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_sender_scope_rollups_sender_signal_check'
  ) then
    alter table public.gmail_sender_scope_rollups
      add constraint gmail_sender_scope_rollups_sender_signal_check
      check (sender_signal in ('likely_machine_generated', 'likely_human', 'uncertain'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_sender_scope_rollups_cleanup_exclusion_reason_check'
  ) then
    alter table public.gmail_sender_scope_rollups
      add constraint gmail_sender_scope_rollups_cleanup_exclusion_reason_check
      check (
        cleanup_exclusion_reason is null
        or cleanup_exclusion_reason in (
          'no_inbox_rows',
          'no_safe_rows',
          'too_few_safe_rows',
          'safe_ratio_too_low',
          'protected_human_sender',
          'protected_human_dominant',
          'score_below_threshold',
          'no_cluster_match'
        )
      );
  end if;
end $$;

alter table public.gmail_sender_scope_rollups enable row level security;

drop policy if exists gmail_sender_scope_rollups_tenant_select on public.gmail_sender_scope_rollups;
create policy gmail_sender_scope_rollups_tenant_select
on public.gmail_sender_scope_rollups
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_scope_rollups.tenant_id
  )
);

drop policy if exists gmail_sender_scope_rollups_tenant_insert on public.gmail_sender_scope_rollups;
create policy gmail_sender_scope_rollups_tenant_insert
on public.gmail_sender_scope_rollups
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_scope_rollups.tenant_id
  )
);

drop policy if exists gmail_sender_scope_rollups_tenant_update on public.gmail_sender_scope_rollups;
create policy gmail_sender_scope_rollups_tenant_update
on public.gmail_sender_scope_rollups
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_scope_rollups.tenant_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_scope_rollups.tenant_id
  )
);

drop policy if exists gmail_sender_scope_rollups_tenant_delete on public.gmail_sender_scope_rollups;
create policy gmail_sender_scope_rollups_tenant_delete
on public.gmail_sender_scope_rollups
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = gmail_sender_scope_rollups.tenant_id
  )
);
