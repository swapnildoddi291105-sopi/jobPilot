import { supabase } from "../config/supabase.js"

/**
 * Accepts either:
 *   1. x-admin-token header (n8n workflow) — sets req.isAdmin = true
 *   2. Authorization: Bearer <JWT> (frontend) — sets req.user = { id, email }
 *
 * Admin callers should resolve req.userId from the entity context
 * (job, optimized_resume, etc.) in the route handler.
 */
export async function requireAdminOrUser(req, res, next) {
  const adminToken = req.headers["x-admin-token"]
  if (adminToken && process.env.N8N_ADMIN_TOKEN && adminToken === process.env.N8N_ADMIN_TOKEN) {
    req.isAdmin = true
    return next()
  }

  try {
    const header = req.headers.authorization || ""
    const token = header.startsWith("Bearer ") ? header.slice(7) : null

    if (!token) {
      return res.status(401).json({ error: "Missing authorization token" })
    }

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" })
    }

    req.user = { id: user.id, email: user.email }
    next()
  } catch {
    return res.status(500).json({ error: "Authentication failed" })
  }
}
