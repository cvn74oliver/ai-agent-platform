import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(scriptDir, '..')
const envFilePath = path.join(webRoot, '.env.local')

function parseEnvLine(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return null
  const separatorIndex = trimmed.indexOf('=')
  if (separatorIndex <= 0) return null
  const key = trimmed.slice(0, separatorIndex).trim()
  let value = trimmed.slice(separatorIndex + 1).trim()
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1)
  }
  return { key, value }
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const contents = fs.readFileSync(filePath, 'utf8')
  for (const line of contents.split(/\r?\n/)) {
    const parsed = parseEnvLine(line)
    if (!parsed) continue
    if (!(parsed.key in process.env)) {
      process.env[parsed.key] = parsed.value
    }
  }
}

function formatArg(value) {
  if (typeof value === 'string') return value
  if (value instanceof Error) return value.stack || value.message || String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

async function captureLogs(run) {
  const entries = []
  const original = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  }

  const intercept = (level) => (...args) => {
    const text = args.map((value) => formatArg(value)).join(' ')
    entries.push({ level, text })
    original[level](...args)
  }

  console.log = intercept('log')
  console.info = intercept('info')
  console.warn = intercept('warn')
  console.error = intercept('error')

  try {
    const result = await run()
    return { result, entries }
  } finally {
    console.log = original.log
    console.info = original.info
    console.warn = original.warn
    console.error = original.error
  }
}

loadEnvFile(envFilePath)

const TENANT_ID =
  process.env.GMAIL_ACCEPT_TENANT_ID || '085c8ef7-2fd7-4842-8499-cd605e894a77'
const ANALYSIS_SCOPE = process.env.GMAIL_ACCEPT_ANALYSIS_SCOPE || 'all_indexed'
const AGENT_ID =
  process.env.GMAIL_ACCEPT_AGENT_ID || 'd256b48e-5acf-4b3d-af22-003d52e7e582'

const forbiddenMailboxScanLogs = [
  'loadIndexedGmailMessagesForTenant(limit=100000)',
  '[integrations/gmail/mailbox-indexer/indexed-rows]',
]

console.log('=== Gmail Cleanup Group Live Audit ===')
console.log(`Web root: ${webRoot}`)
console.log(`Tenant ID: ${TENANT_ID}`)
console.log(`Analysis scope: ${ANALYSIS_SCOPE}`)
console.log(`Agent ID: ${AGENT_ID}`)

const { getSupabaseAdmin } = await import('../src/lib/supabase.ts')
const {
  loadPublishedGmailMailboxIntelligenceArtifact,
  loadGmailArtifactPublicationState,
  loadGmailSenderScopeRollupsForArtifactVersion,
} = await import('../src/lib/integrations/gmail/gmailArtifactStore.ts')
const { loadGmailSenderWorkspaceForTenant } = await import(
  '../src/lib/integrations/gmail/gmailCleanupWorkspace.ts'
)
const {
  buildCleanupGroupFutureCanonicalPublishIdentity,
  listCleanupCanonicalGroupDescriptors,
  resolveCleanupClusterIdentity,
} = await import('../src/lib/runtime/gmailCleanupClusterIdentity.ts')
const {
  buildGmailCleanupWorkflowClusterPayload,
} = await import('../src/lib/runtime/gmailCleanupWorkspace.ts')
const {
  buildFutureCanonicalCleanupGroupSurfaceIdentity,
} = await import('../src/lib/integrations/gmail/gmailSemanticRollupContract.ts')
const { loadPlaygroundRuntimeState } = await import('../src/lib/runtime/runtimeStateService.ts')

const supabase = await getSupabaseAdmin()

const { data: agentRow, error: agentError } = await supabase
  .from('agents')
  .select('id, user_id')
  .eq('id', AGENT_ID)
  .single()

if (agentError || !agentRow) {
  throw new Error(`Failed to load agent ${AGENT_ID}: ${agentError?.message || 'not found'}`)
}

const publication = await loadGmailArtifactPublicationState({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
})

assert.ok(publication?.published_version, 'Expected a published Gmail artifact version.')
const artifactVersion = publication.published_version

const artifactRead = await loadPublishedGmailMailboxIntelligenceArtifact({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
})

assert.equal(
  artifactRead.publication?.published_version,
  artifactVersion,
  'Published artifact read should align with publication state.'
)

const rollups = await loadGmailSenderScopeRollupsForArtifactVersion({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
  artifactVersion,
})

