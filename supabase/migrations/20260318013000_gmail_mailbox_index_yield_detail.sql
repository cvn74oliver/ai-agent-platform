alter table public.gmail_mailbox_index_state
  add column if not exists active_yield_detail jsonb,
  add column if not exists last_yield_detail jsonb;
