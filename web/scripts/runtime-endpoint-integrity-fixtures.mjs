import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  classifyDecisionReplay,
  isExecutionBoundToRequest,
  validateBoundApprovalDecision,
  validateBoundApprovalRequest,
} from '../src/lib/runtime/runtimeApprovalIntegrity.ts'
import { isSameOriginRuntimeRequest } from '../src/lib/runtime/runtimeRequestAccess.ts'

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const readSource = (relativePath) => readFileSync(join(webRoot, relativePath), 'utf8')
const sha256 = (relativePath) =>
  createHash('sha256').update(readFileSync(join(webRoot, relativePath))).digest('hex')

const agentId = 'd256b48e-5acf-4b3d-af22-003d52e7e582'
const foreignAgentId = '11111111-1111-4111-8111-111111111111'
const approvalId = '22222222-2222-4222-8222-222222222222'
const requestEventId = '33333333-3333-4333-8333-333333333333'
const decisionEventId = '44444444-4444-4444-8444-444444444444'

const requestRow = {
  id: requestEventId,
  agent_id: agentId,
  payload: {
    approval_id: approvalId,
    agent_id: agentId,
    proposed_actions: [{ tool: 'gmail', action: 'draft_email' }],
  },
}

const boundRequest = validateBoundApprovalRequest({ row: requestRow, agentId, approvalId })
assert.equal(boundRequest?.eventId, requestEventId, 'owner request must bind to its exact event')
assert.equal(
  validateBoundApprovalRequest({ row: null, agentId, approvalId }),
  null,
  'missing request must fail closed'
)
assert.equal(
  validateBoundApprovalRequest({
    row: { ...requestRow, payload: { ...requestRow.payload, agent_id: foreignAgentId } },
    agentId,
    approvalId,
  }),
  null,
  'request payload agent mismatch must fail closed'
)
assert.equal(
  validateBoundApprovalRequest({ row: { ...requestRow, agent_id: foreignAgentId }, agentId, approvalId }),
  null,
  'foreign request row must fail closed'
)

const approvedDecision = validateBoundApprovalDecision({
  row: {
    id: decisionEventId,
    agent_id: agentId,
    payload: { approval_id: approvalId, decision: 'approved' },
  },
  agentId,
  approvalId,
})
assert.equal(approvedDecision?.decision, 'approved')
assert.equal(classifyDecisionReplay(approvedDecision, 'approved'), 'idempotent')
assert.equal(classifyDecisionReplay(approvedDecision, 'rejected'), 'conflict')
assert.equal(classifyDecisionReplay(null, 'approved'), 'new')

const latestRejectedDecision = validateBoundApprovalDecision({
  row: {
    id: '55555555-5555-4555-8555-555555555555',
    agent_id: agentId,
    payload: { approval_id: approvalId, decision: 'rejected' },
  },
  agentId,
  approvalId,
})
assert.equal(latestRejectedDecision?.decision, 'rejected', 'latest rejected decision stays rejected')
assert.equal(
  validateBoundApprovalDecision({
    row: {
      id: decisionEventId,
      agent_id: foreignAgentId,
      payload: { approval_id: approvalId, decision: 'approved' },
    },
    agentId,
    approvalId,
  }),
  null,
  'cross-agent historical approval must not bind'
)

assert.equal(
  isExecutionBoundToRequest({
    row: {
      agent_id: foreignAgentId,
      payload: { approval_id: approvalId, request_event_id: requestEventId },
    },
    agentId,
    approvalId,
    requestEventId,
  }),
  false,
  'prior execution under a different agent must not bind'
)
assert.equal(
  isExecutionBoundToRequest({
    row: {
      agent_id: agentId,
      payload: { approval_id: approvalId, request_event_id: requestEventId },
    },
    agentId,
    approvalId,
    requestEventId,
  }),
  true,
  'same-agent exact-request execution must bind'
)

const sameOrigin = new Request('http://localhost:3000/api/runtime/approve', {
  headers: { origin: 'http://localhost:3000' },
})
const forwardedOrigin = new Request('http://127.0.0.1:3000/api/runtime/approve', {
  headers: {
    origin: 'https://www.orinexlabs.com',
    'x-forwarded-host': 'www.orinexlabs.com',
    'x-forwarded-proto': 'https',
  },
})
const wrongOrigin = new Request('http://localhost:3000/api/runtime/approve', {
  headers: { origin: 'https://attacker.example' },
})
assert.equal(isSameOriginRuntimeRequest(sameOrigin), true, 'local same-origin mutation must pass')
assert.equal(isSameOriginRuntimeRequest(forwardedOrigin), true, 'deployed forwarded origin must pass')
assert.equal(isSameOriginRuntimeRequest(wrongOrigin), false, 'wrong-origin mutation must fail closed')

const accessSource = readSource('src/lib/runtime/runtimeRequestAccess.ts')
const authIndex = accessSource.indexOf('.auth.getUser()')
const agentIndex = accessSource.indexOf(".from('agents')")
const profileIndex = accessSource.indexOf(".from('profiles')")
const adminIndex = accessSource.indexOf('getSupabaseAdmin()')
assert.ok(authIndex >= 0 && agentIndex > authIndex && profileIndex > agentIndex && adminIndex > profileIndex)
assert.match(accessSource, /status:\s*401/)
assert.match(accessSource, /\.eq\('id', params\.agentId\)[\s\S]*?\.eq\('user_id', actorId\)/)
assert.match(accessSource, /Workspace access is unavailable/)
assert.match(accessSource, /requireSameOrigin/)

