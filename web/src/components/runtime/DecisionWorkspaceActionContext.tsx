'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { gmailDecisionWorkspaceActionAdapter } from '@/lib/integrations/gmail/gmailDecisionWorkspaceActionAdapter'
import type {
  DecisionWorkspaceActionAdapter,
  DecisionWorkspaceActionAdapterId,
} from '@/lib/runtime/decisionWorkspaceActionModel'

const DecisionWorkspaceActionContext = createContext<DecisionWorkspaceActionAdapter | null>(null)

function resolveAdapter(adapterId: DecisionWorkspaceActionAdapterId): DecisionWorkspaceActionAdapter {
  if (adapterId === 'gmail') return gmailDecisionWorkspaceActionAdapter
  const exhaustive: never = adapterId
  throw new Error(`Unsupported decision workspace action adapter: ${exhaustive}`)
}

export function DecisionWorkspaceActionProvider(props: {
  adapterId: DecisionWorkspaceActionAdapterId
  children: ReactNode
}) {
  const adapter = useMemo(() => resolveAdapter(props.adapterId), [props.adapterId])
  return (
    <DecisionWorkspaceActionContext.Provider value={adapter}>
      {props.children}
    </DecisionWorkspaceActionContext.Provider>
  )
}

export function useDecisionWorkspaceActions(): DecisionWorkspaceActionAdapter {
  const adapter = useContext(DecisionWorkspaceActionContext)
  if (!adapter) {
    throw new Error('DecisionWorkspaceActionProvider is required for Operations action surfaces.')
  }
  return adapter
}
