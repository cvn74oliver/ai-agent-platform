alter table public.gmail_mailbox_index_state
  add column if not exists backfill_resume_page_token text,
  add column if not exists backfill_resume_page_index integer,
  add column if not exists backfill_resume_processed_messages integer,
  add column if not exists backfill_resume_processed_at timestamptz,
  add column if not exists active_started_from_checkpoint boolean,
  add column if not exists last_started_from_checkpoint boolean;
