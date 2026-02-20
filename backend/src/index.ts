import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import dormitoryRoutes from "./routes/dormitory";
import ownerRoutes from "./routes/owner";
import rentalRoutes from "./routes/rental";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/rental", rentalRoutes);

app.get("/", (_req, res) => {
  res.send("Dormitory Hub API running");
});

app.use("/api/dormitories", dormitoryRoutes);

app.use("/api/owners", ownerRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
