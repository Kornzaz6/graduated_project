import { Request, Response } from "express";
import prisma from "../prisma";

export const createRentalRequest = async (req: Request, res: Response) => {
  try {
    const { userId, roomId } = req.body;

    if (!userId || !roomId) {
      return res.status(400).json({ message: "Missing userId or roomId" });
    }

    const room = await prisma.room.findUnique({
      where: { id: Number(roomId) },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.status !== "AVAILABLE") {
      return res.status(400).json({ message: "Room is not available" });
    }

    // ป้องกัน request ซ้ำ
    const existing = await prisma.rentalRequest.findFirst({
      where: {
        userId: Number(userId),
        roomId: Number(roomId),
        status: "PENDING",
      },
    });

    if (existing) {
      return res.status(400).json({
        message: "You already requested this room",
      });
    }

    const request = await prisma.rentalRequest.create({
      data: {
        userId: Number(userId),
        roomId: Number(roomId),
        status: "PENDING",
      },
    });

    res.status(201).json(request);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create rental request" });
  }
};

export const getOwnerRentalRequests = async (
  req: Request,
  res: Response
) => {
  try {
    const ownerId = Number(req.params.ownerId);

    if (!ownerId) {
      return res.status(400).json({ message: "Invalid ownerId" });
    }

    const requests = await prisma.rentalRequest.findMany({
      where: {
        room: {
          dormitory: {
            ownerId: ownerId,
          },
        },
      },
      include: {
        user: true,
        room: {
          include: {
            dormitory: true,
          },
        },
      },
      orderBy: {
        requestDate: "desc",
      },
    });

    res.json(requests);

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch rental requests" });
  }
};

export const approveRentalRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const requestId = Number(req.params.id);

    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: requestId },
    });

    if (!rentalRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (rentalRequest.status !== "PENDING") {
      return res.status(400).json({ message: "Already processed" });
    }

    // ✅ แค่เปลี่ยนสถานะ request
    await prisma.rentalRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    });

    res.json({ message: "Request approved. Waiting for contract." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to approve rental request" });
  }
};

export const rejectRentalRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const requestId = Number(req.params.id);

    await prisma.rentalRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });

    res.json({ message: "Rental rejected" });

  } catch (error) {
    res.status(500).json({ message: "Failed to reject rental" });
  }
};

export const getAllRentalRequests = async (req: Request, res: Response) => {
  try {
    const requests = await prisma.rentalRequest.findMany({
      include: {
        user: true,
        room: {
          include: {
            dormitory: true,
          },
        },
      },
      orderBy: {
        requestDate: "desc",
      },
    });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch rental requests" });
  }
};

export const createLeaseContract = async (
  req: Request,
  res: Response
) => {
  try {
    const { requestId, startDate, duration, monthlyRent, deposit } = req.body;

    if (!requestId || !startDate || !duration) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const durationNum = Number(duration);

    if (![6, 12].includes(durationNum)) {
      return res.status(400).json({ message: "Invalid contract duration" });
    }

    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: Number(requestId) },
      include: { room: true },
    });

    if (!rentalRequest || rentalRequest.status !== "APPROVED") {
      return res.status(400).json({ message: "Request not approved yet" });
    }

    const existingContract = await prisma.leaseContract.findUnique({
      where: { requestId: Number(requestId) },
    });

    if (existingContract) {
      return res.status(400).json({ message: "Contract already exists" });
    }

    // 🔥 คำนวณ endDate จาก duration
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + durationNum);

    const contract = await prisma.leaseContract.create({
      data: {
        userId: rentalRequest.userId,
        roomId: rentalRequest.roomId,
        requestId: rentalRequest.id,
        startDate: start,
        endDate: end,
        monthlyRent: Number(monthlyRent),
        deposit: Number(deposit),
        status: "WAITING_OWNER_APPROVAL",
      },
    });

    res.status(201).json(contract);

  } catch (error) {
    console.error("CREATE CONTRACT ERROR:", error);
    res.status(500).json({ message: "Failed to create contract" });
  }
};

export const approveContract = async (
  req: Request,
  res: Response
) => {
  try {
    const contractId = Number(req.params.id)

    await prisma.$transaction(async (tx) => {

      const contract = await tx.leaseContract.findUnique({
        where: { id: contractId }
      })

      if (!contract) {
        throw new Error("Contract not found")
      }

      if (contract.status !== "WAITING_OWNER_APPROVAL") {
        throw new Error("Already processed")
      }

      // 1️⃣ Activate contract
      await tx.leaseContract.update({
        where: { id: contractId },
        data: {
          status: "ACTIVE",
          approvedAt: new Date(),
        },
      })

      // 2️⃣ Update room status
      await tx.room.update({
        where: { id: contract.roomId },
        data: { status: "OCCUPIED" },
      })

      // 3️⃣ Generate monthly payments
      const start = new Date(contract.startDate)
      const end = new Date(contract.endDate)

      const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth())

      const payments = []

      for (let i = 0; i < months; i++) {
        const billingMonth = new Date(start)
        billingMonth.setMonth(start.getMonth() + i)

        const dueDate = new Date(billingMonth)
        dueDate.setDate(5) // กำหนดจ่ายวันที่ 5 ของเดือน

        payments.push({
          contractId: contract.id,
          billingMonth,
          amount: contract.monthlyRent,
          dueDate,
          status: "PENDING" as const
        })
      }

      await tx.payment.createMany({
        data: payments
      })

    })

    res.json({ message: "Contract approved & payments generated" })

  } catch (error) {
    console.error("APPROVE ERROR:", error)
    res.status(500).json({ message: "Failed to approve contract" })
  }
}

export const getMemberRentalRequests = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);

    const requests = await prisma.rentalRequest.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            dormitory: true,
          },
        },
        leaseContract: true, // เช็คว่ามีสัญญาแล้วหรือยัง
      },
      orderBy: { requestDate: "desc" },
    });

    res.json(requests);

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch requests" });
  }
};