import { createClient } from "@supabase/supabase-js"

// These are safe to expose to the browser (anon key is public; RLS protects data).
// Configure via Vite env vars, falling back to the provided project values.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://vpndvocbunvctjcxzpdb.supabase.co"
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbmR2b2NidW52Y3RqY3h6cGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0Nzc2NjAsImV4cCI6MjA5ODA1MzY2MH0._6wP4NI4CdzhifwpNH03yqGkUQ7sYp53nLD4WIaolrs"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
