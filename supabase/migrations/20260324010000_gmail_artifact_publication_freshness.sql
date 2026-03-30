alter table public.gmail_artifact_publications
  add column if not exists freshness_state text,
  add column if not exists freshness_reason text,
  add column if not exists refresh_strategy text,
  add column if not exists refresh_requested_at timestamptz,
  add column if not exists refresh_started_at timestamptz,
  add column if not exists refresh_completed_at timestamptz,
  add column if not exists refresh_job_id text,
  add column if not exists refresh_sync_run_id text;

update public.gmail_artifact_publications
set freshness_state = case
  when coalesce(trim(published_version), '') <> '' then 'fresh'
  else 'stale'
end
where freshness_state is null;

alter table public.gmail_artifact_publications
  alter column freshness_state set default 'stale';

alter table public.gmail_artifact_publications
  alter column freshness_state set not null;

create index if not exists gmail_artifact_publications_freshness_state_idx
  on public.gmail_artifact_publications (freshness_state, updated_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_artifact_publications_freshness_state_check'
  ) then
    alter table public.gmail_artifact_publications
      add constraint gmail_artifact_publications_freshness_state_check
      check (
        freshness_state in (
          'fresh',
          'stale',
          'refresh_pending',
          'refresh_in_progress',
          'refresh_failed',
          'refresh_skipped',
          'full_rebuild_required'
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_artifact_publications_refresh_strategy_check'
  ) then
    alter table public.gmail_artifact_publications
      add constraint gmail_artifact_publications_refresh_strategy_check
      check (
        refresh_strategy is null
        or refresh_strategy in ('incremental', 'full_rebuild')
      );
  end if;
end $$;
