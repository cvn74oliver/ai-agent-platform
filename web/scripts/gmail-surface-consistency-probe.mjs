import fs from 'node:fs/promises'
import path from 'node:path'

const ENTRY_URL =
  process.argv[2] ||
  'http://localhost:3000/agents/d256b48e-5acf-4b3d-af22-003d52e7e582/operations/review?cluster_id=semantic.marketing_subscriptions'
const OUTPUT_DIR =
  process.argv[3] || `/private/tmp/gmail-surface-consistency-${Date.now()}`

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function buildCanonicalRoutes(entryUrl) {
  const entry = new URL(entryUrl)
  const base = `${entry.origin}${entry.pathname}`
  const clusterId = entry.searchParams.get('cluster_id') || 'semantic.marketing_subscriptions'
  return {
    clusterId,
    entry: `${base}?cluster_id=${encodeURIComponent(clusterId)}`,
    lastDay: `${base}?cluster_id=${encodeURIComponent(clusterId)}&sender_overview_window=last_day`,
    custom: `${base}?cluster_id=${encodeURIComponent(clusterId)}&sender_overview_window=custom&sender_overview_start=2026-03-08&sender_overview_end=2026-03-27`,
    lastWeek: `${base}?workflow_scope=7d&cluster_id=${encodeURIComponent(clusterId)}`,
    lastMonth: `${base}?workflow_scope=30d&cluster_id=${encodeURIComponent(clusterId)}`,
  }
}

const ROUTES = buildCanonicalRoutes(ENTRY_URL)

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
          startedAtMs: Date.now(),
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

  async navigate(url) {
    await this.send('Page.navigate', { url })
  }

  async screenshot(filePath) {
    const result = await this.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    })
    await fs.writeFile(filePath, Buffer.from(result.data, 'base64'))
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

function parseCountFromText(value) {
  if (typeof value !== 'string') return null
  const match = value.match(/([0-9][0-9,]*)/)
  return match ? Number(match[1].replace(/,/g, '')) : null
}

function sanitizeRequests(entries) {
  return entries
    .filter((entry) => entry.url.includes('/api/'))
    .map((entry) => ({
      url: entry.url,
      method: entry.method,
      requestBody: parseJson(entry.postData),
      responseStatus: entry.responseStatus,
    }))
}

function classifyRequestFamilies(entries) {
  const families = new Map()
  for (const entry of sanitizeRequests(entries)) {
    const action = entry.requestBody?.action || 'non_action_request'
    const current = families.get(action) || { action, count: 0, statuses: [] }
    current.count += 1
    if (entry.responseStatus != null) current.statuses.push(entry.responseStatus)
    families.set(action, current)
  }
  return Array.from(families.values()).sort((left, right) => left.action.localeCompare(right.action))
}

function guardChurnSummary(entries) {
  const traces = sanitizeRequests(entries).filter((entry) => entry.responseStatus === 409)
  return {
    count: traces.length,
    status: traces.length === 0 ? 'none' : 'interfering',
    traces,
  }
}

function buildStateAssertions(state) {
  const focusedLabel = state.timeContextFocusedBucketLabel
  const matchingBar =
    focusedLabel != null
      ? state.timeContextBars.find((bar) => bar.label === focusedLabel) || null
      : null
  const activeSendersValue = parseCountFromText(state.timeContextActiveSendersText)
  const supportingMessagesValue = parseCountFromText(state.timeContextSupportingMessagesText)
  const matchingCount = matchingBar != null && activeSendersValue === matchingBar.count
  const matchingMessages =
    matchingBar == null ||
    state.timeContextSupportingMessagesText === 'Not bucketized' ||
    supportingMessagesValue === matchingBar.messageCount
  return {
    matchingBarLabel: matchingBar != null,
    matchingActiveSenders: matchingCount,
    matchingSupportingMessages: matchingMessages,
  }
}

