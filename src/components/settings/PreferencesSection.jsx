import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useSettings, useUpdateSettings } from "@/hooks/useJobs"
import { useState, useEffect } from "react"
import { Loader2, CheckCircle2, X, Plus } from "lucide-react"

function ToggleItem({ label, description, checked, onChange, id }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export function PreferencesSection() {
  const { data: settings, isLoading } = useSettings()
  const { mutate: updateSettings, isPending: isSaving } = useUpdateSettings()
  const [saved, setSaved] = useState(false)
  const [newRole, setNewRole] = useState("")
  const [newLocation, setNewLocation] = useState("")
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const [form, setForm] = useState({
    targetRoles: [],
    targetLocations: [],
    salaryMin: null,
    salaryMax: null,
    jobTypes: ["Full-time"],
    sources: ["LinkedIn", "Indeed"],
    autoApply: false,
    followUpReminders: true,
    emailNotifications: true,
    browserNotifications: false,
    weeklyDigest: true,
  })

  useEffect(() => {
    if (settings) {
      setForm({
        targetRoles: settings.target_roles || settings.targetRoles || [],
        targetLocations: settings.target_locations || settings.targetLocations || [],
        salaryMin: settings.salary_min ?? settings.salaryMin ?? null,
        salaryMax: settings.salary_max ?? settings.salaryMax ?? null,
        jobTypes: settings.job_types || settings.jobTypes || ["Full-time"],
        sources: settings.sources || ["LinkedIn", "Indeed"],
        autoApply: settings.auto_apply ?? settings.autoApply ?? false,
        followUpReminders: settings.follow_up_reminders ?? settings.followUpReminders ?? true,
        emailNotifications: settings.email_notifications ?? settings.emailNotifications ?? true,
        browserNotifications: settings.browser_notifications ?? settings.browserNotifications ?? false,
        weeklyDigest: settings.weekly_digest ?? settings.weeklyDigest ?? true,
      })
    }
  }, [settings])

  function handleSave() {
    const payload = {
      target_roles: form.targetRoles,
      target_locations: form.targetLocations,
      salary_min: form.salaryMin,
      salary_max: form.salaryMax,
      job_types: form.jobTypes,
      sources: form.sources,
      auto_apply: form.autoApply,
      follow_up_reminders: form.followUpReminders,
      email_notifications: form.emailNotifications,
      browser_notifications: form.browserNotifications,
      weekly_digest: form.weeklyDigest,
    }
    updateSettings(payload, {
      onSuccess: () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      },
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-64 animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Job Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Job Preferences</CardTitle>
          <CardDescription>Configure your ideal job criteria for AI matching</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Target Roles */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Target Roles</Label>
            <div className="flex flex-wrap gap-2">
              {form.targetRoles.map((role, i) => (
                <Badge key={i} variant="secondary" className="px-3 py-1 gap-1">
                  {role}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setForm({ ...form, targetRoles: form.targetRoles.filter((_, j) => j !== i) })}
                  />
                </Badge>
              ))}
              <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                <DialogTrigger asChild>
                  <Badge variant="outline" className="px-3 py-1 cursor-pointer hover:bg-primary/10 transition-colors">
                    <Plus className="h-3 w-3 mr-1" /> Add Role
                  </Badge>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Add Target Role</DialogTitle>
                  </DialogHeader>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Software Engineer"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newRole.trim()) {
                          setForm({ ...form, targetRoles: [...form.targetRoles, newRole.trim()] })
                          setNewRole("")
                          setRoleDialogOpen(false)
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (newRole.trim()) {
                          setForm({ ...form, targetRoles: [...form.targetRoles, newRole.trim()] })
                          setNewRole("")
                          setRoleDialogOpen(false)
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Target Locations */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Target Locations</Label>
            <div className="flex flex-wrap gap-2">
              {form.targetLocations.map((loc, i) => (
                <Badge key={i} variant="secondary" className="px-3 py-1 gap-1">
                  {loc}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setForm({ ...form, targetLocations: form.targetLocations.filter((_, j) => j !== i) })}
                  />
                </Badge>
              ))}
              <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
                <DialogTrigger asChild>
                  <Badge variant="outline" className="px-3 py-1 cursor-pointer hover:bg-primary/10 transition-colors">
                    <Plus className="h-3 w-3 mr-1" /> Add Location
                  </Badge>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Add Target Location</DialogTitle>
                  </DialogHeader>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. San Francisco, CA"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newLocation.trim()) {
                          setForm({ ...form, targetLocations: [...form.targetLocations, newLocation.trim()] })
                          setNewLocation("")
                          setLocationDialogOpen(false)
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (newLocation.trim()) {
                          setForm({ ...form, targetLocations: [...form.targetLocations, newLocation.trim()] })
                          setNewLocation("")
                          setLocationDialogOpen(false)
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Salary Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Salary Range</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={form.salaryMin ? Math.round(form.salaryMin / 1000) : ""}
                onChange={(e) => setForm({ ...form, salaryMin: e.target.value ? Number(e.target.value) * 1000 : null })}
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">K —</span>
              <Input
                type="number"
                placeholder="Max"
                value={form.salaryMax ? Math.round(form.salaryMax / 1000) : ""}
                onChange={(e) => setForm({ ...form, salaryMax: e.target.value ? Number(e.target.value) * 1000 : null })}
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">K per year</span>
            </div>
          </div>

          {/* Job Types */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Job Types</Label>
            <div className="flex flex-wrap gap-2">
              {form.jobTypes.map((type, i) => (
                <Badge key={i} variant="secondary" className="px-3 py-1">
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Job Sources</Label>
            <div className="flex flex-wrap gap-2">
              {form.sources.map((source, i) => (
                <Badge key={i} variant="secondary" className="px-3 py-1">
                  {source}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Notification Settings</CardTitle>
          <CardDescription>Control how and when you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleItem
            id="email-notifications"
            label="Email Notifications"
            description="Receive updates about your applications via email"
            checked={form.emailNotifications}
            onChange={(v) => setForm({ ...form, emailNotifications: v })}
          />
          <Separator />
          <ToggleItem
            id="browser-notifications"
            label="Browser Notifications"
            description="Get push notifications in your browser for new matches"
            checked={form.browserNotifications}
            onChange={(v) => setForm({ ...form, browserNotifications: v })}
          />
          <Separator />
          <ToggleItem
            id="weekly-digest"
            label="Weekly Digest"
            description="Receive a weekly summary of your job search activity"
            checked={form.weeklyDigest}
            onChange={(v) => setForm({ ...form, weeklyDigest: v })}
          />
          <Separator />
          <ToggleItem
            id="follow-up-reminders"
            label="Follow-up Reminders"
            description="Get reminded to follow up on pending applications"
            checked={form.followUpReminders}
            onChange={(v) => setForm({ ...form, followUpReminders: v })}
          />
        </CardContent>
      </Card>

      {/* Automation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Automation Rules</CardTitle>
          <CardDescription>Configure AI-powered job automation features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleItem
            id="auto-apply"
            label="AI Auto-Apply"
            description="Automatically submit applications to jobs matching your criteria"
            checked={form.autoApply}
            onChange={(v) => setForm({ ...form, autoApply: v })}
          />
          <Separator />
          <ToggleItem
            id="auto-resume-tailor"
            label="Auto Resume Tailoring"
            description="Automatically customize your resume for each application"
            checked={false}
            onChange={() => {}}
          />
          <Separator />
          <ToggleItem
            id="smart-matching"
            label="Smart Job Matching"
            description="Use AI to prioritize jobs that best match your profile"
            checked={true}
            onChange={() => {}}
          />
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end gap-2 items-center">
        {saved && (
          <span className="text-sm text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> Saved
          </span>
        )}
        <Button variant="outline" size="sm" onClick={() => {}}>
          Reset to Defaults
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          Save All Settings
        </Button>
      </div>
    </div>
  )
}
