import { Router } from "express";
import {
  applyOwner,
  getOwnerApplications,
  approveOwner,
  rejectOwner,
} from "../controllers/owner.controller";

const router = Router();

// สมัครเป็นเจ้าของ
router.post("/apply", applyOwner);

// Admin ดูรายการสมัคร
router.get("/applications", getOwnerApplications);

// Admin อนุมัติ
router.patch("/applications/:id/approve", approveOwner);

// Admin ปฏิเสธ
router.patch("/applications/:id/reject", rejectOwner);

export default router;
