import { Request, Response } from "express";
import prisma from "../prisma";

export const applyOwner = async (req: Request, res: Response) => {
  try {
    const { userId, phone, message } = req.body;

    // ตรวจสอบ user มีอยู่จริงไหม
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "OWNER") {
      return res.status(400).json({ message: "User already an owner" });
    }

    // ตรวจสอบว่ามีใบสมัคร pending ไหม
    const existing = await prisma.ownerApplication.findFirst({
      where: {
        userId,
        status: "PENDING",
      },
    });

    if (existing) {
      return res.status(400).json({ message: "Application already pending" });
    }

    const application = await prisma.ownerApplication.create({
      data: {
        userId,
        phone,
        message,
      },
    });

    res.status(201).json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to apply" });
  }
};

export const getOwnerApplications = async (
  _req: Request,
  res: Response
) => {
  try {
    const applications = await prisma.ownerApplication.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch applications" });
  }
};

export const approveOwner = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    await prisma.$transaction(async (tx) => {

      // 1️⃣ หา application ก่อน
      const application = await tx.ownerApplication.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!application) {
        throw new Error("Application not found");
      }

      if (application.status === "APPROVED") {
        return;
      }

      // 2️⃣ อัปเดต status
      await tx.ownerApplication.update({
        where: { id },
        data: { status: "APPROVED" },
      });

      // 3️⃣ อัปเดต user role
      await tx.user.update({
        where: { id: application.userId },
        data: { role: "OWNER" },
      });

      // 4️⃣ เช็คก่อนว่ามี owner record แล้วไหม
      const existingOwner = await tx.owner.findUnique({
        where: { userId: application.userId },
      });

      if (!existingOwner) {
        await tx.owner.create({
          data: {
            userId: application.userId,
            firstName: application.user.firstName,
            lastName: application.user.lastName,
            phone: application.phone,
            email: application.user.email,
          },
        });
      }

    });

    res.json({ message: "Application approved successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Approval failed" });
  }
};



export const rejectOwner = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.ownerApplication.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    res.json({ message: "Application rejected" });
  } catch (error) {
    res.status(500).json({ message: "Failed to reject" });
  }
};
