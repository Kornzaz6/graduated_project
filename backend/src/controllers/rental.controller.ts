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
      include: { room: true },
    });

    if (!rentalRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (rentalRequest.status !== "PENDING") {
      return res.status(400).json({ message: "Already processed" });
    }

    // 1️⃣ Update request
    await prisma.rentalRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    });

    // 2️⃣ Create contract
    await prisma.leaseContract.create({
      data: {
        userId: rentalRequest.userId,
        roomId: rentalRequest.roomId,
        requestId: rentalRequest.id,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
        monthlyRent: rentalRequest.room.price,
        deposit: rentalRequest.room.price,
        status: "ACTIVE",
      },
    });

    // 3️⃣ Update room status
    await prisma.room.update({
      where: { id: rentalRequest.roomId },
      data: { status: "OCCUPIED" },
    });

    res.json({ message: "Rental approved" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to approve rental" });
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
