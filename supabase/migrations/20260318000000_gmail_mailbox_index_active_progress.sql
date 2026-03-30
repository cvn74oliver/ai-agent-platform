alter table public.gmail_mailbox_index_state
  add column if not exists active_rows_before integer,
  add column if not exists active_processed_messages integer,
  add column if not exists active_list_pages_fetched integer;
