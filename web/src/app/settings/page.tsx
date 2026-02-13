'use client'
import DashboardLayout from '@/app/components/DashboardLayout'

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <p className="text-gray-400">
        Update your profile, company details, and platform preferences here.
      </p>
    </DashboardLayout>
  )
}