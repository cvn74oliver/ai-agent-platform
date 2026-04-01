import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(scriptDir, '..')
const repoRoot = path.resolve(webRoot, '..')
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

loadEnvFile(envFilePath)

const TENANT_ID =
  process.env.GMAIL_ACCEPT_TENANT_ID || '085c8ef7-2fd7-4842-8499-cd605e894a77'
const ANALYSIS_SCOPE = process.env.GMAIL_ACCEPT_ANALYSIS_SCOPE || 'all_indexed'
const AGENT_ID =
  process.env.GMAIL_ACCEPT_AGENT_ID || 'd256b48e-5acf-4b3d-af22-003d52e7e582'
const PROOF_OUTPUT = process.env.PROOF_OUTPUT
  ? path.resolve(process.cwd(), process.env.PROOF_OUTPUT)
  : null

if (ANALYSIS_SCOPE !== 'all_indexed') {
  console.error(
    `This acceptance harness is locked to analysis_scope=all_indexed. Received ${ANALYSIS_SCOPE}.`
  )
  process.exit(1)
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

function logsInclude(entries, fragment) {
  return entries.some((entry) => entry.text.includes(fragment))
}

function assertRequiredLogs(entries, required, label) {
  for (const fragment of required) {
    assert.equal(
      logsInclude(entries, fragment),
      true,
      `${label}: missing required log fragment: ${fragment}`
    )
  }
}

function assertForbiddenLogs(entries, forbidden, label) {
  for (const fragment of forbidden) {
    assert.equal(
      logsInclude(entries, fragment),
      false,
      `${label}: observed forbidden log fragment: ${fragment}`
    )
  }
}

async function runScenario(name, params) {
  const startedAt = Date.now()
  const { result, entries } = await captureLogs(params.run)
  assertRequiredLogs(entries, params.requiredLogs, name)
  assertForbiddenLogs(entries, params.forbiddenLogs, name)
  if (params.assertResult) {
    await params.assertResult(result, entries)
  }
  return {
    name,
    ok: true,
    duration_ms: Math.max(0, Date.now() - startedAt),
    required_logs: params.requiredLogs,
    forbidden_logs: params.forbiddenLogs,
    observed_logs: entries.map((entry) => entry.text),
    summary: params.summarizeResult ? params.summarizeResult(result) : null,
  }
}

function normalizeClusterInput(summary) {
  return {
    cluster_id: summary.cluster_id,
    cluster_type: summary.cluster_type,
    title: summary.title,
    query: summary.query,
    estimated_count: summary.message_count,
    why_selected: summary.why_selected,
    risk_note: summary.risk_note,
    safety_note: summary.safety_note,
  }
}

function mkdirpForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function uniqueOrdered(values) {
  const seen = new Set()
  const ordered = []
  for (const value of values) {
    if (!value || seen.has(value)) continue
    seen.add(value)
    ordered.push(value)
  }
  return ordered
}

function summarizeRuntimeState(result) {
  return {
    cleanup_cluster_count: result.runtimeState.runtimeCleanupPlan?.clusters.length ?? 0,
    cleanup_profile_status: result.runtimeState.runtimeMailboxProfile?.status ?? null,
    manual_cleanup_regeneration_diagnostics: result.manualCleanupRegenerationDiagnostics,
  }
}

console.log('=== Gmail Workspace Data Access Stabilization Acceptance ===')
console.log(`Repo root: ${repoRoot}`)
console.log(`Web root: ${webRoot}`)
console.log(`Tenant ID: ${TENANT_ID}`)
console.log(`Analysis scope: ${ANALYSIS_SCOPE}`)
console.log(`Agent ID: ${AGENT_ID}`)
console.log(`Proof output: ${PROOF_OUTPUT || '(stdout only)'}`)

const { getSupabaseAdmin } = await import('../src/lib/supabase.ts')
const { getGmailArtifactFlagSnapshot } = await import(
  '../src/lib/integrations/gmail/gmailArtifactFlags.ts'
)
const {
  loadPublishedGmailMailboxIntelligenceArtifact,
  loadPublishedGmailSenderWorkspaceArtifact,
  loadPublishedGmailSenderWorkspaceExecutionArtifact,
} = await import('../src/lib/integrations/gmail/gmailArtifactStore.ts')
const {
  loadGmailMailboxIntelligenceForTenant,
  loadGmailSenderWorkspaceForTenant,
  loadGmailConfirmationPreviewForTenant,
  resolveGmailSenderPolicyArchiveScopeForTenant,
} = await import('../src/lib/integrations/gmail/gmailCleanupWorkspace.ts')
const { loadGmailCleanupGroupIntelligenceForTenant } = await import(
  '../src/lib/integrations/gmail/inboxAnalysis.ts'
)
const { loadPlaygroundRuntimeState } = await import('../src/lib/runtime/runtimeStateService.ts')

const supabase = await getSupabaseAdmin()
const flagSnapshot = getGmailArtifactFlagSnapshot()

assert.equal(
  flagSnapshot.runtime_background_refresh,
  false,
  'runtime_background_refresh must remain disabled by default in Pass F acceptance'
)

const { data: agentRow, error: agentError } = await supabase
  .from('agents')
  .select('id, user_id')
  .eq('id', AGENT_ID)
  .single()

if (agentError || !agentRow) {
  throw new Error(`Failed to load agent ${AGENT_ID}: ${agentError?.message || 'not found'}`)
}

const artifactRead = await loadPublishedGmailMailboxIntelligenceArtifact({
  supabase,
  tenantId: TENANT_ID,
  analysisScope: ANALYSIS_SCOPE,
})

assert.ok(
  artifactRead.publication?.published_version,
  'Expected a published Gmail artifact version before running acceptance'
)
assert.ok(
  artifactRead.cluster_summaries.length > 0,
  'Expected published gmail_cluster_summaries before running acceptance'
)

const clusters = artifactRead.cluster_summaries.map(normalizeClusterInput)
const preferredClusterIds = [
  'semantic.marketing_subscriptions',
  'subscription-senders',
  'structural.backlog',
  'dormant-backlog-senders',
  'secondary.account_updates',
  'structural.protected_trust',
  'social-platform-senders',
]

let selectedCluster = null
let selectedClusterArtifact = null
let selectedSenderSeedRow = null
let historicalSelectedCluster = null
let historicalSelectedSenderSeedRow = null

async function loadPreviewSeedCandidates(cluster) {
  const senderArtifact = await loadPublishedGmailSenderWorkspaceArtifact({
    supabase,
    tenantId: TENANT_ID,
    analysisScope: ANALYSIS_SCOPE,
    selectedClusterId: cluster.cluster_id,
  })
  const candidateSeedRows = senderArtifact.seed_rows.filter(
    (row) =>
      row.preview_ready &&
      Array.isArray(row.preview_message_ids) &&
      row.preview_message_ids.length > 0 &&
      row.cleanup_group_message_count > 0
  )

  let archiveableSeedRow = null
  let nonArchiveableSeedRow = null

  for (const candidate of candidateSeedRows.slice(0, 25)) {
    const executionArtifact = await loadPublishedGmailSenderWorkspaceExecutionArtifact({
      supabase,
      tenantId: TENANT_ID,
      analysisScope: ANALYSIS_SCOPE,
      selectedClusterId: cluster.cluster_id,
      previewSenderKeys: [candidate.sender_key],
    })
    if (executionArtifact.preview_index_rows.length !== candidate.cleanup_group_message_count) {
      continue
    }

    const inboxPreviewRowCount = executionArtifact.preview_index_rows.filter(
      (row) => row.is_in_inbox === true
    ).length

    if (!archiveableSeedRow && inboxPreviewRowCount > 0) {
      archiveableSeedRow = candidate
    }
    if (!nonArchiveableSeedRow && inboxPreviewRowCount === 0) {
      nonArchiveableSeedRow = candidate
    }
    if (archiveableSeedRow && nonArchiveableSeedRow) {
      break
    }
  }

  return {
    senderArtifact,
    archiveableSeedRow,
    nonArchiveableSeedRow,
  }
}

for (const clusterId of uniqueOrdered([
  ...preferredClusterIds,
  ...clusters.map((cluster) => cluster.cluster_id),
])) {
  const cluster = clusters.find((entry) => entry.cluster_id === clusterId)
  if (!cluster) continue
  const { senderArtifact, archiveableSeedRow, nonArchiveableSeedRow } =
    await loadPreviewSeedCandidates(cluster)

  if (!selectedCluster && senderArtifact.selected_header && archiveableSeedRow) {
    selectedCluster = cluster
    selectedClusterArtifact = senderArtifact
    selectedSenderSeedRow = archiveableSeedRow
  }

  if (
    !historicalSelectedCluster &&
    (cluster.cluster_id === 'context.historical' ||
      cluster.cluster_id === 'historical-out-of-inbox-senders') &&
    senderArtifact.selected_header &&
    nonArchiveableSeedRow
  ) {
    historicalSelectedCluster = cluster
    historicalSelectedSenderSeedRow = nonArchiveableSeedRow
  }

  if (selectedCluster && historicalSelectedCluster) {
    break
  }
}

assert.ok(selectedCluster, 'Expected at least one cluster with published sender workspace seed data')
assert.ok(
  selectedClusterArtifact?.publication?.published_version,
  'Expected selected cluster artifact read to have a published version'
)
assert.ok(selectedSenderSeedRow, 'Expected at least one seeded sender row with preview message ids')

const senderKey = selectedSenderSeedRow.sender_key
const senderPolicies = { [senderKey]: 'archive' }

const proof = {
  ok: true,
  generated_at: new Date().toISOString(),
  tenant_id: TENANT_ID,
  analysis_scope: ANALYSIS_SCOPE,
  agent_id: AGENT_ID,
  artifact_version: artifactRead.artifact_version,
  runtime_background_refresh_enabled: flagSnapshot.runtime_background_refresh,
  selected_cluster_id: selectedCluster.cluster_id,
  selected_sender_key: senderKey,
  historical_selected_cluster_id: historicalSelectedCluster?.cluster_id || null,
  historical_selected_sender_key: historicalSelectedSenderSeedRow?.sender_key || null,
  scenarios: [],
}

const forbiddenMailboxScanLogs = [
  'loadIndexedGmailMessagesForTenant(limit=100000)',
  '[integrations/gmail/mailbox-indexer/indexed-rows]',
]

proof.scenarios.push(
  await runScenario('sender_overview_cold_open', {
    requiredLogs: [
      '[integrations/gmail/sender-workspace-artifact]',
      '"mode":"published_artifact"',
    ],
    forbiddenLogs: forbiddenMailboxScanLogs,
    run: async () => {
      const response = await loadGmailSenderWorkspaceForTenant({
        supabase,
        tenantId: TENANT_ID,
        analysisScope: ANALYSIS_SCOPE,
        clusters,
        selectedCluster,
        page: 1,
        pageSize: 12,
      })
      assert.equal(response.ok, true)
      return response.data
    },
    assertResult: async (result) => {
      assert.equal(result.analysis_scope, ANALYSIS_SCOPE)
      assert.equal(result.selected_cluster.cluster_id, selectedCluster.cluster_id)
      assert.ok(Array.isArray(result.senders))
    },
    summarizeResult: (result) => ({
      sender_count: result.pagination.total_senders,
      loaded_sender_rows: result.senders.length,
      source: result.source,
    }),
  })
)

proof.scenarios.push(
  await runScenario('mailbox_intelligence_cold_open', {
    requiredLogs: [
      '[integrations/gmail/mailbox-intelligence-artifact]',
      '"mode":"published_artifact"',
    ],
    forbiddenLogs: forbiddenMailboxScanLogs,
    run: async () => {
      const response = await loadGmailMailboxIntelligenceForTenant({
        supabase,
        tenantId: TENANT_ID,
        analysisScope: ANALYSIS_SCOPE,
        clusters,
      })
      assert.equal(response.ok, true)
      return response.data
    },
    assertResult: async (result) => {
      assert.equal(result.analysis_scope, ANALYSIS_SCOPE)
      assert.equal(result.source, 'gmail_index_cache')
      assert.ok(Array.isArray(result.cleanup_groups))
    },
    summarizeResult: (result) => ({
      cleanup_group_count: result.cleanup_groups.length,
      whole_mailbox_messages: result.whole_mailbox.message_count,
      source: result.source,
    }),
  })
)

proof.scenarios.push(
  await runScenario('cleanup_groups_cold_open', {
    requiredLogs: [
      '[integrations/gmail/cleanup-group-intelligence]',
      '"artifact_mode":"published_artifact"',
    ],
    forbiddenLogs: forbiddenMailboxScanLogs,
    run: async () => {
      const response = await loadGmailCleanupGroupIntelligenceForTenant({
        supabase,
        tenantId: TENANT_ID,
        analysisScope: ANALYSIS_SCOPE,
        clusters,
      })
      assert.equal(response.ok, true)
      return response.data
    },
    assertResult: async (result) => {
      assert.equal(result.source, 'gmail_index_cache')
      assert.ok(result.cluster_count >= 1)
    },
    summarizeResult: (result) => ({
      cluster_count: result.cluster_count,
      cleanup_group_total_messages: result.cleanup_group_total_messages,
      source: result.source,
    }),
  })
)

const confirmationPreviewScenario = await runScenario('confirmation_preview_artifact_only', {
  requiredLogs: [
    '[integrations/gmail/confirmation-preview-artifact]',
    '"mode":"published_artifact"',
  ],
  forbiddenLogs: [
    ...forbiddenMailboxScanLogs,
    'loadDerivedWorkspaceState(',
    'loadMailboxContext(',
  ],
  run: async () => {
    const response = await loadGmailConfirmationPreviewForTenant({
      supabase,
      tenantId: TENANT_ID,
      analysisScope: ANALYSIS_SCOPE,
      clusters,
      selectedCluster,
      senderPolicies,
    })
    assert.equal(response.ok, true)
    return response.data
  },
  assertResult: async (result) => {
    assert.equal(result.source, 'gmail_index_cache')
    assert.ok(
      result.exact_archive_impact.message_count > 0,
      'Expected confirmation preview to produce at least one archived message'
    )
  },
  summarizeResult: (result) => ({
    archive_sender_count: result.exact_archive_impact.sender_count,
    archive_message_count: result.exact_archive_impact.message_count,
    protected_exclusions_count: result.protected_exclusions_count,
    source: result.source,
  }),
})
proof.scenarios.push(confirmationPreviewScenario)

if (historicalSelectedCluster && historicalSelectedSenderSeedRow) {
  const historicalSenderPolicies = { [historicalSelectedSenderSeedRow.sender_key]: 'archive' }
  proof.scenarios.push(
    await runScenario('confirmation_preview_historical_noop', {
      requiredLogs: [
        '[integrations/gmail/confirmation-preview-artifact]',
        '"mode":"published_artifact"',
      ],
      forbiddenLogs: [
        ...forbiddenMailboxScanLogs,
        'loadDerivedWorkspaceState(',
        'loadMailboxContext(',
      ],
      run: async () => {
        const response = await loadGmailConfirmationPreviewForTenant({
          supabase,
          tenantId: TENANT_ID,
          analysisScope: ANALYSIS_SCOPE,
          clusters,
          selectedCluster: historicalSelectedCluster,
          senderPolicies: historicalSenderPolicies,
        })
        assert.equal(response.ok, true)
        return response.data
      },
      assertResult: async (result) => {
        assert.equal(result.source, 'gmail_index_cache')
        assert.equal(result.selected_cluster.cluster_id, historicalSelectedCluster.cluster_id)
        assert.equal(
          result.exact_archive_impact.message_count,
          0,
          'Historical confirmation preview should not archive out-of-inbox-only messages'
        )
      },
      summarizeResult: (result) => ({
        archive_sender_count: result.exact_archive_impact.sender_count,
        archive_message_count: result.exact_archive_impact.message_count,
        protected_exclusions_count: result.protected_exclusions_count,
        source: result.source,
      }),
    })
  )
}

proof.scenarios.push(
  await runScenario('archive_scope_resolution_artifact_only', {
    requiredLogs: [
      '[integrations/gmail/archive-scope-artifact]',
      '"mode":"published_artifact"',
    ],
    forbiddenLogs: [
      ...forbiddenMailboxScanLogs,
      'loadDerivedWorkspaceState(',
      'loadMailboxContext(',
    ],
    run: async () => {
      const baseResponse = await resolveGmailSenderPolicyArchiveScopeForTenant({
        supabase,
        tenantId: TENANT_ID,
        analysisScope: ANALYSIS_SCOPE,
        clusters,
        selectedCluster,
        senderPolicies,
      })
      assert.equal(baseResponse.ok, true)
      assert.ok(
        baseResponse.data.messageIds.length > 0,
        'Expected archive resolution to produce at least one exact message id'
      )

      const excludedMessageId = baseResponse.data.messageIds[0]
      const excludedResponse = await resolveGmailSenderPolicyArchiveScopeForTenant({
        supabase,
        tenantId: TENANT_ID,
        analysisScope: ANALYSIS_SCOPE,
        clusters,
        selectedCluster,
        senderPolicies,
        messageOverrides: { [excludedMessageId]: 'exclude' },
      })
      assert.equal(excludedResponse.ok, true)
      return {
        base: baseResponse.data,
        excluded: excludedResponse.data,
        excludedMessageId,
      }
    },
    assertResult: async (result) => {
      assert.equal(
        result.base.selectedCount,
        confirmationPreviewScenario.summary.archive_message_count,
        'Expected archive_scope selectedCount to match confirmation preview exact archive count'
      )
      assert.equal(
        result.excluded.selectedCount,
        result.base.selectedCount - 1,
        'Expected excluding one archived message to reduce selectedCount by exactly 1'
      )
      assert.equal(
        result.excluded.messageIds.includes(result.excludedMessageId),
        false,
        'Expected excluded message id to be removed from archive scope'
      )
    },
    summarizeResult: (result) => ({
      base_selected_count: result.base.selectedCount,
      excluded_selected_count: result.excluded.selectedCount,
      excluded_message_id: result.excludedMessageId,
    }),
  })
)

proof.scenarios.push(
  await runScenario('runtime_shell_page_open_artifact_only', {
    requiredLogs: [
      '[playground][cleanup-runtime-artifact]',
      '"artifact_mode":"published_artifact"',
    ],
    forbiddenLogs: [
      ...forbiddenMailboxScanLogs,
      '[playground/cleanup-discovery]',
      'discoverGmailCleanupClustersForTenant(',
    ],
    run: async () => {
      const response = await loadPlaygroundRuntimeState({
        supabase,
        agentId: AGENT_ID,
        agentUserId: typeof agentRow.user_id === 'string' ? agentRow.user_id : null,
        isInboxCleanupIntent: true,
        analysisScope: ANALYSIS_SCOPE,
        requestMode: 'rehydrate_only',
      })
      return response
    },
    assertResult: async (result) => {
      assert.ok((result.runtimeState.runtimeCleanupPlan?.clusters.length ?? 0) > 0)
      assert.equal(result.manualCleanupRegenerationDiagnostics, null)
    },
    summarizeResult: summarizeRuntimeState,
  })
)

proof.scenarios.push(
  await runScenario('runtime_refresh_flag_gated', {
    requiredLogs: [
      '[playground][cleanup-runtime-artifact]',
      '"background_refresh_mode":"flag_disabled"',
    ],
    forbiddenLogs: [
      ...forbiddenMailboxScanLogs,
      '[playground/cleanup-discovery]',
      'discoverGmailCleanupClustersForTenant(',
    ],
    run: async () => {
      const response = await loadPlaygroundRuntimeState({
        supabase,
        agentId: AGENT_ID,
        agentUserId: typeof agentRow.user_id === 'string' ? agentRow.user_id : null,
        isInboxCleanupIntent: true,
        forceMailboxProfileRefresh: true,
        analysisScope: ANALYSIS_SCOPE,
        requestMode: 'rehydrate_only',
      })
      return response
    },
    assertResult: async (result) => {
      assert.equal(
        result.manualCleanupRegenerationDiagnostics?.snapshotSaveMode,
        'background_enqueue_disabled'
      )
    },
    summarizeResult: summarizeRuntimeState,
  })
)

if (PROOF_OUTPUT) {
  mkdirpForFile(PROOF_OUTPUT)
  fs.writeFileSync(PROOF_OUTPUT, `${JSON.stringify(proof, null, 2)}\n`, 'utf8')
  console.log(`Proof bundle written to ${PROOF_OUTPUT}`)
}

console.log('\n=== Acceptance Proof Summary ===')
console.log(JSON.stringify(proof, null, 2))
