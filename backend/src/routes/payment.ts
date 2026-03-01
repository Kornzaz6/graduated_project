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

import { uploadSlipMiddleware } from "../middleware/upload"   // ✅ แก้ตรงนี้
import { authMiddleware } from "../middleware/auth"

const router = Router()

/* =====================================================
   MEMBER ROUTES
===================================================== */

// Upload slip
router.post(
  "/:id/upload-slip",
  authMiddleware,
  uploadSlipMiddleware.single("slip"),   // ✅ ใช้ upload จาก upload.ts
  uploadSlip
)

// Generate QR for contract
router.get(
  "/contract/:contractId/qr",
  authMiddleware,
  generatePaymentQR
)

// Get payments by contract
router.get(
  "/contract/:contractId",
  authMiddleware,
  getPaymentsByContract
)

/* =====================================================
   OWNER ROUTES
===================================================== */

// Owner create monthly payment
router.post(
  "/owner/create",
  authMiddleware,
  ownerCreatePayment
)

// Owner generate custom QR
router.post(
  "/owner/generate-qr",
  authMiddleware,
  ownerGenerateCustomQR
)

// Owner confirm payment
router.patch(
  "/:id/confirm",
  authMiddleware,
  confirmPayment
)

// Owner view all payments of their dormitories
router.get(
  "/owner",
  authMiddleware,
  getPaymentsByOwner
)

// Get payment by id (for owner confirm page)
router.get(
  "/:id",
  authMiddleware,
  getPaymentById
)

export default router