const endpointPaths = [
  'src/app/api/agents/playground/route.ts',
  'src/app/api/runtime/plan/route.ts',
  'src/app/api/runtime/mode/route.ts',
  'src/app/api/runtime/approve/route.ts',
  'src/app/api/runtime/auto-approve/route.ts',
  'src/app/api/runtime/execute/route.ts',
  'src/app/api/runtime/confidence/route.ts',
  'src/app/api/runtime/eligibility/route.ts',
]

for (const endpointPath of endpointPaths) {
  const source = readSource(endpointPath)
  const handlerStart = source.indexOf('export async function')
  const handlerSource = source.slice(handlerStart)
  const accessIndex = handlerSource.indexOf('resolveRuntimeRequestAccess({')
  assert.ok(accessIndex >= 0, `${endpointPath} must invoke the shared access seam`)
  const privilegedIndex = handlerSource.indexOf(".from('agent_events')")
  const runtimeWorkIndex = endpointPath.includes('/agents/playground/')
    ? handlerSource.indexOf('loadPlaygroundAgentConfig({')
    : privilegedIndex
  assert.ok(runtimeWorkIndex < 0 || accessIndex < runtimeWorkIndex, `${endpointPath} must authorize first`)

  for (const block of handlerSource.split(/\n\s*\n/)) {
    if (!block.includes(".from('agent_events')") || !block.includes('.select(')) continue
    assert.match(block, /\.eq\('agent_id',\s*agentId\)|\.eq\('agent_id',\s*rawAgentId\)/)
  }
}

for (const postPath of endpointPaths.filter(
  (path) => !path.endsWith('/confidence/route.ts') && !path.endsWith('/eligibility/route.ts')
)) {
  const source = readSource(postPath)
  const handlerSource = source.slice(source.indexOf('export async function POST'))
  const principalIndex = handlerSource.indexOf('resolveRuntimeRequestPrincipal({')
  const bodyIndex = handlerSource.indexOf('req.json(')
  assert.ok(principalIndex >= 0, `${postPath} must authenticate through the shared principal seam`)
  assert.match(handlerSource.slice(principalIndex, bodyIndex), /requireSameOrigin:\s*true/)
  assert.ok(bodyIndex < 0 || principalIndex < bodyIndex, `${postPath} must gate before parsing the body`)
}

const approveSource = readSource('src/app/api/runtime/approve/route.ts')
assert.ok(
  approveSource.indexOf(".eq('event_type', 'approval_request')") <
    approveSource.indexOf("event_type: 'approval_decision'")
)
assert.match(approveSource, /classifyDecisionReplay/)

const autoApproveSource = readSource('src/app/api/runtime/auto-approve/route.ts')
assert.ok(
  autoApproveSource.indexOf(".eq('event_type', 'approval_request')") <
    autoApproveSource.indexOf("event_type: 'approval_decision'")
)
assert.match(autoApproveSource, /classifyDecisionReplay/)

const executeSource = readSource('src/app/api/runtime/execute/route.ts')
assert.match(
  executeSource,
  /\.eq\('event_type', 'approval_decision'\)[\s\S]*?\.order\('created_at', \{ ascending: false \}\)[\s\S]*?\.limit\(1\)/
)
assert.doesNotMatch(executeSource, /approvedDecisionCount/)
assert.match(executeSource, /request_event_id: approvalRequest\.eventId/)
assert.match(executeSource, /decision_event_id: currentDecision\.eventId/)

const legacyApprovalsSource = readSource('src/app/approvals/page.tsx')
assert.match(legacyApprovalsSource, /createServerSupabaseClient/)
assert.match(legacyApprovalsSource, /auth\.getUser\(\)/)
assert.doesNotMatch(legacyApprovalsSource, /getSupabaseAdmin/)
assert.doesNotMatch(legacyApprovalsSource, /global approvals queue/)

const frozenHashes = {
  'src/lib/integrations/gmail/inboxAnalysis.ts':
    '57ab82fffd8a29570d34719616149f2732d670bb2b35424ca6df85d2ac78058c',
  'src/lib/integrations/gmail/gmailCleanupWorkspace.ts':
    '226c30e475783909b8a880971a05d62b9890ecae957071460015029eaa269f6b',
  'src/app/agents/[id]/operations/approvals/page.tsx':
    'fec9b3c769feb98b5e7f354f241a4cf146e843464dbeb07776aa704fa3ea4311',
  'src/lib/runtime/stateLoaders.ts':
    '27ce88c8aa54c386efb612e285507dad313e4e16b1412ec90154ca46af43eab1',
  'src/lib/runtime/gmailRuntimeAssembler.ts':
    '1a0b67612f201cc9d5500f6001548d231fa5a040460727def6c375829f5e3b70',
  'src/lib/runtime/decisionWorkspaceActionModel.ts':
    '09d097563c2d4cf4dbb6bfd90e0826871ff1378ce721635618e92c737f3cd2ae',
  'src/lib/integrations/gmail/gmailDecisionWorkspaceActionAdapter.ts':
    '95d8d13a3fd9eee6d824d5c37b02d44a98bf18e78ce9db83d664141a9663edb4',
}

for (const [relativePath, expectedHash] of Object.entries(frozenHashes)) {
  assert.equal(sha256(relativePath), expectedHash, `${relativePath} must remain byte-identical`)
}

console.log('runtime endpoint integrity fixtures: PASS')
