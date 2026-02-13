import { redirect } from 'next/navigation'

type ParamsPromise = Promise<{ id: string }>

export default async function AgentEditRedirect(props: { params: ParamsPromise }) {
  const { id } = await props.params
  // Always send /agents/:id to the unified Summary page
  redirect(`/agents/${id}/summary`)
}