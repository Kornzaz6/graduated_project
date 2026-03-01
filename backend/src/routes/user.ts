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

router.get("/", getAllUsers)
router.get("/:id", getUserById)

router.patch("/:id", updateUserProfile)
router.patch("/:id/change-password", changePassword)

router.patch("/:id/role", updateUserRole)
router.patch("/:id/status", toggleUserStatus)

export default router