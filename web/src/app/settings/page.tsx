import DashboardLayout from '@/app/components/DashboardLayout'
import { appButtonClassName } from '@/components/ui/app-button'
import PageHeader from '@/components/ui/page-header'
import StatePanel from '@/components/ui/state-panel'
import StatusBadge from '@/components/ui/status-badge'
import SurfaceCard from '@/components/ui/surface-card'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  let gmailConnected = false
  if (profile?.tenant_id) {
    const { data: gmailConnection } = await supabase
      .from('integration_connections')
      .select('id')
      .eq('tenant_id', profile.tenant_id)
      .eq('provider', 'gmail')
      .maybeSingle()

    gmailConnected = Boolean(gmailConnection?.id)
  }

  return (
    <DashboardLayout>
      <div className="app-page-stack">
        <PageHeader
          eyebrow="Settings"
          title="Workspace settings"
          description="Manage the integrations and baseline platform configuration that support every workspace surface."
          tone="hero"
          actions={
            !gmailConnected ? (
              <a href="/api/integrations/gmail/start" className={appButtonClassName({ variant: 'primary', size: 'md' })}>
                Connect Gmail
              </a>
            ) : undefined
          }
        />

        <SurfaceCard className="max-w-3xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="app-eyebrow">Integrations</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Company integrations</h2>
              <p className="mt-3 text-sm text-gray-300">
                Gmail is the current workspace implementation and remains the main integration managed from this screen.
              </p>
            </div>
            <StatusBadge
              label={gmailConnected ? 'Connected' : 'Not Connected'}
              tone={gmailConnected ? 'success' : 'neutral'}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
            <StatePanel
              tone={gmailConnected ? 'success' : 'warning'}
              title={`Gmail is ${gmailConnected ? 'connected' : 'not connected'}`}
              description={
                gmailConnected
                  ? 'The Gmail workspace can continue using indexed mailbox data, operations surfaces, and decision management.'
                  : 'Connect Gmail to unlock the current workspace implementation and its operations workflow.'
              }
            />

            <SurfaceCard className="border-white/[0.05] bg-[var(--app-surface-nested)] p-5 shadow-[0_16px_40px_rgba(2,6,23,0.18)]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Available action</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {gmailConnected ? 'Reconnect or review Gmail access' : 'Connect Gmail to this workspace'}
              </p>
              <p className="mt-3 text-sm leading-6 text-gray-300">
                No runtime logic changes happen here. This screen stays focused on connection status and access setup.
              </p>
              <a
                href="/api/integrations/gmail/start"
                className={`${appButtonClassName({ variant: 'secondary', size: 'md' })} mt-5 inline-flex`}
              >
                {gmailConnected ? 'Reconnect Gmail' : 'Connect Gmail'}
              </a>
            </SurfaceCard>
          </div>
        </SurfaceCard>
      </div>
    </DashboardLayout>
  )
}
