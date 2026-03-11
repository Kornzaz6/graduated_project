import multer from "multer";

/* ================= STORAGE ================= */

const storage = multer.memoryStorage();

/* ================= FILE FILTER ================= */

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG/PNG images allowed"));
  }
};

/* ================= EXPORT ================= */

export const uploadSlipMiddleware = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter,
});
