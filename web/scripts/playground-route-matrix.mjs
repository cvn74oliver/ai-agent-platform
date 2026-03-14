// web/scripts/playground-route-matrix.mjs
// Focused integration matrix for /api/agents/playground
//
// Usage:
//   BASE_URL="http://localhost:3000" AGENT_ID="..." node web/scripts/playground-route-matrix.mjs
//
// Optional:
//   SESSION_ID="..." EXPECT_OPENAI_FAILURE=1 node web/scripts/playground-route-matrix.mjs

import assert from 'node:assert/strict'

const RAW_BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL
const AGENT_ID = process.env.AGENT_ID || ''
const PROVIDED_SESSION_ID = process.env.SESSION_ID || ''
const EXPECT_OPENAI_FAILURE = process.env.EXPECT_OPENAI_FAILURE === '1'

const FAKE_AGENT_ID = '00000000-0000-0000-0000-000000000000'

function logScenario(name) {
  console.log(`\n=== ${name} ===`)
}

const SKIP = Symbol('skip')

async function postJson(path, body) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }
  return { res, json, text, url }
}

async function ensureServerReachable() {
  try {
    const res = await fetch(`${BASE_URL}/`)
    console.log(`Server reachable: ${res.status} (${BASE_URL})`)
    return true
  } catch (err) {
    console.log(`SKIP: cannot reach ${BASE_URL} (${String(err?.message || err)})`)
    return false
  }
}

function asObject(value) {
  return value && typeof value === 'object' ? value : {}
}

function hasReply(data) {
  return typeof data.reply === 'string'
}

function assertCommonOkEnvelope(payload, label) {
  assert.equal(payload?.ok, true, `${label}: expected ok=true`)
  assert.equal(typeof payload?.data, 'object', `${label}: expected object data`)
}

function assertErrorEnvelope(payload, status, label) {
  assert.equal(payload?.ok, false, `${label}: expected ok=false`)
  assert.equal(typeof payload?.error, 'string', `${label}: expected error string`)
  assert.equal(status > 0, true, `${label}: expected status`)
}

