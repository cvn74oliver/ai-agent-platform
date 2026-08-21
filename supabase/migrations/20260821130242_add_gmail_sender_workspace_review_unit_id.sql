alter table public.gmail_sender_workspace_seed_rows
  add column if not exists review_unit_id text;

create index if not exists gmail_sender_workspace_seed_rows_review_unit_rank_idx
  on public.gmail_sender_workspace_seed_rows (
    tenant_id,
    analysis_scope,
    cluster_id,
    artifact_version,
    review_unit_id,
    default_rank
  )
  where review_unit_id is not null;

comment on column public.gmail_sender_workspace_seed_rows.review_unit_id is
  'Stable published cleanup review-unit identity. Null remains valid for artifacts created before focused review-unit membership was materialized.';
