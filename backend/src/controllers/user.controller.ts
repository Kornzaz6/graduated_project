import { Request, Response } from "express"
import prisma from "../prisma"
import bcrypt from "bcryptjs"

/* =====================================================
   GET ALL USERS (ADMIN)
===================================================== */
export const getAllUsers = async (_req: Request, res: Response) => {
  try {

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    res.json(users)

  } catch (error) {

    console.error("GET USERS ERROR:", error)

    res.status(500).json({
      message: "Failed to fetch users"
    })

  }
}

/* =====================================================
   GET USER BY ID
===================================================== */
export const getUserById = async (req: Request, res: Response) => {
  try {

    const userId = Number(req.params.id)

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        message: "Invalid user id"
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    res.json(user)

  } catch (error) {

    console.error("GET USER ERROR:", error)

    res.status(500).json({
      message: "Server error"
    })

  }
}

/* =====================================================
   UPDATE PROFILE
===================================================== */
export const updateUserProfile = async (req: Request, res: Response) => {
  try {

    const userId = Number(req.params.id)
    const { firstName, lastName, email } = req.body

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        message: "Invalid user id"
      })
    }

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        message: "All fields are required"
      })
    }

    /* ================= EMAIL DUPLICATE CHECK ================= */

    const existingEmail = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: userId }
      }
    })

    if (existingEmail) {
      return res.status(400).json({
        message: "Email already in use"
      })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase()
      }
    })

    const { password, ...safeUser } = updatedUser

    res.json(safeUser)

  } catch (error) {

    console.error("UPDATE PROFILE ERROR:", error)

    res.status(500).json({
      message: "Failed to update profile"
    })

  }
}

/* =====================================================
   CHANGE PASSWORD
===================================================== */
export const changePassword = async (req: Request, res: Response) => {
  try {

    const userId = Number(req.params.id)
    const { currentPassword, newPassword } = req.body

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        message: "Invalid user id"
      })
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    /* ================= VERIFY CURRENT PASSWORD ================= */

    if (currentPassword) {

      const valid = await bcrypt.compare(
        currentPassword,
        user.password
      )

      if (!valid) {
        return res.status(400).json({
          message: "Current password is incorrect"
        })
      }

    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword
      }
    })

    res.json({
      message: "Password updated successfully"
    })

  } catch (error) {

    console.error("CHANGE PASSWORD ERROR:", error)

    res.status(500).json({
      message: "Failed to update password"
    })

  }
}

/* =====================================================
   UPDATE ROLE (ADMIN)
===================================================== */
export const updateUserRole = async (req: Request, res: Response) => {
  try {

    const userId = Number(req.params.id)
    const { role } = req.body

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        message: "Invalid user id"
      })
    }

    if (!role) {
      return res.status(400).json({
        message: "Role is required"
      })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role }
    })

    const { password, ...safeUser } = user

    res.json(safeUser)

  } catch (error) {

    console.error("UPDATE ROLE ERROR:", error)

    res.status(500).json({
      message: "Failed to update role"
    })

  }
}

/* =====================================================
   TOGGLE USER STATUS
===================================================== */
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {

    const userId = Number(req.params.id)
    const { isActive } = req.body

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        message: "Invalid user id"
      })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive }
    })

    const { password, ...safeUser } = user

    res.json(safeUser)

  } catch (error) {

    console.error("TOGGLE USER STATUS ERROR:", error)

    res.status(500).json({
      message: "Failed to update user status"
    })

  }
}