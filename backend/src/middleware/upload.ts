import multer from "multer"

/* ================= STORAGE ================= */

const storage = multer.memoryStorage()

/* ================= FILE FILTER ================= */

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {

  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("Only image files allowed"))
  }

}

/* ================= EXPORT ================= */

export const uploadSlipMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter
})