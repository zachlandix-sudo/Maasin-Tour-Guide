
import express from "express";
import {
  generateItinerary,
  getItineraryById,
} from "../controllers/itineraryController.js";

const router = express.Router();

router.post("/generate", generateItinerary);
router.get("/:id", getItineraryById);

export default router;
