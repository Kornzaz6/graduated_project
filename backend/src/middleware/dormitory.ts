import { Router } from "express";
import {
  createDormitory,
  getDormitories,
} from "../controllers/dormitory.controller";
import { requireOwner } from "../middleware/requireOwner";

const router = Router();

router.get("/", getDormitories);

// 🔥 จำกัดสิทธิ์ตรงนี้
router.post("/", requireOwner, createDormitory);

export default router;
