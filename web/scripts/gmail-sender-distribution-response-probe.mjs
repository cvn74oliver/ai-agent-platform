import fs from 'node:fs/promises'
import path from 'node:path'

const TARGET_URL =
  process.argv[2] ||
  'http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions'
const OUTPUT_DIR =
  process.argv[3] || `/private/tmp/gmail-sender-distribution-response-${Date.now()}`

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function createTarget(url) {
  const response = await fetch(`http://127.0.0.1:9222/json/new?${encodeURIComponent(url)}`, {
    method: 'PUT',
  })
  if (!response.ok) throw new Error(`create_target_failed:${response.status}:${response.statusText}`)
  return await response.json()
}

async function closeTarget(id) {
  if (!id) return
  await fetch(`http://127.0.0.1:9222/json/close/${id}`).catch(() => {})
}

class PageSession {
  constructor(target) {
    this.target = target
    this.ws = new WebSocket(target.webSocketDebuggerUrl)
    this.nextId = 1
    this.pending = new Map()
    this.requests = []
    this.requestIndexById = new Map()
    this.opened = new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true })
      this.ws.addEventListener('error', reject, { once: true })
    })
    this.ws.addEventListener('message', (event) => {
      const payload = JSON.parse(event.data)
      if (payload.id && this.pending.has(payload.id)) {
        const entry = this.pending.get(payload.id)
        this.pending.delete(payload.id)
        if (payload.error) {
          entry.reject(new Error(payload.error.message || 'cdp_error'))
        } else {
          entry.resolve(payload.result || {})
        }
        return
      }
      if (payload.method === 'Network.requestWillBeSent') {
        const request = payload.params?.request
        if (!request?.url) return
        const entry = {
          requestId: payload.params?.requestId || '',
          url: request.url,
          method: request.method || 'GET',
          postData: request.postData || null,
          responseStatus: null,
        }
        this.requestIndexById.set(entry.requestId, this.requests.length)
        this.requests.push(entry)
        return
      }
      if (payload.method === 'Network.responseReceived') {
        const index = this.requestIndexById.get(payload.params?.requestId || '')
        if (index == null) return
        this.requests[index] = {
          ...this.requests[index],
          responseStatus: payload.params?.response?.status || null,
        }
      }
    })
  }

  async send(method, params = {}) {
    await this.opened
    const id = this.nextId++
    return await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`cdp_timeout:${method}`))
      }, 20000)
      this.pending.set(id, {
        resolve: (result) => {
          clearTimeout(timeout)
          resolve(result)
        },
        reject: (error) => {
          clearTimeout(timeout)
          reject(error)
        },
      })
      this.ws.send(JSON.stringify({ id, method, params }), (error) => {
        if (!error) return
        clearTimeout(timeout)
        this.pending.delete(id)
        reject(error)
      })
    })
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    return result.result?.value ?? null
  }

  async getResponseBody(requestId) {
    try {
      const result = await this.send('Network.getResponseBody', { requestId })
      return result?.base64Encoded
        ? Buffer.from(result.body || '', 'base64').toString('utf8')
        : result?.body || ''
    } catch {
      return null
    }
  }

  async navigate(url) {
    await this.send('Page.navigate', { url })
  }

  async close() {
    try {
      this.ws.close()
    } catch {}
    await closeTarget(this.target.id)
  }
}

function parseJson(value) {
  if (!value || typeof value !== 'string') return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

async function waitFor(page, label, predicate, timeoutMs = 90000) {
  const startedAt = Date.now()
  let lastState = null
  while (Date.now() - startedAt < timeoutMs) {
    lastState = await page.evaluate(`(() => {
      const visibleText = document.body ? document.body.innerText : ''
      return {
        href: location.href,
        activeTab:
          document.querySelector('[data-shared-analysis-rail-tab]')?.getAttribute('data-shared-analysis-rail-tab') ||
          null,
        authSignals: /sign in|log in|continue with google|authentication required/i.test(visibleText),
        truthGuidePresent: Boolean(document.querySelector('[data-review-truth-guide]')),
      }
    })()`)
    if (predicate(lastState)) return lastState
    await sleep(500)
  }
  throw new Error(`timeout:${label}:${JSON.stringify(lastState, null, 2)}`)
}

async function click(page, expression, errorMessage) {
  const ok = await page.evaluate(expression)
  if (!ok) throw new Error(errorMessage)
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
  const target = await createTarget(TARGET_URL)
  const page = new PageSession(target)
  try {
    await page.send('Page.enable')
    await page.send('Runtime.enable')
    await page.send('Network.enable')
    await page.send('Page.bringToFront')
    await page.navigate(TARGET_URL)

    const initial = await waitFor(
      page,
      'initial_page_or_auth',
      (state) => state.authSignals || state.truthGuidePresent
    )
    if (initial.authSignals) {
      console.log(JSON.stringify({ ok: false, status: 'auth_not_ready', initial }, null, 2))
      process.exitCode = 2
      return
    }

    await click(
      page,
      `(() => {
        const tab = Array.from(document.querySelectorAll('button[role="tab"]')).find(
          (node) => (node.textContent || '').trim().replace(/\\s+/g, ' ') === 'Sender Distribution'
        )
        if (!(tab instanceof HTMLButtonElement) || tab.disabled) return false
        tab.click()
        return true
      })()`,
      'could_not_click_sender_distribution_tab'
    )
    await waitFor(page, 'sender_distribution_tab', (state) => state.activeTab === 'sender_distribution')

    await click(
      page,
      `(() => {
        const group = document.querySelector('[data-sender-distribution-control-model="workflow_scope"]')
        if (!group) return false
        const button = Array.from(group.querySelectorAll('button')).find(
          (node) => (node.textContent || '').trim().replace(/\\s+/g, ' ') === '1W'
        )
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false
        button.click()
        return true
      })()`,
      'could_not_click_sender_distribution_1w'
    )

    await waitFor(
      page,
      'workflow_scope_7d',
      (state) => new URL(state.href).searchParams.get('workflow_scope') === '7d'
    )
    await sleep(8000)

    const responses = []
    for (const request of page.requests.filter((entry) => entry.url.includes('/api/integrations/gmail/inbox-analysis'))) {
      const requestBody = parseJson(request.postData)
      const responseBody = parseJson(await page.getResponseBody(request.requestId))
      responses.push({
        request: {
          url: request.url,
          method: request.method,
          status: request.responseStatus,
          body: requestBody,
        },
        response: responseBody,
      })
    }

    const summary = responses
      .filter((entry) => entry.request.body?.action === 'sender_distribution' || entry.request.body?.action === 'sender_workspace')
      .map((entry) => ({
        action: entry.request.body?.action || null,
        analysis_scope: entry.request.body?.analysis_scope || null,
        request_component: entry.request.body?.request_component || null,
        response_sender_count: entry.response?.data?.selected_cluster?.sender_count ?? null,
        response_returned_senders: Array.isArray(entry.response?.data?.senders)
          ? entry.response.data.senders.length
          : null,
        response_source: entry.response?.data?.source || null,
      }))

    const payload = {
      ok: true,
      target_url: TARGET_URL,
      final_url: await page.evaluate('location.href'),
      output_dir: OUTPUT_DIR,
      summary,
      responses,
    }
    await fs.writeFile(path.join(OUTPUT_DIR, 'sender_distribution_response_probe.json'), JSON.stringify(payload, null, 2))
    console.log(JSON.stringify(payload, null, 2))
  } finally {
    await page.close()
  }
}

await main()
