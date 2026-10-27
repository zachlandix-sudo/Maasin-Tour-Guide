import OpenAI from "openai";
import mongoose from "mongoose";
import Itinerary from "../models/Itinerary.js";
import TouristSpot from "../models/TouristSpot.js";

const allowedPaces = ["relaxed", "moderate", "packed"];

function getOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing or empty.");
  }

  return new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    timeout: 60000,
    defaultHeaders: {
      "X-OpenRouter-Title": "MAASIN TOUR GUIDE",
    },
  });
}

function validatePreferences(body = {}) {
  const travelers = Number(body.travelers);
  const startingBudgetPerPerson = Number(
    body.startingBudgetPerPerson,
  );

  if (!Number.isInteger(travelers) || travelers < 1 || travelers > 50) {
    throw new Error("Travelers must be an integer between 1 and 50.");
  }

  if (
    !Number.isFinite(startingBudgetPerPerson) ||
    startingBudgetPerPerson < 0 ||
    startingBudgetPerPerson > 1000000
  ) {
    throw new Error(
      "Starting budget must be between PHP 0 and PHP 1,000,000 per person.",
    );
  }

  const pace = body.pace || "moderate";

  if (!allowedPaces.includes(pace)) {
    throw new Error("Pace must be relaxed, moderate, or packed.");
  }

  const interests = Array.isArray(body.interests)
    ? body.interests
      .filter(
        (interest) =>
          typeof interest === "string" &&
          interest.trim().length > 0,
      )
      .slice(0, 10)
      .map((interest) => interest.trim())
    : [];

  return {
    travelers,
    startingBudgetPerPerson,
    pace,
    interests,
  };
}

function parseJsonResponse(text) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  return JSON.parse(cleaned);
}

function calculateBudget(
  stops,
  travelers,
  startingBudgetPerPerson,
) {
  const entranceFees = stops.reduce(
    (sum, stop) =>
      sum + stop.estimatedEntranceFeePerPerson * travelers,
    0,
  );

  const transportation = stops.reduce(
    (sum, stop) =>
      sum + stop.estimatedTransportCostForGroup,
    0,
  );

  const food = stops.reduce(
    (sum, stop) =>
      sum + stop.estimatedFoodCostPerPerson * travelers,
    0,
  );

  const totalGroupCost =
    entranceFees + transportation + food;

  const totalPerPerson = totalGroupCost / travelers;
  const startingGroupBudget =
    startingBudgetPerPerson * travelers;

  return {
    entranceFees,
    transportation,
    food,
    other: 0,
    totalGroupCost,
    totalPerPerson:
      Math.round(totalPerPerson * 100) / 100,
    remainingGroupBudget:
      startingGroupBudget - totalGroupCost,
    remainingPerPersonBudget:
      Math.round(
        (startingBudgetPerPerson - totalPerPerson) * 100,
      ) / 100,
    currency: "PHP",
  };
}

async function generateWithRetry(
  model,
  contents,
  config,
  maxRetries = 1,
) {
  const ai = getOpenRouterClient();

  for (let attempt = 0; ; attempt++) {
    try {
      return await ai.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: contents,
          },
        ],
        response_format: {
          type: "json_object",
        },
        max_tokens: config.maxOutputTokens ?? 2048,
        temperature: 0.3,
      });
    } catch (error) {
      const status = error?.status ?? error?.statusCode;
      const retryable = [500, 503].includes(status);

      if (!retryable || attempt >= maxRetries) {
        throw error;
      }

      const delay = 1000;

      console.warn(
        `Groq returned ${status}. Retrying once in ${delay}ms...`,
      );

      await new Promise((resolve) =>
        setTimeout(resolve, delay),
      );
    }
  }
}

