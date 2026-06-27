import "dotenv/config"
import express from "express"
import cors from "cors"
import morgan from "morgan"
import helmet from "helmet"
import compression from "compression"
import rateLimit from "express-rate-limit"
import path from "path"
import { fileURLToPath } from "url"

import authRoutes from "./routes/auth.js"
import jobsRoutes from "./routes/jobs.js"
import resumesRoutes from "./routes/resumes.js"
import settingsRoutes from "./routes/settings.js"
import uploadRoutes from "./routes/upload.js"
import scrapeRoutes from "./routes/scrape.js"
import dashboardRoutes from "./routes/dashboard.js"
import optimizeRoutes from "./routes/optimize.js"
import emailRoutes from "./routes/email.js"
import coverLetterRoutes from "./routes/coverLetter.js"
import adminRoutes from "./routes/admin.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { supabaseAdmin } from "./config/supabase.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 5000
const isProduction = process.env.NODE_ENV === "production"

// ---- Startup validation ----
if (!supabaseAdmin) {
  console.error("[startup] FATAL: SUPABASE_SERVICE_KEY is not set. All database operations will fail.")
  process.exit(1)
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error("[startup] FATAL: SUPABASE_URL or SUPABASE_ANON_KEY is not set.")
  process.exit(1)
}

// ---- Security & Performance Middleware ----
app.use(helmet())
app.use(compression())

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
})
app.use("/api/", limiter)

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))
if (!isProduction) {
  app.use(morgan("dev"))
}

// ---- Health check ----
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "jobpilot-backend",
    timestamp: new Date().toISOString(),
  })
})

// ---- API Routes ----
app.use("/api/auth", authRoutes)
app.use("/api/jobs", jobsRoutes)
app.use("/api/resumes", resumesRoutes)
app.use("/api/settings", settingsRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/scrape", scrapeRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/optimize", optimizeRoutes)
app.use("/api/email", emailRoutes)
app.use("/api/cover-letter", coverLetterRoutes)
app.use("/api/admin", adminRoutes)

// ---- Serve frontend static files in production ----
if (isProduction) {
  const distPath = path.resolve(__dirname, "../../dist")
  app.use(express.static(distPath))
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"))
  })
}

// ---- 404 for API routes only ----
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` })
})

// ---- Error handler (must be last) ----
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`\n🚀 JobPilot backend running on http://localhost:${PORT}`)
  console.log(`   Client origin: ${process.env.CLIENT_URL || "http://localhost:5173"}`)
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}\n`)
})
