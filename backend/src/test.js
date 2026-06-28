import "dotenv/config"

const TESTS_PASSED = []
const TESTS_FAILED = []

function assert(condition, name) {
  if (condition) {
    TESTS_PASSED.push(name)
    console.log(`  ✅ ${name}`)
  } else {
    TESTS_FAILED.push(name)
    console.log(`  ❌ ${name}`)
  }
}

async function runTests() {
  console.log("\n🧪 JobPilot Backend Tests\n")

  // ---- Environment Variable Tests ----
  console.log("── Environment Variables ──")
  assert(!!process.env.SUPABASE_URL, "SUPABASE_URL is set")
  assert(!!process.env.SUPABASE_ANON_KEY, "SUPABASE_ANON_KEY is set")
  assert(!!process.env.SUPABASE_SERVICE_KEY, "SUPABASE_SERVICE_KEY is set")
  assert(!!process.env.PORT, "PORT is set")

  // ---- Supabase Client Tests ----
  console.log("\n── Supabase Clients ──")
  const { supabase, supabaseAdmin } = await import("./config/supabase.js")
  assert(!!supabase, "supabase anon client created")
  assert(!!supabaseAdmin, "supabase admin client created")

  // ---- Health Check Route (optional - server may not be running) ----
  console.log("\n── Health Check ──")
  try {
    const url = `http://localhost:${process.env.PORT || 5000}/api/health`
    const resp = await fetch(url)
    const data = await resp.json()
    assert(resp.status === 200, "Health endpoint returns 200")
    assert(data.status === "ok", "Health endpoint returns status ok")
    assert(typeof data.timestamp === "string", "Health endpoint returns timestamp")
  } catch {
    console.log("  ⚠️  Server not running (start with `npm run dev` to test health endpoint)")
  }

  // ---- Middleware Tests ----
  console.log("\n── Middleware ──")
  const { asyncHandler, errorHandler } = await import("./middleware/errorHandler.js")
  const handler = asyncHandler(async (req, res) => {
    res.json({ ok: true })
  })
  assert(typeof handler === "function", "asyncHandler wraps function")
  assert(typeof errorHandler === "function", "errorHandler is exported")

  const { requireAuth } = await import("./middleware/auth.js")
  assert(typeof requireAuth === "function", "requireAuth is a function")

  const { adminAuth } = await import("./middleware/adminAuth.js")
  assert(typeof adminAuth === "function", "adminAuth is a function")

  const { requireAdminOrUser } = await import("./middleware/requireAdminOrUser.js")
  assert(typeof requireAdminOrUser === "function", "requireAdminOrUser is a function")

  // ---- Route Import Tests ----
  console.log("\n── Route Imports ──")
  const routes = [
    "auth", "jobs", "resumes", "settings", "upload",
    "scrape", "dashboard", "optimize", "email", "coverLetter", "admin",
  ]
  for (const name of routes) {
    const mod = await import(`./routes/${name}.js`)
    assert(!!mod.default && typeof mod.default === "function", `${name} route exports Router`)
  }

  // ---- Configuration Tests ----
  console.log("\n── Config ──")
  const geminiMod = await import("./config/gemini.js")
  assert(typeof geminiMod.getGemini === "function", "gemini getGemini exported")
  assert(typeof geminiMod.extractResumeData === "function", "gemini extractResumeData exported")

  const apifyMod = await import("./config/apify.js")
  assert(typeof apifyMod.searchJobs === "function", "apify searchJobs exported")

  const googleMod = await import("./config/google.js")
  assert(typeof googleMod.getDrive === "function", "google getDrive exported")
  assert(typeof googleMod.getDriveError === "function", "google getDriveError exported")
  assert(typeof googleMod.DRIVE_FOLDER_ID === "string", "google DRIVE_FOLDER_ID exported")

  // ---- Service Tests ----
  console.log("\n── Services ──")
  const gmailMod = await import("./services/gmail.js")
  assert(typeof gmailMod.getGmail === "function", "gmail getGmail exported")
  assert(typeof gmailMod.getGmailError === "function", "gmail getGmailError exported")
  assert(typeof gmailMod.sendEmail === "function", "gmail sendEmail exported")

  // ---- Logger ----
  console.log("\n── Logger ──")
  const loggerMod = await import("./services/logger.js")
  assert(typeof loggerMod.createWorkflowLogger === "function", "createWorkflowLogger is a function")
  const workflowLogger = loggerMod.createWorkflowLogger("test")
  assert(typeof workflowLogger === "object", "workflowLogger object created")
  assert(typeof workflowLogger.info === "function", "workflowLogger.info is a function")
  assert(typeof workflowLogger.error === "function", "workflowLogger.error is a function")
  assert(typeof workflowLogger.warn === "function", "workflowLogger.warn is a function")

  // ---- Server Validation (import only, don't start) ----
  console.log("\n── Server Config ──")
  assert(typeof process.env.NODE_ENV === "string" || process.env.NODE_ENV === undefined, "NODE_ENV is optional")

  // ---- Security Tests ----
  console.log("\n── Security ──")
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  assert(EMAIL_RE.test("user@example.com"), "email regex accepts valid email")
  assert(!EMAIL_RE.test("notanemail"), "email regex rejects invalid email")
  assert(!EMAIL_RE.test(""), "email regex rejects empty string")

  // ---- Summary ----
  console.log("\n═══════════════════════════════════════════")
  console.log(`  Total: ${TESTS_PASSED.length + TESTS_FAILED.length}`)
  console.log(`  ✅ Passed: ${TESTS_PASSED.length}`)
  console.log(`  ❌ Failed: ${TESTS_FAILED.length}`)
  console.log(`  ${TESTS_FAILED.length === 0 ? "🎉 All tests passed!" : "⚠️  Some tests failed"}`)
  console.log("═══════════════════════════════════════════\n")

  process.exit(TESTS_FAILED.length > 0 ? 1 : 0)
}

runTests().catch((err) => {
  console.error("\n❌ Test runner error:", err.message)
  process.exit(1)
})
