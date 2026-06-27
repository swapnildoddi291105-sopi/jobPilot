import { ApifyClient } from "apify-client"

let client = null
let apifyError = null

function initApify() {
  if (!process.env.APIFY_API_TOKEN) {
    apifyError = new Error("APIFY_API_TOKEN is not set")
    console.warn("[apify] APIFY_API_TOKEN missing. Scrape routes will return 503.")
    return null
  }

  try {
    client = new ApifyClient({ token: process.env.APIFY_API_TOKEN })
    return client
  } catch (err) {
    apifyError = err
    console.warn(`[apify] Init failed: ${err.message}`)
    return null
  }
}

export function getApify() {
  if (!client && !apifyError) initApify()
  return client
}

export function getApifyError() {
  return apifyError
}

/**
 * Search jobs via Apify. Uses the free "Google Jobs Scraper" actor as default.
 * Returns normalized job objects.
 *
 * @param {Object} opts
 * @param {string} opts.query - e.g. "Senior Frontend Engineer"
 * @param {string} [opts.location] - e.g. "Remote, USA"
 * @param {number} [opts.maxResults]
 */
export async function searchJobs({ query, location = "", maxResults = 20 }) {
  const apify = getApify()
  if (!apify) {
    throw new Error(apifyError?.message || "Apify not configured")
  }

  // Google Jobs Scraper — popular free actor. Swap ACTOR_ID in .env to use another.
  const actorId = process.env.APIFY_ACTOR_ID || "beOaHHMFnzMr6nGNU"

  const run = await apify.actor(actorId).call({
    queries: `${query}${location ? " " + location : ""}`,
    maxResults: maxResults,
    saveHtml: false,
  })

  const { items } = await apify.dataset(run.defaultDatasetId).listItems()

  // Normalize Apify output to our schema
  return items.map((item, idx) => ({
    id: `apify-${run.id}-${idx}`,
    title: item.title || "Unknown Title",
    company: item.companyName || item.company || "Unknown Company",
    location: item.location || location || "Unknown",
    source: "Google Jobs",
    salary: item.salary || "",
    url: item.url || item.applyLink || "",
    description: item.description || "",
    date_posted: item.datePosted || new Date().toISOString(),
  }))
}
