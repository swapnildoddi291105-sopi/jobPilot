import { google } from "googleapis"
import { readFileSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let gmailClient = null
let gmailError = null

function loadGoogleCredentials() {
  const env = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (!env) {
    const fallback = path.resolve(__dirname, "../../credentials/google-service-account.json")
    try {
      return JSON.parse(readFileSync(fallback, "utf-8"))
    } catch {
      throw new Error(
        "GOOGLE_APPLICATION_CREDENTIALS not set and credentials file not found at " + fallback
      )
    }
  }
  const trimmed = env.trim()
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed)
  }
  try {
    return JSON.parse(readFileSync(path.resolve(trimmed), "utf-8"))
  } catch {
    throw new Error("Could not read credentials file at " + path.resolve(trimmed))
  }
}

function initGmail() {
  try {
    const credentials = loadGoogleCredentials()

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/gmail.send"],
    })

    gmailClient = google.gmail({ version: "v1", auth })
    return gmailClient
  } catch (err) {
    gmailError = err
    console.warn(`[gmail] Could not initialize: ${err.message}. Email send routes will return 503.`)
    return null
  }
}

export function getGmail() {
  if (!gmailClient && !gmailError) initGmail()
  return gmailClient
}

export function getGmailError() {
  return gmailError
}

function createMessage(to, subject, body, attachmentBuffer, attachmentName) {
  const boundary = `boundary${Date.now()}`
  const lines = []

  lines.push(`MIME-Version: 1.0`)
  lines.push(`To: ${to}`)
  lines.push(`Subject: ${subject}`)
  lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`)
  lines.push("")
  lines.push(`--${boundary}`)
  lines.push(`Content-Type: text/plain; charset="UTF-8"`)
  lines.push("")
  lines.push(body)
  lines.push("")

  if (attachmentBuffer && attachmentName) {
    const base64 = attachmentBuffer.toString("base64")
    lines.push(`--${boundary}`)
    lines.push(`Content-Type: application/pdf; name="${attachmentName}"`)
    lines.push("Content-Transfer-Encoding: base64")
    lines.push(`Content-Disposition: attachment; filename="${attachmentName}"`)
    lines.push("")
    lines.push(base64)
    lines.push("")
  }

  lines.push(`--${boundary}--`)

  const encoded = Buffer.from(lines.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

  return { raw: encoded }
}

export async function sendEmail({ to, subject, body, attachmentBuffer, attachmentName }) {
  const gmail = getGmail()
  if (!gmail) {
    throw new Error(gmailError?.message || "Gmail not configured")
  }

  const message = createMessage(to, subject, body, attachmentBuffer, attachmentName)

  try {
    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: message,
    })
    return { messageId: response.data.id, sent: true }
  } catch (err) {
    throw new Error("Failed to send email: " + err.message)
  }
}
