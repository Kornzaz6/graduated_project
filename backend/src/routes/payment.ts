import { Router } from "express"

import {
  uploadSlip,
  confirmPayment,
  rejectPayment,
  getPaymentsByContract,
  generatePaymentQR,
  ownerCreatePayment,
  ownerGenerateCustomQR,
  getPaymentsByOwner,
  getPaymentById
} from "../controllers/payment.controller"

import { uploadSlipMiddleware } from "../middleware/upload"
import { authMiddleware } from "../middleware/auth"

const router = Router()

/* =====================================================
   MEMBER ROUTES
===================================================== */

router.post(
  "/:id/upload-slip",
  authMiddleware,
  uploadSlipMiddleware.single("slip"),
  uploadSlip
)

router.get(
  "/contract/:contractId/qr",
  authMiddleware,
  generatePaymentQR
)

router.get(
  "/contract/:contractId",
  authMiddleware,
  getPaymentsByContract
)

/* =====================================================
   OWNER ROUTES
===================================================== */

router.post(
  "/owner/create",
  authMiddleware,
  ownerCreatePayment
)

router.post(
  "/owner/generate-qr",
  authMiddleware,
  ownerGenerateCustomQR
)

router.patch(
  "/:id/confirm",
  authMiddleware,
  confirmPayment
)

router.patch(
  "/:id/reject",
  authMiddleware,
  rejectPayment
)

router.get(
  "/owner/payments",
  authMiddleware,
  getPaymentsByOwner
)

router.get(
  "/:id",
  authMiddleware,
  getPaymentById
)

export default router