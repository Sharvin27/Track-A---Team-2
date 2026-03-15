const express = require("express");
const cors = require("cors");
const locationRoutes = require("./routes/locationRoutes");
const sessionRoutes = require("./routes/sessionRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

app.use("/api/locations", locationRoutes);
app.use("/api/sessions", sessionRoutes);

module.exports = app;
