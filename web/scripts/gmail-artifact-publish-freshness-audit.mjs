import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function mkdirpForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
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
    this.operation = 'select'
    this.patch = null
    this.upsertRows = null
    this.onConflict = null
  }

  select() {
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

const PROOF_OUTPUT = process.env.PROOF_OUTPUT
  ? path.resolve(process.cwd(), process.env.PROOF_OUTPUT)
  : null

const { publishGmailArtifactBuild } = await import('../src/lib/integrations/gmail/gmailArtifactStore.ts')

const tenantId = '085c8ef7-2fd7-4842-8499-cd605e894a77'
const analysisScope = 'all_indexed'
const publishedVersionBefore = 'full-mailbox-20260328080841849'
const artifactVersion = 'full-mailbox-20260406123000000'
const jobId = `full-rebuild:${tenantId}:${analysisScope}:${artifactVersion}`

const initialPublication = {
  tenant_id: tenantId,
  analysis_scope: analysisScope,
  published_version: publishedVersionBefore,
  published_at: '2026-03-28T08:08:41.849+00:00',
  building_version: artifactVersion,
  build_status: 'building',
  last_error: 'incremental refresh failed',
  last_error_at: '2026-04-06T12:22:00.000+00:00',
  last_index_state_updated_at: '2026-04-06T12:20:00.000+00:00',
  last_indexed_message_count: 234345,
  freshness_state: 'refresh_failed',
  freshness_reason: 'refresh_reclaimed_stale_build',
  refresh_strategy: 'full_rebuild',
  refresh_requested_at: '2026-04-06T12:25:00.000+00:00',
  refresh_started_at: '2026-04-06T12:21:00.000+00:00',
  refresh_completed_at: null,
  refresh_job_id: 'incremental:stale-job',
  refresh_sync_run_id: 'sync-run-stale',
  created_at: '2026-03-22T14:10:47.050+00:00',
  updated_at: '2026-04-06T12:25:00.000+00:00',
}

const initialJob = {
  job_id: jobId,
  tenant_id: tenantId,
  analysis_scope: analysisScope,
  artifact_version: artifactVersion,
  job_type: 'full_rebuild',
  status: 'running',
  phase: 'projecting_sender_scope',
  sender_checkpoint: null,
  message_checkpoint: null,
  cluster_checkpoint: null,
  processed_sender_count: 0,
  processed_message_count: 0,
  processed_cluster_count: 0,
  heartbeat_at: '2026-04-06T12:24:00.000+00:00',
  started_at: initialPublication.refresh_started_at,
  completed_at: null,
  last_error: null,
  last_error_at: null,
  created_at: initialPublication.refresh_started_at,
  updated_at: '2026-04-06T12:24:00.000+00:00',
}

const fakeSupabase = new FakeSupabase({
  gmail_artifact_publications: [initialPublication],
  gmail_artifact_jobs: [initialJob],
})

await publishGmailArtifactBuild({
  supabase: fakeSupabase,
  jobId,
  tenantId,
  analysisScope,
  artifactVersion,
  lastIndexStateUpdatedAt: '2026-04-06T12:30:00.000+00:00',
  lastIndexedMessageCount: 234346,
  processedSenderCount: 17,
  processedMessageCount: 41,
  processedClusterCount: 3,
})

const publicationAfter = fakeSupabase.store.gmail_artifact_publications[0]
const jobAfter = fakeSupabase.store.gmail_artifact_jobs[0]

assert.equal(publicationAfter.published_version, artifactVersion)
assert.equal(publicationAfter.build_status, 'published')
assert.equal(publicationAfter.freshness_state, 'fresh')
assert.equal(publicationAfter.freshness_reason, 'published_artifact_current')
assert.equal(publicationAfter.last_error, null)
assert.equal(typeof publicationAfter.refresh_completed_at, 'string')
assert.equal(publicationAfter.refresh_job_id, jobId)
assert.equal(jobAfter.status, 'completed')
assert.equal(jobAfter.phase, 'published')

const proof = {
  ok: true,
  generated_at: new Date().toISOString(),
  scenario: {
    description:
      'Simulates a later successful publish landing on a publication row that still carries stale failed freshness metadata and a refresh_requested_at later than refresh_started_at.',
    tenant_id: tenantId,
    analysis_scope: analysisScope,
  },
  before: {
    publication: initialPublication,
    job: initialJob,
  },
  after: {
    publication: publicationAfter,
    job: jobAfter,
  },
}

if (PROOF_OUTPUT) {
  mkdirpForFile(PROOF_OUTPUT)
  fs.writeFileSync(PROOF_OUTPUT, `${JSON.stringify(proof, null, 2)}\n`, 'utf8')
}

console.log(JSON.stringify(proof, null, 2))
