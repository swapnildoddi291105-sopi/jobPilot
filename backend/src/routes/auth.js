import { Router } from "express"
import { supabase, supabaseAdmin } from "../config/supabase.js"
import { asyncHandler } from "../middleware/errorHandler.js"

const router = Router()

/**
 * POST /api/auth/register
 * Body: { email, password, fullName }
 * Creates the auth user AND a profile row.
 */
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, fullName } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || "" },
      },
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.status(201).json({ user: data.user, session: data.session })
  })
)

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return res.status(401).json({ error: error.message })
    }

    res.json({
      user: data.user,
      session: data.session,
    })
  })
)

/**
 * POST /api/auth/logout
 */
router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const header = req.headers.authorization || ""
    const token = header.startsWith("Bearer ") ? header.slice(7) : null
    if (token) {
      await supabaseAdmin?.auth.admin.signOut(token).catch(() => {})
    }
    res.json({ message: "Logged out" })
  })
)

/**
 * GET /api/auth/me
 * Requires Bearer token.
 */
router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const header = req.headers.authorization || ""
    const token = header.startsWith("Bearer ") ? header.slice(7) : null

    if (!token) {
      return res.status(401).json({ error: "Missing token" })
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: "Invalid token" })
    }

    // Fetch the user's profile row
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    res.json({ user, profile })
  })
)

export default router
