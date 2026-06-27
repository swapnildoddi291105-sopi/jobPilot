import { supabaseAdmin } from "../config/supabase.js"

const LOG_LEVELS = { info: "info", warn: "warn", error: "error" }

export function createWorkflowLogger(workflowName) {
  async function log({ userId, status, message, meta }) {
    const payload = {
      user_id: userId || null,
      status: status || "info",
      message: message || "",
      meta: {
        ...(meta || {}),
        workflow: workflowName,
        timestamp: new Date().toISOString(),
      },
    }

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from("workflow_logs").insert(payload)
      } catch (err) {
        console.warn(`[logger] Failed to write workflow_log: ${err.message}`)
      }
    }

    if (status === "error") {
      console.error(`[${workflowName}] ${message}`, meta?.error || "")
    } else {
      console.log(`[${workflowName}] ${message}`)
    }

    return payload
  }

  return {
    info: (userId, message, meta) => log({ userId, status: "info", message, meta }),
    warn: (userId, message, meta) => log({ userId, status: "warn", message, meta }),
    error: (userId, message, meta) => log({ userId, status: "error", message, meta }),
  }
}
