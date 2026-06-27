import { ProfileSection } from "@/components/settings/ProfileSection"
import { PreferencesSection } from "@/components/settings/PreferencesSection"

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <ProfileSection />
      <PreferencesSection />
    </div>
  )
}
