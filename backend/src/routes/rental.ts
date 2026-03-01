import { Router } from "express";
import {
  createRentalRequest,
  getOwnerRentalRequests,
  approveRentalRequest,
  rejectRentalRequest,
  getAllRentalRequests,
  createLeaseContract,
  approveContract,
  getMemberRentalRequests,
} from "../controllers/rental.controller";

import { terminateContract } from "../controllers/lease.controller";

const router = Router();

router.post("/request", createRentalRequest);
router.post("/contract", createLeaseContract); // 🔥 สำหรับสร้าง contract หลังจาก approve request

router.get("/", getAllRentalRequests); // 🔥 สำหรับ admin
router.get("/owner/:ownerId", getOwnerRentalRequests);
router.get("/member/:userId", getMemberRentalRequests); // 🔥 สำหรับ member ดู request ของตัวเอง (ทั้งที่เป็น owner และ tenant)

router.patch("/:id/approve", approveRentalRequest);
router.patch("/:id/reject", rejectRentalRequest);
router.patch("/contracts/:id/approve", approveContract);
router.patch("/contracts/:id/terminate", terminateContract)

export default router;
