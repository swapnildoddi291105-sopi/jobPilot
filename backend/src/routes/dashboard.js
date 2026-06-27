import { Router } from "express"
import { supabaseAdmin } from "../config/supabase.js"
import { requireAuth } from "../middleware/auth.js"
import { asyncHandler } from "../middleware/errorHandler.js"

const router = Router()

/**
 * GET /api/dashboard/stats
 * Aggregates real data from the jobs table for the dashboard cards.
 */
router.get(
  "/stats",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id

    const { data: jobs, error } = await supabaseAdmin
      .from("jobs")
      .select("id, title, company, location, status, source, date_applied")
      .eq("user_id", userId)
      .order("date_applied", { ascending: false })

    if (error) return res.status(500).json({ error: error.message })

    const total = jobs.length
    const interviews = jobs.filter((j) => j.status === "Interviewing" || j.status === "Phone Screen").length
    const offers = jobs.filter((j) => j.status === "Offer").length
    const rejected = jobs.filter((j) => j.status === "Rejected").length
    const responded = interviews + offers + rejected
    const responseRate = total > 0 ? Math.round((responded / total) * 1000) / 10 : 0

    // Recent 5 jobs
    const recentJobs = jobs.slice(0, 5).map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      source: j.source,
      status: j.status,
      dateApplied: j.date_applied,
    }))

    // Build last-7-days activity from date_applied
    const now = new Date()
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const weeklyActivity = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const dayStart = new Date(d.setHours(0, 0, 0, 0))
      const dayEnd = new Date(d.setHours(23, 59, 59, 999))
      const applied = jobs.filter((j) => {
        const t = new Date(j.date_applied)
        return t >= dayStart && t <= dayEnd
      }).length
      weeklyActivity.push({ day: days[dayStart.getDay()], applications: applied })
    }

    res.json({
      jobsApplied: total,
      interviewsScheduled: interviews,
      offersReceived: offers,
      responseRate,
      recentJobs,
      weeklyActivity,
    })
  })
)

/**
 * GET /api/dashboard/analytics
 * Monthly trend + source breakdown + status funnel for the Analytics page.
 */
router.get(
  "/analytics",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id

    const { data: jobs, error } = await supabaseAdmin
      .from("jobs")
      .select("id, status, source, date_applied")
      .eq("user_id", userId)

    if (error) return res.status(500).json({ error: error.message })

    // Monthly trend (last 6 months)
    const monthLabels = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthLabels.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleString("en-US", { month: "short" }),
        applications: 0,
        interviews: 0,
        offers: 0,
      })
    }
    const monthMap = new Map(monthLabels.map((m) => [m.key, m]))
    for (const job of jobs) {
      const d = new Date(job.date_applied)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const m = monthMap.get(key)
      if (m) {
        m.applications++
        if (job.status === "Interviewing" || job.status === "Phone Screen") m.interviews++
        if (job.status === "Offer") m.offers++
      }
    }

    // Source breakdown
    const sourceCounts = {}
    for (const job of jobs) {
      sourceCounts[job.source] = (sourceCounts[job.source] || 0) + 1
    }
    const sourceColors = {
      LinkedIn: "#0A66C2",
      Indeed: "#2557a7",
      Referral: "#10B981",
      "Company Site": "#6366F1",
      "Google Jobs": "#F59E0B",
    }
    const totalForPct = jobs.length || 1
    const sourceBreakdown = Object.entries(sourceCounts).map(([name, value]) => ({
      name,
      value: Math.round((value / totalForPct) * 100),
      color: sourceColors[name] || "#94A3B8",
    }))

    // Status breakdown
    const statusCounts = {}
    for (const job of jobs) {
      statusCounts[job.status] = (statusCounts[job.status] || 0) + 1
    }
    const statusColors = {
      Applied: "#6366F1",
      "Phone Screen": "#3B82F6",
      Interviewing: "#8B5CF6",
      Offer: "#10B981",
      Rejected: "#EF4444",
      Saved: "#64748B",
    }
    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      fill: statusColors[status] || "#94A3B8",
    }))

    res.json({
      monthlyTrend: monthLabels.map(({ label, applications, interviews, offers }) => ({
        month: label,
        applications,
        interviews,
        offers,
      })),
      sourceBreakdown,
      statusBreakdown,
      kpis: {
        totalApplications: jobs.length,
        interviewRate: jobs.length ? Math.round((statusCounts["Interviewing"] || 0) / jobs.length * 1000) / 10 : 0,
        offerRate: jobs.length ? Math.round((statusCounts["Offer"] || 0) / jobs.length * 1000) / 10 : 0,
      },
    })
  })
)

export default router
