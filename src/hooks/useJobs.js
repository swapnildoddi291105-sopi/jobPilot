import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { useAuth } from "./useAuth"

function mapJob(j) {
  return {
    id: j.id,
    title: j.title,
    company: j.company,
    location: j.location,
    source: j.source,
    salary: j.salary,
    url: j.url,
    description: j.description,
    status: j.status,
    notes: j.notes,
    dateApplied: j.date_applied || j.dateApplied,
  }
}

// ----------------------------------------------------------------
// Dashboard
// ----------------------------------------------------------------

function mapDashboardStats(data) {
  if (!data) return null
  return {
    jobsApplied: data.jobsApplied ?? 0,
    interviewsScheduled: data.interviewsScheduled ?? 0,
    offersReceived: data.offersReceived ?? 0,
    responseRate: data.responseRate ?? 0,
    recentJobs: (data.recentJobs || []).map(mapJob),
    weeklyActivity: (data.weeklyActivity || []).map((d) => ({
      day: d.day,
      applications: d.applications ?? 0,
      responses: d.responses ?? 0,
    })),
  }
}

export function useDashboardStats() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get("/dashboard/stats").then((r) => mapDashboardStats(r.data)),
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
  })
}

export function useWeeklyActivity() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: ["weekly-activity"],
    queryFn: () => api.get("/dashboard/stats").then((r) => r.data.weeklyActivity.map((d) => ({ day: d.day, applications: d.applications, responses: 0 }))),
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
  })
}

export function useMonthlyTrend() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: ["monthly-trend"],
    queryFn: () => api.get("/dashboard/analytics").then((r) => (r.data.monthlyTrend || []).map((m) => ({
      month: m.month,
      applications: m.applications ?? 0,
      interviews: m.interviews ?? 0,
      offers: m.offers ?? 0,
    }))),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSourceBreakdown() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: ["source-breakdown"],
    queryFn: () => api.get("/dashboard/analytics").then((r) => (r.data.sourceBreakdown || []).map((s) => ({
      name: s.name,
      value: s.value,
      color: s.color,
    }))),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  })
}

export function useStatusBreakdown() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: ["status-breakdown"],
    queryFn: () => api.get("/dashboard/analytics").then((r) => (r.data.statusBreakdown || []).map((s) => ({
      status: s.status,
      count: s.count,
      fill: s.fill,
    }))),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  })
}

// ----------------------------------------------------------------
// Jobs
// ----------------------------------------------------------------

export function useJobs({ search = "", status = "", source = "" } = {}) {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: ["jobs", search, status, source],
    queryFn: () =>
      api
        .get("/jobs", { params: { search, status, source } })
        .then((r) => (r.data.jobs || []).map(mapJob)),
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
  })
}

export function useSaveJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (job) => api.post("/jobs", job).then((r) => mapJob(r.data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  })
}

export function useUpdateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }) => api.patch(`/jobs/${id}`, updates).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  })
}

export function useDeleteJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/jobs/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  })
}

// ----------------------------------------------------------------
// Job Search (Apify via backend)
// ----------------------------------------------------------------

export function useJobSearch({ query, location = "" }) {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: ["job-search", query, location],
    queryFn: () =>
      api
        .get("/scrape/jobs", { params: { query, location } })
        .then((r) => (r.data.jobs || []).map(mapJob)),
    enabled: isAuthenticated && !!query,
    staleTime: 1000 * 60 * 10,
  })
}

// ----------------------------------------------------------------
// Profiles & Settings
// ----------------------------------------------------------------

export function useUserProfile() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: () => api.get("/settings/profile").then((r) => {
      const p = r.data || {}
      return {
        id: p.id,
        email: p.email,
        full_name: p.full_name || p.fullName,
        role: p.role,
        location: p.location,
        bio: p.bio,
        avatar_url: p.avatar_url || p.avatarUrl,
        initials: ((p.full_name || p.fullName || "") || "AJ").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
      }
    }),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  })
}

export function useSettings() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get("/settings").then((r) => {
      const s = r.data || {}
      return {
        targetRoles: s.target_roles || s.targetRoles || [],
        targetLocations: s.target_locations || s.targetLocations || [],
        salaryMin: s.salary_min ?? s.salaryMin ?? null,
        salaryMax: s.salary_max ?? s.salaryMax ?? null,
        jobTypes: s.job_types || s.jobTypes || ["Full-time"],
        sources: s.sources || ["LinkedIn", "Indeed"],
        autoApply: s.auto_apply ?? s.autoApply ?? false,
        followUpReminders: s.follow_up_reminders ?? s.followUpReminders ?? true,
        emailNotifications: s.email_notifications ?? s.emailNotifications ?? true,
        browserNotifications: s.browser_notifications ?? s.browserNotifications ?? false,
        weeklyDigest: s.weekly_digest ?? s.weeklyDigest ?? true,
      }
    }),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (settings) => api.put("/settings", settings).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.patch("/settings/profile", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-profile"] })
      qc.invalidateQueries({ queryKey: ["settings"] })
    },
  })
}
