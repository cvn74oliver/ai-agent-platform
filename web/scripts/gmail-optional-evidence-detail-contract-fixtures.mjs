import assert from 'node:assert/strict'
import {
  loadGmailMessageSnippetsForTenant,
} from '../src/lib/integrations/gmail/inboxAnalysis.ts'
import {
  fetchOperationsMessageSnippets,
  invalidateOperationsMessageSnippets,
} from '../src/lib/runtime/operationsWorkspace.ts'
import {
  FULL_OPTIONAL_EVIDENCE_DETAIL_AVAILABILITY,
  isOptionalEvidenceDetailAvailability,
  shouldCacheOptionalEvidenceDetail,
  subjectOnlyOptionalEvidenceDetailAvailability,
  unresolvedOptionalEvidenceDetailIds,
} from '../src/lib/runtime/optionalEvidenceDetail.ts'

const originalFetch = globalThis.fetch
const originalClientId = process.env.GOOGLE_CLIENT_ID
const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET

function connectionSupabase(row, error = null) {
  const query = {
    select() {
      return query
    },
    eq() {
      return query
    },
    async maybeSingle() {
      return { data: row, error }
    },
  }
  return {
    from(table) {
      assert.equal(table, 'integration_connections')
      return query
    },
  }
}

async function loadSnippets({ row, error = null, messageIds = ['message-1'] }) {
  return loadGmailMessageSnippetsForTenant({
    supabase: connectionSupabase(row, error),
    tenantId: 'tenant-1',
    messageIds,
    logPrefix: '[fixture/optional-evidence]',
  })
}

function assertSanitizedDegraded(result, operatorAction) {
  assert.equal(result.ok, true)
  assert.equal(result.data.source, 'gmail_artifact_subject_date')
  assert.deepEqual(
    result.data.availability,
    subjectOnlyOptionalEvidenceDetailAvailability(operatorAction)
  )
  assert.deepEqual(result.data.messages, [{ message_id: 'message-1', snippet: null }])
  const serialized = JSON.stringify(result)
  for (const forbidden of [
    'access-secret',
    'refresh-secret',
    'gmail.readonly',
    'invalid_grant',
    'token',
  ]) {
    assert.equal(serialized.includes(forbidden), false)
  }
}

