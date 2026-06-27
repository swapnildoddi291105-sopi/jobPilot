import { Router } from "express"
import { supabaseAdmin } from "../config/supabase.js"
import { requireAuth } from "../middleware/auth.js"
import { asyncHandler } from "../middleware/errorHandler.js"
import { upload } from "../middleware/upload.js"
import { getDrive, getDriveError, DRIVE_FOLDER_ID } from "../config/google.js"
import { extractResumeData } from "../config/gemini.js"
import pdf from "pdf-parse"
import mammoth from "mammoth"

const router = Router()

/**
 * POST /api/upload/resume
 * Multipart form: file=<PDF/DOC/DOCX>
 *
 * Flow:
 *   1. Parse file text (pdf-parse for PDF, mammoth for DOCX)
 *   2. Extract structured data (Gemini)
 *   3. Upload original file to Google Drive
 *   4. Insert resume row in Supabase
 *
 * The route degrades gracefully: if Drive or Gemini are unavailable,
 * it still saves the resume row with whatever data it has.
 */
router.post(
  "/resume",
  requireAuth,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    const file = req.file
    const userId = req.user.id
    const fileName = file.originalname

    // ---- Step 1: parse file text (best-effort) ----
    let extractedText = ""
    if (file.mimetype === "application/pdf") {
      try {
        const parsed = await pdf(file.buffer)
        extractedText = parsed.text || ""
      } catch (err) {
        console.warn("[upload] pdf-parse failed:", err.message)
      }
    } else if (
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer: file.buffer })
        extractedText = result.value || ""
      } catch (err) {
        console.warn("[upload] mammoth (DOCX) parsing failed:", err.message)
      }
    } else if (file.mimetype === "application/msword") {
      try {
        const result = await mammoth.extractRawText({ buffer: file.buffer })
        extractedText = result.value || ""
      } catch (err) {
        console.warn("[upload] mammoth (DOC) parsing failed:", err.message)
      }
    }

    // ---- Step 2: extract structured data via Gemini (best-effort) ----
    let geminiData = {
      name: null,
      email: null,
      phone: null,
      skills: [],
      experience_years: null,
      current_role: null,
      summary: null,
    }
    if (extractedText) {
      try {
        geminiData = await extractResumeData(extractedText)
      } catch (err) {
        console.warn("[upload] Gemini extraction failed:", err.message)
      }
    }

    // ---- Step 3: upload original to Google Drive (best-effort) ----
    let driveFileId = null
    let driveWebViewLink = null
    const drive = getDrive()
    if (drive && DRIVE_FOLDER_ID) {
      try {
        const uploadResult = await drive.files.create({
          requestBody: {
            name: fileName,
            parents: [DRIVE_FOLDER_ID],
          },
          media: {
            mimeType: file.mimetype,
            body: file.buffer,
          },
          fields: "id, webViewLink",
        })
        driveFileId = uploadResult.data.id
        driveWebViewLink = uploadResult.data.webViewLink
      } catch (err) {
        console.warn("[upload] Drive upload failed:", err.message)
      }
    } else if (getDriveError()) {
      console.warn("[upload] Drive not configured, skipping upload:", getDriveError().message)
    }

    // ---- Step 4: insert resume row ----
    const insertPayload = {
      user_id: userId,
      name: geminiData.current_role
        ? `${geminiData.current_role} Resume`
        : fileName.replace(/\.[^.]+$/, ""),
      file_name: fileName,
      file_size: file.size,
      mime_type: file.mimetype,
      drive_file_id: driveFileId,
      drive_web_view_link: driveWebViewLink,
      extracted_text: extractedText.slice(0, 10000),
      ats_score: null, // could be computed later
      target_role: geminiData.current_role || null,
      parsed_skills: geminiData.skills || [],
      parsed_email: geminiData.email,
      parsed_phone: geminiData.phone,
      parsed_experience_years: geminiData.experience_years,
      parsed_summary: geminiData.summary,
    }

    const { data, error } = await supabaseAdmin
      .from("resumes")
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.status(201).json({
      resume: data,
      extracted: geminiData,
      warnings: {
        drive: !driveFileId ? "File not uploaded to Drive (check config)" : null,
        gemini: !geminiData.summary ? "AI extraction skipped or failed" : null,
      },
    })
  })
)

export default router
