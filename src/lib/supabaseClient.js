import { createClient } from "@supabase/supabase-js"

// These are safe to expose to the browser (anon key is public; RLS protects data).
// Configure via Vite env vars, falling back to the provided project values.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://ahfxbqpiqgihciukhjfk.supabase.co"
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZnhicXBpcWdpaGNpdWtoamZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NzU1NDEsImV4cCI6MjA5ODE1MTU0MX0.PFLHcFAQnxhnvZun8Zh0zM-cCQnbkF79wdHIvnJK9k0"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
