alter table public.gmail_mailbox_index_state
  add column if not exists active_backfill_window_months integer,
  add column if not exists active_backfill_cutoff_at timestamptz,
  add column if not exists backfill_completed_window_months integer,
  add column if not exists backfill_completed_cutoff_at timestamptz,
  add column if not exists backfill_completed_at timestamptz;
