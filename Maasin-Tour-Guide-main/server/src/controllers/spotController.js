import mongoose from "mongoose";
import TouristSpot from "../models/TouristSpot.js";

// newly added
const validateSpotPayload = (body, { partial = false } = {}) => {
  const errors = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return ["Request body must be a JSON object"];
  }
  const textFields = [
    "name",
    "slug",
    "description",
    "shortDescription",
    "origin",
    "history",
    "culturalSignificance",
    "category",
    "address",
    "openingHours",
    "bestTimeToVisit",
    "contactDetails",
    "imageUrl",
    "status",
  ];
  if (
    body.historySources !== undefined &&
    (
      !Array.isArray(body.historySources) ||
      body.historySources.length > 20 ||
      !body.historySources.every(
        (source) =>
          source &&
          typeof source === "object" &&
          !Array.isArray(source) &&
          (source.title === undefined ||
            typeof source.title === "string") &&
          (source.url === undefined ||
            typeof source.url === "string") &&
          (source.publisher === undefined ||
            typeof source.publisher === "string") &&
          (source.accessedAt === undefined ||
            source.accessedAt === null ||
            !Number.isNaN(Date.parse(source.accessedAt)))
      )
    )
  ) {
    errors.push(
      "historySources must be an array of valid source objects"
    );
  }

  for (const field of [
    "summaryGeneratedByAI",
    "summaryReviewed",
  ]) {
    if (
      body[field] !== undefined &&
      typeof body[field] !== "boolean"
    ) {
      errors.push(`${field} must be a boolean`);
    }
  }

  for (const field of textFields) {
    if (body[field] !== undefined && typeof body[field] !== "string") {
      errors.push(`${field} must be a string`);
    }
  }

  if (!partial) {
    for (const field of ["name", "description", "address"]) {
      if (typeof body[field] !== "string" || !body[field].trim()) {
        errors.push(`${field} is required`);
      }
    }
  }

  for (const field of ["entranceFee", "estimatedTravelCost"]) {
    if (body[field] !== undefined && body[field] !== null) {
      const value = body[field];

      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        errors.push(`${field} must be a non-negative number`);
      }
    }
  }

  if (body.coordinates !== undefined) {
    const coordinates = body.coordinates;

    if (
      !coordinates ||
      typeof coordinates !== "object" ||
      Array.isArray(coordinates)
    ) {
      errors.push("coordinates must be an object");
    } else {
      const { latitude, longitude } = coordinates;

      if (
        latitude !== undefined &&
        (typeof latitude !== "number" ||
          !Number.isFinite(latitude) ||
          latitude < -90 ||
          latitude > 90)
      ) {
        errors.push("latitude must be between -90 and 90");
      }

      if (
        longitude !== undefined &&
        (typeof longitude !== "number" ||
          !Number.isFinite(longitude) ||
          longitude < -180 ||
          longitude > 180)
      ) {
        errors.push("longitude must be between -180 and 180");
      }
    }
  }

  for (const field of [
    "gallery",
    "highlights",
    "facilities",
    "travelTips",
    "nearbyAttractions",
  ]) {
    if (body[field] !== undefined) {
      if (
        !Array.isArray(body[field]) ||
        !body[field].every((item) => typeof item === "string")
      ) {
        errors.push(`${field} must be an array of strings`);
      }
    }
  }

  if (
    body.gallery !== undefined &&
    Array.isArray(body.gallery) &&
    body.gallery.length > 20
  ) {
    errors.push("gallery cannot contain more than 20 images");
  }

  if (
    body.status !== undefined &&
    !["draft", "published", "inactive"].includes(body.status)
  ) {
    errors.push("status must be draft, published, or inactive");
  }

  return errors;
};

// breakline

