require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./lib/mongodb");

const authRoutes = require("./routes/auth");
const voterRoutes = require("./routes/voters");
const dashboardRoutes = require("./routes/dashboard");
const telecallerRoutes = require("./routes/telecaller");
const authMiddleware = require("./middleware/auth");
const { startAutoSync, getSyncStatus } = require("./lib/auto-sync");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - allow frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",").map((s) => s.trim())
      : "*",
    credentials: true,
  })
);

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Assembly Backend API", version: "2.1.0" });
});

// Sync status (protected)
app.get("/api/sync/status", authMiddleware, (req, res) => {
  res.json(getSyncStatus());
});

// Public routes
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/dashboard", authMiddleware, dashboardRoutes);
app.use("/api/voters", authMiddleware, voterRoutes);
app.use("/api/telecaller", authMiddleware, telecallerRoutes);
app.use("/api/sheets", authMiddleware, (req, res, next) => {
  // Forward to dashboard sheets route
  req.url = "/sheets";
  dashboardRoutes(req, res, next);
});
app.use("/api/assembly-stats", authMiddleware, (req, res, next) => {
  req.url = "/assembly-stats" + (req._parsedUrl?.search || "");
  dashboardRoutes(req, res, next);
});
app.use("/api/sync", authMiddleware, (req, res, next) => {
  req.url = "/sync";
  dashboardRoutes(req, res, next);
});

// Connect to MongoDB and start
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      startAutoSync();
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    // Start anyway so health check works
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (MongoDB connection failed)`);
    });
  });
