import { google } from "googleapis"
import { readFileSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let driveClient = null
let driveAuthError = null

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

function initDrive() {
  try {
    const credentials = loadGoogleCredentials()

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    })

    driveClient = google.drive({ version: "v3", auth })
    return driveClient
  } catch (err) {
    driveAuthError = err
    console.warn(
      `[google-drive] Could not initialize: ${err.message}. Upload routes will return 503.`
    )
    return null
  }
}

export function getDrive() {
  if (!driveClient && !driveAuthError) initDrive()
  return driveClient
}

export function getDriveError() {
  return driveAuthError
}

export const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || ""
