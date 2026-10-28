import express from "express";
import cors from "cors";
import spotRoutes from "./routes/spotRoutes.js";
import itineraryRoutes from "./routes/itineraryRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { adminLogin } from "./middleware/adminAuth.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
if (process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDirectory = path.resolve(__dirname, "../uploads");

// bag-o nga gi-add
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(
  cors({
    origin: [
      process.env.CLIENT_ORIGIN,
      "http://localhost:5173",
      "http://localhost:5174",
    ].filter(Boolean),
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDirectory));

app.get("/", (_req, res) => {
  res.json({
    message: "Welcome to MAASIN TOUR GUIDE API",
    endpoints: {
      health: "/api/health",
      touristSpots: "/api/spots",
      touristSpotById: "/api/spots/:id",
    },
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "maasin-tour-guide-api" });
});

// temporary replacement app.use("/api/spots", spotRoutes);

app.post("/api/admin/login", adminLogin);
app.use("/api/spots", spotRoutes);
app.use("/api/itineraries", itineraryRoutes);
app.use("/api/chat", chatRoutes);

// JSON response for unknown routes
app.use((_req, res) => {
  res.status(404).json({ message: "API route not found." });
});

// Central error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.status ? err.message : "Internal server error.",
  });
});

export default app;