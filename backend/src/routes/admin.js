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

/**
 * POST /api/admin/dedup-jobs
 * Removes duplicate jobs (same title + company for the same user).
 * Keeps only the most recently saved duplicate.
 * Body: { userId? }
 */
router.post(
  "/dedup-jobs",
  asyncHandler(async (req, res) => {
    const { userId } = req.body

    let query = supabaseAdmin
      .from("jobs")
      .select("id, user_id, title, company, created_at")
      .order("created_at", { ascending: false })

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data: jobs, error } = await query
    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const seen = {}
    const toDelete = []

    for (const job of jobs) {
      const key = `${job.user_id}|${(job.title || "").toLowerCase().trim()}|${(job.company || "").toLowerCase().trim()}`
      if (seen[key]) {
        toDelete.push(job.id)
      } else {
        seen[key] = true
      }
    }

    if (toDelete.length > 0) {
      const { error: delErr } = await supabaseAdmin
        .from("jobs")
        .delete()
        .in("id", toDelete)

      if (delErr) {
        return res.status(500).json({ error: delErr.message })
      }
    }

    await log.info(userId || "all", `Dedup removed ${toDelete.length} duplicate jobs`)

    res.json({ removed: toDelete.length, duplicateIds: toDelete })
  })
)

/**
 * POST /api/admin/rank-jobs
 * Scores unoptimized "Saved" jobs using Gemini and returns them ranked.
 * Body: { userId?, topN? }
 * Scores jobs for resume match, description quality, and relevance.
 */
router.post(
  "/rank-jobs",
  asyncHandler(async (req, res) => {
    const { userId, topN = 5 } = req.body
    const limit = Math.min(50, Math.max(1, parseInt(topN, 10) || 5))

    let query = supabaseAdmin
      .from("jobs")
      .select("id, user_id, title, company, description, source, url, created_at")
      .eq("status", "Saved")
      .order("created_at", { ascending: false })

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data: jobs, error } = await query
    if (error) {
      return res.status(500).json({ error: error.message })
    }

    if (!jobs || jobs.length === 0) {
      return res.json({ ranked: [], total: 0, topN: [] })
    }

    const { getGemini, getGeminiError } = await import("../config/gemini.js")
    const ai = getGemini()
    if (!ai) {
      return res.status(503).json({
        error: "Gemini not configured",
        detail: getGeminiError()?.message,
      })
    }

    const jobList = jobs.map((j, i) => `${i + 1}. Title: ${j.title} | Company: ${j.company} | Description: ${(j.description || "").substring(0, 500)}`).join("\n")

    const prompt = `You are a job matching AI. Score each job on a scale of 1-100 based on:
- Resume relevance (how likely a tech professional would match)
- Description quality (how complete and legitimate the posting is)
- Career growth potential

Return ONLY a valid JSON array of objects with keys "index" (number, 1-based) and "score" (number 1-100).
No explanation, no markdown.

Jobs to score:
${jobList}`

    try {
      const result = await ai.generateContent(prompt)
      const text = result.response.text()
      const cleaned = text.replace(/```json\n?|```\n?/g, "").trim()
      const scores = JSON.parse(cleaned)

      const ranked = jobs.map((job, i) => {
        const scoreEntry = scores.find((s) => s.index === i + 1)
        return {
          ...job,
          rankScore: scoreEntry?.score || 50,
        }
      }).sort((a, b) => b.rankScore - a.rankScore)

      const topJobs = ranked.slice(0, limit)

      res.json({
        total: ranked.length,
        topN: topJobs.map((j) => ({ id: j.id, title: j.title, company: j.company, score: j.rankScore })),
        ranked: ranked.map((j) => ({ id: j.id, title: j.title, company: j.company, score: j.rankScore })),
      })
    } catch (err) {
      return res.status(502).json({ error: "Job ranking failed: " + err.message })
    }
  })
)

/**
 * POST /api/admin/notify
 * Sends a notification email to the configured admin address.
 * Body: { subject, message, level? }
 */
router.post(
  "/notify",
  asyncHandler(async (req, res) => {
    const { subject, message, level = "info" } = req.body

    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail) {
      return res.status(501).json({ error: "ADMIN_EMAIL is not configured" })
    }

    if (!subject || !message) {
      return res.status(400).json({ error: "subject and message are required" })
    }

    try {
      const { sendEmail } = await import("../services/gmail.js")
      const result = await sendEmail({
        to: adminEmail,
        subject: `[JobPilot ${level.toUpperCase()}] ${subject}`,
        body: `Workflow Notification\n\nLevel: ${level}\n\n${message}\n\n-- JobPilot AI`,
      })

      await log.info("admin", `Admin notification sent: ${subject}`)

      res.json({ sent: true, messageId: result.messageId })
    } catch (err) {
      await log.error("admin", `Admin notification failed: ${err.message}`)
      res.status(502).json({ error: "Failed to send admin notification: " + err.message })
    }
  })
)

export default router
