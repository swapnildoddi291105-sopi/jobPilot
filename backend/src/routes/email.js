import { Router } from "express"
import { supabaseAdmin } from "../config/supabase.js"
import { requireAuth } from "../middleware/auth.js"
import { asyncHandler } from "../middleware/errorHandler.js"
import { sendEmail } from "../services/gmail.js"
import { getDrive } from "../config/google.js"

const router = Router()

router.post(
  "/send",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { to, subject, body, jobId, optimizedResumeId } = req.body

    if (!to) {
      return res.status(400).json({ error: "Recipient email (to) is required" })
    }

    let attachmentBuffer = null
    let attachmentName = null

    if (optimizedResumeId) {
      const { data: opt, error: optErr } = await supabaseAdmin
        .from("optimized_resumes")
        .select("*, jobs:job_id(title, company)")
        .eq("id", optimizedResumeId)
        .eq("user_id", req.user.id)
        .single()

      if (optErr || !opt) {
        return res.status(404).json({ error: "Optimized resume not found" })
      }

      try {
        const drive = getDrive()
        const urlParts = (opt.resume_pdf_url || "").split("/")
        const fileId = urlParts.length >= 2 ? urlParts[urlParts.length - 2] : ""
        if (!drive) {
          console.warn("[email] Drive client not available")
        } else {
          const response = await drive.files.get(
            { fileId, alt: "media" },
            { responseType: "arraybuffer" }
          )
          attachmentBuffer = Buffer.from(response.data)
          attachmentName = `Optimized_Resume_${opt.jobs?.company || ""}_${opt.jobs?.title || ""}.pdf`
            .replace(/[^a-zA-Z0-9._-]/g, "_")
        }
      } catch (err) {
        console.warn("[email] Could not download PDF from Drive:", err.message)
      }
    }

    try {
      const result = await sendEmail({
        to,
        subject: subject || "Your Optimized Resume from JobPilot",
        body: body || "Please find your optimized resume attached.",
        attachmentBuffer,
        attachmentName,
      })

      const { error: logErr } = await supabaseAdmin.from("workflow_logs").insert({
        user_id: req.user.id,
        status: "sent",
        message: `Email sent to ${to}${optimizedResumeId ? " with optimized resume" : ""}`,
        meta: { to, subject, optimizedResumeId, messageId: result.messageId },
      })
      if (logErr) console.warn("[email] Failed to log email send:", logErr.message)

      res.json(result)
    } catch (err) {
      res.status(502).json({ error: err.message })
    }
  })
)

export default router
