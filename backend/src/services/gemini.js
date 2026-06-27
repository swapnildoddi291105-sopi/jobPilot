import { getGemini, getGeminiError } from "../config/gemini.js"

export async function optimizeResume(resumeText, jobDescription, jobTitle) {
  const ai = getGemini()
  if (!ai) {
    throw new Error(getGeminiError()?.message || "Gemini not configured")
  }

  const prompt = `You are a senior ATS (Applicant Tracking System) resume optimization expert with 15 years of experience.

STRICT RULES:
- NEVER invent fake experience, projects, or skills
- NEVER change job titles, companies, or employment dates
- ONLY improve how existing experience is described
- Match keywords from the job description naturally
- Keep bullet points concise and impact-driven (use numbers/metrics where they already exist)
- Return ONLY valid JSON — no markdown, no explanation, no backticks

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription.substring(0, 3000)}

ORIGINAL RESUME:
${resumeText.substring(0, 4000)}

Return this exact JSON structure:
{
  "summary": "2-3 sentence professional summary targeting this specific role",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": [
    {
      "company": "exact company name from resume",
      "title": "exact title from resume",
      "dates": "exact dates from resume",
      "bullets": ["improved bullet 1", "improved bullet 2"]
    }
  ],
  "education": [
    {
      "school": "school name",
      "degree": "degree name",
      "year": "graduation year"
    }
  ],
  "ats_score": 87,
  "missing_keywords": ["keyword1", "keyword2"],
  "improvements_made": ["Added X keyword", "Improved Y description"]
}`

  try {
    const result = await ai.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      const cleaned = text.replace(/```json\n?|```\n?/g, "").trim()
      parsed = JSON.parse(cleaned)
    }

    return parsed
  } catch (err) {
    throw new Error("Gemini optimization failed: " + err.message)
  }
}
