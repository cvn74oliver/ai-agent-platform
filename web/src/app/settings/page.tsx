import DashboardLayout from '@/app/components/DashboardLayout'
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
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <p className="text-gray-400">
        Update your profile, company details, and platform preferences here.
      </p>

      <section className="mt-8 rounded-lg border border-gray-700 bg-gray-800/40 p-5 max-w-xl">
        <h3 className="text-lg font-semibold">Company Integrations</h3>
        <p className="text-sm text-gray-400 mt-2">
          Gmail status:{' '}
          <span className={gmailConnected ? 'text-green-400' : 'text-gray-300'}>
            {gmailConnected ? 'Connected' : 'Not connected'}
          </span>
        </p>
        <a
          href="/api/integrations/gmail/start"
          className="inline-block mt-4 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Connect Gmail
        </a>
      </section>
    </DashboardLayout>
  )
}
