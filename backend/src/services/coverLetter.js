import { getGemini, getGeminiError } from "../config/gemini.js"

export async function generateCoverLetter({ resumeText, jobTitle, jobDescription, company, tone = "professional" }) {
  const ai = getGemini()
  if (!ai) {
    throw new Error(getGeminiError()?.message || "Gemini not configured")
  }

  const prompt = `You are an expert cover letter writer.
Generate a ${tone} cover letter for the following job application.

STRICT RULES:
- NEVER invent experience or qualifications not in the resume
- Keep it concise (max 350 words)
- Address the hiring manager directly
- Highlight relevant skills from the resume that match the job description
- Return ONLY the cover letter text — no explanation, no JSON, no markdown

JOB TITLE: ${jobTitle}
COMPANY: ${company || "the company"}
JOB DESCRIPTION:
${(jobDescription || "").substring(0, 3000)}

RESUME:
${(resumeText || "").substring(0, 3000)}`

  try {
    const result = await ai.generateContent(prompt)
    const response = await result.response
    return response.text().trim()
  } catch (err) {
    throw new Error("Cover letter generation failed: " + err.message)
  }
}
