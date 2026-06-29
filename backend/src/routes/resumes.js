import { Router } from "express"
import { supabaseAdmin } from "../config/supabase.js"
import { requireAuth } from "../middleware/auth.js"
import { asyncHandler } from "../middleware/errorHandler.js"
import { deleteFile } from "../config/storage.js"

const router = Router()

/**
 * GET /api/resumes
 * Query: ?sortBy=date|ats|name&order=desc|asc&page=&limit=
 */
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { sortBy = "date", order = "desc", page = 1, limit = 50 } = req.query

    const columnMap = { date: "created_at", ats: "ats_score", name: "name" }
    const column = columnMap[sortBy] || "created_at"
    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const offset = (pageNum - 1) * limitNum

    const { data, error, count } = await supabaseAdmin
      .from("resumes")
      .select("*", { count: "exact" })
      .eq("user_id", req.user.id)
      .order(column, { ascending: order === "asc" })
      .range(offset, offset + limitNum - 1)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json({
      resumes: data,
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
 * GET /api/resumes/:id
 */
router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from("resumes")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .single()

    if (error) {
      return res.status(404).json({ error: "Resume not found" })
    }

    res.json(data)
  })
)

/**
 * PATCH /api/resumes/:id — rename, update target role
 */
router.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const allowed = ["name", "target_role", "ats_score"]
    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }

    const { data, error } = await supabaseAdmin
      .from("resumes")
      .update(updates)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data)
  })
)

/**
 * DELETE /api/resumes/:id — removes DB row + storage file
 */
router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data: resume } = await supabaseAdmin
      .from("resumes")
      .select("storage_path")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .single()

    const { error } = await supabaseAdmin
      .from("resumes")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    if (resume?.storage_path) {
      deleteFile(resume.storage_path)
    }

    res.json({ message: "Resume deleted" })
  })
)

export default router
