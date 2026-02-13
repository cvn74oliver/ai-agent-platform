import { describe, it, expect } from 'vitest'
import { $fetch } from 'ofetch' // or your preferred HTTP test client

const API = 'http://localhost:3000/api/guided-setup/clarify'

describe('Guided Setup Clarify API', () => {
  const session_id = '27de4f43-56ab-4d91-ae02-96f53b4b9110' // seed via fixtures
  const prompt_id  = 'd0aa3f4d-15e9-4e91-a241-d2b6a224b981' // seed via migration/fixtures
  const headers    = { Authorization: `Bearer ${process.env.TEST_USER_TOKEN}` }

  it('1) Retrieve prompt by valid prompt_id', async () => {
    const res = await $fetch(API, {
      method: 'POST',
      headers,
      body: { session_id, prompt_id },
    })
    expect(res.ok).toBe(true)
    expect(res.data.prompt.id).toBe(prompt_id)
  })

  it('2) Save clarification response → persists then refetch', async () => {
    const body = {
      session_id,
      prompt_id,
      clarification_response: {
        question: 'Can you describe the primary goal of your agent?',
        answer: 'Automate customer service email replies.',
      },
    }
    const res1 = await $fetch(API, { method: 'POST', headers, body })
    expect(res1.ok).toBe(true)
    const found = res1.data.session_state.responses.find((r: any) => r.answer.includes('Automate'))
    expect(found).toBeTruthy()

    const res2 = await $fetch(API, { method: 'POST', headers, body: { session_id, prompt_id } })
    const foundAgain = res2.data.session_state.responses.find((r: any) => r.answer.includes('Automate'))
    expect(foundAgain).toBeTruthy()
  })

  it('3) Simulate back-navigation (reload prior step)', async () => {
    const res = await $fetch(API, { method: 'POST', headers, body: { session_id, prompt_id } })
    expect(res.ok).toBe(true)
    expect(Array.isArray(res.data.session_state.responses)).toBe(true)
  })

  it('4) Invalid prompt_id → PROMPT_NOT_FOUND', async () => {
    const res = await $fetch(API, {
      method: 'POST',
      headers,
      body: { session_id, prompt_id: '00000000-0000-0000-0000-000000000000' },
    }).catch((e) => e.data)
    expect(res.ok).toBe(false)
    expect(res.error.code).toBe('PROMPT_NOT_FOUND')
  })

  it('5) Version bump: latest active returned when no explicit version', async () => {
    // If your frontend calls with agent+category (no prompt_id) after a version bump:
    const res = await $fetch(API, {
      method: 'POST',
      headers,
      body: { session_id, agent: 'Frontend', category: 'guided_setup' },
    })
    expect(res.ok).toBe(true)
    expect(res.data.prompt.agent).toBe('Frontend')
    expect(res.data.prompt.category).toBe('guided_setup')
    // Optionally assert version === latest seeded version
  })
})
