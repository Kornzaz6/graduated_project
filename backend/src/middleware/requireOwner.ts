import { Request, Response, NextFunction } from "express";
import prisma from "../prisma";

export const requireOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.body; // 🔥 ตอนนี้ยังไม่มี auth token เลยใช้ body ก่อน

    if (!userId) {
      return res.status(401).json({ message: "User ID required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "OWNER") {
      return res.status(403).json({
        message: "Access denied. Only owners can create dormitories.",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Authorization error" });
  }
};