const totalSenderCount = rollups.length
const assignedSenderCount = rollups.filter(
  (row) => typeof row.assigned_cleanup_group_id === 'string' && row.assigned_cleanup_group_id.trim()
).length
const unassignedSenderCount = totalSenderCount - assignedSenderCount
const assignmentMultiplicity = new Map()
for (const row of rollups) {
  assignmentMultiplicity.set(row.sender_key, (assignmentMultiplicity.get(row.sender_key) || 0) + 1)
}
const multiAssignedSenderCount = Array.from(assignmentMultiplicity.values()).filter(
  (count) => count > 1
).length
const groupCounts = rollups.reduce((accumulator, row) => {
  const groupId = row.assigned_cleanup_group_id || 'UNASSIGNED'
  accumulator[groupId] = (accumulator[groupId] || 0) + 1
  return accumulator
}, {})
const groupCountSum = Object.values(groupCounts).reduce((sum, count) => sum + count, 0)

assert.equal(assignedSenderCount, totalSenderCount, 'All senders must be assigned.')
assert.equal(unassignedSenderCount, 0, 'No sender may remain unassigned.')
assert.equal(multiAssignedSenderCount, 0, 'No sender may be multi-assigned.')
assert.equal(groupCountSum, totalSenderCount, 'Group counts must sum to total senders.')

const artifactClusterIds = artifactRead.cluster_summaries.map((summary) => summary.cluster_id)
const requiredStructuralGroupIds = [
  'protected-trusted-senders',
  'historical-out-of-inbox-senders',
  'needs-review-senders',
]
for (const groupId of requiredStructuralGroupIds) {
  assert.ok(artifactClusterIds.includes(groupId), `Published artifact is missing ${groupId}.`)
}
assert.ok(
  artifactRead.cluster_summaries.length > 5,
  'Published artifact cluster summary count should be greater than 5.'
)

const { result: runtimeResult, entries: runtimeLogs } = await captureLogs(async () =>
  loadPlaygroundRuntimeState({
    supabase,
    agentId: AGENT_ID,
    agentUserId: agentRow.user_id,
    isInboxCleanupIntent: true,
    analysisScope: ANALYSIS_SCOPE,
    requestMode: 'rehydrate_only',
  })
)

for (const fragment of forbiddenMailboxScanLogs) {
  assert.equal(
    runtimeLogs.some((entry) => entry.text.includes(fragment)),
    false,
    `Observed forbidden mailbox scan log during runtime load: ${fragment}`
  )
}

assert.ok(runtimeResult.runtimeState, 'Runtime state load should succeed.')

const runtimeCleanupPlan = runtimeResult.runtimeState.runtimeCleanupPlan || null
const runtimeClusterCount = runtimeCleanupPlan?.clusters.length || 0
const runtimeClusters = runtimeCleanupPlan?.clusters || []
const runtimeClusterId = (cluster) => cluster.clusterId || cluster.cluster_id || null
const runtimeCanonicalClusterId = (cluster) =>
  cluster.canonicalClusterId || cluster.canonical_cluster_id || runtimeClusterId(cluster)
const runtimeLegacyClusterIds = (cluster) =>
  Array.isArray(cluster.legacyClusterIds)
    ? cluster.legacyClusterIds
    : Array.isArray(cluster.legacy_cluster_ids)
      ? cluster.legacy_cluster_ids
      : []
const runtimeSourceClusterIds = (cluster) =>
  Array.isArray(cluster.sourceClusterIds)
    ? cluster.sourceClusterIds
    : Array.isArray(cluster.source_cluster_ids)
      ? cluster.source_cluster_ids
      : []
const runtimeClusterIds = runtimeClusters.map(runtimeClusterId).filter(Boolean)
const runtimeSources = runtimeClusters
  .map((cluster) => {
    const clusterId = runtimeClusterId(cluster)
    if (!clusterId) return null
    return {
      clusterId,
      canonicalClusterId: runtimeCanonicalClusterId(cluster),
      legacyClusterIds: runtimeLegacyClusterIds(cluster),
      sourceClusterIds: runtimeSourceClusterIds(cluster),
    }
  })
  .filter(Boolean)

const canonicalDescriptors = listCleanupCanonicalGroupDescriptors()
  .slice()
  .sort((left, right) => left.displayPriority - right.displayPriority)
