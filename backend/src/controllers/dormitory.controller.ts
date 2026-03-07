import { Request, Response } from "express";
import prisma from "../prisma";
import { RoomStatus } from "@prisma/client";
import supabase from "../utils/supabase"

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
      userId,
    } = req.body;

    if (!name || !type || !address || !userId) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    /* ================= 1️⃣ FIND OWNER ================= */

    const owner = await prisma.owner.findUnique({
      where: { userId: Number(userId) },
    });

    if (!owner) {
      return res.status(400).json({
        message: "Owner profile not found. Please apply and get approved.",
      });
    }

    if (!owner.isActive) {
      return res.status(403).json({
        message: "Owner account is not active.",
      });
    }

    /* ================= 2️⃣ CREATE DORMITORY (PENDING) ================= */

    const dormitory = await prisma.dormitory.create({
      data: {
        name: name.trim(),
        type: type.trim(),
        address: address.trim(),
        location: location?.trim() || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        ownerId: owner.id,
        status: "PENDING", // 🔥 IMPORTANT
      },
    });

    /* ================= 3️⃣ UPLOAD IMAGES TO SUPABASE ================= */

if (req.files && Array.isArray(req.files)) {

  const uploadedImages: any[] = []

  for (const file of req.files as Express.Multer.File[]) {

    const fileName =
      Date.now() + "-" + Math.round(Math.random() * 1e9)

    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype
      })

    if (error) {
      throw new Error(error.message)
    }

    const { data } = supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .getPublicUrl(fileName)

    uploadedImages.push({
      imageUrl: data.publicUrl,
      dormitoryId: dormitory.id
    })

  }

  await prisma.dormitoryImage.createMany({
    data: uploadedImages
  })
}

    /* ================= 4️⃣ AUTO CREATE ROOMS ================= */

    const totalRooms = parseInt(roomCount) || 0;

    if (totalRooms > 0) {
      const rooms = [];

      for (let i = 1; i <= totalRooms; i++) {
        rooms.push({
          roomNumber: `Room ${i}`,
          price: 0,
          size: 0,
          status: RoomStatus.AVAILABLE,
          floor: 1,
          capacity: 1,
          dormitoryId: dormitory.id,
        });
      }

      await prisma.room.createMany({ data: rooms });
    }

    /* ================= RESPONSE ================= */

    return res.status(201).json({
      message:
        "Dormitory created successfully. Waiting for admin approval.",
      dormitory: {
        ...dormitory,
        status: "PENDING",
      },
    });

  } catch (error) {
    console.error("CREATE DORMITORY ERROR:", error);
    return res.status(500).json({
      message: "Failed to create dormitory",
    });
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

export const getDormitoryById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)

    const dormitory = await prisma.dormitory.findUnique({
      where: { id },
      include: {
        rooms: true,
        reviews: {
          include: { user: true }
        },
        images: true
      }
    })

    if (!dormitory) {
      return res.status(404).json({ message: "Dormitory not found" })
    }

    res.json(dormitory)

  } catch (error) {
    res.status(500).json({ message: "Error fetching dormitory" })
  }
}

export const approveDormitory = async (req: Request, res: Response) => {
  try {
    const dormitoryId = Number(req.params.id)

    if (!dormitoryId || isNaN(dormitoryId)) {
      return res.status(400).json({
        message: "Invalid dormitory id"
      })
    }

    /* ================= AUTH CHECK ================= */

    const user = (req as any).user

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized - token missing"
      })
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admin can approve dormitory"
      })
    }

    /* ================= APPROVE (SAFE UPDATE) ================= */

    const updated = await prisma.dormitory.updateMany({
      where: {
        id: dormitoryId,
        status: "PENDING"
      },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: user.id,
        rejectedAt: null,
        rejectionNote: null
      }
    })

    if (updated.count === 0) {
      return res.status(400).json({
        message: "Dormitory not found or already processed"
      })
    }

    return res.json({
      message: "Dormitory approved successfully"
    })

  } catch (error) {
    console.error("APPROVE DORMITORY ERROR:", error)
    return res.status(500).json({
      message: "Failed to approve dormitory"
    })
  }
}

export const rejectDormitory = async (req: Request, res: Response) => {
  try {
    const dormitoryId = Number(req.params.id)
    const { rejectionNote } = req.body

    if (!dormitoryId || isNaN(dormitoryId)) {
      return res.status(400).json({
        message: "Invalid dormitory id"
      })
    }

    /* ================= CHECK ADMIN ================= */

    const adminUser = (req as any).user

    if (!adminUser || adminUser.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admin can reject dormitory"
      })
    }

    /* ================= FIND DORMITORY ================= */

    const dormitory = await prisma.dormitory.findUnique({
      where: { id: dormitoryId }
    })

    if (!dormitory) {
      return res.status(404).json({
        message: "Dormitory not found"
      })
    }

    if (dormitory.status !== "PENDING") {
      return res.status(400).json({
        message: "Dormitory already processed"
      })
    }

    /* ================= REJECT ================= */

    const updated = await prisma.dormitory.update({
      where: { id: dormitoryId },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectionNote: rejectionNote?.trim() || "No reason provided",
        approvedAt: null,
        approvedBy: null
      }
    })

    return res.json({
      message: "Dormitory rejected successfully",
      dormitory: updated
    })

  } catch (error) {
    console.error("REJECT DORMITORY ERROR:", error)
    return res.status(500).json({
      message: "Failed to reject dormitory"
    })
  }
}

export const getPendingDormitories = async (req: Request, res: Response) => {
  try {
    /* ================= OPTIONAL ADMIN CHECK ================= */

    const adminUser = (req as any).user

    // ถ้ามีระบบ auth แล้วค่อยเช็ค
    if (adminUser) {
      if (adminUser.role !== "ADMIN") {
        return res.status(403).json({
          message: "Only admin can view pending dormitories"
        })
      }
    }

    /* ================= FETCH ================= */

    const dormitories = await prisma.dormitory.findMany({
      where: {
        status: "PENDING"
      },
      include: {
        owner: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        images: true,
        rooms: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        id: "desc"
      }
    })

    return res.json(dormitories)

  } catch (error) {
    console.error("GET PENDING DORM ERROR:", error)
    return res.status(500).json({
      message: "Failed to fetch pending dormitories"
    })
  }
}

export const uploadDormitoryImagesController = async (
  req: Request,
  res: Response
) => {
  try {
    const dormId = Number(req.params.id)

    if (!req.files || !(req.files instanceof Array)) {
      return res.status(400).json({ message: "No images uploaded" })
    }

    const images = await Promise.all(
      req.files.map((file: Express.Multer.File) => {
        return prisma.dormitoryImage.create({
          data: {
            dormitoryId: dormId,
            imageUrl: `/uploads/${file.filename}`
          }
        })
      })
    )

    res.json(images)

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Upload failed" })
  }
}

export const deleteDormitoryImage = async (
  req: Request,
  res: Response
) => {
  try {

    const imageId = Number(req.params.imageId)

    await prisma.dormitoryImage.delete({
      where: { id: imageId }
    })

    res.json({ message: "Image deleted" })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Delete failed" })
  }
}