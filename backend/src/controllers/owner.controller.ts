import { Request, Response } from "express"
import prisma from "../prisma"
import { encrypt, decrypt, maskAccount } from "../utils/encryption"

/* =====================================================
   APPLY OWNER
===================================================== */
export const applyOwner = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      firstName,
      lastName,
      email,
      phone,
      bankName,
      bankAccountName,
      bankAccountNo,
      message
    } = req.body

    /* ================= VALIDATION ================= */

    if (!userId || !firstName || !lastName || !email || !phone) {
      return res.status(400).json({
        message: "Missing required fields"
      })
    }

    const parsedUserId = Number(userId)

    if (isNaN(parsedUserId)) {
      return res.status(400).json({
        message: "Invalid userId"
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: parsedUserId }
    })

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    if (user.role === "OWNER") {
      return res.status(400).json({
        message: "User is already an owner"
      })
    }

    const existingPending = await prisma.ownerApplication.findFirst({
      where: {
        userId: parsedUserId,
        status: "PENDING"
      }
    })

    if (existingPending) {
      return res.status(400).json({
        message: "Application already pending"
      })
    }

    /* ================= FILES (OPTIONAL) ================= */

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[]
    } | undefined

    const idCardImage =
      files?.idCardImage?.[0]?.path || null

    const businessLicense =
      files?.businessLicense?.[0]?.path || null

    /* ================= CREATE APPLICATION ================= */

    const application = await prisma.ownerApplication.create({
  data: {
    userId: parsedUserId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    bankName: bankName?.trim() || null,
    bankAccountName: bankAccountName
      ? encrypt(bankAccountName.trim())
      : null,
    bankAccountNo: bankAccountNo
      ? encrypt(bankAccountNo.trim())
      : null,
    message: message?.trim() || null,
    idCardImage: idCardImage,
    businessLicense: businessLicense
  }
})

    /* ================= RESPONSE ================= */

    return res.status(201).json({
      message: "Application submitted successfully",
      applicationId: application.id,
      status: application.status
    })

  } catch (error) {
    console.error("APPLY OWNER ERROR:", error)

    return res.status(500).json({
      message: "Failed to apply"
    })
  }
}

/* =====================================================
   GET OWNER APPLICATIONS (ADMIN)
===================================================== */
export const getOwnerApplications = async (_req: Request, res: Response) => {
  try {
    const applications = await prisma.ownerApplication.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" }
    })

    return res.json(applications)

  } catch (error) {
    console.error("FETCH APPLICATION ERROR:", error)
    return res.status(500).json({
      message: "Failed to fetch applications"
    })
  }
}

/* =====================================================
   APPROVE OWNER
===================================================== */
export const approveOwner = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)

    if (!id || isNaN(id)) {
      return res.status(400).json({
        message: "Invalid application id"
      })
    }

    await prisma.$transaction(async (tx) => {

      const application = await tx.ownerApplication.findUnique({
        where: { id }
      })

      if (!application) {
        throw new Error("Application not found")
      }

      if (application.status !== "PENDING") {
        throw new Error("Application already processed")
      }

      /* 🔥 Update Application */
      await tx.ownerApplication.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedAt: new Date()
        }
      })

      /* 🔥 Update User Role */
      await tx.user.update({
        where: { id: application.userId },
        data: { role: "OWNER" }
      })

      const existingOwner = await tx.owner.findUnique({
        where: { userId: application.userId }
      })

      if (!existingOwner) {
        await tx.owner.create({
          data: {
            userId: application.userId,
            firstName: application.firstName,
            lastName: application.lastName,
            phone: application.phone,
            email: application.email,
            bankName: application.bankName,
            bankAccountName: application.bankAccountName,
            bankAccountNo: application.bankAccountNo,
            paymentType: "BANK", // default
            isActive: true,
            verifiedAt: new Date()
          }
        })
      }
    })

    return res.json({
      message: "Application approved successfully"
    })

  } catch (error: any) {
    console.error("APPROVE OWNER ERROR:", error)

    return res.status(400).json({
      message: error.message || "Approval failed"
    })
  }
}

/* =====================================================
   REJECT OWNER
===================================================== */
export const rejectOwner = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)

    if (!id || isNaN(id)) {
      return res.status(400).json({
        message: "Invalid application id"
      })
    }

    const application = await prisma.ownerApplication.findUnique({
      where: { id }
    })

    if (!application) {
      return res.status(404).json({
        message: "Application not found"
      })
    }

    if (application.status !== "PENDING") {
      return res.status(400).json({
        message: "Application already processed"
      })
    }

    await prisma.ownerApplication.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date()
      }
    })

    return res.json({
      message: "Application rejected"
    })

  } catch (error) {
    console.error("REJECT OWNER ERROR:", error)
    return res.status(500).json({
      message: "Failed to reject"
    })
  }
}

/* =====================================================
   GET ALL OWNERS (ADMIN)
===================================================== */
export const getAllOwners = async (_req: Request, res: Response) => {
  try {
    const owners = await prisma.owner.findMany({
      include: {
        user: true,
        dormitories: true
      },
      orderBy: { id: "desc" }
    })

    res.json(owners)

  } catch (error) {
    console.error("FETCH OWNERS ERROR:", error)
    res.status(500).json({ message: "Failed to fetch owners" })
  }
}

