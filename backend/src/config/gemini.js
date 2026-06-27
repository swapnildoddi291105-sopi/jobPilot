import { GoogleGenerativeAI } from "@google/generative-ai"

let genAI = null
let model = null
let geminiError = null

function initGemini() {
  if (!process.env.GEMINI_API_KEY) {
    geminiError = new Error("GEMINI_API_KEY is not set")
    console.warn("[gemini] GEMINI_API_KEY missing. Extraction routes will return 503.")
    return null
  }

  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    })
    return model
  } catch (err) {
    geminiError = err
    console.warn(`[gemini] Init failed: ${err.message}`)
    return null
  }
}

export function getGemini() {
  if (!model && !geminiError) initGemini()
  return model
}

export function getGeminiError() {
  return geminiError
}

/**
 * Extract structured data from resume text using Gemini.
 * Returns { name, email, phone, skills, experience, summary } on success.
 */
export async function extractResumeData(text) {
  const ai = getGemini()
  if (!ai) {
    throw new Error(
      geminiError?.message || "Gemini not configured"
    )
  }

  const prompt = `You are a resume parser. Extract structured information from the resume text below.
Return ONLY valid JSON (no markdown, no code fences) with these exact fields:
{
  "name": "full name or null",
  "email": "email or null",
  "phone": "phone or null",
  "skills": ["array of technical skills"],
  "experience_years": "number or null",
  "current_role": "most recent job title or null",
  "summary": "2-3 sentence professional summary"
}

Resume text:
"""
${text.slice(0, 12000)}
"""`

  const result = await ai.generateContent(prompt)
  const response = await result.response
  const output = response.text()

  // Strip any markdown code fences if present
  const cleaned = output
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    // If Gemini returns non-JSON, return a minimal fallback
    return {
      name: null,
      email: null,
      phone: null,
      skills: [],
      experience_years: null,
      current_role: null,
      summary: output.slice(0, 500),
    }
  }
}
