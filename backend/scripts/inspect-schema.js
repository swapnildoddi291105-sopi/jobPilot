import "dotenv/config"

const SUPABASE_URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY

async function main() {
  // Try to reload schema cache
  console.log("=== REFRESHING SCHEMA CACHE ===")

  const payloads = [
    { query: "NOTIFY pgrst, 'reload schema'" },
    {},
  ]

  for (const payload of payloads) {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/pgrst_reload`, {
      method: "POST",
      headers: {
        "apikey": KEY,
        "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
    console.log(`pgrst_reload: ${resp.status}`)
    const text = await resp.text()
    if (text) console.log(`  ${text.slice(0, 200)}`)
  }

  // Now re-test the columns
  console.log("\n=== RE-TESTING AFTER REFRESH ===")
  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(SUPABASE_URL, KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const checks = [
    ["profiles", ["id", "email", "full_name"]],
    ["user_settings", ["user_id", "target_roles"]],
    ["resumes", ["ats_score", "parsed_skills"]],
    ["jobs", ["date_applied", "user_id"]],
    ["optimized_resumes", ["missing_keywords", "optimized_data"]],
    ["workflow_logs", ["meta"]],
  ]

  for (const [table, cols] of checks) {
    for (const col of cols) {
      const { error } = await supabase.from(table).select(col).limit(0)
      const ok = !error || !error.message?.includes("Could not find")
      console.log(`  ${table}.${col}: ${ok ? "✅" : "❌"} ${error?.message?.slice(0, 80) || ""}`)
    }
  }
}

main().catch(console.error)
