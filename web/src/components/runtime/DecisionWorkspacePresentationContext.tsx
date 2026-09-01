'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { DecisionWorkspacePresentationDefinition } from '@/lib/runtime/decisionWorkspacePresentation'

const DecisionWorkspacePresentationContext = createContext<
  DecisionWorkspacePresentationDefinition | null
>(null)

export function DecisionWorkspacePresentationProvider(props: {
  presentation: DecisionWorkspacePresentationDefinition
  children: ReactNode
}) {
  return (
    <DecisionWorkspacePresentationContext.Provider value={props.presentation}>
      {props.children}
    </DecisionWorkspacePresentationContext.Provider>
  )
}

export function useDecisionWorkspacePresentation(): DecisionWorkspacePresentationDefinition {
  const presentation = useContext(DecisionWorkspacePresentationContext)
  if (!presentation) {
    throw new Error(
      'Decision workspace presentation context is missing. Wrap the Operations route in DecisionWorkspacePresentationProvider.'
    )
  }
  return presentation
}
