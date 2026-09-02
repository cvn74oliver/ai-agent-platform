create table if not exists public.decision_workspace_execution_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  agent_id uuid not null,
  actor_id uuid not null,
  approval_id uuid not null,
  request_event_id uuid not null,
  decision_event_id uuid not null,
  execution_key text not null,
  action_fingerprint text not null,
  workflow_context jsonb not null default '{}'::jsonb,
  status text not null default 'claimed',
  lease_token uuid not null default gen_random_uuid(),
  lease_expires_at timestamptz not null,
  reconciliation_status text not null default 'not_required',
  transitions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint decision_workspace_execution_runs_identity_check check (
    execution_key <> '' and action_fingerprint <> ''
  ),
  constraint decision_workspace_execution_runs_workflow_context_check check (
    jsonb_typeof(workflow_context) = 'object'
  ),
  constraint decision_workspace_execution_runs_status_check check (
    status in ('claimed', 'executing', 'succeeded', 'failed', 'partial', 'indeterminate', 'reverted')
  ),
  constraint decision_workspace_execution_runs_reconciliation_check check (
    reconciliation_status in ('not_required', 'pending', 'manual_required', 'resolved')
  ),
  constraint decision_workspace_execution_runs_transitions_check check (
    jsonb_typeof(transitions) = 'array'
  ),
  constraint decision_workspace_execution_runs_tenant_agent_request_key unique (
    tenant_id,
    agent_id,
    request_event_id
  ),
  constraint decision_workspace_execution_runs_tenant_execution_key unique (
    tenant_id,
    execution_key
  )
);

create table if not exists public.decision_workspace_execution_actions (
  id uuid primary key default gen_random_uuid(),
  execution_run_id uuid not null references public.decision_workspace_execution_runs(id) on delete cascade,
  tenant_id uuid not null,
  action_index integer not null,
  idempotency_key text not null,
  provider_type text not null,
  source_id text,
  connection_id text,
  agent_role_id text,
  tool text not null,
  action text not null,
  capability text not null,
  effect text not null,
  reversibility text not null,
  approved_action jsonb not null,
  status text not null default 'claimed',
  attempt_count integer not null default 0,
  provider_receipt jsonb,
  rollback_reference text,
  error_code text,
  reconciliation_status text not null default 'not_required',
  transitions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint decision_workspace_execution_actions_index_check check (action_index >= 0),
  constraint decision_workspace_execution_actions_identity_check check (
    idempotency_key <> '' and provider_type <> '' and tool <> '' and action <> '' and capability <> ''
  ),
  constraint decision_workspace_execution_actions_effect_check check (
    effect in ('decision_only', 'provider_read', 'provider_write')
  ),
  constraint decision_workspace_execution_actions_reversibility_check check (
    reversibility in ('reversible', 'compensating_action', 'irreversible', 'not_applicable')
  ),
  constraint decision_workspace_execution_actions_approved_action_check check (
    jsonb_typeof(approved_action) = 'object'
  ),
  constraint decision_workspace_execution_actions_status_check check (
    status in ('claimed', 'executing', 'succeeded', 'failed', 'partial', 'indeterminate', 'skipped', 'reverted')
  ),
  constraint decision_workspace_execution_actions_attempt_count_check check (attempt_count >= 0),
  constraint decision_workspace_execution_actions_receipt_check check (
    provider_receipt is null or (
      jsonb_typeof(provider_receipt) = 'object' and
      octet_length(provider_receipt::text) <= 262144
    )
  ),
  constraint decision_workspace_execution_actions_reconciliation_check check (
    reconciliation_status in ('not_required', 'pending', 'manual_required', 'resolved')
  ),
  constraint decision_workspace_execution_actions_transitions_check check (
    jsonb_typeof(transitions) = 'array'
  ),
  constraint decision_workspace_execution_actions_run_index_key unique (
    execution_run_id,
    action_index
  ),
  constraint decision_workspace_execution_actions_tenant_idempotency_key unique (
    tenant_id,
    idempotency_key
  )
);

create index if not exists decision_workspace_execution_runs_lookup_idx
  on public.decision_workspace_execution_runs (
    tenant_id,
    agent_id,
    approval_id,
    created_at desc
  );

create index if not exists decision_workspace_execution_runs_stale_idx
  on public.decision_workspace_execution_runs (lease_expires_at)
  where status in ('claimed', 'executing');

