
import "dotenv/config";
import mongoose from "mongoose";
import TouristSpot from "./models/TouristSpot.js";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/maasin_tour_guide";

const sampleSpots = [
  {
    name: "Maasin Cathedral",
    slug: "maasin-cathedral",
    description:
      "A historic church in Maasin City and a destination for cultural and heritage tours.",
    category: "Historical",
    address: "Maasin City, Southern Leyte, Philippines",
    entranceFee: 0,
    estimatedTravelCost: 50,
    openingHours: "Check locally before visiting",
    imageUrl: "",
    gallery: [],
    status: "published",
  },
  {
    name: "Monte Cueva Shrine",
    slug: "monte-cueva-shrine",
    description:
      "A religious destination known for its cave shrine and elevated setting.",
    category: "Religious",
    address: "Maasin City, Southern Leyte, Philippines",
    entranceFee: 0,
    estimatedTravelCost: 100,
    openingHours: "Check locally before visiting",
    imageUrl: "",
    gallery: [],
    status: "published",
  },
  {
    name: "Maasin City Baywalk",
    slug: "maasin-city-baywalk",
    description:
      "A sample coastal destination for relaxing walks, photography, and enjoying the seaside.",
    category: "Nature",
    address: "Maasin City, Southern Leyte, Philippines",
    entranceFee: 0,
    estimatedTravelCost: 30,
    openingHours: "Check locally before visiting",
    imageUrl: "",
    gallery: [],
    status: "published",
  },
  {
    name: "Maasin Nature Trip",
    slug: "maasin-nature-trip",
    description:
      "A sample nature destination record for testing the tourist spot listing and search features.",
    category: "Nature",
    address: "Maasin City, Southern Leyte, Philippines",
    entranceFee: 0,
    estimatedTravelCost: 100,
    openingHours: "Check locally before visiting",
    imageUrl: "",
    gallery: [],
    status: "published",
  },
  {
    name: "Southern Leyte Heritage Stop",
    slug: "southern-leyte-heritage-stop",
    description:
      "A sample heritage destination for testing category filtering and tourist spot details.",
    category: "Cultural",
    address: "Maasin City, Southern Leyte, Philippines",
    entranceFee: 0,
    estimatedTravelCost: 50,
    openingHours: "Check locally before visiting",
    imageUrl: "",
    gallery: [],
    status: "published",
  },
  {
    name: "Maasin Family Day Trip",
    slug: "maasin-family-day-trip",
    description:
      "A sample family-friendly tourism record for testing CRUD operations.",
    category: "Adventure",
    address: "Maasin City, Southern Leyte, Philippines",
    entranceFee: 0,
    estimatedTravelCost: 150,
    openingHours: "Check locally before visiting",
    imageUrl: "",
    gallery: [],
    status: "published",
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    for (const spot of sampleSpots) {
      await TouristSpot.findOneAndUpdate(
        { slug: spot.slug },
        { $set: spot },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log(`Seeded: ${spot.name}`);
    }

    console.log("Successfully seeded 6 tourist spots.");
    console.log("Existing records with other slugs were preserved.");
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  }
}

seedDatabase();

