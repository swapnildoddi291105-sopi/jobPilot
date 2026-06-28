import { Router } from "express"
import { supabaseAdmin } from "../config/supabase.js"
import { requireAdminOrUser } from "../middleware/requireAdminOrUser.js"
import { asyncHandler } from "../middleware/errorHandler.js"
import { generateCoverLetter } from "../services/coverLetter.js"

const router = Router()

router.post(
  "/generate",
  requireAdminOrUser,
  asyncHandler(async (req, res) => {
    const { jobId, resumeId, tone } = req.body

    if (!jobId) {
      return res.status(400).json({ error: "jobId is required" })
    }

    let userId
    if (req.isAdmin) {
      const { data: job } = await supabaseAdmin
        .from("jobs")
        .select("user_id")
        .eq("id", jobId)
        .single()
      if (!job) return res.status(404).json({ error: "Job not found" })
      userId = job.user_id
    } else {
      userId = req.user.id
    }

    const { data: job, error: jobErr } = await supabaseAdmin
      .from("jobs")
      .select("title, company, description")
      .eq("id", jobId)
      .eq("user_id", userId)
      .single()

    if (jobErr || !job) {
      return res.status(404).json({ error: "Job not found" })
    }

    let resumeQuery = supabaseAdmin
      .from("resumes")
      .select("extracted_text")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)

    if (resumeId) {
      resumeQuery = supabaseAdmin
        .from("resumes")
        .select("extracted_text")
        .eq("id", resumeId)
        .eq("user_id", userId)
    }

    const { data: resume } = await resumeQuery.single()
    const resumeText = resume?.extracted_text || ""

    const coverLetter = await generateCoverLetter({
      resumeText,
      jobTitle: job.title,
      jobDescription: job.description || "",
      company: job.company,
      tone,
    })

    res.json({ coverLetter })
  })
)

export default router
