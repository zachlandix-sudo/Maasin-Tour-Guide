
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, "uploads/");
  },

  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${randomUUID()}${extension}`);
  },
});

export const uploadSpotImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      const error = new Error(
        "Only JPEG, PNG, WebP, and GIF images are allowed.",
      );
      error.status = 400;
      return callback(error);
    }

    callback(null, true);
  },
}).single("image");
