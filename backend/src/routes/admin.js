import { Router } from "express"
import { supabaseAdmin } from "../config/supabase.js"
import { adminAuth } from "../middleware/adminAuth.js"
import { asyncHandler } from "../middleware/errorHandler.js"
import { searchJobs, getApifyError } from "../config/apify.js"
import { createWorkflowLogger } from "../services/logger.js"

const router = Router()
router.use(adminAuth)

const log = createWorkflowLogger("admin")

/**
 * GET /api/admin/users
 * Returns all active users with their settings and latest resume.
 */
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        *,
        user_settings:user_settings(*),
        resumes:resumes(id, name, created_at)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json({ users: profiles, total: profiles.length })
  })
)

/**
 * POST /api/admin/trigger-search
 * Triggers a job search for all active users (or a specific user).
 * Body: { userId?, query?, location?, maxResults? }
 */
router.post(
  "/trigger-search",
  asyncHandler(async (req, res) => {
    const { userId, query, location, maxResults } = req.body

    if (getApifyError()) {
      return res.status(503).json({
        error: "Job scraping is not configured",
        detail: getApifyError().message,
      })
    }

    let users = []
    if (userId) {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, user_settings(*)")
        .eq("id", userId)
        .single()
      if (data) users = [data]
    } else {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, user_settings(*)")
      users = data || []
    }

    const results = []
    for (const user of users) {
      try {
        const settings = user.user_settings || {}
        const searchQuery = query || (settings.target_roles || []).join(" ")
        const searchLocation = location || (settings.target_locations || []).join(", ")

        if (!searchQuery) {
          results.push({ userId: user.id, status: "skipped", reason: "No target roles configured" })
          continue
        }

        const jobs = await searchJobs({
          query: searchQuery,
          location: searchLocation,
          maxResults: Math.min(50, maxResults || 20),
        })

        let saved = 0
        for (const job of jobs) {
          const { error: insertErr } = await supabaseAdmin
            .from("jobs")
            .insert({
              user_id: user.id,
              title: job.title,
              company: job.company,
              location: job.location,
              source: job.source,
              salary: job.salary || "",
              url: job.url || "",
              description: (job.description || "").substring(0, 10000),
              status: "Saved",
            })
          if (!insertErr) saved++
        }

        await log.info(user.id, `Found ${jobs.length}, saved ${saved} jobs for user`)

        results.push({ userId: user.id, found: jobs.length, saved })
      } catch (err) {
        await log.error(user.id, `Search failed: ${err.message}`)
        results.push({ userId: user.id, error: err.message })
      }
    }

    res.json({ processed: results.length, results })
  })
)

/**
 * POST /api/admin/trigger-email
 * Sends optimized resume emails for a user's top jobs.
 * Body: { userId?, subject?, body? }
 */
router.post(
  "/trigger-email",
  asyncHandler(async (req, res) => {
    const { userId, subject, body } = req.body

    let query = supabaseAdmin
      .from("optimized_resumes")
      .select(`
        *,
        jobs:job_id(title, company),
        profiles:user_id(email, full_name)
      `)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data: optimizedResumes, error } = await query

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const results = []
    for (const opt of optimizedResumes) {
      try {
        const userEmail = opt.profiles?.email
        if (!userEmail) {
          results.push({ id: opt.id, status: "skipped", reason: "No user email" })
          continue
        }

        const defaultSubject = `Optimized Resume for ${opt.jobs?.title || "Job"} at ${opt.jobs?.company || "Company"}`
        const defaultBody = `Hi ${opt.profiles?.full_name || "there"},\n\nYour optimized resume for ${opt.jobs?.title} at ${opt.jobs?.company} is ready.\n\nBest,\nJobPilot AI`

        const { sendEmail } = await import("../services/gmail.js")
        const result = await sendEmail({
          to: userEmail,
          subject: subject || defaultSubject,
          body: body || defaultBody,
        })

        await log.info(opt.user_id, `Email sent for optimized resume ${opt.id}`)

        results.push({ id: opt.id, status: "sent", messageId: result.messageId })
      } catch (err) {
        await log.error(opt.user_id, `Email failed for ${opt.id}: ${err.message}`)
        results.push({ id: opt.id, error: err.message })
      }
    }

    res.json({ processed: results.length, results })
  })
)

export default router
