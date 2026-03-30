import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(scriptDir, '..')

function mkdirpForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
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

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function matchesFilters(row, filters) {
  return filters.every((filter) => {
    if (filter.kind === 'eq') return row[filter.column] === filter.value
    if (filter.kind === 'is') return row[filter.column] === filter.value
    return false
  })
}

function applySelectResult(rows, singleMode) {
  if (singleMode === 'single') {
    if (rows.length !== 1) {
      return {
        data: null,
        error: { message: `Expected a single row, received ${rows.length}.` },
      }
    }
    return { data: clone(rows[0]), error: null }
  }

  if (singleMode === 'maybeSingle') {
    if (rows.length > 1) {
      return {
        data: null,
        error: { message: `Expected at most one row, received ${rows.length}.` },
      }
    }
    return { data: rows[0] ? clone(rows[0]) : null, error: null }
  }

  return { data: clone(rows), error: null }
}

class FakeTableQuery {
  constructor(store, table) {
    this.store = store
    this.table = table
    this.filters = []
    this.selected = null
    this.operation = 'select'
    this.patch = null
    this.upsertRows = null
    this.onConflict = null
  }

  select(columns) {
    this.selected = columns
    return this
  }

  eq(column, value) {
    this.filters.push({ kind: 'eq', column, value })
    return this
  }

  is(column, value) {
    this.filters.push({ kind: 'is', column, value })
    return this
  }

  order() {
    return this
  }

  update(patch) {
    this.operation = 'update'
    this.patch = patch
    return this
  }

  upsert(rows, options = {}) {
    this.operation = 'upsert'
    this.upsertRows = Array.isArray(rows) ? rows : [rows]
    this.onConflict = options.onConflict || null
    return this
  }

  async maybeSingle() {
    return this.execute('maybeSingle')
  }

  async single() {
    return this.execute('single')
  }

  async execute(singleMode) {
    const tableRows = this.store[this.table]
    if (!Array.isArray(tableRows)) {
      return { data: null, error: { message: `Unknown table ${this.table}` } }
    }

    if (this.operation === 'select') {
      const rows = tableRows.filter((row) => matchesFilters(row, this.filters))
      return applySelectResult(rows, singleMode)
    }

    if (this.operation === 'update') {
      const updatedRows = []
      for (const row of tableRows) {
        if (!matchesFilters(row, this.filters)) continue
        Object.assign(row, clone(this.patch))
        updatedRows.push(row)
      }
      return applySelectResult(updatedRows, singleMode)
    }

    if (this.operation === 'upsert') {
      const conflictColumns = normalizeText(this.onConflict)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)

      const nextRows = []
      for (const incomingRow of this.upsertRows || []) {
        const incoming = clone(incomingRow)
        const existingIndex = tableRows.findIndex((row) =>
          conflictColumns.every((column) => row[column] === incoming[column])
        )
        if (existingIndex >= 0) {
          tableRows[existingIndex] = { ...tableRows[existingIndex], ...incoming }
          nextRows.push(tableRows[existingIndex])
        } else {
          tableRows.push(incoming)
          nextRows.push(incoming)
        }
      }
      return applySelectResult(nextRows, singleMode)
    }

    return { data: null, error: { message: `Unsupported operation ${this.operation}` } }
  }
}

class FakeSupabase {
  constructor(initialState) {
    this.store = clone(initialState)
  }

  from(table) {
    return new FakeTableQuery(this.store, table)
  }
}

function chooseOldPlan(params) {
  const hasPublishedBaseline = Boolean(normalizeText(params.publication.published_version))
  const buildInProgress = Boolean(normalizeText(params.publication.building_version))

  if (!hasPublishedBaseline) {
    return buildInProgress
      ? {
          action: 'none',
          decision_state: 'refresh_skipped',
          reason: 'refresh_skipped_missing_baseline_while_build_in_progress',
        }
      : {
          action: 'full_rebuild',
          decision_state: 'full_rebuild_required',
          reason: 'missing_published_baseline',
        }
  }

  if (buildInProgress) {
    return {
      action: 'none',
      decision_state: 'refresh_skipped',
      reason: 'refresh_skipped_existing_build_in_progress',
    }
  }

  return {
    action: 'incremental',
    decision_state: 'refresh_pending',
    reason: 'eligible_incremental_sync_delta',
  }
}

function chooseNewPlan(params) {
  const publication = params.liveness.publication
  const hasPublishedBaseline = Boolean(normalizeText(publication?.published_version))

  if (!hasPublishedBaseline) {
    return params.liveness.build_is_live
      ? {
          action: 'none',
          decision_state: 'refresh_skipped',
          reason: 'refresh_skipped_missing_baseline_while_build_in_progress',
        }
      : {
          action: 'full_rebuild',
          decision_state: 'full_rebuild_required',
          reason: 'missing_published_baseline',
        }
  }

  if (params.liveness.build_is_live) {
    return {
      action: 'none',
      decision_state: 'refresh_skipped',
      reason: 'refresh_skipped_existing_build_in_progress',
    }
  }

  return {
    action: 'incremental',
    decision_state: 'refresh_pending',
    reason: 'eligible_incremental_sync_delta',
  }
}

