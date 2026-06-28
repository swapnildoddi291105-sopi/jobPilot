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
const missingVars = []
if (!process.env.SUPABASE_URL) missingVars.push("SUPABASE_URL")
if (!process.env.SUPABASE_ANON_KEY) missingVars.push("SUPABASE_ANON_KEY")
if (!process.env.SUPABASE_SERVICE_KEY) missingVars.push("SUPABASE_SERVICE_KEY")

if (missingVars.length > 0) {
  console.error(`[startup] FATAL: Missing required environment variables: ${missingVars.join(", ")}`)
  console.error("[startup] Copy backend/.env.example to backend/.env and fill in the values.")
  process.exit(1)
}

if (!supabaseAdmin) {
  console.error("[startup] FATAL: Supabase admin client could not be initialized.")
  process.exit(1)
}

// ---- Security & Performance Middleware ----
const supabaseUrl = process.env.SUPABASE_URL || "https://ahfxbqpiqgihciukhjfk.supabase.co"
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", supabaseUrl, "https://*.supabase.co", "wss://*.supabase.co"],
        fontSrc: ["'self'", "https:", "data:"],
        imgSrc: ["'self'", "data:"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "https:", "'unsafe-inline'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
)
app.use(compression())

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
})
app.use("/api/", limiter)

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
})
app.use("/api/auth/login", authLimiter)
app.use("/api/auth/register", authLimiter)

app.use(
  cors({
    origin: isProduction
      ? [process.env.CLIENT_URL, process.env.RENDER_EXTERNAL_URL].filter(Boolean)
      : process.env.CLIENT_URL || "http://localhost:5173",
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
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`)
  if (isProduction) {
    const renderUrl = process.env.RENDER_EXTERNAL_URL?.replace(/^https?:\/\//, "") || "your-app.onrender.com"
    console.log(`\n⚠️  IMPORTANT: Add this URL to Supabase Auth settings:`)
    console.log(`   Site URL: https://${renderUrl}`)
    console.log(`   Redirect URLs: https://${renderUrl}/**`)
  }
  console.log("")
})
