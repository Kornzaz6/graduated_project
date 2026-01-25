import express from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma.js";

const router = express.Router();

/**
 * POST /api/auth/register
 */
router.post("/register", async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role = "MEMBER",
    } = req.body;

    // 1. ตรวจข้อมูลเบื้องต้น
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    // 2. ตรวจสอบ email ซ้ำ
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    // 3. เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. บันทึกผู้ใช้
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
      },
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
});

export default router;

/**
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // 1. ตรวจข้อมูล
      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password are required",
        });
      }
  
      // 2. ค้นหาผู้ใช้
      const user = await prisma.user.findUnique({
        where: { email },
      });
  
      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }
  
      // 3. ตรวจรหัสผ่าน
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }
  
      // 4. เข้าสู่ระบบสำเร็จ
      return res.status(200).json({
        message: "Login successful",
        user: {
          id: user.id,                                                                                      
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Server error",
      });
    }
  });
  