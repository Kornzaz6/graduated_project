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
      Date.now() + "-" + Math.round(Math.random() * 1e9)

    cb(null, uniqueName + path.extname(file.originalname))
  }

})

/* ================= MULTER ================= */

export const uploadDormitoryImages = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {

    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files allowed"))
    }

  }
})