create index if not exists decision_workspace_execution_actions_run_status_idx
  on public.decision_workspace_execution_actions (
    execution_run_id,
    status,
    action_index
  );

alter table public.decision_workspace_execution_runs enable row level security;
alter table public.decision_workspace_execution_actions enable row level security;

revoke all on table public.decision_workspace_execution_runs from anon, authenticated;
revoke all on table public.decision_workspace_execution_actions from anon, authenticated;
grant all on table public.decision_workspace_execution_runs to service_role;
grant all on table public.decision_workspace_execution_actions to service_role;

create or replace function public.claim_decision_workspace_execution(
  p_tenant_id uuid,
  p_agent_id uuid,
  p_actor_id uuid,
  p_approval_id uuid,
  p_request_event_id uuid,
  p_decision_event_id uuid,
  p_execution_key text,
  p_action_fingerprint text,
  p_workflow_context jsonb,
  p_actions jsonb,
  p_lease_seconds integer default 900
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
set statement_timeout = '8s'
as $$
declare
  v_now timestamptz := now();
  v_request_payload jsonb;
  v_decision_payload jsonb;
  v_latest_decision_id uuid;
  v_approved_actions jsonb;
  v_run public.decision_workspace_execution_runs%rowtype;
  v_created boolean := false;
begin
  if p_tenant_id is null or p_agent_id is null or p_actor_id is null or
     p_approval_id is null or p_request_event_id is null or p_decision_event_id is null then
    raise exception 'execution identity is incomplete';
  end if;

  if nullif(trim(p_execution_key), '') is null or
     nullif(trim(p_action_fingerprint), '') is null then
    raise exception 'execution keys are required';
  end if;

  if p_lease_seconds < 30 or p_lease_seconds > 3600 then
    raise exception 'execution lease must be between 30 and 3600 seconds';
  end if;

  if jsonb_typeof(coalesce(p_workflow_context, '{}'::jsonb)) <> 'object' then
    raise exception 'workflow context must be an object';
  end if;

  if jsonb_typeof(p_actions) <> 'array' or
     jsonb_array_length(p_actions) < 1 or
     jsonb_array_length(p_actions) > 50 then
    raise exception 'execution actions must contain between 1 and 50 entries';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = p_actor_id
      and p.tenant_id = p_tenant_id
  ) then
    raise exception 'execution identity is not authorized';
  end if;

  if not exists (
    select 1
    from public.agents a
    where a.id = p_agent_id
      and a.user_id = p_actor_id
  ) then
    raise exception 'execution identity is not authorized';
  end if;

  select e.payload into v_request_payload
  from public.agent_events e
  where e.id = p_request_event_id
    and e.agent_id = p_agent_id
    and e.event_type = 'approval_request';

  if v_request_payload is null or
     v_request_payload ->> 'approval_id' <> p_approval_id::text or
     coalesce(v_request_payload ->> 'agent_id', p_agent_id::text) <> p_agent_id::text then
    raise exception 'approved request identity is invalid';
  end if;

  select e.id, e.payload into v_latest_decision_id, v_decision_payload
  from public.agent_events e
  where e.agent_id = p_agent_id
    and e.event_type = 'approval_decision'
    and e.payload ->> 'approval_id' = p_approval_id::text
  order by e.created_at desc, e.id desc
  limit 1;

  if v_latest_decision_id is null or
     v_latest_decision_id <> p_decision_event_id or
     v_decision_payload ->> 'decision' <> 'approved' or
     (
       v_decision_payload ? 'request_event_id' and
       v_decision_payload ->> 'request_event_id' <> p_request_event_id::text
     ) then
    raise exception 'latest approval decision is invalid';
  end if;

  select jsonb_agg(entry.value -> 'approved_action' order by entry.ordinality)
    into v_approved_actions
  from jsonb_array_elements(p_actions) with ordinality as entry(value, ordinality);

  if v_approved_actions is distinct from v_request_payload -> 'proposed_actions' then
    raise exception 'execution actions do not match the approved request';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_actions) with ordinality as entry(value, ordinality)
    where jsonb_typeof(entry.value) <> 'object'
      or nullif(trim(entry.value ->> 'idempotency_key'), '') is null
      or nullif(trim(entry.value ->> 'provider_type'), '') is null
      or nullif(trim(entry.value ->> 'tool'), '') is null
      or nullif(trim(entry.value ->> 'action'), '') is null
      or nullif(trim(entry.value ->> 'capability'), '') is null
      or entry.value ->> 'effect' not in ('decision_only', 'provider_read', 'provider_write')
      or entry.value ->> 'reversibility' not in (
        'reversible',
        'compensating_action',
        'irreversible',
        'not_applicable'
      )
  ) then
    raise exception 'execution action metadata is invalid';
  end if;

  insert into public.decision_workspace_execution_runs (
    tenant_id,
    agent_id,
    actor_id,
    approval_id,
    request_event_id,
    decision_event_id,
    execution_key,
    action_fingerprint,
    workflow_context,
    status,
    lease_expires_at,
    reconciliation_status,
    transitions,
    created_at,
    updated_at
  ) values (
    p_tenant_id,
    p_agent_id,
    p_actor_id,
    p_approval_id,
    p_request_event_id,
    p_decision_event_id,
    trim(p_execution_key),
    trim(p_action_fingerprint),
    coalesce(p_workflow_context, '{}'::jsonb),
    'claimed',
    v_now + make_interval(secs => p_lease_seconds),
    'not_required',
    jsonb_build_array(
      jsonb_build_object(
        'from', null,
        'to', 'claimed',
        'at', v_now,
        'actor_id', p_actor_id
      )
    ),
    v_now,
    v_now
  )
  on conflict (tenant_id, agent_id, request_event_id) do nothing
  returning * into v_run;

  if v_run.id is not null then
    v_created := true;

    insert into public.decision_workspace_execution_actions (
      execution_run_id,
      tenant_id,
      action_index,
      idempotency_key,
      provider_type,
      source_id,
      connection_id,
      agent_role_id,
      tool,
      action,
      capability,
      effect,
      reversibility,
      approved_action,
      status,
      reconciliation_status,
      transitions,
      created_at,
      updated_at
    )
    select
      v_run.id,
      p_tenant_id,
      entry.ordinality::integer - 1,
      trim(entry.value ->> 'idempotency_key'),
      trim(entry.value ->> 'provider_type'),
      nullif(trim(entry.value ->> 'source_id'), ''),
      nullif(trim(entry.value ->> 'connection_id'), ''),
      nullif(trim(entry.value ->> 'agent_role_id'), ''),
      trim(entry.value ->> 'tool'),
      trim(entry.value ->> 'action'),
      trim(entry.value ->> 'capability'),
      entry.value ->> 'effect',
      entry.value ->> 'reversibility',
      entry.value -> 'approved_action',
      'claimed',
      'not_required',
      jsonb_build_array(
        jsonb_build_object(
          'from', null,
          'to', 'claimed',
          'at', v_now,
          'actor_id', p_actor_id
        )
      ),
      v_now,
      v_now
    from jsonb_array_elements(p_actions) with ordinality as entry(value, ordinality);
  else
    select * into v_run
    from public.decision_workspace_execution_runs r
    where r.tenant_id = p_tenant_id
      and r.agent_id = p_agent_id
      and r.request_event_id = p_request_event_id
    for update;

    if v_run.id is null or
       v_run.execution_key <> trim(p_execution_key) or
       v_run.action_fingerprint <> trim(p_action_fingerprint) or
       v_run.approval_id <> p_approval_id or
       v_run.decision_event_id <> p_decision_event_id or
       v_run.actor_id <> p_actor_id then
      return jsonb_build_object(
        'ok', false,
        'conflict', true,
        'invocation_authorized', false,
        'error', 'execution claim conflicts with the durable request identity'
      );
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'conflict', false,
    'existing', not v_created,
    'invocation_authorized', v_created,
    'execution_id', v_run.id,
    'status', v_run.status,
    'lease_token', v_run.lease_token,
    'lease_expires_at', v_run.lease_expires_at
  );
