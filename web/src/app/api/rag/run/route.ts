// IMPORTANT: This route must run in the Node.js runtime.
// Edge runtime cannot load native modules like @napi-rs/canvas (used by pdf-parse).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import * as cheerio from 'cheerio'
import { google } from 'googleapis'
import fs from 'node:fs/promises'
import path from 'node:path'

import { createRequire } from 'node:module'


const require = createRequire(import.meta.url)

// ----------------------------------------------
// Minimal Node polyfills for pdf-parse / pdfjs
// (Prevents DOMMatrix / ImageData / Path2D errors in Node)
// ----------------------------------------------

if (typeof (global as any).DOMMatrix === 'undefined') {
  ;(global as any).DOMMatrix = class DOMMatrix {}
}

if (typeof (global as any).ImageData === 'undefined') {
  ;(global as any).ImageData = class ImageData {}
}

if (typeof (global as any).Path2D === 'undefined') {
  ;(global as any).Path2D = class Path2D {}
}

// ----------------------------------------------
// Logging helpers
// ----------------------------------------------
const RAG_VERBOSE = String(process.env.RAG_VERBOSE || '').toLowerCase() === 'true'

function logv(...args: any[]) {
  if (RAG_VERBOSE) console.log(...args)
}

// ----------------------------------------------
// PDF parsing using pdf-parse only (most stable in Node runtime)
// ----------------------------------------------
async function parsePdfToText(buf: Buffer): Promise<string> {
  try {
    // Use pdf-parse only (most stable in Node runtime)
    const mod: any = require('pdf-parse')
    const fn: any = mod?.default ?? mod?.pdfParse ?? mod

    if (typeof fn !== 'function') throw new Error('PDF_PARSE_LOAD_FAILED')
    const parsed = await fn(buf)

    const text = String(parsed?.text || '').trim()

    if (!text) {
      throw new Error('EMPTY_PDF_TEXT')
    }

    return text
  } catch (e: any) {
    const msg = String(e?.message || e)
    throw new Error(`PDF_PARSE_FAILED: ${msg}`)
  }
}

const EMBEDDING_URL = 'https://api.openai.com/v1/embeddings'
const EMBEDDING_MODEL = 'text-embedding-3-small'

// Embedding batching + concurrency controls
const EMBED_BATCH_SIZE = Number(process.env.RAG_EMBED_BATCH_SIZE || 32)
const EMBED_MAX_CONCURRENCY = Number(process.env.RAG_EMBED_CONCURRENCY || 2)

class Semaphore {
  private available: number
  private queue: Array<() => void> = []

  constructor(count: number) {
    this.available = Math.max(1, count)
  }

  async acquire(): Promise<() => void> {
    if (this.available > 0) {
      this.available -= 1
      return () => this.release()
    }

    return new Promise((resolve) => {
      this.queue.push(() => {
        this.available -= 1
        resolve(() => this.release())
      })
    })
  }

  private release() {
    this.available += 1
    const next = this.queue.shift()
    if (next) next()
  }
}

const embedSemaphore = new Semaphore(EMBED_MAX_CONCURRENCY)

// Embeddings can occasionally return transient 5xx/429. We use a small circuit breaker
// so Drive imports don’t appear “hung” when embeddings are temporarily unavailable.
let embedConsecutiveFailures = 0
let embedBackoffUntilMs = 0

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// How long we consider a page "fresh" for delta sync (skip re-crawl)
const DEFAULT_DELTA_WINDOW_HOURS = 24 * 7 // 7 days
// Drive imports can be very large. Add soft limits so a single run can't look “hung”.
const DRIVE_MAX_FILES_DEFAULT = 2000
const DRIVE_MAX_FOLDERS_DEFAULT = 500
const DRIVE_MAX_SECONDS_DEFAULT = 25 * 60 // 25 minutes

function hoursAgoIso(hours: number): string {
  const ms = Math.max(0, hours) * 60 * 60 * 1000
  return new Date(Date.now() - ms).toISOString()
}

async function shouldSkipDelta(opts: {
  supabase: any
  agentId: string
  url: string
  deltaWindowHours: number
}): Promise<boolean> {
  const { supabase, agentId, url, deltaWindowHours } = opts
  try {
    const cutoff = hoursAgoIso(deltaWindowHours)
    const { data, error } = await supabase
      .from('rag_pages')
      .select('last_crawled_at,status')
      .eq('agent_id', agentId)
      .eq('url', url)
      .maybeSingle()

    if (error || !data) return false
    if (data.status !== 'ok') return false
    if (!data.last_crawled_at) return false

    // Skip if crawled recently and was OK.
    return String(data.last_crawled_at) >= cutoff
  } catch {
    return false
  }
}

async function clearExistingPageDocs(opts: { supabase: any; agentId: string; url: string }) {
  const { supabase, agentId, url } = opts
  try {
    // Find existing doc IDs for this exact page URL
    const { data: rows, error } = await supabase
      .from('rag_documents')
      .select('id')
      .eq('agent_id', agentId)
      .eq('source_url', url)
      .limit(2000)

    if (error || !rows || rows.length === 0) return

    const ids = rows.map((r: any) => r.id)

    // Delete chunks first (FK)
    await supabase.from('rag_chunks').delete().in('document_id', ids)

    // Delete docs
    await supabase.from('rag_documents').delete().in('id', ids)
  } catch {
    // Non-fatal
  }
}