const expectedSurfacedRuntimeClusterIds = canonicalDescriptors
  .filter((descriptor) => descriptor.surfacedStatus === 'surfaced')
  .map((descriptor) => descriptor.canonicalClusterId)
const runtimeSurfacedClusterIds = runtimeClusters
  .filter((cluster) => {
    const descriptor = resolveCleanupClusterIdentity(runtimeClusterId(cluster), runtimeSources).canonicalDescriptor
    return descriptor?.surfacedStatus === 'surfaced'
  })
  .map((cluster) => runtimeClusterId(cluster))
  .filter(Boolean)
  .sort((left, right) => {
    const leftDescriptor = resolveCleanupClusterIdentity(left, runtimeSources).canonicalDescriptor
    const rightDescriptor = resolveCleanupClusterIdentity(right, runtimeSources).canonicalDescriptor
    const leftPriority = leftDescriptor?.displayPriority ?? Number.MAX_SAFE_INTEGER
    const rightPriority = rightDescriptor?.displayPriority ?? Number.MAX_SAFE_INTEGER
    if (leftPriority !== rightPriority) return leftPriority - rightPriority
    return left.localeCompare(right)
  })

assert.ok(runtimeClusterCount > 5, 'Runtime cleanup cluster count should be greater than 5.')

assert.deepEqual(
  runtimeSurfacedClusterIds,
  expectedSurfacedRuntimeClusterIds,
  'Runtime surfaced cleanup groups must match the canonical surfaced group set.'
)

const requiredLegacyCompatibilityMappings = [
  {
    input: 'protected-trusted-senders',
    expectedCanonicalClusterId: 'structural.protected_trust',
  },
  {
    input: 'needs-review-senders',
    expectedCanonicalClusterId: 'structural.unresolved',
  },
  {
    input: 'historical-out-of-inbox-senders',
    expectedCanonicalClusterId: 'context.historical',
  },
  {
    input: 'subscription-senders',
    expectedCanonicalClusterId: 'semantic.marketing_subscriptions',
  },
  {
    input: 'semantic-parent:subscription-senders:family:marketing_promotional',
    expectedCanonicalClusterId: 'semantic.marketing_subscriptions',
  },
]

for (const expectation of requiredLegacyCompatibilityMappings) {
  const identity = resolveCleanupClusterIdentity(expectation.input, runtimeSources)
  assert.equal(
    identity.canonicalDescriptor?.canonicalClusterId,
    expectation.expectedCanonicalClusterId,
    `Legacy compatibility resolution failed for ${expectation.input}.`
  )
}

const canonicalMappingProofs = canonicalDescriptors.map((descriptor) => {
  const identity = resolveCleanupClusterIdentity(descriptor.canonicalClusterId, runtimeSources)
  assert.equal(
    identity.descriptorResolution,
    'canonical',
    `Canonical resolution should remain canonical for ${descriptor.canonicalClusterId}.`
  )
  assert.equal(
    identity.canonicalDescriptor?.canonicalClusterId,
    descriptor.canonicalClusterId,
    `Canonical descriptor lookup drifted for ${descriptor.canonicalClusterId}.`
  )
  return {
    canonical_cluster_id: descriptor.canonicalClusterId,
    resolution: identity.descriptorResolution,
  }
})

const aliasResolutionProofs = canonicalDescriptors.flatMap((descriptor) =>
  descriptor.aliases.map((alias) => {
    const identity = resolveCleanupClusterIdentity(alias.clusterId, runtimeSources)
    const expectedResolution =
      alias.kind === 'transitional_surface' ? 'transitional_alias' : 'legacy_alias'
    assert.equal(
      identity.descriptorResolution,
      expectedResolution,
      `Alias resolution drifted for ${alias.clusterId}.`
    )
    assert.equal(
      identity.canonicalDescriptor?.canonicalClusterId,
      descriptor.canonicalClusterId,
      `Alias canonical mapping drifted for ${alias.clusterId}.`
    )
    return {
      input: alias.clusterId,
      alias_kind: alias.kind,
      descriptor_resolution: identity.descriptorResolution,
      canonical_cluster_id: identity.canonicalDescriptor?.canonicalClusterId || null,
    }
  })
)

