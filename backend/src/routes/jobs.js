import { Router } from "express"
import { supabaseAdmin } from "../config/supabase.js"
import { requireAuth } from "../middleware/auth.js"
import { asyncHandler } from "../middleware/errorHandler.js"

const router = Router()

/**
 * GET /api/jobs
 * Query: ?search=&status=&source=&page=&limit=
 * Returns the authenticated user's saved jobs.
 */
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { search = "", status = "", source = "", page = 1, limit = 50 } = req.query
    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const offset = (pageNum - 1) * limitNum

    let query = supabaseAdmin
      .from("jobs")
      .select("*", { count: "exact" })
      .eq("user_id", req.user.id)
      .order("date_applied", { ascending: false })
      .range(offset, offset + limitNum - 1)

    if (status) query = query.eq("status", status)
    if (source) query = query.eq("source", source)
    if (search) {
      const safeSearch = search.replace(/[%_\\]/g, "\\$&")
      query = query.or(`title.ilike.%${safeSearch}%,company.ilike.%${safeSearch}%`)
    }

    const { data, error, count } = await query

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json({
      jobs: data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
    })
  })
)

/**
 * POST /api/jobs — save a job (e.g. from Apify search results)
 * Body: { title, company, location, source, salary, url, description, status }
 */
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { title, company, location, source, salary, url, description, status } = req.body

    if (!title || !company) {
      return res.status(400).json({ error: "Title and company are required" })
    }

    const { data, error } = await supabaseAdmin
      .from("jobs")
      .insert({
        user_id: req.user.id,
        title,
        company,
        location: location || "Unknown",
        source: source || "Manual",
        salary: salary || "",
        url: url || "",
        description: description || "",
        status: status || "Saved",
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.status(201).json(data)
  })
)

/**
 * PATCH /api/jobs/:id — update a job (status, notes)
 */
router.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const allowed = ["status", "notes", "title", "company", "location", "salary"]
    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }

    const { data, error } = await supabaseAdmin
      .from("jobs")
      .update(updates)
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }
    if (!data) {
      return res.status(404).json({ error: "Job not found" })
    }

    res.json(data)
  })
)

/**
 * DELETE /api/jobs/:id
 */
router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from("jobs")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json({ message: "Job deleted" })
  })
)

export default router
