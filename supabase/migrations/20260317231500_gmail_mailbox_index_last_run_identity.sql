alter table public.gmail_mailbox_index_state
  add column if not exists last_run_id text,
  add column if not exists last_run_trigger text;
