import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const AGENT_ID = process.env.AGENT_ID || 'd256b48e-5acf-4b3d-af22-003d52e7e582'
const CLUSTER_ID = process.env.CLUSTER_ID || 'subscription-senders'
const ANALYSIS_SCOPE = process.env.ANALYSIS_SCOPE || '30d'
const DATA_DIR = process.env.RAIL_PROBE_DATA_DIR || null

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(scriptDir, '..', '.env.local')

if (existsSync(envPath)) {
  for (const rawLine of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const separatorIndex = line.indexOf('=')
    if (separatorIndex <= 0) continue
    const key = line.slice(0, separatorIndex).trim()
    if (!key || process.env[key]) continue
    let value = line.slice(separatorIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

const [{ GMAIL_ARTIFACT_ANALYSIS_SCOPE_OPTIONS, buildSelectedClusterRailFamily }] = await Promise.all(
  [import('../src/lib/integrations/gmail/gmailArtifactStore.ts')]
)

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeNullableText(value) {
  const normalized = normalizeText(value)
  return normalized ? normalized : null
}

function normalizeInteger(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value))
  }
  return fallback
}

function parseSnapshotPayload(value) {
  const payload = (() => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return null
      }
    }
    return value
  })()
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  if (normalizeText(payload.version) !== 'gmail.cleanup_profile_cache.v4') return null

  const generatedAt = normalizeText(payload.generated_at)
  const expiresAt = normalizeText(payload.expires_at)
  const cleanupDiscovery = payload.cleanup_discovery
  const analysisScope = normalizeText(payload.analysis_scope) || '30d'

  if (
    !generatedAt ||
    !expiresAt ||
    !cleanupDiscovery ||
    typeof cleanupDiscovery !== 'object' ||
    Array.isArray(cleanupDiscovery)
  ) {
    return null
  }

  return {
    generatedAt,
    expiresAt,
    analysisScope,
    cleanupDiscovery,
  }
}

function buildSnapshotFallback(snapshot, preferredClusterId) {
  if (!snapshot) return null

  const clusters = Array.isArray(snapshot.cleanupDiscovery.clusters)
    ? snapshot.cleanupDiscovery.clusters
    : []
  const selectedCluster =
    clusters.find((cluster) => normalizeText(cluster?.cluster_id) === preferredClusterId) || null
  const senderOverviewSnapshot =
    snapshot.cleanupDiscovery.sender_overview_snapshot &&
    typeof snapshot.cleanupDiscovery.sender_overview_snapshot === 'object' &&
    !Array.isArray(snapshot.cleanupDiscovery.sender_overview_snapshot)
      ? snapshot.cleanupDiscovery.sender_overview_snapshot
      : null
  const selectedWorkspace =
    senderOverviewSnapshot && typeof senderOverviewSnapshot === 'object'
      ? senderOverviewSnapshot[preferredClusterId] || null
      : null
  const clusterContribution = Array.isArray(selectedWorkspace?.analytics?.cluster_contribution)
    ? selectedWorkspace.analytics.cluster_contribution
    : []
  const dominantSender =
    clusterContribution.find((entry) => normalizeText(entry?.sender))?.sender || null
  const rawMessageCount =
    selectedWorkspace?.selected_cluster?.message_count ??
    selectedCluster?.message_count ??
    selectedCluster?.estimated_count ??
    null
  const timelineItems = Array.isArray(selectedWorkspace?.analytics?.sender_activity_timeline)
    ? selectedWorkspace.analytics.sender_activity_timeline
        .map((entry) => {
          const label = normalizeText(entry?.label)
          if (!label) return null
          return {
            label,
            count: normalizeInteger(entry?.sender_count),
          }
        })
        .filter(Boolean)
    : []
  const semanticResolutionDistribution = Array.isArray(
    selectedWorkspace?.analytics?.semantic_resolution_distribution
  )
    ? selectedWorkspace.analytics.semantic_resolution_distribution
        .map((entry) => {
          const scope =
            entry?.scope === 'pattern'
              ? 'pattern'
              : entry?.scope === 'family'
                ? 'family'
                : null
          const resolution =
            entry?.resolution === 'clear' ||
            entry?.resolution === 'mixed' ||
            entry?.resolution === 'thin_history'
              ? entry.resolution
              : null
          if (!scope || !resolution) return null
          return {
            scope,
            resolution,
            sender_count: normalizeInteger(entry?.sender_count),
            share_pct:
              typeof entry?.share_pct === 'number' && Number.isFinite(entry.share_pct)
                ? entry.share_pct
                : 0,
          }
        })
        .filter(Boolean)
    : []

  return {
    cluster_present: Boolean(selectedCluster || selectedWorkspace),
    cluster_title:
      normalizeNullableText(selectedWorkspace?.selected_cluster?.title) ||
      normalizeNullableText(selectedCluster?.title) ||
      null,
    visible_cluster_count: clusters.length,
    message_count:
      typeof rawMessageCount === 'number' && Number.isFinite(rawMessageCount)
        ? Math.max(0, Math.round(rawMessageCount))
        : null,
    dominant_sender: normalizeNullableText(dominantSender),
    semantic_resolution_distribution: semanticResolutionDistribution,
    timeline:
      timelineItems.length > 0
        ? {
            granularity:
              selectedWorkspace?.analytics?.sender_activity_timeline_granularity === 'week'
                ? 'week'
                : 'month',
            items: timelineItems,
          }
        : null,
  }
}

