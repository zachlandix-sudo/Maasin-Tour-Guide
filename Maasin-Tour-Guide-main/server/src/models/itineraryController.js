

import mongoose from "mongoose";

const itineraryItemSchema = new mongoose.Schema(
  {
    time: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    activity: {
      type: String,
      required: true,
    },
    estimatedCost: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const itinerarySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      default: "1 day",
    },
    interests: {
      type: [String],
      default: [],
    },
    travelers: {
      type: Number,
      required: true,
      min: 1,
    },
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    pace: {
      type: String,
      enum: ["relaxed", "moderate", "packed"],
      default: "moderate",
    },
    itinerary: {
      type: [itineraryItemSchema],
      default: [],
    },
    estimatedEntranceFees: {
      type: Number,
      default: 0,
    },
    estimatedTransportCost: {
      type: Number,
      default: 0,
    },
    estimatedFoodCost: {
      type: Number,
      default: 0,
    },
    estimatedTotalCost: {
      type: Number,
      default: 0,
    },
    costPerPerson: {
      type: Number,
      default: 0,
    },
    aiProvider: {
      type: String,
      default: "gemini",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Itinerary", itinerarySchema);