const subscriptionRuntimeCluster = runtimeClusters.find(
  (cluster) => runtimeClusterId(cluster) === 'semantic.marketing_subscriptions'
)
const subscriptionRuntimeClusterRef = subscriptionRuntimeCluster
  ? {
      clusterId: runtimeClusterId(subscriptionRuntimeCluster),
      canonicalClusterId: runtimeCanonicalClusterId(subscriptionRuntimeCluster),
      legacyClusterIds: runtimeLegacyClusterIds(subscriptionRuntimeCluster),
      sourceClusterIds: runtimeSourceClusterIds(subscriptionRuntimeCluster),
      clusterType:
        subscriptionRuntimeCluster.clusterType || subscriptionRuntimeCluster.cluster_type || '',
      title: subscriptionRuntimeCluster.title || '',
      query: subscriptionRuntimeCluster.query || '',
    }
  : null

assert.ok(
  subscriptionRuntimeCluster,
  'Runtime cleanup plan must include the canonical subscription action lane.'
)

const workflowPayloadCompatibilityProbes = [
  {
    input: 'subscription-senders',
    payload: subscriptionRuntimeClusterRef
      ? buildGmailCleanupWorkflowClusterPayload({
          cluster: subscriptionRuntimeClusterRef,
          requestedClusterId: 'subscription-senders',
          reviewUnitKey: 'offer_campaign',
        })
      : null,
  },
  {
    input: 'semantic.marketing_subscriptions',
    payload: subscriptionRuntimeClusterRef
      ? buildGmailCleanupWorkflowClusterPayload({
          cluster: subscriptionRuntimeClusterRef,
          requestedClusterId: 'semantic.marketing_subscriptions',
          reviewUnitKey: 'offer_campaign',
        })
      : null,
  },
  {
    input: 'semantic-parent:subscription-senders:family:marketing_promotional',
    payload: subscriptionRuntimeClusterRef
      ? buildGmailCleanupWorkflowClusterPayload({
          cluster: subscriptionRuntimeClusterRef,
          requestedClusterId: 'semantic-parent:subscription-senders:family:marketing_promotional',
          reviewUnitKey: 'offer_campaign',
        })
      : null,
  },
]

for (const probe of workflowPayloadCompatibilityProbes) {
  assert.ok(probe.payload, `Workflow payload probe failed for ${probe.input}.`)
  assert.equal(
    probe.payload.clusterId,
    'semantic.marketing_subscriptions',
    `Workflow payload canonical cluster id drifted for ${probe.input}.`
  )
  assert.equal(
    probe.payload.canonicalClusterId,
    'semantic.marketing_subscriptions',
    `Workflow payload canonical field drifted for ${probe.input}.`
  )
  assert.equal(
    probe.payload.reviewUnitKey,
    'offer_campaign',
    `Workflow payload review-unit key drifted for ${probe.input}.`
  )
}

const futureCanonicalPublishIdentityProofs = canonicalDescriptors.map((descriptor) => {
  const runtimeIdentity = buildCleanupGroupFutureCanonicalPublishIdentity(
    descriptor.canonicalClusterId
  )
  const artifactIdentity = buildFutureCanonicalCleanupGroupSurfaceIdentity(
    descriptor.canonicalClusterId
  )
  assert.ok(runtimeIdentity, `Missing future canonical publish identity for ${descriptor.canonicalClusterId}.`)
  assert.equal(
    runtimeIdentity.canonicalClusterId,
    descriptor.canonicalClusterId,
    `Future canonical publish mapping drifted for ${descriptor.canonicalClusterId}.`
  )
  assert.equal(
    artifactIdentity.canonical_cluster_id,
    descriptor.canonicalClusterId,
    `Future artifact surface canonical id drifted for ${descriptor.canonicalClusterId}.`
  )
  return {
    canonical_cluster_id: descriptor.canonicalClusterId,
    legacy_cluster_ids: runtimeIdentity.legacyClusterIds,
    source_cluster_ids: runtimeIdentity.sourceClusterIds,
  }
})

function extractSenderIdentity(sender) {
  return sender?.sender_key || sender?.sender || sender?.email || null
}

async function loadSenderWorkspaceProbe(requestedClusterId) {
  const result = await loadGmailSenderWorkspaceForTenant({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    requestAgentId: AGENT_ID,
    clusters: runtimeClusters,
    selectedCluster: {
      ...subscriptionRuntimeCluster,
      cluster_id: requestedClusterId,
    },
    page: 1,
    pageSize: 25,
    includeClusterSenderKeys: false,
  })

  assert.ok(result.ok, `Sender workspace probe failed for ${requestedClusterId}.`)
  return {
    requestedClusterId,
    selectedClusterId: result.data.selected_cluster?.cluster_id || null,
    canonicalClusterId: result.data.selected_cluster?.canonical_cluster_id || null,
    totalSenders: result.data.pagination?.total_senders || null,
    clusterTotalSenders: result.data.pagination?.cluster_total_senders || null,
    firstSenders: Array.isArray(result.data.senders)
      ? result.data.senders.map(extractSenderIdentity).slice(0, 10)
      : [],
  }
}

