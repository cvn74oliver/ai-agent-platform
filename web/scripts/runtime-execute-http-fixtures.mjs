import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { POST } from '../src/app/api/runtime/execute/route.ts'
import {
  RUNTIME_EXECUTE_HTTP_FIXTURE_IDS as ids,
  configureRuntimeExecuteHttpFixture,
  readRuntimeExecuteHttpFixtureState,
} from './runtime-execute-http-fixture-supabase.mjs'

const expectedSuccessTrace = [
  'auth:getUser',
  'query:request:agents',
  'query:request:profiles',
  'query:admin:agent_events:runtime_mode_update',
  'query:admin:agent_events:approval_request',
  'query:admin:agent_events:approval_decision',
  'query:admin:agent_events:execution_result',
  'rpc:claim_decision_workspace_execution',
  'rpc:record_decision_workspace_action_receipt',
  'rpc:record_decision_workspace_action_receipt',
  'rpc:finalize_decision_workspace_execution',
]

const server = createServer(async (incoming, outgoing) => {
  try {
    const chunks = []
    for await (const chunk of incoming) chunks.push(chunk)
    const body = Buffer.concat(chunks)
    const request = new Request(`http://${incoming.headers.host}${incoming.url}`, {
      method: incoming.method,
      headers: incoming.headers,
      body: body.length > 0 ? body : undefined,
    })
    const response = await POST(request)
    const responseBody = Buffer.from(await response.arrayBuffer())
    outgoing.writeHead(response.status, Object.fromEntries(response.headers))
    outgoing.end(responseBody)
  } catch (error) {
    outgoing.writeHead(500, { 'content-type': 'application/json' })
    outgoing.end(JSON.stringify({ ok: false, error: String(error) }))
  }
})

await new Promise((resolve, reject) => {
  server.once('error', reject)
  server.listen(0, '127.0.0.1', resolve)
})

const address = server.address()
assert.ok(address && typeof address === 'object')
const origin = `http://127.0.0.1:${address.port}`
const nativeFetch = globalThis.fetch
let localhostRequestCount = 0
let externalRequestCount = 0

globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input))
  if (url.origin === origin) {
    localhostRequestCount += 1
    return nativeFetch(input, init)
  }
  externalRequestCount += 1
  throw new Error(`External request blocked by Stage C2 fixture: ${url.origin}`)
}

async function requestExecution({
  scenario,
  agentId = ids.agentId,
  requestOrigin = origin,
  requestBody,
}) {
  configureRuntimeExecuteHttpFixture(scenario)
  const response = await fetch(`${origin}/api/runtime/execute`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: requestOrigin,
    },
    body: requestBody ?? JSON.stringify({ agent_id: agentId, approval_id: ids.approvalId }),
  })
  const payload = await response.json()
  return { status: response.status, payload, state: readRuntimeExecuteHttpFixtureState() }
}

const rows = []

function recordRow({ caseName, baseline, action, result, settledState }) {
  rows.push({
    case: caseName,
    baseline_state: baseline,
    request_action: action,
    http_status: result.status,
    settled_state: settledState,
    upstream_trace: result.state.trace,
    persistent_database_writes: result.state.persistentMutationCount,
    verdict: 'PASS',
  })
}

