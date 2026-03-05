import { Router } from "express"
import {
  createReview,
  getDormitoryReviews,
  deleteReview
} from "../controllers/review.controller"

import { authMiddleware } from "../middleware/auth"

const router = Router()

/* ================= CREATE REVIEW ================= */

router.post("/", authMiddleware, createReview)

/* ================= GET REVIEWS ================= */

router.get("/dormitory/:dormitoryId", getDormitoryReviews)

/* ================= DELETE REVIEW ================= */

router.delete("/:id", authMiddleware, deleteReview)

export default router