function buildAcceptedSurfacePredicate(params) {
  return (state) => {
    if (!state || state.activeTab !== 'time_context' || state.loadingWorkspace) return false
    if (state.clusterId !== params.clusterId) return false
    if (params.workflowScope !== undefined && state.workflowScope !== params.workflowScope) return false
    if (
      params.senderOverviewWindow !== undefined &&
      state.senderOverviewWindow !== params.senderOverviewWindow
    ) {
      return false
    }
    if (
      params.senderOverviewStart !== undefined &&
      state.senderOverviewStart !== params.senderOverviewStart
    ) {
      return false
    }
    if (
      params.senderOverviewEnd !== undefined &&
      state.senderOverviewEnd !== params.senderOverviewEnd
    ) {
      return false
    }
    if (params.rawBucketCount != null && state.timeContextRawBucketCount !== params.rawBucketCount) {
      return false
    }
    if (
      params.compressedMode != null &&
      state.timeContextCompressedMode !== params.compressedMode
    ) {
      return false
    }
    if (params.zeroBucketCount != null && state.timeContextZeroBucketCount !== params.zeroBucketCount) {
      return false
    }
    const assertions = buildStateAssertions(state)
    if (!assertions.matchingBarLabel || !assertions.matchingActiveSenders || !assertions.matchingSupportingMessages) {
      return false
    }
    if (
      params.requireWorkflowTruth &&
      state.workflowTruthCount == null &&
      state.topScopeCount == null &&
      state.timeContextWorkflowTotals.every((value) => parseCountFromText(value) == null)
    ) {
      return false
    }
    if (
      params.requireLowerWorkflowTotal &&
      state.timeContextWorkflowTotals.every((value) => parseCountFromText(value) == null)
    ) {
      return false
    }
    return true
  }
}

