import { Router } from "express"
import {
  getAllUsers,
  getUserById,
  updateUserProfile,
  changePassword,
  updateUserRole,
  toggleUserStatus
} from "../controllers/user.controller"

const router = Router()

/* ================= USERS ================= */

router.get("/", getAllUsers)

/* ================= PROFILE ================= */

router.get("/:id", getUserById)
router.patch("/:id", updateUserProfile)

/* ================= PASSWORD ================= */

router.patch("/:id/change-password", changePassword)

/* ================= ADMIN ================= */

router.patch("/:id/role", updateUserRole)
router.patch("/:id/status", toggleUserStatus)

export default router