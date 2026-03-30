alter table public.gmail_sender_stats
  add column if not exists category_distribution jsonb not null default '[]'::jsonb;

alter table public.gmail_sender_stats
  add column if not exists categorized_message_count integer not null default 0;

alter table public.gmail_sender_stats
  add column if not exists uncategorized_message_count integer not null default 0;

alter table public.gmail_sender_stats
  add column if not exists multi_category_message_count integer not null default 0;

alter table public.gmail_sender_stats
  add column if not exists dominant_category text;

alter table public.gmail_sender_stats
  add column if not exists dominant_category_confidence text;

alter table public.gmail_sender_stats
  add column if not exists category_profile_mode text not null default 'insufficient_data';

alter table public.gmail_sender_stats
  add column if not exists pattern_mix jsonb not null default '[]'::jsonb;

alter table public.gmail_sender_stats
  add column if not exists dominant_pattern text not null default 'General updates';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_sender_stats_category_profile_mode_check'
  ) then
    alter table public.gmail_sender_stats
      add constraint gmail_sender_stats_category_profile_mode_check
      check (
        category_profile_mode in ('dominant', 'mixed', 'uncategorized', 'insufficient_data')
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_sender_stats_dominant_category_confidence_check'
  ) then
    alter table public.gmail_sender_stats
      add constraint gmail_sender_stats_dominant_category_confidence_check
      check (
        dominant_category_confidence in ('high', 'medium', 'low')
        or dominant_category_confidence is null
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_sender_stats_dominant_category_check'
  ) then
    alter table public.gmail_sender_stats
      add constraint gmail_sender_stats_dominant_category_check
      check (
        dominant_category in (
          'Promotions',
          'Social',
          'Updates',
          'Forums',
          'Primary',
          'Uncategorized'
        )
        or dominant_category is null
      );
  end if;
end
$$;