async function waitForState(page, label, predicate, timeoutMs = 90000) {
  const startedAt = Date.now()
  let lastState = null
  while (Date.now() - startedAt < timeoutMs) {
    lastState = await page.evaluate(`(() => {
      const visibleText = document.body ? document.body.innerText : ''
      const href = location.href
      const url = new URL(href)
      const activeTab =
        document.querySelector('[data-shared-analysis-rail-tab]')?.getAttribute('data-shared-analysis-rail-tab') ||
        null
      const senderDistributionBadge = Array.from(document.querySelectorAll('span'))
        .map((node) => (node.textContent || '').trim())
        .find((text) => /ranked sender/i.test(text)) || null
      const workflowSection = document.querySelector('[data-shared-workflow-label]')
      const rankedMatch = senderDistributionBadge?.match(/([0-9,]+)\\s+ranked\\s+sender/i) || null
      const workflowTruthMatch = visibleText.match(/Current sender universe:\\s*([0-9,]+)/i) || null
      const topScopeMatch =
        visibleText.match(/SENDERS IN (?:GROUP|WINDOW)\\s+([0-9,]+)/i) || null
      const truthSummaryNode = document.querySelector('[data-time-context-truth-summary="true"]')
      const truthSummaryText = truthSummaryNode ? truthSummaryNode.textContent || '' : ''
      const chartRoot = document.querySelector('[data-time-context-visual-root="true"]')
      const chartRect = chartRoot ? chartRoot.getBoundingClientRect() : null
      const timeContextBars = Array.from(
        document.querySelectorAll('[data-time-context-bucket-label]')
      ).map((node) => ({
        label: node.getAttribute('data-time-context-bucket-label') || null,
        count: Number(node.getAttribute('data-time-context-bucket-count') || '0'),
        messageCount: Number(node.getAttribute('data-time-context-bucket-message-count') || '0'),
      }))
      return {
        href,
        path: location.pathname,
        title: document.title,
        activeTab,
        authSignals: /sign in|log in|continue with google|authentication required/i.test(visibleText),
        clusterId: url.searchParams.get('cluster_id'),
        workflowScope: url.searchParams.get('workflow_scope'),
        senderOverviewWindow: url.searchParams.get('sender_overview_window'),
        senderOverviewStart: url.searchParams.get('sender_overview_start'),
        senderOverviewEnd: url.searchParams.get('sender_overview_end'),
        senderDistributionBadge,
        senderDistributionCount: rankedMatch ? Number(rankedMatch[1].replace(/,/g, '')) : null,
        workflowTruthCount: workflowTruthMatch ? Number(workflowTruthMatch[1].replace(/,/g, '')) : null,
        topScopeCount: topScopeMatch ? Number(topScopeMatch[1].replace(/,/g, '')) : null,
        timeContextGranularity: chartRoot?.getAttribute('data-time-context-granularity') || null,
        timeContextBucketCount: chartRoot
          ? Number(chartRoot.getAttribute('data-time-context-bucket-count') || '0')
          : null,
        timeContextRawBucketCount: chartRoot
          ? Number(chartRoot.getAttribute('data-time-context-raw-bucket-count') || '0')
          : null,
        timeContextHiddenBucketCount: chartRoot
          ? Number(chartRoot.getAttribute('data-time-context-hidden-bucket-count') || '0')
          : null,
        timeContextCompressedMode:
          chartRoot?.getAttribute('data-time-context-compressed-mode') === 'true',
        timeContextZeroBucketCount: document.querySelectorAll('[data-time-context-zero-slot="true"]').length,
        timeContextBars,
        timeContextTruthSummary: truthSummaryText,
        timeContextFocusedBucketLabel:
          document.querySelector('[data-time-context-focused-bucket-label="true"]')?.textContent?.trim() || null,
        timeContextActiveSendersText:
          document.querySelector('[data-time-context-active-senders="true"]')?.textContent?.trim() || null,
        timeContextSupportingMessagesText:
          document.querySelector('[data-time-context-supporting-messages="true"]')?.textContent?.trim() || null,
        timeContextWorkflowTotals: Array.from(
          document.querySelectorAll('[data-time-context-workflow-total="true"]')
        ).map((node) => (node.textContent || '').trim()),
        timeContextTruthNote:
          document.querySelector('[data-time-context-truth-note="true"]')?.textContent?.trim() || null,
        timeContextCompressedDisclosureVisible: Boolean(
          document.querySelector('[data-time-context-compressed-disclosure="true"]')
        ),
        timeContextChartVisibleInViewport:
          Boolean(chartRect) &&
          chartRect.width > 0 &&
          chartRect.height > 0 &&
          chartRect.top >= 0 &&
          chartRect.bottom <= window.innerHeight,
        timeContextChartRect: chartRect
          ? {
              top: chartRect.top,
              bottom: chartRect.bottom,
              left: chartRect.left,
              right: chartRect.right,
              width: chartRect.width,
              height: chartRect.height,
              viewportHeight: window.innerHeight,
            }
          : null,
        loadingWorkspace: visibleText.includes('Loading sender decisions workspace…'),
        senderDistributionGroupPresent: Boolean(
          document.querySelector('[data-sender-distribution-control-model="workflow_scope"]')
        ),
        truthGuidePresent: Boolean(document.querySelector('[data-review-truth-guide]')),
        visibleTextSample: visibleText.slice(0, 6000),
      }
    })()`)
    if (predicate(lastState)) return lastState
    await sleep(500)
  }
  throw new Error(`timeout:${label}:${JSON.stringify(lastState, null, 2)}`)
}

async function clickByText(page, expression, errorMessage) {
  const ok = await page.evaluate(expression)
  if (!ok) throw new Error(errorMessage)
}

async function ensureTimeContextTab(page) {
  const activeTab = await page.evaluate(
    `document.querySelector('[data-shared-analysis-rail-tab]')?.getAttribute('data-shared-analysis-rail-tab') || null`
  )
  if (activeTab === 'time_context') return
  await clickByText(
    page,
    `(() => {
      const tab = Array.from(document.querySelectorAll('button[role="tab"]')).find(
        (node) => (node.textContent || '').trim().replace(/\\s+/g, ' ') === 'Time Context'
      )
      if (!(tab instanceof HTMLButtonElement) || tab.disabled) return false
      tab.click()
      return true
    })()`,
    'could_not_click_tab_Time_Context'
  )
}

async function waitForPageOrAuth(page, label) {
  return await waitForState(
    page,
    `${label}_page_or_auth`,
    (state) =>
      Boolean(state) &&
      (state.authSignals ||
        state.truthGuidePresent ||
        state.senderDistributionGroupPresent ||
        state.timeContextBucketCount != null)
  )
}

function throwIfAuthBlocked(state) {
  if (
    state.authSignals ||
    /\/login(?:\/|$)|\/auth(?:\/|$)/.test(state.path) ||
    /\/login(?:\/|$)|\/auth(?:\/|$)/.test(state.href)
  ) {
    const error = new Error('auth_not_ready')
    error.authState = state
    throw error
  }
}