async function run() {
  console.log('Playground route integration matrix starting...')
  console.log('BASE_URL:', BASE_URL)
  console.log('AGENT_ID configured:', Boolean(AGENT_ID))
  console.log('SESSION_ID configured:', Boolean(PROVIDED_SESSION_ID))
  console.log('EXPECT_OPENAI_FAILURE:', EXPECT_OPENAI_FAILURE)

  const serverUp = await ensureServerReachable()
  if (!serverUp) {
    console.log('\nSKIP: integration matrix not executed because server is unreachable.')
    process.exit(0)
  }

  let passed = 0
  let skipped = 0
  let failed = 0
  let capturedSessionId = PROVIDED_SESSION_ID || null

  async function scenario(name, fn, options = {}) {
    logScenario(name)
    const { requiresAgent = false } = options
    if (requiresAgent && !AGENT_ID) {
      skipped += 1
      console.log('[SKIP] requires AGENT_ID')
      return
    }
    try {
      const result = await fn()
      if (result === SKIP) {
        skipped += 1
        return
      }
      passed += 1
      console.log('[PASS]')
    } catch (err) {
      failed += 1
      console.log('[FAIL]:', err?.message || err)
    }
  }

  await scenario('1) rehydrate_only returns runtime metadata without reply', async () => {
    const { res, json, text } = await postJson('/api/agents/playground', {
      agent_id: AGENT_ID,
      rehydrate_only: true,
      messages: [],
    })
    assert.equal(res.status, 200, `expected 200, got ${res.status} body=${text.slice(0, 400)}`)
    assertCommonOkEnvelope(json, 'rehydrate_only')
    const data = asObject(json.data)
    assert.equal(hasReply(data), false, 'rehydrate_only should not include reply')
  }, { requiresAgent: true })

  await scenario('2) full chat returns reply + runtime metadata envelope', async () => {
    const { res, json, text } = await postJson('/api/agents/playground', {
      agent_id: AGENT_ID,
      messages: [{ role: 'user', content: 'Quick check: summarize inbox status briefly.' }],
    })
    assert.equal(res.status, 200, `expected 200, got ${res.status} body=${text.slice(0, 400)}`)
    assertCommonOkEnvelope(json, 'full_chat')
    const data = asObject(json.data)
    assert.equal(typeof data.reply, 'string', 'full chat should include reply string')
  }, { requiresAgent: true })

  await scenario('3) session_id returned when analytics creates one', async () => {
    const { res, json, text } = await postJson('/api/agents/playground', {
      agent_id: AGENT_ID,
      messages: [{ role: 'user', content: 'Session creation check.' }],
    })
    assert.equal(res.status, 200, `expected 200, got ${res.status} body=${text.slice(0, 400)}`)
    assertCommonOkEnvelope(json, 'session_create')
    const data = asObject(json.data)
    assert.equal(typeof data.session_id, 'string', 'expected session_id on full chat path')
    assert.equal(data.session_id.length > 0, true, 'expected non-empty session_id')
    capturedSessionId = data.session_id
  }, { requiresAgent: true })

  await scenario('4) provided session_id is preserved', async () => {
    if (!capturedSessionId) {
      throw new Error('no captured session_id available from previous scenario')
    }
    const { res, json, text } = await postJson('/api/agents/playground', {
      agent_id: AGENT_ID,
      session_id: capturedSessionId,
      messages: [{ role: 'user', content: 'Use existing session id.' }],
    })
    assert.equal(res.status, 200, `expected 200, got ${res.status} body=${text.slice(0, 400)}`)
    assertCommonOkEnvelope(json, 'session_preserve')
    const data = asObject(json.data)
    assert.equal(data.session_id, capturedSessionId, 'expected provided session_id to be preserved')
  }, { requiresAgent: true })

  await scenario('5) explicit analyze_inbox approval-trigger produces runtime_proposal', async () => {
    const { res, json, text } = await postJson('/api/agents/playground', {
      agent_id: AGENT_ID,
      messages: [
        {
          role: 'user',
          content:
            'Create a runtime approval request right now for gmail.analyze_inbox. Do not just explain it in chat. I want the proposed action card with the approval button.',
        },
      ],
    })
    assert.equal(res.status, 200, `expected 200, got ${res.status} body=${text.slice(0, 400)}`)
    assertCommonOkEnvelope(json, 'analyze_inbox_proposal')
    const data = asObject(json.data)
    const proposal = asObject(data.runtime_proposal)
    assert.equal(proposal.approval_required, true, 'runtime_proposal.approval_required should be true')
    assert.equal(Array.isArray(proposal.proposed_actions), true, 'runtime_proposal.proposed_actions missing')
    const firstAction = proposal.proposed_actions?.[0]
    assert.equal(firstAction?.tool, 'gmail', 'expected gmail tool')
    assert.equal(firstAction?.action, 'analyze_inbox', 'expected analyze_inbox action')
  }, { requiresAgent: true })

  await scenario('6) optional runtime proposal omitted when intent does not request cleanup/proposal', async () => {
    const { res, json, text } = await postJson('/api/agents/playground', {
      agent_id: AGENT_ID,
      messages: [{ role: 'user', content: 'Hello there.' }],
    })
    assert.equal(res.status, 200, `expected 200, got ${res.status} body=${text.slice(0, 400)}`)
    assertCommonOkEnvelope(json, 'proposal_omission')
    const data = asObject(json.data)
    assert.equal('runtime_proposal' in data, false, 'runtime_proposal should be omitted')
  }, { requiresAgent: true })

  await scenario('7) OpenAI failure path returns expected 502 payload (opt-in)', async () => {
    if (!EXPECT_OPENAI_FAILURE) {
      console.log('[SKIP] set EXPECT_OPENAI_FAILURE=1 to enforce this scenario')
      return SKIP
    }
    const { res, json, text } = await postJson('/api/agents/playground', {
      agent_id: AGENT_ID,
      messages: [{ role: 'user', content: 'Trigger OpenAI failure for contract check.' }],
    })
    assert.equal(res.status, 502, `expected 502, got ${res.status} body=${text.slice(0, 400)}`)
    assertErrorEnvelope(json, res.status, 'openai_502')
    assert.equal(json.error.startsWith('OpenAI '), true, 'expected OpenAI-prefixed error')
  }, { requiresAgent: true })

  await scenario('8) invalid request returns expected 400 payload', async () => {
    const { res, json, text } = await postJson('/api/agents/playground', {
      agent_id: AGENT_ID || FAKE_AGENT_ID,
      rehydrate_only: false,
    })
    assert.equal(res.status, 400, `expected 400, got ${res.status} body=${text.slice(0, 400)}`)
    assertErrorEnvelope(json, res.status, 'invalid_400')
    assert.equal(json.error, 'agent_id and messages[] are required')
  })

  await scenario('9) missing agent returns expected 404 payload', async () => {
    const { res, json, text } = await postJson('/api/agents/playground', {
      agent_id: FAKE_AGENT_ID,
      messages: [{ role: 'user', content: 'Will fail due to missing agent.' }],
    })
    assert.equal(res.status, 404, `expected 404, got ${res.status} body=${text.slice(0, 400)}`)
    assertErrorEnvelope(json, res.status, 'missing_agent_404')
    assert.equal(json.error, 'Agent not found or access denied.')
  })

  console.log('\nMatrix summary:', { passed, failed, skipped })
  if (failed === 0 && passed === 0 && skipped > 0) {
    console.log('All scenarios were skipped due to environment prerequisites.')
  }

  if (failed > 0) process.exit(1)
  process.exit(0)
}

run().catch((err) => {
  console.error('Matrix script failed unexpectedly:', err?.stack || err?.message || err)
  process.exit(1)
})
