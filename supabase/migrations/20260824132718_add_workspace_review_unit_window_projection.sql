create table if not exists public.workspace_review_unit_projection_manifests (
  tenant_id uuid not null,
  workspace_type text not null,
  workspace_id uuid not null,
  workflow_id text not null,
  decision_subject_type text not null,
  analysis_scope text not null,
  parent_id text not null,
  artifact_version text not null,
  review_unit_id text not null,
  adapter_id text not null,
  adapter_schema_version integer not null,
  unit_entity_total integer not null,
  membership_hash text not null,
  all_indexed_activity_total bigint not null,
  coverage_start_at timestamptz not null,
  coverage_end_at timestamptz not null,
  projection_timezone text not null,
  supported_resolutions text[] not null,
  projection_hash text not null,
  validation_status text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (
    tenant_id,
    workspace_type,
    workspace_id,
    workflow_id,
    decision_subject_type,
    analysis_scope,
    parent_id,
    artifact_version,
    review_unit_id
  ),
  constraint workspace_review_unit_projection_manifest_identity_check check (
    workspace_type <> '' and workflow_id <> '' and decision_subject_type <> '' and
    analysis_scope <> '' and parent_id <> '' and artifact_version <> '' and
    review_unit_id <> '' and adapter_id <> '' and membership_hash <> '' and
    projection_hash <> '' and projection_timezone <> ''
  ),
  constraint workspace_review_unit_projection_manifest_counts_check check (
    adapter_schema_version > 0 and unit_entity_total between 1 and 400 and
    all_indexed_activity_total >= 0
  ),
  constraint workspace_review_unit_projection_manifest_coverage_check check (
    coverage_start_at > '1970-01-01 00:00:00+00'::timestamptz and
    coverage_end_at > coverage_start_at
  ),
  constraint workspace_review_unit_projection_manifest_resolutions_check check (
    supported_resolutions @> array['all_indexed', 'day', 'month', 'quarter', 'year']::text[] and
    supported_resolutions <@ array['all_indexed', 'day', 'month', 'quarter', 'year']::text[]
  ),
  constraint workspace_review_unit_projection_manifest_status_check check (
    validation_status = 'candidate_validated'
  )
);

create index if not exists workspace_review_unit_projection_manifest_lookup_idx
  on public.workspace_review_unit_projection_manifests (
    tenant_id,
    workspace_type,
    workspace_id,
    workflow_id,
    decision_subject_type,
    analysis_scope,
    parent_id,
    artifact_version,
    review_unit_id
  );

create table if not exists public.workspace_review_unit_activity_buckets (
  tenant_id uuid not null,
  workspace_type text not null,
  workspace_id uuid not null,
  workflow_id text not null,
  decision_subject_type text not null,
  analysis_scope text not null,
  parent_id text not null,
  artifact_version text not null,
  review_unit_id text not null,
  resolution text not null,
  bucket_start date not null,
  row_kind text not null,
  entity_id text not null,
  activity_count bigint not null,
  measure_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (
    tenant_id,
    workspace_type,
    workspace_id,
    workflow_id,
    decision_subject_type,
    analysis_scope,
    parent_id,
    artifact_version,
    review_unit_id,
    resolution,
    bucket_start,
    row_kind,
    entity_id
  ),
  constraint workspace_review_unit_activity_identity_check check (
    workspace_type <> '' and workflow_id <> '' and decision_subject_type <> '' and
    analysis_scope <> '' and parent_id <> '' and artifact_version <> '' and
    review_unit_id <> '' and entity_id <> ''
  ),
  constraint workspace_review_unit_activity_resolution_check check (
    resolution in ('all_indexed', 'day', 'month', 'quarter', 'year')
  ),
  constraint workspace_review_unit_activity_row_kind_check check (
    (row_kind = 'entity' and entity_id <> '__review_unit__') or
    (row_kind = 'unit' and entity_id = '__review_unit__')
  ),
  constraint workspace_review_unit_activity_count_check check (activity_count >= 0)
);

create index if not exists workspace_review_unit_activity_range_idx
  on public.workspace_review_unit_activity_buckets (
    tenant_id,
    workspace_type,
    workspace_id,
    workflow_id,
    decision_subject_type,
    analysis_scope,
    parent_id,
    artifact_version,
    review_unit_id,
    resolution,
    bucket_start,
    entity_id
  );

