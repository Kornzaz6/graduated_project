import multer from "multer"
import path from "path"
import fs from "fs"

// ใช้ root project path
const uploadPath = path.join(process.cwd(), "uploads/slips")

// สร้างโฟลเดอร์ถ้ายังไม่มี
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true })
}

// ================= STORAGE =================
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadPath)
  },
  filename: (_req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9)

    const ext = path.extname(file.originalname).toLowerCase()

    cb(null, uniqueName + ext)
  }
})

// ================= FILE FILTER =================
const fileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  cb
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg"
  ]

  const allowedExtensions = [".jpg", ".jpeg", ".png"]

  const ext = path.extname(file.originalname).toLowerCase()

  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(ext)
  ) {
    cb(null, true)
  } else {
    cb(new Error("Only JPG and PNG image files are allowed"))
  }
}


// ================= EXPORT =================
export const uploadSlipMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
})