alter table public.gmail_mailbox_index_state
  add column if not exists last_failure_reason_detail jsonb;
