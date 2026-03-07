import { Router } from "express"
import { getContractById } from "../controllers/contract.controller"
import { authMiddleware } from "../middleware/auth"

const router = Router()

router.get(
  "/:id",
  authMiddleware,
  getContractById
)

export default router