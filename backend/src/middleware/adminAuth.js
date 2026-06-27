export function adminAuth(req, res, next) {
  const token = req.headers["x-admin-token"]
  if (!token || token !== process.env.N8N_ADMIN_TOKEN) {
    return res.status(403).json({ error: "Forbidden: invalid or missing admin token" })
  }
  next()
}