exception
  when unique_violation then
    return jsonb_build_object(
      'ok', false,
      'conflict', true,
      'invocation_authorized', false,
      'error', 'execution claim conflicts with a durable idempotency identity'
    );
end;
$$;

create or replace function public.record_decision_workspace_action_receipt(
  p_tenant_id uuid,
  p_execution_id uuid,
  p_lease_token uuid,
  p_action_index integer,
  p_expected_status text,
  p_next_status text,
  p_actor_id uuid,
  p_provider_receipt jsonb default null,
  p_error_code text default null,
  p_rollback_reference text default null,
  p_reconciliation_status text default 'not_required'
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
set statement_timeout = '8s'
as $$
declare
  v_now timestamptz := now();
  v_run public.decision_workspace_execution_runs%rowtype;
  v_action public.decision_workspace_execution_actions%rowtype;
begin
  if p_action_index < 0 then
    raise exception 'action index is invalid';
  end if;

  if p_reconciliation_status not in ('not_required', 'pending', 'manual_required', 'resolved') then
    raise exception 'reconciliation status is invalid';
  end if;

  if p_provider_receipt is not null and (
    jsonb_typeof(p_provider_receipt) <> 'object' or
    octet_length(p_provider_receipt::text) > 262144
  ) then
    raise exception 'provider receipt is invalid or too large';
  end if;

  if not (
    (p_expected_status = 'claimed' and p_next_status in ('executing', 'failed', 'indeterminate', 'skipped')) or
    (p_expected_status = 'executing' and p_next_status in ('succeeded', 'failed', 'partial', 'indeterminate')) or
    (p_expected_status in ('succeeded', 'partial') and p_next_status = 'reverted')
  ) then
    raise exception 'execution action transition is invalid';
  end if;

  if p_next_status in ('succeeded', 'partial') and p_provider_receipt is null then
    raise exception 'successful or partial action requires a provider receipt';
  end if;

  select * into v_run
  from public.decision_workspace_execution_runs r
  where r.id = p_execution_id
    and r.tenant_id = p_tenant_id
    and r.actor_id = p_actor_id
    and r.lease_token = p_lease_token
  for update;

  if v_run.id is null then
    raise exception 'execution lease is unavailable';
  end if;

  if v_run.status not in ('claimed', 'executing') or v_run.lease_expires_at <= v_now then
    raise exception 'execution lease is not active';
  end if;

  update public.decision_workspace_execution_actions a
  set
    status = p_next_status,
    attempt_count = a.attempt_count + case when p_next_status = 'executing' then 1 else 0 end,
    provider_receipt = coalesce(p_provider_receipt, a.provider_receipt),
    error_code = nullif(trim(p_error_code), ''),
    rollback_reference = coalesce(nullif(trim(p_rollback_reference), ''), a.rollback_reference),
    reconciliation_status = p_reconciliation_status,
    transitions = a.transitions || jsonb_build_array(
      jsonb_build_object(
        'from', p_expected_status,
        'to', p_next_status,
        'at', v_now,
        'actor_id', p_actor_id
      )
    ),
    updated_at = v_now,
    finished_at = case
      when p_next_status in ('succeeded', 'failed', 'partial', 'indeterminate', 'skipped', 'reverted')
        then v_now
      else null
    end
  where a.tenant_id = p_tenant_id
    and a.execution_run_id = p_execution_id
    and a.action_index = p_action_index
    and a.status = p_expected_status
  returning * into v_action;

  if v_action.id is null then
    raise exception 'execution action transition lost its expected state';
  end if;

  update public.decision_workspace_execution_runs r
  set
    status = case when r.status = 'claimed' then 'executing' else r.status end,
    lease_expires_at = case
      when p_next_status = 'executing' then v_now + interval '15 minutes'
      else r.lease_expires_at
    end,
    transitions = case
      when r.status = 'claimed' then r.transitions || jsonb_build_array(
        jsonb_build_object(
          'from', 'claimed',
          'to', 'executing',
          'at', v_now,
          'actor_id', p_actor_id
        )
      )
      else r.transitions
    end,
    updated_at = v_now
  where r.id = p_execution_id
    and r.tenant_id = p_tenant_id;

  return jsonb_build_object(
    'ok', true,
    'execution_id', p_execution_id,
    'action_index', p_action_index,
    'status', v_action.status,
    'attempt_count', v_action.attempt_count
  );
end;
$$;

create or replace function public.finalize_decision_workspace_execution(
  p_tenant_id uuid,
  p_execution_id uuid,
  p_lease_token uuid,
  p_actor_id uuid,
  p_compatibility_payload jsonb default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
set statement_timeout = '8s'
as $$
declare
  v_now timestamptz := now();
  v_run public.decision_workspace_execution_runs%rowtype;
  v_previous_status text;
  v_next_status text;
  v_action_count bigint;
  v_succeeded_count bigint;
  v_failed_count bigint;
  v_partial_count bigint;
  v_indeterminate_count bigint;
  v_skipped_count bigint;
  v_active_count bigint;
begin
  select * into v_run
  from public.decision_workspace_execution_runs r
  where r.id = p_execution_id
    and r.tenant_id = p_tenant_id
    and r.lease_token = p_lease_token
  for update;

  if v_run.id is null or v_run.actor_id <> p_actor_id then
    raise exception 'execution run is unavailable';
  end if;

  select
    count(*),
    count(*) filter (where status = 'succeeded'),
    count(*) filter (where status = 'failed'),
    count(*) filter (where status = 'partial'),
    count(*) filter (where status = 'indeterminate'),
    count(*) filter (where status = 'skipped'),
    count(*) filter (where status in ('claimed', 'executing'))
  into
    v_action_count,
    v_succeeded_count,
    v_failed_count,
    v_partial_count,
    v_indeterminate_count,
    v_skipped_count,
    v_active_count
  from public.decision_workspace_execution_actions a
  where a.execution_run_id = p_execution_id
    and a.tenant_id = p_tenant_id;

  if v_action_count < 1 then
    raise exception 'execution run has no actions';
  end if;

  if v_active_count > 0 then
    v_next_status := 'executing';
  elsif v_indeterminate_count > 0 then
    v_next_status := 'indeterminate';
  elsif v_succeeded_count = v_action_count then
    v_next_status := 'succeeded';
  elsif v_succeeded_count > 0 or v_partial_count > 0 then
    v_next_status := 'partial';
  elsif v_failed_count > 0 or v_skipped_count > 0 then
    v_next_status := 'failed';
  else
    raise exception 'execution action states cannot be finalized';
  end if;

  v_previous_status := v_run.status;

  if v_next_status = 'succeeded' then
    if p_compatibility_payload is null or
       jsonb_typeof(p_compatibility_payload) <> 'object' or
       p_compatibility_payload ->> 'approval_id' <> v_run.approval_id::text or
       p_compatibility_payload ->> 'request_event_id' <> v_run.request_event_id::text or
       p_compatibility_payload ->> 'decision_event_id' <> v_run.decision_event_id::text or
       p_compatibility_payload ->> 'success' <> 'true' then
      raise exception 'successful execution requires a bound compatibility payload';
    end if;

    if not exists (
      select 1
      from public.agent_events e
      where e.agent_id = v_run.agent_id
        and e.event_type = 'execution_result'
        and e.payload ->> 'approval_id' = v_run.approval_id::text
        and e.payload ->> 'request_event_id' = v_run.request_event_id::text
    ) then
      insert into public.agent_events (agent_id, event_type, created_at, payload)
      values (v_run.agent_id, 'execution_result', v_now, p_compatibility_payload);
    end if;
  elsif p_compatibility_payload is not null then
    raise exception 'non-success execution cannot emit a compatibility success payload';
  end if;

  update public.decision_workspace_execution_runs r
  set
    status = v_next_status,
    reconciliation_status = case
      when v_next_status = 'indeterminate' then 'manual_required'
      when v_next_status = 'partial' then 'pending'
      else 'not_required'
    end,
    transitions = case
      when v_previous_status = v_next_status then r.transitions
      else r.transitions || jsonb_build_array(
        jsonb_build_object(
          'from', v_previous_status,
          'to', v_next_status,
          'at', v_now,
          'actor_id', p_actor_id
        )
      )
    end,
    updated_at = v_now,
    finished_at = case
      when v_next_status in ('succeeded', 'failed', 'partial', 'indeterminate', 'reverted') then v_now
      else null
    end
  where r.id = p_execution_id
    and r.tenant_id = p_tenant_id
  returning * into v_run;

  return jsonb_build_object(
    'ok', true,
    'execution_id', v_run.id,
    'status', v_run.status,
    'reconciliation_status', v_run.reconciliation_status,
    'action_count', v_action_count,
    'succeeded_count', v_succeeded_count,
    'failed_count', v_failed_count,
    'partial_count', v_partial_count,
    'indeterminate_count', v_indeterminate_count,
    'skipped_count', v_skipped_count
  );
end;
$$;

create or replace function public.resolve_stale_decision_workspace_execution(
  p_tenant_id uuid,
  p_execution_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
set statement_timeout = '8s'
as $$
declare
  v_now timestamptz := now();
  v_run public.decision_workspace_execution_runs%rowtype;
  v_next_status text;
  v_action_count bigint;
  v_succeeded_count bigint;
  v_failed_count bigint;
  v_partial_count bigint;
  v_indeterminate_count bigint;
  v_skipped_count bigint;
  v_reverted_count bigint;
begin
  select * into v_run
  from public.decision_workspace_execution_runs r
  where r.id = p_execution_id
    and r.tenant_id = p_tenant_id
  for update;

  if v_run.id is null or v_run.actor_id <> p_actor_id then
    raise exception 'execution run is unavailable';
  end if;

  if v_run.status not in ('claimed', 'executing') or v_run.lease_expires_at > v_now then
    return jsonb_build_object(
      'ok', true,
      'execution_id', v_run.id,
      'status', v_run.status,
      'reconciliation_status', v_run.reconciliation_status,
      'changed', false
    );
  end if;

  update public.decision_workspace_execution_actions a
  set
    status = 'indeterminate',
    reconciliation_status = 'manual_required',
    error_code = coalesce(a.error_code, 'stale_execution_claim'),
    transitions = a.transitions || jsonb_build_array(
      jsonb_build_object(
        'from', a.status,
        'to', 'indeterminate',
        'at', v_now,
        'actor_id', p_actor_id
      )
    ),
    updated_at = v_now,
    finished_at = v_now
  where a.execution_run_id = p_execution_id
    and a.tenant_id = p_tenant_id
    and a.status in ('claimed', 'executing');

  select
    count(*),
    count(*) filter (where status = 'succeeded'),
    count(*) filter (where status = 'failed'),
    count(*) filter (where status = 'partial'),
    count(*) filter (where status = 'indeterminate'),
    count(*) filter (where status = 'skipped'),
    count(*) filter (where status = 'reverted')
  into
    v_action_count,
    v_succeeded_count,
    v_failed_count,
    v_partial_count,
    v_indeterminate_count,
    v_skipped_count,
    v_reverted_count
  from public.decision_workspace_execution_actions a
  where a.execution_run_id = p_execution_id
    and a.tenant_id = p_tenant_id;

  if v_action_count < 1 or v_indeterminate_count > 0 then
    v_next_status := 'indeterminate';
  elsif v_succeeded_count = v_action_count then
    v_next_status := 'succeeded';
  elsif v_reverted_count = v_action_count then
    v_next_status := 'reverted';
  elsif v_succeeded_count > 0 or v_partial_count > 0 then
    v_next_status := 'partial';
  elsif v_failed_count > 0 or v_skipped_count > 0 then
    v_next_status := 'failed';
  else
    v_next_status := 'indeterminate';
  end if;

  update public.decision_workspace_execution_runs r
  set
    status = v_next_status,
    reconciliation_status = case
      when v_next_status = 'indeterminate' then 'manual_required'
      when v_next_status = 'partial' then 'pending'
      else 'not_required'
    end,
    transitions = r.transitions || jsonb_build_array(
      jsonb_build_object(
        'from', r.status,
        'to', v_next_status,
        'at', v_now,
        'actor_id', p_actor_id
      )
    ),
    updated_at = v_now,
    finished_at = v_now
  where r.id = p_execution_id
    and r.tenant_id = p_tenant_id
  returning * into v_run;

  return jsonb_build_object(
    'ok', true,
    'execution_id', v_run.id,
    'status', v_run.status,
    'reconciliation_status', v_run.reconciliation_status,
    'changed', true
  );
end;
$$;

revoke all on function public.claim_decision_workspace_execution(
  uuid, uuid, uuid, uuid, uuid, uuid, text, text, jsonb, jsonb, integer
) from public, anon, authenticated;
grant execute on function public.claim_decision_workspace_execution(
  uuid, uuid, uuid, uuid, uuid, uuid, text, text, jsonb, jsonb, integer
) to service_role;

revoke all on function public.record_decision_workspace_action_receipt(
  uuid, uuid, uuid, integer, text, text, uuid, jsonb, text, text, text
) from public, anon, authenticated;
grant execute on function public.record_decision_workspace_action_receipt(
  uuid, uuid, uuid, integer, text, text, uuid, jsonb, text, text, text
) to service_role;

revoke all on function public.finalize_decision_workspace_execution(
  uuid, uuid, uuid, uuid, jsonb
) from public, anon, authenticated;
grant execute on function public.finalize_decision_workspace_execution(
  uuid, uuid, uuid, uuid, jsonb
) to service_role;

revoke all on function public.resolve_stale_decision_workspace_execution(
  uuid, uuid, uuid
) from public, anon, authenticated;
grant execute on function public.resolve_stale_decision_workspace_execution(
  uuid, uuid, uuid
) to service_role;
