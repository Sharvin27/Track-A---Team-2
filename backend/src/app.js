const express = require("express");
const cors = require("cors");
const locationRoutes = require("./routes/locationRoutes");
const needRegionRoutes = require("./routes/needRegionRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const authRoutes = require("./routes/authRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const activityRoutes = require("./routes/activityRoutes");
const badgesRoutes = require("./routes/badgesRoutes");
const routeItemRoutes = require("./routes/routeItemRoutes");

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
app.use("/api/activity", activityRoutes);
app.use("/api/badges", badgesRoutes);
app.use("/api/route-items", routeItemRoutes);

module.exports = app;
