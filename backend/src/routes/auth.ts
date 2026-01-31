import { Router } from "express";
import { login, register, getAllUsers, getUserById, updateUserRole, toggleUserStatus} from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);

router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/status", toggleUserStatus);


export default router;
