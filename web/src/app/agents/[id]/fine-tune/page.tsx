import { redirect } from 'next/navigation'

type ParamsPromise = Promise<{ id: string }>

export default async function AgentFineTuneRedirect(props: { params: ParamsPromise }) {
  const { id } = await props.params
  redirect(`/agents/${id}/summary`)
}
