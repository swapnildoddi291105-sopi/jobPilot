import axios from "axios"
import { supabase } from "./supabaseClient"

// Calls go to the backend via Vite dev proxy (/api -> http://localhost:5000).
// In production, point VITE_API_URL at the deployed backend.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
})

// Attach the Supabase access token to every request
api.interceptors.request.use(async (config) => {
  if (!supabase) return config
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Surface backend error messages cleanly
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.detail ||
      error.message ||
      "Request failed"
    return Promise.reject(new Error(message))
  }
)

export default api
