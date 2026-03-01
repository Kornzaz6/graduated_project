import { Request, Response } from "express"
import prisma from "../prisma"
import bcrypt from "bcryptjs"

/* ================= GET ALL USERS ================= */
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
        createdAt: true,
      },
    })

    res.json(users)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
}

/* ================= GET USER BY ID ================= */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id)

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
        createdAt: true,
      },
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user)

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
}

/* ================= UPDATE PROFILE ================= */
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id)
    const { firstName, lastName, email } = req.body

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName, email },
    })

    const { password, ...safeUser } = updatedUser
    res.json(safeUser)

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to update profile" })
  }
}

/* ================= CHANGE PASSWORD ================= */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id)
    const { password } = req.body

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    res.json({ message: "Password updated successfully" })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to update password" })
  }
}

/* ================= UPDATE ROLE ================= */
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id)
    const { role } = req.body

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
    })

    res.json(user)

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
}

/* ================= TOGGLE STATUS ================= */
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id)
    const { isActive } = req.body

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    })

    res.json(user)

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
}