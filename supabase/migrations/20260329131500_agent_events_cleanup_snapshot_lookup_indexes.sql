create index if not exists agent_events_cleanup_snapshot_exact_lookup_idx
  on public.agent_events (
    agent_id,
    ((payload ->> 'analysis_scope')),
    created_at desc
  )
  where event_type = 'runtime_cleanup_discovery_snapshot'
    and (payload ->> 'version') = 'gmail.cleanup_profile_cache.v4';

create index if not exists agent_events_cleanup_snapshot_recent_lookup_idx
  on public.agent_events (
    agent_id,
    created_at desc
  )
  where event_type = 'runtime_cleanup_discovery_snapshot'
    and (payload ->> 'version') = 'gmail.cleanup_profile_cache.v4';