const PROOF_OUTPUT = process.env.PROOF_OUTPUT
  ? path.resolve(process.cwd(), process.env.PROOF_OUTPUT)
  : null

const { reconcileGmailArtifactBuildLiveness } = await import(
  '../src/lib/integrations/gmail/gmailArtifactStore.ts'
)

const initialPublication = {
  tenant_id: '085c8ef7-2fd7-4842-8499-cd605e894a77',
  analysis_scope: 'all_indexed',
  published_version: 'full-mailbox-20260328080841849',
  published_at: '2026-03-28T08:08:41.849+00:00',
  building_version: 'full-mailbox-20260329054914204',
  build_status: 'building',
  last_error: null,
  last_error_at: null,
  last_index_state_updated_at: '2026-03-29T05:54:40.000+00:00',
  last_indexed_message_count: 234341,
  freshness_state: 'refresh_in_progress',
  freshness_reason: 'sync_completed_artifact_refresh_required',
  refresh_strategy: 'full_rebuild',
  refresh_requested_at: '2026-03-29T05:54:20.000+00:00',
  refresh_started_at: '2026-03-29T05:54:22.021+00:00',
  refresh_completed_at: null,
  refresh_job_id: 'full-rebuild:085c8ef7-2fd7-4842-8499-cd605e894a77:all_indexed:full-mailbox-20260329054914204',
  refresh_sync_run_id: 'sync-run-live-proof',
  created_at: '2026-03-22T14:10:47.050+00:00',
  updated_at: '2026-03-29T05:54:22.021+00:00',
}

const initialJob = {
  job_id: initialPublication.refresh_job_id,
  tenant_id: initialPublication.tenant_id,
  analysis_scope: initialPublication.analysis_scope,
  artifact_version: initialPublication.building_version,
  job_type: 'full_rebuild',
  status: 'running',
  phase: 'projecting_sender_scope',
  sender_checkpoint: 'sender:newsletter@example.com',
  message_checkpoint: '{"cursor":{"sender_key":"newsletter@example.com"}}',
  cluster_checkpoint: null,
  processed_sender_count: 143,
  processed_message_count: 16233,
  processed_cluster_count: 5,
  heartbeat_at: '2026-03-29T05:58:10.000+00:00',
  started_at: initialPublication.refresh_started_at,
  completed_at: null,
  last_error: null,
  last_error_at: null,
  created_at: initialPublication.refresh_started_at,
  updated_at: '2026-03-29T05:58:10.000+00:00',
}

const beforePlan = chooseOldPlan({
  publication: initialPublication,
})

const fakeSupabase = new FakeSupabase({
  gmail_artifact_publications: [initialPublication],
  gmail_artifact_jobs: [initialJob],
})

const nowMs = Date.parse('2026-03-29T08:10:00.000+00:00')
const { result: liveness, entries: logs } = await captureLogs(async () =>
  reconcileGmailArtifactBuildLiveness({
    supabase: fakeSupabase,
    tenantId: initialPublication.tenant_id,
    analysisScope: initialPublication.analysis_scope,
    nowMs,
    logPrefix: '[proof/gmail-artifact-stale-build-recovery]',
  })
)

const afterPlan = chooseNewPlan({ liveness })

assert.equal(beforePlan.reason, 'refresh_skipped_existing_build_in_progress')
assert.equal(liveness.reclaim_applied, true)
assert.equal(liveness.reclaim_reason, 'refresh_reclaimed_stale_build')
assert.equal(liveness.publication?.building_version ?? null, null)
assert.equal(liveness.publication?.refresh_completed_at != null, true)
assert.equal(liveness.job?.status, 'failed')
assert.equal(afterPlan.action, 'incremental')
assert.equal(afterPlan.reason, 'eligible_incremental_sync_delta')

const proof = {
  ok: true,
  generated_at: new Date().toISOString(),
  scenario: {
    description:
      'Exact stale-build lock pattern: non-empty building_version, null refresh_completed_at, old refresh_started_at, and a stale running job heartbeat.',
    smart_sync_delta_shape: {
      effective_mode: 'incremental',
      changed_message_count: 2,
      affected_sender_count: 1,
    },
  },
  before: {
    publication: initialPublication,
    job: initialJob,
    route_plan: beforePlan,
  },
  after: {
    liveness,
    route_plan: afterPlan,
    stored_publication: fakeSupabase.store.gmail_artifact_publications[0],
    stored_job: fakeSupabase.store.gmail_artifact_jobs[0],
  },
  logs: logs.map((entry) => entry.text),
}

if (PROOF_OUTPUT) {
  mkdirpForFile(PROOF_OUTPUT)
  fs.writeFileSync(PROOF_OUTPUT, `${JSON.stringify(proof, null, 2)}\n`, 'utf8')
  console.log(`Proof output written to ${PROOF_OUTPUT}`)
}

console.log(JSON.stringify(proof, null, 2))
