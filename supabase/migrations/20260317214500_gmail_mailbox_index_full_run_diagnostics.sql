alter table public.gmail_mailbox_index_state
  add column if not exists active_requested_mode text,
  add column if not exists active_effective_mode text,
  add column if not exists last_requested_mode text,
  add column if not exists last_effective_mode text,
  add column if not exists last_terminal_reason text,
  add column if not exists last_gmail_result_size_estimate integer,
  add column if not exists last_list_pages_fetched integer;
