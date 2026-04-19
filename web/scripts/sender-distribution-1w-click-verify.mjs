import fs from 'node:fs/promises'
import path from 'node:path'

const TARGET_URL =
  process.argv[2] ||
  'http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions'
const OUTPUT_DIR =
  process.argv[3] || `/private/tmp/sender-distribution-1w-proof-${Date.now()}`

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function createTarget(url) {
  const response = await fetch(`http://127.0.0.1:9222/json/new?${encodeURIComponent(url)}`, {
    method: 'PUT',
  })
  if (!response.ok) {
    throw new Error(`create_target_failed:${response.status}:${response.statusText}`)
  }
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
          startedAtMs: Date.now(),
          responseStatus: null,
          finishedAtMs: null,
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
        return
      }

      if (payload.method === 'Network.loadingFinished') {
        const index = this.requestIndexById.get(payload.params?.requestId || '')
        if (index == null) return
        this.requests[index] = {
          ...this.requests[index],
          finishedAtMs: Date.now(),
        }
      }
    })
    this.ws.addEventListener('close', () => {
      for (const [id, entry] of this.pending.entries()) {
        this.pending.delete(id)
        entry.reject(new Error('cdp_closed'))
      }
    })
    this.ws.addEventListener('error', (error) => {
      for (const [id, entry] of this.pending.entries()) {
        this.pending.delete(id)
        entry.reject(error instanceof Error ? error : new Error('cdp_error'))
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
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }), (error) => {
        if (!error) return
        clearTimeout(timeout)
        this.pending.delete(id)
        reject(error)
      })
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

  async navigate(url) {
    await this.send('Page.navigate', { url })
  }

  resetRequests() {
    this.requests = []
    this.requestIndexById.clear()
  }

  close() {
    try {
      this.ws.close()
    } catch {}
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

async function waitForState(page, label, predicate, timeoutMs = 90000) {
  const startedAt = Date.now()
  let lastState = null
  while (Date.now() - startedAt < timeoutMs) {
    lastState = await page.evaluate(`(() => {
      const url = new URL(location.href)
      const senderDistributionGroup = document.querySelector('[data-sender-distribution-control-model="workflow_scope"]')
      const visibleText = document.body ? document.body.innerText : ''
      const authSignals = /sign in|log in|continue with google|authentication required/i.test(visibleText)
      const senderDistributionButtons = senderDistributionGroup
        ? Array.from(senderDistributionGroup.querySelectorAll('button')).map((node) => ({
            text: (node.textContent || '').trim().replace(/\\s+/g, ' '),
            disabled: node.disabled,
            ariaPressed: node.getAttribute('aria-pressed'),
            ariaCurrent: node.getAttribute('aria-current'),
            dataState: node.getAttribute('data-state'),
          }))
        : []
      return {
        href: location.href,
        path: location.pathname,
        workflowScopeQuery: url.searchParams.get('workflow_scope'),
        activeTab:
          document.querySelector('[data-shared-analysis-rail-tab]')?.getAttribute('data-shared-analysis-rail-tab') ||
          null,
        senderDistributionButtons,
        senderDistributionGroupPresent: Boolean(senderDistributionGroup),
        truthGuidePresent: Boolean(document.querySelector('[data-review-truth-guide]')),
        rowCount: document.querySelectorAll('article p.truncate.text-sm.font-semibold.text-white').length,
        loadingWorkspace: visibleText.includes('Loading sender decisions workspace…'),
        authSignals,
        title: document.title,
        visibleTextSample: visibleText.slice(0, 4000),
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

async function captureArtifacts(page, beforeState, afterState) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
  const screenshotPath = path.join(OUTPUT_DIR, 'sender_distribution_1w_final.png')
  const domPath = path.join(OUTPUT_DIR, 'sender_distribution_1w_final.dom.json')
  const tracePath = path.join(OUTPUT_DIR, 'sender_distribution_1w_final.trace.json')
  await page.send('Page.bringToFront')
  const screenshot = await page.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  })
  await fs.writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'))
  await fs.writeFile(
    domPath,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        targetUrl: TARGET_URL,
        beforeState,
        afterState,
      },
      null,
      2
    )
  )
  const trace = page.requests
    .filter((entry) => entry.url.includes('/api/'))
    .map((entry) => ({
      url: entry.url,
      method: entry.method,
      requestBody: parseJson(entry.postData),
      responseStatus: entry.responseStatus,
      durationMs:
        entry.finishedAtMs != null ? Math.max(0, entry.finishedAtMs - entry.startedAtMs) : null,
    }))
  await fs.writeFile(
    tracePath,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        trace,
      },
      null,
      2
    )
  )
  return { screenshotPath, domPath, tracePath, trace }
}

async function main() {
  const target = await createTarget(TARGET_URL)
  const page = new PageSession(target)

  try {
    await page.send('Page.enable')
    await page.send('Runtime.enable')
    await page.send('Network.enable')
    await page.send('Page.bringToFront')
    await page.send('Network.setCacheDisabled', { cacheDisabled: true })
    await page.navigate(TARGET_URL)

    const initialState = await waitForState(
      page,
      'initial_page_or_auth',
      (state) =>
        Boolean(state) &&
        (state.authSignals ||
          state.path !== '/login' ||
          state.truthGuidePresent ||
          state.senderDistributionGroupPresent)
    )

    if (
      initialState.authSignals ||
      /\/login(?:\/|$)|\/auth(?:\/|$)/.test(initialState.path) ||
      /\/login(?:\/|$)|\/auth(?:\/|$)/.test(initialState.href)
    ) {
      console.log(
        JSON.stringify(
          {
            ok: false,
            status: 'auth_not_ready',
            target_url: TARGET_URL,
            observed_url: initialState.href,
            observed_path: initialState.path,
            title: initialState.title,
          },
          null,
          2
        )
      )
      process.exitCode = 2
      return
    }

    const loadedState = await waitForState(
      page,
      'review_ready',
      (state) =>
        Boolean(state) &&
        state.truthGuidePresent &&
        state.activeTab === 'sender_distribution' &&
        state.senderDistributionGroupPresent &&
        !state.loadingWorkspace &&
        state.senderDistributionButtons.some((entry) => entry.text === '1W')
    )

    page.resetRequests()

    await click(
      page,
      `(() => {
        const group = document.querySelector('[data-sender-distribution-control-model="workflow_scope"]')
        if (!group) return false
        const button = Array.from(group.querySelectorAll('button')).find(
          (node) => (node.textContent || '').trim().replace(/\\s+/g, ' ') === '1W'
        )
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false
        button.scrollIntoView({ block: 'center', inline: 'center' })
        button.click()
        return true
      })()`,
      'could_not_click_sender_distribution_1w'
    )

    const afterState = await waitForState(
      page,
      'sender_distribution_1w_route',
      (state) =>
        Boolean(state) &&
        state.activeTab === 'sender_distribution' &&
        state.workflowScopeQuery === '7d' &&
        state.senderDistributionButtons.some(
          (entry) => entry.text === '1W' && !entry.disabled
        ) &&
        !state.loadingWorkspace &&
        state.rowCount > 0
    )

    await sleep(1500)

    const artifacts = await captureArtifacts(page, loadedState, afterState)
    const workflowScopeRequests = artifacts.trace.filter((entry) => {
      const requestBody = entry.requestBody
      if (!requestBody || typeof requestBody !== 'object') return false
      return requestBody.workflow_scope === '7d'
    })
    const guardChurn = artifacts.trace.filter((entry) => entry.responseStatus === 409)

    console.log(
      JSON.stringify(
        {
          ok: true,
          status: 'verified',
          target_url: TARGET_URL,
          initial_url: loadedState.href,
          final_url: afterState.href,
          before_state: loadedState,
          after_state: afterState,
          artifacts,
          request_families: {
            workflow_scope_7d_requests: workflowScopeRequests,
            guard_churn_409: guardChurn,
          },
        },
        null,
        2
      )
    )
  } finally {
    page.close()
    await closeTarget(target.id)
  }
}

await main()
