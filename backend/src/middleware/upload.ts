import multer from "multer"
import path from "path"
import fs from "fs"

/* ================= UPLOAD PATH ================= */

const uploadPath = path.resolve(process.cwd(), "uploads/slips")

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true })
}

/* ================= STORAGE ================= */

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

/* ================= FILE FILTER ================= */

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg"
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error("Only JPG/PNG images allowed"))
  }

}

/* ================= EXPORT ================= */

export const uploadSlipMiddleware = multer({

  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter

})