// ----------------------------------------------
// Progress helper for jobs (writes to rag_jobs.error as a progress string)
// ----------------------------------------------
async function updateJobProgressSafe(opts: { supabase: any; jobId: string; message: string }) {
  const { supabase, jobId, message } = opts
  try {
    // Keep this short so it doesn't bloat the DB row.
    const trimmed = String(message || '').slice(0, 500)
    // Also emit to server logs when verbose so you can see progress in the terminal.
    logv('[rag/run][progress]', trimmed)
    await supabase.from('rag_jobs').update({ error: trimmed }).eq('id', jobId)
  } catch {
    // non-fatal
  }
}

// ----------------------------------------------
// Helpers
// ----------------------------------------------

async function embedTexts(texts: string[]): Promise<(number[] | null)[]> {
  // If we recently saw repeated failures, skip embedding briefly so the crawl can continue.
  if (Date.now() < embedBackoffUntilMs) {
    logv('[rag/run][embed] backoff active, skipping batch', {
      batch: texts.length,
      seconds_left: Math.ceil((embedBackoffUntilMs - Date.now()) / 1000),
    })
    return texts.map(() => null)
  }

  const release = await embedSemaphore.acquire()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30_000)

    // A couple of quick retries for transient 429/5xx.
    const MAX_ATTEMPTS = 3

    try {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const resp = await fetch(EMBEDDING_URL, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: EMBEDDING_MODEL,
            input: texts,
          }),
        })

        const json = await resp.json().catch(() => null)

        if (!resp.ok) {
          const status = resp.status
          const msg = json?.error?.message || json
          console.warn('[rag/run] embed non-200:', status, msg)

          // Transient errors: retry with short backoff.
          if (status === 429 || status === 503 || status >= 500) {
            if (attempt < MAX_ATTEMPTS) {
              const base = 600 * Math.pow(2, attempt - 1)
              const jitter = Math.floor(Math.random() * 350)
              await sleep(base + jitter)
              continue
            }

            // Trip circuit breaker after repeated transient failures.
            embedConsecutiveFailures++
            if (embedConsecutiveFailures >= 3) {
              embedBackoffUntilMs = Date.now() + 60_000 // 60s
              console.warn('[rag/run] embedding circuit-breaker tripped (60s)')
            }
          }

          logv('[rag/run][embed] non-200 -> returning nulls for batch', { status, batch: texts.length })
          return texts.map(() => null)
        }

        // Success
        const arr: any[] = Array.isArray(json?.data) ? json.data : []
        const out: (number[] | null)[] = texts.map((_, i) => arr?.[i]?.embedding || null)

        embedConsecutiveFailures = 0
        embedBackoffUntilMs = 0
        return out
      }

      return texts.map(() => null)
    } catch (err: any) {
      console.error('[rag/run] embed error:', err)
      embedConsecutiveFailures++
      if (embedConsecutiveFailures >= 3) {
        embedBackoffUntilMs = Date.now() + 60_000
        console.warn('[rag/run] embedding circuit-breaker tripped (60s)')
      }
      return texts.map(() => null)
    } finally {
      clearTimeout(timeout)
    }
  } finally {
    release()
  }
}

async function embedText(text: string): Promise<number[] | null> {
  const [vec] = await embedTexts([text])
  return vec || null
}

function chunkText(text: string, chunkSize = 1500): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  let current: string[] = []

  for (const w of words) {
    if (current.join(' ').length + w.length > chunkSize) {
      chunks.push(current.join(' '))
      current = []
    }
    current.push(w)
  }
  if (current.length) chunks.push(current.join(' '))
  return chunks
}

function estimateTokens(text: string): number {
  // Rough heuristic: ~4 chars per token in English-ish text
  const t = (text || '').trim()
  if (!t) return 0
  return Math.max(1, Math.ceil(t.length / 4))
}

async function fetchHTML(url: string): Promise<{ html?: string; status: number; error?: string }> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), 20_000)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Slightly more realistic headers to reduce bot blocking
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    })

    const status = res.status

    if (!res.ok) {
      // Don’t attempt to parse body for blocked pages; just return status.
      return { status, error: `HTTP ${status}` }
    }

    const html = await res.text()
    return { status, html }
  } catch (err: any) {
    const msg = err?.name === 'AbortError' ? 'FETCH_TIMEOUT' : err?.message || 'Unknown fetch error'
    return { status: 0, error: msg }
  } finally {
    clearTimeout(id)
  }
}

function extractTitle(html: string): string | null {
  try {
    const $ = cheerio.load(html)
    const t = ($('title').first().text() || '').trim()
    return t || null
  } catch {
    return null
  }
}

function extractText(html: string): string {
  const $ = cheerio.load(html)
  $('script, style, noscript').remove()
  return $('body').text().replace(/\s+/g, ' ').trim()
}

function extractLinks(html: string, baseUrl: string, maxPerPage = 50): string[] {
  const $ = cheerio.load(html)
  const out = new Set<string>()

  let baseOrigin = ''
  try {
    baseOrigin = new URL(baseUrl).origin
  } catch {
    // If baseUrl is weird, just return no links
    return []
  }

  $('a[href]').each((_, el) => {
    if (out.size >= maxPerPage) return

    const href = $(el).attr('href')?.trim()
    if (!href) return
    if (href.startsWith('#')) return
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return

    try {
      const abs = new URL(href, baseUrl)
      // Same-origin only
      if (abs.origin !== baseOrigin) return

      // Drop fragments
      abs.hash = ''

      const asStr = abs.toString()
      out.add(asStr)
    } catch {
      // ignore bad URLs
    }
  })

  return Array.from(out)
}

// ----------------------------------------------
// Google Drive helpers (service account)
// ----------------------------------------------

const GOOGLE_SERVICE_ACCOUNT_KEY_PATH =
  process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH ||
  path.join(process.cwd(), '.secrets', 'google-service-account.json')

