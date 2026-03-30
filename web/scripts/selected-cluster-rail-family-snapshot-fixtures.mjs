import assert from 'node:assert/strict'

import { buildSelectedClusterRailFamily } from '../src/lib/integrations/gmail/gmailArtifactStore.ts'

const preferredClusterId = 'subscription-senders'

function publication(scope, publishedVersion = null) {
  return {
    tenant_id: 'tenant-1',
    analysis_scope: scope,
    published_version: publishedVersion,
    published_at: null,
    building_version: null,
    build_status: publishedVersion ? 'published' : 'idle',
    last_error: null,
    last_error_at: null,
    last_index_state_updated_at: null,
    last_indexed_message_count: null,
    freshness_state: 'fresh',
    freshness_reason: null,
    refresh_strategy: null,
    refresh_requested_at: null,
    refresh_started_at: null,
    refresh_completed_at: null,
    refresh_job_id: null,
    refresh_sync_run_id: null,
    created_at: '2026-03-28T00:00:00.000Z',
    updated_at: '2026-03-28T00:00:00.000Z',
  }
}

function summary(scope, clusterId, artifactVersion) {
  return {
    tenant_id: 'tenant-1',
    analysis_scope: scope,
    cluster_id: clusterId,
    artifact_version: artifactVersion,
    cluster_type: 'newsletters',
    title: clusterId === preferredClusterId ? 'Subscription senders' : 'Other cluster',
    query: 'query',
    why_selected: null,
    risk_note: null,
    safety_note: null,
    message_count: 42,
    sender_count: 9,
    share_pct: 12,
    dominant_sender: clusterId === preferredClusterId ? 'digest@example.com' : 'other@example.com',
    dominant_pattern: null,
    protected_message_count: 0,
    uncertain_sender_count: 0,
    summary_payload: {},
    created_at: '2026-03-28T00:00:00.000Z',
    updated_at: '2026-03-28T00:00:00.000Z',
  }
}

function header(scope, artifactVersion) {
  return {
    tenant_id: 'tenant-1',
    analysis_scope: scope,
    cluster_id: preferredClusterId,
    artifact_version: artifactVersion,
    cluster_type: 'newsletters',
    title: 'Subscription senders',
    query: 'query',
    why_selected: null,
    risk_note: null,
    safety_note: null,
    message_count: 84,
    sender_count: 12,
    share_pct: 20,
    pagination: {},
    analytics: {
      sender_activity_timeline_granularity: 'week',
      sender_activity_timeline: [{ label: '2026-03-01', sender_count: 5 }],
      semantic_resolution_distribution: [
        { scope: 'family', resolution: 'clear', sender_count: 4, share_pct: 80 },
      ],
    },
    created_at: '2026-03-28T00:00:00.000Z',
    updated_at: '2026-03-28T00:00:00.000Z',
  }
}

function snapshotReady(visibleClusterCount = 5, messageCount = 27) {
  return {
    cluster_present: true,
    cluster_title: 'Subscription senders',
    visible_cluster_count: visibleClusterCount,
    message_count: messageCount,
    dominant_sender: 'digest@example.com',
    semantic_resolution_distribution: [
      { scope: 'family', resolution: 'mixed', sender_count: 3, share_pct: 60 },
    ],
    timeline: {
      granularity: 'week',
      items: [{ label: '2026-03-08', count: 3 }],
    },
  }
}

function snapshotOutside(visibleClusterCount = 4) {
  return {
    cluster_present: false,
    cluster_title: null,
    visible_cluster_count: visibleClusterCount,
    message_count: null,
    dominant_sender: null,
    semantic_resolution_distribution: [],
    timeline: null,
  }
}

function findScope(result, scope) {
  return result.family.scopes.find((entry) => entry.scope === scope)
}

const result = buildSelectedClusterRailFamily({
  preferredClusterId,
  clusterTitle: 'Subscription senders',
  publications: [
    publication('30d', 'artifact-30d'),
    publication('60d', 'artifact-60d'),
    publication('90d', 'artifact-90d'),
  ],
  clusterSummaries: [
    summary('30d', preferredClusterId, 'artifact-30d'),
    summary('60d', 'other-cluster', 'artifact-60d'),
    summary('90d', preferredClusterId, 'artifact-90d'),
  ],
  seedHeaders: [header('30d', 'artifact-30d')],
  snapshotFallbackByScope: {
    '7d': snapshotReady(2, 9),
    '90d': snapshotReady(6, 31),
    '180d': snapshotOutside(3),
  },
})

assert.equal(findScope(result, '30d')?.state, 'ready')
assert.equal(findScope(result, '30d')?.artifact_version, 'artifact-30d')
assert.equal(
  result.scope_resolution.find((entry) => entry.scope === '30d')?.source,
  'artifact_ready'
)

assert.equal(findScope(result, '60d')?.state, 'outside_timeframe')
assert.equal(findScope(result, '60d')?.artifact_version, 'artifact-60d')
assert.equal(
  result.scope_resolution.find((entry) => entry.scope === '60d')?.source,
  'artifact_outside_timeframe'
)

assert.equal(findScope(result, '90d')?.state, 'ready')
assert.equal(findScope(result, '90d')?.artifact_version, null)
assert.equal(findScope(result, '90d')?.signal?.message_count, 31)
assert.equal(
  result.scope_resolution.find((entry) => entry.scope === '90d')?.source,
  'snapshot_ready'
)

assert.equal(findScope(result, '180d')?.state, 'outside_timeframe')
assert.equal(findScope(result, '180d')?.artifact_version, null)
assert.equal(
  result.scope_resolution.find((entry) => entry.scope === '180d')?.source,
  'snapshot_outside_timeframe'
)

assert.equal(findScope(result, '7d')?.state, 'ready')
assert.equal(findScope(result, '365d')?.state, 'unavailable_scope')

console.log(
  JSON.stringify(
    {
      ok: true,
      checked_scopes: ['7d', '30d', '60d', '90d', '180d', '365d'],
      scope_resolution: result.scope_resolution,
    },
    null,
    2
  )
)
