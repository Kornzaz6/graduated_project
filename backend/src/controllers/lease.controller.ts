import { Request, Response } from "express";
import prisma from "../prisma";

/* =========================
   GET ALL CONTRACTS (ADMIN)
========================= */
export const getAllLeaseContracts = async (req: Request, res: Response) => {
  try {
    const contracts = await prisma.leaseContract.findMany({
      include: {
        user: true,
        room: {
          include: {
            dormitory: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contracts" });
  }
};

/* =========================
   GET OWNER CONTRACTS
========================= */
export const getOwnerLeaseContracts = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const owner = await prisma.owner.findUnique({
      where: { userId },
      include: { dormitories: true },
    });

    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    const dormitoryIds = owner.dormitories.map((d) => d.id);

    const contracts = await prisma.leaseContract.findMany({
      where: {
        room: {
          dormitoryId: { in: dormitoryIds },
        },
      },
      include: {
        user: true,
        room: { include: { dormitory: true } },
      },
      orderBy: { id: "desc" },
    });

    res.json(contracts);
  } catch (error) {
    console.error("LEASE FETCH ERROR:", error);
    res.status(500).json({ message: "Failed to fetch contracts" });
  }
};

/* =========================
   APPROVE CONTRACT
========================= */
export const approveContract = async (req: Request, res: Response) => {
  try {
    const contractId = Number(req.params.id);

    const contract = await prisma.leaseContract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (contract.status !== "WAITING_OWNER_APPROVAL") {
      return res.status(400).json({ message: "Already processed" });
    }

    // 🔥 คำนวณจำนวนเดือนจาก start/end
    const months =
      (contract.endDate.getFullYear() - contract.startDate.getFullYear()) * 12 +
      (contract.endDate.getMonth() - contract.startDate.getMonth());

    await prisma.$transaction(async (tx) => {
      // 1️⃣ Activate contract
      await tx.leaseContract.update({
        where: { id: contractId },
        data: {
          status: "ACTIVE",
          approvedAt: new Date(),
        },
      });

      // 2️⃣ เปลี่ยนสถานะห้อง
      await tx.room.update({
        where: { id: contract.roomId },
        data: { status: "OCCUPIED" },
      });

      // 3️⃣ Generate payment schedule
      for (let i = 0; i < months; i++) {
        const billing = new Date(contract.startDate);
        billing.setMonth(billing.getMonth() + i);

        await tx.payment.create({
          data: {
            contractId: contract.id,
            billingMonth: billing,
            amount: contract.monthlyRent,
            dueDate: billing,
          },
        });
      }
    });

    res.json({ message: "Contract approved. Payments generated." });

  } catch (error) {
    console.error("APPROVE ERROR:", error);
    res.status(500).json({ message: "Failed to approve contract" });
  }
};

/* =========================
   TERMINATE CONTRACT
========================= */
export const terminateContract = async (req: Request, res: Response) => {
  try {
    const contractId = Number(req.params.id);

    const contract = await prisma.leaseContract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (contract.status !== "ACTIVE") {
      return res.status(400).json({ message: "Contract not active" });
    }

    await prisma.$transaction([
      prisma.leaseContract.update({
        where: { id: contractId },
        data: { status: "CANCELLED" },
      }),
      prisma.room.update({
        where: { id: contract.roomId },
        data: { status: "AVAILABLE" },
      }),
    ]);

    res.json({ message: "Contract terminated. Room available." });

  } catch (error) {
    console.error("TERMINATE ERROR:", error);
    res.status(500).json({ message: "Failed to terminate contract" });
  }
};