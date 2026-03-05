import { Request, Response, NextFunction } from "express"
import { verifyToken } from "../utils/jwt"

/* เพิ่ม type ให้ request */
export interface AuthRequest extends Request {
  user?: any
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        message: "Authorization header missing"
      })
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Invalid authorization format"
      })
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({
        message: "Token not provided"
      })
    }

    const decoded = verifyToken(token)

    req.user = decoded

    next()

  } catch (error) {
    console.error("AUTH ERROR:", error)

    return res.status(401).json({
      message: "Invalid or expired token"
    })
  }
}