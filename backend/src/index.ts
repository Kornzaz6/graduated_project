import "dotenv/config"
import express from "express"
import cors from "cors"
import path from "path"

import authRoutes from "./routes/auth"
import userRoutes from "./routes/user"
import dormitoryRoutes from "./routes/dormitory"
import ownerRoutes from "./routes/owner"
import rentalRoutes from "./routes/rental"
import leaseRoutes from "./routes/lease"
import paymentRoutes from "./routes/payment"
import reviewRoutes from "./routes/review"

const app = express()

/* ================= MIDDLEWARE ================= */
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))
app.use(express.json())

// ✅ เพิ่มตรงนี้
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
)

/* ================= HEALTH CHECK ================= */
app.get("/", (_req, res) => {
  res.send("Dormitory Hub API running 🚀")
})

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/dormitories", dormitoryRoutes)
app.use("/api/owners", ownerRoutes)
app.use("/api/rental", rentalRoutes)
app.use("/api/lease", leaseRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/reviews", reviewRoutes)

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" })
})

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})