try {
  process.env.GOOGLE_CLIENT_ID = 'fixture-client-id'
  process.env.GOOGLE_CLIENT_SECRET = 'fixture-client-secret'

  let providerCalls = 0
  globalThis.fetch = async () => {
    providerCalls += 1
    throw new Error('Provider request was not expected for this capability fixture.')
  }

  assertSanitizedDegraded(await loadSnippets({ row: null }), 'connect_source')
  assertSanitizedDegraded(
    await loadSnippets({
      row: {
        access_token: 'access-secret',
        refresh_token: 'refresh-secret',
        expires_at: '2099-01-01T00:00:00.000Z',
        scopes: 'profile email',
      },
    }),
    'review_source_permissions'
  )
  assertSanitizedDegraded(
    await loadSnippets({
      row: {
        access_token: '',
        refresh_token: 'refresh-secret',
        expires_at: '2099-01-01T00:00:00.000Z',
        scopes: 'https://www.googleapis.com/auth/gmail.readonly',
      },
    }),
    'reauthorize_source'
  )
  assert.equal(providerCalls, 0)

  const missingTenant = await loadGmailMessageSnippetsForTenant({
    supabase: connectionSupabase(null),
    tenantId: '',
    messageIds: ['message-1'],
    logPrefix: '[fixture/optional-evidence]',
  })
  assert.equal(missingTenant.ok, false)
  assert.equal(missingTenant.status, 400)

  delete process.env.GOOGLE_CLIENT_ID
  const missingConfiguration = await loadSnippets({
    row: {
      access_token: 'access-secret',
      refresh_token: 'refresh-secret',
      expires_at: '2020-01-01T00:00:00.000Z',
      scopes: 'https://www.googleapis.com/auth/gmail.readonly',
    },
  })
  assert.equal(missingConfiguration.ok, false)
  assert.equal(missingConfiguration.status, 500)
  process.env.GOOGLE_CLIENT_ID = 'fixture-client-id'

  globalThis.fetch = async () => {
    providerCalls += 1
    return new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'revoked' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  assertSanitizedDegraded(
    await loadSnippets({
      row: {
        access_token: 'access-secret',
        refresh_token: 'refresh-secret',
        expires_at: '2020-01-01T00:00:00.000Z',
        scopes: 'https://www.googleapis.com/auth/gmail.readonly',
      },
    }),
    'reauthorize_source'
  )
  assert.equal(providerCalls, 1)

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: 'temporarily_unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  const refreshProviderFailure = await loadSnippets({
    row: {
      access_token: 'access-secret',
      refresh_token: 'refresh-secret',
      expires_at: '2020-01-01T00:00:00.000Z',
      scopes: 'https://www.googleapis.com/auth/gmail.readonly',
    },
  })
  assert.equal(refreshProviderFailure.ok, false)
  assert.equal(refreshProviderFailure.status, 502)

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: { message: 'unexpected' } }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  const messageProviderFailure = await loadSnippets({
    row: {
      access_token: 'access-secret',
      refresh_token: 'refresh-secret',
      expires_at: '2099-01-01T00:00:00.000Z',
      scopes: 'https://www.googleapis.com/auth/gmail.readonly',
    },
  })
  assert.equal(messageProviderFailure.ok, false)
  assert.equal(messageProviderFailure.status, 502)

  const databaseFailure = await loadSnippets({
    row: null,
    error: { message: 'database unavailable' },
  })
  assert.equal(databaseFailure.ok, false)
  assert.equal(databaseFailure.status, 500)

  globalThis.fetch = async (url) => {
    assert(String(url).includes('/gmail/v1/users/me/messages/message-1'))
    return new Response(JSON.stringify({ snippet: 'Live provider detail' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const liveResult = await loadSnippets({
    row: {
      access_token: 'access-secret',
      refresh_token: 'refresh-secret',
      expires_at: '2099-01-01T00:00:00.000Z',
      scopes: 'https://www.googleapis.com/auth/gmail.readonly',
    },
  })
  assert.equal(liveResult.ok, true)
  assert.equal(liveResult.data.messages[0].snippet, 'Live provider detail')
  assert.deepEqual(liveResult.data.availability, FULL_OPTIONAL_EVIDENCE_DETAIL_AVAILABILITY)

  assert.equal(isOptionalEvidenceDetailAvailability(liveResult.data.availability), true)
  assert.equal(shouldCacheOptionalEvidenceDetail(liveResult.data.availability), true)
  assert.equal(
    shouldCacheOptionalEvidenceDetail(
      subjectOnlyOptionalEvidenceDetailAvailability('connect_source')
    ),
    false
  )

  const clientMessageIds = ['client-message-1']
  invalidateOperationsMessageSnippets(clientMessageIds)
  let clientPhase = 'degraded'
  let clientRequestCount = 0
  globalThis.fetch = async () => {
    clientRequestCount += 1
    if (clientPhase === 'error') {
      return new Response(JSON.stringify({ error: 'Provider request failed.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (clientPhase === 'malformed') {
      return new Response(JSON.stringify({ ok: true, data: { messages: [], source: 'wrong' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const degraded = clientPhase === 'degraded'
    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          messages: [
            {
              message_id: clientMessageIds[0],
              snippet: degraded ? null : 'Recovered live detail',
            },
          ],
          source: degraded ? 'gmail_artifact_subject_date' : 'gmail_metadata_live',
          availability: degraded
            ? subjectOnlyOptionalEvidenceDetailAvailability('reauthorize_source')
            : FULL_OPTIONAL_EVIDENCE_DETAIL_AVAILABILITY,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const degradedClientResult = await fetchOperationsMessageSnippets({
    messageIds: clientMessageIds,
  })
  assert.equal(degradedClientResult.ok, true)
  assert.equal(clientRequestCount, 1)
  const settledIds = new Set(degradedClientResult.data.messages.map((entry) => entry.message_id))
  assert.deepEqual(
    unresolvedOptionalEvidenceDetailIds(
      [{ id: clientMessageIds[0], detail: null }],
      settledIds
    ),
    []
  )
  assert.equal(clientRequestCount, 1)

  clientPhase = 'live'
  invalidateOperationsMessageSnippets(clientMessageIds)
  const retryIds = unresolvedOptionalEvidenceDetailIds(
    [{ id: clientMessageIds[0], detail: null }],
    new Set()
  )
  assert.deepEqual(retryIds, clientMessageIds)
  const recoveredClientResult = await fetchOperationsMessageSnippets({ messageIds: retryIds })
  assert.equal(recoveredClientResult.ok, true)
  assert.equal(recoveredClientResult.data.messages[0].snippet, 'Recovered live detail')
  assert.equal(clientRequestCount, 2)
  await fetchOperationsMessageSnippets({ messageIds: retryIds })
  assert.equal(clientRequestCount, 2)

  clientPhase = 'error'
  const errorIds = ['client-error-message']
  invalidateOperationsMessageSnippets(errorIds)
  const clientError = await fetchOperationsMessageSnippets({ messageIds: errorIds })
  assert.equal(clientError.ok, false)

  clientPhase = 'malformed'
  const malformedIds = ['client-malformed-message']
  invalidateOperationsMessageSnippets(malformedIds)
  const malformedClientResult = await fetchOperationsMessageSnippets({ messageIds: malformedIds })
  assert.equal(malformedClientResult.ok, false)

  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        degraded_capability_cases: 4,
        settled_repeat_request_count: 0,
        explicit_recovery_request_count: 1,
        recovered_live_detail: recoveredClientResult.data.messages[0].snippet,
        genuine_error_preserved: clientError.ok === false,
        tenant_and_configuration_errors_preserved:
          missingTenant.ok === false && missingConfiguration.ok === false,
        malformed_response_preserved: malformedClientResult.ok === false,
        sanitized_response: true,
      },
      null,
      2
    )
  )
} finally {
  globalThis.fetch = originalFetch
  if (originalClientId == null) delete process.env.GOOGLE_CLIENT_ID
  else process.env.GOOGLE_CLIENT_ID = originalClientId
  if (originalClientSecret == null) delete process.env.GOOGLE_CLIENT_SECRET
  else process.env.GOOGLE_CLIENT_SECRET = originalClientSecret
}
