import { Request, Response } from "express";
import prisma from "../prisma";

export const createDormitory = async (req: Request, res: Response) => {
  try {
    const {
      name,
      type,
      address,
      location,
      latitude,
      longitude,
      roomCount,
      userId, // 🔥 รับ userId แทน ownerId
    } = req.body;

    // 🔎 1️⃣ หา owner จาก userId
    const owner = await prisma.owner.findUnique({
      where: { userId: Number(userId) },
    });

    if (!owner) {
      return res.status(400).json({
        message: "Owner profile not found. Please apply and get approved.",
      });
    }

    // 🏠 2️⃣ สร้าง dormitory
    const dormitory = await prisma.dormitory.create({
      data: {
        name,
        type,
        address,
        location,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        ownerId: owner.id, // ✅ ใช้ owner.id จาก DB
      },
    });

    // 🖼 3️⃣ สร้างรูป (ถ้ามี)
    if (req.files && Array.isArray(req.files)) {
      const images = req.files.map((file: any) => ({
        imageUrl: `/uploads/${file.filename}`,
        dormitoryId: dormitory.id,
      }));

      await prisma.dormitoryImage.createMany({
        data: images,
      });
    }

    // 🛏 4️⃣ สร้างห้องอัตโนมัติ
    const totalRooms = parseInt(roomCount) || 0;

    if (totalRooms > 0) {
      const rooms = [];

      for (let i = 1; i <= totalRooms; i++) {
        rooms.push({
          roomNumber: `Room ${i}`,
          price: 0,
          size: 0,
          status: "AVAILABLE",
          floor: 1,
          capacity: 1,
          dormitoryId: dormitory.id,
        });
      }

      await prisma.room.createMany({ data: rooms });
    }

    res.status(201).json({
      message: "Dormitory created successfully",
      dormitory,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create dormitory" });
  }
};


export const getDormitories = async (req: Request, res: Response) => {
  try {
    const { search, type } = req.query;

    const dormitories = await prisma.dormitory.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  {
                    name: {
                      contains: String(search),
                      mode: "insensitive",
                    },
                  },
                  {
                    location: {
                      contains: String(search),
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {},
          type
            ? {
                type: String(type),
              }
            : {},
        ],
      },
      include: {
        images: true,
        rooms: true,
      },
    });

    res.json(dormitories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch dormitories" });
  }
};

export const getOwnerDormitories = async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;

    const dormitories = await prisma.dormitory.findMany({
      where: {
        ownerId: Number(ownerId),
      },
      include: {
        rooms: true,
        images: true,
      },
    });

    res.json(dormitories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch owner dormitories" });
  }
};

// dormitory.controller.ts

export const getMyDormitories = async (req: Request, res: Response) => {
  try {
    const userIdNum = Number(req.params.userId);

    if (!userIdNum || isNaN(userIdNum)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const owner = await prisma.owner.findUnique({
  where: { userId: userIdNum },
});


    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    const dormitories = await prisma.dormitory.findMany({
      where: { ownerId: owner.id },
      include: {
        rooms: true,
        images: true,
      },
      orderBy: { id: "desc" },
    });

    res.json(dormitories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch dormitories" });
  }
};


// dormitory.controller.ts

export const getRoomsByDormitory = async (req: Request, res: Response) => {
  try {
    const dormIdNum = Number(req.params.dormId);

    // 🔒 validate
    if (!dormIdNum || isNaN(dormIdNum)) {
      return res.status(400).json({ message: "Invalid dormitory ID" });
    }

    // 🔍 เช็คว่าหอมีจริงไหม (optional แต่ดีมาก)
    const dorm = await prisma.dormitory.findUnique({
      where: { id: dormIdNum },
    });

    if (!dorm) {
      return res.status(404).json({ message: "Dormitory not found" });
    }

    const rooms = await prisma.room.findMany({
      where: { dormitoryId: dormIdNum },
      orderBy: { id: "asc" },
    });

    res.json(rooms);

  } catch (error) {
    console.error("Fetch rooms error:", error);
    res.status(500).json({ message: "Failed to fetch rooms" });
  }
};


export const createRoom = async (req: Request, res: Response) => {
  try {
    const { dormitoryId, roomNumber, price, size, floor, capacity } = req.body;

    const dormIdNum = Number(dormitoryId);

    // 1️⃣ Validate dormitoryId
    if (!dormIdNum || isNaN(dormIdNum)) {
      return res.status(400).json({ message: "Invalid dormitory ID" });
    }

    if (!roomNumber) {
      return res.status(400).json({ message: "Room number is required" });
    }

    // 2️⃣ Check dormitory exists
    const dorm = await prisma.dormitory.findUnique({
      where: { id: dormIdNum },
    });

    if (!dorm) {
      return res.status(404).json({ message: "Dormitory not found" });
    }

    // 3️⃣ Prevent duplicate room number
    const existingRoom = await prisma.room.findFirst({
      where: {
        dormitoryId: dormIdNum,
        roomNumber,
      },
    });

    if (existingRoom) {
      return res.status(400).json({
        message: "Room number already exists in this dormitory",
      });
    }

    // 4️⃣ Create room
    const room = await prisma.room.create({
      data: {
        dormitoryId: dormIdNum,
        roomNumber,
        price: Number(price) || 0,
        size: Number(size) || 0,
        floor: Number(floor) || 1,
        capacity: Number(capacity) || 1,
        status: "AVAILABLE",
      },
    });

    res.status(201).json(room);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create room" });
  }
};


export const updateRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roomId = Number(id);

    if (!roomId || isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }

    const { roomNumber, price, size, floor, capacity, status } = req.body;

    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!existingRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        roomNumber: roomNumber ?? existingRoom.roomNumber,
        price: price !== undefined ? Number(price) : existingRoom.price,
        size: size !== undefined ? Number(size) : existingRoom.size,
        floor: floor !== undefined ? Number(floor) : existingRoom.floor,
        capacity: capacity !== undefined ? Number(capacity) : existingRoom.capacity,
        status: status ?? existingRoom.status,
      },
    });

    res.json(updatedRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update room" });
  }
};


export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.room.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Room deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete room" });
  }
};


