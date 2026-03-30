alter table public.gmail_sender_workspace_seed_rows
  add column if not exists semantic_family_key text,
  add column if not exists semantic_subtype_key text,
  add column if not exists semantic_pattern_key text,
  add column if not exists last_activity_at timestamptz;

create index if not exists gmail_sender_workspace_seed_rows_semantic_subtype_rank_idx
  on public.gmail_sender_workspace_seed_rows (
    tenant_id,
    analysis_scope,
    cluster_id,
    artifact_version,
    semantic_family_key,
    semantic_subtype_key,
    default_rank
  );

create index if not exists gmail_sender_workspace_seed_rows_semantic_family_rank_idx
  on public.gmail_sender_workspace_seed_rows (
    tenant_id,
    analysis_scope,
    cluster_id,
    artifact_version,
    semantic_family_key,
    default_rank
  );
