import multer from "multer"
import path from "path"
import fs from "fs"

/* ================= UPLOAD DIRECTORY ================= */

const uploadPath = path.join(process.cwd(), "uploads")

// create uploads folder if not exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true })
}

/* ================= STORAGE ================= */

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, uploadPath)
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname

    cb(null, uniqueName)
  }

})

/* ================= EXPORT ================= */

export const uploadSlipMiddleware = multer({
  storage
})