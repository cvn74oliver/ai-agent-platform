alter table public.gmail_sender_stats
  add column if not exists operator_profile_family text not null default 'insufficient_data';

alter table public.gmail_sender_stats
  add column if not exists operator_profile_mode text not null default 'insufficient_data';

alter table public.gmail_sender_stats
  add column if not exists operator_profile_confidence text;

alter table public.gmail_sender_stats
  add column if not exists operator_profile_summary text not null default 'Insufficient data';

alter table public.gmail_sender_stats
  add column if not exists operator_profile_reasons jsonb not null default '[]'::jsonb;

alter table public.gmail_sender_stats
  add column if not exists operator_profile_source text not null default 'insufficient_data';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_sender_stats_operator_profile_family_check'
  ) then
    alter table public.gmail_sender_stats
      add constraint gmail_sender_stats_operator_profile_family_check
      check (
        operator_profile_family in (
          'marketing_promotional',
          'commerce_transactional',
          'account_notification',
          'security_alert',
          'social_community',
          'human_personal',
          'mixed_behavior',
          'insufficient_data'
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_sender_stats_operator_profile_mode_check'
  ) then
    alter table public.gmail_sender_stats
      add constraint gmail_sender_stats_operator_profile_mode_check
      check (
        operator_profile_mode in ('clear', 'mixed', 'insufficient_data')
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_sender_stats_operator_profile_confidence_check'
  ) then
    alter table public.gmail_sender_stats
      add constraint gmail_sender_stats_operator_profile_confidence_check
      check (
        operator_profile_confidence in ('high', 'medium', 'low')
        or operator_profile_confidence is null
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_sender_stats_operator_profile_source_check'
  ) then
    alter table public.gmail_sender_stats
      add constraint gmail_sender_stats_operator_profile_source_check
      check (
        operator_profile_source in ('sender_global_operator_profile_v1', 'insufficient_data')
      );
  end if;
end
$$;
