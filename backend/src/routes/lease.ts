import { Router } from "express";
import { getAllLeaseContracts, getOwnerLeaseContracts } from "../controllers/lease.controller";

const router = Router();

router.get("/", getAllLeaseContracts);
router.get("/owner/:userId", getOwnerLeaseContracts)

export default router;