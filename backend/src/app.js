const express = require("express");
const cors = require("cors");
const path = require("path");
const locationRoutes = require("./routes/locationRoutes");
const needRegionRoutes = require("./routes/needRegionRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const authRoutes = require("./routes/authRoutes");
const placementRoutes = require("./routes/placementRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const { initDb } = require("./db");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

app.use("/api/locations", locationRoutes);
app.use("/api/need-regions", needRegionRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", placementRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

initDb().catch((err) => console.error("DB init failed:", err));

module.exports = app;