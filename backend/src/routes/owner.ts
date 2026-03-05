import { Router } from "express"
import {
  applyOwner,
  getOwnerApplications,
  approveOwner,
  rejectOwner,
  removeOwner,
  getAllOwners,
  getOwnerProfile,
  updateOwnerProfile,
  getOwnerTenants
} from "../controllers/owner.controller"

import { uploadOwnerDocs } from "../middleware/ownerUpload"
import { authMiddleware } from "../middleware/auth"

const router = Router()

/* =====================================================
   OWNER APPLICATION FLOW
===================================================== */

// Member สมัครเป็นเจ้าของ (พร้อมอัปโหลดเอกสาร)
router.post(
  "/apply",
  uploadOwnerDocs.fields([
    { name: "idCardImage", maxCount: 1 },
    { name: "businessLicense", maxCount: 1 }
  ]),
  applyOwner
)

// Admin ดูรายการใบสมัครทั้งหมด
router.get("/applications", getOwnerApplications)

router.get(
  "/tenants",
  authMiddleware,
  getOwnerTenants
)

// Admin อนุมัติใบสมัคร
router.patch("/applications/:id/approve", approveOwner)

// Admin ปฏิเสธใบสมัคร
router.patch("/applications/:id/reject", rejectOwner)

/* =====================================================
   OWNER PROFILE
===================================================== */

router.get("/profile/:userId", getOwnerProfile)
router.put("/profile/:userId", updateOwnerProfile)

/* =====================================================
   MANAGE OWNERS (ADMIN)
===================================================== */

// Admin ดู owner ทั้งหมด
router.get("/", getAllOwners)

// Admin ลบสิทธิ์ owner
router.delete("/:id", removeOwner)

export default router