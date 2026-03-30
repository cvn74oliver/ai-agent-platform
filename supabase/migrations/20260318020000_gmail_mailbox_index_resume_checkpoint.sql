alter table public.gmail_mailbox_index_state
  add column if not exists active_next_page_token text,
  add column if not exists active_last_page_index integer,
  add column if not exists active_last_processed_at timestamptz,
  add column if not exists last_resume_page_token text,
  add column if not exists last_resume_page_index integer,
  add column if not exists last_resume_processed_at timestamptz;
