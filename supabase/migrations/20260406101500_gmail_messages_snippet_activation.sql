alter table public.gmail_messages
  add column if not exists snippet text;

drop function if exists public.gmail_stream_indexed_mailbox_rows(uuid, text, bigint, text, integer);

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
  snippet text,
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
    gm.snippet,
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