// GET /api/spots - list spots, with optional search and filters
export async function getSpots(req, res, next) {
  try {
    const {
      search = "",
      category,
      status = "published",
      page = "1",
      limit = "20",
      sort = "newest",
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const filter = {};

    if (status !== "all") filter.status = status;
    if (category) filter.category = category;

    if (search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
        { address: { $regex: escaped, $options: "i" } },
      ];
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 },
      fee_asc: { entranceFee: 1 },
      fee_desc: { entranceFee: -1 },
    };

    const [items, total] = await Promise.all([
      TouristSpot.find(filter)
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),

      TouristSpot.countDocuments(filter),
    ]);

    res.status(200).json({
      data: items,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/spots/:id - get one spot by MongoDB ObjectId
export async function getSpotById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid tourist spot ID.",
      });
    }

    const spot = await TouristSpot.findById(id).lean();

    if (!spot) {
      return res.status(404).json({
        message: "Tourist spot not found.",
      });
    }

    res.status(200).json({ data: spot });
  } catch (error) {
    next(error);
  }
}
// sumpay

// CREATE: POST /api/spots
export async function createSpot(req, res, next) {
  try {
    console.log("[CREATE SPOT] Controller reached");
    console.log("[CREATE SPOT] Request body:", req.body);

    // Validate request body
    const errors = validateSpotPayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    const {
      name,
      slug,
      description,
      category,
      address,
      coordinates,
      entranceFee,
      estimatedTravelCost,
      openingHours,
      contactDetails,
      imageUrl,
      gallery,
      status,
      shortDescription,
      origin,
      history,
      culturalSignificance,
      historySources,
      summaryGeneratedByAI,
      summaryReviewed,
      bestTimeToVisit,
      highlights,
      facilities,
      travelTips,
      nearbyAttractions,
    } = req.body;

    if (
      !name?.trim() ||
      !description?.trim() ||
      !category ||
      !address?.trim()
    ) {
      return res.status(400).json({
        message: "Name, description, category, and address are required.",
      });
    }

    const spot = await TouristSpot.create({
      name,
      slug: slug || undefined,
      description,
      category,
      address,
      coordinates,
      entranceFee,
      estimatedTravelCost,
      openingHours,
      contactDetails,
      imageUrl,
      gallery,
      status,
      shortDescription,
      origin,
      history,
      culturalSignificance,
      historySources,
      summaryGeneratedByAI,
      summaryReviewed,
      bestTimeToVisit,
      highlights,
      facilities,
      travelTips,
      nearbyAttractions,
    });

    return res.status(201).json({
      message: "Tourist spot created successfully.",
      data: spot,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A tourist spot with this slug already exists.",
      });
    }
    next(error);
  }
}

// UPDATE: PUT /api/spots/:id
export async function updateSpot(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid tourist spot ID.",
      });
    }
    //bag-on gi dugang
    // Validate update payload (partial updates allowed)
    const errors = validateSpotPayload(req.body, {
      partial: true,
    });

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    const allowedFields = [
      "name",
      "slug",
      "description",
      "shortDescription",
      "category",
      "address",
      "coordinates",
      "entranceFee",
      "estimatedTravelCost",
      "openingHours",
      "bestTimeToVisit",
      "contactDetails",
      "imageUrl",
      "gallery",
      "highlights",
      "facilities",
      "travelTips",
      "nearbyAttractions",
      "status",
      "origin",
      "history",
      "culturalSignificance",
      "historySources",
      "summaryGeneratedByAI",
      "summaryReviewed",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.hasOwn(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    const spot = await TouristSpot.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!spot) {
      return res.status(404).json({
        message: "Tourist spot not found.",
      });
    }

    return res.status(200).json({
      message: "Tourist spot updated successfully.",
      data: spot,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A tourist spot with this slug already exists.",
      });
    }
    next(error);
  }
}

// DELETE: DELETE /api/spots/:id
export async function deleteSpot(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid tourist spot ID.",
      });
    }

    const spot = await TouristSpot.findByIdAndDelete(req.params.id);

    if (!spot) {
      return res.status(404).json({
        message: "Tourist spot not found.",
      });
    }

    return res.status(200).json({
      message: "Tourist spot deleted successfully.",
      data: spot,
    });
  } catch (error) {
    next(error);
  }
}
