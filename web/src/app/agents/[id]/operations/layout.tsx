import type { ReactNode } from 'react'
import DashboardLayout from '@/app/components/DashboardLayout'
import { DecisionWorkspaceActionProvider } from '@/components/runtime/DecisionWorkspaceActionContext'
import { DecisionWorkspacePresentationProvider } from '@/components/runtime/DecisionWorkspacePresentationContext'
import OperationsWorkspaceShell from '@/components/runtime/OperationsWorkspaceShell'
import { gmailDecisionWorkspacePresentation } from '@/lib/integrations/gmail/gmailDecisionWorkspacePresentation'

type ParamsPromise = Promise<{ id: string }>

export default async function OperationsLayout(props: {
  params: ParamsPromise
  children: ReactNode
}) {
  const { id } = await props.params

  return (
    <DashboardLayout>
      <div className="app-page-stack">
        <DecisionWorkspacePresentationProvider presentation={gmailDecisionWorkspacePresentation}>
          <DecisionWorkspaceActionProvider adapterId="gmail">
            <OperationsWorkspaceShell agentId={id} decisionWorkspaceReadAdapterId="gmail">
              {props.children}
            </OperationsWorkspaceShell>
          </DecisionWorkspaceActionProvider>
        </DecisionWorkspacePresentationProvider>
      </div>
    </DashboardLayout>
  )
}
