import { supabase } from "../config/supabase.js"

/**
 * Verify the Supabase JWT sent in the Authorization header.
 * Attaches req.user = { id, email } on success.
 *
 * The frontend sends the access token from supabase-js auth session:
 *   Authorization: Bearer <access_token>
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ""
    const token = header.startsWith("Bearer ") ? header.slice(7) : null

    if (!token) {
      return res.status(401).json({ error: "Missing authorization token" })
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" })
    }

    req.user = { id: user.id, email: user.email }
    next()
  } catch {
    return res.status(500).json({ error: "Authentication failed" })
  }
}

/**
 * Optional auth — attaches req.user if a valid token is present,
 * but does not reject the request if missing.
 */
export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ""
    const token = header.startsWith("Bearer ") ? header.slice(7) : null

    if (token) {
      const {
        data: { user },
      } = await supabase.auth.getUser(token)
      if (user) {
        req.user = { id: user.id, email: user.email }
      }
    }
  } catch {
    // ignore — treated as anonymous
  }
  next()
}
