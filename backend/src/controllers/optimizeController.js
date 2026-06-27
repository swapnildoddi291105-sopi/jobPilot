import { supabaseAdmin } from "../config/supabase.js"
import { optimizeResume } from "../services/gemini.js"
import { generateResumePDF } from "../utils/latex.js"
import { getDrive, getDriveError, DRIVE_FOLDER_ID } from "../config/google.js"

export async function optimizeJob(req, res) {
  const { jobId } = req.params

  try {
    const { data: job, error: jobErr } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", req.user.id)
      .single()
    if (jobErr || !job) {
      return res.status(404).json({ error: "Job not found" })
    }

    const { data: resume, error: resumeErr } = await supabaseAdmin
      .from("resumes")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
    if (resumeErr || !resume) {
      return res.status(400).json({ error: "No resume found. Please upload a resume first." })
    }

    const optimizedData = await optimizeResume(
      resume.extracted_text || "",
      job.description || "",
      job.title || ""
    )

    console.log("[optimize] Generating PDF...")
    let pdfBuffer = null
    let driveFile = null
    let pdfUrl = null

    try {
      pdfBuffer = await generateResumePDF(
        optimizedData,
        req.user.email ? req.user.email.split("@")[0] : "Candidate",
        req.user.email || ""
      )

      if (pdfBuffer && getDrive() && DRIVE_FOLDER_ID) {
        const { Readable } = await import("stream")
        const stream = new Readable()
        stream.push(pdfBuffer)
        stream.push(null)

        const fileName = `optimized_${job.company}_${job.title}_${Date.now()}.pdf`
          .replace(/[^a-zA-Z0-9._-]/g, "_")

        const drive = getDrive()
        const uploadResult = await drive.files.create({
          requestBody: {
            name: fileName,
            parents: [DRIVE_FOLDER_ID],
          },
          media: {
            mimeType: "application/pdf",
            body: stream,
          },
          fields: "id, webViewLink",
        })
        driveFile = uploadResult.data
        pdfUrl = driveFile.webViewLink
      }
    } catch (pdfErr) {
      console.warn("[optimize] PDF generation/upload failed (non-fatal):", pdfErr.message)
    }

    const { data: saved, error: saveErr } = await supabaseAdmin
      .from("optimized_resumes")
      .insert({
        job_id: jobId,
        user_id: req.user.id,
        resume_pdf_url: pdfUrl,
        ats_score: optimizedData.ats_score || null,
        missing_keywords: optimizedData.missing_keywords || [],
        optimized_data: optimizedData,
      })
      .select()
      .single()
    if (saveErr) throw saveErr

    await supabaseAdmin
      .from("jobs")
      .update({ status: "Optimized" })
      .eq("id", jobId)
      .eq("user_id", req.user.id)

    res.json({
      message: "Resume optimized successfully",
      atsScore: optimizedData.ats_score,
      pdfUrl,
      missingKeywords: optimizedData.missing_keywords,
      improvements: optimizedData.improvements_made,
      id: saved.id,
    })
  } catch (err) {
    console.error("[optimize] Optimization error:", err)
    res.status(500).json({ error: err.message })
  }
}

export async function optimizeBatch(req, res) {
  const { limit = 5 } = req.body
  const batchLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 5))
  const userId = req.user.id

  try {
    const { data: jobs, error: jobsErr } = await supabaseAdmin
      .from("jobs")
      .select("id, title, company, description")
      .eq("user_id", userId)
      .eq("status", "Saved")
      .limit(batchLimit)

    if (jobsErr) {
      return res.status(500).json({ error: jobsErr.message })
    }

    if (!jobs || jobs.length === 0) {
      return res.json({ processed: 0, results: [] })
    }

    const results = []
    for (const job of jobs) {
      try {
        const mockReq = {
          params: { jobId: job.id },
          user: { id: userId, email: req.user.email || "" },
        }
        const mockRes = {
          _json: null,
          _status: 200,
          json: (d) => { mockRes._json = d },
          status: (s) => { mockRes._status = s; return mockRes },
        }
        await optimizeJob(mockReq, mockRes)
        results.push({
          jobId: job.id,
          title: job.title,
          company: job.company,
          status: mockRes._status,
          result: mockRes._json,
        })
      } catch (err) {
        results.push({ jobId: job.id, title: job.title, company: job.company, error: err.message })
      }
    }

    res.json({ processed: results.length, results })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