async function restSelect(pathname) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('supabase_env_missing')
  }
  const url = new URL(`/rest/v1/${pathname}`, SUPABASE_URL)
  console.error(`[probe] GET ${url.pathname}${url.search}`)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Accept: 'application/json',
    },
    signal: controller.signal,
  })
  clearTimeout(timeout)
  const text = await response.text()
  const json = text ? JSON.parse(text) : null
  if (!response.ok) {
    throw new Error(
      typeof json?.message === 'string'
        ? json.message
        : `rest_select_failed:${response.status}`
    )
  }
  return json
}

function readDataFile(fileName) {
  if (!DATA_DIR) return null
  const filePath = path.resolve(DATA_DIR, fileName)
  if (!existsSync(filePath)) return null
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

const agents =
  readDataFile('agents.json') ||
  (await restSelect(`agents?select=id,user_id&id=eq.${encodeURIComponent(AGENT_ID)}`))
console.error('[probe] agent lookup complete')
const agentUserId = normalizeText(agents?.[0]?.user_id)
if (!agentUserId) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'agent_lookup_failed',
      },
      null,
      2
    )
  )
  process.exit(1)
}

const profiles =
  readDataFile('profiles.json') ||
  (await restSelect(`profiles?select=tenant_id&id=eq.${encodeURIComponent(agentUserId)}`))
console.error('[probe] profile lookup complete')
const tenantId = normalizeText(profiles?.[0]?.tenant_id)
if (!tenantId) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'tenant_lookup_failed',
      },
      null,
      2
    )
  )
  process.exit(1)
}

const [snapshotRows, publications, clusterSummaries, seedHeaders] = await Promise.all([
  readDataFile('agent_events.json') ||
    restSelect(
      `agent_events?select=payload,created_at&agent_id=eq.${encodeURIComponent(
        AGENT_ID
      )}&event_type=eq.runtime_cleanup_discovery_snapshot&order=created_at.desc&limit=200`
    ),
  readDataFile('gmail_artifact_publications.json') ||
    restSelect(
      `gmail_artifact_publications?select=*&tenant_id=eq.${encodeURIComponent(
        tenantId
      )}&order=analysis_scope.asc`
    ),
  readDataFile('gmail_cluster_summaries.json') ||
    restSelect(
      `gmail_cluster_summaries?select=*&tenant_id=eq.${encodeURIComponent(tenantId)}`
    ),
  readDataFile('gmail_sender_workspace_seed_headers.json') ||
    restSelect(
      `gmail_sender_workspace_seed_headers?select=*&tenant_id=eq.${encodeURIComponent(
        tenantId
      )}&cluster_id=eq.${encodeURIComponent(CLUSTER_ID)}`
    ),
])
console.error('[probe] dataset fetch complete', {
  snapshots: Array.isArray(snapshotRows) ? snapshotRows.length : null,
  publications: Array.isArray(publications) ? publications.length : null,
  clusterSummaries: Array.isArray(clusterSummaries) ? clusterSummaries.length : null,
  seedHeaders: Array.isArray(seedHeaders) ? seedHeaders.length : null,
})

const latestSnapshotByScope = new Map()
for (const row of snapshotRows || []) {
  const parsed = parseSnapshotPayload(row.payload)
  if (!parsed) continue
  if (!GMAIL_ARTIFACT_ANALYSIS_SCOPE_OPTIONS.includes(parsed.analysisScope)) continue
  if (latestSnapshotByScope.has(parsed.analysisScope)) continue
  latestSnapshotByScope.set(parsed.analysisScope, parsed)
}

const snapshotFallbackByScope = Object.fromEntries(
  [...latestSnapshotByScope.entries()].map(([scope, snapshot]) => [
    scope,
    buildSnapshotFallback(snapshot, CLUSTER_ID),
  ])
)

const result = buildSelectedClusterRailFamily({
  preferredClusterId: CLUSTER_ID,
  publications,
  clusterSummaries,
  seedHeaders,
  snapshotFallbackByScope,
})
console.error('[probe] rail family build complete')

const runtimeField = result.family || null

console.log(
  JSON.stringify(
    {
      ok: true,
      agentId: AGENT_ID,
      clusterId: CLUSTER_ID,
      analysisScope: ANALYSIS_SCOPE,
      runtimeField,
      selectedScopes: runtimeField?.scopes.filter(
        (entry) => entry.scope === '30d' || entry.scope === '60d'
      ),
      scopeResolution: result.scope_resolution.filter(
        (entry) => entry.scope === '30d' || entry.scope === '60d'
      ),
      snapshotScopesAvailable: [...latestSnapshotByScope.keys()],
    },
    null,
    2
  )
)
