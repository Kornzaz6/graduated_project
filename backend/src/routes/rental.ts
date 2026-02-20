import { Router } from "express";
import {
  createRentalRequest,
  getOwnerRentalRequests,
  approveRentalRequest,
  rejectRentalRequest,
} from "../controllers/rental.controller";

const router = Router();

router.post("/request", createRentalRequest);
router.get("/owner/:ownerId", getOwnerRentalRequests);
router.patch("/:id/approve", approveRentalRequest);
router.patch("/:id/reject", rejectRentalRequest);

export default router;