const subscriptionCompatibilityProbes = await Promise.all([
  loadSenderWorkspaceProbe('subscription-senders'),
  loadSenderWorkspaceProbe('semantic.marketing_subscriptions'),
  loadSenderWorkspaceProbe('semantic-parent:subscription-senders:family:marketing_promotional'),
])

assert.equal(
  new Set(subscriptionCompatibilityProbes.map((probe) => probe.selectedClusterId)).size,
  1,
  'Legacy and canonical subscription routes must normalize to the same selected cluster id.'
)
assert.equal(
  new Set(subscriptionCompatibilityProbes.map((probe) => probe.totalSenders)).size,
  1,
  'Legacy and canonical subscription routes must return the same sender totals.'
)
assert.equal(
  new Set(subscriptionCompatibilityProbes.map((probe) => probe.clusterTotalSenders)).size,
  1,
  'Legacy and canonical subscription routes must return the same cluster totals.'
)
assert.equal(
  new Set(subscriptionCompatibilityProbes.map((probe) => JSON.stringify(probe.firstSenders))).size,
  1,
  'Legacy and canonical subscription routes must return the same first-page sender subset.'
)

const proof = {
  ok: true,
  generated_at: new Date().toISOString(),
  tenant_id: TENANT_ID,
  analysis_scope: ANALYSIS_SCOPE,
  artifact_version: artifactVersion,
  publication: {
    published_version: publication.published_version,
    build_status: publication.build_status,
    freshness_state: publication.freshness_state,
    freshness_reason: publication.freshness_reason,
    published_at: publication.published_at,
  },
  coverage_counts: {
    total_sender_count: totalSenderCount,
    assigned_sender_count: assignedSenderCount,
    unassigned_sender_count: unassignedSenderCount,
    multi_assigned_sender_count: multiAssignedSenderCount,
    group_count_sum: groupCountSum,
  },
  artifact_cluster_summary_count: artifactRead.cluster_summaries.length,
  artifact_cluster_ids: artifactClusterIds,
  group_counts: groupCounts,
  runtime: {
    cleanup_cluster_count: runtimeClusterCount,
    cleanup_cluster_ids: runtimeClusterIds,
    surfaced_cleanup_cluster_ids: runtimeSurfacedClusterIds,
    expected_surfaced_cleanup_cluster_ids: expectedSurfacedRuntimeClusterIds,
    mailbox_profile_source: runtimeResult.runtimeState.runtimeMailboxProfile?.source || null,
    mailbox_profile_status: runtimeResult.runtimeState.runtimeMailboxProfile?.status || null,
  },
  compatibility: {
    canonical_mapping_probes: canonicalMappingProofs,
    alias_resolution_probes: aliasResolutionProofs,
    required_legacy_mappings: requiredLegacyCompatibilityMappings.map((expectation) => ({
      input: expectation.input,
      canonical_cluster_id: resolveCleanupClusterIdentity(expectation.input, runtimeSources)
        .canonicalDescriptor?.canonicalClusterId,
    })),
    workflow_payload_probes: workflowPayloadCompatibilityProbes.map((probe) => ({
      input: probe.input,
      cluster_id: probe.payload?.clusterId || null,
      canonical_cluster_id: probe.payload?.canonicalClusterId || null,
      review_unit_key: probe.payload?.reviewUnitKey || null,
      legacy_cluster_ids: probe.payload?.legacyClusterIds || [],
      source_cluster_ids: probe.payload?.sourceClusterIds || [],
    })),
    subscription_sender_workspace_probes: subscriptionCompatibilityProbes,
  },
  future_canonical_publish_preparation: {
    surface_identity_probes: futureCanonicalPublishIdentityProofs,
  },
  artifact_backed_request_behavior_preserved: {
    runtime_load_ok: Boolean(runtimeResult.runtimeState),
    forbidden_mailbox_scan_logs_observed: false,
  },
}

console.log(JSON.stringify(proof, null, 2))
