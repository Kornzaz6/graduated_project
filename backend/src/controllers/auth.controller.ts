import { Request, Response } from "express"
import prisma from "../prisma"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

/* ================= JWT CONFIG ================= */

const JWT_SECRET: string = process.env.JWT_SECRET || ""
const JWT_EXPIRES_IN: jwt.SignOptions["expiresIn"] =
  (process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]) || "7d"

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined")
}

/* ================= REGISTER ================= */

export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password, firstName, lastName } = req.body

    if (!email || !username || !password || !firstName || !lastName) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const emailExists = await prisma.user.findUnique({
      where: { email },
    })

    if (emailExists) {
      return res.status(409).json({ message: "Email already exists" })
    }

    const usernameExists = await prisma.user.findUnique({
      where: { username },
    })

    if (usernameExists) {
      return res.status(409).json({ message: "Username already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        role: "MEMBER",
      },
    })

    return res.status(201).json({
      message: "Register successful",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    })

  } catch (error) {
    console.error("REGISTER ERROR:", error)
    return res.status(500).json({ message: "Server error" })
  }
}

/* ================= LOGIN ================= */

export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Email/Username and password are required",
      })
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ],
      },
      include: {
        owner: true
      }
    })

    if (!user) {
      return res.status(401).json({
        message: "Invalid email/username or password",
      })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email/username or password",
      })
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "This account has been suspended",
      })
    }

    /* ================= GENERATE JWT ================= */

    const token = jwt.sign(
  {
    id: user.id,
    role: user.role,
    email: user.email
  },
  JWT_SECRET,
  {
    expiresIn: JWT_EXPIRES_IN
  } as jwt.SignOptions
)

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        owner: user.owner
      },
    })

  } catch (error) {
    console.error("LOGIN ERROR:", error)
    return res.status(500).json({ message: "Server error" })
  }
}