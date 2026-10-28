import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);


import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/database.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is missing. Check your .env file."
      );
    }
// test
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `MAASIN TOUR GUIDE API running at http://localhost:${PORT}`
      );
      console.log(
        `Health check: http://localhost:${PORT}/api/health`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();