import { Router } from "express"
import { supabaseAdmin } from "../config/supabase.js"
import { requireAuth } from "../middleware/auth.js"
import { asyncHandler } from "../middleware/errorHandler.js"

const router = Router()

const SETTINGS_FIELDS = [
  "target_roles",
  "target_locations",
  "salary_min",
  "salary_max",
  "job_types",
  "sources",
  "auto_apply",
  "follow_up_reminders",
  "email_notifications",
  "browser_notifications",
  "weekly_digest",
]

/**
 * GET /api/settings
 * Returns the user's settings, or a default object if none exist yet.
 */
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from("user_settings")
      .select("*")
      .eq("user_id", req.user.id)
      .maybeSingle()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    if (!data) {
      // Return sensible defaults if the user has no settings row yet
      return res.json({
        user_id: req.user.id,
        target_roles: [],
        target_locations: [],
        salary_min: null,
        salary_max: null,
        job_types: ["Full-time"],
        sources: ["LinkedIn", "Indeed"],
        auto_apply: false,
        follow_up_reminders: true,
        email_notifications: true,
        browser_notifications: false,
        weekly_digest: true,
      })
    }

    res.json(data)
  })
)

/**
 * PUT /api/settings
 * Upserts the user's settings row.
 */
router.put(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const updates = { user_id: req.user.id }
    for (const key of SETTINGS_FIELDS) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key]
      }
    }

    if (updates.salary_min != null && (typeof updates.salary_min !== "number" || updates.salary_min < 0)) {
      return res.status(400).json({ error: "salary_min must be a positive number" })
    }
    if (updates.salary_max != null && (typeof updates.salary_max !== "number" || updates.salary_max < 0)) {
      return res.status(400).json({ error: "salary_max must be a positive number" })
    }
    for (const boolField of ["auto_apply", "follow_up_reminders", "email_notifications", "browser_notifications", "weekly_digest"]) {
      if (updates[boolField] !== undefined && typeof updates[boolField] !== "boolean") {
        return res.status(400).json({ error: `${boolField} must be a boolean` })
      }
    }
    for (const arrField of ["target_roles", "target_locations", "job_types", "sources"]) {
      if (updates[arrField] !== undefined && !Array.isArray(updates[arrField])) {
        return res.status(400).json({ error: `${arrField} must be an array` })
      }
    }

    const { data, error } = await supabaseAdmin
      .from("user_settings")
      .upsert(updates, { onConflict: "user_id" })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data)
  })
)

/**
 * GET /api/settings/profile — fetch the profile row
 * PATCH /api/settings/profile — update name, role, location, bio, avatar
 */
router
  .route("/profile")
  .get(
    requireAuth,
    asyncHandler(async (req, res) => {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", req.user.id)
        .maybeSingle()

      if (error) return res.status(500).json({ error: error.message })
      res.json(data || { id: req.user.id, email: req.user.email })
    })
  )
  .patch(
    requireAuth,
    asyncHandler(async (req, res) => {
      const allowed = ["full_name", "role", "location", "bio", "avatar_url"]
      const updates = {}
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key]
      }

      updates.id = req.user.id

      const { data, error } = await supabaseAdmin
        .from("profiles")
        .upsert(updates)
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      res.json(data)
    })
  )

export default router
