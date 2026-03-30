import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const loaderDir = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(loaderDir, '..')
const srcRoot = path.join(webRoot, 'src')
const KNOWN_EXTENSIONS = ['.ts', '.tsx', '.js', '.mjs', '.json']

function hasKnownExtension(value) {
  return KNOWN_EXTENSIONS.some((extension) => value.endsWith(extension))
}

function candidatePaths(basePath) {
  if (hasKnownExtension(basePath)) return [basePath]
  return [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.mjs'),
  ]
}

function resolveAliasPath(specifier) {
  if (!specifier.startsWith('@/')) return null
  const aliasBase = path.join(srcRoot, specifier.slice(2))
  for (const candidate of candidatePaths(aliasBase)) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate
    }
  }
  return null
}

export async function resolve(specifier, context, defaultResolve) {
  const aliasPath = resolveAliasPath(specifier)
  if (aliasPath) {
    return {
      shortCircuit: true,
      url: pathToFileURL(aliasPath).href,
    }
  }
  return defaultResolve(specifier, context, defaultResolve)
}
