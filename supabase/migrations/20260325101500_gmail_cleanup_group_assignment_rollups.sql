alter table public.gmail_sender_scope_rollups
  add column if not exists assigned_cleanup_group_id text,
  add column if not exists assignment_reason text,
  add column if not exists is_cleanup_candidate boolean not null default false;

update public.gmail_sender_scope_rollups
set assigned_cleanup_group_id = coalesce(assigned_cleanup_group_id, 'needs-review-senders'),
    assignment_reason = coalesce(assignment_reason, 'needs_review_unclassified')
where assigned_cleanup_group_id is null
   or assignment_reason is null;

alter table public.gmail_sender_scope_rollups
  alter column assigned_cleanup_group_id set not null,
  alter column assignment_reason set not null;

create index if not exists gmail_sender_scope_rollups_assignment_idx
  on public.gmail_sender_scope_rollups (
    tenant_id,
    analysis_scope,
    artifact_version,
    assigned_cleanup_group_id,
    is_cleanup_candidate,
    sender_key
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_sender_scope_rollups_assigned_cleanup_group_id_check'
  ) then
    alter table public.gmail_sender_scope_rollups
      add constraint gmail_sender_scope_rollups_assigned_cleanup_group_id_check
      check (
        assigned_cleanup_group_id in (
          'subscription-senders',
          'retail-commerce-senders',
          'social-platform-senders',
          'system-notification-senders',
          'dormant-backlog-senders',
          'protected-trusted-senders',
          'historical-out-of-inbox-senders',
          'needs-review-senders'
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gmail_sender_scope_rollups_assignment_reason_check'
  ) then
    alter table public.gmail_sender_scope_rollups
      add constraint gmail_sender_scope_rollups_assignment_reason_check
      check (
        assignment_reason in (
          'protected_signal_override',
          'protected_legacy_protected_human_sender',
          'protected_legacy_protected_human_dominant',
          'historical_no_inbox_rows',
          'behavioral_safe_rows',
          'behavioral_broader_rows',
          'needs_review_no_safe_rows',
          'needs_review_too_few_safe_rows',
          'needs_review_safe_ratio_too_low',
          'needs_review_score_below_threshold',
          'needs_review_no_cluster_match',
          'needs_review_unclassified'
        )
      );
  end if;
end $$;
