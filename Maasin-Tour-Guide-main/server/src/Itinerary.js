import mongoose from "mongoose";

const itineraryStopSchema = new mongoose.Schema(
  {
    touristSpot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TouristSpot",
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: String,
      default: "",
    },
    endTime: {
      type: String,
      default: "",
    },
    activity: {
      type: String,
      default: "",
    },
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
  { _id: false },
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
      enum: ["one-day"],
      default: "one-day",
    },
    interests: {
      type: [String],
      default: [],
    },
    travelers: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },
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
    stops: {
      type: [itineraryStopSchema],
      default: [],
    },
    budget: {
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
    summary: {
      type: String,
      default: "",
    },
    travelTips: {
      type: [String],
      default: [],
    },
    aiProvider: {
      type: String,
      default: "gemini",
    },
    status: {
      type: String,
      enum: ["generated", "saved"],
      default: "generated",
    },
  },
  { timestamps: true },
);

const Itinerary = mongoose.model("Itinerary", itinerarySchema);

export default Itinerary;