/* =====================================================
   REMOVE OWNER (ADMIN)
===================================================== */
export const removeOwner = async (req: Request, res: Response) => {
  try {
    const ownerId = Number(req.params.id)

    if (!ownerId || isNaN(ownerId)) {
      return res.status(400).json({ message: "Invalid owner id" })
    }

    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      include: { dormitories: true }
    })

    if (!owner) {
      return res.status(404).json({ message: "Owner not found" })
    }

    if (owner.dormitories.length > 0) {
      return res.status(400).json({
        message: "Cannot remove owner with existing dormitories"
      })
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: owner.userId },
        data: { role: "MEMBER" }
      }),
      prisma.owner.delete({
        where: { id: ownerId }
      })
    ])

    res.json({ message: "Owner removed successfully" })

  } catch (error) {
    console.error("REMOVE OWNER ERROR:", error)
    res.status(500).json({ message: "Failed to remove owner" })
  }
}

/* =====================================================
   GET OWNER PROFILE
===================================================== */
export const getOwnerProfile = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId)

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid userId" })
    }

    const owner = await prisma.owner.findUnique({
      where: { userId }
    })

    if (!owner) {
      return res.status(404).json({ message: "Owner not found" })
    }

    res.json({
      ...owner,
      bankAccountNo: owner.bankAccountNo
        ? maskAccount(decrypt(owner.bankAccountNo))
        : null,
      bankAccountName: owner.bankAccountName
        ? decrypt(owner.bankAccountName)
        : null
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to fetch profile" })
  }
}

/* =====================================================
   UPDATE OWNER PROFILE
===================================================== */
export const updateOwnerProfile = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId)

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid userId" })
    }

    const {
      firstName,
      lastName,
      phone,
      paymentType,
      bankName,
      bankAccountName,
      bankAccountNo
    } = req.body

    /* ================= VALIDATE PAYMENT TYPE ================= */

    if (!paymentType || !["BANK", "PROMPTPAY"].includes(paymentType)) {
      return res.status(400).json({
        message: "Payment type is required"
      })
    }

    const cleanAccount = bankAccountNo
      ? String(bankAccountNo).replace(/\D/g, "")
      : ""

    /* ================= VALIDATE DATA ================= */

    if (paymentType === "PROMPTPAY") {
      if (!cleanAccount || !/^\d{10}$|^\d{13}$/.test(cleanAccount)) {
        return res.status(400).json({
          message: "Invalid PromptPay ID (10 or 13 digits required)"
        })
      }
    }

    if (paymentType === "BANK") {
      if (!bankName?.trim()) {
        return res.status(400).json({
          message: "Bank name is required"
        })
      }

      if (!cleanAccount) {
        return res.status(400).json({
          message: "Bank account number is required"
        })
      }
    }

    /* ================= PREPARE UPDATE DATA ================= */

    const updateData: any = {
      paymentType
    }

    if (firstName !== undefined) {
      updateData.firstName = firstName.trim()
    }

    if (lastName !== undefined) {
      updateData.lastName = lastName.trim()
    }

    if (phone !== undefined) {
      updateData.phone = phone.trim()
    }

    if (paymentType === "BANK") {
      updateData.bankName = bankName.trim()
      updateData.bankAccountName = bankAccountName
        ? encrypt(bankAccountName.trim())
        : null
      updateData.bankAccountNo = encrypt(cleanAccount)
    }

    if (paymentType === "PROMPTPAY") {
      updateData.bankName = null
      updateData.bankAccountName = null
      updateData.bankAccountNo = encrypt(cleanAccount)
    }

    /* ================= UPDATE ================= */

    const updated = await prisma.owner.update({
      where: { userId },
      data: updateData
    })

    /* ================= SAFE RESPONSE ================= */

    let maskedAccount: string | null = null

    if (updated.bankAccountNo) {
      try {
        const decrypted = decrypt(updated.bankAccountNo)
        maskedAccount = maskAccount(decrypted)
      } catch {
        maskedAccount = null
      }
    }

    return res.json({
      ...updated,
      bankAccountNo: maskedAccount
    })

  } catch (error) {
    console.error("UPDATE OWNER PROFILE ERROR:", error)
    return res.status(500).json({ message: "Update failed" })
  }
}

export const getOwnerTenants = async (req: Request, res: Response) => {
  try {

    const ownerId = (req as any).user?.id

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const tenants = await prisma.leaseContract.findMany({

      where: {
        status: "ACTIVE",
        room: {
          dormitory: {
            ownerId: ownerId
          }
        }
      },

      include: {

        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },

        room: {
          select: {
            roomNumber: true,
            dormitory: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }

      }

    })

    res.json(tenants)

  } catch (error) {

    console.error("FETCH TENANTS ERROR:", error)

    res.status(500).json({
      message: "Failed to fetch tenants"
    })

  }
}