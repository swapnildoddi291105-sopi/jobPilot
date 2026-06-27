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

  // ---- Health Check Route ----
  console.log("\n── Health Check ──")
  try {
    const url = `http://localhost:${process.env.PORT || 5000}/api/health`
    const resp = await fetch(url)
    const data = await resp.json()
    assert(resp.status === 200, "Health endpoint returns 200")
    assert(data.status === "ok", "Health endpoint returns status ok")
  } catch {
    assert(false, "Health endpoint reachable (server must be running)")
  }

  // ---- Middleware Tests ----
  console.log("\n── Middleware ──")
  const { asyncHandler } = await import("./middleware/errorHandler.js")
  const handler = asyncHandler(async (req, res) => {
    res.json({ ok: true })
  })
  assert(typeof handler === "function", "asyncHandler wraps function")

  const { requireAuth } = await import("./middleware/auth.js")
  assert(typeof requireAuth === "function", "requireAuth is a function")

  const { adminAuth } = await import("./middleware/adminAuth.js")
  assert(typeof adminAuth === "function", "adminAuth is a function")

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
