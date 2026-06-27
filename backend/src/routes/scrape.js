import { Router } from "express"
import { requireAuth } from "../middleware/auth.js"
import { asyncHandler } from "../middleware/errorHandler.js"
import { searchJobs, getApifyError } from "../config/apify.js"

const router = Router()

/**
 * GET /api/scrape/jobs?query=...&location=...&maxResults=20
 * Searches live jobs via Apify. Does NOT save them — the frontend can
 * POST the chosen ones to /api/jobs to persist.
 */
router.get(
  "/jobs",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { query, location = "", maxResults = 20 } = req.query

    if (!query) {
      return res.status(400).json({ error: "Query parameter 'query' is required" })
    }

    if (getApifyError()) {
      return res.status(503).json({
        error: "Job scraping is not configured",
        detail: getApifyError().message,
      })
    }

    try {
      const jobs = await searchJobs({
        query,
        location,
        maxResults: Math.min(50, parseInt(maxResults, 10) || 20),
      })
      res.json({ jobs })
    } catch (err) {
      console.error("[scrape] Apify search failed:", err.message)
      res.status(502).json({
        error: "Job search provider failed",
        detail: err.message,
      })
    }
  })
)

export default router
