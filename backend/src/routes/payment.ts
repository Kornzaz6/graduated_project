import { Router } from "express"

import {
  uploadSlip,
  confirmPayment,
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

/* Upload payment slip */
router.post(
  "/:id/upload-slip",
  authMiddleware,
  uploadSlipMiddleware.single("slip"),
  uploadSlip
)

/* Generate payment QR */
router.get(
  "/contract/:contractId/qr",
  authMiddleware,
  generatePaymentQR
)

/* Get contract payments */
router.get(
  "/contract/:contractId",
  authMiddleware,
  getPaymentsByContract
)

/* =====================================================
   OWNER ROUTES
===================================================== */

/* Create monthly payment bill */
router.post(
  "/owner/create",
  authMiddleware,
  ownerCreatePayment
)

/* Generate custom QR (manual payment) */
router.post(
  "/owner/generate-qr",
  authMiddleware,
  ownerGenerateCustomQR
)

/* Confirm payment */
router.patch(
  "/:id/confirm",
  authMiddleware,
  confirmPayment
)

/* Get all owner payments */
router.get(
  "/owner/payments",
  authMiddleware,
  getPaymentsByOwner
)

/* Get payment detail */
router.get(
  "/detail/:id",
  authMiddleware,
  getPaymentById
)

export default router