import multer from "multer"

/* ================= STORAGE ================= */

const storage = multer.memoryStorage()

/* ================= FILE FILTER ================= */

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {

  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg"
  ]

  if (allowedMimeTypes.includes(file.mimetype)) {

    cb(null, true)

  } else {

    cb(new Error("Only JPG and PNG images are allowed"))

  }

}

/* ================= MULTER CONFIG ================= */

export const uploadSlipMiddleware = multer({

  storage,

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024
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