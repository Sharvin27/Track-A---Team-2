const express = require("express");
const cors = require("cors");
const locationRoutes = require("./routes/locationRoutes");
const needRegionRoutes = require("./routes/needRegionRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

app.use("/api/locations", locationRoutes);
app.use("/api/need-regions", needRegionRoutes);

module.exports = app;
