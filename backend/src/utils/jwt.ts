import jwt, { SignOptions } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in .env")
}

export const generateToken = (payload: object): string => {
  const options: SignOptions = {
    expiresIn: "7d"   // 👈 แบบนี้ TypeScript จะไม่ error
  }

  return jwt.sign(payload, JWT_SECRET, options)
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET)
}