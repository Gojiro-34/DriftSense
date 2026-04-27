require("dotenv").config();

const path = require("path");
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

// Serve frontend static files from public/
app.use(express.static(path.join(__dirname, "..", "public")));

// Health check endpoint (used by Cloud Run)
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy", version: "1.0.0" });
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
  console.log(`   Frontend:     http://localhost:${PORT}/`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   API:          http://localhost:${PORT}/api/*\n`);
});

module.exports = app;
