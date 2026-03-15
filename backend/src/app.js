const express = require("express");
const cors = require("cors");
const locationRoutes = require("./routes/locationRoutes");
const needRegionRoutes = require("./routes/needRegionRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const authRoutes = require("./routes/authRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const { initDb } = require("./db");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

app.use("/api/locations", locationRoutes);
app.use("/api/need-regions", needRegionRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

initDb().catch((err) => console.error("DB init failed:", err));

module.exports = app;
