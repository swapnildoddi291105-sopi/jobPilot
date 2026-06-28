import { Router } from "express"
import { requireAuth } from "../middleware/auth.js"
import { requireAdminOrUser } from "../middleware/requireAdminOrUser.js"
import { asyncHandler } from "../middleware/errorHandler.js"
import { optimizeJob, optimizeBatch } from "../controllers/optimizeController.js"

const router = Router()

router.post("/batch", requireAuth, asyncHandler(optimizeBatch))
router.post("/:jobId", requireAdminOrUser, asyncHandler(optimizeJob))

export default router
