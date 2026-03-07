import { Router } from "express";

import {
  createDormitory,
  createRoom,
  deleteRoom,
  getDormitories,
  getMyDormitories,
  getOwnerDormitories,
  getRoomsByDormitory,
  updateRoom,
  getDormitoryById,
  approveDormitory,
  rejectDormitory,
  getPendingDormitories,
  uploadDormitoryImagesController,
  deleteDormitoryImage,
  updateDormitory
} from "../controllers/dormitory.controller";

import {
  uploadRoomImage,
  deleteRoomImage
} from "../controllers/roomImage.controller";

import { uploadDormitoryImages } from "../middleware/dormitory";
import { uploadSlipMiddleware } from "../middleware/upload";
import { authMiddleware } from "../middleware/auth";

const router = Router();

/* =========================
   DORMITORY
========================= */

// List all dormitories
router.get("/", getDormitories);

// 🔥 static route before dynamic
router.get("/pending", authMiddleware, getPendingDormitories);

// Create dormitory
router.post(
  "/",
  uploadDormitoryImages.array("images"),
  createDormitory
);

// 🔥 UPDATE DORMITORY (เพิ่มตรงนี้)
router.patch("/:id", updateDormitory);


/* =========================
   OWNER
========================= */

// Get dormitories by ownerId
router.get("/owners/:ownerId", getOwnerDormitories);

// Get dormitories by userId
router.get("/owner/:userId", getMyDormitories);


/* =========================
   ROOMS
========================= */

// Create room
router.post("/rooms", createRoom);

// Get rooms by dormitory
router.get("/rooms/:dormId", getRoomsByDormitory);

// Update room
router.patch("/rooms/:id", updateRoom);

// Delete room
router.delete("/rooms/:id", deleteRoom);


/* =========================
   DORMITORY IMAGES
========================= */

// Upload dormitory images
router.post(
  "/:id/images",
  uploadDormitoryImages.array("images"),
  uploadDormitoryImagesController
);

// Delete dormitory image
router.delete("/images/:imageId", deleteDormitoryImage);


/* =========================
   ROOM IMAGES
========================= */

// Upload room image
router.post(
  "/rooms/:id/images",
  uploadSlipMiddleware.single("image"),
  uploadRoomImage
);

// Delete room image
router.delete(
  "/rooms/images/:imageId",
  deleteRoomImage
);


/* =========================
   ADMIN ACTIONS
========================= */

// Approve dormitory
router.patch("/:id/approve", authMiddleware, approveDormitory);

// Reject dormitory
router.patch("/:id/reject", authMiddleware, rejectDormitory);


/* =========================
   SINGLE DORM (MUST BE LAST)
========================= */

// ⚠️ dynamic route must be LAST
router.get("/:id", getDormitoryById);

export default router;