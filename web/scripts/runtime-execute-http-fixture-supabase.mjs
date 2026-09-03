export const RUNTIME_EXECUTE_HTTP_FIXTURE_IDS = Object.freeze({
  actorId: '11111111-1111-4111-8111-111111111111',
  tenantId: '22222222-2222-4222-8222-222222222222',
  agentId: 'd256b48e-5acf-4b3d-af22-003d52e7e582',
  foreignAgentId: '33333333-3333-4333-8333-333333333333',
  approvalId: '44444444-4444-4444-8444-444444444444',
  requestEventId: '55555555-5555-4555-8555-555555555555',
  decisionEventId: '66666666-6666-4666-8666-666666666666',
  executionId: '77777777-7777-4777-8777-777777777777',
  leaseToken: 'fixture-lease-token',
})

const defaultScenario = () => ({
  authenticated: true,
  approvalRequestPresent: true,
  approvalDecision: 'approved',
  compatibilityReplay: false,
  claim: 'authorized',
  durableStatus: 'succeeded',
})

let scenario = defaultScenario()
let trace = []
let rpcCalls = []
let inMemoryMutationCount = 0
let actionState = new Map()

export function configureRuntimeExecuteHttpFixture(overrides = {}) {
  scenario = { ...defaultScenario(), ...overrides }
  trace = []
  rpcCalls = []
  inMemoryMutationCount = 0
  actionState = new Map()
}

export function readRuntimeExecuteHttpFixtureState() {
  return {
    trace: [...trace],
    rpcCalls: rpcCalls.map((call) => ({ name: call.name, args: structuredClone(call.args) })),
    inMemoryMutationCount,
    persistentMutationCount: 0,
    actionState: Object.fromEntries(actionState),
  }
}

function recordTrace(value) {
  trace.push(value)
}

function selectedEventType(filters) {
  return filters.find(([column]) => column === 'event_type')?.[1] || ''
}

function selectedAgentId(filters) {
  return filters.find(([column]) => column === 'agent_id')?.[1] || ''
}

function queryResult(clientKind, table, filters, single) {
  const eventType = selectedEventType(filters)
  const queryName = eventType ? `${table}:${eventType}` : table
  recordTrace(`query:${clientKind}:${queryName}`)

  if (table === 'agents') {
    const id = filters.find(([column]) => column === 'id')?.[1]
    const userId = filters.find(([column]) => column === 'user_id')?.[1]
    const owned =
      id === RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.agentId &&
      userId === RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.actorId
    return { data: owned ? { id, user_id: userId } : null, error: null }
  }

  if (table === 'profiles') {
    return {
      data: single ? { tenant_id: RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.tenantId } : [],
      error: null,
    }
  }

  if (table !== 'agent_events') return { data: single ? null : [], error: null }
  if (selectedAgentId(filters) !== RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.agentId) {
    return { data: [], error: null }
  }

  if (eventType === 'runtime_mode_update') {
    return { data: [{ payload: { mode: 'guarded' } }], error: null }
  }

  if (eventType === 'approval_request') {
    if (!scenario.approvalRequestPresent) return { data: [], error: null }
    return {
      data: [
        {
          id: RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.requestEventId,
          agent_id: RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.agentId,
          payload: {
            approval_id: RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.approvalId,
            agent_id: RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.agentId,
            session_id: 'stage-c2-http-fixture',
            proposed_actions: [{ tool: 'sandbox', action: 'noop' }],
          },
        },
      ],
      error: null,
    }
  }

  if (eventType === 'approval_decision') {
    return {
      data: [
        {
          id: RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.decisionEventId,
          agent_id: RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.agentId,
          payload: {
            approval_id: RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.approvalId,
            decision: scenario.approvalDecision,
          },
        },
      ],
      error: null,
    }
  }

  if (eventType === 'execution_result' && scenario.compatibilityReplay) {
    return {
      data: [
        {
          id: '88888888-8888-4888-8888-888888888888',
          agent_id: RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.agentId,
          payload: {
            approval_id: RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.approvalId,
            request_event_id: RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.requestEventId,
          },
        },
      ],
      error: null,
    }
  }

  return { data: [], error: null }
}

function createQueryBuilder(clientKind, table) {
  const filters = []
  let single = false

  const builder = {
    select() {
      return builder
    },
    eq(column, value) {
      filters.push([column, value])
      return builder
    },
    order() {
      return builder
    },
    limit() {
      return builder
    },
    maybeSingle() {
      single = true
      return Promise.resolve(queryResult(clientKind, table, filters, single))
    },
    then(resolve, reject) {
      return Promise.resolve(queryResult(clientKind, table, filters, single)).then(resolve, reject)
    },
  }

  return builder
}

async function runRpc(name, args) {
  recordTrace(`rpc:${name}`)
  rpcCalls.push({ name, args: structuredClone(args) })

  if (name === 'claim_decision_workspace_execution') {
    if (scenario.claim === 'conflict') {
      return { data: { ok: false, conflict: true }, error: null }
    }

    if (scenario.claim === 'existing') {
      return {
        data: {
          ok: true,
          conflict: false,
          existing: true,
          invocation_authorized: false,
          execution_id: RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.executionId,
          status: scenario.durableStatus,
          lease_token: RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.leaseToken,
          lease_expires_at: '2099-01-01T00:00:00.000Z',
        },
        error: null,
      }
    }

    inMemoryMutationCount += 1
    return {
      data: {
        ok: true,
        conflict: false,
        existing: false,
        invocation_authorized: true,
        execution_id: RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.executionId,
        status: 'claimed',
        lease_token: RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.leaseToken,
        lease_expires_at: '2099-01-01T00:00:00.000Z',
      },
      error: null,
    }
  }

  if (name === 'record_decision_workspace_action_receipt') {
    const current = actionState.get(args.p_action_index) || { status: 'claimed', attemptCount: 0 }
    if (current.status !== args.p_expected_status) {
      return { data: { ok: false }, error: null }
    }

    const attemptCount = current.attemptCount + (args.p_next_status === 'executing' ? 1 : 0)
    actionState.set(args.p_action_index, { status: args.p_next_status, attemptCount })
    inMemoryMutationCount += 1
    return {
      data: {
        ok: true,
        execution_id: RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.executionId,
        action_index: args.p_action_index,
        status: args.p_next_status,
        attempt_count: attemptCount,
      },
      error: null,
    }
  }

  if (name === 'finalize_decision_workspace_execution') {
    inMemoryMutationCount += 1
    return {
      data: {
        ok: true,
        execution_id: RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.executionId,
        status: 'succeeded',
        reconciliation_status: 'not_required',
      },
      error: null,
    }
  }

  return { data: null, error: { message: `Unexpected fixture RPC: ${name}` } }
}

const requestClient = {
  auth: {
    async getUser() {
      recordTrace('auth:getUser')
      if (!scenario.authenticated) {
        return { data: { user: null }, error: { message: 'fixture unauthenticated' } }
      }
      return {
        data: { user: { id: RUNTIME_EXECUTE_HTTP_FIXTURE_IDS.actorId } },
        error: null,
      }
    },
  },
  from(table) {
    return createQueryBuilder('request', table)
  },
}

const adminClient = {
  from(table) {
    return createQueryBuilder('admin', table)
  },
  rpc: runRpc,
}

export async function createServerSupabaseClient() {
  return requestClient
}

export async function getSupabaseAdmin() {
  return adminClient
}
