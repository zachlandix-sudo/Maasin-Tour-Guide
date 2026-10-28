import { Router } from "express";
import { uploadSpotImage } from "../middleware/upload.js";
import { requireAdmin } from "../middleware/adminAuth.js";

import {
  getSpots,
  getSpotById,
  createSpot,
  updateSpot,
  deleteSpot,
} from "../controllers/spotController.js";

const router = Router();

// READ (open to everyone)
router.get("/", getSpots);

// UPLOAD IMAGE (admin only)
router.post("/upload", requireAdmin, (req, res, next) => {
  uploadSpotImage(req, res, (error) => {
    if (error) return next(error);

    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image to upload.",
      });
    }

    return res.status(201).json({
      message: "Image uploaded successfully.",
      imageUrl: `/uploads/${req.file.filename}`,
    });
  });
});

router.get("/:id", getSpotById);

// CREATE (admin only)
router.post("/", requireAdmin, createSpot);

// UPDATE (admin only)
router.put("/:id", requireAdmin, updateSpot);

// DELETE (admin only)
router.delete("/:id", requireAdmin, deleteSpot);

export default router;