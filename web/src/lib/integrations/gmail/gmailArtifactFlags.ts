function readBooleanEnv(name: string): boolean {
  const value = process.env[name]
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

export const GMAIL_ARTIFACT_FLAG_ENV = {
  shadow_publish: 'GMAIL_ARTIFACT_SHADOW_PUBLISH_ENABLED',
  seed_reads: 'GMAIL_ARTIFACT_SEED_READS_ENABLED',
  intelligence_reads: 'GMAIL_ARTIFACT_INTELLIGENCE_READS_ENABLED',
  preview_reads: 'GMAIL_ARTIFACT_PREVIEW_READS_ENABLED',
  runtime_background_refresh: 'GMAIL_ARTIFACT_RUNTIME_BACKGROUND_REFRESH_ENABLED',
} as const

export type GmailArtifactFlagName = keyof typeof GMAIL_ARTIFACT_FLAG_ENV

export function isGmailArtifactFlagEnabled(flag: GmailArtifactFlagName): boolean {
  return readBooleanEnv(GMAIL_ARTIFACT_FLAG_ENV[flag])
}

export function getGmailArtifactFlagSnapshot(): Record<GmailArtifactFlagName, boolean> {
  return {
    shadow_publish: isGmailArtifactFlagEnabled('shadow_publish'),
    seed_reads: isGmailArtifactFlagEnabled('seed_reads'),
    intelligence_reads: isGmailArtifactFlagEnabled('intelligence_reads'),
    preview_reads: isGmailArtifactFlagEnabled('preview_reads'),
    runtime_background_refresh: isGmailArtifactFlagEnabled('runtime_background_refresh'),
  }
}
