import { exec } from "child_process"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import os from "os"

const execAsync = promisify(exec)

function escapeLatex(str) {
  if (!str) return ""
  return String(str)
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
}

function buildLatex(data, candidateName = "Candidate", email = "") {
  const { summary, skills, experience, education } = data

  const skillsStr = (skills || []).map(escapeLatex).join(", ")

  const experienceStr = (experience || [])
    .map(
      (exp) => `
\\subsection*{${escapeLatex(exp.title)} --- ${escapeLatex(exp.company)} \\hfill ${escapeLatex(exp.dates)}}
\\begin{itemize}
${(exp.bullets || []).map((b) => `  \\item ${escapeLatex(b)}`).join("\n")}
\\end{itemize}
`
    )
    .join("\n")

  const educationStr = (education || [])
    .map(
      (edu) => `
\\subsection*{${escapeLatex(edu.degree)} --- ${escapeLatex(edu.school)} \\hfill ${escapeLatex(edu.year)}}
`
    )
    .join("\n")

  return `
\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{parskip}

\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titleformat{\\subsection*}{\\normalsize\\bfseries}{}{0em}{}
\\setlist[itemize]{noitemsep, topsep=2pt, leftmargin=*}
\\pagestyle{empty}

\\begin{document}

\\begin{center}
  {\\LARGE \\textbf{${escapeLatex(candidateName)}}} \\\\[4pt]
  ${escapeLatex(email)}
\\end{center}

\\section{Summary}
${escapeLatex(summary || "")}

\\section{Skills}
${skillsStr}

\\section{Experience}
${experienceStr}

\\section{Education}
${educationStr}

\\end{document}
`
}

export async function generateResumePDF(data, candidateName, email) {
  const tempDir = os.tmpdir()
  const timestamp = Date.now()
  const texFile = path.join(tempDir, `resume_${timestamp}.tex`)
  const pdfFile = path.join(tempDir, `resume_${timestamp}.pdf`)

  const latexContent = buildLatex(data, candidateName, email)
  fs.writeFileSync(texFile, latexContent)

  try {
    await execAsync(`pdflatex -interaction=nonstopmode -output-directory "${tempDir}" "${texFile}"`)
    await execAsync(`pdflatex -interaction=nonstopmode -output-directory "${tempDir}" "${texFile}"`)

    const pdfBuffer = fs.readFileSync(pdfFile)

    for (const ext of [".tex", ".aux", ".log", ".out"]) {
      const f = path.join(tempDir, `resume_${timestamp}${ext}`)
      try {
        fs.unlinkSync(f)
      } catch {}
    }

    return pdfBuffer
  } catch (err) {
    throw new Error(
      "LaTeX compilation failed. Install texlive (Linux/Mac) or MiKTeX (Windows). Error: " +
        err.message
    )
  }
}