create index if not exists workspace_review_unit_activity_member_rank_idx
  on public.workspace_review_unit_activity_buckets (
    tenant_id,
    workspace_type,
    workspace_id,
    workflow_id,
    decision_subject_type,
    analysis_scope,
    parent_id,
    artifact_version,
    review_unit_id,
    resolution,
    activity_count desc,
    entity_id
  )
  where resolution = 'all_indexed' and row_kind = 'entity';

alter table public.workspace_review_unit_projection_manifests enable row level security;
alter table public.workspace_review_unit_activity_buckets enable row level security;

drop policy if exists workspace_review_unit_projection_manifests_tenant_all
  on public.workspace_review_unit_projection_manifests;
create policy workspace_review_unit_projection_manifests_tenant_all
on public.workspace_review_unit_projection_manifests
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.tenant_id = workspace_review_unit_projection_manifests.tenant_id
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.tenant_id = workspace_review_unit_projection_manifests.tenant_id
  )
);

drop policy if exists workspace_review_unit_activity_buckets_tenant_all
  on public.workspace_review_unit_activity_buckets;
create policy workspace_review_unit_activity_buckets_tenant_all
on public.workspace_review_unit_activity_buckets
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.tenant_id = workspace_review_unit_activity_buckets.tenant_id
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.tenant_id = workspace_review_unit_activity_buckets.tenant_id
  )
);

revoke all on table public.workspace_review_unit_projection_manifests from anon;
revoke all on table public.workspace_review_unit_activity_buckets from anon;
grant select, insert, update, delete on table public.workspace_review_unit_projection_manifests to authenticated;
grant select, insert, update, delete on table public.workspace_review_unit_activity_buckets to authenticated;
grant all on table public.workspace_review_unit_projection_manifests to service_role;
grant all on table public.workspace_review_unit_activity_buckets to service_role;

