#!/usr/bin/env node

import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..', '..')

function run(command) {
  try {
    return execSync(command, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  } catch (error) {
    if (error && typeof error === 'object' && 'stdout' in error) {
      const stdout = String(error.stdout || '').trim()
      if (stdout) return stdout
    }
    return ''
  }
}

function parseChangedFiles(statusText) {
  if (!statusText) return []
  const files = []
  for (const line of statusText.split('\n')) {
    const trimmed = line.trimEnd()
    if (!trimmed) continue
    const match = trimmed.match(/^.{2}\s+(.*)$/)
    if (!match?.[1]) continue
    files.push(match[1].trim())
  }
  return files
}

function formatList(items, emptyText = '- None') {
  if (!items.length) return emptyText
  return items.map((item) => `- ${item}`).join('\n')
}

const statusShort = run('git status --short')
const changedFiles = parseChangedFiles(statusShort)
const diffStat = run('git diff --stat')
const docsUpdated = changedFiles.filter((file) => file.startsWith('ai-agent-platform-docs/'))

const output = `PM REVIEW PACKET

1. Outcome
- [Fill: short paragraph summarizing what was completed.]

2. Files changed
${formatList(changedFiles)}

Diff stat (auto)
${diffStat ? diffStat : '(no unstaged diff stat available)'}

3. Per-file change summary
- [For each changed file: what changed, why it changed, classification tags.]
- Classification tags:
  - schema
  - api contract
  - runtime logic
  - analytics/data
  - docs only
  - no user-visible behavior
  - user-visible behavior

4. Public contract changes
- [Fill: None or list API request/response changes.]

5. Schema changes
- [Fill: None or list tables/columns/indexes/RLS changed.]

6. Risk notes
- [Fill: None or list remaining risks/edge cases/deferred items.]

7. Validation
- Lint: [Fill]
- Typecheck: [Fill]
- Manual verification: [Fill]

8. Docs updated
${formatList(docsUpdated)}

9. UI impact
- [Choose one: None | Indirect only | User-visible (specify where)]

10. Recommended PM next step
- [Suggestion 1]
- [Suggestion 2]
- [Suggestion 3]
`

process.stdout.write(`${output}\n`)
