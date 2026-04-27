require("dotenv").config();

const express = require("express");
const cors = require("cors");

const captureRoutes = require("./routes/capture");
const commitmentsRoutes = require("./routes/commitments");
const conflictsRoutes = require("./routes/conflicts");
const briefingRoutes = require("./routes/briefing");

const app = express();
const PORT = process.env.PORT || 8080;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// CORS — allow all origins so any frontend can call these APIs
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON request bodies
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use("/api/capture", captureRoutes);
app.use("/api/commitments", commitmentsRoutes);
app.use("/api/conflicts", conflictsRoutes);
app.use("/api/briefing", briefingRoutes);

// Health check endpoint (used by Cloud Run)
app.get("/", (_req, res) => {
  res.status(200).json({
    name: "CoFounder API",
    version: "1.0.0",
    description: "AI context-sync agent for startup founding teams",
    status: "healthy",
    endpoints: [
      "POST /api/capture",
      "GET  /api/commitments",
      "GET  /api/conflicts",
      "GET  /api/briefing/:founder",
    ],
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`\n🚀 CoFounder API is running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/`);
  console.log(`   Capture:      POST http://localhost:${PORT}/api/capture`);
  console.log(`   Commitments:  GET  http://localhost:${PORT}/api/commitments`);
  console.log(`   Conflicts:    GET  http://localhost:${PORT}/api/conflicts`);
  console.log(`   Briefing:     GET  http://localhost:${PORT}/api/briefing/:founder\n`);
});

module.exports = app;