export async function generateItinerary(req, res) {
  try {
    if (!process.env.OPENROUTER_API_KEY?.trim()) {
      return res.status(503).json({
        message: "OpenRouter API key is not configured on the server.",
      });
    }

    const preferences = validatePreferences(req.body);
    const touristSpots = await TouristSpot.find({
      status: "published",
    })
      .select(
        "name slug description shortDescription category address entranceFee estimatedTravelCost openingHours bestTimeToVisit travelTips",
      )
      .lean();

    if (!touristSpots.length) {
      return res.status(400).json({
        message:
          "No published tourist spots are available for itinerary generation.",
      });
    }

    const model =
      process.env.OPENROUTER_MODEL || "openrouter/free";

    const prompt = `
You are a tourism itinerary assistant for Maasin City,
Southern Leyte, Philippines.

Create a practical one-day itinerary using ONLY the supplied
published tourist spots. Do not invent destinations, entrance
fees, opening hours, or verified travel durations.

Visitor preferences:
${JSON.stringify(preferences)}

Available tourist spots:
${JSON.stringify(touristSpots)}

Return ONLY valid JSON with this structure:
{
  "title": "string",
  "summary": "string",
  "stops": [
    {
      "slug": "existing tourist spot slug",
      "name": "existing tourist spot name",
      "startTime": "08:00 AM",
      "endTime": "09:00 AM",
      "activity": "string",
      "estimatedEntranceFeePerPerson": 0,
      "estimatedTransportCostForGroup": 0,
      "estimatedFoodCostPerPerson": 0
    }
  ],
  "travelTips": ["string"]
}

Rules:
- Include only supplied tourist spots and their exact slugs.
- Produce a sensible one-day schedule.
- Respect interests and preferred pace.
- Use supplied entranceFee and estimatedTravelCost when available.
- If a cost is unknown, use 0 rather than inventing a price.
- All cost fields must be non-negative numbers in PHP.
- Transport cost is the group total for that leg.
- Keep activities and advice practical.
`;

    const response = await generateWithRetry(
      model,
      prompt,
      {
        maxOutputTokens: 2048,
      },
    );

    const generatedText =
      response.choices?.[0]?.message?.content;

    console.log(
      "Groq response choices:",
      response.choices?.length,
    );
    console.log(
      "Groq response finish reason:",
      response.choices?.[0]?.finish_reason,
    );
    console.log("Groq content type:", typeof generatedText);
    console.log(
      "Groq content length:",
      generatedText?.length ?? 0,
    );

    if (
      typeof generatedText !== "string" ||
      !generatedText.trim()
    ) {
      throw new Error("Groq returned empty itinerary content.");
    }

    const generated = parseJsonResponse(generatedText);

    if (
      !generated ||
      typeof generated.title !== "string" ||
      !generated.title.trim() ||
      !Array.isArray(generated.stops)
    ) {
      throw new Error(
        "Groq returned an invalid itinerary structure.",
      );
    }

    const spotsBySlug = new Map(
      touristSpots.map((spot) => [spot.slug, spot]),
    );

    const stops = generated.stops.map((stop) => {
      const spot = spotsBySlug.get(stop.slug);

      if (!spot) {
        throw new Error(
          "Groq returned a destination that is not in the database.",
        );
      }

      const nonNegativeNumber = (value) => {
        const number = Number(value);

        return Number.isFinite(number) && number >= 0
          ? number
          : 0;
      };

      return {
        touristSpot: spot._id,
        name: spot.name,
        startTime: String(stop.startTime || ""),
        endTime: String(stop.endTime || ""),
        activity: String(stop.activity || ""),
        estimatedEntranceFeePerPerson:
          nonNegativeNumber(
            stop.estimatedEntranceFeePerPerson,
          ),
        estimatedTransportCostForGroup:
          nonNegativeNumber(
            stop.estimatedTransportCostForGroup,
          ),
        estimatedFoodCostPerPerson:
          nonNegativeNumber(
            stop.estimatedFoodCostPerPerson,
          ),
      };
    });

    if (!stops.length) {
      return res.status(422).json({
        message:
          "The AI did not produce any itinerary stops.",
      });
    }

    const budget = calculateBudget(
      stops,
      preferences.travelers,
      preferences.startingBudgetPerPerson,
    );

    const itinerary = await Itinerary.create({
      title: generated.title.trim().slice(0, 150),
      duration: "one-day",
      interests: preferences.interests,
      travelers: preferences.travelers,
      startingBudgetPerPerson:
        preferences.startingBudgetPerPerson,
      pace: preferences.pace,
      stops,
      budget,
      summary: String(generated.summary || "").slice(0, 2000),
      travelTips: Array.isArray(generated.travelTips)
        ? generated.travelTips
          .filter((tip) => typeof tip === "string")
          .slice(0, 20)
        : [],
      status: "generated",
    });

    return res.status(201).json({
      message: "Itinerary generated and saved successfully.",
      itinerary,
    });
  } catch (error) {
    console.error("Generate itinerary error:", {
      message: error?.message,
      status: error?.status ?? error?.statusCode,
      code: error?.code,
      name: error?.name,
    });

    const message = error?.message || "";
    const status = error?.status ?? error?.statusCode;
    const errorCode = error?.code;
    const errorName = error?.name || "";

    if (
      message.includes("Travelers must") ||
      message.includes("Starting budget must") ||
      message.includes("Pace must")
    ) {
      return res.status(400).json({ message });
    }

    if (message.includes("OPENROUTER_API_KEY is missing")) {
      return res.status(503).json({
        message: "OpenRouter API key is not configured on the server.",
      });
    }

    if (error instanceof SyntaxError) {
      return res.status(502).json({
        message: "OpenRouter returned invalid JSON. Please try again.",
      });
    }

    if (
      errorName === "TimeoutError" ||
      errorName === "AbortError" ||
      errorCode === "ETIMEDOUT" ||
      errorCode === "ECONNABORTED"
    ) {
      return res.status(504).json({
        message:
          "Itinerary generation took too long. Please try again.",
      });
    }

    if (status === 429) {
      return res.status(503).json({
        message:
          "Groq's usage limit was reached. Please check your Groq limits and try again later.",
      });
    }

    if ([500, 503, 504].includes(status)) {
      return res.status(503).json({
        message:
          "Groq is temporarily unavailable. Please try again shortly.",
      });
    }

    return res.status(500).json({
      message: "Unable to generate itinerary.",
    });
  }
}

export async function getItineraryById(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid itinerary ID.",
      });
    }

    const itinerary = await Itinerary.findById(req.params.id)
      .populate(
        "stops.touristSpot",
        "name slug category address imageUrl",
      )
      .lean();

    if (!itinerary) {
      return res.status(404).json({
        message: "Itinerary not found.",
      });
    }

    return res.json({ itinerary });
  } catch (error) {
    console.error("Get itinerary error:", error);

    return res.status(500).json({
      message: "Unable to retrieve itinerary.",
    });
  }
}