create or replace function public.read_workspace_review_unit_window_projection(
  p_tenant_id uuid,
  p_workspace_type text,
  p_workspace_id uuid,
  p_workflow_id text,
  p_decision_subject_type text,
  p_analysis_scope text,
  p_parent_id text,
  p_artifact_version text,
  p_review_unit_id text,
  p_window_kind text,
  p_window_start date default null,
  p_window_end date default null,
  p_time_zone text default 'UTC',
  p_member_limit integer default 400
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public, pg_temp
set statement_timeout = '8s'
as $$
declare
  v_manifest public.workspace_review_unit_projection_manifests%rowtype;
  v_effective_start date;
  v_effective_end date;
  v_full_month_start date;
  v_full_month_end date;
  v_result jsonb;
begin
  if p_window_kind not in ('all_indexed', 'preset', 'custom') then
    raise exception 'unsupported review-unit window kind';
  end if;
  if p_member_limit < 1 or p_member_limit > 400 then
    raise exception 'review-unit member limit must be between 1 and 400';
  end if;
  if nullif(trim(p_time_zone), '') is null then
    raise exception 'review-unit timezone is required';
  end if;

  select * into v_manifest
  from public.workspace_review_unit_projection_manifests m
  where m.tenant_id = p_tenant_id
    and m.workspace_type = p_workspace_type
    and m.workspace_id = p_workspace_id
    and m.workflow_id = p_workflow_id
    and m.decision_subject_type = p_decision_subject_type
    and m.analysis_scope = p_analysis_scope
    and m.parent_id = p_parent_id
    and m.artifact_version = p_artifact_version
    and m.review_unit_id = p_review_unit_id;

  if not found then
    raise exception 'review-unit projection is unavailable for the requested identity';
  end if;
  if v_manifest.unit_entity_total > p_member_limit then
    raise exception 'review-unit projection exceeds the bounded member limit';
  end if;
  if p_time_zone <> v_manifest.projection_timezone then
    raise exception 'review-unit projection timezone does not match the materialized artifact';
  end if;

  if p_window_kind = 'all_indexed' then
    v_effective_start := (v_manifest.coverage_start_at at time zone p_time_zone)::date;
    v_effective_end := ((v_manifest.coverage_end_at - interval '1 millisecond') at time zone p_time_zone)::date + 1;
  else
    if p_window_start is null or p_window_end is null or p_window_end <= p_window_start then
      raise exception 'preset and custom windows require valid half-open date bounds';
    end if;
    v_effective_start := greatest(
      p_window_start,
      (v_manifest.coverage_start_at at time zone p_time_zone)::date
    );
    v_effective_end := least(
      p_window_end,
      ((v_manifest.coverage_end_at - interval '1 millisecond') at time zone p_time_zone)::date + 1
    );
    if v_effective_end < v_effective_start then
      v_effective_end := v_effective_start;
    end if;
  end if;

  v_full_month_start := case
    when v_effective_start = date_trunc('month', v_effective_start)::date
      then v_effective_start
    else (date_trunc('month', v_effective_start) + interval '1 month')::date
  end;
  v_full_month_end := date_trunc('month', v_effective_end)::date;

  with member_rows as (
    select b.entity_id, b.activity_count as all_indexed_activity_count, b.measure_payload
    from public.workspace_review_unit_activity_buckets b
    where b.tenant_id = p_tenant_id
      and b.workspace_type = p_workspace_type
      and b.workspace_id = p_workspace_id
      and b.workflow_id = p_workflow_id
      and b.decision_subject_type = p_decision_subject_type
      and b.analysis_scope = p_analysis_scope
      and b.parent_id = p_parent_id
      and b.artifact_version = p_artifact_version
      and b.review_unit_id = p_review_unit_id
      and b.resolution = 'all_indexed'
      and b.row_kind = 'entity'
    order by b.activity_count desc, b.entity_id
    limit p_member_limit
  ), selected_activity as (
    select b.entity_id, b.resolution, b.bucket_start, b.activity_count
    from public.workspace_review_unit_activity_buckets b
    where p_window_kind = 'all_indexed'
      and b.tenant_id = p_tenant_id
      and b.workspace_type = p_workspace_type
      and b.workspace_id = p_workspace_id
      and b.workflow_id = p_workflow_id
      and b.decision_subject_type = p_decision_subject_type
      and b.analysis_scope = p_analysis_scope
      and b.parent_id = p_parent_id
      and b.artifact_version = p_artifact_version
      and b.review_unit_id = p_review_unit_id
      and b.resolution = 'all_indexed'
      and b.row_kind = 'entity'
    union all
    select b.entity_id, b.resolution, b.bucket_start, b.activity_count
    from public.workspace_review_unit_activity_buckets b
    where p_window_kind <> 'all_indexed'
      and v_effective_end > v_effective_start
      and b.tenant_id = p_tenant_id
      and b.workspace_type = p_workspace_type
      and b.workspace_id = p_workspace_id
      and b.workflow_id = p_workflow_id
      and b.decision_subject_type = p_decision_subject_type
      and b.analysis_scope = p_analysis_scope
      and b.parent_id = p_parent_id
      and b.artifact_version = p_artifact_version
      and b.review_unit_id = p_review_unit_id
      and b.row_kind = 'entity'
      and (
        (
          b.resolution = 'month'
          and v_full_month_start < v_full_month_end
          and b.bucket_start >= v_full_month_start
          and b.bucket_start < v_full_month_end
        )
        or
        (
          b.resolution = 'day'
          and b.bucket_start >= v_effective_start
          and b.bucket_start < v_effective_end
          and not (
            v_full_month_start < v_full_month_end
            and b.bucket_start >= v_full_month_start
            and b.bucket_start < v_full_month_end
          )
        )
      )
  ), entity_activity as (
    select a.entity_id, sum(a.activity_count)::bigint as activity_count
    from selected_activity a
    group by a.entity_id
  ), chart_activity as (
    select a.resolution, a.bucket_start, sum(a.activity_count)::bigint as activity_count
    from selected_activity a
    where p_window_kind <> 'all_indexed'
    group by a.resolution, a.bucket_start
    union all
    select b.resolution, b.bucket_start, b.activity_count
    from public.workspace_review_unit_activity_buckets b
    where p_window_kind = 'all_indexed'
      and b.tenant_id = p_tenant_id
      and b.workspace_type = p_workspace_type
      and b.workspace_id = p_workspace_id
      and b.workflow_id = p_workflow_id
      and b.decision_subject_type = p_decision_subject_type
      and b.analysis_scope = p_analysis_scope
      and b.parent_id = p_parent_id
      and b.artifact_version = p_artifact_version
      and b.review_unit_id = p_review_unit_id
      and b.resolution = 'year'
      and b.row_kind = 'unit'
      and b.bucket_start >= date_trunc('year', v_effective_start)::date
      and b.bucket_start < v_effective_end
  ), chart_slots as (
    select 'year'::text as resolution, slot::date as bucket_start
    from generate_series(
      date_trunc('year', v_effective_start)::date,
      date_trunc('year', greatest(v_effective_start, v_effective_end - 1))::date,
      interval '1 year'
    ) slot
    where p_window_kind = 'all_indexed' and v_effective_end > v_effective_start
    union all
    select 'month'::text as resolution, slot::date as bucket_start
    from generate_series(
      v_full_month_start,
      greatest(v_full_month_start, v_full_month_end - 1),
      interval '1 month'
    ) slot
    where p_window_kind <> 'all_indexed' and v_full_month_start < v_full_month_end
    union all
    select 'day'::text as resolution, slot::date as bucket_start
    from generate_series(
      v_effective_start,
      greatest(v_effective_start, v_effective_end - 1),
      interval '1 day'
    ) slot
    where p_window_kind <> 'all_indexed'
      and v_effective_end > v_effective_start
      and not (
        v_full_month_start < v_full_month_end
        and slot::date >= v_full_month_start
        and slot::date < v_full_month_end
      )
  ), dense_chart as (
    select s.resolution, s.bucket_start, coalesce(a.activity_count, 0)::bigint as activity_count
    from chart_slots s
    left join chart_activity a
      on a.resolution = s.resolution and a.bucket_start = s.bucket_start
  )
  select jsonb_build_object(
    'artifact_version', v_manifest.artifact_version,
    'parent_id', v_manifest.parent_id,
    'review_unit_id', v_manifest.review_unit_id,
    'membership_hash', v_manifest.membership_hash,
    'projection_hash', v_manifest.projection_hash,
    'unit_entity_total', v_manifest.unit_entity_total,
    'active_entity_total', count(*) filter (where coalesce(e.activity_count, 0) > 0),
    'activity_total', coalesce(sum(e.activity_count), 0),
    'coverage_start_at', v_manifest.coverage_start_at,
    'coverage_end_at', v_manifest.coverage_end_at,
    'time_zone', v_manifest.projection_timezone,
    'requested_window', jsonb_build_object(
      'kind', p_window_kind,
      'start', p_window_start,
      'end', p_window_end
    ),
    'effective_window', jsonb_build_object(
      'start', v_effective_start,
      'end', v_effective_end,
      'empty', v_effective_end <= v_effective_start,
      'clamped_start', p_window_kind <> 'all_indexed' and v_effective_start <> p_window_start,
      'clamped_end', p_window_kind <> 'all_indexed' and v_effective_end <> p_window_end
    ),
    'members', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'entity_id', m.entity_id,
          'activity_count', coalesce(e.activity_count, 0),
          'all_indexed_activity_count', m.all_indexed_activity_count
        )
        order by coalesce(e.activity_count, 0) desc, m.entity_id
      ),
      '[]'::jsonb
    ),
    'series', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'resolution', c.resolution,
            'bucket_start', c.bucket_start,
            'activity_count', c.activity_count
          )
          order by c.bucket_start, c.resolution
        )
        from dense_chart c
      ),
      '[]'::jsonb
    )
  ) into v_result
  from member_rows m
  left join entity_activity e on e.entity_id = m.entity_id;

  if coalesce(jsonb_array_length(v_result -> 'members'), 0) <> v_manifest.unit_entity_total then
    raise exception 'review-unit projection membership rows do not match the manifest';
  end if;
  return v_result;
end;
$$;

revoke all on function public.read_workspace_review_unit_window_projection(
  uuid, text, uuid, text, text, text, text, text, text, text, date, date, text, integer
) from public;
revoke all on function public.read_workspace_review_unit_window_projection(
  uuid, text, uuid, text, text, text, text, text, text, text, date, date, text, integer
) from anon;
grant execute on function public.read_workspace_review_unit_window_projection(
  uuid, text, uuid, text, text, text, text, text, text, text, date, date, text, integer
) to authenticated;
grant execute on function public.read_workspace_review_unit_window_projection(
  uuid, text, uuid, text, text, text, text, text, text, text, date, date, text, integer
) to service_role;

comment on table public.workspace_review_unit_projection_manifests is
  'Immutable candidate projection capability for fixed review-unit membership and bounded windowed observation.';
comment on table public.workspace_review_unit_activity_buckets is
  'Domain-neutral entity and unit activity aggregates. Normal runtime reads never scan source events.';
comment on function public.read_workspace_review_unit_window_projection is
  'RLS-respecting bounded reader for fixed membership plus exact All Indexed, preset, or Custom observation windows.';