async function scrollChartIntoView(page) {
  await page.evaluate(`(() => {
    const node = document.querySelector('[data-time-context-visual-root="true"]')
    if (!(node instanceof HTMLElement)) return false
    node.scrollIntoView({ block: 'center', inline: 'nearest' })
    return true
  })()`)
  await sleep(250)
}

async function captureArtifact(page, label, state, requestStartIndex) {
  await scrollChartIntoView(page)
  const visibleState = await waitForState(
    page,
    `${label}_chart_visible`,
    (nextState) =>
      Boolean(nextState) &&
      nextState.activeTab === 'time_context' &&
      nextState.timeContextChartVisibleInViewport
  )
  const screenshotPath = path.join(OUTPUT_DIR, `${label}.png`)
  const domPath = path.join(OUTPUT_DIR, `${label}.dom.json`)
  const tracePath = path.join(OUTPUT_DIR, `${label}.trace.json`)
  const requestSlice = page.requests.slice(requestStartIndex)
  const assertions = buildStateAssertions(visibleState)
  const tracePayload = {
    label,
    href: visibleState.href,
    requests: sanitizeRequests(requestSlice),
    requestFamilies: classifyRequestFamilies(requestSlice),
    guardChurn: guardChurnSummary(requestSlice),
  }
  const domPayload = {
    label,
    capturedAt: new Date().toISOString(),
    state: visibleState,
    assertions,
  }

  await page.screenshot(screenshotPath)
  await fs.writeFile(domPath, JSON.stringify(domPayload, null, 2))
  await fs.writeFile(tracePath, JSON.stringify(tracePayload, null, 2))

  return {
    screenshotPath,
    domPath,
    tracePath,
    state: visibleState,
    assertions,
    requestFamilies: tracePayload.requestFamilies,
    guardChurn: tracePayload.guardChurn,
  }
}

async function navigateAndCaptureSurface(page, params) {
  const requestStartIndex = page.requests.length
  await page.navigate(params.url)
  const initial = await waitForPageOrAuth(page, params.label)
  throwIfAuthBlocked(initial)
  await ensureTimeContextTab(page)
  const state = await waitForState(page, `${params.label}_settled`, params.predicate)
  return await captureArtifact(page, params.label, state, requestStartIndex)
}

async function clickWorkflowScope(page, label) {
  await clickByText(
    page,
    `(() => {
      const group = document.querySelector('[data-time-context-control-group="workflow_scope_shortcuts"]')
      if (!group) return false
      const button = Array.from(group.querySelectorAll('button')).find(
        (node) => (node.textContent || '').trim().replace(/\\s+/g, ' ') === ${JSON.stringify(label)}
      )
      if (!(button instanceof HTMLButtonElement) || button.disabled) return false
      button.click()
      return true
    })()`,
    `could_not_click_time_context_scope_${label}`
  )
}

async function clickWorkflowWindow(page, label) {
  await clickByText(
    page,
    `(() => {
      const group = document.querySelector('[data-time-context-control-group="workflow_window_filters"]')
      if (!group) return false
      const button = Array.from(group.querySelectorAll('button')).find(
        (node) => (node.textContent || '').trim().replace(/\\s+/g, ' ') === ${JSON.stringify(label)}
      )
      if (!(button instanceof HTMLButtonElement) || button.disabled) return false
      button.click()
      return true
    })()`,
    `could_not_click_time_context_window_${label}`
  )
}

