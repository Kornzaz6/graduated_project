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
} from "../controllers/dormitory.controller";

import {
  uploadRoomImage,
  deleteRoomImage
} from "../controllers/roomImage.controller";

import { uploadDormitoryImages } from "../middleware/dormitory";
import { uploadSlipMiddleware } from "../middleware/upload"; // ใช้ multer upload
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