try {
  const unauthenticated = await requestExecution({
    scenario: { authenticated: false },
    requestBody: '{malformed-json',
  })
  assert.equal(unauthenticated.status, 401)
  assert.equal(unauthenticated.payload.error, 'Authentication required.')
  assert.deepEqual(unauthenticated.state.trace, ['auth:getUser'])
  recordRow({
    caseName: 'unauthenticated',
    baseline: 'no authenticated principal; malformed body',
    action: 'POST execute',
    result: unauthenticated,
    settledState: '401 before body parsing or privileged work',
  })

  const wrongOrigin = await requestExecution({
    scenario: {},
    requestOrigin: 'https://attacker.example',
    requestBody: '{malformed-json',
  })
  assert.equal(wrongOrigin.status, 403)
  assert.equal(wrongOrigin.payload.error, 'Request origin is not allowed.')
  assert.deepEqual(wrongOrigin.state.trace, ['auth:getUser'])
  recordRow({
    caseName: 'wrong_origin',
    baseline: 'authenticated principal; foreign origin; malformed body',
    action: 'POST execute',
    result: wrongOrigin,
    settledState: '403 before body parsing or privileged work',
  })

  const foreignAgent = await requestExecution({ scenario: {}, agentId: ids.foreignAgentId })
  assert.equal(foreignAgent.status, 404)
  assert.equal(foreignAgent.payload.error, 'Agent not found or access denied.')
  assert.deepEqual(foreignAgent.state.trace, ['auth:getUser', 'query:request:agents'])
  recordRow({
    caseName: 'foreign_agent',
    baseline: 'authenticated principal; same origin; unowned agent id',
    action: 'POST execute',
    result: foreignAgent,
    settledState: '404 before tenant lookup, admin reads, or RPC',
  })

  const rejectedApproval = await requestExecution({
    scenario: { approvalDecision: 'rejected' },
  })
  assert.equal(rejectedApproval.status, 400)
  assert.equal(rejectedApproval.payload.error, 'Approval not approved')
  assert.equal(rejectedApproval.state.rpcCalls.length, 0)
  recordRow({
    caseName: 'rejected_approval',
    baseline: 'owned agent; guarded mode; bound request; latest decision rejected',
    action: 'POST execute',
    result: rejectedApproval,
    settledState: '400 with no claim authority',
  })

  const successfulExecution = await requestExecution({ scenario: {} })
  assert.equal(successfulExecution.status, 200)
  assert.equal(successfulExecution.payload.ok, true)
  assert.equal(successfulExecution.payload.data.execution_id, ids.executionId)
  assert.equal(successfulExecution.payload.data.status, 'succeeded')
  assert.equal(successfulExecution.payload.data.executed, true)
  assert.deepEqual(successfulExecution.payload.data.results, [
    { tool: 'sandbox', action: 'noop', success: true, note: 'noop simulated' },
  ])
  assert.deepEqual(successfulExecution.state.trace, expectedSuccessTrace)
  assert.deepEqual(successfulExecution.state.actionState, {
    0: { status: 'succeeded', attemptCount: 1 },
  })

  const successClaim = successfulExecution.state.rpcCalls[0]
  assert.equal(successClaim.name, 'claim_decision_workspace_execution')
  assert.equal(successClaim.args.p_tenant_id, ids.tenantId)
  assert.equal(successClaim.args.p_agent_id, ids.agentId)
  assert.equal(successClaim.args.p_actor_id, ids.actorId)
  assert.equal(successClaim.args.p_approval_id, ids.approvalId)
  assert.equal(successClaim.args.p_request_event_id, ids.requestEventId)
  assert.equal(successClaim.args.p_decision_event_id, ids.decisionEventId)
  assert.equal(successClaim.args.p_actions.length, 1)
  assert.equal(successClaim.args.p_actions[0].provider_type, 'sandbox')
  assert.equal(successClaim.args.p_actions[0].capability, 'sandbox.noop')
  assert.equal(successClaim.args.p_actions[0].effect, 'decision_only')
  assert.equal(successClaim.args.p_actions[0].reversibility, 'not_applicable')

  const successStart = successfulExecution.state.rpcCalls[1]
  assert.equal(successStart.name, 'record_decision_workspace_action_receipt')
  assert.equal(successStart.args.p_tenant_id, ids.tenantId)
  assert.equal(successStart.args.p_execution_id, ids.executionId)
  assert.equal(successStart.args.p_lease_token, ids.leaseToken)
  assert.equal(successStart.args.p_action_index, 0)
  assert.equal(successStart.args.p_expected_status, 'claimed')
  assert.equal(successStart.args.p_next_status, 'executing')
  assert.equal(successStart.args.p_actor_id, ids.actorId)

  const successReceipt = successfulExecution.state.rpcCalls[2]
  assert.equal(successReceipt.name, 'record_decision_workspace_action_receipt')
  assert.equal(successReceipt.args.p_expected_status, 'executing')
  assert.equal(successReceipt.args.p_next_status, 'succeeded')
  assert.equal(successReceipt.args.p_provider_receipt.provider_type, 'sandbox')
  assert.equal(successReceipt.args.p_provider_receipt.operation, 'noop')
  assert.equal(successReceipt.args.p_provider_receipt.simulated, true)
  assert.equal(successReceipt.args.p_reconciliation_status, 'not_required')

  const successFinalize = successfulExecution.state.rpcCalls.at(-1)
  assert.equal(successFinalize.name, 'finalize_decision_workspace_execution')
  assert.equal(successFinalize.args.p_tenant_id, ids.tenantId)
  assert.equal(successFinalize.args.p_execution_id, ids.executionId)
  assert.equal(successFinalize.args.p_lease_token, ids.leaseToken)
  assert.equal(successFinalize.args.p_actor_id, ids.actorId)
  assert.equal(successFinalize.args.p_compatibility_payload.approval_id, ids.approvalId)
  assert.equal(successFinalize.args.p_compatibility_payload.request_event_id, ids.requestEventId)
  assert.equal(successFinalize.args.p_compatibility_payload.decision_event_id, ids.decisionEventId)
  assert.equal(successFinalize.args.p_compatibility_payload.status, 'succeeded')
  recordRow({
    caseName: 'successful_execution',
    baseline: 'approved bound sandbox noop with no prior execution',
    action: 'POST execute',
    result: successfulExecution,
    settledState: 'claimed -> executing -> succeeded -> finalized; executed=true',
  })

  const compatibilityReplay = await requestExecution({
    scenario: { compatibilityReplay: true },
  })
  assert.equal(compatibilityReplay.status, 400)
  assert.equal(compatibilityReplay.payload.error, 'Already executed')
  assert.equal(compatibilityReplay.state.rpcCalls.length, 0)
  recordRow({
    caseName: 'compatibility_replay',
    baseline: 'bound compatibility execution_result already exists',
    action: 'POST identical approved request',
    result: compatibilityReplay,
    settledState: '400 Already executed; no durable claim RPC',
  })

  const durableReplay = await requestExecution({ scenario: { claim: 'existing' } })
  assert.equal(durableReplay.status, 409)
  assert.equal(durableReplay.payload.data.execution_id, ids.executionId)
  assert.equal(durableReplay.payload.data.executed, true)
  assert.deepEqual(
    durableReplay.state.rpcCalls.map((call) => call.name),
    ['claim_decision_workspace_execution']
  )
  recordRow({
    caseName: 'durable_claim_replay',
    baseline: 'no compatibility row; identical durable claim already succeeded',
    action: 'POST identical approved request',
    result: durableReplay,
    settledState: '409 existing durable claim; no action invocation',
  })

  const conflictingFingerprint = await requestExecution({ scenario: { claim: 'conflict' } })
  assert.equal(conflictingFingerprint.status, 409)
  assert.equal(conflictingFingerprint.payload.error, 'Execution request conflicts with its durable claim.')
  assert.deepEqual(
    conflictingFingerprint.state.rpcCalls.map((call) => call.name),
    ['claim_decision_workspace_execution']
  )
  recordRow({
    caseName: 'conflicting_fingerprint',
    baseline: 'durable execution key exists with a different action fingerprint',
    action: 'POST conflicting approved request',
    result: conflictingFingerprint,
    settledState: '409 conflict; no action invocation',
  })

  assert.equal(rows.length, 8)
  assert.equal(localhostRequestCount, 8)
  assert.equal(externalRequestCount, 0)
  assert.ok(rows.every((row) => row.verdict === 'PASS'))

  console.log(
    JSON.stringify(
      {
        ok: true,
        rows,
        localhost_request_count: localhostRequestCount,
        external_request_count: externalRequestCount,
        provider_request_count: 0,
        model_request_count: 0,
        customer_request_count: 0,
        persistent_database_write_count: 0,
        polling_count: 0,
        timer_count: 0,
        success_upstream_operation_count: successfulExecution.state.trace.length,
        success_in_memory_mutation_count: successfulExecution.state.inMemoryMutationCount,
      },
      null,
      2
    )
  )
} finally {
  globalThis.fetch = nativeFetch
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}
