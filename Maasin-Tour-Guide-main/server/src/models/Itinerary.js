
import mongoose from "mongoose";

const stopSchema = new mongoose.Schema(
  {
    touristSpot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TouristSpot",
      required: true,
    },
    name: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    activity: { type: String, required: true },
    estimatedEntranceFeePerPerson: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedTransportCostForGroup: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedFoodCostPerPerson: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const budgetSchema = new mongoose.Schema(
  {
    entranceFees: { type: Number, default: 0, min: 0 },
    transportation: { type: Number, default: 0, min: 0 },
    food: { type: Number, default: 0, min: 0 },
    other: { type: Number, default: 0, min: 0 },
    totalGroupCost: { type: Number, default: 0, min: 0 },
    totalPerPerson: { type: Number, default: 0, min: 0 },
    remainingGroupBudget: { type: Number, default: 0 },
    remainingPerPersonBudget: { type: Number, default: 0 },
    currency: { type: String, default: "PHP" },
  },
  { _id: false }
);

const itinerarySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    duration: { type: String, default: "one-day" },
    interests: { type: [String], default: [] },
    travelers: { type: Number, required: true, min: 1, max: 50 },
    startingBudgetPerPerson: {
      type: Number,
      required: true,
      min: 0,
    },
    pace: {
      type: String,
      enum: ["relaxed", "moderate", "packed"],
      default: "moderate",
    },
    stops: { type: [stopSchema], default: [] },
    budget: { type: budgetSchema, default: () => ({}) },
    summary: { type: String, default: "" },
    travelTips: { type: [String], default: [] },
    status: { type: String, default: "generated" },
  },
  { timestamps: true }
);

export default mongoose.model("Itinerary", itinerarySchema);
