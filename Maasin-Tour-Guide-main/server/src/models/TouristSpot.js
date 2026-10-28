import mongoose from "mongoose";

const coordinatesSchema = new mongoose.Schema(
  {
    latitude: {
      type: Number,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
    },
  },
  { _id: false },
);

const TouristSpotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tourist spot name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [120, "Name cannot exceed 120 characters"],
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain lowercase letters, numbers, and hyphens",
      ],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    shortDescription: {
      type: String,
      trim: true,
      maxlength: 240,
      default: "",
    },

    origin: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    history: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: "",
    },

    culturalSignificance: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    historySources: {
      type: [
        {
          title: {
            type: String,
            trim: true,
            maxlength: 200,
          },
          url: {
            type: String,
            trim: true,
            maxlength: 2048,
          },
          publisher: {
            type: String,
            trim: true,
            maxlength: 200,
          },
          accessedAt: {
            type: Date,
            default: null,
          },
        },
      ],
      default: [],
      validate: {
        validator: (sources) => sources.length <= 20,
        message: "A maximum of 20 history sources is allowed",
      },
    },

    summaryGeneratedByAI: {
      type: Boolean,
      default: false,
    },

    summaryReviewed: {
      type: Boolean,
      default: false,
    },


    category: {
      type: String,
      required: true,
      enum: [
        "Nature",
        "Beach",
        "Religious",
        "Historical",
        "Adventure",
        "Cultural",
        "Other",
        "Waterfalls & Rivers",
        "Islands & Snorkeling",
        "Mountains & Hiking",
        "Food & Local Cuisine",
        "Festivals & Events",
        "Parks & Recreation",
      ],
      default: "Other",
    },

    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      maxlength: 300,
    },

    coordinates: {
      type: coordinatesSchema,
      default: () => ({}),
    },

    entranceFee: {
      type: Number,
      min: [0, "Entrance fee cannot be negative"],
      default: null,
    },

    estimatedTravelCost: {
      type: Number,
      min: [0, "Travel cost cannot be negative"],
      default: null,
    },

    openingHours: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    bestTimeToVisit: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    contactDetails: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    imageUrl: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2048,
    },

    gallery: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 2048,
        },
      ],
      default: [],
      validate: {
        validator: (images) => images.length <= 20,
        message: "A maximum of 20 gallery images is allowed",
      },
    },

    highlights: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 160,
        },
      ],
      default: [],
    },

    facilities: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 100,
        },
      ],
      default: [],
    },

    travelTips: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 500,
        },
      ],
      default: [],
    },

    nearbyAttractions: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 120,
        },
      ],
      default: [],
    },

    status: {
      type: String,
      enum: ["draft", "published", "inactive"],
      default: "published",
    },
  },
  {
    timestamps: true,
    strict: "throw",
  },
);

TouristSpotSchema.index({
  name: "text",
  description: "text",
  address: "text",
});

const TouristSpot =
  mongoose.models.TouristSpot ||
  mongoose.model("TouristSpot", TouristSpotSchema);

export default TouristSpot;
