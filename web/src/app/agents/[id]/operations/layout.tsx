import type { ReactNode } from 'react'
import DashboardLayout from '@/app/components/DashboardLayout'
import OperationsWorkspaceShell from '@/components/runtime/OperationsWorkspaceShell'

type ParamsPromise = Promise<{ id: string }>

export default async function OperationsLayout(props: {
  params: ParamsPromise
  children: ReactNode
}) {
  const { id } = await props.params

  return (
    <DashboardLayout>
      <OperationsWorkspaceShell agentId={id}>{props.children}</OperationsWorkspaceShell>
    </DashboardLayout>
  )
}
