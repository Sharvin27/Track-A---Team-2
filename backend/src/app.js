const express = require("express");
const cors = require("cors");
const locationRoutes = require("./routes/locationRoutes");
const authRoutes = require("./routes/authRoutes");
const { initDb } = require("./db");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

app.use("/api/locations", locationRoutes);
app.use("/api/auth", authRoutes);

initDb().catch((err) => console.error("DB init failed:", err));

module.exports = app;