async function applyCustomRange(page, start, end) {
  await clickWorkflowWindow(page, 'Custom')
  await clickByText(
    page,
    `(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="date"]'))
      if (inputs.length < 2) return false
      const [startInput, endInput] = inputs
      const setValue = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set
      if (typeof setValue !== 'function') return false
      setValue.call(startInput, ${JSON.stringify(start)})
      startInput.dispatchEvent(new Event('input', { bubbles: true }))
      startInput.dispatchEvent(new Event('change', { bubbles: true }))
      setValue.call(endInput, ${JSON.stringify(end)})
      endInput.dispatchEvent(new Event('input', { bubbles: true }))
      endInput.dispatchEvent(new Event('change', { bubbles: true }))
      const button = Array.from(document.querySelectorAll('button')).find(
        (node) => (node.textContent || '').trim().replace(/\\s+/g, ' ') === 'Apply range'
      )
      if (!(button instanceof HTMLButtonElement) || button.disabled) return false
      button.click()
      return true
    })()`,
    'could_not_apply_custom_range'
  )
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
  const target = await createTarget(ROUTES.entry)
  const page = new PageSession(target)

  const predicates = {
    cold_entry: buildAcceptedSurfacePredicate({
      clusterId: ROUTES.clusterId,
      workflowScope: null,
      senderOverviewWindow: null,
      requireWorkflowTruth: true,
      requireLowerWorkflowTotal: true,
    }),
    last_day: buildAcceptedSurfacePredicate({
      clusterId: ROUTES.clusterId,
      workflowScope: null,
      senderOverviewWindow: 'last_day',
      rawBucketCount: 24,
      compressedMode: true,
      zeroBucketCount: 0,
      requireWorkflowTruth: true,
      requireLowerWorkflowTotal: true,
    }),
    custom: buildAcceptedSurfacePredicate({
      clusterId: ROUTES.clusterId,
      workflowScope: null,
      senderOverviewWindow: 'custom',
      senderOverviewStart: '2026-03-08',
      senderOverviewEnd: '2026-03-27',
      rawBucketCount: 20,
      compressedMode: true,
      zeroBucketCount: 0,
      requireWorkflowTruth: true,
      requireLowerWorkflowTotal: true,
    }),
    last_week: buildAcceptedSurfacePredicate({
      clusterId: ROUTES.clusterId,
      workflowScope: '7d',
      senderOverviewWindow: null,
      rawBucketCount: 7,
      compressedMode: true,
      zeroBucketCount: 0,
      requireWorkflowTruth: true,
      requireLowerWorkflowTotal: true,
    }),
    last_month: buildAcceptedSurfacePredicate({
      clusterId: ROUTES.clusterId,
      workflowScope: '30d',
      senderOverviewWindow: null,
      rawBucketCount: 30,
      compressedMode: true,
      zeroBucketCount: 0,
      requireWorkflowTruth: true,
      requireLowerWorkflowTotal: true,
    }),
  }

  try {
    await page.send('Page.enable')
    await page.send('Runtime.enable')
    await page.send('Network.enable')
    await page.send('Page.bringToFront')

    const artifacts = {
      cold_entry: await navigateAndCaptureSurface(page, {
        label: 'cold_entry_time_context',
        url: ROUTES.entry,
        predicate: predicates.cold_entry,
      }),
      last_day: await navigateAndCaptureSurface(page, {
        label: 'final_settled_1d',
        url: ROUTES.lastDay,
        predicate: predicates.last_day,
      }),
      custom: await navigateAndCaptureSurface(page, {
        label: 'final_settled_custom',
        url: ROUTES.custom,
        predicate: predicates.custom,
      }),
      last_week: await navigateAndCaptureSurface(page, {
        label: 'final_settled_1w',
        url: ROUTES.lastWeek,
        predicate: predicates.last_week,
      }),
      last_month: await navigateAndCaptureSurface(page, {
        label: 'final_settled_1m',
        url: ROUTES.lastMonth,
        predicate: predicates.last_month,
      }),
    }

    const switchLoop = {}
    const switchLoopStartIndex = page.requests.length
    await page.navigate(ROUTES.entry)
    const entryState = await waitForPageOrAuth(page, 'switch_loop_entry')
    throwIfAuthBlocked(entryState)
    await ensureTimeContextTab(page)
    await waitForState(page, 'switch_loop_entry_time_context', predicates.cold_entry)

    const loop1dStart = page.requests.length
    await clickWorkflowWindow(page, '1D')
    const loop1dState = await waitForState(page, 'switch_loop_1d_settled', predicates.last_day)
    switchLoop.last_day = await captureArtifact(page, 'switch_loop_1d', loop1dState, loop1dStart)

    const loopCustomStart = page.requests.length
    await applyCustomRange(page, '2026-03-08', '2026-03-27')
    const loopCustomState = await waitForState(page, 'switch_loop_custom_settled', predicates.custom)
    switchLoop.custom = await captureArtifact(
      page,
      'switch_loop_custom',
      loopCustomState,
      loopCustomStart
    )

    const loop1wStart = page.requests.length
    await clickWorkflowScope(page, '1W')
    const loop1wState = await waitForState(page, 'switch_loop_1w_settled', predicates.last_week)
    switchLoop.last_week = await captureArtifact(
      page,
      'switch_loop_1w',
      loop1wState,
      loop1wStart
    )

    const loop1mStart = page.requests.length
    await clickWorkflowScope(page, '1M')
    const loop1mState = await waitForState(page, 'switch_loop_1m_settled', predicates.last_month)
    switchLoop.last_month = await captureArtifact(
      page,
      'switch_loop_1m',
      loop1mState,
      loop1mStart
    )

    const switchLoopSummary = {
      screenshotPath: switchLoop.last_month.screenshotPath,
      domPath: switchLoop.last_month.domPath,
      tracePath: switchLoop.last_month.tracePath,
      requestFamilies: classifyRequestFamilies(page.requests.slice(switchLoopStartIndex)),
      guardChurn: guardChurnSummary(page.requests.slice(switchLoopStartIndex)),
      sequence: {
        last_day: switchLoop.last_day.state.href,
        custom: switchLoop.custom.state.href,
        last_week: switchLoop.last_week.state.href,
        last_month: switchLoop.last_month.state.href,
      },
    }

    const summary = {
      ok: true,
      target_url: ROUTES.entry,
      output_dir: OUTPUT_DIR,
      canonical_routes: ROUTES,
      accepted_surfaces: {
        cold_entry: {
          screenshotPath: artifacts.cold_entry.screenshotPath,
          domPath: artifacts.cold_entry.domPath,
          tracePath: artifacts.cold_entry.tracePath,
          state: artifacts.cold_entry.state,
          requestFamilies: artifacts.cold_entry.requestFamilies,
          guardChurn: artifacts.cold_entry.guardChurn,
        },
        last_day: {
          screenshotPath: artifacts.last_day.screenshotPath,
          domPath: artifacts.last_day.domPath,
          tracePath: artifacts.last_day.tracePath,
          state: artifacts.last_day.state,
          requestFamilies: artifacts.last_day.requestFamilies,
          guardChurn: artifacts.last_day.guardChurn,
        },
        custom: {
          screenshotPath: artifacts.custom.screenshotPath,
          domPath: artifacts.custom.domPath,
          tracePath: artifacts.custom.tracePath,
          state: artifacts.custom.state,
          requestFamilies: artifacts.custom.requestFamilies,
          guardChurn: artifacts.custom.guardChurn,
        },
        last_week: {
          screenshotPath: artifacts.last_week.screenshotPath,
          domPath: artifacts.last_week.domPath,
          tracePath: artifacts.last_week.tracePath,
          state: artifacts.last_week.state,
          requestFamilies: artifacts.last_week.requestFamilies,
          guardChurn: artifacts.last_week.guardChurn,
        },
        last_month: {
          screenshotPath: artifacts.last_month.screenshotPath,
          domPath: artifacts.last_month.domPath,
          tracePath: artifacts.last_month.tracePath,
          state: artifacts.last_month.state,
          requestFamilies: artifacts.last_month.requestFamilies,
          guardChurn: artifacts.last_month.guardChurn,
        },
      },
      switch_loop: switchLoopSummary,
    }

    const summaryPath = path.join(OUTPUT_DIR, 'summary.json')
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2))
    console.log(JSON.stringify({ ...summary, summaryPath }, null, 2))
  } catch (error) {
    if (error?.message === 'auth_not_ready') {
      console.log(
        JSON.stringify(
          {
            ok: false,
            status: 'auth_not_ready',
            target_url: ROUTES.entry,
            observed: error.authState || null,
          },
          null,
          2
        )
      )
      process.exitCode = 2
      return
    }
    console.log(
      JSON.stringify(
        {
          ok: false,
          status: 'probe_failed',
          target_url: ROUTES.entry,
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2
      )
    )
    process.exitCode = 1
  } finally {
    await page.close()
  }
}

await main()
