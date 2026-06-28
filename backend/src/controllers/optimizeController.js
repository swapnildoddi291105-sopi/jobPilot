import { supabaseAdmin } from "../config/supabase.js"
import { optimizeResume } from "../services/gemini.js"
import { generateResumePDF } from "../utils/latex.js"
import { getDrive, DRIVE_FOLDER_ID } from "../config/google.js"

export async function optimizeJob(req, res) {
  const { jobId } = req.params

  let userId, userEmail

  if (req.isAdmin) {
    const { data: job } = await supabaseAdmin
      .from("jobs")
      .select("user_id")
      .eq("id", jobId)
      .single()
    if (!job) return res.status(404).json({ error: "Job not found" })
    userId = job.user_id
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single()
    userEmail = profile?.email || ""
  } else {
    userId = req.user.id
    userEmail = req.user.email || ""
  }

  try {
    const { data: job, error: jobErr } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", userId)
      .single()
    if (jobErr || !job) {
      return res.status(404).json({ error: "Job not found" })
    }

    const { data: resume, error: resumeErr } = await supabaseAdmin
      .from("resumes")
      .select("*")
      .eq("user_id", userId)
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
        userEmail ? userEmail.split("@")[0] : "Candidate",
        userEmail
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
        user_id: userId,
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
      .eq("user_id", userId)

    res.json({
      message: "Resume optimized successfully",
      atsScore: optimizedData.ats_score,
      pdfUrl,
      missingKeywords: optimizedData.missing_keywords,
      improvements: optimizedData.improvements_made,
      id: saved.id,
      user_email: userEmail,
    })
  } catch (err) {
    console.error("[optimize] Optimization error:", err)
    res.status(500).json({ error: err.message })
  }
}

async function optimizeResumeForJob(job, userId) {
  const { data: resume, error: resumeErr } = await supabaseAdmin
    .from("resumes")
    .select("extracted_text")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()
  if (resumeErr || !resume) {
    return { error: "No resume found. Please upload a resume first." }
  }

  const optimizedData = await optimizeResume(
    resume.extracted_text || "",
    job.description || "",
    job.title || ""
  )

  const { data: saved, error: saveErr } = await supabaseAdmin
    .from("optimized_resumes")
    .insert({
      job_id: job.id,
      user_id: userId,
      ats_score: optimizedData.ats_score || null,
      missing_keywords: optimizedData.missing_keywords || [],
      optimized_data: optimizedData,
    })
    .select()
    .single()
  if (saveErr) return { error: saveErr.message }

  await supabaseAdmin
    .from("jobs")
    .update({ status: "Optimized" })
    .eq("id", job.id)
    .eq("user_id", userId)

  return {
    data: {
      message: "Resume optimized successfully",
      atsScore: optimizedData.ats_score,
      missingKeywords: optimizedData.missing_keywords,
      improvements: optimizedData.improvements_made,
      id: saved.id,
    },
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
        const { data, error } = await optimizeResumeForJob(job, userId)
        if (error) throw new Error(error)
        results.push({
          jobId: job.id,
          title: job.title,
          company: job.company,
          status: 200,
          result: data,
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
