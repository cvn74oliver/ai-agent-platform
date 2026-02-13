export function normalizeTopic(raw: string): string {
  if (!raw) return ''

  // Base normalization: stable canonical key formatting
  let t = raw.trim().toLowerCase()
  t = t.replace(/[\s/]+/g, '_')
  t = t.replace(/-+/g, '_')
  t = t.replace(/[^a-z0-9_]/g, '')
  t = t.replace(/_+/g, '_')
  t = t.replace(/^_+|_+$/g, '')

  if (
    t.startsWith('contamination_') ||
    t.includes('contamination') ||
    t === 'contamination_support' ||
    t === 'contamination_issue_resolution'
  ) {
    return 'contamination_in_grow_bags'
  }

  if (
    t === 'mission_statement' ||
    t === 'customer_support_mission' ||
    t.includes('mission') ||
    t.includes('identity')
  ) {
    return 'agent_identity_and_mission'
  }

  if (t.includes('tone') || t.includes('style')) {
    return 'tone_and_style'
  }

  if (t.includes('escalation') || t.includes('handoff')) {
    return 'escalation_and_handoff_rules'
  }

  if (t.includes('legal') || t.includes('compliance') || t.includes('guardrail')) {
    return 'legal_and_compliance_guardrails'
  }

  return t
}