// Optional: allow prod to pass JSON via env (base64 or raw)
const GOOGLE_SERVICE_ACCOUNT_JSON_B64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64 || ''
const GOOGLE_SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ''

async function loadServiceAccountJson(): Promise<any> {
  if (GOOGLE_SERVICE_ACCOUNT_JSON_B64) {
    const raw = Buffer.from(GOOGLE_SERVICE_ACCOUNT_JSON_B64, 'base64').toString('utf8')
    return JSON.parse(raw)
  }
  if (GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON)
  }
  const raw = await fs.readFile(GOOGLE_SERVICE_ACCOUNT_KEY_PATH, 'utf8')
  return JSON.parse(raw)
}

async function getDriveClient() {
  const creds = await loadServiceAccountJson()

  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })

  return google.drive({ version: 'v3', auth })
}

function isRetryableGoogleErr(err: any): boolean {
  const status = Number(err?.code || err?.response?.status || err?.status || 0)
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504
}

async function driveCallWithRetry<T>(
  label: string,
  fn: () => Promise<T>,
  maxAttempts: number = 4
): Promise<T> {
  let lastErr: any = null
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      lastErr = err
      const status = Number(err?.code || err?.response?.status || 0)
      console.warn(`[rag/run] drive ${label} failed (attempt ${attempt}/${maxAttempts})`, status || '', err?.message || err)

      if (!isRetryableGoogleErr(err) || attempt === maxAttempts) throw err

      const base = 750 * Math.pow(2, attempt - 1)
      const jitter = Math.floor(Math.random() * 400)
      await new Promise((r) => setTimeout(r, base + jitter))
    }
  }
  throw lastErr
}

function extractDriveFolderId(url: string): string | null {
  try {
    const u = new URL(url)
    // /drive/folders/<id>
    const parts = u.pathname.split('/').filter(Boolean)
    const idx = parts.findIndex((p) => p === 'folders')
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1]
    // ?id=<id>
    const qid = u.searchParams.get('id')
    if (qid) return qid
  } catch {}
  return null
}

function driveFileWebUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`
}

async function downloadDriveFileText(opts: {
  drive: any
  fileId: string
  mimeType: string
}): Promise<{ text: string; title?: string; finalMime?: string }> {
  const { drive, fileId, mimeType } = opts

  // Google Docs/Sheets/Slides need export
  const exportMime =
    mimeType === 'application/vnd.google-apps.document'
      ? 'text/plain'
      : mimeType === 'application/vnd.google-apps.spreadsheet'
      ? 'text/csv'
      : mimeType === 'application/vnd.google-apps.presentation'
      ? 'text/plain'
      : null

  if (exportMime) {
    const resp = await driveCallWithRetry('export', () =>
      drive.files.export(
        { fileId, mimeType: exportMime },
        { responseType: 'arraybuffer', timeout: 20_000 }
      )
    )
    const buf = Buffer.from(resp.data as ArrayBuffer)
    return { text: buf.toString('utf8'), finalMime: exportMime }
  }

  // Normal files: download
  const resp = await driveCallWithRetry('download', () =>
    drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer', timeout: 20_000 }
    )
  )
  const buf = Buffer.from(resp.data as ArrayBuffer)

  // PDF → extract text
  if (mimeType === 'application/pdf') {
    const text = await parsePdfToText(buf)
    return { text, finalMime: mimeType }
  }

  // Guardrail: most Google Drive files are binary (DOCX, images, etc.).
  // Treat only known text-like MIME types as UTF-8.
  const mt = String(mimeType || '').toLowerCase()

  const isTextLike =
    mt.startsWith('text/') ||
    mt === 'application/json' ||
    mt === 'application/xml' ||
    mt === 'application/xhtml+xml' ||
    mt === 'application/x-yaml' ||
    mt === 'application/yaml' ||
    mt === 'application/csv' ||
    mt === 'text/csv'

  // Explicitly skip common Office binaries unless we add a real parser.
  const isOfficeBinary =
    mt.includes('officedocument') ||
    mt.includes('msword') ||
    mt.includes('vnd.ms-') ||
    mt.includes('vnd.openxmlformats')

  if (!isTextLike || isOfficeBinary) {
    // Returning empty text will mark the file as NO_TEXT and avoid generating
    // thousands of garbage chunks from binary bytes.
    return { text: '', finalMime: mimeType }
  }

  // Everything else: treat as UTF-8 text best-effort
  return { text: buf.toString('utf8').trim(), finalMime: mimeType }
}

async function ingestDriveFolder(opts: {
  supabase: any
  jobId: string
  agentId: string
  folderUrl: string
  mode: 'delta' | 'full'
  deltaWindowHours: number
  maxFiles: number
  maxFolders: number
  maxSeconds: number
}): Promise<{ success: number; fail: number; skipped: number }> {
  const {
    supabase,
    jobId,
    agentId,
    folderUrl,
    mode,
    deltaWindowHours,
    maxFiles,
    maxFolders,
    maxSeconds,
  } = opts

  const folderId = extractDriveFolderId(folderUrl)
  if (!folderId) {
    console.warn('[rag/run] drive folder id not found:', folderUrl)
    return { success: 0, fail: 1, skipped: 0 }
  }

  const drive = await getDriveClient()

  // --- Drive proof-of-life: confirm access + show a tiny sample quickly ---
  try {
    await updateJobProgressSafe({
      supabase,
      jobId,
      message: `running: drive preflight (folder=${folderId})`,
    })

    // Confirm the folder is readable
    const folderMeta = await driveCallWithRetry('folder.get', () =>
      drive.files.get(
        { fileId: folderId, fields: 'id,name,mimeType' },
        { timeout: 20_000 }
      )
    )

    const folderName = String((folderMeta as any)?.data?.name || '')
    await updateJobProgressSafe({
      supabase,
      jobId,
      message: `running: drive ok (folder=${folderName || folderId}) — listing…`,
    })

    // Grab a small sample from the root so the UI/terminal shows it's working
    const firstPage = await driveCallWithRetry('list.sample', () =>
      drive.files.list(
        {
          q: `'${folderId}' in parents and trashed=false`,
          fields: 'files(id,name,mimeType)',
          pageSize: 10,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        },
        { timeout: 20_000 }
      )
    )

    const sample = ((firstPage as any)?.data?.files || [])
      .slice(0, 5)
      .map((f: any) => String(f?.name || '').trim())
      .filter(Boolean)
      .join(', ')

    await updateJobProgressSafe({
      supabase,
      jobId,
      message: `running: drive sample found=${((firstPage as any)?.data?.files || []).length} [${sample || 'no files in root'}]`,
    })
  } catch (e: any) {
    const msg = e?.message || String(e)
    console.warn('[rag/run] drive preflight failed:', msg)
    await updateJobProgressSafe({
      supabase,
      jobId,
      message: `running: drive preflight failed: ${msg}`.slice(0, 500),
    })
  }

  // Visible “it’s working” signals
  const serviceEmail =
    (await loadServiceAccountJson().catch(() => null))?.client_email || '(unknown service account)'
  console.log('[rag/run] drive service account:', serviceEmail)
  console.log('[rag/run] drive root folder:', folderId)
  logv('[rag/run][drive] limits', { maxFiles, maxFolders, maxSeconds })
  if (mode === 'delta') {
    console.log('[rag/run] drive mode:', mode, 'deltaWindowHours:', deltaWindowHours)
  } else {
    console.log('[rag/run] drive mode:', mode)
  }

  await updateJobProgressSafe({
    supabase,
    jobId,
    message: `running: drive scanning (folder=${folderId})`,
  })
  const startedAtMs = Date.now()
  let processedFiles = 0

  // List files in folder (paged) — recursively walk subfolders
  const folderQueue: string[] = [folderId]
  const visitedFolders = new Set<string>()
  await updateJobProgressSafe({
  supabase,
  jobId,
  message: `running: drive init maxFiles=${maxFiles} maxFolders=${maxFolders} maxSeconds=${maxSeconds}`,
})

  let success = 0
  let fail = 0
  let skipped = 0

  while (folderQueue.length) {
    const currentFolderId = folderQueue.shift()!
    if (visitedFolders.has(currentFolderId)) continue
    visitedFolders.add(currentFolderId)
    if (visitedFolders.size > maxFolders) {
      await updateJobProgressSafe({
        supabase,
        jobId,
        message: `running: drive soft-stop maxFolders=${maxFolders} processed=${processedFiles} ok=${success} fail=${fail} skipped=${skipped}`,
      })
      return { success, fail, skipped }
    }

    const elapsedSec = Math.floor((Date.now() - startedAtMs) / 1000)
    if (elapsedSec > maxSeconds) {
      await updateJobProgressSafe({
        supabase,
        jobId,
        message: `running: drive soft-stop maxSeconds=${maxSeconds}s processed=${processedFiles} ok=${success} fail=${fail} skipped=${skipped}`,
      })
      return { success, fail, skipped }
    }

    await updateJobProgressSafe({
      supabase,
      jobId,
      message: `running: drive listing folder=${currentFolderId} folders=${visitedFolders.size} processed=${processedFiles} ok=${success} fail=${fail} skipped=${skipped}`,
    })
    logv('[rag/run][drive] listing folder', {
      folder: currentFolderId,
      foldersVisited: visitedFolders.size,
      processedFiles,
      ok: success,
      fail,
      skipped,
    })

    let pageToken: string | undefined = undefined

    while (true) {
    const resp = await driveCallWithRetry('list', () =>
      drive.files.list(
        {
          q: `'${currentFolderId}' in parents and trashed=false`,
          fields:
            'nextPageToken, files(id, name, mimeType, modifiedTime, shortcutDetails(targetId,targetMimeType))',
          pageSize: 200,
          pageToken,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        },
        { timeout: 20_000 }
      )
    )

      const files = (resp.data.files || []) as any[]

      // Prioritize PDFs first so book PDFs ingest even if a huge DOCX exists.
      files.sort((a: any, b: any) => {
        const am = String(a?.mimeType || '')
        const bm = String(b?.mimeType || '')
        const aPdf = am === 'application/pdf' ? 0 : 1
        const bPdf = bm === 'application/pdf' ? 0 : 1
        if (aPdf !== bPdf) return aPdf - bPdf

        const an = String(a?.name || '')
        const bn = String(b?.name || '')
        return an.localeCompare(bn)
      })

      for (const f of files) {
        // Periodic progress text for the UI (shows you Drive is active)
        processedFiles++

        if (processedFiles > maxFiles) {
          await updateJobProgressSafe({
            supabase,
            jobId,
            message: `running: drive soft-stop maxFiles=${maxFiles} processed=${processedFiles} ok=${success} fail=${fail} skipped=${skipped}`,
          })
          return { success, fail, skipped }
        }

        if (processedFiles % 10 === 0) {
          await updateJobProgressSafe({
            supabase,
            jobId,
            message: `running: drive processing ${String(f.name || '') || '(unnamed)'} processed=${processedFiles} ok=${success} fail=${fail} skipped=${skipped}`,
          })
          logv('[rag/run][drive] processing', {
            name: String(f.name || ''),
            mime: String(f.mimeType || ''),
            processedFiles,
            ok: success,
            fail,
            skipped,
          })
        }

        if (processedFiles % 25 === 0) {
          await updateJobProgressSafe({
            supabase,
            jobId,
            message: `running: drive processed=${processedFiles} ok=${success} fail=${fail} skipped=${skipped} folders=${visitedFolders.size}`,
          })
        }
        // If embeddings are currently in backoff, surface that so the UI explains the slowdown.
        if (Date.now() < embedBackoffUntilMs) {
          await updateJobProgressSafe({
            supabase,
            jobId,
            message: `running: drive (embeddings paused ~${Math.ceil((embedBackoffUntilMs - Date.now()) / 1000)}s) processed=${processedFiles} ok=${success} fail=${fail} skipped=${skipped}`,
          })
        }
        const rawId = String(f.id || '')
        const name = String(f.name || '')
        const mimeType = String(f.mimeType || '')
        if (!rawId) continue

        // Recurse into subfolders
        if (mimeType === 'application/vnd.google-apps.folder') {
          folderQueue.push(rawId)
          continue
        }

        // Resolve shortcuts
        let fileId = rawId
        let effectiveMime = mimeType
        const shortcutTargetId = (f as any)?.shortcutDetails?.targetId
        const shortcutTargetMime = (f as any)?.shortcutDetails?.targetMimeType
        if (mimeType === 'application/vnd.google-apps.shortcut' && shortcutTargetId) {
          fileId = String(shortcutTargetId)
          if (shortcutTargetMime) effectiveMime = String(shortcutTargetMime)
        }

        const url = driveFileWebUrl(fileId)

        // DELTA: skip if recently crawled OK (treat each file like an explicit URL)
        if (mode === 'delta') {
          const skip = await shouldSkipDelta({
            supabase,
            agentId,
            url,
            deltaWindowHours,
          })
          if (skip) {
            skipped++
            continue
          }
        }

        // FULL: clear existing docs for this file URL
        if (mode === 'full') {
          await clearExistingPageDocs({ supabase, agentId, url })
        }

        try {
          const { text } = await downloadDriveFileText({
            drive,
            fileId,
            mimeType: effectiveMime,
          })

          if (!text || text.length < 20) {
            skipped++
            await supabase.from('rag_pages').upsert(
              {
                agent_id: agentId || null,
                url,
                title: name || null,
                page_type: 'drive',
                last_crawled_at: new Date().toISOString(),
                status: 'no_text',
                error: 'NO_TEXT_OR_UNSUPPORTED',
              },
              { onConflict: 'url' }
            )
            continue
          }

          await supabase.from('rag_pages').upsert(
            {
              agent_id: agentId || null,
              url,
              title: name || null,
              page_type: 'drive',
              last_crawled_at: new Date().toISOString(),
              status: 'ok',
              error: null,
            },
            { onConflict: 'url' }
          )

          const chunks = chunkText(text)
          logv('[rag/run][drive] chunked', { name, chunks: chunks.length })
          await updateJobProgressSafe({
            supabase,
            jobId,
            message: `running: drive file ${name} chunks=${chunks.length} (embedding...)`,
          })

          for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
            const batch = chunks.slice(i, i + EMBED_BATCH_SIZE)
            const vecs = await embedTexts(batch)
            if (RAG_VERBOSE) {
              const okVecs = vecs.filter((v) => Array.isArray(v) && v.length > 0).length
              console.log('[rag/run][drive][embed]', {
                file: name,
                batch: `${i + 1}-${Math.min(i + batch.length, chunks.length)} of ${chunks.length}`,
                batchSize: batch.length,
                okVecs,
              })
            }

            for (let j = 0; j < batch.length; j++) {
              const chunk = batch[j]
              const vec = vecs[j] || null

              const { data: docRow } = await supabase
                .from('rag_documents')
                .insert({
                  job_id: jobId,
                  agent_id: agentId || null,
                  source_type: 'drive',
                  source_url: url,
                  title: name || null,
                  raw_text: null,
                  meta: {
                    drive_folder_id: folderId,
                    drive_file_id: fileId,
                    drive_name: name,
                    mimeType: effectiveMime,
                    source: folderUrl,
                  },
                  content: chunk,
                  embedding: vec,
                  http_status: 200,
                  error_code: vec ? null : 'EMBED_FAIL',
                })
                .select('id')
                .single()

              if (docRow?.id) {
                await supabase.from('rag_chunks').insert({
                  document_id: docRow.id,
                  agent_id: agentId || null,
                  content: chunk,
                  tokens: estimateTokens(chunk),
                })
              }
            }

            // periodic heartbeat
            if ((i / EMBED_BATCH_SIZE) % 4 === 0) {
              await updateJobProgressSafe({
                supabase,
                jobId,
                message: `running: drive file ${name} embedded=${Math.min(i + batch.length, chunks.length)}/${chunks.length}`,
              })
            }
          }

          await updateJobProgressSafe({
            supabase,
            jobId,
            message: `running: drive file done ${name} chunks=${chunks.length}`,
          })

          success++
        } catch (e: any) {
          const msg = String(e?.message || e)
          const isPdfParse = msg.startsWith('PDF_PARSE_FAILED:')

          if (isPdfParse) skipped++
          else fail++

          console.warn('[rag/run] drive file ingest failed:', name, effectiveMime, msg)

          await supabase.from('rag_pages').upsert(
            {
              agent_id: agentId || null,
              url,
              title: name || null,
              page_type: 'drive',
              last_crawled_at: new Date().toISOString(),
              status: isPdfParse ? 'no_text' : 'error',
              error: msg.slice(0, 240),
            },
            { onConflict: 'url' }
          )
        }
      }

      pageToken = resp.data.nextPageToken || undefined
      if (!pageToken) break
    }
  }

  console.log('[rag/run] drive ingest summary:', {
    folderId,
    success,
    fail,
    skipped,
    foldersVisited: visitedFolders.size,
  })

  await updateJobProgressSafe({
    supabase,
    jobId,
    message: `running: drive done ok=${success} fail=${fail} skipped=${skipped} folders=${visitedFolders.size}`,
  })

  return { success, fail, skipped }
}

/**
 * Crawl one pattern (exact URL or wildcard) up to maxDepth/maxPages,
 * chunk & embed content, and write into rag_documents.
 *
 * patternUrl stays as the stored source_url for analytics, but we
 * crawl individual page URLs under the hood.
 */
async function crawlUrlTree(opts: {
  supabase: any
  jobId: string
  agentId: string
  patternUrl: string
  maxDepth: number
  maxPages: number
  mode: 'delta' | 'full'
  deltaWindowHours: number
}): Promise<{ success: number; fail: number; skipped: number }> {
  const { supabase, jobId, agentId, patternUrl, maxDepth, maxPages, mode, deltaWindowHours } = opts

  const rawPattern = (patternUrl || '').trim()
  if (!rawPattern) return { success: 0, fail: 0, skipped: 0 }

  // Track whether the *input pattern* was a wildcard.
  const patternWasWildcard = rawPattern.endsWith('*')

  let base = rawPattern

  // Normalize wildcard patterns like https://site.com/* → https://site.com/
  if (base.endsWith('*')) {
    base = base.replace(/\*+$/, '')
    if (!base.endsWith('/')) {
      base += '/'
    }
  }

  const queue: { url: string; depth: number }[] = [{ url: base, depth: 0 }]

  // If a help center root is blocked, the /hc/en-us/ path often works better.
  const helpCenterFallback = (() => {
    try {
      const u = new URL(base)
      if (u.hostname.startsWith('support.') && (u.pathname === '/' || u.pathname === '')) {
        u.pathname = '/hc/en-us/'
        u.hash = ''
        return u.toString()
      }
    } catch {}
    return null
  })()

  const visited = new Set<string>()
  let pagesCrawled = 0
  let success = 0
  let fail = 0
  let skipped = 0

  while (queue.length && pagesCrawled < maxPages) {
    const { url, depth } = queue.shift()!

    if (visited.has(url)) continue
    visited.add(url)

    console.log('[rag/run] Fetching URL:', url)
    logv('[rag/run][web] fetching', { url, depth, pagesCrawled, ok: success, fail, skipped })

    // Lightweight progress signal (helps UI polling / debugging without schema changes)
    try {
      await updateJobProgressSafe({
        supabase,
        jobId,
        message: `running: web processed=${pagesCrawled} ok=${success} fail=${fail} skipped=${skipped}`,
      })
    } catch {
      // non-fatal
    }

    // DELTA MODE:
    // - For explicit URLs, we use a freshness window (recent OK crawls are skipped).
    // - For wildcard patterns, we use a *snapshot* rule: if we've *ever* crawled the URL successfully
    //   (status=ok in rag_pages), we skip it. This avoids re-scraping the full site on every “Sync New/Changed”.
    //   If content behind a wildcard changes, users must run a full resync.
    if (mode === 'delta') {
      if (patternWasWildcard) {
        try {
          const { data: pageRow, error: pageErr } = await supabase
            .from('rag_pages')
            .select('status')
            .eq('agent_id', agentId)
            .eq('url', url)
            .maybeSingle()

          if (!pageErr && pageRow?.status === 'ok') {
            skipped++
            continue
          }
        } catch {
          // fall through to crawl
        }
      } else {
        const skip = await shouldSkipDelta({
          supabase,
          agentId,
          url,
          deltaWindowHours,
        })
        if (skip) {
          skipped++
          continue
        }
      }
    }

    // FULL MODE: avoid duplicate documents by clearing existing docs/chunks for this exact page.
    if (mode === 'full') {
      await clearExistingPageDocs({ supabase, agentId, url })
    }

    const resp = await fetchHTML(url)
    const status = resp.status

    if (resp.error || !resp.html) {
      const errMsg = resp.error || `HTTP ${status}`

      // If blocked at the support root, try the /hc/en-us/ fallback once.
      if ((status === 403 || errMsg.includes('HTTP 403')) && helpCenterFallback && url === base) {
        console.warn('[rag/run] blocked at support root, retrying fallback:', helpCenterFallback)
        queue.unshift({ url: helpCenterFallback, depth })
        continue
      }

      console.warn('[rag/run] URL failed:', url, errMsg)
      fail++

      // Best-effort: keep a minimal document row for debugging/analytics
      await supabase.from('rag_documents').insert({
        job_id: jobId,
        agent_id: agentId || null,
        source_type: 'url',
        source_url: url,
        title: null,
        raw_text: null,
        meta: { pattern: patternUrl },
        content: null,
        embedding: null,
        http_status: status,
        error_code: errMsg,
      })

      // Track crawl status in rag_pages (safe even if table has unique(url) only)
      await supabase.from('rag_pages').upsert(
        {
          agent_id: agentId || null,
          url,
          title: null,
          page_type: 'crawl',
          last_crawled_at: new Date().toISOString(),
          status: status === 403 ? 'blocked' : 'error',
          error: errMsg,
        },
        { onConflict: 'url' }
      )

      continue
    }

    const title = extractTitle(resp.html)
    const text = extractText(resp.html)

    if (!text || text.length < 20) {
      console.warn('[rag/run] URL had no readable text:', url)
      fail++

      await supabase.from('rag_documents').insert({
        job_id: jobId,
        agent_id: agentId || null,
        source_type: 'url',
        source_url: url,
        title,
        raw_text: null,
        meta: { pattern: patternUrl },
        content: null,
        embedding: null,
        http_status: status,
        error_code: 'NO_TEXT',
      })

      await supabase.from('rag_pages').upsert(
        {
          agent_id: agentId || null,
          url,
          title,
          page_type: 'crawl',
          last_crawled_at: new Date().toISOString(),
          status: 'no_text',
          error: 'NO_TEXT',
        },
        { onConflict: 'url' }
      )

      continue
    }

    // Record page success (one row per page)
    await supabase.from('rag_pages').upsert(
      {
        agent_id: agentId || null,
        url,
        title,
        page_type: 'crawl',
        last_crawled_at: new Date().toISOString(),
        status: 'ok',
        error: null,
      },
      { onConflict: 'url' }
    )

    const chunks = chunkText(text)

    for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBED_BATCH_SIZE)
      const vecs = await embedTexts(batch)

      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j]
        const vec = vecs[j] || null

        const { data: docRow } = await supabase
          .from('rag_documents')
          .insert({
            job_id: jobId,
            agent_id: agentId || null,
            source_type: 'url',
            source_url: url, // store the actual page URL
            title,
            raw_text: null,
            meta: { pattern: patternUrl, text_len: text.length },
            content: chunk,
            embedding: vec,
            http_status: status,
            error_code: vec ? null : 'EMBED_FAIL',
          })
          .select('id')
          .single()

        if (docRow?.id) {
          await supabase.from('rag_chunks').insert({
            document_id: docRow.id,
            agent_id: agentId || null,
            content: chunk,
            tokens: estimateTokens(chunk),
          })
        }
      }
    }

    success++
    pagesCrawled++

    // If we still have depth budget, enqueue internal links for the next layer
    if (depth < maxDepth) {
      const links = extractLinks(resp.html, url)
      for (const link of links) {
        if (!visited.has(link)) {
          queue.push({ url: link, depth: depth + 1 })
        }
      }
    }
  }

  return { success, fail, skipped }
}

// ----------------------------------------------
// MAIN WORKER
// ----------------------------------------------

export async function POST(req: Request) {
  const supabase = await getSupabaseAdmin()

  // Optional: allow UI to run jobs for a specific agent (clears that agent's backlog).
  let targetAgentId: string | null = null
    let targetJobId: string | null = null
  let maxJobs = 10
  let mode: 'delta' | 'full' = 'full'
  let deltaWindowHours = DEFAULT_DELTA_WINDOW_HOURS
  let driveMaxFiles = DRIVE_MAX_FILES_DEFAULT
  let driveMaxFolders = DRIVE_MAX_FOLDERS_DEFAULT
  let driveMaxSeconds = DRIVE_MAX_SECONDS_DEFAULT

  try {
    const body = await req.json().catch(() => ({} as any))

    if (body && typeof body.agent_id === 'string' && body.agent_id.trim()) {
      targetAgentId = body.agent_id.trim()
    }

    if (body && typeof body.job_id === 'string' && body.job_id.trim()) {
      targetJobId = body.job_id.trim()
    }

    if (body && typeof body.max_jobs === 'number' && Number.isFinite(body.max_jobs)) {
      maxJobs = Math.max(1, Math.min(50, Math.floor(body.max_jobs)))
    }

    if (body && typeof body.mode === 'string') {
      const m = body.mode.toLowerCase()
      if (m === 'delta' || m === 'full') mode = m
    }

    if (body && typeof body.delta_window_hours === 'number' && Number.isFinite(body.delta_window_hours)) {
      deltaWindowHours = Math.max(1, Math.min(24 * 30, Math.floor(body.delta_window_hours)))
    }
    // Optional Drive soft-limits (to prevent a single run from looking “hung”)
    if (body && typeof body.drive_max_files === 'number' && Number.isFinite(body.drive_max_files)) {
      driveMaxFiles = Math.max(1, Math.min(50_000, Math.floor(body.drive_max_files)))
    }
    if (body && typeof body.drive_max_folders === 'number' && Number.isFinite(body.drive_max_folders)) {
      driveMaxFolders = Math.max(1, Math.min(20_000, Math.floor(body.drive_max_folders)))
    }
    if (body && typeof body.drive_max_seconds === 'number' && Number.isFinite(body.drive_max_seconds)) {
      driveMaxSeconds = Math.max(30, Math.min(6 * 60 * 60, Math.floor(body.drive_max_seconds)))
    }
  } catch {
    // ignore body parse errors; keep defaults
  }

  // 1) Select runnable jobs.
  // After a server restart, a job may still be marked as "running" in the DB.
  // We allow resuming queued/pending/running jobs.
  let jobs: any[] = []

  if (targetJobId) {
    const { data: one, error: oneErr } = await supabase
      .from('rag_jobs')
      .select('*')
      .eq('id', targetJobId)
      .maybeSingle()

    if (oneErr || !one) {
      return NextResponse.json({ ok: false, error: 'Job not found.' }, { status: 404 })
    }

    if (targetAgentId && one.agent_id !== targetAgentId) {
      return NextResponse.json({ ok: false, error: 'Job does not belong to that agent.' }, { status: 400 })
    }

    jobs = [one]
  } else {
    let q = supabase
      .from('rag_jobs')
      .select('*')
      .in('status', ['queued', 'pending', 'running'])
      .order('created_at', { ascending: true })

    if (targetAgentId) {
      q = q.eq('agent_id', targetAgentId)
    }

    const { data: rows, error: jobErr } = await q.limit(maxJobs)

    if (jobErr || !rows || rows.length === 0) {
      console.log('[rag/run] No queued/pending/running RAG jobs to run.', {
        agent_id: targetAgentId || null,
        mode,
      })
      return NextResponse.json({ ok: true, data: { message: `No runnable RAG jobs. (mode=${mode})` } })
    }

    jobs = rows
  }

  const results: any[] = []
  for (const job of jobs) {
    const jobId = job.id as string
    const agentId = job.agent_id as string

    console.log('[rag/run] Running job:', jobId)

    // If a previous run was interrupted, the job may be stuck in "running".
    // If it hasn't updated recently, reset to pending so it can be resumed.
    const createdAtMs = job.created_at ? new Date(job.created_at).getTime() : 0
    const updatedAtMs = job.updated_at ? new Date(job.updated_at).getTime() : 0
    const lastTouch = Math.max(createdAtMs, updatedAtMs)
    const ageMs = lastTouch ? Date.now() - lastTouch : Number.POSITIVE_INFINITY
    const STALE_MS = 2 * 60 * 1000

    if (String(job.status || '').toLowerCase() === 'running' && ageMs > STALE_MS) {
      console.log('[rag/run] Detected stale running job, resetting to pending for resume:', jobId)
      await supabase
        .from('rag_jobs')
        .update({ status: 'pending', error: null, updated_at: new Date().toISOString() })
        .eq('id', jobId)
      job.status = 'pending'
    }

    // Mark job as running now.
    await supabase
      .from('rag_jobs')
      .update({ status: 'running', error: '', updated_at: new Date().toISOString() })
      .eq('id', jobId)

    // 2. Fetch agent so we know which URLs to crawl
    const { data: agent } = await supabase
      .from('agents')
      .select('crawl_domains, rag_sources')
      .eq('id', agentId)
      .single()

    const rawUrls: string[] = [
      ...(agent?.crawl_domains || []),
      ...(agent?.rag_sources || []),
    ]
      .map((u: any) => String(u).trim())
      .filter(Boolean)

    // De-dupe while preserving order
    const seen = new Set<string>()
    const urls: string[] = []
    for (const u of rawUrls) {
      if (seen.has(u)) continue
      seen.add(u)
      urls.push(u)
    }

    // Split sources so Google Drive runs first (fast proof-of-life)
    const isDriveFolder = (u: string) => u.includes('drive.google.com/drive/folders/')
    const driveFirst = urls.filter(isDriveFolder)
    const nonDrive = urls.filter((u) => !isDriveFolder(u))

    // Let the UI show an immediate, human-readable clue
    await updateJobProgressSafe({
      supabase,
      jobId,
      message: `running: sources drive_folders=${driveFirst.length} other_sources=${nonDrive.length}`,
    })

    let totalSuccess = 0
    let totalFail = 0
    let totalSkipped = 0

    // 3. Run Google Drive first (proof-of-life), then crawl URLs.
    for (const folderUrl of driveFirst) {
      console.log('[rag/run] ingesting drive folder:', folderUrl)

      await updateJobProgressSafe({
        supabase,
        jobId,
        message: `running: drive start source=${folderUrl}`,
      })

      const { success, fail, skipped } = await ingestDriveFolder({
        supabase,
        jobId,
        agentId,
        folderUrl,
        mode,
        deltaWindowHours,
        maxFiles: driveMaxFiles,
        maxFolders: driveMaxFolders,
        maxSeconds: driveMaxSeconds,
      })

      totalSuccess += success
      totalFail += fail
      totalSkipped += skipped

      await updateJobProgressSafe({
        supabase,
        jobId,
        message: `running: drive done ok=${success} fail=${fail} skipped=${skipped}`,
      })
    }

    for (const pattern of nonDrive) {
      const isWildcard = pattern.endsWith('*')

      // Depth & page limits:
      // - wildcard: crawl base + internal links (depth 2, up to 50 pages)
      // - exact URL: crawl that one page only (depth 0, 1 page)
      const maxDepth = isWildcard ? 2 : 0
      const maxPages = isWildcard ? 50 : 1

      const { success, fail, skipped } = await crawlUrlTree({
        supabase,
        jobId,
        agentId,
        patternUrl: pattern,
        maxDepth,
        maxPages,
        mode,
        deltaWindowHours,
      })

      totalSuccess += success
      totalFail += fail
      totalSkipped += skipped
    }

    // 4. Mark job as completed/error
    const isAllFailed = totalFail > 0 && totalSuccess === 0
    await supabase
      .from('rag_jobs')
      .update({
        status: isAllFailed ? 'error' : 'completed',
        // Clear progress text; only store error codes when something actually failed.
        error: isAllFailed ? 'all_pages_failed' : totalFail > 0 ? 'partial_failures' : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    results.push({
      job_id: jobId,
      agent_id: agentId,
      mode,
      delta_window_hours: mode === 'delta' ? deltaWindowHours : null,
      successCount: totalSuccess,
      skippedCount: totalSkipped,
      failCount: totalFail,
      message: `RAG job completed (${mode}${mode === 'delta' ? (agent?.crawl_domains?.some((u: any) => String(u || '').trim().endsWith('*')) ? '/snapshot' : '') : ''}). Pages crawled: ${totalSuccess}, skipped: ${totalSkipped}, failures: ${totalFail}.`,
    })
  }

  const lastJobId = results.length ? results[results.length - 1].job_id : null

  return NextResponse.json({
    ok: true,
    data: {
      jobs: results,
      last_job_id: lastJobId,
    },
  })
}