import multer from "multer"
import path from "path"
import fs from "fs"

/* ================= UPLOAD PATH ================= */

const uploadPath = path.resolve(process.cwd(), "uploads/slips")

/* create folder if not exists */
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true })
}

/* ================= STORAGE ================= */

const storage = multer.diskStorage({

  destination: (_req, _file, cb) => {
    cb(null, uploadPath)
  },

  filename: (_req, file, cb) => {

    const timestamp = Date.now()
    const random = Math.round(Math.random() * 1e9)

    const ext = path.extname(file.originalname).toLowerCase()

    const filename = `${timestamp}-${random}${ext}`

    cb(null, filename)

  }

})

/* ================= FILE FILTER ================= */

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {

  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg"
  ]

  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png"
  ]

  const ext = path.extname(file.originalname).toLowerCase()

  /* MIME + EXT check */
  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(ext)
  ) {

    cb(null, true)

  } else {

    cb(new Error("Only JPG and PNG image files are allowed"))

  }

}

/* ================= MULTER CONFIG ================= */

export const uploadSlipMiddleware = multer({

  storage,

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }

})

/* ================= ERROR HANDLER ================= */

export const handleUploadError = (
  err: any,
  _req: any,
  res: any,
  next: any
) => {

  if (err instanceof multer.MulterError) {

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File size exceeds 5MB"
      })
    }

  }

  if (err) {
    return res.status(400).json({
      message: err.message
    })
  }

  next()

}