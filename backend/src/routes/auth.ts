import { Router } from "express"
import { register, login, getCurrentUser } from "../controllers/auth.controller"
import { authMiddleware } from "../middleware/auth"

const router = Router()

/* ================= AUTH ================= */

router.post("/register", register)
router.post("/login", login)

/* ================= CURRENT USER ================= */

router.get("/me", authMiddleware, getCurrentUser)

export default router