import { Router } from "express";
import { createDormitory, createRoom, deleteRoom, getDormitories, getMyDormitories, getOwnerDormitories, getRoomsByDormitory, updateRoom } from "../controllers/dormitory.controller";
import { get } from "node:http";

const router = Router();

router.post("/", createDormitory);
router.post("/rooms", createRoom);

router.get("/", getDormitories);
router.get("/owners/:ownerId", getOwnerDormitories);
router.get("/owner/:userId", getMyDormitories);
router.get("/rooms/:dormId", getRoomsByDormitory); // ✅ แก้ตรงนี้

router.patch("/rooms/:id", updateRoom);
router.delete("/rooms/:id", deleteRoom);

export default router;

