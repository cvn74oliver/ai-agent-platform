'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useOperationsRuntime } from '@/components/runtime/OperationsRuntimeContext'
import { gmailDecisionWorkspaceReadAdapter } from '@/lib/integrations/gmail/gmailDecisionWorkspaceReadAdapter'
import {
  type DecisionReviewProgressReadModel,
  type DecisionWorkspaceReadAdapter,
  type DecisionWorkspaceReadAdapterId,
  type DecisionWorkspaceReadAdapterInput,
  type DecisionWorkspaceIntelligenceReadService,
  type DecisionWorkspaceItemOverviewReadService,
  type DecisionWorkspaceManagementReadService,
  type DecisionWorkspaceReviewGroupsReadModel,
} from '@/lib/runtime/decisionWorkspaceReadModel'

type DecisionWorkspaceReadContextValue = Readonly<{
  adapterId: DecisionWorkspaceReadAdapterId
  intelligence: DecisionWorkspaceIntelligenceReadService
  itemOverview: DecisionWorkspaceItemOverviewReadService
  management: DecisionWorkspaceManagementReadService
  reviewGroups: DecisionWorkspaceReviewGroupsReadModel
}>

const DecisionWorkspaceReadContext = createContext<DecisionWorkspaceReadContextValue | null>(null)

const EMPTY_PROGRESS: DecisionReviewProgressReadModel = {
  latestGroupId: null,
  startedGroupCount: 0,
  startedGroupIds: [],
}

function resolveAdapter(adapterId: DecisionWorkspaceReadAdapterId): DecisionWorkspaceReadAdapter {
  if (adapterId === 'gmail') return gmailDecisionWorkspaceReadAdapter
  const exhaustive: never = adapterId
  throw new Error(`Unsupported decision workspace read adapter: ${exhaustive}`)
}

function sameProgress(
  left: DecisionReviewProgressReadModel,
  right: DecisionReviewProgressReadModel
): boolean {
  return (
    left.latestGroupId === right.latestGroupId &&
    left.startedGroupCount === right.startedGroupCount &&
    left.startedGroupIds.length === right.startedGroupIds.length &&
    left.startedGroupIds.every((id, index) => id === right.startedGroupIds[index])
  )
}

export function DecisionWorkspaceReadProvider(props: {
  adapterId: DecisionWorkspaceReadAdapterId
  agentId: string
  requestedSessionId: string | null
  children: ReactNode
}) {
  const runtime = useOperationsRuntime()
  const adapter = useMemo(() => resolveAdapter(props.adapterId), [props.adapterId])
  const [progress, setProgress] = useState<DecisionReviewProgressReadModel>(EMPTY_PROGRESS)
  const input = useMemo<DecisionWorkspaceReadAdapterInput>(
    () => ({
      agentId: props.agentId,
      requestedSessionId: props.requestedSessionId,
      runtimeSessionId: runtime.sessionId,
      analysisScopeId: runtime.analysisScope,
      runtimeData: runtime.data,
      loading: runtime.loading,
      error: runtime.error,
      observedAt: runtime.loadedAt,
    }),
    [
      props.agentId,
      props.requestedSessionId,
      runtime.analysisScope,
      runtime.data,
      runtime.error,
      runtime.loadedAt,
      runtime.loading,
      runtime.sessionId,
    ]
  )
  const reviewGroups = useMemo(
    () => adapter.projectReviewGroups(input, progress),
    [adapter, input, progress]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const syncProgress = () => {
      const next = adapter.readReviewGroupsProgress(input, reviewGroups)
      setProgress((current) => (sameProgress(current, next) ? current : next))
    }
    syncProgress()
    window.addEventListener('storage', syncProgress)
    window.addEventListener('focus', syncProgress)
    return () => {
      window.removeEventListener('storage', syncProgress)
      window.removeEventListener('focus', syncProgress)
    }
  }, [adapter, input, reviewGroups])

  const value = useMemo<DecisionWorkspaceReadContextValue>(
    () => ({
      adapterId: props.adapterId,
      intelligence: adapter.intelligence,
      itemOverview: adapter.itemOverview,
      management: adapter.management,
      reviewGroups,
    }),
    [adapter.intelligence, adapter.itemOverview, adapter.management, props.adapterId, reviewGroups]
  )

  return (
    <DecisionWorkspaceReadContext.Provider value={value}>
      {props.children}
    </DecisionWorkspaceReadContext.Provider>
  )
}

export function useDecisionWorkspaceRead(): DecisionWorkspaceReadContextValue {
  const context = useContext(DecisionWorkspaceReadContext)
  if (!context) {
    throw new Error('useDecisionWorkspaceRead must be used inside DecisionWorkspaceReadProvider.')
  }
  return context
}
